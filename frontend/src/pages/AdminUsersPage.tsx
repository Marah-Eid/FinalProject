import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, Ban, Check, Search, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

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
import { cn } from '../utils/cn'
import { formatDate } from '../utils/formatDate'
import { UserRole, type AdminUserDto } from '../utils/types'

export function AdminUsersPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')

  const query = useQuery({
    queryKey: ['admin', 'users', search, role],
    queryFn: () => adminApi.users({
      search: search.trim() || undefined,
      role: role === '' ? undefined : (role as UserRole),
      take: 100,
    }),
    placeholderData: (prev) => prev,
  })

  const ban = useMutation({
    mutationFn: (id: string) => adminApi.banUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
  const unban = useMutation({
    mutationFn: (id: string) => adminApi.unbanUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  return (
    <div className="space-y-4">
      <Card padded>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder={t('admin.users.searchPlaceholder')}
              className="ps-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={String(role)}
            onChange={(e) => setRole(e.target.value === '' ? '' : (Number(e.target.value) as UserRole))}
          >
            <option value="">{t('admin.users.allRoles')}</option>
            <option value={UserRole.Student}>{t('roles.student')}</option>
            <option value={UserRole.Owner}>{t('roles.owner')}</option>
            <option value={UserRole.Admin}>{t('roles.admin')}</option>
          </Select>
        </div>
      </Card>

      {ban.isError && <Alert tone="error">{extractApiError(ban.error).message}</Alert>}

      {query.isLoading ? (
        <Card padded={false}>
          <div className="space-y-1 p-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        </Card>
      ) : (query.data?.length ?? 0) === 0 ? (
        <Card>
          <EmptyState
            icon={<Search className="h-7 w-7" />}
            title={t('admin.users.empty.title')}
            description={t('admin.users.empty.description')}
          />
        </Card>
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-neutral-100">
            {query.data!.map((u) => (
              <Row
                key={u.id}
                user={u}
                language={language}
                onBan={() => ban.mutate(u.id)}
                onUnban={() => unban.mutate(u.id)}
                pending={
                  (ban.isPending && ban.variables === u.id) ||
                  (unban.isPending && unban.variables === u.id)
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
  user, language, onBan, onUnban, pending,
}: {
  user: AdminUserDto
  language: string
  onBan: () => void
  onUnban: () => void
  pending: boolean
}) {
  const { t } = useTranslation()
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className={cn(
        'grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white font-semibold',
        user.role === UserRole.Admin ? 'bg-purple-500'
          : user.role === UserRole.Owner ? 'bg-amber-500'
            : 'bg-brand-500',
      )}>
        {user.fullName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-medium text-neutral-900">
          {user.fullName}
          {user.isBanned && (
            <span className="inline-flex items-center gap-1 rounded-2xl bg-rose-50 px-1.5 text-[10px] font-semibold text-rose-700">
              <Ban className="h-3 w-3" />
              {t('admin.users.banned')}
            </span>
          )}
          {user.isUniversityVerified && (
            <BadgeCheck className="h-3.5 w-3.5 text-brand-500" />
          )}
        </p>
        <p className="truncate text-xs text-neutral-500" dir="ltr">{user.email}</p>
        <p className="text-[11px] text-neutral-400">
          {user.role === UserRole.Student ? t('roles.student')
            : user.role === UserRole.Owner ? t('roles.owner')
              : 'Admin'}
          <span className="mx-1 text-neutral-300">·</span>
          {t('admin.users.joined', { date: formatDate(user.createdAt, language) })}
        </p>
      </div>
      <div className="shrink-0">
        {user.role === UserRole.Admin ? (
          <ShieldCheck className="h-4 w-4 text-neutral-300" />
        ) : user.isBanned ? (
          <Button variant="ghost" size="sm" loading={pending}
            leftIcon={<Check className="h-4 w-4" />} onClick={onUnban}>
            {t('admin.users.unban')}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" loading={pending}
            leftIcon={<Ban className="h-4 w-4" />} onClick={onBan}
            className="text-rose-600 hover:bg-rose-50">
            {t('admin.users.ban')}
          </Button>
        )}
      </div>
    </li>
  )
}
