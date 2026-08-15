import { useState, useEffect } from 'react';
import { PROFILE } from '../data';

const SECTIONS = [
  { id: 'hero', label: 'Origin' },
  { id: 'path', label: 'The Path' },
  { id: 'bloom', label: 'The Bloom' },
  { id: 'projects', label: 'Projects' },
  { id: 'infinity', label: 'Infinity' },
  { id: 'contact', label: 'Contact' },
];

export default function Nav() {
  const [active, setActive] = useState('hero');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { threshold: 0.5 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Side dot nav — desktop */}
      <nav
        className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-4 items-center"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 1s ease' }}
        aria-label="Section navigation"
      >
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            id={`nav-dot-${id}`}
            onClick={() => scrollTo(id)}
            title={label}
            aria-label={`Navigate to ${label}`}
            className={`nav-dot ${active === id ? 'active' : ''}`}
          />
        ))}
      </nav>

      {/* Mobile top-right pill */}
      <nav
        className="fixed top-4 right-4 z-50 md:hidden glass rounded-full px-4 py-2 flex gap-3"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 1s ease' }}
        aria-label="Mobile section navigation"
      >
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className={`text-xs transition-colors duration-300 ${
              active === id
                ? 'text-[var(--color-lotus-blue)]'
                : 'text-[var(--color-moon-silver)] opacity-50'
            }`}
            aria-label={`Navigate to ${label}`}
          >
            ●
          </button>
        ))}
      </nav>

      {/* Brand watermark top-left */}
      <div
        className="fixed top-6 left-6 z-50 font-display text-lg tracking-widest text-gradient pointer-events-none select-none"
        style={{ opacity: visible ? 0.7 : 0, transition: 'opacity 1.5s ease' }}
        aria-label={`${PROFILE.name} — Lunossa`}
      >
        LUNOSSA
      </div>
    </>
  );
}
