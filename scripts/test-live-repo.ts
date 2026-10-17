import { studentRepository, CANONICAL_INSTITUTION_ID } from '../src/services/studentRepository'

async function testFull() {
  console.log('Testing studentRepository live with Supabase Cloud...')
  console.log('Canonical ID:', CANONICAL_INSTITUTION_ID)

  // 1. Simpan santri uji coba
  const res = await studentRepository.saveStudent(
    {
      username: 'santri_live_test_01',
      firstname: 'Muhammad',
      lastname: 'Fatih',
      email: 'm.fatih@ogso.gontor.ac.id',
      jenjang: 'Kelas 1',
      kampus: 'Gontor 1',
    },
    'general-inst',
    'super-admin'
  )
  console.log('Save student result:', res.success, res.student?.id)

  // 2. Query students
  const list = await studentRepository.getStudents({
    institutionId: 'general-inst',
  })
  console.log('Total students found:', list.total)
  console.log('Students:', list.data.map((s) => `${s.full_name} (${s.kampus}) [${s.id}]`))

  // 3. Bersihkan santri uji coba dari Supabase
  if (res.student?.id) {
    await studentRepository.deleteStudent(res.student.id, CANONICAL_INSTITUTION_ID)
    console.log('Cleanup successful.')
  }
}

testFull().catch(console.error)
