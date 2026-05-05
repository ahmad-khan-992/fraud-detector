function getField(row, fieldName) {
  const target = fieldName.trim().toLowerCase()
  const key = Object.keys(row).find(k => k.trim().toLowerCase() === target)
  return key !== undefined ? row[key] : undefined
}

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

export const RISK_SCORE_MAP = {
  'Zero / Null Amount':                3,
  'Short / Missing Narration':         1,
  'Unusually High Amount (top 5%)':    2,
  'Unusually Low Amount (bottom 5%)':  1,
  'Weekend Entry (Saturday)':          1,
  'Weekend Entry (Sunday)':            1,
  'Seldom Used Account':               2,
  'Rare User':                         2,
  'Null / Missing Field':              2,
  'Backdated Entry':                   3,
  'Postdated Entry':                   2,
  'Entry After Year-End':              3,
  'Repeating Digit Amount':            2,
}

export function getRiskLevel(score) {
  if (score >= 6) return 'High'
  if (score >= 3) return 'Medium'
  return 'Low'
}

export function buildExplanation(reasons) {
  if (reasons.length === 0) return ''

  const PHRASES = {
    'Zero / Null Amount':               'the amount is zero or missing',
    'Short / Missing Narration':        'the narration is too short or absent',
    'Unusually High Amount (top 5%)':   'the amount is unusually high compared to the dataset',
    'Unusually Low Amount (bottom 5%)': 'the amount is unusually low compared to the dataset',
    'Weekend Entry (Saturday)':         'it was posted on a Saturday',
    'Weekend Entry (Sunday)':           'it was posted on a Sunday',
    'Seldom Used Account':              'the account is rarely used in this dataset',
    'Rare User':                        'the posting user appears very infrequently',
    'Null / Missing Field':             'one or more required fields are empty',
    'Backdated Entry':                  'the effective date is significantly earlier than the posting date',
    'Postdated Entry':                  'the posting date is set in the future',
    'Entry After Year-End':             'it was posted after the fiscal year-end',
    'Repeating Digit Amount':           'the amount contains a suspicious repeating digit pattern',
  }

  const parts = reasons.map(r => PHRASES[r] || r.toLowerCase())
  if (parts.length === 1) return `This transaction is flagged because ${parts[0]}.`
  const last = parts.pop()
  return `This transaction is flagged because ${parts.join(', ')} and ${last}.`
}

// ─── Test 1: Zero / Null Amount ───────────────────────────────────────────────
export function testZeroAmount(rows) {
  const flags = []
  for (let i = 0; i < rows.length; i++) {
    const raw = getField(rows[i], 'Amount')
    const isEmpty = raw === null || raw === undefined || raw === ''
    const isZero  = !isEmpty && Number(raw) === 0
    if (isEmpty || isZero) {
      flags.push({ rowIndex: i, row: rows[i], reason: 'Zero / Null Amount' })
    }
  }
  return flags
}

// ─── Test 2: Short / Missing Narration ───────────────────────────────────────
export function testShortNarration(rows) {
  const flags = []
  for (let i = 0; i < rows.length; i++) {
    const raw  = getField(rows[i], 'JE Narration')
    const text = raw == null ? '' : String(raw).trim()
    if (text.length <= 5) {
      flags.push({ rowIndex: i, row: rows[i], reason: 'Short / Missing Narration' })
    }
  }
  return flags
}

// ─── Test 3: Unusual Amounts (top / bottom 5%) ────────────────────────────────
export function testUnusualAmounts(rows) {
  if (rows.length < 20) return []

  const amounts = rows.map(r => Number(getField(r, 'Amount'))).filter(n => !isNaN(n))
  if (amounts.length < 20) return []

  const sorted = [...amounts].sort((a, b) => a - b)
  const p5  = sorted[Math.floor(sorted.length * 0.05)]
  const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1]

  const flags = []
  for (let i = 0; i < rows.length; i++) {
    const amount = Number(getField(rows[i], 'Amount'))
    if (isNaN(amount)) continue
    if (amount > p95) {
      flags.push({ rowIndex: i, row: rows[i], reason: 'Unusually High Amount (top 5%)' })
    } else if (amount < p5) {
      flags.push({ rowIndex: i, row: rows[i], reason: 'Unusually Low Amount (bottom 5%)' })
    }
  }
  return flags
}

// ─── Test 4: Weekend Entries ──────────────────────────────────────────────────
export function testWeekendEntries(rows) {
  const flags = []
  for (let i = 0; i < rows.length; i++) {
    const raw  = getField(rows[i], 'Posting Date')
    const date = parseDate(raw)
    if (!date) continue
    const day = date.getDay()
    if (day === 0 || day === 6) {
      const label = day === 0 ? 'Sunday' : 'Saturday'
      flags.push({ rowIndex: i, row: rows[i], reason: `Weekend Entry (${label})` })
    }
  }
  return flags
}

// ─── Test 5: Seldom Used Accounts ─────────────────────────────────────────────
export function testSeldomUsedAccounts(rows) {
  if (rows.length < 20) return []

  const counts = {}
  for (const row of rows) {
    const acct = String(getField(row, 'Account Number') ?? '').trim()
    if (acct) counts[acct] = (counts[acct] || 0) + 1
  }

  const flags = []
  for (let i = 0; i < rows.length; i++) {
    const acct = String(getField(rows[i], 'Account Number') ?? '').trim()
    if (acct && counts[acct] === 1) {
      flags.push({ rowIndex: i, row: rows[i], reason: 'Seldom Used Account' })
    }
  }
  return flags
}

