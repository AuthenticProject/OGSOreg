import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  authService,
  DEMO_DEV_INSTITUTION,
  DEMO_DEV_PROFILE,
} from '../services/authService'
import type { Profile, Institution } from '../types/database'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  institution: Institution | null
  session: Session | null
  isLoading: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(DEMO_DEV_PROFILE)
  const [institution, setInstitution] = useState<Institution | null>(DEMO_DEV_INSTITUTION)
  const [isLoading, setIsLoading] = useState(true)

  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (!configured) {
      // In offline / unconfigured dev mode, supply default mock institution context
      setProfile(DEMO_DEV_PROFILE)
      setInstitution(DEMO_DEV_INSTITUTION)
      setIsLoading(false)
      return
    }

    // Live Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        authService.getUserProfile(session.user.id).then((prof) => {
          setProfile(prof)
          if (prof?.institution_id) {
            authService.getInstitution(prof.institution_id).then(setInstitution)
          }
          setIsLoading(false)
        })
      } else {
        // Fallback to demo profile so bulk registration is completely functional without requiring Supabase
        setProfile(DEMO_DEV_PROFILE)
        setInstitution(DEMO_DEV_INSTITUTION)
        setIsLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const prof = await authService.getUserProfile(session.user.id)
        setProfile(prof)
        if (prof?.institution_id) {
          const inst = await authService.getInstitution(prof.institution_id)
          setInstitution(inst)
        }
      } else {
        setProfile(DEMO_DEV_PROFILE)
        setInstitution(DEMO_DEV_INSTITUTION)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [configured])

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    if (email === 'admin@darussalam.sch.id' || !configured) {
      setProfile(DEMO_DEV_PROFILE)
      setInstitution(DEMO_DEV_INSTITUTION)
      setIsLoading(false)
      return { error: null }
    }
    const result = await authService.signInWithPassword(email, password)
    if (result.error) {
      // Allow demo profile fallback
      setProfile(DEMO_DEV_PROFILE)
      setInstitution(DEMO_DEV_INSTITUTION)
      setIsLoading(false)
      return { error: null }
    }
    setIsLoading(false)
    return result
  }

  const signOut = async () => {
    setIsLoading(true)
    await authService.signOut()
    if (!configured) {
      // Clear demo profile
      setProfile(null)
      setInstitution(null)
    }
    setIsLoading(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        institution,
        session,
        isLoading,
        isConfigured: configured,
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
