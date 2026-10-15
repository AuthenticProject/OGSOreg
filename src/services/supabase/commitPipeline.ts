import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { batchRepository } from './batchRepository'
import { participantRepository } from './participantRepository'
import { teacherRepository } from './teacherRepository'
import type { StagedParticipantRow } from '../../types/excel'

export interface CommitProgress {
  phase: 'validation' | 'batch_init' | 'teachers' | 'participants' | 'registrations' | 'finalizing' | 'completed' | 'error'
  operation: string
  current: number
  total: number
  percent: number
}

export interface CommitImportOptions {
  competitionId: string
  institutionId: string
  userId: string
  batchName: string
  sourceFilename?: string
  stagedRows: StagedParticipantRow[]
  chunkSize?: number
  onProgress?: (progress: CommitProgress) => void
}

export interface CommitImportResult {
  success: boolean
  batchId?: string
  totalParticipants: number
  totalTeachers: number
  message: string
}

export async function executeCommitImport(
  options: CommitImportOptions
): Promise<CommitImportResult> {
  const {
    competitionId,
    institutionId,
    userId,
    batchName,
    sourceFilename,
    stagedRows,
    chunkSize = 100,
    onProgress,
  } = options

  const reportProgress = (
    phase: CommitProgress['phase'],
    operation: string,
    current: number,
    total: number
  ) => {
    const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 100
    onProgress?.({ phase, operation, current, total, percent })
  }

  // ============================================================================
  // 1. HARD SAFETY GATE (Requirement 17)
  // ============================================================================
  reportProgress('validation', 'Memeriksa validitas data & gerbang keamanan...', 0, stagedRows.length)

  if (!competitionId) {
    throw new Error('Kompetisi wajib dipilih sebelum data dapat dikomit ke database.')
  }
  if (!institutionId) {
    throw new Error('Identitas institusi/sekolah wajib terdefinisi.')
  }
  if (!userId) {
    throw new Error('Pengguna wajib terautentikasi untuk menyimpan data.')
  }
  if (!stagedRows || stagedRows.length === 0) {
    throw new Error('Tidak ada baris data peserta dalam staging.')
  }

  // Check for any errors or duplicates
  const errorRows = stagedRows.filter((r) => r._status === 'ERROR')
  if (errorRows.length > 0) {
    throw new Error(
      `Komit dibatalkan: Terdapat ${errorRows.length} baris dengan kesalahan format. Harap perbaiki seluruh error pada data grid.`
    )
  }

  const duplicateRows = stagedRows.filter((r) => r._isDuplicate)
  if (duplicateRows.length > 0) {
    throw new Error(
      `Komit dibatalkan: Terdapat ${duplicateRows.length} baris dengan duplikasi NISN. Harap perbaiki sebelum finalisasi.`
    )
  }

  // ============================================================================
  // 2. CREATE BATCH RECORD (Status: Processing)
  // ============================================================================
  reportProgress('batch_init', 'Membuat entitas transaksi batch pendaftaran...', 0, stagedRows.length)

  const batch = await batchRepository.createBatch({
    competition_id: competitionId,
    institution_id: institutionId,
    created_by: userId,
    batch_name: batchName || `Kontingen - ${new Date().toLocaleDateString('id-ID')}`,
    source_filename: sourceFilename,
    participant_count: stagedRows.length,
    teacher_count: 0,
  })

  try {
    // ============================================================================
    // 3. EXTRACT & UPSERT ACCOMPANYING TEACHERS
    // ============================================================================
    reportProgress('teachers', 'Mengidentifikasi & menyimpan guru pembimbing...', 0, stagedRows.length)

    // Collect distinct teachers by name from the rows
    const teacherMap = new Map<string, { full_name: string; phone?: string; email?: string }>()
    stagedRows.forEach((r) => {
      const cleanName = r.teacher_name?.trim()
      if (cleanName && !teacherMap.has(cleanName)) {
        teacherMap.set(cleanName, {
          full_name: cleanName,
          phone: r.teacher_phone || undefined,
          email: r.teacher_email || undefined,
        })
      }
    })

    const uniqueTeachers = Array.from(teacherMap.values())
    const savedTeachers = await teacherRepository.upsertTeachers(
      institutionId,
      uniqueTeachers.map((t) => ({
        full_name: t.full_name,
        gender: null,
        phone: t.phone || null,
        email: t.email || null,
      }))
    )

    // Create lookup map: teacherName -> teacherId
    const teacherNameToId = new Map<string, string>()
    savedTeachers.forEach((t) => {
      teacherNameToId.set(t.full_name.toLowerCase().trim(), t.id)
    })

    // ============================================================================
    // 4. CHUNKED UPSERT PARTICIPANTS (Requirement 18)
    // ============================================================================
    const totalParticipants = stagedRows.length
    let processedParticipants = 0
    const participantIdMap = new Map<string, string>() // nisn -> participantId

    for (let i = 0; i < stagedRows.length; i += chunkSize) {
      const chunk = stagedRows.slice(i, i + chunkSize)
      const chunkPayload = chunk.map((r) => ({
        full_name: r.full_name || [r.firstname, r.lastname].filter(Boolean).join(' ') || r.username || 'Peserta',
        nisn: r.nisn || r.username || '', // Preserved as string
        gender: (r.gender === 'L' || r.gender === 'P' ? r.gender : null) as 'L' | 'P' | null,
        class_name: r.grade_level || r.jenjang || '',
        category: r.competition_category || 'Umum',
        teacher_id: r.teacher_name ? teacherNameToId.get(r.teacher_name.toLowerCase().trim()) || null : null,
      }))

      const savedChunk = await participantRepository.upsertParticipantsChunk(institutionId, chunkPayload)
      savedChunk.forEach((p) => {
        participantIdMap.set(p.nisn, p.id)
      })

      processedParticipants += chunk.length
      reportProgress(
        'participants',
        `Menyimpan peserta... ${processedParticipants} / ${totalParticipants}`,
        processedParticipants,
        totalParticipants
      )
    }

    // ============================================================================
    // 5. CREATE REGISTRATION ENTRIES (participant_competitions)
    // ============================================================================
    reportProgress('registrations', 'Mengaitkan pendaftaran peserta ke kompetisi...', processedParticipants, totalParticipants)

    if (isSupabaseConfigured()) {
      const registrationRows = stagedRows.map((r) => {
        const participantId = participantIdMap.get(r.nisn || r.username || '')
        return {
          participant_id: participantId,
          competition_id: competitionId,
          registration_batch_id: batch.id,
          category: r.competition_category,
          status: 'registered' as const,
        }
      }).filter((row) => !!row.participant_id)

      for (let i = 0; i < registrationRows.length; i += chunkSize) {
        const regChunk = registrationRows.slice(i, i + chunkSize)
        const { error } = await supabase
          .from('participant_competitions')
          .upsert(regChunk, { onConflict: 'participant_id,competition_id,category' })
        if (error) throw error
      }
    }

    // ============================================================================
    // 6. FINALIZE BATCH RECORD
    // ============================================================================
    reportProgress('finalizing', 'Memfinalisasi batch...', totalParticipants, totalParticipants)

    await batchRepository.updateBatchStatus(
      batch.id,
      'completed',
      totalParticipants,
      uniqueTeachers.length,
      null
    )

    reportProgress('completed', 'Staging dan sinkronisasi database selesai!', totalParticipants, totalParticipants)

    return {
      success: true,
      batchId: batch.id,
      totalParticipants,
      totalTeachers: uniqueTeachers.length,
      message: `Berhasil menyimpan ${totalParticipants} peserta dan ${uniqueTeachers.length} guru pembimbing ke database Supabase.`,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kegagalan saat commit ke database.'
    reportProgress('error', errorMsg, 0, stagedRows.length)

    // Mark batch status as failed
    await batchRepository.updateBatchStatus(
      batch.id,
      'failed',
      0,
      0,
      errorMsg
    )

    throw new Error(errorMsg)
  }
}
