import { supabase, isSupabaseConfigured, supabaseUrl } from '../lib/supabase'
import { cloudCircuitBreaker } from './supabase/cloudCircuitBreaker'

export interface SupabaseHealthStatus {
  isConfigured: boolean
  url: string
  connectionOk: boolean
  tablesExist: boolean
  missingTables: string[]
  details: string
}

/**
 * Memeriksa status koneksi dan keberadaan tabel database di Supabase.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  const configured = isSupabaseConfigured()

  if (!configured) {
    return {
      isConfigured: false,
      url: supabaseUrl,
      connectionOk: false,
      tablesExist: false,
      missingTables: ['students', 'institutions', 'user_profiles'],
      details: 'Kredensial Supabase belum terpasang dengan benar.',
    }
  }

  if (!cloudCircuitBreaker.canExecuteQuery()) {
    return {
      isConfigured: true,
      url: supabaseUrl,
      connectionOk: false,
      tablesExist: false,
      missingTables: [],
      details:
        'Layanan cloud Supabase mencapai batas kuota egress (HTTP 402 exceed_egress_quota). Sistem OGSOreg secara otomatis berjalan penuh dalam mode penyimpanan lokal yang aman.',
    }
  }

  try {
    const { error: studentErr } = await supabase.from('students').select('id').limit(1)

    if (studentErr) {
      if (cloudCircuitBreaker.isQuotaRestrictionError(studentErr)) {
        cloudCircuitBreaker.recordError(studentErr)
        return {
          isConfigured: true,
          url: supabaseUrl,
          connectionOk: false,
          tablesExist: false,
          missingTables: ['students'],
          details:
            'Layanan cloud Supabase mencapai batas kuota egress (HTTP 402 exceed_egress_quota). Sistem OGSOreg secara otomatis berjalan penuh dalam mode penyimpanan lokal yang aman.',
        }
      }

      // PGRST205 = Table not found in schema cache
      if (studentErr.code === 'PGRST205' || studentErr.message?.includes('schema cache')) {
        return {
          isConfigured: true,
          url: supabaseUrl,
          connectionOk: true,
          tablesExist: false,
          missingTables: ['students'],
          details:
            'Terhubung ke server Supabase, namun tabel database (public.students) belum dibuat di Supabase SQL Editor.',
        }
      }

      return {
        isConfigured: true,
        url: supabaseUrl,
        connectionOk: false,
        tablesExist: false,
        missingTables: ['students'],
        details: `Terhubung ke server Supabase, namun kueri tabel mendapati kendala: ${studentErr.message}`,
      }
    }

    return {
      isConfigured: true,
      url: supabaseUrl,
      connectionOk: true,
      tablesExist: true,
      missingTables: [],
      details: 'Database Supabase Cloud aktif dan seluruh tabel siap digunakan.',
    }
  } catch (err) {
    return {
      isConfigured: true,
      url: supabaseUrl,
      connectionOk: false,
      tablesExist: false,
      missingTables: ['students'],
      details: err instanceof Error ? err.message : 'Gagal menghubungi server Supabase.',
    }
  }
}
