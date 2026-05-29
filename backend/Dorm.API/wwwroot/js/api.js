// Fetch wrapper — handles auth headers, token refresh on 401, and error envelopes
(function () {
  var BASE = '/api'
  var isRefreshing = false
  var refreshQueue = []

  async function request(method, path, opts) {
    opts = opts || {}
    var url = BASE + path
    if (opts.query) {
      var params = new URLSearchParams()
      for (var k in opts.query) {
        var v = opts.query[k]
        if (v !== undefined && v !== null && v !== '') {
          if (Array.isArray(v)) v.forEach(function (item) { params.append(k, item) })
          else params.append(k, v)
        }
      }
      var qs = params.toString()
      if (qs) url += '?' + qs
    }

    var hdrs = Object.assign({}, opts.headers || {})
    var tokens = window.auth ? window.auth.getTokens() : null
    if (tokens && tokens.accessToken) hdrs['Authorization'] = 'Bearer ' + tokens.accessToken

    var fetchOpts = { method: method, headers: hdrs }
    if (opts.formData) {
      fetchOpts.body = opts.formData
    } else if (opts.body) {
      hdrs['Content-Type'] = 'application/json'
      fetchOpts.body = JSON.stringify(opts.body)
    }

    var res = await fetch(url, fetchOpts)

    if (res.status === 401 && tokens && tokens.refreshToken) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          refreshQueue.push({ resolve: resolve, reject: reject, method: method, path: path, opts: opts })
        })
      }
      isRefreshing = true
      try {
        var refreshRes = await fetch(BASE + '/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        })
        if (refreshRes.ok) {
          var data = await refreshRes.json()
          window.auth.setTokens(data.accessToken, data.refreshToken)
          hdrs['Authorization'] = 'Bearer ' + data.accessToken
          res = await fetch(url, Object.assign({}, fetchOpts, { headers: hdrs }))
          refreshQueue.forEach(function (q) {
            request(q.method, q.path, q.opts).then(q.resolve).catch(q.reject)
          })
        } else {
          window.auth.clearAuth()
        }
      } catch (e) {
        window.auth.clearAuth()
      } finally {
        isRefreshing = false
        refreshQueue = []
      }
    }

    if (!res.ok) {
      var err = await res.json().catch(function () { return { error: { message: res.statusText } } })
      var e = new Error((err.error && err.error.message) || res.statusText)
      e.status = res.status
      if (err.error && err.error.code) e.code = err.error.code
      if (err.error && err.error.details) e.details = err.error.details
      throw e
    }

    if (res.status === 204) return null
    return res.json()
  }

  window.api = {
    get: function (path, opts) { return request('GET', path, opts) },
    post: function (path, opts) { return request('POST', path, opts) },
    put: function (path, opts) { return request('PUT', path, opts) },
    delete: function (path, opts) { return request('DELETE', path, opts) },
  }
})()
