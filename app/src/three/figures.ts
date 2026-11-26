import * as THREE from 'three'

/**
 * Shared materials for the woman (Stage 2 + 3) and the lotus (Stage 3).
 *
 * Dissolve timing is a pure function of scroll progress `uProgress` so the
 * woman → petals → lotus sequence plays forwards and backwards with scroll.
 * The same timing functions are mirrored in JS (womanReleaseTime /
 * lotusAppearTime) so every petal particle leaves the dress exactly where it
 * dissolves and lands exactly where the lotus forms.
 */

export const LOTUS_RADIUS = 0.95 // model-space half width of lotus.glb
export const LOTUS_HEIGHT = 1.44

export function womanReleaseTime(hNorm: number, jitter: number) {
  return 0.15 + hNorm * 0.28 + jitter * 0.08
}

export function lotusRadialKey(x: number, y: number, z: number) {
  const r = Math.hypot(x, z) / LOTUS_RADIUS
  return Math.min(1, Math.max(0, r * 0.85 + (y / LOTUS_HEIGHT) * 0.15))
}

export function lotusAppearTime(radialKey: number, jitter: number) {
  return 0.48 + radialKey * 0.22 + jitter * 0.06
}

export type FigureUniforms = {
  uTime: { value: number }
  uHeight: { value: number }
  uProgress: { value: number }
}

export function createFigureUniforms(): FigureUniforms {
  return { uTime: { value: 0 }, uHeight: { value: 1.7 }, uProgress: { value: 0 } }
}

const NOISE_GLSL = /* glsl */ `
  float fHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float fNoise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(fHash(i), fHash(i + vec3(1,0,0)), f.x),
                   mix(fHash(i + vec3(0,1,0)), fHash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(fHash(i + vec3(0,0,1)), fHash(i + vec3(1,0,1)), f.x),
                   mix(fHash(i + vec3(0,1,1)), fHash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
`

/**
 * Clone the woman GLB, stand her on y = 0, and give her the pale moonlit look.
 * Note: in woman.glb the petal texture is stored as the EMISSIVE texture
 * (base colour is black), so it is moved to the colour slot here.
 */
