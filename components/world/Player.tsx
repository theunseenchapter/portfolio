'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { dests } from '@/data/world';
import { game } from '@/systems/game';
import { collide, groundY, height, walkable } from '@/systems/world';

export type Near = { near: string | null; region: string };

export function Player({ mode, onNear, shadows }: { mode: '3d' | '2d'; onNear: (n: Near) => void; shadows: boolean }) {
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const { scene, animations } = useGLTF('/models/Xbot.glb');
  const { actions } = useAnimations(animations, group);
  const { camera, gl } = useThree();
  const st = useRef({ vx: 0, vz: 0, vy: 0, grounded: true, cur: 'idle', near: '', region: '' });

  useEffect(() => {
    scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    actions.idle?.reset().play();
  }, [scene, actions]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { game.keys[e.key.toLowerCase()] = true; if (e.key === ' ') e.preventDefault(); };
    const up = (e: KeyboardEvent) => { game.keys[e.key.toLowerCase()] = false; };
    let drag = false, lx = 0, ly = 0;
    const pd = (e: PointerEvent) => { drag = true; lx = e.clientX; ly = e.clientY; };
    const pu = () => { drag = false; };
    const pm = (e: PointerEvent) => {
      if (!drag || game.locked) return;
      game.yaw -= (e.clientX - lx) * 0.006; game.pitch = Math.min(1.25, Math.max(0.05, game.pitch + (e.clientY - ly) * 0.005));
      lx = e.clientX; ly = e.clientY;
    };
    const wh = (e: WheelEvent) => { game.dist = Math.min(16, Math.max(4, game.dist + e.deltaY * 0.01)); };
    const el = gl.domElement;
    addEventListener('keydown', down); addEventListener('keyup', up); addEventListener('pointerup', pu);
    el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', pm); el.addEventListener('wheel', wh, { passive: true });
    return () => { removeEventListener('keydown', down); removeEventListener('keyup', up); removeEventListener('pointerup', pu); el.removeEventListener('pointerdown', pd); el.removeEventListener('pointermove', pm); el.removeEventListener('wheel', wh); };
  }, [gl]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05), s = st.current, k = game.keys, p = game.pos;
    let ix = Number(!!k.d) - Number(!!k.a) + game.joy.x, iy = Number(!!k.w) - Number(!!k.s) - game.joy.y;
    game.yaw += (Number(!!k.arrowleft) - Number(!!k.arrowright)) * 1.8 * dt;
    if (game.locked) ix = iy = 0;
    const len = Math.hypot(ix, iy);
    if (len > 1) { ix /= len; iy /= len; }
    const speed = k.shift || game.run ? 8.5 : 4.2, sy = Math.sin(game.yaw), cy = Math.cos(game.yaw), a = 1 - Math.exp(-10 * dt);
    s.vx += ((-sy * iy + cy * ix) * speed - s.vx) * a;
    s.vz += ((-cy * iy - sy * ix) * speed - s.vz) * a;

    let nx = p.x + s.vx * dt, nz = p.z + s.vz * dt;
    if (!walkable(nx, nz)) { if (walkable(nx, p.z)) nz = p.z; else if (walkable(p.x, nz)) nx = p.x; else { nx = p.x; nz = p.z; s.vx = s.vz = 0; } }
    [nx, nz] = collide(nx, nz);
    if (!walkable(nx, nz)) { nx = p.x; nz = p.z; }
    p.x = nx; p.z = nz;

    const ground = groundY(nx, nz);
    if ((k[' '] || game.jump) && s.grounded && !game.locked) { s.vy = 8.5; s.grounded = false; }
    if (s.grounded && p.y - ground > 0.6) s.grounded = false;
    if (s.grounded) p.y += (ground - p.y) * Math.min(1, dt * 18);
    else { s.vy -= 24 * dt; p.y += s.vy * dt; if (p.y <= ground && s.vy < 0) { p.y = ground; s.vy = 0; s.grounded = true; } }
    if (game.snap) p.y = ground;

    const g = group.current;
    if (g) {
      g.position.copy(p);
      const sp = Math.hypot(s.vx, s.vz);
      if (sp > 0.4) { let d = Math.atan2(s.vx, s.vz) - g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); g.rotation.y += d * Math.min(1, dt * 12); }
      g.scale.setScalar(mode === '2d' ? 3 : 1);
      const want = !s.grounded ? s.cur : sp > 6 ? 'run' : sp > 0.6 ? 'walk' : 'idle';
      if (want !== s.cur) { actions[want]?.reset().fadeIn(0.25).play(); actions[s.cur]?.fadeOut(0.25); s.cur = want; }
    }

    if (light.current) { light.current.position.set(p.x + 40, p.y + 60, p.z + 25); target.position.copy(p); target.updateMatrixWorld(); }

    if (mode === '3d') {
      const cp = Math.cos(game.pitch), dx = Math.sin(game.yaw) * cp, dy = Math.sin(game.pitch), dz = Math.cos(game.yaw) * cp;
      const tx = p.x, ty = p.y + 1.5, tz = p.z;
      let d = game.dist;
      for (let i = 1; i <= 10; i++) { const t = (game.dist * i) / 10; if (ty + dy * t < height(tx + dx * t, tz + dz * t) + 0.7) { d = (game.dist * (i - 1)) / 10; break; } }
      d = Math.max(d, 1.5);
      const want3 = new THREE.Vector3(tx + dx * d, ty + dy * d, tz + dz * d);
      if (game.snap) camera.position.copy(want3); else camera.position.lerp(want3, 1 - Math.exp(-14 * dt));
      camera.lookAt(tx, ty + 0.2, tz);
    }
    game.snap = false;

    let best = '', bd = 1e9;
    for (const d of dests) { const m = Math.hypot(d.pos[0] - p.x, d.pos[1] - p.z); if (m < bd) { bd = m; best = d.id; } }
    const bdst = dests.find((d) => d.id === best)!;
    const near = bd < bdst.r + 5 ? best : '', region = bd < 40 ? bdst.region : 'Open wilderness';
    if (near !== s.near || region !== s.region) { s.near = near; s.region = region; onNear({ near: near || null, region }); }
  });

  return (
    <>
      <directionalLight ref={light} target={target} intensity={2.6} color="#fff1d6" castShadow={shadows} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005} shadow-camera-near={1} shadow-camera-far={200} shadow-camera-left={-45} shadow-camera-right={45} shadow-camera-top={45} shadow-camera-bottom={-45} />
      <primitive object={target} />
      <group ref={group}>
        <primitive object={scene} />
        {mode === '2d' && <mesh position={[0, 8, 0]} rotation-x={-Math.PI / 2}><ringGeometry args={[1.1, 1.5, 32]} /><meshBasicMaterial color="#ff6a3d" toneMapped={false} /></mesh>}
      </group>
    </>
  );
}

useGLTF.preload('/models/Xbot.glb');
