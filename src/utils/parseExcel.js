import * as XLSX from 'xlsx'
import { REQUIRED_COLUMNS, buildColumnMap } from './columnConfig'
import { validateData } from './validateData'
import { isNumericColumn, normalizeSplitAmounts } from './splitAmount'

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
    return { rows: [], headers: [], missingColumns: REQUIRED_COLUMNS, columnMap: {}, dataIssues: [], amountFormat: 'unknown', splitInfo: null }
  }

  const rawHeaders = Object.keys(rawRows[0])
  let columnMap    = buildColumnMap(rawHeaders)
  let rows         = normalizeRows(rawRows, columnMap)

  let amountFormat = 'A'
  let splitInfo    = null

  if (!('Amount' in columnMap)) {
    const hasDebit  = 'Debit Amount'  in columnMap
    const hasCredit = 'Credit Amount' in columnMap

    if (hasDebit && hasCredit) {
      // Disambiguation: confirm columns contain numeric values, not text indicators
      const debitNumeric  = isNumericColumn(rows, 'Debit Amount')
      const creditNumeric = isNumericColumn(rows, 'Credit Amount')

      if (debitNumeric || creditNumeric) {
        amountFormat = 'BC'
        const { rows: normalized, ...stats } = normalizeSplitAmounts(rows, false)
        rows = normalized
        splitInfo = {
          debitHeader:  columnMap['Debit Amount'],
          creditHeader: columnMap['Credit Amount'],
          ...stats,
        }
        // Synthesise Amount in columnMap so REQUIRED_COLUMNS check passes
        columnMap = { ...columnMap, Amount: `${columnMap['Debit Amount']} + ${columnMap['Credit Amount']}` }
      }
    } else if (hasDebit || hasCredit) {
      amountFormat = 'partial'
      const found   = hasDebit  ? 'Debit'  : 'Credit'
      const missing = hasDebit  ? 'Credit' : 'Debit'
      splitInfo = {
        warning: `A ${found} column was found but no ${missing} column. Both are required for automatic merging. Please check your export or map the Amount column manually.`,
      }
    }
  }

  const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in columnMap))
  const headers        = Object.keys(rows[0])
  const dataIssues     = validateData(rows, headers)

  return { rows, headers, missingColumns, columnMap, dataIssues, amountFormat, splitInfo }
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
  let merged = { ...baseColumnMap, ...overrideMap }
  let rows   = normalizeRows(rawRows, merged)

  let amountFormat = 'Amount' in merged ? 'A' : 'unknown'
  let splitInfo    = null

  if (!('Amount' in merged)) {
    const hasDebit  = 'Debit Amount'  in merged
    const hasCredit = 'Credit Amount' in merged
    if (hasDebit && hasCredit && (isNumericColumn(rows, 'Debit Amount') || isNumericColumn(rows, 'Credit Amount'))) {
      amountFormat = 'BC'
      const { rows: normalized, ...stats } = normalizeSplitAmounts(rows, false)
      rows = normalized
      splitInfo = { debitHeader: merged['Debit Amount'], creditHeader: merged['Credit Amount'], ...stats }
      merged = { ...merged, Amount: `${merged['Debit Amount']} + ${merged['Credit Amount']}` }
    }
  }

  const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in merged))
  const headers        = Object.keys(rows[0] ?? {})
  const dataIssues     = validateData(rows, headers)
  return { rows, headers, missingColumns, columnMap: merged, dataIssues, amountFormat, splitInfo }
}
