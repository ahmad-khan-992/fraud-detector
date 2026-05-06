import { useMemo, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

function getAmount(row) {
  const key = Object.keys(row).find(k => k.trim().toLowerCase() === 'amount')
  if (!key) return NaN
  return Number(row[key])
}

export default function AmountFilter({ maxAmount, setMaxAmount, filteredRows }) {
  const { t } = useLanguage()
  const [input, setInput] = useState(maxAmount)

  const threshold = maxAmount !== '' && !isNaN(Number(maxAmount)) ? Number(maxAmount) : null

  // Stats derived from filteredRows for hints
  const amountStats = useMemo(() => {
    let max = -Infinity
    for (const row of filteredRows) {
      const n = Math.abs(getAmount(row))
      if (!isNaN(n) && n > max) max = n
    }
    return { max: isFinite(max) ? max : null }
  }, [filteredRows])

  // Live count of rows that would be flagged
  const flaggedCount = useMemo(() => {
    if (threshold === null) return 0
    let count = 0
    for (const row of filteredRows) {
      const n = getAmount(row)
      if (!isNaN(n) && Math.abs(n) > threshold) count++
    }
    return count
  }, [filteredRows, threshold])

  function handleApply() {
    const val = input.trim()
    if (val === '' || (!isNaN(Number(val)) && Number(val) >= 0)) {
      setMaxAmount(val)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleApply()
  }

  function handleClear() {
    setInput('')
    setMaxAmount('')
  }

  const isActive = threshold !== null

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-50 shrink-0">
            <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{t('amountFilter.title')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t('amountFilter.subtitle')}</p>
          </div>
        </div>

        {/* Flagged badge */}
        {isActive && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
            flaggedCount > 0 ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${flaggedCount > 0 ? 'bg-violet-500' : 'bg-slate-400'}`} />
            {flaggedCount > 0
              ? t('amountFilter.flaggedCount', { count: flaggedCount.toLocaleString() })
              : t('amountFilter.noFlagged')
            }
          </div>
        )}
      </div>

      {/* Input row */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">{t('amountFilter.label')}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 select-none">
              {t('amountFilter.currencySymbol')}
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('amountFilter.placeholder')}
              className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleApply}
          disabled={input.trim() === '' || isNaN(Number(input)) || Number(input) < 0}
          className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {t('amountFilter.apply')}
        </button>

        {isActive && (
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 rounded-lg transition-colors shrink-0"
          >
            {t('amountFilter.clear')}
          </button>
        )}
      </div>

      {/* Active threshold pill */}
      {isActive && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-100 rounded-lg">
          <svg className="w-3.5 h-3.5 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-violet-800 font-medium">
            {t('amountFilter.activeHint', { threshold: Number(maxAmount).toLocaleString() })}
          </p>
        </div>
      )}

      {/* Max amount hint */}
      {amountStats.max !== null && (
        <p className="mt-2 text-xs text-slate-400">
          {t('amountFilter.dataMax')}{' '}
          <span className="font-medium text-slate-500">
            {amountStats.max.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </p>
      )}
    </div>
  )
}
