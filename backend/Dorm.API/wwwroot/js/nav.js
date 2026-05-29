(function () {
  function updateNav() {
    var user = auth.getUser()

    var loginEls = document.querySelectorAll('#nav-login, [data-nav-login]')
    var registerEls = document.querySelectorAll('#nav-register, [data-nav-register]')
    var dashboardEls = document.querySelectorAll('#nav-dashboard, [data-nav-dashboard]')
    var logoutEls = document.querySelectorAll('#nav-logout, [data-nav-logout]')

    if (user) {
      loginEls.forEach(function (el) { el.style.display = 'none' })
      registerEls.forEach(function (el) { el.style.display = 'none' })

      // Show dashboard link for owner/admin only
      dashboardEls.forEach(function (el) {
        var link = el.querySelector('a')
        if (user.role === 1) {
          el.style.display = ''; el.classList.remove('d-none')
          if (link) { link.href = '/Dashboard'; link.textContent = 'Dashboard' }
        } else if (user.role === 2) {
          el.style.display = ''; el.classList.remove('d-none')
          if (link) { link.href = '/Admin'; link.textContent = 'Admin' }
        } else {
          el.style.display = 'none'
        }
      })

      // Show logout
      logoutEls.forEach(function (el) {
        el.style.display = ''
        el.classList.remove('d-none')
      })
    } else {
      loginEls.forEach(function (el) { el.style.display = '' })
      registerEls.forEach(function (el) { el.style.display = '' })
      dashboardEls.forEach(function (el) { el.style.display = 'none' })
      logoutEls.forEach(function (el) { el.style.display = 'none' })
    }
  }

  auth.initAuth().then(function () {
    updateNav()
    setTimeout(updateNav, 300)
    auth.onAuthChange(updateNav)
  })
})()
