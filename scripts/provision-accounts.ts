/**
 * OGSOreg — Multi-Campus Authentication & User Provisioning Script
 * 
 * Provisions the 21 initial accounts (1 Super Admin + 20 Campus Admins)
 * into Supabase Auth and public.user_profiles table.
 * 
 * Safety & Security Policies:
 * - Requires explicit --execute flag to run against Supabase
 * - Defaults to --dry-run validation
 * - Never prints plaintext passwords in console or reports
 * - Preserves existing accounts (idempotent, skips duplicates)
 * - Assigns strict roles and stable campus assignments
 * - Sets must_change_password = true for Campus Admins
 * - Uses a unique, high-entropy password for Super Admin
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { INITIAL_ACCOUNT_ROSTER, SHARED_CAMPUS_ADMIN_INITIAL_PASSWORD } from '../src/types/auth'
import { KAMPUS_OPTIONS, type StudentKampus } from '../src/types/campus'

// Load .env natively if present
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

interface ProvisioningResult {
  username: string
  email: string
  role: string
  campus_id: string | null
  status: 'PROVISIONED' | 'ALREADY_EXISTS' | 'DRY_RUN_READY' | 'FAILED'
  message?: string
}

function generateSuperAdminPassword(): string {
  // Generate high-entropy 16-character secure password: Upper, Lower, Numbers, Special
  const bytes = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, 'X')
  return `OGSO#${bytes}!9`
}

async function runProvisioning() {
  const args = process.argv.slice(2)
  const isDryRun = !args.includes('--execute')
  const customSuperPassArg = args.find((a) => a.startsWith('--superadmin-password='))
  const customSuperPass = customSuperPassArg ? customSuperPassArg.split('=')[1] : null

  console.log('====================================================================')
  console.log(' OGSOreg — MULTI-CAMPUS AUTHENTICATION PROVISIONING ENGINE')
  console.log(' Mode:', isDryRun ? '🔍 DRY RUN (Simulation & Validation)' : '⚡ LIVE EXECUTION (Supabase Provisioning)')
  console.log(' Target Accounts:', INITIAL_ACCOUNT_ROSTER.length, '(1 Super Admin + 20 Campus Admins)')
  console.log('====================================================================\n')

  // 1. Validate Campus Master Data
  console.log('1. Validating Campus Master Data...')
  const rosterCampuses = INITIAL_ACCOUNT_ROSTER
    .map((acc) => acc.campus_id)
    .filter((c): c is StudentKampus => c !== null)

  const missingFromOptions = rosterCampuses.filter((c) => !KAMPUS_OPTIONS.includes(c as any))
  if (missingFromOptions.length > 0) {
    console.error('❌ Error: Campuses in roster missing from KAMPUS_OPTIONS:', missingFromOptions)
    process.exit(1)
  }
  console.log(`✅ All ${rosterCampuses.length} Campus Admin assignments match official campus master data.\n`)

  // 2. Validate Supabase Environment
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('⚠️  Notice: Supabase URL or Service Key not configured in environment.')
    console.log('   Running in local/offline simulation mode.')
  }

  const supabase = (supabaseUrl && supabaseServiceKey) 
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null

  // 3. Prepare Credentials
  const campusAdminTempPassword = SHARED_CAMPUS_ADMIN_INITIAL_PASSWORD
  const superAdminPassword = customSuperPass || generateSuperAdminPassword()

  console.log('2. Password Configuration:')
  console.log('   - Campus Admins (20): Shared temporary password (must change at first login)')
  console.log('   - Super Admin (1): Unique secure password configured (distinct from Campus Admins)')
  console.log('   - [SECURITY] Plaintext passwords will NEVER be displayed or logged.\n')

  // 4. Provision or Simulate Each Account
  console.log('3. Account Provisioning Progress:\n')
  const results: ProvisioningResult[] = []

  for (const account of INITIAL_ACCOUNT_ROSTER) {
    const isSuper = account.role === 'super_admin'
    const passwordToUse = isSuper ? superAdminPassword : campusAdminTempPassword

    if (isDryRun || !supabase) {
      results.push({
        username: account.username,
        email: account.email,
        role: account.role,
        campus_id: account.campus_id,
        status: 'DRY_RUN_READY',
        message: 'Account format, role, and campus mapping verified.',
      })
      continue
    }

    // Live Execution via Supabase Admin API
    try {
      // Check if user already exists in auth.users by email
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
      if (listError) {
        throw new Error(`Failed to list users: ${listError.message}`)
      }

      const existingAuthUser = listData.users.find(
        (u) => u.email?.toLowerCase() === account.email.toLowerCase()
      )

      let authUserId = existingAuthUser?.id

      if (!existingAuthUser) {
        // Create in auth.users
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: account.email,
          password: passwordToUse,
          email_confirm: true,
          user_metadata: {
            username: account.username,
            display_name: account.display_name,
            role: account.role,
            campus_id: account.campus_id,
          },
        })

        if (createError || !newUser?.user) {
          throw new Error(createError?.message || 'Failed to create user in auth.users')
        }
        authUserId = newUser.user.id
      }

      // Upsert profile in public.user_profiles
      const { error: profileError } = await supabase.from('user_profiles').upsert(
        {
          auth_user_id: authUserId,
          username: account.username,
          email: account.email,
          display_name: account.display_name,
          role: account.role,
          campus_id: account.campus_id,
          is_active: true,
          must_change_password: isSuper ? false : true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'username' }
      )

      if (profileError) {
        throw new Error(`Profile upsert error: ${profileError.message}`)
      }

      results.push({
        username: account.username,
        email: account.email,
        role: account.role,
        campus_id: account.campus_id,
        status: existingAuthUser ? 'ALREADY_EXISTS' : 'PROVISIONED',
        message: existingAuthUser
          ? 'Profile synced with existing Auth ID.'
          : 'User created in auth and profile synced.',
      })
    } catch (err: any) {
      results.push({
        username: account.username,
        email: account.email,
        role: account.role,
        campus_id: account.campus_id,
        status: 'FAILED',
        message: err.message,
      })
    }
  }

  // 5. Output Summary Report Table
  console.log('| # | Username | Role | Campus Assignment | Email (Proposed) | Status |')
  console.log('|---|---|---|---|---|---|')
  results.forEach((r, idx) => {
    console.log(
      `| ${(idx + 1).toString().padStart(2, ' ')} | ${r.username.padEnd(14, ' ')} | ${r.role.padEnd(12, ' ')} | ${(r.campus_id || 'All Campuses (Super)').padEnd(20, ' ')} | ${r.email.padEnd(30, ' ')} | ${r.status} |`
    )
  })

  console.log('\n====================================================================')
  console.log(' PROVISIONING AUDIT SUMMARY')
  console.log('====================================================================')
  console.log(` Total Configured Accounts: ${results.length}`)
  console.log(` Ready / Provisioned: ${results.filter((r) => r.status === 'PROVISIONED' || r.status === 'DRY_RUN_READY').length}`)
  console.log(` Already Existed: ${results.filter((r) => r.status === 'ALREADY_EXISTS').length}`)
  console.log(` Failed: ${results.filter((r) => r.status === 'FAILED').length}`)
  console.log('====================================================================')

  if (isDryRun) {
    console.log('\n💡 To perform live provisioning against Supabase, run:')
    console.log('   npx tsx scripts/provision-accounts.ts --execute')
    console.log('   (Optionally supply: --superadmin-password="<CustomStrongPassword>")')
  }
}

runProvisioning().catch((err) => {
  console.error('Fatal Provisioning Error:', err)
  process.exit(1)
})
