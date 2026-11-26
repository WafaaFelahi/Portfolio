import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { projects, type Project } from '../data/projects'
import { useMoonPhaseImages } from '../lib/moonPhaseImages'
import ProjectModal from '../components/ProjectModal'

/* ------------------------------------------------------------------ */
/*  Stage 4 — Moon phases = projects                                    */
/* ------------------------------------------------------------------ */

const PHASES: Record<string, { name: string; angle: number }> = {
  'new-moon': { name: 'New Moon', angle: 0 },
  'waxing-crescent': { name: 'Waxing Crescent', angle: Math.PI * 0.25 },
  'first-quarter': { name: 'First Quarter', angle: Math.PI * 0.5 },
  'waxing-gibbous': { name: 'Waxing Gibbous', angle: Math.PI * 0.75 },
  'full-moon': { name: 'Full Moon', angle: Math.PI },
  'waning-gibbous': { name: 'Waning Gibbous', angle: Math.PI * 1.25 },
  'last-quarter': { name: 'Last Quarter', angle: Math.PI * 1.5 },
  'waning-crescent': { name: 'Waning Crescent', angle: Math.PI * 1.75 },
}

type FilterId = 'all' | 'ai' | 'web' | 'cloud'

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ai', label: 'AI & ML' },
  { id: 'web', label: 'Full-Stack' },
  { id: 'cloud', label: 'Cloud & DevOps' },
]

/** A project can belong to several filters (e.g. Full-Stack + AI). */
function groupsOf(p: Project): FilterId[] {
  const c = p.category
  const g: FilterId[] = []
  if (/AI|ML/.test(c)) g.push('ai')
  if (/Full-Stack/.test(c)) g.push('web')
  if (/DevOps|Cloud/.test(c)) g.push('cloud')
  return g
}

/** "Amazon Prime Clone (End-to-End DevOps Pipeline)" → title + subtitle */
function splitTitle(t: string): { title: string; subtitle: string | null } {
  const m = t.match(/^(.*?)\s*\((.*)\)\s*$/)
  return m ? { title: m[1], subtitle: m[2] } : { title: t, subtitle: null }
}

const CHIP_COUNT = 4
const EASE = [0.22, 1, 0.36, 1] as const

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function MoonIcon({ src, brightness, label }: { src: string | undefined; brightness: number; label: string }) {
  // Glow follows the phase's real brightness, kept restrained
  const glow = `drop-shadow(0 0 ${Math.round(4 + 14 * brightness)}px rgba(168,199,255,${(0.06 + 0.32 * brightness).toFixed(2)}))`
  return (
    <div className="relative h-16 w-16 shrink-0" style={{ filter: glow }}>
      {src ? (
        <img src={src} alt={label} width={64} height={64} className="h-16 w-16 select-none" draggable={false} />
      ) : (
        <div className="h-16 w-16 rounded-full bg-[#0c1330] ring-1 ring-[#A8C7FF]/15" role="img" aria-label={label} />
      )}
    </div>
  )
}

