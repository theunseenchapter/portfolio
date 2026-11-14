import * as THREE from 'three';
import { spawn } from '@/data/world';
import { findSpot, groundY } from './world';

export const game = {
  pos: new THREE.Vector3(spawn[0], groundY(spawn[0], spawn[1]), spawn[1]),
  yaw: 0, pitch: 0.38, dist: 9, snap: true, locked: false, run: false, jump: false,
  keys: {} as Record<string, boolean>, joy: { x: 0, y: 0 },
};

export function teleport(x: number, z: number, lx: number, lz: number) {
  game.pos.set(x, groundY(x, z), z);
  game.yaw = Math.atan2(-(lx - x), -(lz - z));
  game.snap = true;
}

export function travelTo(tx: number, tz: number) {
  const [x, z] = findSpot(tx, tz);
  teleport(x, z, tx, tz);
}
