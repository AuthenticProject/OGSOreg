export type RegistrationStatus = 'draft' | 'pending' | 'verified' | 'completed' | 'need_review'

export interface Participant {
  id: string
  no: number
  fullName: string
  nisn: string
  gender: 'L' | 'P'
  gradeLevel: string
  schoolName: string
  competitionCategory: string
  teacherName: string
  status: RegistrationStatus
  registrationCode: string
  createdAt: string
}

export interface Teacher {
  id: string
  fullName: string
  nipNik: string
  gender: 'L' | 'P'
  phone: string
  email: string
  schoolName: string
  subjectSpecialization: string
  assignedParticipantsCount: number
}

export interface School {
  id: string
  name: string
  npsn: string
  type: 'SD/MI' | 'SMP/MTs' | 'SMA/MA' | 'Pesantren' | 'Bimbel/Umum'
  city: string
  province: string
  picName: string
  picPhone: string
  totalParticipants: number
  totalTeachers: number
}

export interface RegistrationBatch {
  id: string
  batchName: string
  institutionName: string
  totalParticipants: number
  totalTeachers: number
  date: string
  status: RegistrationStatus
  sourceFilename: string
}

export interface DashboardStats {
  totalParticipants: number
  totalTeachers: number
  totalSchools: number
  needReviewCount: number
}
