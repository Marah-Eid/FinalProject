// Hash-based SPA router — matches #/path/:param patterns, enforces auth/role/guest guards
import { getUser } from './auth.js'
import { t } from './i18n.js'

const routes = []
let currentCleanup = null

export function addRoute(pattern, handler, { auth = false, roles = [], guest = false } = {}) {
  routes.push({ pattern, handler, auth, roles, guest })
}

function matchRoute(hash) {
  const path = hash.replace('#', '') || '/'
  for (const route of routes) {
    const params = matchPattern(route.pattern, path)
    if (params !== null) return { route, params }
  }
  return null
}

function matchPattern(pattern, path) {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) return null

  const params = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i]
    } else if (patternParts[i] !== pathParts[i]) {
      return null
    }
  }
  return params
}

export async function navigate() {
  if (currentCleanup) {
    currentCleanup()
    currentCleanup = null
  }

  const app = document.getElementById('app')
  const hash = window.location.hash || '#/'
  const match = matchRoute(hash)

  if (!match) {
    app.innerHTML = notFoundPage()
    return
  }

  const { route, params } = match
  const user = getUser()

  if (route.auth && !user) {
    window.location.hash = '#/login'
    return
  }

  if (route.roles.length > 0 && user && !route.roles.includes(user.role)) {
    window.location.hash = '#/'
    return
  }

  if (route.guest && user) {
    window.location.hash = '#/dashboard'
    return
  }

  try {
    const result = await route.handler(params)
    if (typeof result === 'string') {
      app.innerHTML = result
    } else if (result && result.html) {
      app.innerHTML = result.html
      if (result.mount) {
        currentCleanup = result.mount() || null
      }
    }
    window.scrollTo(0, 0)
  } catch (err) {
    console.error('Route error:', err)
    app.innerHTML = `<div class="container py-5 text-center"><p class="text-danger">${t('errors.generic')}</p></div>`
  }
}

function notFoundPage() {
  return `
    <div class="container py-5 text-center fade-in">
      <p class="display-1 fw-bold text-gradient">404</p>
      <h1 class="h3 fw-bold text-dark">${t('errors.notFoundTitle')}</h1>
      <p class="text-secondary mb-4">${t('errors.notFoundText')}</p>
      <a href="#/" class="btn btn-brand">${t('errors.notFoundCta')}</a>
    </div>
  `
}

export function initRouter() {
  window.addEventListener('hashchange', navigate)
  navigate()
}
