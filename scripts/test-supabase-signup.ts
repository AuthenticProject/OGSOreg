import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cuunipngguedqttuutaa.supabase.co'
const supabaseAnonKey = 'sb_publishable_QndVljA4Ne4Zodc-zlYH9A_r688lNuF'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignUp() {
  console.log('Testing Supabase auth.signUp with admin test account...')
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@ogso.gontor.ac.id',
      password: 'OGSOreg_SuperAdmin2026!',
      options: {
        data: {
          username: 'admin',
          role: 'super_admin',
          campus_id: null,
          display_name: 'Super Admin OGSOreg',
        },
      },
    })
    console.log('signUp result:', { user: data.user?.id, email: data.user?.email, error })
  } catch (err) {
    console.error('Error during signUp test:', err)
  }
}

testSignUp()
