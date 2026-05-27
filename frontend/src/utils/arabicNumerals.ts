// Converts Latin digits to Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩).
// Used for displaying dates / prices / counts when the active language is ar.
const map: Record<string, string> = {
  '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
  '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',
}

export function toArabicNumerals(input: string | number): string {
  const s = String(input)
  let out = ''
  for (const ch of s) out += map[ch] ?? ch
  return out
}

/**
 * Convenience wrapper: returns the input with Arabic-Indic digits when the
 * active language is ar, untouched otherwise.
 */
export function maybeArabicDigits(input: string | number, language: string): string {
  return language === 'ar' ? toArabicNumerals(input) : String(input)
}
