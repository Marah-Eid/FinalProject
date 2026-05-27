import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock, CreditCard, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert } from '../components/ui/Alert'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { useLanguage } from '../hooks/useLanguage'
import { extractApiError } from '../lib/http'
import { paymentsApi } from '../services/api/payments'
import { maybeArabicDigits } from '../utils/arabicNumerals'
import { cn } from '../utils/cn'
import { formatDate } from '../utils/formatDate'
import {
  PaymentStatus,
  PaymentStatusCodes,
  PaymentTypeCodes,
} from '../utils/types'

export function PaymentHistoryPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()

  const query = useQuery({
    queryKey: ['payments', 'history'],
    queryFn: () => paymentsApi.history(),
  })

  const items = query.data ?? []
  const total = items
    .filter((p) => p.status === PaymentStatus.Completed)
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{t('payments.title')}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t('payments.subtitle')}</p>
      </header>

      {query.isError && (
        <Alert tone="error" className="mb-4">
          {extractApiError(query.error).message}
        </Alert>
      )}

      {/* Summary */}
      {!query.isLoading && items.length > 0 && (
        <div className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          {t('payments.totalPaid', {
            value: maybeArabicDigits(total.toFixed(2), language),
          })}
        </div>
      )}

      {query.isLoading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CreditCard className="h-7 w-7" />}
            title={t('payments.empty.title')}
            description={t('payments.empty.description')}
          />
        </Card>
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-neutral-100">
            {items.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-4">
                <StatusIcon status={p.status} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900">
                    {t(`payments.types.${PaymentTypeCodes[p.type]}`)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatDate(p.createdAt, language)}
                    {p.transactionRef && (
                      <>
                        <span className="mx-1 text-neutral-300">·</span>
                        <code className="font-mono text-[11px]" dir="ltr">{p.transactionRef}</code>
                      </>
                    )}
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-base font-bold text-neutral-900">
                    {t('apartments.priceValue', {
                      value: maybeArabicDigits(p.amount.toFixed(2), language),
                    })}
                  </p>
                  <StatusPill status={p.status} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: PaymentStatus }) {
  const Icon =
    status === PaymentStatus.Completed ? CheckCircle2
    : status === PaymentStatus.Failed ? XCircle
    : Clock
  const tone =
    status === PaymentStatus.Completed ? 'bg-emerald-50 text-emerald-600'
    : status === PaymentStatus.Failed ? 'bg-rose-50 text-rose-600'
    : 'bg-amber-50 text-amber-600'
  return (
    <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-2xl', tone)}>
      <Icon className="h-5 w-5" />
    </div>
  )
}

function StatusPill({ status }: { status: PaymentStatus }) {
  const { t } = useTranslation()
  const code = PaymentStatusCodes[status]
  const tone =
    status === PaymentStatus.Completed ? 'bg-emerald-50 text-emerald-700'
    : status === PaymentStatus.Failed ? 'bg-rose-50 text-rose-700'
    : 'bg-amber-50 text-amber-700'
  return (
    <span className={cn('inline-flex items-center rounded-2xl px-2 py-0.5 text-[11px] font-medium', tone)}>
      {t(`payments.statuses.${code}`)}
    </span>
  )
}

function ListSkeleton() {
  return (
    <Card padded={false}>
      <ul className="divide-y divide-neutral-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-5 py-4">
            <Skeleton className="h-10 w-10" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-16" />
          </li>
        ))}
      </ul>
    </Card>
  )
}
