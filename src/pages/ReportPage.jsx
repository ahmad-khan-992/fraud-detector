import { Link } from 'react-router-dom'
import { useAudit } from '../context/AuditContext'
import { generateInsights } from '../utils/generateInsights'
import { exportFraudReport } from '../utils/exportReport'

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

const RISK_BADGE = {
  High:   'bg-red-100 text-red-700 border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low:    'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const RISK_ROW = {
  High:   'bg-red-50/40',
  Medium: 'bg-amber-50/40',
  Low:    '',
}

function InsightIcon({ type }) {
  if (type === 'critical' || type === 'warning') return (
    <svg className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  )
  return (
    <svg className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
  )
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  )
}

function EmptyState({ hasData }) {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center">
      <div className="p-5 bg-slate-100 rounded-2xl">
        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-600">
          {hasData ? 'Fraud tests not run yet' : 'No report available'}
        </p>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">
          {hasData
            ? 'Your file is uploaded. Go to Upload & Analyse and click Run Tests to generate the fraud report.'
            : 'Upload a GL export and run fraud tests on the Upload & Analyse page to generate a report.'}
        </p>
      </div>
      <Link to="/" className="btn-primary">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {hasData ? 'Go to Upload & Analyse' : 'Get Started'}
      </Link>
    </div>
  )
}

function RunningState() {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center">
      <div className="p-5 bg-brand-50 rounded-2xl">
        <svg className="w-10 h-10 text-brand-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-600">Running fraud detection…</p>
        <p className="text-sm text-slate-400 mt-1">Your report will appear here in a moment.</p>
      </div>
    </div>
  )
}

