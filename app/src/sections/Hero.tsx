import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import MoonScene from './MoonScene'
import FilmFinish from '../components/FilmFinish'

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.22, delayChildren: 0.4 },
  },
}

const item = {
  hidden: { opacity: 0, y: 28, filter: 'blur(10px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref)
  const reduced = useReducedMotion() ?? false
  return (
    <section ref={ref} className="relative h-screen min-h-[640px] w-full overflow-hidden bg-[#020617]">
      {/* ------------------------------------------------ LEFT · 45%
          On phones the text sits low so the moon can live above it. */}
      <div className="relative z-10 flex h-full w-full flex-col justify-end px-8 pb-28 sm:px-14 md:justify-center md:pb-[12vh] lg:px-24 xl:px-32">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-xl"
        >
          <motion.p
            variants={item}
            className="mb-8 text-[11px] font-light uppercase tracking-[0.55em] text-slate-400"
          >
            Lunossa
          </motion.p>

          <motion.h1
            variants={item}
            className="font-display text-6xl font-light leading-[1.05] text-slate-100 sm:text-7xl lg:text-8xl"
          >
            Wafa Felahi
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 font-display text-xl font-light italic text-slate-300 sm:text-2xl"
          >
            Software &amp; DevOps Engineer
          </motion.p>

          <motion.p
            variants={item}
            className="mt-10 text-[11px] font-light uppercase tracking-[0.3em] text-slate-400 sm:text-xs"
          >
            Full-Stack Developer&nbsp;&nbsp;·&nbsp;&nbsp;Cloud &amp; DevOps
            Engineer&nbsp;&nbsp;·&nbsp;&nbsp;ML/DL Practitioner
          </motion.p>
        </motion.div>

        {/* DESCEND — soft anchor at the bottom; a real link into the Journey */}
        <motion.a
          href="#journey"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4, duration: 1.6 }}
          className="absolute bottom-10 left-8 flex min-h-11 items-center gap-4 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A8C7FF] sm:left-14 lg:left-24 xl:left-32"
        >
          <motion.span
            animate={{ scaleY: [0, 1, 1, 0.2, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="block h-12 w-px origin-top bg-gradient-to-b from-transparent via-slate-500 to-transparent"
          />
          <motion.span
            // breathing kept, but never below a readable floor (was 0.35 → ~1.8:1)
            animate={{ opacity: [0.72, 1, 0.72] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="text-[10px] font-light uppercase tracking-[0.6em] text-slate-300"
          >
            Descend
          </motion.span>
        </motion.a>
      </div>

      {/* ------------------------------------------- VISUAL · right 55%
          On phones the scene takes the upper part of the screen, above the name. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[58%] md:inset-y-0 md:left-[45%] md:right-0 md:h-auto">
        <MoonScene active={inView} reduced={reduced} />
      </div>

      {/* Soft vignette to melt the scene edges into the dark */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(2,6,23,0.75)_100%)]" />
      {/* the same still film grain as the Journey, so the site reads as one film */}
      <FilmFinish vignette={false} />
    </section>
  )
}
