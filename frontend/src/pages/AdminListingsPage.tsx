import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Eye, Flag, Pause, Play, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { useLanguage } from '../hooks/useLanguage'
import { extractApiError } from '../lib/http'
import { adminApi } from '../services/api/admin'
import { maybeArabicDigits } from '../utils/arabicNumerals'
import { cn } from '../utils/cn'
import { CityCodes, type AdminApartmentDto } from '../utils/types'

export function AdminListingsPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')

  const query = useQuery({
    queryKey: ['admin', 'listings', search, statusFilter],
    queryFn: () => adminApi.listings({
      search: search.trim() || undefined,
      suspended: statusFilter === 'all' ? undefined : statusFilter === 'suspended',
      take: 100,
    }),
    placeholderData: (prev) => prev,
  })

  const suspend = useMutation({
    mutationFn: (id: string) => adminApi.suspendListing(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'listings'] }),
  })
  const activate = useMutation({
    mutationFn: (id: string) => adminApi.activateListing(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'listings'] }),
  })

  return (
    <div className="space-y-4">
      <Card padded>
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder={t('admin.listings.searchPlaceholder')}
              className="ps-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="all">{t('admin.listings.all')}</option>
            <option value="active">{t('admin.listings.activeOnly')}</option>
            <option value="suspended">{t('admin.listings.suspendedOnly')}</option>
          </Select>
        </div>
      </Card>

      {(suspend.isError || activate.isError) && (
        <Alert tone="error">{extractApiError(suspend.error ?? activate.error).message}</Alert>
      )}

      {query.isLoading ? (
        <Card padded={false}>
          <div className="space-y-1 p-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </Card>
      ) : (query.data?.length ?? 0) === 0 ? (
        <Card>
          <EmptyState
            icon={<Building2 className="h-7 w-7" />}
            title={t('admin.listings.empty.title')}
            description={t('admin.listings.empty.description')}
          />
        </Card>
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-neutral-100">
            {query.data!.map((a) => (
              <Row
                key={a.id}
                apt={a}
                language={language}
                onSuspend={() => suspend.mutate(a.id)}
                onActivate={() => activate.mutate(a.id)}
                pending={
                  (suspend.isPending && suspend.variables === a.id) ||
                  (activate.isPending && activate.variables === a.id)
                }
              />
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function Row({
  apt, language, onSuspend, onActivate, pending,
}: {
  apt: AdminApartmentDto
  language: string
  onSuspend: () => void
  onActivate: () => void
  pending: boolean
}) {
  const { t } = useTranslation()
  return (
    <li className="flex items-start gap-3 px-4 py-3 sm:items-center">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">
        <Building2 className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <Link to={`/apartments/${apt.id}`}
          className="line-clamp-1 text-sm font-medium text-neutral-900 hover:text-brand-600">
          {apt.title}
        </Link>
        <p className="truncate text-xs text-neutral-500">
          {apt.neighborhood} · {t(`cities.${CityCodes[apt.city]}`)}
          <span className="mx-1 text-neutral-300">·</span>
          {apt.ownerName}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
          {apt.isSuspended ? (
            <span className="inline-flex items-center gap-1 rounded-2xl bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
              {t('admin.listings.suspendedBadge')}
            </span>
          ) : !apt.isActive ? (
            <span className="inline-flex items-center gap-1 rounded-2xl bg-neutral-100 px-2 py-0.5 font-medium text-neutral-600">
              {t('admin.listings.inactiveBadge')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-2xl bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
              {t('admin.listings.activeBadge')}
            </span>
          )}
          {apt.pendingReportsCount > 0 && (
            <span className={cn(
              'inline-flex items-center gap-1 rounded-2xl px-2 py-0.5 font-medium',
              apt.pendingReportsCount >= 3 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700',
            )}>
              <Flag className="h-3 w-3" />
              {t('admin.listings.pendingReports', { count: maybeArabicDigits(apt.pendingReportsCount, language) })}
            </span>
          )}
          <span className="text-neutral-400">
            {t('apartments.spotsAvailable', {
              available: maybeArabicDigits(apt.availableSpots, language),
              total: maybeArabicDigits(apt.totalSpots, language),
            })}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <Link to={`/apartments/${apt.id}`}>
          <Button variant="ghost" size="sm" leftIcon={<Eye className="h-3.5 w-3.5" />}>
            {t('admin.listings.view')}
          </Button>
        </Link>
        {apt.isSuspended ? (
          <Button variant="primary" size="sm" loading={pending}
            leftIcon={<Play className="h-3.5 w-3.5" />} onClick={onActivate}>
            {t('admin.listings.activate')}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" loading={pending}
            leftIcon={<Pause className="h-3.5 w-3.5" />} onClick={onSuspend}
            className="text-rose-600 hover:bg-rose-50">
            {t('admin.listings.suspend')}
          </Button>
        )}
      </div>
    </li>
  )
}
