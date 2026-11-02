import type { TimelineEvent } from '../services/websiteContentService'

export interface CalendarDay {
  date: Date
  dateStr: string // YYYY-MM-DD
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  dayOfWeek: number // 0=Sunday, 1=Monday, ..., 6=Saturday
  hijriDate?: string
}

export interface CategoryMeta {
  id: string
  label: string
  badgeText: string
  color: string // Tailwind color class or hex
  dotColor: string
  chipBg: string
  chipBorder: string
  chipText: string
  darkChipBg: string
}

export const CATEGORIES_CONFIG: Record<string, CategoryMeta> = {
  persiapan: {
    id: 'persiapan',
    label: 'Persiapan & TM',
    badgeText: 'Persiapan',
    color: '#059669',
    dotColor: 'bg-emerald-500',
    chipBg: 'bg-emerald-50',
    chipBorder: 'border-emerald-300',
    chipText: 'text-emerald-900',
    darkChipBg: 'bg-emerald-950/40 text-emerald-300 border-emerald-800',
  },
  simulasi: {
    id: 'simulasi',
    label: 'Simulasi CBT & SEB',
    badgeText: 'Simulasi',
    color: '#0284c7',
    dotColor: 'bg-sky-500',
    chipBg: 'bg-sky-50',
    chipBorder: 'border-sky-300',
    chipText: 'text-sky-900',
    darkChipBg: 'bg-sky-950/40 text-sky-300 border-sky-800',
  },
  seremoni: {
    id: 'seremoni',
    label: 'Pembukaan Resmi',
    badgeText: 'Pembukaan',
    color: '#4f46e5',
    dotColor: 'bg-indigo-500',
    chipBg: 'bg-indigo-50',
    chipBorder: 'border-indigo-300',
    chipText: 'text-indigo-900',
    darkChipBg: 'bg-indigo-950/40 text-indigo-300 border-indigo-800',
  },
  penyisihan: {
    id: 'penyisihan',
    label: 'Babak Penyisihan',
    badgeText: 'Penyisihan',
    color: '#d97706',
    dotColor: 'bg-amber-500',
    chipBg: 'bg-amber-50',
    chipBorder: 'border-amber-300',
    chipText: 'text-amber-900',
    darkChipBg: 'bg-amber-950/40 text-amber-300 border-amber-800',
  },
  final: {
    id: 'final',
    label: 'Babak Final',
    badgeText: 'Final',
    color: '#e11d48',
    dotColor: 'bg-rose-500',
    chipBg: 'bg-rose-50',
    chipBorder: 'border-rose-300',
    chipText: 'text-rose-900',
    darkChipBg: 'bg-rose-950/40 text-rose-300 border-rose-800',
  },
  penutupan: {
    id: 'penutupan',
    label: 'Penutupan & Awarding',
    badgeText: 'Penutupan',
    color: '#9333ea',
    dotColor: 'bg-purple-500',
    chipBg: 'bg-purple-50',
    chipBorder: 'border-purple-300',
    chipText: 'text-purple-900',
    darkChipBg: 'bg-purple-950/40 text-purple-300 border-purple-800',
  },
}

export const FALLBACK_CATEGORY: CategoryMeta = {
  id: 'umum',
  label: 'Kegiatan Resmi',
  badgeText: 'Kegiatan',
  color: '#166534',
  dotColor: 'bg-emerald-600',
  chipBg: 'bg-emerald-50',
  chipBorder: 'border-emerald-300',
  chipText: 'text-emerald-950',
  darkChipBg: 'bg-emerald-950/40 text-emerald-300 border-emerald-800',
}

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

export const WEEKDAYS_SUNDAY_FIRST = [
  { short: 'Min', full: 'Ahad', en: 'Sun' },
  { short: 'Sen', full: 'Senin', en: 'Mon' },
  { short: 'Sel', full: 'Selasa', en: 'Tue' },
  { short: 'Rab', full: 'Rabu', en: 'Wed' },
  { short: 'Kam', full: 'Kamis', en: 'Thu' },
  { short: 'Jum', full: 'Jum’at', en: 'Fri' },
  { short: 'Sab', full: 'Sabtu', en: 'Sat' },
]

/**
 * Normalizes date object into 'YYYY-MM-DD' in local time
 */
export function formatToDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parses date string or event into YYYY-MM-DD
 */
