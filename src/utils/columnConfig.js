/**
 * Maps each canonical column name to all accepted header variations.
 * All aliases are lowercase — matching is case-insensitive and ignores leading/trailing whitespace.
 */
export const COLUMN_ALIASES = {
  'Journal ID': [
    'journal id', 'journal_id', 'journalid',
    'doc no', 'document number', 'document no', 'document_number', 'document_no',
    'journal no', 'journal number', 'journal_no', 'journal_number',
    'entry no', 'entry number', 'entry_no', 'entry_number',
    'reference no', 'ref no', 'ref_no', 'reference_no',
    'transaction id', 'trans id', 'transaction_id', 'trans_id',
    'voucher no', 'voucher number', 'voucher_no', 'voucher_number',
    'je number', 'je no', 'je_number', 'je_no',
    'source document', 'source_document',
  ],

  'Account Number': [
    'account number', 'account_number', 'accountnumber',
    'acc_no', 'accno', 'acct_no', 'acct no',
    'account_no', 'account no',
    'acct_number', 'acct_num', 'acct num',
    'gl_account', 'gl account', 'glaccount',
    'ledger_account', 'ledger account',
  ],

  'Amount': [
    'amount', 'amt',
    'transaction_amount', 'transaction amount', 'trans_amt', 'trans amt',
    'entry_amount', 'entry amount',
    'je_amount', 'je amount',
    'net_amount', 'net amount',
    'value',
  ],

  'Posting Date': [
    'posting date', 'posting_date', 'postingdate',
    'post_date', 'post date', 'postdate',
    'posted_date', 'posted date',
    'entry_date', 'entry date',
    'transaction_date', 'transaction date', 'trans_date', 'trans date',
    'je_date', 'je date',
    'date_posted', 'date posted',
    'txn_date', 'txn date',
    'journal_date', 'journal date',
  ],

  'Effective Date': [
    'effective date', 'effective_date', 'effectivedate',
    'eff_date', 'eff date', 'effdate',
    'effective_dt', 'effective dt',
    'value_date', 'value date',
    'applicable_date', 'applicable date',
    'effect_date', 'effect date',
    'val_date', 'val date',
  ],

  'User': [
    'user', 'username', 'user_name', 'user name',
    'userid', 'user_id', 'user id',
    'posted_by', 'posted by',
    'created_by', 'created by',
    'entered_by', 'entered by',
    'prepared_by', 'prepared by', 'preparer',
    'operator', 'approver',
    'clerk', 'accountant',
  ],

  'Debit/Credit': [
    'debit/credit', 'debit credit', 'debit_credit',
    'd/c', 'dc', 'dr/cr',
    'type', 'entry type', 'entry_type',
    'posting type', 'posting_type',
    'line type', 'line_type',
    'indicator', 'posting key', 'posting_key',
  ],

  'JE Narration': [
    'je narration', 'je_narration', 'jenarration',
    'narration',
    'description', 'desc',
    'je_description', 'je description',
    'narrative',
    'particulars',
    'details',
    'memo', 'je_memo', 'je memo',
    'journal_narration', 'journal narration',
    'line_description', 'line description',
    'remarks', 'comment', 'comments',
    'note', 'notes',
  ],
}

// Columns required for basic (single-line) analysis
export const REQUIRED_COLUMNS = [
  'Account Number', 'Amount', 'Posting Date', 'Effective Date', 'User', 'JE Narration',
]

// Additional columns that activate double-entry mode when both are present
export const DOUBLE_ENTRY_COLUMNS = ['Journal ID', 'Debit/Credit']

/**
 * Given a list of raw headers, returns a map of canonical name → matched header.
 * Columns with no match are absent from the map.
 */
export function buildColumnMap(headers) {
  const columnMap = {}
  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    const match = headers.find(h => aliases.includes(h.trim().toLowerCase()))
    if (match) columnMap[canonical] = match
  }
  return columnMap
}
