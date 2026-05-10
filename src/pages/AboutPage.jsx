import { useState } from 'react'
import { Link } from 'react-router-dom'

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-slate-50 transition-colors gap-4"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-slate-800">{question}</span>
        <svg
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 animate-slide-up">
          <p className="text-sm text-slate-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

function Step({ number, title, description, icon, isLast }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
          {number}
        </div>
        {!isLast && <div className="flex-1 w-px bg-slate-200 mt-2 mb-0 min-h-6" />}
      </div>
      <div className={`min-w-0 ${isLast ? 'pb-0' : 'pb-7'}`}>
        <div className="flex items-center gap-2 mb-1.5 mt-1">
          <span className="text-brand-600">{icon}</span>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description, badge }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md hover:border-brand-100 transition-all duration-200 group">
      <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-3 group-hover:bg-brand-100 transition-colors">
        {icon}
      </div>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {badge && (
          <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  )
}

function AudienceCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 flex gap-4 hover:shadow-sm transition-shadow">
      <div className="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// ── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    title: 'Upload Your GL Export',
    description: 'Drag & drop or click to browse. AnomalyScanner accepts .xlsx, .xls, and .csv files exported from any ERP or accounting system. Multi-sheet workbooks are detected automatically — simply select the sheet you want to analyse.',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>,
  },
  {
    number: '02',
    title: 'Validate & Map Columns',
    description: 'The platform automatically detects your file\'s column headers and maps them to the six required fields: Account Number, Amount, Posting Date, Effective Date, User, and Narration. Missing columns can be mapped manually or via the built-in AI suggestion tool.',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    number: '03',
    title: 'Configure Test Parameters',
    description: 'Optionally fine-tune detection thresholds to match your organisation\'s risk profile: adjust the backdating window, Z-score sensitivity, structuring threshold, round-number multiple, and minimum narration length. Defaults work for most audits out of the box.',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    number: '04',
    title: 'Run Fraud Detection',
    description: 'Click "Run Tests" and 21 forensic algorithms sweep every row in your dataset simultaneously. Results are typically ready in under two seconds for datasets of up to 50,000 rows. A progress indicator keeps you informed for larger files.',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>,
  },
  {
    number: '05',
    title: 'Review Flagged Entries',
    description: 'Every flagged transaction is displayed with a composite risk score (0–10+), the specific tests that triggered, a plain-English explanation of why it was flagged, and recommended audit procedures. Filter by risk level, test type, date range, or amount.',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    number: '06',
    title: 'Export & Report',
    description: 'Export all flagged entries to Excel for further investigation. Generate a professional, printable audit report with an executive summary, high-risk transaction table, Benford\'s Law chart, and a complete test-by-test results breakdown. Save your session to reload later.',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  },
]

const FEATURES = [
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
    title: '21 Automated Fraud Tests',
    badge: '21 tests',
    description: "Benford's Law, Z-score anomalies, round numbers, splitting/structuring, same-day reversals, period-end clustering, dormant accounts, user concentration, off-hours posting, duplicate entries, and more.",
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
    title: "Benford's Law Analysis",
    description: 'Full first-digit frequency analysis with MAD score and chi-squared test. An interactive bar chart compares observed vs. expected distributions and highlights over-represented digits.',
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>,
    title: 'AI Column Mapping',
    description: "When column headers don't match standard names, the built-in AI assistant automatically suggests the correct mappings from your file's actual column names — no manual trial-and-error needed.",
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
    title: 'Risk Scoring Engine',
    description: 'Every flagged entry receives a composite risk score (0–10+). Scores map to four severity levels — Critical, High, Medium, Low — enabling prioritised, risk-based review workflows.',
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
    title: 'Smart Insights',
    description: 'Automated narrative summaries identify the top risk indicators, quantify their impact, and provide actionable recommendations — condensing hours of manual pattern analysis into seconds.',
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    title: 'Configurable Parameters',
    description: "Adjust backdating windows, Z-score thresholds, structuring limits, round-number multiples, and minimum narration length to calibrate tests for your organisation's risk appetite.",
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>,
    title: 'Session Management',
    description: 'Save up to 5 audit sessions in your browser. Reload previous sessions to resume where you left off — useful for multi-day audits or reviewing preliminary findings with colleagues.',
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
    title: 'Export & Reporting',
    description: 'Export flagged entries to Excel with full details, scores, and triggered tests. Generate a professional, printable audit report with executive summary and findings breakdown.',
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
    title: 'Advanced Filters',
    description: 'Narrow your analysis with date range, amount threshold, and public holiday filters. Filter flagged results by risk level and specific test type to focus review on the highest-priority items.',
  },
]

