import { t } from '../i18n.js'
import { api } from '../api.js'

const STATUS_COLORS = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'secondary' }
const STATUS_KEYS = { 0: 'Pending', 1: 'Accepted', 2: 'Rejected', 3: 'Withdrawn' }

export function myApplicationsPage() {
  const html = `
    <div class="container py-4 fade-in" style="max-width:800px">
      <h1 class="h3 fw-bold mb-1">${t('myApps.title')}</h1>
      <p class="text-secondary small mb-4">${t('myApps.subtitle')}</p>

      <div id="my-apps-list">
        <div class="d-flex flex-column gap-3">
          ${skeletons(3)}
        </div>
      </div>
    </div>
  `

  function mount() {
    loadApplications()

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }

  async function handleClick(e) {
    const btn = e.target.closest('[data-withdraw]')
    if (!btn) return
    const appId = btn.dataset.withdraw
    btn.disabled = true
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>'
    try {
      await api.put(`/applications/${appId}/withdraw`)
      loadApplications()
    } catch (err) {
      btn.disabled = false
      btn.textContent = t('myApps.withdraw')
    }
  }

  async function loadApplications() {
    const container = document.getElementById('my-apps-list')
    if (!container) return

    try {
      const apps = await api.get('/applications/mine')

      if (!apps || apps.length === 0) {
        container.innerHTML = `
          <div class="text-center py-5">
            <div class="icon-box icon-box-brand mx-auto mb-3" style="width:64px;height:64px;font-size:1.5rem"><i class="bi bi-file-text"></i></div>
            <h5 class="fw-bold">${t('myApps.empty.title')}</h5>
            <p class="text-secondary small mb-3">${t('myApps.empty.description')}</p>
            <a href="#/browse" class="btn btn-brand">${t('myApps.empty.cta')}</a>
          </div>
        `
        return
      }

      container.innerHTML = `
        <div class="d-flex flex-column gap-3">
          ${apps.map(app => applicationCard(app)).join('')}
        </div>
      `
    } catch (err) {
      container.innerHTML = `<div class="text-center py-5"><p class="text-danger small">${t('errors.generic')}</p></div>`
    }
  }

  return { html, mount }
}

function applicationCard(app) {
  const statusColor = STATUS_COLORS[app.status] || 'secondary'
  const statusKey = STATUS_KEYS[app.status] || 'Pending'
  const appliedDate = app.appliedAt || app.createdAt
  const dateStr = appliedDate ? new Date(appliedDate).toLocaleDateString() : ''

  return `
    <div class="card-dorm p-4">
      <div class="d-flex flex-column flex-sm-row justify-content-between gap-3">
        <div class="d-flex gap-3 flex-grow-1 min-w-0">
          <div class="d-flex align-items-center justify-content-center rounded-3 bg-light" style="width:50px;height:50px;min-width:50px">
            <i class="bi bi-building text-secondary" style="font-size:1.25rem"></i>
          </div>
          <div class="min-w-0">
            <a href="#/apartments/${app.apartmentId}" class="fw-bold text-dark text-decoration-none text-truncate d-block">${app.apartmentTitle || t('common.loading')}</a>
            <p class="text-secondary small mb-1">${dateStr ? t('myApps.appliedOn', { date: dateStr }) : ''}</p>
            ${app.compatibilityScore != null ? `<p class="text-secondary small mb-0">${t('myApps.compatibilitySnapshot', { value: app.compatibilityScore })}</p>` : ''}
          </div>
        </div>
        <div class="d-flex align-items-center gap-2 flex-shrink-0">
          <span class="badge rounded-pill bg-${statusColor} bg-opacity-10 text-${statusColor} badge-status px-3 py-2">
            ${t('myApps.status.' + statusKey)}
          </span>
          ${app.status === 0 ? `
            <button class="btn btn-sm btn-outline-danger" data-withdraw="${app.id}">${t('myApps.withdraw')}</button>
          ` : ''}
        </div>
      </div>
      ${app.message ? `<div class="mt-3 p-3 rounded-3" style="background:#f8fafc"><p class="small text-secondary mb-0">${app.message}</p></div>` : ''}
    </div>
  `
}

function skeletons(n) {
  return Array(n).fill('').map(() => `<div class="skeleton" style="height:100px"></div>`).join('')
}
