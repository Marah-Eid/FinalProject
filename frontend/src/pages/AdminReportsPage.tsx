import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Eye, Flag, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { useLanguage } from '../hooks/useLanguage'
import { extractApiError } from '../lib/http'
import { adminApi } from '../services/api/admin'
import { cn } from '../utils/cn'
import { formatDate } from '../utils/formatDate'
import {
  ReportReasonCodes,
  ReportStatus,
  ReportStatusCodes,
  type ReportDto,
} from '../utils/types'

export function AdminReportsPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const qc = useQueryClient()

  const [pendingOnly, setPendingOnly] = useState(true)

  const query = useQuery({
    queryKey: ['admin', 'reports', pendingOnly],
    queryFn: () => adminApi.reports({ pendingOnly, take: 100 }),
    placeholderData: (prev) => prev,
  })

  const resolve = useMutation({
    mutationFn: ({ id, dismiss }: { id: string; dismiss: boolean }) =>
      adminApi.resolveReport(id, { dismiss }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'reports'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'listings'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })

  return (
    <div className="space-y-4">
      <Card padded>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={(e) => setPendingOnly(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-200"
          />
          {t('admin.reports.pendingOnly')}
        </label>
      </Card>

      {resolve.isError && <Alert tone="error">{extractApiError(resolve.error).message}</Alert>}

      {query.isLoading ? (
        <Card padded={false}>
          <div className="space-y-1 p-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        </Card>
      ) : (query.data?.length ?? 0) === 0 ? (
        <Card>
          <EmptyState
            icon={<Flag className="h-7 w-7" />}
            title={t('admin.reports.empty.title')}
            description={t('admin.reports.empty.description')}
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {query.data!.map((r) => (
            <ReportRow
              key={r.id}
              report={r}
              language={language}
              onResolve={(dismiss) => resolve.mutate({ id: r.id, dismiss })}
              pending={resolve.isPending && resolve.variables?.id === r.id}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function ReportRow({
  report, language, onResolve, pending,
}: {
  report: ReportDto
  language: string
  onResolve: (dismiss: boolean) => void
  pending: boolean
}) {
  const { t } = useTranslation()
  const tone =
    report.status === ReportStatus.Pending ? 'bg-amber-50 text-amber-700'
    : report.status === ReportStatus.Resolved ? 'bg-emerald-50 text-emerald-700'
    : 'bg-neutral-100 text-neutral-600'

  return (
    <li>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Link to={`/apartments/${report.reportedApartmentId}`}
              className="text-sm font-semibold text-neutral-900 hover:text-brand-600">
              {report.apartmentTitle}
            </Link>
            <p className="mt-0.5 text-xs text-neutral-500">
              {t('admin.reports.reportedBy', { name: report.reporterName })}
              <span className="mx-1 text-neutral-300">·</span>
              {formatDate(report.createdAt, language)}
            </p>
          </div>
          <span className={cn('inline-flex rounded-2xl px-2 py-0.5 text-[11px] font-medium', tone)}>
            {t(`admin.reports.statuses.${ReportStatusCodes[report.status]}`)}
          </span>
        </div>

        <div className="mt-3 inline-flex items-center gap-1.5 rounded-2xl bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
          <Flag className="h-3 w-3" />
          {t(`admin.reports.reasons.${ReportReasonCodes[report.reason]}`)}
        </div>

        {report.description && (
          <p className="mt-3 rounded-2xl bg-neutral-50 p-3 text-sm leading-relaxed text-neutral-700">
            "{report.description}"
          </p>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Link to={`/apartments/${report.reportedApartmentId}`}>
            <Button variant="ghost" size="sm" leftIcon={<Eye className="h-3.5 w-3.5" />}>
              {t('admin.reports.viewListing')}
            </Button>
          </Link>
          {report.status === ReportStatus.Pending && (
            <>
              <Button variant="secondary" size="sm" onClick={() => onResolve(true)}
                loading={pending} leftIcon={<X className="h-3.5 w-3.5" />}>
                {t('admin.reports.dismiss')}
              </Button>
              <Button variant="primary" size="sm" onClick={() => onResolve(false)}
                loading={pending} leftIcon={<Check className="h-3.5 w-3.5" />}>
                {t('admin.reports.resolve')}
              </Button>
            </>
          )}
        </div>
      </Card>
    </li>
  )
}
