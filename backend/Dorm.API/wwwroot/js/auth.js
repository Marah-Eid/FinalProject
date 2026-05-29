// Auth state — manages JWT tokens in localStorage, login/register/logout, and user hydration
(function () {
  var currentUser = null
  var listeners = []
  var initPromise = null

  function getUser() { return currentUser }

  function onAuthChange(fn) {
    listeners.push(fn)
    return function () { listeners = listeners.filter(function (l) { return l !== fn }) }
  }

  function notify() { listeners.forEach(function (fn) { fn(currentUser) }) }

  function getTokens() {
    var accessToken = localStorage.getItem('accessToken')
    var refreshToken = localStorage.getItem('refreshToken')
    if (!accessToken) return null
    return { accessToken: accessToken, refreshToken: refreshToken }
  }

  function setTokens(access, refresh) {
    localStorage.setItem('accessToken', access)
    if (refresh) localStorage.setItem('refreshToken', refresh)
  }

  function clearAuth() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    currentUser = null
    notify()
  }

  async function login(email, password) {
    var data = await window.api.post('/auth/login', { body: { email: email, password: password } })
    setTokens(data.accessToken, data.refreshToken)
    currentUser = data.user
    notify()
    return currentUser
  }

  async function register(payload) {
    var data = await window.api.post('/auth/register', { body: payload })
    setTokens(data.accessToken, data.refreshToken)
    currentUser = data.user
    notify()
    return currentUser
  }

  function logout() {
    clearAuth()
    window.location.href = '/'
  }

  async function fetchMe() {
    try {
      var tokens = getTokens()
      if (!tokens) return null
      currentUser = await window.api.get('/users/me')
      notify()
      return currentUser
    } catch (e) {
      clearAuth()
      return null
    }
  }

  function initAuth() {
    if (initPromise) return initPromise
    initPromise = fetchMe()
    return initPromise
  }

  window.auth = {
    getUser: getUser, onAuthChange: onAuthChange, getTokens: getTokens,
    setTokens: setTokens, clearAuth: clearAuth, login: login, register: register,
    logout: logout, fetchMe: fetchMe, initAuth: initAuth
  }
})()
