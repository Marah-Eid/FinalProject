import { useQuery } from '@tanstack/react-query'
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Cigarette,
  Heart,
  Lock,
  MapPin,
  Phone,
  Star,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { ApartmentMap } from '../components/maps/ApartmentMap'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { MatchBadge } from '../components/ui/MatchBadge'
import { Skeleton } from '../components/ui/Skeleton'
import { AmenityIcon } from '../features/apartments/AmenityIcon'
import { CompatibilityBreakdown } from '../features/apartments/CompatibilityBreakdown'
import { PhotoGallery } from '../features/apartments/PhotoGallery'
import { ApplyModal } from '../features/applications/ApplyModal'
import { ReportListingModal } from '../features/reports/ReportListingModal'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../hooks/useLanguage'
import { extractApiError } from '../lib/http'
import { apartmentsApi } from '../services/api/apartments'
import { maybeArabicDigits } from '../utils/arabicNumerals'
import { formatDate } from '../utils/formatDate'
import { cn } from '../utils/cn'
import {
  AmenityCodes,
  CityCodes,
  GenderType,
  GuestsRuleCodes,
  SmokingRuleCodes,
  UniversityCodes,
  UserRole,
} from '../utils/types'

const API_ORIGIN = (() => {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'
  if (base.startsWith('http')) return base.replace(/\/api\/?$/, '')
  return 'http://localhost:5080'
})()

