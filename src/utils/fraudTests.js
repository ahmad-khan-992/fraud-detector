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

function dateToKey(date) {
  const yyyy = date.getFullYear()
  const mm   = String(date.getMonth() + 1).padStart(2, '0')
  const dd   = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const REASON_KEYS = {
  'Zero / Null Amount':               'zeroAmount',
  'Short / Missing Narration':        'shortNarration',
  'Unusually High Amount (top 5%)':   'highAmount',
  'Unusually Low Amount (bottom 5%)': 'lowAmount',
  'Weekend Entry (Saturday)':         'weekendSat',
  'Weekend Entry (Sunday)':           'weekendSun',
  'Seldom Used Account':              'seldomAccount',
  'Rare User':                        'rareUser',
  'Null / Missing Field':             'nullField',
  'Backdated Entry':                  'backdated',
  'Postdated Entry':                  'postdated',
  'Entry After Year-End':             'yearEnd',
  'Repeating Digit Amount':           'repeatingDigit',
  'Holiday Entry':                    'holidayEntry',
  'Amount Above Threshold':           'amountThreshold',
  'Round Number':                     'roundNumber',
  'Z-Score Anomaly':                  'zScoreAnomaly',
  'Splitting / Structuring':          'splitting',
  'Same-Day Reversal':                'sameDayReversal',
  'Period-End Clustering':            'periodEndClustering',
  'Dormant Account Reactivation':     'dormantAccount',
  'User Concentration Risk':          'userConcentration',
  'Off-Hours Posting':                'offHoursPosting',
  'Duplicate Entry':                  'duplicateEntry',
}

export function buildTranslatedExplanation(reasons, t) {
  if (!reasons.length) return ''
  const parts = reasons.map(r => t(`reasonPhrases.${REASON_KEYS[r] || 'unknown'}`))
  const prefix = t('explanationPrefix')
  const and    = t('explanationAnd')
  if (parts.length === 1) return `${prefix} ${parts[0]}.`
  const last = parts.pop()
  return `${prefix} ${parts.join(', ')} ${and} ${last}.`
}

export const RISK_SCORE_MAP = {
  // Existing tests — scaled for meaningful triage on 0-100 scale
  'Zero / Null Amount':                5,
  'Short / Missing Narration':         2,
  'Unusually High Amount (top 5%)':    3,
  'Unusually Low Amount (bottom 5%)':  2,
  'Weekend Entry (Saturday)':          2,
  'Weekend Entry (Sunday)':            2,
  'Seldom Used Account':               3,
  'Rare User':                         3,
  'Null / Missing Field':              4,
  'Backdated Entry':                   6,   // alone = High
  'Postdated Entry':                   4,
  'Entry After Year-End':              7,   // alone = High, very serious
  'Repeating Digit Amount':            3,
  'Holiday Entry':                     3,
  'Amount Above Threshold':            4,
  // New tests (from previous batch)
  'Round Number':                      2,
  'Z-Score Anomaly':                   4,
  'Splitting / Structuring':           5,
  'Same-Day Reversal':                 4,
  'Period-End Clustering':             3,
  'Dormant Account Reactivation':      3,
  'User Concentration Risk':           3,
  'Off-Hours Posting':                 2,
  // New: duplicate detection (#18)
  'Duplicate Entry':                   5,
}

export function getRiskLevel(score) {
  if (score >= 10) return 'Critical'
  if (score >= 6)  return 'High'
  if (score >= 3)  return 'Medium'
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
    'Holiday Entry':                    'it was posted on a company holiday or public holiday',
    'Amount Above Threshold':           'the amount exceeds the configured review threshold',
    'Round Number':                     'the amount is a suspicious round number',
    'Z-Score Anomaly':                  'the amount is a statistical outlier for this account',
    'Splitting / Structuring':          'multiple entries by the same user appear to split a larger amount',
    'Same-Day Reversal':                'this entry has an exact reversal within 3 days on the same account',
    'Period-End Clustering':            'transaction volume on this date is unusually high for the period-end window',
    'Dormant Account Reactivation':     'this account had no prior activity in the dataset',
    'User Concentration Risk':          'the posting user accounts for a disproportionately large share of activity',
    'Off-Hours Posting':                'the entry was posted outside normal business hours',
    'Duplicate Entry':                  'this entry appears to be a duplicate of another row',
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
export function testShortNarration(rows, { narrationMinLen = 5 } = {}) {
  const flags = []
  for (let i = 0; i < rows.length; i++) {
    const raw  = getField(rows[i], 'JE Narration')
    const text = raw == null ? '' : String(raw).trim()
    if (text.length <= narrationMinLen) {
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
export function testBackdatedEntries(rows, { backdateDays = 5 } = {}) {
  const flags = []
  for (let i = 0; i < rows.length; i++) {
    const postingDate   = parseDate(getField(rows[i], 'Posting Date'))
    const effectiveDate = parseDate(getField(rows[i], 'Effective Date'))
    if (!postingDate || !effectiveDate) continue
    const diffDays = (postingDate - effectiveDate) / 86400000
    if (diffDays > backdateDays) {
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

// ─── Test 12: Holiday Entries ─────────────────────────────────────────────────
export function testHolidayEntries(rows, holidayDates) {
  if (!holidayDates || holidayDates.size === 0) return []
  const flags = []
  for (let i = 0; i < rows.length; i++) {
    const date = parseDate(getField(rows[i], 'Posting Date'))
    if (!date) continue
    if (holidayDates.has(dateToKey(date))) {
      flags.push({ rowIndex: i, row: rows[i], reason: 'Holiday Entry' })
    }
  }
  return flags
}

// ─── Test 13: Amount Above Threshold ─────────────────────────────────────────
export function testAmountAboveThreshold(rows, maxAmount) {
  if (maxAmount === null || maxAmount === undefined || maxAmount === '' || isNaN(Number(maxAmount))) return []
  const threshold = Number(maxAmount)
  const flags = []
  for (let i = 0; i < rows.length; i++) {
    const raw = getField(rows[i], 'Amount')
    if (raw === null || raw === undefined || raw === '') continue
    const amount = Number(raw)
    if (!isNaN(amount) && Math.abs(amount) > threshold) {
      flags.push({ rowIndex: i, row: rows[i], reason: 'Amount Above Threshold' })
    }
  }
  return flags
}

// ─── Test 14 (R01): Round Number ──────────────────────────────────────────────
export function testRoundNumbers(rows, { roundNumberMin = 1000 } = {}) {
  const MULTIPLES = [100000, 10000, roundNumberMin].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => b - a)
  const flags = []
  for (let i = 0; i < rows.length; i++) {
    const raw = getField(rows[i], 'Amount')
    if (raw === null || raw === undefined || raw === '') continue
    const amount = Math.abs(Number(raw))
    if (isNaN(amount) || amount === 0) continue
    for (const m of MULTIPLES) {
      if (amount % m === 0) {
        flags.push({ rowIndex: i, row: rows[i], reason: 'Round Number' })
        break
      }
    }
  }
  return flags
}

// ─── Test 15 (S01): Z-Score Anomaly ───────────────────────────────────────────
export function testZScore(rows, { zScoreThreshold = 3.0 } = {}) {
  const Z_THRESHOLD = zScoreThreshold
  const MIN_ENTRIES = 10

  const byAccount = {}
  for (let i = 0; i < rows.length; i++) {
    const acct = String(getField(rows[i], 'Account Number') ?? '').trim()
    const raw  = getField(rows[i], 'Amount')
    if (!acct || raw === null || raw === undefined || raw === '') continue
    const amount = Number(raw)
    if (isNaN(amount)) continue
    if (!byAccount[acct]) byAccount[acct] = []
    byAccount[acct].push({ i, amount })
  }

  const flags = []
  for (const entries of Object.values(byAccount)) {
    if (entries.length < MIN_ENTRIES) continue
    const amounts = entries.map(e => e.amount)
    const mean     = amounts.reduce((s, a) => s + a, 0) / amounts.length
    const variance = amounts.reduce((s, a) => s + Math.pow(a - mean, 2), 0) / amounts.length
    const sd       = Math.sqrt(variance)
    if (sd === 0) continue
    for (const { i, amount } of entries) {
      if (Math.abs((amount - mean) / sd) > Z_THRESHOLD) {
        flags.push({ rowIndex: i, row: rows[i], reason: 'Z-Score Anomaly' })
      }
    }
  }
  return flags
}

// ─── Test 16 (R06): Splitting / Structuring ────────────────────────────────────
export function testSplitting(rows, { splittingThreshold = 10000 } = {}) {
  const APPROVAL_THRESHOLD = splittingThreshold
  const groups = {}

  for (let i = 0; i < rows.length; i++) {
    const user = String(getField(rows[i], 'User') ?? '').trim()
    const acct = String(getField(rows[i], 'Account Number') ?? '').trim()
    const date = parseDate(getField(rows[i], 'Posting Date'))
    const raw  = getField(rows[i], 'Amount')
    if (!user || !acct || !date || raw === null || raw === undefined || raw === '') continue
    const amount = Math.abs(Number(raw))
    if (isNaN(amount)) continue
    const key = `${user}||${acct}||${dateToKey(date)}`
    if (!groups[key]) groups[key] = []
    groups[key].push({ i, amount })
  }

  const flags = []
  for (const entries of Object.values(groups)) {
    if (entries.length < 2) continue
    const total    = entries.reduce((s, e) => s + e.amount, 0)
    const allBelow = entries.every(e => e.amount < APPROVAL_THRESHOLD)
    if (allBelow && total >= APPROVAL_THRESHOLD) {
      for (const { i } of entries) {
        flags.push({ rowIndex: i, row: rows[i], reason: 'Splitting / Structuring' })
      }
    }
  }
  return flags
}

// ─── Test 17 (R08): Same-Day Reversals ────────────────────────────────────────
export function testSameDayReversals(rows) {
  const WINDOW_DAYS = 3
  const indexed = []

  for (let i = 0; i < rows.length; i++) {
    const acct = String(getField(rows[i], 'Account Number') ?? '').trim()
    const date = parseDate(getField(rows[i], 'Posting Date'))
    const raw  = getField(rows[i], 'Amount')
    if (!acct || !date || raw === null || raw === undefined || raw === '') continue
    const amount = Number(raw)
    if (isNaN(amount) || amount === 0) continue
    indexed.push({ i, acct, amount, date })
  }

  const flaggedIndices = new Set()
  for (let a = 0; a < indexed.length; a++) {
    for (let b = a + 1; b < indexed.length; b++) {
      const ea = indexed[a], eb = indexed[b]
      if (ea.acct !== eb.acct) continue
      const diffDays = Math.abs((ea.date - eb.date) / 86400000)
      if (diffDays > WINDOW_DAYS) continue
      // Exact reversal: amounts cancel out
      if (Math.abs(ea.amount + eb.amount) < 0.01) {
        flaggedIndices.add(ea.i)
        flaggedIndices.add(eb.i)
      }
    }
  }

  return [...flaggedIndices].map(i => ({ rowIndex: i, row: rows[i], reason: 'Same-Day Reversal' }))
}

// ─── Test 18 (R09): Period-End Clustering ─────────────────────────────────────
export function testPeriodEndClustering(rows) {
  if (rows.length < 20) return []

  const PERIOD_END_DAYS = 3
  const SPIKE_FACTOR    = 2.0

  const dated = []
  for (let i = 0; i < rows.length; i++) {
    const date = parseDate(getField(rows[i], 'Posting Date'))
    if (!date) continue
    dated.push({ i, date })
  }
  if (dated.length < 20) return []

  const byMonth = {}
  for (const { i, date } of dated) {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push({ i, day: date.getDate(), month: date.getMonth(), year: date.getFullYear() })
  }

  const flaggedIndices = new Set()
  for (const entries of Object.values(byMonth)) {
    if (entries.length < 5) continue
    const { year, month } = entries[0]
    const lastDay = new Date(year, month + 1, 0).getDate()

    const periodEnd = entries.filter(e => lastDay - e.day < PERIOD_END_DAYS)
    const otherDays = lastDay - PERIOD_END_DAYS
    const otherCount = entries.length - periodEnd.length

    if (periodEnd.length === 0 || otherDays <= 0) continue
    const avgPerDay      = otherCount / otherDays
    const periodPerDay   = periodEnd.length / PERIOD_END_DAYS

    if (avgPerDay > 0 && periodPerDay > avgPerDay * SPIKE_FACTOR) {
      for (const { i } of periodEnd) flaggedIndices.add(i)
    }
  }

  return [...flaggedIndices].map(i => ({ rowIndex: i, row: rows[i], reason: 'Period-End Clustering' }))
}

// ─── Test 19 (R10): Dormant Account Reactivation ──────────────────────────────
export function testDormantAccounts(rows) {
  if (rows.length < 20) return []

  const MIN_SPAN_DAYS     = 90
  const RECENT_FRACTION   = 0.8
  const MAX_ENTRIES       = 5

  let minDate = null, maxDate = null
  const dated = []

  for (let i = 0; i < rows.length; i++) {
    const date = parseDate(getField(rows[i], 'Posting Date'))
    if (!date) continue
    if (!minDate || date < minDate) minDate = date
    if (!maxDate || date > maxDate) maxDate = date
    dated.push({ i, date })
  }

  if (!minDate || !maxDate) return []
  const spanDays = (maxDate - minDate) / 86400000
  if (spanDays < MIN_SPAN_DAYS) return []

  const recentCutoff = new Date(minDate.getTime() + spanDays * RECENT_FRACTION * 86400000)

  const byAccount = {}
  for (const { i, date } of dated) {
    const acct = String(getField(rows[i], 'Account Number') ?? '').trim()
    if (!acct) continue
    if (!byAccount[acct]) byAccount[acct] = []
    byAccount[acct].push({ i, date })
  }

  const flaggedIndices = new Set()
  for (const entries of Object.values(byAccount)) {
    if (entries.length > MAX_ENTRIES) continue
    if (entries.every(e => e.date >= recentCutoff)) {
      for (const { i } of entries) flaggedIndices.add(i)
    }
  }

  return [...flaggedIndices].map(i => ({ rowIndex: i, row: rows[i], reason: 'Dormant Account Reactivation' }))
}

// ─── Test 20 (B02): User Concentration ────────────────────────────────────────
export function testUserConcentration(rows) {
  if (rows.length < 20) return []

  const AMOUNT_THRESHOLD = 0.30
  const COUNT_THRESHOLD  = 0.40

  const userAmounts = {}, userCounts = {}
  let totalAmount = 0, totalCount = 0

  for (const row of rows) {
    const user = String(getField(row, 'User') ?? '').trim()
    if (!user) continue
    const raw    = getField(row, 'Amount')
    const amount = Math.abs(Number(raw))
    if (!isNaN(amount)) {
      userAmounts[user] = (userAmounts[user] || 0) + amount
      totalAmount += amount
    }
    userCounts[user] = (userCounts[user] || 0) + 1
    totalCount++
  }

  if (totalAmount === 0 || totalCount === 0) return []

  const concentrated = new Set()
  for (const [u, amt] of Object.entries(userAmounts)) {
    if (amt / totalAmount > AMOUNT_THRESHOLD) concentrated.add(u)
  }
  for (const [u, cnt] of Object.entries(userCounts)) {
    if (cnt / totalCount > COUNT_THRESHOLD) concentrated.add(u)
  }
  if (concentrated.size === 0) return []

  const flags = []
  for (let i = 0; i < rows.length; i++) {
    const user = String(getField(rows[i], 'User') ?? '').trim()
    if (concentrated.has(user)) {
      flags.push({ rowIndex: i, row: rows[i], reason: 'User Concentration Risk' })
    }
  }
  return flags
}

// ─── Test 21 (B01): Off-Hours Posting ─────────────────────────────────────────
export function testOffHours(rows) {
  const HOUR_START = 7
  const HOUR_END   = 20
  const flags      = []

  for (let i = 0; i < rows.length; i++) {
    const raw  = getField(rows[i], 'Posting Date')
    const date = parseDate(raw)
    if (!date) continue

    // Only run when the raw value contains a time component
    let hasTime = false
    if (typeof raw === 'number') {
      hasTime = (raw % 1) > 0.0007 // fractional day > ~1 minute
    } else if (typeof raw === 'string') {
      hasTime = /\d{1,2}:\d{2}/.test(raw)
    } else if (raw instanceof Date) {
      hasTime = raw.getHours() !== 0 || raw.getMinutes() !== 0
    }
    if (!hasTime) continue

    const hour = date.getHours()
    if (hour < HOUR_START || hour >= HOUR_END) {
      flags.push({ rowIndex: i, row: rows[i], reason: 'Off-Hours Posting' })
    }
  }
  return flags
}

// ─── Test 22: Duplicate Entries ───────────────────────────────────────────────
export function testDuplicateEntries(rows) {
  const seen = {}
  for (let i = 0; i < rows.length; i++) {
    const acct   = String(getField(rows[i], 'Account Number') ?? '').trim()
    const amount = getField(rows[i], 'Amount')
    const date   = getField(rows[i], 'Posting Date')
    const user   = String(getField(rows[i], 'User') ?? '').trim()
    if (!acct || amount === undefined || amount === null || amount === '' || !date) continue
    const key = `${acct}||${amount}||${String(date)}||${user}`
    if (!seen[key]) seen[key] = []
    seen[key].push(i)
  }

  const flags = []
  for (const indices of Object.values(seen)) {
    if (indices.length > 1) {
      for (const i of indices) {
        flags.push({ rowIndex: i, row: rows[i], reason: 'Duplicate Entry' })
      }
    }
  }
  return flags
}

// ─── Benford's Law (S02) ─ dataset-level, not per-row ─────────────────────────
export function computeBenfordsLaw(rows) {
  const EXPECTED = { 1: 0.301, 2: 0.176, 3: 0.125, 4: 0.097, 5: 0.079, 6: 0.067, 7: 0.058, 8: 0.051, 9: 0.046 }
  const counts   = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }
  let total = 0

  for (const row of rows) {
    const raw    = getField(row, 'Amount')
    if (raw === null || raw === undefined || raw === '') continue
    const amount = Math.abs(Number(raw))
    if (isNaN(amount) || amount === 0) continue

    // First significant digit (strip leading zeros and decimal point)
    const digits = String(amount).replace(/^0\.0*/, '')
    const first  = parseInt(digits[0])
    if (first >= 1 && first <= 9) { counts[first]++; total++ }
  }

  if (total < 30) return null

  const observed = {}
  for (let d = 1; d <= 9; d++) observed[d] = counts[d] / total

  let chiSquared = 0
  for (let d = 1; d <= 9; d++) {
    const exp = EXPECTED[d] * total
    chiSquared += Math.pow(counts[d] - exp, 2) / exp
  }

  let mad = 0
  for (let d = 1; d <= 9; d++) mad += Math.abs(observed[d] - EXPECTED[d])
  mad /= 9

  // Chi-squared critical value p=0.05 with 8 df = 15.507
  const pass = chiSquared < 15.507 && mad < 0.015

  const overRepresented = Object.entries(observed)
    .filter(([d, obs]) => obs > EXPECTED[d] * 1.5)
    .map(([d]) => parseInt(d))

  return {
    total,
    counts,
    observed,
    expected: EXPECTED,
    chiSquared: parseFloat(chiSquared.toFixed(3)),
    mad: parseFloat(mad.toFixed(4)),
    pass,
    overRepresented,
  }
}

// ─── Aggregator ───────────────────────────────────────────────────────────────
export function runAllTests(rows, options = {}) {
  const holidayDates       = options.holidayDates instanceof Set ? options.holidayDates : new Set(options.holidayDates || [])
  const maxAmount          = options.maxAmount          ?? null
  const backdateDays       = options.backdateDays       ?? 5
  const narrationMinLen    = options.narrationMinLen    ?? 5
  const zScoreThreshold    = options.zScoreThreshold    ?? 3.0
  const splittingThreshold = options.splittingThreshold ?? 10000
  const roundNumberMin     = options.roundNumberMin     ?? 1000

  const allFlags = [
    ...testZeroAmount(rows),
    ...testShortNarration(rows, { narrationMinLen }),
    ...testUnusualAmounts(rows),
    ...testWeekendEntries(rows),
    ...testSeldomUsedAccounts(rows),
    ...testRareUsers(rows),
    ...testNullFields(rows),
    ...testBackdatedEntries(rows, { backdateDays }),
    ...testPostdatedEntries(rows),
    ...testAfterYearEnd(rows),
    ...testRepeatingDigits(rows),
    ...testHolidayEntries(rows, holidayDates),
    ...testAmountAboveThreshold(rows, maxAmount),
    ...testRoundNumbers(rows, { roundNumberMin }),
    ...testZScore(rows, { zScoreThreshold }),
    ...testSplitting(rows, { splittingThreshold }),
    ...testSameDayReversals(rows),
    ...testPeriodEndClustering(rows),
    ...testDormantAccounts(rows),
    ...testUserConcentration(rows),
    ...testOffHours(rows),
    ...testDuplicateEntries(rows),
  ]

  const byIndex = new Map()
  for (const flag of allFlags) {
    if (!byIndex.has(flag.rowIndex)) {
      byIndex.set(flag.rowIndex, { rowIndex: flag.rowIndex, row: flag.row, reasons: [] })
    }
    const entry = byIndex.get(flag.rowIndex)
    if (!entry.reasons.includes(flag.reason)) entry.reasons.push(flag.reason)
  }

  const entries = Array.from(byIndex.values())
    .sort((a, b) => a.rowIndex - b.rowIndex)
    .map(entry => {
      let riskScore = entry.reasons.reduce((sum, r) => sum + (RISK_SCORE_MAP[r] || 1), 0)
      // #12 Confidence multiplier: incomplete data reduces confidence in other flags
      if (entry.reasons.includes('Null / Missing Field')) {
        riskScore = Math.round(riskScore * 0.8)
      }
      riskScore = Math.min(riskScore, 100)
      const riskLevel = getRiskLevel(riskScore)
      return { ...entry, riskScore, riskLevel }
    })

  const benfordAnalysis = computeBenfordsLaw(rows)

  return { entries, benfordAnalysis }
}
