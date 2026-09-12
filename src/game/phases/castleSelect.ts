import { DIFFICULTY } from "../config";
import { CASTLE_SIZE } from "../grid";
import { GameState, setBanner } from "../state";
import { claimTerritory } from "../territory";
import { Phase, PlayerInput, TICK_RATE } from "../types";
import { buildStarterWall } from "../entities";
import { enterCannonPlace } from "./cannonPlace";

export function enterCastleSelect(s: GameState): void {
  s.phase = Phase.CastleSelect;
  s.timer = DIFFICULTY[s.difficulty].castleSelectSeconds * TICK_RATE;
  s.selectedCastle = 0;
  setBanner(s, "SELECT YOUR CASTLE");
}

/** True on the first tick a direction is pressed (no key repeat). */
function pressed(s: GameState, inp: PlayerInput): boolean {
  const p = s.players[0]!;
  const r = p.repeat;
  const changed = r.dx !== inp.dx || r.dy !== inp.dy;
  r.dx = inp.dx;
  r.dy = inp.dy;
  return changed && (inp.dx !== 0 || inp.dy !== 0);
}

export function updateCastleSelect(s: GameState, inp: PlayerInput): void {
  if (pressed(s, inp)) {
    const cur = s.castles[s.selectedCastle]!;
    // Pick the nearest castle in the pressed direction (dot product > 0), scored by distance.
    let best = -1;
    let bestD = Infinity;
    for (const c of s.castles) {
      if (c.id === cur.id) continue;
      const vx = c.x - cur.x;
      const vy = c.y - cur.y;
      const along = vx * inp.dx + vy * inp.dy;
      if (along <= 0) continue;
      const perp = Math.abs(vx * inp.dy - vy * inp.dx);
      const d = along + perp * 2;
      if (d < bestD) {
        bestD = d;
        best = c.id;
      }
    }
    if (best >= 0) s.selectedCastle = best;
  }
  const p = s.players[0]!;
  const c = s.castles[s.selectedCastle]!;
  p.cursor.x = c.x + (CASTLE_SIZE - 1) / 2;
  p.cursor.y = c.y + (CASTLE_SIZE - 1) / 2;

  if (inp.action || s.timer <= 0) chooseCastle(s, s.selectedCastle);
}

export function chooseCastle(s: GameState, castleId: number): void {
  const p = s.players[0]!;
  const c = s.castles[castleId]!;
  c.isHome = true;
  c.owner = p.id;
  p.homeCastle = c.id;
  buildStarterWall(s, c.x, c.y);
  const claim = claimTerritory(s.tiles, s.castles, p.id);
  s.owner = claim.owner;
  enterCannonPlace(s);
}
