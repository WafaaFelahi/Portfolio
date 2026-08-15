import Nav from './components/Nav';
import Hero from './components/Hero';
import ThePath from './components/ThePath';
import TheBloom from './components/TheBloom';
import Projects from './components/Projects';
import Infinity from './components/Infinity';
import Contact from './components/Contact';

export default function App() {
  return (
    <div className="relative min-h-screen" style={{ backgroundColor: 'var(--color-void)' }}>
      {/* Global star field */}
      <div className="star-field" aria-hidden="true" />

      {/* Navigation */}
      <Nav />

      {/* Main scroll container */}
      <main>
        {/* Hero — full moon + veil */}
        <Hero />

        {/* Divider gradient */}
        <div
          aria-hidden="true"
          style={{
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(123,167,212,0.15), transparent)',
          }}
        />

        {/* The Path — timeline */}
        <ThePath />

        <div
          aria-hidden="true"
          style={{
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(123,167,212,0.1), transparent)',
          }}
        />

        {/* The Bloom — skills lotus */}
        <TheBloom />

        <div
          aria-hidden="true"
          style={{
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(123,167,212,0.1), transparent)',
          }}
        />

        {/* Projects — floating moons */}
        <Projects />

        <div
          aria-hidden="true"
          style={{
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(123,167,212,0.08), transparent)',
          }}
        />

        {/* Infinity — lemniscate loop */}
        <Infinity />

        <div
          aria-hidden="true"
          style={{
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(123,167,212,0.08), transparent)',
          }}
        />

        {/* Contact */}
        <Contact />
      </main>
    </div>
  );
}
