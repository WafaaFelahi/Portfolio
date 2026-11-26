import { createContext, useContext, useEffect, useMemo, useRef, useState, Suspense } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MeshReflectorMaterial, useGLTF } from '@react-three/drei'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { TexturedMoon } from './MoonScene'
import {
  createFigureUniforms,
  lotusAppearTime,
  lotusRadialKey,
  prepareLotus,
  prepareWoman,
  womanReleaseTime,
} from '../three/figures'
import { certificates } from '../data/certificates'
import FilmFinish from '../components/FilmFinish'

/* ------------------------------------------------------------------ */
/*  Stages 2 + 3 — The Journey                                          */
/*  One pinned scene, one woman. The forest becomes a still lake around */
/*  her, her reflection rises, and she dissolves into the white lotus.  */
/*                                                                      */
/*  Everything is a pure function of one scroll value p ∈ [0, 1]:       */
/*    0.00–0.20  The Path: forest, star snow                            */
/*    0.20–0.36  the world turns to water; her reflection appears       */
/*    0.38–0.62  her dress dissolves from the hem into petals           */
/*    0.55–0.85  petals gather; the lotus blooms from its heart         */
/*    0.85–1.00  The Bloom: text and certificates                       */
/* ------------------------------------------------------------------ */

const WOMAN_PATH = './models/woman/woman.glb'
const LOTUS_PATH = './models/lotus/lotus.glb'
const WOMAN_SCALE = 1.15 // ~40% of frame height (was 1.8)
const LOTUS_SCALE = 1.0
const PETAL_COUNT = 6000

const smooth = THREE.MathUtils.smoothstep
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Scene weights derived from scroll progress. */
function weights(p: number) {
  const forest = 1 - smooth(p, 0.2, 0.36)
  return {
    forest,
    lake: 1 - forest,
    // the figure timeline in figures.ts runs 0.15 → 0.78; map it onto p 0.38 → 0.85
    bloom: clamp01(0.15 + (p - 0.38) * 1.34),
  }
}

