import { t, getLang, setLang } from '../i18n.js'
import { getUser, logout, onAuthChange } from '../auth.js'
import { navigate } from '../router.js'

export function renderNavbar() {
  update()
  onAuthChange(() => update())
}

function update() {
  const el = document.getElementById('navbar')
  const user = getUser()
  const lang = getLang()

  el.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-glass sticky-top">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2 fw-bold" href="#/">
          <span class="d-inline-flex align-items-center justify-content-center rounded-3 text-white fw-bold"
                style="width:36px;height:36px;background:linear-gradient(135deg,#6366F1,#8B5CF6);font-size:0.875rem;box-shadow:0 4px 10px rgba(99,102,241,0.3)">D</span>
          <span class="text-gradient">${t('app.name')}</span>
        </a>

        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navContent"
                aria-controls="navContent" aria-expanded="false">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navContent">
          <ul class="navbar-nav me-auto ms-lg-3 gap-1">
            <li class="nav-item">
              <a class="nav-link rounded-3 px-3" href="#/browse">${t('nav.browse')}</a>
            </li>
            ${user ? `
              <li class="nav-item">
                <a class="nav-link rounded-3 px-3" href="#/dashboard">${t('nav.dashboard')}</a>
              </li>
              <li class="nav-item">
                <a class="nav-link rounded-3 px-3" href="#/messages">${t('nav.messages')}</a>
              </li>
            ` : ''}
          </ul>

          <div class="d-flex align-items-center gap-2 mt-3 mt-lg-0">
            <!-- Language toggle -->
            <div class="d-flex align-items-center gap-1 border rounded-3 p-1">
              <i class="bi bi-globe2 text-secondary ms-2" style="font-size:0.875rem"></i>
              <button class="lang-btn ${lang === 'ar' ? 'active' : ''}" onclick="window.__setLang('ar')">${t('nav.arabic')}</button>
              <button class="lang-btn ${lang === 'en' ? 'active' : ''}" onclick="window.__setLang('en')">${t('nav.english')}</button>
            </div>

            ${user ? userMenu(user) : authLinks()}
          </div>
        </div>
      </div>
    </nav>
  `
}

function authLinks() {
  return `
    <a href="#/login" class="btn btn-sm btn-outline-brand">${t('nav.login')}</a>
    <a href="#/register" class="btn btn-sm btn-brand">${t('nav.register')}</a>
  `
}

function userMenu(user) {
  const firstName = user.fullName.split(' ')[0]
  return `
    <div class="dropdown">
      <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 rounded-3"
              data-bs-toggle="dropdown" aria-expanded="false">
        <i class="bi bi-person-circle"></i>
        <span class="text-truncate" style="max-width:100px">${firstName}</span>
      </button>
      <ul class="dropdown-menu dropdown-menu-end mt-2 rounded-3 shadow-lg border-0 p-1" style="min-width:200px">
        <li><a class="dropdown-item rounded-2 py-2" href="#/dashboard"><i class="bi bi-person me-2 text-secondary"></i>${t('nav.myAccount')}</a></li>
        ${user.role === 0 ? `
          <li><a class="dropdown-item rounded-2 py-2" href="#/applications/mine"><i class="bi bi-file-text me-2 text-secondary"></i>${t('nav.myApplications')}</a></li>
        ` : ''}
        ${user.role === 1 ? `
          <li><a class="dropdown-item rounded-2 py-2" href="#/owner/listings"><i class="bi bi-building me-2 text-secondary"></i>${t('nav.myListings')}</a></li>
          <li><a class="dropdown-item rounded-2 py-2" href="#/owner/applications"><i class="bi bi-file-text me-2 text-secondary"></i>${t('nav.ownerApplications')}</a></li>
        ` : ''}
        ${user.role === 2 ? `
          <li><a class="dropdown-item rounded-2 py-2" href="#/admin"><i class="bi bi-shield me-2 text-secondary"></i>${t('nav.adminPanel')}</a></li>
        ` : ''}
        <li><a class="dropdown-item rounded-2 py-2" href="#/payments"><i class="bi bi-credit-card me-2 text-secondary"></i>${t('nav.payments')}</a></li>
        <li><hr class="dropdown-divider my-1"></li>
        <li><button class="dropdown-item rounded-2 py-2 text-danger" id="logout-btn"><i class="bi bi-box-arrow-right me-2"></i>${t('nav.logout')}</button></li>
      </ul>
    </div>
  `
}

// Global handlers
window.__setLang = (lang) => {
  setLang(lang)
  update()
  navigate()
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'logout-btn' || e.target.closest('#logout-btn')) {
    logout()
  }
})
