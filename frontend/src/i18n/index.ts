import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import ar from '../locales/ar.json'
import en from '../locales/en.json'

// i18next setup
//
// • Arabic is the *default* and the *fallback*, per the brief.
// • The browser language detector tries localStorage first (so user choice
//   sticks), then the navigator, then the <html> lang attribute.
// • The selected language is mirrored to <html lang> and <html dir> by
//   useLanguage on change; the initial value is set here in case the user
//   prefers something other than ar.
const initialLng = (() => {
  if (typeof window === 'undefined') return 'ar'
  return window.localStorage.getItem('dorm:lang') ?? 'ar'
})()

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    lng: initialLng,
    fallbackLng: 'ar',
    supportedLngs: ['ar', 'en'],
    defaultNS: 'translation',
    interpolation: { escapeValue: false }, // React already escapes
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'dorm:lang',
    },
    returnNull: false,
  })

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLng
  document.documentElement.dir = initialLng === 'ar' ? 'rtl' : 'ltr'
}

export default i18n
