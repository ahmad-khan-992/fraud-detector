function findKey(row, colName) {
  const target = colName.trim().toLowerCase()
  return Object.keys(row).find(k => k.trim().toLowerCase() === target)
}

function isValidDate(v) {
  if (v instanceof Date) return !isNaN(v.getTime())
  // Positive number could be an Excel date serial not yet converted
  if (typeof v === 'number') return v > 0
  if (typeof v === 'string' && v.trim() !== '') {
    const d = new Date(v)
    return !isNaN(d.getTime())
  }
  return false
}

function isEmpty(v) {
  return v === null || v === undefined || String(v).trim() === ''
}

const COLUMN_RULES = {
  'Amount': {
    expectedType: 'Number',
    description: 'Must be a numeric value',
    errorHint: 'Contains text or blank values instead of numbers',
    test: v => typeof v === 'number' && !isNaN(v),
  },
  'Posting Date': {
    expectedType: 'Date',
    description: 'Must be a valid date',
    errorHint: 'Contains text or invalid values instead of dates',
    test: v => isValidDate(v),
  },
  'Effective Date': {
    expectedType: 'Date',
    description: 'Must be a valid date',
    errorHint: 'Contains text or invalid values instead of dates',
    test: v => isValidDate(v),
  },
  'Account Number': {
    expectedType: 'Non-empty',
    description: 'Must not be blank',
    errorHint: 'Contains blank or missing account numbers',
    test: v => !isEmpty(v),
  },
  'JE Narration': {
    expectedType: 'Text',
    description: 'Must not be blank',
    errorHint: 'Contains blank or missing narrations',
    test: v => !isEmpty(v),
  },
  'User': {
    expectedType: 'Text',
    description: 'Must not be blank',
    errorHint: 'Contains blank or missing user names',
    test: v => !isEmpty(v),
  },
}

/**
 * Inspects actual cell values for each required column.
 * Returns one result object per column that is present in the data.
 */
export function validateData(rows, headers) {
  if (!rows.length) return []

  const normalizedHeaders = headers.map(h => h.trim().toLowerCase())

  return Object.entries(COLUMN_RULES)
    .filter(([col]) => normalizedHeaders.includes(col.trim().toLowerCase()))
    .map(([col, rule]) => {
      const key = findKey(rows[0], col)

      const invalidRows = []
      for (let i = 0; i < rows.length; i++) {
        const v = rows[i][key]
        if (!rule.test(v)) {
          invalidRows.push({ rowIndex: i, value: v })
        }
      }

      const total = rows.length
      const invalidCount = invalidRows.length
      const invalidPercent = ((invalidCount / total) * 100).toFixed(1)

      // Collect up to 3 unique bad example values for display
      const seen = new Set()
      const examples = []
      for (const { value } of invalidRows) {
        const display = value === '' || value === null || value === undefined
          ? '(empty)'
          : String(value).length > 30
            ? String(value).slice(0, 30) + '…'
            : String(value)
        if (!seen.has(display)) {
          seen.add(display)
          examples.push(display)
        }
        if (examples.length === 3) break
      }

      return {
        column: col,
        expectedType: rule.expectedType,
        description: rule.description,
        errorHint: rule.errorHint,
        total,
        invalidCount,
        invalidPercent,
        examples,
        // severity: green = 0 bad, amber = <10%, red = >=10%
        severity: invalidCount === 0 ? 'pass' : parseFloat(invalidPercent) < 10 ? 'warn' : 'fail',
      }
    })
}
