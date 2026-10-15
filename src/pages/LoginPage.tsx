import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { SHARED_CAMPUS_ADMIN_INITIAL_PASSWORD } from '../types/auth'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { loginWithUsername, isConfigured } = useAuth()

  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('OGSOreg_SuperAdmin2026!')
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

  const handleSelectQuickAccount = (uname: string, pwd: string) => {
    setUsername(uname)
    setPassword(pwd)
    setErrorMsg(null)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#166534] text-white font-black shadow-md mb-3">
          <Sparkles className="w-6 h-6 text-[#22C55E]" />
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

          {/* Quick Account Switcher for QA and Multi-Campus Testing */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <p className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Uji Coba Cepat 21 Akun Resmi
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleSelectQuickAccount('admin', 'OGSOreg_SuperAdmin2026!')}
                className="p-1.5 rounded-lg border border-[#BBF7D0] bg-[#DCFCE7] text-[#166534] font-bold hover:bg-emerald-200 transition-colors truncate"
                title="Super Admin - Akses 20 Kampus"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleSelectQuickAccount('gontor1', SHARED_CAMPUS_ADMIN_INITIAL_PASSWORD)}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium hover:bg-slate-100 transition-colors truncate"
                title="Gontor 1 (Putra)"
              >
                Gontor 1
              </button>
              <button
                type="button"
                onClick={() => handleSelectQuickAccount('gontorputri1', SHARED_CAMPUS_ADMIN_INITIAL_PASSWORD)}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium hover:bg-slate-100 transition-colors truncate"
                title="Gontor Putri 1"
              >
                Gontor Putri 1
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400">
              Semua 20 admin kampus menggunakan sandi sementara: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">OGSOreg_Kampus2026!</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
