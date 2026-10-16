import { Suspense, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'

/* ------------------------------------------------------------------ */
/*  Shared mouse state (window-level, smoothed inside the render loop) */
/* ------------------------------------------------------------------ */
type MouseState = {
  target: THREE.Vector2 // NDC coords, updated instantly on pointermove
  current: THREE.Vector2 // smoothed, used by the shaders
  strength: number
  targetStrength: number
}

function useWindowMouse(): MouseState {
  const state = useMemo<MouseState>(
    () => ({
      target: new THREE.Vector2(0, 0),
      current: new THREE.Vector2(0, 0),
      strength: 0,
      targetStrength: 0,
    }),
    [],
  )

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      state.target.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1),
      )
      state.targetStrength = 1
    }
    const onLeave = () => {
      state.targetStrength = 0
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [state])

  return state
}

/* ------------------------------------------------------------------ */
/*  Textured moon — NASA photographic surface (shared component)      */
/* ------------------------------------------------------------------ */
const MOON_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const MOON_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  varying vec3 vNormal;
  varying vec2 vUv;

  float lum(vec2 uv) {
    vec3 c = texture2D(uMap, uv).rgb;
    return dot(c, vec3(0.299, 0.587, 0.114));
  }

  void main() {
    vec3 N = normalize(vNormal);

    // Bump relief derived from the photographic surface itself
    vec2 e = vec2(1.0 / 2048.0, 0.0);
    float hC = lum(vUv);
    float hX = lum(vUv + e.xy);
    float hY = lum(vUv + e.yx);
    vec3 bump = normalize(N + vec3(-(hX - hC), -(hY - hC), 0.0) * 9.0);

    // Soft frontal light with a wide, gentle terminator
    vec3 L = normalize(vec3(0.42, 0.34, 0.84));
    float diff = clamp(dot(bump, L), 0.0, 1.0);
    float terminator = smoothstep(-0.05, 0.85, diff);

    vec3 base = texture2D(uMap, vUv).rgb;
    base = mix(base, base * vec3(0.92, 0.97, 1.10), 0.45); // cool moonlight cast

    vec3 col = base * (0.22 + 0.95 * terminator);
    col += vec3(0.08, 0.11, 0.20) * (0.3 + 0.7 * terminator) * 0.40;

    // Ethereal limb glow
    float fres = pow(1.0 - clamp(dot(N, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 3.0);
    col += vec3(0.60, 0.72, 1.0) * fres * 0.65;

    gl_FragColor = vec4(col, 1.0);
  }
`

export function useMoonMaterial() {
  const map = useTexture('/textures/moon-2k.jpg')
  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace
    map.wrapS = THREE.RepeatWrapping
    map.anisotropy = 4
  }, [map])
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uMap: { value: map } },
        vertexShader: MOON_VERTEX,
        fragmentShader: MOON_FRAGMENT,
      }),
    [map],
  )
}

/** Photographic NASA-textured moon with soft glow shading. */
export function TexturedMoon({
  radius = 1,
  position = [0, 0, 0] as [number, number, number],
  rotationY = Math.PI / 2,
  renderOrder,
}: {
  radius?: number
  position?: [number, number, number]
  rotationY?: number
  renderOrder?: number
}) {
  const material = useMoonMaterial()
  return (
    <mesh position={position} rotation={[0, rotationY, 0]} material={material} renderOrder={renderOrder}>
      <sphereGeometry args={[radius, 96, 96]} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  Halo — soft additive radial glow planes behind the moon            */
/* ------------------------------------------------------------------ */
const HALO_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const HALO_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, vec2(0.5)) * 2.0;
    float a = pow(max(0.0, 1.0 - d), 2.4);
    gl_FragColor = vec4(uColor, a * uIntensity);
  }
`

function Halo({
  position,
  size,
  intensity,
  color,
}: {
  position: [number, number, number]
  size: number
  intensity: number
  color: string
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: HALO_VERTEX,
        fragmentShader: HALO_FRAGMENT,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [color, intensity],
  )
  return (
    <mesh position={position} material={material} renderOrder={0}>
      <planeGeometry args={[size, size]} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  Veil ribbons — dense silk draped from behind the moon's limb.     */
/*  Top edge is PINNED (no drift, no mouse); folds grow downward.      */
/* ------------------------------------------------------------------ */
const VEIL_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uMouseStrength;
  uniform float uPhase;
  uniform float uDriftAmp;
  uniform float uDriftFreq;
  uniform float uSpeed;
  varying vec2 vUv;
  varying float vShade;
  varying float vInfluence;

  void main() {
    vUv = uv;
    vec3 p = position;

    // 0 at the pinned head (touching the moon), 1 at the free end
    float drop = 1.0 - uv.y;
    // Pin: nothing moves for the first stretch below the moon
    float pin = smoothstep(0.03, 0.32, drop);

    float t = uTime;

    // Fabric ripple across the width — soft permanent folds
    p.z += sin(uv.x * 6.2831 + p.y * 0.9 + uPhase) * 0.09 * pin;

    // Long s-curve drift, fanning out as the ribbon falls
    float s1 = sin(p.y * uDriftFreq + uPhase + t * uSpeed);
    float s2 = sin(p.y * uDriftFreq * 0.45 - t * uSpeed * 0.6 + uPhase * 1.7);
    p.x += (s1 * 0.5 + s2 * 0.85) * uDriftAmp * pin;
    p.z += cos(p.y * uDriftFreq * 0.8 + uPhase + t * uSpeed * 0.8) * 0.30 * pin;

    // Mouse — only the free fabric responds, never the pinned head
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vec2 d = wp.xy - uMouse;
    float free = smoothstep(0.15, 0.55, drop);
    float infl = exp(-dot(d, d) * 0.25) * uMouseStrength * free;
    p.x += infl * 0.50 * sin(t * 1.2 + p.y * 1.8 + uPhase);
    p.z += infl * 0.75;
    vInfluence = infl;

    // Fold shading: brightness follows the local slope of the drift
    float slope = cos(p.y * uDriftFreq + uPhase + t * uSpeed) * uDriftFreq * uDriftAmp * pin;
    vShade = clamp(slope * 0.55, -0.9, 0.9);

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0);
  }
`

const VEIL_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vShade;
  varying float vInfluence;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.1;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float across = abs(vUv.x - 0.5) * 2.0; // 0 center → 1 edge

    // Dense interwoven silk: broad sheets + fine threads
    float sheet = fbm(vec2(vUv.x * 9.0, vUv.y * 2.0 - uTime * 0.03));
    float weave = fbm(vec2(vUv.x * 22.0, vUv.y * 3.4 - uTime * 0.045));
    float thread = noise(vec2(vUv.x * 55.0, vUv.y * 5.0 - uTime * 0.02));
    float body = 0.34 + 0.36 * sheet + 0.22 * weave + 0.16 * thread;

    // Fibrous uneven edges
    float rough = fbm(vec2(vUv.y * 3.5 - uTime * 0.04, vUv.x * 2.0)) * 0.35;
    float edge = 1.0 - smoothstep(0.40, 1.0, across + rough);

    // Fade the free tip away; keep the head bright where it leaves the moon
    float tipFade = smoothstep(0.0, 0.20, vUv.y);
    float nearMoon = 0.40 + 0.60 * pow(vUv.y, 0.8);

    float shade = 0.80 + 0.35 * vShade;

    float alpha = edge * tipFade * nearMoon * body * shade * uOpacity;
    alpha += vInfluence * 0.14 * edge;
    alpha = clamp(alpha, 0.0, 0.92);

    vec3 deep = vec3(0.46, 0.59, 0.93);
    vec3 light = vec3(0.91, 0.95, 1.0);
    vec3 col = mix(deep, light, clamp(vUv.y * 0.55 + shade * 0.28 + sheet * 0.25, 0.0, 1.0));
    col += vInfluence * vec3(0.10, 0.14, 0.25);

    gl_FragColor = vec4(col, alpha);
  }
`

/* ------------------------------------------------------------------ */
/*  Scene graph                                                        */
/* ------------------------------------------------------------------ */
const MOON_POS: [number, number, number] = [0.15, 1.18, -0.8]
const MOON_RADIUS = 1.0

type RibbonCfg = {
  x: number
  width: number
  length: number
  zOff: number // relative to the moon's z
  phase: number
  driftAmp: number
  driftFreq: number
  speed: number
  opacity: number
  rot: number
}

/** Back ribbons — dense silk draped from behind the moon's limb. */
const BACK_RIBBONS: RibbonCfg[] = [
  { x: -0.72, width: 0.60, length: 4.9, zOff: -0.38, phase: 0.9, driftAmp: 0.50, driftFreq: 0.58, speed: 0.31, opacity: 0.44, rot: 0.10 },
  { x: -0.52, width: 0.85, length: 5.4, zOff: -0.30, phase: 0.0, driftAmp: 0.55, driftFreq: 0.55, speed: 0.30, opacity: 0.55, rot: 0.07 },
  { x: -0.30, width: 0.70, length: 6.4, zOff: -0.44, phase: 3.9, driftAmp: 0.78, driftFreq: 0.44, speed: 0.23, opacity: 0.48, rot: 0.03 },
  { x: -0.12, width: 1.15, length: 6.2, zOff: -0.22, phase: 1.7, driftAmp: 0.70, driftFreq: 0.48, speed: 0.24, opacity: 0.66, rot: 0.01 },
  { x: 0.06, width: 0.60, length: 7.1, zOff: -0.42, phase: 5.6, driftAmp: 0.92, driftFreq: 0.38, speed: 0.21, opacity: 0.50, rot: 0.05 },
  { x: 0.20, width: 0.90, length: 5.9, zOff: -0.34, phase: 2.6, driftAmp: 0.66, driftFreq: 0.50, speed: 0.26, opacity: 0.55, rot: -0.02 },
  { x: 0.38, width: 0.75, length: 6.8, zOff: -0.40, phase: 4.8, driftAmp: 0.85, driftFreq: 0.41, speed: 0.22, opacity: 0.50, rot: -0.04 },
  { x: 0.56, width: 0.95, length: 6.7, zOff: -0.26, phase: 3.1, driftAmp: 0.82, driftFreq: 0.42, speed: 0.27, opacity: 0.62, rot: -0.06 },
  { x: 0.74, width: 0.62, length: 5.0, zOff: -0.36, phase: 5.1, driftAmp: 0.55, driftFreq: 0.57, speed: 0.32, opacity: 0.44, rot: -0.12 },
]

/** One translucent drape over the moon's front lower limb. */
const FRONT_RIBBON: RibbonCfg = {
  x: -0.10, width: 0.90, length: 3.4, zOff: 0.38,
  phase: 2.4, driftAmp: 0.34, driftFreq: 0.66, speed: 0.30, opacity: 0.34, rot: 0.02,
}

function Ribbon({
  mouse,
  cfg,
  renderOrder,
}: {
  mouse: MouseState
  cfg: RibbonCfg
  renderOrder: number
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VEIL_VERTEX,
        fragmentShader: VEIL_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, -10) },
          uMouseStrength: { value: 0 },
          uPhase: { value: cfg.phase },
          uDriftAmp: { value: cfg.driftAmp },
          uDriftFreq: { value: cfg.driftFreq },
          uSpeed: { value: cfg.speed },
          uOpacity: { value: cfg.opacity },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [cfg],
  )

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime

    // Smooth the pointer toward its target
    mouse.current.lerp(mouse.target, Math.min(1, delta * 3.5))
    mouse.strength = THREE.MathUtils.lerp(
      mouse.strength,
      mouse.targetStrength,
      Math.min(1, delta * 2.5),
    )

    // Map NDC to world units (approximate: z = 0 plane)
    const w = state.viewport.width / 2
    const h = state.viewport.height / 2
    ;(material.uniforms.uMouse.value as THREE.Vector2).set(
      mouse.current.x * w,
      mouse.current.y * h,
    )
    material.uniforms.uMouseStrength.value = mouse.strength
  })

  // The head tucks behind the moon's lower limb
  const attachY = MOON_POS[1] - MOON_RADIUS * 0.18
  return (
    <mesh
      position={[
        MOON_POS[0] + cfg.x,
        attachY - cfg.length / 2,
        MOON_POS[2] + cfg.zOff,
      ]}
      rotation={[0, 0, cfg.rot]}
      material={material}
      renderOrder={renderOrder}
    >
      <planeGeometry args={[cfg.width, cfg.length, 20, 150]} />
    </mesh>
  )
}

