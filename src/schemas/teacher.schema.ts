import { z } from 'zod'

export const teacherRowSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Nama guru wajib diisi.')
    .min(2, 'Nama guru terlalu pendek (minimal 2 karakter).'),
  gender: z
    .enum(['L', 'P'], {
      errorMap: () => ({ message: 'Jenis kelamin harus diisi L atau P.' }),
    }),
  nip_nik: z
    .string()
    .optional(),
  phone: z
    .string()
    .min(1, 'Nomor HP pembimbing wajib diisi.')
    .regex(/^08\d{8,12}$/, 'Nomor HP harus berformat 08xxxxxxxxxx (10-14 digit).'),
  email: z
    .string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Format email tidak valid.',
    }),
  school_name: z
    .string()
    .min(1, 'Asal sekolah wajib diisi.'),
})

export type TeacherRowValid = z.infer<typeof teacherRowSchema>
