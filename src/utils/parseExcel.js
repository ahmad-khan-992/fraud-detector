import * as XLSX from 'xlsx'
import { REQUIRED_COLUMNS, buildColumnMap } from './columnConfig'
import { validateData } from './validateData'

export { REQUIRED_COLUMNS }

function normalizeRows(rawRows, columnMap) {
  return rawRows.map(row => {
    const out = {}
    for (const key of Object.keys(row)) {
      const canonical = Object.entries(columnMap).find(([, actual]) => actual === key)?.[0]
      out[canonical ?? key] = row[key]
    }
    return out
  })
}

function parseSheetData(workbook, sheetName) {
  const sheet   = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  if (rawRows.length === 0) {
    return { rows: [], headers: [], missingColumns: REQUIRED_COLUMNS, columnMap: {}, dataIssues: [] }
  }

  const rawHeaders     = Object.keys(rawRows[0])
  const columnMap      = buildColumnMap(rawHeaders)
  const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in columnMap))
  const rows           = normalizeRows(rawRows, columnMap)
  const headers        = Object.keys(rows[0])
  const dataIssues     = validateData(rows, headers)

  return { rows, headers, missingColumns, columnMap, dataIssues }
}

/** Parses an .xlsx/.xls or .csv File. Returns data + available sheet names. */
export async function parseExcelFile(file, { sheetName = null } = {}) {
  const isCSV = file.name.toLowerCase().endsWith('.csv')
  let workbook

  if (isCSV) {
    const text = await file.text()
    workbook   = XLSX.read(text, { type: 'string', cellDates: true })
  } else {
    const buffer = await file.arrayBuffer()
    workbook     = XLSX.read(buffer, { type: 'array', cellDates: true })
  }

  const sheetNames    = workbook.SheetNames
  const targetSheet   = sheetName && sheetNames.includes(sheetName)
    ? sheetName
    : sheetNames[0]

  const result = parseSheetData(workbook, targetSheet)
  return { ...result, sheetNames, selectedSheet: targetSheet }
}

/** Re-normalizes already-parsed rows using a user-supplied column override map. */
export function applyColumnOverrides(rawRows, baseColumnMap, overrideMap) {
  const merged         = { ...baseColumnMap, ...overrideMap }
  const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in merged))
  const rows           = normalizeRows(rawRows, merged)
  const headers        = Object.keys(rows[0] ?? {})
  const dataIssues     = validateData(rows, headers)
  return { rows, headers, missingColumns, columnMap: merged, dataIssues }
}