/** Subtle camera drift: the whole scene breathes very slowly. */
function CameraDrift() {
  useFrame((state) => {
    const t = state.clock.elapsedTime
    state.camera.position.x = Math.sin(t * 0.08) * 0.05
    state.camera.position.y = Math.cos(t * 0.06) * 0.04
    state.camera.lookAt(0.2, 0.1, -1)
  })
  return null
}

function SceneContent({ mouse }: { mouse: MouseState }) {
  return (
    <>
      <CameraDrift />
      {/* Glow layers */}
      <Halo position={[MOON_POS[0], MOON_POS[1], MOON_POS[2] - 0.30]} size={2.6} intensity={0.75} color="#a8c4ff" />
      <Halo position={[MOON_POS[0], MOON_POS[1], MOON_POS[2] - 0.55]} size={4.8} intensity={0.28} color="#7fa0e8" />
      <Halo position={[MOON_POS[0], MOON_POS[1], MOON_POS[2] - 0.85]} size={8.0} intensity={0.10} color="#4a6ab8" />
      {/* Dense silk veils (behind) → moon → front drape */}
      {BACK_RIBBONS.map((cfg, i) => (
        <Ribbon key={i} mouse={mouse} cfg={cfg} renderOrder={2 + i} />
      ))}
      <Suspense fallback={null}>
        <TexturedMoon radius={MOON_RADIUS} position={MOON_POS} renderOrder={1} />
      </Suspense>
      <Ribbon mouse={mouse} cfg={FRONT_RIBBON} renderOrder={20} />
    </>
  )
}

export default function MoonScene() {
  const mouse = useWindowMouse()

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 42 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <SceneContent mouse={mouse} />
    </Canvas>
  )
}
