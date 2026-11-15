import React, { useState, useEffect } from 'react'
import { RefreshCw, X, ShieldCheck } from 'lucide-react'
import { cloudCircuitBreaker, type CircuitBreakerStatus } from '../../services/supabase/cloudCircuitBreaker'
import { useAuth } from '../../context/AuthContext'

export const CloudQuotaBanner: React.FC = () => {
  const { isSuperAdmin } = useAuth()
  const [status, setStatus] = useState<CircuitBreakerStatus>(() => cloudCircuitBreaker.getStatus())
  const [isDismissed, setIsDismissed] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    const handleTripped = () => {
      setStatus(cloudCircuitBreaker.getStatus())
      setIsDismissed(false)
    }
    const handleReset = () => {
      setStatus(cloudCircuitBreaker.getStatus())
    }

    window.addEventListener('ogsoreg_circuit_breaker_tripped', handleTripped)
    window.addEventListener('ogsoreg_circuit_breaker_reset', handleReset)

    return () => {
      window.removeEventListener('ogsoreg_circuit_breaker_tripped', handleTripped)
      window.removeEventListener('ogsoreg_circuit_breaker_reset', handleReset)
    }
  }, [])

  if (!status.isRestricted || isDismissed) {
    return null
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    try {
      cloudCircuitBreaker.reset()
      setStatus(cloudCircuitBreaker.getStatus())
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="bg-amber-950 text-amber-100 border-b border-amber-600/40 px-4 py-2.5 text-xs shadow-md z-50 relative animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-amber-200 mr-1.5">
              Mode Lokal Aktif (Egress Quota Protection):
            </span>
            <span className="text-amber-100/90">
              Layanan cloud Supabase mencapai batas kuota egress (HTTP 402). Sistem dialihkan otomatis ke penyimpanan lokal aman. Seluruh data santri dan hasil lomba tetap terlindungi tanpa risiko kehilangan data.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-800/80 hover:bg-amber-700 text-amber-100 font-semibold transition-colors cursor-pointer border border-amber-600/50 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
              <span>Cek Status Cloud</span>
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
    </div>
  )
}
