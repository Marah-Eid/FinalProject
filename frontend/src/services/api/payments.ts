import { http } from '../../lib/http'
import type { CheckoutRequest, PaymentDto } from '../../utils/types'

export const paymentsApi = {
  checkout: (req: CheckoutRequest) =>
    http.post<PaymentDto>('/payments/checkout', req).then((r) => r.data),

  history: () => http.get<PaymentDto[]>('/payments/history').then((r) => r.data),
}
