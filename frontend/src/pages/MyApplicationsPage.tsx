import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, FileQuestion, MapPin, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { MatchBadge } from '../components/ui/MatchBadge'
import { Skeleton } from '../components/ui/Skeleton'
import { PayFeeButton } from '../features/payments/PayFeeButton'
import { useLanguage } from '../hooks/useLanguage'
import { extractApiError } from '../lib/http'
import { applicationsApi } from '../services/api/applications'
import { maybeArabicDigits } from '../utils/arabicNumerals'
import { cn } from '../utils/cn'
import { formatDate } from '../utils/formatDate'
import {
  ApplicationStatus,
  ApplicationStatusCodes,
  type ApplicationDto,
} from '../utils/types'

const API_ORIGIN = (() => {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'
  if (base.startsWith('http')) return base.replace(/\/api\/?$/, '')
  return 'http://localhost:5080'
})()

export function MyApplicationsPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['applications', 'mine'],
    queryFn: () => applicationsApi.mine(),
  })

  const withdraw = useMutation({
    mutationFn: (id: string) => applicationsApi.withdraw(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications', 'mine'] }),
  })

  // Until the Phase 7 backend lands, /api/applications/mine returns 404.
  // We treat that specifically as "no applications yet" rather than as an error.
  const apiErr = query.isError ? extractApiError(query.error) : null
  const isBackendMissing = apiErr?.code === 'not_found'
  const items = query.data ?? []

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{t('myApps.title')}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t('myApps.subtitle')}</p>
      </header>

      {query.isLoading ? (
        <ListSkeleton />
      ) : query.isError && !isBackendMissing ? (
        <Alert tone="error" title={t('errors.generic')}>
          {apiErr?.message}
        </Alert>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileQuestion className="h-7 w-7" />}
            title={t('myApps.empty.title')}
            description={
              isBackendMissing ? t('myApps.empty.comingSoon') : t('myApps.empty.description')
            }
            action={
              <Link to="/browse">
                <Button variant="primary">{t('myApps.empty.cta')}</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <ApplicationRow
              key={a.id}
              app={a}
              onWithdraw={() => withdraw.mutate(a.id)}
              withdrawing={withdraw.isPending && withdraw.variables === a.id}
              language={language}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function ApplicationRow({
  app, onWithdraw, withdrawing, language,
}: {
  app: ApplicationDto
  onWithdraw: () => void
  withdrawing: boolean
  language: string
}) {
  const { t } = useTranslation()
  const isPending = app.status === ApplicationStatus.Pending

  return (
    <li>
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {app.apartmentMainPhotoUrl ? (
          <img
            src={new URL(app.apartmentMainPhotoUrl, API_ORIGIN).toString()}
            alt={app.apartmentTitle}
            className="h-24 w-full shrink-0 rounded-2xl object-cover sm:w-32"
          />
        ) : (
          <div className="grid h-24 w-full shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-400 sm:w-32">
            <Building2 className="h-6 w-6" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              to={`/apartments/${app.apartmentId}`}
              className="line-clamp-1 text-base font-semibold text-neutral-900 hover:text-brand-600"
            >
              {app.apartmentTitle}
            </Link>
            <StatusPill status={app.status} />
          </div>

          <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
            <MapPin className="h-3.5 w-3.5" />
            {app.apartmentNeighborhood}
            <span className="text-neutral-300">·</span>
            <span>{t('myApps.appliedOn', { date: formatDate(app.createdAt, language) })}</span>
          </p>

          {app.message && (
            <p className="mt-2 line-clamp-2 text-sm text-neutral-700">"{app.message}"</p>
          )}

          <div className="mt-3 flex items-center gap-3">
            <MatchBadge score={app.compatibilityScore} size="sm" />
            <span className="text-xs text-neutral-400">
              {t('myApps.compatibilitySnapshot', {
                value: maybeArabicDigits(app.compatibilityScore, language),
              })}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 sm:self-center">
          {isPending && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onWithdraw}
              loading={withdrawing}
              leftIcon={<Trash2 className="h-4 w-4" />}
              className="text-rose-600 hover:bg-rose-50"
            >
              {t('myApps.withdraw')}
            </Button>
          )}
          {app.status === ApplicationStatus.Accepted && (
            <PayFeeButton applicationId={app.id} />
          )}
        </div>
      </Card>
    </li>
  )
}

function StatusPill({ status }: { status: ApplicationStatus }) {
  const { t } = useTranslation()
  const code = ApplicationStatusCodes[status]
  const tone =
    status === ApplicationStatus.Accepted  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : status === ApplicationStatus.Rejected ? 'bg-rose-50    text-rose-700    border-rose-200'
    : status === ApplicationStatus.Withdrawn? 'bg-neutral-100 text-neutral-700 border-neutral-200'
    :                                          'bg-amber-50   text-amber-700   border-amber-200'
  return (
    <span className={cn('inline-flex items-center rounded-2xl border px-2.5 py-0.5 text-xs font-medium', tone)}>
      {t(`myApps.status.${code}`)}
    </span>
  )
}

function ListSkeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i}>
          <Card className="flex flex-col gap-4 sm:flex-row">
            <Skeleton className="h-24 w-full sm:w-32" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="mt-2 h-5 w-24" />
            </div>
          </Card>
        </li>
      ))}
    </ul>
  )
}
