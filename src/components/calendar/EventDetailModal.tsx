import React from 'react'
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Tag,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
} from 'lucide-react'
import type { TimelineEvent } from '../../services/websiteContentService'
import {
  CATEGORIES_CONFIG,
  FALLBACK_CATEGORY,
  formatIndonesianDateDisplay,
  formatTimeRange,
  parseEventDate,
} from '../../lib/calendarUtils'

interface EventDetailModalProps {
  event: TimelineEvent | null
  isOpen: boolean
  onClose: () => void
  onEdit: (event: TimelineEvent) => void
  onDelete: (eventId: string) => void
  canManage?: boolean
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  canManage = false,
}) => {
  if (!isOpen || !event) return null

  const categoryMeta =
    CATEGORIES_CONFIG[event.category] || FALLBACK_CATEGORY
  const { startDate, endDate } = parseEventDate(event)

  const dateDisplay =
    endDate && endDate !== startDate
      ? `${formatIndonesianDateDisplay(startDate)} – ${formatIndonesianDateDisplay(endDate)}`
      : formatIndonesianDateDisplay(startDate)

  const timeDisplay = formatTimeRange(
    event.startTime,
    event.endTime,
    event.isAllDay,
    event.time
  )

  const handleDelete = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus agenda "${event.title}"?`)) {
      onDelete(event.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-title"
      >
        {/* Top Decorative Category Stripe */}
        <div
          className="h-2.5 w-full transition-colors"
          style={{ backgroundColor: categoryMeta.color }}
        />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 p-6 pb-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                style={{
                  backgroundColor: `${categoryMeta.color}15`,
                  color: categoryMeta.color,
                  borderColor: `${categoryMeta.color}35`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: categoryMeta.color }}
                />
                {categoryMeta.label}
              </span>

              {event.isTentative ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Tentatif
                </span>
              ) : event.isCompleted ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Selesai
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                  Terjadwal
                </span>
              )}
            </div>

            <h3
              id="event-title"
              className="text-xl sm:text-2xl font-black text-[#0C241B] leading-tight"
            >
              {event.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Meta Details Grid */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Date & Hijri */}
          <div className="flex items-start gap-3.5 text-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center shrink-0 border border-emerald-100">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900">{dateDisplay}</div>
              {event.hijriDate && (
                <div className="text-xs text-emerald-800 font-medium">
                  {event.hijriDate}
                </div>
              )}
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-3.5 text-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center shrink-0 border border-emerald-100">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900">{timeDisplay}</div>
              <div className="text-xs text-slate-500">
                {event.isAllDay ? 'Berlaku sepanjang hari' : 'Waktu Indonesia Barat (WIB)'}
              </div>
            </div>
          </div>

          {/* Location / Venue */}
          {event.location && (
            <div className="flex items-start gap-3.5 text-sm">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center shrink-0 border border-emerald-100">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">{event.location}</div>
                <div className="text-xs text-slate-500">Platform / Lokasi Pelaksanaan</div>
              </div>
            </div>
          )}

          {/* Target Levels / Sasaran Peserta */}
          {event.levels && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-[#166534]" />
                Sasaran Peserta
              </div>
              <div className="text-xs font-semibold text-emerald-950">
                {event.levels}
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Keterangan & Catatan
              </div>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
                {event.description}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onEdit(event)
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#166534]" />
                  <span>Ubah</span>
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Hapus</span>
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#166534] text-white hover:bg-[#0F3D20] transition-colors shadow-xs cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  )
}
