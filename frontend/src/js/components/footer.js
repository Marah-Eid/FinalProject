import { t } from '../i18n.js'

export function renderFooter() {
  const el = document.getElementById('footer-root')
  el.innerHTML = `
    <div class="border-top bg-white bg-opacity-75" style="backdrop-filter:blur(8px)">
      <div class="container d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 py-4">
        <p class="mb-0 text-secondary fw-medium small">${t('footer.tagline')}</p>
        <p class="mb-0 small" style="color:#94a3b8">${t('footer.rights')}</p>
      </div>
    </div>
  `
}
