import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cuunipngguedqttuutaa.supabase.co'
const supabaseAnonKey = 'sb_publishable_QndVljA4Ne4Zodc-zlYH9A_r688lNuF'

const client = createClient(supabaseUrl, supabaseAnonKey)

async function checkTables() {
  const tableNames = [
    'students',
    'institutions',
    'profiles',
    'competitions',
    'registrations',
    'moodle_course_mappings',
    'app_users',
    'operation_logs'
  ]

  console.log('Checking tables in Supabase...')
  for (const table of tableNames) {
    const { data, error } = await client.from(table).select('*').limit(1)
    if (error) {
      console.log(`❌ Table '${table}':`, error.message, `(${error.code})`)
    } else {
      console.log(`✅ Table '${table}': exists, rows returned:`, data.length)
    }
  }
}

checkTables()
