import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { motion } from 'framer-motion'

/* ------------------------------------------------------------------ */
/*  Snow particle system                                               */
/* ------------------------------------------------------------------ */
function SnowParticles({ count = 2000 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null!)

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 30
      pos[i * 3 + 1] = Math.random() * 20 - 2
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
      vel[i] = 0.5 + Math.random() * 1.5
    }
    return [pos, vel]
  }, [count])

  useFrame((_, delta) => {
    const geo = pointsRef.current.geometry
    const attr = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < count; i++) {
      attr.array[i * 3 + 1] -= velocities[i] * delta * 0.6
      attr.array[i * 3 + 0] += Math.sin(Date.now() * 0.001 + i) * delta * 0.1
      if (attr.array[i * 3 + 1] < -2) {
        attr.array[i * 3 + 1] = 18
      }
    }
    attr.needsUpdate = true
  })

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [positions])

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        color="#dce8ff"
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.75}
        depthWrite={false}
      />
    </points>
  )
}

/* ------------------------------------------------------------------ */
/*  Pine tree — low-poly cone stack                                    */
/* ------------------------------------------------------------------ */
function PineTree({
  position,
  scale = 1,
}: {
  position: [number, number, number]
  scale?: number
}) {
  return (
    <group position={position} scale={scale}>
      {/* trunk */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 1.2, 6]} />
        <meshStandardMaterial color="#2a1a0e" />
      </mesh>
      {/* three cone tiers */}
      {[2.8, 2.0, 1.3].map((y, i) => (
        <mesh key={i} position={[0, y * 0.6, 0]}>
          <coneGeometry args={[0.6 - i * 0.1, 1.2, 7]} />
          <meshStandardMaterial color={`hsl(210, 20%, ${14 + i * 4}%)`} roughness={0.9} />
        </mesh>
      ))}
      {/* snow on branches */}
      {[2.8, 2.0, 1.3].map((y, i) => (
        <mesh key={`snow-${i}`} position={[0, y * 0.6 + 0.55, 0]}>
          <coneGeometry args={[0.55 - i * 0.09, 0.18, 7]} />
          <meshStandardMaterial color="#dce8ff" roughness={0.95} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  Walking figure with lotus-shaped dress                             */
/* ------------------------------------------------------------------ */
function LotusWoman() {
  const groupRef = useRef<THREE.Group>(null!)
  const dressRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current) {
      // gentle sway
      groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.06
      groupRef.current.position.x = Math.sin(t * 0.3) * 0.15
    }
    if (dressRef.current) {
      dressRef.current.rotation.y = t * 0.2
    }
  })

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Head */}
      <mesh position={[0, 3.0, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#f0e0cc" />
      </mesh>
      {/* Hair — dark ellipsoid */}
      <mesh position={[0, 3.12, 0]}>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#1a0e06" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.14, 0.22, 1.8, 12]} />
        <meshStandardMaterial color="#f5f5f8" roughness={0.4} transparent opacity={0.95} />
      </mesh>
      {/* Lotus dress — 12 petals using flat triangular fans */}
      <group ref={dressRef} position={[0, 1.0, 0]}>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2
          const x = Math.cos(angle) * 0.55
          const z = Math.sin(angle) * 0.55
          return (
            <mesh key={i} position={[x * 0.5, 0, z * 0.5]} rotation={[0.25, angle, 0]}>
              <coneGeometry args={[0.28, 1.1, 4]} />
              <meshStandardMaterial
                color="#f0f4ff"
                roughness={0.25}
                transparent
                opacity={0.82}
                side={THREE.DoubleSide}
              />
            </mesh>
          )
        })}
        {/* Centre disc */}
        <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.3, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  Ground — snow plane with faint footsteps                           */
/* ------------------------------------------------------------------ */
function SnowGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
      <planeGeometry args={[40, 40, 1, 1]} />
      <meshStandardMaterial color="#c8d8f0" roughness={0.95} metalness={0.0} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  Three.js scene inside Canvas                                       */
/* ------------------------------------------------------------------ */
function ForestScene() {
  const treePositions: [number, number, number][] = [
    [-4, -1.5, -3], [-6, -1.5, -6], [-3, -1.5, -8],
    [4, -1.5, -4], [6.5, -1.5, -7], [3, -1.5, -9],
    [-5, -1.5, -12], [5, -1.5, -11], [0, -1.5, -14],
    [-2, -1.5, -5], [2.5, -1.5, -6],
  ]

  return (
    <>
      <ambientLight intensity={0.3} color="#6080b0" />
      <directionalLight
        position={[3, 8, 5]}
        intensity={0.9}
        color="#a0b8e8"
        castShadow
      />
      {/* God-ray fill from dawn sky */}
      <pointLight position={[0, 10, 5]} intensity={0.5} color="#c0d4f8" />

      <SnowGround />
      <SnowParticles count={2200} />

      {treePositions.map((pos, i) => (
        <PineTree key={i} position={pos} scale={0.8 + Math.random() * 0.6} />
      ))}

      <LotusWoman />

      {/* Soft mist plane */}
      <mesh position={[0, -0.8, -6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#8ba5cc" transparent opacity={0.07} depthWrite={false} />
      </mesh>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Section wrapper with HTML overlay                                  */
/* ------------------------------------------------------------------ */
export default function SnowyForest() {
  return (
    <section
      id="snowy-forest"
      className="relative h-screen min-h-[640px] w-full overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #0d1a2e 0%, #1a2d4a 40%, #2a3d5a 100%)' }}
    >
      {/* 3-D scene */}
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        style={{ position: 'absolute', inset: 0 }}
        shadows
      >
        <ForestScene />
      </Canvas>

      {/* Atmospheric god-ray gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 70% 20%, rgba(160,184,232,0.12) 0%, transparent 70%)',
        }}
      />

      {/* HTML text overlay */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="mb-3 text-[10px] uppercase tracking-[0.6em] text-[#A8C7FF]/60">
            The Journey
          </p>
          <h2 className="font-display text-3xl font-light text-white/80 sm:text-4xl">
            Walking Through Complexity
          </h2>
          <p className="mt-3 text-sm font-light text-slate-400">
            Every system built is a step through the unknown
          </p>
        </motion.div>
      </div>

      {/* Bottom gradient bleed into next section */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#020617]" />
    </section>
  )
}
