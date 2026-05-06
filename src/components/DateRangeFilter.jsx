import { useLanguage } from '../context/LanguageContext'

function toInputValue(date) {
  if (!date) return ''
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatDisplayDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function DateRangeFilter({
  dateFrom, dateTo, setDateFrom, setDateTo,
  filteredRows, totalRows, dataDateRange,
}) {
  const { t } = useLanguage()

  const inRange   = filteredRows.length
  const hasFilter = !!(dateFrom || dateTo)

  function setLast30() {
    const to   = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 30)
    setDateFrom(toInputValue(from))
    setDateTo(toInputValue(to))
  }

  function setThisYear() {
    const year = new Date().getFullYear()
    setDateFrom(`${year}-01-01`)
    setDateTo(`${year}-12-31`)
  }

  function setPrevYear() {
    const year = new Date().getFullYear() - 1
    setDateFrom(`${year}-01-01`)
    setDateTo(`${year}-12-31`)
  }

  function clearFilter() {
    setDateFrom('')
    setDateTo('')
  }

  const minInput = dataDateRange ? toInputValue(dataDateRange.min) : ''
  const maxInput = toInputValue(new Date())

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 shrink-0">
            <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{t('dateFilter.title')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t('dateFilter.subtitle')}</p>
          </div>
        </div>

        {/* Row count badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
          hasFilter && inRange === 0 ? 'bg-red-100 text-red-700'
          : hasFilter               ? 'bg-brand-100 text-brand-700'
          :                           'bg-slate-100 text-slate-600'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            hasFilter && inRange === 0 ? 'bg-red-500'
            : hasFilter               ? 'bg-brand-500'
            :                           'bg-slate-400'
          }`} />
          {hasFilter
            ? t('dateFilter.rowsInRange', { count: inRange.toLocaleString(), total: totalRows.toLocaleString() })
            : t('dateFilter.allRows', { total: totalRows.toLocaleString() })
          }
        </div>
      </div>

      {/* Date inputs + quick picks */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        {/* From */}
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-slate-600">{t('dateFilter.from')}</label>
          <input
            type="date"
            value={dateFrom}
            min={minInput}
            max={dateTo || maxInput}
            onChange={e => setDateFrom(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="hidden sm:flex items-center pb-2 text-slate-300">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
          </svg>
        </div>

        {/* To */}
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-slate-600">{t('dateFilter.to')}</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || minInput}
            max={maxInput}
            onChange={e => setDateTo(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Quick picks */}
        <div className="flex items-center gap-1.5 flex-wrap sm:pb-0.5">
          <button
            onClick={setLast30}
            className="px-2.5 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            {t('dateFilter.last30')}
          </button>
          <button
            onClick={setThisYear}
            className="px-2.5 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            {t('dateFilter.thisYear')}
          </button>
          <button
            onClick={setPrevYear}
            className="px-2.5 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            {t('dateFilter.prevYear')}
          </button>
          {hasFilter && (
            <button
              onClick={clearFilter}
              className="px-2.5 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              {t('dateFilter.clear')}
            </button>
          )}
        </div>
      </div>

      {/* Data span hint */}
      {dataDateRange && (
        <p className="mt-3 text-xs text-slate-400">
          {t('dateFilter.dataRange')}{' '}
          <span className="font-medium text-slate-500">
            {formatDisplayDate(dataDateRange.min)}
          </span>
          {' – '}
          <span className="font-medium text-slate-500">
            {formatDisplayDate(dataDateRange.max)}
          </span>
        </p>
      )}

      {/* No rows warning */}
      {hasFilter && inRange === 0 && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
          <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-red-700 font-medium">{t('dateFilter.noRowsWarning')}</p>
        </div>
      )}
    </div>
  )
}
