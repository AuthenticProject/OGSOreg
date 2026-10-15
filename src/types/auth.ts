import type { StudentKampus } from './campus'

export type AppUserRole = 'super_admin' | 'campus_admin'

export interface AppUserProfile {
  id: string
  auth_user_id: string
  username: string
  email: string
  display_name: string
  role: AppUserRole
  campus_id: StudentKampus | null
  is_active: boolean
  must_change_password: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface InitialAccountConfig {
  username: string
  email: string
  role: AppUserRole
  campus_id: StudentKampus | null
  display_name: string
  description: string
}

/**
 * Shared initial password for 20 Campus Admin accounts.
 */
export const SHARED_CAMPUS_ADMIN_INITIAL_PASSWORD = 'OGSO2026'

/**
 * The 21 official initial OGSOreg accounts roster:
 * 1 Super Admin + 12 Gontor Campus Admins + 8 Gontor Putri Campus Admins.
 */
export const INITIAL_ACCOUNT_ROSTER: InitialAccountConfig[] = [
  // 1. Super Admin
  {
    username: 'admin',
    email: 'admin@ogso.gontor.ac.id',
    role: 'super_admin',
    campus_id: null,
    display_name: 'Super Admin OGSOreg',
    description: 'Akses penuh seluruh 20 Kampus Gontor & manajemen sistem',
  },
  // 2. Gontor 1 - 12 (Putra)
  ...Array.from({ length: 12 }, (_, i) => {
    const num = i + 1
    const campus = `Gontor ${num}` as StudentKampus
    return {
      username: `gontor${num}`,
      email: `gontor${num}@ogso.gontor.ac.id`,
      role: 'campus_admin' as const,
      campus_id: campus,
      display_name: `Admin ${campus}`,
      description: `Pengelola pendaftaran santri kontingen ${campus}`,
    }
  }),
  // 3. Gontor Putri 1 - 8 (Putri)
  ...Array.from({ length: 8 }, (_, i) => {
    const num = i + 1
    const campus = `Gontor Putri ${num}` as StudentKampus
    return {
      username: `gontorputri${num}`,
      email: `gontorputri${num}@ogso.gontor.ac.id`,
      role: 'campus_admin' as const,
      campus_id: campus,
      display_name: `Admin ${campus}`,
      description: `Pengelola pendaftaran santri kontingen ${campus}`,
    }
  }),
]

/**
 * Helper to get account config by username.
 */
export function getInitialAccountByUsername(username: string): InitialAccountConfig | undefined {
  const normalized = (username || '').trim().toLowerCase()
  return INITIAL_ACCOUNT_ROSTER.find((a) => a.username.toLowerCase() === normalized)
}

/**
 * Helper to check if a role is super_admin.
 */
export function isSuperAdmin(role?: string | null): boolean {
  return role === 'super_admin'
}
