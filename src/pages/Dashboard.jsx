import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import FileUpload from '../components/FileUpload'
import ColumnValidation from '../components/ColumnValidation'
import DataPreview from '../components/DataPreview'
import LoadingSpinner from '../components/LoadingSpinner'
import FraudSummary from '../components/FraudSummary'
import FraudResults from '../components/FraudResults'
import { useAudit } from '../context/AuditContext'

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${accent || 'text-slate-900'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const {
    file, rows, headers, missingColumns, columnMap, dataIssues,
    loading, fileError, parseError,
    processFile, handleReset,
    flaggedEntries, hasRun, isRunning,
    runTests, summary,
    loadedSessionName,
  } = useAudit()

  const hasData       = rows.length > 0
  const isColumnValid = hasData && missingColumns.length === 0

  return (
    <div className="space-y-6">
      {/* Page intro */}
      <div>
        <h2 className="text-base font-bold text-slate-900">Upload &amp; Analyse</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Import your General Ledger export, validate columns, then run 11 fraud detection checks.
        </p>
      </div>

      {/* Loaded session banner */}
      {loadedSessionName && !file && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-brand-50 border border-brand-200 rounded-xl">
          <svg className="w-5 h-5 text-brand-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <p className="text-sm text-brand-700">
            <span className="font-semibold">Loaded saved session:</span> {loadedSessionName}
            <span className="text-brand-500"> · Upload a new file to run a fresh analysis</span>
          </p>
          <button onClick={handleReset} className="ml-auto text-xs text-brand-600 hover:text-brand-800 font-medium shrink-0">
            Clear
          </button>
        </div>
      )}

      {/* Step 1: Upload */}
      <FileUpload
        onFile={processFile}
        file={file}
        error={fileError}
        onReset={handleReset}
      />

      {/* Parse error */}
      {parseError && (
        <div className="flex items-start gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">Parse Error</p>
            <p className="text-xs text-red-600 mt-1">{parseError}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="card">
          <LoadingSpinner label="Reading file…" />
        </div>
      )}

      {/* Step 2: Validate + Preview */}
      {!loading && hasData && (
        <>
          <SectionDivider label="Step 2 — Validate" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Rows"       value={rows.length.toLocaleString()} sub="journal entries" />
            <StatCard label="Columns Found"    value={headers.length}               sub="in uploaded file" />
            <StatCard
              label="Missing Columns"
              value={missingColumns.length}
              sub="required fields"
              accent={missingColumns.length > 0 ? 'text-red-600' : 'text-emerald-600'}
            />
            <StatCard
              label="File Status"
              value={isColumnValid ? 'Ready' : 'Action Needed'}
              sub={isColumnValid ? 'Passed validation' : 'Fix columns first'}
              accent={isColumnValid ? 'text-emerald-600' : 'text-amber-600'}
            />
          </div>
          <ColumnValidation headers={headers} missingColumns={missingColumns} columnMap={columnMap} dataIssues={dataIssues} />
          <DataPreview rows={rows} headers={headers} totalRows={rows.length} />
        </>
      )}

      {/* Step 3: Run tests */}
      {!loading && (isColumnValid || (loadedSessionName && hasRun)) && (
        <>
          <SectionDivider label="Step 3 — Fraud Tests" />

          {isColumnValid && hasRun && (
            <div className="card flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-slate-900">Re-run Audit Tests</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Re-runs 11 checks: zero amounts, weak narrations, outliers, weekend postings, rare accounts/users, null fields, backdated/postdated entries, year-end entries, and repeating digit amounts.
                </p>
              </div>
              <button
                onClick={() => runTests(rows)}
                disabled={isRunning}
                className="btn-primary shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Running…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                    </svg>
                    Re-run Tests
                  </>
                )}
              </button>
            </div>
          )}

          {isRunning && (
            <div className="card">
              <LoadingSpinner label="Running fraud detection tests…" />
            </div>
          )}

          {!isRunning && hasRun && (
            <>
              <FraudSummary summary={summary} />

              {/* Navigation strip */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/analytics')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                  View Analytics &amp; Insights
                </button>
                <button
                  onClick={() => navigate('/report')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-700 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  View Fraud Report
                </button>
              </div>

              <FraudResults flaggedEntries={flaggedEntries} />
            </>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && !file && !fileError && !loadedSessionName && (
        <div className="card flex flex-col items-center gap-4 py-16 text-center">
          <div className="p-4 bg-slate-100 rounded-2xl">
            <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">No file uploaded yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Upload an Excel file above to begin analysing journal entries.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
