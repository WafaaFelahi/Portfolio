---
name: threejs-3d
description: |
  Expert guidance for building 3D scenes with React Three Fiber (R3F), Drei, GLSL shaders,
  WebGL, and space/cosmic aesthetics. Use this skill whenever the user mentions:
  - Three.js, R3F, React Three Fiber, @react-three/fiber, @react-three/drei
  - 3D scenes, meshes, geometries, materials, lighting
  - GLSL shaders, vertex shaders, fragment shaders, ShaderMaterial, uniforms
  - WebGL, GPU rendering, draw calls, instancing
  - Volumetric light, god rays, bloom, post-processing (pmndrs/postprocessing)
  - Particles, particle systems, Points, BufferGeometry
  - Space, cosmic, nebula, star field, moon, celestial aesthetics
  - Canvas performance, FPS optimization, LOD, frustum culling
  - Vite + React + TypeScript 3D projects
  Trigger even for subtle mentions like "my 3D scene is slow", "add a glow effect",
  "shader not working", or "3D portfolio". Load immediately — don't wait to be asked twice.
---

# Three.js / R3F / GLSL Skill

## Stack context (this project)
- **Framework**: React 18 + TypeScript + Vite
- **3D**: `@react-three/fiber` (R3F) + `@react-three/drei`
- **Post-processing**: `@react-three/postprocessing` (pmndrs)
- **Style**: cosmic/space — deep navy (#020617), moonlight (#A8C7FF), gold (#C4A77D)
- **Existing scenes**: MoonScene (volumetric light scattering, fresnel rim, god rays, cosmic dust), LotusWater, SnowyForest, InfinityMoonGallery

---

## Scene architecture

```tsx
// Canonical R3F scene structure
<Canvas
  camera={{ position: [0, 0, 5], fov: 60 }}
  gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
  dpr={[1, 2]}           // cap pixel ratio for perf
>
  <Suspense fallback={null}>
    <group>
      <MyMesh />
    </group>
    <Environment />
  </Suspense>
  <EffectComposer>       // post-processing last
    <Bloom luminanceThreshold={0.2} intensity={1.5} />
  </EffectComposer>
</Canvas>
```

**Rules:**
- Always use `<Suspense>` for async assets
- Put `<EffectComposer>` outside the scene group, as the last child of `<Canvas>`
- Use `dpr={[1, 2]}` — never `dpr={window.devicePixelRatio}` (blows perf on Retina)
- `toneMapping: THREE.ACESFilmicToneMapping` for cinematic color grading

---

## GLSL shader patterns

### ShaderMaterial in R3F
```tsx
const MyShader = () => {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#A8C7FF') },
    uIntensity: { value: 1.0 },
  }), [])

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
      />
    </mesh>
  )
}
```

### Fresnel rim glow (used in MoonScene)
```glsl
// vertex
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}

// fragment
uniform vec3 uRimColor;
uniform float uRimPower;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 viewDir = normalize(vViewPosition);
  float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
  rim = pow(rim, uRimPower);  // uRimPower: 2.0–6.0
  gl_FragColor = vec4(uRimColor * rim, rim);
}
```

### Volumetric god rays (raymarch approach)
```glsl
// Key idea: march along view ray, accumulate light scatter
float godRay(vec3 rayOrigin, vec3 rayDir, vec3 lightPos, float density, int steps) {
  float stepSize = 1.0 / float(steps);
  float light = 0.0;
  for (int i = 0; i < steps; i++) {
    vec3 pos = rayOrigin + rayDir * (float(i) * stepSize);
    float dist = length(pos - lightPos);
    light += exp(-dist * density) * stepSize;
  }
  return light;
}
```
Keep steps ≤ 64 for real-time; use `gl_FragDepth` to avoid overdraw artefacts.

### Noise utilities
```glsl
// Classic 3D Perlin noise (include as a header)
vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
// ... (use glsl-noise or lygia library snippets)

// Fbm (fractal brownian motion) for nebula / clouds
float fbm(vec3 p, int octaves) {
  float value = 0.0, amplitude = 0.5;
  for (int i = 0; i < octaves; i++) {
    value += amplitude * noise(p);
    p *= 2.0; amplitude *= 0.5;
  }
  return value;
}
```

---

## Particle systems

### GPU instancing (100k+ particles)
```tsx
const StarField = ({ count = 50000 }) => {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 200
      arr[i * 3 + 1] = (Math.random() - 0.5) * 200
      arr[i * 3 + 2] = (Math.random() - 0.5) * 200
    }
    return arr
  }, [count])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.08} color="#A8C7FF" sizeAttenuation transparent opacity={0.8} />
    </points>
  )
}
```

### Animated particles with custom shader
- Store position + velocity in `BufferAttribute`
- Update in `useFrame` on CPU for < 10k; use compute shaders / GPGPU for > 10k
- For GPGPU: use `@react-three/drei`'s `useFBO` or three-stdlib's `GPUComputationRenderer`

---

## Post-processing (pmndrs)

```tsx
import { EffectComposer, Bloom, ChromaticAberration, Vignette, GodRays } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

<EffectComposer multisampling={0}> {/* multisampling=0 for perf with custom passes */}
  <Bloom
    luminanceThreshold={0.15}
    luminanceSmoothing={0.025}
    intensity={2.0}
    blendFunction={BlendFunction.SCREEN}
  />
  <ChromaticAberration offset={[0.0005, 0.0005]} />
  <Vignette eskil={false} offset={0.1} darkness={0.8} />
</EffectComposer>
```

**GodRays** require a mesh ref:
```tsx
const sunRef = useRef<THREE.Mesh>(null)
// ...
<GodRays sun={sunRef} blendFunction={BlendFunction.SCREEN} samples={60} density={0.96} />
```

---

## Performance patterns

| Problem | Fix |
|---|---|
| Too many draw calls | Merge static geometry with `mergeBufferGeometries` or use `InstancedMesh` |
| Shader recompile on prop change | Memoize `uniforms` with `useMemo`; never recreate the object |
| Texture too large | Use KTX2/Basis compressed textures via Drei's `<BasisTextureLoader>` |
| Re-renders causing canvas flicker | Move state to refs (`useRef`) and update in `useFrame` |
| Heavy post-processing on mobile | Check `window.devicePixelRatio < 2` and disable effects |
| Particle update lag | Batch position updates; never create `new Float32Array` inside `useFrame` |

### useFrame best practices
```tsx
useFrame(({ clock, camera }, delta) => {
  // delta = seconds since last frame — use for frame-rate-independent animation
  meshRef.current.rotation.y += delta * 0.5
  // clock.elapsedTime for oscillating values
  uniforms.uTime.value = clock.elapsedTime
})
```

---

## Cosmic / space aesthetics

**Color palette** (from this portfolio):
```ts
const SPACE = { bg: '#020617', moonlight: '#A8C7FF', gold: '#C4A77D', nebula: '#1a1f36' }
```

**Lighting setup for space scenes:**
```tsx
<ambientLight intensity={0.02} />           // near-black ambient
<directionalLight position={[5, 5, 5]} intensity={0.8} color="#A8C7FF" />
<pointLight position={[0, 0, 0]} intensity={3} color="#ffffff" distance={20} decay={2} />
```

**Moon material recipe:**
- Base: `MeshStandardMaterial` with roughness 0.9, metalness 0.0
- Overlay: custom `ShaderMaterial` for atmosphere glow + fresnel rim
- Post: Bloom (luminanceThreshold 0.1) for the halo

**Star field tips:**
- Two layers: distant static points + close animated dust
- Vary `size` per point using a `sizes` BufferAttribute
- Apply `sRGBEncoding` to any loaded textures

---

## Drei utilities worth knowing

```tsx
// Orbit controls (dev only — disable in production portfolio)
<OrbitControls enableDamping dampingFactor={0.05} />

// Preload assets
useGLTF.preload('/models/lotus.glb')
useTexture.preload('/textures/moon-normal.jpg')

// Environment / HDRI
<Environment preset="night" />           // or files={[...]}

// Soft shadows
<SoftShadows size={25} samples={16} />

// HTML overlay in 3D space
<Html position={[0, 1, 0]} center>
  <div className="label">Hello</div>
</Html>
```

---

## Debugging

- **Black canvas / nothing renders**: check camera FOV and near/far clip (`near: 0.1, far: 1000`)
- **Shader not compiling**: add `#version 300 es` or check for syntax errors — R3F swallows GLSL errors; open Chrome DevTools > Console for `THREE.WebGLProgram` errors
- **Texture appears white**: set `texture.colorSpace = THREE.SRGBColorSpace` after loading
- **Post-processing kills alpha**: set `gl={{ alpha: false }}` on `<Canvas>` when using EffectComposer
- **Uniforms not updating**: confirm you're mutating `.value` not replacing the uniform object

---

## TypeScript integration

```ts
// Augment drei/fiber types if needed
import { extend } from '@react-three/fiber'
import { CustomShaderMaterial } from 'three-custom-shader-material'
extend({ CustomShaderMaterial })

// Typed ref
const meshRef = useRef<THREE.Mesh>(null!)

// Typed uniform
interface Uniforms {
  uTime: THREE.IUniform<number>
  uColor: THREE.IUniform<THREE.Color>
}
```

---

## Common Vite config for 3D projects

```ts
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'], r3f: ['@react-three/fiber', '@react-three/drei'] },
      },
    },
  },
})
```
