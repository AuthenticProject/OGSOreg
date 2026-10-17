import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cuunipngguedqttuutaa.supabase.co'
const supabaseAnonKey = 'sb_publishable_QndVljA4Ne4Zodc-zlYH9A_r688lNuF'
const client = createClient(supabaseUrl, supabaseAnonKey)

async function testQuery() {
  console.log('Testing query with institution_id = general-inst...')
  const res1 = await client.from('students').select('*').eq('institution_id', 'general-inst')
  console.log('Result with general-inst:', res1.error)

  console.log('\nTesting query with institution_id = a0000000-0000-0000-0000-000000000001 (UUID)...')
  const res2 = await client.from('students').select('*').eq('institution_id', 'a0000000-0000-0000-0000-000000000001')
  console.log('Result with UUID:', res2.error, 'data length:', res2.data?.length)
}

testQuery()
