import { useState, useCallback } from 'react'
import { parseExcelFile } from '../utils/parseExcel'

const ACCEPTED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls']

function isValidFileType(file) {
  if (ACCEPTED_TYPES.includes(file.type)) return true
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some(ext => name.endsWith(ext))
}

export function useFileParser() {
  const [file, setFile]               = useState(null)
  const [rows, setRows]               = useState([])
  const [headers, setHeaders]         = useState([])
  const [missingColumns, setMissing]  = useState([])
  const [columnMap, setColumnMap]     = useState({})
  const [dataIssues, setDataIssues]   = useState([])
  const [loading, setLoading]         = useState(false)
  const [fileError, setFileError]     = useState(null)
  const [parseError, setParseError]   = useState(null)

  const reset = useCallback(() => {
    setFile(null)
    setRows([])
    setHeaders([])
    setMissing([])
    setColumnMap({})
    setDataIssues([])
    setFileError(null)
    setParseError(null)
  }, [])

  const processFile = useCallback(async (incoming) => {
    reset()

    if (!isValidFileType(incoming)) {
      setFileError('Only .xlsx and .xls files are supported. Please upload a valid Excel file.')
      return
    }

    setFile(incoming)
    setLoading(true)

    try {
      const result = await parseExcelFile(incoming)
      setRows(result.rows)
      setHeaders(result.headers)
      setMissing(result.missingColumns)
      setColumnMap(result.columnMap)
      setDataIssues(result.dataIssues)
    } catch (err) {
      setParseError(`Failed to parse file: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [reset])

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
    processFile,
    reset,
  }
}
