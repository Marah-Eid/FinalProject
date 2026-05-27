import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { z } from 'zod'

import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { FormField } from '../components/ui/FormField'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { AmenityIcon } from '../features/apartments/AmenityIcon'
import { LocationPicker } from '../features/apartments/LocationPicker'
import { extractApiError } from '../lib/http'
import { apartmentsApi } from '../services/api/apartments'
import { cn } from '../utils/cn'
import {
  AmenityCodes,
  AmenityType,
  City,
  GenderType,
  GuestsRule,
  SmokingRule,
  University,
  UniversityCodes,
  type CreateApartmentRequest,
} from '../utils/types'

const CITY_CENTERS: Record<City, [number, number]> = {
  [City.Amman]: [31.95, 35.93],
  [City.Irbid]: [32.553, 35.847],
  [City.Zarqa]: [32.072, 36.088],
}

const schema = z.object({
  title: z.string().min(5, { message: 'errors.field.tooShort' }).max(140),
  description: z.string().min(20, { message: 'errors.field.tooShort' }).max(4000),
  city: z.string().min(1, { message: 'errors.field.required' }),
  neighborhood: z.string().min(2, { message: 'errors.field.tooShort' }).max(120),
  addressDetail: z.string().min(5, { message: 'errors.field.tooShort' }).max(500),
  latitude: z.number(),
  longitude: z.number(),
  nearestUniversity: z.string().min(1, { message: 'errors.field.required' }),
  distanceMinutes: z.coerce.number().int().min(0).max(240),
  fullRent: z.coerce.number().positive().max(99_999_999),
  totalSpots: z.coerce.number().int().min(1).max(20),
  availableSpots: z.coerce.number().int().min(0).max(20),
  genderType: z.string().min(1, { message: 'errors.field.required' }),
  smokingRule: z.string().min(1, { message: 'errors.field.required' }),
  guestsRule: z.string().min(1, { message: 'errors.field.required' }),
  isFurnished: z.boolean(),
}).refine((v) => v.availableSpots <= v.totalSpots, {
  message: 'newListing.errors.spotsExceedsTotal',
  path: ['availableSpots'],
})

type FormValues = z.infer<typeof schema>

const AMENITIES: AmenityType[] = Object.values(AmenityType) as AmenityType[]

