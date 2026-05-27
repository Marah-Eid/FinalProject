import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Ban,
  Bell,
  BellOff,
  CheckCircle2,
  MailOpen,
  MessageSquare,
  Star,
  UserPlus,
  XCircle,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { useLanguage } from '../../hooks/useLanguage'
import { notificationsApi } from '../../services/api/notifications'
import { maybeArabicDigits } from '../../utils/arabicNumerals'
import { cn } from '../../utils/cn'
import { formatDate } from '../../utils/formatDate'
import {
  NotificationType,
  type NotificationDto,
} from '../../utils/types'

const POLL_MS = 30_000

const TYPE_ICON: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  [NotificationType.NewApplicationReceived]: UserPlus,
  [NotificationType.ApplicationAccepted]: CheckCircle2,
  [NotificationType.ApplicationRejected]: XCircle,
  [NotificationType.NewMessage]: MessageSquare,
  [NotificationType.NewRating]: Star,
  [NotificationType.ListingSuspended]: Ban,
}

const TYPE_TONE: Record<NotificationType, string> = {
  [NotificationType.NewApplicationReceived]: 'text-brand-600',
  [NotificationType.ApplicationAccepted]: 'text-emerald-600',
  [NotificationType.ApplicationRejected]: 'text-rose-600',
  [NotificationType.NewMessage]: 'text-blue-600',
  [NotificationType.NewRating]: 'text-amber-600',
  [NotificationType.ListingSuspended]: 'text-rose-600',
}

/**
 * Navbar bell. Polls /api/notifications every 30s while open *or* idle —
 * we keep the same query active so the unread badge stays current.
 */
export function NotificationBell() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  const query = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsApi.list(15),
    refetchInterval: POLL_MS,
    // Keep results across refetches so the dropdown doesn't flash a spinner each cycle.
    placeholderData: (prev) => prev,
    // Notifications endpoint requires auth; if the user logs out, errors
    // are 401 — we just stop polling silently. retry:false avoids storms.
    retry: false,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  // Close on outside click + Esc.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const unread = query.data?.unread ?? 0
  const items = query.data?.items ?? []

  const handleClick = (n: NotificationDto) => {
    setOpen(false)
    if (!n.isRead) markRead.mutate(n.id)
    // Deep-link to a sensible page based on type.
    if (n.type === NotificationType.NewMessage && n.relatedEntityId) {
      navigate(`/messages/${n.relatedEntityId}`)
    } else if (n.type === NotificationType.ApplicationAccepted || n.type === NotificationType.ApplicationRejected) {
      navigate('/applications/mine')
    } else if (n.type === NotificationType.NewApplicationReceived) {
      navigate('/owner/applications')
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('notifications.label')}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-50"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span
            className="absolute -end-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-2xl bg-brand-500 px-1 text-[10px] font-semibold text-white"
            aria-label={t('notifications.unreadCount', { count: unread })}
          >
            {maybeArabicDigits(Math.min(unread, 99), language)}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 mt-2 w-[340px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-neutral-900">{t('notifications.title')}</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
              >
                <MailOpen className="h-3.5 w-3.5" />
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-8 text-center text-sm text-neutral-500">
              <BellOff className="h-6 w-6 text-neutral-300" />
              <p>{t('notifications.empty')}</p>
            </div>
          ) : (
            <ul className="max-h-[420px] divide-y divide-neutral-100 overflow-y-auto">
              {items.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Bell
                const tone = TYPE_TONE[n.type] ?? 'text-neutral-500'
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(n)}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-start transition hover:bg-neutral-50',
                        !n.isRead && 'bg-brand-50/30',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-neutral-100',
                          tone,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-sm',
                            n.isRead ? 'font-medium text-neutral-700' : 'font-semibold text-neutral-900',
                          )}
                        >
                          {n.title}
                        </p>
                        <p className="line-clamp-2 text-xs text-neutral-600">{n.content}</p>
                        <p className="mt-1 text-[11px] text-neutral-400">{formatDate(n.createdAt, language)}</p>
                      </div>
                      {!n.isRead && (
                        <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
