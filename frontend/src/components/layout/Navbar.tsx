import {
  Building2,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  Shield,
  UserCircle2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useNavigate } from 'react-router'

import { useAuth } from '../../context/AuthContext'
import { NotificationBell } from '../../features/notifications/NotificationBell'
import { cn } from '../../utils/cn'
import { type User, UserRole } from '../../utils/types'
import { Button } from '../ui/Button'
import { LanguageToggle } from '../ui/LanguageToggle'

export function Navbar() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* ── Brand ────────────────────────────────────────────────────── */}
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-neutral-900"
        >
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-500 text-sm font-bold text-white shadow-sm">
            D
          </span>
          <span>{t('app.name')}</span>
        </Link>

        {/* ── Center nav (desktop) ─────────────────────────────────────── */}
        <ul className="hidden items-center gap-1 sm:flex">
          <li>
            <NavItem to="/browse">{t('nav.browse')}</NavItem>
          </li>
          {user && (
            <li>
              <NavItem to="/dashboard">{t('nav.dashboard')}</NavItem>
            </li>
          )}
          {user && (
            <li>
              <NavItem to="/messages">{t('nav.messages')}</NavItem>
            </li>
          )}
        </ul>

        {/* ── Right cluster (desktop) ──────────────────────────────────── */}
        <div className="hidden items-center gap-2 sm:flex">
          <LanguageToggle />
          {user && <NotificationBell />}
          {user ? (
            <UserMenu user={user} onLogout={logout} />
          ) : (
            <AuthLinks />
          )}
        </div>

        {/* ── Mobile menu button ───────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-2xl p-2 text-neutral-700 hover:bg-neutral-100 sm:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* ── Mobile menu drawer ─────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="border-t border-neutral-200 sm:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            <li>
              <NavItem to="/browse" onClick={() => setMobileOpen(false)} block>
                {t('nav.browse')}
              </NavItem>
            </li>
            {user && (
              <li>
                <NavItem to="/dashboard" onClick={() => setMobileOpen(false)} block>
                  {t('nav.dashboard')}
                </NavItem>
              </li>
            )}
            {user && (
              <li>
                <NavItem to="/messages" onClick={() => setMobileOpen(false)} block>
                  {t('nav.messages')}
                </NavItem>
              </li>
            )}
            <li className="pt-2"><LanguageToggle /></li>
            <li className="pt-2">
              {user ? (
                <Button variant="secondary" block leftIcon={<LogOut className="h-4 w-4" />} onClick={logout}>
                  {t('nav.logout')}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="secondary" block>{t('nav.login')}</Button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="primary" block>{t('nav.register')}</Button>
                  </Link>
                </div>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────

function NavItem({
  to,
  children,
  onClick,
  block,
}: {
  to: string
  children: React.ReactNode
  onClick?: () => void
  block?: boolean
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'rounded-2xl px-3 py-2 text-sm transition',
          block && 'block',
          isActive
            ? 'bg-neutral-100 font-semibold text-neutral-900'
            : 'text-neutral-700 hover:bg-neutral-50',
        )
      }
    >
      {children}
    </NavLink>
  )
}

function AuthLinks() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2">
      <Link to="/login">
        <Button variant="ghost" size="sm">{t('nav.login')}</Button>
      </Link>
      <Link to="/register">
        <Button variant="primary" size="sm">{t('nav.register')}</Button>
      </Link>
    </div>
  )
}

function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Use the first name only in the trigger — keeps the navbar compact.
  const firstName = user.fullName.split(' ')[0] || user.fullName

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <UserCircle2 className="h-5 w-5 text-neutral-500" />
        <span className="max-w-[120px] truncate">{firstName}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 mt-2 w-48 rounded-2xl border border-neutral-200 bg-white p-1 shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-neutral-700 hover:bg-neutral-100"
            onClick={() => {
              setOpen(false)
              navigate('/dashboard')
            }}
          >
            <UserCircle2 className="h-4 w-4 text-neutral-500" />
            {t('nav.myAccount')}
          </button>
          {user.role === UserRole.Student && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-neutral-700 hover:bg-neutral-100"
              onClick={() => {
                setOpen(false)
                navigate('/applications/mine')
              }}
            >
              <FileText className="h-4 w-4 text-neutral-500" />
              {t('nav.myApplications')}
            </button>
          )}
          {user.role === UserRole.Owner && (
            <>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-neutral-700 hover:bg-neutral-100"
                onClick={() => {
                  setOpen(false)
                  navigate('/owner/listings')
                }}
              >
                <Building2 className="h-4 w-4 text-neutral-500" />
                {t('nav.myListings')}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-neutral-700 hover:bg-neutral-100"
                onClick={() => {
                  setOpen(false)
                  navigate('/owner/applications')
                }}
              >
                <FileText className="h-4 w-4 text-neutral-500" />
                {t('nav.ownerApplications')}
              </button>
            </>
          )}
          {user.role === UserRole.Admin && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-neutral-700 hover:bg-neutral-100"
              onClick={() => {
                setOpen(false)
                navigate('/admin')
              }}
            >
              <Shield className="h-4 w-4 text-neutral-500" />
              {t('nav.adminPanel')}
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-neutral-700 hover:bg-neutral-100"
            onClick={() => {
              setOpen(false)
              navigate('/payments')
            }}
          >
            <CreditCard className="h-4 w-4 text-neutral-500" />
            {t('nav.payments')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-red-600 hover:bg-red-50"
            onClick={() => {
              setOpen(false)
              onLogout()
              navigate('/')
            }}
          >
            <LogOut className="h-4 w-4" />
            {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  )
}
