import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { appProfile, isLoading, loginWithUsername, isConfigured } = useAuth()

  useEffect(() => {
    if (!isLoading && appProfile) {
      navigate('/dashboard', { replace: true })
    }
  }, [appProfile, isLoading, navigate])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      const res = await loginWithUsername(username, password)
      if (!res.success) {
        setErrorMsg(res.error || 'Nama pengguna atau kata sandi tidak valid.')
      } else {
        navigate('/dashboard')
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal melakukan otentikasi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon with Green Contrast Box */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#166534] via-[#0F3D20] to-[#0B2F19] p-2.5 shadow-lg shadow-emerald-900/20 border border-emerald-700/40 mb-3.5">
          <img src="/logo.png" alt="Logo OGSOreg" className="w-full h-full object-contain drop-shadow-sm" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          Masuk ke <span className="text-[#166534]">OGSO</span><span className="text-[#22C55E]">reg</span>
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Portal Pendaftaran Kolektif Santri & Integrasi Moodle LMS
        </p>

        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          {isConfigured ? 'Supabase Backend Aktif' : 'Multi-Campus Auth Ready (21 Akun)'}
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-7 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nama Pengguna (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: admin, gontor1, gontorputri1"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E] text-[#0F172A]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E] text-[#0F172A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="w-full h-11 text-sm shadow-sm"
              rightIcon={<ArrowRight className="w-4 h-4 ml-1.5" />}
            >
              Masuk ke Portal
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
