import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { z } from 'zod'

import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { CompatibilityCircle } from '../../components/ui/CompatibilityCircle'
import { FormField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { useLanguage } from '../../hooks/useLanguage'
import { extractApiError } from '../../lib/http'
import { applicationsApi } from '../../services/api/applications'
import { maybeArabicDigits } from '../../utils/arabicNumerals'
import { cn } from '../../utils/cn'

const MAX_LEN = 500

const schema = z.object({
  message: z.string().min(20, { message: 'apply.tooShort' }).max(MAX_LEN, { message: 'apply.tooLong' }),
})
type FormValues = z.infer<typeof schema>

type Props = {
  isOpen: boolean
  onClose: () => void
  apartmentId: string
  apartmentTitle: string
  compatibilityScore: number | null
}

export function ApplyModal({
  isOpen, onClose, apartmentId, apartmentTitle, compatibilityScore,
}: Props) {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { message: '' },
  })

  const message = watch('message') ?? ''

  const handleClose = () => {
    setServerError(null)
    setSubmitted(false)
    reset({ message: '' })
    onClose()
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await applicationsApi.apply(apartmentId, { message: values.message.trim() })
      setSubmitted(true)
    } catch (e) {
      const err = extractApiError(e)
      // Until Phase 7 lands, /api/apartments/:id/apply 404s — surface a friendly
      // "coming next phase" message instead of the raw 404.
      const friendly = err.code === 'not_found' || err.message?.includes('404')
        ? t('apply.comingSoon')
        : err.message.startsWith('errors.') ? t(err.message) : err.message
      setServerError(friendly)
    }
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={submitted ? t('apply.submittedTitle') : t('apply.modalTitle')}
      size="md"
    >
      {submitted ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="text-sm text-neutral-700">{t('apply.submittedText', { title: apartmentTitle })}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to="/applications/mine" onClick={handleClose}>
              <Button variant="primary">{t('apply.viewMyApplications')}</Button>
            </Link>
            <Button variant="secondary" onClick={handleClose}>{t('common.cancel')}</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <p className="text-sm text-neutral-600">
            {t('apply.intro', { title: apartmentTitle })}
          </p>

          {compatibilityScore !== null && (
            <div className="flex items-center gap-4 rounded-2xl bg-brand-50 p-4">
              <CompatibilityCircle score={compatibilityScore} size="sm" />
              <div className="text-sm text-neutral-700">
                <p className="font-medium text-neutral-900">{t('apply.scoreCalloutTitle')}</p>
                <p className="text-xs text-neutral-600">{t('apply.scoreCalloutHint')}</p>
              </div>
            </div>
          )}

          {serverError && (
            <Alert tone="warning">{serverError}</Alert>
          )}

          <FormField
            htmlFor="apply-message"
            label={t('apply.messageLabel')}
            hint={t('apply.messageHint')}
            error={errors.message && t(errors.message.message ?? 'errors.field.required')}
          >
            <textarea
              id="apply-message"
              {...register('message')}
              rows={5}
              maxLength={MAX_LEN}
              placeholder={t('apply.placeholder')}
              className={cn(
                'w-full resize-y rounded-2xl border bg-white px-4 py-2.5 text-sm text-neutral-900',
                'placeholder:text-neutral-400 transition',
                'focus:outline-none focus:ring-2',
                errors.message
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                  : 'border-neutral-300 focus:border-brand-500 focus:ring-brand-100',
              )}
            />
            <div className="mt-1 flex justify-end text-xs text-neutral-400">
              {maybeArabicDigits(message.length, language)} / {maybeArabicDigits(MAX_LEN, language)}
            </div>
          </FormField>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              leftIcon={<MessageSquare className="h-4 w-4" />}
            >
              {t('apply.submit')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
