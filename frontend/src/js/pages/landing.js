// Landing page — hero section with CTAs + three feature cards
import { t } from '../i18n.js'

export function landingPage() {
  return `
    <!-- Hero -->
    <section class="hero-gradient position-relative">
      <div class="position-absolute top-0 end-0 rounded-circle" style="width:400px;height:400px;background:rgba(99,102,241,0.08);filter:blur(80px);transform:translate(30%,-30%)"></div>
      <div class="position-absolute bottom-0 start-0 rounded-circle" style="width:400px;height:400px;background:rgba(244,63,94,0.06);filter:blur(80px);transform:translate(-30%,30%)"></div>

      <div class="container position-relative py-5" style="padding-top:5rem!important;padding-bottom:5rem!important">
        <div class="row justify-content-center">
          <div class="col-lg-8 text-center">
            <span class="badge rounded-pill bg-opacity-10 text-primary border border-primary-subtle px-3 py-2 mb-3 fw-semibold" style="background:var(--brand-50)!important;color:var(--brand-700)!important">
              <i class="bi bi-stars me-1"></i> ${t('landing.heroEyebrow')}
            </span>
            <h1 class="display-4 fw-bold mb-3" style="letter-spacing:-0.02em">${t('landing.heroTitle')}</h1>
            <p class="lead text-secondary mb-4 mx-auto" style="max-width:600px">${t('landing.heroSubtitle')}</p>
            <div class="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <a href="#/browse" class="btn btn-brand btn-lg px-4">
                ${t('landing.heroCtaPrimary')} <i class="bi bi-arrow-left ms-1"></i>
              </a>
              <a href="#/register" class="btn btn-outline-brand btn-lg px-4">
                ${t('landing.heroCtaSecondary')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="border-top py-5" style="border-color:rgba(226,232,240,0.6)!important">
      <div class="container">
        <h2 class="text-center fw-bold mb-2">${t('landing.featuresTitle')}</h2>
        <p class="text-center text-secondary mb-5 mx-auto" style="max-width:500px">${t('landing.heroSubtitle')}</p>

        <div class="row g-4">
          <div class="col-md-4">
            ${featureCard('bi-people', 'icon-box-brand', t('landing.feature1Title'), t('landing.feature1Text'))}
          </div>
          <div class="col-md-4">
            ${featureCard('bi-building', 'icon-box-accent', t('landing.feature2Title'), t('landing.feature2Text'))}
          </div>
          <div class="col-md-4">
            ${featureCard('bi-shield-check', 'icon-box-emerald', t('landing.feature3Title'), t('landing.feature3Text'))}
          </div>
        </div>
      </div>
    </section>
  `
}

function featureCard(icon, boxClass, title, text) {
  return `
    <div class="card-dorm card-dorm-lift p-4 h-100">
      <div class="icon-box ${boxClass} mb-3">
        <i class="bi ${icon}"></i>
      </div>
      <h5 class="fw-bold mb-2">${title}</h5>
      <p class="text-secondary small mb-0">${text}</p>
    </div>
  `
}
