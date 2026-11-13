import { useRef, useMemo, Suspense } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { motion } from 'framer-motion'

/* ------------------------------------------------------------------ */
/*  Water surface — custom shader with ripple & reflection tint        */
/* ------------------------------------------------------------------ */
const WATER_VERT = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec3 p = position;
    // gentle wave
    p.y += sin(p.x * 1.8 + uTime * 0.9) * 0.055;
    p.y += sin(p.z * 2.2 - uTime * 0.7) * 0.04;
    p.y += sin(p.x * 0.7 + p.z * 1.3 + uTime * 0.5) * 0.035;
    vWorldPos = (modelMatrix * vec4(p, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const WATER_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uMoonColor;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 x){
    vec2 i=floor(x); vec2 f=fract(x); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }
  float fbm(vec2 p){ float v=0.0; float a=0.5; for(int i=0;i<4;i++){v+=a*noise(p);p*=2.1;a*=0.5;} return v; }

  void main() {
    vec2 uv = vUv;

    // ripple distortion
    float ripple1 = fbm(uv * 6.0 + vec2(uTime * 0.3, uTime * 0.2));
    float ripple2 = fbm(uv * 4.0 - vec2(uTime * 0.2, uTime * 0.35));
    float ripple  = ripple1 * 0.6 + ripple2 * 0.4;

    // base water colour — lighter, cleaner water for the lotus
    vec3 deepWater = vec3(0.04, 0.09, 0.20);
    vec3 shallow   = vec3(0.08, 0.16, 0.32);
    vec3 water = mix(deepWater, shallow, ripple);

    // moon reflection column
    float moonX   = 0.5;
    float distX   = abs(uv.x - moonX);
    float col     = 1.0 - uv.y; // reflection is brighter near centre
    float moonGlow = exp(-distX * distX * 40.0) * col * (0.8 + ripple * 0.5);
    water += uMoonColor * moonGlow * 0.55;

    // shimmer
    float shimmer = noise(uv * 30.0 + uTime * 1.5) * 0.04;
    water += shimmer;

    // mist at edges
    float mist = smoothstep(0.35, 0.0, abs(uv.x - 0.5));
    water = mix(water, vec3(0.08, 0.12, 0.22), mist * 0.3);

    gl_FragColor = vec4(water, 0.92);
  }
`

function WaterPlane() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: WATER_VERT,
        fragmentShader: WATER_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uMoonColor: { value: new THREE.Color(0.85, 0.90, 1.0) },
        },
        transparent: true,
        depthWrite: false,
      }),
    [],
  )
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
  })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} material={material}>
      <planeGeometry args={[22, 22, 64, 64]} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  Full moon in sky                                                   */
/* ------------------------------------------------------------------ */
function Moon() {
  return (
    <>
      <mesh position={[0, 5.5, -8]}>
        <sphereGeometry args={[1.3, 48, 48]} />
        <meshStandardMaterial
          color="#e8eeff"
          emissive="#c0ccff"
          emissiveIntensity={0.8}
          roughness={0.6}
        />
      </mesh>
      {/* soft halo behind moon */}
      <mesh position={[0, 5.5, -8.2]}>
        <planeGeometry args={[6, 6]} />
        <meshBasicMaterial color="#8090d0" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Lotus flower — loaded from high-quality GLB model                  */
/* ------------------------------------------------------------------ */
const LOTUS_MODEL_PATH = './models/lotus/lotus.glb'

function LotusFlower() {
  const { scene } = useGLTF(LOTUS_MODEL_PATH)
  const groupRef = useRef<THREE.Group>(null!)

  const clone = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: '#ffffff',
          emissive: '#f4f7ff',
          emissiveIntensity: 0.22,
          roughness: 0.38,
          metalness: 0.0,
          sheen: 1,
          sheenColor: '#ffffff',
          sheenRoughness: 0.45,
          clearcoat: 0.18,
          clearcoatRoughness: 0.4,
          side: THREE.DoubleSide,
        })
      }
    })
    return c
  }, [scene])

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime
      // Slow, elegant rotation
      groupRef.current.rotation.y = t * 0.1
      // Gentle floating bob on the water
      groupRef.current.position.y = -0.3 + Math.sin(t * 0.5) * 0.06
    }
  })

  return (
    <group ref={groupRef} position={[0, -0.3, 0]} scale={[1.2, 1.2, 1.2]}>
      <primitive object={clone} />
    </group>
  )
}

// Preload the model
useGLTF.preload(LOTUS_MODEL_PATH)

/* ------------------------------------------------------------------ */
/*  Mist layer                                                         */
/* ------------------------------------------------------------------ */
function Mist() {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame((state) => {
    if (ref.current) {
      ;(ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.06 + Math.sin(state.clock.elapsedTime * 0.4) * 0.02
    }
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[24, 24]} />
      <meshBasicMaterial color="#7090b8" transparent opacity={0.07} depthWrite={false} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  Scene                                                               */
/* ------------------------------------------------------------------ */
function LotusScene() {
  return (
    <>
      <ambientLight intensity={0.2} color="#2a4070" />
      {/* Main moonlight from above */}
      <pointLight position={[0, 6, -7]} intensity={2.0} color="#c0ccff" />
      {/* Soft frontal fill to illuminate the lotus */}
      <pointLight position={[0, 2, 4]} intensity={0.8} color="#8090e0" />
      {/* Warm accent from below for the lotus surface */}
      <pointLight position={[0, 0.5, 0]} intensity={0.4} color="#a0b0d0" />
      {/* Rim light behind for depth */}
      <directionalLight position={[0, 3, -5]} intensity={0.5} color="#6080c0" />

      {/* Lotus fill — white ambient + directional key/rim */}
      <ambientLight intensity={0.55} color="#ffffff" />
      <directionalLight position={[1.5, 4.5, 3]} intensity={1.8} color="#fff8f0" />
      <directionalLight position={[-2, 2.5, -1]} intensity={0.6} color="#e8eeff" />

      <Moon />
      <WaterPlane />
      <Suspense fallback={null}>
        <LotusFlower />
      </Suspense>
      <Mist />

      {/* Distant forest silhouette */}
      {[-6, -3, 0, 3, 6].map((x, i) => (
        <mesh key={i} position={[x, 1, -10]}>
          <coneGeometry args={[0.9, 4, 5]} />
          <meshStandardMaterial color="#0a1020" />
        </mesh>
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */
export default function LotusWater() {
  return (
    <section
      id="lotus-water"
      className="relative h-screen min-h-[640px] w-full overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #020617 0%, #050c20 60%, #080d1c 100%)' }}
    >
      <Canvas
        camera={{ position: [0, 2.5, 6], fov: 48 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <LotusScene />
      </Canvas>

      {/* Moon reflection gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 30% 60% at 50% 0%, rgba(168,199,255,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Text overlay */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="mb-3 text-[10px] uppercase tracking-[0.6em] text-[#A8C7FF]/60">
            The Transformation
          </p>
          <h2 className="font-display text-3xl font-light text-white/80 sm:text-4xl">
            Blooming in Still Water
          </h2>
          <p className="mt-3 text-sm font-light text-slate-400">
            Growth happens in the quiet between deployments
          </p>
        </motion.div>
      </div>

      {/* Gradient bleed */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#020617]" />
    </section>
  )
}
