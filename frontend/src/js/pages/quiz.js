import { t } from '../i18n.js'
import { api } from '../api.js'

const QUESTION_KEYS = ['SleepSchedule','Cleanliness','Smoking','StudyHabits','SocialStyle','Guests','Cooking','PetTolerance']

const QUESTION_OPTIONS = {
  SleepSchedule: ['EarlyBird','NightOwl','Flexible'],
  Cleanliness:   ['VeryTidy','Average','Relaxed'],
  Smoking:       ['Yes','No','Outside'],
  StudyHabits:   ['QuietAtHome','Library','GroupAtHome'],
  SocialStyle:   ['Introvert','Extrovert','Balanced'],
  Guests:        ['Often','Sometimes','Rarely'],
  Cooking:       ['CookALot','CookSometimes','MostlyEatOut'],
  PetTolerance:  ['LovePets','Tolerate','PreferNoPets'],
}

const QUESTION_ICONS = {
  SleepSchedule: 'bi-moon-stars',
  Cleanliness:   'bi-droplet',
  Smoking:       'bi-wind',
  StudyHabits:   'bi-book',
  SocialStyle:   'bi-people',
  Guests:        'bi-person-plus',
  Cooking:       'bi-cup-hot',
  PetTolerance:  'bi-heart',
}

