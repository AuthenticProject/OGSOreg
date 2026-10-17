import React, { useState } from 'react'
import {
  Building2,
  Mail,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Clock,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { SectionCard } from '../components/ui/SectionCard'
import { useAuth } from '../context/AuthContext'
import { accountService } from '../services/accountService'

export const AccountSettingsPage: React.FC = () => {
  const { appProfile, changePassword, isSuperAdmin } = useAuth()

  // Profile Edit State
  const [displayName, setDisplayName] = useState(appProfile?.display_name || '')
  const [email, setEmail] = useState(appProfile?.email || '')
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null)
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null)
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null)
  const [isChangingPass, setIsChangingPass] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSuccessMsg(null)
    setProfileErrorMsg(null)

    if (!displayName.trim()) {
      setProfileErrorMsg('Nama tampilan tidak boleh kosong.')
      return
    }

    setIsUpdatingProfile(true)
    try {
      if (appProfile) {
        await accountService.updateUserProfile(appProfile.id, {
          display_name: displayName.trim(),
          email: email.trim() || undefined,
        })
        setProfileSuccessMsg('Profil akun Anda berhasil diperbarui.')
      }
    } catch (err: unknown) {
      setProfileErrorMsg(err instanceof Error ? err.message : 'Gagal memperbarui profil.')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSuccessMsg(null)
    setPasswordErrorMsg(null)

    if (newPassword.length < 6) {
      setPasswordErrorMsg('Kata sandi baru minimal 6 karakter.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Konfirmasi kata sandi baru tidak cocok.')
      return
    }

    setIsChangingPass(true)
    try {
      const res = await changePassword(currentPassword, newPassword, confirmPassword)
      if (res.success) {
        setPasswordSuccessMsg('Kata sandi berhasil diubah! Gunakan sandi baru pada login berikutnya.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordErrorMsg(res.error || 'Gagal mengubah kata sandi.')
      }
    } catch (err: unknown) {
      setPasswordErrorMsg(err instanceof Error ? err.message : 'Gagal mengubah kata sandi.')
    } finally {
      setIsChangingPass(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Akun"
        subtitle="Kelola informasi profil akun Anda, kontak email, dan perbarui kata sandi secara aman."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card & Info */}
        <div className="lg:col-span-1 space-y-6">
          <SectionCard title="Ringkasan Akun">
            <div className="text-center pt-2 pb-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl font-bold border-4 border-emerald-50 mb-3 shadow-xs">
                {appProfile?.display_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h3 className="font-bold text-slate-900 text-base">{appProfile?.display_name}</h3>
              <p className="text-xs font-mono text-slate-500">@{appProfile?.username}</p>
              <div className="mt-2.5">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isSuperAdmin
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {isSuperAdmin ? 'Super Admin' : 'Admin Kampus'}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  Kampus Kontingen:
                </span>
                <span className="font-medium text-slate-800">
                  {appProfile?.campus_id || 'Seluruh Kampus (Pusat)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  Email Terdaftar:
                </span>
                <span className="font-medium text-slate-800 truncate max-w-[150px]">
                  {appProfile?.email || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Login Terakhir:
                </span>
                <span className="font-medium text-slate-800">
                  {appProfile?.last_login_at
                    ? new Date(appProfile.last_login_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Sesi Aktif'}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Profile Edit & Change Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form Informasi Profil */}
          <SectionCard title="Informasi Akun">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {profileSuccessMsg}
                </div>
              )}
              {profileErrorMsg && (
                <div className="p-3 bg-red-50 text-red-800 text-xs rounded-lg border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  {profileErrorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Tampilan
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Pengguna (Username)
                  </label>
                  <input
                    type="text"
                    value={appProfile?.username || ''}
                    disabled
                    className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-100 text-slate-500 rounded-lg cursor-not-allowed font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Username dikelola oleh sistem OGSO.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh@gontor.ac.id"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  {isUpdatingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </SectionCard>

          {/* Form Ubah Kata Sandi */}
          <SectionCard title="Ubah Kata Sandi">
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {passwordSuccessMsg}
                </div>
              )}
              {passwordErrorMsg && (
                <div className="p-3 bg-red-50 text-red-800 text-xs rounded-lg border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  {passwordErrorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Masukkan sandi saat ini"
                    className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Minimal 6 karakter"
                      className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Ulangi kata sandi baru"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isChangingPass}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <Lock className="w-4 h-4 mr-1.5" />
                  {isChangingPass ? 'Memproses...' : 'Perbarui Kata Sandi'}
                </Button>
              </div>
            </form>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
