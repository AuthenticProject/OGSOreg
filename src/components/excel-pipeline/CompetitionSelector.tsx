import React, { useEffect, useState } from 'react'
import { Trophy, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import { competitionRepository } from '../../services/supabase/competitionRepository'
import type { Competition } from '../../types/database'

interface CompetitionSelectorProps {
  selectedCompetitionId: string | null
  onSelectCompetition: (comp: Competition) => void
}

export const CompetitionSelector: React.FC<CompetitionSelectorProps> = ({
  selectedCompetitionId,
  onSelectCompetition,
}) => {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    competitionRepository
      .getOpenCompetitions()
      .then((data) => {
        setCompetitions(data)
        // Auto-select first active competition if none selected
        if (!selectedCompetitionId && data.length > 0) {
          onSelectCompetition(data[0])
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [selectedCompetitionId, onSelectCompetition])

  if (loading) {
    return (
      <div className="p-4 rounded-xl border border-border bg-slate-50 text-xs text-muted-foreground animate-pulse">
        Memuat daftar kompetisi aktif...
      </div>
    )
  }

  if (competitions.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Belum ada kompetisi yang tersedia untuk pendaftaran saat ini.</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-brand-gold-dark" />
          Pilih Kompetisi / Event Sasaran *
        </label>
        <span className="text-[11px] text-muted-foreground">
          {competitions.length} Kompetisi Tersedia
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {competitions.map((comp) => {
          const isSelected = selectedCompetitionId === comp.id

          return (
            <div
              key={comp.id}
              onClick={() => onSelectCompetition(comp)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-brand-maroon bg-brand-maroon/[0.03] ring-2 ring-brand-maroon/20 shadow-sm'
                  : 'border-border bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-sm text-foreground">
                      {comp.name}
                    </span>
                  </div>
                  <span className="inline-block mt-0.5 text-[11px] font-mono text-brand-maroon font-semibold">
                    Kode: {comp.code}
                  </span>
                </div>

                <div className="shrink-0 mt-0.5">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-brand-maroon text-white flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-300" />
                  )}
                </div>
              </div>

              {comp.description && (
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {comp.description}
                </p>
              )}

              <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Pendaftaran Aktif • Status: {comp.status.toUpperCase()}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