const AUDIENCE = [
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>,
    title: 'Internal Audit Teams',
    description: 'Conduct GL-level journal entry testing as part of your annual audit plan or continuous monitoring programme. Automate what used to take days of manual spreadsheet work.',
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>,
    title: 'Forensic Accountants',
    description: 'Rapidly triage large GL datasets during fraud investigations. Identify the highest-risk transactions, map user activity patterns, and document findings in a structured audit report.',
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    title: 'Finance Controllers & CFOs',
    description: 'Establish a continuous control environment by regularly scanning journal entry data for anomalies before period close. Reduce year-end audit surprises and strengthen your control framework.',
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
    title: 'External Auditors',
    description: 'Integrate AnomalyScanner into your journal entry testing procedures. Generate defensible, documented audit evidence and quickly identify areas warranting increased substantive testing.',
  },
]

const SECURITY_POINTS = [
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" /></svg>,
    title: '100% Local Processing',
    description: 'All analysis runs in your browser. Financial data is never transmitted to any server — ever.',
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>,
    title: 'No Registration',
    description: 'No account, no email, no password. Open the app and start analysing immediately — no activation required.',
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>,
    title: 'Browser-Only Storage',
    description: "Saved sessions are stored only in your browser's localStorage — never in a cloud database or accessible to anyone else.",
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
    title: 'Universal ERP Compatibility',
    description: 'Works with .xlsx, .xls, and .csv exports from SAP, Oracle, QuickBooks, Sage, Dynamics, and any other accounting system.',
  },
]

