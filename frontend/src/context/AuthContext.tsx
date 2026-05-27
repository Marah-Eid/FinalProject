import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { configureHttp } from '../lib/http'
import { storage } from '../lib/storage'
import { authApi } from '../services/api/auth'
import type { LoginRequest, RegisterRequest, User } from '../utils/types'

// What consumers see.
type AuthContextValue = {
  user: User | null
  /** True until the on-mount hydration finishes. Use this to gate guards/redirects. */
  isLoading: boolean
  login: (req: LoginRequest) => Promise<User>
  register: (req: RegisterRequest) => Promise<User>
  logout: () => void
  /** Re-fetch /me. Useful after a profile update. */
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Mutable ref so interceptors see the current tokens without needing a
  // re-render. The state in localStorage is the canonical store; this just
  // makes reads in interceptors synchronous and avoids stale closures.
  const tokensRef = useRef<{ access: string | null; refresh: string | null }>({
    access: null,
    refresh: null,
  })

  // ── one-time wiring ─────────────────────────────────────────────────────
  useEffect(() => {
    // Hydrate from storage.
    const cachedAccess = storage.getAccessToken()
    const cachedRefresh = storage.getRefreshToken()
    const cachedUser = storage.getUser<User>()
    tokensRef.current = { access: cachedAccess, refresh: cachedRefresh }
    if (cachedUser) setUser(cachedUser)

    // Wire the Axios interceptors. configureHttp is idempotent (just replaces
    // callbacks), so it's safe to call again on hot reload.
    configureHttp({
      getAccessToken: () => tokensRef.current.access,
      getRefreshToken: () => tokensRef.current.refresh,
      onTokensRefreshed: ({ accessToken, refreshToken }) => {
        tokensRef.current = { access: accessToken, refresh: refreshToken }
        storage.setTokens(accessToken, refreshToken)
      },
      onUnauthorized: () => {
        tokensRef.current = { access: null, refresh: null }
        storage.clear()
        setUser(null)
      },
    })

    // If we had a token, validate it against /me. The interceptor will
    // refresh-or-logout on its own if the access token is expired.
    if (cachedAccess) {
      authApi
        .me()
        .then((u) => {
          setUser(u)
          storage.setUser(u)
        })
        .catch(() => {
          // If the refresh path also fails the onUnauthorized callback fires;
          // we just settle the loading flag here.
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── actions ─────────────────────────────────────────────────────────────
  const persistAuth = useCallback(
    (accessToken: string, refreshToken: string, freshUser: User) => {
      tokensRef.current = { access: accessToken, refresh: refreshToken }
      storage.setTokens(accessToken, refreshToken)
      storage.setUser(freshUser)
      setUser(freshUser)
    },
    [],
  )

  const login = useCallback<AuthContextValue['login']>(
    async (req) => {
      const res = await authApi.login(req)
      persistAuth(res.accessToken, res.refreshToken, res.user)
      return res.user
    },
    [persistAuth],
  )

  const register = useCallback<AuthContextValue['register']>(
    async (req) => {
      const res = await authApi.register(req)
      persistAuth(res.accessToken, res.refreshToken, res.user)
      return res.user
    },
    [persistAuth],
  )

  const logout = useCallback(() => {
    tokensRef.current = { access: null, refresh: null }
    storage.clear()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const u = await authApi.me()
    setUser(u)
    storage.setUser(u)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
