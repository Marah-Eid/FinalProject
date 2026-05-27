import { http } from '../../lib/http'
import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  User,
} from '../../utils/types'

export const authApi = {
  register: (req: RegisterRequest) =>
    http.post<AuthResponse>('/auth/register', req).then((r) => r.data),

  login: (req: LoginRequest) =>
    http.post<AuthResponse>('/auth/login', req).then((r) => r.data),

  refresh: (refreshToken: string) =>
    http.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  verifyEmail: (token: string) =>
    http
      .post<void>(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((r) => r.data),

  forgotPassword: (req: ForgotPasswordRequest) =>
    http.post<void>('/auth/forgot-password', req).then((r) => r.data),

  resetPassword: (req: ResetPasswordRequest) =>
    http.post<void>('/auth/reset-password', req).then((r) => r.data),

  me: () => http.get<User>('/users/me').then((r) => r.data),
}
