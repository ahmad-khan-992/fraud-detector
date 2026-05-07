import { useState, useCallback, useRef } from 'react'
import { parseExcelFile, applyColumnOverrides } from '../utils/parseExcel'

const ACCEPTED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'text/plain',
  'application/csv',
]
const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv']
const MAX_FILE_SIZE_MB    = 50
const LARGE_FILE_MB       = 15
const LARGE_ROW_THRESHOLD = 50000

function isValidFileType(file) {
  if (ACCEPTED_TYPES.includes(file.type)) return true
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some(ext => name.endsWith(ext))
}

export function useFileParser() {
  const [file, setFile]                   = useState(null)
  const [rows, setRows]                   = useState([])
  const [headers, setHeaders]             = useState([])
  const [missingColumns, setMissing]      = useState([])
  const [columnMap, setColumnMap]         = useState({})
  const [dataIssues, setDataIssues]       = useState([])
  const [loading, setLoading]             = useState(false)
  const [fileError, setFileError]         = useState(null)
  const [parseError, setParseError]       = useState(null)
  const [fileWarning, setFileWarning]     = useState(null)  // #17
  const [sheetNames, setSheetNames]       = useState([])    // #15
  const [selectedSheet, setSelectedSheet] = useState(null)  // #15

  // Raw rows before column normalization — needed for manual re-mapping (#16)
  const rawRowsRef = useRef([])

  const reset = useCallback(() => {
    setFile(null)
    setRows([])
    setHeaders([])
    setMissing([])
    setColumnMap({})
    setDataIssues([])
    setFileError(null)
    setParseError(null)
    setFileWarning(null)
    setSheetNames([])
    setSelectedSheet(null)
    rawRowsRef.current = []
  }, [])

  const applyResult = useCallback((result) => {
    setRows(result.rows)
    setHeaders(result.headers)
    setMissing(result.missingColumns)
    setColumnMap(result.columnMap)
    setDataIssues(result.dataIssues)
    if (result.sheetNames) setSheetNames(result.sheetNames)
    if (result.selectedSheet) setSelectedSheet(result.selectedSheet)

    // #17: row-count warning
    if (result.rows.length > LARGE_ROW_THRESHOLD) {
      setFileWarning(`large_rows:${result.rows.length}`)
    }
  }, [])

  const processFile = useCallback(async (incoming) => {
    reset()

    if (!isValidFileType(incoming)) {
      setFileError('Only .xlsx, .xls, and .csv files are supported.')
      return
    }

    // #17: file size guard
    const sizeMB = incoming.size / (1024 * 1024)
    if (sizeMB > MAX_FILE_SIZE_MB) {
      setFileError(`File is too large (${sizeMB.toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`)
      return
    }
    if (sizeMB > LARGE_FILE_MB) {
      setFileWarning(`large_file:${sizeMB.toFixed(1)}`)
    }

    setFile(incoming)
    setLoading(true)

    try {
      const result = await parseExcelFile(incoming)
      // Keep a reference to the raw (pre-normalization) rows for re-mapping
      rawRowsRef.current = result.rows
      applyResult(result)
    } catch (err) {
      setParseError(`Failed to parse file: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [reset, applyResult])

  // #15: switch sheet
  const selectSheet = useCallback(async (sheetName) => {
    if (!file) return
    setLoading(true)
    setParseError(null)
    try {
      const result = await parseExcelFile(file, { sheetName })
      rawRowsRef.current = result.rows
      applyResult(result)
    } catch (err) {
      setParseError(`Failed to parse sheet: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [file, applyResult])

  // #16: apply manual column overrides
  const applyManualMapping = useCallback((overrideMap) => {
    if (!rawRowsRef.current.length) return
    try {
      const result = applyColumnOverrides(rawRowsRef.current, columnMap, overrideMap)
      setRows(result.rows)
      setHeaders(result.headers)
      setMissing(result.missingColumns)
      setColumnMap(result.columnMap)
      setDataIssues(result.dataIssues)
    } catch (err) {
      setParseError(`Column mapping failed: ${err.message}`)
    }
  }, [columnMap])

  return {
    file,
    rows,
    headers,
    missingColumns,
    columnMap,
    dataIssues,
    loading,
    fileError,
    parseError,
    fileWarning,
    sheetNames,
    selectedSheet,
    processFile,
    selectSheet,
    applyManualMapping,
    reset,
  }
}