export function quizPage() {
  const html = `
    <div class="container py-4 fade-in" style="max-width:640px">
      <div class="text-center mb-4">
        <span class="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-2 mb-3 fw-semibold" style="font-size:0.8rem">
          <i class="bi bi-stars me-1"></i> ${t('quiz.eyebrow')}
        </span>
        <h1 class="h3 fw-bold">${t('quiz.title')}</h1>
        <p class="text-secondary small">${t('quiz.subtitle')}</p>
      </div>

      <div id="quiz-loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <div id="quiz-container" class="d-none">
        <!-- Progress bar -->
        <div class="mb-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="small text-secondary" id="quiz-progress-label"></span>
            <span class="small text-secondary" id="quiz-editing-label"></span>
          </div>
          <div class="progress" style="height:6px;border-radius:3px">
            <div class="progress-bar" id="quiz-progress-bar" role="progressbar" style="background:linear-gradient(135deg,#6366F1,#8B5CF6);transition:width 0.3s"></div>
          </div>
          <div class="d-flex justify-content-between mt-2" id="quiz-dots"></div>
        </div>

        <!-- Question area -->
        <div class="card-dorm p-4 mb-4" id="quiz-question-card"></div>

        <!-- Navigation -->
        <div class="d-flex justify-content-between">
          <button class="btn btn-outline-secondary" id="quiz-prev" disabled>${t('common.previous')}</button>
          <button class="btn btn-brand" id="quiz-next">${t('common.next')}</button>
        </div>
      </div>
    </div>
  `

  let currentStep = 0
  const answers = {}
  let existingAnswers = null

  function mount() {
    loadQuiz()

    return
  }

  async function loadQuiz() {
    try {
      const data = await api.get('/quiz/my-answers').catch(() => null)
      if (data?.answers) {
        existingAnswers = data.answers
        for (const a of data.answers) {
          answers[a.questionKey || a.question] = a.answer || a.selectedOption
        }
      }
    } catch {}

    document.getElementById('quiz-loading').classList.add('d-none')
    document.getElementById('quiz-container').classList.remove('d-none')

    renderDots()
    renderQuestion()
    setupNav()
  }

  function renderDots() {
    const container = document.getElementById('quiz-dots')
    if (!container) return
    container.innerHTML = QUESTION_KEYS.map((key, i) => `
      <button class="btn btn-sm p-0 quiz-dot" data-step="${i}" title="${t('quiz.jumpTo', { n: i + 1 })}"
        style="width:28px;height:28px;border-radius:50%;border:2px solid ${i === currentStep ? 'var(--brand-500)' : answers[key] ? 'var(--brand-300)' : '#e2e8f0'};background:${i === currentStep ? 'var(--brand-50)' : answers[key] ? 'var(--brand-50)' : '#fff'};font-size:0.7rem;font-weight:600;color:${i === currentStep ? 'var(--brand-600)' : '#64748b'}">
        ${answers[key] ? '<i class="bi bi-check"></i>' : i + 1}
      </button>
    `).join('')

    container.querySelectorAll('.quiz-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        currentStep = parseInt(dot.dataset.step)
        renderQuestion()
        renderDots()
        updateNav()
      })
    })
  }

  function renderQuestion() {
    const key = QUESTION_KEYS[currentStep]
    const options = QUESTION_OPTIONS[key]
    const icon = QUESTION_ICONS[key]
    const selected = answers[key]

    document.getElementById('quiz-progress-label').textContent = t('quiz.progress', { n: currentStep + 1, total: QUESTION_KEYS.length })
    document.getElementById('quiz-progress-bar').style.width = `${((currentStep + 1) / QUESTION_KEYS.length) * 100}%`

    const editingLabel = document.getElementById('quiz-editing-label')
    if (existingAnswers?.length > 0) {
      editingLabel.textContent = t('quiz.previouslyCompleted')
    } else {
      editingLabel.textContent = ''
    }

    const card = document.getElementById('quiz-question-card')
    card.innerHTML = `
      <div class="d-flex align-items-center gap-3 mb-4">
        <div class="icon-box icon-box-brand"><i class="bi ${icon}"></i></div>
        <div>
          <h5 class="fw-bold mb-0">${t('quiz.q.' + key + '.title')}</h5>
          <p class="text-secondary small mb-0">${t('quiz.q.' + key + '.help')}</p>
        </div>
      </div>

      <div class="d-flex flex-column gap-2">
        ${options.map(opt => `
          <div class="quiz-option ${selected === opt ? 'selected' : ''}" data-value="${opt}" role="button" tabindex="0">
            <div class="d-flex align-items-center gap-3">
              <div class="d-flex align-items-center justify-content-center rounded-circle" style="width:24px;height:24px;min-width:24px;border:2px solid ${selected === opt ? 'var(--brand-500)' : '#cbd5e1'}; background:${selected === opt ? 'var(--brand-500)' : '#fff'}">
                ${selected === opt ? '<i class="bi bi-check text-white" style="font-size:0.75rem"></i>' : ''}
              </div>
              <div>
                <p class="mb-0 fw-semibold">${t('quiz.opt.' + key + '.' + opt)}</p>
                <p class="mb-0 text-secondary small">${t('quiz.optDesc.' + key + '.' + opt)}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `

    card.querySelectorAll('.quiz-option').forEach(el => {
      el.addEventListener('click', () => {
        answers[key] = el.dataset.value
        renderQuestion()
        renderDots()
      })
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          el.click()
        }
      })
    })
  }

  function setupNav() {
    document.getElementById('quiz-prev').addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep--
        renderQuestion()
        renderDots()
        updateNav()
      }
    })

    document.getElementById('quiz-next').addEventListener('click', async () => {
      if (currentStep < QUESTION_KEYS.length - 1) {
        currentStep++
        renderQuestion()
        renderDots()
        updateNav()
      } else {
        await submitQuiz()
      }
    })
  }

  function updateNav() {
    const prevBtn = document.getElementById('quiz-prev')
    const nextBtn = document.getElementById('quiz-next')
    if (!prevBtn || !nextBtn) return

    prevBtn.disabled = currentStep === 0
    if (currentStep === QUESTION_KEYS.length - 1) {
      nextBtn.textContent = t('quiz.submit')
    } else {
      nextBtn.textContent = t('common.next')
    }
  }

  async function submitQuiz() {
    const missing = QUESTION_KEYS.filter(k => !answers[k])
    if (missing.length > 0) {
      currentStep = QUESTION_KEYS.indexOf(missing[0])
      renderQuestion()
      renderDots()
      updateNav()
      return
    }

    const btn = document.getElementById('quiz-next')
    btn.disabled = true
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>' + t('quiz.submit')

    try {
      const payload = QUESTION_KEYS.map(key => ({
        questionKey: key,
        selectedOption: answers[key],
      }))
      await api.post('/quiz/answers', { body: { answers: payload } })
      window.location.hash = '#/dashboard'
    } catch (err) {
      btn.disabled = false
      btn.textContent = t('quiz.submit')
      const card = document.getElementById('quiz-question-card')
      if (card) {
        const existing = card.querySelector('.quiz-error')
        if (existing) existing.remove()
        card.insertAdjacentHTML('afterbegin', `<div class="alert alert-danger rounded-3 small quiz-error">${err.message || t('errors.generic')}</div>`)
      }
    }
  }

  return { html, mount }
}
