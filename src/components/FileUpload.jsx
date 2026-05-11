import { useRef, useState, useCallback } from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function FileUpload({ onFile, file, error, fileWarning, onReset, sheetNames, selectedSheet, onSelectSheet, onLoadDemo }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const { t } = useLanguage()

  const handleFiles = useCallback(
    (files) => { if (files && files.length > 0) onFile(files[0]) },
    [onFile]
  )

  const onDragOver    = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave   = () => setDragging(false)
  const onDrop        = (e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }
  const onInputChange = (e) => handleFiles(e.target.files)

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Parse warning type
  const warnType  = fileWarning?.split(':')[0]
  const warnValue = fileWarning?.split(':')[1]

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{t('fileUpload.title')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('fileUpload.subtitle')}</p>
        </div>
        {file && (
          <button onClick={onReset} className="btn-ghost text-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l16 16M4 20L20 4" />
            </svg>
            {t('fileUpload.clear')}
          </button>
        )}
      </div>

      {!file ? (
        <>
          <div
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl px-6 py-12 cursor-pointer transition-all duration-200 ${
              dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-400 hover:bg-slate-50'
            }`}
          >
            <div className={`p-3 rounded-full transition-colors ${dragging ? 'bg-brand-100' : 'bg-slate-100'}`}>
              <svg className={`w-7 h-7 ${dragging ? 'text-brand-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                {dragging ? t('fileUpload.dropHere') : t('fileUpload.dragDrop')}
              </p>
              <p className="text-xs text-slate-400 mt-1">{t('fileUpload.clickBrowse')}</p>
            </div>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={onInputChange} className="sr-only" />
          </div>

          {onLoadDemo && (
            <>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <button
                type="button"
                onClick={onLoadDemo}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-brand-600 hover:text-brand-700 border border-brand-200 hover:border-brand-300 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                </svg>
                Try with sample fraud data
              </button>
            </>
          )}
        </>
      ) : (
        <div className="flex items-center gap-4 px-4 py-3 bg-brand-50 border border-brand-100 rounded-xl">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-600 shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{formatSize(file.size)}</p>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('fileUpload.uploaded')}
            </span>
          </div>
        </div>
      )}

      {/* #15: multi-sheet selector */}
      {sheetNames && sheetNames.length > 1 && (
        <div className="mt-3 flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl">
          <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-xs text-indigo-700 font-medium flex-1">{t('fileUpload.multiSheet', { count: sheetNames.length })}</p>
          <select
            value={selectedSheet ?? ''}
            onChange={e => onSelectSheet?.(e.target.value)}
            className="text-xs border border-indigo-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {sheetNames.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* #17: file size / row count warning */}
      {fileWarning && (
        <div className="mt-3 flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
          <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-amber-800">
            {warnType === 'large_file'
              ? t('fileUpload.largeFileWarning', { size: warnValue })
              : t('fileUpload.largeRowsWarning', { rows: Number(warnValue).toLocaleString() })
            }
          </p>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <p className="text-[11px] text-slate-400">
          Your data is processed entirely in your browser — never uploaded to any server.
        </p>
      </div>
    </div>
  )
}
