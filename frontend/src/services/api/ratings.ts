import { http } from '../../lib/http'
import type { RatingDto, SubmitRatingRequest } from '../../utils/types'

export const ratingsApi = {
  submit: (req: SubmitRatingRequest) =>
    http.post<RatingDto>('/ratings', req).then((r) => r.data),

  forUser: (userId: string) =>
    http.get<RatingDto[]>(`/users/${userId}/ratings`).then((r) => r.data),

  endTenancy: (tenancyId: string) =>
    http.put<void>(`/tenancies/${tenancyId}/end`).then((r) => r.data),
}
