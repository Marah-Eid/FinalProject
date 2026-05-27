import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Star } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { extractApiError } from '../../lib/http'
import { ratingsApi } from '../../services/api/ratings'
import { cn } from '../../utils/cn'

type Props = {
  isOpen: boolean
  onClose: () => void
  ratedUserId: string
  ratedUserName: string
  apartmentId: string
  apartmentTitle: string
}

export function RatingModal({
  isOpen, onClose, ratedUserId, ratedUserName, apartmentId, apartmentTitle,
}: Props) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [stars, setStars] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = useMutation({
    mutationFn: () => ratingsApi.submit({
      ratedUserId,
      apartmentId,
      stars,
      comment: comment.trim() || null,
    }),
    onSuccess: () => {
      setSubmitted(true)
      void qc.invalidateQueries({ queryKey: ['ratings'] })
    },
    onError: (e) => {
      const ex = extractApiError(e)
      setErr(ex.message.startsWith('errors.') ? t(ex.message) : ex.message)
    },
  })

  const handleClose = () => {
    setStars(0); setHover(0); setComment(''); setSubmitted(false); setErr(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={submitted ? t('rating.thanksTitle') : t('rating.modalTitle')} size="md">
      {submitted ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="text-sm text-neutral-700">{t('rating.thanksText')}</p>
          <Button variant="primary" onClick={handleClose}>{t('common.cancel')}</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            {t('rating.intro', { name: ratedUserName, apartment: apartmentTitle })}
          </p>

          {err && <Alert tone="error">{err}</Alert>}

          {/* Star picker */}
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-800">{t('rating.howMany')}</p>
            <div className="flex gap-1" role="radiogroup" aria-label={t('rating.howMany')}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={stars === n}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setStars(n)}
                  className="p-1 transition hover:scale-110"
                >
                  <Star
                    className={cn(
                      'h-7 w-7',
                      (hover || stars) >= n
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-neutral-300',
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <FormField htmlFor="rating-comment" label={t('rating.commentLabel')} hint={t('rating.commentHint')}>
            <textarea
              id="rating-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
              className={cn(
                'w-full resize-y rounded-2xl border border-neutral-300 bg-white px-4 py-2.5 text-sm',
                'placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100',
              )}
            />
          </FormField>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={handleClose}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              loading={submit.isPending}
              disabled={stars === 0}
              onClick={() => submit.mutate()}
              leftIcon={<Star className="h-4 w-4" />}
            >
              {t('rating.submit')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
