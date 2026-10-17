import type { StudentJenjang } from '../types/student'

export interface SyllabusItem {
  id: string
  title: string
  jenjang: StudentJenjang
  subject: string // e.g. "Matematika", "IPA & Sains", "Pengetahuan Umum"
  description: string
  file_url: string
  file_name: string
  file_size?: string
  pages?: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export type BankSoalBabak = 'Penyisihan' | 'Final'

export interface BankSoalDocument {
  id: string
  collection_id: string
  jenjang: StudentJenjang
  title: string
  file_url: string
  file_name: string
  file_size?: string
  is_published: boolean
  download_count?: number
  created_at: string
}

export interface BankSoalCollection {
  id: string
  year: number
  babak: BankSoalBabak
  title: string
  description?: string
  is_published: boolean
  documents?: BankSoalDocument[]
  created_at: string
}

const SILABUS_STORAGE_KEY = 'ogsoreg_silabus_v3'
const BANK_SOAL_STORAGE_KEY = 'ogsoreg_bank_soal_v3'

// Seed official syllabuses for Jenjang 1–5
const INITIAL_SYLLABUSES: SyllabusItem[] = [
  {
    id: 'syl-01',
    title: 'Silabus Resmi Olimpiade Sains & Matematika Jenjang 1 (Kelas 1)',
    jenjang: 'Jenjang 1',
    subject: 'Matematika & Sains',
    description: 'Panduan kurikulum kompetisi Jenjang 1 (Kelas 1): Pengenalan bilangan asli, pola bilangan, operasi hitung dasar, geometri dasar, dan pengenalan fenomena alam sekitar.',
    file_url: '#',
    file_name: 'Silabus_OGSO_Jenjang_1_Resmi.pdf',
    file_size: '1.2 MB',
    pages: 14,
    is_published: true,
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'syl-02',
    title: 'Silabus Resmi Olimpiade Sains & Matematika Jenjang 2 (Kelas 2)',
    jenjang: 'Jenjang 2',
    subject: 'Matematika & Sains',
    description: 'Panduan kurikulum kompetisi Jenjang 2 (Kelas 2): Aritmatika terapan, logika penalaran kuantitatif, pengukuran waktu & panjang, serta pengenalan makhluk hidup dan ekosistem.',
    file_url: '#',
    file_name: 'Silabus_OGSO_Jenjang_2_Resmi.pdf',
    file_size: '1.5 MB',
    pages: 18,
    is_published: true,
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'syl-03',
    title: 'Silabus Resmi Olimpiade Sains & Matematika Jenjang 3 (Kelas 1 Int & Kelas 3)',
    jenjang: 'Jenjang 3',
    subject: 'Matematika & Sains',
    description: 'Panduan kurikulum kompetisi Jenjang 3 (Kelas 1 Intensif & Kelas 3 KMI): Pecahan, kelipatan, faktor bilangan (KPK & FPB), sifat zat, energi, dan dasar-dasar ilmu pengetahuan bumi.',
    file_url: '#',
    file_name: 'Silabus_OGSO_Jenjang_3_Resmi.pdf',
    file_size: '1.8 MB',
    pages: 22,
    is_published: true,
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'syl-04',
    title: 'Silabus Resmi Olimpiade Sains & Matematika Jenjang 4 (Kelas 3 Int & Kelas 4)',
    jenjang: 'Jenjang 4',
    subject: 'Matematika & Sains',
    description: 'Panduan kurikulum kompetisi Jenjang 4 (Kelas 3 Intensif & Kelas 4 KMI): Bangun datar & ruang, statistika data sederhana, sistem organ, gaya dan gerak, serta teknologi ramah lingkungan.',
    file_url: '#',
    file_name: 'Silabus_OGSO_Jenjang_4_Resmi.pdf',
    file_size: '2.1 MB',
    pages: 26,
    is_published: true,
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'syl-05',
    title: 'Silabus Resmi Olimpiade Sains & Matematika Jenjang 5 (Kelas 5)',
    jenjang: 'Jenjang 5',
    subject: 'Matematika & Sains',
    description: 'Panduan kurikulum kompetisi Jenjang 5 (Kelas 5 KMI): Aljabar dasar, perbandingan, peluang, astronomi tata surya, gelombang & bunyi, serta pemecahan masalah olimpiade tingkat lanjut.',
    file_url: '#',
    file_name: 'Silabus_OGSO_Jenjang_5_Resmi.pdf',
    file_size: '2.4 MB',
    pages: 30,
    is_published: true,
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
]

// Helper to normalize legacy Jenjang/Kelas
const normalizeMateriJenjang = (val: string): StudentJenjang => {
  if (val === 'Jenjang 1' || val === 'Kelas 1') return 'Jenjang 1'
  if (val === 'Jenjang 2' || val === 'Kelas 2') return 'Jenjang 2'
  if (val === 'Jenjang 3' || val === 'Kelas 3') return 'Jenjang 3'
  if (val === 'Jenjang 4' || val === 'Kelas 4') return 'Jenjang 4'
  if (val === 'Jenjang 5' || val === 'Kelas 5') return 'Jenjang 5'
  return 'Jenjang 1'
}

// Seed Bank Soal collections & documents
const INITIAL_BANK_SOAL: BankSoalCollection[] = [
  // Penyisihan
  {
    id: 'bs-penyisihan-2025',
    year: 2025,
    babak: 'Penyisihan',
    title: 'Soal Penyisihan 2025',
    description: 'Naskah resmi soal babak penyisihan OGSO 2025 seluruh kampus.',
    is_published: true,
    created_at: '2025-02-01T00:00:00Z',
    documents: [
      { id: 'doc-p25-k1', collection_id: 'bs-penyisihan-2025', jenjang: 'Jenjang 1', title: 'Soal Penyisihan OGSO 2025 — Jenjang 1 (Kelas 1)', file_url: '#', file_name: 'Soal_Penyisihan_OGSO_2025_Jenjang_1.pdf', file_size: '1.1 MB', is_published: true, download_count: 142, created_at: '2025-02-01T00:00:00Z' },
      { id: 'doc-p25-k2', collection_id: 'bs-penyisihan-2025', jenjang: 'Jenjang 2', title: 'Soal Penyisihan OGSO 2025 — Jenjang 2 (Kelas 2)', file_url: '#', file_name: 'Soal_Penyisihan_OGSO_2025_Jenjang_2.pdf', file_size: '1.2 MB', is_published: true, download_count: 198, created_at: '2025-02-01T00:00:00Z' },
      { id: 'doc-p25-k3', collection_id: 'bs-penyisihan-2025', jenjang: 'Jenjang 3', title: 'Soal Penyisihan OGSO 2025 — Jenjang 3 (Kelas 1 Int & 3)', file_url: '#', file_name: 'Soal_Penyisihan_OGSO_2025_Jenjang_3.pdf', file_size: '1.3 MB', is_published: true, download_count: 164, created_at: '2025-02-01T00:00:00Z' },
      { id: 'doc-p25-k4', collection_id: 'bs-penyisihan-2025', jenjang: 'Jenjang 4', title: 'Soal Penyisihan OGSO 2025 — Jenjang 4 (Kelas 3 Int & 4)', file_url: '#', file_name: 'Soal_Penyisihan_OGSO_2025_Jenjang_4.pdf', file_size: '1.4 MB', is_published: true, download_count: 215, created_at: '2025-02-01T00:00:00Z' },
      { id: 'doc-p25-k5', collection_id: 'bs-penyisihan-2025', jenjang: 'Jenjang 5', title: 'Soal Penyisihan OGSO 2025 — Jenjang 5 (Kelas 5)', file_url: '#', file_name: 'Soal_Penyisihan_OGSO_2025_Jenjang_5.pdf', file_size: '1.5 MB', is_published: true, download_count: 280, created_at: '2025-02-01T00:00:00Z' },
    ],
  },
  {
    id: 'bs-penyisihan-2024',
    year: 2024,
    babak: 'Penyisihan',
    title: 'Soal Penyisihan 2024',
    description: 'Naskah resmi soal babak penyisihan OGSO 2024 seluruh kampus.',
    is_published: true,
    created_at: '2024-02-01T00:00:00Z',
    documents: [
      { id: 'doc-p24-k1', collection_id: 'bs-penyisihan-2024', jenjang: 'Jenjang 1', title: 'Soal Penyisihan OGSO 2024 — Jenjang 1 (Kelas 1)', file_url: '#', file_name: 'Soal_Penyisihan_OGSO_2024_Jenjang_1.pdf', file_size: '980 KB', is_published: true, download_count: 89, created_at: '2024-02-01T00:00:00Z' },
      { id: 'doc-p24-k2', collection_id: 'bs-penyisihan-2024', jenjang: 'Jenjang 2', title: 'Soal Penyisihan OGSO 2024 — Jenjang 2 (Kelas 2)', file_url: '#', file_name: 'Soal_Penyisihan_OGSO_2024_Jenjang_2.pdf', file_size: '1.1 MB', is_published: true, download_count: 112, created_at: '2024-02-01T00:00:00Z' },
      { id: 'doc-p24-k3', collection_id: 'bs-penyisihan-2024', jenjang: 'Jenjang 3', title: 'Soal Penyisihan OGSO 2024 — Jenjang 3 (Kelas 1 Int & 3)', file_url: '#', file_name: 'Soal_Penyisihan_OGSO_2024_Jenjang_3.pdf', file_size: '1.2 MB', is_published: true, download_count: 95, created_at: '2024-02-01T00:00:00Z' },
      { id: 'doc-p24-k4', collection_id: 'bs-penyisihan-2024', jenjang: 'Jenjang 4', title: 'Soal Penyisihan OGSO 2024 — Jenjang 4 (Kelas 3 Int & 4)', file_url: '#', file_name: 'Soal_Penyisihan_OGSO_2024_Jenjang_4.pdf', file_size: '1.3 MB', is_published: true, download_count: 130, created_at: '2024-02-01T00:00:00Z' },
      { id: 'doc-p24-k5', collection_id: 'bs-penyisihan-2024', jenjang: 'Jenjang 5', title: 'Soal Penyisihan OGSO 2024 — Jenjang 5 (Kelas 5)', file_url: '#', file_name: 'Soal_Penyisihan_OGSO_2024_Jenjang_5.pdf', file_size: '1.4 MB', is_published: true, download_count: 175, created_at: '2024-02-01T00:00:00Z' },
    ],
  },
  {
    id: 'bs-penyisihan-2023',
    year: 2023,
    babak: 'Penyisihan',
    title: 'Soal Penyisihan 2023',
    description: 'Arsip naskah soal babak penyisihan OGSO 2023.',
    is_published: true,
    created_at: '2023-02-01T00:00:00Z',
    documents: [
      { id: 'doc-p23-k3', collection_id: 'bs-penyisihan-2023', jenjang: 'Jenjang 3', title: 'Soal Penyisihan OGSO 2023 — Jenjang 3 (Kelas 1 Int & 3)', file_url: '#', file_name: 'Soal_Penyisihan_OGSO_2023_Jenjang_3.pdf', file_size: '1.1 MB', is_published: true, download_count: 76, created_at: '2023-02-01T00:00:00Z' },
      { id: 'doc-p23-k5', collection_id: 'bs-penyisihan-2023', jenjang: 'Jenjang 5', title: 'Soal Penyisihan OGSO 2023 — Jenjang 5 (Kelas 5)', file_url: '#', file_name: 'Soal_Penyisihan_OGSO_2023_Jenjang_5.pdf', file_size: '1.3 MB', is_published: true, download_count: 120, created_at: '2023-02-01T00:00:00Z' },
    ],
  },
  // Final
  {
    id: 'bs-final-2025',
    year: 2025,
    babak: 'Final',
    title: 'Soal Final 2025',
    description: 'Naskah resmi soal babak final perebutan juara OGSO 2025.',
    is_published: true,
    created_at: '2025-04-01T00:00:00Z',
    documents: [
      { id: 'doc-f25-k1', collection_id: 'bs-final-2025', jenjang: 'Jenjang 1', title: 'Soal Final OGSO 2025 — Jenjang 1 (Kelas 1)', file_url: '#', file_name: 'Soal_Final_OGSO_2025_Jenjang_1.pdf', file_size: '1.3 MB', is_published: true, download_count: 210, created_at: '2025-04-01T00:00:00Z' },
      { id: 'doc-f25-k2', collection_id: 'bs-final-2025', jenjang: 'Jenjang 2', title: 'Soal Final OGSO 2025 — Jenjang 2 (Kelas 2)', file_url: '#', file_name: 'Soal_Final_OGSO_2025_Jenjang_2.pdf', file_size: '1.4 MB', is_published: true, download_count: 245, created_at: '2025-04-01T00:00:00Z' },
      { id: 'doc-f25-k3', collection_id: 'bs-final-2025', jenjang: 'Jenjang 3', title: 'Soal Final OGSO 2025 — Jenjang 3 (Kelas 1 Int & 3)', file_url: '#', file_name: 'Soal_Final_OGSO_2025_Jenjang_3.pdf', file_size: '1.5 MB', is_published: true, download_count: 310, created_at: '2025-04-01T00:00:00Z' },
      { id: 'doc-f25-k4', collection_id: 'bs-final-2025', jenjang: 'Jenjang 4', title: 'Soal Final OGSO 2025 — Jenjang 4 (Kelas 3 Int & 4)', file_url: '#', file_name: 'Soal_Final_OGSO_2025_Jenjang_4.pdf', file_size: '1.6 MB', is_published: true, download_count: 290, created_at: '2025-04-01T00:00:00Z' },
      { id: 'doc-f25-k5', collection_id: 'bs-final-2025', jenjang: 'Jenjang 5', title: 'Soal Final OGSO 2025 — Jenjang 5 (Kelas 5)', file_url: '#', file_name: 'Soal_Final_OGSO_2025_Jenjang_5.pdf', file_size: '1.8 MB', is_published: true, download_count: 380, created_at: '2025-04-01T00:00:00Z' },
    ],
  },
  {
    id: 'bs-final-2024',
    year: 2024,
    babak: 'Final',
    title: 'Soal Final 2024',
    description: 'Naskah resmi soal babak final perebutan juara OGSO 2024.',
    is_published: true,
    created_at: '2024-04-01T00:00:00Z',
    documents: [
      { id: 'doc-f24-k2', collection_id: 'bs-final-2024', jenjang: 'Jenjang 2', title: 'Soal Final OGSO 2024 — Jenjang 2 (Kelas 2)', file_url: '#', file_name: 'Soal_Final_OGSO_2024_Jenjang_2.pdf', file_size: '1.2 MB', is_published: true, download_count: 140, created_at: '2024-04-01T00:00:00Z' },
      { id: 'doc-f24-k4', collection_id: 'bs-final-2024', jenjang: 'Jenjang 4', title: 'Soal Final OGSO 2024 — Jenjang 4 (Kelas 3 Int & 4)', file_url: '#', file_name: 'Soal_Final_OGSO_2024_Jenjang_4.pdf', file_size: '1.4 MB', is_published: true, download_count: 165, created_at: '2024-04-01T00:00:00Z' },
      { id: 'doc-f24-k5', collection_id: 'bs-final-2024', jenjang: 'Jenjang 5', title: 'Soal Final OGSO 2024 — Jenjang 5 (Kelas 5)', file_url: '#', file_name: 'Soal_Final_OGSO_2024_Jenjang_5.pdf', file_size: '1.6 MB', is_published: true, download_count: 220, created_at: '2024-04-01T00:00:00Z' },
    ],
  },
]

class MateriService {
  // ==========================================
  // SILABUS
  // ==========================================
  getSyllabuses(publishedOnly: boolean = false): SyllabusItem[] {
    let list: SyllabusItem[] = []
    if (typeof window === 'undefined') {
      list = INITIAL_SYLLABUSES
    } else {
      try {
        const raw = localStorage.getItem(SILABUS_STORAGE_KEY)
        if (!raw) {
          localStorage.setItem(SILABUS_STORAGE_KEY, JSON.stringify(INITIAL_SYLLABUSES))
          list = INITIAL_SYLLABUSES
        } else {
          list = JSON.parse(raw)
        }
      } catch {
        list = INITIAL_SYLLABUSES
      }
    }

    list = list.map((s) => ({
      ...s,
      jenjang: normalizeMateriJenjang(s.jenjang),
    }))

    if (publishedOnly) {
      return list.filter((s) => s.is_published)
    }
    return list
  }

  saveSyllabus(item: Omit<SyllabusItem, 'id' | 'created_at' | 'updated_at'> & { id?: string }): SyllabusItem {
    const list = this.getSyllabuses()
    const id = item.id || `syl-${Date.now().toString(36)}`
    const now = new Date().toISOString()

    const existingIdx = list.findIndex((s) => s.id === id)
    let saved: SyllabusItem

    if (existingIdx >= 0) {
      saved = { ...list[existingIdx], ...item, id, updated_at: now }
      list[existingIdx] = saved
    } else {
      saved = {
        ...item,
        id,
        created_at: now,
        updated_at: now,
      }
      list.unshift(saved)
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(SILABUS_STORAGE_KEY, JSON.stringify(list))
    }
    return saved
  }

  deleteSyllabus(id: string): boolean {
    const list = this.getSyllabuses().filter((s) => s.id !== id)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SILABUS_STORAGE_KEY, JSON.stringify(list))
    }
    return true
  }

