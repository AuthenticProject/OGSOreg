import React from 'react'
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { SectionCard } from '../ui/SectionCard'
import { useImportStore } from '../../stores/importStore'
import { getAllParticipantTargetFields } from '../../services/headerMapper'

export const ColumnMapper: React.FC = () => {
  const {
    workbookData,
    columnMappings,
    updateColumnMapping,
    applyMappings,
    setCurrentStep,
  } = useImportStore()

  if (!workbookData) return null

  const targetFieldsList = getAllParticipantTargetFields()

  // Required fields that must be mapped to proceed
  const requiredTargetFields = targetFieldsList.filter((f) => f.isRequired)
  const mappedTargetFields = new Set(
    columnMappings.map((m) => m.targetField).filter(Boolean)
  )

  const missingRequiredFields = requiredTargetFields.filter(
    (req) => !mappedTargetFields.has(req.key)
  )

  const canProceed = missingRequiredFields.length === 0

  return (
    <div className="space-y-6">
      {/* Workbook Inspection Info Card */}
      <div className="bg-white p-5 rounded-xl border border-border shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-brand-maroon/10 text-brand-maroon flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {workbookData.fileName}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ukuran: {(workbookData.fileSize / 1024).toFixed(1)} KB • Sheet Utama:{' '}
              <span className="font-semibold text-slate-800">
                {workbookData.participantSheetName}
              </span>{' '}
              ({workbookData.rawParticipantRows.length} baris peserta terdeteksi)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {workbookData.sheets.map((s) => (
            <span
              key={s.sheetName}
              className={`text-xs px-2.5 py-1 rounded-md border font-medium ${
                s.detectedType === 'PESERTA'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : s.detectedType === 'GURU'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {s.sheetName} ({s.rowCount})
            </span>
          ))}
        </div>
      </div>

      {/* Main Mapping Card */}
      <SectionCard
        title="Langkah 3: Periksa Struktur Data & Pemetaan Kolom"
        subtitle="Cocokkan nama kolom di berkas Excel Anda dengan atribut target sistem OGSOreg."
        action={
          !canProceed && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              {missingRequiredFields.length} Kolom Wajib Belum Terpetakan
            </span>
          )
        }
      >
        {/* Missing Required Notice */}
        {!canProceed && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Perhatian: Kolom wajib berikut belum terpetakan ke berkas Excel Anda:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {missingRequiredFields.map((f) => (
                <span
                  key={f.key}
                  className="px-2.5 py-1 rounded-md bg-white border border-rose-300 font-semibold text-rose-800"
                >
                  {f.label} *
                </span>
              ))}
            </div>
            <p className="text-[11px] text-rose-700 pt-1">
              Silakan pilih kolom tujuan secara manual pada tabel di bawah untuk melanjutkan.
            </p>
          </div>
        )}

        {/* Column Mapping Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-border text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 pl-4">Kolom di Excel</th>
                <th className="p-3.5">Contoh Data Baris 1</th>
                <th className="p-3.5">Kolom Target OGSOreg</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {columnMappings.map((mapping) => {
                const isMatched = mapping.targetField !== null
                const matchedFieldDef = targetFieldsList.find(
                  (f) => f.key === mapping.targetField
                )
                const isRequired = matchedFieldDef?.isRequired

                return (
                  <tr key={mapping.excelHeader} className="hover:bg-slate-50/60 transition-colors">
                    {/* Excel Header */}
                    <td className="p-3.5 pl-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{mapping.excelHeader}</span>
                      </div>
                    </td>

                    {/* Sample Value */}
                    <td className="p-3.5 text-muted-foreground font-mono text-xs max-w-[200px] truncate">
                      {mapping.sampleValue || <span className="italic text-slate-400">- kosong -</span>}
                    </td>

                    {/* Target Selector Dropdown */}
                    <td className="p-3.5 min-w-[260px]">
                      <select
                        value={mapping.targetField || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : e.target.value
                          updateColumnMapping(mapping.excelHeader, val)
                        }}
                        className={`w-full px-3 py-1.5 rounded-lg border text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-maroon transition-all ${
                          mapping.targetField
                            ? 'border-slate-300 text-slate-900 font-medium'
                            : 'border-amber-300 bg-amber-50/40 text-amber-900'
                        }`}
                      >
                        <option value="">-- [ Lewati / Tidak Dipetakan ] --</option>
                        {targetFieldsList.map((field) => (
                          <option key={field.key} value={field.key}>
                            {field.label} {field.isRequired ? '(Wajib *)' : '(Opsional)'}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Status Pill */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {isMatched ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Cocok {isRequired ? '(Wajib)' : ''}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <span>Dilewati</span>
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-border mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep(2)}
            leftIcon={<ArrowLeft className="w-4 h-4 mr-1.5" />}
          >
            Kembali ke Unggah
          </Button>

          <Button
            variant="primary"
            size="md"
            disabled={!canProceed}
            onClick={applyMappings}
            rightIcon={<ArrowRight className="w-4 h-4 ml-2" />}
          >
            Terapkan & Validasi Data ({workbookData.rawParticipantRows.length} Baris)
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}
