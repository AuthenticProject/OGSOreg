/**
 * Service to manage public website content for OGSO (Inter-Campus Online Gontor Science Olympiad).
 * Default data is derived strictly from the official "Petunjuk Pelaksanaan OGSO 2026.pdf".
 * Super Admins can update this content via the Dashboard settings, and changes are stored
 * persistently in localStorage with Supabase sync capabilities.
 */

export interface TimelineEvent {
  id: string
  dateDisplay: string
  hijriDate?: string
  title: string
  category: 'persiapan' | 'simulasi' | 'seremoni' | 'penyisihan' | 'final' | 'penutupan'
  time?: string
  levels?: string
  isCompleted?: boolean
  isTentative?: boolean
}

export interface FaqItem {
  question: string
  answer: string
  category?: string
}

export interface OfficialPerson {
  name: string
  role: string
  phone?: string
}

export interface WebsiteContentConfig {
  hero: {
    announcementBanner: string
    displayHeadline: string
    officialTheme: string
    subheadline: string
    officialJuklakUrl: string
    primaryCtaText: string
    secondaryCtaText: string
  }
  competitionInfo: {
    name: string
    arabicYear: string
    masehiYear: string
    organizer: string
    quotaPerCampus: number
    quotaPerLevel: number
    totalLevels: number
    totalCampusCount: number
    examFormat: string
    examDurationMinutes: number
    questionCount: number
    questionType: string
  }
  timeline: TimelineEvent[]
  faq: FaqItem[]
  officials: OfficialPerson[]
  contacts: {
    name: string
    phone: string
    role: string
  }[]
  lastUpdated?: string
}

