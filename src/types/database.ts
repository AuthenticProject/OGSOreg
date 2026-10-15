export type UserRole = 'admin' | 'organizer' | 'institution'
export type CompetitionStatus = 'draft' | 'open' | 'closed' | 'archived'
export type BatchStatus = 'staging' | 'processing' | 'completed' | 'failed'
export type RegistrationStatus = 'registered' | 'verified' | 'disqualified' | 'cancelled'
export type Gender = 'L' | 'P'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  institution_id: string | null
  created_at: string
  updated_at: string
}

export interface Institution {
  id: string
  name: string
  npsn: string | null
  address: string | null
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface Competition {
  id: string
  code: string
  name: string
  description: string | null
  registration_open_at: string | null
  registration_close_at: string | null
  status: CompetitionStatus
  created_at: string
  updated_at: string
}

export interface RegistrationBatchEntity {
  id: string
  competition_id: string
  institution_id: string
  created_by: string
  batch_name: string
  source_filename: string | null
  participant_count: number
  teacher_count: number
  status: BatchStatus
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface TeacherEntity {
  id: string
  institution_id: string
  full_name: string
  gender: Gender | null
  nip_nik: string | null
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface ParticipantEntity {
  id: string
  institution_id: string
  full_name: string
  nisn: string
  gender: Gender | null
  class_name: string | null
  category: string | null
  teacher_id: string | null
  created_at: string
  updated_at: string
}

export interface ParticipantCompetitionEntity {
  id: string
  participant_id: string
  competition_id: string
  registration_batch_id: string
  category: string
  status: RegistrationStatus
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string; full_name: string }
        Update: Partial<Profile>
      }
      institutions: {
        Row: Institution
        Insert: Partial<Institution> & { name: string }
        Update: Partial<Institution>
      }
      competitions: {
        Row: Competition
        Insert: Partial<Competition> & { code: string; name: string }
        Update: Partial<Competition>
      }
      registration_batches: {
        Row: RegistrationBatchEntity
        Insert: Partial<RegistrationBatchEntity> & {
          competition_id: string
          institution_id: string
          created_by: string
          batch_name: string
        }
        Update: Partial<RegistrationBatchEntity>
      }
      teachers: {
        Row: TeacherEntity
        Insert: Partial<TeacherEntity> & {
          institution_id: string
          full_name: string
        }
        Update: Partial<TeacherEntity>
      }
      participants: {
        Row: ParticipantEntity
        Insert: Partial<ParticipantEntity> & {
          institution_id: string
          full_name: string
          nisn: string
        }
        Update: Partial<ParticipantEntity>
      }
      participant_competitions: {
        Row: ParticipantCompetitionEntity
        Insert: Partial<ParticipantCompetitionEntity> & {
          participant_id: string
          competition_id: string
          registration_batch_id: string
          category: string
        }
        Update: Partial<ParticipantCompetitionEntity>
      }
    }
  }
}
