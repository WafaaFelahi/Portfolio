import Hero from '../sections/Hero'
import SnowyForest from '../sections/SnowyForest'
import LotusWater from '../sections/LotusWater'
import InfinityMoonGallery from '../sections/InfinityMoonGallery'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020617]">
      <Hero />
      <SnowyForest />
      <LotusWater />
      <InfinityMoonGallery />

      {/* ─── Footer ─── */}
      <footer className="relative bg-[#020617] py-16 text-center">
        <div
          className="mx-auto mb-8 h-px w-32"
          style={{ background: 'linear-gradient(90deg, transparent, #C4A77D40, transparent)' }}
        />
        <p className="font-display text-2xl font-light text-white/70">Wafa Felahi</p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.5em] text-slate-600">
          Software Engineer · DevOps · MLOps · Full-Stack
        </p>
        <div className="mt-8 flex justify-center gap-6">
          <a
            href="https://github.com/WafaaFelahi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] uppercase tracking-[0.4em] text-slate-600 transition-colors hover:text-[#A8C7FF]"
          >
            GitHub ↗
          </a>
          <span className="text-slate-700">·</span>
          <a
            href="mailto:wafafelahi@gmail.com"
            className="text-[11px] uppercase tracking-[0.4em] text-slate-600 transition-colors hover:text-[#C4A77D]"
          >
            Contact ↗
          </a>
        </div>
        <p className="mt-10 text-[10px] text-slate-800">
          © {new Date().getFullYear()} Wafa Felahi · Building Intelligent, Scalable Systems
        </p>
      </footer>
    </main>
  )
}