  toggleSyllabusPublished(id: string, published: boolean): boolean {
    const list = this.getSyllabuses()
    const item = list.find((s) => s.id === id)
    if (item) {
      item.is_published = published
      item.updated_at = new Date().toISOString()
      if (typeof window !== 'undefined') {
        localStorage.setItem(SILABUS_STORAGE_KEY, JSON.stringify(list))
      }
      return true
    }
    return false
  }

  // ==========================================
  // BANK SOAL
  // ==========================================
  getBankSoalCollections(babak?: BankSoalBabak, publishedOnly: boolean = false): BankSoalCollection[] {
    let list: BankSoalCollection[] = []
    if (typeof window === 'undefined') {
      list = INITIAL_BANK_SOAL
    } else {
      try {
        const raw = localStorage.getItem(BANK_SOAL_STORAGE_KEY)
        if (!raw) {
          localStorage.setItem(BANK_SOAL_STORAGE_KEY, JSON.stringify(INITIAL_BANK_SOAL))
          list = INITIAL_BANK_SOAL
        } else {
          list = JSON.parse(raw)
        }
      } catch {
        list = INITIAL_BANK_SOAL
      }
    }

    list = list.map((c) => ({
      ...c,
      documents: (c.documents || []).map((d) => ({
        ...d,
        jenjang: normalizeMateriJenjang(d.jenjang),
      })),
    }))

    if (babak) {
      list = list.filter((c) => c.babak === babak)
    }

    if (publishedOnly) {
      list = list
        .filter((c) => c.is_published)
        .map((c) => ({
          ...c,
          documents: (c.documents || []).filter((d) => d.is_published),
        }))
    }

    // Sort by year descending
    return list.sort((a, b) => b.year - a.year)
  }

