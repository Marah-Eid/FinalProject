import { useQuery } from '@tanstack/react-query'
import {
  BadgeCheck,
  Building2,
  Check,
  ChevronRight,
  FileText,
  Inbox,
  MessageSquare,
  Sparkles,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../hooks/useLanguage'
import { applicationsApi } from '../services/api/applications'
import { messagesApi } from '../services/api/messages'
import { maybeArabicDigits } from '../utils/arabicNumerals'
import { cn } from '../utils/cn'
import { formatDate } from '../utils/formatDate'
import {
  ApplicationStatus,
  type ApplicationReceivedDto,
} from '../utils/types'

export function OwnerDashboardPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { user } = useAuth()
  if (!user) return null

  const receivedQuery = useQuery({
    queryKey: ['applications', 'received'],
    queryFn: () => applicationsApi.received(),
  })
  const convosQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.conversations(),
  })

  const received = receivedQuery.data ?? []
  const pending = received.filter((a) => a.status === ApplicationStatus.Pending).length
  const accepted = received.filter((a) => a.status === ApplicationStatus.Accepted).length
  const rejected = received.filter((a) => a.status === ApplicationStatus.Rejected).length
  const unreadMessages = (convosQuery.data ?? []).reduce((sum, c) => sum + c.unreadCount, 0)
  const distinctApartments = new Set(received.map((a) => a.apartmentId)).size

  const firstName = user.fullName.split(' ')[0] || user.fullName

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
          {t('dashboard.ownerTitle')}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          {t('dashboard.welcome', { name: firstName })}
        </p>
      </header>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Inbox className="h-5 w-5" />}
          label={t('dashboard.ownerCards.pendingApps')}
          value={maybeArabicDigits(pending, language)}
          tone={pending > 0 ? 'amber' : 'neutral'}
        />
        <StatCard
          icon={<Sparkles className="h-5 w-5" />}
          label={t('dashboard.ownerCards.acceptedApps')}
          value={maybeArabicDigits(accepted, language)}
          tone="emerald"
        />
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label={t('dashboard.ownerCards.activeListings')}
          value={maybeArabicDigits(distinctApartments, language)}
          tone="brand"
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          label={t('dashboard.cards.unreadMessages')}
          value={maybeArabicDigits(unreadMessages, language)}
          tone={unreadMessages > 0 ? 'brand' : 'neutral'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Pending applications preview ─────────────────────────────── */}
        <Card padded={false}>
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-neutral-900">
              {t('dashboard.ownerCards.pendingTitle')}
            </h2>
            <Link to="/owner/applications" className="text-xs text-brand-600 hover:underline">
              {t('dashboard.viewAll')}
            </Link>
          </div>

          {receivedQuery.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : pending === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-neutral-500">
              <p>{t('dashboard.ownerCards.pendingEmpty')}</p>
              <p className="mt-1 text-xs">{t('dashboard.ownerCards.pendingEmptyHint')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {received
                .filter((a) => a.status === ApplicationStatus.Pending)
                .slice(0, 5)
                .map((a) => (
                  <ApplicationPreviewRow key={a.id} app={a} language={language} />
                ))}
            </ul>
          )}
        </Card>

        {/* ── Right rail ────────────────────────────────────────────────── */}
        <aside className="space-y-4">
          <Card>
            <p className="mb-3 text-sm font-semibold text-neutral-900">
              {t('dashboard.atAGlance')}
            </p>
            <ul className="space-y-2 text-sm">
              <Stat label={t('dashboard.ownerCards.rejectedApps')} value={maybeArabicDigits(rejected, language)} />
              <Stat label={t('dashboard.ownerCards.totalApps')} value={maybeArabicDigits(received.length, language)} />
            </ul>
          </Card>

          <Card>
            <p className="mb-3 text-sm font-semibold text-neutral-900">
              {t('dashboard.shortcuts.title')}
            </p>
            <div className="space-y-1">
              <ShortcutLink to="/owner/applications" icon={<FileText className="h-4 w-4" />}>
                {t('dashboard.shortcuts.applications')}
              </ShortcutLink>
              <ShortcutLink to="/messages" icon={<MessageSquare className="h-4 w-4" />}>
                {t('dashboard.shortcuts.messages')}
              </ShortcutLink>
              <ShortcutLink to="/browse" icon={<Building2 className="h-4 w-4" />}>
                {t('nav.browse')}
              </ShortcutLink>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, tone,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  tone: 'brand' | 'emerald' | 'amber' | 'neutral'
}) {
  const toneClasses =
    tone === 'brand'   ? 'bg-brand-50 text-brand-700'
    : tone === 'emerald' ? 'bg-emerald-50 text-emerald-700'
    : tone === 'amber'   ? 'bg-amber-50 text-amber-700'
    :                      'bg-neutral-100 text-neutral-600'
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className={cn('mb-2 inline-flex h-8 w-8 items-center justify-center rounded-2xl', toneClasses)}>
        {icon}
      </div>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-neutral-900">{value}</p>
    </div>
  )
}

function ApplicationPreviewRow({ app, language }: { app: ApplicationReceivedDto; language: string }) {
  const { t } = useTranslation()
  return (
    <li className="flex items-start gap-3 px-5 py-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">
        <Building2 className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-medium text-neutral-900">
          {app.studentFullName}
          {app.studentIsUniversityVerified && (
            <BadgeCheck className="h-3.5 w-3.5 text-brand-500" />
          )}
        </p>
        <p className="text-xs text-neutral-500">
          {app.apartmentTitle}
          <span className="mx-1 text-neutral-300">·</span>
          {t('dashboard.recentApps.matchSnapshot', {
            value: maybeArabicDigits(app.compatibilityScore, language),
          })}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">"{app.message}"</p>
      </div>
      <p className="shrink-0 text-[11px] text-neutral-400">
        {formatDate(app.createdAt, language)}
      </p>
    </li>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-neutral-600">{label}</span>
      <span className="font-semibold text-neutral-900">{value}</span>
    </li>
  )
}

function ShortcutLink({
  to, icon, children,
}: {
  to: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50"
    >
      <span className="inline-flex items-center gap-2">{icon} {children}</span>
      <ChevronRight className="h-3.5 w-3.5 text-neutral-400 rtl:rotate-180" />
    </Link>
  )
}

// Tiny helpers for inline accept/reject icons used by the full page; kept here
// so the consumer (OwnerApplicationsPage) doesn't import an unrelated file.
export const __OWNER_DASHBOARD_REFS__ = { Check, X }
