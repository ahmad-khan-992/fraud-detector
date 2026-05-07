import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { useLanguage } from '../../context/LanguageContext'
import { REASON_KEYS } from '../../utils/fraudTests'

const REASON_COLORS = {
  'Zero / Null Amount':                '#ef4444',
  'Short / Missing Narration':         '#f59e0b',
  'Unusually High Amount (top 5%)':    '#a855f7',
  'Unusually Low Amount (bottom 5%)':  '#3b82f6',
  'Weekend Entry (Saturday)':          '#0ea5e9',
  'Weekend Entry (Sunday)':            '#38bdf8',
  'Seldom Used Account':               '#f97316',
  'Rare User':                         '#ec4899',
  'Null / Missing Field':              '#f43f5e',
  'Backdated Entry':                   '#b91c1c',
  'Postdated Entry':                   '#8b5cf6',
  'Entry After Year-End':              '#991b1b',
  'Repeating Digit Amount':            '#14b8a6',
  'Holiday Entry':                     '#e11d48',
  'Amount Above Threshold':            '#7c3aed',
  'Round Number':                      '#4f46e5',
  'Z-Score Anomaly':                   '#0891b2',
  'Splitting / Structuring':           '#dc2626',
  'Same-Day Reversal':                 '#ea580c',
  'Period-End Clustering':             '#ca8a04',
  'Dormant Account Reactivation':      '#475569',
  'User Concentration Risk':           '#a21caf',
  'Off-Hours Posting':                 '#78716c',
  'Duplicate Entry':                   '#374151',
}

export default function IndicatorFrequencyChart({ reasonCounts }) {
  const { t } = useLanguage()

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const { translatedName, count } = payload[0].payload
    return (
      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md text-xs max-w-[220px]">
        <p className="font-semibold text-slate-800 leading-snug">{translatedName}</p>
        <p className="text-slate-500 mt-0.5">{count} {count === 1 ? t('analyticsPage.flagSingular') : t('analyticsPage.flagPlural')}</p>
      </div>
    )
  }

  const data = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([reason, count]) => {
      const rk = REASON_KEYS[reason]
      const translatedName = rk ? t('reasons.' + rk) : reason
      const shortLabel = translatedName.length > 22 ? translatedName.slice(0, 21) + '…' : translatedName
      return {
        label: shortLabel,
        translatedName,
        count,
        color: REASON_COLORS[reason] || '#6366f1',
      }
    })

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-sm text-slate-400">
        {t('analyticsPage.noIndicators')}
      </div>
    )
  }

  const height = Math.max(260, data.length * 38)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={160}
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
