import { Building2, Flag, LayoutDashboard, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router'

import { cn } from '../../utils/cn'

export function AdminLayout() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{t('admin.title')}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t('admin.subtitle')}</p>
      </header>

      <nav
        aria-label="Admin sections"
        className="mb-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-1"
      >
        <ul className="flex min-w-max gap-1">
          <Tab to="/admin" end icon={<LayoutDashboard className="h-4 w-4" />} label={t('admin.tabs.dashboard')} />
          <Tab to="/admin/users" icon={<Users className="h-4 w-4" />} label={t('admin.tabs.users')} />
          <Tab to="/admin/listings" icon={<Building2 className="h-4 w-4" />} label={t('admin.tabs.listings')} />
          <Tab to="/admin/reports" icon={<Flag className="h-4 w-4" />} label={t('admin.tabs.reports')} />
        </ul>
      </nav>

      <Outlet />
    </div>
  )
}

function Tab({
  to, end, icon, label,
}: {
  to: string
  end?: boolean
  icon: React.ReactNode
  label: string
}) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          cn(
            'inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-medium transition',
            isActive ? 'bg-brand-500 text-white' : 'text-neutral-600 hover:bg-neutral-100',
          )
        }
      >
        {icon} {label}
      </NavLink>
    </li>
  )
}
