import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  AlertCircle,
  Loader2,
  ClipboardPaste,
  UserPlus,
  Info,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { SectionCard } from '../ui/SectionCard'
import { useImportStore } from '../../stores/importStore'
import { MOODLE_JENJANG_OPTIONS, type MoodleJenjang } from '../../types/excel'
import { KAMPUS_OPTIONS } from '../../types/campus'
import { customFieldService } from '../../services/customFieldService'
import type { CustomFieldDefinition } from '../../types/customField'
import { useAuth } from '../../context/AuthContext'
import { STANDARD_FIELD_KEYS } from '../../services/validationEngine'

interface FileDropzoneProps {
  onBackToTemplate?: () => void
}

type InputMethodTab = 'UPLOAD' | 'PASTE' | 'MANUAL'

export const FileDropzone: React.FC<FileDropzoneProps> = () => {
  const [activeTab, setActiveTab] = useState<InputMethodTab>('UPLOAD')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [pasteText, setPasteText] = useState('')
  const [pasteError, setPasteError] = useState<string | null>(null)

  const { assignedCampus, isSuperAdmin } = useAuth()
  const {
    handleFileUpload,
    handlePasteFromSpreadsheet,
    addManualRow,
    isParsing,
    parseError,
    accessControl,
  } = useImportStore()

  const [activeCustomFields, setActiveCustomFields] = useState<CustomFieldDefinition[]>(() =>
    customFieldService.getActiveFieldsSync()
  )

  React.useEffect(() => {
    return customFieldService.subscribe((fields) => {
      setActiveCustomFields(
        fields.filter(
          (f) =>
            f.is_active &&
            !STANDARD_FIELD_KEYS.includes(f.key.toLowerCase().trim()) &&
            !STANDARD_FIELD_KEYS.includes(f.label.toLowerCase().trim())
        )
      )
    })
  }, [])

  const defaultCampus = accessControl?.assignedCampus || assignedCampus || 'Gontor 1'
  const isLockedCampus = Boolean((accessControl?.assignedCampus || assignedCampus) && !isSuperAdmin)

  // Manual form state
  const [manualForm, setManualForm] = useState({
    username: '',
    firstname: '',
    lastname: '',
    email: '',
    jenjang: 'Jenjang 1' as MoodleJenjang,
    kampus: defaultCampus,
    kelas: '',
    daerah: '',
    stambuk: '',
    custom_fields: {} as Record<string, any>,
  })
  const [manualFormError, setManualFormError] = useState<string | null>(null)

  React.useEffect(() => {
    if (defaultCampus && (!manualForm.kampus || manualForm.kampus === 'Gontor 1')) {
      setManualForm((prev) => ({ ...prev, kampus: defaultCampus }))
    }
  }, [defaultCampus])

  const validateAndProcessFile = (file: File) => {
    setLocalError(null)

    const fileName = file.name.toLowerCase()
    const isSupported =
      fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')

    if (!isSupported) {
      setLocalError(
        'Format berkas tidak didukung. Harap unggah berkas Microsoft Excel (.xlsx / .xls) atau Comma-Separated Values (.csv).'
      )
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setLocalError(
        `Ukuran berkas (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal 10 MB.`
      )
      return
    }

    handleFileUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0])
    }
  }

  const handleProcessPaste = () => {
    setPasteError(null)
    if (!pasteText.trim()) {
      setPasteError('Silakan tempelkan data spreadsheet terlebih dahulu.')
      return
    }

    const result = handlePasteFromSpreadsheet(pasteText)
    if (!result.success) {
      setPasteError(result.error || 'Gagal memproses data tempelan.')
    }
  }

  const handleAddManualParticipant = (e: React.FormEvent) => {
    e.preventDefault()
    setManualFormError(null)

    const u = manualForm.username.trim()
    const fn = manualForm.firstname.trim()
    const ln = manualForm.lastname.trim()
    const em = manualForm.email.trim()
    const jn = manualForm.jenjang.trim()
    const kp = (manualForm.kampus || defaultCampus).trim()
    const kl = manualForm.kelas.trim()
    const dr = manualForm.daerah.trim()
    const stb = manualForm.stambuk.trim()

    if (!u) {
      setManualFormError('Username wajib diisi.')
      return
    }
    if (/\s/.test(u)) {
      setManualFormError('Username tidak boleh mengandung spasi (gunakan huruf kecil, angka, atau garis bawah).')
      return
    }
    if (!fn) {
      setManualFormError('Nama depan wajib diisi.')
      return
    }
    if (!ln) {
      setManualFormError('Nama belakang wajib diisi.')
      return
    }
    if (!em) {
      setManualFormError('Alamat email wajib diisi.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setManualFormError('Format alamat email tidak valid (contoh: santri@gontor.ac.id atau nama@ogso.ac.id).')
      return
    }
    if (!jn) {
      setManualFormError('Jenjang perlombaan wajib dipilih.')
      return
    }
    if (!kp) {
      setManualFormError('Kampus wajib dipilih.')
      return
    }
    if (!kl) {
      setManualFormError('Kelas santri wajib diisi (contoh: 5-B, 3-C atau untuk intensif: 3 int F, 1 int C).')
      return
    }

    // Check custom fields that may be required
    const daerahField = activeCustomFields.find((f) => f.key === 'daerah')
    if (daerahField?.is_required && !dr) {
      setManualFormError('Daerah / Asal Konsulat wajib diisi.')
      return
    }
    const stambukField = activeCustomFields.find((f) => f.key === 'stambuk')
    if (stambukField?.is_required && !stb) {
      setManualFormError('Nomor Stambuk santri wajib diisi.')
      return
    }

    for (const cf of activeCustomFields) {
      if (cf.key !== 'daerah' && cf.key !== 'stambuk' && cf.is_required) {
        const val = manualForm.custom_fields[cf.key]
        if (!val || String(val).trim() === '') {
          setManualFormError(`${cf.label} wajib diisi.`)
          return
        }
      }
    }

    addManualRow({
      username: u,
      firstname: fn,
      lastname: ln,
      email: em,
      jenjang: jn,
      kampus: kp,
      kelas: kl,
      daerah: dr,
      stambuk: stb,
      custom_fields: {
        ...(manualForm.custom_fields || {}),
        daerah: dr,
        stambuk: stb,
        kelas: kl,
        jenjang: jn,
        kampus: kp,
        username: u,
        email: em,
      },
    })
  }

  const currentError = localError || parseError

  return (
    <div className="space-y-6">
      <SectionCard
        title="Langkah 1: Sumber Data Pendaftaran"
        subtitle="Pilih metode input yang paling sesuai: Unggah berkas Excel/CSV, tempel langsung dari spreadsheet, atau ketik manual."
      >
        {/* Method Selector Tabs */}
        <div className="flex border-b border-border mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('UPLOAD')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'UPLOAD'
                ? 'border-[#166534] text-[#166534] bg-[#DCFCE7]/30'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Unggah Berkas (Excel / CSV)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PASTE')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'PASTE'
                ? 'border-[#166534] text-[#166534] bg-[#DCFCE7]/30'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            Tempel dari Spreadsheet (Paste)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MANUAL')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'MANUAL'
                ? 'border-[#166534] text-[#166534] bg-[#DCFCE7]/30'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Input Manual Peserta
          </button>
        </div>

        {/* TAB 1: FILE DROPZONE */}
        {activeTab === 'UPLOAD' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isParsing && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-[#166534] bg-[#DCFCE7]/30 ring-4 ring-[#22C55E]/20'
                  : currentError
                  ? 'border-rose-300 bg-rose-50/50 hover:bg-rose-50'
                  : 'border-slate-300 hover:border-[#166534]/60 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              {isParsing ? (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center animate-pulse">
                    <Loader2 className="w-7 h-7 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground">
                      Membaca & Memvalidasi Berkas...
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mengekstrak baris data dan memeriksa integritas kolom secara otomatis.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3.5">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                      dragActive
                        ? 'bg-[#166534] text-white scale-110'
                        : 'bg-white border border-slate-200 text-[#166534]'
                    } transition-transform`}
                  >
                    <UploadCloud className="w-7 h-7" />
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-foreground">
                      Pilih atau Seret Berkas ke Area Ini
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                      Mendukung format Microsoft Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) dan Comma-Separated Values (<strong>.csv</strong>) hingga 10 MB.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button variant="outline" size="sm" type="button">
                      Pilih Berkas dari Komputer
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {currentError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-rose-950">Gagal Memproses Berkas</p>
                  <p>{currentError}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PASTE SPREADSHEET */}
        {activeTab === 'PASTE' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <p className="font-semibold">Cara Menggunakan Fitur Tempel Spreadsheet:</p>
                <p>
                  Buka file Excel atau Google Sheets Anda, blok baris data peserta (dengan atau tanpa baris header), tekan <code>Ctrl+C</code>, lalu tempelkan (<code>Ctrl+V</code>) ke kotak teks di bawah ini.
                </p>
                <p className="font-mono text-[11px] bg-white/70 p-2 rounded border border-amber-200 text-slate-800">
                  Username | Nama Depan | Nama Belakang | Email | Jenjang
                </p>
              </div>
            </div>

            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Contoh:&#10;ahmad01&#9;Ahmad&#9;Faiz&#9;ahmad.faiz@example.com&#9;Jenjang 1&#10;siti02&#9;Siti&#9;Rahma&#9;siti.rahma@example.com&#9;Jenjang 2"
              className="w-full p-3 text-xs font-mono rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-brand-maroon bg-white"
            />

            {pasteError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pasteError}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {pasteText ? `${pasteText.split('\n').filter(Boolean).length} baris teks terdeteksi` : 'Kotak tempel siap'}
              </span>

              <Button
                variant="primary"
                size="sm"
                onClick={handleProcessPaste}
                leftIcon={<ClipboardPaste className="w-4 h-4 mr-1.5" />}
              >
                Proses Data Tempelan
              </Button>
            </div>
          </div>
        )}

        {/* TAB 3: MANUAL FORM */}
        {activeTab === 'MANUAL' && (
          <form onSubmit={handleAddManualParticipant} className="space-y-5">
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#166534]">Form Pendaftaran Manual Santri</p>
                <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                  Lengkapi data santri peserta sesuai kolom resmi (Username, Nama, Email, Jenjang, Kampus, Kelas, Daerah, dan Stambuk). Data yang disimpan akan langsung masuk ke tabel pratinjau & validasi.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Username */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="contoh: ahmad_faiz"
                  value={manualForm.username}
                  onChange={(e) => setManualForm({ ...manualForm, username: e.target.value.toLowerCase().trim() })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:ring-2 focus:ring-[#166534] focus:outline-none font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  ID akun login di LMS Moodle (tanpa spasi).
                </p>
              </div>

              {/* 2. Nama Depan */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nama Depan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nama awal santri"
                  value={manualForm.firstname}
                  onChange={(e) => setManualForm({ ...manualForm, firstname: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:ring-2 focus:ring-[#166534] focus:outline-none"
                />
              </div>

              {/* 3. Nama Belakang */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nama Belakang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nama akhir / marga santri"
                  value={manualForm.lastname}
                  onChange={(e) => setManualForm({ ...manualForm, lastname: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:ring-2 focus:ring-[#166534] focus:outline-none"
                />
              </div>

              {/* 4. Email */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="santri@gontor.ac.id"
                  value={manualForm.email}
                  onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:ring-2 focus:ring-[#166534] focus:outline-none font-mono"
                />
              </div>

              {/* 5. Jenjang */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Jenjang <span className="text-rose-500">*</span>
                </label>
                <select
                  value={manualForm.jenjang}
                  onChange={(e) => setManualForm({ ...manualForm, jenjang: e.target.value as MoodleJenjang })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:ring-2 focus:ring-[#166534] focus:outline-none bg-white font-medium"
                >
                  {MOODLE_JENJANG_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Pilih tingkat jenjang perlombaan (Jenjang 1–5).
                </p>
              </div>

              {/* 6. Kampus */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Kampus <span className="text-rose-500">*</span>
                </label>
                <select
                  value={manualForm.kampus}
                  disabled={isLockedCampus}
                  onChange={(e) => setManualForm({ ...manualForm, kampus: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:ring-2 focus:ring-[#166534] focus:outline-none bg-white font-medium disabled:bg-slate-100 disabled:text-slate-600"
                >
                  {KAMPUS_OPTIONS.map((kp) => (
                    <option key={kp} value={kp}>
                      {kp}
                    </option>
                  ))}
                </select>
                {isLockedCampus ? (
                  <p className="text-[10px] text-emerald-700 font-medium mt-1">
                    Terkunci otomatis ke kontingen Anda ({manualForm.kampus}).
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Pilih salah satu dari 20 Kampus Resmi Gontor.
                  </p>
                )}
              </div>

              {/* 7. Kelas */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Kelas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="contoh: 5-B, 3-C, 3 int F"
                  value={manualForm.kelas}
                  onChange={(e) => setManualForm({ ...manualForm, kelas: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:ring-2 focus:ring-[#166534] focus:outline-none font-medium"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Format: angka-abjad (misal: 5-B) atau intensif (misal: 3 int F).
                </p>
              </div>

              {/* 8. Daerah */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Daerah / Konsulat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="contoh: Banyuwangi, Konsulat Surabaya"
                  value={manualForm.daerah}
                  onChange={(e) => setManualForm({ ...manualForm, daerah: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:ring-2 focus:ring-[#166534] focus:outline-none"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Asal konsulat atau daerah santri.
                </p>
              </div>

              {/* 9. Stambuk */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nomor Stambuk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="contoh: 67845"
                  value={manualForm.stambuk}
                  onChange={(e) => setManualForm({ ...manualForm, stambuk: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:ring-2 focus:ring-[#166534] focus:outline-none font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Nomor induk santri (Stambuk).
                </p>
              </div>

              {/* Extra Dynamic Custom Fields (if configured beyond Daerah & Stambuk) */}
              {activeCustomFields
                .filter((cf) => cf.key !== 'daerah' && cf.key !== 'stambuk')
                .map((cf) => (
                  <div key={cf.id}>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {cf.label} {cf.is_required && <span className="text-rose-500">*</span>}
                    </label>
                    {cf.field_type === 'dropdown' && cf.options && cf.options.length > 0 ? (
                      <select
                        value={manualForm.custom_fields[cf.key] || ''}
                        onChange={(e) =>
                          setManualForm({
                            ...manualForm,
                            custom_fields: { ...manualForm.custom_fields, [cf.key]: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:ring-2 focus:ring-[#166534] focus:outline-none bg-white font-medium"
                      >
                        <option value="">Pilih {cf.label}</option>
                        {cf.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={cf.field_type === 'number' ? 'number' : cf.field_type === 'email' ? 'email' : 'text'}
                        placeholder={`${cf.label}...`}
                        value={manualForm.custom_fields[cf.key] || ''}
                        onChange={(e) =>
                          setManualForm({
                            ...manualForm,
                            custom_fields: { ...manualForm.custom_fields, [cf.key]: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:ring-2 focus:ring-[#166534] focus:outline-none"
                      />
                    )}
                  </div>
                ))}
            </div>

            {manualFormError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{manualFormError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-[11px] text-muted-foreground">
                Santri yang ditambahkan akan otomatis dianalisis dan divalidasi ke tabel pratinjau.
              </span>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<UserPlus className="w-4 h-4 mr-1.5" />}
              >
                Simpan & Tambah ke Tabel
              </Button>
            </div>
          </form>
        )}
      </SectionCard>
    </div>
  )
}
