import { cn } from '../../utils/cn'

/**
 * Lightweight pulsing placeholder. Compose multiple Skeletons inside the same
 * Card to mirror the final layout — keeps the loading state from feeling jumpy.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-hidden="true"
      className={cn('animate-pulse rounded-2xl bg-neutral-200/70', className)}
    />
  )
}
