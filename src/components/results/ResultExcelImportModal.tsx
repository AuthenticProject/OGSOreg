import React, { useState, useRef } from 'react'
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Download,
  ArrowRight,
  ArrowLeft,
  Search,
  Check,
  RefreshCw,
  Trophy,
} from 'lucide-react'
import { Button } from '../ui/Button'
import {
  resultExcelImportService,
  type ImportPreviewAnalysis,
} from '../../services/resultExcelImportService'
import type { StudentMatchingResult, MatchStatus } from '../../types/competitionResult'

interface ResultExcelImportModalProps {
  isOpen: boolean
  onClose: () => void
  periodId: string
  periodName: string
  accessCampus?: string | null
  adminUsername: string
  onImportComplete: () => void
}

export const ResultExcelImportModal: React.FC<ResultExcelImportModalProps> = ({
  isOpen,
  onClose,
  periodId,
  periodName,
  accessCampus,
  adminUsername,
  onImportComplete,
}) => {
  if (!isOpen) return null

  // Workflow steps: 1 = Upload, 2 = Match & Preview, 3 = Summary & Confirm, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [file, setFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Analysis result
  const [analysis, setAnalysis] = useState<ImportPreviewAnalysis | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | MatchStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Overridden user selections for ambiguous rows
  const [resolvedAmbiguous, setResolvedAmbiguous] = useState<Record<number, string>>({}) // rowNumber -> studentId
  const [ignoredRowNumbers, setIgnoredRowNumbers] = useState<Set<number>>(new Set())

  // Commit result
  const [commitResult, setCommitResult] = useState<{ successCount: number; errors: string[] } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownloadTemplate = async () => {
    try {
      const blob = await resultExcelImportService.generateImportTemplate(periodName)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Template_Hasil_${periodName.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Gagal mengunduh template Excel')
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      await processSelectedFile(selected)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) {
      await processSelectedFile(dropped)
    }
  }

  const processSelectedFile = async (f: File) => {
    setFile(f)
    setIsParsing(true)
    setError(null)

    try {
      const parsed = await resultExcelImportService.parseExcelFile(f)
      if (parsed.rows.length === 0) {
        throw new Error('File Excel tidak memiliki baris data yang valid.')
      }

      const analyzed = resultExcelImportService.matchAndAnalyzeRows(parsed.rows, periodId, accessCampus)
      setAnalysis(analyzed)
      setStep(2)
    } catch (err: any) {
      setError(err?.message || 'Gagal memproses file Excel')
    } finally {
      setIsParsing(false)
    }
  }

  const toggleIgnoreRow = (rowNumber: number) => {
    setIgnoredRowNumbers((prev) => {
      const next = new Set(prev)
      if (next.has(rowNumber)) {
        next.delete(rowNumber)
      } else {
        next.add(rowNumber)
      }
      return next
    })
  }

  const handleResolveAmbiguous = (rowNumber: number, studentId: string) => {
    setResolvedAmbiguous((prev) => ({ ...prev, [rowNumber]: studentId }))
  }

  // Filtered preview items
  const filteredItems = (analysis?.items || []).filter((item) => {
    if (statusFilter !== 'all' && item.matchStatus !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const rawName = String(item.rawRow['Nama Santri'] || item.rawRow['Nama'] || '').toLowerCase()
      const rawUser = String(item.rawRow['Username'] || item.rawRow['NISN'] || '').toLowerCase()
      const matchedName = item.matchedStudent?.full_name?.toLowerCase() || ''
      const matchedUser = item.matchedStudent?.username?.toLowerCase() || ''
      return rawName.includes(q) || rawUser.includes(q) || matchedName.includes(q) || matchedUser.includes(q)
    }
    return true
  })

  // Final eligible items to commit
  const eligibleItemsToCommit: StudentMatchingResult[] = (analysis?.items || [])
    .filter((item) => !ignoredRowNumbers.has(item.rowNumber))
    .map((item) => {
      if (item.matchStatus === 'AMBIGUOUS' && resolvedAmbiguous[item.rowNumber]) {
        const studentId = resolvedAmbiguous[item.rowNumber]
        const matched = item.candidateStudents?.find((s) => s.id === studentId)
        return {
          ...item,
          matchStatus: 'MATCHED' as MatchStatus,
          matchedStudent: matched,
          selectedStudentId: studentId,
        }
      }
      return item
    })
    .filter((item) => item.matchedStudent || item.selectedStudentId)

  const handleCommit = async () => {
    if (eligibleItemsToCommit.length === 0) {
      alert('Tidak ada baris terverifikasi untuk disimpan.')
      return
    }

    setIsCommitting(true)
    setError(null)

    try {
      const res = await resultExcelImportService.commitImport(periodId, eligibleItemsToCommit, adminUsername)
      setCommitResult(res)
      setStep(4)
      onImportComplete()
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan hasil impor')
    } finally {
      setIsCommitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-800 to-green-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Impor Hasil Kompetisi Excel</h3>
              <p className="text-xs text-emerald-100 font-medium">Periode: {periodName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-gray-50 border-b border-gray-200 text-xs text-gray-600 shrink-0">
          <div className="flex items-center gap-6">
            <span className={`flex items-center gap-1.5 ${step === 1 ? 'font-bold text-emerald-800' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-emerald-700 text-white' : 'bg-gray-200'}`}>1</span>
              Unggah File
            </span>
            <span className={`flex items-center gap-1.5 ${step === 2 ? 'font-bold text-emerald-800' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-emerald-700 text-white' : 'bg-gray-200'}`}>2</span>
              Verifikasi & Pencocokan
            </span>
            <span className={`flex items-center gap-1.5 ${step === 3 ? 'font-bold text-emerald-800' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-emerald-700 text-white' : 'bg-gray-200'}`}>3</span>
              Ringkasan Impor
            </span>
            <span className={`flex items-center gap-1.5 ${step === 4 ? 'font-bold text-emerald-800' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 4 ? 'bg-emerald-700 text-white' : 'bg-gray-200'}`}>4</span>
              Selesai
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadTemplate}
            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 text-xs flex items-center gap-1 py-1"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh Template Excel
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Upload File */}
          {step === 1 && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-10 text-center cursor-pointer bg-gray-50/50 hover:bg-emerald-50/20 transition-all flex flex-col items-center justify-center gap-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 shadow-sm">
                  {isParsing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-base">
                    {isParsing ? 'Membaca data Excel...' : 'Pilih atau Tarik File Excel ke Sini'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Mendukung format .xlsx, .xls, dan .csv
                  </p>
                </div>
              </div>

              {/* Supported columns guide */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
                <h4 className="font-bold text-xs text-emerald-900 uppercase tracking-wider">
                  Petunjuk Kolom yang Dikenali Otomatis:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-bold text-gray-800">Nama Santri:</span> Nama / Name
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">Username:</span> NISN / NIS / No Induk
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">Kampus:</span> Cabang / Pondok
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">Status Hasil:</span> Juara / Lolos Final / Peserta
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">Kategori Juara:</span> Juara 1, 2, 3, Harapan 1, 2
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">Peringkat:</span> 1, 2, 3...
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700 italic pt-1">
                  * Kolom Username atau NISN sangat diprioritaskan untuk menjamin akurasi santri agar tidak tertukar dengan nama yang sama.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Match & Verification */}
          {step === 2 && analysis && (
            <div className="space-y-4">
              {file && (
                <div className="text-xs text-gray-500 font-medium">
                  Berkas terpilih: <span className="font-semibold text-gray-800">{file.name}</span>
                </div>
              )}
              {/* Stats badges */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-center">
                  <span className="text-[11px] text-gray-500 block">Total Baris</span>
                  <span className="text-base font-bold text-gray-800">{analysis.totalRows}</span>
                </div>
                <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl text-center">
                  <span className="text-[11px] text-green-700 block">Cocok (Matched)</span>
                  <span className="text-base font-bold text-green-800">{analysis.matchedCount}</span>
                </div>
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <span className="text-[11px] text-amber-700 block">Ambigu (Pilih)</span>
                  <span className="text-base font-bold text-amber-800">{analysis.ambiguousCount}</span>
                </div>
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-center">
                  <span className="text-[11px] text-red-700 block">Tidak Ditemukan</span>
                  <span className="text-base font-bold text-red-800">{analysis.notFoundCount}</span>
                </div>
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <span className="text-[11px] text-blue-700 block">Pembaruan Data</span>
                  <span className="text-base font-bold text-blue-800">{analysis.existingResultsUpdatedCount}</span>
                </div>
              </div>

              {/* Duplicate notice if any */}
              {analysis.duplicateRowsCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    Ditemukan <strong>{analysis.duplicateRowsCount} baris duplikat</strong> di dalam file Excel.
                    Baris kedua yang duplikat otomatis diabaikan untuk menjaga integritas data.
                  </span>
                </div>
              )}

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      statusFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Semua ({analysis.items.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('MATCHED')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      statusFilter === 'MATCHED' ? 'bg-green-700 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    Cocok ({analysis.matchedCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('AMBIGUOUS')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      statusFilter === 'AMBIGUOUS' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    Ambigu ({analysis.ambiguousCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('NOT_FOUND')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      statusFilter === 'NOT_FOUND' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    Tidak Ditemukan ({analysis.notFoundCount})
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari baris..."
                    className="text-xs rounded-lg border border-gray-200 pl-8 pr-3 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none w-48"
                  />
                </div>
              </div>

              {/* Matching Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-100 text-gray-700 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">Sertakan</th>
                      <th className="py-2 px-3 w-12 text-center">Baris</th>
                      <th className="py-2 px-3">Data di Spreadsheet</th>
                      <th className="py-2 px-3">Hasil Pencocokan Sistem</th>
                      <th className="py-2 px-3">Status & Kategori Diusulkan</th>
                      <th className="py-2 px-3">Perubahan (Diff)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredItems.map((item) => {
                      const isIgnored = ignoredRowNumbers.has(item.rowNumber)
                      const isAmbiguous = item.matchStatus === 'AMBIGUOUS'
                      const isNotFound = item.matchStatus === 'NOT_FOUND'

                      return (
                        <tr
                          key={item.rowNumber}
                          className={`hover:bg-gray-50/70 ${isIgnored ? 'opacity-40 bg-gray-50' : ''}`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={!isIgnored && !isNotFound}
                              disabled={isNotFound}
                              onChange={() => toggleIgnoreRow(item.rowNumber)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-gray-500">
                            #{item.rowNumber}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-gray-900">
                              {item.rawRow['Nama Santri'] || item.rawRow['Nama'] || '-'}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {item.rawRow['Username'] || item.rawRow['NISN'] || 'Tanpa Username'} • {item.rawRow['Kampus'] || '-'}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            {item.matchStatus === 'MATCHED' && item.matchedStudent && (
                              <div>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full mb-0.5">
                                  <Check className="w-3 h-3" /> Cocok
                                </span>
                                <div className="font-medium text-gray-800">{item.matchedStudent.full_name}</div>
                                <div className="text-[10px] text-gray-500">{item.matchedStudent.username} ({item.matchedStudent.kampus})</div>
                              </div>
                            )}

                            {isAmbiguous && (
                              <div>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mb-1">
                                  <AlertTriangle className="w-3 h-3" /> Ambigu (Pilih)
                                </span>
                                <select
                                  value={resolvedAmbiguous[item.rowNumber] || ''}
                                  onChange={(e) => handleResolveAmbiguous(item.rowNumber, e.target.value)}
                                  className="w-full text-[11px] rounded border border-amber-300 py-1 px-1.5 bg-amber-50/50 text-gray-800 font-medium"
                                >
                                  <option value="">-- Pilih Santri yang Tepat --</option>
                                  {(item.candidateStudents || []).map((cand) => (
                                    <option key={cand.id} value={cand.id}>
                                      {cand.full_name} ({cand.username} - {cand.kampus})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {isNotFound && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3" /> Santri Tidak Ditemukan
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                                item.proposedResult.result_status === 'juara'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : item.proposedResult.result_status === 'finalis'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {item.proposedResult.result_status}
                            </span>
                            {item.proposedResult.award_category && (
                              <div className="font-semibold text-amber-900 text-[11px] mt-0.5">
                                {item.proposedResult.award_category} {item.proposedResult.champion_rank ? `(#${item.proposedResult.champion_rank})` : ''}
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            {item.diff && item.diff.length > 0 ? (
                              <div className="space-y-0.5">
                                {item.diff.map((d, dIdx) => (
                                  <div key={dIdx} className="text-[10px]">
                                    <span className="text-gray-400 line-through">{d.oldValue}</span>
                                    <span className="text-emerald-700 font-bold ml-1">→ {d.newValue}</span>
                                  </div>
                                ))}
                              </div>
                            ) : item.existingResult ? (
                              <span className="text-[11px] text-gray-400">Tidak ada perubahan</span>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-medium">Hasil Baru</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: Summary before confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-700 text-white rounded-xl">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 text-base">Konfirmasi Penyimpanan Hasil Impor</h4>
                    <p className="text-xs text-emerald-800">
                      Hasil akan disimpan untuk periode <strong>{periodName}</strong>. Periode lain tidak akan terpengaruh.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 text-center">
                    <span className="text-xs text-gray-500 block">Total Disimpan</span>
                    <span className="text-xl font-black text-emerald-800">{eligibleItemsToCommit.length}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 text-center">
                    <span className="text-xs text-gray-500 block">Juara Baru/Diperbarui</span>
                    <span className="text-xl font-black text-amber-600">
                      {eligibleItemsToCommit.filter((i) => i.proposedResult.is_champion).length}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 text-center">
                    <span className="text-xs text-gray-500 block">Finalis Baru/Diperbarui</span>
                    <span className="text-xl font-black text-blue-600">
                      {eligibleItemsToCommit.filter((i) => i.proposedResult.is_finalist && !i.proposedResult.is_champion).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-700">Pemeriksaan Keamanan Data:</p>
                <p>• Data santri (nama, username, NISN, kelas) tidak akan diubah atau dihapus.</p>
                <p>• Riwayat juara di periode lain (misal: OGSO 2025) tetap tersimpan utuh dan terisolasi.</p>
                <p>• Rekapitulasi Excel 3-Sheet dan Hall of Fame akan otomatis terbarui secara sinkron.</p>
              </div>
            </div>
          )}

          {/* STEP 4: Success Complete */}
          {step === 4 && commitResult && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle className="w-9 h-9" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-xl">Impor Hasil Berhasil!</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Sebanyak <strong>{commitResult.successCount} hasil santri</strong> telah berhasil disimpan ke database periode <strong>{periodName}</strong>.
                </p>
              </div>

              {commitResult.errors.length > 0 && (
                <div className="max-w-md mx-auto p-3 bg-amber-50 border border-amber-200 rounded-lg text-left text-xs text-amber-800">
                  <p className="font-bold mb-1">Catatan Pengecualian:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {commitResult.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 shrink-0">
          {step === 1 && (
            <>
              <Button variant="outline" size="sm" onClick={onClose}>
                Batal
              </Button>
              <div />
            </>
          )}

          {step === 2 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Ganti File
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={eligibleItemsToCommit.length === 0}
                onClick={() => setStep(3)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5"
              >
                Lanjutkan Ringkasan ({eligibleItemsToCommit.length})
                <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(2)}
                disabled={isCommitting}
                className="flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Verifikasi
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isCommitting || eligibleItemsToCommit.length === 0}
                onClick={handleCommit}
                className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5"
              >
                {isCommitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menyimpan ke Database...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Simpan {eligibleItemsToCommit.length} Hasil
                  </>
                )}
              </Button>
            </>
          )}

          {step === 4 && (
            <div className="w-full flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={onClose}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Selesai & Tutup
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
