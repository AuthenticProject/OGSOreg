import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { authService } from '../services/authService'
import { accountService } from '../services/accountService'
import { useImportStore } from '../stores/importStore'
import type { Profile, Institution } from '../types/database'
import type { AppUserProfile } from '../types/auth'
import type { StudentKampus } from '../types/campus'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  institution: Institution | null
  appProfile: AppUserProfile | null
  isSuperAdmin: boolean
  assignedCampus: StudentKampus | null
  mustChangePassword: boolean
  session: Session | null
  isLoading: boolean
  isConfigured: boolean
  loginWithUsername: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }>
  changePassword: (
    current: string,
    next: string,
    confirm: string
  ) => Promise<{ success: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const CURRENT_USER_PROFILE_KEY = 'ogsoreg_active_session_profile_v2'

/**
 * Detects whether the current page visit is an intentional reload (F5 / pull-to-refresh)
 * vs a fresh cold navigation (clicking a link, opening tab/browser, opening app after close).
 */
function isPageReload(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    if (navEntries && navEntries.length > 0) {
      return navEntries[0].type === 'reload'
    }
    // Fallback for older browsers
    const perf = window.performance as unknown as { navigation?: { type?: number } }
    if (perf && perf.navigation) {
      return perf.navigation.type === 1
    }
  } catch {
    // Ignore sandbox errors
  }
  return false
}

// Strict Session & Close Protection:
// When opening fresh (clicked link, new tab, reopened after web/apk close),
// purge any residual sessions so all users must explicitly log in.
if (typeof window !== 'undefined') {
  try {
    // 1. localStorage must NEVER hold active user session tokens
    if (window.localStorage) {
      window.localStorage.removeItem('ogsoreg_active_session_profile_v1')
      window.localStorage.removeItem('ogsoreg_active_session_profile_v2')
      window.localStorage.removeItem(CURRENT_USER_PROFILE_KEY)
      for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const key = window.localStorage.key(i)
        if (key && (key.startsWith('sb-') || key.includes('auth-token') || key.includes('session'))) {
          window.localStorage.removeItem(key)
        }
      }
    }

    // 2. If it's a fresh visit (not an in-session reload), wipe sessionStorage completely
    if (!isPageReload() && window.sessionStorage) {
      window.sessionStorage.removeItem(CURRENT_USER_PROFILE_KEY)
      window.sessionStorage.clear()
    }
  } catch {
    // Ignore sandbox errors
  }
}

function buildProfileFromAppProfile(p: AppUserProfile): Profile {
  return {
    id: p.id,
    full_name: p.display_name,
    role: p.role === 'super_admin' ? 'admin' : 'institution',
    institution_id: p.campus_id,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }
}