const FAQS = [
  {
    question: 'What file formats does AnomalyScanner support?',
    answer: 'AnomalyScanner accepts Microsoft Excel files (.xlsx and .xls) as well as comma-separated value files (.csv). Multi-sheet Excel workbooks are supported — you can select which sheet to analyse after uploading. There is no enforced file size limit, though very large files (over 100 MB) may be slower to parse depending on your device.',
  },
  {
    question: 'Is my financial data secure? Where is it processed?',
    answer: "All data processing happens entirely within your web browser. Your file is never uploaded to any server — it is read locally using the browser's FileReader API, processed in-memory using JavaScript, and discarded when you close the tab or clear the session. Saved sessions are stored only in your browser's localStorage, accessible solely from your device. If you use the AI Column Mapping feature, only your file's column headers — not your actual data — are sent to the Anthropic API.",
  },
  {
    question: 'How does the risk scoring system work?',
    answer: 'Each journal entry is evaluated against all 21 fraud detection tests. When a test is triggered, it contributes a weighted score to that entry\'s total risk score. The composite score determines the risk level: Critical (10+), High (6–9), Medium (3–5), or Low (0–2). Entries with multiple simultaneous flags receive higher scores, reflecting the cumulative risk of concurrent anomalies.',
  },
  {
    question: "What is Benford's Law and why does it matter in auditing?",
    answer: "Benford's Law predicts that in naturally occurring financial datasets, smaller leading digits appear far more frequently than larger ones — '1' appears as the first digit roughly 30% of the time, while '9' appears only ~5%. When a dataset's first-digit distribution deviates significantly from this expected pattern, it may indicate fabricated or manipulated amounts. AnomalyScanner calculates both the Mean Absolute Deviation (MAD) and chi-squared statistic to quantify conformance with the expected Benford distribution.",
  },
  {
    question: 'Do I need to create an account or pay a licence fee?',
    answer: 'No. AnomalyScanner requires no account registration, no email address, and no licence activation. Simply open the application in your browser and begin. The AI Column Mapping feature optionally requires an Anthropic API key (your own), but this is not required for any of the 21 fraud tests or any other core platform feature.',
  },
  {
    question: 'What is the AI Column Mapping feature?',
    answer: "If your GL export uses non-standard column headers (e.g. 'GL_ACCT' instead of 'Account Number'), AnomalyScanner's AI mapping tool can automatically suggest the correct mappings. You provide your Anthropic API key (used only in your browser session, never stored externally), and the platform sends only your column header names — not your financial data — to Claude to generate mapping suggestions. You review and confirm all suggestions before they are applied.",
  },
  {
    question: 'Can I save and reload my audit sessions?',
    answer: 'Yes. After running fraud tests, click "Save Session" in the top bar to store the results locally. Up to 5 sessions are retained automatically (the oldest is removed when the limit is reached). Sessions persist across page refreshes and can be reloaded from the Saved Sessions page at any time.',
  },
  {
    question: 'What are all the fraud detection tests?',
    answer: 'The 21 tests cover: Zero/Null Amount, Short Narration, Unusually High Amount (top 5%), Unusually Low Amount (bottom 5%), Weekend Entry, Seldom Used Account, Rare User, Null/Missing Field, Backdated Entry, Postdated Entry, Entry After Year-End, Repeating Digit Amount, Holiday Entry, Amount Above Threshold, Round Number, Z-Score Anomaly, Splitting/Structuring, Same-Day Reversal, Period-End Clustering, Dormant Account Reactivation, User Concentration Risk, Off-Hours Posting, and Duplicate Entry.',
  },
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* ── HERO ── */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-brand-900 to-brand-700 px-8 py-14 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-600/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-200 text-xs font-semibold mb-5">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            AnomalyScanner · Journal Entry Analytics Platform
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
            Professional Fraud Detection<br />
            <span className="text-brand-300">for General Ledger Auditing</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mb-8 leading-relaxed">
            Detect accounting anomalies, flag suspicious patterns, and generate audit-ready reports —
            powered by 21 intelligent fraud detection algorithms designed for internal auditors,
            forensic accountants, and finance professionals.
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: '21 Fraud Tests',          cls: 'bg-brand-500/20 text-brand-200 border-brand-400/30' },
              { label: "Benford's Law Analysis",  cls: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' },
              { label: 'AI Column Mapping',       cls: 'bg-amber-500/20 text-amber-200 border-amber-400/30' },
              { label: 'EN · FR',                 cls: 'bg-sky-500/20 text-sky-200 border-sky-400/30' },
              { label: 'No Account Required',     cls: 'bg-rose-500/20 text-rose-200 border-rose-400/30' },
            ].map(({ label, cls }) => (
              <span key={label} className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-semibold ${cls}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── ABOUT ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900">About AnomalyScanner</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong className="text-slate-800">AnomalyScanner</strong> is a browser-based fraud analytics
              platform built specifically for accounting professionals who need to review journal entry data
              for irregularities, control failures, and potential fraudulent activity.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Manual review of general ledger data is slow, inconsistent, and increasingly impractical
              as datasets grow. AnomalyScanner automates this process — running 21 forensic-grade
              tests against your entire dataset in seconds, scoring every transaction, and surfacing
              the entries that most warrant human scrutiny.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Built on established audit frameworks and best practices from forensic accounting
              and internal control standards, AnomalyScanner is a practitioner-first tool that
              complements — not replaces — professional judgement.
            </p>
          </div>
          <div className="md:col-span-2 bg-slate-50 rounded-xl p-5 space-y-3.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Platform at a glance</p>
            {[
              ['21',  'Fraud detection algorithms'],
              ['6',   'Required input columns'],
              ['5',   'Saved sessions stored locally'],
              ['2',   'Report export formats'],
              ['0',   'Data sent to any external server'],
            ].map(([num, label]) => (
              <div key={label} className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-brand-600 tabular-nums leading-none">{num}</span>
                <span className="text-xs text-slate-500 leading-snug">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900">How It Works</h2>
        </div>
        <div>
          {STEPS.map((step, i) => (
            <Step key={step.number} {...step} isLast={i === STEPS.length - 1} />
          ))}
        </div>
      </div>

      {/* ── KEY FEATURES ── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Key Features & Capabilities</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </div>

      {/* ── WHO IT'S FOR ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Who It's Designed For</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AUDIENCE.map(a => <AudienceCard key={a.title} {...a} />)}
        </div>
      </div>

      {/* ── SECURITY ── */}
      <div className="rounded-2xl bg-slate-900 px-8 py-10 text-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Security & Privacy</h2>
            <p className="text-xs text-slate-400 mt-0.5">Your data stays on your device. Always.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SECURITY_POINTS.map(({ icon, title, description }) => (
            <div key={title} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/8 transition-colors">
              <div className="text-emerald-400 mb-3">{icon}</div>
              <p className="text-sm font-semibold text-white mb-1.5">{title}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map(faq => <FAQItem key={faq.question} {...faq} />)}
        </div>
      </div>

      {/* ── PAGE FOOTER ── */}
      <div className="text-center py-10 border-t border-slate-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-slate-800">AnomalyScanner</span>
        </div>
        <p className="text-xs text-slate-400">Journal Entry Analytics Platform · Phase 4</p>
        <p className="text-xs text-slate-400 mt-1">
          Created by <span className="font-medium text-slate-500">Ahmad Hassan Khan</span>
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 mt-5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Upload &amp; Analyse
        </Link>
      </div>
    </div>
  )
}
