import { dests, spawn } from '@/data/world';

export const SIZE = 240;
const R = 105;
const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gauss = (x: number, z: number, cx: number, cz: number, s: number) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (2 * s * s));
export const smooth = ss;

export const riverX = (z: number) => -28 + 10 * Math.sin(z * 0.045 + 1);
export const riverDist = (x: number, z: number) => Math.abs(x - riverX(z));

function base(x: number, z: number) {
  const land = ss(1, 0.55, Math.hypot(x, z * 1.05) / R);
  const n = 2.2 * Math.sin(x * 0.07 + 1) * Math.cos(z * 0.06) + 1.5 * Math.sin((x + z) * 0.11) + 0.8 * Math.sin(x * 0.2) * Math.sin(z * 0.17);
  return land * (6 + n) - 2.5 + 34 * gauss(x, z, 66, 30, 15) - 6 * gauss(x, z, 38, -26, 16) + 7 * gauss(x, z, 10, 50, 14);
}

const pads = dests.map((d) => ({ x: d.pos[0], z: d.pos[1], y: Math.max(base(d.pos[0], d.pos[1]), 1.3) }));

export function height(x: number, z: number) {
  let h = base(x, z);
  for (const p of pads) h += (p.y - h) * ss(20, 11, Math.hypot(x - p.x, z - p.z));
  return h + (-1.6 - h) * ss(10, 3.5, riverDist(x, z));
}

export const slope = (x: number, z: number) => Math.hypot(height(x + 1, z) - height(x - 1, z), height(x, z + 1) - height(x, z - 1)) / 2;

export const bridges = [-45, 42].map((z) => {
  const xc = riverX(z), xl = xc - 11, xr = xc + 11;
  return { z, xc, xl, xr, yl: height(xl, z) + 0.35, yr: height(xr, z) + 0.35 };
});
const bridgeAt = (x: number, z: number) => bridges.find((b) => Math.abs(z - b.z) < 3 && Math.abs(x - b.xc) < 11);

export function groundY(x: number, z: number) {
  const b = bridgeAt(x, z);
  return b ? b.yl + (b.yr - b.yl) * Math.min(1, Math.max(0, (x - b.xl) / (b.xr - b.xl))) : height(x, z);
}
export const walkable = (x: number, z: number) => !!bridgeAt(x, z) || height(x, z) > -0.15;

const wp = (id: string): [number, number] => {
  const d = dests.find((v) => v.id === id);
  if (d) return d.pos;
  if (id === 'hub') return spawn;
  const b = bridges[id[1] === 'A' ? 0 : 1];
  return [id[2] === '0' ? b.xl : b.xr, b.z];
};
const roads = [
  ['origin', 'bA0', 'bA1', 'synoriq', 'ifuture'], ['synoriq', 'hub', 'datascope', 'contact'], ['datascope', 'medisource'],
  ['hub', 'home-alchemy', 'bB1', 'bB0', 'clipbridge', 'excel'], ['clipbridge', 'tangerine'], ['clipbridge', 'contextword'],
];
export const roadPaths = roads.map((r) => r.map(wp));
const segs = roadPaths.flatMap((p) => p.slice(1).map((q, i) => [p[i], q] as const));

