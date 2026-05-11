import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { exportFraudReport } from '../utils/exportReport'
import { REASON_KEYS, buildTranslatedExplanation } from '../utils/fraudTests'

const REASON_BADGE = {
  'Zero / Null Amount':                'bg-red-100 text-red-700 border-red-200',
  'Short / Missing Narration':         'bg-amber-100 text-amber-700 border-amber-200',
  'Unusually High Amount (top 5%)':    'bg-purple-100 text-purple-700 border-purple-200',
  'Unusually Low Amount (bottom 5%)':  'bg-blue-100 text-blue-700 border-blue-200',
  'Weekend Entry (Saturday)':          'bg-sky-100 text-sky-700 border-sky-200',
  'Weekend Entry (Sunday)':            'bg-sky-100 text-sky-700 border-sky-200',
  'Seldom Used Account':               'bg-orange-100 text-orange-700 border-orange-200',
  'Rare User':                         'bg-pink-100 text-pink-700 border-pink-200',
  'Null / Missing Field':              'bg-rose-100 text-rose-700 border-rose-200',
  'Backdated Entry':                   'bg-red-200 text-red-800 border-red-300',
  'Postdated Entry':                   'bg-violet-100 text-violet-700 border-violet-200',
  'Entry After Year-End':              'bg-red-300 text-red-900 border-red-400',
  'Repeating Digit Amount':            'bg-teal-100 text-teal-700 border-teal-200',
  'Holiday Entry':                     'bg-rose-200 text-rose-800 border-rose-300',
  'Amount Above Threshold':            'bg-violet-100 text-violet-700 border-violet-200',
  'Round Number':                      'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Z-Score Anomaly':                   'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Splitting / Structuring':           'bg-red-100 text-red-800 border-red-300',
  'Same-Day Reversal':                 'bg-orange-200 text-orange-800 border-orange-300',
  'Period-End Clustering':             'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Dormant Account Reactivation':      'bg-slate-100 text-slate-700 border-slate-200',
  'User Concentration Risk':           'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'Off-Hours Posting':                 'bg-stone-100 text-stone-700 border-stone-200',
  'Duplicate Entry':                   'bg-gray-200 text-gray-800 border-gray-300',
}

const RISK_ROW = {
  Critical: 'bg-red-100/70 hover:bg-red-100',
  High:     'bg-red-50/50 hover:bg-red-50/80',
  Medium:   'bg-amber-50/50 hover:bg-amber-50/80',
  Low:      'bg-emerald-50/30 hover:bg-emerald-50/60',
}

const RISK_BADGE_CLS = {
  Critical: 'bg-red-900 text-red-100 border-red-700',
  High:     'bg-red-100 text-red-700 border-red-200',
  Medium:   'bg-amber-100 text-amber-700 border-amber-200',
  Low:      'bg-emerald-100 text-emerald-700 border-emerald-200',
}

function getField(row, fieldName) {
  const target = fieldName.trim().toLowerCase()
  const key = Object.keys(row).find(k => k.trim().toLowerCase() === target)
  return key !== undefined ? row[key] : ''
}

