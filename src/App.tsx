import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppShell } from './components/layout/AppShell'

// Existing Pages
import { DashboardPage } from './pages/DashboardPage'
import { BatchesPage } from './pages/BatchesPage'
import { StudentsPage } from './pages/StudentsPage'
import { TeachersPage } from './pages/TeachersPage'
import { SchoolsPage } from './pages/SchoolsPage'
import { ImportWizardPage } from './pages/ImportWizardPage'
import { ExportStationPage } from './pages/ExportStationPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { CustomFieldsPage } from './pages/CustomFieldsPage'
import { UsersManagementPage } from './pages/UsersManagementPage'
import { LoginPage } from './pages/LoginPage'

// New Restructured Module Pages
import { IncomingRegistrationsPage } from './pages/IncomingRegistrationsPage'
import { PeriodListPage } from './pages/PeriodListPage'
import { PeriodDetailPage } from './pages/PeriodDetailPage'
import { SilabusPage } from './pages/SilabusPage'
import { BankSoalPage } from './pages/BankSoalPage'
import { AccountSettingsPage } from './pages/AccountSettingsPage'
import { CertificateVerifyPage } from './pages/CertificateVerifyPage'

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Main App Shell (Supports Authenticated Dashboard & Guest Access for Public Routes) */}
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* 1. PENDAFTARAN */}
            <Route path="/imports" element={<ImportWizardPage />} />
            <Route path="/pendaftaran/kolektif" element={<Navigate to="/imports" replace />} />
            <Route path="/pendaftaran/masuk" element={<IncomingRegistrationsPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/pendaftaran/siswa-saya" element={<Navigate to="/students" replace />} />
            <Route path="/batches" element={<BatchesPage />} />
            <Route path="/pendaftaran/riwayat" element={<Navigate to="/batches" replace />} />
            <Route path="/history" element={<Navigate to="/batches" replace />} />
            <Route path="/registrations" element={<Navigate to="/batches" replace />} />
            <Route path="/custom-fields" element={<CustomFieldsPage />} />
            <Route
              path="/pendaftaran/pengaturan-kolom"
              element={<Navigate to="/custom-fields?tab=excel" replace />}
            />
            <Route
              path="/pendaftaran/mapping-moodle"
              element={<Navigate to="/custom-fields?tab=moodle" replace />}
            />
            <Route path="/exports" element={<ExportStationPage />} />
            <Route path="/reports" element={<ReportsPage />} />

            {/* Legacy & Supplemental routes preserved */}
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/schools" element={<SchoolsPage />} />
            <Route path="/participants" element={<Navigate to="/students" replace />} />

            {/* 2. PARTICIPANT */}
            <Route path="/participant" element={<Navigate to="/participant/periode" replace />} />
            <Route path="/participant/periode" element={<PeriodListPage />} />
            <Route path="/participant/periode/:periodId" element={<PeriodDetailPage />} />
            {/* Backward-compatible redirects for previous E-Certificate menu */}
            <Route path="/e-certificate" element={<Navigate to="/participant/periode" replace />} />
            <Route path="/e-certificate/*" element={<Navigate to="/participant/periode" replace />} />
            <Route path="/certificates" element={<Navigate to="/participant/periode" replace />} />

            {/* 3. MATERI (Publicly accessible without login) */}
            <Route path="/materi" element={<Navigate to="/materi/silabus" replace />} />
            <Route path="/materi/silabus" element={<SilabusPage />} />
            <Route path="/materi/bank-soal" element={<BankSoalPage />} />
            <Route path="/bank-soal" element={<Navigate to="/materi/bank-soal" replace />} />
            <Route path="/silabus" element={<Navigate to="/materi/silabus" replace />} />

            {/* 4. VERIFIKASI SERTIFIKAT (Publicly accessible without login) */}
            <Route path="/verify" element={<CertificateVerifyPage />} />
            <Route path="/verify/:certificateId" element={<CertificateVerifyPage />} />
            <Route path="/sertifikat" element={<Navigate to="/verify" replace />} />
            <Route path="/sertifikat/:certificateId" element={<Navigate to="/verify" replace />} />

            {/* 5. PENGATURAN */}
            <Route path="/pengaturan" element={<Navigate to="/pengaturan/akun" replace />} />
            <Route path="/users" element={<UsersManagementPage />} />
            <Route path="/pengaturan/pengguna" element={<Navigate to="/users" replace />} />
            <Route path="/pengaturan/akun" element={<AccountSettingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/pengaturan/umum" element={<Navigate to="/settings" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
