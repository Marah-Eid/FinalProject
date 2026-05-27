import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '../../utils/cn'

type Props = {
  label: ReactNode
  htmlFor: string
  hint?: ReactNode
  error?: ReactNode
  optional?: boolean
  children: ReactNode
  className?: string
}

/**
 * Wraps a single form input with label, optional hint, and error message.
 * Pass the *same* `htmlFor` as the input's `id` so screen readers associate them.
 */
export function FormField({ label, htmlFor, hint, error, optional, children, className }: Props) {
  const { t } = useTranslation()
  const errorId = `${htmlFor}-error`
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-neutral-800">
        {label}
        {optional && (
          <span className="ms-1 text-xs font-normal text-neutral-400">({t('common.optional')})</span>
        )}
      </label>
      {children}
      {!error && hint && <p className="text-xs text-neutral-500">{hint}</p>}
      {error && (
        <p id={errorId} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
