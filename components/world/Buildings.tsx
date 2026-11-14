'use client';

import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { dests, type Dest } from '@/data/world';
import { groundY } from '@/systems/world';

type V3 = [number, number, number];

function facade(wall: string, glass: string, lit: number, grid = false) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = wall; g.fillRect(0, 0, 128, 128);
  if (grid) { g.strokeStyle = glass; g.lineWidth = 3; for (let i = 0; i <= 128; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); } }
  else for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = Math.random() < lit ? '#ffd9a0' : glass; g.fillRect(i * 32 + 6, j * 32 + 8, 20, 16); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function Block({ p = [0, 0, 0], s, wall, glass, lit = 0.25, roof, grid }: { p?: V3; s: V3; wall: string; glass: string; lit?: number; roof?: string; grid?: boolean }) {
  const map = useMemo(() => { const t = facade(wall, glass, lit, grid); t.repeat.set(Math.max(1, s[0] / 4), Math.max(1, s[1] / 4)); return t; }, [wall, glass, lit, grid, s[0], s[1]]);
  return (
    <group position={[p[0], p[1] + s[1] / 2, p[2]]}>
      <mesh castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial map={map} roughness={0.7} /></mesh>
      <mesh position={[0, s[1] / 2 + 0.12, 0]} castShadow><boxGeometry args={[s[0] + 0.4, 0.25, s[2] + 0.4]} /><meshStandardMaterial color={roof ?? '#3a3d42'} roughness={0.8} /></mesh>
    </group>
  );
}

const Glow = ({ c, i = 2.5 }: { c: string; i?: number }) => <meshStandardMaterial color={c} emissive={c} emissiveIntensity={i} toneMapped={false} />;

function Spin({ speed = 0.4, children, ...rest }: { speed?: number; children: ReactNode; position?: V3 }) {
  const r = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (r.current) r.current.rotation.y += dt * speed; });
  return <group ref={r} {...rest}>{children}</group>;
}

function Blink({ c, position }: { c: string; position: V3 }) {
  const r = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => { if (r.current) r.current.emissiveIntensity = 1 + 3 * (Math.sin(clock.elapsedTime * 4) > 0 ? 1 : 0); });
  return <mesh position={position}><sphereGeometry args={[0.35, 12, 8]} /><meshStandardMaterial ref={r} color={c} emissive={c} toneMapped={false} /></mesh>;
}

