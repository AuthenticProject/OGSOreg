import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { cloudCircuitBreaker } from './cloudCircuitBreaker'

export type CloudSyncState = 'idle' | 'syncing' | 'synced' | 'error'

export interface CloudSyncInfo {
  state: CloudSyncState
  lastSyncedAt: string | null
  isConfigured: boolean
  error?: string
}

class CloudSyncService {
  private syncState: CloudSyncState = 'idle'
  private lastSyncedAt: string | null = null
  private verifiedTables: Set<string> = new Set()
  private checkedTableSupport: boolean = false
  private lastTableCheckTime: number = 0
  private readonly TABLE_CHECK_COOLDOWN_MS = 10 * 60 * 1000 // 10 minutes cache TTL

  public getSyncInfo(): CloudSyncInfo {
    return {
      state: this.syncState,
      lastSyncedAt: this.lastSyncedAt,
      isConfigured: isSupabaseConfigured(),
    }
  }

  private emitStateChange(state: CloudSyncState, error?: string) {
    this.syncState = state
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ogsoreg_cloud_sync_change', {
          detail: { ...this.getSyncInfo(), error },
        })
      )
    }
  }

  private checkTablePromise: Promise<Set<string>> | null = null

  /**
   * Verifies which cloud tables exist in Supabase schema cache.
   * Cached with a 10-minute TTL to prevent request flooding.
   * Completely eliminates aggressive candidate HEAD loops.
   */
  public async checkAvailableTables(force: boolean = false): Promise<Set<string>> {
    if (!isSupabaseConfigured()) return this.verifiedTables
    if (!cloudCircuitBreaker.canExecuteQuery()) return this.verifiedTables

    const now = Date.now()
    if (!force && this.checkedTableSupport && now - this.lastTableCheckTime < this.TABLE_CHECK_COOLDOWN_MS) {
      return this.verifiedTables
    }

    if (this.checkTablePromise) {
      return this.checkTablePromise
    }

    this.checkTablePromise = (async () => {
      try {
        this.lastTableCheckTime = Date.now()
        this.checkedTableSupport = true

        // Check app_settings existence with a single minimal query
        const { error: appSettingsErr } = await supabase
          .from('app_settings')
          .select('key')
          .limit(1)

        if (!appSettingsErr) {
          this.verifiedTables.add('app_settings')
        } else {
          this.verifiedTables.delete('app_settings')
          if (cloudCircuitBreaker.isQuotaRestrictionError(appSettingsErr)) {
            cloudCircuitBreaker.recordError(appSettingsErr)
            return this.verifiedTables
          }
        }

        // Standard tables known in schema (assume active if app_settings or basic query succeeds)
        const coreTables = [
          'students',
          'institutions',
          'user_profiles',
          'operation_logs',
          'competition_periods',
          'competition_winners',
          'competition_certificates',
          'competition_historical_aggregates',
          'competition_results',
          'website_content',
          'syllabuses',
          'bank_soal',
        ]
        coreTables.forEach((t) => this.verifiedTables.add(t))
      } catch (err) {
        if (cloudCircuitBreaker.isQuotaRestrictionError(err)) {
          cloudCircuitBreaker.recordError(err)
        }
      } finally {
        this.checkTablePromise = null
      }

      return this.verifiedTables
    })()

    return this.checkTablePromise
  }

  public isTableAvailable(tableName: string): boolean {
    return this.verifiedTables.has(tableName)
  }

  /**
   * Universal cloud key-value getter
   * Tries Supabase `app_settings` table. Falls back to localStorage if table not found, offline, or restricted.
   */
  public async getCloudSetting<T>(key: string, fallbackDefault: T): Promise<T> {
    const localRaw = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null
    let cachedVal: T = fallbackDefault
    if (localRaw) {
      try {
        cachedVal = JSON.parse(localRaw)
      } catch {
        // Keep fallback
      }
    }

    if (!isSupabaseConfigured() || !cloudCircuitBreaker.canExecuteQuery()) {
      return cachedVal
    }

    try {
      await this.checkAvailableTables()
      if (this.verifiedTables.has('app_settings')) {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value, updated_at')
          .eq('key', key)
          .maybeSingle()

        if (error) {
          if (cloudCircuitBreaker.isQuotaRestrictionError(error)) {
            cloudCircuitBreaker.recordError(error)
          }
          return cachedVal
        }

        if (data && data.value !== undefined && data.value !== null) {
          // Update local cache
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              window.localStorage.setItem(key, JSON.stringify(data.value))
            } catch {
              // Ignore quota
            }
          }
          this.lastSyncedAt = new Date().toISOString()
          return data.value as T
        }
      }
    } catch (err) {
      if (cloudCircuitBreaker.isQuotaRestrictionError(err)) {
        cloudCircuitBreaker.recordError(err)
      }
    }

    return cachedVal
  }

  /**
   * Universal cloud key-value setter
   * Writes to localStorage and asynchronously persists to Supabase `app_settings` table.
   * Completely avoids recursive check loops.
   */
  public async saveCloudSetting<T>(key: string, value: T): Promise<boolean> {
    // 1. Local Persistence immediately (guaranteed safety)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch (err) {
        console.warn(`[CloudSync] localStorage quota hit for ${key}:`, err)
      }
    }

    if (!isSupabaseConfigured() || !cloudCircuitBreaker.canExecuteQuery()) {
      return false
    }

    this.emitStateChange('syncing')
    try {
      await this.checkAvailableTables()

      if (this.verifiedTables.has('app_settings')) {
        const now = new Date().toISOString()
        const { error } = await supabase.from('app_settings').upsert({
          key,
          value: value as any,
          updated_at: now,
        })

        if (!error) {
          this.lastSyncedAt = now
          this.emitStateChange('synced')
          return true
        } else {
          if (cloudCircuitBreaker.isQuotaRestrictionError(error)) {
            cloudCircuitBreaker.recordError(error)
          }
          this.emitStateChange('error', error.message)
          return false
        }
      } else {
        this.emitStateChange('idle')
        return false
      }
    } catch (err: any) {
      if (cloudCircuitBreaker.isQuotaRestrictionError(err)) {
        cloudCircuitBreaker.recordError(err)
      }
      this.emitStateChange('error', err?.message)
      return false
    }
  }

  /**
   * Subscribes to real-time changes on a specific app_settings key
   */
  public subscribeCloudSetting<T>(key: string, onUpdate: (value: T) => void): () => void {
    if (!isSupabaseConfigured() || !cloudCircuitBreaker.canExecuteQuery()) return () => {}

    try {
      const channel = supabase
        .channel(`sync-key-${key}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'app_settings',
            filter: `key=eq.${key}`,
          },
          (payload: any) => {
            if (payload.new && payload.new.value !== undefined) {
              const newVal = payload.new.value as T
              if (typeof window !== 'undefined' && window.localStorage) {
                try {
                  window.localStorage.setItem(key, JSON.stringify(newVal))
                } catch {
                  // Ignore
                }
              }
              onUpdate(newVal)
            }
          }
        )
        .subscribe()

      return () => {
        try {
          supabase.removeChannel(channel)
        } catch {
          // Ignore
        }
      }
    } catch {
      return () => {}
    }
  }
}

export const cloudSyncService = new CloudSyncService()
