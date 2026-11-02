import React, { useState, useEffect } from 'react'
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Tag,
} from 'lucide-react'
import type { TimelineEvent } from '../../services/websiteContentService'
import {
  CATEGORIES_CONFIG,
  FALLBACK_CATEGORY,
  formatIndonesianDateDisplay,
  formatToDateStr,
  parseEventDate,
} from '../../lib/calendarUtils'

interface EventFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (eventData: Partial<TimelineEvent>) => void
  initialDate?: string // YYYY-MM-DD
  eventToEdit?: TimelineEvent | null
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  eventToEdit,
}) => {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<string>('persiapan')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isMultiDay, setIsMultiDay] = useState(false)
  const [isAllDay, setIsAllDay] = useState(false)
  const [startTime, setStartTime] = useState('20:00')
  const [endTime, setEndTime] = useState('21:30')
  const [location, setLocation] = useState('')
  const [levels, setLevels] = useState('')
  const [hijriDate, setHijriDate] = useState('')
  const [description, setDescription] = useState('')
  const [isTentative, setIsTentative] = useState(false)

  // Initialize form fields when opening or editing
  useEffect(() => {
    if (!isOpen) return

    if (eventToEdit) {
      const parsed = parseEventDate(eventToEdit)
      setTitle(eventToEdit.title || '')
      setCategory(eventToEdit.category || 'persiapan')
      setStartDate(parsed.startDate)
      setEndDate(parsed.endDate || '')
      setIsMultiDay(Boolean(parsed.endDate && parsed.endDate !== parsed.startDate))
      setIsAllDay(Boolean(eventToEdit.isAllDay))
      setStartTime(eventToEdit.startTime || '20:00')
      setEndTime(eventToEdit.endTime || '21:30')
      setLocation(eventToEdit.location || '')
      setLevels(eventToEdit.levels || '')
      setHijriDate(eventToEdit.hijriDate || '')
      setDescription(eventToEdit.description || '')
      setIsTentative(Boolean(eventToEdit.isTentative))
    } else {
      const defaultDate = initialDate || formatToDateStr(new Date())
      setTitle('')
      setCategory('persiapan')
      setStartDate(defaultDate)
      setEndDate(defaultDate)
      setIsMultiDay(false)
      setIsAllDay(false)
      setStartTime('20:00')
      setEndTime('21:30')
      setLocation('')
      setLevels('')
      setHijriDate('')
      setDescription('')
      setIsTentative(false)
    }
  }, [isOpen, eventToEdit, initialDate])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !startDate) return

    const finalEndDate = isMultiDay && endDate && endDate >= startDate ? endDate : undefined

    // Generate formatted date display string
    const dateDisplay =
      finalEndDate && finalEndDate !== startDate
        ? `${formatIndonesianDateDisplay(startDate)} – ${formatIndonesianDateDisplay(finalEndDate)}`
        : formatIndonesianDateDisplay(startDate)

    // Formatted time range string
    const timeDisplay = isAllDay
      ? 'Sepanjang Hari'
      : startTime && endTime
      ? `${startTime} – ${endTime} WIB`
      : startTime
      ? `Pukul ${startTime} WIB`
      : undefined

    const payload: Partial<TimelineEvent> = {
      title: title.trim(),
      category: category as TimelineEvent['category'],
      startDate,
      endDate: finalEndDate,
      dateDisplay,
      isAllDay,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      time: timeDisplay,
      location: location.trim() || undefined,
      levels: levels.trim() || undefined,
      hijriDate: hijriDate.trim() || undefined,
      description: description.trim() || undefined,
      isTentative,
    }

    onSave(payload)
    onClose()
  }

  const selectedCategoryMeta =
    CATEGORIES_CONFIG[category] || FALLBACK_CATEGORY

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
      >
        {/* Accent Color Header Bar */}
        <div
          className="h-2 w-full transition-colors"
          style={{ backgroundColor: selectedCategoryMeta.color }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
          <div>
            <h3
              id="form-modal-title"
              className="text-xl font-extrabold text-[#0C241B]"
            >
              {eventToEdit ? 'Ubah Rincian Agenda' : 'Tambah Agenda Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Agenda akan langsung diperbarui pada Kalender Bulanan dan Timeline kegiatan.
            </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[68vh] overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Judul Agenda <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Babak Final Jenjang 1 & 2"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] focus:border-transparent font-medium"
              />
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kategori Agenda <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(CATEGORIES_CONFIG).map((cat) => {
                  const isSelected = category === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'border-[#166534] bg-emerald-50 text-emerald-950 ring-1 ring-[#166534]'
                          : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Dates: Start & End */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#166534]" />
                  Pengaturan Tanggal
                </span>

                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isMultiDay}
                    onChange={(e) => setIsMultiDay(e.target.checked)}
                    className="rounded text-[#166534] focus:ring-[#166534] w-4 h-4 cursor-pointer"
                  />
                  <span>Rentang Multi-hari</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {isMultiDay ? 'Tanggal Mulai' : 'Tanggal Pelaksanaan'}
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      if (!isMultiDay || !endDate || endDate < e.target.value) {
                        setEndDate(e.target.value)
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#166534] focus:outline-none bg-white"
                  />
                </div>

                {isMultiDay && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tanggal Berakhir
                    </label>
                    <input
                      type="date"
                      required
                      min={startDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#166534] focus:outline-none bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Time Settings */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#166534]" />
                  Waktu Pelaksanaan
                </span>

                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="rounded text-[#166534] focus:ring-[#166534] w-4 h-4 cursor-pointer"
                  />
                  <span>Sepanjang Hari</span>
                </label>
              </div>

              {!isAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Waktu Mulai (WIB)
                    </label>
                    <input
                      type="text"
                      placeholder="20:00"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#166534] focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Waktu Selesai (WIB)
                    </label>
                    <input
                      type="text"
                      placeholder="21:30"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#166534] focus:outline-none bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Location & Target Levels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lokasi / Media
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: CBT SEB & Zoom Meeting"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#166534] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sasaran Jenjang (Opsional)
                </label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={levels}
                    onChange={(e) => setLevels(e.target.value)}
                    placeholder="Contoh: Kelas 1 KMI & Kelas 2 KMI"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#166534] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Hijri Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Keterangan Tanggal Hijriah (Opsional)
              </label>
              <input
                type="text"
                value={hijriDate}
                onChange={(e) => setHijriDate(e.target.value)}
                placeholder="Contoh: 26 Jumadal Ula 1448"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#166534] focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Deskripsi / Catatan Agenda
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rincian teknis pelaksanaan, materi ujian, atau koordinasi antar-kampus..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#166534] focus:outline-none"
              />
            </div>

            {/* Tentative Checkbox */}
            <div className="pt-2">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isTentative}
                  onChange={(e) => setIsTentative(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span>Tandai sebagai jadwal tentatif (dapat berubah sewaktu-waktu)</span>
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              className="px-6 py-2 rounded-xl text-xs font-bold bg-[#166534] text-white hover:bg-[#0F3D20] shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {eventToEdit ? 'Simpan Perubahan' : 'Tambahkan Agenda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
