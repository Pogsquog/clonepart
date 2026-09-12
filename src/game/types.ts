export const TILE = 8;
export const GRID_W = 40;
export const GRID_H = 28;
export const HUD_H = 16;
export const NATIVE_W = GRID_W * TILE; // 320
export const NATIVE_H = GRID_H * TILE + HUD_H; // 240

export const TICK_RATE = 60;
export const DT = 1 / TICK_RATE;

export enum Tile {
  Water = 0,
  Land = 1,
  Wall = 2,
  Castle = 3,
  Cannon = 4,
  Scorched = 5,
}

export type PlayerId = 1 | 2;

export enum Phase {
  Title = "title",
  CastleSelect = "castleSelect",
  CannonPlace = "cannonPlace",
  Battle = "battle",
  Build = "build",
  Resolve = "resolve",
  GameOver = "gameOver",
  Victory = "victory",
}

export type Difficulty = "easy" | "normal" | "hard";

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * One command per player per tick. Produced by keyboard/gamepad input now,
 * by AI or a network peer later. dx/dy are held-direction (-1,0,1);
 * action/rotate/cancel are edge-triggered presses.
 */
export interface PlayerInput {
  player: PlayerId;
  dx: number;
  dy: number;
  fast: boolean;
  action: boolean;
  rotate: boolean;
  cancel: boolean;
}

export const NO_INPUT = (player: PlayerId): PlayerInput => ({
  player,
  dx: 0,
  dy: 0,
  fast: false,
  action: false,
  rotate: false,
  cancel: false,
});
