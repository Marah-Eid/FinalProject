import { t } from '../i18n.js'
import { api } from '../api.js'
import { getUser } from '../auth.js'
import { escapeHtml } from '../utils.js'

const AMENITY_ICONS = {
  WiFi: 'bi-wifi', AC: 'bi-snow', Heating: 'bi-thermometer-sun',
  WashingMachine: 'bi-droplet', Parking: 'bi-car-front', Furnished: 'bi-lamp',
  Elevator: 'bi-arrow-up-square', Balcony: 'bi-sun', Kitchen: 'bi-cup-hot',
  PrivateBathroom: 'bi-water'
}

export function apartmentDetailPage(id) {
  const html = `
    <div class="container py-4 fade-in" style="max-width:960px">
      <div id="apt-detail-content">
        <div class="skeleton mb-3" style="height:350px"></div>
        <div class="skeleton mb-2" style="height:32px;width:60%"></div>
        <div class="skeleton" style="height:200px"></div>
      </div>
    </div>
  `

  function mount() {
    loadApartment(id)
  }

  return { html, mount }
}

async function loadApartment(id) {
  const container = document.getElementById('apt-detail-content')
  if (!container) return

  try {
    const apt = await api.get(`/apartments/${id}`)
    const user = getUser()

    let compat = null
    if (user && user.role === 0) {
      try {
        compat = await api.get(`/apartments/${id}/compatibility`)
      } catch {}
    }

    container.innerHTML = renderDetail(apt, compat, user)

    setupPhotoGallery()

    if (apt.latitude && apt.longitude && window.L) {
      setTimeout(() => initDetailMap(apt), 100)
    }

    setupApplyButton(apt, compat)
  } catch (err) {
    if (err.status === 404) {
      container.innerHTML = `
        <div class="text-center py-5">
          <div class="icon-box icon-box-accent mx-auto mb-3" style="width:64px;height:64px;font-size:1.5rem"><i class="bi bi-building-x"></i></div>
          <h5 class="fw-bold">${t('apartments.notFoundTitle')}</h5>
          <p class="text-secondary small">${t('apartments.notFoundText')}</p>
          <a href="#/browse" class="btn btn-brand">${t('apartments.backToBrowse')}</a>
        </div>
      `
    } else {
      container.innerHTML = `<div class="text-center py-5"><p class="text-danger">${t('errors.generic')}</p></div>`
    }
  }
}

