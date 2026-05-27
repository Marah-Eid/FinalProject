import { t } from '../i18n.js'
import { api } from '../api.js'

export function ownerListingsPage() {
  const html = `
    <div class="container py-4 fade-in" style="max-width:900px">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 fw-bold mb-1">${t('myListings.title')}</h1>
          <p class="text-secondary small mb-0">${t('myListings.subtitle')}</p>
        </div>
        <a href="#/owner/listings/new" class="btn btn-brand"><i class="bi bi-plus-lg me-2"></i>${t('myListings.newListing')}</a>
      </div>
      <div id="listings-container">
        <div class="d-flex flex-column gap-3">
          <div class="skeleton" style="height:100px"></div>
          <div class="skeleton" style="height:100px"></div>
        </div>
      </div>
    </div>
  `

  function mount() {
    loadListings()
  }

  async function loadListings() {
    const container = document.getElementById('listings-container')
    if (!container) return

    try {
      const data = await api.get('/apartments/mine')
      const listings = data.items || data || []

      if (listings.length === 0) {
        container.innerHTML = `
          <div class="text-center py-5">
            <div class="icon-box icon-box-brand mx-auto mb-3" style="width:64px;height:64px;font-size:1.5rem"><i class="bi bi-building"></i></div>
            <h5 class="fw-bold">${t('myListings.empty.title')}</h5>
            <p class="text-secondary small mb-3">${t('myListings.empty.description')}</p>
            <a href="#/owner/listings/new" class="btn btn-brand">${t('myListings.empty.cta')}</a>
          </div>
        `
        return
      }

      container.innerHTML = `
        <div class="d-flex flex-column gap-3">
          ${listings.map(apt => listingCard(apt)).join('')}
        </div>
      `
    } catch {
      container.innerHTML = `<div class="text-center py-5"><p class="text-danger small">${t('errors.generic')}</p></div>`
    }
  }

  return { html, mount }
}

function listingCard(apt) {
  const photo = apt.photos?.[0]
  const photoUrl = photo ? `/uploads/${photo.filePath || photo}` : ''
  const genderLabels = { 0: t('apartments.gender.0'), 1: t('apartments.gender.1'), 2: t('apartments.gender.2') }

  return `
    <div class="card-dorm p-3">
      <div class="d-flex gap-3">
        <div class="flex-shrink-0 rounded-3 overflow-hidden" style="width:80px;height:80px;background:#f1f5f9">
          ${photoUrl ? `<img src="${photoUrl}" alt="${apt.title}" class="w-100 h-100" style="object-fit:cover" />` : `<div class="d-flex align-items-center justify-content-center h-100"><i class="bi bi-building text-secondary"></i></div>`}
        </div>
        <div class="flex-grow-1 min-w-0">
          <h6 class="fw-bold text-truncate mb-1">${apt.title}</h6>
          <p class="text-secondary small mb-1">${apt.neighborhood || ''}${apt.city != null ? ', ' + t('cities.' + ['Amman','Irbid','Zarqa'][apt.city]) : ''}</p>
          <div class="d-flex gap-2">
            <span class="badge rounded-pill bg-light text-secondary border" style="font-size:0.7rem">${genderLabels[apt.genderType] || ''}</span>
            <span class="badge rounded-pill bg-light text-secondary border" style="font-size:0.7rem">${t('apartments.spotsAvailable', { available: apt.availableSpots, total: apt.totalSpots })}</span>
            <span class="badge rounded-pill bg-primary bg-opacity-10 text-primary" style="font-size:0.7rem">${apt.fullRent} JOD</span>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2 flex-shrink-0">
          <a href="#/apartments/${apt.id}" class="btn btn-sm btn-outline-secondary">${t('myListings.view')}</a>
        </div>
      </div>
    </div>
  `
}
