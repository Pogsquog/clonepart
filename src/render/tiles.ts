import { TILE } from "../game/types";

/** Palette leaning on the Mega Drive look: saturated, few shades. */
export const PAL = {
  waterA: "#1848c8",
  waterB: "#2860e0",
  waterFoam: "#a0c8ff",
  landA: "#38b048",
  landB: "#48c858",
  sand: "#d8c070",
  sandDark: "#b09850",
  ownedA: "#2838a0",
  ownedB: "#101860",
  wallFill: "#a8a8a8",
  wallLight: "#e8e8e8",
  wallDark: "#505050",
  wallMortar: "#787878",
  castle: "#c8c8c8",
  castleDark: "#707070",
  castleRoof: "#c02020",
  castleFlag: "#f0d020",
  cannon: "#303030",
  cannonWheel: "#805020",
  cannonDisabled: "#704040",
  scorched: "#201008",
  crater: "#183018",
  hull: "#704020",
  hullDark: "#402010",
  sail: "#f0f0f0",
  sailRed: "#e02020",
  sailBlue: "#3060e0",
  troop: "#f0e0c0",
  troopDark: "#802020",
  hud: "#101010",
  hudText: "#f0f0f0",
  hudGold: "#f0d020",
  cursor: "#ffffff",
  cursorBad: "#ff3030",
  cursorGood: "#40ff60",
  ball: "#101010",
  fire: "#ff8000",
  fireHot: "#ffe040",
};

type Ctx = CanvasRenderingContext2D;

export function drawWater(ctx: Ctx, px: number, py: number, tx: number, ty: number, tick: number): void {
  ctx.fillStyle = (tx + ty) & 1 ? PAL.waterA : PAL.waterB;
  ctx.fillRect(px, py, TILE, TILE);
  // A drifting foam fleck on a subset of tiles.
  const phase = (tx * 7 + ty * 13 + (tick >> 4)) % 11;
  if (phase < 2) {
    ctx.fillStyle = PAL.waterFoam;
    ctx.fillRect(px + 2 + phase * 2, py + 3 + ((tx + ty) & 1) * 2, 3, 1);
  }
}

export function drawLand(ctx: Ctx, px: number, py: number, tx: number, ty: number, owner: number): void {
  const odd = (tx + ty) & 1;
  if (owner) ctx.fillStyle = odd ? PAL.ownedA : PAL.ownedB;
  else ctx.fillStyle = odd ? PAL.landA : PAL.landB;
  ctx.fillRect(px, py, TILE, TILE);
}

export function drawShore(ctx: Ctx, px: number, py: number, waterL: boolean, waterR: boolean, waterU: boolean, waterD: boolean): void {
  ctx.fillStyle = PAL.sand;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = PAL.sandDark;
  if (waterL) ctx.fillRect(px, py, 1, TILE);
  if (waterR) ctx.fillRect(px + TILE - 1, py, 1, TILE);
  if (waterU) ctx.fillRect(px, py, TILE, 1);
  if (waterD) ctx.fillRect(px, py + TILE - 1, TILE, 1);
}

export function drawWall(ctx: Ctx, px: number, py: number): void {
  ctx.fillStyle = PAL.wallFill;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = PAL.wallLight;
  ctx.fillRect(px, py, TILE, 1);
  ctx.fillRect(px, py, 1, TILE);
  ctx.fillStyle = PAL.wallDark;
  ctx.fillRect(px, py + TILE - 1, TILE, 1);
  ctx.fillRect(px + TILE - 1, py, 1, TILE);
  ctx.fillStyle = PAL.wallMortar;
  ctx.fillRect(px + 1, py + 4, TILE - 2, 1);
  ctx.fillRect(px + 4, py + 1, 1, 3);
  ctx.fillRect(px + 2, py + 5, 1, 2);
  ctx.fillRect(px + 6, py + 5, 1, 2);
}

/** Castle drawn as one 24x24 sprite at its top-left tile. */
export function drawCastle(ctx: Ctx, px: number, py: number, owned: boolean, tick: number): void {
  const s = TILE * 3;
  ctx.fillStyle = PAL.castleDark;
  ctx.fillRect(px + 1, py + 6, s - 2, s - 7);
  ctx.fillStyle = PAL.castle;
  ctx.fillRect(px + 2, py + 7, s - 4, s - 9);
  // Battlements along the top.
  for (let i = 0; i < s; i += 4) {
    ctx.fillStyle = i % 8 === 0 ? PAL.castle : PAL.castleDark;
    ctx.fillRect(px + i, py + 4, 4, 3);
  }
  // Corner towers.
  ctx.fillStyle = PAL.castleDark;
  ctx.fillRect(px, py + 2, 5, s - 2);
  ctx.fillRect(px + s - 5, py + 2, 5, s - 2);
  ctx.fillStyle = PAL.castle;
  ctx.fillRect(px + 1, py + 3, 3, s - 4);
  ctx.fillRect(px + s - 4, py + 3, 3, s - 4);
  // Keep with a roof and a gate.
  ctx.fillStyle = PAL.castleDark;
  ctx.fillRect(px + 8, py + 8, 8, 12);
  ctx.fillStyle = PAL.castleRoof;
  ctx.fillRect(px + 7, py + 6, 10, 3);
  ctx.fillRect(px + 9, py + 4, 6, 2);
  ctx.fillStyle = "#000000";
  ctx.fillRect(px + 10, py + s - 6, 4, 5);
  // Flag flutters when owned.
  if (owned) {
    ctx.fillStyle = PAL.castle;
    ctx.fillRect(px + 11, py, 1, 5);
    ctx.fillStyle = PAL.castleFlag;
    const w = (tick >> 3) & 1 ? 4 : 3;
    ctx.fillRect(px + 12, py, w, 3);
  }
}

