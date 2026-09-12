import { Difficulty } from "./types";

export interface DifficultyConfig {
  castleSelectSeconds: number;
  cannonPlaceSeconds: number;
  battleSeconds: number;
  buildSeconds: number;
  /** Ships in round r (0-based): base + perRound * r. */
  shipsBase: number;
  shipsPerRound: number;
  /** Extra cannons granted on the very first placement. */
  firstRoundBonusCannons: number;
}

export const DIFFICULTY: Record<Difficulty, DifficultyConfig> = {
  easy: {
    castleSelectSeconds: 10,
    cannonPlaceSeconds: 15,
    battleSeconds: 25,
    buildSeconds: 30,
    shipsBase: 2,
    shipsPerRound: 1,
    firstRoundBonusCannons: 2,
  },
  normal: {
    castleSelectSeconds: 8,
    cannonPlaceSeconds: 12,
    battleSeconds: 25,
    buildSeconds: 22,
    shipsBase: 2,
    shipsPerRound: 1,
    firstRoundBonusCannons: 0,
  },
  hard: {
    castleSelectSeconds: 6,
    cannonPlaceSeconds: 10,
    battleSeconds: 25,
    buildSeconds: 16,
    shipsBase: 3,
    shipsPerRound: 2,
    firstRoundBonusCannons: 0,
  },
};

export const CURSOR_SPEED = 8; // tiles per second in Battle
export const CURSOR_FAST_MULT = 2.2;
export const CURSOR_REPEAT_DELAY = 12; // ticks before key repeat in grid phases
export const CURSOR_REPEAT_RATE = 4; // ticks between repeats

export const BALL_SPEED = 9; // tiles per second
export const BALL_MIN_TICKS = 25;
export const BLAST_RADIUS = 1.1; // tiles
export const SCORCH_ROUNDS = 3;
export const CANNON_RELOAD_TICKS = 20;
/** Max random offset (tiles) applied to enemy aim. */
export const ENEMY_SCATTER = 0.9;

export const SHIP_STATS = {
  gunship: { hp: 2, speed: 3.2, fireTicks: 140, score: 300, troops: 0, flaming: false },
  carrier: { hp: 4, speed: 2.4, fireTicks: 200, score: 400, troops: 3, flaming: false },
  flagship: { hp: 3, speed: 4.5, fireTicks: 140, score: 600, troops: 0, flaming: true },
} as const;

export const TROOP_MOVE_TICKS = 40;

export const SCORE = {
  shipHit: 100,
  troopKill: 150,
  castleClaimed: 500,
  tileClaimed: 10,
  roundSurvived: 1000,
};
