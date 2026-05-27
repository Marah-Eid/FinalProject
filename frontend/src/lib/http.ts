import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

import type { ApiErrorEnvelope, AuthResponse } from '../utils/types'

// Augment axios's per-request config so we can mark a request as "already
// retried after a 401" and avoid an infinite refresh loop.
type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

export const http = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// ── auth callbacks ────────────────────────────────────────────────────────
// AuthContext registers these once on mount. We don't reach into the React
// tree from here.
type Listeners = {
  getAccessToken?: () => string | null
  getRefreshToken?: () => string | null
  onTokensRefreshed?: (tokens: { accessToken: string; refreshToken: string }) => void
  onUnauthorized?: () => void
}
const listeners: Listeners = {}

export function configureHttp(opts: Listeners): void {
  Object.assign(listeners, opts)
}

// ── request interceptor: attach Bearer ────────────────────────────────────
http.interceptors.request.use((config) => {
  const token = listeners.getAccessToken?.()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── response interceptor: refresh-on-401, retry once ──────────────────────
let pendingRefresh: Promise<string | null> | null = null

async function tryRefresh(): Promise<string | null> {
  if (pendingRefresh) return pendingRefresh

  pendingRefresh = (async () => {
    try {
      const refreshToken = listeners.getRefreshToken?.()
      if (!refreshToken) return null

      // Use a bare axios call so we don't recurse through our own interceptor.
      const { data } = await axios.post<AuthResponse>(
        `${baseURL.replace(/\/$/, '')}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      )
      listeners.onTokensRefreshed?.({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      })
      return data.accessToken
    } catch {
      return null
    } finally {
      pendingRefresh = null
    }
  })()

  return pendingRefresh
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiErrorEnvelope>) => {
    const original = error.config as RetryableConfig | undefined

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      // Don't try to refresh on the refresh endpoint itself.
      !(original.url ?? '').includes('/auth/refresh')
    ) {
      original._retry = true
      const newAccess = await tryRefresh()
      if (newAccess) {
        // `headers` is always present on InternalAxiosRequestConfig in modern axios.
        original.headers.Authorization = `Bearer ${newAccess}`
        return http(original)
      }
      listeners.onUnauthorized?.()
    }

    return Promise.reject(error)
  },
)

// ── helpers ──────────────────────────────────────────────────────────────
/** Pull a human-readable message + per-field details out of an axios error. */
export function extractApiError(err: unknown): {
  message: string
  details?: Record<string, string[]>
  code?: string
} {
  if (axios.isAxiosError<ApiErrorEnvelope>(err)) {
    if (err.response?.data?.error) {
      const { code, message, details } = err.response.data.error
      return { code, message, details }
    }
    if (err.code === 'ERR_NETWORK') {
      return { code: 'network', message: 'errors.network' }
    }
  }
  return { message: 'errors.generic' }
}
