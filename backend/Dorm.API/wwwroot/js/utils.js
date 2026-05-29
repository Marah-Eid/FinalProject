// Shared utilities — escapeHtml prevents XSS when rendering user-generated content
(function () {
  var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

  function escapeHtml(str) {
    if (!str) return ''
    return String(str).replace(/[&<>"']/g, function (ch) { return ESC_MAP[ch] })
  }

  window.escapeHtml = escapeHtml
})()
