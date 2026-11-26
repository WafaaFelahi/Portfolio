/**
 * A cinematic finish laid over a 3D scene: a soft vignette and a still,
 * barely-there film grain. Done in CSS so the WebGL colours stay untouched.
 */
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

export default function FilmFinish({ vignette = true }: { vignette?: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {vignette && (
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 75% 70% at 50% 45%, transparent 55%, rgba(2,6,23,0.55) 100%)' }}
        />
      )}
      <div className="absolute inset-0 opacity-[0.07] mix-blend-soft-light" style={{ backgroundImage: GRAIN }} />
    </div>
  )
}
