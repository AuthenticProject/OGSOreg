import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cuunipngguedqttuutaa.supabase.co'
const supabaseAnonKey = 'sb_publishable_QndVljA4Ne4Zodc-zlYH9A_r688lNuF'
const client = createClient(supabaseUrl, supabaseAnonKey)

async function checkProfiles() {
  const { data, error } = await client.from('user_profiles').select('*')
  console.log('User profiles count:', data?.length, 'Error:', error)
  if (data) {
    data.slice(0, 5).forEach((p) => console.log(p.username, p.role, p.campus_id, p.auth_user_id))
  }
}

checkProfiles()
