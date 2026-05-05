import { Link } from 'react-router-dom'
import { useAudit } from '../context/AuditContext'
import RiskDistributionChart from '../components/charts/RiskDistributionChart'
import IndicatorFrequencyChart from '../components/charts/IndicatorFrequencyChart'
import SmartInsights from '../components/SmartInsights'

function EmptyState({ hasData }) {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center">
      <div className="p-5 bg-slate-100 rounded-2xl">
        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-600">
          {hasData ? 'Fraud tests not run yet' : 'No audit data yet'}
        </p>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">
          {hasData
            ? 'Your file is uploaded. Go to Upload & Analyse and click Run Tests to generate analytics.'
            : 'Upload a GL export and run fraud tests on the Upload & Analyse page to see visual analytics here.'}
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

function StatCard({ label, value, valueClass, sub, icon }) {
  return (
    <div className="card flex items-start gap-4">
      {icon && (
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 tabular-nums ${valueClass || 'text-slate-900'}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
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
        <p className="text-sm text-slate-400 mt-1">Analytics will appear here in a moment.</p>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { hasRun, isRunning, summary, rows } = useAudit()

  if (isRunning) return <RunningState />
  if (!hasRun) return <EmptyState hasData={rows.length > 0} />

  const { total, flagged, riskPercent, riskCounts, reasonCounts } = summary
  const flagPct = parseFloat(riskPercent)
  const rateColor = flagPct >= 20 ? 'text-red-600' : flagPct >= 10 ? 'text-amber-600' : flagPct > 0 ? 'text-emerald-600' : 'text-slate-400'

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Entries"
          value={total.toLocaleString()}
          sub="rows analysed"
          icon={
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125" />
            </svg>
          }
        />
        <StatCard
          label="Flagged Entries"
          value={flagged.toLocaleString()}
          sub="require review"
          valueClass={flagged > 0 ? 'text-amber-600' : 'text-emerald-600'}
          icon={
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l1.664 1.664M21 21l-1.5-1.5m-5.485-1.242L12 17.25 4.5 21V8.742m.164-4.078a2.15 2.15 0 011.743-.456l4.21.602 7.697-7.696a1 1 0 011.414 0l.242.241a1 1 0 010 1.414L9.168 14.093l.402 2.83a2.15 2.15 0 01-.498 1.77l-.08.08" />
            </svg>
          }
        />
        <StatCard
          label="High Risk"
          value={(riskCounts.High || 0).toLocaleString()}
          sub="need immediate action"
          valueClass={riskCounts.High > 0 ? 'text-red-600' : 'text-slate-400'}
          icon={
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
        <StatCard
          label="Flag Rate"
          value={`${riskPercent}%`}
          sub={flagPct >= 20 ? 'High risk — investigate' : flagPct >= 10 ? 'Medium risk' : flagPct > 0 ? 'Low risk' : 'Clean dataset'}
          valueClass={rateColor}
          icon={
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900">Risk Distribution</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">Flagged entries segmented by risk severity</p>
          <RiskDistributionChart riskCounts={riskCounts} />
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900">Fraud Indicator Frequency</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">Top triggered checks across all flagged entries</p>
          <IndicatorFrequencyChart reasonCounts={reasonCounts} />
        </div>
      </div>

      {/* Smart Insights */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-brand-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Smart Insights</h3>
            <p className="text-xs text-slate-500">Automated observations derived from audit results</p>
          </div>
        </div>
        <SmartInsights summary={summary} />
      </div>
    </div>
  )
}
