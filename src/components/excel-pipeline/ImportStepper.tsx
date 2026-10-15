import React from 'react'
import { CheckCircle2 } from 'lucide-react'

export interface StepDef {
  id: number
  name: string
  desc: string
}

export const IMPORT_STEPS: StepDef[] = [
  { id: 1, name: '1. Input Data', desc: 'Unggah / Tempel / Manual' },
  { id: 2, name: '2. Pratinjau & Validasi', desc: 'Cek & Edit Data' },
  { id: 3, name: '3. Ekspor CSV Moodle', desc: 'Generate CSV LMS' },
  { id: 4, name: '4. Hasil & Petunjuk', desc: 'Panduan Upload Moodle' },
]

interface ImportStepperProps {
  currentStep: number
  onStepClick?: (stepId: number) => void
  maxReachedStep?: number
}

export const ImportStepper: React.FC<ImportStepperProps> = ({
  currentStep,
  onStepClick,
  maxReachedStep = 1,
}) => {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-border shadow-subtle">
      <div className="flex items-center justify-between relative max-w-4xl mx-auto">
        {/* Connector Line behind steps */}
        <div className="absolute left-8 right-8 top-5 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />

        {IMPORT_STEPS.map((step) => {
          const isCompleted = currentStep > step.id
          const isActive = currentStep === step.id
          const isClickable = step.id <= Math.max(currentStep, maxReachedStep)

          return (
            <div
              key={step.id}
              className={`relative z-10 flex flex-col items-center group ${
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              }`}
              onClick={() => {
                if (isClickable && onStepClick) {
                  onStepClick(step.id)
                }
              }}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isActive
                    ? 'bg-[#166534] text-white ring-4 ring-[#22C55E]/30'
                    : 'bg-white border-2 border-slate-300 text-slate-400 group-hover:border-slate-400'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.id}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={`text-xs font-semibold ${
                    isActive
                      ? 'text-[#166534] font-bold'
                      : isCompleted
                      ? 'text-emerald-700'
                      : 'text-slate-500'
                  }`}
                >
                  {step.name}
                </p>
                <p className="text-[10px] text-muted-foreground hidden sm:block">
                  {step.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
