import ExcelJS from 'exceljs'
import { competitionResultService } from './competitionResultService'
import { participantPeriodService } from './participantPeriodService'

export interface ExportOptions {
  periodId: string
  periodName?: string
  accessCampus?: string | null
}

class ResultExcelExportService {
  /**
   * Generates the 3-sheet Excel workbook and returns the ExcelJS.Workbook instance.
   */
  public async buildWorkbook(options: ExportOptions): Promise<{ workbook: ExcelJS.Workbook; filename: string }> {
    const { periodId, accessCampus } = options
    const period = participantPeriodService.getPeriodById(periodId)
    const rawPeriodName = options.periodName || period?.name || 'OGSO'
    const safePeriodName = rawPeriodName.replace(/[^a-zA-Z0-9_-]/g, '_')
    const filename = `Rekap_Hasil_${safePeriodName}.xlsx`

    // Fetch joined students with results for this period
    const { students } = await competitionResultService.getStudentsWithResults(
      periodId,
      { period_id: periodId },
      accessCampus
    )

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'OGSOreg - Olimpiade Gontor Sains & Matematika'
    workbook.lastModifiedBy = 'OGSOreg System'
    workbook.created = new Date()
    workbook.modified = new Date()

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF166534' }, // Forest Green
    }

    const subHeaderFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF15803D' }, // Medium Green
    }

    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    }

    // =========================================================================
    // SHEET 1: SEMUA PESERTA
    // Contains all registered participants in the selected period.
    // =========================================================================
    const sheet1 = workbook.addWorksheet('SEMUA PESERTA', {
      views: [{ state: 'frozen', ySplit: 1 }],
    })

    sheet1.columns = [
      { header: 'No.', key: 'no', width: 6 },
      { header: 'Student ID / Username', key: 'username', width: 24 },
      { header: 'Nama Santri', key: 'name', width: 28 },
      { header: 'Kampus', key: 'campus', width: 20 },
      { header: 'Jenjang', key: 'jenjang', width: 14 },
      { header: 'Daerah / Konsulat', key: 'daerah', width: 20 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Result Status', key: 'status', width: 16 },
      { header: 'Lolos Final', key: 'is_finalist', width: 14 },
      { header: 'Juara', key: 'is_champion', width: 12 },
      { header: 'Champion Rank', key: 'rank', width: 16 },
      { header: 'Award Category', key: 'award', width: 22 },
      { header: 'Result Notes', key: 'notes', width: 32 },
    ]

    students.forEach((s, idx) => {
      const daerah = (s.student.custom_fields?.daerah as string) || (s.student.custom_fields?.konsulat as string) || '-'
      const row = sheet1.addRow({
        no: idx + 1,
        username: s.student.username || s.student.id,
        name: s.student.full_name,
        campus: s.student.kampus || '-',
        jenjang: s.student.jenjang || '-',
        daerah,
        email: s.student.email || '-',
        status: s.status === 'juara' ? 'Juara' : s.status === 'finalis' ? 'Lolos Final' : 'Peserta',
        is_finalist: s.is_finalist ? 'Ya' : 'Tidak',
        is_champion: s.is_champion ? 'Ya' : 'Tidak',
        rank: s.champion_rank !== null ? s.champion_rank : '-',
        award: s.award_category || '-',
        notes: s.result_notes || '-',
      })

      // Zebra striping for readability
      if (idx % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        }
      }
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = borderStyle
        cell.alignment = { vertical: 'middle' }
      })
    })

    // Style Header Sheet 1
    const h1 = sheet1.getRow(1)
    h1.height = 28
    h1.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    h1.fill = headerFill
    h1.alignment = { vertical: 'middle', horizontal: 'center' }

    // =========================================================================
    // SHEET 2: LOLOS FINAL
    // Contains all finalists (including champions).
    // =========================================================================
    const sheet2 = workbook.addWorksheet('LOLOS FINAL', {
      views: [{ state: 'frozen', ySplit: 1 }],
    })

    sheet2.columns = [
      { header: 'No.', key: 'no', width: 6 },
      { header: 'Student ID / Username', key: 'username', width: 24 },
      { header: 'Nama Santri', key: 'name', width: 28 },
      { header: 'Kampus', key: 'campus', width: 20 },
      { header: 'Jenjang', key: 'jenjang', width: 14 },
      { header: 'Daerah / Konsulat', key: 'daerah', width: 20 },
      { header: 'Champion Rank', key: 'rank', width: 16 },
      { header: 'Award Category', key: 'award', width: 22 },
      { header: 'Result Notes', key: 'notes', width: 32 },
    ]

    const finalists = students.filter((s) => s.is_finalist)

    finalists.forEach((s, idx) => {
      const daerah = (s.student.custom_fields?.daerah as string) || (s.student.custom_fields?.konsulat as string) || '-'
      const row = sheet2.addRow({
        no: idx + 1,
        username: s.student.username || s.student.id,
        name: s.student.full_name,
        campus: s.student.kampus || '-',
        jenjang: s.student.jenjang || '-',
        daerah,
        rank: s.champion_rank !== null ? s.champion_rank : '-',
        award: s.award_category || '-',
        notes: s.result_notes || '-',
      })

      if (idx % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        }
      }
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = borderStyle
        cell.alignment = { vertical: 'middle' }
      })
    })

    const h2 = sheet2.getRow(1)
    h2.height = 28
    h2.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    h2.fill = subHeaderFill
    h2.alignment = { vertical: 'middle', horizontal: 'center' }

    // =========================================================================
    // SHEET 3: JUARA
    // Contains ONLY students with champion awards, sorted by champion rank.
    // =========================================================================
    const sheet3 = workbook.addWorksheet('JUARA', {
      views: [{ state: 'frozen', ySplit: 1 }],
    })

    sheet3.columns = [
      { header: 'No.', key: 'no', width: 6 },
      { header: 'Student ID / Username', key: 'username', width: 24 },
      { header: 'Nama Santri', key: 'name', width: 28 },
      { header: 'Kampus', key: 'campus', width: 20 },
      { header: 'Jenjang', key: 'jenjang', width: 14 },
      { header: 'Daerah / Konsulat', key: 'daerah', width: 20 },
      { header: 'Champion Rank', key: 'rank', width: 16 },
      { header: 'Award Category', key: 'award', width: 22 },
      { header: 'Result Notes', key: 'notes', width: 32 },
    ]

    const champions = students
      .filter((s) => s.is_champion)
      .sort((a, b) => {
        const rankA = a.champion_rank ?? 999
        const rankB = b.champion_rank ?? 999
        return rankA - rankB
      })

    champions.forEach((s, idx) => {
      const daerah = (s.student.custom_fields?.daerah as string) || (s.student.custom_fields?.konsulat as string) || '-'
      const row = sheet3.addRow({
        no: idx + 1,
        username: s.student.username || s.student.id,
        name: s.student.full_name,
        campus: s.student.kampus || '-',
        jenjang: s.student.jenjang || '-',
        daerah,
        rank: s.champion_rank !== null ? s.champion_rank : '-',
        award: s.award_category || '-',
        notes: s.result_notes || '-',
      })

      // Champion row highlight (gentle amber/gold tint for top 3)
      if (s.champion_rank === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF3C7' }, // Amber 100
        }
      } else if (s.champion_rank === 2) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' }, // Slate 100 (silver)
        }
      } else if (s.champion_rank === 3) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEDD5' }, // Orange 100 (bronze)
        }
      } else if (idx % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        }
      }

      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = borderStyle
        cell.alignment = { vertical: 'middle' }
      })
    })

    const h3 = sheet3.getRow(1)
    h3.height = 28
    h3.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    h3.fill = headerFill
    h3.alignment = { vertical: 'middle', horizontal: 'center' }

    return { workbook, filename }
  }

  /**
   * Generates and triggers browser download of the 3-sheet XLSX file.
   */
  public async downloadResultsExcel(options: ExportOptions): Promise<void> {
    const { workbook, filename } = await this.buildWorkbook(options)
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    if (typeof window !== 'undefined') {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
  }
}

export const resultExcelExportService = new ResultExcelExportService()
