import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cuunipngguedqttuutaa.supabase.co'
const supabaseAnonKey = 'sb_publishable_QndVljA4Ne4Zodc-zlYH9A_r688lNuF'
const client = createClient(supabaseUrl, supabaseAnonKey)

async function testInsert() {
  console.log('Testing insert into public.students...')
  const testStudent = {
    username: 'test_santri_verification_01',
    firstname: 'Santri',
    lastname: 'Percobaan',
    full_name: 'Santri Percobaan',
    email: 'santri.test@gontor.ac.id',
    jenjang: 'Kelas 1',
    kampus: 'Gontor 1',
    institution_id: 'a0000000-0000-0000-0000-000000000001',
    source: 'manual',
    sync_status: 'local_only'
  }

  const { data, error } = await client.from('students').insert(testStudent).select().single()
  console.log('Insert result:', error ? `FAILED: ${error.message} (${error.code})` : 'SUCCESS!')
  if (data) {
    console.log('Inserted student ID:', data.id)
    // Clean up test student
    await client.from('students').delete().eq('id', data.id)
    console.log('Cleanup finished.')
  }
}

testInsert()
