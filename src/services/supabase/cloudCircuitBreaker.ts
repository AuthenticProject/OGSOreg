/**
 * Cloud Circuit Breaker & Egress Quota Gatekeeper for OGSOreg
 *
 * Prevents request storms and infinite retry loops against Supabase when
 * the project hits egress quota limits (HTTP 402 Payment Required / exceed_egress_quota).
 * Gracefully preserves 100% local functionality without data loss.
 */

export interface CircuitBreakerStatus {
  isRestricted: boolean
  reason: string | null
  restrictedSince: string | null
  restrictedUntil: number | null
  consecutiveErrors: number
  totalBlockedRequests: number
}

const STORAGE_KEY = 'ogsoreg_circuit_breaker_v1'
const DEFAULT_COOLDOWN_MS = 15 * 60 * 1000 // 15 minutes cooldown before auto-testing connection

class CloudCircuitBreaker {
  private isRestricted: boolean = false
  private reason: string | null = null
  private restrictedSince: string | null = null
  private restrictedUntil: number | null = null
  private consecutiveErrors: number = 0
  private totalBlockedRequests: number = 0
  private realtimeTeardownCallback: (() => void) | null = null

  constructor() {
    this.restoreState()
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.restoreState()
          if (this.isRestricted && this.realtimeTeardownCallback) {
            try { this.realtimeTeardownCallback() } catch {}
          }
        }
      })
    }
  }

  private restoreState() {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage?.getItem(STORAGE_KEY) || window.sessionStorage?.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.isRestricted && parsed.restrictedUntil && Date.now() < parsed.restrictedUntil) {
          this.isRestricted = true
          this.reason = parsed.reason || 'Layanan cloud dibatasi sementara.'
          this.restrictedSince = parsed.restrictedSince || new Date().toISOString()
          this.restrictedUntil = parsed.restrictedUntil
        } else if (parsed.isRestricted === false) {
          this.isRestricted = false
          this.reason = null
          this.restrictedSince = null
          this.restrictedUntil = null
        }
      }
    } catch {
      // Ignore
    }
  }

  private persistState() {
    if (typeof window === 'undefined') return
    try {
      const payload = JSON.stringify({
        isRestricted: this.isRestricted,
        reason: this.reason,
        restrictedSince: this.restrictedSince,
        restrictedUntil: this.restrictedUntil,
      })
      window.localStorage?.setItem(STORAGE_KEY, payload)
      window.sessionStorage?.setItem(STORAGE_KEY, payload)
    } catch {
      // Ignore
    }
  }

  /**
   * Registers callback to disconnect Realtime WebSocket when circuit breaker trips.
   */
  public registerRealtimeTeardown(cb: () => void) {
    this.realtimeTeardownCallback = cb
  }

  /**
   * Tests if an error is a billing / egress restriction (HTTP 402).
   */
  public isQuotaRestrictionError(err: any): boolean {
    if (!err) return false
    const msg = String(err.message || err.details || err.error_description || err || '').toLowerCase()
    const status = Number(err.status || err.statusCode || err.code)

    return (
      status === 402 ||
      msg.includes('exceed_egress_quota') ||
      msg.includes('egress') ||
      msg.includes('payment required') ||
      msg.includes('restricted due to the following violations') ||
      msg.includes('service for this project is restricted') ||
      msg.includes('upgrade their plan or remove spend caps')
    )
  }

  /**
   * Records an error. If quota limit is detected, trips the breaker immediately.
   * Returns true if breaker was tripped.
   */
  public recordError(err: any): boolean {
    if (this.isQuotaRestrictionError(err)) {
      this.trip(
        err.message ||
          'Layanan cloud Supabase mencapai batas kuota egress (HTTP 402). Sistem otomatis dialihkan ke mode penyimpanan lokal offline yang aman.'
      )
      return true
    }

    this.consecutiveErrors++
    return false
  }

  /**
   * Manually trips the circuit breaker.
   */
  public trip(reason: string) {
    if (this.isRestricted) return

    this.isRestricted = true
    this.reason = reason
    this.restrictedSince = new Date().toISOString()
    this.restrictedUntil = Date.now() + DEFAULT_COOLDOWN_MS
    this.persistState()

    console.warn(
      `[CloudCircuitBreaker] ⚡ CIRCUIT BREAKER TRIPPED! Supabase requests suspended. Reason: ${reason}`
    )

    // Tear down all Realtime WebSocket connections immediately to stop retry loops
    if (this.realtimeTeardownCallback) {
      try {
        this.realtimeTeardownCallback()
      } catch (e) {
        console.warn('[CloudCircuitBreaker] Realtime teardown warning:', e)
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ogsoreg_circuit_breaker_tripped', {
          detail: this.getStatus(),
        })
      )
    }
  }

  /**
   * Checks whether outgoing PostgREST queries and Realtime connections are allowed.
   */
  public canExecuteQuery(): boolean {
    if (!this.isRestricted) return true

    // Check if cooldown timer expired
    if (this.restrictedUntil && Date.now() > this.restrictedUntil) {
      this.reset()
      return true
    }

    this.totalBlockedRequests++
    return false
  }

  /**
   * Resets the circuit breaker (e.g. by admin manual check).
   */
  public reset() {
    this.isRestricted = false
    this.reason = null
    this.restrictedSince = null
    this.restrictedUntil = null
    this.consecutiveErrors = 0
    this.persistState()

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ogsoreg_circuit_breaker_reset', {
          detail: this.getStatus(),
        })
      )
    }
  }

  /**
   * Returns current status snapshot for UI banners and monitoring.
   */
  public getStatus(): CircuitBreakerStatus {
    return {
      isRestricted: this.isRestricted,
      reason: this.reason,
      restrictedSince: this.restrictedSince,
      restrictedUntil: this.restrictedUntil,
      consecutiveErrors: this.consecutiveErrors,
      totalBlockedRequests: this.totalBlockedRequests,
    }
  }
}

export const cloudCircuitBreaker = new CloudCircuitBreaker()
