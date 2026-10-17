import React, { useState } from 'react'
import {
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Send,
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
import { AdminSubmitSuccessStep } from '../components/excel-pipeline/AdminSubmitSuccessStep'
import { useImportStore } from '../stores/importStore'
import { useAuth } from '../context/AuthContext'

export const ImportWizardPage: React.FC = () => {
  const { isSuperAdmin, assignedCampus, appProfile, institution, user } = useAuth()
  const setAccessControl = useImportStore((s) => s.setAccessControl)
  const resetImport = useImportStore((s) => s.resetImport)
  const saveStagedToStudentsDirectory = useImportStore((s) => s.saveStagedToStudentsDirectory)
  const lastAccountRef = React.useRef<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    savedCount: number
    duplicatesCount: number
    errorsCount?: number
  } | null>(null)

  React.useEffect(() => {
    const currentAccount = appProfile ? `${appProfile.username}:${assignedCampus || 'all'}` : null
    if (lastAccountRef.current !== null && lastAccountRef.current !== currentAccount) {
      // Different account detected (e.g. Gontor 2 -> Gontor 5): restart registration from beginning
      resetImport()
      setSubmitResult(null)
    }
    lastAccountRef.current = currentAccount

    setAccessControl({
      username: appProfile?.username,
      userRole: isSuperAdmin ? 'super_admin' : 'campus_admin',
      assignedCampus,
    })
  }, [isSuperAdmin, assignedCampus, appProfile, setAccessControl, resetImport])

  const {
    currentStep,
    setCurrentStep,
    uploadedFile,
    stagedRows,
    stats,
  } = useImportStore()

  // Guard: Campus admin only has 3 steps (1: Input, 2: Validasi, 3: Submit)
  React.useEffect(() => {
    if (!isSuperAdmin && currentStep > 3) {
      setCurrentStep(3)
    }
  }, [isSuperAdmin, currentStep, setCurrentStep])

  const hasErrors = stats.error > 0 || stats.duplicate > 0
  const hasData = stagedRows.length > 0
  const validRowsCount = stagedRows.filter((r) => r._status !== 'ERROR').length

  const handleCampusAdminSubmit = async () => {
    if (!hasData) return
    setIsSubmitting(true)
    try {
      const res = await saveStagedToStudentsDirectory(
        institution?.id || 'a0000000-0000-0000-0000-000000000001',
        user?.id
      )
      setSubmitResult({
        savedCount: res.savedCount,
        duplicatesCount: res.duplicatesCount,
        errorsCount: res.errorsCount,
      })
      setCurrentStep(3)
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Pendaftaran Kolektif"
        subtitle={
          isSuperAdmin
            ? 'Solusi registrasi massal peserta terpadu. Unggah Excel/CSV, tempel spreadsheet, atau input manual, kemudian generate CSV resmi untuk LMS Moodle.'
            : 'Alur pendaftaran santri kontingen: Input data (Langkah 1), periksa & validasi (Langkah 2), lalu submit (Langkah 3) ke sistem panitia.'
        }
        actions={
          (uploadedFile || hasData) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetImport()
                setSubmitResult(null)
              }}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 mr-1" />}
            >
              Reset Data
            </Button>
          )
        }
      />

      {/* Stepper Progress Bar (4 Steps for Super Admin, 3 Steps for Campus Admin) */}
      <ImportStepper
        currentStep={currentStep}
        isSuperAdmin={isSuperAdmin}
        onStepClick={(stepId) => {
          const maxAllowed = isSuperAdmin ? (hasData ? 4 : 1) : (hasData ? 3 : 1)
          if (stepId === 1 || (hasData && stepId <= maxAllowed)) {
            setCurrentStep(stepId)
          }
        }}
        maxReachedStep={hasData ? (isSuperAdmin ? 3 : 2) : 1}
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
                {isSuperAdmin
                  ? 'Klik pada sel mana pun untuk mengedit nilai. Pastikan data valid sebelum generate berkas Moodle.'
                  : 'Klik pada sel mana pun untuk mengedit nilai. Periksa baris bertanda error sebelum submit pendaftaran.'}
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

              {isSuperAdmin ? (
                /* Super Admin: Proceeds to Moodle Export */
                <Button
                  variant={hasErrors ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => setCurrentStep(3)}
                  rightIcon={<ArrowRight className="w-4 h-4 ml-1.5" />}
                >
                  {hasErrors ? 'Lanjut ke Ekspor (Ada Error)' : 'Lanjut ke Ekspor CSV Moodle'}
                </Button>
              ) : (
                /* Campus Admin: Input -> Validasi -> Submit */
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!hasData || isSubmitting}
                  onClick={handleCampusAdminSubmit}
                  className="bg-[#166534] hover:bg-[#14532D] text-white font-bold shadow-sm"
                  leftIcon={isSubmitting ? undefined : <Send className="w-4 h-4 mr-1.5" />}
                >
                  {isSubmitting
                    ? 'Menyimpan Pendaftaran...'
                    : hasErrors
                    ? `Submit Pendaftaran (${validRowsCount} Valid, Ada Error)`
                    : `Submit Pendaftaran (${validRowsCount} Santri)`}
                </Button>
              )}
            </div>
          </div>

          <ValidationSummary />

          <StagedDataGrid />
        </div>
      )}

      {/* STEP 3: ROLE-BASED WORKFLOW */}
      {currentStep === 3 && (
        isSuperAdmin ? (
          <MoodleExportStep />
        ) : (
          <AdminSubmitSuccessStep
            submitResult={submitResult}
            campusName={assignedCampus || appProfile?.display_name || 'Kampus Anda'}
            institutionId={institution?.id || 'a0000000-0000-0000-0000-000000000001'}
            userId={user?.id}
          />
        )
      )}

      {/* STEP 4: HASIL & PETUNJUK UNGGAH MOODLE (Super Admin Only) */}
      {currentStep === 4 && isSuperAdmin && <ExportResultsSummary />}
    </div>
  )
}

