import React, { useState, useEffect, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Filter,
  Check,
  Clock,
  MapPin,
  List,
  Grid3X3,
  CalendarDays,
  ArrowRight,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import {
  websiteContentService,
  type TimelineEvent,
} from '../../services/websiteContentService'
import { useAuth } from '../../context/AuthContext'
import {
  CATEGORIES_CONFIG,
  FALLBACK_CATEGORY,
  formatIndonesianDateDisplay,
  formatTimeRange,
  formatToDateStr,
  getEventDayPosition,
  getMonthCalendarGrid,
  INDONESIAN_MONTHS,
  isEventOnDate,
  parseEventDate,
  WEEKDAYS_SUNDAY_FIRST,
} from '../../lib/calendarUtils'
import { EventDetailModal } from './EventDetailModal'
import { EventFormModal } from './EventFormModal'
import { DayEventsOverflowModal } from './DayEventsOverflowModal'
import { cn } from '../../lib/utils'

interface MonthlyCalendarViewProps {
  className?: string
}

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  className,
}) => {
  // Authentication & Strict Superadmin Permission Guard
  const { isSuperAdmin } = useAuth()
  const canManage = Boolean(isSuperAdmin)

  // Current viewed month and year (defaults to November 2026 for OGSO)
  const today = useMemo(() => new Date(), [])
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    return new Date(2026, 10, 1) // 10 = November in JS Date (0-indexed)
  })

  // Full timeline events from service
  const [events, setEvents] = useState<TimelineEvent[]>(() =>
    websiteContentService.getContent().timeline
  )

  // Category filter state: Record<categoryId, boolean>
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    Object.keys(CATEGORIES_CONFIG).forEach((catId) => {
      initial[catId] = true
    })
    return initial
  })

  // View mode: 'grid' (Google Calendar Monthly Grid) or 'agenda' (3 Cards Side-by-Side)
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [eventToEdit, setEventToEdit] = useState<TimelineEvent | null>(null)
  const [formInitialDate, setFormInitialDate] = useState<string | undefined>(undefined)

  const [overflowDateStr, setOverflowDateStr] = useState<string | null>(null)
  const [isOverflowOpen, setIsOverflowOpen] = useState(false)

  // Listen to cross-component website content updates
  useEffect(() => {
    const handleUpdate = () => {
      setEvents(websiteContentService.getContent().timeline)
    }
    window.addEventListener('ogsoreg_website_content_updated', handleUpdate)
    return () => window.removeEventListener('ogsoreg_website_content_updated', handleUpdate)
  }, [])

  const year = currentDate.getFullYear()
  const monthIndex = currentDate.getMonth()

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, monthIndex - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, monthIndex + 1, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  // Filtered events based on active category checkboxes
  const visibleEvents = useMemo(() => {
    return events.filter((ev) => {
      const cat = ev.category || 'umum'
      return selectedCategories[cat] !== false
    })
  }, [events, selectedCategories])

  // Calendar Grid Days for current month
  const gridDays = useMemo(() => {
    return getMonthCalendarGrid(year, monthIndex)
  }, [year, monthIndex])

  // Map each day's events
  const dayEventsMap = useMemo(() => {
    const map: Record<string, TimelineEvent[]> = {}
    gridDays.forEach((day) => {
      map[day.dateStr] = visibleEvents.filter((ev) => isEventOnDate(ev, day.dateStr))
    })
    return map
  }, [gridDays, visibleEvents])

  // Mini-calendar days for sidebar
  const miniCalendarDays = useMemo(() => {
    return getMonthCalendarGrid(year, monthIndex)
  }, [year, monthIndex])

  // Agenda items for currently viewed month
  const currentMonthAgendaItems = useMemo(() => {
    const monthStr = String(monthIndex + 1).padStart(2, '0')
    const prefix = `${year}-${monthStr}`

    return visibleEvents
      .filter((ev) => {
        const { startDate, endDate } = parseEventDate(ev)
        if (startDate.startsWith(prefix)) return true
        if (endDate && endDate.startsWith(prefix)) return true
        return false
      })
      .sort((a, b) => {
        const dateA = parseEventDate(a).startDate
        const dateB = parseEventDate(b).startDate
        return dateA.localeCompare(dateB)
      })
  }, [visibleEvents, year, monthIndex])

  // Category toggle handler
  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }))
  }

  const toggleAllCategories = (select: boolean) => {
    const updated: Record<string, boolean> = {}
    Object.keys(CATEGORIES_CONFIG).forEach((catId) => {
      updated[catId] = select
    })
    setSelectedCategories(updated)
  }

  // CRUD Actions (Guarded strictly for superadmin)
  const handleOpenCreateForDate = (dateStr: string) => {
    if (!canManage) return
    setEventToEdit(null)
    setFormInitialDate(dateStr)
    setIsFormOpen(true)
  }

  const handleOpenEditEvent = (event: TimelineEvent) => {
    if (!canManage) return
    setEventToEdit(event)
    setFormInitialDate(undefined)
    setIsFormOpen(true)
  }

  const handleSaveEvent = (payload: Partial<TimelineEvent>) => {
    if (!canManage) return
    if (eventToEdit) {
      websiteContentService.updateTimelineEvent(eventToEdit.id, payload)
    } else {
      websiteContentService.addTimelineEvent(payload as any)
    }
    setEvents(websiteContentService.getContent().timeline)
  }

  const handleDeleteEvent = (id: string) => {
    if (!canManage) return
    websiteContentService.deleteTimelineEvent(id)
    setEvents(websiteContentService.getContent().timeline)
  }

  const handleOpenOverflow = (dateStr: string) => {
    setOverflowDateStr(dateStr)
    setIsOverflowOpen(true)
  }

  const handleSelectEvent = (event: TimelineEvent) => {
    setSelectedEvent(event)
    setIsDetailOpen(true)
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* ========================================================================= */}
      {/* 1. CALENDAR MAIN TOOLBAR (Lush Emerald Aesthetic & Google Calendar View)  */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0C241B] via-[#14532D] to-[#0A2017] text-white p-5 sm:p-6 shadow-xl border border-emerald-900/40 overflow-hidden">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-10 w-80 h-80 bg-radial from-emerald-400/15 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-radial from-[#A7F3D0]/10 to-transparent blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Left: Brand Icon, Today Button, Prev/Next Arrows, Month-Year Heading */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 rounded-2xl bg-emerald-950/90 border border-emerald-500/30 text-[#A7F3D0] flex items-center justify-center shadow-lg shadow-emerald-950/30 shrink-0">
                  <CalendarDays className="w-5 h-5 text-[#A7F3D0]" />
                </div>

                {/* Today Button */}
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-4 py-2 rounded-xl text-xs font-black text-[#0C241B] bg-gradient-to-r from-[#A7F3D0] to-[#86EFAC] hover:opacity-95 transition-all shadow-sm cursor-pointer active:scale-95"
                  title="Kembali ke Bulan Berjalan"
                >
                  Hari Ini
                </button>
              </div>

              {/* Prev / Next Month Arrows */}
              <div className="flex items-center rounded-xl border border-white/10 bg-black/25 backdrop-blur-sm p-0.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg text-emerald-100/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Bulan Sebelumnya"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg text-emerald-100/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Bulan Berikutnya"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Month & Year Title */}
              <div className="pl-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {INDONESIAN_MONTHS[monthIndex]} {year}
                  </h2>
                  {year === 2026 && monthIndex === 10 && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#A7F3D0]/20 text-[#A7F3D0] border border-[#A7F3D0]/30">
                      <Sparkles className="w-3 h-3 text-[#A7F3D0]" />
                      Bulan Puncak OGSO
                    </span>
                  )}
                </div>
                <div className="text-xs text-emerald-200/80 font-medium">
                  {monthIndex === 9
                    ? 'Rabi’ul Akhir – Jumadal Ula 1448 H'
                    : monthIndex === 10
                    ? 'Jumadal Ula – Jumadal Akhirah 1448 H'
                    : monthIndex === 11
                    ? 'Jumadal Akhirah – Rajab 1448 H'
                    : 'Tahun Akademik 1448 H'}
                </div>
              </div>
            </div>

            {/* Right: View Mode Toggle (Grid vs 3-Card Agenda), Filter, Superadmin Create */}
            <div className="flex flex-wrap items-center gap-2.5 justify-start lg:justify-end">
              {/* View Switcher: Monthly Grid vs 3-Card Agenda */}
              <div className="flex items-center p-1 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-[#166534] to-[#15803D] text-white shadow-md border border-emerald-400/40'
                      : 'text-emerald-100/70 hover:text-white'
                  )}
                  title="Tampilan Grid Kalender Bulanan"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>Kalender Bulan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('agenda')}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    viewMode === 'agenda'
                      ? 'bg-gradient-to-r from-[#166534] to-[#15803D] text-white shadow-md border border-emerald-400/40'
                      : 'text-emerald-100/70 hover:text-white'
                  )}
                  title="Tampilan Daftar Agenda 3 Card"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Daftar Agenda (3 Card)</span>
                </button>
              </div>

              {/* Toggle Filter Sidebar Button */}
              <button
                type="button"
                onClick={() => setSidebarOpen((prev) => !prev)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer',
                  sidebarOpen
                    ? 'bg-emerald-900/80 border-emerald-400/50 text-[#A7F3D0]'
                    : 'bg-black/25 border-white/10 text-emerald-100 hover:bg-black/40'
                )}
                title="Filter Kategori Agenda"
              >
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filter</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono font-bold">
                  {Object.values(selectedCategories).filter(Boolean).length}
                </span>
              </button>

              {/* Superadmin Only: Create Event Button */}
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleOpenCreateForDate(formatToDateStr(new Date(year, monthIndex, 1)))}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-[#0C241B] bg-gradient-to-r from-[#FDE68A] via-[#FBBF24] to-[#D97706] shadow-md hover:brightness-105 transition-all cursor-pointer active:scale-95 border border-amber-300"
                  title="Kelola & Tambah Agenda (Superadmin)"
                >
                  <ShieldCheck className="w-4 h-4 text-[#0C241B]" />
                  <span>Tambah Agenda</span>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Category Filter Pills Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-emerald-900/50">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300/80 mr-1">
              Filter Kategori:
            </span>
            {Object.values(CATEGORIES_CONFIG).map((cat) => {
              const isChecked = selectedCategories[cat.id] !== false
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer',
                    isChecked
                      ? 'bg-black/30 border-white/25 text-white shadow-xs'
                      : 'bg-black/15 text-white/40 border-dashed border-white/15 line-through'
                  )}
                >
                  <span
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-transform',
                      isChecked ? 'scale-100 ring-2 ring-white/30' : 'scale-50 opacity-40'
                    )}
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CALENDAR WORKSPACE: SIDEBAR + MAIN (7-COLUMN GRID OR 3-CARD AGENDAS)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SIDEBAR: Mini Calendar + Filter Controls (Collapsible) */}
        {sidebarOpen && (
          <aside className="lg:col-span-3 space-y-5 animate-in fade-in duration-200">
            {/* Mini Calendar Widget */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#0C241B]">
                  {INDONESIAN_MONTHS[monthIndex]} {year}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Mini Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                {WEEKDAYS_SUNDAY_FIRST.map((d) => (
                  <span key={d.short} className="font-bold text-slate-400 py-1">
                    {d.short.slice(0, 2)}
                  </span>
                ))}
                {miniCalendarDays.slice(0, 35).map((day, idx) => {
                  const hasEvents = (dayEventsMap[day.dateStr] || []).length > 0
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (canManage) {
                          handleOpenCreateForDate(day.dateStr)
                        } else if (hasEvents) {
                          handleOpenOverflow(day.dateStr)
                        }
                      }}
                      className={cn(
                        'w-7 h-7 mx-auto rounded-full flex flex-col items-center justify-center font-semibold transition-all relative',
                        day.isToday
                          ? 'bg-[#166534] text-white font-black shadow-xs'
                          : day.isCurrentMonth
                          ? 'text-slate-800 hover:bg-emerald-50 hover:text-[#166534]'
                          : 'text-slate-300'
                      )}
                    >
                      <span>{day.dayNumber}</span>
                      {hasEvents && !day.isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#166534] -mt-0.5" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Category Filter Box */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Kategori Agenda
                </h4>
                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => toggleAllCategories(true)}
                    className="text-[#166534] font-bold hover:underline cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => toggleAllCategories(false)}
                    className="text-slate-500 font-medium hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {Object.values(CATEGORIES_CONFIG).map((cat) => {
                  const isChecked = selectedCategories[cat.id] !== false
                  const count = visibleEvents.filter((e) => e.category === cat.id).length

                  return (
                    <label
                      key={cat.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'w-4 h-4 rounded-md border flex items-center justify-center transition-colors',
                            isChecked
                              ? 'border-transparent text-white'
                              : 'border-slate-300 bg-white'
                          )}
                          style={{
                            backgroundColor: isChecked ? cat.color : undefined,
                          }}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                          {cat.label}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {count}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          </aside>
        )}

        {/* MAIN CALENDAR CONTAINER (7-Column Monthly Grid OR 3-Card Agenda View) */}
        <main
          className={cn(
            'bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all',
            sidebarOpen ? 'lg:col-span-9' : 'lg:col-span-12'
          )}
        >
          {/* ===================================================================== */}
          {/* VIEW MODE A: 7-COLUMN GOOGLE CALENDAR-STYLE MONTHLY GRID              */}
          {/* ===================================================================== */}
          {viewMode === 'grid' && (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[700px] sm:min-w-0">
                {/* Seven Weekday Column Headers (Sunday - Saturday / Ahad - Sabtu) */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 divide-x divide-slate-200">
                  {WEEKDAYS_SUNDAY_FIRST.map((day, idx) => (
                    <div
                      key={day.full}
                      className={cn(
                        'py-3.5 px-2 text-center select-none',
                        idx === 0
                          ? 'bg-rose-50/50'
                          : idx === 5
                          ? 'bg-emerald-50/50'
                          : 'bg-slate-50/80'
                      )}
                    >
                      <div
                        className={cn(
                          'text-xs font-black uppercase tracking-wider',
                          idx === 0
                            ? 'text-rose-600'
                            : idx === 5
                            ? 'text-[#166534]'
                            : 'text-slate-700'
                        )}
                      >
                        <span className="hidden sm:inline">{day.full}</span>
                        <span className="sm:hidden">{day.short}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calendar Grid Cells */}
                <div className="grid grid-cols-7 divide-x divide-slate-200 border-b border-slate-200 bg-slate-200">
                  {gridDays.map((cell) => {
                    const dayEvents = dayEventsMap[cell.dateStr] || []
                    const maxVisibleEvents = 3
                    const visibleChips = dayEvents.slice(0, maxVisibleEvents)
                    const overflowCount = Math.max(0, dayEvents.length - maxVisibleEvents)

                    return (
                      <div
                        key={cell.dateStr}
                        onClick={() => {
                          // Public / Non-superadmin: clicking cell only views details/overflow
                          if (dayEvents.length === 1) {
                            handleSelectEvent(dayEvents[0])
                          } else if (dayEvents.length > 1) {
                            handleOpenOverflow(cell.dateStr)
                          } else if (canManage) {
                            // Superadmin can create event on empty cell
                            handleOpenCreateForDate(cell.dateStr)
                          }
                        }}
                        className={cn(
                          'min-h-[105px] sm:min-h-[140px] lg:min-h-[155px] p-1.5 sm:p-2 bg-white flex flex-col justify-between transition-colors relative group border-b border-slate-200',
                          !cell.isCurrentMonth && 'bg-slate-50/65 text-slate-400',
                          cell.isToday && 'bg-emerald-50/40 ring-2 ring-inset ring-[#166534]/40',
                          dayEvents.length > 0 && 'cursor-pointer hover:bg-slate-50/80'
                        )}
                      >
                        {/* Cell Header: Date Number & Today indicator */}
                        <div className="flex items-center justify-between mb-1.5">
                          {/* Quick '+' button on hover (strictly visible to superadmin only) */}
                          {canManage ? (
                            <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenCreateForDate(cell.dateStr)
                                }}
                                className="w-5 h-5 rounded-full bg-emerald-100 text-[#166534] hover:bg-[#166534] hover:text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                title="Tambah Agenda di Tanggal Ini (Superadmin)"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span />
                          )}

                          {/* Date Number Badge */}
                          <div className="flex items-center gap-1.5 ml-auto">
                            {cell.isToday && (
                              <span className="hidden md:inline-block text-[9px] font-black uppercase text-[#166534] bg-emerald-100/90 px-1.5 py-0.5 rounded-md">
                                Hari Ini
                              </span>
                            )}
                            <div
                              className={cn(
                                'w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-black transition-all',
                                cell.isToday
                                  ? 'bg-gradient-to-br from-[#166534] to-[#0C241B] text-white shadow-md ring-2 ring-emerald-300'
                                  : cell.isCurrentMonth
                                  ? 'text-slate-800'
                                  : 'text-slate-300'
                              )}
                            >
                              {cell.dayNumber}
                            </div>
                          </div>
                        </div>

                        {/* Event Chips List — Full Text Rendering without Truncation */}
                        <div className="space-y-1.5 flex-1">
                          {visibleChips.map((ev) => {
                            const catMeta =
                              CATEGORIES_CONFIG[ev.category] || FALLBACK_CATEGORY
                            const dayPos = getEventDayPosition(ev, cell.dateStr)
                            const isMulti = dayPos !== 'single'

                            return (
                              <div
                                key={`${ev.id}-${cell.dateStr}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSelectEvent(ev)
                                }}
                                className={cn(
                                  'text-[10px] sm:text-[11px] px-2 py-1.5 font-bold transition-all cursor-pointer flex items-start gap-1.5 shadow-2xs hover:scale-[1.01] hover:shadow-xs whitespace-normal break-words leading-tight',
                                  isMulti
                                    ? 'text-white'
                                    : 'border bg-white text-slate-800 hover:border-slate-400',
                                  dayPos === 'start'
                                    ? 'rounded-l-xl rounded-r-none mr-[-6px] sm:mr-[-8px] z-10'
                                    : dayPos === 'end'
                                    ? 'rounded-r-xl rounded-l-none ml-[-6px] sm:ml-[-8px]'
                                    : dayPos === 'middle'
                                    ? 'rounded-none mx-[-6px] sm:mx-[-8px]'
                                    : 'rounded-xl'
                                )}
                                style={
                                  isMulti
                                    ? { backgroundColor: catMeta.color }
                                    : {
                                        backgroundColor: `${catMeta.color}18`,
                                        borderColor: `${catMeta.color}45`,
                                        color: '#0F172A',
                                      }
                                }
                                title={`${ev.title} (${ev.time || 'Waktu fleksibel'})`}
                              >
                                {!isMulti && (
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                                    style={{ backgroundColor: catMeta.color }}
                                  />
                                )}

                                <div className="flex-1 min-w-0">
                                  {ev.startTime && !isMulti && (
                                    <span className="block text-[9px] font-semibold text-slate-500 mb-0.5">
                                      {ev.startTime} WIB
                                    </span>
                                  )}
                                  <span
                                    className={cn(
                                      'font-bold block leading-snug break-words',
                                      isMulti ? 'text-white' : 'text-slate-900'
                                    )}
                                  >
                                    {ev.title}
                                  </span>
                                </div>
                              </div>
                            )
                          })}

                          {/* "+N More" Indicator Chip */}
                          {overflowCount > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenOverflow(cell.dateStr)
                              }}
                              className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-extrabold text-[#166534] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                            >
                              +{overflowCount} agenda lainnya...
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW MODE B: 3-CARD SIDE-BY-SIDE AGENDA VIEW (Sesuai Permintaan User) */}
          {/* ===================================================================== */}
          {viewMode === 'agenda' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#166534] border border-emerald-200">
                    <CalendarDays className="w-3.5 h-3.5 text-[#166534]" />
                    <span>Daftar Agenda Resmi 3 Card</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#0C241B]">
                    Rangkaian Kegiatan Bulan {INDONESIAN_MONTHS[monthIndex]} {year}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Menampilkan rincian agenda pelaksanaan terpadu antarkampus secara terstruktur.
                  </p>
                </div>

                <div className="text-xs font-extrabold text-slate-700 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                  Total: {currentMonthAgendaItems.length} Agenda
                </div>
              </div>

              {currentMonthAgendaItems.length > 0 ? (
                /* 3 Cards Side-by-Side Responsive Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                  {currentMonthAgendaItems.map((event) => {
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
                      <div
                        key={event.id}
                        onClick={() => handleSelectEvent(event)}
                        className="group bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-500/70 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer relative"
                      >
                        {/* Top Category Accent Line */}
                        <div
                          className="h-2 w-full transition-transform group-hover:scale-x-105 duration-300"
                          style={{ backgroundColor: catMeta.color }}
                        />

                        <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-3.5">
                            {/* Card Top: Category Badge & Status */}
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shadow-2xs"
                                style={{
                                  backgroundColor: `${catMeta.color}15`,
                                  color: catMeta.color,
                                  borderColor: `${catMeta.color}35`,
                                }}
                              >
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: catMeta.color }}
                                />
                                {catMeta.label}
                              </span>

                              {event.isTentative ? (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                  Tentatif
                                </span>
                              ) : event.isCompleted ? (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  Selesai
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                                  Terjadwal
                                </span>
                              )}
                            </div>

                            {/* Date Badge & Day info */}
                            <div className="flex items-start gap-3.5 pt-1">
                              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/70 text-[#166534] border border-emerald-200/80 flex flex-col items-center justify-center shrink-0 shadow-xs group-hover:bg-[#166534] group-hover:text-white transition-all duration-300">
                                <span className="text-[10px] uppercase font-black tracking-wider opacity-80">
                                  {startDate.split('-')[1]
                                    ? INDONESIAN_MONTHS[
                                        parseInt(startDate.split('-')[1], 10) - 1
                                      ]?.slice(0, 3)
                                    : ''}
                                </span>
                                <span className="text-xl font-black leading-none">
                                  {startDate.split('-')[2]}
                                </span>
                              </div>

                              <div className="space-y-0.5">
                                <div className="text-xs font-bold text-slate-800">
                                  {dateDisplayStr}
                                </div>
                                {event.hijriDate && (
                                  <div className="text-[11px] font-semibold text-emerald-800">
                                    {event.hijriDate}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Title */}
                            <h4 className="font-black text-base sm:text-lg text-[#0C241B] group-hover:text-[#166534] transition-colors line-clamp-2 leading-snug">
                              {event.title}
                            </h4>

                            {/* Target Levels / Jenjang */}
                            {event.levels && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700">
                                <GraduationCap className="w-3.5 h-3.5 text-[#166534] shrink-0" />
                                <span className="truncate">{event.levels}</span>
                              </div>
                            )}

                            {/* Description Excerpt */}
                            {event.description && (
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                                {event.description}
                              </p>
                            )}
                          </div>

                          {/* Card Footer: Time, Location, and Detail CTA */}
                          <div className="pt-4 border-t border-slate-100 space-y-2 mt-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                              <Clock className="w-3.5 h-3.5 text-[#166534] shrink-0" />
                              <span className="truncate">{timeDisplayStr}</span>
                            </div>

                            {event.location && (
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}

                            <div className="pt-2 flex items-center justify-between text-xs font-extrabold text-[#166534] group-hover:text-emerald-700">
                              <span>Rincian Kegiatan</span>
                              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <CalendarIcon className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-sm font-semibold">
                    Tidak ada agenda resmi terjadwal pada bulan ini.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTION MODALS                                                     */}
      {/* ========================================================================= */}
      {/* Modal 1: Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={handleOpenEditEvent}
        onDelete={handleDeleteEvent}
        canManage={canManage}
      />

      {/* Modal 2: Event Form (Create / Edit) Modal (Superadmin Only) */}
      {canManage && (
        <EventFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveEvent}
          initialDate={formInitialDate}
          eventToEdit={eventToEdit}
        />
      )}

      {/* Modal 3: Overflow "+N More" List Modal */}
      <DayEventsOverflowModal
        isOpen={isOverflowOpen}
        dateStr={overflowDateStr || ''}
        events={overflowDateStr ? dayEventsMap[overflowDateStr] || [] : []}
        onClose={() => setIsOverflowOpen(false)}
        onSelectEvent={handleSelectEvent}
        onAddNewEvent={handleOpenCreateForDate}
        canManage={canManage}
      />
    </div>
  )
}
