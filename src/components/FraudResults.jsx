import { useState, useMemo, useRef, useEffect } from 'react'
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
  'Orphaned Entry':                    'bg-amber-200 text-amber-900 border-amber-400',
  'Unbalanced Entry':                  'bg-red-300 text-red-900 border-red-500',
  'SoD Violation':                     'bg-red-300 text-red-900 border-red-500',
  'Unusual Account Combination':       'bg-orange-200 text-orange-900 border-orange-400',
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

// ─── User filter multi-select dropdown ───────────────────────────────────────
function UserFilterDropdown({ userStats, userFilter, setUserFilter, t }) {
  const [open, setOpen]           = useState(false)
  const [search, setSearch]       = useState('')
  const ref                       = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const visibleList = useMemo(() => {
    if (!search.trim()) return userStats
    const q = search.toLowerCase()
    return userStats.filter(([u]) => u.toLowerCase().includes(q))
  }, [userStats, search])

  function toggle(user) {
    setUserFilter(prev => {
      const next = new Set(prev)
      if (next.has(user)) next.delete(user); else next.add(user)
      return next
    })
  }

  const isActive = userFilter.size > 0

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
          isActive
            ? 'bg-violet-600 text-white border-violet-600'
            : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
        }`}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
        {isActive
          ? t('fraudResults.userFilterSelected', { count: userFilter.size })
          : t('fraudResults.userFilterAll')}
        {isActive && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/30 text-white text-[10px] font-bold">
            {userFilter.size}
          </span>
        )}
        <svg className={`w-3 h-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-30 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('fraudResults.userSearchPlaceholder')}
                className="w-full pl-7 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-52 overflow-y-auto py-1">
            {visibleList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">{t('fraudResults.userNoResults')}</p>
            ) : (
              visibleList.map(([user, count]) => {
                const checked = userFilter.has(user)
                return (
                  <button
                    key={user}
                    onClick={() => toggle(user)}
                    className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      checked ? 'bg-violet-600 border-violet-600' : 'border-slate-300 bg-white'
                    }`}>
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 text-xs text-slate-700 truncate">{user}</span>
                    <span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      checked ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-slate-50">
            <button
              onClick={() => setUserFilter(new Set(userStats.map(([u]) => u)))}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              {t('fraudResults.userSelectAll')}
            </button>
            <button
              onClick={() => { setUserFilter(new Set()); setSearch('') }}
              className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
            >
              {t('fraudResults.userClearAll')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const PAGE_SIZE  = 25
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
  'Orphaned Entry':              ['Locate the missing counterpart entry in the general ledger', 'Verify with preparer whether a matching DR or CR was excluded from the export', 'Reconcile the orphaned entry to source documents and sub-ledger'],
  'Unbalanced Entry':            ['Obtain the original source document and reconcile to sub-ledger', 'Verify the amounts on both DR and CR sides of this journal entry', 'Escalate to the financial controller if the discrepancy cannot be explained'],
  'SoD Violation':               ['Obtain approval documentation for this journal entry', 'Verify whether a second authoriser exists outside the system', 'Escalate to internal audit if self-approved above materiality threshold'],
  'Unusual Account Combination': ['Obtain business justification for this DR/CR account pairing', 'Verify with the accounting team that this combination is intentional', 'Cross-reference to approved journal entry templates and chart of accounts policy'],
}

function DetailPanel({ entry, onClose, t, holidayMap, onFilterUser }) {
  if (!entry) return null
  const { row, rowIndex, reasons, riskLevel, riskScore, flagDetails = {} } = entry

  const procedures   = [...new Set(reasons.flatMap(r => AUDIT_PROCEDURES[r] || []))]
  const holidayLabel = reasons.includes('Holiday Entry') ? getHolidayLabel(row, holidayMap) : null
  const user         = getField(row, 'User') || '—'
  const drAccount    = row['DR Account'] || ''
  const crAccount    = row['CR Account'] || ''
  const isDE         = Boolean(drAccount || crAccount)

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
              {isDE
                ? `DR: ${drAccount || '—'} / CR: ${crAccount || '—'}`
                : (getField(row, 'Account Number') || 'Unknown Account')
              } — {formatAmount(getField(row, 'Amount'))}
            </p>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg hover:bg-black/10 transition-colors ${riskLevel === 'Critical' ? 'text-white' : 'text-slate-500'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* User banner */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-violet-50 rounded-lg border border-violet-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-violet-200 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-violet-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-wide">{t('fraudResults.detailUserLabel')}</p>
                <p className="text-sm font-semibold text-violet-900 leading-tight">{user}</p>
              </div>
            </div>
            {user !== '—' && (
              <button
                onClick={() => { onFilterUser(user); onClose() }}
                className="text-xs text-violet-600 hover:text-violet-800 font-medium border border-violet-200 hover:border-violet-400 px-2.5 py-1 rounded-lg transition-colors"
              >
                {t('fraudResults.detailFilterByUser')}
              </button>
            )}
          </div>

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
            {reasons.map(r => flagDetails[r] ? (
              <p key={r} className="mt-1.5 text-xs text-slate-600 px-2 py-1.5 bg-slate-50 rounded border border-slate-100 font-mono">
                {flagDetails[r]}
              </p>
            ) : null)}
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
              {Object.entries(row).filter(([k]) => !k.startsWith('_')).map(([k, v], i) => (
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

export default function FraudResults({ flaggedEntries, holidayMap = {}, isDoubleEntry = false }) {
  const { t } = useLanguage()
  const [page, setPage]                   = useState(0)
  const [testFilter, setTestFilter]       = useState('')
  const [riskFilter, setRiskFilter]       = useState('')
  const [userFilter, setUserFilter]       = useState(new Set())
  const [groupByUser, setGroupByUser]     = useState(false)
  const [sortCol, setSortCol]             = useState('riskScore')
  const [sortDir, setSortDir]             = useState('desc')
  const [detailEntry, setDetailEntry]     = useState(null)

  // All unique users with their total flag counts, sorted by count desc
  const userStats = useMemo(() => {
    const map = {}
    for (const entry of flaggedEntries) {
      const user = getField(entry.row, 'User') || '—'
      map[user] = (map[user] || 0) + 1
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [flaggedEntries])

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
    { label: t('fraudResults.testDuplicate'),       value: 'Duplicate Entry' },
    { label: t('fraudResults.testOrphaned'),        value: 'Orphaned Entry' },
    { label: t('fraudResults.testUnbalanced'),      value: 'Unbalanced Entry' },
    { label: t('fraudResults.testSoD'),             value: 'SoD Violation' },
    { label: t('fraudResults.testUnusualAccount'),  value: 'Unusual Account Combination' },
  ]

  const filtered = useMemo(() => {
    return flaggedEntries.filter(e => {
      const passesTest = !testFilter || e.reasons.some(r =>
        r === testFilter || r.toLowerCase().includes(testFilter.toLowerCase())
      )
      const passesRisk = !riskFilter || e.riskLevel === riskFilter
      const passesUser = userFilter.size === 0 || userFilter.has(getField(e.row, 'User') || '—')
      return passesTest && passesRisk && passesUser
    })
  }, [flaggedEntries, testFilter, riskFilter, userFilter])

  const sorted = useMemo(() => {
    return filtered.slice().sort((a, b) => {
      // When groupByUser is active, primary sort is always by user
      if (groupByUser) {
        const ua = (getField(a.row, 'User') || '—').toLowerCase()
        const ub = (getField(b.row, 'User') || '—').toLowerCase()
        if (ua !== ub) return ua < ub ? -1 : 1
        return b.riskScore - a.riskScore
      }
      let aVal, bVal
      if (sortCol === 'riskScore') {
        aVal = a.riskScore; bVal = b.riskScore
      } else if (sortCol === 'riskLevel') {
        aVal = RISK_ORDER[a.riskLevel] ?? 9; bVal = RISK_ORDER[b.riskLevel] ?? 9
      } else if (sortCol === 'amount') {
        aVal = Math.abs(Number(getField(a.row, 'Amount')) || 0)
        bVal = Math.abs(Number(getField(b.row, 'Amount')) || 0)
      } else if (sortCol === 'postingDate') {
        aVal = new Date(getField(a.row, 'Posting Date') || 0).getTime()
        bVal = new Date(getField(b.row, 'Posting Date') || 0).getTime()
      } else if (sortCol === 'row') {
        aVal = a.rowIndex; bVal = b.rowIndex
      } else if (sortCol === 'user') {
        const ua = (getField(a.row, 'User') || '').toLowerCase()
        const ub = (getField(b.row, 'User') || '').toLowerCase()
        return sortDir === 'asc' ? ua.localeCompare(ub) : ub.localeCompare(ua)
      } else {
        aVal = 0; bVal = 0
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [filtered, sortCol, sortDir, groupByUser])

  const totalPages  = Math.ceil(sorted.length / PAGE_SIZE)
  const pageEntries = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Flat display items with group headers injected when groupByUser is on
  const displayItems = useMemo(() => {
    if (!groupByUser) return null
    const items = []
    let lastUser = null
    for (const entry of pageEntries) {
      const user = getField(entry.row, 'User') || '—'
      if (user !== lastUser) {
        const total = userStats.find(([u]) => u === user)?.[1] ?? 0
        items.push({ type: 'header', user, total })
        lastUser = user
      }
      items.push({ type: 'entry', entry })
    }
    return items
  }, [groupByUser, pageEntries, userStats])

  const handleTestFilter = (val) => { setTestFilter(val); setPage(0) }
  const handleRiskFilter = (val) => { setRiskFilter(val); setPage(0) }
  const handleUserFilter = (val) => { setUserFilter(new Set([val])); setPage(0) }
  const handleSort = (col) => {
    if (groupByUser) return // sort locked while grouped
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir(col === 'user' ? 'asc' : 'desc') }
    setPage(0)
  }

  if (flaggedEntries.length === 0) return null

  const SortIcon = ({ col }) => {
    if (groupByUser) return null
    if (sortCol !== col) return <span className="opacity-30 ml-0.5">↕</span>
    return <span className="ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const PILL_LIMIT = 7

  return (
    <>
    {detailEntry && (
      <DetailPanel
        entry={detailEntry}
        onClose={() => setDetailEntry(null)}
        t={t}
        holidayMap={holidayMap}
        onFilterUser={handleUserFilter}
      />
    )}
    <div className="card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-900">{t('fraudResults.title')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('fraudResults.entriesShown', { filtered: filtered.length, total: flaggedEntries.length })}
          </p>
        </div>

        {/* Filters row */}
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

          {/* User multi-select */}
          <UserFilterDropdown
            userStats={userStats}
            userFilter={userFilter}
            setUserFilter={f => { setUserFilter(f); setPage(0) }}
            t={t}
          />

          {/* Group by user toggle */}
          <button
            onClick={() => { setGroupByUser(g => !g); setPage(0) }}
            title={t('fraudResults.groupByUser')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              groupByUser
                ? 'bg-violet-100 text-violet-700 border-violet-300'
                : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
            {t('fraudResults.groupByUser')}
          </button>

          <button
            onClick={() => exportFraudReport(flaggedEntries, 'Fraud_Report.xlsx', holidayMap, isDoubleEntry)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {t('fraudResults.exportExcel')}
          </button>
        </div>
      </div>

      {/* User activity strip — quick-filter pills */}
      {userStats.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3 pb-3 border-b border-slate-100">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-0.5">
            {t('fraudResults.userActivity')}
          </span>
          {userStats.slice(0, PILL_LIMIT).map(([user, count]) => {
            const active = userFilter.has(user)
            return (
              <button
                key={user}
                onClick={() => {
                  setUserFilter(prev => {
                    const next = new Set(prev)
                    if (next.has(user)) next.delete(user); else next.add(user)
                    return next
                  })
                  setPage(0)
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs transition-colors ${
                  active
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50'
                }`}
              >
                <span className="font-medium max-w-[88px] truncate">{user}</span>
                <span className={`text-[10px] font-bold tabular-nums ${active ? 'text-violet-200' : 'text-slate-400'}`}>{count}</span>
              </button>
            )
          })}
          {userStats.length > PILL_LIMIT && (
            <span className="text-xs text-slate-400">+{userStats.length - PILL_LIMIT} {t('fraudResults.userMore')}</span>
          )}
          {userFilter.size > 0 && (
            <button
              onClick={() => { setUserFilter(new Set()); setPage(0) }}
              className="text-xs text-violet-500 hover:text-violet-700 font-medium ml-1 transition-colors"
            >
              {t('fraudResults.userClearAll')}
            </button>
          )}
        </div>
      )}

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
              {isDoubleEntry ? (
                <>
                  <th className="text-left py-2 pr-3 font-semibold text-slate-500 whitespace-nowrap">{t('fraudResults.colDrAccount')}</th>
                  <th className="text-left py-2 pr-3 font-semibold text-slate-500 whitespace-nowrap">{t('fraudResults.colCrAccount')}</th>
                </>
              ) : (
                <th className="text-left py-2 pr-3 font-semibold text-slate-500 whitespace-nowrap">{t('fraudResults.colAccount')}</th>
              )}
              <th onClick={() => handleSort('amount')} className="text-left py-2 pr-3 font-semibold text-slate-500 whitespace-nowrap cursor-pointer select-none hover:text-slate-800">
                {t('fraudResults.colAmount')}<SortIcon col="amount" />
              </th>
              <th onClick={() => handleSort('postingDate')} className="text-left py-2 pr-3 font-semibold text-slate-500 whitespace-nowrap cursor-pointer select-none hover:text-slate-800">
                {t('fraudResults.colPostingDate')}<SortIcon col="postingDate" />
              </th>
              <th onClick={() => handleSort('user')} className="text-left py-2 pr-3 font-semibold text-slate-500 whitespace-nowrap cursor-pointer select-none hover:text-slate-800">
                {t('fraudResults.colUser')}<SortIcon col="user" />
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
            {groupByUser && displayItems ? (
              displayItems.map((item, idx) => {
                if (item.type === 'header') {
                  return (
                    <tr key={`h-${item.user}-${idx}`} className="bg-violet-50 border-b border-violet-100">
                      <td colSpan={isDoubleEntry ? 10 : 9} className="py-1.5 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-violet-200 flex items-center justify-center shrink-0">
                            <svg className="w-3 h-3 text-violet-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                          </div>
                          <span className="text-xs font-bold text-violet-800">{item.user}</span>
                          <span className="text-xs text-violet-500 font-normal">
                            — {item.total} {t('fraudResults.userFlagCount')}
                          </span>
                          <button
                            onClick={() => { handleUserFilter(item.user); setGroupByUser(false) }}
                            className="ml-auto text-[10px] text-violet-500 hover:text-violet-700 font-medium border border-violet-200 rounded px-1.5 py-0.5 transition-colors"
                          >
                            {t('fraudResults.userFilterOnly')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }
                const { entry } = item
                return <EntryRow key={`e-${entry.rowIndex}`} entry={entry} t={t} holidayMap={holidayMap} onSelect={setDetailEntry} isDoubleEntry={isDoubleEntry} />
              })
            ) : (
              pageEntries.map(entry => (
                <EntryRow key={entry.rowIndex} entry={entry} t={t} holidayMap={holidayMap} onSelect={setDetailEntry} isDoubleEntry={isDoubleEntry} />
              ))
            )}
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

// Extracted to avoid re-creating the function inside the map
function EntryRow({ entry, t, holidayMap, onSelect, isDoubleEntry }) {
  const { rowIndex, row, reasons, riskLevel, riskScore } = entry
  const explanation = buildTranslatedExplanation(reasons, t)
  return (
    <tr
      onClick={() => onSelect(entry)}
      className={`border-b border-slate-50 transition-colors cursor-pointer ${RISK_ROW[riskLevel] || ''}`}
    >
      <td className="py-2.5 pr-3 text-slate-400 font-mono tabular-nums">{rowIndex + 1}</td>
      {isDoubleEntry ? (
        <>
          <td className="py-2.5 pr-3 font-medium text-slate-800 whitespace-nowrap">{row['DR Account'] || '—'}</td>
          <td className="py-2.5 pr-3 font-medium text-slate-800 whitespace-nowrap">{row['CR Account'] || '—'}</td>
        </>
      ) : (
        <td className="py-2.5 pr-3 font-medium text-slate-800 whitespace-nowrap">{getField(row, 'Account Number') || '—'}</td>
      )}
      <td className="py-2.5 pr-3 text-slate-700 tabular-nums whitespace-nowrap">{formatAmount(getField(row, 'Amount'))}</td>
      <td className="py-2.5 pr-3 text-slate-700 whitespace-nowrap">{formatDate(getField(row, 'Posting Date'))}</td>
      <td className="py-2.5 pr-3 whitespace-nowrap max-w-[110px]">
        <span className="flex items-center gap-1.5 text-slate-700 truncate">
          <span className="w-4 h-4 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
            <svg className="w-2.5 h-2.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </span>
          <span className="truncate">{getField(row, 'User') || '—'}</span>
        </span>
      </td>
      <td className="py-2.5 pr-3 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${RISK_BADGE_CLS[riskLevel]}`}>
          {t('risk.' + riskLevel)}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-slate-600 font-mono tabular-nums text-center">{riskScore}</td>
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
}
