import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { TIMELINE } from '../data';

function TimelineNode({
  entry,
  index,
}: {
  entry: (typeof TIMELINE)[number];
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      className={`relative flex items-center gap-8 ${isLeft ? 'flex-row' : 'flex-row-reverse'} mb-16 md:mb-24`}
      initial={{ opacity: 0, x: reduced ? 0 : (isLeft ? -50 : 50) }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
    >
      {/* Card */}
      <div className={`w-full md:w-5/12 glass-card p-6 ${isLeft ? 'text-left' : 'text-right md:text-left'}`}>
        <span className="text-xs tracking-widest text-[var(--color-lotus-blue)] uppercase font-body block mb-2">
          {entry.year}
        </span>
        <h3 className="font-display text-xl md:text-2xl text-[var(--color-moon-white)] mb-3">
          {entry.title}
        </h3>
        <p className="text-sm text-[var(--color-moon-silver)] opacity-70 leading-relaxed font-body">
          {entry.body}
        </p>
      </div>

      {/* Centre node */}
      <div className="hidden md:flex flex-col items-center relative z-10 shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
          style={{
            background: 'radial-gradient(circle, rgba(42,63,126,0.8) 0%, rgba(10,14,26,0.9) 100%)',
            border: '1px solid rgba(123,167,212,0.4)',
            boxShadow: '0 0 20px rgba(123,167,212,0.2)',
          }}
        >
          {entry.icon}
        </div>
      </div>

      {/* Spacer for other side */}
      <div className="hidden md:block w-5/12" />
    </motion.div>
  );
}

export default function ThePath() {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true });
  const reduced = useReducedMotion();

  return (
    <section
      id="path"
      className="section-base relative py-32 px-4 md:px-8"
      aria-label="The Path — journey"
    >
      {/* Misty fog overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(42,63,126,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 50% 100%, rgba(10,22,58,0.12) 0%, transparent 70%)
          `,
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Section header */}
        <motion.div
          ref={titleRef}
          className="text-center mb-20"
          initial={{ opacity: 0, y: reduced ? 0 : 40 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs tracking-[0.4em] text-[var(--color-lotus-blue)] uppercase font-body mb-4">
            Chapter II
          </p>
          <h2 className="font-display text-5xl md:text-6xl text-gradient font-light">
            The Path
          </h2>
          <p className="mt-6 text-[var(--color-moon-silver)] opacity-55 max-w-md mx-auto text-sm font-body leading-relaxed">
            Every engineer has a story. This is mine — told honestly,
            without embellishment.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical spine */}
          <div className="timeline-line hidden md:block" />

          {TIMELINE.map((entry, i) => (
            <TimelineNode key={entry.year} entry={entry} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
