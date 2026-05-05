import { generateInsights } from '../utils/generateInsights'

function InsightIcon({ type }) {
  if (type === 'critical') return (
    <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  )
  if (type === 'warning') return (
    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  )
  if (type === 'success') return (
    <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
  return (
    <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  )
}

const STYLES = {
  critical: { card: 'bg-red-50 border-red-200',      title: 'text-red-800',     body: 'text-red-700' },
  warning:  { card: 'bg-amber-50 border-amber-200',   title: 'text-amber-800',   body: 'text-amber-700' },
  info:     { card: 'bg-blue-50 border-blue-200',     title: 'text-blue-800',    body: 'text-blue-700' },
  success:  { card: 'bg-emerald-50 border-emerald-200', title: 'text-emerald-800', body: 'text-emerald-700' },
}

export default function SmartInsights({ summary }) {
  const insights = generateInsights(summary)

  if (insights.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-4 text-center">Run fraud tests to generate insights.</p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {insights.map((insight, i) => {
        const s = STYLES[insight.type] || STYLES.info
        return (
          <div key={i} className={`flex gap-3 p-4 rounded-xl border ${s.card}`}>
            <InsightIcon type={insight.type} />
            <div>
              <p className={`text-sm font-semibold ${s.title}`}>{insight.title}</p>
              <p className={`text-xs mt-1 leading-relaxed ${s.body}`}>{insight.text}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
