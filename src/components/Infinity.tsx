import { useRef, useEffect } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

// Lemniscate of Bernoulli parametric equations:
// x = a * cos(t) / (1 + sin²(t))
// y = a * sin(t) * cos(t) / (1 + sin²(t))
function getLemniscatePoint(t: number, a: number): { x: number; y: number } {
  const sin = Math.sin(t);
  const cos = Math.cos(t);
  const denom = 1 + sin * sin;
  return {
    x: (a * cos) / denom,
    y: (a * sin * cos) / denom,
  };
}

const MOON_COUNT = 12;
const LEMNISCATE_A = 160; // half-width in px

interface MoonDot {
  offset: number; // 0–1, position along the curve
  size: number;
  opacity: number;
}

const MOON_DOTS: MoonDot[] = Array.from({ length: MOON_COUNT }, (_, i) => ({
  offset: i / MOON_COUNT,
  size: 4 + Math.random() * 6,
  opacity: 0.3 + Math.random() * 0.5,
}));

function InfinityCanvas({ running }: { running: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, W, H);

      // Draw lemniscate path (faint guide line)
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const t2 = (i / 200) * Math.PI * 2;
        const p = getLemniscatePoint(t2, LEMNISCATE_A);
        if (i === 0) ctx.moveTo(cx + p.x, cy + p.y);
        else ctx.lineTo(cx + p.x, cy + p.y);
      }
      ctx.strokeStyle = 'rgba(123, 167, 212, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw moons orbiting along the curve
      MOON_DOTS.forEach(dot => {
        const phase = ((dot.offset + tRef.current) % 1) * Math.PI * 2;
        const pos = getLemniscatePoint(phase, LEMNISCATE_A);
        const x = cx + pos.x;
        const y = cy + pos.y;

        // Glow
        const grad = ctx.createRadialGradient(x, y, 0, x, y, dot.size * 3);
        grad.addColorStop(0, `rgba(200, 214, 232, ${dot.opacity})`);
        grad.addColorStop(0.4, `rgba(123, 167, 212, ${dot.opacity * 0.4})`);
        grad.addColorStop(1, 'rgba(74, 123, 168, 0)');
        ctx.beginPath();
        ctx.arc(x, y, dot.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(x, y, dot.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 230, 245, ${dot.opacity})`;
        ctx.fill();
      });

      tRef.current += 0.0008;
      rafRef.current = requestAnimationFrame(draw);
    }

    if (running) {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  return (
    <canvas
      ref={canvasRef}
      width={420}
      height={220}
      className="block mx-auto"
      aria-label="Moons orbiting in an infinity loop"
      role="img"
    />
  );
}

export default function Infinity() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: false, margin: '-100px' });
  const reduced = useReducedMotion();
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true });

  return (
    <section
      id="infinity"
      ref={sectionRef}
      className="section-base relative py-32 px-4"
      aria-label="Infinity — DevOps loop"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(7,11,20,0.6) 0%, transparent 80%)',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: reduced ? 0 : 40 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs tracking-[0.4em] text-[var(--color-lotus-blue)] uppercase font-body mb-4">
            Chapter V
          </p>
          <h2 className="font-display text-5xl md:text-6xl text-gradient font-light mb-6">
            Infinity
          </h2>
          <p className="text-[var(--color-moon-silver)] opacity-55 max-w-md mx-auto text-sm font-body leading-relaxed mb-16">
            The DevOps mindset is a closed loop — build, deploy, observe, refine,
            and return to the beginning with more clarity than before.
            The moons never stop.
          </p>
        </motion.div>

        {/* Infinity canvas */}
        <motion.div
          initial={{ opacity: 0, scale: reduced ? 1 : 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <InfinityCanvas running={inView && !reduced} />
        </motion.div>

        {/* Loop labels */}
        <motion.div
          className="flex justify-center gap-6 mt-12 flex-wrap"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {['Plan', 'Build', 'Deploy', 'Monitor', 'Observe', 'Improve'].map((step, i) => (
            <span
              key={step}
              className="text-xs tracking-widest text-[var(--color-lotus-mist)] uppercase font-body opacity-60"
            >
              {step}
              {i < 5 && <span className="ml-2 opacity-30">→</span>}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
