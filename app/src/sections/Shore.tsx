import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { contact } from '../data/contact'

/* ------------------------------------------------------------------ */
/*  Stage 5 — Reach the Shore                                           */
/*  Night thins into a quiet dawn over calm water. Contact, a short     */
/*  message form, and a peaceful close.                                 */
/* ------------------------------------------------------------------ */

const EASE = [0.22, 1, 0.36, 1] as const

const reveal = {
  initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, amount: 0.4 },
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  )
}

/** One seamless wave tile, drawn twice so it can loop horizontally. */
function wavepath(amp: number, y: number) {
  const seg = (x: number) => `C ${x + 150} ${y - amp}, ${x + 250} ${y + amp}, ${x + 400} ${y}`
  let d = `M 0 ${y} `
  for (let x = 0; x < 1600; x += 400) d += seg(x) + ' '
  return d + 'L 1600 200 L 0 200 Z'
}

function Shoreline() {
  const layers = [
    { amp: 6, y: 40, fill: 'rgba(168,199,255,0.06)', dur: 38 },
    { amp: 8, y: 70, fill: 'rgba(168,199,255,0.08)', dur: 28 },
    { amp: 5, y: 105, fill: 'rgba(196,167,125,0.07)', dur: 46 },
  ]
  return (
    <div aria-hidden="true" className="pointer-events-none relative h-40 w-full overflow-hidden sm:h-48">
      {layers.map((l, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 800 200"
          preserveAspectRatio="none"
          className="absolute inset-y-0 left-0 h-full w-[200%]"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: l.dur, ease: 'linear', repeat: Infinity }}
        >
          <path d={wavepath(l.amp, l.y)} fill={l.fill} transform="scale(0.5 1)" />
        </motion.svg>
      ))}
      {/* the first light lying on the water */}
      <div className="absolute inset-x-0 top-6 mx-auto h-px max-w-xl bg-gradient-to-r from-transparent via-[#C4A77D]/40 to-transparent" />
    </div>
  )
}

type Status = 'idle' | 'sending' | 'sent' | 'error'

