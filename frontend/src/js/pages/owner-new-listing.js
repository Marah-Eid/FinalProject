// New listing page (owner) — form with basics, location map, pricing, house rules, and amenities
import { t } from '../i18n.js'
import { api } from '../api.js'

const CITIES = [
  { value: 0, key: 'Amman' },
  { value: 1, key: 'Irbid' },
  { value: 2, key: 'Zarqa' },
]
const UNIVERSITIES = ['JU','GJU','PSUT','YU','HU','MU','ZU','BAU','JUST','AAU']
const AMENITIES = ['WiFi','AC','Heating','WashingMachine','Parking','Furnished','Elevator','Balcony','Kitchen','PrivateBathroom']

export function ownerNewListingPage() {
  const html = `
    <div class="container py-4 fade-in" style="max-width:700px">
      <h1 class="h3 fw-bold mb-1">${t('newListing.title')}</h1>
      <p class="text-secondary small mb-4">${t('newListing.subtitle')}</p>

      <div id="new-listing-error" class="alert alert-danger d-none rounded-3"></div>

      <form id="new-listing-form" novalidate>
        <!-- Basics -->
        <div class="card-dorm p-4 mb-4">
          <h6 class="fw-bold mb-1">${t('newListing.basics.title')}</h6>
          <p class="text-secondary small mb-3">${t('newListing.basics.hint')}</p>

          <div class="mb-3">
            <label class="form-label small fw-medium">${t('newListing.fields.title')}</label>
            <input type="text" class="form-control rounded-3" id="nl-title" required />
          </div>
          <div class="mb-3">
            <label class="form-label small fw-medium">${t('newListing.fields.description')}</label>
            <textarea class="form-control rounded-3" id="nl-description" rows="3"></textarea>
          </div>
          <div class="row g-3">
            <div class="col-sm-4">
              <label class="form-label small fw-medium">${t('newListing.fields.city')}</label>
              <select class="form-select rounded-3" id="nl-city" required>
                <option value="">—</option>
                ${CITIES.map(c => `<option value="${c.value}">${t('cities.' + c.key)}</option>`).join('')}
              </select>
            </div>
            <div class="col-sm-4">
              <label class="form-label small fw-medium">${t('newListing.fields.neighborhood')}</label>
              <input type="text" class="form-control rounded-3" id="nl-neighborhood" required />
            </div>
            <div class="col-sm-4">
              <label class="form-label small fw-medium">${t('newListing.fields.addressDetail')}</label>
              <input type="text" class="form-control rounded-3" id="nl-address" />
              <div class="form-text">${t('newListing.fields.addressDetailHint')}</div>
            </div>
          </div>
        </div>

        <!-- Location -->
        <div class="card-dorm p-4 mb-4">
          <h6 class="fw-bold mb-1">${t('newListing.location.title')}</h6>
          <p class="text-secondary small mb-3">${t('newListing.location.hint')}</p>
          <div class="row g-3">
            <div class="col-sm-6">
              <label class="form-label small fw-medium">${t('newListing.fields.nearestUniversity')}</label>
              <select class="form-select rounded-3" id="nl-university">
                <option value="">—</option>
                ${UNIVERSITIES.map((u, i) => `<option value="${i}">${t('universities.' + u)}</option>`).join('')}
              </select>
            </div>
            <div class="col-sm-6">
              <label class="form-label small fw-medium">${t('newListing.fields.distanceMinutes')}</label>
              <input type="number" class="form-control rounded-3" id="nl-distance" min="1" />
            </div>
          </div>
          <div id="nl-map" class="mt-3 rounded-3" style="height:200px;background:#f1f5f9"></div>
          <input type="hidden" id="nl-lat" />
          <input type="hidden" id="nl-lng" />
        </div>

        <!-- Pricing -->
        <div class="card-dorm p-4 mb-4">
          <h6 class="fw-bold mb-1">${t('newListing.pricing.title')}</h6>
          <p class="text-secondary small mb-3">${t('newListing.pricing.hint')}</p>
          <div class="row g-3">
            <div class="col-sm-4">
              <label class="form-label small fw-medium">${t('newListing.fields.fullRent')}</label>
              <input type="number" class="form-control rounded-3" id="nl-rent" min="0" required />
            </div>
            <div class="col-sm-4">
              <label class="form-label small fw-medium">${t('newListing.fields.totalSpots')}</label>
              <input type="number" class="form-control rounded-3" id="nl-totalSpots" min="1" required />
            </div>
            <div class="col-sm-4">
              <label class="form-label small fw-medium">${t('newListing.fields.availableSpots')}</label>
              <input type="number" class="form-control rounded-3" id="nl-availableSpots" min="0" required />
            </div>
          </div>
        </div>

        <!-- Rules & amenities -->
        <div class="card-dorm p-4 mb-4">
          <h6 class="fw-bold mb-1">${t('newListing.rules.title')}</h6>
          <p class="text-secondary small mb-3">${t('newListing.rules.hint')}</p>
          <div class="row g-3 mb-3">
            <div class="col-sm-4">
              <label class="form-label small fw-medium">${t('newListing.fields.genderType')}</label>
              <select class="form-select rounded-3" id="nl-gender" required>
                <option value="0">${t('apartments.gender.0')}</option>
                <option value="1">${t('apartments.gender.1')}</option>
                <option value="2">${t('apartments.gender.2')}</option>
              </select>
              <div class="form-text">${t('newListing.fields.genderTypeHint')}</div>
            </div>
            <div class="col-sm-4">
              <label class="form-label small fw-medium">${t('newListing.fields.smokingRule')}</label>
              <select class="form-select rounded-3" id="nl-smoking">
                <option value="0">${t('smokingRules.Yes')}</option>
                <option value="1">${t('smokingRules.No')}</option>
                <option value="2">${t('smokingRules.Outside')}</option>
              </select>
            </div>
            <div class="col-sm-4">
              <label class="form-label small fw-medium">${t('newListing.fields.guestsRule')}</label>
              <select class="form-select rounded-3" id="nl-guests">
                <option value="0">${t('guestsRules.Yes')}</option>
                <option value="1">${t('guestsRules.No')}</option>
                <option value="2">${t('guestsRules.Limited')}</option>
              </select>
            </div>
          </div>
          <div class="form-check mb-3">
            <input type="checkbox" class="form-check-input" id="nl-furnished" />
            <label class="form-check-label small fw-medium" for="nl-furnished">${t('newListing.fields.isFurnished')}</label>
          </div>

          <h6 class="fw-bold mb-2">${t('newListing.amenities.title')}</h6>
          <p class="text-secondary small mb-2">${t('newListing.amenities.hint')}</p>
          <div class="d-flex flex-wrap gap-2">
            ${AMENITIES.map(a => `
              <label class="badge rounded-pill bg-light text-secondary border px-3 py-2" style="cursor:pointer;font-weight:500">
                <input type="checkbox" class="d-none" value="${a}" name="nl-amenity" />
                ${t('amenities.' + a)}
              </label>
            `).join('')}
          </div>
        </div>

        <button type="submit" class="btn btn-brand w-100 mb-4" id="nl-submit">${t('newListing.submit')}</button>
      </form>
    </div>
  `

  let mapInstance = null

  function mount() {
    setTimeout(initMap, 200)

    document.querySelectorAll('input[name="nl-amenity"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const chip = e.target.closest('label')
        chip.classList.toggle('bg-primary', e.target.checked)
        chip.classList.toggle('bg-opacity-10', e.target.checked)
        chip.classList.toggle('text-primary', e.target.checked)
        chip.classList.toggle('bg-light', !e.target.checked)
        chip.classList.toggle('text-secondary', !e.target.checked)
      })
    })

    document.getElementById('new-listing-form')?.addEventListener('submit', handleSubmit)

    return () => {
      if (mapInstance) { mapInstance.remove(); mapInstance = null }
    }
  }

  function initMap() {
    const el = document.getElementById('nl-map')
    if (!el || !window.L) return
    mapInstance = L.map(el).setView([31.95, 35.93], 10)
    const map = mapInstance
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map)
    let marker = null
    map.on('click', (e) => {
      if (marker) map.removeLayer(marker)
      marker = L.marker(e.latlng).addTo(map)
      document.getElementById('nl-lat').value = e.latlng.lat
      document.getElementById('nl-lng').value = e.latlng.lng
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errBox = document.getElementById('new-listing-error')
    errBox.classList.add('d-none')

    const title = document.getElementById('nl-title').value.trim()
    const description = document.getElementById('nl-description').value.trim()
    const city = document.getElementById('nl-city').value
    const neighborhood = document.getElementById('nl-neighborhood').value.trim()
    const addressDetail = document.getElementById('nl-address').value.trim()
    const nearestUniversity = document.getElementById('nl-university').value
    const distanceMinutes = document.getElementById('nl-distance').value
    const fullRent = document.getElementById('nl-rent').value
    const totalSpots = document.getElementById('nl-totalSpots').value
    const availableSpots = document.getElementById('nl-availableSpots').value
    const genderType = document.getElementById('nl-gender').value
    const smokingRule = document.getElementById('nl-smoking').value
    const guestsRule = document.getElementById('nl-guests').value
    const isFurnished = document.getElementById('nl-furnished').checked
    const lat = document.getElementById('nl-lat').value
    const lng = document.getElementById('nl-lng').value

    if (!title || !city || !neighborhood || !fullRent || !totalSpots || !availableSpots) {
      errBox.textContent = t('errors.validation')
      errBox.classList.remove('d-none')
      return
    }

    if (parseInt(availableSpots) > parseInt(totalSpots)) {
      errBox.textContent = t('newListing.errors.spotsExceedsTotal')
      errBox.classList.remove('d-none')
      return
    }

    const amenities = []
    document.querySelectorAll('input[name="nl-amenity"]:checked').forEach(cb => amenities.push(cb.value))

    const body = {
      title, description, city: parseInt(city), neighborhood, addressDetail,
      fullRent: parseFloat(fullRent), totalSpots: parseInt(totalSpots), availableSpots: parseInt(availableSpots),
      genderType: parseInt(genderType), smokingRule: parseInt(smokingRule), guestsRule: parseInt(guestsRule),
      isFurnished, amenities,
    }
    if (nearestUniversity) body.nearestUniversity = parseInt(nearestUniversity)
    if (distanceMinutes) body.distanceMinutes = parseInt(distanceMinutes)
    if (lat && lng) { body.latitude = parseFloat(lat); body.longitude = parseFloat(lng) }

    const btn = document.getElementById('nl-submit')
    btn.disabled = true
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>' + t('newListing.submit')

    try {
      const result = await api.post('/apartments', { body })
      window.location.hash = `#/apartments/${result.id}`
    } catch (err) {
      errBox.textContent = err.message || t('errors.generic')
      errBox.classList.remove('d-none')
      btn.disabled = false
      btn.textContent = t('newListing.submit')
    }
  }

  return { html, mount }
}
