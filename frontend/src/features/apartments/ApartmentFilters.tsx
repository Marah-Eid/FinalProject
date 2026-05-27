import { FilterX } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import {
  AmenityCodes,
  AmenityType,
  type ApartmentListFilters,
  City,
  University,
  UniversityCodes,
} from '../../utils/types'

type Props = {
  value: ApartmentListFilters
  onChange: (next: ApartmentListFilters) => void
  onClear: () => void
}

/**
 * The full filter sidebar for /browse. Stays controlled — every change calls
 * onChange so the page can sync the URL. The brief's "Gender" is intentionally
 * absent here: visibility is enforced server-side based on the student's
 * gender, never via a user-facing filter.
 */
export function ApartmentFilters({ value, onChange, onClear }: Props) {
  const { t } = useTranslation()

  const set = <K extends keyof ApartmentListFilters>(key: K, v: ApartmentListFilters[K]) =>
    onChange({ ...value, [key]: v, page: 1 })

  const toggleAmenity = (a: AmenityType) => {
    const current = value.amenities ?? []
    const next = current.includes(a) ? current.filter((x) => x !== a) : [...current, a]
    onChange({ ...value, amenities: next.length > 0 ? next : undefined, page: 1 })
  }

  const cityValue = value.city === undefined ? '' : String(value.city)
  const uniValue = value.university === undefined ? '' : String(value.university)
  const spotsValue = value.spotsAvailable === undefined ? '' : String(value.spotsAvailable)
  const furnishedValue = value.furnished === undefined ? '' : value.furnished ? 'true' : 'false'

  return (
    <aside className="sticky top-20 self-start rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">{t('browse.filters.title')}</h2>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
        >
          <FilterX className="h-3.5 w-3.5" />
          {t('browse.filters.clear')}
        </button>
      </div>

      <div className="space-y-4">
        <FormField htmlFor="f-city" label={t('browse.filters.city')}>
          <Select id="f-city" value={cityValue} onChange={(e) =>
            set('city', e.target.value === '' ? undefined : (Number(e.target.value) as City))
          }>
            <option value="">{t('browse.filters.any')}</option>
            <option value={City.Amman}>{t('cities.Amman')}</option>
            <option value={City.Irbid}>{t('cities.Irbid')}</option>
            <option value={City.Zarqa}>{t('cities.Zarqa')}</option>
          </Select>
        </FormField>

        <FormField htmlFor="f-neighborhood" label={t('browse.filters.neighborhood')}>
          <Input
            id="f-neighborhood"
            value={value.neighborhood ?? ''}
            onChange={(e) => set('neighborhood', e.target.value || undefined)}
            placeholder={t('browse.filters.neighborhoodPh')}
          />
        </FormField>

        <FormField htmlFor="f-uni" label={t('browse.filters.university')}>
          <Select id="f-uni" value={uniValue} onChange={(e) =>
            set('university', e.target.value === '' ? undefined : (Number(e.target.value) as University))
          }>
            <option value="">{t('browse.filters.any')}</option>
            {(Object.entries(UniversityCodes) as [string, string][]).map(([num, code]) => (
              <option key={num} value={num}>{t(`universities.${code}`)}</option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField htmlFor="f-min" label={t('browse.filters.minPrice')}>
            <Input
              id="f-min"
              type="number"
              min={0}
              dir="ltr"
              value={value.minPrice ?? ''}
              onChange={(e) => set('minPrice', e.target.value === '' ? undefined : Number(e.target.value))}
            />
          </FormField>
          <FormField htmlFor="f-max" label={t('browse.filters.maxPrice')}>
            <Input
              id="f-max"
              type="number"
              min={0}
              dir="ltr"
              value={value.maxPrice ?? ''}
              onChange={(e) => set('maxPrice', e.target.value === '' ? undefined : Number(e.target.value))}
            />
          </FormField>
        </div>

        <FormField htmlFor="f-spots" label={t('browse.filters.spots')}>
          <Select id="f-spots" value={spotsValue} onChange={(e) =>
            set('spotsAvailable', e.target.value === '' ? undefined : Number(e.target.value))
          }>
            <option value="">{t('browse.filters.any')}</option>
            <option value="1">{t('browse.filters.spotsValue', { count: 1 })}</option>
            <option value="2">{t('browse.filters.spotsValue', { count: 2 })}</option>
            <option value="3">{t('browse.filters.spotsValue', { count: 3 })}</option>
            <option value="4">{t('browse.filters.spotsPlus')}</option>
          </Select>
        </FormField>

        <FormField htmlFor="f-furn" label={t('browse.filters.furnished')}>
          <Select id="f-furn" value={furnishedValue} onChange={(e) =>
            set('furnished', e.target.value === '' ? undefined : e.target.value === 'true')
          }>
            <option value="">{t('browse.filters.any')}</option>
            <option value="true">{t('common.yes')}</option>
            <option value="false">{t('common.no')}</option>
          </Select>
        </FormField>

        <FormField htmlFor="f-dist" label={t('browse.filters.maxDistance')}>
          <Input
            id="f-dist"
            type="number"
            min={0}
            max={120}
            dir="ltr"
            value={value.maxDistance ?? ''}
            onChange={(e) => set('maxDistance', e.target.value === '' ? undefined : Number(e.target.value))}
          />
        </FormField>

        <div>
          <p className="mb-2 text-sm font-medium text-neutral-800">{t('browse.filters.amenities')}</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(AmenityCodes) as [string, string][]).map(([num, code]) => {
              const value0 = Number(num) as AmenityType
              const active = value.amenities?.includes(value0) ?? false
              return (
                <button
                  type="button"
                  key={num}
                  onClick={() => toggleAmenity(value0)}
                  aria-pressed={active}
                  className={
                    'rounded-2xl border px-2.5 py-1 text-xs transition ' +
                    (active
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50')
                  }
                >
                  {t(`amenities.${code}`)}
                </button>
              )
            })}
          </div>
        </div>

        <Button variant="secondary" block onClick={onClear}>
          {t('browse.filters.clear')}
        </Button>
      </div>
    </aside>
  )
}
