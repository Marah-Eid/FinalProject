import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CompatibilityCircle } from '../../components/ui/CompatibilityCircle'
import { cn } from '../../utils/cn'
import { QuizQuestionCodes, type QuizQuestionKey } from '../../utils/types'

type Props = {
  score: number
  matchedOn: QuizQuestionKey[]
  differedOn: QuizQuestionKey[]
  tenantsCount: number
  className?: string
}

/**
 * Detail-page compatibility breakdown — large donut + matched/differed pill lists.
 * Renders nothing when both lists are empty AND the score is 100 (no tenants case):
 * the parent can still show the donut on its own via CompatibilityCircle if it wants.
 */
export function CompatibilityBreakdown({
  score, matchedOn, differedOn, tenantsCount, className,
}: Props) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 rounded-2xl border border-neutral-200 bg-white p-6 sm:grid-cols-[auto_1fr]',
        className,
      )}
    >
      <div className="flex flex-col items-center justify-center gap-2 sm:items-start">
        <CompatibilityCircle score={score} size="lg" label={t('match.label')} />
        <p className="text-center text-xs text-neutral-500 sm:text-start">
          {tenantsCount === 0
            ? t('match.noTenantsExplain')
            : t('match.averageAcross', { count: tenantsCount })}
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-neutral-900">{t('match.breakdownTitle')}</h3>

        <Section
          tone="match"
          title={t('match.matchedOn')}
          empty={t('match.matchedOnEmpty')}
          items={matchedOn}
        />
        <Section
          tone="differ"
          title={t('match.differedOn')}
          empty={t('match.differedOnEmpty')}
          items={differedOn}
        />
      </div>
    </div>
  )
}

function Section({
  tone, title, empty, items,
}: {
  tone: 'match' | 'differ'
  title: string
  empty: string
  items: QuizQuestionKey[]
}) {
  const { t } = useTranslation()
  const Icon = tone === 'match' ? Check : X
  const wrapTone =
    tone === 'match'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-rose-50 text-rose-700 border-rose-200'
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-400">{empty}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((q) => (
            <li
              key={q}
              className={cn(
                'inline-flex items-center gap-1 rounded-2xl border px-2.5 py-1 text-xs font-medium',
                wrapTone,
              )}
            >
              <Icon className="h-3 w-3" />
              {t(`quiz.q.${QuizQuestionCodes[q]}.title`)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
