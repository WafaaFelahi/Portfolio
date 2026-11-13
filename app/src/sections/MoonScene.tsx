import { useMemo, useEffect, Suspense } from 'react'
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
/*  Scene constants                                                   */
/* ------------------------------------------------------------------ */
const MOON_POS: [number, number, number] = [0.15, 1.18, -0.8]
const MOON_RADIUS = 1.0

/* ------------------------------------------------------------------ */
/*  STEP 2: Textured moon with 3D Fresnel rim glow                     */
/* ------------------------------------------------------------------ */
const MOON_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`

const MOON_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vViewPosition;

  float lum(vec2 uv) {
    vec3 c = texture2D(uMap, uv).rgb;
    return dot(c, vec3(0.299, 0.587, 0.114));
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPosition);

    // Bump relief derived from photographic lunar topography
    vec2 e = vec2(1.0 / 2048.0, 0.0);
    float hC = lum(vUv);
    float hX = lum(vUv + e.xy);
    float hY = lum(vUv + e.yx);
    vec3 bump = normalize(N + vec3(-(hX - hC), -(hY - hC), 0.0) * 8.0);

    // Soft frontal light with a wide, gentle terminator
    vec3 L = normalize(vec3(0.38, 0.32, 0.86));
    float diff = clamp(dot(bump, L), 0.0, 1.0);
    float terminator = smoothstep(-0.05, 0.85, diff);

    vec3 base = texture2D(uMap, vUv).rgb;
    base = mix(base, base * vec3(0.92, 0.97, 1.10), 0.40); // cool moonlight cast

    // Slightly tone down the core brightness by ~12% so the 3D rim glow pops
    vec3 col = base * (0.19 + 0.83 * terminator);
    col += vec3(0.07, 0.10, 0.18) * (0.3 + 0.7 * terminator) * 0.35;

    // STEP 2: 3D Fresnel-based rim glow following the sphere's curvature naturally
    // fresnel = pow(1.0 - dot(normal, viewDir), 3.0)
    float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
    vec3 rimColor = vec3(0.72, 0.83, 1.0); // #b8d4ff cool icy blue
    float rimIntensity = 0.75;
    col += fresnel * rimColor * rimIntensity;

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

/** Photographic NASA-textured moon with 3D curvature fresnel shading. */
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
/*  Photographic atmospheric corona halo behind the moon               */
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
    float a = pow(max(0.0, 1.0 - d), 2.5);
    gl_FragColor = vec4(uColor * a * uIntensity, a * uIntensity);
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
/*  STEP 7: Subtle god-rays extending downward from the moon           */
/* ------------------------------------------------------------------ */
const GOD_RAYS_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const GOD_RAYS_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uBaseOpacity;
  varying vec2 vUv;

  void main() {
    // vUv.y: 0.0 at top (moon apex) -> 1.0 at bottom
    // vUv.x: 0.0 left -> 1.0 right across ray beam
    float beamAcross = abs(vUv.x - 0.5) * 2.0;
    float beamProfile = exp(-beamAcross * beamAcross * 4.0);

    // Exponential vertical falloff from source down
    float vertFalloff = exp(-vUv.y * 2.2);

    // Slow organic breathing animation (period 8-12 seconds)
    float breathe = 0.85 + 0.15 * sin(uTime * 0.65 + vUv.x * 3.0);

    float alpha = beamProfile * vertFalloff * uBaseOpacity * breathe;
    gl_FragColor = vec4(uColor * alpha, alpha);
  }
`