export function roadDist(x: number, z: number) {
  let m = 1e9;
  for (const [a, b] of segs) {
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const t = Math.min(1, Math.max(0, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
    m = Math.min(m, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t));
  }
  return m;
}

export const obstacles: { x: number; z: number; r: number }[] = [];
const resetObstacles = () => { obstacles.length = 0; dests.forEach((d) => obstacles.push({ x: d.pos[0], z: d.pos[1], r: d.r })); };
resetObstacles();

export function collide(x: number, z: number, rad = 0.5): [number, number] {
  for (const o of obstacles) {
    const dx = x - o.x, dz = z - o.z, d = Math.hypot(dx, dz), m = o.r + rad;
    if (d < m && d > 1e-4) { x = o.x + (dx / d) * m; z = o.z + (dz / d) * m; }
  }
  return [x, z];
}

export function findSpot(tx: number, tz: number): [number, number] {
  const a0 = Math.atan2(spawn[1] - tz, spawn[0] - tx);
  for (const dd of [15, 12, 9]) for (const k of [0, 0.5, -0.5, 1, -1, 1.6, -1.6, 2.4, -2.4, 3.14]) {
    const x = tx + Math.cos(a0 + k) * dd, z = tz + Math.sin(a0 + k) * dd;
    if (walkable(x, z) && obstacles.every((o) => Math.hypot(x - o.x, z - o.z) > o.r + 1)) return [x, z];
  }
  return spawn;
}

const rng = (s: number) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
type P = { x: number; y: number; z: number; s: number; r: number; c: string };

export function scatter(q: number) {
  resetObstacles();
  const rnd = rng(11);
  const far = (x: number, z: number, pad: number) => dests.every((d) => Math.hypot(x - d.pos[0], z - d.pos[1]) > pad) && Math.hypot(x - spawn[0], z - spawn[1]) > 6;
  const trees: (P & { pine: boolean })[] = [], rocks: P[] = [], grass: P[] = [], flowers: P[] = [];
  const hsl = (h: number, s: number, l: number) => `hsl(${h},${s}%,${l}%)`;
  for (let i = 0; i < 4200 * q && trees.length < 800 * q; i++) {
    const x = (rnd() - 0.5) * 200, z = (rnd() - 0.5) * 200, y = height(x, z);
    if (y < 1.3 || y > 20 || slope(x, z) > 0.75 || !far(x, z, 15) || roadDist(x, z) < 4 || riverDist(x, z) < 5) continue;
    if (rnd() > 0.3 + 0.7 * Math.max(0, Math.sin(x * 0.045 + 2) * Math.cos(z * 0.05) + 0.35)) continue;
    const pine = y > 7 || rnd() > 0.55, s = 0.8 + rnd() * 0.9;
    trees.push({ x, y, z, s, r: rnd() * 6, pine, c: pine ? hsl(145 + rnd() * 20, 35, 20 + rnd() * 10) : hsl(85 + rnd() * 30, 38, 28 + rnd() * 10) });
    obstacles.push({ x, z, r: 0.55 * s });
  }
  for (let i = 0; i < 700 && rocks.length < 150 * q; i++) {
    const x = (rnd() - 0.5) * 200, z = (rnd() - 0.5) * 200, y = height(x, z), sl = slope(x, z);
    if (y < 0.4 || !far(x, z, 11) || roadDist(x, z) < 3 || riverDist(x, z) < 2 || (sl < 0.4 && rnd() > 0.12)) continue;
    const s = 0.5 + rnd() * 1.8;
    rocks.push({ x, y, z, s, r: rnd() * 6, c: hsl(35, 6, 38 + rnd() * 18) });
    obstacles.push({ x, z, r: s * 0.85 });
  }
  for (let i = 0; i < 16000 * q && grass.length < 6500 * q; i++) {
    const x = (rnd() - 0.5) * 190, z = (rnd() - 0.5) * 190, y = height(x, z);
    if (y < 1.2 || y > 16 || slope(x, z) > 0.6 || roadDist(x, z) < 2 || riverDist(x, z) < 3) continue;
    grass.push({ x, y, z, s: 0.6 + rnd() * 0.9, r: rnd() * 6, c: hsl(80 + rnd() * 35, 45, 30 + rnd() * 16) });
    if (rnd() < 0.07) flowers.push({ x: x + 0.2, y, z, s: 1, r: 0, c: ['#f4d35e', '#ee6c4d', '#f7f7f7', '#c77dff'][Math.floor(rnd() * 4)] });
  }
  return { trees, rocks, grass, flowers };
}
