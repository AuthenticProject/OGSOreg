import ExcelJS from 'exceljs'
import { MOODLE_JENJANG_OPTIONS } from '../types/excel'
import { KAMPUS_OPTIONS } from '../types/campus'

/**
 * Builds the official OGSOreg collective bulk registration template (Phase 7)
 * with columns: Username, Nama Depan, Nama Belakang, Email, Jenjang, Kampus.
 * Includes Jenjang dropdown validation (Kelas 1 - Kelas 5), Kampus dropdown (20 options),
 * hidden reference sheet, Contoh sheet, and Petunjuk sheet.
 * Validation covers at least 5,000 input rows.
 */
export async function buildRegistrationWorkbook(): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'OGSOreg LMS Moodle Portal'
  workbook.lastModifiedBy = 'OGSOreg'
  workbook.created = new Date()

  // ----------------------------------------------------
  // 1. SHEET REFERENSI (Hidden reference sheet for 20 campuses & 5 grades)
  // ----------------------------------------------------
  const wsRef = workbook.addWorksheet('_REFERENSI', {
    state: 'hidden',
  })

  // Column A: Kampus, Column B: Jenjang
  KAMPUS_OPTIONS.forEach((k, idx) => {
    const row = wsRef.getRow(idx + 1)
    row.getCell(1).value = k
  })

  MOODLE_JENJANG_OPTIONS.forEach((j, idx) => {
    const row = wsRef.getRow(idx + 1)
    row.getCell(2).value = j
  })

  // ----------------------------------------------------
  // 2. SHEET PENDAFTARAN (Main Input Form)
  // ----------------------------------------------------
  const ws = workbook.addWorksheet('PENDAFTARAN', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  ws.columns = [
    { header: 'Username', key: 'username', width: 24 },
    { header: 'Nama Depan', key: 'firstname', width: 24 },
    { header: 'Nama Belakang', key: 'lastname', width: 24 },
    { header: 'Email', key: 'email', width: 32 },
    { header: 'Jenjang', key: 'jenjang', width: 20 },
    { header: 'Kampus', key: 'kampus', width: 24 },
  ]

  // Style Header Row
  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF166534' }, // Brand Green (#166534)
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 26

  // Apply dropdown data validation to column E (Jenjang) and column F (Kampus)
  // Covers at least 5,000 input rows (rows 2 to 5001)
  for (let r = 2; r <= 5001; r++) {
    // Column E: Jenjang
    ws.getCell(`E${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_REFERENSI!$B$1:$B$5'],
      showErrorMessage: true,
      errorTitle: 'Pilihan Jenjang Tidak Valid',
      error: 'Pilih salah satu jenjang: Kelas 1, Kelas 2, Kelas 3, Kelas 4, atau Kelas 5.',
    }

    // Column F: Kampus (20 official Gontor options)
    ws.getCell(`F${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_REFERENSI!$A$1:$A$20'],
      showErrorMessage: true,
      errorTitle: 'Pilihan Kampus Tidak Valid',
      error: 'Pilih salah satu dari 20 Kampus Gontor resmi (misal: Gontor 1, Gontor Putri 1).',
    }
  }

  // ----------------------------------------------------
  // 3. SHEET CONTOH (Sample Data demonstrating mixed campus & mixed classes)
  // ----------------------------------------------------
  const wsContoh = workbook.addWorksheet('Contoh', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  wsContoh.columns = [
    { header: 'Username', key: 'username', width: 24 },
    { header: 'Nama Depan', key: 'firstname', width: 24 },
    { header: 'Nama Belakang', key: 'lastname', width: 24 },
    { header: 'Email', key: 'email', width: 32 },
    { header: 'Jenjang', key: 'jenjang', width: 20 },
    { header: 'Kampus', key: 'kampus', width: 24 },
  ]

  const headerContoh = wsContoh.getRow(1)
  headerContoh.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  headerContoh.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Slate-800
  }
  headerContoh.alignment = { vertical: 'middle', horizontal: 'center' }
  headerContoh.height = 26

  const sampleParticipants = [
    {
      username: 'budi_santoso',
      firstname: 'Budi',
      lastname: 'Santoso',
      email: 'budi.santoso@sekolah.sch.id',
      jenjang: 'Kelas 1',
      kampus: 'Gontor 1',
    },
    {
      username: 'siti_rahma',
      firstname: 'Siti',
      lastname: 'Rahma',
      email: 'siti.rahma@sekolah.sch.id',
      jenjang: 'Kelas 2',
      kampus: 'Gontor Putri 1',
    },
    {
      username: 'andi_wijaya',
      firstname: 'Andi',
      lastname: 'Wijaya',
      email: 'andi.wijaya@sekolah.sch.id',
      jenjang: 'Kelas 3',
      kampus: 'Gontor 2',
    },
    {
      username: 'dewi_lestari',
      firstname: 'Dewi',
      lastname: 'Lestari',
      email: 'dewi.lestari@sekolah.sch.id',
      jenjang: 'Kelas 4',
      kampus: 'Gontor Putri 3',
    },
    {
      username: 'rizky_pratama',
      firstname: 'Rizky',
      lastname: 'Pratama',
      email: 'rizky.pratama@sekolah.sch.id',
      jenjang: 'Kelas 5',
      kampus: 'Gontor 3',
    },
  ]

  sampleParticipants.forEach((sample) => {
    wsContoh.addRow(sample)
  })

  // ----------------------------------------------------
  // 4. SHEET PETUNJUK (Usage Guide)
  // ----------------------------------------------------
  const wsPetunjuk = workbook.addWorksheet('Petunjuk')
  wsPetunjuk.columns = [{ width: 105 }]

  const petunjukLines = [
    ['PANDUAN PENGISIAN TEMPLATE PENDAFTARAN KOLEKTIF OGSOREG (PHASE 7)'],
    [''],
    ['1. Ketentuan Kolom:'],
    ['   - Username      : ID login santri di Moodle LMS. Wajib unik, tanpa spasi (contoh: ahmad_faiz).'],
    ['   - Nama Depan    : Nama awal siswa/santri peserta (wajib diisi).'],
    ['   - Nama Belakang : Nama akhir / marga siswa/santri peserta.'],
    ['   - Email         : Alamat email aktif berformat valid (contoh: ahmad@sekolah.sch.id).'],
    ['   - Jenjang       : PILIH DARI DROPDOWN: Kelas 1, Kelas 2, Kelas 3, Kelas 4, Kelas 5.'],
    ['   - Kampus        : PILIH DARI DROPDOWN: 20 Pilihan Kampus Gontor Resmi (Gontor 1–12, Gontor Putri 1–8).'],
    [''],
    ['2. Fleksibilitas Jenjang & Kampus:'],
    ['   - Berkas ini mengizinkan santri dari berbagai kampus dan berbagai jenjang dalam 1 sheet yang sama.'],
    ['   - Anda dapat mendaftarkan santri lintas jenjang dan lintas kampus sekaligus.'],
    [''],
    ['3. Standar Ekspor CSV Moodle LMS:'],
    ['   - Ekspor Moodle tetap menggunakan spesifikasi 7-kolom resmi: username,firstname,lastname,email,course1,course2,password.'],
    ['   - Kolom Kampus disimpan di OGSOreg untuk direktori Siswa Saya, laporan administrasi, dan analitik distribusi kampus.'],
    ['   - Kolom Kampus TIDAK dimasukkan sebagai header tidak dikenal di CSV Moodle.'],
    [''],
    ['4. Larangan:'],
    ['   - Jangan mengubah atau menghapus susunan nama header kolom pada baris pertama.'],
    ['   - Jangan menggabungkan sel (Merge Cells) pada baris data.'],
  ]

  petunjukLines.forEach((line, idx) => {
    const r = wsPetunjuk.addRow(line)
    if (idx === 0) {
      r.font = { bold: true, size: 13, color: { argb: 'FF800020' } }
    } else if (line[0]?.startsWith('1.') || line[0]?.startsWith('2.') || line[0]?.startsWith('3.') || line[0]?.startsWith('4.')) {
      r.font = { bold: true, size: 11, color: { argb: 'FF1E293B' } }
    }
  })

  return workbook
}

export async function generateRegistrationTemplateBuffer(): Promise<ArrayBuffer> {
  const workbook = await buildRegistrationWorkbook()
  const buffer = await workbook.xlsx.writeBuffer()
  return buffer as ArrayBuffer
}

/**
 * Downloads the Excel template directly in browser
 */
export async function generateRegistrationTemplate(): Promise<void> {
  const buffer = await generateRegistrationTemplateBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'Template_Pendaftaran_Kolektif_OGSOreg.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Exports students list to a formatted Excel file (.xlsx) for administrative reporting.
 * Includes Kampus column, Jenjang, and sync status.
 * Excludes plaintext passwords.
 */
export async function exportStudentsToExcel(
  students: {
    username: string
    firstname: string
    lastname?: string | null
    full_name: string
    email: string
    jenjang: string
    kampus?: string | null
    source: string
    sync_status: string
    moodle_user_id?: string | null
    created_at: string
  }[],
  customFilename?: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'OGSOreg LMS Portal'
  workbook.created = new Date()

  const ws = workbook.addWorksheet('Siswa Saya', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  ws.columns = [
    { header: 'No.', key: 'no', width: 8 },
    { header: 'Nama Lengkap', key: 'full_name', width: 28 },
    { header: 'Username', key: 'username', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Jenjang', key: 'jenjang', width: 16 },
    { header: 'Kampus', key: 'kampus', width: 22 },
    { header: 'Sumber', key: 'source', width: 14 },
    { header: 'Status Moodle', key: 'sync_status', width: 20 },
    { header: 'Moodle User ID', key: 'moodle_user_id', width: 18 },
    { header: 'Tanggal Input', key: 'created_at', width: 20 },
  ]

  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF166534' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 26

  students.forEach((s, idx) => {
    const row = ws.addRow({
      no: idx + 1,
      full_name: s.full_name || `${s.firstname} ${s.lastname || ''}`.trim(),
      username: s.username,
      email: s.email,
      jenjang: s.jenjang,
      kampus: s.kampus || 'Belum Diisi',
      source: s.source.toUpperCase(),
      sync_status:
        s.sync_status === 'synced'
          ? 'Terverifikasi Moodle'
          : s.sync_status === 'exported'
          ? 'Terekspor CSV'
          : s.sync_status === 'failed'
          ? 'Gagal Sinkronisasi'
          : 'Lokal (Belum Sinkron)',
      moodle_user_id: s.moodle_user_id || '-',
      created_at: s.created_at ? new Date(s.created_at).toLocaleDateString('id-ID') : '-',
    })
    row.height = 20
    row.alignment = { vertical: 'middle' }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const filename = customFilename || `Data_Siswa_OGSOreg_${new Date().toISOString().slice(0, 10)}.xlsx`

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

/**
 * Builds comprehensive administrative Excel report with Summary, Student List with Kampus,
 * and 20-Campus distribution breakdown. Plaintext passwords strictly omitted.
 */
export async function buildAdminReportWorkbook(
  students: any[],
  stats: any
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'OGSOreg LMS Portal'
  workbook.created = new Date()

  // Sheet 1: Ringkasan Eksekutif
  const wsSummary = workbook.addWorksheet('Ringkasan Laporan')
  wsSummary.columns = [
    { header: 'Indikator Metrik', key: 'metric', width: 32 },
    { header: 'Nilai Terhitung', key: 'value', width: 24 },
    { header: 'Keterangan', key: 'note', width: 40 },
  ]
  const sumHeader = wsSummary.getRow(1)
  sumHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sumHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } }

  const total = students.length
  wsSummary.addRow({ metric: 'Total Santri Terdaftar', value: total, note: 'Seluruh santri dalam direktori' })
  wsSummary.addRow({ metric: 'Akun Diekspor ke CSV', value: stats.exported || 0, note: 'Siap diunggah ke Moodle Upload Users' })
  wsSummary.addRow({ metric: 'Akun Moodle Terverifikasi', value: stats.synced || 0, note: 'Telah terkonfirmasi di server Moodle' })
  wsSummary.addRow({ metric: 'Enrolment Terverifikasi', value: stats.enrolled || 0, note: 'Terdaftar di kursus Moodle' })
  wsSummary.addRow({ metric: 'Gagal Sinkronisasi', value: stats.failed || 0, note: 'Mengalami kendala saat sinkronisasi' })
  wsSummary.addRow({ metric: 'Santri Belum Memilih Kampus', value: stats.incompleteKampusCount || 0, note: 'Perlu dilengkapi oleh admin' })
  wsSummary.addRow({ metric: 'Waktu Pembuatan Laporan', value: new Date().toLocaleString('id-ID'), note: 'Waktu lokal sistem' })

  // Sheet 2: Daftar Santri & Kampus
  const wsList = workbook.addWorksheet('Daftar Santri & Kampus')
  wsList.columns = [
    { header: 'No.', key: 'no', width: 8 },
    { header: 'Nama Lengkap', key: 'full_name', width: 28 },
    { header: 'Username', key: 'username', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Jenjang', key: 'jenjang', width: 16 },
    { header: 'Kampus', key: 'kampus', width: 22 },
    { header: 'Status Moodle', key: 'sync_status', width: 22 },
    { header: 'Tanggal Input', key: 'created_at', width: 20 },
  ]
  const listHeader = wsList.getRow(1)
  listHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  listHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } }

  students.forEach((s, idx) => {
    wsList.addRow({
      no: idx + 1,
      full_name: s.full_name || `${s.firstname} ${s.lastname || ''}`.trim(),
      username: s.username,
      email: s.email,
      jenjang: s.jenjang,
      kampus: s.kampus || 'Belum Diisi',
      sync_status:
        s.sync_status === 'enrolled'
          ? 'Enrolment Terverifikasi'
          : s.sync_status === 'synced'
          ? 'Akun Moodle Terverifikasi'
          : s.sync_status === 'exported'
          ? 'CSV Diekspor'
          : s.sync_status === 'failed'
          ? 'Gagal Sinkronisasi'
          : 'Tersimpan di OGSOreg',
      created_at: s.created_at ? new Date(s.created_at).toLocaleDateString('id-ID') : '-',
    })
  })

  // Sheet 3: Distribusi 20 Kampus
  const wsCampus = workbook.addWorksheet('Distribusi Kampus')
  wsCampus.columns = [
    { header: 'No.', key: 'no', width: 8 },
    { header: 'Nama Kampus Gontor', key: 'kampus', width: 28 },
    { header: 'Jumlah Santri', key: 'count', width: 18 },
    { header: 'Persentase', key: 'percentage', width: 16 },
  ]
  const campusHeader = wsCampus.getRow(1)
  campusHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  campusHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } }

  KAMPUS_OPTIONS.forEach((k, idx) => {
    const count = (stats.byKampus && stats.byKampus[k]) || 0
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0%'
    wsCampus.addRow({
      no: idx + 1,
      kampus: k,
      count,
      percentage: pct,
    })
  })

  return workbook
}

export async function exportAdminReportToExcel(
  students: any[],
  stats: any,
  filename?: string
): Promise<void> {
  const workbook = await buildAdminReportWorkbook(students, stats)
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const outName = filename || `Laporan_Pendaftaran_OGSOreg_${new Date().toISOString().slice(0, 10)}.xlsx`

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = outName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