export const DEFAULT_WEBSITE_CONTENT: WebsiteContentConfig = {
  hero: {
    announcementBanner: 'Jadwal Resmi Inter-Campus Online Gontor Science Olympiad 1448/2026',
    displayHeadline: 'Where Knowledge Meets Discovery.',
    officialTheme: 'Dengan Ilmu Al-Qur’an dan Ilmu Sains, Santri Saintis Siap Membangun Peradaban Islam',
    subheadline:
      'Ajang kompetisi sains bergengsi tingkat nasional antar-kampus Pondok Modern Darussalam Gontor yang mengintegrasikan kecerdasan akademik, ketajaman analisis, dan nilai-nilai luhur Al-Qur’an.',
    officialJuklakUrl: '/documents/Petunjuk_Pelaksanaan_OGSO_2026.pdf',
    primaryCtaText: 'Informasi Pendaftaran',
    secondaryCtaText: 'Jelajahi OGSO',
  },
  competitionInfo: {
    name: 'Inter-Campus Online Gontor Science Olympiad',
    arabicYear: '1448',
    masehiYear: '2026',
    organizer: 'Panitia Online Gontor Science Olympiad (OGSO) PMDG',
    quotaPerCampus: 20,
    quotaPerLevel: 4,
    totalLevels: 5,
    totalCampusCount: 20,
    examFormat: 'Daring Terpadu via Save Exam Browser (SEB) & Pengawasan Zoom',
    examDurationMinutes: 90,
    questionCount: 40,
    questionType: 'Isian Singkat (Short Essay)',
  },
  timeline: [
    {
      id: 'tm',
      dateDisplay: 'Jum’at, 30 Oktober 2026',
      hijriDate: '19 Jumadal Ula 1448',
      title: 'Technical Meeting Online Gontor Science Olympiad',
      category: 'persiapan',
      time: '20.00 – 21.30 WIB',
      isTentative: true,
    },
    {
      id: 'simulasi-awal',
      dateDisplay: 'Sabtu, 31 Oktober 2026',
      hijriDate: '20 Jumadal Ula 1448',
      title: 'Awal Masa Simulasi Sistem & Uji Coba CBT SEB',
      category: 'simulasi',
      time: 'Fleksibel sesuai jadwal kampus',
      isTentative: true,
    },
    {
      id: 'simulasi-akhir',
      dateDisplay: 'Selasa, 3 November 2026',
      hijriDate: '23 Jumadal Ula 1448',
      title: 'Akhir Masa Simulasi Sistem',
      category: 'simulasi',
      time: 'Hingga pukul 21.30 WIB',
      isTentative: true,
    },
    {
      id: 'pembukaan',
      dateDisplay: 'Jum’at, 6 November 2026',
      hijriDate: '26 Jumadal Ula 1448',
      title: 'Pembukaan Resmi Inter-Campus OGSO 1448/2026',
      category: 'seremoni',
      time: '20.15 – 21.15 WIB',
      isTentative: true,
    },
    {
      id: 'penyisihan-1-2',
      dateDisplay: 'Sabtu, 7 November 2026',
      hijriDate: '27 Jumadal Ula 1448',
      title: 'Babak Penyisihan — Jenjang 1 & Jenjang 2',
      category: 'penyisihan',
      time: '20.00 – 21.30 WIB',
      levels: 'Kelas 1 KMI & Kelas 2 KMI',
      isTentative: true,
    },
    {
      id: 'penyisihan-3-4',
      dateDisplay: 'Ahad, 8 November 2026',
      hijriDate: '28 Jumadal Ula 1448',
      title: 'Babak Penyisihan — Jenjang 3 & Jenjang 4',
      category: 'penyisihan',
      time: '20.00 – 21.30 WIB',
      levels: 'Kelas 1 Int/3 KMI & Kelas 3 Int/4 KMI',
      isTentative: true,
    },
    {
      id: 'penyisihan-5',
      dateDisplay: 'Senin, 9 November 2026',
      hijriDate: '29 Jumadal Ula 1448',
      title: 'Babak Penyisihan — Jenjang 5',
      category: 'penyisihan',
      time: '20.00 – 21.30 WIB',
      levels: 'Kelas 5 KMI (Matematika, Fisika, Biologi, Kimia)',
      isTentative: true,
    },
    {
      id: 'pengumuman-penyisihan',
      dateDisplay: 'Jum’at, 13 November 2026',
      hijriDate: '4 Jumadal Akhirah 1448',
      title: 'Pengumuman Hasil Babak Penyisihan & Peserta Lolos Final',
      category: 'persiapan',
      time: 'Pukul 20.00 WIB',
      isTentative: true,
    },
    {
      id: 'final-1-2',
      dateDisplay: 'Kamis, 19 November 2026',
      hijriDate: '10 Jumadal Akhirah 1448',
      title: 'Babak Final — Jenjang 1 & Jenjang 2',
      category: 'final',
      time: '20.00 – 21.30 WIB',
      levels: 'Finalis Terpilih Jenjang 1 & 2',
      isTentative: true,
    },
    {
      id: 'final-3-4',
      dateDisplay: 'Jum’at, 20 November 2026',
      hijriDate: '11 Jumadal Akhirah 1448',
      title: 'Babak Final — Jenjang 3 & Jenjang 4',
      category: 'final',
      time: '20.00 – 21.30 WIB',
      levels: 'Finalis Terpilih Jenjang 3 & 4',
      isTentative: true,
    },
    {
      id: 'final-5',
      dateDisplay: 'Sabtu, 21 November 2026',
      hijriDate: '12 Jumadal Akhirah 1448',
      title: 'Babak Final — Jenjang 5',
      category: 'final',
      time: '20.00 – 21.30 WIB',
      levels: 'Finalis Terpilih Jenjang 5',
      isTentative: true,
    },
    {
      id: 'award-ceremonial',
      dateDisplay: 'Jum’at, 4 Desember 2026',
      hijriDate: '25 Jumadal Akhirah 1448',
      title: 'Penutupan & Award Ceremonial Online Gontor Science Olympiad',
      category: 'penutupan',
      time: '20.15 – 21.15 WIB',
      isTentative: true,
    },
  ],
  faq: [
    {
      question: 'Apa itu Inter-Campus Online Gontor Science Olympiad (OGSO)?',
      answer:
        'OGSO adalah ajang talenta dan kompetisi sains bergengsi tingkat nasional yang diselenggarakan secara daring untuk santri terpilih di seluruh kampus cabang Pondok Modern Darussalam Gontor di Indonesia, mengintegrasikan ilmu agama dan ilmu sains sesuai visi Trimurti 100% agama dan 100% umum.',
    },
    {
      question: 'Siapa saja yang berhak mengikuti OGSO 2026?',
      answer:
        'Peserta adalah santri dan santriwati aktif Kulliyatu-l-Mu’allimin Al-Islamiyah (KMI) kelas 1 sampai dengan kelas 5 yang diseleksi secara resmi dan didelegasikan oleh pimpinan kampus masing-masing kontingen.',
    },
    {
      question: 'Bagaimana mekanisme pendaftaran santri peserta?',
      answer:
        'Pendaftaran dilakukan secara kolektif dan terpadu oleh Admin Kampus resmi melalui portal administrasi OGSOreg. Setiap kampus mendelegasikan tepat 20 santri (4 santri untuk setiap jenjang 1 hingga 5). Tidak dibuka pendaftaran mandiri langsung untuk santri perorangan.',
    },
    {
      question: 'Bidang studi apa saja yang diujikan dalam olimpiade?',
      answer:
        'Materi ujian mencakup Matematika, Fisika, Biologi, dan Kimia (MAFIKIB). Untuk Jenjang 1 sampai 4 mengujikan Matematika, Fisika, dan Biologi. Untuk Jenjang 5 mengujikan Matematika, Fisika, Biologi, dan Kimia.',
    },
    {
      question: 'Bagaimana pembagian jenjang kompetisi?',
      answer:
        'Jenjang 1 diperuntukkan bagi Kelas 1 KMI; Jenjang 2 untuk Kelas 2 KMI; Jenjang 3 untuk Kelas 1 Intensif & Kelas 3 KMI; Jenjang 4 untuk Kelas 3 Intensif & Kelas 4 KMI; Jenjang 5 untuk Kelas 5 KMI.',
    },
    {
      question: 'Bagaimana format pengerjaan soal dan sistem pengawasan?',
      answer:
        'Ujian berlangsung selama 90 menit dengan 40 butir soal isian singkat (short essay). Ujian menggunakan aplikasi Save Exam Browser (SEB) pada PC/Laptop dan diawasi ketat melalui kamera Zoom dari sudut belakang ruangan peserta.',
    },
    {
      question: 'Apa saja penghargaan yang diperoleh para pemenang?',
      answer:
        'Peringkat 1 s/d 10 Babak Penyisihan mendapatkan Piagam Penghargaan. Pada Babak Final: Juara 1 mendapatkan Medali Emas + Piagam; Juara 2 Medali Perak + Piagam; Juara 3 Medali Perunggu + Piagam; Juara Harapan 1 & 2 Medali Akrilik + Piagam; dan Kampus dengan pemenang terbanyak memperoleh Piala Penghargaan Juara Umum. Seluruh peserta mendapatkan e-certificate keikutsertaan.',
    },
    {
      question: 'Di mana peserta dapat mengunduh silabus dan petunjuk teknis?',
      answer:
        'Silabus resmi dan bank soal dapat diakses secara publik dan gratis melalui menu Silabus & Bank Soal pada website ini. Dokumen Petunjuk Pelaksanaan (JUKLAK) resmi juga dapat diunduh langsung dalam format PDF.',
    },
  ],
  officials: [
    { name: 'Al-Ustadz Ibrahim Hidayatulloh, S.Pd.', role: 'Penanggung Jawab Umum' },
    { name: 'Al-Ustadz Muhammad Avisena', role: 'Penanggung Jawab Umum' },
    { name: 'Al-Ustadz Sigap Dwi Aminullah, S.Ag.', role: 'Ketua Panitia Pelaksana' },
    { name: 'Al-Ustadz Muhammad Nashir Azzuhri', role: 'Penanggung Jawab Umum' },
  ],
  contacts: [
    {
      name: 'Al-Ustadz Sigap Dwi Aminullah, S.Ag.',
      phone: '+62 823-3291-4996',
      role: 'Ketua Panitia OGSO 1448/2026',
    },
    {
      name: 'Kantor Laboratorium KMI',
      phone: '+62 852-3260-1097',
      role: 'Sekretariat & Administrasi Panitia',
    },
  ],
}