export function ApartmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { user } = useAuth()
  const [applyOpen, setApplyOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  const query = useQuery({
    queryKey: ['apartment', id],
    queryFn: () => apartmentsApi.getById(id!),
    enabled: !!id,
  })

  // Compatibility breakdown — student-only endpoint. Skipped (no extra query)
  // when the requester isn't a logged-in student.
  const breakdownQuery = useQuery({
    queryKey: ['apartment', id, 'compatibility'],
    queryFn: () => apartmentsApi.getCompatibility(id!),
    enabled: !!id && user?.role === UserRole.Student,
    // Skip retries; if the quiz isn't complete the API returns 400 — we just hide the breakdown.
    retry: false,
  })

  if (query.isLoading) return <DetailSkeleton />

  if (query.isError) {
    const err = extractApiError(query.error)
    const notFound = err.code === 'not_found'
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Alert tone={notFound ? 'warning' : 'error'} title={notFound ? t('apartments.notFoundTitle') : t('errors.generic')}>
          {notFound ? t('apartments.notFoundText') : err.message}
          <div className="mt-3">
            <Link to="/browse" className="font-medium text-brand-700 hover:underline">
              {t('apartments.backToBrowse')} →
            </Link>
          </div>
        </Alert>
      </div>
    )
  }

  const apt = query.data!
  const addressUnlocked = apt.addressDetail !== null
  const phoneUnlocked = apt.ownerPhoneNumber !== null
  const canApply = user?.role === UserRole.Student

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* ── Title row ──────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-2xl px-2 py-0.5 text-[11px] font-medium',
              apt.genderType === GenderType.Mixed
                ? 'bg-purple-50 text-purple-700'
                : apt.genderType === GenderType.MaleOnly
                  ? 'bg-sky-50 text-sky-700'
                  : 'bg-pink-50 text-pink-700',
            )}
          >
            {t(`apartments.gender.${apt.genderType}`)}
          </span>
          {apt.isFeatured && (
            <span className="inline-flex items-center rounded-2xl bg-brand-500/95 px-2 py-0.5 text-[11px] font-semibold text-white">
              {t('apartments.featured')}
            </span>
          )}
          <MatchBadge score={apt.compatibilityScore} size="sm" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{apt.title}</h1>
        <p className="flex items-center gap-1 text-sm text-neutral-600">
          <MapPin className="h-4 w-4" />
          {apt.neighborhood} · {t(`cities.${CityCodes[apt.city]}`)}
          {addressUnlocked && apt.addressDetail && <span className="ms-1 text-neutral-400"> — {apt.addressDetail}</span>}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Left column ────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          <PhotoGallery photos={apt.photos} alt={apt.title} apiOrigin={API_ORIGIN} />

          {/* Compatibility breakdown — only when the logged-in student has a complete quiz. */}
          {breakdownQuery.data && (
            <CompatibilityBreakdown
              score={breakdownQuery.data.score}
              matchedOn={breakdownQuery.data.matchedOn}
              differedOn={breakdownQuery.data.differedOn}
              tenantsCount={breakdownQuery.data.tenantsCount}
            />
          )}

          {/* About */}
          <Card>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">{t('apartments.about')}</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{apt.description}</p>
          </Card>

          {/* Quick facts */}
          <Card>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">{t('apartments.facts')}</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Fact icon={<Users className="h-4 w-4" />} label={t('apartments.spots')} value={t('apartments.spotsAvailable', {
                available: maybeArabicDigits(apt.availableSpots, language),
                total: maybeArabicDigits(apt.totalSpots, language),
              })} />
              <Fact icon={<Building2 className="h-4 w-4" />} label={t('apartments.nearestUniversity')}
                value={`${t(`universities.${UniversityCodes[apt.nearestUniversity]}`)} · ${t('apartments.walkMin', { min: maybeArabicDigits(apt.distanceMinutes, language) })}`} />
              <Fact icon={<Cigarette className="h-4 w-4" />} label={t('apartments.smokingRule')}
                value={t(`smokingRules.${SmokingRuleCodes[apt.smokingRule]}`)} />
              <Fact icon={<Users className="h-4 w-4" />} label={t('apartments.guestsRule')}
                value={t(`guestsRules.${GuestsRuleCodes[apt.guestsRule]}`)} />
            </dl>
          </Card>

          {/* Amenities */}
          <Card>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">{t('apartments.amenitiesTitle')}</h2>
            {apt.amenities.length === 0 ? (
              <p className="text-sm text-neutral-500">—</p>
            ) : (
              <ul className="grid grid-cols-2 gap-y-2 sm:grid-cols-3">
                {apt.amenities.map((a) => (
                  <li key={a} className="inline-flex items-center gap-2 text-sm text-neutral-700">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                      <AmenityIcon type={a} />
                    </span>
                    {t(`amenities.${AmenityCodes[a]}`)}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Current tenants — privacy: first name + year + major only */}
          <Card>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">{t('apartments.currentTenantsTitle')}</h2>
            {apt.currentTenants.length === 0 ? (
              <p className="text-sm text-neutral-500">{t('apartments.noTenantsYet')}</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {apt.currentTenants.map((t0, i) => (
                  <li key={`${t0.firstName}-${i}`} className="rounded-2xl border border-neutral-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-neutral-900">{t0.firstName}</p>
                      <MatchBadge score={t0.compatibilityScore} size="sm" />
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {t0.year ? t('apartments.yearN', { year: maybeArabicDigits(t0.year, language) }) : t('apartments.yearUnknown')}
                      {t0.major ? ` · ${t0.major}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Map */}
          <Card padded={false}>
            <div className="border-b border-neutral-100 p-4">
              <h2 className="text-lg font-semibold text-neutral-900">{t('apartments.locationTitle')}</h2>
              <p className="text-xs text-neutral-500">{t('apartments.locationApprox')}</p>
            </div>
            <ApartmentMap
              center={[apt.latitude, apt.longitude]}
              markers={[{ id: apt.id, position: [apt.latitude, apt.longitude], title: apt.title }]}
              zoom={13}
              height={360}
              className="rounded-t-none border-0"
            />
          </Card>
        </div>

        {/* ── Right column — sticky action card ──────────────────────── */}
        <aside>
          <Card className="sticky top-20">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-400">{t('apartments.pricePerPerson')}</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {t('apartments.priceValue', {
                    value: maybeArabicDigits(Math.round(apt.pricePerPerson), language),
                  })}
                </p>
              </div>
              <p className="text-end text-xs text-neutral-500">
                {t('apartments.fullRentLabel')}{' '}
                <span className="font-medium text-neutral-700">
                  {t('apartments.priceValue', { value: maybeArabicDigits(Math.round(apt.fullRent), language) })}
                </span>
              </p>
            </div>

            <div className="mb-4 flex items-center justify-between rounded-2xl bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {t('apartments.spotsAvailable', {
                  available: maybeArabicDigits(apt.availableSpots, language),
                  total: maybeArabicDigits(apt.totalSpots, language),
                })}
              </span>
            </div>

            {canApply ? (
              <Button variant="primary" block onClick={() => setApplyOpen(true)}>
                {t('apartments.applyCta')}
              </Button>
            ) : !user ? (
              <Link to="/login" state={{ from: { pathname: `/apartments/${apt.id}` } }}>
                <Button variant="primary" block>{t('apartments.loginToApply')}</Button>
              </Link>
            ) : (
              <Button variant="secondary" block disabled>{t('apartments.studentsOnly')}</Button>
            )}

            <div className="mt-3 flex gap-2">
              <Button variant="ghost" size="sm" block disabled leftIcon={<Heart className="h-4 w-4" />}>
                {t('apartments.save')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                block
                onClick={() => user ? setReportOpen(true) : null}
                disabled={!user}
                title={user ? undefined : t('apartments.loginToApply')}
              >
                {t('apartments.report')}
              </Button>
            </div>

            {/* Owner snippet */}
            <hr className="my-4 border-neutral-100" />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-brand-500" />
                <span className="font-medium text-neutral-800">{apt.owner.fullName}</span>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Star className="h-3.5 w-3.5" />
                {apt.owner.averageRating !== null
                  ? t('apartments.ownerRating', {
                      avg: maybeArabicDigits(apt.owner.averageRating.toFixed(1), language),
                      count: maybeArabicDigits(apt.owner.ratingsCount, language),
                    })
                  : t('apartments.noOwnerRatings')}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                <CalendarDays className="h-3.5 w-3.5" />
                {t('apartments.memberSince', { date: formatDate(apt.owner.memberSince, language) })}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                {phoneUnlocked ? (
                  <>
                    <Phone className="h-3.5 w-3.5 text-green-600" />
                    <span dir="ltr">{apt.ownerPhoneNumber}</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    {t('apartments.phoneLocked')}
                  </>
                )}
              </p>
            </div>

            {/* Lock notice */}
            {!addressUnlocked && (
              <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Lock className="h-3.5 w-3.5" />
                  {t('apartments.addressLockedTitle')}
                </span>
                <p className="mt-1 leading-relaxed">{t('apartments.addressLockedText')}</p>
              </div>
            )}
          </Card>
        </aside>
      </div>

      {/* Apply modal — mounted lazily, portal-rendered. */}
      {canApply && (
        <ApplyModal
          isOpen={applyOpen}
          onClose={() => setApplyOpen(false)}
          apartmentId={apt.id}
          apartmentTitle={apt.title}
          compatibilityScore={breakdownQuery.data?.score ?? apt.compatibilityScore}
        />
      )}

      {/* Report modal — any authed (non-owner) user can flag a listing. */}
      {user && (
        <ReportListingModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          apartmentId={apt.id}
          apartmentTitle={apt.title}
        />
      )}
    </div>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────────

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-neutral-400">
        {icon} {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-neutral-900">{value}</dd>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Skeleton className="aspect-[16/9] w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  )
}
