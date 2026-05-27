import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  FileText,
  MessageSquare,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../hooks/useLanguage'
import { applicationsApi } from '../services/api/applications'
import { messagesApi } from '../services/api/messages'
import { quizApi } from '../services/api/quiz'
import { maybeArabicDigits } from '../utils/arabicNumerals'
import { cn } from '../utils/cn'
import {
  ApplicationStatus,
  type ApplicationDto,
} from '../utils/types'

export function StudentDashboardPage() {
  const { t } = useTranslation()
  const { language, isRtl } = useLanguage()
  const { user } = useAuth()
  if (!user) return null

  const quizQuery = useQuery({ queryKey: ['quiz', 'mine'], queryFn: () => quizApi.myAnswers() })
  const appsQuery = useQuery({ queryKey: ['applications', 'mine'], queryFn: () => applicationsApi.mine() })
  const convosQuery = useQuery({ queryKey: ['conversations'], queryFn: () => messagesApi.conversations() })

  const apps = appsQuery.data ?? []
  const pendingCount = apps.filter((a) => a.status === ApplicationStatus.Pending).length
  const acceptedCount = apps.filter((a) => a.status === ApplicationStatus.Accepted).length
  const rejectedCount = apps.filter((a) => a.status === ApplicationStatus.Rejected).length
  const unreadMessages = (convosQuery.data ?? []).reduce((sum, c) => sum + c.unreadCount, 0)

  const firstName = user.fullName.split(' ')[0] || user.fullName
  const ArrowFwd = isRtl ? ArrowLeft : ArrowRight
  const quizComplete = quizQuery.data?.quizCompleted ?? false

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{t('dashboard.title')}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {t('dashboard.welcome', { name: firstName })}
        </p>
      </header>

      {!user.isEmailVerified && (
        <Alert tone="warning" className="mb-6" title={t('badges.emailUnverified')}>
          {t('dashboard.emailUnverifiedHint')}
        </Alert>
      )}

      {/* ── Top stats cards ──────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Sparkles className="h-5 w-5" />}
          label={t('dashboard.cards.quiz.label')}
          value={quizComplete ? t('dashboard.cards.quiz.done') : t('dashboard.cards.quiz.pending')}
          tone={quizComplete ? 'emerald' : 'amber'}
        />
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label={t('dashboard.cards.appsPending')}
          value={maybeArabicDigits(pendingCount, language)}
          tone="brand"
        />
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label={t('dashboard.cards.appsAccepted')}
          value={maybeArabicDigits(acceptedCount, language)}
          tone="emerald"
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          label={t('dashboard.cards.unreadMessages')}
          value={maybeArabicDigits(unreadMessages, language)}
          tone={unreadMessages > 0 ? 'brand' : 'neutral'}
        />
      </div>

      {/* ── Big quiz CTA when incomplete ────────────────────────────────── */}
      {!quizComplete && (
        <Card className="mb-6 border-brand-200 bg-gradient-to-br from-brand-50 to-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-base font-semibold text-neutral-900">
                {t('dashboard.quizCta.title')}
              </p>
              <p className="text-sm text-neutral-600">{t('dashboard.quizCta.text')}</p>
            </div>
            <Link to="/quiz">
              <Button variant="primary" rightIcon={<ArrowFwd className="h-4 w-4" />}>
                {t('dashboard.quizCta.button')}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Recent applications ────────────────────────────────────────── */}
        <Card padded={false}>
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-neutral-900">
              {t('dashboard.recentApps.title')}
            </h2>
            <Link to="/applications/mine" className="text-xs text-brand-600 hover:underline">
              {t('dashboard.viewAll')}
            </Link>
          </div>

          {appsQuery.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : apps.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-neutral-500">
              <p>{t('dashboard.recentApps.empty')}</p>
              <Link to="/browse">
                <Button variant="secondary" size="sm" className="mt-3">
                  {t('myApps.empty.cta')}
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {apps.slice(0, 5).map((a) => (
                <ApplicationRow key={a.id} app={a} language={language} />
              ))}
            </ul>
          )}
        </Card>

        {/* ── Right rail: badges + quick links ──────────────────────────── */}
        <aside className="space-y-4">
          <Card>
            <p className="mb-3 text-sm font-semibold text-neutral-900">
              {t('dashboard.badges.title')}
            </p>
            <div className="flex flex-wrap gap-2">
              {user.isUniversityVerified ? (
                <Badge tone="emerald" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
                  {t('badges.verifiedStudent')}
                </Badge>
              ) : null}
              <Badge tone={user.isEmailVerified ? 'blue' : 'neutral'}>
                {user.isEmailVerified ? t('badges.emailVerified') : t('badges.emailUnverified')}
              </Badge>
            </div>
            {rejectedCount > 0 && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-rose-600">
                <XCircle className="h-3.5 w-3.5" />
                {t('dashboard.rejectedHint', { count: maybeArabicDigits(rejectedCount, language) })}
              </p>
            )}
          </Card>

          <Card>
            <p className="mb-3 text-sm font-semibold text-neutral-900">
              {t('dashboard.shortcuts.title')}
            </p>
            <div className="space-y-1">
              <ShortcutLink to="/browse" icon={<Building2 className="h-4 w-4" />}>
                {t('nav.browse')}
              </ShortcutLink>
              <ShortcutLink to="/messages" icon={<MessageSquare className="h-4 w-4" />}>
                {t('dashboard.shortcuts.messages')}
              </ShortcutLink>
              <ShortcutLink to="/applications/mine" icon={<FileText className="h-4 w-4" />}>
                {t('nav.myApplications')}
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

function ApplicationRow({ app, language }: { app: ApplicationDto; language: string }) {
  const { t } = useTranslation()
  const tone =
    app.status === ApplicationStatus.Accepted ? 'bg-emerald-50 text-emerald-700'
    : app.status === ApplicationStatus.Rejected ? 'bg-rose-50 text-rose-700'
    : app.status === ApplicationStatus.Withdrawn ? 'bg-neutral-100 text-neutral-600'
    :                                              'bg-amber-50 text-amber-700'
  const statusKey =
    app.status === ApplicationStatus.Accepted ? 'Accepted'
    : app.status === ApplicationStatus.Rejected ? 'Rejected'
    : app.status === ApplicationStatus.Withdrawn ? 'Withdrawn'
    :                                              'Pending'
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">
        <Building2 className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <Link to={`/apartments/${app.apartmentId}`} className="line-clamp-1 text-sm font-medium text-neutral-900 hover:text-brand-600">
          {app.apartmentTitle}
        </Link>
        <p className="text-xs text-neutral-500">
          {t('dashboard.recentApps.matchSnapshot', {
            value: maybeArabicDigits(app.compatibilityScore, language),
          })}
        </p>
      </div>
      <span className={cn('inline-flex rounded-2xl px-2 py-0.5 text-[11px] font-medium', tone)}>
        {t(`myApps.status.${statusKey}`)}
      </span>
    </li>
  )
}

function Badge({
  tone, icon, children,
}: {
  tone: 'emerald' | 'blue' | 'neutral'
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  const toneClasses =
    tone === 'emerald' ? 'bg-emerald-50 text-emerald-700'
    : tone === 'blue'    ? 'bg-blue-50 text-blue-700'
    :                      'bg-neutral-100 text-neutral-700'
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-2xl px-2.5 py-1 text-xs font-medium', toneClasses)}>
      {icon} {children}
    </span>
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
      <ArrowRight className="h-3.5 w-3.5 text-neutral-400 rtl:rotate-180" />
    </Link>
  )
}
