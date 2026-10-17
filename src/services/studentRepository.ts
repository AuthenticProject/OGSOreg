import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { studentSchema, type StudentInput } from '../schemas/student.schema'
import { KAMPUS_OPTIONS } from '../types/campus'
import type {
  Student,
  StudentFilterParams,
  StudentSource,
  StudentSyncStatus,
  StudentStats,
  StudentJenjang,
} from '../types/student'

export const CANONICAL_INSTITUTION_ID = 'a0000000-0000-0000-0000-000000000001'
const LOCAL_STORAGE_KEY = 'ogsoreg_students_directory_v1'

export function normalizeInstitutionId(id?: string | null): string {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id
  }
  return CANONICAL_INSTITUTION_ID
}

function toSupabaseInsertPayload(s: Partial<Student>): any {
  const payload: Record<string, any> = {
    username: s.username?.toLowerCase(),
    firstname: s.firstname,
    lastname: s.lastname,
    full_name: s.full_name || `${s.firstname || ''} ${s.lastname || ''}`.trim(),
    email: s.email?.toLowerCase(),
    jenjang: s.jenjang,
    kampus: s.kampus || null,
    institution_id: normalizeInstitutionId(s.institution_id),
    source: s.source || 'manual',
    sync_status: s.sync_status || 'local_only',
    moodle_user_id: s.moodle_user_id || null,
    last_synced_at: s.last_synced_at || null,
  }

  // Kolom id di Supabase adalah UUID. Hanya teruskan id jika memang format UUID valid!
  if (s.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.id)) {
    payload.id = s.id
  }

  return payload
}

class StudentRepository {
  private inMemoryStore: Map<string, Student[]> = new Map()
  private isSyncing = false

  constructor() {
    this.initLocalStorage()
  }

  private initLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as Record<string, Student[]>
          const mergedStudentsMap = new Map<string, Student>()

          // 1. Gather all students across any legacy institution keys (e.g. general-inst, Gontor 1, etc.)
          Object.entries(parsed).forEach(([, students]) => {
            ;(students || []).forEach((s) => {
              if (s && s.id && !s.id.startsWith('std-demo-')) {
                const key = (s.username || s.id).toLowerCase()
                if (!mergedStudentsMap.has(key)) {
                  mergedStudentsMap.set(key, {
                    ...s,
                    institution_id: CANONICAL_INSTITUTION_ID,
                  })
                }
              }
            })
          })

