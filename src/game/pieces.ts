import { Rng } from "../engine/rng";
import { Piece } from "./state";
import { Vec2 } from "./types";

/** Base shapes as rows of '#'. Weights bias toward the mid-size pieces like the original. */
const SHAPES: { rows: string[]; weight: number }[] = [
  { rows: ["#"], weight: 1 },
  { rows: ["##"], weight: 3 },
  { rows: ["###"], weight: 4 },
  { rows: ["##", "#."], weight: 4 },
  { rows: ["##", "##"], weight: 3 },
  { rows: ["#.", "##", "#."], weight: 4 },
  { rows: ["###", "#.."], weight: 4 },
  { rows: ["##.", ".##"], weight: 4 },
  { rows: ["####"], weight: 2 },
  { rows: ["#..", "###", "#.."], weight: 2 },
  { rows: ["###", "..#", "..#"], weight: 2 },
  { rows: ["#.#", "###"], weight: 2 },
];

function cellsOf(rows: string[]): Vec2[] {
  const out: Vec2[] = [];
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) if (r[x] === "#") out.push({ x, y });
  });
  return out;
}

/** Rotate 90° clockwise and re-normalise to a non-negative origin. */
export function rotateCells(cells: readonly Vec2[]): Vec2[] {
  const maxY = Math.max(...cells.map((c) => c.y));
  const rotated = cells.map((c) => ({ x: maxY - c.y, y: c.x }));
  const minX = Math.min(...rotated.map((c) => c.x));
  const minY = Math.min(...rotated.map((c) => c.y));
  return rotated.map((c) => ({ x: c.x - minX, y: c.y - minY }));
}

export const PIECE_ROTATIONS: Vec2[][][] = SHAPES.map((s) => {
  const rots: Vec2[][] = [cellsOf(s.rows)];
  for (let i = 1; i < 4; i++) rots.push(rotateCells(rots[i - 1]!));
  return rots;
});

const TOTAL_WEIGHT = SHAPES.reduce((a, s) => a + s.weight, 0);

export function randomPiece(rng: Rng): Piece {
  let r = rng.next() * TOTAL_WEIGHT;
  let shapeIndex = 0;
  for (let i = 0; i < SHAPES.length; i++) {
    r -= SHAPES[i]!.weight;
    if (r < 0) {
      shapeIndex = i;
      break;
    }
  }
  const rotation = rng.int(4);
  return { shapeIndex, rotation, cells: PIECE_ROTATIONS[shapeIndex]![rotation]! };
}

export function rotatedPiece(p: Piece): Piece {
  const rotation = (p.rotation + 1) % 4;
  return { ...p, rotation, cells: PIECE_ROTATIONS[p.shapeIndex]![rotation]! };
}

export function pieceBounds(p: Piece): Vec2 {
  return {
    x: Math.max(...p.cells.map((c) => c.x)) + 1,
    y: Math.max(...p.cells.map((c) => c.y)) + 1,
  };
}
