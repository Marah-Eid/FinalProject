(function () {
  function updateSidebar() {
    var user = auth.getUser()
    if (!user) {
      window.location.href = '/Account/Login'
      return
    }

    var roleName = ''
    if (user.role === 0) roleName = 'student'
    else if (user.role === 1) roleName = 'owner'
    else if (user.role === 2) roleName = 'admin'

    document.querySelectorAll('[data-role]').forEach(function (el) {
      if (el.dataset.role === roleName) el.classList.remove('d-none')
    })

    var current = window.location.pathname.toLowerCase()
    document.querySelectorAll('.sidebar-item a.sidebar-link').forEach(function (a) {
      var href = (a.getAttribute('href') || '').toLowerCase()
      if (href && current === href) {
        a.closest('.sidebar-item').classList.add('active')
      }
    })
  }

  auth.initAuth().then(updateSidebar)
})()
