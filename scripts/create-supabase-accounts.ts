import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { INITIAL_ACCOUNT_ROSTER, SHARED_CAMPUS_ADMIN_INITIAL_PASSWORD } from '../src/types/auth'

// Load .env natively
try {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=')
        if (idx > 0) {
          const key = trimmed.slice(0, idx).trim()
          const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    })
  }
} catch {
  // Ignore
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cuunipngguedqttuutaa.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

console.log('====================================================================')
console.log(' OGSOreg — CREATING 21 APPROVED ACCOUNTS IN SUPABASE')
console.log(' Supabase URL:', supabaseUrl)
console.log(' Key Type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role Key (Admin)' : 'Publishable Anon Key')
console.log(' Target Accounts: 21')
console.log(' Campus Admin Password: [PROTECTED - OGSO2026]')
console.log(' Super Admin Password:  [PROTECTED - OGSOreg_SuperAdmin2026!]')
console.log(' First Login Requirement: NOT FORCED (ga harus ubah password)')
console.log('====================================================================\n')

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface AccountCreationResult {
  username: string
  email: string
  role: string
  campus: string | null
  supabaseUserId?: string
  status: 'CREATED' | 'ALREADY_EXISTS' | 'FAILED'
  message?: string
}

async function createAllAccounts() {
  const results: AccountCreationResult[] = []

  for (const account of INITIAL_ACCOUNT_ROSTER) {
    const isSuper = account.role === 'super_admin'
    const password = isSuper ? 'OGSOreg_SuperAdmin2026!' : SHARED_CAMPUS_ADMIN_INITIAL_PASSWORD

    try {
      // Attempt signUp via Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: account.email,
        password: password,
        options: {
          data: {
            username: account.username,
            role: account.role,
            campus_id: account.campus_id,
            display_name: account.display_name,
            must_change_password: false,
          },
        },
      })

      if (error) {
        if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('unique')) {
          results.push({
            username: account.username,
            email: account.email,
            role: account.role,
            campus: account.campus_id,
            status: 'ALREADY_EXISTS',
            message: 'User is already registered in Supabase auth.users',
          })
        } else {
          results.push({
            username: account.username,
            email: account.email,
            role: account.role,
            campus: account.campus_id,
            status: 'FAILED',
            message: error.message,
          })
        }
      } else if (data.user) {
        results.push({
          username: account.username,
          email: account.email,
          role: account.role,
          campus: account.campus_id,
          supabaseUserId: data.user.id,
          status: 'CREATED',
          message: data.session ? 'Created with active session' : 'Registered in Supabase Auth (Confirmation pending)',
        })
      } else {
        results.push({
          username: account.username,
          email: account.email,
          role: account.role,
          campus: account.campus_id,
          status: 'FAILED',
          message: 'Unknown response from Supabase',
        })
      }
    } catch (err: any) {
      results.push({
        username: account.username,
        email: account.email,
        role: account.role,
        campus: account.campus_id,
        status: 'FAILED',
        message: err.message,
      })
    }
  }

  // Print results table
  console.log('| # | Username | Role | Campus | Supabase Auth ID | Status | Note |')
  console.log('|---|---|---|---|---|---|---|')
  results.forEach((r, idx) => {
    console.log(
      `| ${(idx + 1).toString().padStart(2, ' ')} | ${r.username.padEnd(14, ' ')} | ${r.role.padEnd(12, ' ')} | ${(r.campus || 'All (Super)').padEnd(18, ' ')} | ${(r.supabaseUserId || 'Existing').padEnd(36, ' ')} | ${r.status.padEnd(14, ' ')} | ${r.message || ''} |`
    )
  })

  const createdCount = results.filter((r) => r.status === 'CREATED').length
  const existingCount = results.filter((r) => r.status === 'ALREADY_EXISTS').length
  const failedCount = results.filter((r) => r.status === 'FAILED').length

  console.log('\n====================================================================')
  console.log(' SUPABASE CREATION SUMMARY')
  console.log('====================================================================')
  console.log(` Total Accounts Processed: ${results.length}`)
  console.log(` Newly Created in Supabase: ${createdCount}`)
  console.log(` Already Existed in Supabase: ${existingCount}`)
  console.log(` Failed: ${failedCount}`)
  console.log('====================================================================')
}

createAllAccounts()
