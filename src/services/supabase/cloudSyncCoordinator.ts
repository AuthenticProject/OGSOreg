/**
 * Centralized Cloud Synchronization Coordinator for OGSOreg
 *
 * Coordinates automatic synchronization across all domains (students, results,
 * winners, periods, materials, website content, user profiles), eliminating
 * redundant concurrent queries, duplicate focus/online listeners, and egress spikes.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { cloudCircuitBreaker } from './cloudCircuitBreaker'
import { realtimeSubscriptionManager } from './realtimeSubscriptionManager'

export type CloudConnectionState =
  | 'Connected'
  | 'Synchronizing'
  | 'Local Mode'
  | 'Cloud Restricted'
  | 'Recovery Checking'

export interface SyncHandler {
  name: string
  priority: number // lower number runs earlier
  handler: (force?: boolean) => Promise<void>
}

export interface SyncStats {
  lastSyncTime: number | null
  lastError: string | null
  totalSyncRuns: number
  state: CloudConnectionState
}

const FOCUS_SYNC_COOLDOWN_MS = 10 * 60 * 1000 // 10 minutes minimum throttle between focus re-syncs

class CloudSyncCoordinator {
  private handlers = new Map<string, SyncHandler>()
  private lastFocusSyncTime = 0
  private activeSyncPromise: Promise<void> | null = null
  private currentState: CloudConnectionState = 'Connected'
  private lastError: string | null = null
  private lastSyncTime: number | null = null
  private totalSyncRuns = 0
  private stateListeners = new Set<(state: CloudConnectionState, stats: SyncStats) => void>()

  constructor() {
    this.updateInitialState()
    this.setupGlobalListeners()
  }

  private updateInitialState() {
    if (!isSupabaseConfigured()) {
      this.currentState = 'Local Mode'
    } else if (!cloudCircuitBreaker.canExecuteQuery()) {
      this.currentState = 'Cloud Restricted'
    } else {
      this.currentState = 'Connected'
    }
  }

  private setupGlobalListeners() {
    if (typeof window === 'undefined') return

    // Single unified focus listener
    const onFocusOrOnline = () => {
      const now = Date.now()
      if (now - this.lastFocusSyncTime < FOCUS_SYNC_COOLDOWN_MS) {
        return // Throttled
      }
      if (!cloudCircuitBreaker.canExecuteQuery()) {
        this.setState('Cloud Restricted')
        return
      }

      this.lastFocusSyncTime = now
      this.triggerSync(false).catch(() => {})
    }

    window.addEventListener('focus', onFocusOrOnline)
    window.addEventListener('online', onFocusOrOnline)

    // Listen to circuit breaker events
    window.addEventListener('ogsoreg_circuit_breaker_tripped', () => {
      this.setState('Cloud Restricted')
    })

    window.addEventListener('ogsoreg_circuit_breaker_reset', () => {
      this.setState('Connected')
    })
  }

  public registerHandler(
    name: string,
    priority: number,
    handler: (force?: boolean) => Promise<void>
  ): () => void {
    this.handlers.set(name, { name, priority, handler })
    return () => {
      this.handlers.delete(name)
    }
  }

  public subscribeState(listener: (state: CloudConnectionState, stats: SyncStats) => void): () => void {
    this.stateListeners.add(listener)
    listener(this.currentState, this.getStats())
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  private setState(newState: CloudConnectionState, err?: string) {
    this.currentState = newState
    if (err) this.lastError = err
    const stats = this.getStats()
    this.stateListeners.forEach((fn) => {
      try {
        fn(this.currentState, stats)
      } catch {
        // Ignore listener error
      }
    })
  }

  /**
   * Triggers a coordinated sync run across all registered domains.
   * Uses Single-Flight Mutex to collapse concurrent calls into a single shared execution.
   */
  public async triggerSync(force: boolean = false): Promise<void> {
    if (!isSupabaseConfigured()) {
      this.setState('Local Mode')
      return
    }

    if (!cloudCircuitBreaker.canExecuteQuery()) {
      this.setState('Cloud Restricted')
      return
    }

    // Single-Flight Mutex: return existing promise if sync is currently executing
    if (this.activeSyncPromise) {
      return this.activeSyncPromise
    }

    this.setState('Synchronizing')

    this.activeSyncPromise = (async () => {
      try {
        // Sort handlers by priority
        const sorted = Array.from(this.handlers.values()).sort((a, b) => a.priority - b.priority)

        // Run handlers sequentially to prevent network flooding
        for (const item of sorted) {
          if (!cloudCircuitBreaker.canExecuteQuery()) {
            this.setState('Cloud Restricted')
            break
          }
          try {
            await item.handler(force)
          } catch (handlerErr: any) {
            console.warn(`[CloudSyncCoordinator] Handler ${item.name} error:`, handlerErr)
            if (cloudCircuitBreaker.isQuotaRestrictionError(handlerErr)) {
              cloudCircuitBreaker.recordError(handlerErr)
              this.setState('Cloud Restricted', handlerErr.message)
              break
            }
          }
        }

        this.lastSyncTime = Date.now()
        this.totalSyncRuns++
        if (this.currentState === 'Synchronizing') {
          this.setState('Connected')
        }
      } catch (err: any) {
        this.lastError = err?.message || 'Sync error'
        if (cloudCircuitBreaker.isQuotaRestrictionError(err)) {
          cloudCircuitBreaker.recordError(err)
          this.setState('Cloud Restricted', err.message)
        } else {
          this.setState('Connected', err?.message)
        }
      } finally {
        this.activeSyncPromise = null
      }
    })()

    return this.activeSyncPromise
  }

  /**
   * Controlled admin recovery test to check if Supabase egress restrictions have been lifted.
   */
  public async triggerRecoveryCheck(): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase tidak terkonfigurasi (Local Mode).' }
    }

    this.setState('Recovery Checking')
    try {
      // Temporarily allow this one test probe
      cloudCircuitBreaker.reset()

      // Probe lightweight health check
      const { error } = await supabase.from('app_settings').select('key').limit(1)

      if (error && cloudCircuitBreaker.isQuotaRestrictionError(error)) {
        cloudCircuitBreaker.trip(error.message)
        this.setState('Cloud Restricted', error.message)
        return {
          success: false,
          message: 'Layanan Supabase masih dalam status pembatasan kuota (HTTP 402). Sinkronisasi tetap dijeda.',
        }
      }

      // If probe succeeded or table just didn't exist without quota error
      this.setState('Connected')
      // Resume channels
      realtimeSubscriptionManager.resumeAll()

      // Trigger fresh sync
      this.triggerSync(true).catch(() => {})

      return {
        success: true,
        message: 'Koneksi cloud Supabase berhasil dipulihkan! Sinkronisasi kembali aktif.',
      }
    } catch (err: any) {
      if (cloudCircuitBreaker.isQuotaRestrictionError(err)) {
        cloudCircuitBreaker.trip(err.message)
        this.setState('Cloud Restricted', err.message)
      } else {
        this.setState('Connected')
      }
      return {
        success: false,
        message: err?.message || 'Gagal memulihkan koneksi cloud.',
      }
    }
  }

  public getStats(): SyncStats {
    return {
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastError,
      totalSyncRuns: this.totalSyncRuns,
      state: this.currentState,
    }
  }

  public getCurrentState(): CloudConnectionState {
    return this.currentState
  }
}

export const cloudSyncCoordinator = new CloudSyncCoordinator()
