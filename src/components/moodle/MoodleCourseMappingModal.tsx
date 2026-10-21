import React, { useState } from 'react'
import {
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  X,
  ExternalLink,
  KeyRound,
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
                Tandai sudah diverifikasi setelah Anda mencocokkannya dengan daftar kursus di portal Moodle LMS.
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

          {/* 1. Password Awal Template Santri */}
          <div className="space-y-2 pt-1 border-t border-border">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-brand-maroon" />
                <span>Password Awal Santri (Template Default)</span>
              </h4>
              <span className="text-[10px] text-muted-foreground">Wajib diisi di berkas CSV</span>
            </div>

            <div className="p-3 rounded-xl border border-border bg-white space-y-2">
              <label className="block font-semibold text-slate-700 text-xs">
                Password Default Akun Baru <span className="text-muted-foreground text-[10px] font-normal">(password)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={config.defaultPassword || ''}
                  onChange={(e) => setConfig({ ...config, defaultPassword: e.target.value })}
                  placeholder="ogso_2026!"
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-brand-maroon"
                />
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, defaultPassword: 'ogso_2026!' })}
                  className="px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium whitespace-nowrap cursor-pointer"
                  title="Kembalikan ke default ogso_2026!"
                >
                  ogso_2026!
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Password ini akan otomatis diisikan pada kolom <code>password</code> di setiap baris saat ekspor CSV Moodle (misal: <code>ogso_2026!</code>, <code>Santri2026*</code>, dsb).
              </p>
            </div>
          </div>

          {/* 2. Jenjang Mapping Fields (Course 1) */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                <span>Format Nilai Output Jenjang (course1)</span>
              </h4>

              {/* Quick Template Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 font-medium">Preset Cepat:</span>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      jenjangShortnames: {
                        'Jenjang 1': 'JENJANG 1',
                        'Jenjang 2': 'JENJANG 2',
                        'Jenjang 3': 'JENJANG 3',
                        'Jenjang 4': 'JENJANG 4',
                        'Jenjang 5': 'JENJANG 5',
                      },
                    }))
                  }
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 cursor-pointer"
                  title="Ubah semua output jadi JENJANG 1, JENJANG 2, dst."
                >
                  JENJANG 1..5
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      jenjangShortnames: {
                        'Jenjang 1': 'ogso_j1',
                        'Jenjang 2': 'ogso_j2',
                        'Jenjang 3': 'ogso_j3',
                        'Jenjang 4': 'ogso_j4',
                        'Jenjang 5': 'ogso_j5',
                      },
                    }))
                  }
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 cursor-pointer"
                  title="Kembalikan format ogso_j1..j5"
                >
                  ogso_j1..j5
                </button>
              </div>
            </div>

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
                    placeholder="misal: JENJANG 1 atau ogso_j1"
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-border focus:outline-none focus:ring-1 focus:ring-brand-maroon"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 3. Simulation Course Field (Course 2) */}
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Nilai Bawaan Course 2 (course2)
            </h4>
            <div className="p-3 rounded-lg border border-border bg-white space-y-2">
              <label className="block font-semibold text-slate-700 text-xs">
                Isi Kolom Course 2 <span className="text-muted-foreground text-[10px] font-normal">(course2)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={config.simulationShortname}
                  onChange={(e) => setConfig({ ...config, simulationShortname: e.target.value })}
                  placeholder="simulation"
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-border focus:outline-none focus:ring-1 focus:ring-brand-maroon max-w-sm"
                />
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, simulationShortname: 'simulation' })}
                  className="px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium whitespace-nowrap cursor-pointer"
                >
                  simulation
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Nilai ini akan diisi secara seragam pada kolom <code>course2</code> (misal: <code>simulation</code>, <code>simulasi_2026</code>, <code>sesi_1</code>, dll).
              </p>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Konfigurasi template nilai Moodle berhasil disimpan!</span>
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
