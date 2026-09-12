import { DIFFICULTY, SCORE, TROOP_MOVE_TICKS } from "../config";
import { stepCursor } from "../cursor";
import { canPlacePiece, placePiece, removeCannon } from "../entities";
import { CANNON_SIZE, idx, inBounds } from "../grid";
import { pieceBounds, randomPiece, rotatedPiece } from "../pieces";
import { GameState, setBanner } from "../state";
import { claimTerritory } from "../territory";
import { GRID_H, GRID_W, Phase, PlayerInput, TICK_RATE, Tile } from "../types";
import { enterCannonPlace } from "./cannonPlace";

export function enterBuild(s: GameState): void {
  s.phase = Phase.Build;
  s.timer = DIFFICULTY[s.difficulty].buildSeconds * TICK_RATE;
  s.craters.fill(0);
  for (let i = 0; i < s.scorch.length; i++) {
    if (s.scorch[i]! > 0) {
      s.scorch[i]!--;
      if (s.scorch[i] === 0 && s.tiles[i] === Tile.Scorched) s.tiles[i] = Tile.Land;
    }
  }
  const p = s.players[0]!;
  p.piece = randomPiece(s.rng);
  p.cursor.x = Math.round(p.cursor.x);
  p.cursor.y = Math.round(p.cursor.y);
  p.repeat = { dx: 0, dy: 0, held: 0 };
  setBanner(s, "BUILD & REPAIR");
}

export function updateBuild(s: GameState, inp: PlayerInput): void {
  const p = s.players[0]!;
  if (p.piece) {
    if (inp.rotate) {
      p.piece = rotatedPiece(p.piece);
      const b = pieceBounds(p.piece);
      p.cursor.x = Math.min(p.cursor.x, GRID_W - b.x);
      p.cursor.y = Math.min(p.cursor.y, GRID_H - b.y);
    }
    const b = pieceBounds(p.piece);
    stepCursor(p, inp, b.x, b.y);
    if (inp.action) {
      const x = Math.round(p.cursor.x);
      const y = Math.round(p.cursor.y);
      if (canPlacePiece(s, p.piece.cells, x, y)) {
        placePiece(s, p.piece.cells, x, y);
        p.piece = randomPiece(s.rng);
        const nb = pieceBounds(p.piece);
        p.cursor.x = Math.min(p.cursor.x, GRID_W - nb.x);
        p.cursor.y = Math.min(p.cursor.y, GRID_H - nb.y);
      }
    }
  }
  updateTroops(s);
  if (s.timer <= 0) {
    p.piece = null;
    enterResolve(s);
  }
}

function updateTroops(s: GameState): void {
  for (const t of s.troops) {
    if (t.moveCooldown > 0) {
      t.moveCooldown--;
      continue;
    }
    t.moveCooldown = TROOP_MOVE_TICKS;
    // March toward the nearest castle; step on the dominant axis, else the other.
    let best = s.castles[0]!;
    let bestD = Infinity;
    for (const c of s.castles) {
      const d = Math.abs(c.x + 1 - t.x) + Math.abs(c.y + 1 - t.y);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    const dx = Math.sign(best.x + 1 - t.x);
    const dy = Math.sign(best.y + 1 - t.y);
    const options = Math.abs(best.x + 1 - t.x) >= Math.abs(best.y + 1 - t.y) ? [[dx, 0], [0, dy]] : [[0, dy], [dx, 0]];
    for (const [mx, my] of options) {
      const nx = t.x + mx!;
      const ny = t.y + my!;
      if ((mx === 0 && my === 0) || !inBounds(nx, ny)) continue;
      if (s.tiles[idx(nx, ny)] !== Tile.Land) continue;
      if (s.troops.some((o) => o.x === nx && o.y === ny)) continue;
      t.x = nx;
      t.y = ny;
      break;
    }
  }
}

export function enterResolve(s: GameState): void {
  s.phase = Phase.Resolve;
  s.timer = 2 * TICK_RATE;
  const p = s.players[0]!;

  const claim = claimTerritory(s.tiles, s.castles, p.id);
  const prevOwned = s.owner.reduce((a, v) => a + (v === p.id ? 1 : 0), 0);
  const prevCastles = s.castles.filter((c) => c.owner === p.id).length;
  s.owner = claim.owner;
  for (const c of s.castles) c.owner = claim.castles.includes(c.id) ? p.id : 0;

  // Troops caught inside a closed wall are eliminated.
  const before = s.troops.length;
  s.troops = s.troops.filter((t) => s.owner[idx(t.x, t.y)] !== p.id);
  p.score += (before - s.troops.length) * SCORE.troopKill;

  // Cannons must sit entirely on owned land.
  for (const c of [...s.cannons]) {
    let ok = true;
    for (let dy = 0; dy < CANNON_SIZE && ok; dy++)
      for (let dx = 0; dx < CANNON_SIZE; dx++)
        if (s.owner[idx(c.x + dx, c.y + dy)] !== p.id) {
          ok = false;
          break;
        }
    if (!ok) removeCannon(s, c);
  }

  const owned = s.owner.reduce((a, v) => a + (v === p.id ? 1 : 0), 0);
  const castles = claim.castles.length;
  p.score += Math.max(0, owned - prevOwned) * SCORE.tileClaimed;
  p.score += Math.max(0, castles - prevCastles) * SCORE.castleClaimed;

  if (castles === 0) {
    p.alive = false;
    s.phase = Phase.GameOver;
    setBanner(s, "GAME OVER", 999);
    return;
  }
  p.score += SCORE.roundSurvived;
  s.round++;
  if (s.round >= s.roundsToWin) {
    s.phase = Phase.Victory;
    setBanner(s, "VICTORY!", 999);
    return;
  }
  setBanner(s, `ROUND ${s.round + 1}`);
}

export function updateResolve(s: GameState): void {
  if (s.timer <= 0) enterCannonPlace(s);
}
