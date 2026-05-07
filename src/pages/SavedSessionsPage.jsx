import { useOutletContext } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useAudit } from '../context/AuditContext'
import { useLanguage } from '../context/LanguageContext'

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function RiskBar({ riskCounts, flagged }) {
  if (!flagged) return <div className="h-1.5 bg-slate-100 rounded-full" />
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
      {riskCounts.Critical > 0 && <div className="bg-red-900"    style={{ width: `${(riskCounts.Critical / flagged) * 100}%` }} />}
      {riskCounts.High     > 0 && <div className="bg-red-500"    style={{ width: `${(riskCounts.High    / flagged) * 100}%` }} />}
      {riskCounts.Medium   > 0 && <div className="bg-amber-400"  style={{ width: `${(riskCounts.Medium  / flagged) * 100}%` }} />}
      {riskCounts.Low      > 0 && <div className="bg-emerald-400" style={{ width: `${(riskCounts.Low    / flagged) * 100}%` }} />}
    </div>
  )
}

function EmptyState({ t }) {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center">
      <div className="p-5 bg-slate-100 rounded-2xl">
        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-600">{t('savedSessions.noSessionsTitle')}</p>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">{t('savedSessions.noSessionsDesc')}</p>
      </div>
    </div>
  )
}

export default function SavedSessionsPage() {
  const { savedSessions, deleteSession } = useOutletContext()
  const { loadSession } = useAudit()
  const { t } = useLanguage()
  const navigate = useNavigate()

  function handleLoad(session) {
    loadSession(session)
    navigate('/report')
  }

  if (savedSessions.length === 0) return <EmptyState t={t} />

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{t('savedSessions.title')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('savedSessions.subtitle', { count: savedSessions.length })}
          </p>
        </div>
      </div>

      {savedSessions.map(session => {
        const { id, savedAt, fileName, summary } = session
        const { total, flagged, riskPercent, riskCounts } = summary
        const flagPct = parseFloat(riskPercent)
        const rateColor = flagPct >= 20 ? 'text-red-600' : flagPct >= 10 ? 'text-amber-600' : flagPct > 0 ? 'text-emerald-600' : 'text-slate-400'

        return (
          <div key={id} className="card hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-900 truncate">{fileName}</p>
                  <span className="text-xs text-slate-400 shrink-0">{formatDate(savedAt)}</span>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">{total.toLocaleString()}</span> {t('savedSessions.rows')}
                  </span>
                  <span className="text-xs text-slate-500">
                    <span className="font-semibold text-amber-700">{flagged}</span> {t('savedSessions.flagged')}
                  </span>
                  <span className={`text-xs font-semibold ${rateColor}`}>
                    {riskPercent}% {t('savedSessions.flagRate')}
                  </span>
                  {riskCounts.Critical > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-900" />
                      {riskCounts.Critical} {t('savedSessions.critical')}
                    </span>
                  )}
                  {riskCounts.High > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {riskCounts.High} {t('savedSessions.highRisk')}
                    </span>
                  )}
                </div>

                {/* Risk bar */}
                <div className="mt-3 max-w-xs">
                  <RiskBar riskCounts={riskCounts} flagged={flagged} />
                  <div className="flex gap-3 mt-1.5 flex-wrap">
                    {['Critical', 'High', 'Medium', 'Low'].map(level => (
                      <div key={level} className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          level === 'Critical' ? 'bg-red-900' :
                          level === 'High'     ? 'bg-red-500' :
                          level === 'Medium'   ? 'bg-amber-400' : 'bg-emerald-400'
                        }`} />
                        <span className="text-xs text-slate-400">{t('savedSessions.' + level.toLowerCase())}: {riskCounts[level] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleLoad(session)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  {t('savedSessions.loadReport')}
                </button>
                <button
                  onClick={() => deleteSession(id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title={t('savedSessions.delete')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  {t('savedSessions.delete')}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
