import { z } from 'zod'
import { KAMPUS_OPTIONS, type StudentKampus } from '../types/campus'

export const MOODLE_JENJANG_VALUES = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
] as const

export type MoodleJenjangValue = (typeof MOODLE_JENJANG_VALUES)[number]

/**
 * Validation schema for the Moodle Bulk Registration workflow.
 * Columns: Username, Nama Depan, Nama Belakang, Email, Jenjang, Kampus
 */
export const moodleParticipantSchema = z.object({
  username: z
    .string()
    .min(1, 'Username wajib diisi.')
    .regex(/^[a-zA-Z0-9_\-\.]+$/, 'Username hanya boleh berisi huruf, angka, titik, underscore, atau tanda hubung tanpa spasi.'),
  firstname: z
    .string()
    .min(1, 'Nama depan wajib diisi.')
    .min(1, 'Nama depan tidak boleh kosong.'),
  lastname: z
    .string()
    .min(1, 'Nama belakang wajib diisi.')
    .min(1, 'Nama belakang tidak boleh kosong.'),
  email: z
    .string()
    .min(1, 'Email wajib diisi.')
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Format email tidak valid (contoh: user@domain.com).',
    }),
  jenjang: z
    .string()
    .min(1, 'Jenjang wajib diisi.')
    .refine((val) => MOODLE_JENJANG_VALUES.includes(val as MoodleJenjangValue), {
      message: 'Jenjang harus salah satu dari: Kelas 1, Kelas 2, Kelas 3, Kelas 4, Kelas 5.',
    }),
  kampus: z
    .string()
    .optional()
    .refine((val) => !val || KAMPUS_OPTIONS.includes(val as StudentKampus), {
      message: 'Kampus harus salah satu dari 20 pilihan Kampus Gontor resmi.',
    }),
})

export const moodleParticipantWithKampusSchema = moodleParticipantSchema.extend({
  kampus: z
    .string()
    .min(1, 'Kampus wajib diisi.')
    .refine((val) => KAMPUS_OPTIONS.includes(val as StudentKampus), {
      message: 'Kampus harus salah satu dari 20 pilihan Kampus Gontor resmi.',
    }),
})

export type MoodleParticipantValid = z.infer<typeof moodleParticipantSchema>

/**
 * Legacy schema for OlymReg Phase 3/4 backward compatibility
 */
export const legacyParticipantRowSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Nama lengkap wajib diisi.')
    .min(2, 'Nama lengkap terlalu pendek (minimal 2 karakter).'),
  nisn: z
    .string()
    .min(1, 'NISN wajib diisi.')
    .regex(/^\d{10}$/, 'NISN harus tepat 10 digit angka.'),
  gender: z
    .enum(['L', 'P'], {
      errorMap: () => ({ message: 'Jenis kelamin harus diisi L atau P.' }),
    }),
  grade_level: z
    .string()
    .min(1, 'Kelas / tingkat wajib diisi.'),
  school_name: z
    .string()
    .min(1, 'Asal sekolah wajib diisi.'),
  npsn: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{8}$/.test(val), {
      message: 'NPSN harus 8 digit angka jika diisi.',
    }),
  competition_category: z
    .string()
    .min(1, 'Kategori lomba wajib diisi.'),
  teacher_name: z
    .string()
    .min(1, 'Nama guru pembimbing wajib diisi.'),
  teacher_phone: z
    .string()
    .optional()
    .refine((val) => !val || /^08\d{8,12}$/.test(val), {
      message: 'No HP guru harus berformat nomor Indonesia (08xxxxxxxx).',
    }),
  teacher_email: z
    .string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Format email guru tidak valid.',
    }),
})

export const participantRowSchema = legacyParticipantRowSchema
export type ParticipantRowValid = z.infer<typeof participantRowSchema>
