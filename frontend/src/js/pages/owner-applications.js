import { t } from '../i18n.js'
import { api } from '../api.js'
import { escapeHtml } from '../utils.js'

const STATUS_COLORS = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'secondary' }
const STATUS_KEYS = { 0: 'Pending', 1: 'Accepted', 2: 'Rejected', 3: 'Withdrawn' }

export function ownerApplicationsPage() {
  let currentFilter = 'all'

  const html = `
    <div class="container py-4 fade-in" style="max-width:900px">
      <h1 class="h3 fw-bold mb-1">${t('ownerApps.title')}</h1>
      <p class="text-secondary small mb-4">${t('ownerApps.subtitle')}</p>

      <div class="d-flex gap-2 mb-4" id="filter-tabs">
        <button class="btn btn-sm btn-brand" data-filter="all">${t('ownerApps.filter.all')}</button>
        <button class="btn btn-sm btn-outline-secondary" data-filter="0">${t('ownerApps.filter.pending')}</button>
        <button class="btn btn-sm btn-outline-secondary" data-filter="1">${t('ownerApps.filter.accepted')}</button>
        <button class="btn btn-sm btn-outline-secondary" data-filter="2">${t('ownerApps.filter.rejected')}</button>
      </div>

      <div id="owner-apps-list">
        <div class="d-flex flex-column gap-3">
          <div class="skeleton" style="height:120px"></div>
          <div class="skeleton" style="height:120px"></div>
        </div>
      </div>
    </div>
  `

  let allApps = []

  function mount() {
    loadApps()

    document.getElementById('filter-tabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]')
      if (!btn) return
      currentFilter = btn.dataset.filter
      document.querySelectorAll('#filter-tabs button').forEach(b => {
        b.className = b === btn ? 'btn btn-sm btn-brand' : 'btn btn-sm btn-outline-secondary'
      })
      renderApps()
    })

    document.addEventListener('click', handleAction)
    return () => document.removeEventListener('click', handleAction)
  }

  async function handleAction(e) {
    const acceptBtn = e.target.closest('[data-accept]')
    const rejectBtn = e.target.closest('[data-reject]')

    if (acceptBtn) {
      acceptBtn.disabled = true
      acceptBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>'
      try {
        await api.put(`/applications/${acceptBtn.dataset.accept}/accept`)
        loadApps()
      } catch { acceptBtn.disabled = false; acceptBtn.textContent = t('ownerApps.accept') }
    }

    if (rejectBtn) {
      rejectBtn.disabled = true
      rejectBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>'
      try {
        await api.put(`/applications/${rejectBtn.dataset.reject}/reject`)
        loadApps()
      } catch { rejectBtn.disabled = false; rejectBtn.textContent = t('ownerApps.reject') }
    }
  }

  async function loadApps() {
    try {
      allApps = await api.get('/applications/received')
      renderApps()
    } catch {
      document.getElementById('owner-apps-list').innerHTML = `<div class="text-center py-5"><p class="text-danger small">${t('errors.generic')}</p></div>`
    }
  }

  function renderApps() {
    const container = document.getElementById('owner-apps-list')
    if (!container) return

    let filtered = allApps
    if (currentFilter !== 'all') {
      filtered = allApps.filter(a => a.status === parseInt(currentFilter))
    }

    if (filtered.length === 0) {
      const emptyKey = currentFilter === 'all' ? 'all' : STATUS_KEYS[currentFilter]?.toLowerCase() || 'all'
      container.innerHTML = `
        <div class="text-center py-5">
          <div class="icon-box icon-box-brand mx-auto mb-3" style="width:64px;height:64px;font-size:1.5rem"><i class="bi bi-file-text"></i></div>
          <h5 class="fw-bold">${t('ownerApps.empty.title')}</h5>
          <p class="text-secondary small">${t('ownerApps.empty.' + emptyKey)}</p>
        </div>
      `
      return
    }

    container.innerHTML = `<div class="d-flex flex-column gap-3">${filtered.map(appCard).join('')}</div>`
  }

  function appCard(app) {
    const statusColor = STATUS_COLORS[app.status] || 'secondary'
    const statusKey = STATUS_KEYS[app.status] || 'Pending'
    const dateStr = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : ''

    return `
      <div class="card-dorm p-4">
        <div class="d-flex flex-column flex-sm-row justify-content-between gap-3">
          <div class="d-flex gap-3 flex-grow-1 min-w-0">
            <div class="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary" style="width:48px;height:48px;min-width:48px">
              <i class="bi bi-person"></i>
            </div>
            <div class="min-w-0">
              <p class="fw-bold mb-1">${app.studentName || '—'}</p>
              <p class="text-secondary small mb-1">
                ${app.apartmentTitle ? `<i class="bi bi-building me-1"></i>${app.apartmentTitle}` : ''}
                ${dateStr ? ` · ${dateStr}` : ''}
              </p>
              ${app.compatibilityScore != null ? `<span class="badge rounded-pill bg-primary bg-opacity-10 text-primary" style="font-size:0.7rem">${app.compatibilityScore}% ${t('match.label')}</span>` : ''}
              ${app.studentUniversity != null ? `<span class="badge rounded-pill bg-light text-secondary border ms-1" style="font-size:0.7rem">${t('universities.' + ['JU','GJU','PSUT','YU','HU','MU','ZU','BAU','JUST','AAU'][app.studentUniversity])}</span>` : ''}
            </div>
          </div>
          <div class="d-flex align-items-center gap-2 flex-shrink-0">
            <span class="badge rounded-pill bg-${statusColor} bg-opacity-10 text-${statusColor} badge-status px-3 py-2">${t('myApps.status.' + statusKey)}</span>
            ${app.status === 0 ? `
              <button class="btn btn-sm btn-success" data-accept="${app.id}">${t('ownerApps.accept')}</button>
              <button class="btn btn-sm btn-outline-danger" data-reject="${app.id}">${t('ownerApps.reject')}</button>
            ` : ''}
            <a href="#/messages" class="btn btn-sm btn-outline-secondary"><i class="bi bi-chat-dots"></i></a>
          </div>
        </div>
        ${app.message ? `<div class="mt-3 p-3 rounded-3" style="background:#f8fafc"><p class="small text-secondary mb-0">"${escapeHtml(app.message)}"</p></div>` : ''}
      </div>
    `
  }

  return { html, mount }
}