function renderDetail(apt, compat, user) {
  const photos = apt.photos || []
  const amenities = apt.amenities || []
  const tenants = apt.currentTenants || []
  const genderLabels = { 0: t('apartments.gender.0'), 1: t('apartments.gender.1'), 2: t('apartments.gender.2') }
  const smokingLabels = { 0: t('smokingRules.Yes'), 1: t('smokingRules.No'), 2: t('smokingRules.Outside') }
  const guestsLabels = { 0: t('guestsRules.Yes'), 1: t('guestsRules.No'), 2: t('guestsRules.Limited') }

  const showAddress = apt.addressDetail
  const showPhone = apt.ownerPhoneNumber

  return `
    <!-- Photo gallery -->
    ${photos.length > 0 ? `
      <div class="position-relative mb-4" style="border-radius:1rem;overflow:hidden">
        <div id="photo-gallery" style="display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:0.5rem">
          ${photos.map(p => `
            <img src="/uploads/${p.filePath || p}" alt="${apt.title}" class="flex-shrink-0" style="height:350px;object-fit:cover;scroll-snap-align:start;border-radius:1rem;min-width:100%" />
          `).join('')}
        </div>
        ${photos.length > 1 ? `
          <button class="btn btn-sm btn-light position-absolute top-50 start-0 translate-middle-y ms-2 rounded-circle shadow" id="photo-prev" style="z-index:2"><i class="bi bi-chevron-right"></i></button>
          <button class="btn btn-sm btn-light position-absolute top-50 end-0 translate-middle-y me-2 rounded-circle shadow" id="photo-next" style="z-index:2"><i class="bi bi-chevron-left"></i></button>
        ` : ''}
        <span class="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-50 text-white">${photos.length} <i class="bi bi-image"></i></span>
      </div>
    ` : ''}

    <div class="row g-4">
      <div class="col-lg-8">
        <!-- Title + badges -->
        <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
          <h1 class="h3 fw-bold mb-0">${apt.title}</h1>
          ${apt.isFeatured ? `<span class="badge bg-warning text-dark">${t('apartments.featured')}</span>` : ''}
          <span class="badge rounded-pill bg-primary bg-opacity-10 text-primary">${genderLabels[apt.genderType] || ''}</span>
        </div>
        <p class="text-secondary small mb-4">${apt.neighborhood || ''}${apt.city != null ? ', ' + t('cities.' + ['Amman','Irbid','Zarqa'][apt.city]) : ''}</p>

        <!-- Compatibility -->
        ${compat ? renderCompatibility(compat) : ''}

        <!-- About -->
        ${apt.description ? `
          <div class="card-dorm p-4 mb-4">
            <h5 class="fw-bold mb-3">${t('apartments.about')}</h5>
            <p class="text-secondary" style="white-space:pre-line">${escapeHtml(apt.description)}</p>
          </div>
        ` : ''}

        <!-- Quick facts -->
        <div class="card-dorm p-4 mb-4">
          <h5 class="fw-bold mb-3">${t('apartments.facts')}</h5>
          <div class="row g-3">
            <div class="col-6"><span class="text-secondary small d-block">${t('apartments.spots')}</span><span class="fw-semibold">${t('apartments.spotsAvailable', { available: apt.availableSpots, total: apt.totalSpots })}</span></div>
            ${apt.nearestUniversity != null ? `<div class="col-6"><span class="text-secondary small d-block">${t('apartments.nearestUniversity')}</span><span class="fw-semibold">${t('universities.' + ['JU','GJU','PSUT','YU','HU','MU','ZU','BAU','JUST','AAU'][apt.nearestUniversity])}</span></div>` : ''}
            ${apt.distanceMinutes ? `<div class="col-6"><span class="text-secondary small d-block">${t('apartments.walkMin', { min: '' })}</span><span class="fw-semibold">${apt.distanceMinutes} min</span></div>` : ''}
            <div class="col-6"><span class="text-secondary small d-block">${t('apartments.smokingRule')}</span><span class="fw-semibold">${smokingLabels[apt.smokingRule] || '—'}</span></div>
            <div class="col-6"><span class="text-secondary small d-block">${t('apartments.guestsRule')}</span><span class="fw-semibold">${guestsLabels[apt.guestsRule] || '—'}</span></div>
          </div>
        </div>

        <!-- Amenities -->
        ${amenities.length > 0 ? `
          <div class="card-dorm p-4 mb-4">
            <h5 class="fw-bold mb-3">${t('apartments.amenitiesTitle')}</h5>
            <div class="d-flex flex-wrap gap-2">
              ${amenities.map(a => {
                const name = typeof a === 'string' ? a : (a.name || a)
                const icon = AMENITY_ICONS[name] || 'bi-check-circle'
                return `<span class="badge rounded-pill bg-light text-secondary border px-3 py-2"><i class="bi ${icon} me-1"></i>${t('amenities.' + name)}</span>`
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Current tenants -->
        <div class="card-dorm p-4 mb-4">
          <h5 class="fw-bold mb-3">${t('apartments.currentTenantsTitle')}</h5>
          ${tenants.length === 0 ? `
            <p class="text-secondary small">${t('apartments.noTenantsYet')}</p>
          ` : `
            <div class="d-flex flex-column gap-2">
              ${tenants.map(tn => `
                <div class="d-flex align-items-center gap-3 p-2 rounded-3" style="background:#f8fafc">
                  <div class="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary" style="width:40px;height:40px;min-width:40px"><i class="bi bi-person"></i></div>
                  <div>
                    <p class="mb-0 small fw-semibold">${tn.firstName || tn.fullName?.split(' ')[0] || '—'}</p>
                    <p class="mb-0 text-secondary" style="font-size:0.75rem">${tn.year ? t('apartments.yearN', { year: tn.year }) : t('apartments.yearUnknown')}${tn.major ? ' · ' + tn.major : ''}</p>
                  </div>
                  ${tn.compatibilityScore != null ? `<span class="badge bg-primary bg-opacity-10 text-primary ms-auto">${tn.compatibilityScore}%</span>` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Location -->
        <div class="card-dorm p-4 mb-4">
          <h5 class="fw-bold mb-3">${t('apartments.locationTitle')}</h5>
          ${!showAddress ? `<p class="text-secondary small"><i class="bi bi-lock me-1"></i>${t('apartments.locationApprox')}</p>` : `<p class="small fw-medium">${apt.addressDetail}</p>`}
          <div id="detail-map" style="height:250px;border-radius:0.75rem;background:#f1f5f9"></div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="col-lg-4">
        <div class="card-dorm p-4 mb-3 position-sticky" style="top:80px">
          <p class="text-secondary small mb-1">${t('apartments.pricePerPerson')}</p>
          <p class="h3 fw-bold mb-1" style="color:var(--brand-600)">${apt.pricePerPerson || apt.fullRent} <span class="h6 fw-normal text-secondary">JOD</span></p>
          ${apt.fullRent ? `<p class="text-secondary small mb-3">${t('apartments.fullRentLabel')}: ${apt.fullRent} JOD</p>` : ''}

          <div id="apply-area" class="mb-3">
            ${renderApplyButton(user)}
          </div>

          <!-- Owner info -->
          ${apt.ownerName ? `
            <div class="border-top pt-3 mt-3">
              <div class="d-flex align-items-center gap-2 mb-2">
                <div class="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary" style="width:36px;height:36px"><i class="bi bi-person"></i></div>
                <div>
                  <p class="mb-0 small fw-semibold">${apt.ownerName}</p>
                  ${apt.ownerRatingAvg != null ? `<p class="mb-0 text-secondary" style="font-size:0.7rem">${t('apartments.ownerRating', { avg: apt.ownerRatingAvg.toFixed(1), count: apt.ownerRatingCount || 0 })}</p>` : `<p class="mb-0 text-secondary" style="font-size:0.7rem">${t('apartments.noOwnerRatings')}</p>`}
                </div>
              </div>
              ${showPhone ? `<p class="small mb-1"><i class="bi bi-telephone me-2 text-secondary"></i>${apt.ownerPhoneNumber}</p>` : `<p class="small text-secondary mb-0"><i class="bi bi-lock me-1"></i>${t('apartments.phoneLocked')}</p>`}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `
}

function renderCompatibility(compat) {
  const score = compat.score
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'
  const circumference = 2 * Math.PI * 45

  return `
    <div class="card-dorm p-4 mb-4" style="border-color:var(--brand-200);background:linear-gradient(135deg,var(--brand-50),#fff)">
      <div class="d-flex align-items-center gap-4">
        <div class="compat-circle" style="width:90px;height:90px">
          <svg width="90" height="90">
            <circle cx="45" cy="45" r="45" fill="none" stroke="#e2e8f0" stroke-width="6" />
            <circle cx="45" cy="45" r="45" fill="none" stroke="${color}" stroke-width="6"
              stroke-dasharray="${circumference}" stroke-dashoffset="${circumference * (1 - score / 100)}"
              stroke-linecap="round" style="transition:stroke-dashoffset 1s ease" />
          </svg>
          <div class="compat-label">
            <span class="h4 fw-bold mb-0" style="color:${color}">${score}%</span>
          </div>
        </div>
        <div>
          <h6 class="fw-bold mb-1">${t('match.breakdownTitle')}</h6>
          ${compat.tenantsCount > 0 ? `<p class="text-secondary small mb-2">${t('match.averageAcross', { count: compat.tenantsCount })}</p>` : `<p class="text-secondary small mb-2">${t('match.noTenantsExplain')}</p>`}
          ${compat.matchedOn?.length > 0 ? `
            <div class="mb-1"><span class="small text-secondary">${t('match.matchedOn')}:</span>
              ${compat.matchedOn.map(q => `<span class="badge rounded-pill bg-success bg-opacity-10 text-success ms-1" style="font-size:0.7rem">${t('quiz.q.' + q + '.title')}</span>`).join('')}
            </div>
          ` : ''}
          ${compat.differedOn?.length > 0 ? `
            <div><span class="small text-secondary">${t('match.differedOn')}:</span>
              ${compat.differedOn.map(q => `<span class="badge rounded-pill bg-danger bg-opacity-10 text-danger ms-1" style="font-size:0.7rem">${t('quiz.q.' + q + '.title')}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `
}

function renderApplyButton(user) {
  if (!user) return `<a href="#/login" class="btn btn-brand w-100">${t('apartments.loginToApply')}</a>`
  if (user.role !== 0) return `<button class="btn btn-secondary w-100" disabled>${t('apartments.studentsOnly')}</button>`
  return `<button class="btn btn-brand w-100" id="apply-btn">${t('apartments.applyCta')}</button>`
}

function setupApplyButton(apt, compat) {
  const btn = document.getElementById('apply-btn')
  if (!btn) return

  btn.addEventListener('click', () => {
    showApplyModal(apt, compat)
  })
}

function showApplyModal(apt, compat) {
  const existing = document.getElementById('apply-modal-backdrop')
  if (existing) existing.remove()

  const backdrop = document.createElement('div')
  backdrop.id = 'apply-modal-backdrop'
  backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1050;display:flex;align-items:center;justify-content:center;padding:1rem'
  backdrop.innerHTML = `
    <div class="card-dorm p-4 fade-in" style="max-width:500px;width:100%;max-height:90vh;overflow-y:auto" id="apply-modal">
      <div id="apply-modal-body">
        <h5 class="fw-bold mb-2">${t('apply.modalTitle')}</h5>
        <p class="text-secondary small mb-3">${t('apply.intro', { title: apt.title })}</p>
        ${compat ? `
          <div class="alert alert-primary bg-primary bg-opacity-10 border-0 rounded-3 small mb-3">
            <i class="bi bi-info-circle me-1"></i> ${t('apply.scoreCalloutHint')}
          </div>
        ` : ''}
        <div class="mb-3">
          <label class="form-label small fw-medium">${t('apply.messageLabel')}</label>
          <textarea class="form-control rounded-3" id="apply-message" rows="4" minlength="20" maxlength="500" placeholder="${t('apply.placeholder')}"></textarea>
          <div class="d-flex justify-content-between mt-1">
            <span class="form-text">${t('apply.messageHint')}</span>
            <span class="form-text" id="apply-char-count">0/500</span>
          </div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-brand flex-grow-1" id="apply-submit">${t('apply.submit')}</button>
          <button class="btn btn-outline-secondary" id="apply-cancel">${t('common.cancel')}</button>
        </div>
        <div id="apply-error" class="alert alert-danger rounded-3 mt-3 d-none small"></div>
      </div>
    </div>
  `

  document.body.appendChild(backdrop)
  document.body.style.overflow = 'hidden'

  const textarea = document.getElementById('apply-message')
  textarea.addEventListener('input', () => {
    document.getElementById('apply-char-count').textContent = `${textarea.value.length}/500`
  })

  document.getElementById('apply-cancel').addEventListener('click', closeApplyModal)
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeApplyModal() })

  document.getElementById('apply-submit').addEventListener('click', async () => {
    const msg = textarea.value.trim()
    const errBox = document.getElementById('apply-error')
    errBox.classList.add('d-none')

    if (msg.length < 20) {
      errBox.textContent = t('apply.tooShort')
      errBox.classList.remove('d-none')
      return
    }
    if (msg.length > 500) {
      errBox.textContent = t('apply.tooLong')
      errBox.classList.remove('d-none')
      return
    }

    const btn = document.getElementById('apply-submit')
    btn.disabled = true
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>' + t('apply.submit')

    try {
      await api.post(`/apartments/${apt.id}/apply`, { body: { message: msg } })
      document.getElementById('apply-modal-body').innerHTML = `
        <div class="text-center py-3">
          <div class="icon-box icon-box-brand mx-auto mb-3" style="width:56px;height:56px;font-size:1.25rem"><i class="bi bi-check-lg"></i></div>
          <h5 class="fw-bold mb-2">${t('apply.submittedTitle')}</h5>
          <p class="text-secondary small mb-3">${t('apply.submittedText', { title: apt.title })}</p>
          <a href="#/applications/mine" class="btn btn-brand btn-sm" onclick="document.getElementById('apply-modal-backdrop')?.remove();document.body.style.overflow=''">${t('apply.viewMyApplications')}</a>
        </div>
      `
    } catch (err) {
      errBox.textContent = err.message || t('errors.generic')
      errBox.classList.remove('d-none')
      btn.disabled = false
      btn.textContent = t('apply.submit')
    }
  })
}

function setupPhotoGallery() {
  const gallery = document.getElementById('photo-gallery')
  if (!gallery) return
  const prevBtn = document.getElementById('photo-prev')
  const nextBtn = document.getElementById('photo-next')
  if (prevBtn) prevBtn.addEventListener('click', () => gallery.scrollBy({ left: -gallery.clientWidth, behavior: 'smooth' }))
  if (nextBtn) nextBtn.addEventListener('click', () => gallery.scrollBy({ left: gallery.clientWidth, behavior: 'smooth' }))
}

function closeApplyModal() {
  document.getElementById('apply-modal-backdrop')?.remove()
  document.body.style.overflow = ''
}

function initDetailMap(apt) {
  const el = document.getElementById('detail-map')
  if (!el || !window.L) return
  const map = L.map(el).setView([apt.latitude, apt.longitude], 14)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map)
  L.circle([apt.latitude, apt.longitude], { radius: 300, color: '#6366F1', fillOpacity: 0.1 }).addTo(map)
}
