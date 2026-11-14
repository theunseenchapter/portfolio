'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Sky, Text } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { WorldDestination } from '@/data/world';

type Props = {
  destinations: WorldDestination[];
  mode: 'world' | 'overview';
  selectedId: string | null;
  onModeChange: (mode: 'world' | 'overview') => void;
  onSelectDestination: (id: string | null) => void;
};

const route = ['origin', 'synoriq', 'datascope', 'home-alchemy', 'medisource', 'clipbridge'];

function Terrain() {
  const geometry = useMemo(() => {
    const shape = new THREE.PlaneGeometry(90, 72, 48, 40);
    shape.rotateX(-Math.PI / 2);
    const position = shape.attributes.position;
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const z = position.getZ(index);
      const hills = Math.sin(x * 0.13) * 1.8 + Math.cos(z * 0.16) * 1.4 + Math.sin((x + z) * 0.24) * .55;
      const mountain = Math.max(0, 1 - Math.hypot(x - 15, z - 10) / 22) * 4.5;
      const shore = Math.max(0, Math.abs(x) - 39) * .4;
      position.setY(index, hills + mountain - shore);
    }
    position.needsUpdate = true;
    shape.computeVertexNormals();
    return shape;
  }, []);

  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial color="#7f927a" roughness={1} /></mesh>;
}

function Environment() {
  const trees = useMemo(() => Array.from({ length: 46 }, (_, index) => {
    const x = ((index * 19) % 76) - 38;
    const z = ((index * 31) % 58) - 29;
    return [x, 0, z] as [number, number, number];
  }), []);
  return (
    <group>
      <Terrain />
      <RigidBody type="fixed" colliders="cuboid" position={[0, -2.2, 0]}><mesh visible={false}><boxGeometry args={[90, 2, 72]} /><meshBasicMaterial /></mesh></RigidBody>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .04, 1]} receiveShadow><planeGeometry args={[4.5, 65]} /><meshStandardMaterial color="#658896" roughness={.8} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .08, 1]}><planeGeometry args={[1.8, 65]} /><meshStandardMaterial color="#89aeb2" transparent opacity={.55} /></mesh>
      {trees.map(([x, y, z], index) => <Tree key={index} position={[x, y, z]} scale={index % 4 === 0 ? 1.3 : 1} />)}
      <group position={[15, 3, 10]}><mesh castShadow><coneGeometry args={[10, 14, 7]} /><meshStandardMaterial color="#667a69" roughness={1} /></mesh><mesh position={[0, -5, 0]}><coneGeometry args={[14, 5, 7]} /><meshStandardMaterial color="#72866d" /></mesh></group>
      <Road position={[0, .14, -15]} rotation={[0, 0, 0]} scale={[1, 1, .6]} />
      <Road position={[-22, .16, 8]} rotation={[0, Math.PI / 2, 0]} scale={[1, 1, .45]} />
    </group>
  );
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return <group position={position} scale={scale}><mesh castShadow position={[0, 1, 0]}><cylinderGeometry args={[.18, .28, 2, 7]} /><meshStandardMaterial color="#5e4d3b" /></mesh><mesh castShadow position={[0, 2.4, 0]}><icosahedronGeometry args={[1.3, 1]} /><meshStandardMaterial color="#42614c" roughness={1} /></mesh></group>;
}

function Road({ position, rotation, scale }: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }) {
  return <mesh rotation={[-Math.PI / 2, rotation[1], 0]} position={position} scale={scale}><planeGeometry args={[3, 75]} /><meshStandardMaterial color="#565852" roughness={1} /></mesh>;
}

function Building({ destination, onSelect }: { destination: WorldDestination; onSelect: () => void }) {
  const isSmall = destination.id === 'origin' || destination.id === 'ifuture';
  return (
    <group position={destination.position} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <mesh castShadow position={[0, isSmall ? 2 : 3, 0]}><boxGeometry args={[isSmall ? 5 : 6, isSmall ? 4 : 6, isSmall ? 5 : 6]} /><meshStandardMaterial color={destination.kind === 'career' ? '#7b6e61' : destination.kind === 'education' ? '#8b927d' : '#6c7d86'} roughness={.76} /></mesh>
      <mesh castShadow position={[0, isSmall ? 4.3 : 6.3, 0]}><coneGeometry args={[isSmall ? 3.6 : 4.3, 2, 4]} /><meshStandardMaterial color="#b4a58c" roughness={.85} /></mesh>
      <Text position={[0, 7.7, 0]} fontSize={.65} color="#f4efe5" anchorX="center" outlineWidth={.02} outlineColor="#27322c">{destination.title.toUpperCase()}</Text>
      <pointLight position={[0, 3, 2]} intensity={1.5} distance={8} color="#e2bb8a" />
    </group>
  );
}

