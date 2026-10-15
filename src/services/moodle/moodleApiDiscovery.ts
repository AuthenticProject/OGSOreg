/**
 * OGSOreg Moodle Integration Discovery & Authorization Service
 * Target: https://ogso.gontor.ac.id/
 * 
 * Inspects Moodle integration architecture and determines available mechanisms.
 * Enforces security constraints:
 * - Never exposes Moodle admin tokens in frontend code.
 * - Never simulates fake sync.
 * - Preserves standard Moodle Upload Users CSV workflow as primary supported mechanism.
 */

export interface MoodleIntegrationStatus {
  targetUrl: string
  restEndpoint: string
  isDirectSyncConfigured: boolean
  isBackendProxyAvailable: boolean
  authMechanism: 'moodle_web_services' | 'upload_users_csv' | 'unconfigured'
  fallbackNotice: string
  supportedFunctions: {
    name: string
    purpose: string
    status: 'available' | 'requires_auth_token' | 'disabled'
  }[]
  customFieldInvestigation: {
    recommendedFieldShortname: string
    description: string
    moodleDocumentationRef: string
    status: string
  }
}

export const MOODLE_TARGET_URL = 'https://ogso.gontor.ac.id/'
export const MOODLE_REST_ENDPOINT = 'https://ogso.gontor.ac.id/webservice/rest/server.php'

/**
 * Standard unconfigured notice required by Phase 7 specification
 */
export const MOODLE_UNCONFIGURED_NOTICE =
  'Integrasi langsung Moodle belum dikonfigurasi. Gunakan Export CSV Moodle.'

/**
 * Discovers and inspects current Moodle integration capability
 */
export async function discoverMoodleIntegration(): Promise<MoodleIntegrationStatus> {
  // Check whether a secure server-side proxy or edge function is configured via environment variables
  // Note: privileged API tokens MUST NOT be placed in client-side Vite envs (VITE_*)
  const hasServerProxy = Boolean(
    typeof process !== 'undefined' &&
    process.env &&
    process.env.MOODLE_SECURE_PROXY_URL
  )

  const isConfigured = hasServerProxy

  return {
    targetUrl: MOODLE_TARGET_URL,
    restEndpoint: MOODLE_REST_ENDPOINT,
    isDirectSyncConfigured: isConfigured,
    isBackendProxyAvailable: hasServerProxy,
    authMechanism: isConfigured ? 'moodle_web_services' : 'upload_users_csv',
    fallbackNotice: MOODLE_UNCONFIGURED_NOTICE,
    supportedFunctions: [
      {
        name: 'core_user_create_users',
        purpose: 'Pembuatan akun santri baru di Moodle secara terotentikasi',
        status: isConfigured ? 'available' : 'requires_auth_token',
      },
      {
        name: 'core_user_get_users',
        purpose: 'Pencarian akun santri yang sudah ada berdasarkan username/email untuk menghindari duplikasi',
        status: isConfigured ? 'available' : 'requires_auth_token',
      },
      {
        name: 'enrol_manual_enrol_users',
        purpose: 'Pendaftaran otomatis santri ke mata pelajaran sesuai jenjang (Kelas 1–5 & Simulasi)',
        status: isConfigured ? 'available' : 'requires_auth_token',
      },
    ],
    customFieldInvestigation: {
      recommendedFieldShortname: 'profile_field_kampus',
      description:
        'Sesuai spesifikasi resmi Moodle, custom user profile field disimpan dengan awalan profile_field_<shortname>. Kolom ini memerlukan pembuatan field "kampus" bertipe dropdown pada Moodle: Site administration > Users > User profile fields.',
      moodleDocumentationRef: 'https://docs.moodle.org/en/Upload_users#User_profile_fields',
      status:
        'Eksport Moodle CSV standar tetap hanya menggunakan 7 kolom resmi agar kompatibel 100% tanpa error format.',
    },
  }
}
