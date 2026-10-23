import type { StudentJenjang } from '../types/student'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { cloudSyncService } from './supabase/cloudSyncService'

export interface SyllabusTopic {
  title: string
  focus?: string
  kelas: string
}

export interface SyllabusSubjectBreakdown {
  subject: string // "Fisika" | "Biologi" | "Matematika" | "Kimia"
  topics: SyllabusTopic[]
}

export interface SyllabusBookReference {
  title: string
  subject: string // "Fisika" | "Biologi" | "Matematika" | "Kimia" | "Umum"
  authorOrPublisher: string
  type: 'wajib' | 'pendamping'
  editionOrYear?: string
  chaptersOrCoverage?: string
  description?: string
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
  book_references?: SyllabusBookReference[]
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

const SILABUS_STORAGE_KEY = 'ogsoreg_silabus_2026_v3'
const BANK_SOAL_STORAGE_KEY = 'ogsoreg_bank_soal_v4'

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
    book_references: [
      {
        title: 'Fisika 1 KMI',
        subject: 'Fisika',
        authorOrPublisher: 'Darussalam Press — Pondok Modern Darussalam Gontor',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi KMI',
        chaptersOrCoverage: 'Bab Besaran & Satuan, Karakteristik Wujud Zat, Skala Suhu, Pemuaian & Perpindahan Kalor.',
        description: 'Buku pegangan wajib santri kelas 1 KMI untuk pemahaman konsep dasar sains fisik dan pengukuran eksperimental.',
      },
      {
        title: 'Jelajah Fakta Biologi 1',
        subject: 'Biologi',
        authorOrPublisher: 'Platinum',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi',
        chaptersOrCoverage: 'Bab Ciri Makhluk Hidup, Klasifikasi 5 Kingdom, Organisasi Kehidupan (Sel, Jaringan, Organ), dan Komponen Ekosistem.',
        description: 'Buku teks biologi seri Jelajah Fakta yang mengulas biodiversitas, sel hidup, dan interaksi lingkungan hidup.',
      },
      {
        title: 'Matematika 1 KMI',
        subject: 'Matematika',
        authorOrPublisher: 'Darussalam Press — Pondok Modern Darussalam Gontor',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi KMI',
        chaptersOrCoverage: 'Bab Aritmetika Bilangan Bulat & Pecahan, Aljabar Dasar, Operasi Himpunan, Konsep Geometri Sudut & Segitiga.',
        description: 'Buku teks matematika resmi KMI pembangun pondasi logika berhitung cepat dan manipulasi simbolik aljabar.',
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
    book_references: [
      {
        title: 'Fisika 2 KMI',
        subject: 'Fisika',
        authorOrPublisher: 'Darussalam Press — Pondok Modern Darussalam Gontor',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi KMI',
        chaptersOrCoverage: 'Bab Gaya & Hukum Newton Dasar, Usaha Mekanik & Energi, Tekanan Hidrostatis & Udara, Getaran, Gelombang, serta Sifat Cahaya & Optika.',
        description: 'Buku teks utama santri kelas 2 KMI untuk pemahaman mekanika gerak, hukum fluida, dan optik geometri.',
      },
      {
        title: 'Jelajah Fakta Biologi 2',
        subject: 'Biologi',
        authorOrPublisher: 'Platinum',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi',
        chaptersOrCoverage: 'Bab Fisiologi Manusia (Rangka & Otot, Enzim & Pencernaan, Pernapasan Paru-paru, Sirkulasi Jantung & Pembuluh Darah) serta Biokimia Fotosintesis Tumbuhan.',
        description: 'Buku teks biologi seri Jelajah Fakta untuk pemahaman sistem organ tubuh manusia dan metabolisme tumbuhan.',
      },
      {
        title: 'Matematika 2 KMI',
        subject: 'Matematika',
        authorOrPublisher: 'Darussalam Press — Pondok Modern Darussalam Gontor',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi KMI',
        chaptersOrCoverage: 'Bab Faktorisasi Kuadrat, Persamaan/Pertidaksamaan Linear (PLSV), Teori Relasi & Fungsi, SPLDV Metoda Eliminasi/Substitusi, Dalil Pythagoras, Geometri Garis & Sudut Lingkaran.',
        description: 'Buku teks matematika resmi KMI untuk mematangkan manipulasi aljabar persamaan dan dalil-dalil geometri bidang datar.',
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
    book_references: [
      {
        title: 'Fisika 3 KMI',
        subject: 'Fisika',
        authorOrPublisher: 'Darussalam Press — Pondok Modern Darussalam Gontor',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi KMI',
        chaptersOrCoverage: 'Bab Hukum Coulomb & Muatan Listrik, Hukum Ohm & Rangkaian Arus Listrik, Medan Magnetik, Transformator & Induksi Elektromagnetik, serta Astronomi Tata Surya.',
        description: 'Buku pegangan materi elektromagnetik dan fisika modern tingkat dasar untuk santri kelas 3 KMI dan 1 Intensif.',
      },
      {
        title: 'Jelajah Fakta Biologi 3',
        subject: 'Biologi',
        authorOrPublisher: 'Platinum',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi',
        chaptersOrCoverage: 'Bab Organ Ekskresi (Nefron Ginjal, Hati, Kulit), Fisiologi Reproduksi Manusia, Sistem Koordinasi Saraf & Hormon, serta Genetika Pewarisan Sifat Monohibrid/Dihibrid.',
        description: 'Buku teks biologi seri Jelajah Fakta untuk pemahaman sistem homeostasis manusia dan transmisi sifat keturunan.',
      },
      {
        title: 'Matematika 3 KMI',
        subject: 'Matematika',
        authorOrPublisher: 'Darussalam Press — Pondok Modern Darussalam Gontor',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi KMI',
        chaptersOrCoverage: 'Bab Teorema Kesebangunan Geometri, Volume & Luas Bangun Ruang Sisi Datar (Prisma & Limas), Jari-jari Lingkaran Dalam/Luar Segitiga, Rumus Barisan & Deret Bilangan, Bangun Ruang Sisi Lengkung (Tabung, Kerucut, Bola).',
        description: 'Buku teks matematika resmi KMI untuk memperdalam pemecahan masalah geometri ruang tiga dimensi dan pola barisan deret.',
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
    book_references: [
      {
        title: 'Kajian Konsep Fisika 1',
        subject: 'Fisika',
        authorOrPublisher: 'Platinum',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi',
        chaptersOrCoverage: 'Bab Vektor Satuan & Komponen Resultan, Kinematika Gerak Lurus (GLB, GLBB, Gerak Vertikal), Dinamika Gerak Melingkar (GMB/GMBB), Aplikasi Hukum Newton I, II, III dan Gaya Gesek.',
        description: 'Buku fisika seri Kajian Konsep untuk penguasaan mekanika fisika analitis tingkat menengah-atas.',
      },
      {
        title: 'Jelajah Fakta Biologi 1',
        subject: 'Biologi',
        authorOrPublisher: 'Platinum',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi',
        chaptersOrCoverage: 'Bab Ciri Makhluk Hidup, Klasifikasi 5 Kingdom, Organisasi Kehidupan (Sel, Jaringan, Organ), dan Komponen Ekosistem.',
        description: 'Jelajah Fakta Biologi jilid 1 sebagai referensi biologi untuk jenjang 4.',
      },
      {
        title: 'Jelajah Fakta Biologi 2',
        subject: 'Biologi',
        authorOrPublisher: 'Platinum',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi',
        chaptersOrCoverage: 'Bab Fisiologi Manusia (Rangka & Otot, Enzim & Pencernaan, Pernapasan, Sirkulasi) serta Biokimia Fotosintesis Tumbuhan.',
        description: 'Jelajah Fakta Biologi jilid 2 sebagai referensi biologi untuk jenjang 4.',
      },
      {
        title: 'Jelajah Fakta Biologi 3',
        subject: 'Biologi',
        authorOrPublisher: 'Platinum',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi',
        chaptersOrCoverage: 'Bab Organ Ekskresi, Fisiologi Reproduksi Manusia, Sistem Koordinasi Saraf & Hormon, serta Genetika Pewarisan Sifat.',
        description: 'Jelajah Fakta Biologi jilid 3 sebagai referensi biologi untuk jenjang 4.',
      },
      {
        title: 'Matematika 4 KMI',
        subject: 'Matematika',
        authorOrPublisher: 'Darussalam Press — Pondok Modern Darussalam Gontor',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi KMI',
        chaptersOrCoverage: 'Bab Eksponensial & Rasionalisasi Bentuk Akar Kompleks, Persamaan Kuadrat & Analisis Diskriminan, Logika Formal (Tabel Kebenaran, Implikasi, Konvers, Kontraposisi), Perbandingan Trigonometri Sudut Istimewa.',
        description: 'Buku matematika resmi KMI pembangun pondasi berpikir deduktif, kalkulasi aljabar tingkat lanjut, dan geometri trigonometri.',
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
    book_references: [
      {
        title: 'Kajian Konsep Fisika 1',
        subject: 'Fisika',
        authorOrPublisher: 'Platinum',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi',
        chaptersOrCoverage: 'Bab Pembiasan Cahaya Lensa Tipis & Cermin Lengkung, Teori Kinetik Gas & Termodinamika Kalor, Rangkaian Listrik Tertutup Loop Tunggal/Ganda (Hukum Kirchhoff).',
        description: 'Buku fisika seri Kajian Konsep untuk analisis mendalam optika geometri, kalor lanjut, dan sirkuit listrik dinamis.',
      },
      {
        title: 'Jelajah Fakta Biologi 1',
        subject: 'Biologi',
        authorOrPublisher: 'Platinum',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi',
        chaptersOrCoverage: 'Bab Ciri Makhluk Hidup, Klasifikasi 5 Kingdom, Organisasi Kehidupan (Sel, Jaringan, Organ), dan Komponen Ekosistem.',
        description: 'Jelajah Fakta Biologi jilid 1 sebagai referensi biologi untuk jenjang 5.',
      },
      {
        title: 'Jelajah Fakta Biologi 2',
        subject: 'Biologi',
        authorOrPublisher: 'Platinum',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi',
        chaptersOrCoverage: 'Bab Fisiologi Manusia (Rangka & Otot, Enzim & Pencernaan, Pernapasan, Sirkulasi) serta Biokimia Fotosintesis Tumbuhan.',
        description: 'Jelajah Fakta Biologi jilid 2 sebagai referensi biologi untuk jenjang 5.',
      },
      {
        title: 'Jelajah Fakta Biologi 3',
        subject: 'Biologi',
        authorOrPublisher: 'Platinum',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi',
        chaptersOrCoverage: 'Bab Organ Ekskresi, Fisiologi Reproduksi Manusia, Sistem Koordinasi Saraf & Hormon, serta Genetika Pewarisan Sifat.',
        description: 'Jelajah Fakta Biologi jilid 3 sebagai referensi biologi untuk jenjang 5.',
      },
      {
        title: 'Kimia KMI',
        subject: 'Kimia',
        authorOrPublisher: 'Darussalam Press — Pondok Modern Darussalam Gontor',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi KMI',
        chaptersOrCoverage: 'Bab Sejarah Kimia & Profil Kimiawan Muslim (Jabir bin Hayyan, Al-Razi, dll.), Teori Struktur Atom, Tabel Periodik Unsur, Ikatan Kimia (Kovalen & Ionik), Tata Nama Senyawa IUPAC, Penyetaraan Persamaan Reaksi Kimia, Stoikiometri & Konsep Mol Avogadro.',
        description: 'Buku teks kimia resmi kurikulum KMI yang menggabungkan sejarah peradaban sains Islam dengan kimia stoikiometri analitis.',
      },
      {
        title: 'Matematika 5 KMI',
        subject: 'Matematika',
        authorOrPublisher: 'Darussalam Press — Pondok Modern Darussalam Gontor',
        type: 'wajib',
        editionOrYear: 'Edisi Resmi KMI',
        chaptersOrCoverage: 'Bab Statistika Deskriptif (Kuartil, Rataan, Ragam), Rumus Trigonometri Jumlah & Selisih Dua Sudut, Aljabar Fungsi Komposisi & Invers (f o g), dan Teorema Dasar Limit Fungsi Aljabar.',
        description: 'Buku matematika resmi KMI tingkat tertinggi menuju persiapan kalkulus dan aljabar tingkat lanjut.',
      },
      {
        title: 'Panduan & Pengayaan Olimpiade Matematika dan Sains MAFIKIB',
        subject: 'Umum',
        authorOrPublisher: 'Tim Pembina Olimpiade Sains Indonesia / Puspresnas',
        type: 'pendamping',
        editionOrYear: 'Edisi Seleksi Nasional',
        chaptersOrCoverage: 'Bank soal penalaran komprehensif 4 pilar sains: Fisika, Biologi, Kimia, dan Matematika tingkat lanjut.',
        description: 'Kumpulan soal latihan berbasis penalaran kritis dan pemecahan masalah multidisiplin sains.',
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
  // ============================================================
  // 2025 — Penyisihan only (per-mapel, belum ada final)
  // ============================================================
  {
    id: 'bs-penyisihan-2025',
    year: 2025,
    babak: 'Penyisihan',
    title: 'Soal Penyisihan 2025',
    description: 'Naskah resmi soal babak penyisihan OGSO 2025. Soal disusun per bidang studi oleh tim pembuat soal masing-masing.',
    is_published: true,
    created_at: '2025-02-01T00:00:00Z',
    documents: [
      { id: 'doc-p25-mtk', collection_id: 'bs-penyisihan-2025', jenjang: 'Jenjang 4', title: 'Soal Penyisihan OGSO 2025 — Matematika (Hasyim)', file_url: '/documents/soal/2025/soal Penyisihan GSO_Hasyim_DMS_Mtk.docx', file_name: 'soal Penyisihan GSO_Hasyim_DMS_Mtk.docx', file_size: '699 KB', is_published: true, download_count: 0, created_at: '2025-02-01T00:00:00Z' },
      { id: 'doc-p25-fis', collection_id: 'bs-penyisihan-2025', jenjang: 'Jenjang 4', title: 'Soal Penyisihan OGSO 2025 — Fisika (Fatih)', file_url: '/documents/soal/2025/Soal Penyisihan OGSO_Fatih Ahmad S_DMS_Fisika.docx', file_name: 'Soal Penyisihan OGSO_Fatih Ahmad S_DMS_Fisika.docx', file_size: '888 KB', is_published: true, download_count: 0, created_at: '2025-02-01T00:00:00Z' },
      { id: 'doc-p25-bio', collection_id: 'bs-penyisihan-2025', jenjang: 'Jenjang 3', title: 'Soal Penyisihan OGSO 2025 — Biologi (Naufal)', file_url: '/documents/soal/2025/Soal Penyisihan OGSO_Naufal Rafi_shigor_Biologi.docx', file_name: 'Soal Penyisihan OGSO_Naufal Rafi_shigor_Biologi.docx', file_size: '344 KB', is_published: true, download_count: 0, created_at: '2025-02-01T00:00:00Z' },
      { id: 'doc-p25-kim', collection_id: 'bs-penyisihan-2025', jenjang: 'Jenjang 5', title: 'Soal Penyisihan OGSO 2025 — Kimia (Yusuf)', file_url: '/documents/soal/2025/Soal Penyisihan OGSO 2025_Yusuf_DMS_Kimia.docx', file_name: 'Soal Penyisihan OGSO 2025_Yusuf_DMS_Kimia.docx', file_size: '886 KB', is_published: true, download_count: 0, created_at: '2025-02-01T00:00:00Z' },
    ],
  },
  // ============================================================
  // 2024 — Penyisihan
  // ============================================================
  {
    id: 'bs-penyisihan-2024',
    year: 2024,
    babak: 'Penyisihan',
    title: 'Soal Penyisihan 2024',
    description: 'Naskah resmi soal babak penyisihan OGSO 2024.',
    is_published: true,
    created_at: '2024-02-01T00:00:00Z',
    documents: [
      { id: 'doc-p24-mtk-shigor', collection_id: 'bs-penyisihan-2024', jenjang: 'Jenjang 3', title: 'Soal Penyisihan 2024 — Matematika Shigor (Jenjang 1–3)', file_url: '/documents/soal/2024/penyisihan/SOAL-SOAL MATEMATIKA SHIGOR.docx', file_name: 'SOAL-SOAL MATEMATIKA SHIGOR.docx', file_size: '4.5 MB', is_published: true, download_count: 0, created_at: '2024-02-01T00:00:00Z' },
      { id: 'doc-p24-mtk-kibar', collection_id: 'bs-penyisihan-2024', jenjang: 'Jenjang 4', title: 'Soal Penyisihan 2024 — Matematika Kibar (Jenjang 4)', file_url: '/documents/soal/2024/penyisihan/SOAL-SOAL MATEMATIKA KIBAR.docx', file_name: 'SOAL-SOAL MATEMATIKA KIBAR.docx', file_size: '130 KB', is_published: true, download_count: 0, created_at: '2024-02-01T00:00:00Z' },
      { id: 'doc-p24-ipa-shigor', collection_id: 'bs-penyisihan-2024', jenjang: 'Jenjang 3', title: 'Soal Penyisihan 2024 — IPA Shigor (Jenjang 1–3)', file_url: '/documents/soal/2024/penyisihan/IPA Shigor.docx', file_name: 'IPA Shigor.docx', file_size: '1.9 MB', is_published: true, download_count: 0, created_at: '2024-02-01T00:00:00Z' },
      { id: 'doc-p24-ipa-kibar', collection_id: 'bs-penyisihan-2024', jenjang: 'Jenjang 4', title: 'Soal Penyisihan 2024 — IPA Kibar (Jenjang 4)', file_url: '/documents/soal/2024/penyisihan/IPA Kibar.docx', file_name: 'IPA Kibar.docx', file_size: '710 KB', is_published: true, download_count: 0, created_at: '2024-02-01T00:00:00Z' },
      { id: 'doc-p24-dms', collection_id: 'bs-penyisihan-2024', jenjang: 'Jenjang 5', title: 'Soal Penyisihan 2024 — DMS (Jenjang 5)', file_url: '/documents/soal/2024/penyisihan/DMS 2024.docx', file_name: 'DMS 2024.docx', file_size: '136 KB', is_published: true, download_count: 0, created_at: '2024-02-01T00:00:00Z' },
    ],
  },
  // ============================================================
  // 2024 — Final
  // ============================================================
  {
    id: 'bs-final-2024',
    year: 2024,
    babak: 'Final',
    title: 'Soal Final 2024',
    description: 'Naskah resmi soal babak final OGSO 2024.',
    is_published: true,
    created_at: '2024-04-01T00:00:00Z',
    documents: [
      { id: 'doc-f24-mtk-shigor', collection_id: 'bs-final-2024', jenjang: 'Jenjang 3', title: 'Soal Final 2024 — Matematika Shigor (Jenjang 1–3)', file_url: '/documents/soal/2024/final/Soal Final Matematika Shigor 2024_002413.pdf', file_name: 'Soal Final Matematika Shigor 2024_002413.pdf', file_size: '877 KB', is_published: true, download_count: 0, created_at: '2024-04-01T00:00:00Z' },
      { id: 'doc-f24-mtk-kibar', collection_id: 'bs-final-2024', jenjang: 'Jenjang 4', title: 'Soal Final 2024 — Matematika Kibar (Jenjang 4)', file_url: '/documents/soal/2024/final/Soal Final Mateamtika Kibar 2024 FIX_002413.pdf', file_name: 'Soal Final Mateamtika Kibar 2024 FIX_002413.pdf', file_size: '932 KB', is_published: true, download_count: 0, created_at: '2024-04-01T00:00:00Z' },
      { id: 'doc-f24-ipa-shigor', collection_id: 'bs-final-2024', jenjang: 'Jenjang 3', title: 'Soal Final 2024 — IPA Shigor (Jenjang 1–3)', file_url: '/documents/soal/2024/final/Soal Final IPA Shigor 2024 Fix_002413.pdf', file_name: 'Soal Final IPA Shigor 2024 Fix_002413.pdf', file_size: '347 KB', is_published: true, download_count: 0, created_at: '2024-04-01T00:00:00Z' },
      { id: 'doc-f24-ipa-kibar', collection_id: 'bs-final-2024', jenjang: 'Jenjang 4', title: 'Soal Final 2024 — IPA Kibar (Jenjang 4)', file_url: '/documents/soal/2024/final/Soal Final IPA Kibar 2024 FIX_002413.pdf', file_name: 'Soal Final IPA Kibar 2024 FIX_002413.pdf', file_size: '406 KB', is_published: true, download_count: 0, created_at: '2024-04-01T00:00:00Z' },
      { id: 'doc-f24-dms', collection_id: 'bs-final-2024', jenjang: 'Jenjang 5', title: 'Soal Final 2024 — DMS (Jenjang 5)', file_url: '/documents/soal/2024/final/Soal Final DMS 2024_002413.pdf', file_name: 'Soal Final DMS 2024_002413.pdf', file_size: '261 KB', is_published: true, download_count: 0, created_at: '2024-04-01T00:00:00Z' },
      { id: 'doc-f24-all', collection_id: 'bs-final-2024', jenjang: 'Jenjang 5', title: 'Soal Final OGSO 2024 — Lengkap (Semua Jenjang)', file_url: '/documents/soal/2024/final/Soal Final OGSO 2024.pdf', file_name: 'Soal Final OGSO 2024.pdf', file_size: '2.7 MB', is_published: true, download_count: 0, created_at: '2024-04-01T00:00:00Z' },
    ],
  },
  // ============================================================
  // 2023 — Penyisihan
  // ============================================================
  {
    id: 'bs-penyisihan-2023',
    year: 2023,
    babak: 'Penyisihan',
    title: 'Soal Penyisihan 2023',
    description: 'Naskah resmi soal babak penyisihan OGSO 2023.',
    is_published: true,
    created_at: '2023-02-01T00:00:00Z',
    documents: [
      { id: 'doc-p23-mtk-shigor', collection_id: 'bs-penyisihan-2023', jenjang: 'Jenjang 3', title: 'Soal Penyisihan 2023 — Matematika Shigor (Jenjang 1–3)', file_url: '/documents/soal/2023/penyisihan/01. MTK Shigor Lengkap.docx', file_name: '01. MTK Shigor Lengkap.docx', file_size: '89 KB', is_published: true, download_count: 0, created_at: '2023-02-01T00:00:00Z' },
      { id: 'doc-p23-mtk-kibar', collection_id: 'bs-penyisihan-2023', jenjang: 'Jenjang 4', title: 'Soal Penyisihan 2023 — Matematika Kibar (Jenjang 4)', file_url: '/documents/soal/2023/penyisihan/02. MTK Kibar Lengkap.docx', file_name: '02. MTK Kibar Lengkap.docx', file_size: '78 KB', is_published: true, download_count: 0, created_at: '2023-02-01T00:00:00Z' },
      { id: 'doc-p23-ipa-shigor', collection_id: 'bs-penyisihan-2023', jenjang: 'Jenjang 3', title: 'Soal Penyisihan 2023 — IPA Shigor (Jenjang 1–3)', file_url: '/documents/soal/2023/penyisihan/03. IPA Shigor Lengkap.docx', file_name: '03. IPA Shigor Lengkap.docx', file_size: '57 KB', is_published: true, download_count: 0, created_at: '2023-02-01T00:00:00Z' },
      { id: 'doc-p23-ipa-kibar', collection_id: 'bs-penyisihan-2023', jenjang: 'Jenjang 4', title: 'Soal Penyisihan 2023 — IPA Kibar (Jenjang 4)', file_url: '/documents/soal/2023/penyisihan/04. IPA Kibar Lengkap.docx', file_name: '04. IPA Kibar Lengkap.docx', file_size: '117 KB', is_published: true, download_count: 0, created_at: '2023-02-01T00:00:00Z' },
      { id: 'doc-p23-dms', collection_id: 'bs-penyisihan-2023', jenjang: 'Jenjang 5', title: 'Soal Penyisihan 2023 — DMS (Jenjang 5)', file_url: '/documents/soal/2023/penyisihan/05. DMS Soal.docx', file_name: '05. DMS Soal.docx', file_size: '68 KB', is_published: true, download_count: 0, created_at: '2023-02-01T00:00:00Z' },
    ],
  },
  // ============================================================
  // 2023 — Final
  // ============================================================
  {
    id: 'bs-final-2023',
    year: 2023,
    babak: 'Final',
    title: 'Soal Final 2023',
    description: 'Naskah resmi soal babak final OGSO 2023.',
    is_published: true,
    created_at: '2023-04-01T00:00:00Z',
    documents: [
      { id: 'doc-f23-mtk-shigor', collection_id: 'bs-final-2023', jenjang: 'Jenjang 3', title: 'Soal Final 2023 — Matematika Shigor (Jenjang 1–3)', file_url: '/documents/soal/2023/final/01. MTK Shigor Soal.docx', file_name: '01. MTK Shigor Soal.docx', file_size: '151 KB', is_published: true, download_count: 0, created_at: '2023-04-01T00:00:00Z' },
      { id: 'doc-f23-mtk-kibar', collection_id: 'bs-final-2023', jenjang: 'Jenjang 4', title: 'Soal Final 2023 — Matematika Kibar (Jenjang 4)', file_url: '/documents/soal/2023/final/02. MTK Kibar Soal.docx', file_name: '02. MTK Kibar Soal.docx', file_size: '135 KB', is_published: true, download_count: 0, created_at: '2023-04-01T00:00:00Z' },
      { id: 'doc-f23-ipa-shigor', collection_id: 'bs-final-2023', jenjang: 'Jenjang 3', title: 'Soal Final 2023 — IPA Shigor (Jenjang 1–3)', file_url: '/documents/soal/2023/final/03. IPA Shigor Soal.docx', file_name: '03. IPA Shigor Soal.docx', file_size: '17 KB', is_published: true, download_count: 0, created_at: '2023-04-01T00:00:00Z' },
      { id: 'doc-f23-ipa-kibar', collection_id: 'bs-final-2023', jenjang: 'Jenjang 4', title: 'Soal Final 2023 — IPA Kibar (Jenjang 4)', file_url: '/documents/soal/2023/final/04. IPA Kibar Soal.docx', file_name: '04. IPA Kibar Soal.docx', file_size: '30 KB', is_published: true, download_count: 0, created_at: '2023-04-01T00:00:00Z' },
      { id: 'doc-f23-dms', collection_id: 'bs-final-2023', jenjang: 'Jenjang 5', title: 'Soal Final 2023 — DMS (Jenjang 5)', file_url: '/documents/soal/2023/final/05. DMS Soal.docx', file_name: '05. DMS Soal.docx', file_size: '47 KB', is_published: true, download_count: 0, created_at: '2023-04-01T00:00:00Z' },
    ],
  },
  // ============================================================
  // 2022 — Penyisihan
  // ============================================================
  {
    id: 'bs-penyisihan-2022',
    year: 2022,
    babak: 'Penyisihan',
    title: 'Soal Penyisihan 2022',
    description: 'Naskah resmi soal babak penyisihan OGSO 2022.',
    is_published: true,
    created_at: '2022-02-01T00:00:00Z',
    documents: [
      { id: 'doc-p22-mtk-shigor', collection_id: 'bs-penyisihan-2022', jenjang: 'Jenjang 3', title: 'Soal Penyisihan 2022 — Matematika Shigor (Jenjang 1–3)', file_url: '/documents/soal/2022/Penyisihan/01. SOAL PENYISIHAN MTK Shigor 2022 .docx', file_name: '01. SOAL PENYISIHAN MTK Shigor 2022.docx', file_size: '702 KB', is_published: true, download_count: 0, created_at: '2022-02-01T00:00:00Z' },
      { id: 'doc-p22-mtk-kibar', collection_id: 'bs-penyisihan-2022', jenjang: 'Jenjang 4', title: 'Soal Penyisihan 2022 — Matematika Kibar (Jenjang 4)', file_url: '/documents/soal/2022/Penyisihan/02. SOAL PENYISIHAN MTK Kibar 2022.docx', file_name: '02. SOAL PENYISIHAN MTK Kibar 2022.docx', file_size: '658 KB', is_published: true, download_count: 0, created_at: '2022-02-01T00:00:00Z' },
      { id: 'doc-p22-ipa-shigor', collection_id: 'bs-penyisihan-2022', jenjang: 'Jenjang 3', title: 'Soal Penyisihan 2022 — IPA Shigor (Jenjang 1–3)', file_url: '/documents/soal/2022/Penyisihan/03. SOAL PENYISIHAN IPA Shigor 2022.docx', file_name: '03. SOAL PENYISIHAN IPA Shigor 2022.docx', file_size: '640 KB', is_published: true, download_count: 0, created_at: '2022-02-01T00:00:00Z' },
      { id: 'doc-p22-ipa-kibar', collection_id: 'bs-penyisihan-2022', jenjang: 'Jenjang 4', title: 'Soal Penyisihan 2022 — IPA Kibar (Jenjang 4)', file_url: '/documents/soal/2022/Penyisihan/04. SOAL PENYISIHAN IPA Kibar 2022.docx', file_name: '04. SOAL PENYISIHAN IPA Kibar 2022.docx', file_size: '697 KB', is_published: true, download_count: 0, created_at: '2022-02-01T00:00:00Z' },
      { id: 'doc-p22-dms', collection_id: 'bs-penyisihan-2022', jenjang: 'Jenjang 5', title: 'Soal Penyisihan 2022 — DMS (Jenjang 5)', file_url: '/documents/soal/2022/Penyisihan/05. SOAL PENYISIHAN DMS 2022.docx', file_name: '05. SOAL PENYISIHAN DMS 2022.docx', file_size: '687 KB', is_published: true, download_count: 0, created_at: '2022-02-01T00:00:00Z' },
    ],
  },
  // ============================================================
  // 2022 — Final
  // ============================================================
  {
    id: 'bs-final-2022',
    year: 2022,
    babak: 'Final',
    title: 'Soal Final 2022',
    description: 'Naskah resmi soal babak final OGSO 2022.',
    is_published: true,
    created_at: '2022-04-01T00:00:00Z',
    documents: [
      { id: 'doc-f22-mtk-shigor', collection_id: 'bs-final-2022', jenjang: 'Jenjang 3', title: 'Soal Final 2022 — Matematika Shigor (Jenjang 1–3)', file_url: '/documents/soal/2022/Final/01. SOAL FINAL MTK Shigor 2022.docx', file_name: '01. SOAL FINAL MTK Shigor 2022.docx', file_size: '806 KB', is_published: true, download_count: 0, created_at: '2022-04-01T00:00:00Z' },
      { id: 'doc-f22-mtk-kibar', collection_id: 'bs-final-2022', jenjang: 'Jenjang 4', title: 'Soal Final 2022 — Matematika Kibar (Jenjang 4)', file_url: '/documents/soal/2022/Final/02. SOAL FINAL MTK Kibar 2022.docx', file_name: '02. SOAL FINAL MTK Kibar 2022.docx', file_size: '807 KB', is_published: true, download_count: 0, created_at: '2022-04-01T00:00:00Z' },
      { id: 'doc-f22-ipa-shigor', collection_id: 'bs-final-2022', jenjang: 'Jenjang 3', title: 'Soal Final 2022 — IPA Shigor (Jenjang 1–3)', file_url: '/documents/soal/2022/Final/03. SOAL FINALIPA Shigor 2022.docx', file_name: '03. SOAL FINALIPA Shigor 2022.docx', file_size: '619 KB', is_published: true, download_count: 0, created_at: '2022-04-01T00:00:00Z' },
      { id: 'doc-f22-ipa-kibar', collection_id: 'bs-final-2022', jenjang: 'Jenjang 4', title: 'Soal Final 2022 — IPA Kibar (Jenjang 4)', file_url: '/documents/soal/2022/Final/04. SOAL FINAL IPA Kibar 2022.docx', file_name: '04. SOAL FINAL IPA Kibar 2022.docx', file_size: '619 KB', is_published: true, download_count: 0, created_at: '2022-04-01T00:00:00Z' },
      { id: 'doc-f22-dms', collection_id: 'bs-final-2022', jenjang: 'Jenjang 5', title: 'Soal Final 2022 — DMS (Jenjang 5)', file_url: '/documents/soal/2022/Final/05. SOAL FINAL DMS 2022.docx', file_name: '05. SOAL FINAL DMS 2022.docx', file_size: '668 KB', is_published: true, download_count: 0, created_at: '2022-04-01T00:00:00Z' },
    ],
  },
]

class MateriService {
  private isCloudSyncing = false
  private hasInitializedCloud = false

  constructor() {
    this.initCloudSync()
  }

  private initCloudSync() {
    if (this.hasInitializedCloud || typeof window === 'undefined') return
    this.hasInitializedCloud = true

    setTimeout(() => {
      this.syncFromCloud().catch(() => {})
    }, 250)

    window.addEventListener('focus', () => {
      this.syncFromCloud().catch(() => {})
    })
    window.addEventListener('online', () => {
      this.syncFromCloud().catch(() => {})
    })

    if (isSupabaseConfigured()) {
      try {
        supabase
          .channel('realtime:materi')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'syllabuses' }, () => {
            this.syncFromCloud().catch(() => {})
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'bank_soal' }, () => {
            this.syncFromCloud().catch(() => {})
          })
          .subscribe()

        cloudSyncService.subscribeCloudSetting('materi_silabus', () => {
          this.syncFromCloud().catch(() => {})
        })
        cloudSyncService.subscribeCloudSetting('materi_bank_soal', () => {
          this.syncFromCloud().catch(() => {})
        })
      } catch {
        // Ignore
      }
    }
  }

  async syncFromCloud(): Promise<void> {
    if (!isSupabaseConfigured() || this.isCloudSyncing) return
    this.isCloudSyncing = true
    try {
      // 1. Silabus
      const cloudSilabus = await cloudSyncService.getCloudSetting<SyllabusItem[] | null>('materi_silabus', null)
      if (cloudSilabus && Array.isArray(cloudSilabus) && cloudSilabus.length > 0) {
        localStorage.setItem(SILABUS_STORAGE_KEY, JSON.stringify(cloudSilabus))
        window.dispatchEvent(new CustomEvent('ogsoreg_silabus_updated'))
      }

      // 2. Bank Soal
      const cloudBankSoal = await cloudSyncService.getCloudSetting<BankSoalCollection[] | null>('materi_bank_soal', null)
      if (cloudBankSoal && Array.isArray(cloudBankSoal) && cloudBankSoal.length > 0) {
        localStorage.setItem(BANK_SOAL_STORAGE_KEY, JSON.stringify(cloudBankSoal))
        window.dispatchEvent(new CustomEvent('ogsoreg_bank_soal_updated'))
      }
    } catch (err) {
      console.warn('[MateriService] Cloud sync error:', err)
    } finally {
      this.isCloudSyncing = false
    }
  }

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

    list = list.map((s) => {
      const normalizedJenjang = normalizeMateriJenjang(s.jenjang)
      const initialMatch = INITIAL_SYLLABUSES.find((init) => init.jenjang === normalizedJenjang)
      return {
        ...s,
        jenjang: normalizedJenjang,
        target_kelas: s.target_kelas || initialMatch?.target_kelas,
        breakdown: (s.breakdown && s.breakdown.length > 0) ? s.breakdown : initialMatch?.breakdown,
        book_references: initialMatch?.book_references || s.book_references,
      }
    })

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
      window.dispatchEvent(new CustomEvent('ogsoreg_silabus_updated'))
    }
    cloudSyncService.saveCloudSetting('materi_silabus', list)
    return saved
  }

  deleteSyllabus(id: string): boolean {
    const list = this.getSyllabuses().filter((s) => s.id !== id)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SILABUS_STORAGE_KEY, JSON.stringify(list))
      window.dispatchEvent(new CustomEvent('ogsoreg_silabus_updated'))
    }
    cloudSyncService.saveCloudSetting('materi_silabus', list)
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
        window.dispatchEvent(new CustomEvent('ogsoreg_silabus_updated'))
      }
      cloudSyncService.saveCloudSetting('materi_silabus', list)
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
      window.dispatchEvent(new CustomEvent('ogsoreg_bank_soal_updated'))
    }
    cloudSyncService.saveCloudSetting('materi_bank_soal', list)
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
      window.dispatchEvent(new CustomEvent('ogsoreg_bank_soal_updated'))
    }
    cloudSyncService.saveCloudSetting('materi_bank_soal', list)
    return newDoc
  }

  deleteDocument(collectionId: string, docId: string): boolean {
    const list = this.getBankSoalCollections()
    const col = list.find((c) => c.id === collectionId)
    if (!col || !col.documents) return false

    col.documents = col.documents.filter((d) => d.id !== docId)

    if (typeof window !== 'undefined') {
      localStorage.setItem(BANK_SOAL_STORAGE_KEY, JSON.stringify(list))
      window.dispatchEvent(new CustomEvent('ogsoreg_bank_soal_updated'))
    }
    cloudSyncService.saveCloudSetting('materi_bank_soal', list)
    return true
  }

  deleteCollection(collectionId: string): boolean {
    const list = this.getBankSoalCollections().filter((c) => c.id !== collectionId)
    if (typeof window !== 'undefined') {
      localStorage.setItem(BANK_SOAL_STORAGE_KEY, JSON.stringify(list))
      window.dispatchEvent(new CustomEvent('ogsoreg_bank_soal_updated'))
    }
    cloudSyncService.saveCloudSetting('materi_bank_soal', list)
    return true
  }
}

export const materiService = new MateriService()
