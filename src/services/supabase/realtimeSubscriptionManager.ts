/**
 * Centralized Realtime Subscription Manager for OGSOreg
 *
 * Prevents channel duplication, consolidates WebSocket subscriptions,
 * enforces clean teardown, and suspends all Realtime traffic during
 * Supabase egress quota restrictions (HTTP 402).
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { cloudCircuitBreaker } from './cloudCircuitBreaker'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type ChannelStatus = 'idle' | 'subscribing' | 'subscribed' | 'suspended' | 'closed' | 'error'

interface ManagedChannel {
  name: string
  channel: RealtimeChannel | null
  setupFn: (channel: RealtimeChannel) => void
  status: ChannelStatus
  subscriberCount: number
}

class RealtimeSubscriptionManager {
  private channels = new Map<string, ManagedChannel>()
  private isSuspended: boolean = false

  constructor() {
    // Automatically register teardown with circuit breaker
    cloudCircuitBreaker.registerRealtimeTeardown(() => {
      this.suspendAll('Cloud Circuit Breaker tripped (Quota limit HTTP 402)')
    })

    // Listen for breaker reset events
    if (typeof window !== 'undefined') {
      window.addEventListener('ogsoreg_circuit_breaker_reset', () => {
        this.resumeAll()
      })
    }
  }

  /**
   * Registers and subscribes to a channel in a deduplicated, managed manner.
   * If a channel with the same name already exists, reuses it and increments ref count.
   * Returns an unsubscribe function.
   */
  public registerChannel(
    channelName: string,
    setupFn: (channel: RealtimeChannel) => void
  ): () => void {
    if (!isSupabaseConfigured()) {
      return () => {}
    }

    let managed = this.channels.get(channelName)

    if (managed) {
      managed.subscriberCount++
      // If channel is already subscribed, execute setup for this subscriber if needed
      return () => this.unregisterSubscriber(channelName)
    }

    managed = {
      name: channelName,
      channel: null,
      setupFn,
      status: 'idle',
      subscriberCount: 1,
    }

    this.channels.set(channelName, managed)

    // Only connect if circuit breaker allows
    if (!this.isSuspended && cloudCircuitBreaker.canExecuteQuery()) {
      this.connectChannel(managed)
    } else {
      managed.status = 'suspended'
    }

    return () => this.unregisterSubscriber(channelName)
  }

  private connectChannel(managed: ManagedChannel) {
    if (!isSupabaseConfigured() || !cloudCircuitBreaker.canExecuteQuery()) {
      managed.status = 'suspended'
      return
    }

    try {
      managed.status = 'subscribing'
      const channel = supabase.channel(managed.name)
      managed.channel = channel

      // Run subscriber setup (events, filters, callbacks)
      managed.setupFn(channel)

      channel.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          managed.status = 'subscribed'
        } else if (status === 'CLOSED') {
          managed.status = 'closed'
        } else if (status === 'CHANNEL_ERROR') {
          managed.status = 'error'
          if (err && cloudCircuitBreaker.isQuotaRestrictionError(err)) {
            cloudCircuitBreaker.recordError(err)
          }
        }
      })
    } catch (err) {
      managed.status = 'error'
      if (cloudCircuitBreaker.isQuotaRestrictionError(err)) {
        cloudCircuitBreaker.recordError(err)
      }
    }
  }

  private unregisterSubscriber(channelName: string) {
    const managed = this.channels.get(channelName)
    if (!managed) return

    managed.subscriberCount--
    if (managed.subscriberCount <= 0) {
      this.teardownChannel(managed)
      this.channels.delete(channelName)
    }
  }

  private teardownChannel(managed: ManagedChannel) {
    if (managed.channel) {
      try {
        supabase.removeChannel(managed.channel)
      } catch {
        // Ignore teardown error
      }
      managed.channel = null
    }
    managed.status = 'closed'
  }

  /**
   * Suspends all Realtime channels immediately (e.g. on HTTP 402 Quota Exceeded).
   */
  public suspendAll(reason?: string) {
    this.isSuspended = true
    console.warn(`[RealtimeManager] Suspending all Realtime channels. Reason: ${reason || 'Manual suspension'}`)

    this.channels.forEach((managed) => {
      if (managed.channel) {
        try {
          supabase.removeChannel(managed.channel)
        } catch {
          // Ignore
        }
        managed.channel = null
      }
      managed.status = 'suspended'
    })

    try {
      supabase.removeAllChannels()
    } catch {
      // Ignore
    }
  }

  /**
   * Resumes channels safely when circuit breaker resets.
   */
  public resumeAll() {
    this.isSuspended = false
    console.info('[RealtimeManager] Resuming Realtime channels after recovery.')

    if (!cloudCircuitBreaker.canExecuteQuery()) return

    this.channels.forEach((managed) => {
      if (managed.status === 'suspended') {
        this.connectChannel(managed)
      }
    })
  }

  /**
   * Returns list and status of all managed channels for monitoring/diagnostics.
   */
  public getStatus() {
    const channelList: Array<{ name: string; status: ChannelStatus; subscribers: number }> = []
    this.channels.forEach((m) => {
      channelList.push({
        name: m.name,
        status: m.status,
        subscribers: m.subscriberCount,
      })
    })
    return {
      isSuspended: this.isSuspended,
      totalChannels: this.channels.size,
      channels: channelList,
    }
  }
}

export const realtimeSubscriptionManager = new RealtimeSubscriptionManager()
