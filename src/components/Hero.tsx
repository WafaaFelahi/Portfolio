import { Suspense } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import MoonScene from './MoonScene';
import { PROFILE } from '../data';

const ROLES = ['Full-Stack Developer', 'Cloud & DevOps Engineer', 'ML/DL Practitioner'];

function ScrollIndicator() {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40"
      animate={reduced ? {} : { y: [0, 8, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span className="text-xs tracking-widest text-[var(--color-moon-silver)] font-body uppercase">
        scroll
      </span>
      <div className="w-px h-10 bg-gradient-to-b from-[var(--color-lotus-blue)] to-transparent" />
    </motion.div>
  );
}

// Animated veil — SVG translucent cloth
function Veil() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Left veil */}
      <svg
        className="absolute -left-4 top-0 h-full w-1/2 veil-animate opacity-40"
        viewBox="0 0 300 800"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="veil-grad-l" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c8d6e8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#c8d6e8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,0 C60,80 40,200 80,300 C120,400 30,500 60,650 C90,760 20,800 0,800 Z"
          fill="url(#veil-grad-l)"
        />
        <path
          d="M0,0 C100,100 80,250 110,380 C140,500 60,600 90,750 C110,800 0,800 0,800 Z"
          fill="url(#veil-grad-l)"
          opacity="0.5"
        />
      </svg>
      {/* Right veil */}
      <svg
        className="absolute -right-4 top-0 h-full w-1/2 veil-animate opacity-35"
        style={{ animationDelay: '2s', animationDirection: 'reverse' }}
        viewBox="0 0 300 800"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="veil-grad-r" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#c8d6e8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#c8d6e8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M300,0 C240,80 260,200 220,300 C180,400 270,500 240,650 C210,760 280,800 300,800 Z"
          fill="url(#veil-grad-r)"
        />
      </svg>
    </div>
  );
}

export default function Hero() {
  const reduced = useReducedMotion();

  const EASE = [0.22, 1, 0.36, 1] as const;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: reduced ? 0 : 0.18, delayChildren: 0.4 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: reduced ? 0 : 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
  };

  return (
    <section
      id="hero"
      className="section-base relative"
      aria-label="Hero — Introduction"
    >
      {/* 3D Moon Canvas */}
      <Suspense fallback={null}>
        <div className="absolute inset-0 z-0">
          <MoonScene className="w-full h-full" />
        </div>
      </Suspense>

      {/* Veil */}
      <Veil />

      {/* Radial gradient overlay at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--color-void))',
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-20 flex flex-col items-center text-center px-6 py-32"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Overline */}
        <motion.p
          variants={item}
          className="text-xs tracking-[0.4em] text-[var(--color-lotus-blue)] mb-6 uppercase font-body"
        >
          Lunossa
        </motion.p>

        {/* Name */}
        <motion.h1
          variants={item}
          className="font-display text-6xl md:text-8xl lg:text-9xl font-light text-gradient mb-4"
        >
          {PROFILE.name}
        </motion.h1>

        {/* Role */}
        <motion.p
          variants={item}
          className="font-display text-xl md:text-2xl text-[var(--color-moon-silver)] opacity-80 italic mb-8"
        >
          Software &amp; DevOps Engineer
        </motion.p>

        {/* Specialisations */}
        <motion.div
          variants={item}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {ROLES.map(role => (
            <span
              key={role}
              className="text-xs tracking-widest uppercase text-[var(--color-lotus-mist)] border border-[rgba(123,167,212,0.2)] rounded-full px-4 py-1.5 font-body"
            >
              {role}
            </span>
          ))}
        </motion.div>

        {/* Bio line */}
        <motion.p
          variants={item}
          className="max-w-lg text-[var(--color-moon-silver)] opacity-60 text-sm leading-relaxed font-body"
        >
          Building systems from fog node to cloud cluster. Based in Constantine, Algeria.
        </motion.p>
      </motion.div>

      <ScrollIndicator />
    </section>
  );
}
