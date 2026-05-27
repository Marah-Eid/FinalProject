import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { z } from 'zod'

import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { FormField } from '../components/ui/FormField'
import { Input } from '../components/ui/Input'
import { extractApiError } from '../lib/http'
import { authApi } from '../services/api/auth'

const schema = z.object({
  newPassword: z
    .string()
    .min(8, { message: 'errors.field.passwordTooShort' })
    .max(128)
    .regex(/[A-Za-z]/, { message: 'errors.field.passwordNeedsLetter' })
    .regex(/\d/, { message: 'errors.field.passwordNeedsDigit' }),
})
type FormValues = z.infer<typeof schema>

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await authApi.resetPassword({ token, newPassword: values.newPassword })
      setDone(true)
    } catch (e) {
      const { message } = extractApiError(e)
      setServerError(message.startsWith('errors.') ? t(message) : message)
    }
  })

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <Card>
        <h1 className="mb-1 text-2xl font-bold text-neutral-900">{t('auth.resetTitle')}</h1>
        <p className="mb-6 text-sm text-neutral-600">{t('auth.resetSubtitle')}</p>

        {!token ? (
          <Alert tone="error">{t('auth.verifyEmailMissingToken')}</Alert>
        ) : done ? (
          <Alert tone="success" title={t('auth.resetSuccessTitle')}>
            {t('auth.resetSuccessText')}
            <div className="mt-3">
              <Link to="/login" className="font-medium text-brand-700 hover:underline">
                {t('auth.logInHere')} →
              </Link>
            </div>
          </Alert>
        ) : (
          <>
            {serverError && (
              <Alert tone="error" className="mb-4">
                {serverError}
              </Alert>
            )}
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <FormField
                htmlFor="newPassword"
                label={t('fields.newPassword')}
                error={errors.newPassword && t(errors.newPassword.message ?? 'errors.field.required')}
              >
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  autoFocus
                  invalid={!!errors.newPassword}
                  {...register('newPassword')}
                />
              </FormField>
              <Button type="submit" variant="primary" block loading={isSubmitting}>
                {t('auth.resetSubmit')}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
