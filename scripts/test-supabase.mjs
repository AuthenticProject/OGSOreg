import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cuunipngguedqttuutaa.supabase.co'
const supabaseAnonKey = 'sb_publishable_QndVljA4Ne4Zodc-zlYH9A_r688lNuF'

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey)

const client = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  try {
    const { data, error, count } = await client.from('students').select('*', { count: 'exact' })
    console.log('Students Query result:')
    console.log('Error:', error)
    console.log('Count:', count)
    console.log('Data length:', data?.length)
    if (data && data.length > 0) {
      console.log('First 3 items:', JSON.stringify(data.slice(0, 3), null, 2))
    }
  } catch (err) {
    console.error('Exception during query:', err)
  }

  try {
    const { data: instData, error: instErr } = await client.from('institutions').select('*')
    console.log('Institutions Error:', instErr)
    console.log('Institutions Data:', instData)
  } catch (err) {
    console.error('Institutions exception:', err)
  }
}

test()
