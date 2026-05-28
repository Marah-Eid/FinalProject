// Browse page — apartment listing with filters (city, university, price, amenities), sort, pagination, and list/map toggle
import { t } from '../i18n.js'
import { api } from '../api.js'
import { getUser } from '../auth.js'

const CITIES = [
  { value: 0, key: 'Amman' },
  { value: 1, key: 'Irbid' },
  { value: 2, key: 'Zarqa' },
]

const UNIVERSITIES = ['JU','GJU','PSUT','YU','HU','MU','ZU','BAU','JUST','AAU']

const AMENITIES = ['WiFi','AC','Heating','WashingMachine','Parking','Furnished','Elevator','Balcony','Kitchen','PrivateBathroom']

export function browsePage() {
  const html = `
    <div class="container py-4 fade-in" style="max-width:1200px">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h1 class="h3 fw-bold mb-1">${t('browse.title')}</h1>
          <p class="text-secondary small mb-0">${t('browse.subtitle')}</p>
        </div>
        <div class="d-flex gap-2 align-items-center">
          <select class="form-select form-select-sm rounded-3" id="sort-select" style="width:auto">
            <option value="newest">${t('browse.sort.newest')}</option>
            <option value="price_asc">${t('browse.sort.price_asc')}</option>
            <option value="price_desc">${t('browse.sort.price_desc')}</option>
            <option value="highest_match">${t('browse.sort.highest_match')}</option>
          </select>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary active" id="view-list"><i class="bi bi-list-ul"></i></button>
            <button class="btn btn-outline-secondary" id="view-map"><i class="bi bi-map"></i></button>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <!-- Filters sidebar -->
        <div class="col-lg-3">
          <div class="card-dorm p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="fw-bold mb-0">${t('browse.filters.title')}</h6>
              <button class="btn btn-sm btn-link text-decoration-none p-0" id="clear-filters" style="color:var(--brand-600)">${t('browse.filters.clear')}</button>
            </div>

            <div class="mb-3">
              <label class="form-label small fw-medium">${t('browse.filters.city')}</label>
              <select class="form-select form-select-sm rounded-3" id="f-city">
                <option value="">${t('browse.filters.any')}</option>
                ${CITIES.map(c => `<option value="${c.value}">${t('cities.' + c.key)}</option>`).join('')}
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label small fw-medium">${t('browse.filters.neighborhood')}</label>
              <input type="text" class="form-control form-control-sm rounded-3" id="f-neighborhood" placeholder="${t('browse.filters.neighborhoodPh')}" />
            </div>

            <div class="mb-3">
              <label class="form-label small fw-medium">${t('browse.filters.university')}</label>
              <select class="form-select form-select-sm rounded-3" id="f-university">
                <option value="">${t('browse.filters.any')}</option>
                ${UNIVERSITIES.map((u, i) => `<option value="${i}">${t('universities.' + u)}</option>`).join('')}
              </select>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-6">
                <label class="form-label small fw-medium">${t('browse.filters.minPrice')}</label>
                <input type="number" class="form-control form-control-sm rounded-3" id="f-minPrice" min="0" />
              </div>
              <div class="col-6">
                <label class="form-label small fw-medium">${t('browse.filters.maxPrice')}</label>
                <input type="number" class="form-control form-control-sm rounded-3" id="f-maxPrice" min="0" />
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label small fw-medium">${t('browse.filters.spots')}</label>
              <select class="form-select form-select-sm rounded-3" id="f-spots">
                <option value="">${t('browse.filters.any')}</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">${t('browse.filters.spotsPlus')}</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label small fw-medium">${t('browse.filters.maxDistance')}</label>
              <input type="number" class="form-control form-control-sm rounded-3" id="f-maxDistance" min="1" placeholder="15" />
            </div>

            <div class="form-check mb-3">
              <input type="checkbox" class="form-check-input" id="f-furnished" />
              <label class="form-check-label small fw-medium" for="f-furnished">${t('browse.filters.furnished')}</label>
            </div>

            <div class="mb-2">
              <label class="form-label small fw-medium">${t('browse.filters.amenities')}</label>
              <div class="d-flex flex-wrap gap-1">
                ${AMENITIES.map(a => `
                  <label class="badge rounded-pill bg-light text-secondary border px-2 py-1 amenity-chip" style="cursor:pointer;font-weight:500;font-size:0.75rem">
                    <input type="checkbox" class="d-none" value="${a}" name="amenity" />
                    ${t('amenities.' + a)}
                  </label>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div class="col-lg-9">
          <div id="browse-list">
            <div class="row g-3" id="apartments-grid">
              ${skeletonCards(6)}
            </div>
            <div id="pagination-area" class="mt-4"></div>
          </div>
          <div id="browse-map" class="d-none" style="height:500px;border-radius:1rem;overflow:hidden"></div>
        </div>
      </div>
    </div>
  `

  let currentPage = 1
  let mapInstance = null

  function mount() {
    loadApartments()

    document.getElementById('sort-select').addEventListener('change', () => { currentPage = 1; loadApartments() })
    document.getElementById('clear-filters').addEventListener('click', clearFilters)

    const filterEls = ['f-city', 'f-neighborhood', 'f-university', 'f-minPrice', 'f-maxPrice', 'f-spots', 'f-maxDistance', 'f-furnished']
    filterEls.forEach(id => {
      const el = document.getElementById(id)
      el.addEventListener('change', () => { currentPage = 1; loadApartments() })
    })

    document.querySelectorAll('input[name="amenity"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        e.target.closest('.amenity-chip').classList.toggle('bg-primary', e.target.checked)
        e.target.closest('.amenity-chip').classList.toggle('bg-opacity-10', e.target.checked)
        e.target.closest('.amenity-chip').classList.toggle('text-primary', e.target.checked)
        e.target.closest('.amenity-chip').classList.toggle('bg-light', !e.target.checked)
        e.target.closest('.amenity-chip').classList.toggle('text-secondary', !e.target.checked)
        currentPage = 1
        loadApartments()
      })
    })

    document.getElementById('view-list').addEventListener('click', () => {
      document.getElementById('browse-list').classList.remove('d-none')
      document.getElementById('browse-map').classList.add('d-none')
      document.getElementById('view-list').classList.add('active')
      document.getElementById('view-map').classList.remove('active')
    })

    document.getElementById('view-map').addEventListener('click', () => {
      document.getElementById('browse-list').classList.add('d-none')
      document.getElementById('browse-map').classList.remove('d-none')
      document.getElementById('view-list').classList.remove('active')
      document.getElementById('view-map').classList.add('active')
      if (!mapInstance) initMap()
    })

    document.addEventListener('click', handlePaginationClick)

    return () => {
      document.removeEventListener('click', handlePaginationClick)
      if (mapInstance) { mapInstance.remove(); mapInstance = null }
    }
  }

  function handlePaginationClick(e) {
    const btn = e.target.closest('[data-page]')
    if (btn) {
      currentPage = parseInt(btn.dataset.page)
      loadApartments()
    }
  }

  function getFilters() {
    const q = {}
    const city = document.getElementById('f-city')?.value
    if (city) q.city = city
    const neighborhood = document.getElementById('f-neighborhood')?.value?.trim()
    if (neighborhood) q.neighborhood = neighborhood
    const uni = document.getElementById('f-university')?.value
    if (uni) q.nearestUniversity = uni
    const minPrice = document.getElementById('f-minPrice')?.value
    if (minPrice) q.minPrice = minPrice
    const maxPrice = document.getElementById('f-maxPrice')?.value
    if (maxPrice) q.maxPrice = maxPrice
    const spots = document.getElementById('f-spots')?.value
    if (spots) q.availableSpots = spots
    const maxDist = document.getElementById('f-maxDistance')?.value
    if (maxDist) q.maxDistance = maxDist
    if (document.getElementById('f-furnished')?.checked) q.furnished = true

    const amenities = []
    document.querySelectorAll('input[name="amenity"]:checked').forEach(cb => amenities.push(cb.value))
    if (amenities.length) q.amenities = amenities

    q.sort = document.getElementById('sort-select')?.value || 'newest'
    q.page = currentPage
    q.pageSize = 12
    return q
  }

  async function loadApartments() {
    const grid = document.getElementById('apartments-grid')
    if (!grid) return
    grid.innerHTML = skeletonCards(6)

    try {
      const filters = getFilters()
      const sortBy = filters.sort
      delete filters.sort

      const data = await api.get('/apartments', { query: { ...filters, sort: sortBy } })

      let items = data.items || data || []
      const total = data.totalCount || items.length
      const totalPages = data.totalPages || Math.ceil(total / 12) || 1

      if (sortBy === 'highest_match') {
        items = [...items].sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0))
      }

      if (items.length === 0) {
        grid.innerHTML = emptyState()
        document.getElementById('pagination-area').innerHTML = ''
        return
      }

      grid.innerHTML = items.map(apt => apartmentCard(apt)).join('')
      document.getElementById('pagination-area').innerHTML = renderPagination(currentPage, totalPages, total)

      if (mapInstance) updateMapMarkers(items)
    } catch (err) {
      console.error('Browse load error:', err)
      grid.innerHTML = `<div class="col-12 text-center py-5"><p class="text-danger small">${t('errors.generic')}</p></div>`
    }
  }

  function initMap() {
    const container = document.getElementById('browse-map')
    if (!container || !window.L) return
    mapInstance = L.map(container).setView([31.95, 35.93], 11)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapInstance)
    loadApartments()
  }

  function updateMapMarkers(items) {
    if (!mapInstance) return
    mapInstance.eachLayer(l => { if (l instanceof L.Marker) mapInstance.removeLayer(l) })
    items.forEach(apt => {
      if (apt.latitude && apt.longitude) {
        L.marker([apt.latitude, apt.longitude])
          .addTo(mapInstance)
          .bindPopup(`<strong>${apt.title}</strong><br>${apt.pricePerPerson} JOD`)
      }
    })
    if (items.length > 0 && items[0].latitude) {
      const bounds = items.filter(a => a.latitude).map(a => [a.latitude, a.longitude])
      if (bounds.length) mapInstance.fitBounds(bounds, { padding: [30, 30] })
    }
  }

  function clearFilters() {
    ['f-city', 'f-university', 'f-spots'].forEach(id => { document.getElementById(id).value = '' })
    ;['f-neighborhood', 'f-minPrice', 'f-maxPrice', 'f-maxDistance'].forEach(id => { document.getElementById(id).value = '' })
    document.getElementById('f-furnished').checked = false
    document.querySelectorAll('input[name="amenity"]').forEach(cb => {
      cb.checked = false
      const chip = cb.closest('.amenity-chip')
      chip.classList.remove('bg-primary', 'bg-opacity-10', 'text-primary')
      chip.classList.add('bg-light', 'text-secondary')
    })
    currentPage = 1
    loadApartments()
  }

  return { html, mount }
}

function apartmentCard(apt) {
  const photo = apt.photos?.length ? apt.photos[0] : null
  const photoUrl = photo ? `/uploads/${photo.filePath || photo}` : ''
  const user = getUser()
  const showScore = user && user.role === 0 && apt.compatibilityScore != null

  const genderLabels = { 0: t('apartments.gender.0'), 1: t('apartments.gender.1'), 2: t('apartments.gender.2') }

  return `
    <div class="col-sm-6 col-lg-4">
      <a href="#/apartments/${apt.id}" class="text-decoration-none">
        <div class="card-dorm card-dorm-lift overflow-hidden h-100">
          <div class="position-relative" style="height:180px;background:#f1f5f9">
            ${photoUrl ? `<img src="${photoUrl}" alt="${apt.title}" class="w-100 h-100" style="object-fit:cover" />` : `<div class="d-flex align-items-center justify-content-center h-100"><i class="bi bi-building text-secondary" style="font-size:2.5rem"></i></div>`}
            ${apt.isFeatured ? `<span class="position-absolute top-0 start-0 m-2 badge bg-warning text-dark">${t('apartments.featured')}</span>` : ''}
            ${showScore ? `<span class="position-absolute top-0 end-0 m-2 badge bg-primary bg-opacity-90 text-white">${apt.compatibilityScore}% ${t('match.label')}</span>` : ''}
          </div>
          <div class="p-3">
            <h6 class="fw-bold text-dark mb-1 text-truncate">${apt.title}</h6>
            <p class="text-secondary small mb-2">${apt.neighborhood || ''}${apt.city != null ? ', ' + t('cities.' + ['Amman','Irbid','Zarqa'][apt.city]) : ''}</p>
            <div class="d-flex align-items-center justify-content-between">
              <span class="fw-bold" style="color:var(--brand-600)">${apt.pricePerPerson || apt.fullRent} <span class="fw-normal text-secondary small">JOD</span></span>
              <div class="d-flex gap-2 small text-secondary">
                <span><i class="bi bi-door-open me-1"></i>${t('apartments.spotsAvailable', { available: apt.availableSpots, total: apt.totalSpots })}</span>
              </div>
            </div>
            <div class="mt-2">
              <span class="badge rounded-pill bg-light text-secondary border px-2 py-1" style="font-size:0.7rem">${genderLabels[apt.genderType] || ''}</span>
              ${apt.distanceMinutes ? `<span class="badge rounded-pill bg-light text-secondary border px-2 py-1 ms-1" style="font-size:0.7rem"><i class="bi bi-geo-alt me-1"></i>${t('apartments.walkMin', { min: apt.distanceMinutes })}</span>` : ''}
            </div>
          </div>
        </div>
      </a>
    </div>
  `
}

function emptyState() {
  return `
    <div class="col-12">
      <div class="text-center py-5">
        <div class="icon-box icon-box-brand mx-auto mb-3" style="width:64px;height:64px;font-size:1.5rem"><i class="bi bi-building"></i></div>
        <h5 class="fw-bold">${t('browse.empty.title')}</h5>
        <p class="text-secondary small">${t('browse.empty.description')}</p>
      </div>
    </div>
  `
}

function renderPagination(page, totalPages, total) {
  if (totalPages <= 1) return ''
  let buttons = ''
  if (page > 1) buttons += `<li class="page-item"><button class="page-link" data-page="${page - 1}">${t('pagination.prev')}</button></li>`
  for (let i = 1; i <= totalPages; i++) {
    if (i === page) buttons += `<li class="page-item active"><span class="page-link">${i}</span></li>`
    else if (Math.abs(i - page) <= 2 || i === 1 || i === totalPages) buttons += `<li class="page-item"><button class="page-link" data-page="${i}">${i}</button></li>`
    else if (Math.abs(i - page) === 3) buttons += `<li class="page-item disabled"><span class="page-link">…</span></li>`
  }
  if (page < totalPages) buttons += `<li class="page-item"><button class="page-link" data-page="${page + 1}">${t('pagination.next')}</button></li>`
  return `
    <div class="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
      <p class="text-secondary small mb-0">${t('pagination.summary', { page, totalPages, total })}</p>
      <nav><ul class="pagination pagination-sm mb-0">${buttons}</ul></nav>
    </div>
  `
}

function skeletonCards(n) {
  return Array(n).fill('').map(() => `
    <div class="col-sm-6 col-lg-4"><div class="skeleton" style="height:300px"></div></div>
  `).join('')
}
