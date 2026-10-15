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

  // Manual form state
  const [manualForm, setManualForm] = useState({
    username: '',
    firstname: '',
    lastname: '',
    email: '',
    jenjang: 'Kelas 1' as MoodleJenjang,
  })
  const [manualFormError, setManualFormError] = useState<string | null>(null)

  const {
    handleFileUpload,
    handlePasteFromSpreadsheet,
    addManualRow,
    isParsing,
    parseError,
  } = useImportStore()

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

    if (!manualForm.username.trim()) {
      setManualFormError('Username wajib diisi.')
      return
    }
    if (!manualForm.firstname.trim()) {
      setManualFormError('Nama depan wajib diisi.')
      return
    }
    if (!manualForm.lastname.trim()) {
      setManualFormError('Nama belakang wajib diisi.')
      return
    }
    if (!manualForm.email.trim()) {
      setManualFormError('Email wajib diisi.')
      return
    }

    addManualRow(manualForm)
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
              placeholder="Contoh:&#10;ahmad01&#9;Ahmad&#9;Faiz&#9;ahmad.faiz@example.com&#9;Kelas 1&#10;siti02&#9;Siti&#9;Rahma&#9;siti.rahma@example.com&#9;Kelas 2"
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
          <form onSubmit={handleAddManualParticipant} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="contoh: ahmad_faiz"
                  value={manualForm.username}
                  onChange={(e) => setManualForm({ ...manualForm, username: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:ring-2 focus:ring-brand-maroon focus:outline-none"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  ID akun login di LMS Moodle (tanpa spasi).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Jenjang <span className="text-rose-500">*</span>
                </label>
                <select
                  value={manualForm.jenjang}
                  onChange={(e) => setManualForm({ ...manualForm, jenjang: e.target.value as MoodleJenjang })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:ring-2 focus:ring-brand-maroon focus:outline-none bg-white"
                >
                  {MOODLE_JENJANG_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Pilih tingkat kelas (Kelas 1–5).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nama Depan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nama awal siswa"
                  value={manualForm.firstname}
                  onChange={(e) => setManualForm({ ...manualForm, firstname: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:ring-2 focus:ring-brand-maroon focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nama Belakang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nama akhir / marga siswa"
                  value={manualForm.lastname}
                  onChange={(e) => setManualForm({ ...manualForm, lastname: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:ring-2 focus:ring-brand-maroon focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="user@sekolah.sch.id"
                  value={manualForm.email}
                  onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:ring-2 focus:ring-brand-maroon focus:outline-none"
                />
              </div>
            </div>

            {manualFormError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{manualFormError}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
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
