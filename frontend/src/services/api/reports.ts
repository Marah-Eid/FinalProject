import { http } from '../../lib/http'
import type { ReportDto, SubmitReportRequest } from '../../utils/types'

export const reportsApi = {
  submit: (req: SubmitReportRequest) =>
    http.post<ReportDto>('/reports', req).then((r) => r.data),
}
