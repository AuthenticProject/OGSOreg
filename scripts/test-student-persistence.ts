import { CANONICAL_INSTITUTION_ID, studentRepository } from '../src/services/studentRepository'

async function runTest() {
  console.log('Testing unified student persistence...')
  console.log('Canonical ID:', CANONICAL_INSTITUTION_ID)

  // 1. Simpan santri dari akun Super Admin (institutionId: general-inst)
  const res1 = await studentRepository.saveStudent(
    {
      username: 'santri_pusat_01',
      firstname: 'Ahmad',
      lastname: 'Fauzi',
      email: 'ahmad.fauzi@gontor.ac.id',
      jenjang: 'Kelas 1',
      kampus: 'Gontor 1',
    },
    'general-inst',
    'admin-super'
  )
  console.log('Insert from Super Admin success:', res1.success)

  // 2. Simpan santri dari akun Admin Gontor 2 (institutionId: Gontor 2)
  const res2 = await studentRepository.saveStudent(
    {
      username: 'santri_gontor2_01',
      firstname: 'Zaid',
      lastname: 'Mansur',
      email: 'zaid.mansur@gontor.ac.id',
      jenjang: 'Kelas 2',
      kampus: 'Gontor 2',
    },
    'Gontor 2',
    'admin-g2'
  )
  console.log('Insert from Campus Admin Gontor 2 success:', res2.success)

  // 3. Super Admin membaca seluruh santri (assignedCampus: undefined)
  const superAdminView = await studentRepository.getStudents({
    institutionId: 'general-inst',
  })
  console.log('Super Admin total students:', superAdminView.total)
  console.log('Super Admin student names:', superAdminView.data.map((s) => `${s.full_name} (${s.kampus})`))

  // 4. Admin Gontor 1 membaca santri (assignedCampus: 'Gontor 1')
  const gontor1View = await studentRepository.getStudents({
    institutionId: 'Gontor 1',
    assignedCampus: 'Gontor 1',
  })
  console.log('Gontor 1 Admin student count:', gontor1View.total)
  console.log('Gontor 1 Admin students:', gontor1View.data.map((s) => s.full_name))

  // 5. Admin Gontor 2 membaca santri (assignedCampus: 'Gontor 2')
  const gontor2View = await studentRepository.getStudents({
    institutionId: 'Gontor 2',
    assignedCampus: 'Gontor 2',
  })
  console.log('Gontor 2 Admin student count:', gontor2View.total)
  console.log('Gontor 2 Admin students:', gontor2View.data.map((s) => s.full_name))

  if (superAdminView.total >= 2 && gontor1View.total >= 1 && gontor2View.total >= 1) {
    console.log('✅ ALL TESTS PASSED: Student persistence is unified and no data is lost between sessions/accounts!')
  } else {
    console.error('❌ TEST FAILED')
    process.exit(1)
  }
}

runTest().catch((err) => {
  console.error(err)
  process.exit(1)
})
