import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../../utils/cn'

type Tone = 'error' | 'success' | 'info' | 'warning'

const styles: Record<Tone, { wrap: string; icon: ReactNode }> = {
  error:   { wrap: 'border-red-200    bg-red-50    text-red-900',    icon: <XCircle    className="h-4 w-4 text-red-600" /> },
  success: { wrap: 'border-green-200  bg-green-50  text-green-900',  icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
  info:    { wrap: 'border-blue-200   bg-blue-50   text-blue-900',   icon: <Info       className="h-4 w-4 text-blue-600" /> },
  warning: { wrap: 'border-amber-200  bg-amber-50  text-amber-900',  icon: <AlertCircle className="h-4 w-4 text-amber-600" /> },
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: Tone
  title?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const s = styles[tone]
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm',
        s.wrap,
        className,
      )}
    >
      <span aria-hidden className="mt-0.5 shrink-0">{s.icon}</span>
      <div className="space-y-0.5">
        {title && <p className="font-medium leading-tight">{title}</p>}
        {children && <div className="text-sm leading-relaxed">{children}</div>}
      </div>
    </div>
  )
}
