import React, { useState, useEffect } from 'react'
import {
  Save,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  websiteContentService,
  type WebsiteContentConfig,
  type TimelineEvent,
} from '../../services/websiteContentService'
import { Button } from '../ui/Button'
import { SectionCard } from '../ui/SectionCard'

export const WebsiteContentSettingsTab: React.FC = () => {
  const [config, setConfig] = useState<WebsiteContentConfig>(() =>
    websiteContentService.getContent()
  )
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'hero' | 'timeline' | 'contacts'>('hero')

  // Timeline add modal state
  const [newDateDisplay, setNewDateDisplay] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newLevels, setNewLevels] = useState('')
  const [newCategory, setNewCategory] = useState<TimelineEvent['category']>('penyisihan')

  useEffect(() => {
    setConfig(websiteContentService.getContent())
  }, [])

  const handleSaveHero = (e: React.FormEvent) => {
    e.preventDefault()
    websiteContentService.saveContent({
      hero: config.hero,
      competitionInfo: config.competitionInfo,
    })
    setSaveMessage('Konten Beranda (Hero & Informasi Umum) berhasil disimpan!')
    setTimeout(() => setSaveMessage(null), 4000)
  }

  const handleSaveTimeline = () => {
    websiteContentService.saveContent({
      timeline: config.timeline,
    })
    setSaveMessage('Rangkaian Jadwal & Timeline berhasil diperbarui!')
    setTimeout(() => setSaveMessage(null), 4000)
  }

  const handleSaveContacts = (e: React.FormEvent) => {
    e.preventDefault()
    websiteContentService.saveContent({
      contacts: config.contacts,
      officials: config.officials,
    })
    setSaveMessage('Informasi Kontak & Kepanitiaan berhasil diperbarui!')
    setTimeout(() => setSaveMessage(null), 4000)
  }

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan seluruh konten website publik ke data standar JUKLAK 2026?')) {
      const def = websiteContentService.resetToDefault()
      setConfig(def)
      setSaveMessage('Seluruh konten website publik dikembalikan ke standar resmi JUKLAK.')
      setTimeout(() => setSaveMessage(null), 4000)
    }
  }

  const handleDeleteTimelineItem = (id: string) => {
    const updated = config.timeline.filter((t) => t.id !== id)
    setConfig({ ...config, timeline: updated })
    websiteContentService.saveContent({ timeline: updated })
  }

  const handleAddTimelineItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newDateDisplay.trim()) return

    const newItem: TimelineEvent = {
      id: `timeline-${Date.now()}`,
      dateDisplay: newDateDisplay.trim(),
      title: newTitle.trim(),
      category: newCategory,
      time: newTime.trim() || undefined,
      levels: newLevels.trim() || undefined,
      isTentative: true,
    }

    const updated = [...config.timeline, newItem]
    setConfig({ ...config, timeline: updated })
    websiteContentService.saveContent({ timeline: updated })

    // Reset
    setNewTitle('')
    setNewDateDisplay('')
    setNewTime('')
    setNewLevels('')
    setSaveMessage('Agenda baru berhasil ditambahkan ke timeline publik!')
    setTimeout(() => setSaveMessage(null), 4000)
  }

  return (
    <div className="space-y-6">
      {saveMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{saveMessage}</span>
        </div>
      )}

      {/* Subnav for Website Content */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('hero')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'hero'
                ? 'bg-[#166534] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Banner & Teks Hero
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'timeline'
                ? 'bg-[#166534] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Jadwal & Timeline ({config.timeline.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'contacts'
                ? 'bg-[#166534] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Kontak & Kepanitiaan
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            leftIcon={<RotateCcw className="w-3.5 h-3.5 mr-1" />}
          >
            Reset ke JUKLAK 2026
          </Button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <span>Buka Website Publik</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>
        </div>
      </div>

      {/* TAB 1: HERO & GENERAL SETTINGS */}
      {activeTab === 'hero' && (
        <SectionCard
          title="Teks Beranda & Pengumuman Utama"
          subtitle="Sesuaikan teks headline, tema resmi, dan deskripsi publik website OGSO."
        >
          <form onSubmit={handleSaveHero} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wide">
                Banner Pengumuman Atas
              </label>
              <input
                type="text"
                value={config.hero.announcementBanner}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    hero: { ...config.hero, announcementBanner: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wide">
                Headline Tampilan (Display Headline)
              </label>
              <input
                type="text"
                value={config.hero.displayHeadline}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    hero: { ...config.hero, displayHeadline: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wide">
                Tema Resmi Perlombaan (Sesuai JUKLAK)
              </label>
              <textarea
                rows={2}
                value={config.hero.officialTheme}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    hero: { ...config.hero, officialTheme: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none leading-relaxed italic"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wide">
                Deskripsi Singkat Beranda (Subheadline)
              </label>
              <textarea
                rows={3}
                value={config.hero.subheadline}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    hero: { ...config.hero, subheadline: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wide">
                  Teks Tombol Utama
                </label>
                <input
                  type="text"
                  value={config.hero.primaryCtaText}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      hero: { ...config.hero, primaryCtaText: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wide">
                  Teks Tombol Sekunder
                </label>
                <input
                  type="text"
                  value={config.hero.secondaryCtaText}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      hero: { ...config.hero, secondaryCtaText: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<Save className="w-3.5 h-3.5 mr-1" />}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Simpan Perubahan Beranda
              </Button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* TAB 2: TIMELINE MANAGER */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <SectionCard
            title="Kelola Agenda & Timeline Publik"
            subtitle="Agenda yang aktif akan langsung muncul pada bagian Timeline di landing page."
          >
            <div className="space-y-4">
              {/* Add form */}
              <form
                onSubmit={handleAddTimelineItem}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs"
              >
                <div className="font-bold text-slate-800 uppercase tracking-wide">
                  Tambah Agenda Baru
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-medium text-slate-700">Nama Agenda / Kegiatan</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Contoh: Babak Penyisihan Jenjang 1 & 2"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Tampilan Hari & Tanggal</label>
                    <input
                      type="text"
                      required
                      value={newDateDisplay}
                      onChange={(e) => setNewDateDisplay(e.target.value)}
                      placeholder="Sabtu, 7 November 2026"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Kategori</label>
                    <select
                      value={newCategory}
                      onChange={(e) =>
                        setNewCategory(e.target.value as TimelineEvent['category'])
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="persiapan">Persiapan / TM</option>
                      <option value="simulasi">Simulasi CBT</option>
                      <option value="seremoni">Pembukaan</option>
                      <option value="penyisihan">Babak Penyisihan</option>
                      <option value="final">Babak Final</option>
                      <option value="penutupan">Penutupan / Award</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Waktu (Opsional)</label>
                    <input
                      type="text"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      placeholder="20.00 - 21.30 WIB"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-medium text-slate-700">Jenjang / Sasaran (Opsional)</label>
                    <input
                      type="text"
                      value={newLevels}
                      onChange={(e) => setNewLevels(e.target.value)}
                      placeholder="Kelas 1 KMI & Kelas 2 KMI"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      leftIcon={<Plus className="w-3.5 h-3.5 mr-1" />}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      Tambah Agenda
                    </Button>
                  </div>
                </div>
              </form>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Daftar Agenda Terpublikasi ({config.timeline.length})
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveTimeline}
                  leftIcon={<Save className="w-3.5 h-3.5 mr-1 text-emerald-700" />}
                >
                  Simpan Perubahan Agenda
                </Button>
              </div>

              {/* Timeline list */}
              <div className="divide-y divide-slate-100 text-xs">
                {config.timeline.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.title}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {item.category}
                        </span>
                        {item.isTentative && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded border border-amber-200">
                            Tentatif
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 flex flex-wrap items-center gap-2">
                        <span>{item.dateDisplay}</span>
                        {item.time && <span>&bull; {item.time}</span>}
                        {item.levels && <span>&bull; {item.levels}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTimelineItem(item.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors self-end sm:self-center"
                      title="Hapus agenda ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 3: CONTACTS & OFFICIALS */}
      {activeTab === 'contacts' && (
        <SectionCard
          title="Narahubung & Penanggung Jawab"
          subtitle="Informasi kontak ini ditampilkan pada halaman Tentang dan Footer publik."
        >
          <form onSubmit={handleSaveContacts} className="space-y-5 text-xs">
            <div className="space-y-3">
              <label className="font-bold text-slate-800 uppercase tracking-wide block">
                Narahubung Resmi (Hotline)
              </label>
              {config.contacts.map((c, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 font-medium">Nama Kontak</label>
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => {
                        const updated = [...config.contacts]
                        updated[i].name = e.target.value
                        setConfig({ ...config, contacts: updated })
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 font-medium">Nomor WhatsApp / Telp</label>
                    <input
                      type="text"
                      value={c.phone}
                      onChange={(e) => {
                        const updated = [...config.contacts]
                        updated[i].phone = e.target.value
                        setConfig({ ...config, contacts: updated })
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 font-medium">Jabatan / Peran</label>
                    <input
                      type="text"
                      value={c.role}
                      onChange={(e) => {
                        const updated = [...config.contacts]
                        updated[i].role = e.target.value
                        setConfig({ ...config, contacts: updated })
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<Save className="w-3.5 h-3.5 mr-1" />}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Simpan Perubahan Kontak
              </Button>
            </div>
          </form>
        </SectionCard>
      )}
    </div>
  )
}
