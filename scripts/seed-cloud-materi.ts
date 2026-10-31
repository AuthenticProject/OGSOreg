import { createClient } from '@supabase/supabase-js'
import { materiService } from '../src/services/materiService'
import { DEFAULT_WEBSITE_CONTENT } from '../src/services/websiteContentService'
import { DEFAULT_STANDARD_EXCEL_COLUMNS } from '../src/services/templateConfigService'

const supabaseUrl = 'https://cuunipngguedqttuutaa.supabase.co'
const supabaseAnonKey = 'sb_publishable_QndVljA4Ne4Zodc-zlYH9A_r688lNuF'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
  console.log('Seeding cloud data to Supabase app_settings...')
  
  // 1. Silabus
  const syllabuses = materiService.getSyllabuses()
  console.log(`Uploading ${syllabuses.length} silabus to app_settings(materi_silabus)...`)
  const { error: errSilabus } = await supabase.from('app_settings').upsert({
    key: 'materi_silabus',
    value: syllabuses,
    updated_at: new Date().toISOString()
  })
  if (errSilabus) console.error('Error silabus:', errSilabus)
  else console.log('✅ Silabus successfully uploaded to cloud!')

  // 2. Bank Soal
  const bankSoal = materiService.getBankSoalCollections()
  console.log(`Uploading ${bankSoal.length} bank soal collections to app_settings(materi_bank_soal)...`)
  const { error: errBankSoal } = await supabase.from('app_settings').upsert({
    key: 'materi_bank_soal',
    value: bankSoal,
    updated_at: new Date().toISOString()
  })
  if (errBankSoal) console.error('Error bank soal:', errBankSoal)
  else console.log('✅ Bank Soal successfully uploaded to cloud!')

  // 3. Website Content
  console.log('Uploading default website content to app_settings(website_content)...')
  const { error: errWeb } = await supabase.from('app_settings').upsert({
    key: 'website_content',
    value: DEFAULT_WEBSITE_CONTENT,
    updated_at: new Date().toISOString()
  })
  if (errWeb) console.error('Error website content:', errWeb)
  else console.log('✅ Website content successfully uploaded to cloud!')

  // 4. Template Columns
  console.log('Uploading template columns config to app_settings(template_columns_config)...')
  const { error: errTemplate } = await supabase.from('app_settings').upsert({
    key: 'template_columns_config',
    value: DEFAULT_STANDARD_EXCEL_COLUMNS,
    updated_at: new Date().toISOString()
  })
  if (errTemplate) console.error('Error template columns:', errTemplate)
  else console.log('✅ Template columns config successfully uploaded to cloud!')

  console.log('Finished seeding cloud data!')
}

main().catch(console.error)