function GodRays({ moonPos }: { moonPos: [number, number, number] }) {
  // 5 thin radial light shafts spreading across downward 60 degree cone
  const rays = useMemo(
    () => [
      { angle: -0.38, width: 0.75, length: 6.8, opacity: 0.08, zOffset: -0.15 },
      { angle: -0.18, width: 0.95, length: 7.2, opacity: 0.11, zOffset: -0.08 },
      { angle:  0.02, width: 1.10, length: 7.6, opacity: 0.13, zOffset:  0.02 },
      { angle:  0.20, width: 0.90, length: 7.0, opacity: 0.10, zOffset: -0.10 },
      { angle:  0.36, width: 0.70, length: 6.5, opacity: 0.07, zOffset: -0.18 },
    ],
    [],
  )

  const materials = useMemo(
    () =>
      rays.map(
        (r) =>
          new THREE.ShaderMaterial({
            vertexShader: GOD_RAYS_VERTEX,
            fragmentShader: GOD_RAYS_FRAGMENT,
            uniforms: {
              uTime: { value: 0 },
              uColor: { value: new THREE.Color('#c8dcff') }, // Pale icy blue, slightly warm
              uBaseOpacity: { value: r.opacity },
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
      ),
    [rays],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (const mat of materials) {
      mat.uniforms.uTime.value = t
    }
  })

  return (
    <group position={[moonPos[0], moonPos[1], moonPos[2]]}>
      {rays.map((r, i) => (
        <mesh
          key={i}
          position={[0, -r.length / 2, r.zOffset]}
          rotation={[0, 0, r.angle]}
          material={materials[i]}
          renderOrder={1}
        >
          <planeGeometry args={[r.width, r.length, 1, 16]} />
        </mesh>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  STEPS 1, 3, 4, 5, 6, 8, 9, 10: Volumetric Light Scattering Veil   */
/* ------------------------------------------------------------------ */
const PARTICLES_VERTEX = /* glsl */ `
  attribute float aLayer;       // 0=far, 0.5=mid, 1=near (Step 6)
  attribute float aIsSparkle;   // 1=sparkle star, 0=soft dust (Step 10)
  attribute float aLifetime;
  attribute float aStartTime;
  attribute float aDriftSpeed;
  attribute float aSwayAmp;
  attribute float aSwayFreq;
  attribute float aPhase;
  attribute float aSize;

  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uMouseStrength;
  uniform vec3 uMoonPos;

  varying float vLayer;
  varying float vIsSparkle;
  varying float vDistFromMoon;
  varying float vLifeAlpha;
  varying vec3 vWorldPos;

  void main() {
    vLayer = aLayer;
    vIsSparkle = aIsSparkle;

    // Looping lifecycle [0.0, 1.0]
    float age = mod(uTime + aStartTime, aLifetime);
    float progress = age / aLifetime;

    // Smooth sinusoidal birth and fade-out over lifetime
    vLifeAlpha = smoothstep(0.0, 0.16, progress) * smoothstep(1.0, 0.82, progress);

    // Downward drift within cone volume
    float totalHeight = 7.0;
    vec3 p = position;
    p.y -= progress * aDriftSpeed * totalHeight * 0.55;
    if (p.y < (uMoonPos.y - totalHeight)) {
      p.y += totalHeight;
    }

    // Gentle horizontal sway (Step 1)
    float sway = sin(uTime * aSwayFreq + aPhase) * aSwayAmp;
    p.x += sway;
    p.z += cos(uTime * aSwayFreq * 0.85 + aPhase) * (aSwayAmp * 0.5);

    // Interactive mouse dispersion (soft organic push)
    vec2 toMouse = p.xy - uMouse;
    float mouseDistSq = dot(toMouse, toMouse);
    float mouseInfluence = exp(-mouseDistSq * 0.32) * uMouseStrength;
    p.xy += normalize(toMouse + vec2(0.0001)) * mouseInfluence * 0.35;

    vWorldPos = (modelMatrix * vec4(p, 1.0)).xyz;
    vDistFromMoon = length(vWorldPos.xy - uMoonPos.xy);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Point size with screen perspective attenuation
    float pointSize = aSize;
    if (aIsSparkle > 0.5) {
      pointSize = aSize * 0.65; // Sparkles are tiny, delicate points (1-3px feel)
    }
    gl_PointSize = pointSize * (360.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.5, 42.0);
  }
`

const PARTICLES_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uMoonPos;
  uniform float uFalloffScale;

  varying float vLayer;
  varying float vIsSparkle;
  varying float vDistFromMoon;
  varying float vLifeAlpha;
  varying vec3 vWorldPos;

  // Procedural 3D Simplex-style value noise (Step 4)
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3D(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash(p + vec3(0,0,0)), hash(p + vec3(1,0,0)), f.x),
        mix(hash(p + vec3(0,1,0)), hash(p + vec3(1,1,0)), f.x),
        f.y),
      mix(
        mix(hash(p + vec3(0,0,1)), hash(p + vec3(1,0,1)), f.x),
        mix(hash(p + vec3(0,1,1)), hash(p + vec3(1,1,1)), f.x),
        f.y),
      f.z);
  }

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord) * 2.0;
    if (dist > 1.0) discard;

    float spriteAlpha = 0.0;
    vec3 particleTint = vec3(1.0);

    if (vIsSparkle > 0.5) {
      // STEP 10: Micro-stars / sparkles (4-point cross sprite + fast twinkle)
      vec2 p = abs(coord) * 2.0;
      float crossGlow = max(
        exp(-p.x * 14.0) * exp(-p.y * 2.2),
        exp(-p.y * 14.0) * exp(-p.x * 2.2)
      );
      crossGlow += exp(-length(p) * 6.5) * 0.9;
      float twinkle = pow(sin(uTime * 6.0 + vWorldPos.x * 12.0 + vWorldPos.y * 9.0) * 0.5 + 0.5, 3.0);
      spriteAlpha = crossGlow * (0.35 + 0.65 * twinkle);
      particleTint = vec3(1.0, 1.0, 1.0);
    } else {
      // STEP 1: Soft Gaussian radial-gradient sprite (white core fading to transparent edge)
      spriteAlpha = exp(-dist * dist * 3.8) * smoothstep(1.0, 0.15, dist);
    }

    // STEP 3: Exponential opacity falloff with distance from moon center
    // falloffScale ~ 1.8 units (so opacity drops to ~5% at 3x moon radius)
    float expFalloff = exp(-vDistFromMoon / uFalloffScale);

    // STEP 4: Procedural soft 3D noise on veil opacity (kills banding)
    vec3 noisePos = vWorldPos * 0.8 + vec3(0.0, uTime * 0.05, 0.0);
    float n = noise3D(noisePos);
    float noiseMod = 0.70 + 0.30 * n;

    // STEP 6: Depth layer opacity modulation (far: 0.35x, mid: 0.68x, near: 1.0x)
    float layerOpacity = mix(0.35, 1.0, vLayer);

    // STEP 5: Feathered edge mask (smooth fade near viewport edges)
    vec2 ndcApprox = vWorldPos.xy / vec2(3.8, 4.6);
    float edgeX = smoothstep(1.0, 0.72, abs(ndcApprox.x));
    float edgeY = smoothstep(1.0, 0.68, abs(ndcApprox.y));
    float edgeFeather = edgeX * edgeY;

    float finalAlpha = spriteAlpha * expFalloff * noiseMod * layerOpacity * vLifeAlpha * edgeFeather;

    // STEP 9: Color grade (cool icy blue near moon, slightly warm dust far away)
    float dNorm = vDistFromMoon / 1.0;
    vec3 coolCore  = vec3(0.72, 0.83, 1.0); // #b8d4ff to #d8e8ff
    vec3 midMoon   = vec3(0.85, 0.91, 1.0);
    vec3 warmDust  = vec3(0.91, 0.85, 0.78); // #e8d8c8
    vec3 outerGray = vec3(0.80, 0.80, 0.82); // #cccccc

    vec3 baseColor;
    if (dNorm < 1.5) {
      baseColor = mix(coolCore, midMoon, dNorm / 1.5);
    } else if (dNorm < 2.5) {
      baseColor = mix(midMoon, warmDust, (dNorm - 1.5) / 1.0);
    } else {
      baseColor = mix(warmDust, outerGray, clamp((dNorm - 2.5) / 1.5, 0.0, 1.0));
    }

    // STEP 8: Subtle Chromatic Aberration at outer veil edges
    if (dNorm > 1.2) {
      float chroma = clamp((dNorm - 1.2) * 0.25, 0.0, 0.35);
      baseColor.r *= (1.0 + chroma * 0.22);
      baseColor.b *= (1.0 - chroma * 0.18);
    }

    vec3 finalRgb = baseColor * particleTint;
    gl_FragColor = vec4(finalRgb * finalAlpha, finalAlpha);
  }
`

function VolumetricVeilParticles({
  moonPos,
  mouse,
}: {
  moonPos: [number, number, number]
  mouse: MouseState
}) {
  const PARTICLE_COUNT = 3600

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry()

    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const layers = new Float32Array(PARTICLE_COUNT)
    const isSparkle = new Float32Array(PARTICLE_COUNT)
    const lifetimes = new Float32Array(PARTICLE_COUNT)
    const startTimes = new Float32Array(PARTICLE_COUNT)
    const driftSpeeds = new Float32Array(PARTICLE_COUNT)
    const swayAmps = new Float32Array(PARTICLE_COUNT)
    const swayFreqs = new Float32Array(PARTICLE_COUNT)
    const phases = new Float32Array(PARTICLE_COUNT)
    const sizes = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Cone spawn volume: apex at moon, pointing down, half-angle ~25 deg
      // Distribute height with continuous concentration near lunar source
      const hNorm = Math.pow(Math.random(), 0.85)
      const h = 0.4 + hNorm * 6.6
      const maxR = h * Math.tan((25 * Math.PI) / 180)
      const r = maxR * Math.sqrt(Math.random())
      const theta = Math.random() * Math.PI * 2

      const x = moonPos[0] + r * Math.cos(theta)
      const y = moonPos[1] - h
      // Flattened in Z for layered depth
      const z = moonPos[2] + r * Math.sin(theta) * 0.65

      positions[i * 3 + 0] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      // STEP 6: Depth layers (far, mid, near)
      let layer = 0.5 // mid
      if (z < moonPos[2] - 0.25) {
        layer = 0.0 // far
      } else if (z > moonPos[2] + 0.25) {
        layer = 1.0 // near
      }
      layers[i] = layer

      // STEP 10: 5% micro-stars / sparkles
      const sparkle = Math.random() < 0.05 ? 1.0 : 0.0
      isSparkle[i] = sparkle

      // Lifetimes: 4-8 seconds
      lifetimes[i] = 4.5 + Math.random() * 3.5
      startTimes[i] = Math.random() * 8.0

      // Layered drift speed and sizing
      const layerSpeedMod = layer === 0.0 ? 0.6 : layer === 1.0 ? 1.2 : 0.9
      driftSpeeds[i] = (0.45 + Math.random() * 0.45) * layerSpeedMod

      swayAmps[i] = 0.08 + Math.random() * 0.14
      swayFreqs[i] = 0.4 + Math.random() * 0.5
      phases[i] = Math.random() * Math.PI * 2

      // Sizing: 4-12px, varied by layer
      const layerSizeMod = layer === 0.0 ? 0.6 : layer === 1.0 ? 1.25 : 0.9
      sizes[i] = (5.0 + Math.random() * 6.0) * layerSizeMod
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1))
    geo.setAttribute('aIsSparkle', new THREE.BufferAttribute(isSparkle, 1))
    geo.setAttribute('aLifetime', new THREE.BufferAttribute(lifetimes, 1))
    geo.setAttribute('aStartTime', new THREE.BufferAttribute(startTimes, 1))
    geo.setAttribute('aDriftSpeed', new THREE.BufferAttribute(driftSpeeds, 1))
    geo.setAttribute('aSwayAmp', new THREE.BufferAttribute(swayAmps, 1))
    geo.setAttribute('aSwayFreq', new THREE.BufferAttribute(swayFreqs, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))

    const mat = new THREE.ShaderMaterial({
      vertexShader: PARTICLES_VERTEX,
      fragmentShader: PARTICLES_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, -10) },
        uMouseStrength: { value: 0 },
        uMoonPos: { value: new THREE.Vector3(...moonPos) },
        uFalloffScale: { value: 1.85 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending, // STEP 1: Additive blending for pure luminous light
      depthWrite: false,
    })

    return { geometry: geo, material: mat }
  }, [moonPos])

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime

    mouse.current.lerp(mouse.target, Math.min(1, delta * 3.5))
    mouse.strength = THREE.MathUtils.lerp(
      mouse.strength,
      mouse.targetStrength,
      Math.min(1, delta * 2.5),
    )

    const w = state.viewport.width / 2
    const h = state.viewport.height / 2
    ;(material.uniforms.uMouse.value as THREE.Vector2).set(
      mouse.current.x * w,
      mouse.current.y * h,
    )
    material.uniforms.uMouseStrength.value = mouse.strength
  })

  return <points geometry={geometry} material={material} renderOrder={10} />
}

/* ------------------------------------------------------------------ */
/*  Scene graph                                                        */
/* ------------------------------------------------------------------ */
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

      {/* Atmospheric photographic corona halos behind the lunar disc */}
      <Halo
        position={[MOON_POS[0], MOON_POS[1], MOON_POS[2] - 0.30]}
        size={2.7}
        intensity={0.65}
        color="#a8c4ff"
      />
      <Halo
        position={[MOON_POS[0], MOON_POS[1], MOON_POS[2] - 0.55]}
        size={4.8}
        intensity={0.25}
        color="#7fa0e8"
      />
      <Halo
        position={[MOON_POS[0], MOON_POS[1], MOON_POS[2] - 0.85]}
        size={8.0}
        intensity={0.08}
        color="#4a6ab8"
      />

      {/* STEP 7: Breathing God-rays radiating downward */}
      <GodRays moonPos={MOON_POS} />

      {/* The full moon with 3D curvature fresnel rim glow */}
      <Suspense fallback={null}>
        <TexturedMoon radius={MOON_RADIUS} position={MOON_POS} renderOrder={2} />
      </Suspense>

      {/* STEPS 1-10: Realistic volumetric light scattering & cosmic dust veil */}
      <VolumetricVeilParticles moonPos={MOON_POS} mouse={mouse} />
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
