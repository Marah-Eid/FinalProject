import { useTranslation } from 'react-i18next'

import { useLanguage } from '../../hooks/useLanguage'
import { maybeArabicDigits } from '../../utils/arabicNumerals'
import { cn } from '../../utils/cn'
import {
  PaymentType,
  PaymentTypeCodes,
  type RevenueByTypeRow,
} from '../../utils/types'

type Props = {
  data: RevenueByTypeRow[]
  className?: string
}

const TYPE_TONE: Record<PaymentType, string> = {
  [PaymentType.MatchCommission]: 'bg-brand-500',
  [PaymentType.FeaturedListing]: 'bg-emerald-500',
  [PaymentType.VerifiedBadge]: 'bg-blue-500',
}

/**
 * Lightweight horizontal-bar chart for revenue by payment type. No external
 * dep — width is proportional to the largest row.
 */
export function RevenueChart({ data, className }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguage()

  const allTypes: PaymentType[] = [
    PaymentType.MatchCommission,
    PaymentType.FeaturedListing,
    PaymentType.VerifiedBadge,
  ]
  // Fill in zero rows so absent types still render.
  const rowsByType = new Map(data.map((r) => [r.type, r]))
  const rows = allTypes.map(
    (t) => rowsByType.get(t) ?? { type: t, count: 0, total: 0 },
  )
  const max = Math.max(1, ...rows.map((r) => r.total))

  return (
    <div className={cn('space-y-3', className)}>
      {rows.map((r) => {
        const pct = Math.max(2, Math.round((r.total / max) * 100))
        return (
          <div key={r.type}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-700">
                {t(`payments.types.${PaymentTypeCodes[r.type]}`)}
              </span>
              <span className="text-neutral-500">
                {t('admin.revenue.txnCount', { count: maybeArabicDigits(r.count, language) })}
                <span className="mx-1 text-neutral-300">·</span>
                <span className="font-semibold text-neutral-900">
                  {t('apartments.priceValue', {
                    value: maybeArabicDigits(r.total.toFixed(0), language),
                  })}
                </span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-2xl bg-neutral-100">
              <div
                className={cn('h-full rounded-2xl transition-[width] duration-500', TYPE_TONE[r.type])}
                style={{ width: `${pct}%` }}
                aria-hidden
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
