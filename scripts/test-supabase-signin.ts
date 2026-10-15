import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cuunipngguedqttuutaa.supabase.co'
const supabaseAnonKey = 'sb_publishable_QndVljA4Ne4Zodc-zlYH9A_r688lNuF'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignIn() {
  console.log('Testing Supabase auth.signInWithPassword...')
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@ogso.gontor.ac.id',
      password: 'OGSOreg_SuperAdmin2026!',
    })
    console.log('signIn result:', {
      session: !!data.session,
      userId: data.user?.id,
      metadata: data.user?.user_metadata,
      error: error?.message,
    })
  } catch (err) {
    console.error('Error during signIn test:', err)
  }
}

testSignIn()
