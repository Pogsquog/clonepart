import { CASTLE_SIZE, Castle, idx, inBounds } from "./grid";
import { GRID_H, GRID_W, Tile } from "./types";

export interface TerritoryResult {
  /** Per tile: 0 = open (reachable from the map edge), 1 = enclosed. */
  enclosed: Uint8Array;
  /** Castle ids that sit inside an enclosed region. */
  enclosedCastles: number[];
}

/**
 * Flood-fill from every edge tile through everything that is not a wall.
 * Any tile not reached is inside a closed wall loop. Water is NOT a barrier:
 * the coast must be walled just like any other frontier.
 */
export function computeTerritory(tiles: Uint8Array, castles: readonly Castle[]): TerritoryResult {
  const n = GRID_W * GRID_H;
  const visited = new Uint8Array(n);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (!inBounds(x, y)) return;
    const i = idx(x, y);
    if (visited[i] || tiles[i] === Tile.Wall) return;
    visited[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < GRID_W; x++) {
    push(x, 0);
    push(x, GRID_H - 1);
  }
  for (let y = 0; y < GRID_H; y++) {
    push(0, y);
    push(GRID_W - 1, y);
  }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % GRID_W;
    const y = (i - x) / GRID_W;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  const enclosed = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (!visited[i] && tiles[i] !== Tile.Wall) enclosed[i] = 1;
  }
  const enclosedCastles: number[] = [];
  for (const c of castles) {
    let inside = true;
    for (let dy = 0; dy < CASTLE_SIZE && inside; dy++)
      for (let dx = 0; dx < CASTLE_SIZE; dx++) {
        if (!enclosed[idx(c.x + dx, c.y + dy)]) {
          inside = false;
          break;
        }
      }
    if (inside) enclosedCastles.push(c.id);
  }
  return { enclosed, enclosedCastles };
}

/**
 * Label each enclosed tile with the id of its connected region, so we can
 * decide per-region whether it contains a castle.
 */
export function labelRegions(enclosed: Uint8Array): { labels: Int32Array; count: number } {
  const n = GRID_W * GRID_H;
  const labels = new Int32Array(n).fill(-1);
  let count = 0;
  const stack: number[] = [];
  for (let start = 0; start < n; start++) {
    if (!enclosed[start] || labels[start] !== -1) continue;
    const label = count++;
    labels[start] = label;
    stack.push(start);
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % GRID_W;
      const y = (i - x) / GRID_W;
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ] as const) {
        if (!inBounds(nx, ny)) continue;
        const j = idx(nx, ny);
        if (enclosed[j] && labels[j] === -1) {
          labels[j] = label;
          stack.push(j);
        }
      }
    }
  }
  return { labels, count };
}

/**
 * Owned tiles = enclosed regions that contain at least one castle.
 * Returns a fresh owner map for the given player.
 */
export function claimTerritory(
  tiles: Uint8Array,
  castles: readonly Castle[],
  player: number,
): { owner: Uint8Array; castles: number[] } {
  const { enclosed } = computeTerritory(tiles, castles);
  const { labels, count } = labelRegions(enclosed);
  const regionHasCastle = new Uint8Array(count);
  const claimedCastles: number[] = [];
  for (const c of castles) {
    const l = labels[idx(c.x, c.y)]!;
    if (l >= 0) {
      regionHasCastle[l] = 1;
      claimedCastles.push(c.id);
    }
  }
  const owner = new Uint8Array(GRID_W * GRID_H);
  for (let i = 0; i < owner.length; i++) {
    const l = labels[i]!;
    if (l >= 0 && regionHasCastle[l]) owner[i] = player;
  }
  return { owner, castles: claimedCastles };
}
