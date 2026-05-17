// Text values that indicate a D/C indicator column, not an amount column
const INDICATOR_TEXTS = new Set(['dr', 'cr', 'd', 'c', 'debit', 'credit', '1', '-1'])

/**
 * After buildColumnMap + normalizeRows, check if the canonical 'Debit Amount'
 * or 'Credit Amount' column actually holds numeric data (not text indicators).
 */
export function isNumericColumn(rows, canonicalKey) {
  const sample = rows.slice(0, 20).map(r => r[canonicalKey]).filter(v => v !== '' && v != null)
  if (sample.length === 0) return true
  return !sample.every(v => typeof v === 'string' && INDICATOR_TEXTS.has(v.trim().toLowerCase()))
}

/**
 * Normalize rows (already canonical-keyed) that have 'Debit Amount' and 'Credit Amount'
 * into a single signed 'Amount' column. Returns new row objects + stats.
 *
 * Convention (default): Debit → positive, Credit → negative.
 * When swapped=true: Debit → negative, Credit → positive.
 */
export function normalizeSplitAmounts(inputRows, swapped = false) {
  const sign = swapped ? -1 : 1
  let ambiguousCount = 0, negativeContraCount = 0, zeroBothCount = 0
  let totalDebit = 0, totalCredit = 0

  const rows = inputRows.map(row => {
    const rawD = row['Debit Amount']
    const rawC = row['Credit Amount']

    const emptyD = rawD === '' || rawD === null || rawD === undefined
    const emptyC = rawC === '' || rawC === null || rawC === undefined

    const dNum = emptyD ? null : Number(rawD)
    const cNum = emptyC ? null : Number(rawC)

    const dVal = (dNum === null || isNaN(dNum)) ? null : dNum
    const cVal = (cNum === null || isNaN(cNum)) ? null : cNum

    let amount = 0
    let isAmbiguous = false

    if (dVal !== null && cVal !== null) {
      if (dVal !== 0 && cVal !== 0) {
        // Rule 3: both non-zero — ambiguous, exclude from tests
        ambiguousCount++
        isAmbiguous = true
        amount = null
      } else if (dVal === 0 && cVal === 0) {
        // Both zero
        zeroBothCount++
        amount = 0
      } else if (dVal !== 0) {
        // Format C debit side
        if (dVal < 0) negativeContraCount++
        amount = sign * dVal
        totalDebit += Math.abs(dVal)
      } else {
        // Format C credit side
        if (cVal < 0) negativeContraCount++
        amount = sign * -cVal
        totalCredit += Math.abs(cVal)
      }
    } else if (dVal !== null) {
      // Rule 2: debit only
      if (dVal < 0) negativeContraCount++
      amount = sign * dVal
      totalDebit += Math.abs(dVal)
    } else if (cVal !== null) {
      // Rule 2: credit only
      if (cVal < 0) negativeContraCount++
      amount = sign * -cVal
      totalCredit += Math.abs(cVal)
    } else {
      // Both empty
      zeroBothCount++
      amount = 0
    }

    const out = { ...row, Amount: amount }
    if (isAmbiguous) out._amountAmbiguous = true
    else delete out._amountAmbiguous
    return out
  })

  const total = inputRows.length
  const warnings = []

  if (ambiguousCount > 0 && ambiguousCount / total > 0.1) {
    warnings.push(
      `${(ambiguousCount / total * 100).toFixed(0)}% of rows have values in both Debit and Credit columns simultaneously. This may indicate a data quality issue or an unsupported export format.`
    )
  }

  if (zeroBothCount > 0 && zeroBothCount / total > 0.2) {
    warnings.push(
      `${(zeroBothCount / total * 100).toFixed(0)}% of rows have zero amounts. These will be excluded from statistical tests.`
    )
  }

  const diff = Math.abs(totalDebit - totalCredit)
  if (diff > 0.01 && (totalDebit > 0 || totalCredit > 0)) {
    const fmt = v => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    warnings.push(
      `Total debits ($${fmt(totalDebit)}) do not equal total credits ($${fmt(totalCredit)}) — difference of $${fmt(diff)}. This file may be incomplete or contain errors.`
    )
  }

  return { rows, ambiguousCount, negativeContraCount, zeroBothCount, totalDebit, totalCredit, warnings }
}
