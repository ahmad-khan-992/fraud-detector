import { createContext, useContext, useState } from 'react'
import { translations } from '../utils/translations'

const LanguageContext = createContext(null)

function resolvePath(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj)
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('auditiq_lang') || 'en')

  function changeLang(l) {
    setLang(l)
    localStorage.setItem('auditiq_lang', l)
  }

  function t(key, vars = {}) {
    const val = resolvePath(translations[lang], key) ?? resolvePath(translations.en, key) ?? key
    if (typeof val !== 'string') return key
    return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{{${k}}}`, String(v)), val)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
