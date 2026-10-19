import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppShell } from './components/layout/AppShell'
import { PublicLayout } from './components/public/PublicLayout'
import { ErrorBoundary } from './components/feedback/ErrorBoundary'

// Public Website Pages
import { HomePage } from './pages/public/HomePage'
import { AboutPage } from './pages/public/AboutPage'
import { RegistrationInfoPage } from './pages/public/RegistrationInfoPage'
import { PublicParticipantPage } from './pages/public/PublicParticipantPage'
import { PublicPeriodDetailPage } from './pages/public/PublicPeriodDetailPage'

// Existing Dashboard Pages
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

// Module Pages (shared / authenticated)
import { IncomingRegistrationsPage } from './pages/IncomingRegistrationsPage'
import { PeriodListPage } from './pages/PeriodListPage'
import { PeriodDetailPage } from './pages/PeriodDetailPage'
import { SilabusPage } from './pages/SilabusPage'
import { BankSoalPage } from './pages/BankSoalPage'
import { AccountSettingsPage } from './pages/AccountSettingsPage'
import { CertificateVerifyPage } from './pages/CertificateVerifyPage'

// Wrapper for public standalone material pages with standard layout container
const PublicContentWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
    {children}
  </div>
)

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ============================================================== */}
          {/* 1. PUBLIC WEBSITE (OGSO — Gontor Science Olympiad)            */}
          {/*    Accessible without authentication                            */}
          {/* ============================================================== */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/tentang" element={<AboutPage />} />
            <Route path="/pendaftaran" element={<RegistrationInfoPage />} />

            {/* Public Competition Periods & Published Winners */}
            <Route path="/participant" element={<PublicParticipantPage />} />
            <Route path="/participant/:periodId" element={<PublicPeriodDetailPage />} />

            {/* Public Syllabus & Question Bank */}
            <Route path="/materi" element={<Navigate to="/materi/silabus" replace />} />
            <Route
              path="/materi/silabus"
              element={
                <PublicContentWrapper>
                  <SilabusPage />
                </PublicContentWrapper>
              }
            />
            <Route
              path="/materi/bank-soal"
              element={
                <PublicContentWrapper>
                  <BankSoalPage />
                </PublicContentWrapper>
              }
            />
            <Route path="/silabus" element={<Navigate to="/materi/silabus" replace />} />
            <Route path="/bank-soal" element={<Navigate to="/materi/bank-soal" replace />} />

            {/* Certificate Verification (Official JUKLAK / Winner Validation) */}
            <Route path="/verify" element={<CertificateVerifyPage />} />
            <Route path="/verify/:certificateId" element={<CertificateVerifyPage />} />
            <Route path="/sertifikat" element={<Navigate to="/verify" replace />} />
            <Route path="/sertifikat/:certificateId" element={<Navigate to="/verify" replace />} />
          </Route>

          {/* ============================================================== */}
          {/* 2. AUTHENTICATION (Admin Login)                                */}
          {/* ============================================================== */}
          <Route path="/login" element={<LoginPage />} />

          {/* ============================================================== */}
          {/* 3. ADMINISTRATIVE DASHBOARD (OGSOreg)                         */}
          {/*    Guarded: strictly requires authenticated session            */}
          {/* ============================================================== */}
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* 1. PENDAFTARAN KOLEKTIF */}
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

            {/* 2. PARTICIPANT MANAGEMENT (ADMIN DASHBOARD) */}
            <Route path="/participant/periode" element={<PeriodListPage />} />
            <Route
              path="/participant/periode/:periodId"
              element={
                <ErrorBoundary
                  fallbackTitle="Kendala Memuat Detail Periode"
                  fallbackMessage="Terjadi kendala saat memuat data periode atau pemenang. Klik coba lagi untuk menyegarkan data."
                >
                  <PeriodDetailPage />
                </ErrorBoundary>
              }
            />
            {/* Backward-compatible redirects for previous E-Certificate menu */}
            <Route path="/e-certificate" element={<Navigate to="/participant/periode" replace />} />
            <Route path="/e-certificate/*" element={<Navigate to="/participant/periode" replace />} />
            <Route path="/certificates" element={<Navigate to="/participant/periode" replace />} />

            {/* 3. PENGATURAN */}
            <Route path="/pengaturan" element={<Navigate to="/pengaturan/akun" replace />} />
            <Route path="/users" element={<UsersManagementPage />} />
            <Route path="/pengaturan/pengguna" element={<Navigate to="/users" replace />} />
            <Route path="/pengaturan/akun" element={<AccountSettingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/pengaturan/umum" element={<Navigate to="/settings" replace />} />

            {/* Dashboard fallback */}
            <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch-all global route: redirect to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
