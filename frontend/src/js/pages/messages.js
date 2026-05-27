import { t } from '../i18n.js'
import { api } from '../api.js'
import { getUser } from '../auth.js'
import { escapeHtml } from '../utils.js'

export function messagesPage(conversationId) {
  const html = `
    <div class="container py-4 fade-in" style="max-width:1000px">
      <h1 class="h3 fw-bold mb-1">${t('messages.title')}</h1>
      <p class="text-secondary small mb-4">${t('messages.subtitle')}</p>

      <div class="card-dorm overflow-hidden" style="height:calc(100vh - 220px);min-height:500px">
        <div class="row g-0 h-100">
          <!-- Conversation list -->
          <div class="col-md-4 border-end h-100" id="convo-list-col">
            <div class="d-flex flex-column h-100">
              <div id="convo-list" class="flex-grow-1 overflow-auto">
                <div class="p-4 text-center"><div class="spinner-border spinner-border-sm text-primary"></div></div>
              </div>
            </div>
          </div>

          <!-- Chat area -->
          <div class="col-md-8 h-100" id="chat-col">
            <div class="d-flex flex-column h-100" id="chat-area">
              <div class="flex-grow-1 d-flex align-items-center justify-content-center text-center p-4">
                <div>
                  <i class="bi bi-chat-dots text-secondary" style="font-size:3rem;opacity:0.3"></i>
                  <p class="text-secondary small mt-2">${t('messages.pickOneHint')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  let conversations = []
  let activeConvoId = conversationId || null
  let pollConvosTimer = null
  let pollMsgsTimer = null

  function mount() {
    loadConversations()

    pollConvosTimer = setInterval(loadConversations, 15000)

    return () => {
      if (pollConvosTimer) clearInterval(pollConvosTimer)
      if (pollMsgsTimer) clearInterval(pollMsgsTimer)
    }
  }

  async function loadConversations() {
    try {
      conversations = await api.get('/conversations')
      renderConvoList()
      if (activeConvoId) openConversation(activeConvoId)
    } catch {
      const el = document.getElementById('convo-list')
      if (el) el.innerHTML = `<div class="p-4 text-center"><p class="text-danger small">${t('errors.generic')}</p></div>`
    }
  }

  function renderConvoList() {
    const el = document.getElementById('convo-list')
    if (!el) return

    if (!conversations || conversations.length === 0) {
      el.innerHTML = `
        <div class="text-center py-5 px-3">
          <i class="bi bi-chat-dots text-secondary" style="font-size:2rem;opacity:0.3"></i>
          <p class="text-secondary small mt-2">${t('messages.empty.title')}</p>
          <p class="text-secondary small">${t('messages.empty.description')}</p>
        </div>
      `
      return
    }

    const user = getUser()
    el.innerHTML = conversations.map(c => {
      const other = c.otherPartyName || c.otherParty?.fullName || '—'
      const lastMsg = c.lastMessageText || c.lastMessage?.text || t('messages.noMessagesYet')
      const unread = c.unreadCount || 0
      const isActive = c.id == activeConvoId

      return `
        <a href="#/messages/${c.id}" class="d-flex align-items-center gap-3 p-3 text-decoration-none convo-item border-bottom"
           style="background:${isActive ? 'var(--brand-50)' : 'transparent'};transition:background 0.15s"
           data-convo-id="${c.id}">
          <div class="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary" style="width:42px;height:42px;min-width:42px">
            <i class="bi bi-person"></i>
          </div>
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex justify-content-between align-items-center">
              <p class="mb-0 small fw-semibold text-dark text-truncate">${other}</p>
              ${unread > 0 ? `<span class="badge rounded-pill bg-primary" style="font-size:0.65rem">${unread}</span>` : ''}
            </div>
            <p class="mb-0 text-secondary text-truncate" style="font-size:0.75rem">${lastMsg}</p>
            ${c.apartmentTitle ? `<p class="mb-0 text-secondary text-truncate" style="font-size:0.65rem"><i class="bi bi-building me-1"></i>${c.apartmentTitle}</p>` : ''}
          </div>
        </a>
      `
    }).join('')

    el.querySelectorAll('.convo-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault()
        const id = item.dataset.convoId
        activeConvoId = id
        window.location.hash = `#/messages/${id}`
        renderConvoList()
        openConversation(id)
      })
    })
  }

  async function openConversation(id) {
    if (pollMsgsTimer) { clearInterval(pollMsgsTimer); pollMsgsTimer = null }

    const chatArea = document.getElementById('chat-area')
    if (!chatArea) return

    try {
      const [convo, messages] = await Promise.all([
        conversations.find(c => c.id == id) || api.get(`/conversations/${id}`),
        api.get(`/conversations/${id}/messages`),
      ])

      const other = convo.otherPartyName || convo.otherParty?.fullName || '—'

      chatArea.innerHTML = `
        <div class="p-3 border-bottom d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary d-md-none me-1" id="msg-back"><i class="bi bi-arrow-right"></i></button>
          <div class="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary" style="width:36px;height:36px"><i class="bi bi-person"></i></div>
          <div>
            <p class="mb-0 small fw-semibold">${other}</p>
            ${convo.apartmentTitle ? `<p class="mb-0 text-secondary" style="font-size:0.7rem">${convo.apartmentTitle}</p>` : ''}
          </div>
        </div>
        <div class="flex-grow-1 overflow-auto p-3" id="messages-list"
          ${renderMessages(messages)}
        </div>
        <div class="p-3 border-top">
          <form class="d-flex gap-2" id="send-form">
            <input type="text" class="form-control rounded-3" id="msg-input" placeholder="${t('messages.placeholder')}" autocomplete="off" />
            <button type="submit" class="btn btn-brand px-3"><i class="bi bi-send"></i></button>
          </form>
        </div>
      `

      const msgList = document.getElementById('messages-list')
      if (msgList) msgList.scrollTop = msgList.scrollHeight

      try { await api.put(`/conversations/${id}/read`) } catch {}

      document.getElementById('send-form')?.addEventListener('submit', async (e) => {
        e.preventDefault()
        const input = document.getElementById('msg-input')
        const text = input.value.trim()
        if (!text) return

        input.value = ''
        try {
          await api.post(`/conversations/${id}/messages`, { body: { text } })
          await refreshMessages(id)
        } catch {}
      })

      document.getElementById('msg-back')?.addEventListener('click', () => {
        document.getElementById('convo-list-col')?.classList.remove('d-none')
        document.getElementById('chat-col')?.classList.remove('d-none')
        activeConvoId = null
        renderConvoList()
      })

      pollMsgsTimer = setInterval(() => refreshMessages(id), 10000)
    } catch (err) {
      chatArea.innerHTML = `<div class="p-4 text-center"><p class="text-danger small">${t('messages.notFound')}</p></div>`
    }
  }

  function renderMessages(messages) {
    if (!messages || messages.length === 0) {
      return `<div class="text-center py-4"><p class="text-secondary small">${t('messages.startConversation')}</p></div>`
    }

    const user = getUser()
    const sorted = [...messages].sort((a, b) => new Date(a.sentAt || a.createdAt) - new Date(b.sentAt || b.createdAt))

    return sorted.map(m => {
      const isMine = m.senderId === user?.id
      return `
        <div class="d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'} mb-2">
          <div class="msg-bubble ${isMine ? 'msg-mine' : 'msg-other'}">
            ${escapeHtml(m.text)}
            <div class="d-flex align-items-center gap-1 mt-1" style="font-size:0.65rem;opacity:0.7">
              <span>${formatTime(m.sentAt || m.createdAt)}</span>
              ${isMine ? `<i class="bi ${m.isRead ? 'bi-check-all' : 'bi-check'}"></i>` : ''}
            </div>
          </div>
        </div>
      `
    }).join('')
  }

  async function refreshMessages(id) {
    try {
      const messages = await api.get(`/conversations/${id}/messages`)
      const msgList = document.getElementById('messages-list')
      if (msgList) {
        const wasAtBottom = msgList.scrollTop + msgList.clientHeight >= msgList.scrollHeight - 50
        msgList.innerHTML = renderMessages(messages)
        if (wasAtBottom) msgList.scrollTop = msgList.scrollHeight
      }
    } catch {}
  }

  return { html, mount }
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
