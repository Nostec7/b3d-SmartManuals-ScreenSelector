import type { Vec2 } from "../types";

/**
 * Solve A x = b using Gaussian elimination.
 * A: n x n, b: n
 */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]); // augmented

  for (let col = 0; col < n; col++) {
    // Find pivot
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-12) {
      throw new Error("Singular matrix while solving homography");
    }
    // Swap
    [M[col], M[pivot]] = [M[pivot], M[col]];

    // Normalize pivot row
    const div = M[col][col];
    for (let c = col; c <= n; c++) M[col][c] /= div;

    // Eliminate other rows
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      for (let c = col; c <= n; c++) {
        M[r][c] -= factor * M[col][c];
      }
    }
  }

  return M.map((row) => row[n]);
}

/**
 * Computes a homography H (3x3) such that:
 *   [u v 1]^T ~ H * [x y 1]^T
 * with 4 point correspondences.
 *
 * Unknowns are h11,h12,h13,h21,h22,h23,h31,h32 (h33=1).
 */
export function computeHomography(
  src: [Vec2, Vec2, Vec2, Vec2],
  dst: [Vec2, Vec2, Vec2, Vec2]
) {
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];

    // Equation for u
    // x*h11 + y*h12 + 1*h13 - u*x*h31 - u*y*h32 = u
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);

    // Equation for v
    // x*h21 + y*h22 + 1*h23 - v*x*h31 - v*y*h32 = v
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }

  const h = solveLinearSystem(A, b);
  const H = [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1],
  ];

  return H;
}

/**
 * Convert 3x3 homography to CSS matrix3d() parameters (length 16).
 *
 * We embed:
 * | h11 h12 0 h13 |
 * | h21 h22 0 h23 |
 * | 0   0   1 0   |
 * | h31 h32 0 h33 |
 *
 * CSS matrix3d arguments are column-major (see MDN). :contentReference[oaicite:8]{index=8}
 */
export function homographyToCssMatrix3d(H: number[][]): number[] {
  const h11 = H[0][0],
    h12 = H[0][1],
    h13 = H[0][2];
  const h21 = H[1][0],
    h22 = H[1][1],
    h23 = H[1][2];
  const h31 = H[2][0],
    h32 = H[2][1],
    h33 = H[2][2];

  // CSS order: m11,m12,m13,m14,m21,m22,m23,m24,m31,m32,m33,m34,m41,m42,m43,m44
  return [h11, h21, 0, h31, h12, h22, 0, h32, 0, 0, 1, 0, h13, h23, 0, h33];
}

export function cssMatrix3dString(m: number[]): string {
  // Keep a reasonable precision to avoid huge strings / layout churn
  const fmt = (v: number) =>
    Number.isFinite(v)
      ? v.toFixed(10).replace(/0+$/, "").replace(/\.$/, "")
      : "0";
  return `matrix3d(${m.map(fmt).join(",")})`;
}

export function invert3x3(M: number[][]): number[][] {
  const a = M[0][0],
    b = M[0][1],
    c = M[0][2];
  const d = M[1][0],
    e = M[1][1],
    f = M[1][2];
  const g = M[2][0],
    h = M[2][1],
    i = M[2][2];

  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const D = -(b * i - c * h);
  const E = a * i - c * g;
  const F = -(a * h - b * g);
  const G = b * f - c * e;
  const H = -(a * f - c * d);
  const I = a * e - b * d;

  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) throw new Error("Homography not invertible");

  const invDet = 1 / det;
  return [
    [A * invDet, D * invDet, G * invDet],
    [B * invDet, E * invDet, H * invDet],
    [C * invDet, F * invDet, I * invDet],
  ];
}

export function applyHomography(
  H: number[][],
  x: number,
  y: number
): { x: number; y: number } {
  const X = H[0][0] * x + H[0][1] * y + H[0][2];
  const Y = H[1][0] * x + H[1][1] * y + H[1][2];
  const W = H[2][0] * x + H[2][1] * y + H[2][2];
  return { x: X / W, y: Y / W };
}
