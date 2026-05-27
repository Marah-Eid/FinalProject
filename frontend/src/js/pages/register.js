import { t } from '../i18n.js'
import { register } from '../auth.js'

const universities = [
  { code: 'JU',   value: 0 },
  { code: 'GJU',  value: 1 },
  { code: 'PSUT', value: 2 },
  { code: 'YU',   value: 3 },
  { code: 'HU',   value: 4 },
  { code: 'MU',   value: 5 },
  { code: 'ZU',   value: 6 },
  { code: 'BAU',  value: 7 },
  { code: 'JUST', value: 8 },
  { code: 'AAU',  value: 9 },
]

export function registerPage() {
  const uniOptions = universities.map(u =>
    `<option value="${u.value}">${t(`universities.${u.code}`)}</option>`
  ).join('')

  const html = `
    <div class="container fade-in" style="max-width:560px;padding-top:4rem;padding-bottom:4rem">
      <div class="text-center mb-4">
        <div class="d-inline-flex align-items-center justify-content-center rounded-4 text-white fw-bold mb-3"
             style="width:56px;height:56px;background:linear-gradient(135deg,#6366F1,#8B5CF6);font-size:1.25rem;box-shadow:0 8px 20px rgba(99,102,241,0.3)">D</div>
        <h1 class="h3 fw-bold">${t('auth.registerTitle')}</h1>
        <p class="text-secondary small">${t('auth.registerSubtitle')}</p>
      </div>

      <div class="card-dorm p-4">
        <div id="reg-error" class="alert alert-danger d-none rounded-3" role="alert"></div>

        <form id="reg-form" novalidate>
          <div class="mb-3">
            <label for="fullName" class="form-label small fw-medium">${t('fields.fullName')}</label>
            <input type="text" class="form-control rounded-3" id="fullName" required autofocus />
          </div>

          <div class="mb-3">
            <label for="email" class="form-label small fw-medium">${t('fields.email')}</label>
            <input type="email" class="form-control rounded-3" id="email" autocomplete="email" required />
          </div>

          <div class="mb-3">
            <label for="password" class="form-label small fw-medium">${t('fields.password')}</label>
            <input type="password" class="form-control rounded-3" id="password" autocomplete="new-password" required />
            <div class="form-text">${t('errors.field.passwordTooShort')}</div>
          </div>

          <div class="mb-3">
            <label for="phoneNumber" class="form-label small fw-medium">${t('fields.phoneNumber')}</label>
            <input type="tel" class="form-control rounded-3" id="phoneNumber" dir="ltr" placeholder="+962 7…" required />
          </div>

          <div class="row g-3 mb-3">
            <div class="col-sm-6">
              <label for="role" class="form-label small fw-medium">${t('fields.role')}</label>
              <select class="form-select rounded-3" id="role" required>
                <option value="" disabled selected>${t('auth.selectRole')}</option>
                <option value="0">${t('roles.student')}</option>
                <option value="1">${t('roles.owner')}</option>
              </select>
            </div>
            <div class="col-sm-6">
              <label for="gender" class="form-label small fw-medium">${t('fields.gender')}</label>
              <select class="form-select rounded-3" id="gender" required>
                <option value="" disabled selected>${t('auth.selectGender')}</option>
                <option value="0">${t('gender.male')}</option>
                <option value="1">${t('gender.female')}</option>
              </select>
            </div>
          </div>

          <div class="mb-4">
            <label for="university" class="form-label small fw-medium">
              ${t('fields.university')}
              <span class="text-secondary fw-normal">(${t('common.optional')})</span>
            </label>
            <select class="form-select rounded-3" id="university">
              <option value="">—</option>
              ${uniOptions}
            </select>
            <div class="form-text">${t('auth.universityHelp')}</div>
          </div>

          <button type="submit" class="btn btn-brand w-100" id="reg-btn">
            ${t('auth.registerSubmit')}
          </button>
        </form>

        <p class="text-center text-secondary small mt-4 mb-0">
          ${t('auth.alreadyHaveAccount')}
          <a href="#/login" class="fw-semibold text-decoration-none" style="color:var(--brand-600)">${t('auth.logInHere')}</a>
        </p>
      </div>
    </div>
  `

  function mount() {
    const form = document.getElementById('reg-form')
    const errBox = document.getElementById('reg-error')
    const btn = document.getElementById('reg-btn')

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      errBox.classList.add('d-none')

      const fullName = document.getElementById('fullName').value.trim()
      const email = document.getElementById('email').value.trim()
      const password = document.getElementById('password').value
      const phoneNumber = document.getElementById('phoneNumber').value.trim()
      const role = parseInt(document.getElementById('role').value)
      const gender = parseInt(document.getElementById('gender').value)
      const uniVal = document.getElementById('university').value

      if (!fullName || !email || !password || !phoneNumber || isNaN(role) || isNaN(gender)) {
        errBox.textContent = t('errors.validation')
        errBox.classList.remove('d-none')
        return
      }

      if (password.length < 8) {
        errBox.textContent = t('errors.field.passwordTooShort')
        errBox.classList.remove('d-none')
        return
      }

      const payload = { fullName, email, password, phoneNumber, role, gender }
      if (uniVal) payload.university = parseInt(uniVal)

      btn.disabled = true
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>' + t('auth.registerSubmit')

      try {
        await register(payload)
        window.location.hash = '#/dashboard'
      } catch (err) {
        errBox.textContent = err.message || t('errors.generic')
        errBox.classList.remove('d-none')
      } finally {
        btn.disabled = false
        btn.textContent = t('auth.registerSubmit')
      }
    })
  }

  return { html, mount }
}
