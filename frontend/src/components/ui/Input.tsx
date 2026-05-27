import { forwardRef, type InputHTMLAttributes } from 'react'

import { cn } from '../../utils/cn'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  /** True when the field has a validation error — drives the red border + ring. */
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full rounded-2xl border bg-white px-4 py-2.5 text-neutral-900',
        'placeholder:text-neutral-400 transition',
        'focus:outline-none focus:ring-2',
        invalid
          ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
          : 'border-neutral-300 focus:border-brand-500 focus:ring-brand-100',
        'disabled:bg-neutral-50 disabled:text-neutral-500',
        className,
      )}
      {...rest}
    />
  )
})
