import { useState } from 'react'

const PAGE_SIZE_OPTIONS = [10, 50, 100]

function formatCell(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (value instanceof Date) return value.toLocaleDateString()
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}

export default function DataPreview({ rows, headers, totalRows }) {
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const pageRows = rows.slice(start, start + pageSize)

  function handlePageSize(e) {
    setPageSize(Number(e.target.value))
    setPage(1)
  }

  function handlePage(next) {
    setPage(p => Math.min(Math.max(1, p + next), totalPages))
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Data Preview</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {start + 1}–{Math.min(start + pageSize, rows.length)} of {totalRows} rows
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
            {totalRows.toLocaleString()} total rows
          </span>
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            Rows per page
            <select
              value={pageSize}
              onChange={handlePageSize}
              className="border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PAGE_SIZE_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 pr-4 font-semibold text-slate-400 w-10">#</th>
              {headers.map(h => (
                <th
                  key={h}
                  className="text-left py-2 pr-4 font-semibold text-slate-600 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr
                key={start + i}
                className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                <td className="py-2.5 pr-4 text-slate-300 font-mono">{start + i + 1}</td>
                {headers.map(h => (
                  <td
                    key={h}
                    className="py-2.5 pr-4 text-slate-700 whitespace-nowrap max-w-[200px] truncate"
                    title={String(row[h] ?? '')}
                  >
                    {formatCell(row[h])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => handlePage(-1)}
            disabled={safePage === 1}
            className="px-3 py-1.5 text-xs rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === '…' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 text-xs rounded border transition-colors ${
                      p === safePage
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
          </div>

          <button
            onClick={() => handlePage(1)}
            disabled={safePage === totalPages}
            className="px-3 py-1.5 text-xs rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
