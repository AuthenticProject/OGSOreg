import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import {
  UserCog,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  RotateCcw,
  AlertCircle,
  Search,
  Filter,
  Eye,
  EyeOff,
  Building,
  UserCheck,
  UserPlus,
  Download,
  Copy,
  Check,
  Edit3,
  Sparkles,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { StatCard } from '../components/ui/StatCard'
import { useAuth } from '../context/AuthContext'
import { accountService } from '../services/accountService'
import { exportUserAccountsToExcel } from '../services/excelGenerator'
import { KAMPUS_OPTIONS, type StudentKampus } from '../types/campus'
import type { AppUserProfile, AppUserRole } from '../types/auth'

export const UsersManagementPage: React.FC = () => {
  const { isSuperAdmin, appProfile } = useAuth()

  const [users, setUsers] = useState<AppUserProfile[]>([])
  const [passwords, setPasswords] = useState<Record<string, string>>({})
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({})
  const [showAllPasswords, setShowAllPasswords] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending_pwd'>('all')
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal states
  const [selectedUser, setSelectedUser] = useState<AppUserProfile | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)

  // Password modal form
  const [newPassword, setNewPassword] = useState('')

  // Edit User modal form
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editCampus, setEditCampus] = useState<StudentKampus | ''>('')

  // Add User modal form
  const [addUsername, setAddUsername] = useState('')
  const [addDisplayName, setAddDisplayName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addCampus, setAddCampus] = useState<StudentKampus | ''>('')
  const [addRole, setAddRole] = useState<AppUserRole>('campus_admin')
  const [addPassword, setAddPassword] = useState('OGSO2026')

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect non-super-admin
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  const loadData = async () => {
    if (appProfile?.role) {
      const list = await accountService.getAllUsers(appProfile.role)
      setUsers(list)
      const pwMap = accountService.getAllUserPasswords(appProfile.role)
      setPasswords(pwMap)
    }
  }

  useEffect(() => {
    loadData()
  }, [appProfile])

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setActionFeedback({ type, message })
    setTimeout(() => setActionFeedback(null), 5000)
  }

  const handleCopyToClipboard = (text: string, identifier: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedKey(identifier)
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  const toggleRevealPassword = (username: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [username]: !prev[username],
    }))
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
        showFeedback('success', `Status akun '${user.username}' berhasil diubah ke ${nextState ? 'Aktif' : 'Nonaktif'}.`)
        loadData()
      } else {
        showFeedback('error', res.error || 'Gagal mengubah status akun.')
      }
    }
  }

  // Handle Reset Access to Initial Password
  const handleResetAccess = async (user: AppUserProfile) => {
    if (user.role === 'super_admin') {
      showFeedback('error', 'Kata sandi Super Admin tidak dapat direset dengan tombol ini.')
      return
    }

    const confirmMsg = `Reset kata sandi untuk '${user.username}' (${user.display_name})?\n\nKata sandi akan dikembalikan ke sandi standar resmi ('OGSO2026').`

    if (window.confirm(confirmMsg)) {
      const res = await accountService.resetUserAccess(user.id, appProfile?.role || '')
      if (res.success) {
        showFeedback('success', `Kata sandi akun '${user.username}' berhasil direset ke 'OGSO2026'.`)
        loadData()
      } else {
        showFeedback('error', res.error || 'Gagal mereset kata sandi.')
      }
    }
  }

  // Handle Open Password Modal
  const handleOpenPasswordModal = (user: AppUserProfile) => {
    setSelectedUser(user)
    setNewPassword(passwords[user.username] || 'OGSO2026')
    setIsPasswordModalOpen(true)
  }

  // Submit Update Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setIsSubmitting(true)

    const res = await accountService.setUserPassword(
      selectedUser.username,
      newPassword,
      appProfile?.role || 'super_admin'
    )
    setIsSubmitting(false)

    if (res.success) {
      showFeedback('success', `Kata sandi untuk '${selectedUser.username}' berhasil diperbarui!`)
      setIsPasswordModalOpen(false)
      loadData()
    } else {
      showFeedback('error', res.error || 'Gagal memperbarui kata sandi.')
    }
  }

  // Handle Open Edit User Modal
  const handleOpenEditUserModal = (user: AppUserProfile) => {
    setSelectedUser(user)
    setEditDisplayName(user.display_name)
    setEditEmail(user.email)
    setEditCampus(user.campus_id || '')
    setIsEditUserModalOpen(true)
  }

  // Submit Edit User Profile
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setIsSubmitting(true)

    const res = await accountService.updateUser(
      selectedUser.id,
      {
        display_name: editDisplayName,
        email: editEmail,
        campus_id: editCampus ? (editCampus as StudentKampus) : null,
      },
      appProfile?.role || 'super_admin'
    )
    setIsSubmitting(false)

    if (res.success) {
      showFeedback('success', `Data profil '${selectedUser.username}' berhasil diperbarui!`)
      setIsEditUserModalOpen(false)
      loadData()
    } else {
      showFeedback('error', res.error || 'Gagal memperbarui profil pengguna.')
    }
  }

  // Submit Add New User
  const handleSaveAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const res = await accountService.createUser(
      {
        username: addUsername,
        display_name: addDisplayName || `Admin ${addCampus || addUsername}`,
        email: addEmail,
        campus_id: addCampus ? (addCampus as StudentKampus) : null,
        role: addRole,
        password: addPassword || 'OGSO2026',
      },
      appProfile?.role || 'super_admin'
    )
    setIsSubmitting(false)

    if (res.success) {
      showFeedback('success', `Akun baru '${addUsername}' berhasil dibuat!`)
      setIsAddUserModalOpen(false)
      // Reset form
      setAddUsername('')
      setAddDisplayName('')
      setAddEmail('')
      setAddCampus('')
      setAddPassword('OGSO2026')
      loadData()
    } else {
      showFeedback('error', res.error || 'Gagal membuat akun baru.')
    }
  }

  // Handle Download Excel
  const handleDownloadExcel = async () => {
    try {
      await exportUserAccountsToExcel(users, passwords)
      showFeedback('success', 'Berkas rekap seluruh akun & kata sandi berhasil diunduh ke Excel!')
    } catch (err) {
      showFeedback('error', 'Gagal mengunduh berkas Excel.')
    }
  }

  // Generate random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*'
    let res = 'OGSO_'
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(res)
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
              Manajemen Pengguna & Kata Sandi
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
              {totalCount} Akun
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Lihat kata sandi, ubah kredensial, kelola hak akses, dan atur akun seluruh Admin Kampus OGSO.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllPasswords(!showAllPasswords)}
            leftIcon={showAllPasswords ? <EyeOff className="w-4 h-4 mr-1.5" /> : <Eye className="w-4 h-4 mr-1.5 text-[#166534]" />}
            className="text-xs font-semibold"
          >
            {showAllPasswords ? 'Sembunyikan Semua Sandi' : 'Lihat Semua Sandi'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadExcel}
            leftIcon={<Download className="w-4 h-4 mr-1.5 text-emerald-700" />}
            className="text-xs font-semibold"
          >
            Unduh Rekap Akun & Sandi
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddUserModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4 mr-1.5" />}
            className="text-xs font-bold bg-[#166534] hover:bg-[#14532D]"
          >
            Tambah Akun
          </Button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in ${
            actionFeedback.type === 'success'
              ? 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Akun Resmi"
          value={totalCount}
          description="1 Super Admin + Admin Kampus"
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
          title="Sandi Default / Reset"
          value={pendingPasswordChangeCount}
          description="Belum diubah oleh user"
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
            placeholder="Cari berdasarkan username, nama tampilan, kampus, atau email..."
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
                <th className="py-3 px-4">Kata Sandi (Password)</th>
                <th className="py-3 px-4">Email Kontak</th>
                <th className="py-3 px-4 text-center">Status Akun</th>
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
                filteredUsers.map((u) => {
                  const pw = passwords[u.username] || (u.role === 'super_admin' ? 'OGSOreg_SuperAdmin2026!' : 'OGSO2026')
                  const isRevealed = showAllPasswords || Boolean(revealedPasswords[u.username])
                  const isCopied = copiedKey === u.username

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Username */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 font-mono text-[13px]">{u.username}</div>
                        <div className="text-[11px] text-slate-500">{u.display_name}</div>
                      </td>

                      {/* 2. Role & Campus */}
                      <td className="py-3 px-4">
                        {u.role === 'super_admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
                            <ShieldCheck className="w-3 h-3 text-[#166534]" />
                            Super Admin (Global)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            <Building className="w-3 h-3 text-emerald-600" />
                            {u.campus_id || '-'}
                          </span>
                        )}
                      </td>

                      {/* 3. Password Reveal & Copy */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-slate-50 border border-slate-200">
                          {isRevealed ? (
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-50 text-[#166534] border border-emerald-200 select-all">
                              {pw}
                            </span>
                          ) : (
                            <span className="font-mono text-xs px-2 py-0.5 text-slate-400 tracking-wider">
                              ••••••••
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleRevealPassword(u.username)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                            title={isRevealed ? 'Sembunyikan Sandi' : 'Lihat Sandi'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyToClipboard(pw, u.username)}
                            className={`p-1 rounded transition-colors ${
                              isCopied
                                ? 'text-emerald-600 bg-emerald-100'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                            }`}
                            title="Salin Sandi ke Clipboard"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* 4. Email */}
                      <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">
                        {u.email}
                      </td>

                      {/* 5. Status Akun */}
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

                      {/* 6. Last Login */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {u.last_login_at
                          ? new Date(u.last_login_at).toLocaleString('id-ID', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : 'Belum pernah'}
                      </td>

                      {/* 7. Action Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View Detail */}
                          <button
                            onClick={() => {
                              setSelectedUser(u)
                              setIsDetailModalOpen(true)
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Lihat Detail Lengkap"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Set/Change Password */}
                          <button
                            onClick={() => handleOpenPasswordModal(u)}
                            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                            title="Ubah / Set Kata Sandi Baru"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit User Profile */}
                          <button
                            onClick={() => handleOpenEditUserModal(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Edit Data Akun (Nama, Email, Kampus)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Access (to default OGSO2026) */}
                          {u.role !== 'super_admin' && (
                            <button
                              onClick={() => handleResetAccess(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title="Reset Sandi ke 'OGSO2026'"
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
                                  ? 'text-slate-400 hover:text-rose-700 hover:bg-rose-50'
                                  : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
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
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Detail Akun Lengkap & Password */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-[#166534] to-[#0F3D20] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
                <h3 className="font-bold text-sm">Informasi Kredensial Akun</h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-white/80 hover:text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5 uppercase tracking-wider font-bold text-[10px]">Nama Pengguna (Username):</span>
                <span className="font-bold text-slate-800 text-sm font-mono">{selectedUser.username}</span>
              </div>

              {/* Password Highlight Card */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                  Kata Sandi Akun Saat Ini:
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-black text-sm text-[#166534]">
                    {passwords[selectedUser.username] || (selectedUser.role === 'super_admin' ? 'OGSOreg_SuperAdmin2026!' : 'OGSO2026')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2.5 bg-white border-emerald-300 text-emerald-800"
                    onClick={() =>
                      handleCopyToClipboard(
                        passwords[selectedUser.username] || (selectedUser.role === 'super_admin' ? 'OGSOreg_SuperAdmin2026!' : 'OGSO2026'),
                        'detail-pwd'
                      )
                    }
                    leftIcon={copiedKey === 'detail-pwd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copiedKey === 'detail-pwd' ? 'Tersalin!' : 'Salin Sandi'}
                  </Button>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Nama Tampilan:</span>
                <span className="font-semibold text-slate-800">{selectedUser.display_name}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Peran Sistem:</span>
                <span className="font-bold text-[#166534]">
                  {selectedUser.role === 'super_admin' ? 'Super Admin (Akses Penuh)' : 'Admin Kampus'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Penugasan Kampus:</span>
                <span className="font-bold text-slate-800">
                  {selectedUser.campus_id || 'Seluruh 20 Kampus (Global Super Admin)'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Email Kontak:</span>
                <span className="font-mono text-slate-800">{selectedUser.email}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Status Akun:</span>
                <span className={selectedUser.is_active ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                  {selectedUser.is_active ? '✓ Aktif & Dapat Login' : '✕ Nonaktif'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDetailModalOpen(false)
                  handleOpenPasswordModal(selectedUser)
                }}
                leftIcon={<KeyRound className="w-3.5 h-3.5 mr-1 text-amber-600" />}
                className="text-xs"
              >
                Ubah Sandi Ini
              </Button>

              <Button variant="secondary" size="sm" onClick={() => setIsDetailModalOpen(false)} className="text-xs">
                Tutup Jendela
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Ubah / Set Kata Sandi Baru */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-200" />
                <h3 className="font-bold text-sm">Ubah Kata Sandi Akun</h3>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-white/80 hover:text-white text-xs font-semibold"
              >
                Batal
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px]">Akun yang akan diubah:</span>
                <p className="font-mono font-bold text-slate-900 text-sm">{selectedUser.username}</p>
                <p className="text-slate-600 text-[11px]">{selectedUser.display_name}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
                  Kata Sandi Baru
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru (min. 6 karakter)"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-500 block">Pilihan Cepat:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPassword('OGSO2026')}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  >
                    Gunakan Sandi Standar (OGSO2026)
                  </button>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Acak Sandi Kuat
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="text-xs bg-amber-600 hover:bg-amber-700 border-none font-bold text-white shadow-sm"
                >
                  Simpan Kata Sandi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Data Akun (Nama, Email, Kampus) */}
      {isEditUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-[#166534] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#22C55E]" />
                <h3 className="font-bold text-sm">Edit Profil Akun Pengguna</h3>
              </div>
              <button
                onClick={() => setIsEditUserModalOpen(false)}
                className="text-white/80 hover:text-white text-xs font-semibold"
              >
                Batal
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Nama Pengguna (Username):
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedUser.username}
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nama Tampilan (Display Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Contoh: Admin Gontor 1"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Alamat Email Kontak <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="admin@ogso.gontor.ac.id"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                />
              </div>

              {selectedUser.role !== 'super_admin' && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Wewenang Kampus Gontor
                  </label>
                  <select
                    value={editCampus}
                    onChange={(e) => setEditCampus(e.target.value as StudentKampus)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  >
                    <option value="">-- Pilih Kampus --</option>
                    {KAMPUS_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="text-xs bg-[#166534] hover:bg-[#14532D]"
                >
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Tambah Akun Pengguna Baru */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-[#166534] to-[#0F3D20] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#22C55E]" />
                <h3 className="font-bold text-sm">Tambah Akun Pengguna Baru</h3>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-white/80 hover:text-white text-xs font-semibold"
              >
                Batal
              </button>
            </div>

            <form onSubmit={handleSaveAddUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nama Pengguna (Username) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value.toLowerCase().trim())}
                  placeholder="Contoh: gontor13, panitia_pusat"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nama Tampilan (Display Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addDisplayName}
                  onChange={(e) => setAddDisplayName(e.target.value)}
                  placeholder="Contoh: Admin Gontor 13"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Email Kontak <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="admin@ogso.gontor.ac.id"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Peran (Role)
                  </label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as AppUserRole)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  >
                    <option value="campus_admin">Admin Kampus</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Kampus Gontor
                  </label>
                  <select
                    value={addCampus}
                    disabled={addRole === 'super_admin'}
                    onChange={(e) => setAddCampus(e.target.value as StudentKampus)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E] disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">-- {addRole === 'super_admin' ? 'Seluruh Kampus' : 'Pilih Kampus'} --</option>
                    {KAMPUS_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Kata Sandi Awal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  placeholder="Default: OGSO2026"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Sandi ini dapat dilihat dan diubah kembali oleh Super Admin sewaktu-waktu.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="text-xs bg-[#166534] hover:bg-[#14532D]"
                >
                  Buat Akun Pengguna
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
