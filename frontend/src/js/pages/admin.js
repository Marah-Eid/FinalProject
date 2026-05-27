import { t } from '../i18n.js'
import { api } from '../api.js'
import { escapeHtml } from '../utils.js'

export function adminPage() {
  const html = `
    <div class="container py-4 fade-in" style="max-width:1100px">
      <h1 class="h3 fw-bold mb-1">${t('admin.title')}</h1>
      <p class="text-secondary small mb-4">${t('admin.subtitle')}</p>

      <ul class="nav nav-pills gap-2 mb-4" id="admin-tabs">
        <li class="nav-item"><button class="nav-link active rounded-3" data-tab="dashboard">${t('admin.tabs.dashboard')}</button></li>
        <li class="nav-item"><button class="nav-link rounded-3" data-tab="users">${t('admin.tabs.users')}</button></li>
        <li class="nav-item"><button class="nav-link rounded-3" data-tab="listings">${t('admin.tabs.listings')}</button></li>
        <li class="nav-item"><button class="nav-link rounded-3" data-tab="reports">${t('admin.tabs.reports')}</button></li>
      </ul>

      <div id="admin-content">
        <div class="skeleton" style="height:300px"></div>
      </div>
    </div>
  `

  let currentTab = 'dashboard'

  function mount() {
    loadTab('dashboard')

    document.getElementById('admin-tabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tab]')
      if (!btn) return
      currentTab = btn.dataset.tab
      document.querySelectorAll('#admin-tabs .nav-link').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      loadTab(currentTab)
    })

    document.addEventListener('click', handleActions)
    return () => document.removeEventListener('click', handleActions)
  }

  async function handleActions(e) {
    const banBtn = e.target.closest('[data-ban]')
    const unbanBtn = e.target.closest('[data-unban]')
    const suspendBtn = e.target.closest('[data-suspend]')
    const activateBtn = e.target.closest('[data-activate]')
    const dismissBtn = e.target.closest('[data-dismiss]')
    const resolveBtn = e.target.closest('[data-resolve]')

    if (banBtn) { await doAction(`/admin/users/${banBtn.dataset.ban}/ban`, 'PUT'); loadTab('users') }
    if (unbanBtn) { await doAction(`/admin/users/${unbanBtn.dataset.unban}/unban`, 'PUT'); loadTab('users') }
    if (suspendBtn) { await doAction(`/admin/listings/${suspendBtn.dataset.suspend}/suspend`, 'PUT'); loadTab('listings') }
    if (activateBtn) { await doAction(`/admin/listings/${activateBtn.dataset.activate}/activate`, 'PUT'); loadTab('listings') }
    if (dismissBtn) { await doAction(`/admin/reports/${dismissBtn.dataset.dismiss}/resolve`, 'PUT', { action: 'Dismiss' }); loadTab('reports') }
    if (resolveBtn) { await doAction(`/admin/reports/${resolveBtn.dataset.resolve}/resolve`, 'PUT', { action: 'Resolve' }); loadTab('reports') }
  }

  async function doAction(path, method, body) {
    try {
      if (method === 'PUT') await api.put(path, body ? { body } : undefined)
    } catch (err) {
      const container = document.getElementById('admin-content')
      if (container) {
        const existing = container.querySelector('.admin-action-error')
        if (existing) existing.remove()
        container.insertAdjacentHTML('afterbegin', `<div class="alert alert-danger rounded-3 small admin-action-error">${err.message || t('errors.generic')}</div>`)
      }
    }
  }

  async function loadTab(tab) {
    const container = document.getElementById('admin-content')
    if (!container) return
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>'

    try {
      if (tab === 'dashboard') await renderDashboard(container)
      else if (tab === 'users') await renderUsers(container)
      else if (tab === 'listings') await renderListings(container)
      else if (tab === 'reports') await renderReports(container)
    } catch {
      container.innerHTML = `<div class="text-center py-5"><p class="text-danger small">${t('errors.generic')}</p></div>`
    }
  }

  async function renderDashboard(el) {
    const data = await api.get('/admin/dashboard')
    el.innerHTML = `
      <div class="row g-3 mb-4">
        ${statCard('bi-people', data.totalUsers, t('admin.cards.totalUsers'), 'primary')}
        ${statCard('bi-mortarboard', data.totalStudents, t('admin.cards.totalStudents'), 'primary')}
        ${statCard('bi-person-workspace', data.totalOwners, t('admin.cards.totalOwners'), 'primary')}
        ${statCard('bi-building', data.activeListings, t('admin.cards.activeListings'), 'success')}
        ${statCard('bi-building-x', data.suspendedListings, t('admin.cards.suspendedListings'), 'danger')}
        ${statCard('bi-key', data.activeTenancies, t('admin.cards.activeTenancies'), 'primary')}
        ${statCard('bi-flag', data.pendingReports, t('admin.cards.pendingReports'), 'warning')}
        ${statCard('bi-cash-stack', (data.revenueThisMonth || 0) + ' JOD', t('admin.cards.revenueThisMonth'), 'success')}
      </div>

      ${data.revenueByType?.length > 0 ? `
        <div class="card-dorm p-4">
          <h6 class="fw-bold mb-3">${t('admin.revenue.title')}</h6>
          <p class="text-secondary small mb-3">${t('admin.revenue.allTime', { amount: (data.revenueAllTime || 0) + ' JOD' })}</p>
          ${data.revenueByType.map(r => {
            const max = Math.max(...data.revenueByType.map(x => x.total || 0)) || 1
            const pct = ((r.total || 0) / max * 100)
            return `
              <div class="mb-2">
                <div class="d-flex justify-content-between small mb-1">
                  <span class="fw-medium">${t('payments.types.' + (r.type || r.paymentType || 'MatchCommission'))}</span>
                  <span class="text-secondary">${r.total || 0} JOD · ${t('admin.revenue.txnCount', { count: r.count || 0 })}</span>
                </div>
                <div class="progress" style="height:8px;border-radius:4px">
                  <div class="progress-bar" style="width:${pct}%;background:linear-gradient(135deg,#6366F1,#8B5CF6)"></div>
                </div>
              </div>
            `
          }).join('')}
        </div>
      ` : ''}
    `
  }

  let allUsers = []

  async function renderUsers(el) {
    const users = await api.get('/admin/users')
    allUsers = users.items || users || []

    el.innerHTML = `
      <div class="d-flex gap-2 mb-3">
        <input type="text" class="form-control form-control-sm rounded-3" placeholder="${t('admin.users.searchPlaceholder')}" id="admin-user-search" style="max-width:300px" />
      </div>
      <div id="admin-users-list"></div>
    `
    renderUsersList(allUsers, el.querySelector('#admin-users-list'))

    document.getElementById('admin-user-search')?.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase()
      const filtered = q ? allUsers.filter(u => u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)) : allUsers
      renderUsersList(filtered, document.getElementById('admin-users-list'))
    })
  }

  function renderUsersList(items, container) {
    if (!container) return
    const roleLabels = { 0: t('roles.student'), 1: t('roles.owner'), 2: t('roles.admin') }

    if (items.length === 0) {
      container.innerHTML = emptyState(t('admin.users.empty.title'), t('admin.users.empty.description'))
      return
    }

    container.innerHTML = `
      <div class="d-flex flex-column gap-2">
        ${items.map(u => `
          <div class="card-dorm p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-3">
                <div class="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary" style="width:40px;height:40px"><i class="bi bi-person"></i></div>
                <div>
                  <p class="fw-semibold mb-0">${escapeHtml(u.fullName)} ${u.isBanned ? `<span class="badge bg-danger bg-opacity-10 text-danger ms-1" style="font-size:0.65rem">${t('admin.users.banned')}</span>` : ''}</p>
                  <p class="text-secondary small mb-0">${escapeHtml(u.email)} · ${roleLabels[u.role] || ''}</p>
                </div>
              </div>
              <div>
                ${u.role !== 2 ? (u.isBanned
                  ? `<button class="btn btn-sm btn-outline-success" data-unban="${u.id}">${t('admin.users.unban')}</button>`
                  : `<button class="btn btn-sm btn-outline-danger" data-ban="${u.id}">${t('admin.users.ban')}</button>`)
                : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `
  }

  let allListings = []

  async function renderListings(el) {
    const listings = await api.get('/admin/listings')
    allListings = listings.items || listings || []

    el.innerHTML = `
      <div class="d-flex gap-2 mb-3">
        <input type="text" class="form-control form-control-sm rounded-3" placeholder="${t('admin.listings.searchPlaceholder')}" id="admin-listing-search" style="max-width:300px" />
      </div>
      <div id="admin-listings-list"></div>
    `
    renderListingsList(allListings, el.querySelector('#admin-listings-list'))

    document.getElementById('admin-listing-search')?.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase()
      const filtered = q ? allListings.filter(l => l.title?.toLowerCase().includes(q) || l.ownerName?.toLowerCase().includes(q)) : allListings
      renderListingsList(filtered, document.getElementById('admin-listings-list'))
    })
  }

  function renderListingsList(items, container) {
    if (!container) return

    if (items.length === 0) {
      container.innerHTML = emptyState(t('admin.listings.empty.title'), t('admin.listings.empty.description'))
      return
    }

    container.innerHTML = `
      <div class="d-flex flex-column gap-2">
        ${items.map(l => `
          <div class="card-dorm p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <p class="fw-semibold mb-0">
                  ${escapeHtml(l.title)}
                  ${l.isSuspended ? `<span class="badge bg-danger bg-opacity-10 text-danger ms-1" style="font-size:0.65rem">${t('admin.listings.suspendedBadge')}</span>` : `<span class="badge bg-success bg-opacity-10 text-success ms-1" style="font-size:0.65rem">${t('admin.listings.activeBadge')}</span>`}
                  ${l.pendingReportsCount > 0 ? `<span class="badge bg-warning bg-opacity-10 text-warning ms-1" style="font-size:0.65rem">${t('admin.listings.pendingReports', { count: l.pendingReportsCount })}</span>` : ''}
                </p>
                <p class="text-secondary small mb-0">${escapeHtml(l.ownerName) || ''} · ${escapeHtml(l.neighborhood) || ''}</p>
              </div>
              <div class="d-flex gap-2">
                <a href="#/apartments/${l.id}" class="btn btn-sm btn-outline-secondary">${t('admin.listings.view')}</a>
                ${l.isSuspended
                  ? `<button class="btn btn-sm btn-outline-success" data-activate="${l.id}">${t('admin.listings.activate')}</button>`
                  : `<button class="btn btn-sm btn-outline-danger" data-suspend="${l.id}">${t('admin.listings.suspend')}</button>`}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `
  }

  async function renderReports(el) {
    const reports = await api.get('/admin/reports')
    const items = reports.items || reports || []
    const reportStatusLabels = { 0: t('admin.reports.statuses.Pending'), 1: t('admin.reports.statuses.Resolved'), 2: t('admin.reports.statuses.Dismissed') }
    const reportReasonLabels = { 0: t('admin.reports.reasons.FakeListing'), 1: t('admin.reports.reasons.MisleadingPhotos'), 2: t('admin.reports.reasons.Scam'), 3: t('admin.reports.reasons.Inappropriate'), 4: t('admin.reports.reasons.Other') }

    el.innerHTML = `
      ${items.length === 0 ? emptyState(t('admin.reports.empty.title'), t('admin.reports.empty.description')) : `
        <div class="d-flex flex-column gap-2">
          ${items.map(r => `
            <div class="card-dorm p-3">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <p class="fw-semibold mb-1">${reportReasonLabels[r.reason] || r.reason || '—'}</p>
                  <p class="text-secondary small mb-0">
                    ${r.reporterName ? t('admin.reports.reportedBy', { name: r.reporterName }) : ''}
                    ${r.apartmentTitle ? ` · ${r.apartmentTitle}` : ''}
                  </p>
                  ${r.description ? `<p class="small text-secondary mb-0 mt-1">${escapeHtml(r.description)}</p>` : ''}
                </div>
                <div class="d-flex gap-2 align-items-center">
                  <span class="badge rounded-pill bg-${r.status === 0 ? 'warning' : r.status === 1 ? 'success' : 'secondary'} bg-opacity-10 text-${r.status === 0 ? 'warning' : r.status === 1 ? 'success' : 'secondary'}">${reportStatusLabels[r.status] || ''}</span>
                  ${r.status === 0 ? `
                    <button class="btn btn-sm btn-outline-secondary" data-dismiss="${r.id}">${t('admin.reports.dismiss')}</button>
                    <button class="btn btn-sm btn-outline-danger" data-resolve="${r.id}">${t('admin.reports.resolve')}</button>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `
  }

  return { html, mount }
}

function statCard(icon, value, label, color) {
  return `
    <div class="col-6 col-lg-3">
      <div class="stat-card">
        <div class="stat-icon bg-${color} bg-opacity-10 text-${color}"><i class="bi ${icon}"></i></div>
        <p class="text-secondary small text-uppercase mb-1 fw-semibold" style="font-size:0.7rem;letter-spacing:0.05em">${label}</p>
        <p class="h4 fw-bold mb-0">${value}</p>
      </div>
    </div>
  `
}

function emptyState(title, desc) {
  return `
    <div class="text-center py-5">
      <h5 class="fw-bold">${title}</h5>
      <p class="text-secondary small">${desc}</p>
    </div>
  `
}
