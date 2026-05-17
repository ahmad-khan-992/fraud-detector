import { createContext, useContext, useCallback, useState, useEffect, useMemo, useRef } from 'react'
import { useFileParser } from '../hooks/useFileParser'
import { useFraudTests } from '../hooks/useFraudTests'
import { groupIntoTransactions } from '../utils/doubleEntry'
import { DOUBLE_ENTRY_COLUMNS } from '../utils/columnConfig'

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
  const [holidays, setHolidays] = useState([])
  const [maxAmount, setMaxAmount] = useState('')
  const [resultsDirty, setResultsDirty] = useState(false)
  const [invalidDCCount, setInvalidDCCount] = useState(0)
  const [preFlightError, setPreFlightError] = useState(null)
  const [transactionCount, setTransactionCount] = useState(0)

  const [testConfig, setTestConfig] = useState({
    backdateDays:       5,
    narrationMinLen:    5,
    zScoreThreshold:    3.0,
    splittingThreshold: 10000,
    roundNumberMin:     1000,
  })
  const [offHoursConfig, setOffHoursConfig] = useState({
    startHour: 9,
    startMin:  0,
    endHour:   17,
    endMin:    0,
    workDays:  [1, 2, 3, 4, 5],
    timezone:  '',
  })

  const {
    file, rows, headers, missingColumns, columnMap, dataIssues,
    loading, fileError, parseError, fileWarning,
    sheetNames, selectedSheet, selectSheet, applyManualMapping,
    amountFormat, splitInfo, signConvention, swapSignConvention,
    processFile, reset: resetFile,
  } = useFileParser()

  const {
    flaggedEntries, benfordAnalysis, hasRun, isRunning,
    runTests, reset: resetTests, summary, loadResults,
  } = useFraudTests()

  // Derived: whether the uploaded file has both double-entry columns
  const isDoubleEntry = useMemo(
    () => DOUBLE_ENTRY_COLUMNS.every(col => col in columnMap),
    [columnMap]
  )

  const hasEffectiveDate = useMemo(() => 'Effective Date' in columnMap, [columnMap])

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

  const addHoliday = useCallback((dateStr, label = '') => {
    setHolidays(prev =>
      prev.some(h => h.date === dateStr)
        ? prev
        : [...prev, { date: dateStr, label: label.trim() }].sort((a, b) => a.date < b.date ? -1 : 1)
    )
  }, [])

  const removeHoliday = useCallback((dateStr) => {
    setHolidays(prev => prev.filter(h => h.date !== dateStr))
  }, [])

  const updateHolidayLabel = useCallback((dateStr, label) => {
    setHolidays(prev => prev.map(h => h.date === dateStr ? { ...h, label } : h))
  }, [])

  const clearHolidays = useCallback(() => setHolidays([]), [])

  const runAudit = useCallback((rowsToRun) => {
    setResultsDirty(false)
    const opts = {
      holidayDates: new Set(holidays.map(h => h.date)),
      maxAmount,
      ...testConfig,
      offHoursConfig,
      hasEffectiveDate,
    }

    if (isDoubleEntry) {
      const { transactions, invalidDCRows, validPairCount } = groupIntoTransactions(rowsToRun)
      setInvalidDCCount(invalidDCRows.length)

      if (transactions.length > 0 && validPairCount === 0) {
        // All Journal IDs appear on only one side — fall back to single-line
        setPreFlightError('No valid double-entry pairs found. Every Journal ID appears on only one side. Running in single-line mode.')
        setTransactionCount(0)
        runTests(rowsToRun, { ...opts, isDoubleEntry: false })
      } else {
        setPreFlightError(null)
        setTransactionCount(transactions.length)
        runTests(transactions, { ...opts, isDoubleEntry: true })
      }
    } else {
      setInvalidDCCount(0)
      setPreFlightError(null)
      setTransactionCount(0)
      runTests(rowsToRun, { ...opts, isDoubleEntry: false })
    }
  }, [runTests, holidays, maxAmount, testConfig, offHoursConfig, isDoubleEntry])

  // Auto-run when a valid file is parsed (or filteredRows change with nothing run yet)
  useEffect(() => {
    if (!loading && filteredRows.length > 0 && missingColumns.length === 0 && !hasRun && !isRunning) {
      runAudit(filteredRows)
    }
  }, [loading, filteredRows, missingColumns, hasRun, isRunning, runAudit])

  // Mark results stale when any filter or config changes after tests have run
  useEffect(() => {
    if (hasRunRef.current) setResultsDirty(true)
  }, [dateFrom, dateTo, holidays, maxAmount, testConfig, offHoursConfig, signConvention])

  const handleReset = useCallback(() => {
    resetFile()
    resetTests()
    setLoadedSessionName(null)
    setDateFrom('')
    setDateTo('')
    setHolidays([])
    setMaxAmount('')
    setOffHoursConfig({ startHour: 9, startMin: 0, endHour: 17, endMin: 0, workDays: [1, 2, 3, 4, 5], timezone: '' })
    setResultsDirty(false)
    setInvalidDCCount(0)
    setPreFlightError(null)
    setTransactionCount(0)
    hasRunRef.current = false
    // Note: signConvention persists in sessionStorage intentionally
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
      loading, fileError, parseError, fileWarning, processFile,
      sheetNames, selectedSheet, selectSheet, applyManualMapping,
      flaggedEntries, benfordAnalysis, hasRun, isRunning, runTests: runAudit, summary,
      handleReset, loadSession, loadedSessionName,
      testConfig, setTestConfig,
      offHoursConfig, setOffHoursConfig,
      dateFrom, dateTo, setDateFrom, setDateTo,
      filteredRows, dataDateRange, resultsDirty,
      holidays, addHoliday, removeHoliday, updateHolidayLabel, clearHolidays,
      maxAmount, setMaxAmount,
      isDoubleEntry, invalidDCCount, preFlightError, transactionCount,
      amountFormat, splitInfo, signConvention, swapSignConvention,
      hasEffectiveDate,
    }}>
      {children}
    </AuditContext.Provider>
  )
}

export function useAudit() {
  return useContext(AuditContext)
}
