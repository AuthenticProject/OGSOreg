import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cuunipngguedqttuutaa.supabase.co'
const supabaseAnonKey = 'sb_publishable_QndVljA4Ne4Zodc-zlYH9A_r688lNuF'
const client = createClient(supabaseUrl, supabaseAnonKey)

async function testRpc() {
  console.log('Testing resolve_login_identifier RPC for admin...')
  const { data, error } = await client.rpc('resolve_login_identifier', { p_username: 'admin' })
  console.log('RPC Error:', error)
  console.log('RPC Data:', data)

  if (data && data.length > 0) {
    const item = data[0]
    console.log('item.user_email:', item.user_email)
    console.log('item.auth_email:', item.auth_email)

    console.log('\nTesting signInWithPassword with item.auth_email...')
    const { data: authData, error: authErr } = await client.auth.signInWithPassword({
      email: item.auth_email,
      password: 'OGSOreg_SuperAdmin2026!'
    })
    console.log('Auth error:', authErr)
    console.log('Auth user ID:', authData?.user?.id)
  }
}

testRpc()