const ReducedMotion = createContext(false)
function useTime() {
  const reduced = useContext(ReducedMotion)
  return (clock: THREE.Clock) => (reduced ? 0 : clock.elapsedTime)
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const QUAD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/* ------------------------------------------------------------------ */
/*  Sky & fog: night forest blue → lighter, calmer lake                  */
/* ------------------------------------------------------------------ */
function Atmosphere({ progress }: { progress: MotionValue<number> }) {
  const scene = useThree((s) => s.scene)
  const colors = useMemo(
    () => ({
      bgA: new THREE.Color('#0b1428'),
      // the lake stays a deep night; light comes from the moon, lotus and water
      bgB: new THREE.Color('#081127'),
      fogA: new THREE.Color('#1b2946'),
      fogB: new THREE.Color('#16233f'),
    }),
    [],
  )
  const { bg, fog } = useMemo(() => {
    const b = new THREE.Color('#0b1428')
    const f = new THREE.FogExp2('#1b2946', 0.062)
    return { bg: b, fog: f }
  }, [])

  useEffect(() => {
    scene.background = bg
    scene.fog = fog
    return () => {
      scene.background = null
      scene.fog = null
    }
  }, [scene, bg, fog])

  useFrame(() => {
    const { lake } = weights(progress.get())
    bg.copy(colors.bgA).lerp(colors.bgB, lake)
    fog.color.copy(colors.fogA).lerp(colors.fogB, lake)
    fog.density = THREE.MathUtils.lerp(0.062, 0.03, lake)
  })
  return null
}

function Lights({ progress }: { progress: MotionValue<number> }) {
  const forestBack = useRef<THREE.DirectionalLight>(null!)
  const forestFill = useRef<THREE.DirectionalLight>(null!)
  const moonKey = useRef<THREE.DirectionalLight>(null!)
  const lakeFill = useRef<THREE.DirectionalLight>(null!)
  useFrame(() => {
    const { forest, lake } = weights(progress.get())
    forestBack.current.intensity = 1.6 * forest
    forestFill.current.intensity = 0.55 * forest
    moonKey.current.intensity = 1.5 * lake
    lakeFill.current.intensity = 0.7 * lake
  })
  return (
    <>
      <ambientLight intensity={0.46} color="#62769f" />
      {/* forest: moonlight from behind her carves the silhouette */}
      <directionalLight ref={forestBack} position={[0.5, 6, -8]} color="#d4e0ff" />
      <directionalLight ref={forestFill} position={[1.5, 3, 6]} color="#9fb3dd" />
      {/* lake: the moon, upper right, and a soft front fill */}
      <directionalLight ref={moonKey} position={[9, 8, -40]} color="#dfe8ff" />
      <directionalLight ref={lakeFill} position={[-2, 4, 6]} color="#b4c4e6" />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Five-point star snow — fades as the snow settles into water          */
/* ------------------------------------------------------------------ */
const SNOW_VERTEX = /* glsl */ `
  attribute float aSpeed;
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpin;
  uniform float uTime;
  uniform float uTop;
  uniform float uHeight;
  varying float vAngle;
  varying float vDepthFade;
  varying float vSoft;
  void main() {
    vec3 p = position;
    p.y = uTop - mod(uTop - p.y + uTime * aSpeed, uHeight);
    p.x += sin(uTime * 0.45 + aPhase) * 0.35 + sin(uTime * 0.17 + aPhase * 2.0) * 0.2;
    p.z += cos(uTime * 0.35 + aPhase) * 0.2;
    vAngle = aPhase + uTime * aSpin;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    vDepthFade = smoothstep(26.0, 6.0, depth);
    vSoft = smoothstep(3.0, 0.8, depth);
    gl_PointSize = clamp(aSize * (260.0 / depth), 2.0, 64.0);
  }
`

const SNOW_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying float vAngle;
  varying float vDepthFade;
  varying float vSoft;
  float sdStar5(vec2 p, float r, float rf) {
    const vec2 k1 = vec2(0.809016994375, -0.587785252292);
    const vec2 k2 = vec2(-k1.x, k1.y);
    p.x = abs(p.x);
    p -= 2.0 * max(dot(k1, p), 0.0) * k1;
    p -= 2.0 * max(dot(k2, p), 0.0) * k2;
    p.x = abs(p.x);
    p.y -= r;
    vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
    float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
    return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
  }
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float c = cos(vAngle), s = sin(vAngle);
    uv = mat2(c, -s, s, c) * uv;
    float d = sdStar5(uv, 0.34, 0.45);
    float edge = mix(0.025, 0.12, vSoft);
    float core = smoothstep(edge, -edge, d);
    float glow = exp(-max(d, 0.0) * 22.0) * 0.35;
    float a = (core + glow) * vDepthFade * uOpacity;
    if (a < 0.01) discard;
    vec3 col = mix(vec3(0.86, 0.92, 1.0), vec3(1.0), core);
    gl_FragColor = vec4(col, a * 0.9);
  }
`

function StarSnow({ progress, count = 1300 }: { progress: MotionValue<number>; count?: number }) {
  const time = useTime()
  const top = 9
  const height = 9.6
  const points = useMemo(() => {
    const rand = mulberry32(11)
    const pos = new Float32Array(count * 3)
    const speed = new Float32Array(count)
    const size = new Float32Array(count)
    const phase = new Float32Array(count)
    const spin = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 18
      pos[i * 3 + 1] = top - rand() * height
      pos[i * 3 + 2] = 5.5 - rand() * 18
      speed[i] = 0.35 + rand() * 0.55
      size[i] = rand() < 0.08 ? 0.15 + rand() * 0.09 : 0.045 + rand() * 0.065
      phase[i] = rand() * Math.PI * 2
      spin[i] = (rand() - 0.5) * 1.2
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    g.setAttribute('aSpin', new THREE.BufferAttribute(spin, 1))
    const m = new THREE.ShaderMaterial({
      vertexShader: SNOW_VERTEX,
      fragmentShader: SNOW_FRAGMENT,
      uniforms: { uTime: { value: 0 }, uTop: { value: top }, uHeight: { value: height }, uOpacity: { value: 1 } },
      transparent: true,
      depthWrite: false,
    })
    const pts = new THREE.Points(g, m)
    pts.frustumCulled = false
    pts.renderOrder = 20
    return pts
  }, [count])

  useFrame((state) => {
    const m = points.material as THREE.ShaderMaterial
    const o = 1 - smooth(progress.get(), 0.2, 0.32)
    m.uniforms.uTime.value = time(state.clock)
    m.uniforms.uOpacity.value = o
    points.visible = o > 0.005
  })
  return <primitive object={points} />
}

/* ------------------------------------------------------------------ */
/*  Forest — instanced, thins into mist                                  */
/* ------------------------------------------------------------------ */
function Forest({ progress }: { progress: MotionValue<number> }) {
  const forest = useMemo(() => {
    const rand = mulberry32(7)
    type T = { pos: THREE.Vector3; scale: THREE.Vector3 }
    const trunks: T[] = []
    const crowns: T[] = []
    const caps: T[] = []
    for (let i = 0; i < 48; i++) {
      const z = -3 - rand() * 22
      const minX = z > -12 ? 2.2 : 1.1
      const side = rand() < 0.5 ? -1 : 1
      const x = side * (minX + rand() * 9)
      const h = 7 + rand() * 6
      trunks.push({
        pos: new THREE.Vector3(x, h / 2, z),
        scale: new THREE.Vector3(0.09 + rand() * 0.1, h, 0.09 + rand() * 0.1),
      })
      const spread = 0.8 + rand() * 0.4
      for (let k = 0; k < 5; k++) {
        const r = (1.35 - k * 0.22) * spread
        const th = h * 0.2
        const y = h * 0.36 + k * h * 0.13
        crowns.push({ pos: new THREE.Vector3(x, y, z), scale: new THREE.Vector3(r, th, r) })
        caps.push({
          pos: new THREE.Vector3(x, y + th * 0.32, z),
          scale: new THREE.Vector3(r * 0.78, th * 0.3, r * 0.78),
        })
      }
    }
    const group = new THREE.Group()
    const materials: THREE.MeshStandardMaterial[] = []
    const build = (list: T[], geo: THREE.BufferGeometry, color: string) => {
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0, transparent: true })
      materials.push(mat)
      const mesh = new THREE.InstancedMesh(geo, mat, list.length)
      const m = new THREE.Matrix4()
      const q = new THREE.Quaternion()
      list.forEach((t, i) => {
        m.compose(t.pos, q, t.scale)
        mesh.setMatrixAt(i, m)
      })
      mesh.instanceMatrix.needsUpdate = true
      group.add(mesh)
    }
    build(trunks, new THREE.CylinderGeometry(0.7, 1, 1, 6), '#0a0f1c')
    build(crowns, new THREE.ConeGeometry(1, 1, 8), '#0c1528')
    build(caps, new THREE.ConeGeometry(1, 1, 8), '#8296bd')

    // Snow-covered ground that melts away to reveal the water beneath
    const groundMat = new THREE.MeshStandardMaterial({ color: '#9aaed2', roughness: 1, transparent: true })
    materials.push(groundMat)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.set(0, 0.004, -10)
    group.add(ground)
    return { group, materials }
  }, [])

  useFrame(() => {
    const { forest: w } = weights(progress.get())
    forest.materials.forEach((m) => (m.opacity = w))
    forest.group.visible = w > 0.005
  })
  return <primitive object={forest.group} />
}

/* ------------------------------------------------------------------ */
/*  Mist hugging the ground                                              */
/* ------------------------------------------------------------------ */
const MIST_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSeed;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }
  void main() {
    vec2 p = vUv * vec2(6.0, 1.6) + vec2(uTime * 0.03 + uSeed, uSeed * 0.5);
    float n = fbm(p + fbm(p * 0.7 - uTime * 0.02));
    float vertical = smoothstep(1.0, 0.1, vUv.y) * smoothstep(0.0, 0.12, vUv.y);
    float sides = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
    float a = smoothstep(0.35, 0.85, n) * vertical * sides * uOpacity;
    gl_FragColor = vec4(vec3(0.78, 0.85, 0.97) * a, a);
  }
`

function Mist({ progress }: { progress: MotionValue<number> }) {
  const time = useTime()
  const layers = useMemo(
    () =>
      [
        { z: -9, y: 1.1, opacity: 0.5, seed: 3.1, keep: 0.8 },
        { z: -3.5, y: 0.8, opacity: 0.42, seed: 7.4, keep: 0.45 },
        { z: 1.6, y: 0.45, opacity: 0.28, seed: 1.9, keep: 0 },
      ].map((l) => ({
        ...l,
        material: new THREE.ShaderMaterial({
          vertexShader: QUAD_VERTEX,
          fragmentShader: MIST_FRAGMENT,
          uniforms: { uTime: { value: 0 }, uOpacity: { value: l.opacity }, uSeed: { value: l.seed } },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      })),
    [],
  )
  useFrame((state) => {
    const { forest } = weights(progress.get())
    const t = time(state.clock)
    for (const l of layers) {
      l.material.uniforms.uTime.value = t
      // near mist clears so the lotus reads; far mist stays over the lake
      l.material.uniforms.uOpacity.value = l.opacity * THREE.MathUtils.lerp(l.keep, 1, forest)
    }
  })
  return (
    <>
      {layers.map((l, i) => (
        <mesh key={i} position={[0, l.y, l.z]} material={l.material} renderOrder={10}>
          <planeGeometry args={[34, 4.2]} />
        </mesh>
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Lake: mirror water, hills, lily pads, moon                           */
/* ------------------------------------------------------------------ */
function useRippleTexture() {
  return useMemo(() => {
    const size = 128
    const rand = mulberry32(5)
    const raw = Array.from({ length: size * size }, () => rand())
    const data = new Uint8Array(size * size * 4)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let v = 0
        for (let k = -2; k <= 2; k++)
          v += raw[y * size + ((x + k + size) % size)] + raw[((y + k + size) % size) * size + x]
        const c = Math.round((v / 10) * 255)
        const i = (y * size + x) * 4
        data[i] = data[i + 1] = data[i + 2] = c
        data[i + 3] = 255
      }
    }
    const tex = new THREE.DataTexture(data, size, size)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(6, 6)
    tex.magFilter = THREE.LinearFilter
    tex.needsUpdate = true
    return tex
  }, [])
}

function Water() {
  const ripple = useRippleTexture()
  // Dark, glassy water: the reflection carries the light, not the surface colour
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]}>
      <planeGeometry args={[90, 70]} />
      <MeshReflectorMaterial
        resolution={1024}
        blur={[260, 60]}
        mixBlur={0.55}
        mixStrength={1.7}
        mixContrast={1.1}
        mirror={0.85}
        depthScale={0}
        distortion={0.07}
        distortionMap={ripple}
        color="#0a1428"
        metalness={0.6}
        roughness={1}
      />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  Sky: a quiet gradient dome with faint stars, forest → lake           */
/* ------------------------------------------------------------------ */
function SkyDome({ progress }: { progress: MotionValue<number> }) {
  const time = useTime()
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uLake: { value: 0 }, uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uLake;
          uniform float uTime;
          varying vec3 vDir;
          float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
          void main() {
            float h = clamp(vDir.y, 0.0, 1.0);
            vec3 forestSky = mix(vec3(0.10, 0.16, 0.27), vec3(0.04, 0.07, 0.15), pow(h, 0.6));
            // lake: luminous mist at the horizon, deep ink above
            vec3 lakeSky = mix(vec3(0.13, 0.19, 0.31), vec3(0.02, 0.04, 0.10), pow(h, 0.45));
            vec3 col = mix(forestSky, lakeSky, uLake);
            // faint, slowly breathing stars, only in the upper sky
            vec3 cell = floor(vDir * 220.0);
            float s = hash(cell);
            float star = step(0.9975, s) * smoothstep(0.08, 0.35, h);
            float breathe = 0.55 + 0.45 * sin(uTime * 0.6 + s * 60.0);
            col += vec3(0.80, 0.86, 1.0) * star * breathe * 0.55 * uLake;
            gl_FragColor = vec4(col, 1.0);
          }
        `,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  )
  useFrame((state) => {
    material.uniforms.uLake.value = weights(progress.get()).lake
    material.uniforms.uTime.value = time(state.clock)
  })
  return (
    <mesh material={material} renderOrder={-10}>
      <sphereGeometry args={[90, 48, 24]} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  Distant mountain ridges dissolving into horizon mist                 */
/* ------------------------------------------------------------------ */
function Ridge({
  z,
  height,
  color,
  seed,
  progress,
}: {
  z: number
  height: number
  color: string
  seed: number
  progress: MotionValue<number>
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color) }, uSeed: { value: seed }, uLake: { value: 0 } },
        vertexShader: QUAD_VERTEX,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uSeed;
          uniform float uLake;
          varying vec2 vUv;
          float hash(float n) { return fract(sin(n) * 43758.5453); }
          float noise(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hash(i + uSeed), hash(i + 1.0 + uSeed), f); }
          float ridge(float x) {
            float v = 0.0, a = 0.55, fr = 2.2;
            for (int i = 0; i < 5; i++) { v += a * noise(x * fr); fr *= 2.1; a *= 0.48; }
            return v;
          }
          void main() {
            float line = 0.18 + ridge(vUv.x) * 0.7;
            float inside = smoothstep(line + 0.004, line - 0.004, vUv.y);
            // mist rising from the water veils the foot of the mountains
            vec3 mist = vec3(0.16, 0.22, 0.34);
            vec3 col = mix(mist, uColor, smoothstep(0.0, 0.55, vUv.y));
            float a = inside * uLake;
            if (a < 0.003) discard;
            gl_FragColor = vec4(col, a);
          }
        `,
        transparent: true,
        depthWrite: false,
        fog: false,
      }),
    [color, seed],
  )
  useFrame(() => {
    material.uniforms.uLake.value = weights(progress.get()).lake
  })
  return (
    <mesh position={[0, height / 2 - 0.05, z]} material={material} renderOrder={-5}>
      <planeGeometry args={[150, height]} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  The moon's glittering path across the water                          */
/* ------------------------------------------------------------------ */
function MoonPath({ progress }: { progress: MotionValue<number> }) {
  const time = useTime()
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uLake: { value: 0 } },
        vertexShader: QUAD_VERTEX,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform float uLake;
          varying vec2 vUv;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
          }
          void main() {
            // vUv.y: 0 near the viewer → 1 under the moon
            float across = (vUv.x - 0.5) * 2.0;
            float width = mix(1.0, 0.28, vUv.y);
            float band = exp(-pow(across / width, 2.0) * 3.0);
            // small horizontal glints, drifting like ripples
            vec2 q = vec2(vUv.x * 46.0, vUv.y * 420.0 - uTime * 3.0);
            float g = noise(q) * noise(q * 0.5 + 7.3);
            float glints = smoothstep(0.42, 0.75, g);
            float fade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
            float a = glints * band * fade * uLake * 0.85;
            gl_FragColor = vec4(vec3(0.88, 0.92, 1.0) * a, a);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    [],
  )
  useFrame((state) => {
    material.uniforms.uTime.value = time(state.clock)
    material.uniforms.uLake.value = smooth(progress.get(), 0.26, 0.42)
  })
  // Lies on the water along the line from the viewer toward the moon at (9, -41)
  return (
    <mesh position={[4.5, 0.012, -19]} rotation={[-Math.PI / 2, 0, -0.195]} material={material} renderOrder={5}>
      <planeGeometry args={[3.2, 46]} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  After the bloom: fallen petals on the water and rising light motes   */
/* ------------------------------------------------------------------ */
function FallenPetals({ progress }: { progress: MotionValue<number> }) {
  const time = useTime()
  const { petals, material } = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#eef2fb',
      emissive: '#c9d6f2',
      emissiveIntensity: 0.18,
      roughness: 0.45,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    })
    const spots: [number, number, number][] = [
      [-1.6, 0.9, 0.6],
      [1.4, 1.5, 2.2],
      [-2.4, -1.4, 4.1],
      [2.3, -0.6, 1.3],
      [0.9, 2.4, 5.2],
    ]
    return { petals: spots, material: mat }
  }, [])
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame((state) => {
    const b = weights(progress.get()).bloom
    material.opacity = smooth(b, 0.74, 0.9)
    const t = time(state.clock)
    refs.current.forEach((m, i) => {
      if (!m) return
      m.position.y = 0.012 + Math.sin(t * 0.6 + i) * 0.006
      m.rotation.z = petals[i][2] + Math.sin(t * 0.15 + i * 2.0) * 0.12
    })
  })
  return (
    <>
      {petals.map(([x, z, rot], i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m
          }}
          position={[x, 0.012, z]}
          rotation={[-Math.PI / 2, 0, rot]}
          scale={[0.07, 0.16, 1]}
          material={material}
        >
          <circleGeometry args={[1, 24]} />
        </mesh>
      ))}
    </>
  )
}

