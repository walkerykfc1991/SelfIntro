import {
  mat4Mul,
  mat4RotateX,
  mat4RotateY,
  mat4RotateZ,
  mat4Scale,
  mat4Translate,
  type Mat4,
} from "@/lib/mat4";

/** Three leaves, largest at the back of the fan. */
export const FIN_COUNT = 3;

const FIN_SCALES = [1, 0.9, 0.76] as const;

export function shellMatrix(): Mat4 {
  return mat4Mul(mat4Translate(0.12, 0.02, -0.24), mat4RotateY(-0.22));
}

export function rodMatrix(hingeX: number): Mat4 {
  return mat4Translate(hingeX - 0.055, -0.02, 0.05);
}

export function ringMatrix(roll: number): Mat4 {
  return mat4Mul(
    mat4Translate(0.46, -0.34, 0.46),
    mat4Mul(mat4RotateZ(0.62), mat4Mul(mat4RotateX(1.02), mat4RotateY(roll))),
  );
}

export function writeMatrix(out: Float32Array, matrix: Mat4, offset = 0) {
  out.set(matrix, offset);
}

/** Fins pivot on their left edge so the fan opens without leaving the rod. */
export function writeFins(out: Float32Array, hingeX: number, finHalfWidth: number, spread: number) {
  for (let i = 0; i < FIN_COUNT; i += 1) {
    const yaw = (i - 1) * spread;
    const z = 0.07 + i * 0.078;
    const y = 0.12 - i * 0.1;
    const s = FIN_SCALES[i];
    const placed = mat4Mul(
      mat4Translate(hingeX, y, z),
      mat4Mul(mat4RotateY(yaw), mat4Mul(mat4Scale(s, s, s), mat4Translate(finHalfWidth, 0, 0))),
    );
    out.set(placed, i * 16);
  }
}
