import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { REQUIRED_COLUMNS, OPTIONAL_COLUMNS } from '../utils/columnConfig'
import { suggestColumnMapping } from '../utils/aiColumnMapping'

function ColChip({ col, present, matchedAs }) {
  const isAlias = present && matchedAs && matchedAs !== col
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${present ? 'bg-emerald-50' : 'bg-red-50'}`}>
      {present ? (
        <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-3 h-3 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <div className="min-w-0">
        <p className={`text-[11px] font-semibold truncate ${present ? 'text-emerald-800' : 'text-red-800'}`}>{col}</p>
        {isAlias && <p className="text-[10px] text-emerald-600 truncate font-mono">{matchedAs}</p>}
      </div>
    </div>
  )
}

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

const SESSION_KEY = 'je_ai_api_key'

function ChevronIcon({ open }) {
  return (
    <svg
      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function ColumnValidation({ headers, missingColumns, columnMap = {}, dataIssues = [], applyManualMapping, sampleRows = [], amountFormat = 'A', splitInfo = null }) {
  const { t } = useLanguage()

  const isValid    = missingColumns.length === 0
  const issueCount = dataIssues.filter(d => d.severity !== 'pass').length
  const failCount  = dataIssues.filter(d => d.severity === 'fail').length

  // Sections start open if there are problems, closed if clean
  const [colOpen,     setColOpen]     = useState(!isValid)
  const [qualityOpen, setQualityOpen] = useState(failCount > 0 || issueCount > 0)

  const [overrides, setOverrides]       = useState({})
  const [aiSuggested, setAiSuggested]   = useState({})
  const [aiLoading, setAiLoading]       = useState(false)
  const [aiError, setAiError]           = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [keyInput, setKeyInput]         = useState(() => sessionStorage.getItem(SESSION_KEY) || '')
  const [rememberKey, setRememberKey]   = useState(() => !!sessionStorage.getItem(SESSION_KEY))

  const hasSavedKey = !!sessionStorage.getItem(SESSION_KEY)

  const handleOverrideChange = (canonical, rawHeader) => {
    setOverrides(prev => ({ ...prev, [canonical]: rawHeader }))
    setAiSuggested(prev => ({ ...prev, [canonical]: false }))
  }

  const handleApplyMapping = () => {
    const filteredOverrides = Object.fromEntries(
      Object.entries(overrides).filter(([, v]) => v !== '')
    )
    if (Object.keys(filteredOverrides).length > 0) {
      applyManualMapping(filteredOverrides)
    }
  }

  const handleAiSuggest = async () => {
    const key = keyInput.trim()
    if (!key) return
    if (rememberKey) sessionStorage.setItem(SESSION_KEY, key)
    setShowKeyInput(false)
    setAiLoading(true)
    setAiError('')
    try {
      const suggestions = await suggestColumnMapping(key, headers, sampleRows, missingColumns)
      const newOverrides    = { ...overrides }
      const newAiSuggested  = { ...aiSuggested }
      for (const [canonical, rawHeader] of Object.entries(suggestions)) {
        if (rawHeader && headers.includes(rawHeader)) {
          newOverrides[canonical]   = rawHeader
          newAiSuggested[canonical] = true
        }
      }
      setOverrides(newOverrides)
      setAiSuggested(newAiSuggested)
    } catch (err) {
      setAiError(err.message || t('columnMapping.aiError'))
    } finally {
      setAiLoading(false)
    }
  }

  const handleClearKey = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setKeyInput('')
    setRememberKey(false)
  }

  const openAiPanel = () => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    setKeyInput(saved || '')
    setRememberKey(!!saved)
    setShowKeyInput(true)
  }

  return (
    <div className="space-y-2">

      {/* ── Section 1: Column presence ── */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        {/* Clickable header row */}
        <button
          onClick={() => setColOpen(o => !o)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors text-left"
        >
          {/* Status dot */}
          <span className={`w-2 h-2 rounded-full shrink-0 ${isValid ? 'bg-emerald-500' : 'bg-red-500'}`} />

          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-800">{t('columnValidation.title')}</span>
          </div>

          {/* Summary pills */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {isValid
                ? t('columnValidation.allPresent')
                : `${missingColumns.length} ${t('columnValidation.missing')}`}
            </span>
            <span className="text-[11px] text-slate-400">
              {headers.length} {t('columnValidation.showAll').split(' ')[0].toLowerCase()} cols
            </span>
            <ChevronIcon open={colOpen} />
          </div>
        </button>

        {/* Collapsible body */}
        {colOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-white space-y-3">

            {/* Missing columns alert + mapping */}
            {!isValid && (
              <>
                <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs font-semibold text-red-700 mb-1.5">{t('columnValidation.missingRequired')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {missingColumns.map(col => (
                      <span key={col} className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">{col}</span>
                    ))}
                  </div>
                </div>

                {applyManualMapping && headers.length > 0 && (
                  <div className="px-3 py-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <p className="text-xs font-semibold text-indigo-800">{t('columnMapping.title')}</p>
                      <button
                        onClick={openAiPanel}
                        disabled={aiLoading}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                      >
                        {aiLoading ? (
                          <>
                            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            {t('columnMapping.aiLoading')}
                          </>
                        ) : t('columnMapping.aiSuggest')}
                      </button>
                    </div>

                    {/* API key panel */}
                    {showKeyInput && (
                      <div className="mb-2.5 p-2.5 bg-white border border-indigo-200 rounded-lg space-y-2">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">{t('columnMapping.aiKeyLabel')}</label>
                          <input
                            type="password"
                            value={keyInput}
                            onChange={e => setKeyInput(e.target.value)}
                            placeholder={t('columnMapping.aiKeyPlaceholder')}
                            onKeyDown={e => { if (e.key === 'Enter') handleAiSuggest() }}
                            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                          <p className="text-[11px] text-slate-400 mt-0.5">{t('columnMapping.aiKeyHint')}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input type="checkbox" id="ai-remember" checked={rememberKey} onChange={e => setRememberKey(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-400" />
                          <label htmlFor="ai-remember" className="text-[11px] text-slate-600 cursor-pointer">{t('columnMapping.aiRemember')}</label>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleAiSuggest} disabled={!keyInput.trim()}
                            className="flex-1 py-1.5 text-[11px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors">
                            {t('columnMapping.aiConfirm')}
                          </button>
                          <button onClick={() => setShowKeyInput(false)}
                            className="px-3 py-1.5 text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                            ✕
                          </button>
                        </div>
                        {hasSavedKey && (
                          <button onClick={handleClearKey} className="text-[11px] text-red-500 hover:text-red-700 transition-colors">
                            {t('columnMapping.aiClearKey')}
                          </button>
                        )}
                      </div>
                    )}

                    {/* AI error */}
                    {aiError && (
                      <div className="mb-2 px-2.5 py-1.5 bg-red-50 border border-red-100 rounded-lg text-[11px] text-red-700">
                        <span className="font-semibold">{t('columnMapping.aiError')}:</span> {aiError}
                      </div>
                    )}

                    {/* Dropdowns */}
                    <div className="space-y-2">
                      {missingColumns.map(col => (
                        <div key={col} className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 w-40 shrink-0">
                            <span className="text-[11px] font-medium text-indigo-900 truncate">{col}</span>
                            {aiSuggested[col] && overrides[col] && (
                              <span className="px-1 py-0.5 bg-violet-100 text-violet-700 rounded text-[10px] font-semibold shrink-0">
                                {t('columnMapping.aiSuggested')}
                              </span>
                            )}
                          </div>
                          <select
                            value={overrides[col] ?? ''}
                            onChange={e => handleOverrideChange(col, e.target.value)}
                            className={`flex-1 text-xs border rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${
                              aiSuggested[col] && overrides[col] ? 'border-violet-300 bg-violet-50' : 'border-indigo-200'
                            }`}
                          >
                            <option value="">{t('columnMapping.selectHeader')}</option>
                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleApplyMapping}
                      disabled={!Object.values(overrides).some(v => v !== '')}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {t('columnMapping.applyMapping')}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Column grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {REQUIRED_COLUMNS.map(col => {
                // In Format B/C, replace the Amount slot with Debit Amount + Credit Amount
                if (col === 'Amount' && amountFormat === 'BC') {
                  return (
                    <div key={col} className="col-span-2 sm:col-span-3 space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <ColChip col="Debit Amount"  present matchedAs={splitInfo?.debitHeader} />
                        <ColChip col="Credit Amount" present matchedAs={splitInfo?.creditHeader} />
                      </div>
                      <p className="text-[11px] text-indigo-600 px-1">
                        ℹ These will be merged into a single signed Amount column before analysis.
                      </p>
                    </div>
                  )
                }
                return (
                  <ColChip
                    key={col}
                    col={col}
                    present={!missingColumns.includes(col)}
                    matchedAs={columnMap[col]}
                  />
                )
              })}
            </div>

            {/* Optional columns */}
            <div className="space-y-1">
              {OPTIONAL_COLUMNS.map(col => {
                const present   = col in columnMap
                const matchedAs = columnMap[col]
                const isAlias   = present && matchedAs && matchedAs !== col
                return (
                  <div key={col} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                    {present ? (
                      <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="w-3 h-3 rounded-full border-2 border-slate-300 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold text-slate-600">{col}</span>
                      {isAlias && <span className="ml-1 text-[10px] text-emerald-600 font-mono">{matchedAs}</span>}
                      {!present && (
                        <span className="ml-1 text-[10px] text-slate-400">— Not mapped · backdating test will be skipped</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-300 shrink-0">optional</span>
                  </div>
                )
              })}
            </div>

            {/* All headers toggle */}
            {headers.length > 0 && (
              <details className="mt-1">
                <summary className="text-[11px] text-slate-400 cursor-pointer select-none hover:text-slate-600 transition-colors">
                  {t('columnValidation.showAll')} ({headers.length})
                </summary>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {headers.map(h => (
                    <span key={h} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px]">{h}</span>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      {/* ── Section 2: Data quality ── */}
      {dataIssues.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setQualityOpen(o => !o)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors text-left"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              failCount  > 0 ? 'bg-red-500'
            : issueCount > 0 ? 'bg-amber-400'
            :                  'bg-emerald-500'
            }`} />

            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-slate-800">{t('columnValidation.dataQualityTitle')}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                failCount  > 0 ? 'bg-red-100 text-red-700'
              : issueCount > 0 ? 'bg-amber-100 text-amber-700'
              :                  'bg-emerald-100 text-emerald-700'
              }`}>
                {failCount  > 0 ? `${failCount} ${t('columnValidation.withInvalidData')}`
               : issueCount > 0 ? `${issueCount} ${t('columnValidation.withWarnings')}`
               :                  t('columnValidation.allValid')}
              </span>
              <span className="text-[11px] text-slate-400">{dataIssues.length} cols</span>
              <ChevronIcon open={qualityOpen} />
            </div>
          </button>

          {qualityOpen && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-white space-y-2">
              {dataIssues.map(issue => {
                const s = SEVERITY_STYLES[issue.severity]
                const validPct    = 100 - parseFloat(issue.invalidPercent)
                const description = issue.ruleKey ? t(`validateData.${issue.ruleKey}.description`) : issue.description
                const errorHint   = issue.ruleKey ? t(`validateData.${issue.ruleKey}.hint`)        : issue.errorHint

                return (
                  <div key={issue.column} className={`rounded-lg border p-3 ${s.row}`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {s.icon}
                        <span className="text-xs font-semibold text-slate-800 truncate">{issue.column}</span>
                        <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/70 text-slate-500 border border-slate-200 shrink-0">
                          {description}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${s.badge}`}>
                        {t('columnValidation.' + s.labelKey)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden border border-slate-200">
                        <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${validPct}%` }} />
                      </div>
                      <span className="text-[11px] text-slate-500 tabular-nums shrink-0">
                        {issue.total - issue.invalidCount}/{issue.total} ({validPct.toFixed(0)}%)
                      </span>
                    </div>

                    {issue.invalidCount > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-white/50">
                        <p className="text-[11px] text-slate-600 mb-1">
                          <span className="font-semibold">{issue.invalidCount} {t('columnValidation.invalidRows')}</span>
                          {' '}{errorHint}
                        </p>
                        {issue.examples.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[11px] text-slate-400">{t('columnValidation.eg')}</span>
                            {issue.examples.map((ex, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-white/80 text-slate-600 rounded border border-slate-200 text-[11px] font-mono">{ex}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {issueCount > 0 && (
                <p className="text-[11px] text-slate-400 pt-1">{t('columnValidation.dataQualityNote')}</p>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
