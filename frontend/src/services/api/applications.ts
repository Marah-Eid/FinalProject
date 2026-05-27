import { http } from '../../lib/http'
import type {
  ApplicationDto,
  ApplicationReceivedDto,
  ApplyRequest,
} from '../../utils/types'

export const applicationsApi = {
  // ── Student ────────────────────────────────────────────────────────────
  apply: (apartmentId: string, req: ApplyRequest) =>
    http.post<ApplicationDto>(`/apartments/${apartmentId}/apply`, req).then((r) => r.data),

  mine: () => http.get<ApplicationDto[]>('/applications/mine').then((r) => r.data),

  withdraw: (applicationId: string) =>
    http.delete<void>(`/applications/${applicationId}`).then((r) => r.data),

  // ── Owner ──────────────────────────────────────────────────────────────
  received: () =>
    http.get<ApplicationReceivedDto[]>('/applications/received').then((r) => r.data),

  accept: (applicationId: string) =>
    http.put<ApplicationDto>(`/applications/${applicationId}/accept`).then((r) => r.data),

  reject: (applicationId: string) =>
    http.put<ApplicationDto>(`/applications/${applicationId}/reject`).then((r) => r.data),
}
