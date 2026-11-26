import { useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'

/** Quiet Work · Contact links that appear once the hero has scrolled away. */
export default function SiteNav() {
  const { scrollY } = useScroll()
  const [show, setShow] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setShow(y > window.innerHeight * 0.8))

  const link =
    'inline-flex min-h-11 items-center px-3 text-[11px] font-medium uppercase tracking-[0.3em] text-slate-300 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8C7FF]'

  return (
    <AnimatePresence>
      {show && (
        <motion.nav
          aria-label="Primary"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed right-4 z-50 flex items-center rounded-full border border-[#A8C7FF]/15 bg-[#020617]/55 px-2 backdrop-blur-md sm:right-8"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
        >
          <a href="#projects" className={link}>
            Work
          </a>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <a href="#contact" className={link}>
            Contact
          </a>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}
