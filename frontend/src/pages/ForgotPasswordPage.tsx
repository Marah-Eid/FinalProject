import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { z } from 'zod'

import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { FormField } from '../components/ui/FormField'
import { Input } from '../components/ui/Input'
import { extractApiError } from '../lib/http'
import { authApi } from '../services/api/auth'

const schema = z.object({
  email: z.email({ message: 'errors.field.email' }),
})
type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await authApi.forgotPassword({ email: values.email })
      // We intentionally show success regardless — backend already mirrors this
      // behaviour to avoid leaking which addresses are registered.
      setSent(true)
    } catch (e) {
      const { message } = extractApiError(e)
      setServerError(message.startsWith('errors.') ? t(message) : message)
    }
  })

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <Card>
        <h1 className="mb-1 text-2xl font-bold text-neutral-900">{t('auth.forgotTitle')}</h1>
        <p className="mb-6 text-sm text-neutral-600">{t('auth.forgotSubtitle')}</p>

        {sent ? (
          <Alert tone="success">{t('auth.forgotSent')}</Alert>
        ) : (
          <>
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
              <Button type="submit" variant="primary" block loading={isSubmitting}>
                {t('auth.forgotSubmit')}
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-neutral-600">
          {t('auth.rememberPassword')}{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            {t('auth.logInHere')}
          </Link>
        </p>
      </Card>
    </div>
  )
}
