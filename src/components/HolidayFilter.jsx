import { useState, useMemo } from 'react'
import { useLanguage } from '../context/LanguageContext'

// Fixed-date public holidays: [translationKey, MM-DD]
const PRESETS = [
  { key: 'newYear',      mmdd: '01-01' },
  { key: 'labourDay',    mmdd: '05-01' },
  { key: 'canadaDay',    mmdd: '07-01' },
  { key: 'bastille',     mmdd: '07-14' },
  { key: 'indeDay',      mmdd: '07-04' },
  { key: 'remembrance',  mmdd: '11-11' },
  { key: 'christmasEve', mmdd: '12-24' },
  { key: 'christmas',    mmdd: '12-25' },
  { key: 'boxingDay',    mmdd: '12-26' },
  { key: 'newYearEve',   mmdd: '12-31' },
]

function formatDisplay(dateStr) {
  const [yyyy, mm, dd] = dateStr.split('-')
  return new Date(`${yyyy}-${mm}-${dd}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default function HolidayFilter({ holidays, addHoliday, removeHoliday, clearHolidays, filteredRows, dataDateRange }) {
  const { t } = useLanguage()
  const [inputDate, setInputDate] = useState('')

  // Derive year list from data range for the quick-add section
  const years = useMemo(() => {
    if (!dataDateRange) return [new Date().getFullYear()]
    const minY = dataDateRange.min.getFullYear()
    const maxY = dataDateRange.max.getFullYear()
    const list = []
    for (let y = minY; y <= maxY; y++) list.push(y)
    return list
  }, [dataDateRange])

  const [selectedYear, setSelectedYear] = useState(() => {
    if (!dataDateRange) return new Date().getFullYear()
    return dataDateRange.max.getFullYear()
  })

  // Update selectedYear when dataDateRange becomes available
  useMemo(() => {
    if (dataDateRange) setSelectedYear(dataDateRange.max.getFullYear())
  }, [dataDateRange])

  // Count how many filtered rows fall on a holiday date
  const holidaySet = useMemo(() => new Set(holidays), [holidays])
  const flaggedCount = useMemo(() => {
    let count = 0
    for (const row of filteredRows) {
      const raw = row['Posting Date']
      if (!raw) continue
      let date
      if (raw instanceof Date) date = raw
      else if (typeof raw === 'number' && raw > 0) date = new Date(Math.round((raw - 25569) * 86400 * 1000))
      else { date = new Date(raw); if (isNaN(date.getTime())) continue }
      const yyyy = date.getFullYear()
      const mm   = String(date.getMonth() + 1).padStart(2, '0')
      const dd   = String(date.getDate()).padStart(2, '0')
      if (holidaySet.has(`${yyyy}-${mm}-${dd}`)) count++
    }
    return count
  }, [filteredRows, holidaySet])

  function handleAdd() {
    if (inputDate) {
      addHoliday(inputDate)
      setInputDate('')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd()
  }

  function addPreset(mmdd) {
    addHoliday(`${selectedYear}-${mmdd}`)
  }

  const minInput = dataDateRange
    ? `${dataDateRange.min.getFullYear()}-${String(dataDateRange.min.getMonth()+1).padStart(2,'0')}-${String(dataDateRange.min.getDate()).padStart(2,'0')}`
    : undefined

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 shrink-0">
            <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{t('holidayFilter.title')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t('holidayFilter.subtitle')}</p>
          </div>
        </div>

        {/* Flagged count badge */}
        {holidays.length > 0 && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
            flaggedCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${flaggedCount > 0 ? 'bg-rose-500' : 'bg-slate-400'}`} />
            {flaggedCount > 0
              ? t('holidayFilter.flaggedPreview', { count: flaggedCount.toLocaleString() })
              : t('holidayFilter.noFlagged')
            }
          </div>
        )}
      </div>

      {/* Quick-add presets */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('holidayFilter.quickAdd')}</span>

          {/* Year selector — only shown when data spans multiple years */}
          {years.length > 1 && (
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(({ key, mmdd }) => {
            const dateStr  = `${selectedYear}-${mmdd}`
            const added    = holidaySet.has(dateStr)
            return (
              <button
                key={key}
                onClick={() => addPreset(mmdd)}
                disabled={added}
                title={added ? t('holidayFilter.alreadyAdded') : undefined}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  added
                    ? 'bg-rose-50 border-rose-200 text-rose-400 cursor-default'
                    : 'border-slate-200 text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700'
                }`}
              >
                {added && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5 align-middle" />
                )}
                {t(`holidayFilter.${key}`)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Manual date input */}
      <div className="flex gap-2 mb-4">
        <input
          type="date"
          value={inputDate}
          min={minInput}
          onChange={e => setInputDate(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('holidayFilter.addPlaceholder')}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!inputDate || holidaySet.has(inputDate)}
          className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('holidayFilter.add')}
        </button>
      </div>

      {/* Holiday list */}
      {holidays.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center border border-dashed border-slate-200 rounded-xl">
          <svg className="w-8 h-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <p className="text-xs font-semibold text-slate-400">{t('holidayFilter.noHolidays')}</p>
          <p className="text-xs text-slate-300">{t('holidayFilter.noHolidaysSub')}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {holidays.map(dateStr => (
            <div
              key={dateStr}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-rose-50 border border-rose-100"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span className="text-xs font-medium text-rose-800">{formatDisplay(dateStr)}</span>
              </div>
              <button
                onClick={() => removeHoliday(dateStr)}
                className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded transition-colors"
                title={t('holidayFilter.remove')}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {holidays.length > 1 && (
            <button
              onClick={clearHolidays}
              className="mt-2 w-full py-1.5 text-xs font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 border border-dashed border-slate-200 rounded-lg transition-colors"
            >
              {t('holidayFilter.clear')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
