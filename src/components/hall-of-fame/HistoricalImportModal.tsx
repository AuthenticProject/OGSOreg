import React, { useState, useId, useRef } from 'react'
import {
  X,
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Check,
  Layers,
} from 'lucide-react'
import { Button } from '../ui/Button'
import {
  downloadHistoricalImportTemplate,
  parseHistoricalExcelFile,
  validateHistoricalRows,
  commitHistoricalImport,
  type HistoricalStagedRow,
  type HistoricalImportValidationResult,
} from '../../services/historicalImportService'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/utils'

interface HistoricalImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const HistoricalImportModal: React.FC<HistoricalImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, isSuperAdmin } = useAuth()
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 1: Upload & Download Template, Step 2: Preview & Validate, Step 3: Finished
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  // Staged data
  const [stagedRows, setStagedRows] = useState<HistoricalStagedRow[]>([])
  const [stats, setStats] = useState<HistoricalImportValidationResult['stats']>({
    total: 0,
    valid: 0,
    warning: 0,
    error: 0,
    individualCount: 0,
    aggregateCount: 0,
  })

  // Filter
  const [activeFilter, setActiveFilter] = useState<'all' | 'error' | 'valid'>('all')

  if (!isOpen) return null

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true)
      await downloadHistoricalImportTemplate()
    } finally {
      setIsDownloading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setIsParsing(true)
    setFileName(file.name)

    try {
      const rows = await parseHistoricalExcelFile(file)
      if (rows.length === 0) {
        setUploadError('File Excel tidak memiliki data baris yang dapat dibaca. Pastikan sheet tidak kosong.')
        setIsParsing(false)
        return
      }

      const { stagedRows: validated, stats: newStats } = validateHistoricalRows(rows)
      setStagedRows(validated)
      setStats(newStats)
      setStep(2)
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Terjadi kendala saat membaca file Excel. Pastikan format file sesuai.'
      )
    } finally {
      setIsParsing(false)
    }
  }

  const handleCommit = async () => {
    try {
      setIsCommitting(true)
      const operatorName = user?.email || (isSuperAdmin ? 'Super Admin' : 'Admin')
      const result = await commitHistoricalImport(stagedRows, fileName || 'Import_Historis.xlsx', operatorName)
      if (result.success) {
        setStep(3)
        onSuccess()
      } else {
        setUploadError('Tidak ada baris valid yang dapat diimpor.')
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Kendala saat menyimpan data.')
    } finally {
      setIsCommitting(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setStagedRows([])
    setFileName(null)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const filteredRows = stagedRows.filter((r) => {
    if (activeFilter === 'error') return r._status === 'ERROR'
    if (activeFilter === 'valid') return r._status === 'VALID' || r._status === 'WARNING'
    return true
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#0C241B] to-[#166534] text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-[#A7F3D0]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Impor Data Historis OGSO dari Excel</h3>
              <p className="text-xs text-emerald-100/80">
                Mendukung rekapitulasi agregat kampus maupun rincian santri juara
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Upload & Download Template */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Template Banner */}
              <div className="p-5 rounded-2xl bg-[#F5F8F4] border border-emerald-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-xs font-bold text-[#166534] flex items-center justify-center sm:justify-start gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#D5C49A]" />
                    <span>Format Standar Template Excel Resmi</span>
                  </div>
                  <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
                    Template menyediakan 2 sheet: (1) <strong>Pemenang Perorangan</strong> untuk hasil santri individual, dan (2) <strong>Rekapitulasi Kampus</strong> untuk arsip agregat tanpa nama perorangan.
                  </p>
                </div>

                <Button
                  onClick={handleDownloadTemplate}
                  disabled={isDownloading}
                  variant="outline"
                  className="border-emerald-600 text-[#166534] hover:bg-emerald-50 shrink-0 text-xs font-bold rounded-xl"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span>{isDownloading ? 'Mengunduh...' : 'Unduh Template Excel'}</span>
                </Button>
              </div>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-slate-300 hover:border-[#166534] rounded-2xl p-8 sm:p-12 text-center transition-colors">
                <input
                  id={fileInputId}
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="space-y-4 max-w-sm mx-auto">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-[#166534] flex items-center justify-center">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0C241B]">
                      Pilih atau Seret File Excel ke Sini
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Mendukung format .xlsx atau .xls dengan validasi otomatis
                    </p>
                  </div>

                  <label
                    htmlFor={fileInputId}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#166534] hover:bg-[#0C241B] transition-all cursor-pointer shadow-xs"
                  >
                    <span>{isParsing ? 'Membaca Berkas...' : 'Pilih Berkas Excel'}</span>
                  </label>
                </div>
              </div>

              {uploadError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Preview & Validate */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold uppercase">Total Baris</div>
                  <div className="text-2xl font-black text-[#0C241B]">{stats.total}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] text-emerald-700 font-bold uppercase">Valid</div>
                  <div className="text-2xl font-black text-[#166534]">{stats.valid}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[11px] text-amber-700 font-bold uppercase">Peringatan</div>
                  <div className="text-2xl font-black text-amber-800">{stats.warning}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
                  <div className="text-[11px] text-red-700 font-bold uppercase">Kesalahan (Skip)</div>
                  <div className="text-2xl font-black text-red-700">{stats.error}</div>
                </div>
              </div>

              {/* Mode Breakdown Notice */}
              <div className="flex items-center justify-between text-xs text-slate-600 bg-[#F5F8F4] p-3 rounded-xl border border-emerald-200/50">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#166534]" />
                  <span>
                    Terdeteksi: <strong>{stats.individualCount}</strong> data perorangan &{' '}
                    <strong>{stats.aggregateCount}</strong> rekapitulasi agregat kampus.
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={cn(
                      'px-2.5 py-1 rounded text-xs font-bold',
                      activeFilter === 'all' ? 'bg-[#166534] text-white' : 'text-slate-600'
                    )}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setActiveFilter('valid')}
                    className={cn(
                      'px-2.5 py-1 rounded text-xs font-bold',
                      activeFilter === 'valid' ? 'bg-[#166534] text-white' : 'text-slate-600'
                    )}
                  >
                    Hanya Siap Impor
                  </button>
                  {stats.error > 0 && (
                    <button
                      onClick={() => setActiveFilter('error')}
                      className={cn(
                        'px-2.5 py-1 rounded text-xs font-bold',
                        activeFilter === 'error' ? 'bg-red-600 text-white' : 'text-red-700'
                      )}
                    >
                      Kesalahan ({stats.error})
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto max-h-[340px] border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Tipe Data</th>
                      <th className="py-2.5 px-3">Periode</th>
                      <th className="py-2.5 px-3">Kampus</th>
                      <th className="py-2.5 px-3">Rincian Prestasi / Santri</th>
                      <th className="py-2.5 px-3">Catatan / Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((row) => (
                      <tr key={row._id} className="hover:bg-slate-50">
                        <td className="py-2 px-3">
                          {row._status === 'VALID' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Valid</span>
                            </span>
                          ) : row._status === 'WARNING' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Warning</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Error</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-medium">
                          {row.mode === 'individual' ? (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold">
                              Perorangan
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 text-[10px] font-bold">
                              Rekap Agregat
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {row.period_name} ({row.year})
                        </td>
                        <td className="py-2 px-3 font-bold text-[#0C241B]">{row.campus}</td>
                        <td className="py-2 px-3">
                          {row.mode === 'individual' ? (
                            <div>
                              <div className="font-bold text-slate-800">{row.student_name}</div>
                              <div className="text-[10px] text-slate-500">
                                {row.award} • {row.category}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] font-mono text-slate-700">
                              🥇{row.gold} 🥈{row.silver} 🥉{row.bronze} H1:{row.honorable_1} H2:{row.honorable_2}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-[11px]">
                          {Object.values(row._errors).length > 0 ? (
                            <span className="text-red-600">{Object.values(row._errors).join(', ')}</span>
                          ) : (
                            <span className="text-emerald-700">Siap diproses</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: Complete */}
          {step === 3 && (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-[#166534] flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-[#0C241B]">Impor Data Historis Berhasil!</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Data arsip berhasil dimasukkan ke dalam basis data Hall of Fame dan telah direkonsiliasi dengan peringkat komparatif 20 kampus.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {step === 2 ? (
            <>
              <Button onClick={handleReset} variant="outline" className="text-xs font-bold rounded-xl">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                <span>Pilih File Lain</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button onClick={onClose} variant="ghost" className="text-xs font-semibold">
                  Batal
                </Button>
                <Button
                  onClick={handleCommit}
                  disabled={isCommitting || stats.valid + stats.warning === 0}
                  className="bg-[#166534] hover:bg-[#0C241B] text-white text-xs font-bold rounded-xl"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  <span>
                    {isCommitting
                      ? 'Menyimpan...'
                      : `Konfirmasi Impor (${stats.valid + stats.warning} Baris)`}
                  </span>
                </Button>
              </div>
            </>
          ) : step === 3 ? (
            <div className="w-full flex justify-end">
              <Button
                onClick={onClose}
                className="bg-[#166534] hover:bg-[#0C241B] text-white text-xs font-bold rounded-xl"
              >
                Selesai
              </Button>
            </div>
          ) : (
            <div className="w-full flex justify-end">
              <Button onClick={onClose} variant="outline" className="text-xs font-semibold rounded-xl">
                Tutup
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
