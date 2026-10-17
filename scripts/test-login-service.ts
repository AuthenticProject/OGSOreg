import { accountService } from '../src/services/accountService'

async function testLoginService() {
  console.log('Testing accountService.loginWithUsername...')

  // 1. Test Super Admin login
  const resAdmin = await accountService.loginWithUsername('admin', 'OGSOreg_SuperAdmin2026!')
  console.log('Admin login success:', resAdmin.success)
  console.log('Admin profile:', resAdmin.profile?.username, resAdmin.profile?.role, resAdmin.profile?.display_name)
  console.log('Admin error:', resAdmin.error)

  // 2. Test Campus Admin login (e.g. gontor1)
  const resG1 = await accountService.loginWithUsername('gontor1', 'OGSO2026')
  console.log('\nGontor1 login success:', resG1.success)
  console.log('Gontor1 profile:', resG1.profile?.username, resG1.profile?.role, resG1.profile?.campus_id)
  console.log('Gontor1 error:', resG1.error)

  if (resAdmin.success && resG1.success) {
    console.log('\n✅ ALL LOGIN TESTS PASSED!')
  } else {
    console.error('\n❌ LOGIN TEST FAILED')
    process.exit(1)
  }
}

testLoginService().catch((err) => {
  console.error(err)
  process.exit(1)
})
