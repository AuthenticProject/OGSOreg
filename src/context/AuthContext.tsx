import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  authService,
  DEMO_DEV_INSTITUTION,
  DEMO_DEV_PROFILE,
} from '../services/authService'
import { accountService } from '../services/accountService'
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

const CURRENT_USER_PROFILE_KEY = 'ogsoreg_active_session_profile_v1'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(DEMO_DEV_PROFILE)
  const [institution, setInstitution] = useState<Institution | null>(DEMO_DEV_INSTITUTION)
  const [appProfile, setAppProfile] = useState<AppUserProfile | null>(() => {
    // Check localStorage for saved session profile
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(CURRENT_USER_PROFILE_KEY)
        if (raw) return JSON.parse(raw)
      } catch {
        // Fall back
      }
    }
    // Default to Super Admin for smooth preview
    const defaultAdmin = accountService.getUserByUsername('admin')
    return defaultAdmin || null
  })
  const [isLoading, setIsLoading] = useState(true)

  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (appProfile) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(CURRENT_USER_PROFILE_KEY, JSON.stringify(appProfile))
      }
    } else {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(CURRENT_USER_PROFILE_KEY)
      }
    }
  }, [appProfile])

  useEffect(() => {
    if (!configured) {
      // In offline / preview mode, sync appProfile
      setIsLoading(false)
      return
    }

    // Live Supabase session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        // Fetch user_profiles row
        supabase
          .from('user_profiles')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              setAppProfile(data as AppUserProfile)
            }
            setIsLoading(false)
          })
      } else {
        setIsLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single()
        if (data) setAppProfile(data as AppUserProfile)
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
      setAppProfile(result.profile)
      // Also sync legacy profile for backward compatibility
      setProfile({
        id: result.profile.id,
        full_name: result.profile.display_name,
        role: result.profile.role === 'super_admin' ? 'admin' : 'institution',
        institution_id: result.profile.campus_id,
        created_at: result.profile.created_at,
        updated_at: result.profile.updated_at,
      })
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
    await accountService.loginWithUsername('', '') // Clear state
    setAppProfile(null)
    setProfile(null)
    setInstitution(null)
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(CURRENT_USER_PROFILE_KEY)
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
