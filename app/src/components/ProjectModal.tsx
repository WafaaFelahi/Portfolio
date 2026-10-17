import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Project } from '../data/projects'

interface ProjectModalProps {
  project: Project | null
  onClose: () => void
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (project) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [project])

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(14px)', backgroundColor: 'rgba(2,6,23,0.72)' }}
          onClick={onClose}
        >
          <motion.div
            key="modal-card"
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #0a0f1e 0%, #111827 100%)',
              border: '1px solid rgba(196,167,125,0.25)',
              boxShadow: '0 0 60px rgba(168,199,255,0.08), 0 24px 64px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent bar */}
            <div
              className="h-px w-full"
              style={{
                background: 'linear-gradient(90deg, transparent, #C4A77D, #A8C7FF, #C4A77D, transparent)',
              }}
            />

            <div className="p-8">
              {/* Phase badge */}
              <p className="mb-3 text-[10px] uppercase tracking-[0.5em] text-[#A8C7FF]/50">
                {project.phase.replace(/-/g, ' ')}
              </p>

              {/* Title */}
              <h3 className="font-display text-3xl font-light text-white sm:text-4xl">
                {project.title}
              </h3>

              {/* Description */}
              <p className="mt-5 text-sm leading-relaxed text-slate-300">
                {project.description}
              </p>

              {/* Tech stack tags */}
              <div className="mt-6 flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full px-3 py-1 text-[11px] font-light uppercase tracking-wider"
                    style={{
                      background: 'rgba(196,167,125,0.12)',
                      border: '1px solid rgba(196,167,125,0.3)',
                      color: '#C4A77D',
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="mt-8 flex gap-4">
                {project.liveUrl && project.liveUrl !== '#' && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-full px-6 py-2.5 text-[11px] font-light uppercase tracking-[0.4em] text-black transition-all duration-300"
                    style={{ background: 'linear-gradient(135deg, #C4A77D, #d4b88e)' }}
                  >
                    <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />
                    <span className="relative">Live Demo</span>
                  </a>
                )}
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border px-6 py-2.5 text-[11px] font-light uppercase tracking-[0.4em] transition-all duration-300"
                  style={{
                    borderColor: 'rgba(168,199,255,0.3)',
                    color: '#A8C7FF',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#A8C7FF'
                    e.currentTarget.style.background = 'rgba(168,199,255,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(168,199,255,0.3)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  GitHub ↗
                </a>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close modal"
            >
              ×
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
