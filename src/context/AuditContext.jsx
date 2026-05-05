import { createContext, useContext, useCallback, useState, useEffect } from 'react'
import { useFileParser } from '../hooks/useFileParser'
import { useFraudTests } from '../hooks/useFraudTests'

const AuditContext = createContext(null)

export function AuditProvider({ children }) {
  const [loadedSessionName, setLoadedSessionName] = useState(null)

  const {
    file, rows, headers, missingColumns, columnMap, dataIssues,
    loading, fileError, parseError,
    processFile, reset: resetFile,
  } = useFileParser()

  const {
    flaggedEntries, hasRun, isRunning,
    runTests, reset: resetTests, summary, loadResults,
  } = useFraudTests()

  // Auto-run tests as soon as a valid file is fully parsed
  useEffect(() => {
    if (!loading && rows.length > 0 && missingColumns.length === 0 && !hasRun && !isRunning) {
      runTests(rows)
    }
  }, [loading, rows, missingColumns, hasRun, isRunning, runTests])

  const handleReset = useCallback(() => {
    resetFile()
    resetTests()
    setLoadedSessionName(null)
  }, [resetFile, resetTests])

  const loadSession = useCallback((session) => {
    resetFile()
    loadResults(session.flaggedEntries, session.summary.total)
    setLoadedSessionName(session.fileName)
  }, [resetFile, loadResults])

  return (
    <AuditContext.Provider value={{
      file, rows, headers, missingColumns, columnMap, dataIssues,
      loading, fileError, parseError, processFile,
      flaggedEntries, hasRun, isRunning, runTests, summary,
      handleReset, loadSession, loadedSessionName,
    }}>
      {children}
    </AuditContext.Provider>
  )
}

export function useAudit() {
  return useContext(AuditContext)
}
