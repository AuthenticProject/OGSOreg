import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { signIn, isConfigured } = useAuth()

  const [email, setEmail] = useState('admin@darussalam.sch.id')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setErrorMsg(error.message)
      } else {
        navigate('/dashboard')
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal melakukan otentikasi')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setErrorMsg(null)
    setLoading(true)
    await signIn('admin@darussalam.sch.id', 'password123')
    setLoading(false)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#166534] text-white font-black shadow-elevated mb-4">
          <Sparkles className="w-6 h-6 text-[#22C55E]" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Masuk ke <span className="text-[#166534]">OGSO</span><span className="text-[#22C55E]">reg</span>
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
          Platform Pendaftaran Kolektif Santri & Integrasi Moodle LMS
        </p>

        {!isConfigured && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            Mode Preview Lokal Aktif (Supabase Belum Dikonfigurasi)
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-border shadow-card space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Alamat Email Penanggung Jawab
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gontor.ac.id"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E] text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E] text-foreground"
                />
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
              className="w-full h-11 text-sm shadow-md"
              rightIcon={<ArrowRight className="w-4 h-4 ml-1.5" />}
            >
              Masuk ke Portal
            </Button>
          </form>

          {/* Quick Demo Access */}
          <div className="pt-4 border-t border-border space-y-3">
            <p className="text-center text-xs text-muted-foreground">
              Ingin langsung menguji sistem tanpa akun Supabase?
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={handleDemoLogin}
              leftIcon={<ShieldCheck className="w-4 h-4 mr-1.5 text-[#166534]" />}
              className="w-full text-xs h-10 border border-slate-200"
            >
              Masuk sebagai Admin Demo (SMA Darussalam)
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
