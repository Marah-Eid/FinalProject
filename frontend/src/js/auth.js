// Auth state — manages JWT tokens in localStorage, login/register/logout, and user hydration
import { api } from './api.js'

let currentUser = null
let listeners = []

export function getUser() { return currentUser }

export function onAuthChange(fn) {
  listeners.push(fn)
  return () => { listeners = listeners.filter(l => l !== fn) }
}

function notify() { listeners.forEach(fn => fn(currentUser)) }

export function getTokens() {
  const accessToken = localStorage.getItem('accessToken')
  const refreshToken = localStorage.getItem('refreshToken')
  if (!accessToken) return null
  return { accessToken, refreshToken }
}

export function setTokens(access, refresh) {
  localStorage.setItem('accessToken', access)
  if (refresh) localStorage.setItem('refreshToken', refresh)
}

export function clearAuth() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  currentUser = null
  notify()
}

export async function login(email, password) {
  const data = await api.post('/auth/login', { body: { email, password } })
  setTokens(data.accessToken, data.refreshToken)
  currentUser = data.user
  notify()
  return currentUser
}

export async function register(payload) {
  const data = await api.post('/auth/register', { body: payload })
  setTokens(data.accessToken, data.refreshToken)
  currentUser = data.user
  notify()
  return currentUser
}

export async function logout() {
  clearAuth()
  window.location.hash = '#/'
}

export async function fetchMe() {
  try {
    const tokens = getTokens()
    if (!tokens) return null
    currentUser = await api.get('/users/me')
    notify()
    return currentUser
  } catch {
    clearAuth()
    return null
  }
}

export async function initAuth() {
  await fetchMe()
}
