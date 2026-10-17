import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Download,
  FileSpreadsheet,
  Info,
  CheckCircle2,
  ChevronDown,
  Layers,
  Sliders,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { generateRegistrationTemplate } from '../../services/excelGenerator'
import {
  templateConfigService,
  type ExcelTemplateColumnConfig,
} from '../../services/templateConfigService'
import { useAuth } from '../../context/AuthContext'

interface TemplateDownloaderProps {
  onProceedToUpload?: () => void
}

export const TemplateDownloader: React.FC<TemplateDownloaderProps> = ({
  onProceedToUpload,
}) => {
  const { isSuperAdmin } = useAuth()
  const [isDownloading, setIsDownloading] = useState(false)
  const [hasDownloaded, setHasDownloaded] = useState(false)
  const [activeColumns, setActiveColumns] = useState<ExcelTemplateColumnConfig[]>(() =>
    templateConfigService.getActiveExcelColumnsSync()
  )

  useEffect(() => {
    const unsub = templateConfigService.subscribe((cols) => {
      setActiveColumns(cols.filter((c) => c.include_in_excel))
    })
    return () => unsub()
  }, [])

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      await generateRegistrationTemplate()
      setHasDownloaded(true)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-border shadow-subtle space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Template Resmi Excel Kolektif
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {activeColumns.length} Kolom Dikonfigurasi
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Format workbook Excel (.xlsx) dengan susunan kolom aktif:{' '}
              <strong className="text-emerald-800">
                {activeColumns.map((c) => c.label).join(', ')}
              </strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {isSuperAdmin && (
            <Link
              to="/custom-fields?tab=excel"
              className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300"
              title="Atur kolom apa saja yang ada di template Excel"
            >
              <Sliders className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
              <span>Atur Kolom Excel</span>
            </Link>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            leftIcon={<Download className="w-4 h-4 mr-1.5" />}
          >
            {isDownloading ? 'Menyiapkan Template...' : hasDownloaded ? 'Unduh Ulang Template' : 'Unduh Template Excel'}
          </Button>

          {onProceedToUpload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onProceedToUpload}
            >
              Lanjut ke Input
            </Button>
          )}
        </div>
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <ChevronDown className="w-4 h-4 text-[#166534]" />
            Dropdown Jenjang & Kampus
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Dilengkapi proteksi dropdown Excel yang membatasi input pada <strong>Kelas 1–5</strong> dan <strong>20 Kampus Gontor</strong>.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Layers className="w-4 h-4 text-emerald-600" />
            Mendukung Kelas Campuran
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Anda dapat mendaftarkan siswa dari berbagai jenjang (Kelas 1–5) secara bersamaan dalam 1 berkas spreadsheet.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Info className="w-4 h-4 text-blue-600" />
            Sheet Contoh & Petunjuk
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Disertai sheet <em>Contoh</em> dengan 5 sampel peserta serta sheet <em>Petunjuk</em> panduan tata cara ekspor ke Moodle.
          </p>
        </div>
      </div>
    </div>
  )
}
