import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, MessageSquare, Send } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'

import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../hooks/useLanguage'
import { ConversationListPanel } from '../features/messages/ConversationListPanel'
import { MessageBubble } from '../features/messages/MessageBubble'
import { messagesApi } from '../services/api/messages'
import { cn } from '../utils/cn'

const API_ORIGIN = (() => {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'
  if (base.startsWith('http')) return base.replace(/\/api\/?$/, '')
  return 'http://localhost:5080'
})()

const POLL_CONVERSATIONS_MS = 15_000
const POLL_MESSAGES_MS = 10_000

export function MessagesPage() {
  const { t } = useTranslation()
  const { isRtl } = useLanguage()
  const { user } = useAuth()
  const params = useParams<{ conversationId?: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const activeId = params.conversationId
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // ── Conversations list (polled) ────────────────────────────────────────
  const convosQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.conversations(),
    refetchInterval: POLL_CONVERSATIONS_MS,
    placeholderData: (prev) => prev,
  })

  // ── Active conversation messages (polled when active) ──────────────────
  const messagesQuery = useQuery({
    queryKey: ['messages', activeId],
    queryFn: () => messagesApi.messages(activeId!, { take: 100 }),
    enabled: !!activeId,
    refetchInterval: activeId ? POLL_MESSAGES_MS : false,
    placeholderData: (prev) => prev,
  })

  // Mark-read mutation — fired when the active conversation has unread messages.
  const markRead = useMutation({
    mutationFn: (id: string) => messagesApi.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['conversations'] })
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Send-message mutation — optimistic-ish: invalidate the two affected queries.
  const send = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      messagesApi.send(id, { content }),
    onSuccess: () => {
      setDraft('')
      void qc.invalidateQueries({ queryKey: ['messages', activeId] })
      void qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  // Find the active conversation by id (so we can render headers + know the other party).
  const activeConversation = useMemo(
    () => convosQuery.data?.find((c) => c.id === activeId),
    [convosQuery.data, activeId],
  )

  // Messages arrive newest-first from the API; reverse for chronological rendering.
  const messages = useMemo(
    () => (messagesQuery.data ?? []).slice().reverse(),
    [messagesQuery.data],
  )

  // Mark read when an active conversation has unread messages NOT sent by me.
  useEffect(() => {
    if (!activeId || !user) return
    const hasUnread = messages.some((m) => !m.isRead && m.senderId !== user.id)
    if (hasUnread) markRead.mutate(activeId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, messages.length])

  // Auto-scroll to newest message when the message list changes.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, activeId])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!activeId) return
    const content = draft.trim()
    if (!content) return
    send.mutate({ id: activeId, content })
  }

  const BackIcon = isRtl ? ArrowRight : ArrowLeft

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{t('messages.title')}</h1>
        <p className="text-sm text-neutral-600">{t('messages.subtitle')}</p>
      </header>

      <Card padded={false} className="overflow-hidden">
        <div
          className={cn(
            'grid min-h-[60vh] divide-x divide-neutral-100 sm:divide-x rtl:divide-x-reverse',
            'grid-cols-1 sm:grid-cols-[320px_1fr]',
          )}
        >
          {/* ── List ───────────────────────────────────────────────────── */}
          <aside
            className={cn(
              'min-h-0 border-neutral-100 sm:border-e',
              activeId ? 'hidden sm:block' : 'block',
            )}
          >
            <ConversationListPanel
              conversations={convosQuery.data}
              isLoading={convosQuery.isLoading}
              apiOrigin={API_ORIGIN}
            />
          </aside>

          {/* ── Conversation ────────────────────────────────────────────── */}
          <section
            className={cn(
              'flex min-h-0 flex-col',
              activeId ? 'block' : 'hidden sm:flex',
            )}
          >
            {!activeId ? (
              <EmptyPanel />
            ) : !activeConversation && convosQuery.isLoading ? (
              <div className="flex-1 p-6">
                <Skeleton className="mb-3 h-12 w-1/2" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : !activeConversation ? (
              <div className="flex flex-1 items-center justify-center p-6 text-sm text-neutral-500">
                {t('messages.notFound')}
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => navigate('/messages')}
                    className="grid h-8 w-8 place-items-center rounded-2xl text-neutral-500 hover:bg-neutral-100 sm:hidden"
                    aria-label={t('common.back')}
                  >
                    <BackIcon className="h-4 w-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {activeConversation.otherUserName}
                    </p>
                    <Link
                      to={`/apartments/${activeConversation.apartmentId}`}
                      className="truncate text-xs text-neutral-500 hover:text-brand-600"
                    >
                      {activeConversation.apartmentTitle}
                    </Link>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto bg-neutral-50/60 px-4 py-3"
                  // Cap height so the page itself doesn't scroll — the message pane does.
                  style={{ maxHeight: 'calc(100vh - 280px)' }}
                >
                  {messagesQuery.isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-2/3" />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-500">
                      {t('messages.startConversation')}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {messages.map((m) => (
                        <MessageBubble
                          key={m.id}
                          message={m}
                          isMine={m.senderId === user?.id}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Input bar */}
                <form
                  onSubmit={onSubmit}
                  className="flex items-center gap-2 border-t border-neutral-100 bg-white p-3"
                >
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={t('messages.placeholder')}
                    className="flex-1 rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    maxLength={4000}
                    aria-label={t('messages.placeholder')}
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || send.isPending}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-50"
                    aria-label={t('messages.send')}
                  >
                    <Send className="h-4 w-4 rtl:-scale-x-100" />
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </Card>
    </div>
  )
}

function EmptyPanel() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-neutral-500">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-500">
        <MessageSquare className="h-5 w-5" />
      </div>
      <p className="font-medium text-neutral-700">{t('messages.pickOne')}</p>
      <p className="text-xs">{t('messages.pickOneHint')}</p>
    </div>
  )
}
