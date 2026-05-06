import { createContext, useContext, useCallback, useState, useEffect, useMemo, useRef } from 'react'
import { useFileParser } from '../hooks/useFileParser'
import { useFraudTests } from '../hooks/useFraudTests'

function parseDate(value) {
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  if (typeof value === 'number' && value > 0) {
    return new Date(Math.round((value - 25569) * 86400 * 1000))
  }
  if (typeof value === 'string' && value.trim()) {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

const AuditContext = createContext(null)

export function AuditProvider({ children }) {
  const [loadedSessionName, setLoadedSessionName] = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [resultsDirty, setResultsDirty] = useState(false)

  const {
    file, rows, headers, missingColumns, columnMap, dataIssues,
    loading, fileError, parseError,
    processFile, reset: resetFile,
  } = useFileParser()

  const {
    flaggedEntries, hasRun, isRunning,
    runTests, reset: resetTests, summary, loadResults,
  } = useFraudTests()

  // Keep a ref that's always current so the date-change effect can read it without being a dep
  const hasRunRef = useRef(false)
  useEffect(() => { hasRunRef.current = hasRun }, [hasRun])

  // Filter rows by posting date range
  const filteredRows = useMemo(() => {
    if (!dateFrom && !dateTo) return rows
    const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : null
    const to   = dateTo   ? new Date(dateTo   + 'T23:59:59') : null
    return rows.filter(row => {
      const d = parseDate(row['Posting Date'])
      if (!d) return true  // rows without a parseable date are always included
      if (from && d < from) return false
      if (to   && d > to)   return false
      return true
    })
  }, [rows, dateFrom, dateTo])

  // Min / max posting dates from the full (unfiltered) dataset — used for picker hints
  const dataDateRange = useMemo(() => {
    if (!rows.length) return null
    let min = null, max = null
    for (const row of rows) {
      const d = parseDate(row['Posting Date'])
      if (!d) continue
      if (!min || d < min) min = d
      if (!max || d > max) max = d
    }
    return min ? { min, max } : null
  }, [rows])

  // Wrap runTests so it clears the dirty flag at the same time
  const runAudit = useCallback((rowsToRun) => {
    setResultsDirty(false)
    runTests(rowsToRun)
  }, [runTests])

  // Auto-run when a valid file is fully parsed (or when filteredRows change and nothing has run yet)
  useEffect(() => {
    if (!loading && filteredRows.length > 0 && missingColumns.length === 0 && !hasRun && !isRunning) {
      runAudit(filteredRows)
    }
  }, [loading, filteredRows, missingColumns, hasRun, isRunning, runAudit])

  // Mark results stale whenever the date filter changes after tests have already run
  useEffect(() => {
    if (hasRunRef.current) {
      setResultsDirty(true)
    }
  }, [dateFrom, dateTo])

  const handleReset = useCallback(() => {
    resetFile()
    resetTests()
    setLoadedSessionName(null)
    setDateFrom('')
    setDateTo('')
    setResultsDirty(false)
    hasRunRef.current = false
  }, [resetFile, resetTests])

  const loadSession = useCallback((session) => {
    resetFile()
    loadResults(session.flaggedEntries, session.summary.total)
    setLoadedSessionName(session.fileName)
    setDateFrom('')
    setDateTo('')
    setResultsDirty(false)
  }, [resetFile, loadResults])

  return (
    <AuditContext.Provider value={{
      file, rows, headers, missingColumns, columnMap, dataIssues,
      loading, fileError, parseError, processFile,
      flaggedEntries, hasRun, isRunning, runTests: runAudit, summary,
      handleReset, loadSession, loadedSessionName,
      dateFrom, dateTo, setDateFrom, setDateTo,
      filteredRows, dataDateRange, resultsDirty,
    }}>
      {children}
    </AuditContext.Provider>
  )
}

export function useAudit() {
  return useContext(AuditContext)
}