const STORAGE_KEY = 'ogsoreg_public_website_content_v1'

import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { cloudSyncService } from './supabase/cloudSyncService'

let isCloudSyncInitialized = false

function initRealtimeWebsiteSync() {
  if (isCloudSyncInitialized || typeof window === 'undefined') return
  isCloudSyncInitialized = true

  // Initial cloud fetch in background
  setTimeout(() => {
    websiteContentService.syncFromCloud().catch(() => {})
  }, 150)

  // Auto re-sync on window focus & online
  window.addEventListener('focus', () => {
    websiteContentService.syncFromCloud().catch(() => {})
  })
  window.addEventListener('online', () => {
    websiteContentService.syncFromCloud().catch(() => {})
  })

  // Realtime channel
  if (isSupabaseConfigured()) {
    try {
      supabase
        .channel('realtime:website_content')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'website_content' },
          () => {
            websiteContentService.syncFromCloud().catch(() => {})
          }
        )
        .subscribe()

      cloudSyncService.subscribeCloudSetting<WebsiteContentConfig>('website_content', (remote) => {
        if (remote) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remote))
          window.dispatchEvent(new Event('ogsoreg_website_content_updated'))
        }
      })
    } catch {
      // Ignore
    }
  }
}

export const websiteContentService = {
  getContent(): WebsiteContentConfig {
    initRealtimeWebsiteSync()
    if (typeof window === 'undefined') return DEFAULT_WEBSITE_CONTENT
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return DEFAULT_WEBSITE_CONTENT
      const parsed = JSON.parse(raw) as Partial<WebsiteContentConfig>
      return {
        hero: { ...DEFAULT_WEBSITE_CONTENT.hero, ...(parsed.hero || {}) },
        competitionInfo: {
          ...DEFAULT_WEBSITE_CONTENT.competitionInfo,
          ...(parsed.competitionInfo || {}),
        },
        timeline: parsed.timeline && parsed.timeline.length > 0 ? parsed.timeline : DEFAULT_WEBSITE_CONTENT.timeline,
        faq: parsed.faq && parsed.faq.length > 0 ? parsed.faq : DEFAULT_WEBSITE_CONTENT.faq,
        officials: parsed.officials || DEFAULT_WEBSITE_CONTENT.officials,
        contacts: parsed.contacts || DEFAULT_WEBSITE_CONTENT.contacts,
        lastUpdated: parsed.lastUpdated,
      }
    } catch {
      return DEFAULT_WEBSITE_CONTENT
    }
  },

  async syncFromCloud(): Promise<WebsiteContentConfig> {
    if (!isSupabaseConfigured()) return this.getContent()

    try {
      // 1. Try dedicated website_content table
      const { data: dbData, error: dbErr } = await supabase
        .from('website_content')
        .select('*')
        .eq('id', 'current')
        .maybeSingle()

      if (!dbErr && dbData) {
        const cloudContent: WebsiteContentConfig = {
          hero: { ...DEFAULT_WEBSITE_CONTENT.hero, ...(dbData.hero || {}) },
          competitionInfo: { ...DEFAULT_WEBSITE_CONTENT.competitionInfo, ...(dbData.competition_info || {}) },
          timeline: Array.isArray(dbData.timeline) && dbData.timeline.length > 0 ? dbData.timeline : DEFAULT_WEBSITE_CONTENT.timeline,
          faq: Array.isArray(dbData.faq) && dbData.faq.length > 0 ? dbData.faq : DEFAULT_WEBSITE_CONTENT.faq,
          officials: Array.isArray(dbData.officials) ? dbData.officials : DEFAULT_WEBSITE_CONTENT.officials,
          contacts: Array.isArray(dbData.contacts) ? dbData.contacts : DEFAULT_WEBSITE_CONTENT.contacts,
          lastUpdated: dbData.updated_at,
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudContent))
          window.dispatchEvent(new Event('ogsoreg_website_content_updated'))
        }
        return cloudContent
      }

      // 2. Fallback to app_settings cloud store
      const cloudSetting = await cloudSyncService.getCloudSetting<WebsiteContentConfig | null>('website_content', null)
      if (cloudSetting) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudSetting))
          window.dispatchEvent(new Event('ogsoreg_website_content_updated'))
        }
        return cloudSetting
      }
    } catch (err) {
      console.warn('[WebsiteContent] Cloud sync check error:', err)
    }

    return this.getContent()
  },

  saveContent(content: Partial<WebsiteContentConfig>): WebsiteContentConfig {
    const current = this.getContent()
    const updated: WebsiteContentConfig = {
      ...current,
      ...content,
      hero: { ...current.hero, ...(content.hero || {}) },
      competitionInfo: { ...current.competitionInfo, ...(content.competitionInfo || {}) },
      lastUpdated: new Date().toISOString(),
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        window.dispatchEvent(new Event('ogsoreg_website_content_updated'))
      } catch (err) {
        console.error('Failed to save website content to localStorage:', err)
      }
    }

    // Persist to Supabase asynchronously
    if (isSupabaseConfigured()) {
      Promise.resolve(
        supabase
          .from('website_content')
          .upsert({
            id: 'current',
            hero: updated.hero,
            competition_info: updated.competitionInfo,
            timeline: updated.timeline,
            faq: updated.faq,
            officials: updated.officials,
            contacts: updated.contacts,
            updated_at: updated.lastUpdated,
          })
      )
        .then(({ error }) => {
          if (error) {
            cloudSyncService.saveCloudSetting('website_content', updated)
          }
        })
        .catch(() => {
          cloudSyncService.saveCloudSetting('website_content', updated)
        })
    }

    return updated
  },

  resetToDefault(): WebsiteContentConfig {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      window.dispatchEvent(new Event('ogsoreg_website_content_updated'))
    }

    if (isSupabaseConfigured()) {
      Promise.resolve(
        supabase
          .from('website_content')
          .upsert({
            id: 'current',
            hero: DEFAULT_WEBSITE_CONTENT.hero,
            competition_info: DEFAULT_WEBSITE_CONTENT.competitionInfo,
            timeline: DEFAULT_WEBSITE_CONTENT.timeline,
            faq: DEFAULT_WEBSITE_CONTENT.faq,
            officials: DEFAULT_WEBSITE_CONTENT.officials,
            contacts: DEFAULT_WEBSITE_CONTENT.contacts,
            updated_at: new Date().toISOString(),
          })
      )
        .then(() => {})
        .catch(() => {})

      cloudSyncService.saveCloudSetting('website_content', DEFAULT_WEBSITE_CONTENT)
    }

    return DEFAULT_WEBSITE_CONTENT
  },
}

