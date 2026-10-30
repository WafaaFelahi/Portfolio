import { motion } from 'framer-motion'
import MoonScene from './MoonScene'

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
  return (
    <section className="relative h-screen min-h-[640px] w-full overflow-hidden bg-[#020617]">
      {/* ------------------------------------------------ LEFT · 45% */}
      <div className="relative z-10 flex h-full w-full flex-col justify-center px-8 sm:px-14 lg:px-24 xl:px-32">
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
            className="mt-10 text-[11px] font-light uppercase tracking-[0.3em] text-slate-500 sm:text-xs"
          >
            Full-Stack Developer&nbsp;&nbsp;·&nbsp;&nbsp;Cloud &amp; DevOps
            Engineer&nbsp;&nbsp;·&nbsp;&nbsp;ML/DL Practitioner
          </motion.p>
        </motion.div>

        {/* DESCEND — soft anchor at the bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4, duration: 1.6 }}
          className="absolute bottom-10 left-8 flex items-center gap-4 sm:left-14 lg:left-24 xl:left-32"
        >
          <motion.span
            animate={{ scaleY: [0, 1, 1, 0.2, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="block h-12 w-px origin-top bg-gradient-to-b from-transparent via-slate-500 to-transparent"
          />
          <motion.span
            animate={{ opacity: [0.35, 0.8, 0.35] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="text-[10px] font-light uppercase tracking-[0.6em] text-slate-500"
          >
            Descend
          </motion.span>
        </motion.div>
      </div>

      {/* ------------------------------------------- VISUAL · right 55%
          On small screens the same scene settles behind the text, dimmed. */}
      <div className="pointer-events-none absolute inset-0 opacity-40 md:left-[45%] md:right-0 md:opacity-100">
        <MoonScene />
      </div>

      {/* Soft vignette to melt the scene edges into the dark */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(2,6,23,0.75)_100%)]" />
    </section>
  )
}