export function parseEventDate(event: TimelineEvent): { startDate: string; endDate?: string } {
  if (event.startDate && /^\d{4}-\d{2}-\d{2}$/.test(event.startDate)) {
    return {
      startDate: event.startDate,
      endDate: event.endDate && /^\d{4}-\d{2}-\d{2}$/.test(event.endDate) ? event.endDate : undefined,
    }
  }

  // Attempt to parse dateDisplay (e.g. "Jum’at, 30 Oktober 2026" or "30 Oktober 2026")
  const text = event.dateDisplay || ''

  // Indonesian month map
  const monthMap: Record<string, string> = {
    januari: '01',
    februari: '02',
    maret: '03',
    april: '04',
    mei: '05',
    juni: '06',
    juli: '07',
    agustus: '08',
    september: '09',
    oktober: '10',
    november: '11',
    desember: '12',
  }

  // Match: e.g. "30 Oktober 2026" or "31 Oktober 2026 – 3 November 2026"
  const matches = [...text.matchAll(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/g)]
  if (matches.length > 0) {
    const firstMatch = matches[0]
    const day = String(parseInt(firstMatch[1], 10)).padStart(2, '0')
    const month = monthMap[firstMatch[2].toLowerCase()] || '11'
    const year = firstMatch[3]
    const startDate = `${year}-${month}-${day}`

    let endDate: string | undefined
    if (matches.length > 1) {
      const secondMatch = matches[1]
      const endDay = String(parseInt(secondMatch[1], 10)).padStart(2, '0')
      const endMonth = monthMap[secondMatch[2].toLowerCase()] || month
      const endYear = secondMatch[3]
      endDate = `${endYear}-${endMonth}-${endDay}`
    }

    return { startDate, endDate }
  }

  // Fallback to today
  const todayStr = formatToDateStr(new Date())
  return { startDate: todayStr }
}

/**
 * Checks whether an event falls on a specific date (handles multi-day spans)
 */
export function isEventOnDate(event: TimelineEvent, dateStr: string): boolean {
  const { startDate, endDate } = parseEventDate(event)
  if (!endDate) {
    return startDate === dateStr
  }
  return dateStr >= startDate && dateStr <= endDate
}

/**
 * Gets position info for multi-day events
 */
export function getEventDayPosition(event: TimelineEvent, dateStr: string): 'single' | 'start' | 'middle' | 'end' {
  const { startDate, endDate } = parseEventDate(event)
  if (!endDate || startDate === endDate) {
    return 'single'
  }
  if (dateStr === startDate) return 'start'
  if (dateStr === endDate) return 'end'
  if (dateStr > startDate && dateStr < endDate) return 'middle'
  return 'single'
}

/**
 * Formats date into readable Indonesian string (e.g., "Sabtu, 7 November 2026")
 */
export function formatIndonesianDateDisplay(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    if (!y || !m || !d) return dateStr
    const date = new Date(y, m - 1, d)
    const dayName = WEEKDAYS_SUNDAY_FIRST[date.getDay()].full
    const monthName = INDONESIAN_MONTHS[m - 1]
    return `${dayName}, ${d} ${monthName} ${y}`
  } catch {
    return dateStr
  }
}

/**
 * Generates the full 7-column grid of days for a given month & year,
 * arranged Sunday to Saturday. Returns 35 or 42 days (5 or 6 rows).
 */
export function getMonthCalendarGrid(year: number, monthIndex: number): CalendarDay[] {
  const today = new Date()
  const todayStr = formatToDateStr(today)

  const firstDayOfMonth = new Date(year, monthIndex, 1)
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0)

  // Sunday = 0, Monday = 1, ..., Saturday = 6
  const startDayOfWeek = firstDayOfMonth.getDay()
  const daysInCurrentMonth = lastDayOfMonth.getDate()

  const gridDays: CalendarDay[] = []

  // 1. Trailing days from previous month
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i
    const d = new Date(year, monthIndex - 1, dayNum)
    const dStr = formatToDateStr(d)
    gridDays.push({
      date: d,
      dateStr: dStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dStr === todayStr,
      dayOfWeek: d.getDay(),
    })
  }

  // 2. Days of current month
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    const d = new Date(year, monthIndex, i)
    const dStr = formatToDateStr(d)
    gridDays.push({
      date: d,
      dateStr: dStr,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: dStr === todayStr,
      dayOfWeek: d.getDay(),
    })
  }

  // 3. Leading days of next month to complete the row (target 35 or 42 cells)
  const remainingCells = (7 - (gridDays.length % 7)) % 7
  // Ensure at least 5 rows (35) or 6 rows (42) as Google Calendar does
  let targetTotal = gridDays.length + remainingCells
  if (targetTotal < 35) targetTotal = 35
  else if (targetTotal > 35 && targetTotal < 42) targetTotal = 42

  let nextDayNum = 1
  while (gridDays.length < targetTotal) {
    const d = new Date(year, monthIndex + 1, nextDayNum)
    const dStr = formatToDateStr(d)
    gridDays.push({
      date: d,
      dateStr: dStr,
      dayNumber: nextDayNum,
      isCurrentMonth: false,
      isToday: dStr === todayStr,
      dayOfWeek: d.getDay(),
    })
    nextDayNum++
  }

  return gridDays
}

/**
 * Formats time display like "20.00 – 21.30 WIB"
 */
export function formatTimeRange(start?: string, end?: string, isAllDay?: boolean, legacyTime?: string): string {
  if (isAllDay) return 'Sepanjang Hari'
  if (start && end) return `${start} – ${end} WIB`
  if (start) return `Pukul ${start} WIB`
  if (legacyTime) return legacyTime
  return 'Waktu Fleksibel'
}
