import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cuunipngguedqttuutaa.supabase.co'
const supabaseAnonKey = 'sb_publishable_QndVljA4Ne4Zodc-zlYH9A_r688lNuF'
const client = createClient(supabaseUrl, supabaseAnonKey)

async function testAllAccounts() {
  const accounts = [
    { username: 'admin', pass: 'OGSOreg_SuperAdmin2026!' },
    { username: 'gontor1', pass: 'OGSO2026' },
    { username: 'gontorputri1', pass: 'OGSO2026' }
  ]

  for (const acc of accounts) {
    const { data: idInfo } = await client.rpc('resolve_login_identifier', { p_username: acc.username })
    const email = idInfo[0].auth_email
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: acc.pass
    })
    console.log(`Account ${acc.username} (${email}) ->`, error ? `FAILED: ${error.message}` : `SUCCESS! (User: ${data.user.id})`)
  }
}

testAllAccounts()
