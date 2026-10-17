import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppShell } from './components/layout/AppShell'
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

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/batches" element={<BatchesPage />} />
            <Route path="/history" element={<Navigate to="/batches" replace />} />
            <Route path="/registrations" element={<Navigate to="/batches" replace />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/participants" element={<Navigate to="/students" replace />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/schools" element={<SchoolsPage />} />
            <Route path="/imports" element={<ImportWizardPage />} />
            <Route path="/exports" element={<ExportStationPage />} />
            <Route path="/custom-fields" element={<CustomFieldsPage />} />
            <Route path="/users" element={<UsersManagementPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
