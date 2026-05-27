import { http } from '../../lib/http'
import type {
  AdminApartmentDto,
  AdminDashboardDto,
  AdminUserDto,
  ReportDto,
  ResolveReportRequest,
  UserRole,
} from '../../utils/types'

export const adminApi = {
  dashboard: () => http.get<AdminDashboardDto>('/admin/dashboard').then((r) => r.data),

  users: (params: { search?: string; role?: UserRole; take?: number } = {}) =>
    http.get<AdminUserDto[]>('/admin/users', { params }).then((r) => r.data),

  banUser: (id: string) => http.put<void>(`/admin/users/${id}/ban`).then((r) => r.data),
  unbanUser: (id: string) => http.put<void>(`/admin/users/${id}/unban`).then((r) => r.data),

  listings: (params: { search?: string; suspended?: boolean; take?: number } = {}) =>
    http.get<AdminApartmentDto[]>('/admin/listings', { params }).then((r) => r.data),

  suspendListing: (id: string) =>
    http.put<void>(`/admin/listings/${id}/suspend`).then((r) => r.data),
  activateListing: (id: string) =>
    http.put<void>(`/admin/listings/${id}/activate`).then((r) => r.data),

  reports: (params: { pendingOnly?: boolean; take?: number } = {}) =>
    http.get<ReportDto[]>('/admin/reports', { params }).then((r) => r.data),

  resolveReport: (id: string, req: ResolveReportRequest) =>
    http.put<void>(`/admin/reports/${id}/resolve`, req).then((r) => r.data),
}
