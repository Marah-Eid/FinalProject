import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Flag } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { extractApiError } from '../../lib/http'
import { reportsApi } from '../../services/api/reports'
import { cn } from '../../utils/cn'
import { ReportReason, ReportReasonCodes } from '../../utils/types'

type Props = {
  isOpen: boolean
  onClose: () => void
  apartmentId: string
  apartmentTitle: string
}

export function ReportListingModal({ isOpen, onClose, apartmentId, apartmentTitle }: Props) {
  const { t } = useTranslation()
  const [reason, setReason] = useState<ReportReason>(ReportReason.FakeListing)
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const submit = useMutation({
    mutationFn: () => reportsApi.submit({
      apartmentId,
      reason,
      description: description.trim() || null,
    }),
    onSuccess: () => setSubmitted(true),
    onError: (e) => {
      const err = extractApiError(e)
      setServerError(err.message.startsWith('errors.') ? t(err.message) : err.message)
    },
  })

  const handleClose = () => {
    setReason(ReportReason.FakeListing)
    setDescription('')
    setSubmitted(false)
    setServerError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={submitted ? t('report.thanksTitle') : t('report.modalTitle')} size="md">
      {submitted ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="text-sm text-neutral-700">{t('report.thanksText')}</p>
          <Button variant="primary" onClick={handleClose}>{t('common.cancel')}</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">{t('report.intro', { title: apartmentTitle })}</p>

          {serverError && <Alert tone="error">{serverError}</Alert>}

          <FormField htmlFor="report-reason" label={t('report.reasonLabel')}>
            <Select
              id="report-reason"
              value={String(reason)}
              onChange={(e) => setReason(Number(e.target.value) as ReportReason)}
            >
              <option value={ReportReason.FakeListing}>{t(`report.reasons.${ReportReasonCodes[ReportReason.FakeListing]}`)}</option>
              <option value={ReportReason.MisleadingPhotos}>{t(`report.reasons.${ReportReasonCodes[ReportReason.MisleadingPhotos]}`)}</option>
              <option value={ReportReason.Scam}>{t(`report.reasons.${ReportReasonCodes[ReportReason.Scam]}`)}</option>
              <option value={ReportReason.Inappropriate}>{t(`report.reasons.${ReportReasonCodes[ReportReason.Inappropriate]}`)}</option>
              <option value={ReportReason.Other}>{t(`report.reasons.${ReportReasonCodes[ReportReason.Other]}`)}</option>
            </Select>
          </FormField>

          <FormField htmlFor="report-desc" label={t('report.descLabel')} hint={t('report.descHint')}>
            <textarea
              id="report-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              className={cn(
                'w-full resize-y rounded-2xl border border-neutral-300 bg-white px-4 py-2.5 text-sm',
                'placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100',
              )}
            />
          </FormField>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={handleClose}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              loading={submit.isPending}
              onClick={() => submit.mutate()}
              leftIcon={<Flag className="h-4 w-4" />}
            >
              {t('report.submit')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
