import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BadgeCheck,
  Building2,
  Check,
  Inbox,
  MessageSquare,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { MatchBadge } from '../components/ui/MatchBadge'
import { Skeleton } from '../components/ui/Skeleton'
import { useLanguage } from '../hooks/useLanguage'
import { extractApiError } from '../lib/http'
import { applicationsApi } from '../services/api/applications'
import { maybeArabicDigits } from '../utils/arabicNumerals'
import { cn } from '../utils/cn'
import { formatDate } from '../utils/formatDate'
import {
  ApplicationStatus,
  ApplicationStatusCodes,
  UniversityCodes,
  type ApplicationReceivedDto,
} from '../utils/types'

const API_ORIGIN = (() => {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'
  if (base.startsWith('http')) return base.replace(/\/api\/?$/, '')
  return 'http://localhost:5080'
})()

type Filter = 'all' | 'pending' | 'accepted' | 'rejected'

export function OwnerApplicationsPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const qc = useQueryClient()

  const [filter, setFilter] = useState<Filter>('pending')

  const query = useQuery({
    queryKey: ['applications', 'received'],
    queryFn: () => applicationsApi.received(),
  })

  const accept = useMutation({
    mutationFn: (id: string) => applicationsApi.accept(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['applications', 'received'] })
      void qc.invalidateQueries({ queryKey: ['conversations'] })
      void qc.invalidateQueries({ queryKey: ['apartment'] })
    },
  })
  const reject = useMutation({
    mutationFn: (id: string) => applicationsApi.reject(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['applications', 'received'] })
    },
  })

  const items = query.data ?? []
  const visible = items.filter((a) => {
    if (filter === 'all') return true
    if (filter === 'pending') return a.status === ApplicationStatus.Pending
    if (filter === 'accepted') return a.status === ApplicationStatus.Accepted
    if (filter === 'rejected') return a.status === ApplicationStatus.Rejected
    return true
  })

  const counts = {
    all: items.length,
    pending: items.filter((a) => a.status === ApplicationStatus.Pending).length,
    accepted: items.filter((a) => a.status === ApplicationStatus.Accepted).length,
    rejected: items.filter((a) => a.status === ApplicationStatus.Rejected).length,
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
          {t('ownerApps.title')}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">{t('ownerApps.subtitle')}</p>
      </header>

      {/* Filter tabs */}
      <div className="mb-4 inline-flex rounded-2xl border border-neutral-200 bg-white p-1">
        {(['pending', 'accepted', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-medium transition',
              filter === f ? 'bg-brand-500 text-white' : 'text-neutral-600 hover:bg-neutral-100',
            )}
          >
            {t(`ownerApps.filter.${f}`)}
            <span className={cn(
              'ms-1 inline-flex h-4 min-w-[18px] items-center justify-center rounded-2xl px-1 text-[10px]',
              filter === f ? 'bg-white/25 text-white' : 'bg-neutral-200 text-neutral-700',
            )}>
              {maybeArabicDigits(counts[f], language)}
            </span>
          </button>
        ))}
      </div>

      {/* Mutation feedback */}
      {(accept.isError || reject.isError) && (
        <Alert tone="error" className="mb-4">
          {extractApiError(accept.error ?? reject.error).message}
        </Alert>
      )}

      {/* List */}
      {query.isLoading ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox className="h-7 w-7" />}
            title={t('ownerApps.empty.title')}
            description={t(`ownerApps.empty.${filter}`)}
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((a) => (
            <ApplicationCard
              key={a.id}
              app={a}
              language={language}
              onAccept={() => accept.mutate(a.id)}
              onReject={() => reject.mutate(a.id)}
              accepting={accept.isPending && accept.variables === a.id}
              rejecting={reject.isPending && reject.variables === a.id}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────────────

function ApplicationCard({
  app, language, onAccept, onReject, accepting, rejecting,
}: {
  app: ApplicationReceivedDto
  language: string
  onAccept: () => void
  onReject: () => void
  accepting: boolean
  rejecting: boolean
}) {
  const { t } = useTranslation()
  const isPending = app.status === ApplicationStatus.Pending

  return (
    <li>
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {/* Student photo */}
          {app.studentProfilePhotoUrl ? (
            <img
              src={new URL(app.studentProfilePhotoUrl, API_ORIGIN).toString()}
              alt={app.studentFullName}
              className="h-14 w-14 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">
              <Building2 className="h-6 w-6" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-neutral-900">{app.studentFullName}</p>
              {app.studentIsUniversityVerified && (
                <span className="inline-flex items-center gap-1 rounded-2xl bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <BadgeCheck className="h-3 w-3" />
                  {t('badges.verifiedStudent')}
                </span>
              )}
              <StatusPill status={app.status} />
            </div>

            <p className="mt-0.5 text-xs text-neutral-500">
              {app.apartmentTitle}
              <span className="mx-1 text-neutral-300">·</span>
              {t('dashboard.recentApps.appliedOn', { date: formatDate(app.createdAt, language) })}
            </p>

            <p className="mt-1 text-xs text-neutral-600">
              {app.studentUniversity !== null && (
                <>
                  {t(`universities.${UniversityCodes[app.studentUniversity]}`)}
                  {app.studentYear ? (
                    <>
                      <span className="mx-1 text-neutral-300">·</span>
                      {t('apartments.yearN', { year: maybeArabicDigits(app.studentYear, language) })}
                    </>
                  ) : null}
                  {app.studentMajor ? (
                    <>
                      <span className="mx-1 text-neutral-300">·</span>
                      {app.studentMajor}
                    </>
                  ) : null}
                </>
              )}
            </p>

            <div className="mt-2">
              <MatchBadge score={app.compatibilityScore} size="sm" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-neutral-50 p-3 text-sm leading-relaxed text-neutral-700">
          "{app.message}"
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Link to={`/apartments/${app.apartmentId}`} className="text-xs text-brand-600 hover:underline">
            {t('ownerApps.viewListing')}
          </Link>
          <div className="flex-1 sm:hidden" />
          <Link to="/messages">
            <Button variant="ghost" size="sm" leftIcon={<MessageSquare className="h-4 w-4" />}>
              {t('ownerApps.message')}
            </Button>
          </Link>
          {isPending && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={onReject}
                loading={rejecting}
                leftIcon={<X className="h-4 w-4" />}
                className="text-rose-600 hover:bg-rose-50"
              >
                {t('ownerApps.reject')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onAccept}
                loading={accepting}
                leftIcon={<Check className="h-4 w-4" />}
              >
                {t('ownerApps.accept')}
              </Button>
            </>
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
    <span className={cn('inline-flex items-center rounded-2xl border px-2 py-0.5 text-[11px] font-medium', tone)}>
      {t(`myApps.status.${code}`)}
    </span>
  )
}

function ListSkeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i}>
          <Card>
            <div className="flex gap-3">
              <Skeleton className="h-14 w-14" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  )
}