function buildInstitutionFromAppProfile(p: AppUserProfile): Institution {
  return {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: p.display_name,
    npsn: '-',
    address: '-',
    phone: '-',
    email: p.email,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read session ONLY on reload within the same active tab session.
  // When closing web/apk or clicking link fresh, initial session is strictly null!
  const [initialSessionProfile] = useState<AppUserProfile | null>(() => {
    if (typeof window !== 'undefined' && window.sessionStorage && isPageReload()) {
      try {
        const raw = window.sessionStorage.getItem(CURRENT_USER_PROFILE_KEY)
        if (raw) return JSON.parse(raw) as AppUserProfile
      } catch {
        // Fall back
      }
    }
    // Must NEVER auto-authenticate: all devices must explicitly pass login!
    return null
  })

  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [appProfile, setAppProfile] = useState<AppUserProfile | null>(initialSessionProfile)
  const [profile, setProfile] = useState<Profile | null>(() =>
    initialSessionProfile ? buildProfileFromAppProfile(initialSessionProfile) : null
  )
  const [institution, setInstitution] = useState<Institution | null>(() =>
    initialSessionProfile ? buildInstitutionFromAppProfile(initialSessionProfile) : null
  )
  const [isLoading, setIsLoading] = useState(true)

  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (appProfile) {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(CURRENT_USER_PROFILE_KEY, JSON.stringify(appProfile))
      }
      setProfile(buildProfileFromAppProfile(appProfile))
      setInstitution(buildInstitutionFromAppProfile(appProfile))
    } else {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(CURRENT_USER_PROFILE_KEY)
      }
      setProfile(null)
      setInstitution(null)
    }
  }, [appProfile])

  useEffect(() => {
    if (!configured) {
      // In offline / preview mode, sync appProfile
      setIsLoading(false)
      return
    }

    // Fresh navigation/click: sign out Supabase to prevent auto-login
    if (!isPageReload()) {
      supabase.auth.signOut().finally(() => {
        setIsLoading(false)
      })
      return
    }

    // Live Supabase session check (only on reload)
    const checkLiveSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .single()
          if (!error && data) {
            setAppProfile(data as AppUserProfile)
          } else {
            setAppProfile(null)
          }
        } else {
          setAppProfile(null)
        }
      } catch {
        setAppProfile(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkLiveSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSession(session)
        setUser(session.user)
        try {
          const { data } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .single()
          if (data) setAppProfile(data as AppUserProfile)
        } catch {
          // ignore
        }
      } else {
        setSession(null)
        setUser(null)
        if (event === 'SIGNED_OUT') {
          setAppProfile(null)
        }
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [configured])

  // Login with Username
  const loginWithUsername = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }> => {
    setIsLoading(true)
    const result = await accountService.loginWithUsername(username, password)
    setIsLoading(false)

    if (result.success && result.profile) {
      // Clear any previous staged import data so new account starts from Step 1
      useImportStore.getState().reset()

      setAppProfile(result.profile)
      setProfile(buildProfileFromAppProfile(result.profile))
      setInstitution(buildInstitutionFromAppProfile(result.profile))
      return {
        success: true,
        mustChangePassword: result.mustChangePassword,
      }
    }

    return {
      success: false,
      error: result.error || 'Nama pengguna atau kata sandi tidak valid.',
    }
  }

  // Change Password
  const changePassword = async (
    current: string,
    next: string,
    confirm: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!appProfile) return { success: false, error: 'Sesi login tidak aktif.' }

    const res = await accountService.changePassword(appProfile.username, current, next, confirm)
    if (res.success) {
      setAppProfile((prev) => (prev ? { ...prev, must_change_password: false } : prev))
    }
    return res
  }

  // Legacy signIn method
  const signIn = async (email: string, password: string) => {
    // Try resolving username from email prefix (e.g. gontor1 from gontor1@...)
    const potentialUsername = email.includes('@') ? email.split('@')[0] : email
    const res = await loginWithUsername(potentialUsername, password)
    if (res.success) {
      return { error: null }
    }
    return { error: new Error(res.error || 'Login gagal.') }
  }

  // Sign out
  const signOut = async () => {
    setIsLoading(true)
    useImportStore.getState().reset()
    setAppProfile(null)
    setProfile(null)
    setInstitution(null)
    setUser(null)
    setSession(null)
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.clear()
        window.localStorage.removeItem(CURRENT_USER_PROFILE_KEY)
        window.localStorage.removeItem('ogsoreg_active_session_profile_v1')
        window.localStorage.removeItem('ogsoreg_active_session_profile_v2')
        for (let i = window.localStorage.length - 1; i >= 0; i--) {
          const key = window.localStorage.key(i)
          if (key && (key.startsWith('sb-') || key.includes('auth-token') || key.includes('session'))) {
            window.localStorage.removeItem(key)
          }
        }
      } catch {
        // Ignore
      }
    }
    if (configured) {
      await authService.signOut()
    }
    setIsLoading(false)
  }

  const isSuperAdmin = appProfile?.role === 'super_admin'
  const assignedCampus = appProfile?.campus_id || null
  const mustChangePassword = Boolean(appProfile?.must_change_password)

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        institution,
        appProfile,
        isSuperAdmin,
        assignedCampus,
        mustChangePassword,
        session,
        isLoading,
        isConfigured: configured,
        loginWithUsername,
        changePassword,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
