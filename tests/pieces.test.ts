import { describe, expect, it } from "vitest";
import { Rng } from "../src/engine/rng";
import { PIECE_ROTATIONS, randomPiece, rotateCells, rotatedPiece } from "../src/game/pieces";

describe("pieces", () => {
  it("rotating four times returns to the original shape", () => {
    for (const rots of PIECE_ROTATIONS) {
      const key = (c: { x: number; y: number }[]) =>
        [...c].map((v) => `${v.x},${v.y}`).sort().join(" ");
      expect(key(rotateCells(rots[3]!))).toBe(key(rots[0]!));
    }
  });

  it("rotated pieces stay normalised to a non-negative origin", () => {
    for (const rots of PIECE_ROTATIONS)
      for (const cells of rots) {
        expect(Math.min(...cells.map((c) => c.x))).toBe(0);
        expect(Math.min(...cells.map((c) => c.y))).toBe(0);
      }
  });

  it("random pieces are deterministic for a seed", () => {
    const a = randomPiece(new Rng(42));
    const b = randomPiece(new Rng(42));
    expect(a).toEqual(b);
    expect(rotatedPiece(a).rotation).toBe((a.rotation + 1) % 4);
  });
});
