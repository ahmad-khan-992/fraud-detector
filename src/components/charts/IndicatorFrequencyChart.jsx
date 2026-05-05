import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'

const SHORT_LABELS = {
  'Zero / Null Amount':                'Zero/Null Amount',
  'Short / Missing Narration':         'Short Narration',
  'Unusually High Amount (top 5%)':    'High Amount (>95th%)',
  'Unusually Low Amount (bottom 5%)':  'Low Amount (<5th%)',
  'Weekend Entry (Saturday)':          'Weekend (Saturday)',
  'Weekend Entry (Sunday)':            'Weekend (Sunday)',
  'Seldom Used Account':               'Seldom-Used Account',
  'Rare User':                         'Rare User',
  'Null / Missing Field':              'Missing Field',
  'Backdated Entry':                   'Backdated Entry',
  'Postdated Entry':                   'Postdated Entry',
  'Entry After Year-End':              'After Year-End',
  'Repeating Digit Amount':            'Repeating Digits',
}

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
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { fullName, count } = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md text-xs max-w-[220px]">
      <p className="font-semibold text-slate-800 leading-snug">{fullName}</p>
      <p className="text-slate-500 mt-0.5">{count} flag{count !== 1 ? 's' : ''}</p>
    </div>
  )
}

export default function IndicatorFrequencyChart({ reasonCounts }) {
  const data = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([reason, count]) => ({
      label: SHORT_LABELS[reason] || reason,
      fullName: reason,
      count,
      color: REASON_COLORS[reason] || '#6366f1',
    }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-sm text-slate-400">
        No fraud indicators found
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
          width={148}
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