/** A soft light breathing around the bloomed lotus (and mirrored by the water). */
function LotusAura({ progress }: { progress: MotionValue<number> }) {
  const time = useTime()
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uShow: { value: 0 }, uTime: { value: 0 } },
        vertexShader: QUAD_VERTEX,
        fragmentShader: /* glsl */ `
          uniform float uShow;
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            vec2 c = (vUv - vec2(0.5, 0.42)) * vec2(1.0, 1.35);
            float d = length(c) * 2.0;
            float a = pow(max(0.0, 1.0 - d), 2.6) * (0.85 + 0.15 * sin(uTime * 0.5)) * 0.26 * uShow;
            vec3 col = mix(vec3(1.0, 0.93, 0.82), vec3(0.82, 0.88, 1.0), smoothstep(0.0, 0.8, d));
            gl_FragColor = vec4(col * a, a);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    [],
  )
  useFrame((state) => {
    material.uniforms.uShow.value = smooth(weights(progress.get()).bloom, 0.66, 0.86)
    material.uniforms.uTime.value = time(state.clock)
  })
  return (
    <mesh position={[0, 0.55, -0.4]} material={material} renderOrder={4}>
      <planeGeometry args={[4.2, 3.2]} />
    </mesh>
  )
}

function LightMotes({ progress, count = 140 }: { progress: MotionValue<number>; count?: number }) {
  const time = useTime()
  const points = useMemo(() => {
    const rand = mulberry32(33)
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2
      const r = 0.3 + rand() * 2.2
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = rand() * 2.6
      pos[i * 3 + 2] = Math.sin(a) * r * 0.7
      seed[i] = rand()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uShow: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime;
        varying float vA;
        void main() {
          vec3 p = position;
          float rise = mod(p.y + uTime * (0.05 + aSeed * 0.08), 2.6);
          p.y = rise;
          p.x += sin(uTime * 0.3 + aSeed * 40.0) * 0.12;
          vA = smoothstep(0.0, 0.5, rise) * smoothstep(2.6, 1.6, rise) * (0.35 + 0.65 * aSeed);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (2.0 + aSeed * 3.0) * (6.0 / -mv.z);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uShow;
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = exp(-d * d * 4.0) * vA * uShow;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vec3(1.0, 0.95, 0.86) * a, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const pts = new THREE.Points(g, m)
    pts.frustumCulled = false
    return pts
  }, [count])
  useFrame((state) => {
    const m = points.material as THREE.ShaderMaterial
    m.uniforms.uTime.value = time(state.clock)
    m.uniforms.uShow.value = smooth(weights(progress.get()).bloom, 0.78, 0.95)
  })
  return <primitive object={points} />
}

function Glow({ position, size, strength }: { position: [number, number, number]; size: number; strength: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: QUAD_VERTEX,
        fragmentShader: /* glsl */ `
          uniform float uStrength;
          varying vec2 vUv;
          void main() {
            float d = distance(vUv, vec2(0.5)) * 2.0;
            float a = pow(max(0.0, 1.0 - d), 2.3) * uStrength;
            gl_FragColor = vec4(vec3(0.68, 0.78, 0.97) * a, a);
          }
        `,
        uniforms: { uStrength: { value: strength } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    [strength],
  )
  return (
    <mesh position={position} material={material}>
      <planeGeometry args={[size, size]} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  The woman, the petals and the lotus — one timeline                   */
/* ------------------------------------------------------------------ */
const PETAL_VERTEX = /* glsl */ `
  attribute vec3 aTo;
  attribute float aStart;
  attribute float aEnd;
  attribute float aSeed;
  uniform float uProgress;
  uniform float uTime;
  varying float vAlpha;
  varying float vSeed;
  vec3 bezier(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
    float u = 1.0 - t;
    return u*u*u*a + 3.0*u*u*t*b + 3.0*u*t*t*c + t*t*t*d;
  }
  void main() {
    vSeed = aSeed;
    float e = clamp((uProgress - aStart) / max(aEnd - aStart, 0.001), 0.0, 1.0);
    float s = e * e * (3.0 - 2.0 * e);
    vec3 from = position;
    vec2 outward = normalize(from.xz + vec2(0.0011, 0.0007));
    vec3 c1 = from + vec3(outward.x * 0.55, 0.4 + aSeed * 0.55, outward.y * 0.55);
    vec3 c2 = aTo + vec3(0.0, 0.65 + aSeed * 0.45, 0.0);
    vec3 p = bezier(from, c1, c2, aTo, s);
    float ang = s * (1.0 - s) * 4.0 * (0.9 + aSeed * 0.8);
    float cs = cos(ang), sn = sin(ang);
    p.xz = mat2(cs, -sn, sn, cs) * p.xz;
    float air = sin(s * 3.14159);
    p += vec3(sin(uTime * 1.3 + aSeed * 20.0), cos(uTime * 1.1 + aSeed * 17.0) * 0.6, sin(uTime * 0.9 + aSeed * 11.0)) * 0.03 * air;
    vAlpha = smoothstep(0.0, 0.04, uProgress - aStart) * (1.0 - smoothstep(aEnd, aEnd + 0.05, uProgress));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (4.5 + aSeed * 8.0) * (6.0 / -mv.z) * (0.7 + 0.5 * air);
  }