export function OwnerNewListingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [pin, setPin] = useState<[number, number]>(CITY_CENTERS[City.Amman])
  const [amenities, setAmenities] = useState<AmenityType[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      title: '',
      description: '',
      city: String(City.Amman),
      neighborhood: '',
      addressDetail: '',
      latitude: pin[0],
      longitude: pin[1],
      nearestUniversity: String(University.JU),
      distanceMinutes: 10,
      fullRent: 300,
      totalSpots: 3,
      availableSpots: 3,
      genderType: String(GenderType.MaleOnly),
      smokingRule: String(SmokingRule.No),
      guestsRule: String(GuestsRule.Limited),
      isFurnished: true,
    },
  })

  // When user picks a different city from the dropdown, re-center the map.
  const watchedCity = watch('city')
  const handleCityChange = (value: string) => {
    setValue('city', value)
    const cityValue = Number(value) as City
    if (CITY_CENTERS[cityValue]) {
      const [lat, lng] = CITY_CENTERS[cityValue]
      setPin([lat, lng])
      setValue('latitude', lat)
      setValue('longitude', lng)
    }
  }

  const handlePinChange = (next: [number, number]) => {
    setPin(next)
    setValue('latitude', next[0])
    setValue('longitude', next[1])
  }

  const toggleAmenity = (a: AmenityType) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      const req: CreateApartmentRequest = {
        title: values.title.trim(),
        description: values.description.trim(),
        city: Number(values.city) as City,
        neighborhood: values.neighborhood.trim(),
        addressDetail: values.addressDetail.trim(),
        latitude: values.latitude,
        longitude: values.longitude,
        fullRent: values.fullRent,
        totalSpots: values.totalSpots,
        availableSpots: values.availableSpots,
        genderType: Number(values.genderType) as GenderType,
        isFurnished: values.isFurnished,
        nearestUniversity: Number(values.nearestUniversity) as University,
        distanceMinutes: values.distanceMinutes,
        smokingRule: Number(values.smokingRule) as SmokingRule,
        guestsRule: Number(values.guestsRule) as GuestsRule,
        amenities,
      }
      const created = await apartmentsApi.create(req)
      // Hop straight into the photo-upload step — listings without photos look
      // empty on the browse page.
      navigate(`/owner/listings/${created.id}/photos`, { replace: true })
    } catch (e) {
      const err = extractApiError(e)
      setServerError(err.message.startsWith('errors.') ? t(err.message) : err.message)
    }
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{t('newListing.title')}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t('newListing.subtitle')}</p>
      </header>

      {serverError && <Alert tone="error" className="mb-4">{serverError}</Alert>}

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {/* ── Basics ──────────────────────────────────────────────────── */}
        <Card>
          <SectionTitle title={t('newListing.basics.title')} hint={t('newListing.basics.hint')} />

          <FormField htmlFor="title" label={t('newListing.fields.title')}
            error={errors.title && t(errors.title.message ?? 'errors.field.required')}>
            <Input id="title" {...register('title')} invalid={!!errors.title} />
          </FormField>

          <FormField htmlFor="description" label={t('newListing.fields.description')}
            error={errors.description && t(errors.description.message ?? 'errors.field.required')}>
            <textarea
              id="description"
              {...register('description')}
              rows={4}
              className={cn(
                'w-full resize-y rounded-2xl border bg-white px-4 py-2.5 text-sm text-neutral-900',
                'placeholder:text-neutral-400 focus:outline-none focus:ring-2',
                errors.description
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                  : 'border-neutral-300 focus:border-brand-500 focus:ring-brand-100',
              )}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField htmlFor="city" label={t('newListing.fields.city')}>
              <Select id="city" value={watchedCity}
                onChange={(e) => handleCityChange(e.target.value)}>
                <option value={City.Amman}>{t('cities.Amman')}</option>
                <option value={City.Irbid}>{t('cities.Irbid')}</option>
                <option value={City.Zarqa}>{t('cities.Zarqa')}</option>
              </Select>
            </FormField>
            <FormField htmlFor="neighborhood" label={t('newListing.fields.neighborhood')}
              error={errors.neighborhood && t(errors.neighborhood.message ?? 'errors.field.required')}>
              <Input id="neighborhood" {...register('neighborhood')} invalid={!!errors.neighborhood} />
            </FormField>
          </div>
        </Card>

        {/* ── Location ────────────────────────────────────────────────── */}
        <Card>
          <SectionTitle title={t('newListing.location.title')} hint={t('newListing.location.hint')} />

          <LocationPicker value={pin} onChange={handlePinChange} className="mb-4" />

          <FormField htmlFor="addressDetail" label={t('newListing.fields.addressDetail')}
            hint={t('newListing.fields.addressDetailHint')}
            error={errors.addressDetail && t(errors.addressDetail.message ?? 'errors.field.required')}>
            <Input id="addressDetail" {...register('addressDetail')} invalid={!!errors.addressDetail} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField htmlFor="university" label={t('newListing.fields.nearestUniversity')}>
              <Select id="university" {...register('nearestUniversity')}>
                {(Object.entries(UniversityCodes) as [string, string][]).map(([num, code]) => (
                  <option key={num} value={num}>{t(`universities.${code}`)}</option>
                ))}
              </Select>
            </FormField>
            <FormField htmlFor="distance" label={t('newListing.fields.distanceMinutes')}
              error={errors.distanceMinutes && t(errors.distanceMinutes.message ?? 'errors.field.required')}>
              <Input
                id="distance"
                type="number"
                min={0}
                max={240}
                dir="ltr"
                {...register('distanceMinutes')}
                invalid={!!errors.distanceMinutes}
              />
            </FormField>
          </div>
        </Card>

        {/* ── Pricing & spots ─────────────────────────────────────────── */}
        <Card>
          <SectionTitle title={t('newListing.pricing.title')} hint={t('newListing.pricing.hint')} />
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField htmlFor="fullRent" label={t('newListing.fields.fullRent')}
              error={errors.fullRent && t(errors.fullRent.message ?? 'errors.field.required')}>
              <Input id="fullRent" type="number" min={1} dir="ltr"
                {...register('fullRent')} invalid={!!errors.fullRent} />
            </FormField>
            <FormField htmlFor="totalSpots" label={t('newListing.fields.totalSpots')}
              error={errors.totalSpots && t(errors.totalSpots.message ?? 'errors.field.required')}>
              <Input id="totalSpots" type="number" min={1} max={20} dir="ltr"
                {...register('totalSpots')} invalid={!!errors.totalSpots} />
            </FormField>
            <FormField htmlFor="availableSpots" label={t('newListing.fields.availableSpots')}
              error={errors.availableSpots && t(errors.availableSpots.message ?? 'errors.field.required')}>
              <Input id="availableSpots" type="number" min={0} max={20} dir="ltr"
                {...register('availableSpots')} invalid={!!errors.availableSpots} />
            </FormField>
          </div>
        </Card>

        {/* ── Amenities ───────────────────────────────────────────────── */}
        <Card>
          <SectionTitle title={t('newListing.amenities.title')} hint={t('newListing.amenities.hint')} />
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => {
              const active = amenities.includes(a)
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-medium transition',
                    active
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
                  )}
                >
                  <AmenityIcon type={a} className="h-3.5 w-3.5" />
                  {t(`amenities.${AmenityCodes[a]}`)}
                </button>
              )
            })}
          </div>
        </Card>

        {/* ── House rules ─────────────────────────────────────────────── */}
        <Card>
          <SectionTitle title={t('newListing.rules.title')} hint={t('newListing.rules.hint')} />

          <FormField htmlFor="genderType" label={t('newListing.fields.genderType')}
            hint={t('newListing.fields.genderTypeHint')}>
            <Select id="genderType" {...register('genderType')}>
              <option value={GenderType.MaleOnly}>{t('apartments.gender.0')}</option>
              <option value={GenderType.FemaleOnly}>{t('apartments.gender.1')}</option>
              <option value={GenderType.Mixed}>{t('apartments.gender.2')}</option>
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField htmlFor="smoking" label={t('newListing.fields.smokingRule')}>
              <Select id="smoking" {...register('smokingRule')}>
                <option value={SmokingRule.Yes}>{t('smokingRules.Yes')}</option>
                <option value={SmokingRule.No}>{t('smokingRules.No')}</option>
                <option value={SmokingRule.Outside}>{t('smokingRules.Outside')}</option>
              </Select>
            </FormField>
            <FormField htmlFor="guests" label={t('newListing.fields.guestsRule')}>
              <Select id="guests" {...register('guestsRule')}>
                <option value={GuestsRule.Yes}>{t('guestsRules.Yes')}</option>
                <option value={GuestsRule.No}>{t('guestsRules.No')}</option>
                <option value={GuestsRule.Limited}>{t('guestsRules.Limited')}</option>
              </Select>
            </FormField>
          </div>

          <label className="mt-3 inline-flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              {...register('isFurnished')}
              className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-200"
            />
            {t('newListing.fields.isFurnished')}
          </label>
        </Card>

        {/* ── Submit row ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => navigate('/owner/listings')}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {t('newListing.submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4 space-y-1">
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}
