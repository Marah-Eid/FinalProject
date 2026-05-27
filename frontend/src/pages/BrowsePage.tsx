import { useQuery } from '@tanstack/react-query'
import { LayoutGrid, MapIcon, SearchX } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { ApartmentMap, type ApartmentMarker } from '../components/maps/ApartmentMap'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Pagination } from '../components/ui/Pagination'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { ApartmentCard } from '../features/apartments/ApartmentCard'
import { ApartmentFilters } from '../features/apartments/ApartmentFilters'
import { apartmentsApi } from '../services/api/apartments'
import { extractApiError } from '../lib/http'
import {
  AmenityType,
  type ApartmentListFilters,
  City,
  University,
} from '../utils/types'

const PAGE_SIZE = 12

/**
 * Browse page. Filters live in the URL so a copy-paste link reproduces the
 * same view. The query key includes the full filter set so TanStack Query
 * naturally caches per-search.
 */
export function BrowsePage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<'list' | 'map'>('list')

  // ── URL ↔ filters ──────────────────────────────────────────────────────
  const filters = useMemo<ApartmentListFilters>(() => ({
    city:           parseNumberEnum(params.get('city'),       Object.values(City)) as City | undefined,
    neighborhood:   params.get('neighborhood') ?? undefined,
    university:     parseNumberEnum(params.get('university'), Object.values(University)) as University | undefined,
    minPrice:       parseNumber(params.get('minPrice')),
    maxPrice:       parseNumber(params.get('maxPrice')),
    spotsAvailable: parseNumber(params.get('spotsAvailable')),
    furnished:      parseBool(params.get('furnished')),
    amenities:      parseAmenities(params.getAll('amenities')),
    maxDistance:    parseNumber(params.get('maxDistance')),
    sort:           (params.get('sort') as ApartmentListFilters['sort']) ?? 'newest',
    page:           parseNumber(params.get('page')) ?? 1,
    pageSize:       PAGE_SIZE,
  }), [params])

  const setFilters = useCallback((next: ApartmentListFilters) => {
    const url = new URLSearchParams()
    const writeIf = (key: string, value: unknown) => {
      if (value === undefined || value === null || value === '') return
      if (typeof value === 'boolean') url.set(key, value ? 'true' : 'false')
      else if (Array.isArray(value)) for (const v of value) url.append(key, String(v))
      else url.set(key, String(value))
    }
    writeIf('city', next.city)
    writeIf('neighborhood', next.neighborhood)
    writeIf('university', next.university)
    writeIf('minPrice', next.minPrice)
    writeIf('maxPrice', next.maxPrice)
    writeIf('spotsAvailable', next.spotsAvailable)
    writeIf('furnished', next.furnished)
    writeIf('amenities', next.amenities)
    writeIf('maxDistance', next.maxDistance)
    if (next.sort && next.sort !== 'newest') url.set('sort', next.sort)
    if ((next.page ?? 1) > 1) url.set('page', String(next.page))
    setParams(url, { replace: true })
  }, [setParams])

  const clearAll = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams])

  // ── Data ───────────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: ['apartments', filters],
    queryFn: () => apartmentsApi.list(filters),
    placeholderData: (prev) => prev,
  })

  // Client-side highest_match sort. The backend leaves the page in newest+featured
  // order regardless of sort=highest_match (sorting by computed score requires a
  // pre-computed column or a heavier query). We re-sort the materialized page
  // in memory so the user still sees their best matches first.
  const sortedItems = useMemo(() => {
    if (!query.data) return []
    if (filters.sort !== 'highest_match') return query.data.items
    return [...query.data.items].sort((a, b) => {
      const sa = a.compatibilityScore ?? -1
      const sb = b.compatibilityScore ?? -1
      return sb - sa  // descending
    })
  }, [query.data, filters.sort])

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
          {t('browse.title')}
        </h1>
        <p className="text-sm text-neutral-600">{t('browse.subtitle')}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <ApartmentFilters value={filters} onChange={setFilters} onClear={clearAll} />

        <section className="min-w-0">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-2xl border border-neutral-200 bg-white p-1">
              <ViewToggleButton
                active={view === 'list'}
                onClick={() => setView('list')}
                icon={<LayoutGrid className="h-4 w-4" />}
                label={t('browse.view.list')}
              />
              <ViewToggleButton
                active={view === 'map'}
                onClick={() => setView('map')}
                icon={<MapIcon className="h-4 w-4" />}
                label={t('browse.view.map')}
              />
            </div>
            <div className="inline-flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-neutral-600">{t('browse.sort.label')}</label>
              <Select
                id="sort"
                value={filters.sort ?? 'newest'}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value as ApartmentListFilters['sort'], page: 1 })}
                className="!w-auto !py-1.5 text-sm"
              >
                <option value="newest">{t('browse.sort.newest')}</option>
                <option value="price_asc">{t('browse.sort.price_asc')}</option>
                <option value="price_desc">{t('browse.sort.price_desc')}</option>
                <option value="highest_match">{t('browse.sort.highest_match')}</option>
              </Select>
            </div>
          </div>

          {/* States */}
          {query.isError ? (
            <Alert tone="error" title={t('errors.generic')}>
              {extractApiError(query.error).message}
            </Alert>
          ) : query.isLoading ? (
            <CardGridSkeleton />
          ) : (query.data?.items.length ?? 0) === 0 ? (
            <Card padded>
              <EmptyState
                icon={<SearchX className="h-7 w-7" />}
                title={t('browse.empty.title')}
                description={t('browse.empty.description')}
                action={<Button variant="secondary" onClick={clearAll}>{t('browse.filters.clear')}</Button>}
              />
            </Card>
          ) : view === 'list' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sortedItems.map((apt) => (
                <ApartmentCard key={apt.id} apartment={apt} />
              ))}
            </div>
          ) : (
            <MapView items={sortedItems} />
          )}

          {/* Pagination */}
          {query.data && query.data.totalPages > 1 && (
            <Pagination
              page={query.data.page}
              totalPages={query.data.totalPages}
              total={query.data.total}
              onChange={(p) => setFilters({ ...filters, page: p })}
            />
          )}
        </section>
      </div>
    </div>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────────

