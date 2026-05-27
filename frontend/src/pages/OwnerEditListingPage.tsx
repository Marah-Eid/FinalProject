import { useQuery } from '@tanstack/react-query'
import { Camera, ExternalLink, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { apartmentsApi } from '../services/api/apartments'

/**
 * Phase 8.5 placeholder — owners can manage photos and view the live listing.
 * Full edit-everything-in-one-form lands in a later polish phase.
 */
export function OwnerEditListingPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()

  const query = useQuery({
    queryKey: ['apartment', id],
    queryFn: () => apartmentsApi.getById(id!),
    enabled: !!id,
  })

  if (!id) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
          {t('editListing.title')}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">{t('editListing.subtitle')}</p>
      </header>

      {query.isLoading ? (
        <Card><Skeleton className="h-32 w-full" /></Card>
      ) : !query.data ? (
        <Alert tone="error">{t('apartments.notFoundTitle')}</Alert>
      ) : (
        <Card>
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">
              {t('editListing.currentTitle')}
            </p>
            <p className="text-lg font-semibold text-neutral-900">{query.data.title}</p>
          </div>

          <Alert tone="info" className="mb-4">
            {t('editListing.placeholderNotice')}
          </Alert>

          <div className="grid gap-2 sm:grid-cols-2">
            <Link to={`/owner/listings/${id}/photos`}>
              <Button variant="primary" block leftIcon={<Camera className="h-4 w-4" />}>
                {t('editListing.managePhotos')}
              </Button>
            </Link>
            <Link to={`/apartments/${id}`}>
              <Button variant="secondary" block leftIcon={<ExternalLink className="h-4 w-4" />}>
                {t('editListing.viewListing')}
              </Button>
            </Link>
          </div>

          <p className="mt-4 inline-flex items-center gap-1 text-xs text-neutral-500">
            <Pencil className="h-3 w-3" />
            {t('editListing.fullEditComing')}
          </p>
        </Card>
      )}
    </div>
  )
}
