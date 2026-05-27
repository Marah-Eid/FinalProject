import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'

import { Skeleton } from '../../components/ui/Skeleton'
import { useLanguage } from '../../hooks/useLanguage'
import { maybeArabicDigits } from '../../utils/arabicNumerals'
import { cn } from '../../utils/cn'
import { formatDate } from '../../utils/formatDate'
import type { ConversationDto } from '../../utils/types'

type Props = {
  conversations: ConversationDto[] | undefined
  isLoading: boolean
  apiOrigin: string
}

export function ConversationListPanel({ conversations, isLoading, apiOrigin }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguage()

  if (isLoading) {
    return (
      <ul className="space-y-2 p-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i}><Skeleton className="h-16 w-full" /></li>
        ))}
      </ul>
    )
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-neutral-500">
        <Building2 className="h-7 w-7 text-neutral-300" />
        <p className="font-medium text-neutral-700">{t('messages.empty.title')}</p>
        <p className="text-xs">{t('messages.empty.description')}</p>
      </div>
    )
  }

  return (
    <ul className="overflow-y-auto">
      {conversations.map((c) => (
        <li key={c.id}>
          <NavLink
            to={`/messages/${c.id}`}
            className={({ isActive }) =>
              cn(
                'flex items-start gap-3 border-b border-neutral-100 px-3 py-3 transition',
                isActive ? 'bg-brand-50' : 'hover:bg-neutral-50',
              )
            }
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-neutral-100">
              {c.apartmentMainPhotoUrl ? (
                <img
                  src={new URL(c.apartmentMainPhotoUrl, apiOrigin).toString()}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-5 w-5 text-neutral-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={cn(
                  'truncate text-sm',
                  c.unreadCount > 0 ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-800',
                )}>
                  {c.otherUserName}
                </p>
                <span className="shrink-0 text-[11px] text-neutral-400">
                  {formatDate(c.lastMessageAt, language)}
                </span>
              </div>
              <p className="truncate text-xs text-neutral-500">{c.apartmentTitle}</p>
              <p className={cn(
                'mt-0.5 truncate text-xs',
                c.unreadCount > 0 ? 'font-medium text-neutral-800' : 'text-neutral-500',
              )}>
                {c.lastMessageContent ?? t('messages.noMessagesYet')}
              </p>
            </div>
            {c.unreadCount > 0 && (
              <span className="ms-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-2xl bg-brand-500 px-1.5 text-[11px] font-semibold text-white">
                {maybeArabicDigits(c.unreadCount, language)}
              </span>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}
