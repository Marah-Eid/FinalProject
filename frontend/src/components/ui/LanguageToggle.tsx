import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useLanguage } from '../../hooks/useLanguage'
import { cn } from '../../utils/cn'

/**
 * Two-state toggle (AR / EN). Compact enough for the navbar; flips both
 * `<html lang>` and `<html dir>` via the hook.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation()

  return (
    <div
      role="group"
      aria-label={t('nav.language')}
      className={cn(
        'inline-flex items-center gap-1 rounded-2xl border border-neutral-200 bg-white p-1',
        className,
      )}
    >
      <Globe aria-hidden className="ms-2 h-4 w-4 text-neutral-500" />
      <button
        type="button"
        onClick={() => setLanguage('ar')}
        aria-pressed={language === 'ar'}
        className={cn(
          'rounded-2xl px-2.5 py-1 text-xs font-medium transition',
          language === 'ar'
            ? 'bg-brand-500 text-white'
            : 'text-neutral-600 hover:bg-neutral-100',
        )}
      >
        {t('nav.arabic')}
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        className={cn(
          'rounded-2xl px-2.5 py-1 text-xs font-medium transition',
          language === 'en'
            ? 'bg-brand-500 text-white'
            : 'text-neutral-600 hover:bg-neutral-100',
        )}
      >
        {t('nav.english')}
      </button>
    </div>
  )
}
