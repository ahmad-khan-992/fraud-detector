import { useLanguage } from '../context/LanguageContext'
import { REASON_KEYS } from '../utils/fraudTests'

const REASON_META = {
  'Zero / Null Amount':                { dot: 'bg-red-500'      },
  'Short / Missing Narration':         { dot: 'bg-amber-500'    },
  'Unusually High Amount (top 5%)':    { dot: 'bg-purple-500'   },
  'Unusually Low Amount (bottom 5%)':  { dot: 'bg-blue-500'     },
  'Weekend Entry (Saturday)':          { dot: 'bg-sky-500'      },
  'Weekend Entry (Sunday)':            { dot: 'bg-sky-500'      },
  'Seldom Used Account':               { dot: 'bg-orange-500'   },
  'Rare User':                         { dot: 'bg-pink-500'     },
  'Null / Missing Field':              { dot: 'bg-rose-500'     },
  'Backdated Entry':                   { dot: 'bg-red-700'      },
  'Postdated Entry':                   { dot: 'bg-violet-500'   },
  'Entry After Year-End':              { dot: 'bg-red-900'      },
  'Repeating Digit Amount':            { dot: 'bg-teal-500'     },
  'Holiday Entry':                     { dot: 'bg-rose-600'     },
  'Amount Above Threshold':            { dot: 'bg-violet-600'   },
}

function overallRisk(pct) {
  const n = parseFloat(pct)
  if (n >= 20) return { key: 'highRisk',   color: 'text-red-600',    bg: 'bg-red-50 border-red-200'    }
  if (n >= 10) return { key: 'mediumRisk', color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200'}
  if (n > 0)   return { key: 'lowRisk',    color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-200'}
  return               { key: 'clean',     color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-200'}
}

const RISK_BADGE_STYLES = {
  High:   'bg-red-100 text-red-700 border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low:    'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const RISK_LABEL_KEY = { High: 'highRisk', Medium: 'mediumRisk', Low: 'lowRisk' }

function MetricCard({ label, value, valueClass, sub }) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${valueClass || 'text-slate-900'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

function RiskBadge({ level, count, t }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium ${RISK_BADGE_STYLES[level]}`}>
      <span>{t('fraudSummary.' + RISK_LABEL_KEY[level])}</span>
      <span className="font-bold">{count}</span>
    </div>
  )
}

export default function FraudSummary({ summary }) {
  const { t } = useLanguage()
  const { total, flagged, riskPercent, reasonCounts, riskCounts } = summary
  const risk = overallRisk(riskPercent)

  return (
    <div className="space-y-4">
      {/* Top metric strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MetricCard
          label={t('fraudSummary.totalEntries')}
          value={total.toLocaleString()}
          sub={t('fraudSummary.rowsAnalysed')}
        />
        <MetricCard
          label={t('fraudSummary.flaggedEntries')}
          value={flagged.toLocaleString()}
          sub={t('fraudSummary.requireReview')}
          valueClass={flagged > 0 ? 'text-red-600' : 'text-emerald-600'}
        />
        <div className={`card flex flex-col gap-1 border ${risk.bg} col-span-2 sm:col-span-1`}>
          <p className="text-xs font-medium text-slate-500">{t('fraudSummary.flagRate')}</p>
          <p className={`text-2xl font-bold ${risk.color}`}>{riskPercent}%</p>
          <p className={`text-xs font-semibold ${risk.color}`}>{t('fraudSummary.' + risk.key)}</p>
        </div>
      </div>

      {/* Risk level breakdown */}
      {flagged > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('fraudSummary.entriesByRisk')}</h3>
          <div className="grid grid-cols-3 gap-2">
            <RiskBadge level="High"   count={riskCounts.High   ?? 0} t={t} />
            <RiskBadge level="Medium" count={riskCounts.Medium ?? 0} t={t} />
            <RiskBadge level="Low"    count={riskCounts.Low    ?? 0} t={t} />
          </div>
          <p className="text-xs text-slate-400 mt-2">{t('fraudSummary.scoreScale')}</p>
        </div>
      )}

      {/* Breakdown by test */}
      {Object.keys(reasonCounts).length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('fraudSummary.flagsByTest')}</h3>
          <div className="space-y-2">
            {Object.entries(reasonCounts).map(([reason, count]) => {
              const meta  = REASON_META[reason] || { dot: 'bg-slate-400' }
              const pct   = total > 0 ? ((count / total) * 100).toFixed(1) : '0'
              const width = total > 0 ? Math.max((count / total) * 100, 2) : 0
              const key   = REASON_KEYS[reason]
              const label = key ? t('reasons.' + key) : reason

              return (
                <div key={reason}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                      <span className="text-xs font-medium text-slate-700">{label}</span>
                    </div>
                    <span className="text-xs text-slate-500 tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${meta.dot}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Clean state */}
      {flagged === 0 && (
        <div className="card flex items-center gap-4 border-emerald-200 bg-emerald-50">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">{t('fraudSummary.noIssues')}</p>
            <p className="text-xs text-emerald-600 mt-0.5">{t('fraudSummary.allPassed', { total: total.toLocaleString() })}</p>
          </div>
        </div>
      )}
    </div>
  )
}
