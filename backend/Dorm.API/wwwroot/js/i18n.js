// i18n — English only. window.t(key, params) returns translated string.
(function () {
  var translations = {}
  var ready = false
  var waiters = []

  fetch('/locales/en.json').then(function (r) { return r.json() }).then(function (data) {
    translations = data
    ready = true
    waiters.forEach(function (fn) { fn() })
    waiters.length = 0
  })

  function t(key, params) {
    params = params || {}
    var keys = key.split('.')
    var val = translations
    for (var i = 0; i < keys.length; i++) {
      if (val == null) return key
      val = val[keys[i]]
    }
    if (typeof val !== 'string') return key
    return val.replace(/\{\{(\w+)\}\}/g, function (_, name) {
      return params[name] != null ? params[name] : ''
    })
  }

  function whenReady(fn) {
    if (ready) fn()
    else waiters.push(fn)
  }

  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'

  window.i18n = { t: t, getLang: function () { return 'en' }, isRtl: function () { return false }, setLang: function () {}, whenReady: whenReady }
  window.t = t
})()
