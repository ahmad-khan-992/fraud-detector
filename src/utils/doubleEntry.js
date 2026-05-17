function getField(row, fieldName) {
  const target = fieldName.trim().toLowerCase()
  const key = Object.keys(row).find(k => k.trim().toLowerCase() === target)
  return key !== undefined ? row[key] : undefined
}

export function normalizeDebitCredit(value) {
  if (value === null || value === undefined || value === '') return null
  const v = String(value).trim().toLowerCase()
  if (['dr', 'd', 'debit', '1'].includes(v)) return 'DR'
  if (['cr', 'c', 'credit', '-1'].includes(v)) return 'CR'
  return null
}

// Default account-number ranges for type classification (per-client configurable)
const ACCOUNT_RANGES = [
  { type: 'cash',             lo: 1000, hi: 1999 },
  { type: 'retainedEarnings', lo: 3000, hi: 3999 },
  { type: 'revenue',          lo: 4000, hi: 4999 },
  { type: 'expense',          lo: 5000, hi: 8999 },
  { type: 'suspense',         lo: 9000, hi: 9999 },
]

export function classifyAccount(accountNumber, accountName = '') {
  const name = String(accountName).toLowerCase()
  const numStr = String(accountNumber || '').replace(/\D/g, '')
  const num = numStr ? parseInt(numStr, 10) : NaN

  if (name.includes('interco') || name.includes('inter-company') || name.includes('intercompany')) return 'intercompany'
  if (name.includes('suspense')) return 'suspense'
  if (name.includes('retained earning')) return 'retainedEarnings'
  if (name.includes('cash') || name.includes('bank')) return 'cash'
  if (name.includes('expense')) return 'expense'

  if (!isNaN(num)) {
    for (const { type, lo, hi } of ACCOUNT_RANGES) {
      if (num >= lo && num <= hi) return type
    }
  }
  return 'unknown'
}

/**
 * Groups raw rows by Journal ID into transaction objects.
 * Returns { transactions, invalidDCRows, validPairCount }.
 *
 * Each transaction object uses canonical field names the existing tests understand,
 * plus _-prefixed metadata fields used by the three new double-entry tests.
 */
export function groupIntoTransactions(rows) {
  const groups = {}
  const invalidDCRows = []

  for (let i = 0; i < rows.length; i++) {
    const row       = rows[i]
    const journalId = String(getField(row, 'Journal ID') ?? '').trim()
    const dcRaw     = getField(row, 'Debit/Credit')
    const dc        = normalizeDebitCredit(dcRaw)

    if (!journalId) continue

    if (dc === null) {
      invalidDCRows.push(i)
      continue
    }

    if (!groups[journalId]) groups[journalId] = { journalId, drLines: [], crLines: [] }

    if (dc === 'DR') {
      groups[journalId].drLines.push({ rowIndex: i, row })
    } else {
      groups[journalId].crLines.push({ rowIndex: i, row })
    }
  }

  const transactions = Object.values(groups).map(({ journalId, drLines, crLines }) =>
    buildTransactionObject(journalId, drLines, crLines)
  )

  const validPairCount = transactions.filter(tx => !tx._isOrphaned).length

  return { transactions, invalidDCRows, validPairCount }
}

function buildTransactionObject(journalId, drLines, crLines) {
  const primaryDR = drLines[0]?.row
  const primaryCR = crLines[0]?.row
  const primary   = primaryDR || primaryCR

  const sumAmounts = (lines) => lines.reduce((sum, { row }) => {
    const amt = Math.abs(Number(getField(row, 'Amount') ?? 0))
    return isNaN(amt) ? sum : sum + amt
  }, 0)

  const drTotal = sumAmounts(drLines)
  const crTotal = sumAmounts(crLines)

  const uniqueStrings = (lines, field) =>
    [...new Set(lines.map(({ row }) => String(getField(row, field) ?? '').trim()).filter(Boolean))]

  const drAccounts = uniqueStrings(drLines, 'Account Number')
  const crAccounts = uniqueStrings(crLines, 'Account Number')
  const drUsers    = uniqueStrings(drLines, 'User')
  const crUsers    = uniqueStrings(crLines, 'User')

  return {
    // Canonical fields existing tests read by name
    'Journal ID':     journalId,
    'Account Number': drAccounts[0] || crAccounts[0] || '',
    'DR Account':     drAccounts[0] || '',
    'CR Account':     crAccounts[0] || '',
    'Amount':         drTotal,
    'Posting Date':   primary ? getField(primary, 'Posting Date')   : null,
    'Effective Date': primary ? getField(primary, 'Effective Date') : null,
    'User':           drUsers[0] || crUsers[0] || '',
    'JE Narration':   primary ? getField(primary, 'JE Narration')  : '',
    'Debit/Credit':   'DR',

    // Metadata for new tests (filtered from display by _ prefix)
    _journalId:   journalId,
    _drTotal:     drTotal,
    _crTotal:     crTotal,
    _drUsers:     drUsers,
    _crUsers:     crUsers,
    _drAccounts:  drAccounts,
    _crAccounts:  crAccounts,
    _drLines:     drLines.map(l => l.row),
    _crLines:     crLines.map(l => l.row),
    _isOrphaned:  drLines.length === 0 || crLines.length === 0,
  }
}
