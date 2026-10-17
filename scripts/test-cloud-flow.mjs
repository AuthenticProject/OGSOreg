import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cuunipngguedqttuutaa.supabase.co'
const supabaseAnonKey = 'sb_publishable_QndVljA4Ne4Zodc-zlYH9A_r688lNuF'
const client = createClient(supabaseUrl, supabaseAnonKey)

async function testCloudFlow() {
  console.log('Testing live Supabase Cloud student operations...')

  // 1. Insert student
  const newStudent = {
    username: 'santri_live_cloud_01',
    firstname: 'Abdullah',
    lastname: 'Syukri',
    full_name: 'Abdullah Syukri',
    email: 'abdullah.syukri@gontor.ac.id',
    jenjang: 'Kelas 1',
    kampus: 'Gontor 1',
    institution_id: 'a0000000-0000-0000-0000-000000000001',
    source: 'manual',
    sync_status: 'local_only',
  }

  const { data: inserted, error: insertErr } = await client
    .from('students')
    .insert(newStudent)
    .select()
    .single()

  console.log('Insert:', insertErr ? insertErr.message : `SUCCESS (ID: ${inserted.id})`)

  // 2. Select students
  const { data: list, count, error: selectErr } = await client
    .from('students')
    .select('*', { count: 'exact' })
    .eq('institution_id', 'a0000000-0000-0000-0000-000000000001')

  console.log('Select:', selectErr ? selectErr.message : `SUCCESS (Total: ${count})`)
  if (list) {
    list.forEach((s) => console.log(` - ${s.full_name} (${s.kampus}) [${s.username}]`))
  }

  // 3. Delete student
  if (inserted?.id) {
    const { error: delErr } = await client.from('students').delete().eq('id', inserted.id)
    console.log('Delete:', delErr ? delErr.message : 'SUCCESS')
  }
}

testCloudFlow()
