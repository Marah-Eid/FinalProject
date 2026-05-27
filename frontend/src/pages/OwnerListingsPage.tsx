import { useQuery } from '@tanstack/react-query'
import { Building2, Pencil, Plus, Sparkles, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { useLanguage } from '../hooks/useLanguage'
import { apartmentsApi } from '../services/api/apartments'
import { maybeArabicDigits } from '../utils/arabicNumerals'
import { cn } from '../utils/cn'
import { CityCodes, GenderType, UniversityCodes } from '../utils/types'

const API_ORIGIN = (() => {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'
  if (base.startsWith('http')) return base.replace(/\/api\/?$/, '')
  return 'http://localhost:5080'
})()

export function OwnerListingsPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()

  const query = useQuery({
    queryKey: ['apartments', 'mine'],
    queryFn: () => apartmentsApi.mine(),
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{t('myListings.title')}</h1>
          <p className="mt-1 text-sm text-neutral-600">{t('myListings.subtitle')}</p>
        </div>
        <Link to="/owner/listings/new">
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            {t('myListings.newListing')}
          </Button>
        </Link>
      </header>

      {query.isLoading ? (
        <ListingsSkeleton />
      ) : (query.data?.length ?? 0) === 0 ? (
        <Card>
          <EmptyState
            icon={<Building2 className="h-7 w-7" />}
            title={t('myListings.empty.title')}
            description={t('myListings.empty.description')}
            action={
              <Link to="/owner/listings/new">
                <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                  {t('myListings.empty.cta')}
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.data!.map((apt) => (
            <Card key={apt.id} padded={false} className="flex flex-col overflow-hidden">
              <div className="relative aspect-[5/3] overflow-hidden bg-neutral-100">
                {apt.mainPhotoUrl ? (
                  <img
                    src={new URL(apt.mainPhotoUrl, API_ORIGIN).toString()}
                    alt={apt.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-neutral-400">
                    <Building2 className="h-8 w-8" />
                  </div>
                )}
                {apt.isFeatured && (
                  <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-2xl bg-brand-500/95 px-2 py-0.5 text-[11px] font-semibold text-white">
                    <Sparkles className="h-3 w-3" />
                    {t('apartments.featured')}
                  </span>
                )}
                <span
                  className={cn(
                    'absolute end-3 top-3 inline-flex items-center rounded-2xl px-2 py-0.5 text-[11px] font-medium',
                    apt.genderType === GenderType.Mixed
                      ? 'bg-purple-50 text-purple-700'
                      : apt.genderType === GenderType.MaleOnly
                        ? 'bg-sky-50 text-sky-700'
                        : 'bg-pink-50 text-pink-700',
                  )}
                >
                  {t(`apartments.gender.${apt.genderType}`)}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900">{apt.title}</h3>
                <p className="text-xs text-neutral-500">
                  {apt.neighborhood} · {t(`cities.${CityCodes[apt.city]}`)}
                  <br />
                  {t(`universities.${UniversityCodes[apt.nearestUniversity]}`)}
                </p>
                <p className="inline-flex items-center gap-1 text-xs text-neutral-600">
                  <Users className="h-3.5 w-3.5" />
                  {t('apartments.spotsAvailable', {
                    available: maybeArabicDigits(apt.availableSpots, language),
                    total: maybeArabicDigits(apt.totalSpots, language),
                  })}
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {t('apartments.priceValue', {
                    value: maybeArabicDigits(Math.round(apt.pricePerPerson), language),
                  })}{' '}
                  <span className="text-xs font-normal text-neutral-400">
                    / {t('apartments.pricePerPerson')}
                  </span>
                </p>

                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <Link to={`/apartments/${apt.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" block>{t('myListings.view')}</Button>
                  </Link>
                  <Link to={`/owner/listings/${apt.id}/edit`} className="flex-1">
                    <Button variant="primary" size="sm" block leftIcon={<Pencil className="h-3.5 w-3.5" />}>
                      {t('myListings.edit')}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function ListingsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} padded={false} className="overflow-hidden">
          <Skeleton className="aspect-[5/3] rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
          </div>
        </Card>
      ))}
    </div>
  )
}