function dateToKey(val) {
  if (!val && val !== 0) return null
  let d
  if (val instanceof Date) d = val
  else if (typeof val === 'number' && val > 0) d = new Date(Math.round((val - 25569) * 86400 * 1000))
  else { d = new Date(val); if (isNaN(d.getTime())) return null }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getHolidayLabel(row, holidayMap) {
  if (!holidayMap || Object.keys(holidayMap).length === 0) return null
  const key = dateToKey(getField(row, 'Posting Date'))
  return key ? (holidayMap[key] || null) : null
}

function formatAmount(val) {
  const n = Number(val)
  if (isNaN(n)) return val ?? '—'
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(val) {
  if (!val && val !== 0) return '—'
  if (val instanceof Date) return val.toLocaleDateString()
  const d = new Date(val)
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString()
}

function ReasonBadge({ reason, t, sublabel }) {
  const cls = REASON_BADGE[reason] || 'bg-slate-100 text-slate-700 border-slate-200'
  const key = REASON_KEYS[reason]
  const label = key ? t('reasons.' + key) : reason
  return (
    <span
      className={`inline-flex flex-col px-2 py-0.5 rounded border text-xs font-medium ${cls}`}
      title={sublabel || undefined}
    >
      <span>{label}</span>
      {sublabel && (
        <span className="text-[10px] font-normal opacity-75 leading-tight">{sublabel}</span>
      )}
    </span>
  )
}

const PAGE_SIZE = 25

const RISK_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 }

const AUDIT_PROCEDURES = {
  'Backdated Entry':              ['Obtain supporting documentation for this journal entry', 'Verify authorization from controller for late posting', 'Cross-reference to source document or bank statement'],
  'Postdated Entry':              ['Confirm business purpose for future-dated posting', 'Check if system controls allow future date entry', 'Review authorization trail'],
  'Entry After Year-End':         ['Verify period-end cut-off procedures', 'Obtain controller sign-off for post period entry', 'Check if entry relates to prior period adjustments'],
  'Zero / Null Amount':           ['Confirm the entry was intentional', 'Check if amount field was populated in the source system', 'Verify posting is complete and not a partial entry'],
  'Short / Missing Narration':    ['Request preparer to provide adequate narration', 'Verify the entry purpose from supporting documents', 'Review system configuration for narration requirements'],
  'Unusually High Amount (top 5%)': ['Perform substantive test of detail', 'Obtain original invoice or approval documentation', 'Confirm amount with budget or expected value'],
  'Round Number':                 ['Verify amount against source document — round numbers may indicate estimates', 'Request supporting documentation for exact amount', 'Review history of similar round-number entries'],
  'Splitting / Structuring':      ['Identify all related entries by same user/account/date', 'Determine if combined amount exceeds approval threshold', 'Escalate to audit manager — potential intentional structuring'],
  'Same-Day Reversal':            ['Obtain explanation for reversal from preparer', 'Confirm both entries have approval', 'Check if reversal was used to hide a misposting'],
  'Period-End Clustering':        ['Review all entries posted on this date', 'Confirm end-of-period procedures were followed', 'Check for earnings management signals'],
  'Dormant Account Reactivation': ['Confirm account should be active', 'Verify authorization to reactivate account', 'Review all entries to this account in the current period'],
  'User Concentration Risk':      ['Review segregation of duties for this user', 'Confirm no single user should have this level of posting authority', 'Escalate SoD violation to IT audit'],
  'Off-Hours Posting':            ['Confirm preparer was authorized to post outside business hours', 'Review if overtime or after-hours work was approved', 'Check for system override indicators'],
  'Z-Score Anomaly':              ['Compare amount to historical entries for this account', 'Obtain business justification for the unusual amount', 'Perform analytical procedures on this account'],
  'Duplicate Entry':              ['Compare all fields against the potential duplicate', 'Confirm whether one entry should be reversed', 'Check if duplicate posting created a net effect on the GL'],
  'Holiday Entry':                ['Confirm authorization for posting on this holiday', 'Verify business necessity of the transaction', 'Review approver credentials for this posting'],
  'Amount Above Threshold':       ['Obtain additional approval documentation', 'Verify the entry against materiality guidelines', 'Escalate to senior management review'],
  'Null / Missing Field':         ['Request complete data from the preparer', 'Check source system for missing field values', 'Validate whether entry can be posted without all required fields'],
  'Seldom Used Account':          ['Verify the account code is correct', 'Confirm business purpose for using this account', 'Review authorization for posting to inactive accounts'],
  'Rare User':                    ['Verify the user account is still active', 'Confirm the user was authorized to post this entry', 'Review other entries by this user in the period'],
  'Weekend Entry (Saturday)':     ['Confirm authorization for weekend posting', 'Review if business operations required this entry', 'Check for override indicators in the posting log'],
  'Weekend Entry (Sunday)':       ['Confirm authorization for weekend posting', 'Review if business operations required this entry', 'Check for override indicators in the posting log'],
  'Repeating Digit Amount':       ['Verify amount against source document', 'Confirm amount is not a test or placeholder value', 'Review history of similar repeating-digit entries'],
  'Unusually Low Amount (bottom 5%)': ['Confirm the amount is correct and complete', 'Check for potential partial posting or rounding error', 'Obtain supporting documentation'],
}

function DetailPanel({ entry, onClose, t, holidayMap }) {
  if (!entry) return null
  const { row, rowIndex, reasons, riskLevel, riskScore } = entry

  const procedures    = [...new Set(reasons.flatMap(r => AUDIT_PROCEDURES[r] || []))]
  const holidayLabel  = reasons.includes('Holiday Entry') ? getHolidayLabel(row, holidayMap) : null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white shadow-2xl overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Panel header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b ${
          riskLevel === 'Critical' ? 'bg-red-900 text-white' :
          riskLevel === 'High'     ? 'bg-red-50 border-red-200' :
          riskLevel === 'Medium'   ? 'bg-amber-50 border-amber-200' :
                                     'bg-emerald-50 border-emerald-200'
        }`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${riskLevel === 'Critical' ? 'text-red-200' : 'text-slate-400'}`}>
              {t('fraudResults.detailRowInfo', { row: rowIndex + 1, risk: t('risk.' + riskLevel), score: riskScore })}
            </p>
            <p className={`text-sm font-semibold mt-0.5 ${riskLevel === 'Critical' ? 'text-white' : 'text-slate-800'}`}>
              {getField(row, 'Account Number') || 'Unknown Account'} — {formatAmount(getField(row, 'Amount'))}
            </p>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg hover:bg-black/10 transition-colors ${riskLevel === 'Critical' ? 'text-white' : 'text-slate-500'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Reasons */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('fraudResults.detailFlagsTitle')}</p>
            <div className="flex flex-wrap gap-1.5">
              {reasons.map(r => (
                <ReasonBadge
                  key={r}
                  reason={r}
                  t={t}
                  sublabel={r === 'Holiday Entry' && holidayLabel ? holidayLabel : undefined}
                />
              ))}
            </div>
            {holidayLabel && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-rose-50 rounded-lg border border-rose-100">
                <svg className="w-3.5 h-3.5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span className="text-xs font-semibold text-rose-700">{t('holidayFilter.holidayNameLabel')}:</span>
                <span className="text-xs text-rose-600">{holidayLabel}</span>
              </div>
            )}
          </div>

          {/* All row fields */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('fraudResults.detailFieldsTitle')}</p>
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              {Object.entries(row).map(([k, v], i) => (
                <div key={k} className={`flex gap-3 px-3 py-2 text-xs ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                  <span className="font-medium text-slate-500 w-36 shrink-0 truncate">{k}</span>
                  <span className="text-slate-800 break-words min-w-0">
                    {v instanceof Date ? v.toLocaleDateString() : (v === null || v === undefined || v === '') ? <span className="text-slate-300 italic">—</span> : String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Audit procedures */}
          {procedures.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('fraudResults.detailProcTitle')}</p>
              <ol className="space-y-2">
                {procedures.map((p, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-slate-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[10px]">{i + 1}</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FraudResults({ flaggedEntries, holidayMap = {} }) {
  const { t } = useLanguage()
  const [page, setPage]             = useState(0)
  const [testFilter, setTestFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [sortCol, setSortCol]       = useState('riskScore')
  const [sortDir, setSortDir]       = useState('desc')
  const [detailEntry, setDetailEntry] = useState(null)

  const TEST_OPTIONS = [
    { label: t('fraudResults.testAll'),            value: '' },
    { label: t('fraudResults.testZeroAmount'),     value: 'Zero / Null Amount' },
    { label: t('fraudResults.testShortNarration'), value: 'Short / Missing Narration' },
    { label: t('fraudResults.testHighAmount'),     value: 'Unusually High Amount (top 5%)' },
    { label: t('fraudResults.testLowAmount'),      value: 'Unusually Low Amount (bottom 5%)' },
    { label: t('fraudResults.testWeekend'),        value: 'Weekend Entry' },
    { label: t('fraudResults.testSeldomAccount'),  value: 'Seldom Used Account' },
    { label: t('fraudResults.testRareUser'),       value: 'Rare User' },
    { label: t('fraudResults.testNullField'),      value: 'Null / Missing Field' },
    { label: t('fraudResults.testBackdated'),      value: 'Backdated Entry' },
    { label: t('fraudResults.testPostdated'),      value: 'Postdated Entry' },
    { label: t('fraudResults.testYearEnd'),        value: 'Entry After Year-End' },
    { label: t('fraudResults.testRepeating'),      value: 'Repeating Digit Amount' },
    { label: t('fraudResults.testHoliday'),        value: 'Holiday Entry' },
    { label: t('fraudResults.testAmountThreshold'), value: 'Amount Above Threshold' },
    { label: t('fraudResults.testRoundNumber'),    value: 'Round Number' },
    { label: t('fraudResults.testZScore'),         value: 'Z-Score Anomaly' },
    { label: t('fraudResults.testSplitting'),      value: 'Splitting / Structuring' },
    { label: t('fraudResults.testReversal'),       value: 'Same-Day Reversal' },
    { label: t('fraudResults.testPeriodEnd'),      value: 'Period-End Clustering' },
    { label: t('fraudResults.testDormant'),        value: 'Dormant Account Reactivation' },
    { label: t('fraudResults.testUserConc'),       value: 'User Concentration Risk' },
    { label: t('fraudResults.testOffHours'),       value: 'Off-Hours Posting' },
    { label: t('fraudResults.testDuplicate'),      value: 'Duplicate Entry' },
  ]

  const filtered = flaggedEntries
    .filter(e => {
      const passesTest = !testFilter || e.reasons.some(r =>
        r === testFilter || r.toLowerCase().includes(testFilter.toLowerCase())
      )
      const passesRisk = !riskFilter || e.riskLevel === riskFilter
      return passesTest && passesRisk
    })
    .slice()
    .sort((a, b) => {
      let aVal, bVal
      if (sortCol === 'riskScore') { aVal = a.riskScore; bVal = b.riskScore }
      else if (sortCol === 'riskLevel') { aVal = RISK_ORDER[a.riskLevel] ?? 9; bVal = RISK_ORDER[b.riskLevel] ?? 9 }
      else if (sortCol === 'amount') {
        aVal = Math.abs(Number(getField(a.row, 'Amount')) || 0)
        bVal = Math.abs(Number(getField(b.row, 'Amount')) || 0)
      }
      else if (sortCol === 'postingDate') {
        aVal = new Date(getField(a.row, 'Posting Date') || 0).getTime()
        bVal = new Date(getField(b.row, 'Posting Date') || 0).getTime()
      }
      else if (sortCol === 'row') { aVal = a.rowIndex; bVal = b.rowIndex }
      else { aVal = 0; bVal = 0 }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE)
  const pageEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleTestFilter = (val) => { setTestFilter(val); setPage(0) }
  const handleRiskFilter = (val) => { setRiskFilter(val); setPage(0) }
  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
    setPage(0)
  }

  if (flaggedEntries.length === 0) return null

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span className="opacity-30 ml-0.5">↕</span>
    return <span className="ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <>
    {detailEntry && <DetailPanel entry={detailEntry} onClose={() => setDetailEntry(null)} t={t} holidayMap={holidayMap} />}
    <div className="card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-900">{t('fraudResults.title')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('fraudResults.entriesShown', { filtered: filtered.length, total: flaggedEntries.length })}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={riskFilter}
            onChange={e => handleRiskFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">{t('fraudResults.allRisk')}</option>
            <option value="Critical">{t('fraudResults.criticalRisk')}</option>
            <option value="High">{t('fraudResults.highRisk')}</option>
            <option value="Medium">{t('fraudResults.mediumRisk')}</option>
            <option value="Low">{t('fraudResults.lowRisk')}</option>
          </select>

          <select
            value={testFilter}
            onChange={e => handleTestFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {TEST_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => exportFraudReport(flaggedEntries, 'Fraud_Report.xlsx', holidayMap)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {t('fraudResults.exportExcel')}
          </button>
        </div>
      </div>

      {/* Click hint */}
      <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
        </svg>
        {t('fraudResults.clickHint')}
      </p>

      {/* Table */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              <th onClick={() => handleSort('row')} className="text-left py-2 pr-3 font-semibold text-slate-500 whitespace-nowrap cursor-pointer select-none hover:text-slate-800">
                {t('fraudResults.colRow')}<SortIcon col="row" />
              </th>
              <th className="text-left py-2 pr-3 font-semibold text-slate-500 whitespace-nowrap">
                {t('fraudResults.colAccount')}
              </th>
              <th onClick={() => handleSort('amount')} className="text-left py-2 pr-3 font-semibold text-slate-500 whitespace-nowrap cursor-pointer select-none hover:text-slate-800">
                {t('fraudResults.colAmount')}<SortIcon col="amount" />
              </th>
              <th onClick={() => handleSort('postingDate')} className="text-left py-2 pr-3 font-semibold text-slate-500 whitespace-nowrap cursor-pointer select-none hover:text-slate-800">
                {t('fraudResults.colPostingDate')}<SortIcon col="postingDate" />
              </th>
              <th className="text-left py-2 pr-3 font-semibold text-slate-500 whitespace-nowrap">
                {t('fraudResults.colUser')}
              </th>
              <th onClick={() => handleSort('riskLevel')} className="text-left py-2 pr-3 font-semibold text-slate-500 whitespace-nowrap cursor-pointer select-none hover:text-slate-800">
                {t('fraudResults.colRisk')}<SortIcon col="riskLevel" />
              </th>
              <th onClick={() => handleSort('riskScore')} className="text-left py-2 pr-3 font-semibold text-slate-500 whitespace-nowrap cursor-pointer select-none hover:text-slate-800">
                {t('fraudResults.colScore')}<SortIcon col="riskScore" />
              </th>
              <th className="text-left py-2 pr-3 font-semibold text-slate-500 whitespace-nowrap">
                {t('fraudResults.colTests')}
              </th>
              <th className="text-left py-2 pr-2 font-semibold text-slate-500 whitespace-nowrap">
                {t('fraudResults.colExplanation')}
              </th>
            </tr>
          </thead>
          <tbody>
            {pageEntries.map((entry) => {
              const { rowIndex, row, reasons, riskLevel, riskScore } = entry
              const explanation = buildTranslatedExplanation(reasons, t)
              return (
                <tr
                  key={rowIndex}
                  onClick={() => setDetailEntry(entry)}
                  className={`border-b border-slate-50 transition-colors cursor-pointer ${RISK_ROW[riskLevel] || ''}`}
                >
                  <td className="py-2.5 pr-3 text-slate-400 font-mono tabular-nums">
                    {rowIndex + 1}
                  </td>
                  <td className="py-2.5 pr-3 font-medium text-slate-800 whitespace-nowrap">
                    {getField(row, 'Account Number') || '—'}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-700 tabular-nums whitespace-nowrap">
                    {formatAmount(getField(row, 'Amount'))}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-700 whitespace-nowrap">
                    {formatDate(getField(row, 'Posting Date'))}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-700 whitespace-nowrap max-w-[100px] truncate">
                    {getField(row, 'User') || '—'}
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${RISK_BADGE_CLS[riskLevel]}`}>
                      {t('risk.' + riskLevel)}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-600 font-mono tabular-nums text-center">
                    {riskScore}
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="flex flex-wrap gap-1">
                      {reasons.map(r => (
                        <ReasonBadge
                          key={r}
                          reason={r}
                          t={t}
                          sublabel={r === 'Holiday Entry' ? getHolidayLabel(row, holidayMap) || undefined : undefined}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 pr-2 text-slate-500 max-w-[280px]">
                    <p className="line-clamp-2" title={explanation}>{explanation}</p>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-xs text-slate-400 py-6">{t('fraudResults.noMatch')}</p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-ghost text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('fraudResults.previous')}
          </button>
          <span className="text-xs text-slate-500">
            {t('fraudResults.page', { page: page + 1, total: totalPages })}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="btn-ghost text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('fraudResults.next')}
          </button>
        </div>
      )}
    </div>
    </>
  )
}
