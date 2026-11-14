'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SIZE, bridges, height, roadDist, slope, smooth } from '@/systems/world';

export function Terrain() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(SIZE, SIZE, 200, 200);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 3);
    const c = new THREE.Color(), t = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), h = height(x, z), sl = slope(x, z);
      p.setY(i, h);
      const n = 0.5 + 0.5 * Math.sin(x * 0.31) * Math.cos(z * 0.27);
      c.set('#587f43').lerp(t.set('#8aa55b'), n * 0.8);
      c.lerp(t.set('#d6c391'), smooth(1.1, 0.3, h));
      c.lerp(t.set('#8a857a'), Math.min(1, smooth(0.5, 1, sl) + smooth(14, 20, h) * 0.7));
      c.lerp(t.set('#f1f3f5'), smooth(27, 31, h) * (1 - smooth(0.9, 1.4, sl)));
      c.lerp(t.set('#a38d68'), smooth(2.6, 1.2, roadDist(x, z)) * smooth(-0.2, 0.4, h));
      c.lerp(t.set('#5c8c93'), smooth(-0.1, -1.2, h));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>;
}

export function Water() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { if (ref.current) ref.current.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.05; });
  return <mesh ref={ref} rotation-x={-Math.PI / 2}><planeGeometry args={[900, 900]} /><meshStandardMaterial color="#2a84a0" transparent opacity={0.74} roughness={0.15} metalness={0.2} depthWrite={false} /></mesh>;
}

export function Bridges() {
  return <>{bridges.map((b) => {
    const len = b.xr - b.xl, ang = Math.atan2(b.yr - b.yl, len), mid: [number, number, number] = [b.xc, (b.yl + b.yr) / 2, b.z];
    return (
      <group key={b.z} position={mid} rotation-z={ang}>
        <mesh castShadow receiveShadow><boxGeometry args={[len + 0.5, 0.35, 5]} /><meshStandardMaterial color="#8b6f4e" roughness={0.9} /></mesh>
        {[-2.4, 2.4].map((z) => <mesh key={z} position={[0, 0.6, z]} castShadow><boxGeometry args={[len, 0.12, 0.14]} /><meshStandardMaterial color="#d9d2c3" /></mesh>)}
        {[-8, -3, 3, 8].flatMap((x) => [-2.4, 2.4].map((z) => <mesh key={`${x}${z}`} position={[x, 0.3, z]} castShadow><boxGeometry args={[0.16, 0.7, 0.16]} /><meshStandardMaterial color="#d9d2c3" /></mesh>))}
        {[-5, 5].map((x) => <mesh key={x} position={[x, -2.6, 0]}><cylinderGeometry args={[0.5, 0.6, 5, 8]} /><meshStandardMaterial color="#6f6a60" /></mesh>)}
      </group>
    );
  })}</>;
}
