import React from 'react'
import {
  RotateCcw,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { ImportStepper } from '../components/excel-pipeline/ImportStepper'
import { TemplateDownloader } from '../components/excel-pipeline/TemplateDownloader'
import { FileDropzone } from '../components/excel-pipeline/FileDropzone'
import { ValidationSummary } from '../components/excel-pipeline/ValidationSummary'
import { StagedDataGrid } from '../components/excel-pipeline/StagedDataGrid'
import { MoodleExportStep } from '../components/excel-pipeline/MoodleExportStep'
import { ExportResultsSummary } from '../components/excel-pipeline/ExportResultsSummary'
import { useImportStore } from '../stores/importStore'

export const ImportWizardPage: React.FC = () => {
  const {
    currentStep,
    setCurrentStep,
    uploadedFile,
    stagedRows,
    stats,
    resetImport,
  } = useImportStore()

  const hasErrors = stats.error > 0 || stats.duplicate > 0
  const hasData = stagedRows.length > 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Pendaftaran Kolektif"
        subtitle="Solusi registrasi massal peserta terpadu. Unggah Excel/CSV, tempel spreadsheet, atau input manual, kemudian generate CSV resmi untuk LMS Moodle."
        actions={
          (uploadedFile || hasData) && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetImport}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 mr-1" />}
            >
              Reset Data
            </Button>
          )
        }
      />

      {/* 4-Step Stepper Progress Bar */}
      <ImportStepper
        currentStep={currentStep}
        onStepClick={(stepId) => {
          if (stepId === 1 || (hasData && stepId <= 3) || (stepId === 4 && hasData)) {
            setCurrentStep(stepId)
          }
        }}
        maxReachedStep={hasData ? 3 : 1}
      />

      {/* STEP 1: INPUT DATA & DOWNLOAD TEMPLATE */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <TemplateDownloader />
          <FileDropzone />
          {hasData && (
            <div className="p-4 rounded-xl bg-white border border-border shadow-subtle flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Terdapat <strong>{stagedRows.length}</strong> peserta dalam staging sementara.
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentStep(2)}
                rightIcon={<ArrowRight className="w-4 h-4 ml-1.5" />}
              >
                Lihat Tabel Pratinjau ({stagedRows.length} Peserta)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: PRATINJAU & VALIDASI DATA */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-border shadow-subtle">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Pratinjau, Edit & Validasi Data Peserta
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Klik pada sel mana pun untuk mengedit nilai. Kolom Jenjang menggunakan pilihan dropdown Kelas 1–5.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(1)}
                leftIcon={<ArrowLeft className="w-4 h-4 mr-1.5" />}
              >
                Kembali ke Sumber Data
              </Button>

              <Button
                variant={hasErrors ? 'outline' : 'primary'}
                size="sm"
                onClick={() => setCurrentStep(3)}
                rightIcon={<ArrowRight className="w-4 h-4 ml-1.5" />}
              >
                {hasErrors ? 'Lanjut ke Ekspor (Ada Error)' : 'Lanjut ke Ekspor CSV Moodle'}
              </Button>
            </div>
          </div>

          <ValidationSummary />

          <StagedDataGrid />
        </div>
      )}

      {/* STEP 3: EKSPOR CSV MOODLE */}
      {currentStep === 3 && <MoodleExportStep />}

      {/* STEP 4: HASIL & PETUNJUK UNGGAH */}
      {currentStep === 4 && <ExportResultsSummary />}
    </div>
  )
}
