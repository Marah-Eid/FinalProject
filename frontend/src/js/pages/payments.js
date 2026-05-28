// Payments page — shows payment history with type icons, status pills, and total paid summary
import { t } from '../i18n.js'
import { api } from '../api.js'

const TYPE_ICONS = {
  0: 'bi-people',
  1: 'bi-star',
  2: 'bi-patch-check',
  MatchCommission: 'bi-people',
  FeaturedListing: 'bi-star',
  VerifiedBadge: 'bi-patch-check',
}

const TYPE_KEYS = {
  0: 'MatchCommission',
  1: 'FeaturedListing',
  2: 'VerifiedBadge',
}

const STATUS_COLORS = { 0: 'warning', 1: 'success', 2: 'danger', Pending: 'warning', Completed: 'success', Failed: 'danger' }

export function paymentsPage() {
  const html = `
    <div class="container py-4 fade-in" style="max-width:800px">
      <h1 class="h3 fw-bold mb-1">${t('payments.title')}</h1>
      <p class="text-secondary small mb-4">${t('payments.subtitle')}</p>

      <div id="payments-list">
        <div class="d-flex flex-column gap-3">
          <div class="skeleton" style="height:80px"></div>
          <div class="skeleton" style="height:80px"></div>
        </div>
      </div>
    </div>
  `

  function mount() {
    loadPayments()
  }

  async function loadPayments() {
    const container = document.getElementById('payments-list')
    if (!container) return

    try {
      const payments = await api.get('/payments/history')
      const items = payments.items || payments || []

      if (items.length === 0) {
        container.innerHTML = `
          <div class="text-center py-5">
            <div class="icon-box icon-box-brand mx-auto mb-3" style="width:64px;height:64px;font-size:1.5rem"><i class="bi bi-credit-card"></i></div>
            <h5 class="fw-bold">${t('payments.empty.title')}</h5>
            <p class="text-secondary small">${t('payments.empty.description')}</p>
          </div>
        `
        return
      }

      const total = items.filter(p => (p.status === 1 || p.status === 'Completed')).reduce((s, p) => s + (p.amount || 0), 0)

      container.innerHTML = `
        ${total > 0 ? `<div class="alert alert-primary bg-primary bg-opacity-10 border-0 rounded-3 mb-4 fw-semibold">${t('payments.totalPaid', { amount: total + ' JOD' })}</div>` : ''}
        <div class="d-flex flex-column gap-3">
          ${items.map(paymentCard).join('')}
        </div>
      `
    } catch {
      container.innerHTML = `<div class="text-center py-5"><p class="text-danger small">${t('errors.generic')}</p></div>`
    }
  }

  return { html, mount }
}

function paymentCard(p) {
  const typeKey = TYPE_KEYS[p.type] || p.type || 'MatchCommission'
  const icon = TYPE_ICONS[p.type] || TYPE_ICONS[typeKey] || 'bi-credit-card'
  const statusKey = typeof p.status === 'number' ? ['Pending','Completed','Failed'][p.status] : (p.status || 'Pending')
  const statusColor = STATUS_COLORS[p.status] || STATUS_COLORS[statusKey] || 'secondary'
  const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''

  return `
    <div class="card-dorm p-3">
      <div class="d-flex align-items-center gap-3">
        <div class="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary" style="width:44px;height:44px;min-width:44px">
          <i class="bi ${icon}"></i>
        </div>
        <div class="flex-grow-1 min-w-0">
          <p class="fw-semibold mb-0">${t('payments.types.' + typeKey)}</p>
          <p class="text-secondary small mb-0">${dateStr}${p.transactionRef ? ` · ${p.transactionRef}` : ''}</p>
        </div>
        <div class="text-end">
          <p class="fw-bold mb-0" style="color:var(--brand-600)">${p.amount} JOD</p>
          <span class="badge rounded-pill bg-${statusColor} bg-opacity-10 text-${statusColor}" style="font-size:0.7rem">${t('payments.statuses.' + statusKey)}</span>
        </div>
      </div>
    </div>
  `
}
