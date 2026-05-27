import { useTranslation } from 'react-i18next'

export type Language = 'ar' | 'en'

/**
 * Wraps i18next's `useTranslation` and keeps `<html lang>` / `<html dir>` in
 * sync so RTL layouts switch correctly when the user toggles language.
 */
export function useLanguage() {
  const { i18n } = useTranslation()
  const language = (i18n.resolvedLanguage ?? i18n.language ?? 'ar') as Language

  const setLanguage = (next: Language) => {
    void i18n.changeLanguage(next)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next
      document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
    }
  }

  return { language, setLanguage, isRtl: language === 'ar' }
}
