// Typed wrappers around localStorage. SSR-safe (returns null if no window).

const KEY = {
  access: 'dorm:access-token',
  refresh: 'dorm:refresh-token',
  user: 'dorm:user',
} as const

export const storage = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(KEY.access)
  },
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(KEY.refresh)
  },
  getUser<T>(): T | null {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(KEY.user)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  },
  setTokens(access: string, refresh: string): void {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(KEY.access, access)
    window.localStorage.setItem(KEY.refresh, refresh)
  },
  setUser<T>(user: T): void {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(KEY.user, JSON.stringify(user))
  },
  clear(): void {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(KEY.access)
    window.localStorage.removeItem(KEY.refresh)
    window.localStorage.removeItem(KEY.user)
  },
}
