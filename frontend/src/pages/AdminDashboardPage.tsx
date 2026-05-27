import { useQuery } from '@tanstack/react-query'
import {
  AlertOctagon,
  Building2,
  Coins,
  GraduationCap,
  Home,
  Inbox,
  Sparkles,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert } from '../components/ui/Alert'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { RevenueChart } from '../features/admin/RevenueChart'
import { useLanguage } from '../hooks/useLanguage'
import { extractApiError } from '../lib/http'
import { adminApi } from '../services/api/admin'
import { maybeArabicDigits } from '../utils/arabicNumerals'
import { cn } from '../utils/cn'

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()

  const query = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.dashboard(),
    refetchInterval: 60_000,
  })

  if (query.isLoading) return <DashboardSkeleton />
  if (query.isError)
    return <Alert tone="error">{extractApiError(query.error).message}</Alert>

  const d = query.data!

  return (
    <div className="space-y-6">
      {/* ── Stat grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat tone="brand"   icon={<Users className="h-5 w-5" />}        label={t('admin.cards.totalUsers')}        value={d.totalUsers} />
        <Stat tone="blue"    icon={<GraduationCap className="h-5 w-5" />}label={t('admin.cards.totalStudents')}     value={d.totalStudents} />
        <Stat tone="purple"  icon={<Home className="h-5 w-5" />}         label={t('admin.cards.totalOwners')}       value={d.totalOwners} />
        <Stat tone="emerald" icon={<Building2 className="h-5 w-5" />}    label={t('admin.cards.activeListings')}    value={d.activeListings} />
        <Stat tone="rose"    icon={<AlertOctagon className="h-5 w-5" />} label={t('admin.cards.suspendedListings')} value={d.suspendedListings} />
        <Stat tone="emerald" icon={<Sparkles className="h-5 w-5" />}     label={t('admin.cards.activeTenancies')}   value={d.activeTenancies} />
        <Stat tone="amber"   icon={<Inbox className="h-5 w-5" />}        label={t('admin.cards.pendingReports')}    value={d.pendingReports} />
        <Stat tone="brand"   icon={<Coins className="h-5 w-5" />}
          label={t('admin.cards.revenueThisMonth')}
          value={t('apartments.priceValue', {
            value: maybeArabicDigits(d.revenueThisMonthJod.toFixed(0), language),
          })}
        />
      </div>

      {/* ── Revenue chart ──────────────────────────────────────────────── */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">{t('admin.revenue.title')}</h2>
          <p className="text-xs text-neutral-500">
            {t('admin.revenue.allTime', {
              value: maybeArabicDigits(d.revenueAllTimeJod.toFixed(0), language),
            })}
          </p>
        </div>
        {d.revenueByType.length === 0 ? (
          <p className="text-sm text-neutral-500">{t('admin.revenue.empty')}</p>
        ) : (
          <RevenueChart data={d.revenueByType} />
        )}
      </Card>
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────────────

function Stat({
  icon, label, value, tone,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  tone: 'brand' | 'emerald' | 'amber' | 'blue' | 'purple' | 'rose'
}) {
  const { language } = useLanguage()
  const toneClasses = {
    brand: 'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    rose: 'bg-rose-50 text-rose-700',
  }[tone]

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className={cn('mb-2 inline-flex h-9 w-9 items-center justify-center rounded-2xl', toneClasses)}>
        {icon}
      </div>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-neutral-900">
        {typeof value === 'number' ? maybeArabicDigits(value, language) : value}
      </p>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  )
}
