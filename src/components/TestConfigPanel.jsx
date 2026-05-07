import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

function ConfigRow({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function TestConfigPanel({ testConfig, setTestConfig }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  function update(key, value) {
    setTestConfig(prev => ({ ...prev, [key]: value }))
  }

  const inputCls = 'w-24 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white'

  return (
    <div className="card">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{t('testConfig.title')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('testConfig.subtitle')}</p>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ml-3 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-4">
          <ConfigRow label={t('testConfig.backdateDays')} hint={t('testConfig.backdateDaysHint')}>
            <input
              type="number" min={1} max={365} step={1}
              value={testConfig.backdateDays}
              onChange={e => update('backdateDays', Math.max(1, parseInt(e.target.value) || 1))}
              className={inputCls}
            />
          </ConfigRow>

          <ConfigRow label={t('testConfig.narrationMinLen')} hint={t('testConfig.narrationMinLenHint')}>
            <input
              type="number" min={0} max={50} step={1}
              value={testConfig.narrationMinLen}
              onChange={e => update('narrationMinLen', Math.max(0, parseInt(e.target.value) || 0))}
              className={inputCls}
            />
          </ConfigRow>

          <ConfigRow label={t('testConfig.zScoreThreshold')} hint={t('testConfig.zScoreThresholdHint')}>
            <input
              type="number" min={1.5} max={6} step={0.1}
              value={testConfig.zScoreThreshold}
              onChange={e => update('zScoreThreshold', Math.max(1.5, parseFloat(e.target.value) || 3.0))}
              className={inputCls}
            />
          </ConfigRow>

          <ConfigRow label={t('testConfig.splittingThreshold')} hint={t('testConfig.splittingThresholdHint')}>
            <input
              type="number" min={100} step={100}
              value={testConfig.splittingThreshold}
              onChange={e => update('splittingThreshold', Math.max(100, parseInt(e.target.value) || 10000))}
              className={inputCls}
            />
          </ConfigRow>

          <ConfigRow label={t('testConfig.roundNumberMin')} hint={t('testConfig.roundNumberMinHint')}>
            <select
              value={testConfig.roundNumberMin}
              onChange={e => update('roundNumberMin', parseInt(e.target.value))}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1,000</option>
              <option value={5000}>5,000</option>
              <option value={10000}>10,000</option>
            </select>
          </ConfigRow>

          <p className="text-xs text-slate-400 mt-3">{t('testConfig.note')}</p>
        </div>
      )}
    </div>
  )
}
