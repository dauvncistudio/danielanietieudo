import './cursor.css'

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const finePointer = window.matchMedia('(pointer: fine)')

if (finePointer.matches && !reducedMotion.matches) {
  const ring = document.createElement('div')
  const dot = document.createElement('div')
  const label = document.createElement('span')
  ring.className = 'dau-cursor dau-cursor-ring'
  dot.className = 'dau-cursor dau-cursor-dot'
  label.className = 'dau-cursor-label'
  ring.setAttribute('aria-hidden', 'true')
  dot.setAttribute('aria-hidden', 'true')
  label.setAttribute('aria-hidden', 'true')
  document.body.append(ring, dot, label)
  document.documentElement.dataset.dauCursor = 'true'
  document.body.style.cursor = 'none'
  document.querySelectorAll<HTMLElement>('a, button, summary, .live-hit').forEach((element) => { element.style.cursor = 'none' })

  let pointerX = window.innerWidth / 2
  let pointerY = window.innerHeight / 2
  let ringX = pointerX
  let ringY = pointerY
  let dotX = pointerX
  let dotY = pointerY

  const updatePointer = (event: MouseEvent) => {
    pointerX = event.clientX
    pointerY = event.clientY
    ring.style.opacity = '1'
    dot.style.opacity = '1'
    ring.style.setProperty('--cursor-x', `${pointerX}px`)
    ring.style.setProperty('--cursor-y', `${pointerY}px`)
    dot.style.setProperty('--cursor-x', `${pointerX}px`)
    dot.style.setProperty('--cursor-y', `${pointerY}px`)
    label.style.setProperty('--cursor-x', `${pointerX}px`)
    label.style.setProperty('--cursor-y', `${pointerY}px`)
  }

  const frame = () => {
    ringX += (pointerX - ringX) * 0.14
    ringY += (pointerY - ringY) * 0.14
    dotX += (pointerX - dotX) * 0.34
    dotY += (pointerY - dotY) * 0.34
    ring.style.left = `${ringX}px`
    ring.style.top = `${ringY}px`
    dot.style.left = `${dotX}px`
    dot.style.top = `${dotY}px`
    label.style.left = `${ringX}px`
    label.style.top = `${ringY}px`
    requestAnimationFrame(frame)
  }

  window.addEventListener('mousemove', updatePointer, { passive: true })
  window.addEventListener('mouseleave', () => {
    ring.style.opacity = '0'
    dot.style.opacity = '0'
    label.style.opacity = '0'
  })

  const setHover = (element: Element, active: boolean) => {
    ring.classList.toggle('is-hover', active)
    dot.classList.toggle('is-hover', active)
    const customLabel = element.getAttribute('data-cursor-label')
    label.textContent = customLabel || (element.matches('.artwork') ? 'View' : element.matches('a') ? 'Open' : 'Explore')
    label.style.opacity = active && Boolean(customLabel || element.matches('.artwork, a')) ? '1' : '0'
  }

  document.addEventListener('mouseover', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('a, button, summary, .live-hit')
    if (target) setHover(target, true)
  })
  document.addEventListener('mouseout', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('a, button, summary, .live-hit')
    if (target && !target.contains(event.relatedTarget as Node)) setHover(target, false)
  })

  document.querySelectorAll<HTMLElement>('.btn-primary, .nav-cta').forEach((element) => {
    element.addEventListener('mousemove', (event) => {
      const rect = element.getBoundingClientRect()
      const x = event.clientX - rect.left - rect.width / 2
      const y = event.clientY - rect.top - rect.height / 2
      element.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`
    })
    element.addEventListener('mouseleave', () => { element.style.transform = '' })
  })

  document.querySelectorAll<HTMLElement>('.artwork, .portrait-frame').forEach((element) => {
    element.addEventListener('mousemove', (event) => {
      const rect = element.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - 0.5
      const y = (event.clientY - rect.top) / rect.height - 0.5
      element.style.setProperty('--cursor-tilt-x', `${y * -2.2}deg`)
      element.style.setProperty('--cursor-tilt-y', `${x * 2.2}deg`)
    })
    element.addEventListener('mouseleave', () => {
      element.style.removeProperty('--cursor-tilt-x')
      element.style.removeProperty('--cursor-tilt-y')
    })
  })

  frame()
}

const getRequestForm = () => document.querySelector<HTMLFormElement>('.request-form')
const setFormStatus = (message: string, state: 'success' | 'error' | 'info') => {
  const formStatus = document.querySelector<HTMLElement>('#form-status')
  if (!formStatus) return
  formStatus.textContent = message
  formStatus.className = `form-status-${state}`
  formStatus.dataset.state = state
}

document.addEventListener('submit', async (event) => {
  const requestForm = (event.target as HTMLElement).closest<HTMLFormElement>('.request-form')
  if (!requestForm) return
  event.preventDefault()
  const submitButton = requestForm.querySelector<HTMLButtonElement>('button[type="submit"]')
  const data = new FormData(requestForm)
  if (String(data.get('company') || '').trim()) return

  const isLocalPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  if (isLocalPreview) {
    setFormStatus('Preview mode: this form will deliver to email after the site is deployed on Netlify.', 'info')
    return
  }

  submitButton?.setAttribute('aria-busy', 'true')
  if (submitButton) submitButton.disabled = true
  setFormStatus('Sending your project request…', 'info')

  try {
    const body = new URLSearchParams()
    data.forEach((value, key) => body.append(key, String(value)))
    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    if (!response.ok) throw new Error(`Form submission failed with ${response.status}`)
    requestForm.reset()
    setFormStatus('Thanks — your project request has been sent. I’ll get back to you soon.', 'success')
  } catch {
    setFormStatus('The request could not be sent. Please email me directly or continue on WhatsApp below.', 'error')
  } finally {
    submitButton?.removeAttribute('aria-busy')
    if (submitButton) submitButton.disabled = false
  }
}, true)

document.addEventListener('click', (event) => {
  const clicked = event.target as HTMLElement
  const submitButton = clicked.closest<HTMLButtonElement>('.request-form button[type="submit"]')
  if (submitButton) {
    event.preventDefault()
    event.stopImmediatePropagation()
    submitButton.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    return
  }

  const alternative = clicked.closest<HTMLButtonElement>('.form-alternative')
  if (!alternative) return
  const requestForm = getRequestForm()
  if (!requestForm) return
  const data = new FormData(requestForm)
  const message = [`Project request from ${data.get('name') || 'a new client'}`, `Phone: ${data.get('phone') || 'Not provided'}`, `Email: ${data.get('email') || 'Not provided'}`, `Service: ${data.get('service') || 'Not selected'}`, `Details: ${data.get('details') || 'Not provided'}`].join('\n')
  window.open(`https://wa.me/2349115860032?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
}, true)
