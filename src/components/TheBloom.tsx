import { useState, useRef } from 'react';
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion';
import { SKILL_GROUPS, type SkillGroup } from '../data';

// Petal positions (top, right, bottom, left) — rotations and offsets
const PETAL_CONFIGS = [
  { rotate: 0,   dx: 0,    dy: -1,  label: 'top' },
  { rotate: 90,  dx: 1,    dy: 0,   label: 'right' },
  { rotate: 180, dx: 0,    dy: 1,   label: 'bottom' },
  { rotate: 270, dx: -1,   dy: 0,   label: 'left' },
];

function Petal({
  group,
  index,
  isActive,
  onSelect,
}: {
  group: SkillGroup;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const cfg = PETAL_CONFIGS[index];
  const spread = 130; // px from centre

  return (
    <motion.button
      className="absolute petal flex flex-col items-center justify-center cursor-pointer"
      style={{
        left: `calc(50% + ${cfg.dx * spread}px)`,
        top:  `calc(50% + ${cfg.dy * spread}px)`,
        transform: 'translate(-50%, -50%)',
        width: 110,
        height: 110,
        borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
        rotate: `${cfg.rotate}deg`,
        background: isActive
          ? 'radial-gradient(circle at center, rgba(74,123,168,0.5) 0%, rgba(42,63,126,0.35) 100%)'
          : 'radial-gradient(circle at center, rgba(22,32,58,0.8) 0%, rgba(10,14,26,0.9) 100%)',
        border: `1px solid ${isActive ? 'rgba(123,167,212,0.5)' : 'rgba(200,214,232,0.12)'}`,
        boxShadow: isActive
          ? '0 0 30px rgba(123,167,212,0.25), 0 0 60px rgba(74,123,168,0.12)'
          : 'none',
      }}
      onClick={onSelect}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.97 }}
      aria-label={`${group.label} skills`}
      aria-pressed={isActive}
    >
      <span
        style={{ rotate: `${-cfg.rotate}deg`, display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <span className="text-2xl mb-1">{group.icon}</span>
        <span className="text-xs tracking-wider text-[var(--color-moon-silver)] font-body whitespace-nowrap">
          {group.label}
        </span>
      </span>
    </motion.button>
  );
}

export default function TheBloom() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();

  const activeGroup = SKILL_GROUPS.find(g => g.id === activeId) ?? null;

  const handleSelect = (id: string) => {
    setActiveId(prev => (prev === id ? null : id));
  };

  return (
    <section
      id="bloom"
      className="section-base relative py-32 px-4"
      aria-label="The Bloom — skills"
    >
      {/* Glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(42,63,126,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          ref={ref}
          className="text-center mb-16"
          initial={{ opacity: 0, y: reduced ? 0 : 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs tracking-[0.4em] text-[var(--color-lotus-blue)] uppercase font-body mb-4">
            Chapter III
          </p>
          <h2 className="font-display text-5xl md:text-6xl text-gradient font-light">
            The Bloom
          </h2>
          <p className="mt-6 text-[var(--color-moon-silver)] opacity-55 max-w-md mx-auto text-sm font-body leading-relaxed">
            Select a petal to see what lies within.
          </p>
        </motion.div>

        {/* Lotus layout */}
        <div className="flex flex-col items-center gap-16">
          {/* Petal container */}
          <div
            className="relative"
            style={{ width: 340, height: 340 }}
            aria-label="Lotus skills diagram"
          >
            {/* Centre circle */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full z-10 flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, rgba(123,167,212,0.4) 0%, rgba(42,63,126,0.6) 100%)',
                border: '1px solid rgba(200,214,232,0.3)',
                boxShadow: '0 0 30px rgba(123,167,212,0.3)',
              }}
            >
              <span className="text-[var(--color-star-white)] font-display text-xs tracking-widest">✦</span>
            </div>

            {/* Petals */}
            {SKILL_GROUPS.map((group, i) => (
              <Petal
                key={group.id}
                group={group}
                index={i}
                isActive={activeId === group.id}
                onSelect={() => handleSelect(group.id)}
              />
            ))}
          </div>

          {/* Skills detail panel */}
          <AnimatePresence mode="wait">
            {activeGroup && (
              <motion.div
                key={activeGroup.id}
                className="glass-card p-8 w-full max-w-lg"
                initial={{ opacity: 0, y: reduced ? 0 : 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: reduced ? 0 : -10, scale: 0.97 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{activeGroup.icon}</span>
                  <div>
                    <h3 className="font-display text-xl text-[var(--color-moon-white)]">
                      {activeGroup.label}
                    </h3>
                    <p className="text-xs text-[var(--color-lotus-mist)] font-body">
                      {activeGroup.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeGroup.skills.map(skill => (
                    <span
                      key={skill}
                      className="text-xs px-3 py-1.5 rounded-full font-body text-[var(--color-moon-silver)]"
                      style={{
                        background: 'rgba(42,63,126,0.3)',
                        border: '1px solid rgba(123,167,212,0.2)',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile fallback — flat cards */}
          <div className="w-full md:hidden grid grid-cols-1 gap-4">
            {SKILL_GROUPS.map(group => (
              <div key={group.id} className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{group.icon}</span>
                  <h3 className="font-display text-lg text-[var(--color-moon-white)]">{group.label}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.skills.map(s => (
                    <span
                      key={s}
                      className="text-xs px-2.5 py-1 rounded-full font-body text-[var(--color-moon-silver)]"
                      style={{ background: 'rgba(42,63,126,0.3)', border: '1px solid rgba(123,167,212,0.2)' }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
