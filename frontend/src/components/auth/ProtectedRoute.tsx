import { Navigate, Outlet, useLocation } from 'react-router'

import { Spinner } from '../ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../utils/types'

type Props = {
  /** Optional whitelist of roles permitted to render the outlet. */
  allowedRoles?: UserRole[]
}

/**
 * Gate component. Until auth hydration finishes, shows a centred spinner so we
 * never flash the login page for a logged-in user reloading a protected route.
 * After hydration: redirects to /login (preserving location) if no user, or
 * to / if the user's role isn't allowed.
 */
export function ProtectedRoute({ allowedRoles }: Props) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
