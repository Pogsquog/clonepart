import { GRID_H, GRID_W, Tile } from "./types";

export const idx = (x: number, y: number): number => y * GRID_W + x;
export const inBounds = (x: number, y: number): boolean =>
  x >= 0 && y >= 0 && x < GRID_W && y < GRID_H;

export interface Castle {
  id: number;
  /** Top-left of the 3x3 footprint. */
  x: number;
  y: number;
  owner: 0 | 1 | 2;
  isHome: boolean;
}

export const CASTLE_SIZE = 3;
export const CANNON_SIZE = 2;

export interface ParsedMap {
  tiles: Uint8Array;
  castles: Castle[];
}

/**
 * Map legend:
 *   '~' water   '.' land   'C' castle (top-left of a 3x3 block; the other 8 cells are '.' or 'c')
 * Rows must be GRID_H lines of GRID_W chars.
 */
export function parseMap(rows: readonly string[]): ParsedMap {
  if (rows.length !== GRID_H) throw new Error(`map needs ${GRID_H} rows, got ${rows.length}`);
  const tiles = new Uint8Array(GRID_W * GRID_H);
  const castles: Castle[] = [];
  for (let y = 0; y < GRID_H; y++) {
    const row = rows[y]!;
    if (row.length !== GRID_W) throw new Error(`row ${y} needs ${GRID_W} chars, got ${row.length}`);
    for (let x = 0; x < GRID_W; x++) {
      const ch = row[x];
      tiles[idx(x, y)] = ch === "~" ? Tile.Water : Tile.Land;
      if (ch === "C") {
        castles.push({ id: castles.length, x, y, owner: 0, isHome: false });
      }
    }
  }
  for (const c of castles) {
    for (let dy = 0; dy < CASTLE_SIZE; dy++)
      for (let dx = 0; dx < CASTLE_SIZE; dx++) {
        if (!inBounds(c.x + dx, c.y + dy)) throw new Error(`castle ${c.id} out of bounds`);
        tiles[idx(c.x + dx, c.y + dy)] = Tile.Castle;
      }
  }
  return { tiles, castles };
}

export function isWater(tiles: Uint8Array, x: number, y: number): boolean {
  return inBounds(x, y) && tiles[idx(x, y)] === Tile.Water;
}

/** Land tile with at least one 4-neighbour water tile — the beach strip. */
export function isShore(tiles: Uint8Array, x: number, y: number): boolean {
  if (!inBounds(x, y) || tiles[idx(x, y)] === Tile.Water) return false;
  return (
    isWater(tiles, x - 1, y) ||
    isWater(tiles, x + 1, y) ||
    isWater(tiles, x, y - 1) ||
    isWater(tiles, x, y + 1)
  );
}

/** Every water tile that touches land: where ships anchor and troops disembark. */
export function coastWaterTiles(tiles: Uint8Array): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_H; y++)
    for (let x = 0; x < GRID_W; x++) {
      if (tiles[idx(x, y)] !== Tile.Water) continue;
      const land = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ].some(([nx, ny]) => inBounds(nx!, ny!) && tiles[idx(nx!, ny!)] !== Tile.Water);
      if (land) out.push({ x, y });
    }
  return out;
}
