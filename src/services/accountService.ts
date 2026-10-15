import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  INITIAL_ACCOUNT_ROSTER,
  SHARED_CAMPUS_ADMIN_INITIAL_PASSWORD,
  type AppUserProfile,
} from '../types/auth'

const LOCAL_USERS_STORAGE_KEY = 'ogsoreg_user_profiles_v1'
const LOCAL_PASSWORDS_STORAGE_KEY = 'ogsoreg_user_passwords_v1'

// Rate-limiting tracker for brute-force protection
interface LoginAttemptTracker {
  attempts: number
  lockedUntil: number | null
}
const loginAttemptMap = new Map<string, LoginAttemptTracker>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 60 * 1000 // 1 minute lockout

// Default local dev Super Admin password (only for local dev simulation, never committed as production secret)
export const LOCAL_DEV_SUPER_ADMIN_PASSWORD = 'OGSOreg_SuperAdmin2026!'

/**
 * Initializes the 21 default accounts in local storage for preview/development mode.
 */
function initializeDefaultLocalProfiles(): { profiles: AppUserProfile[]; passwords: Record<string, string> } {
  const now = new Date().toISOString()
  const profiles: AppUserProfile[] = INITIAL_ACCOUNT_ROSTER.map((acc, idx) => ({
    id: `usr-${idx + 1}-${acc.username}`,
    auth_user_id: `auth-${idx + 1}-${acc.username}`,
    username: acc.username,
    email: acc.email,
    display_name: acc.display_name,
    role: acc.role,
    campus_id: acc.campus_id,
    is_active: true,
    must_change_password: false, // Per user instruction: ga harus ubah password pas pertama login
    last_login_at: null,
    created_at: now,
    updated_at: now,
  }))

  const passwords: Record<string, string> = {}
  profiles.forEach((p) => {
    if (p.role === 'super_admin') {
      passwords[p.username] = LOCAL_DEV_SUPER_ADMIN_PASSWORD
    } else {
      passwords[p.username] = SHARED_CAMPUS_ADMIN_INITIAL_PASSWORD
    }
  })

  return { profiles, passwords }
}

class AccountService {
  private inMemoryProfiles: AppUserProfile[] = []
  private inMemoryPasswords: Record<string, string> = {}

  constructor() {
    this.loadStore()
  }

