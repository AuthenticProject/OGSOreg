import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cuunipngguedqttuutaa.supabase.co'
const supabaseAnonKey = 'sb_publishable_QndVljA4Ne4Zodc-zlYH9A_r688lNuF'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testCrud() {
  console.log('Testing CRUD directly on Supabase tables...')
  
  // 1. Ensure institution exists
  const instId = 'a0000000-0000-0000-0000-000000000001'
  const { data: instData, error: instErr } = await supabase
    .from('institutions')
    .upsert({
      id: instId,
      name: 'Pondok Modern Darussalam Gontor',
      address: 'Ponorogo, Jawa Timur',
      email: 'admin@ogso.gontor.ac.id',
    })
    .select()

  console.log('Institution upsert result:', { instData, instErr })

  // 2. Select students
  const { data: stdData, error: stdErr, count } = await supabase
    .from('students')
    .select('*', { count: 'exact' })

  console.log('Students query result:', { count, error: stdErr })
}

testCrud()