const styles: Record<Dest['style'], (c: string) => ReactNode> = {
  campus: () => (<>
    <Block s={[12, 5, 6]} wall="#cdb797" glass="#40505f" roof="#7a4a3a" />
    <Block p={[-9, 0, 5]} s={[5, 3.5, 8]} wall="#c3ad8d" glass="#40505f" roof="#7a4a3a" />
    <Block p={[9, 0, 5]} s={[5, 3.5, 8]} wall="#c3ad8d" glass="#40505f" roof="#7a4a3a" />
    <mesh position={[0, 8.6, -1]} castShadow><cylinderGeometry args={[1.3, 1.5, 7, 16]} /><meshStandardMaterial color="#d8c7a6" /></mesh>
    <mesh position={[0, 13.4, -1]} castShadow><coneGeometry args={[1.9, 3, 16]} /><meshStandardMaterial color="#7a4a3a" /></mesh>
    <mesh position={[0, 10.5, 0.55]}><circleGeometry args={[0.7, 20]} /><Glow c="#ffe3a8" i={1} /></mesh>
    <mesh position={[0, 0.08, 12]} rotation-x={-Math.PI / 2}><circleGeometry args={[6, 32]} /><meshStandardMaterial color="#5f8f4a" /></mesh>
  </>),
  tower: () => (<>
    <Block s={[16, 3, 11]} wall="#e9e7e1" glass="#2b3a4a" roof="#ccc" />
    <Block p={[-3, 3, 0]} s={[6, 15, 6]} wall="#2d4a7a" glass="#9fc5ff" lit={0.5} />
    <Block p={[4, 3, 1]} s={[5, 9, 5]} wall="#35557f" glass="#9fc5ff" lit={0.4} />
    <mesh position={[-3, 18.4, 0]}><boxGeometry args={[6.3, 0.3, 6.3]} /><Glow c="#6a82ff" /></mesh>
    <Text position={[0, 1.6, 5.7]} fontSize={1} color="#222" anchorX="center">SYNORIQ</Text>
  </>),
  office: () => (<>
    <Block s={[9, 5, 6]} wall="#d9d4c8" glass="#3b5166" />
    <mesh position={[0, 3, 3.6]}><boxGeometry args={[9, 0.2, 1.4]} /><Glow c="#8aa0ff" i={1.2} /></mesh>
  </>),
  data: (c) => (<>
    <mesh position={[0, 1.5, 0]} castShadow receiveShadow><cylinderGeometry args={[8, 9, 3, 48]} /><meshStandardMaterial color="#1d2733" metalness={0.6} roughness={0.35} /></mesh>
    <mesh position={[0, 3.1, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[8, 0.15, 8, 64]} /><Glow c={c} /></mesh>
    {[0, 1, 2].map((i) => (<group key={i} position={[0, 4.1 + i * 3, 0]}>
      <mesh castShadow><cylinderGeometry args={[4.2, 4.2, 2.3, 40]} /><meshStandardMaterial color="#27364a" metalness={0.5} roughness={0.3} /></mesh>
      <mesh position={[0, 1.16, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[4.2, 0.08, 8, 48]} /><Glow c={c} /></mesh>
    </group>))}
    <Spin position={[0, 9, 0]} speed={0.6}><mesh rotation-x={Math.PI / 2.4}><torusGeometry args={[6, 0.1, 8, 64]} /><Glow c={c} /></mesh></Spin>
  </>),
  lab: (c) => (<>
    <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[6.4, 6.6, 0.8, 32]} /><meshStandardMaterial color="#8b929a" /></mesh>
    <mesh position={[0, 0.8, 0]} castShadow><sphereGeometry args={[6, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#e8eef2" roughness={0.25} metalness={0.1} /></mesh>
    <Block p={[-9, 0, 0]} s={[6, 3.5, 5]} wall="#dfe6ea" glass="#33465a" />
    <Block p={[9, 0, 0]} s={[6, 3.5, 5]} wall="#dfe6ea" glass="#33465a" />
    <mesh position={[0, 11, 0]}><cylinderGeometry args={[0.12, 0.2, 10, 8]} /><meshStandardMaterial color="#c9d0d6" /></mesh>
    <Blink c={c} position={[0, 16.2, 0]} />
    {[-3.5, 0, 3.5].map((x) => <mesh key={x} position={[x, 0.9, 8]} rotation-x={-0.5} castShadow><boxGeometry args={[3, 0.1, 2.2]} /><meshStandardMaterial color="#1c2f55" metalness={0.8} roughness={0.2} /></mesh>)}
  </>),
  studio: () => (<>
    <Block s={[10, 3.5, 7]} wall="#f1efe9" glass="#2b3a4a" lit={0.1} roof="#f1efe9" />
    <Block p={[3, 3.5, 0]} s={[15, 3, 7]} wall="#f6f4ee" glass="#223244" lit={0.1} roof="#f6f4ee" />
    {[8, 10.5].map((x) => <mesh key={x} position={[x, 1.75, 2.5]} castShadow><cylinderGeometry args={[0.22, 0.22, 3.5, 10]} /><meshStandardMaterial color="#f6f4ee" /></mesh>)}
    <mesh position={[3, 6.75, 0]}><boxGeometry args={[10, 0.35, 5]} /><meshStandardMaterial color="#5f8f4a" /></mesh>
    <mesh position={[-8, 0.12, 6]} rotation-x={-Math.PI / 2}><planeGeometry args={[7, 4]} /><meshStandardMaterial color="#4fc3d9" roughness={0.1} metalness={0.3} /></mesh>
    <mesh position={[-8, 0.07, 6]} rotation-x={-Math.PI / 2}><planeGeometry args={[8, 5]} /><meshStandardMaterial color="#9b7a56" /></mesh>
  </>),
  clipbridge: (c) => (<>
    <Block p={[-4, 0, 0]} s={[5, 4, 5]} wall="#2b2f38" glass="#ffb08a" lit={0.5} />
    <Block p={[4, 0, 0]} s={[5, 4, 5]} wall="#2b2f38" glass="#ffb08a" lit={0.5} />
    <mesh position={[0, 2.5, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.5, 0.5, 4, 14]} /><Glow c={c} /></mesh>
  </>),
  tangerine: (c) => (<>
    <Block s={[7, 4, 6]} wall="#f08a3a" glass="#5a3416" lit={0.4} roof="#2f2f33" />
    <mesh position={[0, 4.6, 0]} castShadow><sphereGeometry args={[2.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={c} roughness={0.5} /></mesh>
  </>),
  contextword: (c) => (<>
    <Block s={[4, 9, 4]} wall="#3b3358" glass="#cdbfff" lit={0.5} />
    <mesh position={[0, 10.8, 0]} castShadow><coneGeometry args={[2.8, 3, 4]} /><Glow c={c} i={0.6} /></mesh>
    <mesh position={[0, 0.3, 3.8]} rotation-x={-0.5}><boxGeometry args={[4, 0.15, 2.6]} /><meshStandardMaterial color="#efe9ff" /></mesh>
  </>),
  excel: (c) => (<>
    <Block s={[8, 4.5, 6]} wall="#e7f3ea" glass="#2f8f55" grid roof="#1f6b3d" />
    <mesh position={[0, 5.3, 0]}><boxGeometry args={[8.4, 0.2, 6.4]} /><Glow c={c} i={0.8} /></mesh>
  </>),
  lighthouse: (c) => (<>
    {[0, 1, 2, 3].map((i) => <mesh key={i} position={[0, 1.8 + i * 3.4, 0]} castShadow><cylinderGeometry args={[1.7 - i * 0.2, 2.2 - i * 0.2, 3.4, 20]} /><meshStandardMaterial color={i % 2 ? '#c8483c' : '#f3efe6'} /></mesh>)}
    <mesh position={[0, 15.7, 0]}><cylinderGeometry args={[2, 2, 0.3, 20]} /><meshStandardMaterial color="#2b2b2b" /></mesh>
    <mesh position={[0, 17, 0]}><sphereGeometry args={[1.1, 16, 12]} /><Glow c={c} i={4} /></mesh>
    <Spin position={[0, 17, 0]} speed={1.2}><mesh position={[5, 0, 0]} rotation-z={-Math.PI / 2}><coneGeometry args={[1.4, 10, 16, 1, true]} /><meshBasicMaterial color={c} transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} /></mesh></Spin>
    <mesh position={[0, 18.9, 0]}><coneGeometry args={[1.6, 1.6, 20]} /><meshStandardMaterial color="#2b2b2b" /></mesh>
  </>),
};

export function Buildings({ focusId, onPick }: { focusId: string | null; onPick: (id: string) => void }) {
  return <>{dests.map((d) => {
    const y = groundY(d.pos[0], d.pos[1]), on = focusId === d.id;
    return (
      <group key={d.id} position={[d.pos[0], y, d.pos[1]]}>
        <group onClick={(e) => { e.stopPropagation(); onPick(d.id); }} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>{styles[d.style](d.color)}</group>
        <mesh position={[0, 20, 0]}><cylinderGeometry args={[on ? 0.35 : 0.14, on ? 0.35 : 0.14, 40, 8, 1, true]} /><meshBasicMaterial color={d.color} transparent opacity={on ? 0.6 : 0.2} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
        <Billboard position={[0, d.h + 3, 0]}><Text fontSize={1.5} color="#fff" outlineWidth={0.08} outlineColor="#0b0c10" anchorX="center">{d.title.toUpperCase()}</Text></Billboard>
        <mesh position={[0, 0.1, 0]} rotation-x={-Math.PI / 2}><ringGeometry args={[d.r + 1.2, d.r + 1.5, 48]} /><meshBasicMaterial color={d.color} transparent opacity={0.55} toneMapped={false} /></mesh>
      </group>
    );
  })}</>;
}
