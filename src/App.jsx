import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuditProvider } from './context/AuditContext'
import { LanguageProvider } from './context/LanguageContext'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import AnalyticsPage from './pages/AnalyticsPage'
import ReportPage from './pages/ReportPage'
import SavedSessionsPage from './pages/SavedSessionsPage'

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
      <AuditProvider>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="report" element={<ReportPage />} />
            <Route path="sessions" element={<SavedSessionsPage />} />
          </Route>
        </Routes>
      </AuditProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
