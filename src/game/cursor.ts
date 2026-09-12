import { CURSOR_REPEAT_DELAY, CURSOR_REPEAT_RATE } from "./config";
import { PlayerState } from "./state";
import { GRID_H, GRID_W, PlayerInput } from "./types";

/**
 * Move an integer cursor one tile per press, with key repeat on hold.
 * `w`/`h` is the footprint so the cursor stays inside the grid.
 */
export function stepCursor(p: PlayerState, inp: PlayerInput, w = 1, h = 1): void {
  const r = p.repeat;
  const same = r.dx === inp.dx && r.dy === inp.dy;
  if (!same) {
    r.dx = inp.dx;
    r.dy = inp.dy;
    r.held = 0;
  }
  const moving = inp.dx !== 0 || inp.dy !== 0;
  if (!moving) return;
  const delay = inp.fast ? CURSOR_REPEAT_RATE : CURSOR_REPEAT_DELAY;
  const fire = r.held === 0 || (r.held >= delay && (r.held - delay) % CURSOR_REPEAT_RATE === 0);
  r.held++;
  if (!fire) return;
  p.cursor.x = Math.max(0, Math.min(GRID_W - w, Math.round(p.cursor.x) + inp.dx));
  p.cursor.y = Math.max(0, Math.min(GRID_H - h, Math.round(p.cursor.y) + inp.dy));
}

export function snapCursor(p: PlayerState): void {
  p.cursor.x = Math.round(p.cursor.x);
  p.cursor.y = Math.round(p.cursor.y);
}
