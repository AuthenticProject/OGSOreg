import React, { useState, useEffect } from 'react'
import { RefreshCw, X, ShieldAlert, CheckCircle2, CloudOff, Info } from 'lucide-react'
import { cloudCircuitBreaker, type CircuitBreakerStatus } from '../../services/supabase/cloudCircuitBreaker'
import {
  cloudSyncCoordinator,
  type CloudConnectionState,
  type SyncStats,
} from '../../services/supabase/cloudSyncCoordinator'
import { useAuth } from '../../context/AuthContext'

export const CloudQuotaBanner: React.FC = () => {
  const { isSuperAdmin } = useAuth()
  const [circuitStatus, setCircuitStatus] = useState<CircuitBreakerStatus>(() =>
    cloudCircuitBreaker.getStatus()
  )
  const [cloudState, setCloudState] = useState<CloudConnectionState>(() =>
    cloudSyncCoordinator.getCurrentState()
  )
  const [, setSyncStats] = useState<SyncStats>(() => cloudSyncCoordinator.getStats())
  const [isDismissed, setIsDismissed] = useState(false)
  const [isCheckingRecovery, setIsCheckingRecovery] = useState(false)
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const unsub = cloudSyncCoordinator.subscribeState((newState, stats) => {
      setCloudState(newState)
      setSyncStats(stats)
      setCircuitStatus(cloudCircuitBreaker.getStatus())
    })

    const handleTripped = () => {
      setCircuitStatus(cloudCircuitBreaker.getStatus())
      setCloudState('Cloud Restricted')
      setIsDismissed(false)
    }

    const handleReset = () => {
      setCircuitStatus(cloudCircuitBreaker.getStatus())
      setCloudState(cloudSyncCoordinator.getCurrentState())
    }

    window.addEventListener('ogsoreg_circuit_breaker_tripped', handleTripped)
    window.addEventListener('ogsoreg_circuit_breaker_reset', handleReset)

    return () => {
      unsub()
      window.removeEventListener('ogsoreg_circuit_breaker_tripped', handleTripped)
      window.removeEventListener('ogsoreg_circuit_breaker_reset', handleReset)
    }
  }, [])

  // Only display the banner when cloud is restricted or checking recovery, unless manually dismissed
  const isRestricted = circuitStatus.isRestricted || cloudState === 'Cloud Restricted'

  if (!isRestricted || isDismissed) {
    return null
  }

  const handleRecoveryCheck = async () => {
    setIsCheckingRecovery(true)
    setRecoveryMessage(null)
    try {
      const result = await cloudSyncCoordinator.triggerRecoveryCheck()
      setRecoveryMessage(result.message)
      setCircuitStatus(cloudCircuitBreaker.getStatus())
      setCloudState(cloudSyncCoordinator.getCurrentState())
    } finally {
      setIsCheckingRecovery(false)
    }
  }

  return (
    <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-100 border-b border-amber-600/50 px-4 py-2.5 text-xs shadow-lg z-50 relative animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-300 mt-0.5 sm:mt-0">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-amber-200">
                Status Cloud: {cloudState}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Egress Protection Active
              </span>
            </div>
            {/* Required text as specified in prompt */}
            <p className="text-amber-100/90 mt-0.5">
              Sinkronisasi cloud Supabase sedang dijeda karena pembatasan kuota. Aplikasi tetap menggunakan data lokal yang tersedia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-[11px] font-medium border border-amber-700/50 transition-colors"
          >
            <Info className="w-3 h-3" />
            <span>Detail Status</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleRecoveryCheck}
              disabled={isCheckingRecovery}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-semibold transition-colors cursor-pointer border border-amber-500/50 disabled:opacity-50 shadow-sm"
              title="Periksa apakah batas kuota Supabase sudah dipulihkan"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingRecovery ? 'animate-spin' : ''}`} />
              <span>{isCheckingRecovery ? 'Memeriksa...' : 'Periksa Pemulihan Cloud'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-md text-amber-300/80 hover:text-white hover:bg-amber-900/50 transition-colors"
            title="Tutup pemberitahuan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {recoveryMessage && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-amber-800/60 text-[11px] text-amber-200 flex items-center justify-between">
          <span>{recoveryMessage}</span>
          <button
            type="button"
            onClick={() => setRecoveryMessage(null)}
            className="text-amber-400 hover:underline ml-2"
          >
            Tutup
          </button>
        </div>
      )}

      {showDetails && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-amber-800/60 text-[11px] grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="bg-amber-950/60 rounded p-2 border border-amber-800/40">
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Tersimpan Lokal (Locally Saved)
            </span>
            <p className="text-amber-200/80 text-[10px] mt-0.5">
              100% data pendaftaran, finalis, dan juara tersimpan aman di browser (localStorage & cache memori).
            </p>
          </div>
          <div className="bg-amber-950/60 rounded p-2 border border-amber-800/40">
            <span className="font-semibold text-amber-300 flex items-center gap-1">
              <CloudOff className="w-3 h-3" /> Menunggu Sinkronisasi (Pending Cloud)
            </span>
            <p className="text-amber-200/80 text-[10px] mt-0.5">
              Perubahan baru diantrekan secara otomatis dan akan disinkronkan saat kuota cloud kembali normal.
            </p>
          </div>
          <div className="bg-amber-950/60 rounded p-2 border border-amber-800/40">
            <span className="font-semibold text-blue-300 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Egress Storm Blocked
            </span>
            <p className="text-amber-200/80 text-[10px] mt-0.5">
              Circuit breaker telah mencegat {circuitStatus.totalBlockedRequests} permintaan HTTP/Realtime agar tidak terjadi request flood.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