function Avatar({ position, onPositionChange, onInteract }: { position: [number, number, number]; onPositionChange: (position: [number, number, number]) => void; onInteract: () => void }) {
  const body = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector3());
  const keys = useRef<Record<string, boolean>>({});
  const last = useRef(new THREE.Vector3(...position));
  useEffect(() => {
    const down = (event: KeyboardEvent) => { keys.current[event.key.toLowerCase()] = true; if (event.key.toLowerCase() === 'e') onInteract(); };
    const up = (event: KeyboardEvent) => { keys.current[event.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [onInteract]);
  useFrame((_, delta) => {
    const direction = new THREE.Vector3(Number(keys.current.d) - Number(keys.current.a), 0, Number(keys.current.s) - Number(keys.current.w));
    if (direction.lengthSq()) direction.normalize();
    const running = keys.current.shift;
    velocity.current.lerp(direction.multiplyScalar(running ? 9 : 5), Math.min(1, delta * 8));
    last.current.x = THREE.MathUtils.clamp(last.current.x + velocity.current.x * delta, -41, 41);
    last.current.z = THREE.MathUtils.clamp(last.current.z + velocity.current.z * delta, -33, 33);
    last.current.y = .8;
    if (body.current) { body.current.position.copy(last.current); if (velocity.current.lengthSq() > .1) body.current.rotation.y = Math.atan2(velocity.current.x, velocity.current.z); }
    onPositionChange([last.current.x, last.current.y, last.current.z]);
  });
  return <group ref={body}><mesh castShadow position={[0, 1.35, 0]}><capsuleGeometry args={[.38, 1.05, 8, 14]} /><meshStandardMaterial color="#c27f5a" /></mesh><mesh castShadow position={[0, 2.2, 0]}><sphereGeometry args={[.42, 16, 12]} /><meshStandardMaterial color="#bc805e" /></mesh><mesh castShadow position={[0, 1.55, 0]}><boxGeometry args={[.85, .92, .48]} /><meshStandardMaterial color="#344854" /></mesh><pointLight position={[0, 2, 0]} intensity={.3} /></group>;
}

function CameraFollow({ target }: { target: [number, number, number] }) {
  const camera = useRef<THREE.PerspectiveCamera>(null);
  useFrame(() => { if (!camera.current) return; camera.current.position.lerp(new THREE.Vector3(target[0] + 8, target[1] + 9, target[2] + 11), .08); camera.current.lookAt(target[0], target[1] + 1.3, target[2]); });
  return <PerspectiveCamera ref={camera} makeDefault position={[8, 9, 11]} fov={48} />;
}

function Scene({ destinations, onSelect, onNearbyChange }: { destinations: WorldDestination[]; onSelect: (id: string) => void; onNearbyChange: (destination: WorldDestination | null) => void }) {
  const [position, setPosition] = useState<[number, number, number]>([0, .8, 0]);
  const onPositionChange = useCallback((next: [number, number, number]) => { setPosition(next); const nearby = destinations.find((destination) => Math.hypot(destination.position[0] - next[0], destination.position[2] - next[2]) < 4.8) ?? null; onNearbyChange(nearby); }, [destinations, onNearbyChange]);
  const onInteract = useCallback(() => { const nearby = destinations.find((destination) => Math.hypot(destination.position[0] - position[0], destination.position[2] - position[2]) < 4.8); if (nearby) onSelect(nearby.id); }, [destinations, onSelect, position]);
  return <Canvas
    shadows={false}
    dpr={[1, 1.5]}
    gl={{ antialias: true, powerPreference: 'high-performance' }}
    camera={{ position: [8, 9, 11], fov: 48, near: 0.1, far: 300 }}
    fallback={<div className="verse-canvas-fallback">This world needs WebGL enabled in the browser.</div>}
  >
    <Sky distance={450000} sunPosition={[40, 35, -20]} turbidity={8} rayleigh={1.5} />
    <ambientLight intensity={1.25} />
    <directionalLight position={[-15, 24, 12]} intensity={2.2} />
    <Physics gravity={[0, -9.8, 0]}>
      <Environment />
      {destinations.map((destination) => <Building key={destination.id} destination={destination} onSelect={() => onSelect(destination.id)} />)}
      <CuboidCollider args={[45, 5, 1]} position={[0, 0, -36]} />
      <CuboidCollider args={[45, 5, 1]} position={[0, 0, 36]} />
      <CuboidCollider args={[1, 5, 36]} position={[-44, 0, 0]} />
      <CuboidCollider args={[1, 5, 36]} position={[44, 0, 0]} />
      <Avatar position={position} onPositionChange={onPositionChange} onInteract={onInteract} />
      <CameraFollow target={position} />
    </Physics>
  </Canvas>;
}

function MobileControls() {
  const press = (key: string, active: boolean) => {
    window.dispatchEvent(new KeyboardEvent(active ? 'keydown' : 'keyup', { key }));
  };
  return <div className="mobile-controls">{['w', 'a', 's', 'd'].map((key) => <button key={key} onPointerDown={() => press(key, true)} onPointerUp={() => press(key, false)} onPointerLeave={() => press(key, false)}>{key.toUpperCase()}</button>)}<button className="mobile-run" onPointerDown={() => press('shift', true)} onPointerUp={() => press('shift', false)} onPointerLeave={() => press('shift', false)}>Run</button><button className="mobile-interact" onClick={() => press('e', true)}>E</button></div>;
}

function Overview({ destinations, selectedId, onSelect }: { destinations: WorldDestination[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return <div className="overview-map"><div className="overview-river" /><div className="overview-mountain" /><span className="overview-title">VIVEKVERSE / WORLD OVERVIEW</span>{destinations.map((destination) => <button key={destination.id} className={selectedId === destination.id ? 'overview-marker selected' : 'overview-marker'} style={{ left: `${50 + destination.position[0] * 1.03}%`, top: `${50 + destination.position[2] * 1.03}%` }} onClick={() => onSelect(destination.id)}><i className={destination.kind} /><span>{destination.title}</span></button>)}</div>;
}

export default function VivekVerse({ destinations, mode, selectedId, onModeChange, onSelectDestination }: Props) {
  const [nearby, setNearby] = useState<WorldDestination | null>(null);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const selected = destinations.find((destination) => destination.id === selectedId) ?? null;
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'm') onModeChange(mode === 'world' ? 'overview' : 'world');
      if (event.key === 'Escape') setPaused((value) => !value);
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [mode, onModeChange]);
  const goTo = (id: string) => { onSelectDestination(id); setDirectoryOpen(false); setTourOpen(false); };
  const nextTour = () => { const id = route[tourIndex]; if (id) goTo(id); setTourIndex((value) => (value + 1) % route.length); };
  return <><div className="verse-canvas">{mode === 'world' ? <Scene destinations={destinations} onSelect={goTo} onNearbyChange={setNearby} /> : <Overview destinations={destinations} selectedId={selectedId} onSelect={goTo} />}</div><header className="verse-header"><a href="/" className="verse-brand"><strong>Vivekverse</strong><span>an engineering world</span></a><div className="verse-actions"><button onClick={() => onModeChange(mode === 'world' ? 'overview' : 'world')}>{mode === 'world' ? 'World map' : 'Enter world'}</button><button onClick={() => setDirectoryOpen((value) => !value)}>Directory</button><a href="/resume">Resume</a><a href="mailto:vivek.yadav03@gmail.com">Contact</a><button onClick={() => { setTourOpen(true); setDirectoryOpen(false); }}>Explore Vivek</button></div></header><div className="verse-location"><span className="eyebrow">{mode === 'world' ? 'Third-person exploration' : 'Orthographic overview'}</span><b>{nearby?.region ?? 'The connected island · walk with W A S D'}</b></div>{mode === 'world' && <div className="verse-controls"><span><kbd>W A S D</kbd> move</span><span><kbd>SHIFT</kbd> run</span><span><kbd>E</kbd> interact</span>  <span><kbd>M</kbd> map</span><span><kbd>ESC</kbd> pause</span></div>}{mode === 'world' && <MobileControls />}{paused && <div className="pause-screen"><div><span className="eyebrow">Exploration paused</span><h2>Take your time.</h2><button onClick={() => setPaused(false)}>Continue exploring</button></div></div>}{nearby && mode === 'world' && !selected && <button className="interact-prompt" onClick={() => goTo(nearby.id)}>PRESS <kbd>E</kbd> TO EXPLORE <b>{nearby.title.toUpperCase()}</b></button>}{directoryOpen && <aside className="verse-panel directory"><div className="panel-heading"><h2>Destinations</h2><button onClick={() => setDirectoryOpen(false)} aria-label="Close directory">×</button></div>{destinations.map((destination) => <button className="directory-item" key={destination.id} onClick={() => goTo(destination.id)}><span>{destination.title}</span><small>{destination.region}</small></button>)}</aside>}{tourOpen && <aside className="verse-panel tour"><button className="panel-close" onClick={() => setTourOpen(false)}>×</button><span className="eyebrow">Recruiter route</span><h2>Explore Vivek</h2><p>A guided sequence through the work. You can exit at any time.</p>{route.map((id, index) => <button className={index === tourIndex ? 'tour-stop active' : 'tour-stop'} key={id} onClick={nextTour}><i>{String(index + 1).padStart(2, '0')}</i>{destinations.find((item) => item.id === id)?.title}</button>)}<button className="tour-next" onClick={nextTour}>Continue tour →</button></aside>}{selected && <aside className="verse-panel destination-detail"><div className="panel-heading"><span className="eyebrow">{selected.eyebrow}</span><button onClick={() => onSelectDestination(null)} aria-label="Close destination">×</button></div><h1>{selected.title}</h1><p className="detail-region">{selected.region}</p><p>{selected.description}</p><p>{selected.details}</p>{selected.achievement && <div className="achievement">{selected.achievement}</div>}<div className="stack">{selected.stack.map((item) => <span key={item}>{item}</span>)}</div>{selected.github && <a className="detail-link" href={selected.github}>View GitHub ↗</a>}<button className="back-to-world" onClick={() => onSelectDestination(null)}>Close and continue exploring</button></aside>}<div className="verse-footer">fictional world · real work · <span>VIVEKVERSE</span></div></>;
}
