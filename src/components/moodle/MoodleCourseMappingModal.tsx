import React, { useState } from 'react'
import {
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  X,
  ExternalLink,
} from 'lucide-react'
import { Button } from '../ui/Button'
import {
  getCourseMappingConfig,
  saveCourseMappingConfig,
  resetCourseMappingConfig,
  type MoodleCourseMappingConfig,
} from '../../services/moodle/moodleCourseMapping'
import type { StudentJenjang } from '../../types/student'

interface MoodleCourseMappingModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: (config: MoodleCourseMappingConfig) => void
}

export const MoodleCourseMappingModal: React.FC<MoodleCourseMappingModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [config, setConfig] = useState<MoodleCourseMappingConfig>(getCourseMappingConfig())
  const [saveSuccess, setSaveSuccess] = useState(false)

  if (!isOpen) return null

  const handleJenjangChange = (jenjang: StudentJenjang, val: string) => {
    setConfig((prev) => ({
      ...prev,
      jenjangShortnames: {
        ...prev.jenjangShortnames,
        [jenjang]: val.trim(),
      },
    }))
  }

  const handleSave = () => {
    saveCourseMappingConfig(config)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
    if (onSaved) onSaved(config)
  }

  const handleReset = () => {
    resetCourseMappingConfig()
    const def = getCourseMappingConfig()
    setConfig(def)
    if (onSaved) onSaved(def)
  }

  const classes: StudentJenjang[] = ['Jenjang 1', 'Jenjang 2', 'Jenjang 3', 'Jenjang 4', 'Jenjang 5']
  const jenjangDescriptions: Record<StudentJenjang, string> = {
    'Jenjang 1': 'Untuk Kelas 1',
    'Jenjang 2': 'Untuk Kelas 2',
    'Jenjang 3': 'Untuk Kelas 1 Int & 3',
    'Jenjang 4': 'Untuk Kelas 3 Int & 4',
    'Jenjang 5': 'Untuk Kelas 5',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-maroon/10 text-brand-maroon flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Konfigurasi Shortname Course Moodle
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Pemetaan Jenjang santri ke shortname course resmi di Moodle OGSO
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs">
          {/* Important Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-xs text-amber-900">
                Penting: Gunakan Course Shortname, Bukan Fullname
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Fitur <em>Upload users</em> Moodle mewajibkan <strong>shortname</strong> kursus yang persis terdaftar di portal{' '}
                <a
                  href="https://ogso.gontor.ac.id/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold inline-flex items-center gap-0.5"
                >
                  ogso.gontor.ac.id <ExternalLink className="w-3 h-3" />
                </a>
                . Jika shortname tidak sesuai di server Moodle, pendaftaran otomatis ke kursus (enrolment) akan gagal.
              </p>
            </div>
          </div>

          {/* Verification Status Toggle */}
          <div className="p-4 rounded-xl border border-border bg-slate-50/60 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-xs">Status Verifikasi Shortname</span>
                {config.isVerified ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Terverifikasi
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    Belum Terverifikasi
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Tandai sudah diverifikasi setelah Anda mencocokkannya dengan daftar kursus di Moodle LMS.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={config.isVerified}
                onChange={(e) => setConfig({ ...config, isVerified: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Jenjang Mapping Fields */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Pemetaan Course 1 (Jenjang Lomba)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {classes.map((cls) => (
                <div key={cls} className="p-3 rounded-lg border border-border bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-700 text-xs">
                      {cls}
                    </label>
                    <span className="text-[10px] text-brand-maroon font-semibold">
                      {jenjangDescriptions[cls]}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={config.jenjangShortnames[cls] || ''}
                    onChange={(e) => handleJenjangChange(cls, e.target.value)}
                    placeholder="misal: ogso_j1"
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-border focus:outline-none focus:ring-1 focus:ring-brand-maroon"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Course Field */}
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Pemetaan Course 2 (Simulasi Bersama)
            </h4>
            <div className="p-3 rounded-lg border border-border bg-white space-y-1">
              <label className="block font-semibold text-slate-700 text-xs">
                Course 2 Shortname <span className="text-muted-foreground text-[10px] font-normal">(course2)</span>
              </label>
              <input
                type="text"
                value={config.simulationShortname}
                onChange={(e) => setConfig({ ...config, simulationShortname: e.target.value.trim() })}
                placeholder="simulation"
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-border focus:outline-none focus:ring-1 focus:ring-brand-maroon max-w-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                Nilai ini akan diisi secara seragam pada kolom <code>course2</code> untuk seluruh santri yang diekspor.
              </p>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Konfigurasi pemetaan course Moodle berhasil disimpan!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-slate-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5 mr-1" />}
            className="text-xs text-muted-foreground"
          >
            Reset Default
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Tutup
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              leftIcon={<Save className="w-3.5 h-3.5 mr-1" />}
            >
              Simpan Pemetaan
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
