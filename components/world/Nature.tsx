'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import type { scatter } from '@/systems/world';

type Items = ReturnType<typeof scatter>;
type It = { p: [number, number, number]; s: [number, number, number]; r: number; c: string };

function Inst({ items, cast = true, children }: { items: It[]; cast?: boolean; children: ReactNode }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current!, o = new THREE.Object3D(), c = new THREE.Color();
    items.forEach((it, i) => {
      o.position.set(...it.p); o.rotation.set(0, it.r, 0); o.scale.set(...it.s); o.updateMatrix();
      m.setMatrixAt(i, o.matrix); m.setColorAt(i, c.set(it.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);
  return <instancedMesh ref={ref} args={[undefined, undefined, items.length]} castShadow={cast} receiveShadow>{children}</instancedMesh>;
}

const map = (a: { x: number; y: number; z: number; s: number; r: number; c: string }[], dy: number, sx = 1, sy = 1, color?: string): It[] =>
  a.map((v) => ({ p: [v.x, v.y + v.s * dy, v.z], s: [v.s * sx, v.s * sy, v.s * sx], r: v.r, c: color ?? v.c }));

export function Nature({ data }: { data: Items }) {
  const { trees, rocks, grass, flowers } = data;
  const pines = trees.filter((t) => t.pine), broad = trees.filter((t) => !t.pine);
  return (
    <>
      <Inst items={map(trees, 1, 1, 1, '#5b4632')}><cylinderGeometry args={[0.15, 0.26, 2, 6]} /><meshStandardMaterial roughness={1} /></Inst>
      <Inst items={map(pines, 2.4)}><coneGeometry args={[1.5, 3.2, 7]} /><meshStandardMaterial roughness={1} /></Inst>
      <Inst items={map(pines, 4.1, 0.7, 0.9)}><coneGeometry args={[1.5, 3.2, 7]} /><meshStandardMaterial roughness={1} /></Inst>
      <Inst items={map(broad, 3.1)}><icosahedronGeometry args={[1.6, 1]} /><meshStandardMaterial roughness={1} flatShading /></Inst>
      <Inst items={map(rocks, 0.3, 1, 0.7)}><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial roughness={1} flatShading /></Inst>
      <Inst items={map(grass, 0.35)} cast={false}><coneGeometry args={[0.07, 0.7, 3]} /><meshStandardMaterial roughness={1} /></Inst>
      <Inst items={map(flowers, 0.35, 0.14, 0.14)} cast={false}><sphereGeometry args={[1, 6, 5]} /><meshStandardMaterial roughness={0.6} /></Inst>
    </>
  );
}
