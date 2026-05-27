import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'

import { Alert } from '../components/ui/Alert'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { extractApiError } from '../lib/http'
import { authApi } from '../services/api/auth'

type Status = 'pending' | 'success' | 'missing' | 'failed'

export function VerifyEmailPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const { user, refreshUser } = useAuth()
  const [status, setStatus] = useState<Status>(token ? 'pending' : 'missing')
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    void (async () => {
      try {
        await authApi.verifyEmail(token)
        if (cancelled) return
        // Refresh /me so the UI shows the verified badge if a user is logged in.
        if (user) await refreshUser().catch(() => {})
        if (!cancelled) setStatus('success')
      } catch (e) {
        if (cancelled) return
        const { message } = extractApiError(e)
        setServerError(message.startsWith('errors.') ? t(message) : message)
        setStatus('failed')
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <Card>
        {status === 'pending' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <Spinner size="lg" className="text-brand-500" />
            <p className="text-sm text-neutral-600">{t('auth.verifyEmailVerifying')}</p>
          </div>
        )}

        {status === 'success' && (
          <Alert tone="success" title={t('auth.verifyEmailSuccess')}>
            <div className="mt-2">
              <Link to={user ? '/dashboard' : '/login'} className="font-medium text-brand-700 hover:underline">
                {user ? t('nav.dashboard') : t('auth.logInHere')} →
              </Link>
            </div>
          </Alert>
        )}

        {status === 'missing' && (
          <Alert tone="error" title={t('auth.verifyEmailMissingToken')} />
        )}

        {status === 'failed' && (
          <Alert tone="error" title={t('auth.verifyEmailFailure')}>
            {serverError && <p className="mt-1 text-xs">{serverError}</p>}
          </Alert>
        )}
      </Card>
    </div>
  )
}
