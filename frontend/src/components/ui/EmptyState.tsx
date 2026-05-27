import type { ReactNode } from 'react'

import { cn } from '../../utils/cn'

/**
 * Designed empty state — every list page in Dorm gets one of these.
 * Pass an icon (24-32px), a short title, a one-line description, and an
 * optional CTA.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center px-6 py-16 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-neutral-900">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm leading-relaxed text-neutral-600">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