function parseNumber(raw: string | null): number | undefined {
  if (raw === null || raw === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

function parseBool(raw: string | null): boolean | undefined {
  if (raw === null || raw === '') return undefined
  if (raw === 'true') return true
  if (raw === 'false') return false
  return undefined
}

function parseNumberEnum(raw: string | null, allowed: readonly number[]): number | undefined {
  const n = parseNumber(raw)
  if (n === undefined) return undefined
  return allowed.includes(n) ? n : undefined
}

function parseAmenities(raw: string[]): AmenityType[] | undefined {
  const list = raw
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 9) as AmenityType[]
  return list.length > 0 ? list : undefined
}

// ── sub-components ───────────────────────────────────────────────────────────

function ViewToggleButton({
  active, onClick, icon, label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-sm font-medium transition ' +
        (active ? 'bg-brand-500 text-white' : 'text-neutral-600 hover:bg-neutral-100')
      }
    >
      {icon} {label}
    </button>
  )
}

function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <Skeleton className="aspect-[5/3] rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="mt-3 h-6 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MapView({ items }: { items: import('../utils/types').ApartmentListItem[] }) {
  // Phase 4 note: the list DTO doesn't expose lat/lng (Phase 5 will surface them).
  // We fall back to a tiny neighborhood centroid table — better than nothing,
  // and the apartment detail page has the real pin.
  const markers: ApartmentMarker[] = items.map((a) => ({
    id: a.id,
    position: neighborhoodCentroid(a.neighborhood) ?? [31.95, 35.93],
    title: a.title,
  }))
  const center: [number, number] = markers[0]?.position ?? [31.95, 35.93]  // Amman default
  return <ApartmentMap center={center} markers={markers} height={520} />
}

/**
 * Lightweight lookup so the map view has *something* to draw in Phase 4.
 * Phase 5/6 will surface real lat/lng on the list DTO.
 */
function neighborhoodCentroid(name: string): [number, number] | undefined {
  const key = name.toLowerCase()
  const map: Record<string, [number, number]> = {
    'aljubaiha': [32.0166, 35.8696],
    'sweileh':   [32.0227, 35.8412],
    'tla al-ali':[32.0010, 35.8666],
    'shmaisani': [31.9747, 35.8772],
    'jabal amman': [31.9512, 35.9239],
  }
  return map[key]
}