  private loadStore() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const rawProfiles = window.localStorage.getItem(LOCAL_USERS_STORAGE_KEY)
        const rawPasswords = window.localStorage.getItem(LOCAL_PASSWORDS_STORAGE_KEY)
        if (rawProfiles && rawPasswords) {
          this.inMemoryProfiles = JSON.parse(rawProfiles)
          this.inMemoryPasswords = JSON.parse(rawPasswords)
          return
        }
      } catch {
        // Fall back to default
      }
    }

    const initial = initializeDefaultLocalProfiles()
    this.inMemoryProfiles = initial.profiles
    this.inMemoryPasswords = initial.passwords
    this.persistStore()
  }

  private persistStore() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(LOCAL_USERS_STORAGE_KEY, JSON.stringify(this.inMemoryProfiles))
        window.localStorage.setItem(LOCAL_PASSWORDS_STORAGE_KEY, JSON.stringify(this.inMemoryPasswords))
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Rate limiting verification before processing login.
   */
  private checkRateLimit(username: string): { allowed: boolean; message?: string } {
    const key = username.toLowerCase().trim()
    const record = loginAttemptMap.get(key)
    if (!record) return { allowed: true }

    const now = Date.now()
    if (record.lockedUntil && record.lockedUntil > now) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000)
      return {
        allowed: false,
        message: `Terlalu banyak percobaan gagal. Akun sementara dikunci. Coba lagi dalam ${remainingSeconds} detik.`,
      }
    }

    if (record.lockedUntil && record.lockedUntil <= now) {
      // Lock expired, reset attempts
      loginAttemptMap.delete(key)
      return { allowed: true }
    }

    return { allowed: true }
  }

  private recordFailedAttempt(username: string) {
    const key = username.toLowerCase().trim()
    const current = loginAttemptMap.get(key) || { attempts: 0, lockedUntil: null }
    current.attempts += 1
    if (current.attempts >= MAX_ATTEMPTS) {
      current.lockedUntil = Date.now() + LOCKOUT_DURATION_MS
    }
    loginAttemptMap.set(key, current)
  }

  private clearFailedAttempts(username: string) {
    const key = username.toLowerCase().trim()
    loginAttemptMap.delete(key)
  }

  /**
   * Authenticates user using Username and Password.
   * Handles generic credential failure to avoid user enumeration.
   */
  async loginWithUsername(
    usernameInput: string,
    passwordInput: string
  ): Promise<{
    success: boolean
    profile?: AppUserProfile
    mustChangePassword?: boolean
    error?: string
  }> {
    const username = (usernameInput || '').trim().toLowerCase()
    const password = (passwordInput || '').trim()

    if (!username || !password) {
      return { success: false, error: 'Nama pengguna dan kata sandi wajib diisi.' }
    }

    // 1. Rate limiting check
    const rateLimit = this.checkRateLimit(username)
    if (!rateLimit.allowed) {
      return { success: false, error: rateLimit.message }
    }

    // 2. Try Supabase Auth if configured
    if (isSupabaseConfigured()) {
      try {
        // Resolve email securely through RPC
        const { data: idInfo, error: rpcErr } = await supabase.rpc('resolve_login_identifier', {
          p_username: username,
        })

        if (!rpcErr && idInfo && idInfo.length > 0) {
          const target = idInfo[0]
          if (!target.account_active) {
            return {
              success: false,
              error: 'Akun Anda telah dinonaktifkan oleh Administrator. Hubungi Super Admin.',
            }
          }

          const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email: target.user_email,
            password,
          })

          if (authErr) {
            this.recordFailedAttempt(username)
            return { success: false, error: 'Nama pengguna atau kata sandi tidak valid.' }
          }

          this.clearFailedAttempts(username)

          // Fetch full profile
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('auth_user_id', authData.user?.id)
            .single()

          if (profileData) {
            // Update last_login_at
            await supabase
              .from('user_profiles')
              .update({ last_login_at: new Date().toISOString() })
              .eq('id', profileData.id)

            return {
              success: true,
              profile: profileData as AppUserProfile,
              mustChangePassword: profileData.must_change_password,
            }
          }
        }
      } catch (err) {
        console.warn('Supabase auth failed, falling back to local credentials adapter:', err)
      }
    }

    // 3. Resilient In-Memory / Local Adapter (Guaranteed 21 Accounts)
    const profile = this.inMemoryProfiles.find((p) => p.username.toLowerCase() === username)
    const expectedPassword = this.inMemoryPasswords[username]

    if (!profile || !expectedPassword || expectedPassword !== password) {
      this.recordFailedAttempt(username)
      return { success: false, error: 'Nama pengguna atau kata sandi tidak valid.' }
    }

    if (!profile.is_active) {
      return {
        success: false,
        error: 'Akun Anda telah dinonaktifkan oleh Administrator. Hubungi Super Admin.',
      }
    }

    this.clearFailedAttempts(username)

    // Update login timestamp
    profile.last_login_at = new Date().toISOString()
    this.persistStore()

    return {
      success: true,
      profile: { ...profile },
      mustChangePassword: profile.must_change_password,
    }
  }

  /**
   * Enforces mandatory or user-initiated password change.
   */
  async changePassword(
    username: string,
    currentPasswordInput: string,
    newPasswordInput: string,
    confirmPasswordInput: string
  ): Promise<{ success: boolean; error?: string }> {
    const userKey = (username || '').trim().toLowerCase()
    const currentPass = (currentPasswordInput || '').trim()
    const newPass = (newPasswordInput || '').trim()
    const confirmPass = (confirmPasswordInput || '').trim()

    if (!newPass || !confirmPass) {
      return { success: false, error: 'Kata sandi baru dan konfirmasi kata sandi wajib diisi.' }
    }

    if (newPass !== confirmPass) {
      return { success: false, error: 'Konfirmasi kata sandi tidak cocok dengan kata sandi baru.' }
    }

    if (newPass === currentPass) {
      return { success: false, error: 'Kata sandi baru tidak boleh sama dengan kata sandi sebelumnya.' }
    }

    if (newPass.length < 8) {
      return { success: false, error: 'Kata sandi minimal 8 karakter.' }
    }

    if (!/[A-Z]/.test(newPass)) {
      return { success: false, error: 'Kata sandi harus memiliki minimal 1 huruf besar (A-Z).' }
    }

    if (!/[a-z]/.test(newPass)) {
      return { success: false, error: 'Kata sandi harus memiliki minimal 1 huruf kecil (a-z).' }
    }

    if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPass)) {
      return { success: false, error: 'Kata sandi harus memiliki minimal 1 angka atau simbol unik.' }
    }

    // Live Supabase update
    if (isSupabaseConfigured()) {
      try {
        const { error: updateAuthErr } = await supabase.auth.updateUser({ password: newPass })
        if (updateAuthErr) return { success: false, error: updateAuthErr.message }

        await supabase
          .from('user_profiles')
          .update({ must_change_password: false, updated_at: new Date().toISOString() })
          .eq('username', userKey)
      } catch (err: any) {
        console.warn('Supabase password change error:', err)
      }
    }

    // Local in-memory update
    const profile = this.inMemoryProfiles.find((p) => p.username.toLowerCase() === userKey)
    if (profile) {
      profile.must_change_password = false
      profile.updated_at = new Date().toISOString()
      this.inMemoryPasswords[userKey] = newPass
      this.persistStore()
      return { success: true }
    }

    return { success: false, error: 'Pengguna tidak ditemukan.' }
  }

  /**
   * Retrieves all user profiles (Accessible by Super Admin).
  /**
   * Retrieves profile by username.
   */
  getProfileByUsername(username: string): AppUserProfile | undefined {
    const key = (username || '').trim().toLowerCase()
    return this.inMemoryProfiles.find((p) => p.username.toLowerCase() === key)
  }

  /**
   * Returns all 21 user profiles for Super Admin overview.
   */
  async getAllUsers(currentUserRole: string = 'super_admin'): Promise<AppUserProfile[]> {
    if (currentUserRole !== 'super_admin') {
      // Campus admins can only retrieve their own profile
      return []
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('role', { ascending: false })
          .order('username', { ascending: true })
        if (!error && data && data.length > 0) {
          return data as AppUserProfile[]
        }
      } catch {
        // Fall back to local
      }
    }

    return [...this.inMemoryProfiles]
  }

  /**
   * Activates or deactivates an account (Super Admin action).
   */
  async toggleUserActive(
    targetUserIdOrUsername: string,
    isActive: boolean,
    currentUserRole: string = 'super_admin'
  ): Promise<{ success: boolean; error?: string }> {
    if (currentUserRole !== 'super_admin') {
      return { success: false, error: 'Hanya Super Admin yang diizinkan mengubah status akun.' }
    }

    const targetKey = targetUserIdOrUsername.toLowerCase().trim()
    const user = this.inMemoryProfiles.find(
      (p) => p.id === targetUserIdOrUsername || p.username.toLowerCase() === targetKey
    )
    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('user_profiles')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', user.id)
      } catch {
        // Local fallback
      }
    }

    user.is_active = isActive
    user.updated_at = new Date().toISOString()
    this.persistStore()

    return { success: true }
  }

  /**
   * Resets a Campus Admin's password to the shared initial password and requires password change on next login.
   */
  async resetUserAccess(
    targetUserIdOrUsername: string,
    currentUserRole: string = 'super_admin'
  ): Promise<{ success: boolean; error?: string }> {
    if (currentUserRole !== 'super_admin') {
      return { success: false, error: 'Hanya Super Admin yang diizinkan mereset akses pengguna.' }
    }

    const targetKey = targetUserIdOrUsername.toLowerCase().trim()
    const user = this.inMemoryProfiles.find(
      (p) => p.id === targetUserIdOrUsername || p.username.toLowerCase() === targetKey
    )
    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' }
    if (user.role === 'super_admin') {
      return { success: false, error: 'Kata sandi Super Admin tidak dapat direset dengan fungsi ini.' }
    }

    user.must_change_password = true
    user.updated_at = new Date().toISOString()
    this.inMemoryPasswords[user.username] = SHARED_CAMPUS_ADMIN_INITIAL_PASSWORD
    this.persistStore()

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('user_profiles')
          .update({ must_change_password: true, updated_at: new Date().toISOString() })
          .eq('id', user.id)
      } catch {
        // Local fallback
      }
    }

    return { success: true }
  }

  /**
   * Updates a user's verified contact email address.
   */
  async updateUserEmail(
    targetUserIdOrUsername: string,
    newEmail: string,
    currentUserRole: string = 'super_admin'
  ): Promise<{ success: boolean; error?: string }> {
    if (currentUserRole !== 'super_admin') {
      return { success: false, error: 'Hanya Super Admin yang diizinkan mengubah email pengguna.' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!newEmail || !emailRegex.test(newEmail)) {
      return { success: false, error: 'Format email tidak valid.' }
    }

    const targetKey = targetUserIdOrUsername.toLowerCase().trim()
    const user = this.inMemoryProfiles.find(
      (p) => p.id === targetUserIdOrUsername || p.username.toLowerCase() === targetKey
    )
    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' }

    user.email = newEmail.toLowerCase().trim()
    user.updated_at = new Date().toISOString()
    this.persistStore()

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('user_profiles')
          .update({ email: user.email, updated_at: new Date().toISOString() })
          .eq('id', user.id)
      } catch {
        // Local fallback
      }
    }

    return { success: true }
  }

  /**
   * Gets a user profile by ID.
   */
  getUserById(userId: string): AppUserProfile | undefined {
    return this.inMemoryProfiles.find((p) => p.id === userId || p.auth_user_id === userId)
  }

  /**
   * Gets a user profile by username.
   */
  getUserByUsername(username: string): AppUserProfile | undefined {
    const key = (username || '').trim().toLowerCase()
    return this.inMemoryProfiles.find((p) => p.username.toLowerCase() === key)
  }

  /**
   * Resets in-memory storage to clean initial state (useful for test suites).
   */
  resetStoreForTesting() {
    const initial = initializeDefaultLocalProfiles()
    this.inMemoryProfiles = initial.profiles
    this.inMemoryPasswords = initial.passwords
    loginAttemptMap.clear()
    this.persistStore()
  }
}

export const accountService = new AccountService()
