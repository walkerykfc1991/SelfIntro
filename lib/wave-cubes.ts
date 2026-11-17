/**
 * Procedural cube array for the page background.
 * A single unit box is instanced across the view. Heights come from a
 * traveling wave plus a damped pointer ripple. Nothing here is imported art.
 */

import type { Vec3 } from "@/lib/mat4";
import type { Mesh } from "@/lib/plate-mesh";

const FOV = (28 * Math.PI) / 180;
const WAVE_AMP = 1.28;

export const CUBE_MIN_H = 0.04;
export const CUBE_MAX_H = 1.48;

export type WavePose = {
  eye: Vec3;
  look: Vec3;
  fov: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type WaveLattice = {
  cols: number;
  rows: number;
  count: number;
  cell: number;
  size: number;
  originX: number;
  originZ: number;
  height: Float32Array;
  velocity: Float32Array;
  scratch: Float32Array;
  instances: Float32Array;
};

export type WaveStep = {
  time: number;
  scroll: number;
  dt: number;
  frozen: boolean;
  disturb: number;
  pointerX: number;
  pointerZ: number;
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function hash(i: number, j: number): number {
  let n = i * 374761393 + j * 668265263;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

/** Carrier wave in roughly [-WAVE_AMP, WAVE_AMP]. */
export function waveCarrier(x: number, z: number, time: number, scroll: number): number {
  const phase = time * 0.82 + scroll * 1.25;
  const a = Math.sin(x * 0.74 + z * 0.2 - phase);
  const b = Math.sin(z * 0.66 - x * 0.24 + phase * 0.62);
  const c = Math.sin((x + z) * 0.33 + phase * 0.41);
  return a * 0.58 + b * 0.46 + c * 0.22;
}

function cameraBasis(eye: Vec3, look: Vec3) {
  const fx = look[0] - eye[0];
  const fy = look[1] - eye[1];
  const fz = look[2] - eye[2];
  const fl = Math.hypot(fx, fy, fz) || 1;
  const lx = fx / fl;
  const ly = fy / fl;
  const lz = fz / fl;
  let rx = ly * 0 - lz * 1;
  let ry = lz * 0 - lx * 0;
  let rz = lx * 1 - ly * 0;
  const rl = Math.hypot(rx, ry, rz) || 1;
  rx /= rl;
  ry /= rl;
  rz /= rl;
  const ux = ry * lz - rz * ly;
  const uy = rz * lx - rx * lz;
  const uz = rx * ly - ry * lx;
  return { lx, ly, lz, rx, ry, rz, ux, uy, uz };
}

/** Intersects the view ray with the ground plane y = 0. */
export function projectToGround(pose: WavePose, aspect: number, ndcX: number, ndcY: number): Vec3 | null {
  const { lx, ly, lz, rx, ry, rz, ux, uy, uz } = cameraBasis(pose.eye, pose.look);
  const ty = Math.tan(pose.fov / 2);
  const tx = ty * Math.max(aspect, 0.2);
  let dx = lx + rx * ndcX * tx + ux * ndcY * ty;
  let dy = ly + ry * ndcX * tx + uy * ndcY * ty;
  let dz = lz + rz * ndcX * tx + uz * ndcY * ty;
  const dl = Math.hypot(dx, dy, dz) || 1;
  dx /= dl;
  dy /= dl;
  dz /= dl;
  if (dy >= -1e-4) return null;
  const t = -pose.eye[1] / dy;
  if (t <= 0 || t > 48) return null;
  return [pose.eye[0] + dx * t, 0, pose.eye[2] + dz * t];
}

function cornerHits(eye: Vec3, look: Vec3, fov: number, aspect: number): Vec3[] | null {
  const pose: WavePose = { eye, look, fov, minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
  const hits: Vec3[] = [];
  for (const ndcY of [-1, 1]) {
    for (const ndcX of [-1, 1]) {
      const hit = projectToGround(pose, aspect, ndcX, ndcY);
      if (!hit) return null;
      hits.push(hit);
    }
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const hit of hits) {
    minX = Math.min(minX, hit[0]);
    maxX = Math.max(maxX, hit[0]);
    minZ = Math.min(minZ, hit[2]);
    maxZ = Math.max(maxZ, hit[2]);
  }
  const spanX = maxX - minX;
  const spanZ = maxZ - minZ;
  if (spanX < 5 || spanZ < 4 || spanX > 26 || spanZ > 22) return null;
  return hits;
}

function poseFromHits(eye: Vec3, look: Vec3, fov: number, hits: Vec3[]): WavePose {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const hit of hits) {
    minX = Math.min(minX, hit[0]);
    maxX = Math.max(maxX, hit[0]);
    minZ = Math.min(minZ, hit[2]);
    maxZ = Math.max(maxZ, hit[2]);
  }
  const midX = (minX + maxX) / 2;
  const midZ = (minZ + maxZ) / 2;
  const halfX = ((maxX - minX) / 2) * 1.08;
  const halfZ = ((maxZ - minZ) / 2) * 1.08;
  return {
    eye,
    look,
    fov,
    minX: midX - halfX,
    maxX: midX + halfX,
    minZ: midZ - halfZ,
    maxZ: midZ + halfZ,
  };
}

/** Picks the lowest camera that still covers the viewport with the ground grid. */
export function wavePose(aspect: number): WavePose {
  const look: Vec3 = [0, 0, -0.7];
  const safeAspect = Math.max(aspect, 0.35);
  for (let i = 0; i < 16; i += 1) {
    const eye: Vec3 = [0.16, 3.85 + i * 0.34, 8.9 - i * 0.2];
    const hits = cornerHits(eye, look, FOV, safeAspect);
    if (hits) return poseFromHits(eye, look, FOV, hits);
  }
  const eye: Vec3 = [0.1, 9.2, 5.1];
  const hits = cornerHits(eye, look, FOV, safeAspect);
  if (hits) return poseFromHits(eye, look, FOV, hits);
  return {
    eye,
    look,
    fov: FOV,
    minX: -8,
    maxX: 8,
    minZ: -7,
    maxZ: 5,
  };
}

export function createLattice(pose: WavePose, coarse: boolean): WaveLattice {
  const spanX = Math.max(pose.maxX - pose.minX, 1);
  const spanZ = Math.max(pose.maxZ - pose.minZ, 1);
  const target = coarse ? 1.05 : 0.74;
  const cols = clamp(Math.ceil(spanX / target), coarse ? 10 : 14, coarse ? 26 : 34);
  const rows = clamp(Math.ceil(spanZ / target), coarse ? 8 : 12, coarse ? 18 : 26);
  const cell = Math.max(spanX / cols, spanZ / rows);
  const size = cell * 0.74;
  const usedX = cols * cell;
  const usedZ = rows * cell;
  const originX = (pose.minX + pose.maxX) / 2 - usedX / 2;
  const originZ = (pose.minZ + pose.maxZ) / 2 - usedZ / 2;
  const count = cols * rows;
  const instances = new Float32Array(count * 4);
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const idx = j * cols + i;
      instances[idx * 4] = originX + (i + 0.5) * cell;
      instances[idx * 4 + 1] = originZ + (j + 0.5) * cell;
      instances[idx * 4 + 2] = 0.35;
      instances[idx * 4 + 3] = hash(i, j);
    }
  }
  return {
    cols,
    rows,
    count,
    cell,
    size,
    originX,
    originZ,
    height: new Float32Array(count),
    velocity: new Float32Array(count),
    scratch: new Float32Array(count),
    instances,
  };
}

function writeHeight(field: WaveLattice, index: number, column: number, row: number, ripple: number, step: WaveStep) {
  const x = field.originX + (column + 0.5) * field.cell;
  const z = field.originZ + (row + 0.5) * field.cell;
  let px = x;
  let pz = z;
  if (step.disturb > 0) {
    const dx = x - step.pointerX;
    const dz = z - step.pointerZ;
    const sigma = field.cell * 4.2;
    const push = Math.exp(-(dx * dx + dz * dz) / (sigma * sigma * 0.7)) * field.cell * 0.16 * step.disturb;
    const len = Math.hypot(dx, dz) || 1;
    px += (dx / len) * push;
    pz += (dz / len) * push;
  }
  const carrier = waveCarrier(x, z, step.time, step.scroll);
  field.instances[index * 4] = px;
  field.instances[index * 4 + 1] = pz;
  field.instances[index * 4 + 2] = clamp((carrier + ripple + WAVE_AMP) / (WAVE_AMP * 2), 0, 1);
}

/** Integrates the ripple, then writes instance xz, height, and keeps the seed. */
export function stepLattice(field: WaveLattice, step: WaveStep) {
  const { cols, rows, height, velocity, scratch } = field;
  if (step.frozen || step.disturb <= 0) {
    height.fill(0);
    velocity.fill(0);
    const sigma = field.cell * 4.4;
    const sigma2 = sigma * sigma * 0.62;
    for (let j = 0; j < rows; j += 1) {
      for (let i = 0; i < cols; i += 1) {
        const idx = j * cols + i;
        const x = field.originX + (i + 0.5) * field.cell;
        const z = field.originZ + (j + 0.5) * field.cell;
        const dx = x - step.pointerX;
        const dz = z - step.pointerZ;
        const mound = step.frozen && step.disturb > 0 ? Math.exp(-(dx * dx + dz * dz) / sigma2) * 1.25 : 0;
        height[idx] = mound;
        writeHeight(field, idx, i, j, mound, step);
      }
    }
    return;
  }

  scratch.set(height);
  const dt = clamp(step.dt, 0.001, 0.033);
  const sigma = field.cell * 4.4;
  const sigma2 = sigma * sigma * 0.62;
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const idx = j * cols + i;
      const x = field.originX + (i + 0.5) * field.cell;
      const z = field.originZ + (j + 0.5) * field.cell;
      const dx = x - step.pointerX;
      const dz = z - step.pointerZ;
      const desired = Math.exp(-(dx * dx + dz * dz) / sigma2) * 1.25 * step.disturb;
      const h = scratch[idx];
      const left = i > 0 ? scratch[idx - 1] : h;
      const right = i + 1 < cols ? scratch[idx + 1] : h;
      const down = j > 0 ? scratch[idx - cols] : h;
      const up = j + 1 < rows ? scratch[idx + cols] : h;
      const lap = (left + right + down + up) * 0.25 - h;
      let v = velocity[idx] + ((desired - h) * 36 + lap * 22) * dt;
      v *= Math.exp(-4.6 * dt);
      const next = clamp(h + v * dt, -0.7, 1.4);
      velocity[idx] = v;
      height[idx] = next;
      writeHeight(field, idx, i, j, next, step);
    }
  }
}

