import { MotionConfig } from 'framer-motion'
import Hero from '../sections/Hero'
import Journey from '../sections/Journey'
import MoonPhaseProjects from '../sections/MoonPhaseProjects'
import Shore from '../sections/Shore'
import SiteNav from '../components/SiteNav'

export default function Home() {
  return (
    // "user": honour the visitor's reduced-motion setting across all Framer animations
    <MotionConfig reducedMotion="user">
      <a
        href="#projects"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[#A8C7FF] focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-[#050a1c]"
      >
        Skip to projects
      </a>
      <SiteNav />
      <main className="min-h-screen bg-[#020617]">
        <Hero />
        <Journey />
        <MoonPhaseProjects />
        <Shore />
      </main>
    </MotionConfig>
  )
}
