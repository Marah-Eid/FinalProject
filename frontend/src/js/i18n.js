// i18n — t(key, params) translates UI strings, setLang() swaps Bootstrap RTL/LTR CSS
import en from '../locales/en.json'
import ar from '../locales/ar.json'

const translations = { en, ar }

let currentLang = localStorage.getItem('lang') || 'ar'

export function t(key, params = {}) {
  const keys = key.split('.')
  let val = translations[currentLang]
  for (const k of keys) {
    if (val == null) return key
    val = val[k]
  }
  if (typeof val !== 'string') return key
  return val.replace(/\{\{(\w+)\}\}/g, (_, name) => params[name] ?? '')
}

export function getLang() { return currentLang }
export function isRtl() { return currentLang === 'ar' }

export function setLang(lang) {
  currentLang = lang
  localStorage.setItem('lang', lang)
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'

  const bootstrapRtl = document.querySelector('link[href*="bootstrap@"]')
  if (bootstrapRtl) {
    bootstrapRtl.href = lang === 'ar'
      ? 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css'
      : 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css'
  }
}

export function initLang() {
  setLang(currentLang)
}