// ─── Test 6: Rare Users ───────────────────────────────────────────────────────
export function testRareUsers(rows) {
  if (rows.length < 10) return []

  const counts = {}
  for (const row of rows) {
    const user = String(getField(row, 'User') ?? '').trim()
    if (user) counts[user] = (counts[user] || 0) + 1
  }

  const flags = []
  for (let i = 0; i < rows.length; i++) {
    const user = String(getField(rows[i], 'User') ?? '').trim()
    if (user && counts[user] === 1) {
      flags.push({ rowIndex: i, row: rows[i], reason: 'Rare User' })
    }
  }
  return flags
}

// ─── Test 7: Null / Missing Fields ────────────────────────────────────────────
export function testNullFields(rows) {
  const FIELDS = ['Account Number', 'Posting Date', 'Effective Date', 'User']
  const flags = []

  for (let i = 0; i < rows.length; i++) {
    const hasNull = FIELDS.some(field => {
      const val = getField(rows[i], field)
      return val === null || val === undefined || String(val).trim() === ''
    })
    if (hasNull) {
      flags.push({ rowIndex: i, row: rows[i], reason: 'Null / Missing Field' })
    }
  }
  return flags
}

// ─── Test 8: Backdated Entries ────────────────────────────────────────────────
export function testBackdatedEntries(rows) {
  const DAYS_THRESHOLD = 5
  const flags = []

  for (let i = 0; i < rows.length; i++) {
    const postingDate   = parseDate(getField(rows[i], 'Posting Date'))
    const effectiveDate = parseDate(getField(rows[i], 'Effective Date'))
    if (!postingDate || !effectiveDate) continue

    const diffDays = (postingDate - effectiveDate) / (1000 * 60 * 60 * 24)
    if (diffDays > DAYS_THRESHOLD) {
      flags.push({ rowIndex: i, row: rows[i], reason: 'Backdated Entry' })
    }
  }
  return flags
}

// ─── Test 9: Postdated Entries ────────────────────────────────────────────────
export function testPostdatedEntries(rows) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const flags = []

  for (let i = 0; i < rows.length; i++) {
    const date = parseDate(getField(rows[i], 'Posting Date'))
    if (!date) continue
    if (date > today) {
      flags.push({ rowIndex: i, row: rows[i], reason: 'Postdated Entry' })
    }
  }
  return flags
}

// ─── Test 10: Entries After Year-End ──────────────────────────────────────────
// Flags prior-year effective date entries posted in Q1 of the following year
export function testAfterYearEnd(rows) {
  const flags = []

  for (let i = 0; i < rows.length; i++) {
    const postingDate   = parseDate(getField(rows[i], 'Posting Date'))
    const effectiveDate = parseDate(getField(rows[i], 'Effective Date'))
    if (!postingDate || !effectiveDate) continue

    const postingYear   = postingDate.getFullYear()
    const effectiveYear = effectiveDate.getFullYear()

    if (effectiveYear < postingYear && postingDate.getMonth() < 3) {
      flags.push({ rowIndex: i, row: rows[i], reason: 'Entry After Year-End' })
    }
  }
  return flags
}

// ─── Test 11: Repeating Digit Amounts ────────────────────────────────────────
export function testRepeatingDigits(rows) {
  const flags = []

  for (let i = 0; i < rows.length; i++) {
    const raw = getField(rows[i], 'Amount')
    if (raw === null || raw === undefined || raw === '') continue

    const amount = Number(raw)
    if (isNaN(amount) || amount === 0) continue

    const digitStr = String(Math.abs(amount)).replace('.', '').replace(/0+$/, '')
    if (digitStr.length < 2) continue

    const isRepeating = digitStr.split('').every(d => d === digitStr[0])
    if (isRepeating) {
      flags.push({ rowIndex: i, row: rows[i], reason: 'Repeating Digit Amount' })
    }
  }
  return flags
}

// ─── Aggregator ───────────────────────────────────────────────────────────────
export function runAllTests(rows) {
  const allFlags = [
    ...testZeroAmount(rows),
    ...testShortNarration(rows),
    ...testUnusualAmounts(rows),
    ...testWeekendEntries(rows),
    ...testSeldomUsedAccounts(rows),
    ...testRareUsers(rows),
    ...testNullFields(rows),
    ...testBackdatedEntries(rows),
    ...testPostdatedEntries(rows),
    ...testAfterYearEnd(rows),
    ...testRepeatingDigits(rows),
  ]

  const byIndex = new Map()
  for (const flag of allFlags) {
    if (!byIndex.has(flag.rowIndex)) {
      byIndex.set(flag.rowIndex, { rowIndex: flag.rowIndex, row: flag.row, reasons: [] })
    }
    byIndex.get(flag.rowIndex).reasons.push(flag.reason)
  }

  return Array.from(byIndex.values())
    .sort((a, b) => a.rowIndex - b.rowIndex)
    .map(entry => {
      const riskScore   = entry.reasons.reduce((sum, r) => sum + (RISK_SCORE_MAP[r] || 1), 0)
      const riskLevel   = getRiskLevel(riskScore)
      const explanation = buildExplanation(entry.reasons)
      return { ...entry, riskScore, riskLevel, explanation }
    })
}
