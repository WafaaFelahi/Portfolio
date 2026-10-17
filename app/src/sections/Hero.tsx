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
  const scrollToNext = () => {
    const next = document.getElementById('snowy-forest')
    if (next) next.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="hero" className="relative h-screen min-h-[640px] w-full overflow-hidden bg-[#020617]">
      {/* ------------------------------------------- VISUAL · right 55% */}
      <div className="pointer-events-none absolute inset-0 opacity-40 md:left-[42%] md:right-0 md:opacity-100">
        <MoonScene />
      </div>

      {/* Soft vignette to melt the scene edges into the dark */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(2,6,23,0.75)_100%)]" />

      {/* ------------------------------------------------ LEFT · text block */}
      <div className="relative z-10 flex h-full w-full flex-col justify-start px-8 pt-[14vh] sm:px-14 lg:px-24 xl:px-32">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-xl"
        >
          {/* Small label */}
          <motion.p
            variants={item}
            className="mb-6 text-[11px] font-light uppercase tracking-[0.55em] text-slate-400"
          >
            WAFA FELAHI
          </motion.p>

          {/* Main headline */}
          <motion.h1
            variants={item}
            className="font-display text-5xl font-light leading-[1.05] text-slate-100 sm:text-6xl lg:text-7xl xl:text-8xl"
          >
            Software
            <br />
            Engineer
          </motion.h1>

          {/* Sub-role line */}
          <motion.p
            variants={item}
            className="mt-4 font-display text-lg font-light italic text-[#A8C7FF] sm:text-xl"
          >
            Building Intelligent, Scalable Systems
          </motion.p>

          {/* Tech stack tags */}
          <motion.p
            variants={item}
            className="mt-6 text-[11px] font-light uppercase tracking-[0.3em] text-slate-500 sm:text-xs"
          >
            DevOps&nbsp;&nbsp;·&nbsp;&nbsp;MLOps&nbsp;&nbsp;·&nbsp;&nbsp;Full-Stack&nbsp;&nbsp;·&nbsp;&nbsp;Agentic AI
          </motion.p>

          {/* CTA */}
          <motion.div variants={item} className="mt-10">
            <button
              onClick={scrollToNext}
              className="group relative overflow-hidden rounded-full border border-[#C4A77D]/40 px-8 py-3 text-[11px] font-light uppercase tracking-[0.4em] text-[#C4A77D] transition-all duration-500 hover:border-[#C4A77D] hover:text-white"
            >
              {/* gold glow on hover */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#C4A77D]/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">Explore My Work</span>
            </button>
          </motion.div>
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
    </section>
  )
}
