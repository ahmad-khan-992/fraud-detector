import { useLocation } from 'react-router-dom'
import { useAudit } from '../../context/AuditContext'
import { useLanguage } from '../../context/LanguageContext'

const PAGE_KEYS = {
  '/':          { title: 'sidebar.uploadAnalyse', sub: 'topbar.uploadSub'   },
  '/analytics': { title: 'sidebar.analytics',     sub: 'topbar.analyticsSub' },
  '/report':    { title: 'sidebar.fraudReport',   sub: 'topbar.reportSub'   },
  '/sessions':  { title: 'sidebar.savedSessions', sub: 'topbar.sessionsSub' },
  '/about':     { title: 'sidebar.about',          sub: 'topbar.aboutSub'    },
}

export default function Topbar({ onSave, canSave }) {
  const { pathname } = useLocation()
  const { file, summary, hasRun, loadedSessionName } = useAudit()
  const { lang, setLang, t } = useLanguage()

  const pageKeys    = PAGE_KEYS[pathname] || PAGE_KEYS['/']
  const sessionName = loadedSessionName || file?.name

  return (
    <header className="topbar-container fixed left-60 right-0 top-0 h-16 bg-white border-b border-slate-200 flex items-center px-6 z-10 gap-4 no-print">
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-900 leading-tight truncate">{t(pageKeys.title)}</h1>
        <p className="text-xs text-slate-400 hidden sm:block truncate">{t(pageKeys.sub)}</p>
      </div>

      {/* Session pill */}
      {sessionName && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 min-w-0 max-w-xs">
          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-xs text-slate-600 font-medium truncate">{sessionName}</span>
          {hasRun && summary.total > 0 && (
            <span className="text-xs text-slate-400 shrink-0 tabular-nums">
              {summary.total.toLocaleString()} {t('topbar.rows')}
            </span>
          )}
        </div>
      )}

      {/* Language toggle */}
      <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden shrink-0">
        {['en', 'fr'].map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
              lang === l
                ? 'bg-brand-600 text-white'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Save session button */}
      {canSave && (
        <button
          onClick={onSave}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {t('topbar.saveSession')}
        </button>
      )}
    </header>
  )
}
