import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, ImagePlus, X } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { extractApiError } from '../lib/http'
import { apartmentsApi } from '../services/api/apartments'
import { cn } from '../utils/cn'

const MAX_PHOTOS = 10
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const API_ORIGIN = (() => {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'
  if (base.startsWith('http')) return base.replace(/\/api\/?$/, '')
  return 'http://localhost:5080'
})()

export function OwnerListingPhotosPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [serverError, setServerError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['apartment', id],
    queryFn: () => apartmentsApi.getById(id!),
    enabled: !!id,
  })

  const uploadOne = useMutation({
    mutationFn: (file: File) => apartmentsApi.uploadPhoto(id!, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['apartment', id] }),
  })

  const deletePhoto = useMutation({
    mutationFn: (photoId: string) => apartmentsApi.deletePhoto(id!, photoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['apartment', id] }),
  })

  if (!id) return null

  const handleFiles = async (files: FileList | File[]) => {
    setServerError(null)
    const photos = query.data?.photos ?? []
    const remaining = MAX_PHOTOS - photos.length

    const valid: File[] = []
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setServerError(t('photos.errors.badType', { name: file.name }))
        continue
      }
      if (valid.length >= remaining) {
        setServerError(t('photos.errors.tooMany', { max: MAX_PHOTOS }))
        break
      }
      valid.push(file)
    }

    setUploadingCount((c) => c + valid.length)
    for (const file of valid) {
      try {
        await uploadOne.mutateAsync(file)
      } catch (e) {
        setServerError(extractApiError(e).message)
        break
      } finally {
        setUploadingCount((c) => c - 1)
      }
    }
  }

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void handleFiles(e.target.files)
    // Reset so picking the same file again still fires onChange.
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer?.files) void handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{t('photos.title')}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t('photos.subtitle')}</p>
      </header>

      {serverError && <Alert tone="error" className="mb-4">{serverError}</Alert>}

      <Card>
        {query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !query.data ? (
          <Alert tone="error">{t('apartments.notFoundTitle')}</Alert>
        ) : (
          <>
            <p className="mb-3 text-sm text-neutral-600">
              <strong className="text-neutral-900">{query.data.title}</strong>
              <span className="ms-2 text-xs text-neutral-400">
                {t('photos.count', {
                  count: query.data.photos.length,
                  max: MAX_PHOTOS,
                })}
              </span>
            </p>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition',
                isDragOver
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-neutral-200 bg-neutral-50 hover:border-brand-300 hover:bg-brand-50/40',
              )}
              role="button"
              tabIndex={0}
            >
              <ImagePlus className="h-8 w-8 text-brand-500" />
              <p className="text-sm font-medium text-neutral-800">{t('photos.dropzone.title')}</p>
              <p className="text-xs text-neutral-500">{t('photos.dropzone.hint')}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                multiple
                onChange={onFileInput}
                className="hidden"
              />
            </div>

            {/* Photo grid */}
            {(query.data.photos.length > 0 || uploadingCount > 0) && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {query.data.photos.map((p) => (
                  <div
                    key={p.id}
                    className="group relative aspect-square overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100"
                  >
                    <img
                      src={new URL(p.photoUrl, API_ORIGIN).toString()}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => deletePhoto.mutate(p.id)}
                      disabled={deletePhoto.isPending && deletePhoto.variables === p.id}
                      className="absolute end-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-2xl bg-white/90 text-rose-600 opacity-0 shadow transition group-hover:opacity-100 hover:bg-white"
                      aria-label={t('photos.delete')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {Array.from({ length: uploadingCount }).map((_, i) => (
                  <Skeleton key={`up-${i}`} className="aspect-square" />
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Link to="/owner/listings">
                <Button variant="ghost">{t('photos.backToListings')}</Button>
              </Link>
              <Link to={`/apartments/${id}`}>
                <Button variant="primary" leftIcon={<Camera className="h-4 w-4" />}>
                  {t('photos.viewListing')}
                </Button>
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