export default function ReportPage() {
  const { hasRun, isRunning, summary, flaggedEntries, file, loadedSessionName, rows } = useAudit()

  if (isRunning) return <RunningState />
  if (!hasRun) return <EmptyState hasData={rows.length > 0} />

  const { total, flagged, riskPercent, riskCounts, reasonCounts } = summary
  const insights        = generateInsights(summary)
  const keyFindings     = insights.slice(0, 4)
  const flagPct         = parseFloat(riskPercent)
  const reportDate      = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  const fileName        = loadedSessionName || file?.name || 'Unknown File'

  const highRiskEntries = [...flaggedEntries]
    .sort((a, b) => b.riskScore - a.riskScore || a.rowIndex - b.rowIndex)
    .slice(0, 20)

  const breakdownRows = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      pctFlagged: flagged > 0 ? ((count / flagged) * 100).toFixed(1) : '0',
      pctTotal:   total  > 0 ? ((count / total)  * 100).toFixed(1) : '0',
    }))

  return (
    <div className="max-w-5xl mx-auto space-y-0">

      {/* Report header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-brand-600 uppercase tracking-widest">Confidential</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-xs text-slate-400">{reportDate}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Fraud Audit Report</h2>
            <p className="text-sm text-slate-500 mt-1">
              Journal Entry Analysis · {fileName}
            </p>
          </div>
          <div className="flex gap-2 shrink-0 no-print">
            <button
              onClick={() => exportFraudReport(flaggedEntries, `Fraud_Report_${Date.now()}.xlsx`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export Excel
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.073 48.073 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
              Print
            </button>
          </div>
        </div>
      </div>

      <Divider label="Section 1 — Executive Summary" />

      {/* Executive Summary */}
      <div className="card space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-3xl font-bold text-slate-900 tabular-nums">{total.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Total Transactions</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-3xl font-bold text-amber-700 tabular-nums">{flagged.toLocaleString()}</p>
            <p className="text-xs text-amber-600 mt-1 font-medium">Flagged Entries</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-red-50 border border-red-100">
            <p className="text-3xl font-bold text-red-700 tabular-nums">{riskCounts.High || 0}</p>
            <p className="text-xs text-red-600 mt-1 font-medium">High Risk</p>
          </div>
          <div className={`text-center p-4 rounded-xl border ${flagPct >= 20 ? 'bg-red-50 border-red-100' : flagPct >= 10 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <p className={`text-3xl font-bold tabular-nums ${flagPct >= 20 ? 'text-red-700' : flagPct >= 10 ? 'text-amber-700' : 'text-emerald-700'}`}>{riskPercent}%</p>
            <p className={`text-xs mt-1 font-medium ${flagPct >= 20 ? 'text-red-600' : flagPct >= 10 ? 'text-amber-600' : 'text-emerald-600'}`}>Flag Rate</p>
          </div>
        </div>

        {/* Risk level bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-700">Flagged Entries by Risk Level</p>
            <p className="text-xs text-slate-400">{flagged} total flagged</p>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {flagged > 0 ? (
              <>
                {riskCounts.High   > 0 && <div className="bg-red-500"    style={{ width: `${(riskCounts.High   / flagged) * 100}%` }} title={`High: ${riskCounts.High}`} />}
                {riskCounts.Medium > 0 && <div className="bg-amber-400"  style={{ width: `${(riskCounts.Medium / flagged) * 100}%` }} title={`Medium: ${riskCounts.Medium}`} />}
                {riskCounts.Low    > 0 && <div className="bg-emerald-400" style={{ width: `${(riskCounts.Low    / flagged) * 100}%` }} title={`Low: ${riskCounts.Low}`} />}
              </>
            ) : (
              <div className="bg-slate-100 flex-1 rounded-full" />
            )}
          </div>
          <div className="flex gap-4 mt-2">
            {['High', 'Medium', 'Low'].map(level => (
              <div key={level} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${level === 'High' ? 'bg-red-500' : level === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className="text-xs text-slate-500">{level}: {riskCounts[level] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key findings */}
        {keyFindings.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-3">Key Findings</p>
            <div className="space-y-3">
              {keyFindings.map((insight, i) => (
                <div key={i} className="flex gap-2.5">
                  <InsightIcon type={insight.type} />
                  <div>
                    <span className="text-xs font-semibold text-slate-700">{insight.title}: </span>
                    <span className="text-xs text-slate-600 leading-relaxed">{insight.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Divider label="Section 2 — High-Risk Transactions" />

      {/* High-risk table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Top High-Risk Entries</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {highRiskEntries.length} entries sorted by risk score · {flaggedEntries.length} total flagged
            </p>
          </div>
          {flaggedEntries.length > 20 && (
            <Link to="/" className="text-xs text-brand-600 hover:text-brand-700 font-medium no-print">
              View all on Dashboard →
            </Link>
          )}
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                {['Row', 'Account', 'Amount', 'Posting Date', 'User', 'Risk', 'Score', 'Triggered Tests'].map(h => (
                  <th key={h} className="text-left pb-2.5 pr-4 font-semibold text-slate-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {highRiskEntries.map(({ rowIndex, row, reasons, riskLevel, riskScore }) => (
                <tr key={rowIndex} className={`border-b border-slate-50 ${RISK_ROW[riskLevel] || ''}`}>
                  <td className="py-2.5 pr-4 text-slate-400 font-mono tabular-nums">{rowIndex + 1}</td>
                  <td className="py-2.5 pr-4 font-medium text-slate-800 whitespace-nowrap">{getField(row, 'Account Number') || '—'}</td>
                  <td className="py-2.5 pr-4 text-slate-700 tabular-nums whitespace-nowrap">{formatAmount(getField(row, 'Amount'))}</td>
                  <td className="py-2.5 pr-4 text-slate-600 whitespace-nowrap">{formatDate(getField(row, 'Posting Date'))}</td>
                  <td className="py-2.5 pr-4 text-slate-600 whitespace-nowrap max-w-[90px] truncate">{getField(row, 'User') || '—'}</td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-semibold ${RISK_BADGE[riskLevel]}`}>
                      {riskLevel}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600 font-mono tabular-nums text-center">{riskScore}</td>
                  <td className="py-2.5 pr-2">
                    <div className="flex flex-wrap gap-1">
                      {reasons.slice(0, 3).map(r => (
                        <span key={r} className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 whitespace-nowrap">
                          {r.length > 22 ? r.slice(0, 22) + '…' : r}
                        </span>
                      ))}
                      {reasons.length > 3 && (
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-xs border border-slate-200">
                          +{reasons.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {flaggedEntries.length === 0 && (
          <p className="text-center text-xs text-slate-400 py-8">No flagged entries in this dataset.</p>
        )}
      </div>

      <Divider label="Section 3 — Risk Breakdown by Test" />

      {/* Breakdown by test */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Fraud Test Results</h3>
        <p className="text-xs text-slate-500 mb-4">Flags triggered across 11 audit checks</p>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                {['Test Name', 'Flags', '% of Flagged', '% of Total', 'Bar'].map(h => (
                  <th key={h} className="text-left pb-2.5 pr-4 font-semibold text-slate-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {breakdownRows.map(({ name, count, pctFlagged, pctTotal }) => (
                <tr key={name} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 pr-4 font-medium text-slate-700 whitespace-nowrap">{name}</td>
                  <td className="py-2.5 pr-4 text-slate-900 font-semibold tabular-nums">{count}</td>
                  <td className="py-2.5 pr-4 text-slate-500 tabular-nums">{pctFlagged}%</td>
                  <td className="py-2.5 pr-4 text-slate-400 tabular-nums">{pctTotal}%</td>
                  <td className="py-2.5 pr-2 w-32">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all"
                        style={{ width: `${Math.max(parseFloat(pctFlagged), 2)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {breakdownRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">No fraud flags detected.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-1 pb-4">
        <p className="text-xs text-slate-400 leading-relaxed">
          This report is generated automatically by AuditIQ and is intended as a starting point for further investigation.
          All flagged items require professional judgement before any action is taken.
          Generated on {reportDate}.
        </p>
      </div>
    </div>
  )
}
