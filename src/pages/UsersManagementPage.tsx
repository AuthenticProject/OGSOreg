import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import {
  UserCog,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  Mail,
  RotateCcw,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Building,
  UserCheck,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { StatCard } from '../components/ui/StatCard'
import { useAuth } from '../context/AuthContext'
import { accountService } from '../services/accountService'
import type { AppUserProfile } from '../types/auth'

export const UsersManagementPage: React.FC = () => {
  const { isSuperAdmin, appProfile } = useAuth()

  const [users, setUsers] = useState<AppUserProfile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending_pwd'>('all')
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal states
  const [selectedUser, setSelectedUser] = useState<AppUserProfile | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect non-super-admin
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  const loadUsers = async () => {
    if (appProfile?.role) {
      const list = await accountService.getAllUsers(appProfile.role)
      setUsers(list)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [appProfile])

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setActionFeedback({ type, message })
    setTimeout(() => setActionFeedback(null), 5000)
  }

  // Handle Toggle Active
  const handleToggleActive = async (user: AppUserProfile) => {
    if (user.role === 'super_admin') {
      showFeedback('error', 'Akun Super Admin utama tidak dapat dinonaktifkan.')
      return
    }

    const nextState = !user.is_active
    const confirmMsg = nextState
      ? `Aktifkan kembali akun '${user.username}'?`
      : `Nonaktifkan akun '${user.username}'? Pengguna tidak akan bisa login.`

    if (window.confirm(confirmMsg)) {
      const res = await accountService.toggleUserActive(user.id, nextState, appProfile?.role || '')
      if (res.success) {
        showFeedback('success', `Status akun '${user.username}' berhasil diperbarui.`)
        loadUsers()
      } else {
        showFeedback('error', res.error || 'Gagal mengubah status akun.')
      }
    }
  }

  // Handle Reset Access
  const handleResetAccess = async (user: AppUserProfile) => {
    if (user.role === 'super_admin') {
      showFeedback('error', 'Kata sandi Super Admin tidak dapat direset dengan tombol ini.')
      return
    }

    const confirmMsg = `Reset akses untuk '${user.username}' (${user.display_name})?\n\nKata sandi akan dikembalikan ke sandi sementara resmi ('OGSOreg_Kampus2026!') dan pengguna wajib mengganti sandi pada login berikutnya.`

    if (window.confirm(confirmMsg)) {
      const res = await accountService.resetUserAccess(user.id, appProfile?.role || '')
      if (res.success) {
        showFeedback('success', `Akses akun '${user.username}' berhasil direset ke sandi sementara.`)
        loadUsers()
      } else {
        showFeedback('error', res.error || 'Gagal mereset akses pengguna.')
      }
    }
  }

  // Handle Open Email Modal
  const handleOpenEmailModal = (user: AppUserProfile) => {
    setSelectedUser(user)
    setNewEmail(user.email)
    setIsEmailModalOpen(true)
  }

  // Submit Update Email
  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setIsSubmitting(true)

    const res = await accountService.updateUserEmail(selectedUser.id, newEmail, appProfile?.role || '')
    setIsSubmitting(false)

    if (res.success) {
      showFeedback('success', `Alamat email '${selectedUser.username}' berhasil diubah ke '${newEmail}'.`)
      setIsEmailModalOpen(false)
      loadUsers()
    } else {
      showFeedback('error', res.error || 'Gagal memperbarui alamat email.')
    }
  }

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.campus_id && u.campus_id.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!matchesSearch) return false

    if (statusFilter === 'active') return u.is_active
    if (statusFilter === 'inactive') return !u.is_active
    if (statusFilter === 'pending_pwd') return u.must_change_password

    return true
  })

  // Statistics
  const totalCount = users.length
  const activeCount = users.filter((u) => u.is_active).length
  const campusAdminCount = users.filter((u) => u.role === 'campus_admin').length
  const pendingPasswordChangeCount = users.filter((u) => u.must_change_password).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
              Manajemen Pengguna
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
              21 Akun Resmi
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kelola akses login, peran, reset kata sandi, dan status 20 Admin Kampus & 1 Super Admin.
          </p>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            actionFeedback.type === 'success'
              ? 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Akun Resmi"
          value={totalCount}
          description="1 Super Admin + 20 Kampus"
          icon={<UserCog className="w-5 h-5 text-emerald-700" />}
          variant="maroon"
        />
        <StatCard
          title="Admin Kampus Terdaftar"
          value={campusAdminCount}
          description="Gontor 1-12 & Putri 1-8"
          icon={<Building className="w-5 h-5 text-emerald-700" />}
          variant="default"
        />
        <StatCard
          title="Akun Aktif"
          value={activeCount}
          description={`${totalCount - activeCount} Akun dinonaktifkan`}
          icon={<UserCheck className="w-5 h-5 text-emerald-700" />}
          variant="default"
        />
        <StatCard
          title="Wajib Ganti Sandi"
          value={pendingPasswordChangeCount}
          description="Belum mengganti sandi awal"
          icon={<KeyRound className="w-5 h-5 text-amber-700" />}
          variant={pendingPasswordChangeCount > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan username, kampus, atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E] text-[#0F172A]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E] text-slate-700"
          >
            <option value="all">Semua Status Akun</option>
            <option value="active">Hanya Akun Aktif</option>
            <option value="inactive">Hanya Akun Nonaktif</option>
            <option value="pending_pwd">Wajib Ganti Sandi</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Pengguna</th>
                <th className="py-3 px-4">Peran & Kampus</th>
                <th className="py-3 px-4">Email Kontak</th>
                <th className="py-3 px-4 text-center">Status Akun</th>
                <th className="py-3 px-4 text-center">Status Sandi</th>
                <th className="py-3 px-4">Login Terakhir</th>
                <th className="py-3 px-4 text-center">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada akun pengguna yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.username}</div>
                      <div className="text-[11px] text-slate-500">{u.display_name}</div>
                    </td>

                    <td className="py-3 px-4">
                      {u.role === 'super_admin' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
                          <ShieldCheck className="w-3 h-3 text-[#166534]" />
                          Super Admin (Semua Kampus)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          <Building className="w-3 h-3 text-emerald-600" />
                          {u.campus_id}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">
                      {u.email}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-500" />
                          Nonaktif
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {u.must_change_password ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <KeyRound className="w-3 h-3 text-amber-600" />
                          Wajib Ganti
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          Telah Diganti
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {u.last_login_at
                        ? new Date(u.last_login_at).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : 'Belum pernah'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* View Detail */}
                        <button
                          onClick={() => {
                            setSelectedUser(u)
                            setIsDetailModalOpen(true)
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Lihat Detail Akun"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Email */}
                        <button
                          onClick={() => handleOpenEmailModal(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Ubah Email Terverifikasi"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Access */}
                        {u.role !== 'super_admin' && (
                          <button
                            onClick={() => handleResetAccess(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            title="Reset Akses ke Sandi Sementara"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Toggle Active */}
                        {u.role !== 'super_admin' && (
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.is_active
                                ? 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'
                                : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={u.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          >
                            {u.is_active ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Detail Akun */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-[#166534] to-[#0F3D20] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
                <h3 className="font-bold text-sm">Informasi Akun Pengguna</h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-white/80 hover:text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Nama Pengguna:</span>
                <span className="font-bold text-slate-800 text-sm font-mono">{selectedUser.username}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Nama Tampilan:</span>
                <span className="font-medium text-slate-800">{selectedUser.display_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Peran Sistem:</span>
                <span className="font-bold text-[#166534]">
                  {selectedUser.role === 'super_admin' ? 'Super Admin' : 'Admin Kampus'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Penugasan Kampus:</span>
                <span className="font-bold text-slate-800">
                  {selectedUser.campus_id || 'Seluruh 20 Kampus (Global)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Email Kontak:</span>
                <span className="font-mono text-slate-800">{selectedUser.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Status Kata Sandi:</span>
                <span className={selectedUser.must_change_password ? 'text-amber-600 font-bold' : 'text-emerald-700 font-medium'}>
                  {selectedUser.must_change_password ? 'Wajib ganti sandi pada login berikutnya' : 'Sudah diperbarui'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100">
                Catatan: Kata sandi pengguna tidak pernah disimpan dalam bentuk teks biasa dan tidak dapat dilihat oleh siapapun.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)} className="text-xs">
                Tutup Jendela
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Email */}
      {isEmailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-[#166534] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Ubah Email Terverifikasi</h3>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="text-white/80 hover:text-white text-xs font-semibold"
              >
                Batal
              </button>
            </div>
            <form onSubmit={handleSaveEmail} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Akun Target: <span className="text-emerald-700 font-mono">{selectedUser.username}</span>
                </label>
                <p className="text-slate-500 text-[11px] mb-3">
                  Masukkan alamat email aktif yang dapat menerima pesan pemulihan kata sandi dan notifikasi sistem.
                </p>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@ogso.gontor.ac.id"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting} className="text-xs">
                  Simpan Perubahan Email
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
