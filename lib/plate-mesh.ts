/**
 * Procedural meshes for the hero still life.
 * Plates are rounded boxes projected onto a signed-distance surface, then
 * bent. The rod and ring are lathed in code. Nothing here is imported art.
 */

export type Mesh = {
  positions: Float32Array;
  normals: Float32Array;
  ao: Float32Array;
  indices: Uint16Array | Uint32Array;
  indexType: "u16" | "u32";
};

type PlateSpec = {
  hx: number;
  hy: number;
  hz: number;
  radius: number;
  bend: number;
  /** Segment counts across the broad face, [width, height]. */
  face: [number, number];
  /** Segments across the thin edge. */
  side: number;
};

class Builder {
  readonly pos: number[] = [];
  readonly nor: number[] = [];
  readonly ao: number[] = [];
  readonly idx: number[] = [];

  push(p: readonly number[], n: readonly number[], ao: number): number {
    const index = this.pos.length / 3;
    this.pos.push(p[0], p[1], p[2]);
    const len = Math.hypot(n[0], n[1], n[2]) || 1;
    this.nor.push(n[0] / len, n[1] / len, n[2] / len);
    this.ao.push(ao);
    return index;
  }

  /** Adds a triangle wound so it faces the stored normal at `i0`. */
  face(i0: number, i1: number, i2: number) {
    const ax = this.pos[i0 * 3];
    const ay = this.pos[i0 * 3 + 1];
    const az = this.pos[i0 * 3 + 2];
    const e1x = this.pos[i1 * 3] - ax;
    const e1y = this.pos[i1 * 3 + 1] - ay;
    const e1z = this.pos[i1 * 3 + 2] - az;
    const e2x = this.pos[i2 * 3] - ax;
    const e2y = this.pos[i2 * 3 + 1] - ay;
    const e2z = this.pos[i2 * 3 + 2] - az;
    const crx = e1y * e2z - e1z * e2y;
    const cry = e1z * e2x - e1x * e2z;
    const crz = e1x * e2y - e1y * e2x;
    if (crx * crx + cry * cry + crz * crz < 1e-16) return;
    const dot = crx * this.nor[i0 * 3] + cry * this.nor[i0 * 3 + 1] + crz * this.nor[i0 * 3 + 2];
    if (dot < 0) this.idx.push(i0, i2, i1);
    else this.idx.push(i0, i1, i2);
  }

  build(aoOverride?: (index: number) => number): Mesh {
    const count = this.pos.length / 3;
    if (aoOverride) {
      for (let i = 0; i < count; i += 1) this.ao[i] = aoOverride(i);
    }
    const indexType = count > 65535 ? "u32" : "u16";
    return {
      positions: Float32Array.from(this.pos),
      normals: Float32Array.from(this.nor),
      ao: Float32Array.from(this.ao),
      indices: indexType === "u32" ? Uint32Array.from(this.idx) : Uint16Array.from(this.idx),
      indexType,
    };
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function sdRoundBox(p: readonly number[], b: readonly number[], r: number): number {
  const qx = Math.abs(p[0]) - b[0] + r;
  const qy = Math.abs(p[1]) - b[1] + r;
  const qz = Math.abs(p[2]) - b[2] + r;
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  const az = Math.max(qz, 0);
  return Math.hypot(ax, ay, az) + Math.min(Math.max(qx, qy, qz), 0) - r;
}

function gradient(p: readonly number[], b: readonly number[], r: number): [number, number, number] {
  const e = 1e-4;
  const sample = (axis: number, h: number) => {
    const q: [number, number, number] = [p[0], p[1], p[2]];
    q[axis] += h;
    return sdRoundBox(q, b, r);
  };
  const gx = sample(0, e) - sample(0, -e);
  const gy = sample(1, e) - sample(1, -e);
  const gz = sample(2, e) - sample(2, -e);
  const len = Math.hypot(gx, gy, gz) || 1;
  return [gx / len, gy / len, gz / len];
}

function project(p: [number, number, number], b: readonly number[], r: number): [number, number, number] {
  const out: [number, number, number] = [p[0], p[1], p[2]];
  for (let i = 0; i < 6; i += 1) {
    const d = sdRoundBox(out, b, r);
    if (Math.abs(d) < 1e-5) break;
    const g = gradient(out, b, r);
    out[0] -= g[0] * d;
    out[1] -= g[1] * d;
    out[2] -= g[2] * d;
  }
  return out;
}

/** Packs samples toward both ends so fillets keep their round. */
function cluster(t: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1));
}

function faceSegments(axis: number, face: [number, number], side: number): [number, number] {
  if (axis === 2) return face;
  if (axis === 0) return [face[1], side];
  return [side, face[0]];
}

