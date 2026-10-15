import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import type { TeacherEntity } from '../../types/database'
import { mockTeachers } from '../../lib/mockData'

export interface UpsertTeacherInput {
  full_name: string
  gender: 'L' | 'P' | null
  nip_nik?: string | null
  phone?: string | null
  email?: string | null
}

export const teacherRepository = {
  async getTeachers(institutionId?: string): Promise<TeacherEntity[]> {
    if (!isSupabaseConfigured()) {
      return mockTeachers.map((t) => ({
        id: t.id,
        institution_id: institutionId || 'a0000000-0000-0000-0000-000000000001',
        full_name: t.fullName,
        gender: t.gender,
        nip_nik: t.nipNik,
        phone: t.phone,
        email: t.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    }

    let query = supabase.from('teachers').select('*').order('full_name', { ascending: true })
    if (institutionId) {
      query = query.eq('institution_id', institutionId)
    }
    const { data, error } = await query
    if (error) throw error
    return (data as TeacherEntity[]) || []
  },

  async upsertTeachers(
    institutionId: string,
    teachers: UpsertTeacherInput[]
  ): Promise<TeacherEntity[]> {
    if (!isSupabaseConfigured()) {
      // Local development simulation
      return teachers.map((t, idx) => ({
        id: `local-tch-${Date.now()}-${idx}`,
        institution_id: institutionId,
        full_name: t.full_name,
        gender: t.gender,
        nip_nik: t.nip_nik || null,
        phone: t.phone || null,
        email: t.email || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    }

    // Map rows to match schema
    const rows = teachers.map((t) => ({
      institution_id: institutionId,
      full_name: t.full_name,
      gender: t.gender,
      nip_nik: t.nip_nik || null,
      phone: t.phone || null,
      email: t.email || null,
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('teachers')
      .insert(rows)
      .select()

    if (error) throw error
    return (data as TeacherEntity[]) || []
  },
}
