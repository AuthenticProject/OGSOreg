import React, { useState } from 'react'
import {
  Download,
  FileSpreadsheet,
  Info,
  CheckCircle2,
  ChevronDown,
  Layers,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { generateRegistrationTemplate } from '../../services/excelGenerator'

interface TemplateDownloaderProps {
  onProceedToUpload?: () => void
}

export const TemplateDownloader: React.FC<TemplateDownloaderProps> = ({
  onProceedToUpload,
}) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [hasDownloaded, setHasDownloaded] = useState(false)

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
                Dropdown Kelas 1–5 & 20 Kampus Aktif
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Format workbook Excel (.xlsx) dengan 6 kolom resmi: <strong>Username, Nama Depan, Nama Belakang, Email, Jenjang, Kampus</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
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