/** Cannon drawn as one 16x16 sprite at its top-left tile. */
export function drawCannon(ctx: Ctx, px: number, py: number, disabled: boolean): void {
  ctx.fillStyle = PAL.cannonWheel;
  ctx.fillRect(px + 2, py + 9, 5, 5);
  ctx.fillRect(px + 9, py + 9, 5, 5);
  ctx.fillStyle = PAL.hullDark;
  ctx.fillRect(px + 4, py + 11, 1, 1);
  ctx.fillRect(px + 11, py + 11, 1, 1);
  ctx.fillStyle = disabled ? PAL.cannonDisabled : PAL.cannon;
  ctx.fillRect(px + 6, py + 4, 4, 9);
  ctx.fillRect(px + 5, py + 2, 6, 3);
  ctx.fillStyle = disabled ? "#a06060" : "#606060";
  ctx.fillRect(px + 7, py + 2, 2, 1);
  if (disabled) {
    ctx.fillStyle = PAL.fire;
    ctx.fillRect(px + 6, py + 5, 1, 1);
    ctx.fillRect(px + 9, py + 7, 1, 1);
  }
}

export function drawScorched(ctx: Ctx, px: number, py: number): void {
  ctx.fillStyle = PAL.scorched;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = "#402010";
  ctx.fillRect(px + 2, py + 2, 2, 1);
  ctx.fillRect(px + 5, py + 5, 2, 1);
}

export function drawCrater(ctx: Ctx, px: number, py: number): void {
  ctx.fillStyle = PAL.crater;
  ctx.fillRect(px + 2, py + 1, 4, 6);
  ctx.fillRect(px + 1, py + 2, 6, 4);
  ctx.fillStyle = "#284828";
  ctx.fillRect(px + 3, py + 3, 2, 2);
}

export function drawTroop(ctx: Ctx, px: number, py: number, tick: number): void {
  const bob = (tick >> 4) & 1;
  ctx.fillStyle = PAL.troop;
  ctx.fillRect(px + 3, py + 1 + bob, 2, 2);
  ctx.fillStyle = PAL.troopDark;
  ctx.fillRect(px + 2, py + 3 + bob, 4, 3);
  ctx.fillStyle = PAL.cannon;
  ctx.fillRect(px + 2, py + 6, 1, 2 - bob);
  ctx.fillRect(px + 5, py + 6, 1, 2 - bob);
}

/** Ship sprite centred on (cx, cy) pixels; `facing` -1 = left, 1 = right. */
export function drawShip(ctx: Ctx, cx: number, cy: number, kind: "gunship" | "carrier" | "flagship", facing: number, sinking: number, tick: number): void {
  const big = kind === "carrier";
  const w = big ? 18 : 14;
  const h = big ? 6 : 5;
  const x = Math.round(cx - w / 2);
  const bobY = sinking > 0 ? Math.round((45 - sinking) / 6) : (tick >> 4) & 1;
  const y = Math.round(cy - h / 2) + bobY;
  ctx.fillStyle = PAL.hullDark;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = PAL.hull;
  ctx.fillRect(x + 1, y, w - 2, h - 2);
  // Bow points along `facing`.
  ctx.fillStyle = PAL.hullDark;
  if (facing > 0) ctx.fillRect(x + w, y + 1, 2, h - 2);
  else ctx.fillRect(x - 2, y + 1, 2, h - 2);
  if (sinking > 0) {
    ctx.fillStyle = PAL.waterFoam;
    ctx.fillRect(x - 1, y + h - 1, w + 2, 1);
    return;
  }
  // Mast and sail.
  const mastX = x + Math.round(w / 2);
  ctx.fillStyle = PAL.hullDark;
  ctx.fillRect(mastX, y - 9, 1, 9);
  ctx.fillStyle = kind === "flagship" ? PAL.sailRed : kind === "carrier" ? PAL.sailBlue : PAL.sail;
  ctx.fillRect(mastX - 4, y - 8, 8, big ? 7 : 6);
  if (big) {
    ctx.fillRect(mastX - 8, y - 6, 4, 5);
    ctx.fillRect(mastX + 4, y - 6, 4, 5);
  }
  if (kind === "flagship") {
    ctx.fillStyle = PAL.castleFlag;
    ctx.fillRect(mastX + 1, y - 11, 4, 2);
  }
}

export function drawExplosion(ctx: Ctx, cx: number, cy: number, ticks: number): void {
  const age = 18 - ticks;
  const r = Math.min(6, 1 + age * 0.6);
  ctx.fillStyle = age < 6 ? PAL.fireHot : PAL.fire;
  ctx.fillRect(Math.round(cx - r), Math.round(cy - r / 2), Math.round(r * 2), Math.round(r));
  ctx.fillRect(Math.round(cx - r / 2), Math.round(cy - r), Math.round(r), Math.round(r * 2));
  if (age > 10) {
    ctx.fillStyle = "#404040";
    ctx.fillRect(Math.round(cx - 1), Math.round(cy - r - 2), 2, 2);
  }
}
