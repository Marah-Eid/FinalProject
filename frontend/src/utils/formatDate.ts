import { toArabicNumerals } from './arabicNumerals'

/**
 * Renders an ISO timestamp as a locale-appropriate medium-length date.
 * When the active language is ar, digits are converted to Arabic-Indic.
 */
export function formatDate(iso: string | Date, language: string = 'ar'): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(date.getTime())) return ''

  // Use the appropriate locale name. We pick the Gregorian calendar in both
  // languages — Arabic users in Jordan typically use Gregorian dates online.
  const locale = language === 'ar' ? 'ar-JO' : 'en-GB'
  const formatted = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)

  // Intl.DateTimeFormat in ar-JO already returns Arabic-Indic digits in most
  // browsers; this is a defensive belt-and-suspenders for environments that
  // return Latin digits.
  return language === 'ar' ? toArabicNumerals(formatted) : formatted
}
