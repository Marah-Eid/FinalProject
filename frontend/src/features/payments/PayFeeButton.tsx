import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '../../components/ui/Button'
import { useLanguage } from '../../hooks/useLanguage'
import { extractApiError } from '../../lib/http'
import { paymentsApi } from '../../services/api/payments'
import { maybeArabicDigits } from '../../utils/arabicNumerals'
import { PaymentAmount, PaymentType } from '../../utils/types'

type Props = {
  /** The Application id this fee relates to (acceptance triggers the 15 JOD MatchCommission). */
  applicationId: string
}

/**
 * Inline "Pay the platform fee" CTA. Hits the mock payment service and shows
 * a short success state. No-op idempotent guard here — the mock always
 * succeeds in ~1s; users see the new payment in /payments immediately.
 */
export function PayFeeButton({ applicationId }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const qc = useQueryClient()
  const [paid, setPaid] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const charge = useMutation({
    mutationFn: () => paymentsApi.checkout({
      type: PaymentType.MatchCommission,
      relatedEntityId: applicationId,
    }),
    onSuccess: () => {
      setPaid(true)
      void qc.invalidateQueries({ queryKey: ['payments'] })
    },
    onError: (e) => setErr(extractApiError(e).message),
  })

  if (paid) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {t('payments.feePaid')}
      </span>
    )
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        variant="primary"
        size="sm"
        onClick={() => { setErr(null); charge.mutate() }}
        loading={charge.isPending}
        leftIcon={<CreditCard className="h-3.5 w-3.5" />}
      >
        {t('payments.payFee', {
          value: maybeArabicDigits(PaymentAmount[PaymentType.MatchCommission], language),
        })}
      </Button>
      {err && <span className="text-[11px] text-rose-600">{err}</span>}
    </div>
  )
}
