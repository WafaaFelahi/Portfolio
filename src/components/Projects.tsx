import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { PROJECTS, type Project } from '../data';

const PRIORITY_LABEL: Record<Project['priority'], string> = {
  flagship: 'Flagship',
  major: 'Major Project',
  hackathon: 'Hackathon',
};

const PRIORITY_COLOR: Record<Project['priority'], string> = {
  flagship: 'rgba(123,167,212,0.6)',
  major: 'rgba(74,123,168,0.5)',
  hackathon: 'rgba(42,63,126,0.45)',
};

const PRIORITY_SIZE: Record<Project['priority'], { glow: string; size: string }> = {
  flagship: {
    glow: '0 0 60px rgba(123,167,212,0.18), 0 0 120px rgba(74,123,168,0.1)',
    size: 'col-span-2',
  },
  major: {
    glow: '0 0 40px rgba(74,123,168,0.14)',
    size: 'col-span-2 md:col-span-1',
  },
  hackathon: {
    glow: '0 0 20px rgba(42,63,126,0.12)',
    size: 'col-span-1',
  },
};

function ProjectCard({ project, delay = 0 }: { project: Project; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();

  return (
    <motion.article
      ref={ref}
      className={`glass-card moon-card p-6 md:p-8 flex flex-col ${PRIORITY_SIZE[project.priority].size}`}
      style={{ boxShadow: PRIORITY_SIZE[project.priority].glow }}
      initial={{ opacity: 0, y: reduced ? 0 : 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {/* Priority badge + type */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-xs px-3 py-1 rounded-full font-body tracking-wider"
          style={{
            background: `${PRIORITY_COLOR[project.priority]}33`,
            border: `1px solid ${PRIORITY_COLOR[project.priority]}`,
            color: 'var(--color-moon-silver)',
          }}
        >
          {PRIORITY_LABEL[project.priority]}
        </span>
        <span className="text-xs text-[var(--color-lotus-mist)] font-body opacity-70">
          {project.type}
        </span>
      </div>

      {/* Moon glyph */}
      <div
        className="w-10 h-10 rounded-full mb-4 flex items-center justify-center shrink-0"
        style={{
          background: `radial-gradient(circle, ${PRIORITY_COLOR[project.priority]} 0%, rgba(10,14,26,0.8) 100%)`,
          border: `1px solid ${PRIORITY_COLOR[project.priority]}`,
        }}
      >
        <span className="text-xs text-[var(--color-star-white)]">◯</span>
      </div>

      {/* Name + subtitle */}
      <h3 className="font-display text-2xl md:text-3xl text-[var(--color-moon-white)] mb-1">
        {project.name}
      </h3>
      <p className="text-xs text-[var(--color-lotus-blue)] font-body tracking-wide mb-4">
        {project.subtitle}
      </p>

      {/* Description */}
      <p className="text-sm text-[var(--color-moon-silver)] opacity-70 font-body leading-relaxed mb-5 flex-1">
        {project.description}
      </p>

      {/* Highlights */}
      {project.highlights && (
        <ul className="mb-5 space-y-1.5">
          {project.highlights.map(h => (
            <li key={h} className="flex items-start gap-2 text-xs text-[var(--color-moon-silver)] opacity-60 font-body">
              <span className="text-[var(--color-lotus-blue)] shrink-0 mt-0.5">▹</span>
              {h}
            </li>
          ))}
        </ul>
      )}

      {/* Stack tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        {project.stack.map(tech => (
          <span
            key={tech}
            className="text-xs px-2.5 py-1 rounded-full font-body"
            style={{
              background: 'rgba(22,32,58,0.8)',
              border: '1px solid rgba(200,214,232,0.1)',
              color: 'var(--color-moon-silver)',
              opacity: 0.8,
            }}
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Links */}
      <div className="flex items-center gap-4 pt-2 border-t border-[rgba(200,214,232,0.06)]">
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-[var(--color-lotus-blue)] hover:text-[var(--color-moon-white)] transition-colors duration-300 font-body"
          aria-label={`View ${project.name} on GitHub`}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.24c3-.3 6-1.5 6-6.38 0-1.4-.5-2.5-1.3-3.3.1-.3.6-1.6-.1-3.3 0 0-1.1-.3-3.4 1.5a11.5 11.5 0 0 0-6 0C6.3 3.1 5.2 3.4 5.2 3.4c-.7 1.7-.2 3 .1 3.3-.8.8-1.3 1.9-1.3 3.3 0 4.88 3 6.08 6 6.38a4.8 4.8 0 0 0-1 3.24v4"></path><path d="M12 18g-3.2 1.3-4.5-1.7"></path></svg>
          GitHub
        </a>
      </div>
    </motion.article>
  );
}

export default function Projects() {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true });
  const reduced = useReducedMotion();

  const flagship = PROJECTS.filter(p => p.priority === 'flagship');
  const major = PROJECTS.filter(p => p.priority === 'major');
  const hackathon = PROJECTS.filter(p => p.priority === 'hackathon');

  return (
    <section
      id="projects"
      className="section-base relative py-32 px-4 md:px-8"
      aria-label="Projects"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(15,21,37,0.4) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          ref={titleRef}
          className="text-center mb-20"
          initial={{ opacity: 0, y: reduced ? 0 : 40 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs tracking-[0.4em] text-[var(--color-lotus-blue)] uppercase font-body mb-4">
            Chapter IV
          </p>
          <h2 className="font-display text-5xl md:text-6xl text-gradient font-light">
            Floating Moons
          </h2>
          <p className="mt-6 text-[var(--color-moon-silver)] opacity-55 max-w-md mx-auto text-sm font-body leading-relaxed">
            Each moon is a project that once existed only in thought.
            These were built.
          </p>
        </motion.div>

        {/* Flagship */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {flagship.map((p, i) => (
            <ProjectCard key={p.id} project={p} delay={i * 0.1} />
          ))}
        </div>

        {/* Major */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {major.map((p, i) => (
            <ProjectCard key={p.id} project={p} delay={i * 0.1} />
          ))}
        </div>

        {/* Hackathon — smaller moons */}
        <div>
          <p className="text-xs tracking-[0.3em] text-[var(--color-lotus-mist)] uppercase font-body mb-4 opacity-60">
            Hackathon Explorations
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hackathon.map((p, i) => (
              <ProjectCard key={p.id} project={p} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
