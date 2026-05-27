import { http } from '../../lib/http'
import type {
  ConversationDto,
  MessageDto,
  SendMessageRequest,
} from '../../utils/types'

export const messagesApi = {
  conversations: () =>
    http.get<ConversationDto[]>('/conversations').then((r) => r.data),

  /** Newest first (paginated backwards via `before`); UI reverses for chronological rendering. */
  messages: (conversationId: string, params?: { before?: string; take?: number }) =>
    http
      .get<MessageDto[]>(`/conversations/${conversationId}/messages`, {
        params: { before: params?.before, take: params?.take },
      })
      .then((r) => r.data),

  send: (conversationId: string, req: SendMessageRequest) =>
    http.post<MessageDto>(`/conversations/${conversationId}/messages`, req).then((r) => r.data),

  markRead: (conversationId: string) =>
    http.put<void>(`/conversations/${conversationId}/read`).then((r) => r.data),
}
