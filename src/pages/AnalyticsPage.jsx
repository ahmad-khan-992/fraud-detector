import { Link } from 'react-router-dom'
import { useAudit } from '../context/AuditContext'
import { useLanguage } from '../context/LanguageContext'
import RiskDistributionChart from '../components/charts/RiskDistributionChart'
import IndicatorFrequencyChart from '../components/charts/IndicatorFrequencyChart'
import SmartInsights from '../components/SmartInsights'

function EmptyState({ hasData, t }) {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center">
      <div className="p-5 bg-slate-100 rounded-2xl">
        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-600">
          {hasData ? t('analyticsPage.notRunTitle') : t('analyticsPage.noDataTitle')}
        </p>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">
          {hasData ? t('analyticsPage.notRunDesc') : t('analyticsPage.noDataDesc')}
        </p>
      </div>
      <Link to="/" className="btn-primary">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {hasData ? t('analyticsPage.goToUpload') : t('analyticsPage.getStarted')}
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

function RunningState({ t }) {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center">
      <div className="p-5 bg-brand-50 rounded-2xl">
        <svg className="w-10 h-10 text-brand-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-600">{t('analyticsPage.runningTitle')}</p>
        <p className="text-sm text-slate-400 mt-1">{t('analyticsPage.runningDesc')}</p>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { hasRun, isRunning, summary, rows, benfordAnalysis } = useAudit()
  const { t } = useLanguage()

  if (isRunning) return <RunningState t={t} />
  if (!hasRun) return <EmptyState hasData={rows.length > 0} t={t} />

  const { total, flagged, riskPercent, riskCounts, reasonCounts } = summary
  const criticalCount = riskCounts.Critical || 0
  const flagPct = parseFloat(riskPercent)
  const rateColor = flagPct >= 20 ? 'text-red-600' : flagPct >= 10 ? 'text-amber-600' : flagPct > 0 ? 'text-emerald-600' : 'text-slate-400'
  const rateSub = flagPct >= 20 ? t('analyticsPage.investigateHigh')
                : flagPct >= 10 ? t('analyticsPage.mediumRisk')
                : flagPct > 0  ? t('analyticsPage.lowRisk')
                :                 t('analyticsPage.cleanDataset')

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label={t('analyticsPage.totalEntries')}
          value={total.toLocaleString()}
          sub={t('analyticsPage.rowsAnalysed')}
          icon={
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125" />
            </svg>
          }
        />
        <StatCard
          label={t('analyticsPage.flaggedEntries')}
          value={flagged.toLocaleString()}
          sub={t('analyticsPage.requireReview')}
          valueClass={flagged > 0 ? 'text-amber-600' : 'text-emerald-600'}
          icon={
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l1.664 1.664M21 21l-1.5-1.5m-5.485-1.242L12 17.25 4.5 21V8.742m.164-4.078a2.15 2.15 0 011.743-.456l4.21.602 7.697-7.696a1 1 0 011.414 0l.242.241a1 1 0 010 1.414L9.168 14.093l.402 2.83a2.15 2.15 0 01-.498 1.77l-.08.08" />
            </svg>
          }
        />
        <StatCard
          label={t('analyticsPage.highRisk')}
          value={((riskCounts.Critical || 0) + (riskCounts.High || 0)).toLocaleString()}
          sub={t('analyticsPage.needAction')}
          valueClass={criticalCount > 0 ? 'text-red-900' : riskCounts.High > 0 ? 'text-red-600' : 'text-slate-400'}
          icon={
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
        <StatCard
          label={t('analyticsPage.flagRate')}
          value={`${riskPercent}%`}
          sub={rateSub}
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
          <h3 className="text-sm font-semibold text-slate-900">{t('analyticsPage.riskDistTitle')}</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">{t('analyticsPage.riskDistSub')}</p>
          <RiskDistributionChart riskCounts={riskCounts} />
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900">{t('analyticsPage.indicatorTitle')}</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">{t('analyticsPage.indicatorSub')}</p>
          <IndicatorFrequencyChart reasonCounts={reasonCounts} />
        </div>
      </div>

      {/* Benford's Law */}
      {benfordAnalysis && (
        <div className={`card border ${benfordAnalysis.pass ? 'border-emerald-200' : 'border-red-300'}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${benfordAnalysis.pass ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <svg className={`w-4 h-4 ${benfordAnalysis.pass ? 'text-emerald-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t('analyticsPage.benfordTitle')}</h3>
              <p className="text-xs text-slate-500">{t('analyticsPage.benfordSub', { total: benfordAnalysis.total.toLocaleString() })}</p>
            </div>
            <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full border ${benfordAnalysis.pass ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
              {benfordAnalysis.pass ? t('fraudSummary.benfordPass').split(' ')[0] : t('fraudSummary.benfordFail').split(' ')[0]}
            </span>
          </div>

          {/* Bar chart */}
          <div className="space-y-2">
            {[1,2,3,4,5,6,7,8,9].map(d => {
              const obs = (benfordAnalysis.observed[d] * 100).toFixed(1)
              const exp = (benfordAnalysis.expected[d] * 100).toFixed(1)
              const obsW = Math.min(benfordAnalysis.observed[d] * 100 * 2.5, 100)
              const expW = Math.min(benfordAnalysis.expected[d] * 100 * 2.5, 100)
              const over = benfordAnalysis.overRepresented.includes(d)
              return (
                <div key={d} className="flex items-center gap-3 text-xs">
                  <span className="w-4 text-center font-mono font-semibold text-slate-600 shrink-0">{d}</span>
                  <div className="flex-1 space-y-0.5">
                    <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 h-full rounded-full transition-all ${over ? 'bg-red-500' : 'bg-brand-500'}`}
                        style={{ width: `${obsW}%` }}
                      />
                    </div>
                    <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="absolute left-0 h-full bg-slate-300 rounded-full" style={{ width: `${expW}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-3 shrink-0 tabular-nums">
                    <span className={`w-10 text-right ${over ? 'text-red-600 font-semibold' : 'text-slate-700'}`}>{obs}%</span>
                    <span className="w-10 text-right text-slate-400">{exp}%</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-2 rounded-sm bg-brand-500 inline-block" />{t('analyticsPage.benfordObserved')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-1.5 rounded-sm bg-slate-300 inline-block" />{t('analyticsPage.benfordExpected')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-2 rounded-sm bg-red-500 inline-block" />{t('analyticsPage.benfordOverBar')}
            </div>
            <div className="ml-auto flex gap-4 text-xs text-slate-500">
              <span>{t('fraudSummary.benfordMad')}: <strong className={benfordAnalysis.mad >= 0.015 ? 'text-red-600' : 'text-slate-700'}>{benfordAnalysis.mad}</strong></span>
              <span>{t('fraudSummary.benfordChi')}: <strong className={benfordAnalysis.chiSquared >= 15.507 ? 'text-red-600' : 'text-slate-700'}>{benfordAnalysis.chiSquared}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Smart Insights */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-brand-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t('analyticsPage.insightsTitle')}</h3>
            <p className="text-xs text-slate-500">{t('analyticsPage.insightsSub')}</p>
          </div>
        </div>
        <SmartInsights summary={summary} />
      </div>
    </div>
  )
}
