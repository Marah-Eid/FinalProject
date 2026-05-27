import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'

import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { FormField } from '../components/ui/FormField'
import { Input } from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'
import { extractApiError } from '../lib/http'

// Zod schema. Error strings here are translation keys; the UI looks them up.
const schema = z.object({
  email: z.email({ message: 'errors.field.email' }),
  password: z.string().min(1, { message: 'errors.field.required' }),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)

  // Where to bounce the user after a successful login (set by ProtectedRoute).
  const fromState = location.state as { from?: { pathname?: string } } | null
  const redirectTo = fromState?.from?.pathname ?? '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await login(values)
      navigate(redirectTo, { replace: true })
    } catch (e) {
      const { message } = extractApiError(e)
      setServerError(message.startsWith('errors.') ? t(message) : message)
    }
  })

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <Card>
        <h1 className="mb-1 text-2xl font-bold text-neutral-900">{t('auth.loginTitle')}</h1>
        <p className="mb-6 text-sm text-neutral-600">{t('auth.loginSubtitle')}</p>

        {serverError && (
          <Alert tone="error" className="mb-4">
            {serverError}
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField
            htmlFor="email"
            label={t('fields.email')}
            error={errors.email && t(errors.email.message ?? 'errors.field.required')}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              invalid={!!errors.email}
              {...register('email')}
            />
          </FormField>

          <FormField
            htmlFor="password"
            label={t('fields.password')}
            error={errors.password && t(errors.password.message ?? 'errors.field.required')}
          >
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              invalid={!!errors.password}
              {...register('password')}
            />
          </FormField>

          <div className="text-end">
            <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>

          <Button type="submit" variant="primary" block loading={isSubmitting}>
            {t('auth.loginSubmit')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:underline">
            {t('auth.signUpHere')}
          </Link>
        </p>
      </Card>
    </div>
  )
}
