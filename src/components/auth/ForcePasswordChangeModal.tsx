import React, { useState } from 'react'
import { KeyRound, Check, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../context/AuthContext'

export const ForcePasswordChangeModal: React.FC = () => {
  const { appProfile, changePassword, mustChangePassword } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!mustChangePassword || !appProfile) {
    return null
  }

  // Password Strength Indicators
  const hasMinLength = newPassword.length >= 8
  const hasUpper = /[A-Z]/.test(newPassword)
  const hasLower = /[a-z]/.test(newPassword)
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword

  const isFormValid =
    hasMinLength && hasUpper && hasLower && hasNumberOrSpecial && passwordsMatch && currentPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setIsSubmitting(true)

    const res = await changePassword(currentPassword, newPassword, confirmPassword)
    setIsSubmitting(false)

    if (!res.success) {
      setErrorMsg(res.error || 'Gagal mengubah kata sandi.')
    } else {
      setSuccessMsg('Kata sandi berhasil diperbarui! Anda sekarang dapat mengakses dashboard.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#166534] to-[#0F3D20] text-white">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 text-white mb-3">
            <KeyRound className="w-6 h-6 text-[#22C55E]" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Wajib Ganti Kata Sandi</h2>
          <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">
            Demi keamanan kontingen <strong>{appProfile.display_name}</strong>, Anda wajib mengganti kata sandi
            sementara sebelum dapat mengakses dasbor OGSOreg.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <Check className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Kata Sandi Sementara Saat Ini
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi sementara"
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter kombinasi"
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru"
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Policy Checklist */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-600">
            <p className="font-semibold text-slate-700 mb-1">Ketentuan Keamanan Sandi:</p>
            <div className="flex items-center gap-1.5">
              <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-[#22C55E]' : 'text-slate-300'}`} />
              <span className={hasMinLength ? 'text-slate-900 font-medium' : ''}>Minimal 8 karakter</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className={`w-3.5 h-3.5 ${hasUpper ? 'text-[#22C55E]' : 'text-slate-300'}`} />
              <span className={hasUpper ? 'text-slate-900 font-medium' : ''}>Minimal 1 huruf besar (A-Z)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className={`w-3.5 h-3.5 ${hasLower ? 'text-[#22C55E]' : 'text-slate-300'}`} />
              <span className={hasLower ? 'text-slate-900 font-medium' : ''}>Minimal 1 huruf kecil (a-z)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className={`w-3.5 h-3.5 ${hasNumberOrSpecial ? 'text-[#22C55E]' : 'text-slate-300'}`} />
              <span className={hasNumberOrSpecial ? 'text-slate-900 font-medium' : ''}>
                Minimal 1 angka atau simbol unik
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-[#22C55E]' : 'text-slate-300'}`} />
              <span className={passwordsMatch ? 'text-slate-900 font-medium' : ''}>Konfirmasi sandi cocok</span>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!isFormValid || isSubmitting}
            className="w-full h-11 text-sm shadow-md mt-2"
          >
            Simpan Kata Sandi Baru & Buka Akses
          </Button>
        </form>
      </div>
    </div>
  )
}
