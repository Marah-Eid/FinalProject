// Dashboard — dispatches by role: student (stats + quiz CTA + recent apps), owner (shortcut cards), admin (redirects to /admin)
import { t } from '../i18n.js'
import { getUser } from '../auth.js'
import { api } from '../api.js'

export function dashboardPage() {
  const user = getUser()
  if (!user) return `<div class="container py-5 text-center"><p>${t('errors.generic')}</p></div>`

  if (user.role === 2) {
    window.location.hash = '#/admin'
    return ''
  }

  if (user.role === 1) return ownerDashboard(user)
  return studentDashboard(user)
}

function studentDashboard(user) {
  const firstName = user.fullName.split(' ')[0]

  const html = `
    <div class="container py-4 fade-in" style="max-width:960px">
      <h1 class="h3 fw-bold">${t('dashboard.title')}</h1>
      <p class="text-secondary small mb-4">${t('dashboard.welcome', { name: firstName })}</p>

      ${!user.isEmailVerified ? `
        <div class="alert alert-warning rounded-3 d-flex align-items-center gap-2 mb-4">
          <i class="bi bi-exclamation-triangle"></i>
          ${t('dashboard.emailUnverifiedHint')}
        </div>
      ` : ''}

      <!-- Stats -->
      <div class="row g-3 mb-4" id="dash-stats">
        ${statSkeleton()}${statSkeleton()}${statSkeleton()}${statSkeleton()}
      </div>

      <!-- Quiz CTA (shown if incomplete) -->
      <div id="quiz-cta"></div>

      <div class="row g-4">
        <!-- Recent apps -->
        <div class="col-lg-8">
          <div class="card-dorm">
            <div class="d-flex justify-content-between align-items-center border-bottom p-3 px-4">
              <h6 class="mb-0 fw-bold">${t('dashboard.recentApps.title')}</h6>
              <a href="#/applications/mine" class="small text-decoration-none fw-semibold" style="color:var(--brand-600)">${t('dashboard.viewAll')}</a>
            </div>
            <div id="recent-apps" class="p-3">
              <div class="skeleton mb-2" style="height:48px"></div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-lg-4">
          <div class="card-dorm p-4 mb-3">
            <h6 class="fw-bold mb-3">${t('dashboard.badges.title')}</h6>
            <div class="d-flex flex-wrap gap-2">
              ${user.isUniversityVerified ? `<span class="badge rounded-pill bg-success bg-opacity-10 text-success px-3 py-2"><i class="bi bi-patch-check me-1"></i>${t('badges.verifiedStudent')}</span>` : ''}
              <span class="badge rounded-pill ${user.isEmailVerified ? 'bg-primary bg-opacity-10 text-primary' : 'bg-secondary bg-opacity-10 text-secondary'} px-3 py-2">
                ${user.isEmailVerified ? t('badges.emailVerified') : t('badges.emailUnverified')}
              </span>
            </div>
          </div>

          <div class="card-dorm p-4">
            <h6 class="fw-bold mb-3">${t('dashboard.shortcuts.title')}</h6>
            <div class="d-flex flex-column gap-1">
              ${shortcut('#/browse', 'bi-building', t('nav.browse'))}
              ${shortcut('#/messages', 'bi-chat-dots', t('dashboard.shortcuts.messages'))}
              ${shortcut('#/applications/mine', 'bi-file-text', t('nav.myApplications'))}
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  function mount() {
    loadStudentData()
  }

  return { html, mount }
}

async function loadStudentData() {
  try {
    const [quizData, apps, convos] = await Promise.all([
      api.get('/quiz/my-answers').catch(() => ({ quizCompleted: false })),
      api.get('/applications/mine').catch(() => []),
      api.get('/conversations').catch(() => []),
    ])

    const pending = apps.filter(a => a.status === 0).length
    const accepted = apps.filter(a => a.status === 1).length
    const unread = convos.reduce((s, c) => s + c.unreadCount, 0)
    const quizDone = quizData.quizCompleted

    document.getElementById('dash-stats').innerHTML = `
      <div class="col-6 col-lg-3">${statCard('bi-stars', quizDone ? t('dashboard.cards.quiz.done') : t('dashboard.cards.quiz.pending'), t('dashboard.cards.quiz.label'), quizDone ? 'success' : 'warning')}</div>
      <div class="col-6 col-lg-3">${statCard('bi-file-text', pending, t('dashboard.cards.appsPending'), 'primary')}</div>
      <div class="col-6 col-lg-3">${statCard('bi-trophy', accepted, t('dashboard.cards.appsAccepted'), 'success')}</div>
      <div class="col-6 col-lg-3">${statCard('bi-chat-dots', unread, t('dashboard.cards.unreadMessages'), unread > 0 ? 'primary' : 'secondary')}</div>
    `

    if (!quizDone) {
      document.getElementById('quiz-cta').innerHTML = `
        <div class="card-dorm p-4 mb-4" style="border-color:var(--brand-200);background:linear-gradient(135deg,var(--brand-50),#fff)">
          <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
            <div>
              <h6 class="fw-bold mb-1">${t('dashboard.quizCta.title')}</h6>
              <p class="text-secondary small mb-0">${t('dashboard.quizCta.text')}</p>
            </div>
            <a href="#/quiz" class="btn btn-brand">${t('dashboard.quizCta.button')} <i class="bi bi-arrow-left ms-1"></i></a>
          </div>
        </div>
      `
    }

    const recentEl = document.getElementById('recent-apps')
    if (apps.length === 0) {
      recentEl.innerHTML = `
        <div class="text-center py-4">
          <p class="text-secondary small">${t('dashboard.recentApps.empty')}</p>
          <a href="#/browse" class="btn btn-sm btn-outline-brand">${t('myApps.empty.cta')}</a>
        </div>
      `
    } else {
      recentEl.innerHTML = apps.slice(0, 5).map(app => {
        const statusColors = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'secondary' }
        const statusKeys = { 0: 'Pending', 1: 'Accepted', 2: 'Rejected', 3: 'Withdrawn' }
        return `
          <a href="#/apartments/${app.apartmentId}" class="d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none" style="transition:background 0.15s" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
            <div class="d-flex align-items-center justify-content-center rounded-3 bg-light" style="width:40px;height:40px;min-width:40px">
              <i class="bi bi-building text-secondary"></i>
            </div>
            <div class="flex-grow-1 min-w-0">
              <p class="mb-0 small fw-semibold text-dark text-truncate">${app.apartmentTitle}</p>
              <p class="mb-0 small text-secondary">${t('dashboard.recentApps.matchSnapshot', { value: app.compatibilityScore })}</p>
            </div>
            <span class="badge rounded-pill bg-${statusColors[app.status]} bg-opacity-10 text-${statusColors[app.status]} badge-status px-2 py-1">
              ${t('myApps.status.' + statusKeys[app.status])}
            </span>
          </a>
        `
      }).join('')
    }
  } catch (err) {
    console.error('Dashboard load error:', err)
  }
}

function ownerDashboard(user) {
  const firstName = user.fullName.split(' ')[0]
  return `
    <div class="container py-4 fade-in" style="max-width:960px">
      <h1 class="h3 fw-bold">${t('dashboard.ownerTitle')}</h1>
      <p class="text-secondary small mb-4">${t('dashboard.welcome', { name: firstName })}</p>
      <div class="row g-3">
        <div class="col-sm-6 col-lg-3">${shortcutCard('#/owner/listings', 'bi-building', t('nav.myListings'))}</div>
        <div class="col-sm-6 col-lg-3">${shortcutCard('#/owner/applications', 'bi-file-text', t('nav.ownerApplications'))}</div>
        <div class="col-sm-6 col-lg-3">${shortcutCard('#/messages', 'bi-chat-dots', t('nav.messages'))}</div>
        <div class="col-sm-6 col-lg-3">${shortcutCard('#/payments', 'bi-credit-card', t('nav.payments'))}</div>
      </div>
    </div>
  `
}

function statCard(icon, value, label, color) {
  return `
    <div class="stat-card">
      <div class="stat-icon bg-${color} bg-opacity-10 text-${color}"><i class="bi ${icon}"></i></div>
      <p class="text-secondary small text-uppercase mb-1 fw-semibold" style="font-size:0.7rem;letter-spacing:0.05em">${label}</p>
      <p class="h4 fw-bold mb-0">${value}</p>
    </div>
  `
}

function statSkeleton() {
  return '<div class="col-6 col-lg-3"><div class="skeleton" style="height:100px"></div></div>'
}

function shortcut(href, icon, label) {
  return `
    <a href="${href}" class="d-flex align-items-center justify-content-between rounded-3 px-3 py-2 text-decoration-none text-secondary" style="transition:background 0.15s" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
      <span class="d-flex align-items-center gap-2"><i class="bi ${icon}"></i> ${label}</span>
      <i class="bi bi-chevron-left small" style="opacity:0.4"></i>
    </a>
  `
}

function shortcutCard(href, icon, label) {
  return `
    <a href="${href}" class="card-dorm card-dorm-lift p-4 d-flex flex-column align-items-center text-center text-decoration-none">
      <div class="icon-box icon-box-brand mb-3"><i class="bi ${icon}"></i></div>
      <span class="fw-semibold text-dark">${label}</span>
    </a>
  `
}
