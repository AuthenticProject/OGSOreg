import {
  studentRepository,
  CANONICAL_INSTITUTION_ID,
  getDeletedStudentKeys,
  isStudentRecordId
} from '../src/services/studentRepository'
import { validateAllStagedRows } from '../src/services/validationEngine'
import { supabase } from '../src/lib/supabase'
import { cloudSyncService } from '../src/services/supabase/cloudSyncService'

async function runVerification() {
  console.log('======================================================')
  console.log('STARTING FULL VERIFICATION OF STUDENT REGISTRATION FIX')
  console.log('======================================================')

  const uniqueSuffix = Date.now().toString().slice(-6)
  const testUsername = `santri_test_${uniqueSuffix}`
  const testEmail = `santri_test_${uniqueSuffix}@gontor.ac.id`

  // Pre-cleanup of any stray tombstones in cloud setting
  const cloudTombstones = await cloudSyncService.getCloudSetting<string[]>('deleted_students', [])
  const cleanedTombstones = (cloudTombstones || []).filter(isStudentRecordId)
  if (cleanedTombstones.length !== cloudTombstones.length) {
    await cloudSyncService.saveCloudSetting('deleted_students', cleanedTombstones)
  }
  console.log('Sanitized cloud tombstones count:', cleanedTombstones.length)

  // Sync state
  await studentRepository.syncWithSupabase()

  // -------------------------------------------------------------
  // SCENARIO 1: Register a new student
  // -------------------------------------------------------------
  console.log(`\n--- SCENARIO 1: Register a new student (${testUsername}) ---`)
  const reg1 = await studentRepository.saveStudent({
    username: testUsername,
    firstname: 'Muhammad',
    lastname: 'Zaid',
    email: testEmail,
    jenjang: 'Kelas 1',
    kelas: '1-B',
    kampus: 'Gontor 1',
  }, CANONICAL_INSTITUTION_ID, 'admin-pusat')

  console.log('Scenario 1 Result:', {
    success: reg1.success,
    id: reg1.student?.id,
    error: reg1.error,
  })
  if (!reg1.success || !reg1.student?.id) {
    throw new Error('Scenario 1 failed: could not register student')
  }
  const reg1Id = reg1.student.id

  // Verify visible in directory
  const view1 = await studentRepository.getStudents({
    institutionId: CANONICAL_INSTITUTION_ID,
    search: testUsername,
  })
  console.log('Student visible in directory:', view1.data.some(s => s.username === testUsername && s.id === reg1Id))
  if (view1.data.length !== 1) {
    throw new Error('Scenario 1 failed: student not found in getStudents query')
  }

  // -------------------------------------------------------------
  // SCENARIO 2: Delete that student
  // -------------------------------------------------------------
  console.log(`\n--- SCENARIO 2: Delete that student (ID: ${reg1Id}) ---`)
  const delSuccess = await studentRepository.deleteStudent(reg1Id, CANONICAL_INSTITUTION_ID)
  console.log('Delete operation returned:', delSuccess)

  // Verify deleted from directory
  const viewAfterDel = await studentRepository.getStudents({
    institutionId: CANONICAL_INSTITUTION_ID,
    search: testUsername,
  })
  console.log('Student count in directory after deletion:', viewAfterDel.data.length)
  if (viewAfterDel.data.length !== 0) {
    throw new Error('Scenario 2 failed: student was not deleted from directory')
  }

  // Verify tombstone stores ONLY the ID, not the username
  const tombstonesAfterDel = getDeletedStudentKeys()
  console.log('Tombstone contains ID?:', tombstonesAfterDel.has(reg1Id.toLowerCase()))
  console.log('Tombstone contains username?:', tombstonesAfterDel.has(testUsername.toLowerCase()))
  if (tombstonesAfterDel.has(testUsername.toLowerCase())) {
    throw new Error('Scenario 2 failed: username must NOT be tombstoned')
  }
  if (!tombstonesAfterDel.has(reg1Id.toLowerCase())) {
    throw new Error('Scenario 2 failed: physical record ID must be tombstoned')
  }

  // Verify registered list no longer has the deleted username or email
  const registeredAfterDel = studentRepository.getAllRegisteredUsernamesAndEmails()
  console.log('Registered usernames has testUsername?:', registeredAfterDel.usernames.has(testUsername))
  console.log('Registered emails has testEmail?:', registeredAfterDel.emails.has(testEmail))
  if (registeredAfterDel.usernames.has(testUsername) || registeredAfterDel.emails.has(testEmail)) {
    throw new Error('Scenario 2 failed: deleted student is still in registered usernames/emails')
  }

  // -------------------------------------------------------------
  // SCENARIO 3: Register the same student again manually with corrected info
  // -------------------------------------------------------------
  console.log(`\n--- SCENARIO 3: Register same student again manually with corrected info ---`)
  const reg2 = await studentRepository.saveStudent({
    username: testUsername, // SAME identity / username
    firstname: 'Muhammad',
    lastname: 'Zaid Al-Anshari', // Corrected name
    email: testEmail, // SAME email
    jenjang: 'Kelas 2', // Corrected jenjang
    kelas: '2-C', // Corrected class
    kampus: 'Gontor 2', // Corrected campus
  }, CANONICAL_INSTITUTION_ID, 'admin-pusat')

  console.log('Scenario 3 Result:', {
    success: reg2.success,
    id: reg2.student?.id,
    error: reg2.error,
  })
  if (!reg2.success || !reg2.student?.id) {
    throw new Error(`Scenario 3 failed: manual re-registration rejected with error: ${reg2.error}`)
  }
  const reg2Id = reg2.student.id
  console.log('New Record ID differs from old deleted ID?:', reg2Id !== reg1Id)

  // Run cloud sync to ensure multi-device sync does not delete the newly registered student!
  await studentRepository.syncWithSupabase()

  const view3 = await studentRepository.getStudents({
    institutionId: CANONICAL_INSTITUTION_ID,
    search: testUsername,
  })
  console.log('Directory after manual re-registration count:', view3.data.length)
  console.log('Corrected student data in directory:', view3.data.map(s => ({
    id: s.id,
    username: s.username,
    name: s.full_name,
    kelas: s.kelas,
    kampus: s.kampus,
  })))
  if (view3.data.length !== 1 || view3.data[0].kelas !== '2-C' || view3.data[0].id !== reg2Id) {
    throw new Error('Scenario 3 failed: corrected student is missing or incorrect in directory')
  }

  // -------------------------------------------------------------
  // SCENARIO 4: Repeat the process using Excel import
  // -------------------------------------------------------------
  console.log(`\n--- SCENARIO 4: Repeat the process using Excel import ---`)
  // First, delete the re-registered student again
  console.log(`Deleting student record ID: ${reg2Id}...`)
  const del2Success = await studentRepository.deleteStudent(reg2Id, CANONICAL_INSTITUTION_ID)
  console.log('Delete 2 success:', del2Success)

  // Verify deletion
  const viewAfterDel2 = await studentRepository.getStudents({
    institutionId: CANONICAL_INSTITUTION_ID,
    search: testUsername,
  })
  console.log('Directory count after second delete:', viewAfterDel2.data.length)
  if (viewAfterDel2.data.length !== 0) {
    throw new Error('Scenario 4 failed: student was not deleted prior to Excel import')
  }

  // Validate Excel row for re-registering the deleted student
  console.log('Validating Excel row for deleted student identity...')
  const excelValidation = validateAllStagedRows([{
    _rowId: 'row-excel-test-1',
    _rowIndex: 2,
    _status: 'VALID',
    _errors: {},
    _warnings: {},
    _isDuplicate: false,
    username: testUsername,
    firstname: 'Muhammad',
    lastname: 'Zaid Excel',
    email: testEmail,
    jenjang: 'Kelas 2',
    kelas: '2-C',
    kampus: 'Gontor 2',
    no: '1',
    full_name: 'Muhammad Zaid Excel',
    nisn: '1234567890',
    gender: 'L',
    grade_level: 'Kelas 2',
    school_name: 'KMI Gontor 2',
    competition_category: 'Sains',
    teacher_name: 'Ustadz Ahmad',
    custom_fields: { daerah: 'Jawa Timur', stambuk: '98765' },
  }])

  const stagedRow = excelValidation.stagedRows[0]
  console.log('Excel Staged Row Status:', stagedRow._status)
  console.log('Excel Staged Row isDuplicate:', stagedRow._isDuplicate)
  console.log('Excel Staged Row Errors:', stagedRow._errors)
  if (stagedRow._isDuplicate || stagedRow._errors['username'] || stagedRow._errors['email']) {
    throw new Error('Scenario 4 failed: Excel validation incorrectly flagged deleted student as duplicate')
  }

  // Now execute bulkSaveStudents (Excel import pipeline persistence)
  const bulkResult = await studentRepository.bulkSaveStudents([{
    username: testUsername,
    firstname: 'Muhammad',
    lastname: 'Zaid Excel',
    email: testEmail,
    jenjang: 'Kelas 2',
    kelas: '2-C',
    kampus: 'Gontor 2',
    custom_fields: { daerah: 'Jawa Timur', stambuk: '98765' },
  }], CANONICAL_INSTITUTION_ID, 'admin-pusat', 'excel')

  console.log('Bulk Save Result:', {
    savedCount: bulkResult.savedCount,
    duplicatesCount: bulkResult.duplicatesCount,
    errorsCount: bulkResult.errorsCount,
    duplicateDetails: bulkResult.duplicateDetails,
  })
  if (bulkResult.savedCount !== 1) {
    throw new Error(`Scenario 4 failed: bulkSaveStudents failed to import: ${JSON.stringify(bulkResult)}`)
  }

  // Verify in getStudents after Excel import
  await studentRepository.syncWithSupabase()
  const view4 = await studentRepository.getStudents({
    institutionId: CANONICAL_INSTITUTION_ID,
    search: testUsername,
  })
  console.log('Visible in getStudents after Excel import:', view4.data.map(s => ({
    id: s.id,
    username: s.username,
    name: s.full_name,
    source: s.source,
  })))
  if (view4.data.length !== 1 || view4.data[0].username !== testUsername) {
    throw new Error('Scenario 4 failed: student missing from directory after Excel import')
  }

  // -------------------------------------------------------------
  // SCENARIO 5: Attempt to register an already-active student again (duplicate protection check)
  // -------------------------------------------------------------
  console.log('\n--- SCENARIO 5: Duplicate Protection Test on Active Student ---')
  // 5a. Manual registration attempt of active student
  console.log('5a. Testing manual registration duplicate rejection...')
  const dupManual = await studentRepository.saveStudent({
    username: testUsername, // already active!
    firstname: 'Impostor',
    lastname: 'Student',
    email: 'impostor@gontor.ac.id',
    jenjang: 'Kelas 1',
    kelas: '1-A',
    kampus: 'Gontor 1',
  }, CANONICAL_INSTITUTION_ID, 'admin-pusat')

  console.log('Manual duplicate rejected?:', !dupManual.success, dupManual.error)
  if (dupManual.success) {
    throw new Error('Scenario 5 failed: duplicate active username was incorrectly allowed manually!')
  }

  // 5b. Manual registration attempt with duplicate email
  console.log('5b. Testing manual registration duplicate email rejection...')
  const dupEmailManual = await studentRepository.saveStudent({
    username: `unique_user_${Date.now()}`,
    firstname: 'Impostor 2',
    lastname: 'Student',
    email: testEmail, // duplicate email of active student!
    jenjang: 'Kelas 1',
    kelas: '1-A',
    kampus: 'Gontor 1',
  }, CANONICAL_INSTITUTION_ID, 'admin-pusat')

  console.log('Manual duplicate email rejected?:', !dupEmailManual.success, dupEmailManual.error)
  if (dupEmailManual.success) {
    throw new Error('Scenario 5 failed: duplicate active email was incorrectly allowed manually!')
  }

  // 5c. Excel Import validation attempt of active student
  console.log('5c. Testing Excel validation duplicate rejection...')
  const dupExcelVal = validateAllStagedRows([{
    _rowId: 'row-excel-dup-1',
    _rowIndex: 2,
    _status: 'VALID',
    _errors: {},
    _warnings: {},
    _isDuplicate: false,
    username: testUsername, // already active!
    firstname: 'Impostor Excel',
    lastname: 'Student',
    email: 'new_unique_email@gontor.ac.id',
    jenjang: 'Kelas 2',
    kelas: '2-C',
    kampus: 'Gontor 2',
    no: '1',
    full_name: 'Impostor Excel',
    nisn: '9999999999',
    gender: 'L',
    grade_level: 'Kelas 2',
    school_name: 'KMI Gontor 2',
    competition_category: 'Sains',
    teacher_name: 'Ustadz',
    custom_fields: { daerah: 'Jawa Timur', stambuk: '11111' },
  }])

  const dupStagedRow = dupExcelVal.stagedRows[0]
  console.log('Excel duplicate flagged isDuplicate?:', dupStagedRow._isDuplicate)
  console.log('Excel duplicate username error:', dupStagedRow._errors['username'])
  if (!dupStagedRow._isDuplicate || !dupStagedRow._errors['username']) {
    throw new Error('Scenario 5 failed: Excel validation did not flag active student as duplicate!')
  }

  // 5d. Excel bulkSaveStudents duplicate rejection
  console.log('5d. Testing bulkSaveStudents duplicate rejection...')
  const dupBulk = await studentRepository.bulkSaveStudents([{
    username: testUsername, // already active!
    firstname: 'Impostor Bulk',
    lastname: 'Student',
    email: 'impostor_bulk@gontor.ac.id',
    jenjang: 'Kelas 2',
    kelas: '2-C',
    kampus: 'Gontor 2',
  }], CANONICAL_INSTITUTION_ID, 'admin-pusat', 'excel')

  console.log('bulkSaveStudents duplicate detected?:', dupBulk.duplicatesCount === 1, dupBulk.duplicateDetails)
  if (dupBulk.savedCount !== 0 || dupBulk.duplicatesCount !== 1) {
    throw new Error('Scenario 5 failed: bulkSaveStudents allowed duplicate active student!')
  }

  // Post-test cleanup
  console.log('\n--- Cleaning up test records ---')
  const finalClean = await studentRepository.getStudents({
    institutionId: CANONICAL_INSTITUTION_ID,
    search: testUsername,
  })
  if (finalClean.data.length > 0) {
    await studentRepository.deleteStudent(finalClean.data[0].id, CANONICAL_INSTITUTION_ID)
  }
  await supabase.from('students').delete().eq('username', testUsername)

  console.log('\n======================================================')
  console.log('ALL 5 VERIFICATION SCENARIOS PASSED PERFECTLY!')
  console.log('======================================================')
  process.exit(0)
}

runVerification().catch((err) => {
  console.error('\nVERIFICATION FAILED:', err)
  process.exit(1)
})
