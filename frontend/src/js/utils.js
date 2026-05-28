// Shared utilities — escapeHtml prevents XSS when rendering user-generated content
const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeHtml(str) {
  if (!str) return ''
  return String(str).replace(/[&<>"']/g, ch => ESC_MAP[ch])
}
