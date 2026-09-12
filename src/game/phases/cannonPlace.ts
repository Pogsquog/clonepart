import { DIFFICULTY } from "../config";
import { stepCursor } from "../cursor";
import { canPlaceCannon, placeCannon } from "../entities";
import { CANNON_SIZE } from "../grid";
import { GameState, setBanner } from "../state";
import { Phase, PlayerInput, TICK_RATE } from "../types";
import { enterBattle } from "./battle";

export function enterCannonPlace(s: GameState): void {
  s.phase = Phase.CannonPlace;
  const cfg = DIFFICULTY[s.difficulty];
  s.timer = cfg.cannonPlaceSeconds * TICK_RATE;
  const p = s.players[0]!;
  let granted = 0;
  for (const c of s.castles) if (c.owner === p.id) granted += c.isHome ? 2 : 1;
  if (s.round === 0) granted += cfg.firstRoundBonusCannons;
  p.cannonsToPlace = granted;
  const home = s.castles[p.homeCastle]!;
  p.cursor.x = home.x + 1;
  p.cursor.y = home.y + 3;
  p.repeat = { dx: 0, dy: 0, held: 0 };
  setBanner(s, "PLACE CANNONS");
}

export function updateCannonPlace(s: GameState, inp: PlayerInput): void {
  const p = s.players[0]!;
  stepCursor(p, inp, CANNON_SIZE, CANNON_SIZE);
  if (inp.action && p.cannonsToPlace > 0) {
    const x = Math.round(p.cursor.x);
    const y = Math.round(p.cursor.y);
    if (canPlaceCannon(s, p.id, x, y)) {
      placeCannon(s, p.id, x, y);
      p.cannonsToPlace--;
    }
  }
  if (inp.cancel) p.cannonsToPlace = 0;
  if (p.cannonsToPlace <= 0 || s.timer <= 0) enterBattle(s);
}
