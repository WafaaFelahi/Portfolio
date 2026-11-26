import { useEffect, useState } from 'react'
import * as THREE from 'three'

/**
 * Renders realistic moon-phase icons once, offscreen, from the NASA lunar
 * texture, then hands back image URLs. One short-lived WebGL context for all
 * phases instead of a live canvas per card.
 *
 * Phase angle: 0 = new moon, π/2 = first quarter, π = full, 3π/2 = last quarter.
 */

const VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uPhase;
  varying vec3 vNormal;
  varying vec2 vUv;

  float lum(vec2 uv) { return dot(texture2D(uMap, uv).rgb, vec3(0.299, 0.587, 0.114)); }

  void main() {
    vec3 N = normalize(vNormal);

    // Surface relief from the photographic texture
    vec2 e = vec2(1.0 / 2048.0, 0.0);
    float h = lum(vUv);
    vec3 bump = normalize(N + vec3(-(lum(vUv + e.xy) - h), -(lum(vUv + e.yx) - h), 0.0) * 6.0);

    // Sunlight direction for this phase (viewer looks down -Z)
    vec3 L = normalize(vec3(sin(uPhase), 0.0, -cos(uPhase)));
    float lit = smoothstep(-0.04, 0.22, dot(bump, L));

    vec3 base = texture2D(uMap, vUv).rgb;
    base = mix(base, base * vec3(0.93, 0.97, 1.08), 0.35);

    // Faint earthshine keeps the unlit disc readable, as on a real night
    vec3 col = base * (0.045 + 1.05 * lit);

    // Thin cool limb so even the new moon has a silhouette
    float limb = pow(1.0 - clamp(N.z, 0.0, 1.0), 3.0);
    col += vec3(0.55, 0.66, 0.9) * limb * (0.12 + 0.35 * lit);

    gl_FragColor = vec4(col, 1.0);
  }
`

async function renderPhases(angles: number[], size: number): Promise<string[]> {
  const texture = await new THREE.TextureLoader().loadAsync('/textures/moon-2k.jpg')
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.anisotropy = 4

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setSize(size, size, false)
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1.04, 1.04, 1.04, -1.04, 0.1, 10)
  camera.position.z = 3

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: { uMap: { value: texture }, uPhase: { value: 0 } },
  })
  const geometry = new THREE.SphereGeometry(1, 96, 96)
  const moon = new THREE.Mesh(geometry, material)
  moon.rotation.y = Math.PI / 2 // near side faces the viewer, as in the hero
  scene.add(moon)

  const urls = angles.map((angle) => {
    material.uniforms.uPhase.value = angle
    renderer.render(scene, camera)
    return renderer.domElement.toDataURL('image/png')
  })

  geometry.dispose()
  material.dispose()
  texture.dispose()
  renderer.dispose()
  renderer.forceContextLoss()
  return urls
}

export function useMoonPhaseImages(angles: number[], size = 192): string[] | null {
  const [urls, setUrls] = useState<string[] | null>(null)
  const key = angles.join(',')

  useEffect(() => {
    let cancelled = false
    renderPhases(angles, size)
      .then((result) => {
        if (!cancelled) setUrls(result)
      })
      .catch(() => {
        if (!cancelled) setUrls(null)
      })
    return () => {
      cancelled = true
    }
    // angles are compared by value via `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, size])

  return urls
}