function ProjectCard({
  project,
  index,
  icon,
  onOpen,
}: {
  project: Project
  index: number
  icon: string | undefined
  onOpen: () => void
}) {
  const phase = PHASES[project.phase]
  const { title, subtitle } = splitTitle(project.title)
  const extra = project.techStack.length - CHIP_COUNT
  const flagship = project.phase === 'full-moon'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.6, ease: EASE }}
      className={`group relative flex cursor-pointer flex-col gap-5 rounded-2xl border bg-[#0a1129] p-7 transition-[border-color,transform] duration-500 hover:-translate-y-1 focus-within:-translate-y-1 ${
        flagship ? 'border-[#A8C7FF]/25' : 'border-[#A8C7FF]/10 hover:border-[#A8C7FF]/25'
      }`}
    >
      <div className="flex items-center gap-4">
        <MoonIcon src={icon} brightness={project.brightness} label={`${phase.name} moon`} />
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#C4A77D]">{phase.name}</span>
          <span className="text-xs tabular-nums text-slate-400">
            {String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
            {flagship && <span className="ml-2 text-[#A8C7FF]/80">· Flagship</span>}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-[22px] font-medium leading-snug text-white">
          <button
            type="button"
            onClick={onOpen}
            className="text-left outline-none after:absolute after:inset-0 focus-visible:underline focus-visible:decoration-[#A8C7FF]/60 focus-visible:underline-offset-4"
          >
            {title}
          </button>
        </h3>
        {subtitle && <p className="font-display text-base italic leading-snug text-[#A8C7FF]/85">{subtitle}</p>}
      </div>

      <p className="line-clamp-3 text-sm leading-relaxed text-slate-400">{project.description}</p>

      <ul aria-label="Tech stack" className="flex flex-wrap gap-1.5">
        {project.techStack.slice(0, CHIP_COUNT).map((t) => (
          <li key={t} className="rounded-full border border-[#A8C7FF]/12 bg-[#A8C7FF]/[0.05] px-2.5 py-1.5 text-xs leading-none text-slate-300">
            {t}
          </li>
        ))}
        {extra > 0 && <li className="px-1 py-1.5 text-xs leading-none text-slate-400">+{extra} more</li>}
      </ul>

      <div className="relative z-10 mt-auto flex items-center justify-between gap-3 border-t border-[#A8C7FF]/10 pt-4">
        <span className="text-xs text-slate-400">{project.category}</span>
        <div className="flex items-center gap-1">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-[#C4A77D] transition-colors hover:text-[#e2cba6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C4A77D]"
            >
              Live <ArrowIcon />
            </a>
          )}
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Code for ${title} on GitHub`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-[#A8C7FF] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A8C7FF]"
          >
            Code <ArrowIcon />
          </a>
        </div>
      </div>
    </motion.article>
  )
}

export default function MoonPhaseProjects() {
  const [filter, setFilter] = useState<FilterId>('all')
  const [selected, setSelected] = useState<Project | null>(null)

  const angles = useMemo(() => projects.map((p) => PHASES[p.phase]?.angle ?? 0), [])
  const icons = useMoonPhaseImages(angles)

  const counts = useMemo(() => {
    const c: Record<FilterId, number> = { all: projects.length, ai: 0, web: 0, cloud: 0 }
    projects.forEach((p) => groupsOf(p).forEach((g) => c[g]++))
    return c
  }, [])

  const visible = projects
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => filter === 'all' || groupsOf(p).includes(filter))

  return (
    <section id="projects" aria-labelledby="projects-heading" className="relative bg-[#020617] px-6 py-28 sm:px-14 sm:py-36 lg:px-24 xl:px-32">
      <div className="mx-auto flex max-w-7xl flex-col gap-14">
        <header className="flex flex-wrap items-end justify-between gap-10">
          <motion.div
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.3, ease: EASE }}
            className="max-w-xl"
          >
            <p className="mb-5 text-[10px] font-light uppercase tracking-[0.6em] text-slate-400">The Cycle</p>
            <h2 id="projects-heading" className="font-display text-4xl font-light leading-[1.08] text-slate-100 sm:text-5xl lg:text-6xl">
              Eight phases,
              <br />
              eight builds.
            </h2>
            <p className="mt-6 text-[15px] font-light leading-relaxed text-slate-400">
              From a new-moon ML lab to a full-moon digital twin. Each project holds a phase of the lunar cycle, and
              shines as brightly as the work behind it.
            </p>
          </motion.div>

          <div role="group" aria-label="Filter projects" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const on = f.id === filter
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter(f.id)}
                  className={`min-h-11 rounded-full border px-5 text-sm transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8C7FF] ${
                    on
                      ? 'border-[#A8C7FF] bg-[#A8C7FF] text-[#050a1c]'
                      : 'border-[#A8C7FF]/20 text-slate-300 hover:border-[#A8C7FF]/45 hover:text-white'
                  }`}
                >
                  {f.label}
                  <span className={`ml-2 tabular-nums ${on ? 'text-[#050a1c]/60' : 'text-slate-400'}`}>{counts[f.id]}</span>
                </button>
              )
            })}
          </div>
        </header>

        <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5">
          <AnimatePresence mode="popLayout">
            {visible.map(({ p, i }) => (
              <ProjectCard key={p.id} project={p} index={i} icon={icons?.[i]} onOpen={() => setSelected(p)} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <ProjectModal project={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
