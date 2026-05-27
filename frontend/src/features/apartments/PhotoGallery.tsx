import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useLanguage } from '../../hooks/useLanguage'
import { cn } from '../../utils/cn'
import { type ApartmentPhotoDto } from '../../utils/types'

type Props = {
  photos: ApartmentPhotoDto[]
  alt: string
  apiOrigin: string
}

/**
 * Lightweight carousel — current photo + prev/next buttons + thumbnail strip.
 * Arrow keys navigate when focused. Works in both LTR and RTL (arrow direction
 * is flipped so "next" goes in the natural reading direction).
 */
export function PhotoGallery({ photos, alt, apiOrigin }: Props) {
  const { t } = useTranslation()
  const { isRtl } = useLanguage()
  const [idx, setIdx] = useState(0)
  const count = photos.length

  // Reset when the photo list changes (e.g. after edit).
  useEffect(() => { setIdx(0) }, [photos.length])

  if (count === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 text-neutral-400">
        <div className="text-center">
          <ImageOff className="mx-auto mb-2 h-6 w-6" />
          <p className="text-xs">—</p>
        </div>
      </div>
    )
  }

  const prev = () => setIdx((i) => (i - 1 + count) % count)
  const next = () => setIdx((i) => (i + 1) % count)
  // In RTL the visual "previous" button is on the right but should still go to the previous index.
  const onLeft  = isRtl ? next : prev
  const onRight = isRtl ? prev : next

  const photoUrl = (p: ApartmentPhotoDto) => new URL(p.photoUrl, apiOrigin).toString()

  return (
    <div
      className="space-y-3"
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft')  onLeft()
        if (e.key === 'ArrowRight') onRight()
      }}
      tabIndex={0}
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-neutral-100">
        <img
          src={photoUrl(photos[idx])}
          alt={`${alt} — ${idx + 1}/${count}`}
          className="h-full w-full object-cover"
          loading="eager"
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={onLeft}
              aria-label={t('common.previous')}
              className="absolute start-3 top-1/2 -translate-y-1/2 rounded-2xl bg-white/90 p-2 text-neutral-700 shadow hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={onRight}
              aria-label={t('common.next')}
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded-2xl bg-white/90 p-2 text-neutral-700 shadow hover:bg-white"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              type="button"
              key={p.id}
              onClick={() => setIdx(i)}
              aria-current={i === idx}
              className={cn(
                'h-16 w-24 shrink-0 overflow-hidden rounded-2xl border-2 transition',
                i === idx ? 'border-brand-500' : 'border-transparent opacity-70 hover:opacity-100',
              )}
            >
              <img src={photoUrl(p)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
