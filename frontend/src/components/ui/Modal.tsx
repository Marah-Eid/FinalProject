import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '../../utils/cn'

type Props = {
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  /** Accessible label for screen readers when no visible title is set. */
  ariaLabel?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const SIZE: Record<NonNullable<Props['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

/**
 * Light-weight modal — backdrop click + Escape close, locks body scroll while
 * open, returns focus to the previously-active element when dismissed.
 * Rendered via React portal to keep it out of the parent's stacking context.
 */
export function Modal({ isOpen, onClose, title, ariaLabel, children, size = 'md' }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const lastFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    lastFocused.current = document.activeElement as HTMLElement | null

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus the dialog so Tab navigation starts inside it.
    queueMicrotask(() => dialogRef.current?.focus())

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      lastFocused.current?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 pt-12 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-neutral-900/50 backdrop-blur-[2px]"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full overflow-hidden rounded-2xl bg-white shadow-xl outline-none',
          SIZE[size],
        )}
      >
        {title && (
          <div className="flex items-start justify-between border-b border-neutral-100 px-6 py-4">
            <div className="text-base font-semibold text-neutral-900">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl p-1 text-neutral-500 hover:bg-neutral-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
