import type { HTMLAttributes } from 'react'

import { cn } from '../../utils/cn'

type Props = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean
}

export function Card({ padded = true, className, children, ...rest }: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-neutral-200 bg-white shadow-sm',
        padded && 'p-6 sm:p-8',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
