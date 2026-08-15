import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Stars } from '@react-three/drei';
import * as THREE from 'three';

function Moon() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.06;
      meshRef.current.rotation.x = Math.sin(t * 0.04) * 0.05;
    }
    if (glowRef.current) {
      const s = 1 + Math.sin(t * 0.5) * 0.03;
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      {/* Outer glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.05, 32, 32]} />
        <meshBasicMaterial
          color="#4a7ba8"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Moon sphere */}
      <Sphere ref={meshRef} args={[1.6, 64, 64]}>
        <MeshDistortMaterial
          color="#c8d6e8"
          emissive="#2a3f6e"
          emissiveIntensity={0.18}
          roughness={0.82}
          metalness={0.1}
          distort={0.08}
          speed={0.4}
        />
      </Sphere>

      {/* Soft point light */}
      <pointLight position={[4, 4, 4]} intensity={1.6} color="#c8d6e8" />
      <pointLight position={[-3, -2, -3]} intensity={0.4} color="#2a3f7e" />
      <ambientLight intensity={0.15} color="#1a2a50" />
    </group>
  );
}

export default function MoonScene({ className = '' }: { className?: string }) {
  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0, 5], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Stars radius={80} depth={50} count={1800} factor={3} fade speed={0.4} />
      <Moon />
    </Canvas>
  );
}
