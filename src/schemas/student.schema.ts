import { z } from 'zod'
import {
  STUDENT_JENJANG_OPTIONS,
  isJenjangKelasMatch,
  getAllowedClassesForJenjang,
  isValidKelasFormat,
  type StudentJenjang,
} from '../types/student'
import { KAMPUS_OPTIONS, type StudentKampus } from '../types/campus'

const baseStudentObject = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .trim()
    .min(1, 'Username wajib diisi.')
    .regex(
      /^[a-zA-Z0-9_\-\.]+$/,
      'Username hanya boleh berisi huruf, angka, titik, underscore, atau tanda hubung tanpa spasi.'
    ),
  firstname: z
    .string()
    .trim()
    .min(1, 'Nama depan wajib diisi.')
    .max(100, 'Nama depan maksimal 100 karakter.'),
  lastname: z
    .string()
    .trim()
    .max(100, 'Nama belakang maksimal 100 karakter.')
    .optional()
    .default(''),
  email: z
    .string()
    .trim()
    .min(1, 'Email wajib diisi.')
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Format email tidak valid (contoh: santri@sekolah.sch.id).',
    }),
  jenjang: z
    .string()
    .refine((val) => STUDENT_JENJANG_OPTIONS.includes(val as StudentJenjang), {
      message: 'Jenjang harus salah satu dari: Jenjang 1, Jenjang 2, Jenjang 3, Jenjang 4, Jenjang 5.',
    }),
  kelas: z
    .string()
    .optional()
    .refine((val) => !val || isValidKelasFormat(val), {
      message: 'Format kelas tidak valid (contoh: 5-B, 3-C atau untuk intensif: 3 int F, 1 int C).',
    }),
  kampus: z
    .string()
    .optional()
    .default('')
    .refine(
      (val) => !val || val === '' || KAMPUS_OPTIONS.includes(val as StudentKampus),
      {
        message: 'Kampus harus salah satu dari 20 pilihan Kampus Gontor resmi.',
      }
    ),
  institution_id: z.string().optional(),
  created_by: z.string().optional(),
  nisn: z.string().optional(),
  source: z.enum(['excel', 'csv', 'manual', 'paste']).default('manual'),
  sync_status: z.enum(['local_only', 'exported', 'synced', 'enrolled', 'failed']).default('local_only'),
  moodle_user_id: z.string().nullable().optional(),
  last_synced_at: z.string().nullable().optional(),
  custom_fields: z.record(z.any()).optional().default({}),
})

export const studentSchema = baseStudentObject.superRefine((data, ctx) => {
  if (data.jenjang && data.kelas) {
    if (!isJenjangKelasMatch(data.jenjang, data.kelas)) {
      const allowed = getAllowedClassesForJenjang(data.jenjang)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Kombinasi data tidak valid: ${data.jenjang} hanya diperuntukkan bagi santri ${allowed.join(' atau ')} (saat ini diisi: ${data.kelas}).`,
        path: ['kelas'],
      })
    }
  }
})

/**
 * Strict schema for new student registration (manual entry, new Excel import).
 * Requires Kampus and Kelas to be selected and valid, and enforces jenjang-kelas matching.
 */
export const newStudentSchema = baseStudentObject
  .extend({
    kelas: z
      .string({ required_error: 'Kelas santri wajib diisi.' })
      .trim()
      .min(1, 'Kelas santri wajib diisi (contoh: 5-B, 3-C atau untuk intensif: 3 int F, 1 int C).')
      .refine((val) => isValidKelasFormat(val), {
        message: 'Format kelas tidak valid (contoh: 5-B, 3-C atau untuk intensif: 3 int F, 1 int C).',
      }),
    kampus: z
      .string({ required_error: 'Kampus wajib dipilih.' })
      .trim()
      .min(1, 'Kampus wajib dipilih.')
      .refine((val) => KAMPUS_OPTIONS.includes(val as StudentKampus), {
        message: 'Kampus harus salah satu dari 20 pilihan Kampus Gontor resmi.',
      }),
  })
  .superRefine((data, ctx) => {
    if (data.jenjang && data.kelas) {
      if (!isJenjangKelasMatch(data.jenjang, data.kelas)) {
        const allowed = getAllowedClassesForJenjang(data.jenjang)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Kombinasi data tidak valid: ${data.jenjang} hanya diperuntukkan bagi santri ${allowed.join(' atau ')} (saat ini diisi: ${data.kelas}).`,
          path: ['kelas'],
        })
      }
    }
  })

export type StudentInput = z.infer<typeof baseStudentObject>
export type NewStudentInput = z.infer<typeof newStudentSchema>

