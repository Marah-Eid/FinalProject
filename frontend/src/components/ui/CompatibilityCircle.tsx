import { useTranslation } from 'react-i18next'

import { useLanguage } from '../../hooks/useLanguage'
import { maybeArabicDigits } from '../../utils/arabicNumerals'
import { cn } from '../../utils/cn'

type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, { box: number; stroke: number; font: string }> = {
  sm: { box: 64,  stroke: 6,  font: 'text-sm  font-bold' },
  md: { box: 120, stroke: 10, font: 'text-2xl font-bold' },
  lg: { box: 168, stroke: 12, font: 'text-3xl font-bold' },
}

type Props = {
  score: number       // 0..100
  size?: Size
  label?: string      // small label under the number; defaults to "match"
  className?: string
}

/**
 * Circular SVG donut showing a compatibility percentage. Toned by score:
 *   >= 80 → emerald
 *   >= 50 → amber
 *   <  50 → neutral red
 * Numerals localise to Arabic-Indic when the active language is ar.
 */
export function CompatibilityCircle({ score, size = 'md', label, className }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguage()

  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const { box, stroke, font } = SIZES[size]
  const radius = (box - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (clamped / 100) * circumference

  const tone =
    clamped >= 80 ? { ring: 'stroke-emerald-500', text: 'text-emerald-700' }
    : clamped >= 50 ? { ring: 'stroke-amber-500', text: 'text-amber-700' }
    :                 { ring: 'stroke-rose-500',  text: 'text-rose-700' }

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: box, height: box }}>
      <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} className="rotate-[-90deg]">
        {/* Track */}
        <circle
          cx={box / 2} cy={box / 2} r={radius}
          strokeWidth={stroke}
          className="stroke-neutral-100 fill-none"
        />
        {/* Progress */}
        <circle
          cx={box / 2} cy={box / 2} r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          className={cn('fill-none transition-[stroke-dashoffset] duration-500', tone.ring)}
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn(font, tone.text)} aria-label={t('match.percent', { value: clamped })}>
          {maybeArabicDigits(clamped, language)}
          <span className="text-base font-semibold">%</span>
        </span>
        {label && size !== 'sm' && (
          <span className="mt-0.5 text-xs uppercase tracking-wider text-neutral-500">{label}</span>
        )}
      </div>
    </div>
  )
}
