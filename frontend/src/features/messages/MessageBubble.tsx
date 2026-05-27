import { Check, CheckCheck } from 'lucide-react'

import { useLanguage } from '../../hooks/useLanguage'
import { cn } from '../../utils/cn'
import { toArabicNumerals } from '../../utils/arabicNumerals'
import type { MessageDto } from '../../utils/types'

type Props = {
  message: MessageDto
  isMine: boolean
}

export function MessageBubble({ message, isMine }: Props) {
  const { language } = useLanguage()

  const time = new Date(message.sentAt)
  const hh = time.getHours().toString().padStart(2, '0')
  const mm = time.getMinutes().toString().padStart(2, '0')
  const timeLabel = language === 'ar' ? toArabicNumerals(`${hh}:${mm}`) : `${hh}:${mm}`

  return (
    <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm',
          isMine
            ? 'bg-brand-500 text-white'
            : 'bg-white text-neutral-900 border border-neutral-200',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div className={cn(
          'mt-1 flex items-center justify-end gap-1 text-[10px]',
          isMine ? 'text-brand-100' : 'text-neutral-400',
        )}>
          <span>{timeLabel}</span>
          {isMine && (message.isRead
            ? <CheckCheck className="h-3 w-3" />
            : <Check className="h-3 w-3" />)}
        </div>
      </div>
    </div>
  )
}
