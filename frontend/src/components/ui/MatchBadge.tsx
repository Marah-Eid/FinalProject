import { useTranslation } from 'react-i18next'

import { useLanguage } from '../../hooks/useLanguage'
import { maybeArabicDigits } from '../../utils/arabicNumerals'
import { cn } from '../../utils/cn'

type Props = {
  score: number | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Compatibility-match badge. Null score (e.g. user not logged in or quiz
 * incomplete) hides the badge entirely so cards don't render an empty pill.
 *
 * The visual is a soft pill in three sizes; in Phase 5 we'll also have a
 * full circular donut on the apartment-detail page. This component is the
 * lightweight version for browse cards.
 */
export function MatchBadge({ score, size = 'md', className }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguage()

  if (score === null || score === undefined) return null

  // Green for high, amber middling, neutral for low — these are intentional
  // signals on the card.
  const tone =
    score >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : score >= 50 ? 'bg-amber-50  text-amber-800  border-amber-200'
    :               'bg-neutral-50 text-neutral-700 border-neutral-200'

  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-[11px]'
    : size === 'lg' ? 'px-3 py-1 text-sm'
    :                 'px-2.5 py-0.5 text-xs'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-2xl border font-medium',
        tone,
        sizeClasses,
        className,
      )}
      aria-label={t('match.percent', { value: score })}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {t('match.percent', { value: maybeArabicDigits(score, language) })}
    </span>
  )
}
