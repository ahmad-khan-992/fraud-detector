import { useLanguage } from '../context/LanguageContext'
import { REQUIRED_COLUMNS } from '../utils/columnConfig'

const SEVERITY_STYLES = {
  pass: {
    row:    'bg-emerald-50 border-emerald-100',
    badge:  'bg-emerald-100 text-emerald-700',
    bar:    'bg-emerald-500',
    labelKey: 'validLabel',
    icon: (
      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
  },
  warn: {
    row:    'bg-amber-50 border-amber-100',
    badge:  'bg-amber-100 text-amber-700',
    bar:    'bg-amber-400',
    labelKey: 'warnLabel',
    icon: (
      <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
  },
  fail: {
    row:    'bg-red-50 border-red-100',
    badge:  'bg-red-100 text-red-700',
    bar:    'bg-red-500',
    labelKey: 'failLabel',
    icon: (
      <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
}

export default function ColumnValidation({ headers, missingColumns, columnMap = {}, dataIssues = [] }) {
  const { t } = useLanguage()
  const isValid = missingColumns.length === 0
  const issueCount = dataIssues.filter(d => d.severity !== 'pass').length
  const failCount  = dataIssues.filter(d => d.severity === 'fail').length

  return (
    <div className="space-y-4">

      {/* ── Section 1: Column presence ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{t('columnValidation.title')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t('columnValidation.subtitle')}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isValid ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {isValid ? t('columnValidation.allPresent') : `${missingColumns.length} ${t('columnValidation.missing')}`}
          </span>
        </div>

        {!isValid && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-xs font-semibold text-red-700 mb-2">{t('columnValidation.missingRequired')}</p>
            <div className="flex flex-wrap gap-2">
              {missingColumns.map(col => (
                <span key={col} className="px-2.5 py-1 bg-red-100 text-red-800 rounded-md text-xs font-medium">
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {REQUIRED_COLUMNS.map(col => {
            const present    = !missingColumns.includes(col)
            const matchedAs  = columnMap[col]
            const isAlias    = present && matchedAs && matchedAs !== col
            return (
              <div
                key={col}
                className={`flex items-start gap-2 px-3 py-2.5 rounded-lg ${
                  present ? 'bg-emerald-50' : 'bg-red-50'
                }`}
              >
                {present ? (
                  <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <div className="min-w-0">
                  <p className={`text-xs font-semibold ${present ? 'text-emerald-800' : 'text-red-800'}`}>
                    {col}
                  </p>
                  {isAlias && (
                    <p className="text-xs text-emerald-600 mt-0.5 truncate">
                      {t('columnValidation.matchedAs')} <span className="font-mono">{matchedAs}</span>
                    </p>
                  )}
                  {!present && (
                    <p className="text-xs text-red-500 mt-0.5">{t('columnValidation.notFound')}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {headers.length > 0 && (
          <details className="mt-4">
            <summary className="text-xs text-slate-400 cursor-pointer select-none hover:text-slate-600 transition-colors">
              {t('columnValidation.showAll')} ({headers.length})
            </summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {headers.map(h => (
                <span key={h} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{h}</span>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* ── Section 2: Data quality per column ── */}
      {dataIssues.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{t('columnValidation.dataQualityTitle')}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{t('columnValidation.dataQualitySubtitle')}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              failCount  > 0 ? 'bg-red-100 text-red-700'
            : issueCount > 0 ? 'bg-amber-100 text-amber-700'
            :                  'bg-emerald-100 text-emerald-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                failCount  > 0 ? 'bg-red-500'
              : issueCount > 0 ? 'bg-amber-400'
              :                  'bg-emerald-500'
              }`} />
              {failCount  > 0 ? `${failCount} ${t('columnValidation.withInvalidData')}`
             : issueCount > 0 ? `${issueCount} ${t('columnValidation.withWarnings')}`
             :                  t('columnValidation.allValid')}
            </span>
          </div>

          <div className="space-y-3">
            {dataIssues.map(issue => {
              const s = SEVERITY_STYLES[issue.severity]
              const validPct = 100 - parseFloat(issue.invalidPercent)
              const description = issue.ruleKey ? t(`validateData.${issue.ruleKey}.description`) : issue.description
              const errorHint   = issue.ruleKey ? t(`validateData.${issue.ruleKey}.hint`)        : issue.errorHint

              return (
                <div key={issue.column} className={`rounded-xl border p-4 ${s.row}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {s.icon}
                      <span className="text-sm font-semibold text-slate-800">{issue.column}</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-white/70 text-slate-500 border border-slate-200">
                        {t('columnValidation.expected')} {description}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${s.badge}`}>
                      {t('columnValidation.' + s.labelKey)}
                    </span>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{issue.total - issue.invalidCount} / {issue.total} {t('columnValidation.rowsValid')}</span>
                      <span className="tabular-nums">{validPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/60 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all ${s.bar}`}
                        style={{ width: `${validPct}%` }}
                      />
                    </div>
                  </div>

                  {issue.invalidCount > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/50">
                      <p className="text-xs text-slate-600 mb-1.5">
                        <span className="font-semibold">{issue.invalidCount} {t('columnValidation.invalidRows')}</span>
                        {' '}{errorHint}
                      </p>
                      {issue.examples.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs text-slate-400">{t('columnValidation.eg')}</span>
                          {issue.examples.map((ex, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-white/80 text-slate-600 rounded border border-slate-200 text-xs font-mono"
                            >
                              {ex}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {issueCount > 0 && (
            <p className="mt-4 text-xs text-slate-400">
              {t('columnValidation.dataQualityNote')}
            </p>
          )}
        </div>
      )}

    </div>
  )
}
