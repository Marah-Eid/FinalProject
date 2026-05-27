import { http } from '../../lib/http'
import type {
  ApartmentDetail,
  ApartmentListFilters,
  ApartmentListItem,
  ApartmentPhotoDto,
  CompatibilityBreakdown,
  CreateApartmentRequest,
  PaginatedResult,
  UpdateApartmentRequest,
} from '../../utils/types'

function toQueryParams(filters: ApartmentListFilters): Record<string, unknown> {
  const params: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length > 0) params[key] = value
    } else {
      params[key] = value
    }
  }
  return params
}

export const apartmentsApi = {
  list: (filters: ApartmentListFilters = {}) =>
    http
      .get<PaginatedResult<ApartmentListItem>>('/apartments', {
        params: toQueryParams(filters),
        // axios serializes arrays as `?amenities=0&amenities=1` by default — matches the backend's IFromQuery binding.
        paramsSerializer: { indexes: null },
      })
      .then((r) => r.data),

  /** Owner-only: every listing the caller owns (active/inactive/suspended). */
  mine: () => http.get<ApartmentListItem[]>('/apartments/mine').then((r) => r.data),

  getById: (id: string) =>
    http.get<ApartmentDetail>(`/apartments/${id}`).then((r) => r.data),

  getCompatibility: (id: string) =>
    http.get<CompatibilityBreakdown>(`/apartments/${id}/compatibility`).then((r) => r.data),

  create: (req: CreateApartmentRequest) =>
    http.post<ApartmentDetail>('/apartments', req).then((r) => r.data),

  update: (id: string, req: UpdateApartmentRequest) =>
    http.put<ApartmentDetail>(`/apartments/${id}`, req).then((r) => r.data),

  delete: (id: string) =>
    http.delete<void>(`/apartments/${id}`).then((r) => r.data),

  uploadPhoto: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return http
      .post<ApartmentPhotoDto>(`/apartments/${id}/photos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  deletePhoto: (apartmentId: string, photoId: string) =>
    http.delete<void>(`/apartments/${apartmentId}/photos/${photoId}`).then((r) => r.data),
}
