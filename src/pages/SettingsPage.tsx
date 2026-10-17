import React, { useState, useEffect } from 'react'
import {
  Save,
  Building2,
  MapPin,
  UserCheck,
  PhoneCall,
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Copy,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { SectionCard } from '../components/ui/SectionCard'
import { useAuth } from '../context/AuthContext'
import { KAMPUS_OPTIONS, type StudentKampus } from '../types/campus'
import {
  OFFICIAL_CAMPUS_PROFILES,
  getSavedCampusProfile,
  saveCampusProfile,
  type CampusProfileInfo,
} from '../constants/campusProfiles'
import {
  checkSupabaseHealth,
  type SupabaseHealthStatus,
} from '../services/supabaseStatusService'
import { COMPLETE_DATABASE_SETUP_SQL } from '../constants/databaseSetupSql'

export const SettingsPage: React.FC = () => {
  const { isSuperAdmin, assignedCampus } = useAuth()

  // Tentukan kampus default: jika admin kampus, gunakan kampus akunnya; jika super admin, default Gontor 1
  const defaultCampusKey: StudentKampus = assignedCampus || 'Gontor 1'

  const [selectedCampusKey, setSelectedCampusKey] = useState<StudentKampus>(defaultCampusKey)
  const [formData, setFormData] = useState<CampusProfileInfo>(() =>
    getSavedCampusProfile(defaultCampusKey)
  )
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null)

  // Supabase Database Health State
  const [healthStatus, setHealthStatus] = useState<SupabaseHealthStatus | null>(null)
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)
  const [sqlCopied, setSqlCopied] = useState(false)

  const verifySupabaseHealth = async () => {
    setIsCheckingHealth(true)
    try {
      const res = await checkSupabaseHealth()
      setHealthStatus(res)
    } finally {
      setIsCheckingHealth(false)
    }
  }

  useEffect(() => {
    verifySupabaseHealth()
  }, [])

  const handleCopySqlSetup = async () => {
    try {
      await navigator.clipboard.writeText(COMPLETE_DATABASE_SETUP_SQL)
      setSqlCopied(true)
      setTimeout(() => setSqlCopied(false), 4000)
    } catch {
      // Fallback
      setSqlCopied(false)
    }
  }

  // Update form data jika selectedCampusKey berubah
  useEffect(() => {
    setFormData(getSavedCampusProfile(selectedCampusKey))
    setSaveSuccessMessage(null)
  }, [selectedCampusKey])

  // Sinkronisasi jika login admin kampus terdeteksi
  useEffect(() => {
    if (assignedCampus) {
      setSelectedCampusKey(assignedCampus)
      setFormData(getSavedCampusProfile(assignedCampus))
    }
  }, [assignedCampus])

  const handleSelectCampus = (campusKey: StudentKampus) => {
    setSelectedCampusKey(campusKey)
  }

  const handleResetToOfficial = () => {
    const official = OFFICIAL_CAMPUS_PROFILES[selectedCampusKey]
    setFormData(official)
    saveCampusProfile(official)
    setSaveSuccessMessage(`Data ${selectedCampusKey} dikembalikan ke data resmi gontor.ac.id`)
  }

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    saveCampusProfile(formData)
    setSaveSuccessMessage(`Profil ${formData.campusKey} berhasil disimpan ke sistem.`)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Pengaturan Sistem"
        subtitle="Konfigurasi data institusi kampus, informasi kontak penanggung jawab, dan alamat resmi pendaftaran."
      />

      {saveSuccessMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{saveSuccessMessage}</span>
        </div>
      )}

      <SectionCard
        title="Profil Kampus / Institusi Utama"
        subtitle="Informasi ini dicetak otomatis pada rekap dan kartu peserta."
        action={
          <a
            href="https://gontor.ac.id/kontak-alamat/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60"
          >
            <span>Sumber Alamat Resmi Gontor</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>
        }
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Switcher Kampus (Tersedia bagi Super Admin, atau informasi kampus bagi Admin) */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              {isSuperAdmin ? 'Pilih Kampus yang Dikonfigurasi' : 'Kampus Terdaftar'}
            </label>

            {isSuperAdmin ? (
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <select
                  value={selectedCampusKey}
                  onChange={(e) => handleSelectCampus(e.target.value as StudentKampus)}
                  className="w-full sm:w-80 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                >
                  <optgroup label="Kampus Putra (Gontor 1–12)">
                    {KAMPUS_OPTIONS.slice(0, 12).map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Kampus Putri (Gontor Putri 1–8)">
                    {KAMPUS_OPTIONS.slice(12).map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </optgroup>
                </select>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 mr-1" />}
                  onClick={handleResetToOfficial}
                  title="Kembalikan ke alamat & kontak standar dari gontor.ac.id"
                >
                  Reset Standar Web
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-sm rounded-md border border-emerald-300">
                  {selectedCampusKey}
                </span>
                <span className="text-xs text-muted-foreground">
                  (Ditetapkan sesuai akun login admin kampus)
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {/* Nama Kampus */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Nama Kampus</span>
              </label>
              <input
                type="text"
                value={formData.officialName}
                onChange={(e) => setFormData({ ...formData, officialName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                placeholder="Contoh: Pondok Modern Darussalam Gontor Kampus Pusat (Gontor 1)"
              />
            </div>

            {/* Alamat Kampus */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Alamat Lengkap Kampus</span>
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed"
                placeholder="Alamat resmi kampus sesuai gontor.ac.id/kontak-alamat/"
              />
            </div>

            {/* Penanggung Jawab */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Penanggung Jawab (PIC)</span>
              </label>
              <input
                type="text"
                value={formData.pic}
                onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                placeholder="Contoh: Sekretariat Pimpinan PMDG / Pengasuh Kampus"
              />
            </div>

            {/* No. Telp / WhatsApp */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
                <span>No. Telp / WhatsApp</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                placeholder="Contoh: (0352) 311766 / WA: +62 851-7512-1926"
              />
            </div>
          </div>

          {/* Pratinjau Singkat */}
          <div className="mt-4 p-4 rounded-lg bg-emerald-50/50 border border-emerald-200/80">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 mb-2">
              Pratinjau Data Cetak Rekap & Kartu
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
              <div>
                <span className="text-slate-500 font-medium">Kampus: </span>
                <span className="font-semibold text-slate-900">{formData.officialName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Kontak: </span>
                <span className="font-mono text-slate-900">{formData.phone}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-slate-500 font-medium">Alamat: </span>
                <span className="text-slate-800">{formData.address}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-slate-500 font-medium">PIC: </span>
                <span className="text-slate-800 font-medium">{formData.pic}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Save className="w-4 h-4 mr-1.5" />}
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </SectionCard>

      {/* Status Database Supabase Cloud */}
      <SectionCard
        title="Status Database Supabase Cloud"
        subtitle="Verifikasi keaktifan tabel database cloud dan sinkronisasi data direktori santri."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={verifySupabaseHealth}
            disabled={isCheckingHealth}
            leftIcon={<RotateCcw className={`w-3.5 h-3.5 mr-1 ${isCheckingHealth ? 'animate-spin' : ''}`} />}
          >
            {isCheckingHealth ? 'Memeriksa...' : 'Cek Ulang Status'}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Project URL Supabase
                </span>
                <p className="font-mono text-xs text-slate-800 font-semibold mt-0.5">
                  {healthStatus?.url || 'https://cuunipngguedqttuutaa.supabase.co'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Koneksi API:</span>
                {healthStatus?.connectionOk ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Terhubung
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    Belum Terhubung
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Status Tabel Database Cloud (public.students)
                </span>
                <p className="text-xs text-slate-700 mt-0.5">
                  {healthStatus?.details}
                </p>
              </div>

              <div>
                {healthStatus?.tablesExist ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 whitespace-nowrap">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Tabel Cloud Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 whitespace-nowrap">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Tabel Belum Dibuat di Supabase
                  </span>
                )}
              </div>
            </div>
          </div>

          {!healthStatus?.tablesExist && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Cara Mengaktifkan Tabel Database di Supabase Cloud (1-Klik)
                  </h4>
                  <p className="text-xs text-amber-900/90 leading-relaxed">
                    Kredensial API Supabase sudah valid dan terhubung, namun tabel database (tabel <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">students</code>, <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">institutions</code>, dan <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">user_profiles</code>) belum pernah dijalankan di SQL Editor Supabase.
                    <br />
                    Saat ini seluruh data siswa Anda <strong>tetap tersimpan aman di Penyimpanan Lokal Terpadu (Local Persistence)</strong> dan tidak akan hilang saat logout/berganti akun.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/80">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleCopySqlSetup}
                  leftIcon={sqlCopied ? <CheckCircle2 className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  {sqlCopied ? 'Script SQL Berhasil Disalin!' : 'Salin Script SQL Setup (1-Klik)'}
                </Button>

                <a
                  href="https://supabase.com/dashboard/project/cuunipngguedqttuutaa/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <span>Buka Supabase SQL Editor</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-slate-500" />
                </a>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