          const allUniqueStudents = Array.from(mergedStudentsMap.values())
          this.inMemoryStore.set(CANONICAL_INSTITUTION_ID, allUniqueStudents)
          this.persistLocalStorage()
        } else {
          this.inMemoryStore.set(CANONICAL_INSTITUTION_ID, [])
          this.persistLocalStorage()
        }
      } catch {
        this.inMemoryStore.set(CANONICAL_INSTITUTION_ID, [])
      }
    } else {
      this.inMemoryStore.set(CANONICAL_INSTITUTION_ID, [])
    }
  }

  private persistLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const canonicalList = this.inMemoryStore.get(CANONICAL_INSTITUTION_ID) || []
        const obj: Record<string, Student[]> = {
          [CANONICAL_INSTITUTION_ID]: canonicalList,
          'general-inst': canonicalList,
        }
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(obj))
      } catch {
        // Silent catch for quota limits
      }
    }
  }

  /**
   * Otomatis melakukan sinkronisasi dua arah antara data lokal dan Supabase Cloud
   */
  public async syncWithSupabase(): Promise<void> {
    if (!isSupabaseConfigured() || this.isSyncing) return
    this.isSyncing = true
    try {
      const canonicalId = CANONICAL_INSTITUTION_ID
      const { data: cloudStudents, error } = await supabase
        .from('students')
        .select('*')
        .eq('institution_id', canonicalId)

      if (error) {
        return
      }

      const cloudMap = new Map<string, Student>()
      ;(cloudStudents || []).forEach((s) => {
        cloudMap.set((s.username || s.id).toLowerCase(), s as Student)
      })

      // Cek siswa lokal yang belum ada di Supabase Cloud
      const localStudents = this.getRawStore(canonicalId)
      const toUpload: any[] = []

      localStudents.forEach((local) => {
        const key = (local.username || local.id).toLowerCase()
        if (!cloudMap.has(key)) {
          toUpload.push(toSupabaseInsertPayload(local))
        }
      })

      // Upload siswa lokal ke Supabase Cloud
      if (toUpload.length > 0) {
        const { data: inserted, error: insertErr } = await supabase
          .from('students')
          .insert(toUpload)
          .select()

        if (!insertErr && inserted) {
          inserted.forEach((ins) => {
            cloudMap.set((ins.username || ins.id).toLowerCase(), ins as Student)
          })
        }
      }

      // Simpan gabungan lengkap ke local cache
      const mergedList = Array.from(cloudMap.values())
      if (mergedList.length > 0) {
        this.inMemoryStore.set(canonicalId, mergedList)
        this.persistLocalStorage()
      }
    } catch {
      // Ignore background sync errors
    } finally {
      this.isSyncing = false
    }
  }

  public getStorageType(): 'SUPABASE_CLOUD' | 'LOCAL_PERSISTENCE_DEV' {
    return isSupabaseConfigured() ? 'SUPABASE_CLOUD' : 'LOCAL_PERSISTENCE_DEV'
  }

  public getRawStore(_institutionId?: string): Student[] {
    // Return all students from unified canonical pool
    const canonical = this.inMemoryStore.get(CANONICAL_INSTITUTION_ID) || []
    if (canonical.length > 0) return canonical

    // Fallback: search any other bucket
    for (const [, students] of this.inMemoryStore) {
      if (students && students.length > 0) return students
    }
    return []
  }

  public setRawStore(_institutionId: string, students: Student[]) {
    this.inMemoryStore.set(CANONICAL_INSTITUTION_ID, students)
    this.persistLocalStorage()
  }

  /**
   * Fetches students filtered, sorted, and paginated for a given institution
   */
  async getStudents(
    institutionIdOrParams:
      | string
      | {
          institutionId?: string
          search?: string
          searchTerm?: string
          jenjang?: string
          kampus?: string
          assignedCampus?: string | null
          accessControl?: { userRole?: string; assignedCampus?: string | null }
          sync_status?: string
          syncStatus?: string
          source?: string
          sortBy?: 'name' | 'created_at' | 'date'
          sortOrder?: 'asc' | 'desc'
          sortDirection?: 'asc' | 'desc'
          page?: number
          pageSize?: number
        },
    optionalParams?: StudentFilterParams
  ): Promise<{
    data: Student[]
    students: Student[]
    total: number
    totalAll: number
    stats: StudentStats
  }> {
    const isObjectFirstArg = typeof institutionIdOrParams === 'object' && institutionIdOrParams !== null
    const rawInstitutionId = isObjectFirstArg
      ? institutionIdOrParams.institutionId || ''
      : (institutionIdOrParams as string)

    const rawParams: Record<string, any> = {
      ...(isObjectFirstArg ? institutionIdOrParams : {}),
      ...(optionalParams || {}),
    }

    const searchTerm = (rawParams.search || rawParams.searchTerm || '').trim()
    const jenjang = rawParams.jenjang
    const kampus = rawParams.kampus
    const assignedCampus = rawParams.assignedCampus || rawParams.accessControl?.assignedCampus
    const syncStatus = rawParams.sync_status || rawParams.syncStatus
    const source = rawParams.source
    const sortBy = rawParams.sortBy || 'created_at'
    const sortOrder = rawParams.sortOrder || rawParams.sortDirection || 'desc'
    const page = Number(rawParams.page) || 1
    const pageSize = Number(rawParams.pageSize) || 25

    // Jalankan auto-sync lokal <-> cloud di background
    this.syncWithSupabase().catch(() => {})

    let list: Student[] = []

    // Try Supabase first if configured
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('students')
          .select('*', { count: 'exact' })
          .eq('institution_id', CANONICAL_INSTITUTION_ID)

        if (searchTerm) {
          query = query.or(
            `full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,kampus.ilike.%${searchTerm}%`
          )
        }
        if (jenjang && jenjang !== 'all' && jenjang !== 'ALL') {
          query = query.eq('jenjang', jenjang)
        }
        if (assignedCampus) {
          query = query.eq('kampus', assignedCampus)
        } else if (kampus && kampus !== 'all' && kampus !== 'ALL') {
          if (kampus === 'incomplete' || kampus === 'belum_diisi') {
            query = query.or('kampus.is.null,kampus.eq.')
          } else {
            query = query.eq('kampus', kampus)
          }
        }
        if (syncStatus && syncStatus !== 'all' && syncStatus !== 'ALL') {
          query = query.eq('sync_status', syncStatus)
        }
        if (source && source !== 'all' && source !== 'ALL') {
          query = query.eq('source', source)
        }

        const ascending = sortOrder === 'asc'
        if (sortBy === 'name') {
          query = query.order('full_name', { ascending })
        } else {
          query = query.order('created_at', { ascending })
        }

        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        query = query.range(from, to)

        const { data, count, error } = await query
        if (!error && data && data.length > 0) {
          const stats = await this.getStats(CANONICAL_INSTITUTION_ID, assignedCampus)
          return {
            data: data as Student[],
            students: data as Student[],
            total: count || 0,
            totalAll: stats.total,
            stats,
          }
        }
      } catch {
        // Fall back to local store
      }
    }

    // Local Persistence Adapter fallback logic
    list = [...this.getRawStore(rawInstitutionId)]

    // Campus Isolation: If user is assigned to a specific campus, restrict results
    if (assignedCampus) {
      list = list.filter((s) => s.kampus === assignedCampus)
    }

    const totalAll = list.length

    // 1. Search Filter (matches name, username, email, kampus)
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      list = list.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.kampus && s.kampus.toLowerCase().includes(q))
      )
    }

    // 2. Jenjang Filter
    if (jenjang && jenjang !== 'all' && jenjang !== 'ALL') {
      list = list.filter((s) => s.jenjang === jenjang)
    }

    // 2b. Kampus Filter
    if (kampus && kampus !== 'all' && kampus !== 'ALL') {
      if (kampus === 'incomplete' || kampus === 'belum_diisi') {
        list = list.filter((s) => !s.kampus || s.kampus.trim() === '')
      } else {
        list = list.filter((s) => s.kampus === kampus)
      }
    }

    // 3. Sync Status Filter
    if (syncStatus && syncStatus !== 'all' && syncStatus !== 'ALL') {
      list = list.filter((s) => s.sync_status === syncStatus)
    }

    // 4. Source Filter
    if (source && source !== 'all' && source !== 'ALL') {
      list = list.filter((s) => s.source === source)
    }

    // 5. Sorting
    const isAsc = sortOrder === 'asc'
    if (sortBy === 'name') {
      list.sort((a, b) =>
        isAsc
          ? a.full_name.localeCompare(b.full_name)
          : b.full_name.localeCompare(a.full_name)
      )
    } else {
      list.sort((a, b) =>
        isAsc
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }

    const total = list.length
    const startIndex = (page - 1) * pageSize
    const paginated = list.slice(startIndex, startIndex + pageSize)
    const stats = await this.getStats(CANONICAL_INSTITUTION_ID, assignedCampus)

    return {
      data: paginated,
      students: paginated,
      total,
      totalAll,
      stats,
    }
  }

  async getStudentById(id: string, institutionId?: string): Promise<Student | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', id)
          .single()
        if (!error && data) return data as Student
      } catch {
        // Fall back
      }
    }

    // Search local stores
    if (institutionId) {
      const list = this.getRawStore(institutionId)
      return list.find((s) => s.id === id) || null
    }

    for (const [, students] of this.inMemoryStore) {
      const match = students.find((s) => s.id === id)
      if (match) return match
    }

    return null
  }

  async saveStudent(
    input: Partial<StudentInput>,
    institutionIdParam?: string,
    createdByParam?: string,
    accessControl?: { userRole?: string; assignedCampus?: string | null }
  ): Promise<{ success: boolean; student?: Student; error?: string }> {
    const institutionId = institutionIdParam || input.institution_id || ''
    const createdBy = createdByParam || input.created_by || 'system'

    // Campus isolation check for Campus Admin
    if (accessControl?.assignedCampus) {
      if (input.kampus && input.kampus !== accessControl.assignedCampus) {
        return {
          success: false,
          error: `Akses Ditolak: Anda hanya berwenang menambahkan santri untuk ${accessControl.assignedCampus}.`,
        }
      }
      input.kampus = accessControl.assignedCampus
    }

    const parseResult = studentSchema.safeParse({
      ...input,
      institution_id: institutionId,
      created_by: createdBy,
    })
    if (!parseResult.success) {
      return { success: false, error: parseResult.error.issues[0]?.message || 'Validasi siswa gagal.' }
    }

    const data = parseResult.data
    const currentStudents = this.getRawStore(institutionId)

    // Check duplicate username within institution
    const isDupUsername = currentStudents.some(
      (s) => s.username.toLowerCase() === data.username.toLowerCase()
    )
    if (isDupUsername) {
      return { success: false, error: `Username '${data.username}' sudah terdaftar pada santri lain.` }
    }

    // Check duplicate email within institution
    const isDupEmail = currentStudents.some(
      (s) => s.email.toLowerCase() === data.email.toLowerCase()
    )
    if (isDupEmail) {
      return { success: false, error: `Email '${data.email}' sudah terdaftar pada santri lain.` }
    }

    const now = new Date().toISOString()
    const newStudent: Student = {
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      username: data.username.toLowerCase(),
      firstname: data.firstname,
      lastname: data.lastname,
      full_name: `${data.firstname} ${data.lastname}`.trim(),
      email: data.email.toLowerCase(),
      jenjang: data.jenjang as StudentJenjang,
      kampus: (data.kampus || input.kampus || '').trim(),
      institution_id: institutionId,
      created_by: createdBy,
      created_at: now,
      updated_at: now,
      source: data.source || 'manual',
      sync_status: data.sync_status || 'local_only',
      moodle_user_id: data.moodle_user_id || null,
      last_synced_at: data.last_synced_at || null,
    }

    if (isSupabaseConfigured()) {
      try {
        const dbPayload = toSupabaseInsertPayload(newStudent)
        const { data: dbData, error } = await supabase
          .from('students')
          .insert(dbPayload)
          .select()
          .single()
        if (!error && dbData) {
          const finalStudent = dbData as Student
          this.setRawStore(CANONICAL_INSTITUTION_ID, [finalStudent, ...currentStudents])
          return { success: true, student: finalStudent, ...(finalStudent as any) }
        }
      } catch {
        // Fall back to local persistence
      }
    }

    this.setRawStore(CANONICAL_INSTITUTION_ID, [newStudent, ...currentStudents])
    return { success: true, student: newStudent, ...(newStudent as any) }
  }

  async updateStudent(
    id: string,
    updates: Partial<StudentInput>,
    institutionId: string,
    accessControl?: { userRole?: string; assignedCampus?: string | null }
  ): Promise<{ success: boolean; student?: Student; error?: string }> {
    const currentStudents = this.getRawStore(institutionId)
    const existingIndex = currentStudents.findIndex((s) => s.id === id)
    if (existingIndex === -1) {
      return { success: false, error: 'Santri tidak ditemukan.' }
    }

    const existing = currentStudents[existingIndex]

    // Campus isolation check for Campus Admin
    if (accessControl?.assignedCampus) {
      if (existing.kampus && existing.kampus !== accessControl.assignedCampus) {
        return {
          success: false,
          error: `Akses Ditolak: Anda tidak memiliki izin mengedit santri dari ${existing.kampus}.`,
        }
      }
      if (updates.kampus && updates.kampus !== accessControl.assignedCampus) {
        return {
          success: false,
          error: `Akses Ditolak: Anda tidak dapat mengubah kampus santri ke ${updates.kampus}.`,
        }
      }
    }
    const merged = {
      username: updates.username !== undefined ? updates.username : existing.username,
      firstname: updates.firstname !== undefined ? updates.firstname : existing.firstname,
      lastname: updates.lastname !== undefined ? updates.lastname : existing.lastname,
      email: updates.email !== undefined ? updates.email : existing.email,
      jenjang: updates.jenjang !== undefined ? updates.jenjang : existing.jenjang,
      kampus: updates.kampus !== undefined ? updates.kampus : (existing.kampus || ''),
      source: updates.source || existing.source,
      sync_status: updates.sync_status || existing.sync_status,
      moodle_user_id: updates.moodle_user_id !== undefined ? updates.moodle_user_id : existing.moodle_user_id,
      last_synced_at: updates.last_synced_at !== undefined ? updates.last_synced_at : existing.last_synced_at,
    }

    const parseResult = studentSchema.safeParse(merged)
    if (!parseResult.success) {
      return { success: false, error: parseResult.error.issues[0]?.message || 'Data santri tidak valid.' }
    }

    // Duplicate checks excluding self
    if (merged.username.toLowerCase() !== existing.username.toLowerCase()) {
      const isDup = currentStudents.some(
        (s) => s.id !== id && s.username.toLowerCase() === merged.username.toLowerCase()
      )
      if (isDup) {
        return { success: false, error: `Username '${merged.username}' sudah dipakai santri lain.` }
      }
    }

    if (merged.email.toLowerCase() !== existing.email.toLowerCase()) {
      const isDup = currentStudents.some(
        (s) => s.id !== id && s.email.toLowerCase() === merged.email.toLowerCase()
      )
      if (isDup) {
        return { success: false, error: `Email '${merged.email}' sudah dipakai santri lain.` }
      }
    }

    const updatedStudent: Student = {
      ...existing,
      username: merged.username.toLowerCase(),
      firstname: merged.firstname,
      lastname: merged.lastname,
      full_name: `${merged.firstname} ${merged.lastname}`.trim(),
      email: merged.email.toLowerCase(),
      jenjang: merged.jenjang as StudentJenjang,
      kampus: (merged.kampus !== undefined ? merged.kampus : (existing.kampus || '')).trim(),
      source: merged.source as StudentSource,
      sync_status: merged.sync_status as StudentSyncStatus,
      moodle_user_id: merged.moodle_user_id || null,
      last_synced_at: merged.last_synced_at || null,
      updated_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured()) {
      try {
        const { data: dbData, error } = await supabase
          .from('students')
          .update(updatedStudent)
          .eq('id', id)
          .select()
          .single()
        if (!error && dbData) {
          currentStudents[existingIndex] = dbData as Student
          this.setRawStore(institutionId, currentStudents)
          return { success: true, student: dbData as Student, ...(dbData as any) }
        }
      } catch {
        // Fall back
      }
    }

    currentStudents[existingIndex] = updatedStudent
    this.setRawStore(institutionId, currentStudents)
    return { success: true, student: updatedStudent, ...(updatedStudent as any) }
  }

  async deleteStudent(
    id: string,
    institutionId: string,
    accessControl?: { userRole?: string; assignedCampus?: string | null }
  ): Promise<boolean> {
    const currentStudents = this.getRawStore(institutionId)
    const target = currentStudents.find((s) => s.id === id)

    // Campus isolation check for Campus Admin
    if (accessControl?.assignedCampus && target) {
      if (target.kampus && target.kampus !== accessControl.assignedCampus) {
        return false // Unauthorized deletion blocked
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('students').delete().eq('id', id)
      } catch {
        // Fall back
      }
    }

    const filtered = currentStudents.filter((s) => s.id !== id)
    this.setRawStore(institutionId, filtered)
    return true
  }

  async bulkDeleteStudents(
    ids: string[],
    institutionId: string,
    accessControl?: { userRole?: string; assignedCampus?: string | null }
  ): Promise<number> {
    if (ids.length === 0) return 0

    let currentStudents = this.getRawStore(institutionId)
    let eligibleIds = ids

    // Campus isolation check for Campus Admin
    if (accessControl?.assignedCampus) {
      eligibleIds = ids.filter((id) => {
        const student = currentStudents.find((s) => s.id === id)
        return student && student.kampus === accessControl.assignedCampus
      })
    }

    if (eligibleIds.length === 0) return 0

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('students').delete().in('id', eligibleIds)
      } catch {
        // Fall back
      }
    }

    const filtered = currentStudents.filter((s) => !eligibleIds.includes(s.id))
    const deletedCount = currentStudents.length - filtered.length
    this.setRawStore(institutionId, filtered)
    return deletedCount
  }

  /**
   * Bulk saves a collection of student records from Excel/CSV/Paste import into Siswa Saya.
   * Protects against invalid rows and existing duplicate usernames/emails.
   */
  async bulkSaveStudents(
    records: Partial<StudentInput>[],
    institutionId: string,
    createdBy: string,
    source: StudentSource,
    accessControl?: { userRole?: string; assignedCampus?: string | null }
  ): Promise<{
    savedCount: number
    duplicatesCount: number
    errorsCount: number
    savedStudents: Student[]
    duplicateDetails: string[]
  }> {
    // Campus isolation check for Campus Admin
    if (accessControl?.assignedCampus) {
      const unauthorized = records.filter(
        (r) => r.kampus && r.kampus.trim() !== '' && r.kampus !== accessControl.assignedCampus
      )
      if (unauthorized.length > 0) {
        return {
          savedCount: 0,
          duplicatesCount: 0,
          errorsCount: unauthorized.length,
          savedStudents: [],
          duplicateDetails: [
            `Akses Ditolak: Ditemukan ${unauthorized.length} santri dengan kampus di luar wewenang ${accessControl.assignedCampus}.`,
          ],
        }
      }
    }
    const currentStudents = this.getRawStore(institutionId)
    const existingUsernames = new Set(currentStudents.map((s) => s.username.toLowerCase()))
    const existingEmails = new Set(currentStudents.map((s) => s.email.toLowerCase()))

    // Track intra-batch uniqueness
    const seenUsernames = new Set<string>()
    const seenEmails = new Set<string>()

    const toInsert: Student[] = []
    let duplicatesCount = 0
    let errorsCount = 0
    const duplicateDetails: string[] = []

    const now = new Date().toISOString()

    records.forEach((raw, idx) => {
      // Validate with schema
      const parse = studentSchema.safeParse({
        ...raw,
        source,
        sync_status: 'local_only',
      })

      if (!parse.success) {
        errorsCount++
        return
      }

      const valid = parse.data
      const uKey = valid.username.toLowerCase()
      const eKey = valid.email.toLowerCase()

      // Duplicate username check
      if (existingUsernames.has(uKey) || seenUsernames.has(uKey)) {
        duplicatesCount++
        duplicateDetails.push(`Baris ${idx + 1}: Username '${valid.username}' sudah ada.`)
        return
      }

      // Duplicate email check
      if (existingEmails.has(eKey) || seenEmails.has(eKey)) {
        duplicatesCount++
        duplicateDetails.push(`Baris ${idx + 1}: Email '${valid.email}' sudah ada.`)
        return
      }

      seenUsernames.add(uKey)
      seenEmails.add(eKey)

      const student: Student = {
        id: `std-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        username: uKey,
        firstname: valid.firstname,
        lastname: valid.lastname,
        full_name: `${valid.firstname} ${valid.lastname}`.trim(),
        email: eKey,
        jenjang: valid.jenjang as StudentJenjang,
        kampus: (valid.kampus || (raw.kampus ? String(raw.kampus) : '')).trim(),
        institution_id: institutionId,
        created_by: createdBy,
        created_at: now,
        updated_at: now,
        source,
        sync_status: 'local_only',
        moodle_user_id: null,
        last_synced_at: null,
      }

      toInsert.push(student)
    })

    if (toInsert.length > 0) {
      if (isSupabaseConfigured()) {
        try {
          const dbPayloads = toInsert.map((s) => toSupabaseInsertPayload(s))
          const { error } = await supabase.from('students').insert(dbPayloads)
          if (error) {
            console.warn('Supabase bulk insert warning, falling back to local adapter:', error.message)
          }
        } catch {
          // Local fallback
        }
      }

      const updatedAll = [...toInsert, ...currentStudents]
      this.setRawStore(CANONICAL_INSTITUTION_ID, updatedAll)
    }

    return {
      savedCount: toInsert.length,
      duplicatesCount,
      errorsCount,
      savedStudents: toInsert,
      duplicateDetails,
    }
  }

  async getStats(institutionId: string, assignedCampus?: string | null): Promise<StudentStats> {
    let list = this.getRawStore(institutionId)
    if (assignedCampus) {
      list = list.filter((s) => s.kampus === assignedCampus)
    }

    const byJenjang: Record<StudentJenjang, number> = {
      'Kelas 1': 0,
      'Kelas 2': 0,
      'Kelas 3': 0,
      'Kelas 4': 0,
      'Kelas 5': 0,
    }

    const byKampus: Record<string, number> = {}
    KAMPUS_OPTIONS.forEach((k) => {
      byKampus[k] = 0
    })

    let incompleteKampusCount = 0
    let localOnly = 0
    let exported = 0
    let synced = 0
    let enrolled = 0
    let failed = 0

    const bySource: Record<StudentSource, number> = {
      excel: 0,
      csv: 0,
      manual: 0,
      paste: 0,
    }

    list.forEach((s) => {
      if (byJenjang[s.jenjang] !== undefined) {
        byJenjang[s.jenjang]++
      }
      if (s.kampus && byKampus[s.kampus] !== undefined) {
        byKampus[s.kampus]++
      } else {
        incompleteKampusCount++
      }
      if (bySource[s.source] !== undefined) {
        bySource[s.source]++
      }
      if (s.sync_status === 'local_only') localOnly++
      else if (s.sync_status === 'exported') exported++
      else if (s.sync_status === 'synced') synced++
      else if (s.sync_status === 'enrolled') enrolled++
      else if (s.sync_status === 'failed') failed++
    })

    const unsynced = localOnly + exported + failed

    return {
      total: list.length,
      localOnly,
      exported,
      synced,
      enrolled,
      failed,
      unsynced,
      verifiedMoodleCount: synced + enrolled,
      verifiedEnrolmentCount: enrolled,
      unSyncedCount: unsynced,
      byJenjang,
      byKampus,
      incompleteKampusCount,
      bySyncStatus: {
        local_only: localOnly,
        exported,
        synced,
        enrolled,
        failed,
      },
      bySource,
    }
  }

  async markAsExported(idsOrUsernames: string[], institutionId: string): Promise<number> {
    const current = this.getRawStore(institutionId)
    const validTargets = (idsOrUsernames || [])
      .filter((u) => u !== null && u !== undefined)
      .map((u) => String(u).toLowerCase())
    const targets = new Set(validTargets)
    let count = 0
    const updated = current.map((s) => {
      const sId = (s.id || '').toLowerCase()
      const sUsername = (s.username || '').toLowerCase()
      if ((targets.has(sId) || targets.has(sUsername)) && s.sync_status !== 'synced') {
        count++
        return {
          ...s,
          sync_status: 'exported' as StudentSyncStatus,
          updated_at: new Date().toISOString(),
        }
      }
      return s
    })
    this.setRawStore(institutionId, updated)
    return count
  }

  clearStore(institutionId: string): void {
    this.inMemoryStore.delete(institutionId)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
        if (raw) {
          const all: Record<string, Student[]> = JSON.parse(raw)
          delete all[institutionId]
          window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all))
        }
      } catch {
        // Ignore
      }
    }
  }
}

export const studentRepository = new StudentRepository()
