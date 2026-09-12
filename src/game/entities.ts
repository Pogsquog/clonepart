import { CANNON_SIZE, idx, inBounds } from "./grid";
import { Cannon, GameState, newId } from "./state";
import { PlayerId, Tile } from "./types";

export function cannonAt(s: GameState, x: number, y: number): Cannon | undefined {
  return s.cannons.find((c) => x >= c.x && x < c.x + CANNON_SIZE && y >= c.y && y < c.y + CANNON_SIZE);
}

export function troopAt(s: GameState, x: number, y: number): boolean {
  return s.troops.some((t) => t.x === x && t.y === y);
}

export function canPlaceCannon(s: GameState, player: PlayerId, x: number, y: number): boolean {
  for (let dy = 0; dy < CANNON_SIZE; dy++)
    for (let dx = 0; dx < CANNON_SIZE; dx++) {
      const tx = x + dx;
      const ty = y + dy;
      if (!inBounds(tx, ty)) return false;
      const i = idx(tx, ty);
      if (s.tiles[i] !== Tile.Land || s.owner[i] !== player) return false;
      if (troopAt(s, tx, ty)) return false;
    }
  return true;
}

export function placeCannon(s: GameState, player: PlayerId, x: number, y: number): Cannon {
  const c: Cannon = { id: newId(s), owner: player, x, y, hp: 2, cooldown: 0 };
  s.cannons.push(c);
  for (let dy = 0; dy < CANNON_SIZE; dy++)
    for (let dx = 0; dx < CANNON_SIZE; dx++) s.tiles[idx(x + dx, y + dy)] = Tile.Cannon;
  return c;
}

export function removeCannon(s: GameState, c: Cannon): void {
  s.cannons = s.cannons.filter((o) => o.id !== c.id);
  for (let dy = 0; dy < CANNON_SIZE; dy++)
    for (let dx = 0; dx < CANNON_SIZE; dx++) s.tiles[idx(c.x + dx, c.y + dy)] = Tile.Land;
}

export function canPlacePiece(s: GameState, cells: readonly { x: number; y: number }[], ox: number, oy: number): boolean {
  for (const c of cells) {
    const x = ox + c.x;
    const y = oy + c.y;
    if (!inBounds(x, y)) return false;
    if (s.tiles[idx(x, y)] !== Tile.Land) return false;
    if (troopAt(s, x, y)) return false;
  }
  return true;
}

export function placePiece(s: GameState, cells: readonly { x: number; y: number }[], ox: number, oy: number): void {
  for (const c of cells) s.tiles[idx(ox + c.x, oy + c.y)] = Tile.Wall;
}

export const STARTER_RING = 3;

/**
 * Wall ring three tiles out from a 3x3 castle (9x9 outline), leaving a
 * two-tile band inside for cannons. Skips anything that isn't plain land.
 */
export function buildStarterWall(s: GameState, castleX: number, castleY: number): void {
  const r = STARTER_RING;
  for (let dy = -r; dy <= 2 + r; dy++)
    for (let dx = -r; dx <= 2 + r; dx++) {
      const ring = dy === -r || dy === 2 + r || dx === -r || dx === 2 + r;
      if (!ring) continue;
      const x = castleX + dx;
      const y = castleY + dy;
      if (inBounds(x, y) && s.tiles[idx(x, y)] === Tile.Land) s.tiles[idx(x, y)] = Tile.Wall;
    }
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}
