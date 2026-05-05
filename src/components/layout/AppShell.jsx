import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAudit } from '../../context/AuditContext'
import { useReportStorage } from '../../hooks/useReportStorage'

export default function AppShell() {
  const { summary, flaggedEntries, hasRun, file, loadedSessionName } = useAudit()
  const { savedSessions, saveSession, deleteSession } = useReportStorage()
  const [toast, setToast] = useState(null)

  const canSave = hasRun && (!!file || !!loadedSessionName)

  const handleSave = useCallback(() => {
    if (!hasRun) return
    const fileName = file?.name || loadedSessionName || 'Audit Report'
    saveSession(summary, flaggedEntries, fileName)
    setToast('Session saved successfully')
    setTimeout(() => setToast(null), 3000)
  }, [summary, flaggedEntries, hasRun, file, loadedSessionName, saveSession])

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar savedSessionCount={savedSessions.length} />

      <div className="ml-60">
        <Topbar onSave={handleSave} canSave={canSave} />

        <main className="pt-16 min-h-screen">
          <div className="p-6 page-enter">
            <Outlet context={{ savedSessions, deleteSession }} />
          </div>
        </main>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 text-white rounded-xl shadow-xl text-sm font-medium animate-slide-up no-print">
          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  )
}
