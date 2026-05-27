import { Navigate } from 'react-router'

import { useAuth } from '../context/AuthContext'
import { UserRole } from '../utils/types'
import { OwnerDashboardPage } from './OwnerDashboardPage'
import { StudentDashboardPage } from './StudentDashboardPage'

/**
 * /dashboard dispatcher — routes by role.
 * Admin users are redirected to /admin so the dashboard link in the navbar
 * lands them on the right page.
 */
export function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null  // ProtectedRoute handles the redirect; this just satisfies TS

  if (user.role === UserRole.Admin) return <Navigate to="/admin" replace />
  if (user.role === UserRole.Owner) return <OwnerDashboardPage />
  return <StudentDashboardPage />
}