function MessageForm() {
  const [status, setStatus] = useState<Status>('idle')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>

    // Honeypot: real people never fill this field
    if (data.company) return

    if (!contact.formEndpoint) {
      const subject = encodeURIComponent(`Hello from ${data.name}`)
      const body = encodeURIComponent(`${data.message}\n\n— ${data.name}\n${data.email}`)
      window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`
      return
    }

    setStatus('sending')
    try {
      const res = await fetch(contact.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: data.name, email: data.email, message: data.message }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setStatus('sent')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  const field =
    'w-full border-0 border-b border-[#A8C7FF]/20 bg-transparent px-0 py-3 text-[15px] text-slate-100 placeholder:text-slate-400 transition-colors focus:border-[#A8C7FF]/70 focus:outline-none focus:ring-0'
  const label = 'text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400'

  if (status === 'sent') {
    return (
      <div role="status" className="flex flex-col gap-3 py-10">
        <p className="font-display text-3xl font-light text-slate-100">Thank you.</p>
        <p className="text-sm leading-relaxed text-slate-400">Your message has reached the shore. I'll write back soon.</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-4 inline-flex min-h-11 w-fit items-center text-sm text-[#A8C7FF] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8C7FF]"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8" noValidate={false}>
      <div className="grid gap-8 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={label}>Name</span>
          <input name="name" type="text" required autoComplete="name" className={field} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>Email</span>
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className={label}>Message</span>
        <textarea name="message" required rows={4} className={`${field} resize-none leading-relaxed`} />
      </label>

      {/* Spam trap, hidden from people and assistive tech */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#C4A77D]/60 px-7 text-sm font-medium tracking-wide text-[#e6d3b3] transition-colors hover:border-[#C4A77D] hover:bg-[#C4A77D]/10 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C4A77D]"
        >
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        {status === 'error' && (
          <p role="alert" className="text-sm text-slate-300">
            It didn't go through. Please write to{' '}
            <a href={`mailto:${contact.email}`} className="text-[#A8C7FF] underline underline-offset-4">
              {contact.email}
            </a>
            .
          </p>
        )}
        {!contact.formEndpoint && status !== 'error' && (
          <p className="text-xs text-slate-400">Opens your email app with your message ready to send.</p>
        )}
      </div>
    </form>
  )
}

function Channels() {
  const [copied, setCopied] = useState(false)

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(contact.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      window.location.href = `mailto:${contact.email}`
    }
  }

  const row =
    'group flex min-h-14 items-center justify-between gap-6 border-b border-[#A8C7FF]/10 py-4 text-slate-200 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A8C7FF]'

  return (
    <ul className="flex flex-col border-t border-[#A8C7FF]/10">
      <li className={row}>
        <a href={`mailto:${contact.email}`} className="flex flex-col gap-1 focus-visible:outline-none">
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">Email</span>
          <span className="text-[15px]">{contact.email}</span>
        </a>
        <button
          type="button"
          onClick={copyEmail}
          className="min-h-11 rounded-full px-3 text-xs text-[#A8C7FF] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A8C7FF]"
        >
          <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </li>
      {contact.linkedin && (
        <li>
          <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className={row}>
            <span className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">LinkedIn</span>
              <span className="text-[15px]">Connect professionally</span>
            </span>
            <span className="text-[#A8C7FF] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
              <ArrowIcon />
            </span>
          </a>
        </li>
      )}
      <li>
        <a href={contact.github} target="_blank" rel="noopener noreferrer" className={row}>
          <span className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">GitHub</span>
            <span className="text-[15px]">{contact.github.replace('https://', '')}</span>
          </span>
          <span className="text-[#A8C7FF] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
            <ArrowIcon />
          </span>
        </a>
      </li>
    </ul>
  )
}

export default function Shore() {
  return (
    <section
      id="contact"
      aria-labelledby="shore-heading"
      className="relative overflow-hidden"
      // Night thinning toward first light: navy → slate-blue → a muted warm hush at the horizon
      style={{ background: 'linear-gradient(180deg, #020617 0%, #0a1430 38%, #1b2847 70%, #2b3352 88%, #3a3a52 100%)' }}
    >
      {/* the setting moon, small and low: the night is ending */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[12%] top-[58%] h-10 w-10 rounded-full opacity-50 sm:h-12 sm:w-12"
        style={{ background: 'radial-gradient(circle at 38% 40%, #f2f4fb 0%, #cdd6ea 55%, #9aa6c2 100%)', boxShadow: '0 0 40px 6px rgba(168,199,255,0.12)' }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-32 sm:px-14 sm:pt-40 lg:px-24 xl:px-32">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-24">
          <motion.div {...reveal} transition={{ duration: 1.3, ease: EASE }} className="flex flex-col gap-10">
            <div>
              <p className="mb-5 text-[10px] font-light uppercase tracking-[0.6em] text-slate-400">Reach the Shore</p>
              <h2 id="shore-heading" className="font-display text-4xl font-light leading-[1.08] text-slate-100 sm:text-5xl lg:text-6xl">
                Let's build what
                <br />
                comes next.
              </h2>
              <p className="mt-6 max-w-md text-[15px] font-light leading-relaxed text-slate-400">
                Open to software, cloud and ML engineering roles, and to thoughtful collaborations. Write to me, and I'll answer.
              </p>
            </div>
            <Channels />
          </motion.div>

          <motion.div {...reveal} transition={{ duration: 1.3, delay: 0.15, ease: EASE }} className="lg:pt-24">
            <MessageForm />
          </motion.div>
        </div>
      </div>

      <Shoreline />

      <footer className="relative flex flex-col items-center gap-2 px-6 pb-12 pt-4 text-center">
        <p className="font-display text-xl font-light text-slate-200/80">Wafa Felahi</p>
        <p className="text-[10px] uppercase tracking-[0.5em] text-slate-400/80">
          Lunossa · © {new Date().getFullYear()}
        </p>
      </footer>
    </section>
  )
}
