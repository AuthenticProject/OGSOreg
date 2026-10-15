import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cuunipngguedqttuutaa.supabase.co'
const supabaseAnonKey = 'sb_publishable_QndVljA4Ne4Zodc-zlYH9A_r688lNuF'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  try {
    const { data: students, error: stdErr } = await supabase.from('students').select('count').limit(1)
    console.log('Students table query result:', { data: students, error: stdErr })

    const { data: profiles, error: profErr } = await supabase.from('user_profiles').select('*').limit(1)
    console.log('user_profiles table query result:', { data: profiles, error: profErr })
  } catch (err) {
    console.error('Error during test:', err)
  }
}

testConnection()
