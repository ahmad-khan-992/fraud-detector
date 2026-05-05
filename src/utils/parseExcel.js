import * as XLSX from 'xlsx'
import { REQUIRED_COLUMNS, buildColumnMap } from './columnConfig'
import { validateData } from './validateData'

export { REQUIRED_COLUMNS }

/**
 * Reads an .xlsx / .xls File object and returns structured data.
 *
 * All required columns are renamed to their canonical names in the returned rows,
 * so downstream code always uses 'Account Number', 'Amount', etc. regardless of
 * what the source file called them.
 */
export async function parseExcelFile(file) {
  const buffer   = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet    = workbook.Sheets[workbook.SheetNames[0]]
  const rawRows  = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  if (rawRows.length === 0) {
    return { rows: [], headers: [], missingColumns: REQUIRED_COLUMNS, columnMap: {}, dataIssues: [] }
  }

  const rawHeaders = Object.keys(rawRows[0])
  const columnMap  = buildColumnMap(rawHeaders)
  const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in columnMap))

  // Rename matched columns to their canonical names in every row
  const rows = rawRows.map(row => {
    const out = {}
    for (const key of Object.keys(row)) {
      // Find if this key is a matched alias for any canonical column
      const canonical = Object.entries(columnMap).find(([, actual]) => actual === key)?.[0]
      out[canonical ?? key] = row[key]
    }
    return out
  })

  // Headers reflect the normalized keys
  const headers    = Object.keys(rows[0])
  const dataIssues = validateData(rows, headers)

  return { rows, headers, missingColumns, columnMap, dataIssues }
}
