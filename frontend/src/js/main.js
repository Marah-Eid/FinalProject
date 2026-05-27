import { initLang } from './i18n.js'
import { initAuth } from './auth.js'
import { addRoute, initRouter } from './router.js'
import { renderNavbar } from './components/navbar.js'
import { renderFooter } from './components/footer.js'

// Pages
import { landingPage } from './pages/landing.js'
import { loginPage } from './pages/login.js'
import { registerPage } from './pages/register.js'
import { dashboardPage } from './pages/dashboard.js'
import { browsePage } from './pages/browse.js'
import { apartmentDetailPage } from './pages/apartment-detail.js'
import { quizPage } from './pages/quiz.js'
import { messagesPage } from './pages/messages.js'
import { myApplicationsPage } from './pages/my-applications.js'
import { ownerListingsPage } from './pages/owner-listings.js'
import { ownerApplicationsPage } from './pages/owner-applications.js'
import { ownerNewListingPage } from './pages/owner-new-listing.js'
import { paymentsPage } from './pages/payments.js'
import { adminPage } from './pages/admin.js'

// Public routes
addRoute('/', () => landingPage())
addRoute('/login', () => loginPage(), { guest: true })
addRoute('/register', () => registerPage(), { guest: true })
addRoute('/browse', () => browsePage())
addRoute('/apartments/:id', (p) => apartmentDetailPage(p.id))

// Student routes
addRoute('/dashboard', () => dashboardPage(), { auth: true })
addRoute('/quiz', () => quizPage(), { auth: true, roles: [0] })
addRoute('/applications/mine', () => myApplicationsPage(), { auth: true, roles: [0] })

// Messaging
addRoute('/messages', () => messagesPage(), { auth: true })
addRoute('/messages/:id', (p) => messagesPage(p.id), { auth: true })

// Owner routes
addRoute('/owner/listings', () => ownerListingsPage(), { auth: true, roles: [1] })
addRoute('/owner/listings/new', () => ownerNewListingPage(), { auth: true, roles: [1] })
addRoute('/owner/applications', () => ownerApplicationsPage(), { auth: true, roles: [1] })

// Payments (all roles)
addRoute('/payments', () => paymentsPage(), { auth: true })

// Admin
addRoute('/admin', () => adminPage(), { auth: true, roles: [2] })

async function boot() {
  initLang()
  await initAuth()
  renderNavbar()
  renderFooter()
  initRouter()
}

boot()
