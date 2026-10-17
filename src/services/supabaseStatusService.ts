import { supabase, isSupabaseConfigured } from '../lib/supabase'

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
  const rawUrl = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL
    ? (import.meta as any).env.VITE_SUPABASE_URL
    : 'https://cuunipngguedqttuutaa.supabase.co'

  if (!configured) {
    return {
      isConfigured: false,
      url: rawUrl,
      connectionOk: false,
      tablesExist: false,
      missingTables: ['students', 'institutions', 'user_profiles'],
      details: 'Kredensial Supabase belum dikonfigurasi di file environment (.env).',
    }
  }

  try {
    const { error: studentErr } = await supabase.from('students').select('id').limit(1)

    if (studentErr) {
      // PGRST205 = Table not found in schema cache
      if (studentErr.code === 'PGRST205' || studentErr.message?.includes('schema cache')) {
        return {
          isConfigured: true,
          url: rawUrl,
          connectionOk: true,
          tablesExist: false,
          missingTables: ['students'],
          details:
            'Terhubung ke Supabase, namun tabel database (public.students) belum dibuat di Supabase SQL Editor.',
        }
      }

      return {
        isConfigured: true,
        url: rawUrl,
        connectionOk: false,
        tablesExist: false,
        missingTables: ['students'],
        details: `Terhubung namun terdapat kendala izin/kueri: ${studentErr.message}`,
      }
    }

    return {
      isConfigured: true,
      url: rawUrl,
      connectionOk: true,
      tablesExist: true,
      missingTables: [],
      details: 'Database Supabase Cloud aktif dan seluruh tabel siap digunakan.',
    }
  } catch (err) {
    return {
      isConfigured: true,
      url: rawUrl,
      connectionOk: false,
      tablesExist: false,
      missingTables: ['students'],
      details: err instanceof Error ? err.message : 'Gagal menghubungi server Supabase.',
    }
  }
}
