import { http } from '../../lib/http'
import type { NotificationListResponse } from '../../utils/types'

export const notificationsApi = {
  list: (take = 30) =>
    http
      .get<NotificationListResponse>('/notifications', { params: { take } })
      .then((r) => r.data),

  markRead: (notificationId: string) =>
    http.put<void>(`/notifications/${notificationId}/read`).then((r) => r.data),

  markAllRead: () =>
    http.put<void>('/notifications/read-all').then((r) => r.data),
}
