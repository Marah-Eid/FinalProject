// Login page — email/password form, calls auth.login(), redirects to dashboard
import { t } from '../i18n.js'
import { login } from '../auth.js'

export function loginPage() {
  const html = `
    <div class="container fade-in" style="max-width:440px;padding-top:4rem;padding-bottom:4rem">
      <div class="text-center mb-4">
        <div class="d-inline-flex align-items-center justify-content-center rounded-4 text-white fw-bold mb-3"
             style="width:56px;height:56px;background:linear-gradient(135deg,#6366F1,#8B5CF6);font-size:1.25rem;box-shadow:0 8px 20px rgba(99,102,241,0.3)">D</div>
        <h1 class="h3 fw-bold">${t('auth.loginTitle')}</h1>
        <p class="text-secondary small">${t('auth.loginSubtitle')}</p>
      </div>

      <div class="card-dorm p-4">
        <div id="login-error" class="alert alert-danger d-none rounded-3" role="alert"></div>

        <form id="login-form" novalidate>
          <div class="mb-3">
            <label for="email" class="form-label small fw-medium">${t('fields.email')}</label>
            <input type="email" class="form-control rounded-3" id="email" autocomplete="email" autofocus required />
          </div>
          <div class="mb-3">
            <label for="password" class="form-label small fw-medium">${t('fields.password')}</label>
            <input type="password" class="form-control rounded-3" id="password" autocomplete="current-password" required />
          </div>
          <div class="mb-3"></div>
          <button type="submit" class="btn btn-brand w-100" id="login-btn">
            ${t('auth.loginSubmit')}
          </button>
        </form>

        <p class="text-center text-secondary small mt-4 mb-0">
          ${t('auth.noAccount')}
          <a href="#/register" class="fw-semibold text-decoration-none" style="color:var(--brand-600)">${t('auth.signUpHere')}</a>
        </p>
      </div>
    </div>
  `

  function mount() {
    const form = document.getElementById('login-form')
    const errBox = document.getElementById('login-error')
    const btn = document.getElementById('login-btn')

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      errBox.classList.add('d-none')

      const email = document.getElementById('email').value.trim()
      const password = document.getElementById('password').value

      if (!email || !password) {
        errBox.textContent = t('errors.field.required')
        errBox.classList.remove('d-none')
        return
      }

      btn.disabled = true
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>' + t('auth.loginSubmit')

      try {
        await login(email, password)
        window.location.hash = '#/dashboard'
      } catch (err) {
        errBox.textContent = err.message || t('errors.generic')
        errBox.classList.remove('d-none')
      } finally {
        btn.disabled = false
        btn.textContent = t('auth.loginSubmit')
      }
    })
  }

  return { html, mount }
}
