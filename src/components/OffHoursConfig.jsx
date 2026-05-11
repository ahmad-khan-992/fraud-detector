import { useState, useMemo } from 'react'
import { useLanguage } from '../context/LanguageContext'

const DAYS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
]

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Zurich',
  'Europe/Amsterdam',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
]

function pad2(n) {
  return String(n).padStart(2, '0')
}

function toAmPm(hour, min) {
  const period = hour < 12 ? 'AM' : 'PM'
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${h}:${pad2(min)} ${period}`
}

function getHourMinInTz(date, timezone) {
  let hour = date.getHours(), minute = date.getMinutes()
  if (timezone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone, hour: 'numeric', minute: 'numeric', hour12: false,
      }).formatToParts(date)
      const hp = parts.find(p => p.type === 'hour')
      const mp = parts.find(p => p.type === 'minute')
      if (hp) hour   = parseInt(hp.value) % 24
      if (mp) minute = parseInt(mp.value)
    } catch { /* fallback to local */ }
  }
  return { hour, minute }
}

function getDayOfWeekInTz(date, timezone) {
  if (!timezone) return date.getDay()
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone, weekday: 'short',
    }).formatToParts(date)
    const dp = parts.find(p => p.type === 'weekday')
    if (dp) {
      const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
      return map[dp.value] ?? date.getDay()
    }
  } catch { /* fallback */ }
  return date.getDay()
}

export default function OffHoursConfig({ offHoursConfig, setOffHoursConfig, filteredRows }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  function update(key, value) {
    setOffHoursConfig(prev => ({ ...prev, [key]: value }))
  }

  function handleTimeChange(field, timeStr) {
    const [h, m] = timeStr.split(':').map(Number)
    if (field === 'start') {
      update('startHour', isNaN(h) ? 0 : h)
      update('startMin',  isNaN(m) ? 0 : m)
    } else {
      update('endHour', isNaN(h) ? 0 : h)
      update('endMin',  isNaN(m) ? 0 : m)
    }
  }

  function toggleDay(day) {
    setOffHoursConfig(prev => {
      const next = prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day].sort((a, b) => a - b)
      return { ...prev, workDays: next }
    })
  }

  // Live preview: count rows that would be flagged under current config
  const flaggedCount = useMemo(() => {
    if (!filteredRows) return 0
    const startMins  = offHoursConfig.startHour * 60 + offHoursConfig.startMin
    const endMins    = offHoursConfig.endHour   * 60 + offHoursConfig.endMin
    const workDaySet = new Set(offHoursConfig.workDays)
    let count = 0

    for (const row of filteredRows) {
      const raw = row['Posting Date']
      if (!raw) continue

      let date, hasTime = false
      if (raw instanceof Date) {
        date = raw
        hasTime = raw.getHours() !== 0 || raw.getMinutes() !== 0
      } else if (typeof raw === 'number' && raw > 0) {
        hasTime = (raw % 1) > 0.0007
        if (!hasTime) continue
        date = new Date(Math.round((raw - 25569) * 86400 * 1000))
      } else if (typeof raw === 'string') {
        hasTime = /\d{1,2}:\d{2}/.test(raw)
        if (!hasTime) continue
        date = new Date(raw)
      }
      if (!date || isNaN(date.getTime())) continue

      const { hour, minute } = getHourMinInTz(date, offHoursConfig.timezone)
      const dayOfWeek = getDayOfWeekInTz(date, offHoursConfig.timezone)
      const curMins   = hour * 60 + minute

      if (curMins < startMins || curMins >= endMins || !workDaySet.has(dayOfWeek)) {
        count++
      }
    }
    return count
  }, [filteredRows, offHoursConfig])

  const workDayLabels = DAYS.filter(d => offHoursConfig.workDays.includes(d.value)).map(d => d.label).join(', ')

  return (
    <div className="card">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 shrink-0">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{t('offHoursConfig.title')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {toAmPm(offHoursConfig.startHour, offHoursConfig.startMin)}
              {' – '}
              {toAmPm(offHoursConfig.endHour, offHoursConfig.endMin)}
              {workDayLabels ? ` · ${workDayLabels}` : ''}
              {offHoursConfig.timezone ? ` · ${offHoursConfig.timezone}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-3">
          {filteredRows && flaggedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              {t('offHoursConfig.flaggedPreview', { count: flaggedCount.toLocaleString() })}
            </div>
          )}
          {filteredRows && flaggedCount === 0 && (
            <span className="text-xs text-slate-400">{t('offHoursConfig.noFlagged')}</span>
          )}
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="mt-5 space-y-6">

          {/* Business Hours */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {t('offHoursConfig.hoursLabel')}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 w-8 shrink-0">{t('offHoursConfig.from')}</label>
                <input
                  type="time"
                  value={`${pad2(offHoursConfig.startHour)}:${pad2(offHoursConfig.startMin)}`}
                  onChange={e => handleTimeChange('start', e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <span className="text-slate-300 text-sm">—</span>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 w-4 shrink-0">{t('offHoursConfig.to')}</label>
                <input
                  type="time"
                  value={`${pad2(offHoursConfig.endHour)}:${pad2(offHoursConfig.endMin)}`}
                  onChange={e => handleTimeChange('end', e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <span className="text-xs text-slate-400 italic">
                {toAmPm(offHoursConfig.startHour, offHoursConfig.startMin)}
                {' – '}
                {toAmPm(offHoursConfig.endHour, offHoursConfig.endMin)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">{t('offHoursConfig.hoursHint')}</p>
          </div>

          {/* Working Days */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {t('offHoursConfig.workingDays')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map(({ label, value }) => {
                const active = offHoursConfig.workDays.includes(value)
                return (
                  <button
                    key={value}
                    onClick={() => toggleDay(value)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">{t('offHoursConfig.workingDaysHint')}</p>
          </div>

          {/* Time Zone */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {t('offHoursConfig.timezoneLabel')}
            </p>
            <select
              value={offHoursConfig.timezone}
              onChange={e => update('timezone', e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full max-w-xs"
            >
              <option value="">{t('offHoursConfig.timezoneLocal')}</option>
              {COMMON_TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1.5">{t('offHoursConfig.timezoneHint')}</p>
          </div>

          {/* Live preview banner */}
          {filteredRows && (
            <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-xs ${
              flaggedCount > 0
                ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {flaggedCount > 0
                  ? t('offHoursConfig.previewBanner', {
                      count: flaggedCount.toLocaleString(),
                      start: toAmPm(offHoursConfig.startHour, offHoursConfig.startMin),
                      end:   toAmPm(offHoursConfig.endHour, offHoursConfig.endMin),
                    })
                  : t('offHoursConfig.previewNone')}
              </span>
            </div>
          )}

          <p className="text-xs text-slate-400">{t('offHoursConfig.note')}</p>
        </div>
      )}
    </div>
  )
}