export function buildPlate(spec: PlateSpec): Mesh {
  const b = [spec.hx, spec.hy, spec.hz];
  const radius = Math.min(spec.radius, spec.hx * 0.45, spec.hy * 0.45, spec.hz * 0.45);
  const builder = new Builder();

  for (let axis = 0; axis < 3; axis += 1) {
    const uAxis = (axis + 1) % 3;
    const vAxis = (axis + 2) % 3;
    const [nu, nv] = faceSegments(axis, spec.face, spec.side);
    for (const sign of [1, -1]) {
      const origin = builder.pos.length / 3;
      for (let j = 0; j <= nv; j += 1) {
        for (let i = 0; i <= nu; i += 1) {
          const start: [number, number, number] = [0, 0, 0];
          start[uAxis] = -b[uAxis] + cluster(i / nu) * 2 * b[uAxis];
          start[vAxis] = -b[vAxis] + cluster(j / nv) * 2 * b[vAxis];
          start[axis] = sign * b[axis];
          const p = project(start, b, radius);
          const n = gradient(p, b, radius);
          builder.push(p, n, 1);
        }
      }
      const stride = nu + 1;
      for (let j = 0; j < nv; j += 1) {
        for (let i = 0; i < nu; i += 1) {
          const a = origin + j * stride + i;
          const c = a + 1;
          const d = a + stride;
          const e = d + 1;
          builder.face(a, c, e);
          builder.face(a, e, d);
        }
      }
    }
  }

  const bend = spec.bend;
  return builder.build((index) => {
    if (Math.abs(bend) > 1e-5) {
      const x = builder.pos[index * 3];
      const z = builder.pos[index * 3 + 2];
      const a = bend * x;
      const s = Math.sin(a);
      const c = Math.cos(a);
      const radiusArm = z + 1 / bend;
      builder.pos[index * 3] = s * radiusArm;
      builder.pos[index * 3 + 2] = c * radiusArm - 1 / bend;
      const nx = builder.nor[index * 3];
      const nz = builder.nor[index * 3 + 2];
      builder.nor[index * 3] = c * nx + s * nz;
      builder.nor[index * 3 + 2] = -s * nx + c * nz;
      const nl = Math.hypot(builder.nor[index * 3], builder.nor[index * 3 + 1], builder.nor[index * 3 + 2]) || 1;
      builder.nor[index * 3] /= nl;
      builder.nor[index * 3 + 1] /= nl;
      builder.nor[index * 3 + 2] /= nl;
    }
    return clamp(0.56 + 0.44 * builder.nor[index * 3 + 2], 0.4, 1);
  });
}

export function buildRod(radius: number, height: number, sides: number): Mesh {
  const builder = new Builder();
  const y0 = -height / 2;
  const y1 = height / 2;
  for (let s = 0; s < sides; s += 1) {
    const a = (s / sides) * Math.PI * 2;
    const x = Math.cos(a);
    const z = Math.sin(a);
    const n: [number, number, number] = [x, 0, z];
    builder.push([x * radius, y0, z * radius], n, 0.78);
    builder.push([x * radius, y1, z * radius], n, 0.86);
  }
  for (let s = 0; s < sides; s += 1) {
    const a = s * 2;
    const c = ((s + 1) % sides) * 2;
    builder.face(a, c, c + 1);
    builder.face(a, c + 1, a + 1);
  }
  const bottom = builder.push([0, y0, 0], [0, -1, 0], 0.62);
  const top = builder.push([0, y1, 0], [0, 1, 0], 0.9);
  for (let s = 0; s < sides; s += 1) {
    const a = s * 2;
    const c = ((s + 1) % sides) * 2;
    builder.face(bottom, c, a);
    builder.face(top, a + 1, c + 1);
  }
  return builder.build();
}

export function buildTorus(major: number, minor: number, majorSeg: number, minorSeg: number): Mesh {
  const builder = new Builder();
  for (let i = 0; i <= majorSeg; i += 1) {
    const u = (i / majorSeg) * Math.PI * 2;
    const cu = Math.cos(u);
    const su = Math.sin(u);
    for (let j = 0; j <= minorSeg; j += 1) {
      const v = (j / minorSeg) * Math.PI * 2;
      const cv = Math.cos(v);
      const sv = Math.sin(v);
      const nx = cu * cv;
      const ny = su * cv;
      const nz = sv;
      builder.push([cu * major + nx * minor, su * major + ny * minor, nz * minor], [nx, ny, nz], clamp(0.64 + 0.36 * cv, 0.45, 1));
    }
  }
  const stride = minorSeg + 1;
  for (let i = 0; i < majorSeg; i += 1) {
    for (let j = 0; j < minorSeg; j += 1) {
      const a = i * stride + j;
      const c = a + 1;
      const d = (i + 1) * stride + j;
      const e = d + 1;
      builder.face(a, d, e);
      builder.face(a, e, c);
    }
  }
  return builder.build();
}

export function buildShadow(y: number): Mesh {
  const builder = new Builder();
  const p = [
    [-1.45, y, -0.85],
    [1.65, y, -0.85],
    [1.65, y, 1.05],
    [-1.45, y, 1.05],
  ];
  const up: [number, number, number] = [0, 1, 0];
  const i0 = builder.push(p[0], up, 1);
  const i1 = builder.push(p[1], up, 1);
  const i2 = builder.push(p[2], up, 1);
  const i3 = builder.push(p[3], up, 1);
  builder.face(i0, i1, i2);
  builder.face(i0, i2, i3);
  return builder.build();
}

export type SculptureMeshes = {
  shell: Mesh;
  fin: Mesh;
  ring: Mesh;
  rod: Mesh;
  shadow: Mesh;
  finHalfWidth: number;
  hingeX: number;
  groundY: number;
};

export function createSculpture(quality: "high" | "low"): SculptureMeshes {
  const high = quality === "high";
  const finHalfWidth = 0.36;
  const hingeX = -0.04;
  const groundY = -1.02;
  return {
    finHalfWidth,
    hingeX,
    groundY,
    shell: buildPlate({
      hx: 0.6,
      hy: 0.88,
      hz: 0.032,
      radius: 0.016,
      bend: 0.78,
      face: high ? [40, 52] : [22, 28],
      side: high ? 7 : 4,
    }),
    fin: buildPlate({
      hx: finHalfWidth,
      hy: 0.56,
      hz: 0.016,
      radius: 0.008,
      bend: 0.22,
      face: high ? [30, 38] : [16, 22],
      side: high ? 5 : 3,
    }),
    ring: buildTorus(0.24, 0.02, high ? 72 : 40, high ? 18 : 10),
    rod: buildRod(0.018, 1.46, high ? 12 : 8),
    shadow: buildShadow(groundY),
  };
}
