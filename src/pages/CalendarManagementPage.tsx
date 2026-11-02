import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Plus,
  RotateCcw,
  ExternalLink,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Table as TableIcon,
  Grid3X3,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { SectionCard } from '../components/ui/SectionCard'
import { useAuth } from '../context/AuthContext'
import {
  websiteContentService,
  type TimelineEvent,
} from '../services/websiteContentService'
import {
  CATEGORIES_CONFIG,
  FALLBACK_CATEGORY,
  formatIndonesianDateDisplay,
  formatTimeRange,
  parseEventDate,
} from '../lib/calendarUtils'
import { MonthlyCalendarView } from '../components/calendar/MonthlyCalendarView'
import { EventFormModal } from '../components/calendar/EventFormModal'
import { EventDetailModal } from '../components/calendar/EventDetailModal'
import { cn } from '../lib/utils'

export const CalendarManagementPage: React.FC = () => {
  const { isSuperAdmin } = useAuth()

  const [events, setEvents] = useState<TimelineEvent[]>(() =>
    websiteContentService.getContent().timeline
  )
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'table'>('calendar')
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [eventToEdit, setEventToEdit] = useState<TimelineEvent | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Sync state on custom event from service
  useEffect(() => {
    const handleUpdate = () => {
      setEvents(websiteContentService.getContent().timeline)
    }
    window.addEventListener('ogsoreg_website_content_updated', handleUpdate)
    return () => window.removeEventListener('ogsoreg_website_content_updated', handleUpdate)
  }, [])

  if (!isSuperAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">
          Akses Khusus Super Admin
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Fitur pengelolaan kalender dan agenda landing page hanya dapat diakses oleh akun Super Administrator Pusat.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#166534] text-white hover:bg-[#0F3D20] transition-colors"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    )
  }

  // CRUD Handlers
  const handleOpenCreate = () => {
    setEventToEdit(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (event: TimelineEvent) => {
    setEventToEdit(event)
    setIsFormOpen(true)
  }

  const handleSave = (payload: Partial<TimelineEvent>) => {
    if (eventToEdit) {
      websiteContentService.updateTimelineEvent(eventToEdit.id, payload)
      setFeedbackMessage(`Agenda "${payload.title || eventToEdit.title}" berhasil diperbarui!`)
    } else {
      const created = websiteContentService.addTimelineEvent(payload as any)
      setFeedbackMessage(`Agenda "${created.title}" berhasil ditambahkan ke kalender landing page!`)
    }
    setEvents(websiteContentService.getContent().timeline)
    setIsFormOpen(false)
    setTimeout(() => setFeedbackMessage(null), 4000)
  }

  const handleDelete = (id: string) => {
    const target = events.find((e) => e.id === id)
    if (window.confirm(`Hapus agenda "${target?.title || 'ini'}" dari kalender landing page?`)) {
      websiteContentService.deleteTimelineEvent(id)
      setEvents(websiteContentService.getContent().timeline)
      setFeedbackMessage('Agenda berhasil dihapus.')
      setTimeout(() => setFeedbackMessage(null), 4000)
    }
  }

  const handleResetToDefault = () => {
    if (
      window.confirm(
        'Kembalikan seluruh agenda kalender landing page ke 11 jadwal standar JUKLAK Resmi OGSO 2026?'
      )
    ) {
      websiteContentService.resetToDefault()
      setEvents(websiteContentService.getContent().timeline)
      setFeedbackMessage('Kalender berhasil direset ke standar resmi JUKLAK 2026.')
      setTimeout(() => setFeedbackMessage(null), 4000)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Kelola Kalender Landing Page"
        subtitle="Kelola agenda olimpiade, babak penyisihan, final, pembukaan, dan penutupan OGSO 2026 yang tampil secara publik di landing page dan portal kalender."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="/jadwal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Lihat tampilan publik kalender"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#166534]" />
              <span>Buka di Website</span>
            </a>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefault}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" />}
              className="text-slate-600 hover:text-slate-900 border-slate-300"
            >
              Reset ke JUKLAK
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4 mr-1 text-white" />}
              className="bg-[#166534] hover:bg-[#0F3D20] text-white shadow-sm"
            >
              Tambah Agenda
            </Button>
          </div>
        }
      />

      {/* Feedback Toast Notification */}
      {feedbackMessage && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs text-emerald-700 hover:underline font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center font-black shrink-0 border border-emerald-100">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{events.length}</div>
            <div className="text-xs text-slate-500 font-medium">Total Agenda Resmi</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black shrink-0 border border-indigo-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {events.filter((e) => e.category === 'penyisihan').length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Babak Penyisihan</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black shrink-0 border border-amber-100">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {events.filter((e) => e.category === 'final').length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Babak Final</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-black shrink-0 border border-rose-100">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {events.filter((e) => e.isTentative).length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Jadwal Tentatif</div>
          </div>
        </div>
      </div>

      {/* Main Tab Controller: Interactive Calendar vs Data Table */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('calendar')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                activeSubTab === 'calendar'
                  ? 'bg-[#166534] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Tampilan Kalender Interaktif</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('table')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                activeSubTab === 'table'
                  ? 'bg-[#166534] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel Rincian Agenda ({events.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Visual Interactive Calendar (with Superadmin creation & edit capabilities) */}
        {activeSubTab === 'calendar' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
              <span className="font-semibold">
                Mode Superadmin Aktif: Anda dapat mengklik sel kosong tanggal untuk menambah agenda, atau mengklik kartu agenda untuk mengubah dan menghapus kegiatan.
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreate}
                leftIcon={<Plus className="w-3.5 h-3.5 mr-1" />}
                className="bg-[#166534] hover:bg-[#0F3D20] text-white shrink-0 ml-4"
              >
                + Buat Agenda
              </Button>
            </div>

            <MonthlyCalendarView />
          </div>
        )}

        {/* TAB 2: Structured Management Table */}
        {activeSubTab === 'table' && (
          <SectionCard
            title="Daftar Terstruktur Agenda Kalender"
            subtitle="Tabel seluruh agenda resmi yang tersinkronisasi ke landing page publik OGSO 2026."
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Tanggal & Waktu</th>
                    <th className="py-3 px-4">Judul Agenda</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Lokasi & Pengawasan</th>
                    <th className="py-3 px-4">Target Peserta</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map((event, idx) => {
                    const catMeta =
                      CATEGORIES_CONFIG[event.category] || FALLBACK_CATEGORY
                    const { startDate, endDate } = parseEventDate(event)
                    const dateDisplayStr =
                      endDate && endDate !== startDate
                        ? `${formatIndonesianDateDisplay(startDate)} – ${formatIndonesianDateDisplay(endDate)}`
                        : formatIndonesianDateDisplay(startDate)
                    const timeDisplayStr = formatTimeRange(
                      event.startTime,
                      event.endTime,
                      event.isAllDay,
                      event.time
                    )

                    return (
                      <tr
                        key={event.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          <div>{dateDisplayStr}</div>
                          <div className="text-[11px] text-slate-500 font-normal flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-[#166534]" />
                            <span>{timeDisplayStr}</span>
                          </div>
                          {event.hijriDate && (
                            <div className="text-[10px] text-emerald-800 font-medium">
                              {event.hijriDate}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#0C241B] max-w-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEvent(event)
                              setIsDetailOpen(true)
                            }}
                            className="text-left hover:text-[#166534] hover:underline cursor-pointer"
                          >
                            {event.title}
                          </button>
                          {event.description && (
                            <p className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">
                              {event.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                            style={{
                              backgroundColor: `${catMeta.color}15`,
                              color: catMeta.color,
                              borderColor: `${catMeta.color}35`,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: catMeta.color }}
                            />
                            {catMeta.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {event.location ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{event.location}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {event.levels ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                              <GraduationCap className="w-3 h-3 text-[#166534]" />
                              <span>{event.levels}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Umum</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {event.isTentative ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Tentatif
                            </span>
                          ) : event.isCompleted ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Selesai
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                              Terjadwal
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(event)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-[#166534] hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Ubah Agenda"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(event.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Agenda"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}
      </div>

      {/* Edit/Create Form Modal */}
      <EventFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        eventToEdit={eventToEdit}
      />

      {/* Detail Modal */}
      <EventDetailModal
        isOpen={isDetailOpen}
        event={selectedEvent}
        onClose={() => setIsDetailOpen(false)}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        canManage={true}
      />
    </div>
  )
}
