import { cn } from '../../utils/cn'

type Size = 'sm' | 'md' | 'lg'

const sizes: Record<Size, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

export function Spinner({ size = 'md', className }: { size?: Size; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-current border-t-transparent',
        sizes[size],
        className,
      )}
    />
  )
}
