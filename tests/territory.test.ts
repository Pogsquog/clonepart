import { describe, expect, it } from "vitest";
import { idx, parseMap } from "../src/game/grid";
import { claimTerritory, computeTerritory } from "../src/game/territory";
import { GRID_H, GRID_W, Tile } from "../src/game/types";

function blank(): string[] {
  return Array.from({ length: GRID_H }, () => ".".repeat(GRID_W));
}
function set(rows: string[], x: number, y: number, ch: string) {
  rows[y] = rows[y]!.slice(0, x) + ch + rows[y]!.slice(x + 1);
}
function ring(tiles: Uint8Array, x0: number, y0: number, x1: number, y1: number) {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if (x === x0 || x === x1 || y === y0 || y === y1) tiles[idx(x, y)] = Tile.Wall;
}

describe("territory", () => {
  it("claims a fully walled region containing a castle", () => {
    const rows = blank();
    set(rows, 10, 10, "C");
    const { tiles, castles } = parseMap(rows);
    ring(tiles, 8, 8, 14, 14);
    const r = claimTerritory(tiles, castles, 1);
    expect(r.castles).toEqual([0]);
    expect(r.owner[idx(10, 10)]).toBe(1);
    expect(r.owner[idx(9, 9)]).toBe(1);
    expect(r.owner[idx(8, 8)]).toBe(0); // wall itself is not owned land
    expect(r.owner[idx(20, 20)]).toBe(0);
  });

  it("does not claim a region with a single-tile gap", () => {
    const rows = blank();
    set(rows, 10, 10, "C");
    const { tiles, castles } = parseMap(rows);
    ring(tiles, 8, 8, 14, 14);
    tiles[idx(11, 8)] = Tile.Land; // breach
    const r = claimTerritory(tiles, castles, 1);
    expect(r.castles).toEqual([]);
    expect(r.owner[idx(10, 10)]).toBe(0);
  });

  it("does not claim an enclosed region with no castle", () => {
    const rows = blank();
    set(rows, 30, 20, "C");
    const { tiles, castles } = parseMap(rows);
    ring(tiles, 2, 2, 6, 6);
    const r = claimTerritory(tiles, castles, 1);
    expect(r.castles).toEqual([]);
    expect(r.owner[idx(4, 4)]).toBe(0);
    const t = computeTerritory(tiles, castles);
    expect(t.enclosed[idx(4, 4)]).toBe(1); // enclosed, just not claimable
  });

  it("treats water as open, so the coast must be walled", () => {
    const rows = blank();
    for (let y = 0; y < GRID_H; y++) set(rows, 0, y, "~");
    set(rows, 3, 10, "C");
    const { tiles, castles } = parseMap(rows);
    // Ring that leaves the water column as its west edge.
    for (let y = 8; y <= 14; y++) tiles[idx(7, y)] = Tile.Wall;
    for (let x = 1; x <= 7; x++) {
      tiles[idx(x, 8)] = Tile.Wall;
      tiles[idx(x, 14)] = Tile.Wall;
    }
    expect(claimTerritory(tiles, castles, 1).castles).toEqual([]);
    for (let y = 8; y <= 14; y++) tiles[idx(1, y)] = Tile.Wall;
    expect(claimTerritory(tiles, castles, 1).castles).toEqual([0]);
  });

  it("walls touching the map edge do not enclose", () => {
    const rows = blank();
    set(rows, 1, 1, "C");
    const { tiles, castles } = parseMap(rows);
    for (let i = 0; i <= 5; i++) {
      tiles[idx(5, i)] = Tile.Wall;
      tiles[idx(i, 5)] = Tile.Wall;
    }
    expect(claimTerritory(tiles, castles, 1).castles).toEqual([]);
  });
});
