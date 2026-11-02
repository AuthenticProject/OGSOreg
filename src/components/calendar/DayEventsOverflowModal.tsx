import React from 'react'
import { X, Calendar, Plus, Clock, MapPin } from 'lucide-react'
import type { TimelineEvent } from '../../services/websiteContentService'
import {
  CATEGORIES_CONFIG,
  FALLBACK_CATEGORY,
  formatIndonesianDateDisplay,
  formatTimeRange,
} from '../../lib/calendarUtils'

interface DayEventsOverflowModalProps {
  isOpen: boolean
  dateStr: string // YYYY-MM-DD
  events: TimelineEvent[]
  onClose: () => void
  onSelectEvent: (event: TimelineEvent) => void
  onAddNewEvent: (dateStr: string) => void
  canManage?: boolean
}

export const DayEventsOverflowModal: React.FC<DayEventsOverflowModalProps> = ({
  isOpen,
  dateStr,
  events,
  onClose,
  onSelectEvent,
  onAddNewEvent,
  canManage = false,
}) => {
  if (!isOpen || !dateStr) return null

  const formattedDate = formatIndonesianDateDisplay(dateStr)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="overflow-modal-title"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100 bg-[#0C241B] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-500/30 text-[#A7F3D0] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="overflow-modal-title"
                className="text-base font-extrabold leading-tight"
              >
                {formattedDate}
              </h3>
              <p className="text-xs text-emerald-200/80">
                {events.length} Agenda Terjadwal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-emerald-200/70 hover:text-white hover:bg-emerald-900/40 rounded-full transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event List */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {events.map((event) => {
            const categoryMeta =
              CATEGORIES_CONFIG[event.category] || FALLBACK_CATEGORY
            const timeStr = formatTimeRange(
              event.startTime,
              event.endTime,
              event.isAllDay,
              event.time
            )

            return (
              <div
                key={event.id}
                onClick={() => {
                  onClose()
                  onSelectEvent(event)
                }}
                className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-[#166534] hover:shadow-md transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                    style={{
                      backgroundColor: `${categoryMeta.color}15`,
                      color: categoryMeta.color,
                      borderColor: `${categoryMeta.color}35`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: categoryMeta.color }}
                    />
                    {categoryMeta.label}
                  </span>

                  {event.isTentative && (
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Tentatif
                    </span>
                  )}
                </div>

                <div className="font-extrabold text-sm text-[#0C241B] group-hover:text-[#166534] transition-colors leading-snug">
                  {event.title}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{timeStr}</span>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 border-t border-slate-200">
          {canManage ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                onAddNewEvent(dateStr)
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#166534] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Agenda di Tanggal Ini</span>
            </button>
          ) : (
            <div className="text-xs text-slate-500 font-medium">
              Agenda Resmi OGSO 2026
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#166534] text-white hover:bg-[#0F3D20] transition-colors cursor-pointer ml-auto"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
