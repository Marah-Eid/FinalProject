import { getTokens, setTokens, clearAuth } from './auth.js'

const BASE = '/api'

let isRefreshing = false
let refreshQueue = []

async function request(method, path, { body, query, headers: extraHeaders, formData } = {}) {
  let url = `${BASE}${path}`
  if (query) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') {
        if (Array.isArray(v)) v.forEach(item => params.append(k, item))
        else params.append(k, v)
      }
    }
    const qs = params.toString()
    if (qs) url += `?${qs}`
  }

  const hdrs = { ...extraHeaders }
  const tokens = getTokens()
  if (tokens?.accessToken) hdrs['Authorization'] = `Bearer ${tokens.accessToken}`

  const opts = { method, headers: hdrs }
  if (formData) {
    opts.body = formData
  } else if (body) {
    hdrs['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }

  let res = await fetch(url, opts)

  if (res.status === 401 && tokens?.refreshToken) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject, method, path, opts: { body, query, headers: extraHeaders, formData } })
      })
    }
    isRefreshing = true
    try {
      const refreshRes = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      })
      if (refreshRes.ok) {
        const data = await refreshRes.json()
        setTokens(data.accessToken, data.refreshToken)
        hdrs['Authorization'] = `Bearer ${data.accessToken}`
        res = await fetch(url, { ...opts, headers: hdrs })
        refreshQueue.forEach(q => {
          request(q.method, q.path, q.opts).then(q.resolve).catch(q.reject)
        })
      } else {
        clearAuth()
        window.location.hash = '#/login'
      }
    } catch {
      clearAuth()
      window.location.hash = '#/login'
    } finally {
      isRefreshing = false
      refreshQueue = []
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }))
    const e = new Error(err.error?.message || res.statusText)
    e.status = res.status
    if (err.error?.code) e.code = err.error.code
    if (err.error?.details) e.details = err.error.details
    throw e
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get:    (path, opts) => request('GET', path, opts),
  post:   (path, opts) => request('POST', path, opts),
  put:    (path, opts) => request('PUT', path, opts),
  delete: (path, opts) => request('DELETE', path, opts),
}