/** Hard-edged unit cube. XZ in [-0.5, 0.5], Y in [0, 1], so scaling Y grows it upward. */
export function createUnitCube(): Mesh {
  const faces: Array<{ n: [number, number, number]; v: Array<[number, number, number]> }> = [
    {
      n: [0, 1, 0],
      v: [
        [-0.5, 1, -0.5],
        [-0.5, 1, 0.5],
        [0.5, 1, 0.5],
        [0.5, 1, -0.5],
      ],
    },
    {
      n: [0, -1, 0],
      v: [
        [-0.5, 0, 0.5],
        [-0.5, 0, -0.5],
        [0.5, 0, -0.5],
        [0.5, 0, 0.5],
      ],
    },
    {
      n: [0, 0, 1],
      v: [
        [-0.5, 0, 0.5],
        [0.5, 0, 0.5],
        [0.5, 1, 0.5],
        [-0.5, 1, 0.5],
      ],
    },
    {
      n: [0, 0, -1],
      v: [
        [0.5, 0, -0.5],
        [-0.5, 0, -0.5],
        [-0.5, 1, -0.5],
        [0.5, 1, -0.5],
      ],
    },
    {
      n: [1, 0, 0],
      v: [
        [0.5, 0, 0.5],
        [0.5, 0, -0.5],
        [0.5, 1, -0.5],
        [0.5, 1, 0.5],
      ],
    },
    {
      n: [-1, 0, 0],
      v: [
        [-0.5, 0, -0.5],
        [-0.5, 0, 0.5],
        [-0.5, 1, 0.5],
        [-0.5, 1, -0.5],
      ],
    },
  ];

  const positions: number[] = [];
  const normals: number[] = [];
  const ao: number[] = [];
  const indices: number[] = [];
  for (const face of faces) {
    const start = positions.length / 3;
    for (const vertex of face.v) {
      positions.push(vertex[0], vertex[1], vertex[2]);
      normals.push(face.n[0], face.n[1], face.n[2]);
      ao.push(1);
    }
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }
  return {
    positions: Float32Array.from(positions),
    normals: Float32Array.from(normals),
    ao: Float32Array.from(ao),
    indices: Uint16Array.from(indices),
    indexType: "u16",
  };
}