  saveBankSoalCollection(col: Omit<BankSoalCollection, 'id' | 'created_at'> & { id?: string }): BankSoalCollection {
    const list = this.getBankSoalCollections()
    const id = col.id || `bs-${col.babak.toLowerCase()}-${col.year}-${Date.now().toString(36)}`
    const now = new Date().toISOString()

    const existingIdx = list.findIndex((c) => c.id === id)
    let saved: BankSoalCollection

    if (existingIdx >= 0) {
      saved = { ...list[existingIdx], ...col, id }
      list[existingIdx] = saved
    } else {
      saved = {
        ...col,
        id,
        documents: col.documents || [],
        created_at: now,
      }
      list.unshift(saved)
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(BANK_SOAL_STORAGE_KEY, JSON.stringify(list))
    }
    return saved
  }

  addDocumentToCollection(
    collectionId: string,
    doc: Omit<BankSoalDocument, 'id' | 'collection_id' | 'created_at'>
  ): BankSoalDocument | null {
    const list = this.getBankSoalCollections()
    const col = list.find((c) => c.id === collectionId)
    if (!col) return null

    const newDoc: BankSoalDocument = {
      ...doc,
      id: `doc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      collection_id: collectionId,
      created_at: new Date().toISOString(),
    }

    col.documents = [...(col.documents || []), newDoc]

    if (typeof window !== 'undefined') {
      localStorage.setItem(BANK_SOAL_STORAGE_KEY, JSON.stringify(list))
    }
    return newDoc
  }

  deleteDocument(collectionId: string, docId: string): boolean {
    const list = this.getBankSoalCollections()
    const col = list.find((c) => c.id === collectionId)
    if (!col || !col.documents) return false

    col.documents = col.documents.filter((d) => d.id !== docId)

    if (typeof window !== 'undefined') {
      localStorage.setItem(BANK_SOAL_STORAGE_KEY, JSON.stringify(list))
    }
    return true
  }

  deleteCollection(collectionId: string): boolean {
    const list = this.getBankSoalCollections().filter((c) => c.id !== collectionId)
    if (typeof window !== 'undefined') {
      localStorage.setItem(BANK_SOAL_STORAGE_KEY, JSON.stringify(list))
    }
    return true
  }
}

export const materiService = new MateriService()
