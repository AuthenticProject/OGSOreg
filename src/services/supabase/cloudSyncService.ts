import { supabase, isSupabaseConfigured } from '../../lib/supabase'

export type CloudSyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'

export interface CloudSyncInfo {
  isConfigured: boolean
  isOnline: boolean
  state: CloudSyncState
  lastSyncedAt: string | null
  activeTables: string[]
  error?: string
}

class CloudSyncService {
  private syncState: CloudSyncState = 'idle'
  private lastSyncedAt: string | null = null
  private verifiedTables: Set<string> = new Set()
  private checkedTableSupport: boolean = false
  private isCheckingTables: boolean = false

  constructor() {
    this.initEventListeners()
  }

  private initEventListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.emitStateChange('idle')
        this.checkAvailableTables()
      })
      window.addEventListener('offline', () => {
        this.emitStateChange('offline')
      })
    }
  }

  public getSyncInfo(): CloudSyncInfo {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    return {
      isConfigured: isSupabaseConfigured(),
      isOnline,
      state: !isOnline ? 'offline' : this.syncState,
      lastSyncedAt: this.lastSyncedAt,
      activeTables: Array.from(this.verifiedTables),
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

  /**
   * Verifies which cloud tables exist in Supabase schema cache
   */
  public async checkAvailableTables(): Promise<Set<string>> {
    if (!isSupabaseConfigured()) return this.verifiedTables
    if (this.checkedTableSupport) return this.verifiedTables
    if (this.isCheckingTables) return this.verifiedTables

    this.isCheckingTables = true
    try {
      const candidates = [
        'students',
        'institutions',
        'user_profiles',
        'operation_logs',
        'app_settings',
        'competition_periods',
        'competition_winners',
        'competition_certificates',
        'website_content',
        'syllabuses',
        'bank_soal',
      ]

      await Promise.all(
        candidates.map(async (tbl) => {
          try {
            const { error } = await supabase.from(tbl).select('*', { count: 'exact', head: true })
            if (!error) {
              this.verifiedTables.add(tbl)
            }
          } catch {
            // Ignore missing table
          }
        })
      )

      this.checkedTableSupport = true
    } catch {
      // Ignore
    } finally {
      this.isCheckingTables = false
    }

    return this.verifiedTables
  }

  public isTableAvailable(tableName: string): boolean {
    return this.verifiedTables.has(tableName)
  }

  /**
   * Universal cloud key-value getter
   * Tries Supabase `app_settings` table. Falls back to localStorage if table not found or offline.
   */
  public async getCloudSetting<T>(key: string, fallbackDefault: T): Promise<T> {
    const localRaw = typeof window !== 'undefined' ? localStorage.getItem(key) : null
    let cachedVal: T = fallbackDefault
    if (localRaw) {
      try {
        cachedVal = JSON.parse(localRaw)
      } catch {
        // Keep fallback
      }
    }

    if (!isSupabaseConfigured()) {
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

        if (!error && data && data.value !== undefined && data.value !== null) {
          // Update local cache
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(key, JSON.stringify(data.value))
            } catch {
              // Ignore quota
            }
          }
          this.lastSyncedAt = new Date().toISOString()
          return data.value as T
        }
      }
    } catch (err) {
      console.warn(`[CloudSync] Could not read ${key} from Supabase:`, err)
    }

    return cachedVal
  }

  /**
   * Universal cloud key-value setter
   * Writes to localStorage and asynchronously persists to Supabase `app_settings` table.
   */
  public async saveCloudSetting<T>(key: string, value: T): Promise<boolean> {
    // 1. Local Persistence immediately
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (err) {
        console.warn(`[CloudSync] localStorage quota hit for ${key}:`, err)
      }
    }

    if (!isSupabaseConfigured()) {
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
          console.warn(`[CloudSync] Upsert ${key} error:`, error.message)
          this.emitStateChange('error', error.message)
          return false
        }
      } else {
        this.emitStateChange('idle')
        return false
      }
    } catch (err: any) {
      this.emitStateChange('error', err?.message)
      return false
    }
  }

  /**
   * Subscribes to real-time changes on a specific app_settings key
   */
  public subscribeCloudSetting<T>(key: string, onUpdate: (value: T) => void): () => void {
    if (!isSupabaseConfigured()) return () => {}

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
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(key, JSON.stringify(newVal))
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
      supabase.removeChannel(channel)
    }
  }
}

export const cloudSyncService = new CloudSyncService()
