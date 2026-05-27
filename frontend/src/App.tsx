import { QueryClientProvider } from '@tanstack/react-query'
import { useMemo } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'

import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import { AuthProvider } from './context/AuthContext'
import { AdminLayout } from './features/admin/AdminLayout'
import { createQueryClient } from './lib/queryClient'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminListingsPage } from './pages/AdminListingsPage'
import { AdminReportsPage } from './pages/AdminReportsPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { ApartmentDetailPage } from './pages/ApartmentDetailPage'
import { BrowsePage } from './pages/BrowsePage'
import { DashboardPage } from './pages/DashboardPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { MessagesPage } from './pages/MessagesPage'
import { MyApplicationsPage } from './pages/MyApplicationsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OwnerApplicationsPage } from './pages/OwnerApplicationsPage'
import { OwnerEditListingPage } from './pages/OwnerEditListingPage'
import { OwnerListingPhotosPage } from './pages/OwnerListingPhotosPage'
import { OwnerListingsPage } from './pages/OwnerListingsPage'
import { OwnerNewListingPage } from './pages/OwnerNewListingPage'
import { PaymentHistoryPage } from './pages/PaymentHistoryPage'
import { QuizPage } from './pages/QuizPage'
import { RegisterPage } from './pages/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { UserRole } from './utils/types'

function App() {
  // One QueryClient for the lifetime of the app.
  const queryClient = useMemo(() => createQueryClient(), [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              {/* ── Public ───────────────────────────────────────────── */}
              <Route index element={<LandingPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="verify-email" element={<VerifyEmailPage />} />
              <Route path="browse" element={<BrowsePage />} />
              <Route path="apartments/:id" element={<ApartmentDetailPage />} />

              {/* ── Any authenticated user ───────────────────────────── */}
              <Route element={<ProtectedRoute />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="messages/:conversationId" element={<MessagesPage />} />
                <Route path="payments" element={<PaymentHistoryPage />} />
              </Route>

              {/* ── Student-only ─────────────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRoles={[UserRole.Student]} />}>
                <Route path="quiz" element={<QuizPage />} />
                <Route path="applications/mine" element={<MyApplicationsPage />} />
              </Route>

              {/* ── Owner-only ───────────────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRoles={[UserRole.Owner]} />}>
                <Route path="owner/applications" element={<OwnerApplicationsPage />} />
                <Route path="owner/listings" element={<OwnerListingsPage />} />
                <Route path="owner/listings/new" element={<OwnerNewListingPage />} />
                <Route path="owner/listings/:id/edit" element={<OwnerEditListingPage />} />
                <Route path="owner/listings/:id/photos" element={<OwnerListingPhotosPage />} />
              </Route>

              {/* ── Admin-only ───────────────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRoles={[UserRole.Admin]} />}>
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="listings" element={<AdminListingsPage />} />
                  <Route path="reports" element={<AdminReportsPage />} />
                </Route>
              </Route>

              {/* ── 404 ──────────────────────────────────────────────── */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
