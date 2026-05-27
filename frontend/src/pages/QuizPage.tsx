import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, BadgeCheck, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { useLanguage } from '../hooks/useLanguage'
import { extractApiError } from '../lib/http'
import { quizApi } from '../services/api/quiz'
import { maybeArabicDigits } from '../utils/arabicNumerals'
import { cn } from '../utils/cn'
import { QuizQuestionCodes, type QuizQuestionKey } from '../utils/types'

/**
 * 8-step lifestyle quiz. Pre-loads existing answers (so a student can edit),
 * locks "Next" until an option is selected, submits all answers at the end.
 */
export function QuizPage() {
  const { t } = useTranslation()
  const { language, isRtl } = useLanguage()
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Load questions + existing answers in parallel.
  const questionsQuery = useQuery({ queryKey: ['quiz', 'questions'], queryFn: () => quizApi.questions() })
  const mineQuery      = useQuery({ queryKey: ['quiz', 'mine'],      queryFn: () => quizApi.myAnswers() })

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Map<QuizQuestionKey, string>>(new Map())
  const [serverError, setServerError] = useState<string | null>(null)

  // Hydrate from existing answers once both queries resolve.
  useEffect(() => {
    if (mineQuery.data && answers.size === 0 && mineQuery.data.answers.length > 0) {
      const m = new Map<QuizQuestionKey, string>()
      for (const a of mineQuery.data.answers) m.set(a.questionKey, a.answerValue)
      setAnswers(m)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mineQuery.data])

  const questions = questionsQuery.data?.questions ?? []
  const total = questions.length

  const save = useMutation({
    mutationFn: () =>
      quizApi.saveAnswers({
        answers: questions.map((q) => ({ questionKey: q.key, answerValue: answers.get(q.key)! })),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['quiz', 'mine'] })
      navigate('/dashboard', { replace: true })
    },
    onError: (err) => {
      const { message } = extractApiError(err)
      setServerError(message.startsWith('errors.') ? t(message) : message)
    },
  })

  // ── states ─────────────────────────────────────────────────────────────
  if (questionsQuery.isLoading || mineQuery.isLoading) return <QuizSkeleton />
  if (questionsQuery.isError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Alert tone="error" title={t('errors.generic')}>
          {extractApiError(questionsQuery.error).message}
        </Alert>
      </div>
    )
  }

  const q = questions[step]
  const selected = answers.get(q.key)
  const isLast = step === total - 1
  const canNext = !!selected
  const allAnswered = questions.every((qq) => answers.has(qq.key))

  const code = QuizQuestionCodes[q.key]
  const optionValues = q.options

  // Reverse arrow direction in RTL so "Next" goes in the natural reading direction.
  const ArrowFwd = isRtl ? ArrowLeft  : ArrowRight
  const ArrowBack = isRtl ? ArrowRight : ArrowLeft

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      {/* Header */}
      <div className="mb-6 text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
          {t('quiz.eyebrow')}
        </p>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{t('quiz.title')}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">
          {t('quiz.subtitle')}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="mb-1.5 flex items-center justify-between text-xs text-neutral-500">
          <span>
            {t('quiz.progress', {
              n: maybeArabicDigits(step + 1, language),
              total: maybeArabicDigits(total, language),
            })}
          </span>
          {mineQuery.data?.quizCompleted && (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <BadgeCheck className="h-3.5 w-3.5" />
              {t('quiz.previouslyCompleted')}
            </span>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-2xl bg-neutral-100">
          <div
            className="h-full rounded-2xl bg-brand-500 transition-[width] duration-300"
            style={{ width: `${((step + 1) / total) * 100}%` }}
            aria-hidden
          />
        </div>
      </div>

      {/* Card */}
      <Card>
        {serverError && <Alert tone="error" className="mb-4">{serverError}</Alert>}

        <h2 className="mb-1 text-lg font-semibold text-neutral-900">
          {t(`quiz.q.${code}.title`)}
        </h2>
        <p className="mb-5 text-sm text-neutral-600">{t(`quiz.q.${code}.help`)}</p>

        <ul role="radiogroup" className="space-y-2">
          {optionValues.map((opt) => {
            const isActive = selected === opt
            return (
              <li key={opt}>
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition',
                    isActive
                      ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100'
                      : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50',
                  )}
                >
                  <input
                    type="radio"
                    name={`q-${q.key}`}
                    value={opt}
                    checked={isActive}
                    onChange={() =>
                      setAnswers((prev) => {
                        const next = new Map(prev)
                        next.set(q.key, opt)
                        return next
                      })
                    }
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-2xl border',
                      isActive ? 'border-brand-500 bg-brand-500 text-white' : 'border-neutral-300',
                    )}
                    aria-hidden
                  >
                    {isActive && <Check className="h-3 w-3" />}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-neutral-900">
                      {t(`quiz.opt.${code}.${opt}`)}
                    </span>
                    <span className="mt-0.5 block text-xs text-neutral-500">
                      {t(`quiz.optDesc.${code}.${opt}`, { defaultValue: '' })}
                    </span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            leftIcon={<ArrowBack className="h-4 w-4" />}
          >
            {t('common.back')}
          </Button>
          {isLast ? (
            <Button
              variant="primary"
              disabled={!allAnswered || save.isPending}
              loading={save.isPending}
              onClick={() => {
                setServerError(null)
                save.mutate()
              }}
            >
              {t('quiz.submit')}
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={!canNext}
              onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
              rightIcon={<ArrowFwd className="h-4 w-4" />}
            >
              {t('common.next')}
            </Button>
          )}
        </div>
      </Card>

      {/* Dotted nav for quick jumps */}
      <div className="mt-6 flex flex-wrap justify-center gap-1.5">
        {questions.map((qq, i) => {
          const has = answers.has(qq.key)
          const isCurrent = i === step
          return (
            <button
              key={qq.key}
              type="button"
              onClick={() => setStep(i)}
              aria-label={t('quiz.jumpTo', { n: maybeArabicDigits(i + 1, language) })}
              className={cn(
                'h-2 rounded-2xl transition',
                isCurrent ? 'w-6 bg-brand-500' : has ? 'w-2 bg-brand-400/70' : 'w-2 bg-neutral-200',
              )}
            />
          )
        })}
      </div>
    </div>
  )
}

function QuizSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <div className="mb-6 text-center">
        <Skeleton className="mx-auto h-4 w-32" />
        <Skeleton className="mx-auto mt-2 h-8 w-2/3" />
      </div>
      <Skeleton className="mb-6 h-2 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  )
}
