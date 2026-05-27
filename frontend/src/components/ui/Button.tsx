import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

import { cn } from '../../utils/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  /** Disables the button and shows a spinner inline. */
  loading?: boolean
  /** Stretch to the full width of the parent. */
  block?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-medium ' +
  'transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary:   'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
  secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300',
  ghost:     'bg-transparent text-neutral-700 hover:bg-neutral-100',
  danger:    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    block = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], block && 'w-full', className)}
      {...rest}
    >
      {loading ? <Spinner size="sm" className="text-current" /> : leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  )
})
