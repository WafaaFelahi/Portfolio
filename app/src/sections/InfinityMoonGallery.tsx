import { useRef, useState, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { motion } from 'framer-motion'
import { projects, type Project } from '../data/projects'
import ProjectModal from '../components/ProjectModal'

/* ------------------------------------------------------------------ */
/*  Infinity (lemniscate of Bernoulli) position calculator             */
/*  x = a·cos(t) / (1 + sin²(t))                                      */
/*  z = a·sin(t)·cos(t) / (1 + sin²(t))                               */
/* ------------------------------------------------------------------ */
const LOOP_SCALE = 4.5
const LOOP_HEIGHT = 0.75 // elevation above water

function lemniscate(t: number): [number, number, number] {
  const sin = Math.sin(t)
  const cos = Math.cos(t)
  const denom = 1 + sin * sin
  return [
    (LOOP_SCALE * cos) / denom,
    LOOP_HEIGHT,
    (LOOP_SCALE * sin * cos) / denom,
  ]
}

/* ------------------------------------------------------------------ */
/*  Moon phase sphere — one node on the infinity loop                  */
/* ------------------------------------------------------------------ */
const PHASE_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Renders a realistic moon phase by masking the terminator
const PHASE_FRAG = /* glsl */ `
  uniform float uPhaseAngle; // 0 = new moon, π = full moon
  uniform vec3 uColor;
  uniform float uGlow;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vec3 N = normalize(vNormal);

    // Light direction in view space according to lunar orbit phase
    vec3 L = normalize(vec3(sin(uPhaseAngle), 0.0, -cos(uPhaseAngle)));
    float diff = dot(N, L);
    float terminator = smoothstep(-0.08, 0.16, diff);

    // Ethereal rim glow for limb definition
    float rim = pow(1.0 - clamp(abs(N.z), 0.0, 1.0), 3.0);

    // Base phase illumination
    vec3 darkBase = vec3(0.04, 0.05, 0.10);
    vec3 litBase = mix(uColor, vec3(0.96, 0.98, 1.0), 0.35);
    vec3 col = mix(darkBase, litBase, terminator);

    // Add celestial rim highlight
    col += vec3(0.65, 0.75, 1.0) * rim * 0.45;

    // Active glow on hover
    col += (uColor + vec3(0.25, 0.35, 0.6)) * uGlow * 0.65;

    gl_FragColor = vec4(col, 1.0);
  }
`

// Maps index 0-7 to phase angle: 0=new, π=full
const PHASE_ANGLES = [
  0.0,                 // 1. new moon
  Math.PI * 0.25,      // 2. waxing crescent
  Math.PI * 0.5,       // 3. first quarter
  Math.PI * 0.75,      // 4. waxing gibbous
  Math.PI,             // 5. full moon
  Math.PI * 1.25,      // 6. waning gibbous
  Math.PI * 1.5,       // 7. last quarter
  Math.PI * 1.75,      // 8. waning crescent
]

function MoonNode({
  project,
  loopAngle,
  groupRotation,
  onClick,
}: {
  project: Project
  loopAngle: number
  groupRotation: number
  onClick: (p: Project) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)
  const glowRef = useRef(0)

  const baseColor = useMemo(() => new THREE.Color(project.color), [project.color])
  // Target sizing: ~80-100px diameter on laptop screens
  const radius = 0.56 + project.brightness * 0.14

  const phaseIndex = (project.id - 1) % 8
  const phaseAngle = PHASE_ANGLES[phaseIndex]

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: PHASE_VERT,
        fragmentShader: PHASE_FRAG,
        uniforms: {
          uPhaseAngle: { value: phaseAngle },
          uColor: { value: baseColor },
          uGlow: { value: 0.0 },
        },
      }),
    [phaseAngle, baseColor],
  )

  useFrame((_, delta) => {
    // Scale on hover
    const targetScale = hovered ? 1.22 : 1.0
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      Math.min(1, delta * 8),
    )
    // Glow pulse
    const targetGlow = hovered ? 0.85 + Math.sin(Date.now() * 0.005) * 0.2 : 0.0
    glowRef.current = THREE.MathUtils.lerp(glowRef.current, targetGlow, delta * 6)
    material.uniforms.uGlow.value = glowRef.current
    // Counter-rotate so moons stay face-on to the viewer
    meshRef.current.rotation.y = -groupRotation
  })

  const [x, y, z] = lemniscate(loopAngle)

  return (
    <mesh
      ref={meshRef}
      position={[x, y, z]}
      material={material}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick(project)
      }}
    >
      <sphereGeometry args={[radius, 48, 48]} />
      {hovered && (
        <Html distanceFactor={7.5} center>
          <div
            style={{
              background: 'rgba(5,8,24,0.92)',
              border: '1px solid rgba(196,167,125,0.45)',
              borderRadius: '12px',
              padding: '10px 16px',
              width: '210px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              pointerEvents: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 20px rgba(168,199,255,0.1)',
            }}
          >
            <div style={{ marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '9px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(196,167,125,0.2)',
                  color: '#E8D5B5',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {project.category}
              </span>
            </div>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '14px',
                fontWeight: 500,
                color: '#fff',
                margin: '0 0 6px',
                lineHeight: '1.25',
              }}
            >
              {project.title}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
              {project.techStack.slice(0, 3).map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: '9px',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    background: 'rgba(168,199,255,0.12)',
                    color: '#A8C7FF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Html>
      )}
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  Reflection strip on water below the loop (subtle water ripple dots)*/
/* ------------------------------------------------------------------ */
function LoopReflection({ rotation }: { rotation: number }) {
  const ref = useRef<THREE.Group>(null!)
  useFrame(() => {
    if (ref.current) ref.current.rotation.y = rotation
  })
  return (
    <group ref={ref}>
      {projects.map((p, i) => {
        const t = (i / projects.length) * Math.PI * 2 + Math.PI / 8
        const [x, , z] = lemniscate(t)
        return (
          <mesh key={p.id} position={[x, -0.48, z]} rotation={[-Math.PI / 2, 0, 0]}>
            {/* Subtle small water ripple disk (under 25px in size) */}
            <circleGeometry args={[0.2 + p.brightness * 0.1, 16]} />
            <meshBasicMaterial
              color={p.color}
              transparent
              opacity={0.2 + p.brightness * 0.15}
              depthWrite={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  Main loop group — auto-rotates                                     */
/* ------------------------------------------------------------------ */
function InfinityLoop({ onSelect }: { onSelect: (p: Project) => void }) {
  const groupRef = useRef<THREE.Group>(null!)
  const rotRef = useRef(0)

  useFrame((_, delta) => {
    rotRef.current += delta * 0.16
    if (groupRef.current) groupRef.current.rotation.y = rotRef.current
  })

  return (
    <>
      <group ref={groupRef}>
        {projects.map((p, i) => {
          // Offset by π/8 so no two moons ever coincide at the lemniscate center
          const t = (i / projects.length) * Math.PI * 2 + Math.PI / 8
          return (
            <MoonNode
              key={p.id}
              project={p}
              loopAngle={t}
              groupRotation={rotRef.current}
              onClick={onSelect}
            />
          )
        })}
      </group>
      <LoopReflection rotation={rotRef.current} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Water plane beneath loop                                           */
/* ------------------------------------------------------------------ */
const WATER_V = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.y += sin(p.x*1.6+uTime*0.8)*0.04 + sin(p.z*1.9-uTime*0.65)*0.03;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
const WATER_F = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 x){vec2 i=floor(x);vec2 f=fract(x);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float v=0.0;float a=0.5;for(int i=0;i<3;i++){v+=a*noise(p);p*=2.1;a*=0.5;}return v;}
  void main() {
    float r = fbm(vUv*5.0 + uTime*0.25);
    vec3 col = mix(vec3(0.02,0.04,0.12), vec3(0.05,0.09,0.20), r);
    col += vec3(0.5,0.6,1.0)*exp(-pow(abs(vUv.x-0.5),2.0)*20.0)*0.3*(0.5-vUv.y);
    gl_FragColor = vec4(col, 0.88);
  }
`

function GalleryWater() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: WATER_V,
        fragmentShader: WATER_F,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
      }),
    [],
  )
  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime
  })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} material={mat}>
      <planeGeometry args={[22, 22, 32, 32]} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  Scene                                                              */
/* ------------------------------------------------------------------ */
function GalleryScene({ onSelect }: { onSelect: (p: Project) => void }) {
  return (
    <>
      <ambientLight intensity={0.25} color="#2030a0" />
      <pointLight position={[0, 6, 0]} intensity={1.8} color="#a0b0ff" />
      <pointLight position={[4, 2, 4]} intensity={0.5} color="#c4a77d" />
      <pointLight position={[-4, 2, -4]} intensity={0.5} color="#c4a77d" />

      {/* Distant background sky moon */}
      <mesh position={[0, 10, -12]}>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshStandardMaterial color="#e0e8ff" emissive="#8090d0" emissiveIntensity={0.6} />
      </mesh>

      {/* Distant decorative celestial moons in the deep background (kept tiny, ~15-20px) */}
      {[
        { pos: [-6, 6, -14], r: 0.28, color: '#3d4868', opacity: 0.35 },
        { pos: [7, 7, -15], r: 0.25, color: '#323c58', opacity: 0.3 },
        { pos: [-4, 8, -16], r: 0.22, color: '#455278', opacity: 0.25 },
        { pos: [5, 5, -13], r: 0.24, color: '#404c70', opacity: 0.3 },
      ].map((m, idx) => (
        <mesh key={idx} position={m.pos as [number, number, number]}>
          <sphereGeometry args={[m.r, 16, 16]} />
          <meshBasicMaterial color={m.color} transparent opacity={m.opacity} />
        </mesh>
      ))}

      <GalleryWater />
      <InfinityLoop onSelect={onSelect} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Orbit camera — slight auto-pan for cinematic feel                  */
/* ------------------------------------------------------------------ */
function AutoCamera() {
  useFrame((state) => {
    const t = state.clock.elapsedTime
    state.camera.position.x = Math.sin(t * 0.07) * 1.2
    state.camera.position.y = 2.8 + Math.sin(t * 0.05) * 0.3
    state.camera.lookAt(0, 0.7, 0)
  })
  return null
}

function GalleryCanvasContent({ onSelect }: { onSelect: (p: Project) => void }) {
  return (
    <>
      <AutoCamera />
      <GalleryScene onSelect={onSelect} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */
export default function InfinityMoonGallery() {
  const [selected, setSelected] = useState<Project | null>(null)

  const handleSelect = useCallback((p: Project) => setSelected(p), [])
  const handleClose = useCallback(() => setSelected(null), [])

  return (
    <section
      id="projects"
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #020617 0%, #040a1a 100%)' }}
    >
      {/* Section header */}
      <div className="relative z-10 pt-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
        >
          <p className="mb-3 text-[10px] uppercase tracking-[0.6em] text-[#A8C7FF]/50">
            The Cycle
          </p>
          <h2 className="font-display text-4xl font-light text-white sm:text-5xl">
            Project Gallery
          </h2>
          <p className="mt-4 text-sm font-light text-slate-500">
            Click any moon phase to explore the project
          </p>
        </motion.div>
      </div>

      {/* 3-D infinity loop */}
      <div className="h-[75vh]">
        <Canvas
          camera={{ position: [0, 2.8, 9], fov: 52 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false }}
          style={{ width: '100%', height: '100%' }}
        >
          <GalleryCanvasContent onSelect={handleSelect} />
        </Canvas>
      </div>

      {/* Hint labels at bottom */}
      <div className="relative z-10 flex flex-wrap justify-center gap-x-6 gap-y-2 px-8 pb-16 text-center">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className="group flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-slate-400 transition-colors hover:text-slate-200"
          >
            <span
              className="inline-block h-2 w-2 rounded-full transition-all duration-300 group-hover:scale-125"
              style={{ background: p.color || '#555' }}
            />
            {p.phase.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      {/* Modal */}
      <ProjectModal project={selected} onClose={handleClose} />
    </section>
  )
}
