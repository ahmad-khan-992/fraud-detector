import { useState, useCallback } from 'react'

const STORAGE_KEY = 'je_audit_sessions'
const MAX_SESSIONS = 5

export function useReportStorage() {
  const [savedSessions, setSavedSessions] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const saveSession = useCallback((summary, flaggedEntries, fileName) => {
    const session = {
      id: Date.now(),
      savedAt: new Date().toISOString(),
      fileName: fileName || 'Untitled',
      summary,
      flaggedEntries,
    }
    setSavedSessions(prev => {
      const next = [session, ...prev].slice(0, MAX_SESSIONS)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
    return session.id
  }, [])

  const deleteSession = useCallback((id) => {
    setSavedSessions(prev => {
      const next = prev.filter(r => r.id !== id)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { savedSessions, saveSession, deleteSession }
}