`

const PETAL_FRAGMENT = /* glsl */ `
  varying float vAlpha;
  varying float vSeed;
  void main() {
    if (vAlpha < 0.01) discard;
    vec2 uv = gl_PointCoord - 0.5;
    float a0 = vSeed * 6.2831;
    uv = mat2(cos(a0), -sin(a0), sin(a0), cos(a0)) * uv;
    float d = length(uv * vec2(1.0, 2.1)) + abs(uv.y) * 0.25;
    float a = smoothstep(0.5, 0.05, d) * vAlpha;
    vec3 col = mix(vec3(0.92, 0.95, 1.0), vec3(1.0, 0.9, 0.74), step(0.86, vSeed) * 0.7);
    gl_FragColor = vec4(col * a, a);
  }
`

function firstMesh(root: THREE.Object3D): THREE.Mesh | null {
  let found: THREE.Mesh | null = null
  root.traverse((c) => {
    if (!found && (c as THREE.Mesh).isMesh) found = c as THREE.Mesh
  })
  return found
}

function Figures({ progress }: { progress: MotionValue<number> }) {
  const time = useTime()
  const { scene: womanSrc } = useGLTF(WOMAN_PATH)
  const { scene: lotusSrc } = useGLTF(LOTUS_PATH)
  const womanU = useMemo(() => createFigureUniforms(), [])
  const lotusU = useMemo(() => createFigureUniforms(), [])

  const built = useMemo(() => {
    const womanGroup = new THREE.Group()
    womanGroup.rotation.y = Math.PI // strictly from behind
    womanGroup.scale.setScalar(WOMAN_SCALE)
    womanGroup.add(prepareWoman(womanSrc, womanU, { dissolve: true }))
    womanGroup.updateMatrixWorld(true)

    const lotusGroup = new THREE.Group()
    lotusGroup.position.y = -0.05
    lotusGroup.scale.setScalar(LOTUS_SCALE)
    lotusGroup.add(prepareLotus(lotusSrc, lotusU))
    lotusGroup.updateMatrixWorld(true)

    const rand = mulberry32(21)
    const wMesh = firstMesh(womanGroup)!
    const lMesh = firstMesh(lotusGroup)!
    const wSampler = new MeshSurfaceSampler(wMesh).build()
    const lSampler = new MeshSurfaceSampler(lMesh).build()
    const tmp = new THREE.Vector3()
    const height = womanU.uHeight.value

    type S = { p: THREE.Vector3; t: number }
    const from: S[] = []
    while (from.length < PETAL_COUNT) {
      wSampler.sample(tmp)
      const hN = THREE.MathUtils.clamp(tmp.y / height, 0, 1)
      if (hN > 0.6 && rand() > 0.3) continue
      from.push({ p: tmp.clone().applyMatrix4(wMesh.matrixWorld), t: womanReleaseTime(hN, rand() - 0.5) })
    }
    const to: S[] = []
    for (let i = 0; i < PETAL_COUNT; i++) {
      lSampler.sample(tmp)
      const key = lotusRadialKey(tmp.x, tmp.y, tmp.z)
      to.push({ p: tmp.clone().applyMatrix4(lMesh.matrixWorld), t: lotusAppearTime(key, 0) })
    }
    // Pair by timing: the hem becomes the lotus heart
    from.sort((a, b) => a.t - b.t)
    to.sort((a, b) => a.t - b.t)

    const pos = new Float32Array(PETAL_COUNT * 3)
    const aTo = new Float32Array(PETAL_COUNT * 3)
    const aStart = new Float32Array(PETAL_COUNT)
    const aEnd = new Float32Array(PETAL_COUNT)
    const aSeed = new Float32Array(PETAL_COUNT)
    for (let i = 0; i < PETAL_COUNT; i++) {
      from[i].p.toArray(pos, i * 3)
      to[i].p.toArray(aTo, i * 3)
      aStart[i] = from[i].t
      aEnd[i] = Math.max(to[i].t + 0.02, from[i].t + 0.15)
      aSeed[i] = rand()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aTo', new THREE.BufferAttribute(aTo, 3))
    geo.setAttribute('aStart', new THREE.BufferAttribute(aStart, 1))
    geo.setAttribute('aEnd', new THREE.BufferAttribute(aEnd, 1))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1))
    const petalMat = new THREE.ShaderMaterial({
      vertexShader: PETAL_VERTEX,
      fragmentShader: PETAL_FRAGMENT,
      uniforms: { uProgress: { value: 0 }, uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const petals = new THREE.Points(geo, petalMat)
    petals.frustumCulled = false
    petals.renderOrder = 15
    return { womanGroup, lotusGroup, petals, petalMat }
  }, [womanSrc, lotusSrc, womanU, lotusU])

  useFrame((state) => {
    const p = progress.get()
    const { bloom } = weights(p)
    const t = time(state.clock)
    womanU.uProgress.value = bloom
    womanU.uTime.value = t
    lotusU.uProgress.value = bloom
    built.petalMat.uniforms.uProgress.value = bloom
    built.petalMat.uniforms.uTime.value = t
    built.womanGroup.visible = bloom < 0.52
    built.lotusGroup.visible = bloom > 0.44
    built.petals.visible = bloom > 0.14 && bloom < 0.86
    built.lotusGroup.position.y = -0.05 + Math.sin(t * 0.5) * 0.012 * smooth(bloom, 0.7, 0.85)
  })

  return (
    <>
      <primitive object={built.womanGroup} />
      <primitive object={built.lotusGroup} />
      <primitive object={built.petals} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Camera: forest framing → gentle dolly → down to the lotus            */
/* ------------------------------------------------------------------ */
function CameraRig({ progress }: { progress: MotionValue<number> }) {
  const reduced = useContext(ReducedMotion)
  const k = useMemo(
    () => ({
      posA: new THREE.Vector3(0, 1.25, 7.2),
      posB: new THREE.Vector3(0, 1.32, 6.5),
      posC: new THREE.Vector3(0, 1.15, 4.4),
      lookA: new THREE.Vector3(0, 1.0, 0),
      lookB: new THREE.Vector3(0, 0.95, 0),
      lookC: new THREE.Vector3(0, 0.42, 0),
      pos: new THREE.Vector3(),
      look: new THREE.Vector3(),
      lookNow: new THREE.Vector3(0, 1.0, 0),
    }),
    [],
  )
  useFrame((state, delta) => {
    const p = progress.get()
    const k1 = smooth(p, 0, 0.36)
    const k2 = smooth(p, 0.4, 0.85)
    k.pos.copy(k.posA).lerp(k.posB, k1).lerp(k.posC, k2)
    k.look.copy(k.lookA).lerp(k.lookB, k1).lerp(k.lookC, k2)
    if (!reduced) {
      k.pos.x += state.pointer.x * 0.2
      k.pos.y += state.pointer.y * 0.08
    }
    const damp = reduced ? 1 : Math.min(1, delta * 2.4)
    state.camera.position.lerp(k.pos, damp)
    k.lookNow.lerp(k.look, damp)
    state.camera.lookAt(k.lookNow)
  })
  return null
}

/** With reduced motion the canvas renders only when the scroll moves. */
function RenderOnScroll({ progress }: { progress: MotionValue<number> }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => progress.on('change', () => invalidate()), [progress, invalidate])
  return null
}

function JourneyScene({ progress, armed }: { progress: MotionValue<number>; armed: boolean }) {
  const reduced = useContext(ReducedMotion)
  return (
    <>
      <Atmosphere progress={progress} />
      <Lights progress={progress} />
      <CameraRig progress={progress} />
      {reduced && <RenderOnScroll progress={progress} />}

      <SkyDome progress={progress} />
      <Suspense fallback={null}>
        <TexturedMoon radius={2.1} position={[9, 8, -41]} />
      </Suspense>
      <Glow position={[9, 8, -40.5]} size={18} strength={0.42} />
      <Ridge z={-58} height={9} color="#1a2846" seed={4.2} progress={progress} />
      <Ridge z={-50} height={6.5} color="#0e182f" seed={9.7} progress={progress} />
      <Water />
      <MoonPath progress={progress} />
      <Forest progress={progress} />
      <Mist progress={progress} />

      {armed && (
        <Suspense fallback={null}>
          <Figures progress={progress} />
        </Suspense>
      )}

      <LotusAura progress={progress} />
      <FallenPetals progress={progress} />
      <LightMotes progress={progress} />
      <StarSnow progress={progress} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Section                                                              */
/* ------------------------------------------------------------------ */
function Scrim() {
  return (
    <div
      aria-hidden="true"
      className="absolute -inset-x-20 -inset-y-14 -z-10"
      style={{ background: 'radial-gradient(closest-side, rgba(2,6,23,0.55), rgba(2,6,23,0))' }}
    />
  )
}

export default function Journey() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion() ?? false
  const near = useInView(sectionRef, { margin: '600px 0px' })
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (near) setArmed(true)
  }, [near])

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const pathOpacity = useTransform(scrollYProgress, [0.02, 0.07, 0.16, 0.22], [0, 1, 1, 0])
  const pathY = useTransform(scrollYProgress, [0.02, 0.07], [16, 0])
  const bloomOpacity = useTransform(scrollYProgress, [0.84, 0.92], [0, 1])
  const bloomY = useTransform(scrollYProgress, [0.84, 0.92], [16, 0])

  return (
    <section
      ref={sectionRef}
      id="journey"
      aria-label="The Path and The Bloom"
      className="relative h-[300vh] bg-[#0b1428] md:h-[440vh]"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <ReducedMotion.Provider value={reduced}>
          <Canvas
            camera={{ position: [0, 1.25, 7.2], fov: 40 }}
            dpr={[1, 1.5]}
            frameloop={near ? (reduced ? 'demand' : 'always') : 'never'}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            style={{ position: 'absolute', inset: 0 }}
          >
            {/* Context does not cross the R3F reconciler, so provide it again inside */}
            <ReducedMotion.Provider value={reduced}>
              <JourneyScene progress={scrollYProgress} armed={armed} />
            </ReducedMotion.Provider>
          </Canvas>
        </ReducedMotion.Provider>

        <FilmFinish />

        {/* melt in from the hero's night sky */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#020617] to-transparent" />

        {/* quiet progress line, so the pinned scroll never feels stuck */}
        <div aria-hidden="true" className="pointer-events-none absolute right-6 top-1/2 h-36 w-px -translate-y-1/2 bg-white/10 sm:right-10">
          <motion.div style={{ scaleY: scrollYProgress }} className="h-full w-full origin-top bg-[#A8C7FF]/70" />
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-end px-8 pb-24 sm:px-14 lg:px-24 xl:px-32">
          {/* The Path */}
          <motion.div style={{ opacity: pathOpacity, y: pathY }} className="absolute bottom-24 isolate max-w-sm">
            <Scrim />
            <p className="mb-4 text-[10px] font-light uppercase tracking-[0.6em] text-slate-300">The Path</p>
            <h2 className="font-display text-3xl font-light leading-tight text-slate-100 sm:text-4xl">
              Walking Through Complexity
            </h2>
            <p className="mt-4 text-sm font-light leading-relaxed text-slate-300">
              Every system built is a step through the unknown
            </p>
          </motion.div>

          {/* The Bloom */}
          <motion.div style={{ opacity: bloomOpacity, y: bloomY }} className="pointer-events-auto relative isolate max-w-md">
            <Scrim />
            <p className="mb-4 text-[10px] font-light uppercase tracking-[0.6em] text-slate-300">The Bloom</p>
            <h2 className="font-display text-3xl font-light leading-tight text-slate-100 sm:text-4xl">
              Blooming in Still Water
            </h2>
            <p className="mt-4 text-sm font-light leading-relaxed text-slate-300">
              Growth happens in the quiet between deployments
            </p>
            {certificates.length > 0 && (
              <ul aria-label="Certifications" className="mt-8 flex flex-col gap-1 border-t border-[#A8C7FF]/15 pt-5">
                {certificates.map((c) => (
                  <li key={c.url}>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex min-h-11 items-baseline gap-3 text-sm text-slate-200 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8C7FF]"
                    >
                      <span>{c.name}</span>
                      <span className="text-xs text-slate-300">
                        {c.issuer}
                        {c.year ? ` · ${c.year}` : ''}
                      </span>
                      <span aria-hidden="true" className="text-[#C4A77D] transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#020617]" />
      </div>
    </section>
  )
}
