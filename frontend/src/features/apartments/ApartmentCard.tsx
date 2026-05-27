import { Bed, Building2, MapPin, Sofa, Sparkles, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { MatchBadge } from '../../components/ui/MatchBadge'
import { useLanguage } from '../../hooks/useLanguage'
import { maybeArabicDigits } from '../../utils/arabicNumerals'
import { cn } from '../../utils/cn'
import {
  type ApartmentListItem,
  CityCodes,
  GenderType,
  UniversityCodes,
} from '../../utils/types'

type Props = { apartment: ApartmentListItem }

const PHOTO_PLACEHOLDER =
  // 1x1 light-gray data URL. Renders a calm neutral square when an apartment has no photos yet.
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><rect width="320" height="200" fill="%23f5f5f4"/><text x="50%" y="50%" font-family="system-ui" font-size="14" fill="%23a3a3a3" text-anchor="middle" dominant-baseline="middle">no photo</text></svg>'

export function ApartmentCard({ apartment }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguage()

  const photoSrc = apartment.mainPhotoUrl
    ? new URL(apartment.mainPhotoUrl, getApiOrigin()).toString()
    : PHOTO_PLACEHOLDER

  return (
    <Link
      to={`/apartments/${apartment.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
    >
      {/* ── Photo ─────────────────────────────────────────────────────── */}
      <div className="relative aspect-[5/3] overflow-hidden bg-neutral-100">
        <img
          src={photoSrc}
          alt={apartment.title}
          loading="lazy"
          className="h-full w-full object-cover transition group-hover:scale-105"
        />

        <div className="pointer-events-none absolute start-3 top-3 flex flex-wrap gap-1.5">
          {apartment.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-2xl bg-brand-500/95 px-2 py-0.5 text-[11px] font-semibold text-white">
              <Sparkles className="h-3 w-3" />
              {t('apartments.featured')}
            </span>
          )}
          <span
            className={cn(
              'inline-flex items-center rounded-2xl px-2 py-0.5 text-[11px] font-medium',
              apartment.genderType === GenderType.Mixed
                ? 'bg-purple-50 text-purple-700'
                : apartment.genderType === GenderType.MaleOnly
                  ? 'bg-sky-50 text-sky-700'
                  : 'bg-pink-50 text-pink-700',
            )}
          >
            {t(`apartments.gender.${apartment.genderType}`)}
          </span>
        </div>

        {apartment.compatibilityScore !== null && (
          <div className="absolute end-3 top-3">
            <MatchBadge score={apartment.compatibilityScore} size="sm" />
          </div>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900 group-hover:text-brand-600">
            {apartment.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
            <MapPin className="h-3.5 w-3.5" />
            <span>{apartment.neighborhood}</span>
            <span className="text-neutral-300">·</span>
            <span>{t(`cities.${CityCodes[apartment.city]}`)}</span>
          </p>
        </div>

        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-600">
          <li className="inline-flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            {t(`universities.${UniversityCodes[apartment.nearestUniversity]}`)}
          </li>
          <li className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {t('apartments.spotsAvailable', {
              available: maybeArabicDigits(apartment.availableSpots, language),
              total: maybeArabicDigits(apartment.totalSpots, language),
            })}
          </li>
          {apartment.isFurnished && (
            <li className="inline-flex items-center gap-1">
              <Sofa className="h-3.5 w-3.5" />
              {t('amenities.Furnished')}
            </li>
          )}
          <li className="inline-flex items-center gap-1 text-neutral-500">
            <Bed className="h-3.5 w-3.5" />
            {t('apartments.walkMin', { min: maybeArabicDigits(apartment.distanceMinutes, language) })}
          </li>
        </ul>

        <div className="mt-auto flex items-end justify-between border-t border-neutral-100 pt-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-neutral-400">
              {t('apartments.pricePerPerson')}
            </p>
            <p className="text-lg font-bold text-neutral-900">
              {t('apartments.priceValue', {
                value: maybeArabicDigits(formatPrice(apartment.pricePerPerson), language),
              })}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

function formatPrice(value: number): string {
  // Round to whole JOD; very few owners price in fractional JOD per person.
  return Math.round(value).toString()
}

function getApiOrigin(): string {
  // In dev the photo URLs returned by the API are relative ("/uploads/...").
  // Prefix them with the API origin so the <img> doesn't hit the Vite dev server,
  // which doesn't proxy /uploads (only /api). In production the same-origin
  // behaviour means this just collapses to a relative URL.
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'
  // If VITE_API_BASE_URL is absolute, strip its trailing "/api" segment;
  // otherwise default to localhost:5080 in dev.
  if (base.startsWith('http')) return base.replace(/\/api\/?$/, '')
  return 'http://localhost:5080'
}
