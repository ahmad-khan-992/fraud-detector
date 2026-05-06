import { useState, useCallback, useMemo } from 'react'
import { runAllTests } from '../utils/fraudTests'

export function useFraudTests() {
  const [flaggedEntries, setFlaggedEntries] = useState([])
  const [totalRows, setTotalRows]           = useState(0)
  const [hasRun, setHasRun]                 = useState(false)
  const [isRunning, setIsRunning]           = useState(false)

  const runTests = useCallback((rows, options = {}) => {
    setIsRunning(true)
    setHasRun(false)
    setTimeout(() => {
      const results = runAllTests(rows, options)
      setFlaggedEntries(results)
      setTotalRows(rows.length)
      setHasRun(true)
      setIsRunning(false)
    }, 30)
  }, [])

  const loadResults = useCallback((savedEntries, savedTotal) => {
    setFlaggedEntries(savedEntries)
    setTotalRows(savedTotal)
    setHasRun(true)
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    setFlaggedEntries([])
    setTotalRows(0)
    setHasRun(false)
  }, [])

  const summary = useMemo(() => {
    const flagged     = flaggedEntries.length
    const riskPercent = totalRows > 0 ? ((flagged / totalRows) * 100).toFixed(1) : '0.0'

    const reasonCounts = {}
    const riskCounts   = { High: 0, Medium: 0, Low: 0 }

    for (const entry of flaggedEntries) {
      for (const reason of entry.reasons) {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
      }
      riskCounts[entry.riskLevel] = (riskCounts[entry.riskLevel] || 0) + 1
    }

    return { total: totalRows, flagged, riskPercent, reasonCounts, riskCounts }
  }, [flaggedEntries, totalRows])

  return { flaggedEntries, hasRun, isRunning, runTests, reset, summary, loadResults }
}