export function prepareWoman(
  source: THREE.Object3D,
  uniforms: FigureUniforms,
  { dissolve = false }: { dissolve?: boolean } = {},
) {
  const clone = source.clone(true)
  const box = new THREE.Box3().setFromObject(clone)
  const centre = box.getCenter(new THREE.Vector3())
  clone.position.set(-centre.x, -box.min.y, -centre.z)
  uniforms.uHeight.value = box.max.y - box.min.y

  clone.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh) return
    const src = mesh.material as THREE.MeshStandardMaterial
    const tex = src.map ?? src.emissiveMap ?? null
    if (tex) tex.colorSpace = THREE.SRGBColorSpace

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.8,
      metalness: 0,
      side: THREE.DoubleSide,
    })
    mat.customProgramCacheKey = () => (dissolve ? 'woman-dissolve' : 'woman')
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime
      shader.uniforms.uHeight = uniforms.uHeight
      shader.uniforms.uProgress = uniforms.uProgress

      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nuniform float uTime;\nuniform float uHeight;\nvarying vec3 vLocal;',
        )
        .replace(
          '#include <begin_vertex>',
          /* glsl */ `#include <begin_vertex>
          vLocal = transformed;
          float lower = clamp(1.0 - transformed.y / uHeight, 0.0, 1.0);
          float w = lower * lower;
          transformed.x += sin(uTime * 0.55 + transformed.y * 2.6) * 0.03 * w;
          transformed.z += sin(uTime * 0.42 + transformed.y * 1.9 + 1.3) * 0.022 * w;`,
        )

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>\nuniform float uHeight;\nuniform float uProgress;\nvarying vec3 vLocal;\nfloat dEdge = 0.0;\n${NOISE_GLSL}`,
        )
        .replace(
          '#include <clipping_planes_fragment>',
          dissolve
            ? /* glsl */ `#include <clipping_planes_fragment>
            float hN = clamp(vLocal.y / uHeight, 0.0, 1.0);
            float tRel = 0.15 + hN * 0.28 + (fNoise(vLocal * 9.0) - 0.5) * 0.08;
            if (uProgress > tRel) discard;
            dEdge = smoothstep(tRel - 0.035, tRel, uProgress);`
            : '#include <clipping_planes_fragment>',
        )
        .replace(
          '#include <map_fragment>',
          /* glsl */ `#include <map_fragment>
          float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
          vec3 pale = vec3(0.90, 0.93, 1.0) * (0.45 + 0.7 * lum);
          diffuseColor.rgb = mix(diffuseColor.rgb, pale, 0.6);`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          /* glsl */ `#include <emissivemap_fragment>
          float rim = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.4);
          totalEmissiveRadiance += vec3(0.72, 0.82, 1.0) * rim * 0.55;
          totalEmissiveRadiance += vec3(0.88, 0.92, 1.0) * dEdge * 2.2;`,
        )
    }
    mesh.material = mat
  })
  return clone
}

/** Clone the lotus GLB with a pearl-white, moonlit, softly iridescent petal material. */
export function prepareLotus(source: THREE.Object3D, uniforms: FigureUniforms) {
  const clone = source.clone(true)
  clone.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh) return
    const mat = new THREE.MeshStandardMaterial({
      color: '#eef1fb',
      roughness: 0.38,
      metalness: 0,
      side: THREE.DoubleSide,
    })
    mat.customProgramCacheKey = () => 'lotus-bloom'
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uProgress = uniforms.uProgress
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLocal;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = transformed;')

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>\nuniform float uProgress;\nvarying vec3 vLocal;\nfloat dEdge = 0.0;\n${NOISE_GLSL}`,
        )
        .replace(
          '#include <clipping_planes_fragment>',
          /* glsl */ `#include <clipping_planes_fragment>
          float rKey = clamp(length(vLocal.xz) / ${LOTUS_RADIUS.toFixed(2)} * 0.85 + vLocal.y / ${LOTUS_HEIGHT.toFixed(2)} * 0.15, 0.0, 1.0);
          float tApp = 0.48 + rKey * 0.22 + (fNoise(vLocal * 11.0) - 0.5) * 0.06;
          if (uProgress < tApp) discard;
          dEdge = 1.0 - smoothstep(tApp, tApp + 0.04, uProgress);`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          /* glsl */ `#include <emissivemap_fragment>
          vec3 V = normalize(vViewPosition);
          float fr = pow(1.0 - abs(dot(normalize(normal), V)), 2.0);
          // Pearl sheen at the petal edges: cool and quiet, only a breath of prism
          vec3 irid = 0.5 + 0.5 * cos(6.2831 * (fr * 0.9 + vec3(0.0, 0.33, 0.67)));
          totalEmissiveRadiance += mix(vec3(0.84, 0.89, 1.0), irid, 0.08) * fr * 0.42;
          // Soft translucency, as if moonlight passes through the petals
          totalEmissiveRadiance += vec3(0.88, 0.92, 1.0) * 0.12;
          // A soft, warm heart where the stamens sit
          float rC = length(vLocal.xz) / ${LOTUS_RADIUS.toFixed(2)};
          float heart = smoothstep(0.34, 0.0, rC) * smoothstep(0.05, 0.3, vLocal.y / ${LOTUS_HEIGHT.toFixed(2)});
          totalEmissiveRadiance += vec3(1.0, 0.88, 0.66) * heart * 0.38;
          // Bloom edge as petals form
          totalEmissiveRadiance += vec3(0.9, 0.94, 1.0) * dEdge * 1.8;`,
        )
    }
    mesh.material = mat
  })
  return clone
}
