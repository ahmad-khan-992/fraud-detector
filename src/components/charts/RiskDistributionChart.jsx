import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' }
const LABELS  = { High: 'High Risk', Medium: 'Medium Risk', Low: 'Low Risk' }

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-slate-800">{name}</p>
      <p className="text-slate-500 mt-0.5">{value} entries</p>
    </div>
  )
}

export default function RiskDistributionChart({ riskCounts }) {
  const data = ['High', 'Medium', 'Low']
    .map(level => ({ name: LABELS[level], level, value: riskCounts[level] || 0 }))
    .filter(d => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-sm text-slate-400">
        No flagged entries to display
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map(entry => (
            <Cell key={entry.level} fill={COLORS[entry.level]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={value => (
            <span style={{ fontSize: 12, color: '#64748b' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
