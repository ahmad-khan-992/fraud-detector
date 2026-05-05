import { useState } from 'react'
import { exportFraudReport } from '../utils/exportReport'

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
}

const RISK_ROW = {
  High:   'bg-red-50/50 hover:bg-red-50/80',
  Medium: 'bg-amber-50/50 hover:bg-amber-50/80',
  Low:    'bg-emerald-50/30 hover:bg-emerald-50/60',
}

const RISK_BADGE = {
  High:   'bg-red-100 text-red-700 border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low:    'bg-emerald-100 text-emerald-700 border-emerald-200',
}

function getField(row, fieldName) {
  const target = fieldName.trim().toLowerCase()
  const key = Object.keys(row).find(k => k.trim().toLowerCase() === target)
  return key !== undefined ? row[key] : ''
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

function ReasonBadge({ reason }) {
  const cls = REASON_BADGE[reason] || 'bg-slate-100 text-slate-700 border-slate-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${cls}`}>
      {reason}
    </span>
  )
}

const PAGE_SIZE = 25

const TEST_OPTIONS = [
  { label: 'All tests',                  value: '' },
  { label: 'Zero / Null Amount',         value: 'Zero / Null Amount' },
  { label: 'Short Narration',            value: 'Short / Missing Narration' },
  { label: 'Unusually High Amount',      value: 'Unusually High Amount (top 5%)' },
  { label: 'Unusually Low Amount',       value: 'Unusually Low Amount (bottom 5%)' },
  { label: 'Weekend Entry',              value: 'Weekend Entry' },
  { label: 'Seldom Used Account',        value: 'Seldom Used Account' },
  { label: 'Rare User',                  value: 'Rare User' },
  { label: 'Null / Missing Field',       value: 'Null / Missing Field' },
  { label: 'Backdated Entry',            value: 'Backdated Entry' },
  { label: 'Postdated Entry',            value: 'Postdated Entry' },
  { label: 'Entry After Year-End',       value: 'Entry After Year-End' },
  { label: 'Repeating Digit Amount',     value: 'Repeating Digit Amount' },
]

export default function FraudResults({ flaggedEntries }) {
  const [page, setPage]           = useState(0)
  const [testFilter, setTestFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')

  const filtered = flaggedEntries.filter(e => {
    const passesTest = !testFilter || e.reasons.some(r =>
      r === testFilter || r.toLowerCase().includes(testFilter.toLowerCase())
    )
    const passesRisk = !riskFilter || e.riskLevel === riskFilter
    return passesTest && passesRisk
  })

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE)
  const pageEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleTestFilter = (val) => { setTestFilter(val); setPage(0) }
  const handleRiskFilter = (val) => { setRiskFilter(val); setPage(0) }

  if (flaggedEntries.length === 0) return null

  return (
    <div className="card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-900">Flagged Entries</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {filtered.length} of {flaggedEntries.length} entries shown
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={riskFilter}
            onChange={e => handleRiskFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All risk levels</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
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
            onClick={() => exportFraudReport(flaggedEntries)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              {['Row', 'Account', 'Amount', 'Posting Date', 'User', 'Risk', 'Score', 'Tests Triggered', 'Explanation'].map(h => (
                <th
                  key={h}
                  className="text-left py-2 pr-3 font-semibold text-slate-500 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageEntries.map(({ rowIndex, row, reasons, riskLevel, riskScore, explanation }) => (
              <tr
                key={rowIndex}
                className={`border-b border-slate-50 transition-colors ${RISK_ROW[riskLevel] || ''}`}
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
                  <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${RISK_BADGE[riskLevel]}`}>
                    {riskLevel}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-slate-600 font-mono tabular-nums text-center">
                  {riskScore}
                </td>
                <td className="py-2.5 pr-3">
                  <div className="flex flex-wrap gap-1">
                    {reasons.map(r => <ReasonBadge key={r} reason={r} />)}
                  </div>
                </td>
                <td className="py-2.5 pr-2 text-slate-500 max-w-[280px]">
                  <p className="line-clamp-2" title={explanation}>{explanation}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-xs text-slate-400 py-6">No entries match the selected filters.</p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-ghost text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="btn-ghost text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
