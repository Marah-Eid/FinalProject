import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useLanguage } from '../../hooks/useLanguage'
import { maybeArabicDigits } from '../../utils/arabicNumerals'
import { cn } from '../../utils/cn'

type Props = {
  page: number
  totalPages: number
  total: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, onChange }: Props) {
  const { t } = useTranslation()
  const { language, isRtl } = useLanguage()

  if (totalPages <= 1 && total === 0) return null

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft : ChevronRight
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <nav
      role="navigation"
      aria-label={t('pagination.label')}
      className="flex items-center justify-between gap-4 py-6"
    >
      <p className="text-xs text-neutral-500">
        {t('pagination.summary', {
          page: maybeArabicDigits(page, language),
          totalPages: maybeArabicDigits(Math.max(1, totalPages), language),
          total: maybeArabicDigits(total, language),
        })}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => canPrev && onChange(page - 1)}
          disabled={!canPrev}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium',
            canPrev ? 'text-neutral-800 hover:bg-neutral-50' : 'text-neutral-400 opacity-60',
          )}
        >
          <PrevIcon className="h-4 w-4" />
          {t('pagination.prev')}
        </button>
        <button
          type="button"
          onClick={() => canNext && onChange(page + 1)}
          disabled={!canNext}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium',
            canNext ? 'text-neutral-800 hover:bg-neutral-50' : 'text-neutral-400 opacity-60',
          )}
        >
          {t('pagination.next')}
          <NextIcon className="h-4 w-4" />
        </button>
      </div>
    </nav>
  )
}
