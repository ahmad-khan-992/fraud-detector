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
  const [dateTo, setDateTo]     = useState('')
  const [holidays, setHolidays] = useState([])  // array of 'YYYY-MM-DD' strings
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

  const hasRunRef = useRef(false)
  useEffect(() => { hasRunRef.current = hasRun }, [hasRun])

  // Filter rows by posting date range
  const filteredRows = useMemo(() => {
    if (!dateFrom && !dateTo) return rows
    const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : null
    const to   = dateTo   ? new Date(dateTo   + 'T23:59:59') : null
    return rows.filter(row => {
      const d = parseDate(row['Posting Date'])
      if (!d) return true
      if (from && d < from) return false
      if (to   && d > to)   return false
      return true
    })
  }, [rows, dateFrom, dateTo])

  // Min / max posting dates from the full dataset — for picker hints
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

  // Holiday helpers exposed to components
  const addHoliday = useCallback((dateStr) => {
    setHolidays(prev => prev.includes(dateStr) ? prev : [...prev, dateStr].sort())
  }, [])

  const removeHoliday = useCallback((dateStr) => {
    setHolidays(prev => prev.filter(d => d !== dateStr))
  }, [])

  const clearHolidays = useCallback(() => setHolidays([]), [])

  // Wrap runTests: clears dirty flag and passes current options
  const runAudit = useCallback((rowsToRun) => {
    setResultsDirty(false)
    runTests(rowsToRun, { holidayDates: new Set(holidays) })
  }, [runTests, holidays])

  // Auto-run when a valid file is parsed (or filteredRows change with nothing run yet)
  useEffect(() => {
    if (!loading && filteredRows.length > 0 && missingColumns.length === 0 && !hasRun && !isRunning) {
      runAudit(filteredRows)
    }
  }, [loading, filteredRows, missingColumns, hasRun, isRunning, runAudit])

  // Mark results stale when date filter OR holidays change after tests have run
  useEffect(() => {
    if (hasRunRef.current) setResultsDirty(true)
  }, [dateFrom, dateTo, holidays])

  const handleReset = useCallback(() => {
    resetFile()
    resetTests()
    setLoadedSessionName(null)
    setDateFrom('')
    setDateTo('')
    setHolidays([])
    setResultsDirty(false)
    hasRunRef.current = false
  }, [resetFile, resetTests])

  const loadSession = useCallback((session) => {
    resetFile()
    loadResults(session.flaggedEntries, session.summary.total)
    setLoadedSessionName(session.fileName)
    setDateFrom('')
    setDateTo('')
    setHolidays([])
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
      holidays, addHoliday, removeHoliday, clearHolidays,
    }}>
      {children}
    </AuditContext.Provider>
  )
}

export function useAudit() {
  return useContext(AuditContext)
}
