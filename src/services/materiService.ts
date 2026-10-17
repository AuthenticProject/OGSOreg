import type { StudentJenjang } from '../types/student'

export interface SyllabusTopic {
  title: string
  focus?: string
  kelas: string
}

export interface SyllabusSubjectBreakdown {
  subject: string // "Fisika" | "Biologi" | "Matematika" | "Kimia"
  topics: SyllabusTopic[]
}

export interface SyllabusItem {
  id: string
  title: string
  jenjang: StudentJenjang
  target_kelas?: string
  subject: string
  subjects?: string[]
  description: string
  breakdown?: SyllabusSubjectBreakdown[]
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

const SILABUS_STORAGE_KEY = 'ogsoreg_silabus_2026_v1'
const BANK_SOAL_STORAGE_KEY = 'ogsoreg_bank_soal_v3'

// Official syllabuses for Jenjang 1–5 extracted from Silabus_OGSO_2026.xlsx
const INITIAL_SYLLABUSES: SyllabusItem[] = [
  {
    id: 'syl-01',
    title: 'Silabus Resmi OGSO 2026 Jenjang 1 (Kelas 1 KMI)',
    jenjang: 'Jenjang 1',
    target_kelas: '1 KMI',
    subject: 'Fisika, Biologi, Matematika',
    subjects: ['Fisika', 'Biologi', 'Matematika'],
    description: 'Silabus resmi materi pengujian OGSO 2026 untuk Kelas 1 KMI yang mencakup dasar-dasar Fisika (Pengukuran, Zat, Termal), Biologi (Ciri Makhluk Hidup, Ekosistem), dan Matematika (Bilangan, Aljabar, Geometri).',
    breakdown: [
      {
        subject: 'Fisika',
        topics: [
          { title: 'Besaran dan Pengukuran', kelas: '1 KMI' },
          { title: 'Zat dan Karakteristiknya', kelas: '1 KMI' },
          { title: 'Suhu dan Pemuaian Termal', kelas: '1 KMI' },
          { title: 'Kalor', kelas: '1 KMI' },
        ],
      },
      {
        subject: 'Biologi',
        topics: [
          { title: 'Ciri-Ciri Makhluk Hidup', kelas: '1 KMI' },
          { title: 'Klasifikasi Makhluk Hidup', kelas: '1 KMI' },
          { title: 'Organisasi Kehidupan', kelas: '1 KMI' },
          { title: 'Ekosistem', kelas: '1 KMI' },
        ],
      },
      {
        subject: 'Matematika',
        topics: [
          { title: 'Bilangan Bulat', kelas: '1 KMI' },
          { title: 'Pecahan', kelas: '1 KMI' },
          { title: 'Operasi Hitung Bentuk Aljabar', kelas: '1 KMI' },
          { title: 'Himpunan', kelas: '1 KMI' },
          { title: 'Garis dan Sudut', kelas: '1 KMI' },
          { title: 'Segitiga', kelas: '1 KMI' },
        ],
      },
    ],
    file_url: '/documents/Silabus_OGSO_2026.xlsx',
    file_name: 'Silabus_OGSO_2026_Jenjang_1.xlsx',
    file_size: '14.8 KB',
    pages: 14,
    is_published: true,
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'syl-02',
    title: 'Silabus Resmi OGSO 2026 Jenjang 2 (Kelas 2 KMI)',
    jenjang: 'Jenjang 2',
    target_kelas: '2 KMI',
    subject: 'Fisika, Biologi, Matematika',
    subjects: ['Fisika', 'Biologi', 'Matematika'],
    description: 'Silabus resmi materi pengujian OGSO 2026 untuk Kelas 2 KMI meliputi dinamika Fisika (Gaya, Energi, Tekanan, Optika), Fisiologi Biologi (Sistem Gerak, Pencernaan, Peredaran Darah), dan Matematika (SPLDV, Pythagoras, Lingkaran).',
    breakdown: [
      {
        subject: 'Fisika',
        topics: [
          { title: 'Gaya', kelas: '2 KMI' },
          { title: 'Energi dan Usaha', kelas: '2 KMI' },
          { title: 'Tekanan', kelas: '2 KMI' },
          { title: 'Getaran dan Gelombang', kelas: '2 KMI' },
          { title: 'Optika', kelas: '2 KMI' },
        ],
      },
      {
        subject: 'Biologi',
        topics: [
          { title: 'Sistem Gerak pada Manusia', kelas: '2 KMI' },
          { title: 'Sistem Pencernaan pada Manusia', kelas: '2 KMI' },
          { title: 'Sistem Pernapasan pada Manusia', kelas: '2 KMI' },
          { title: 'Sistem Peredaran Darah pada Manusia', kelas: '2 KMI' },
          { title: 'Fotosintesis', kelas: '2 KMI' },
        ],
      },
      {
        subject: 'Matematika',
        topics: [
          { title: 'Faktorisasi Suku Aljabar', kelas: '2 KMI' },
          { title: 'Persamaan dan Pertidaksamaan Linear Satu Variabel', kelas: '2 KMI' },
          { title: 'Fungsi', kelas: '2 KMI' },
          { title: 'Sistem Persamaan Linear Dua Variabel', kelas: '2 KMI' },
          { title: 'Teorema Pythagoras', kelas: '2 KMI' },
          { title: 'Lingkaran', kelas: '2 KMI' },
        ],
      },
    ],
    file_url: '/documents/Silabus_OGSO_2026.xlsx',
    file_name: 'Silabus_OGSO_2026_Jenjang_2.xlsx',
    file_size: '14.8 KB',
    pages: 18,
    is_published: true,
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'syl-03',
    title: 'Silabus Resmi OGSO 2026 Jenjang 3 (Kelas 3 KMI & 1 Intensif)',
    jenjang: 'Jenjang 3',
    target_kelas: '3 KMI & 1 Intensif',
    subject: 'Fisika, Biologi, Matematika',
    subjects: ['Fisika', 'Biologi', 'Matematika'],
    description: 'Silabus resmi materi pengujian OGSO 2026 untuk Kelas 3 KMI & 1 Intensif mencakup Kelistrikan & Kemagnetan Fisika, Sistem Ekskresi & Genetika Biologi, serta Geometri Ruang & Deret Matematika.',
    breakdown: [
      {
        subject: 'Fisika',
        topics: [
          { title: 'Listrik Statis', kelas: '3 KMI' },
          { title: 'Listrik Dinamis', kelas: '3 KMI' },
          { title: 'Arus Listrik', kelas: '3 KMI' },
          { title: 'Tata Surya', kelas: '3 KMI' },
          { title: 'Kemagnetan', kelas: '3 KMI' },
          { title: 'Induksi Elektromagnetik', kelas: '3 KMI' },
        ],
      },
      {
        subject: 'Biologi',
        topics: [
          { title: 'Sistem Ekskresi pada Manusia', kelas: '3 KMI' },
          { title: 'Sistem Reproduksi pada Manusia', kelas: '3 KMI' },
          { title: 'Sistem Koordinasi pada Manusia', kelas: '3 KMI' },
          { title: 'Pewarisan Sifat', kelas: '3 KMI' },
        ],
      },
      {
        subject: 'Matematika',
        topics: [
          { title: 'Kesebangunan', kelas: '3 KMI' },
          { title: 'Bangun Ruang Sisi Tegak, Limas, dan Prisma Tegak', kelas: '3 KMI' },
          { title: 'Lingkaran Dalam dan Luar Segitiga', kelas: '3 KMI' },
          { title: 'Barisan dan Deret Bilangan', kelas: '3 KMI' },
          { title: 'Bangun Ruang Sisi Lengkung', kelas: '3 KMI' },
        ],
      },
    ],
    file_url: '/documents/Silabus_OGSO_2026.xlsx',
    file_name: 'Silabus_OGSO_2026_Jenjang_3.xlsx',
    file_size: '14.8 KB',
    pages: 22,
    is_published: true,
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'syl-04',
    title: 'Silabus Resmi OGSO 2026 Jenjang 4 (Kelas 4 KMI & 3 Intensif)',
    jenjang: 'Jenjang 4',
    target_kelas: '4 KMI & 3 Intensif',
    subject: 'Fisika, Biologi, Matematika',
    subjects: ['Fisika', 'Biologi', 'Matematika'],
    description: 'Silabus resmi materi pengujian OGSO 2026 untuk Kelas 4 KMI & 3 Intensif dengan pendalaman materi Vektor, Kinematika & Dinamika Newton, Struktur Tumbuhan & Pewarisan Sifat, serta Bentuk Akar, Kuadrat & Trigonometri.',
    breakdown: [
      {
        subject: 'Fisika',
        topics: [
          { title: 'Besaran dan Pengukuran', kelas: '4 KMI' },
          { title: 'Hitung Vektor', kelas: '4 KMI' },
          { title: 'Gerak Lurus dan Gerak Melingkar', kelas: '4 KMI' },
          { title: 'Hukum Newton tentang Gerak', kelas: '4 KMI' },
        ],
      },
      {
        subject: 'Biologi',
        topics: [
          { title: 'Struktur dan Fungsi Jaringan pada Tumbuhan', focus: 'Materi Lanjutan', kelas: '2 KMI' },
          { title: 'Sistem Gerak pada Manusia', focus: 'Fokus: Tulang dan Otot', kelas: '2 KMI' },
          { title: 'Pewarisan Sifat', focus: 'Fokus: Persilangan dengan Dua Sifat Beda', kelas: '3 KMI' },
          { title: 'Klasifikasi Makhluk Hidup', focus: 'Fokus: Sistem Lima Kingdom dan Kunci Determinasi', kelas: '1 KMI' },
        ],
      },
      {
        subject: 'Matematika',
        topics: [
          { title: 'Bentuk Pangkat dan Akar', kelas: '4 KMI' },
          { title: 'Persamaan dan Fungsi Kuadrat', kelas: '4 KMI' },
          { title: 'Logika Matematika', kelas: '4 KMI' },
          { title: 'Trigonometri', kelas: '4 KMI' },
        ],
      },
    ],
    file_url: '/documents/Silabus_OGSO_2026.xlsx',
    file_name: 'Silabus_OGSO_2026_Jenjang_4.xlsx',
    file_size: '14.8 KB',
    pages: 26,
    is_published: true,
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'syl-05',
    title: 'Silabus Resmi OGSO 2026 Jenjang 5 (Kelas 5 KMI)',
    jenjang: 'Jenjang 5',
    target_kelas: '5 KMI',
    subject: 'Fisika, Biologi, Kimia, Matematika',
    subjects: ['Fisika', 'Biologi', 'Kimia', 'Matematika'],
    description: 'Silabus resmi materi pengujian OGSO 2026 untuk Kelas 5 KMI meliputi 4 bidang studi: Fisika (Optika, Termal, Listrik Dinamis), Biologi (Ekosistem, Saraf, Bioteknologi), Kimia Lengkap (Atom, Reaksi, Stoikiometri/Mol), dan Matematika Tingkat Lanjut (Trigonometri, Invers, Limit).',
    breakdown: [
      {
        subject: 'Fisika',
        topics: [
          { title: 'Optika Geometri', kelas: '5 KMI' },
          { title: 'Suhu dan Panas', kelas: '5 KMI' },
          { title: 'Listrik Dinamis', kelas: '5 KMI' },
        ],
      },
      {
        subject: 'Biologi',
        topics: [
          { title: 'Ekosistem', focus: 'Fokus: Rantai Makanan, Piramida Makanan, dan Arus Energi', kelas: '1 KMI' },
          { title: 'Sistem Koordinasi pada Manusia', focus: 'Fokus: Sistem Saraf dan Alat Indra', kelas: '3 KMI' },
          { title: 'Zat Adiktif dan Psikotropika', focus: 'Fokus: Jenis dan Efeknya bagi Tubuh', kelas: '2 KMI' },
          { title: 'Bioteknologi', focus: 'Fokus: Penerapan Bioteknologi - Produk dan Mikroorganisme', kelas: '3 KMI' },
        ],
      },
      {
        subject: 'Kimia',
        topics: [
          { title: 'Ilmu Kimia', focus: 'Fokus: Sejarah Ilmu Kimia dan Profil Ilmuwan Muslim', kelas: '5 KMI' },
          { title: 'Atom', kelas: '5 KMI' },
          { title: 'Rumus Tentang Atom', kelas: '5 KMI' },
          { title: 'Sistem Periodik', kelas: '5 KMI' },
          { title: 'Ikatan Kimia', kelas: '5 KMI' },
          { title: 'Struktur Nama Senyawa', kelas: '5 KMI' },
          { title: 'Persamaan Reaksi', kelas: '5 KMI' },
          { title: 'Konsep Mol', kelas: '5 KMI' },
        ],
      },
      {
        subject: 'Matematika',
        topics: [
          { title: 'Statistika', kelas: '5 KMI' },
          { title: 'Trigonometri untuk Jumlah dan Selisih Dua Sudut', kelas: '5 KMI' },
          { title: 'Fungsi Komposisi dan Fungsi Invers', kelas: '5 KMI' },
          { title: 'Limit Fungsi', kelas: '5 KMI' },
        ],
      },
    ],
    file_url: '/documents/Silabus_OGSO_2026.xlsx',
    file_name: 'Silabus_OGSO_2026_Jenjang_5.xlsx',
    file_size: '14.8 KB',
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
