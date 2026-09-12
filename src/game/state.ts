import { Rng } from "../engine/rng";
import { Castle, parseMap } from "./grid";
import { MAP1 } from "./maps/map1";
import { Difficulty, GRID_H, GRID_W, Phase, PlayerId, Vec2 } from "./types";

export interface Cannon {
  id: number;
  owner: PlayerId;
  /** Top-left of 2x2 footprint. */
  x: number;
  y: number;
  /** 2 = healthy, 1 = disabled (can't fire), 0 = destroyed (removed). */
  hp: number;
  /** Ticks until this cannon may fire again. */
  cooldown: number;
}

export type ShipKind = "gunship" | "carrier" | "flagship";

export interface Ship {
  id: number;
  kind: ShipKind;
  /** Centre position in tile units (float). */
  x: number;
  y: number;
  hp: number;
  /** Anchor point on the coast this ship sails toward. */
  target: Vec2;
  anchored: boolean;
  fireCooldown: number;
  /** Carrier only: troops left to unload. */
  troops: number;
  /** Sink animation ticks remaining; ship removed when it hits 0. */
  sinking: number;
}

export interface Troop {
  id: number;
  x: number;
  y: number;
  moveCooldown: number;
}

export interface Cannonball {
  id: number;
  owner: 0 | PlayerId; // 0 = enemy fleet
  from: Vec2;
  to: Vec2;
  t: number;
  duration: number;
  flaming: boolean;
}

export interface Explosion {
  x: number;
  y: number;
  ticks: number;
}

export interface Piece {
  /** Cells relative to origin, in the current rotation. */
  cells: Vec2[];
  shapeIndex: number;
  rotation: number;
}

export interface PlayerState {
  id: PlayerId;
  score: number;
  /** Cursor in tile units; fractional in Battle, integer elsewhere. */
  cursor: Vec2;
  cannonsToPlace: number;
  piece: Piece | null;
  /** Index into the volley: the next cannon to fire. */
  nextCannon: number;
  /** Castle id chosen at CastleSelect, -1 before then. */
  homeCastle: number;
  alive: boolean;
  /** Key-repeat bookkeeping for grid-stepping phases. */
  repeat: { dx: number; dy: number; held: number };
}

export interface GameState {
  seed: number;
  rng: Rng;
  difficulty: Difficulty;
  phase: Phase;
  /** Ticks left in the current timed phase. */
  timer: number;
  round: number;
  roundsToWin: number;
  tick: number;

  tiles: Uint8Array;
  /** 0 = unclaimed, else PlayerId. */
  owner: Uint8Array;
  /** Rounds a Scorched tile stays unbuildable. 0 when not scorched. */
  scorch: Uint8Array;
  /** Visual-only crater markers, cleared at the start of Build. */
  craters: Uint8Array;
  castles: Castle[];
  cannons: Cannon[];
  ships: Ship[];
  troops: Troop[];
  balls: Cannonball[];
  explosions: Explosion[];
  players: PlayerState[];
  nextId: number;
  /** Short message shown by the HUD (e.g. phase banner). */
  banner: string;
  bannerTicks: number;
  /** In CastleSelect: index of the highlighted castle. */
  selectedCastle: number;
}

export function createPlayer(id: PlayerId): PlayerState {
  return {
    id,
    score: 0,
    cursor: { x: GRID_W / 2, y: GRID_H / 2 },
    cannonsToPlace: 0,
    piece: null,
    nextCannon: 0,
    homeCastle: -1,
    alive: true,
    repeat: { dx: 0, dy: 0, held: 0 },
  };
}

export function createGame(seed: number, difficulty: Difficulty, rows: readonly string[] = MAP1): GameState {
  const { tiles, castles } = parseMap(rows);
  const n = GRID_W * GRID_H;
  return {
    seed,
    rng: new Rng(seed),
    difficulty,
    phase: Phase.Title,
    timer: 0,
    round: 0,
    roundsToWin: difficulty === "easy" ? 4 : difficulty === "normal" ? 5 : 6,
    tick: 0,
    tiles,
    owner: new Uint8Array(n),
    scorch: new Uint8Array(n),
    craters: new Uint8Array(n),
    castles,
    cannons: [],
    ships: [],
    troops: [],
    balls: [],
    explosions: [],
    players: [createPlayer(1)],
    nextId: 1,
    banner: "",
    bannerTicks: 0,
    selectedCastle: 0,
  };
}

export function newId(s: GameState): number {
  return s.nextId++;
}

export function setBanner(s: GameState, text: string, seconds = 2): void {
  s.banner = text;
  s.bannerTicks = Math.round(seconds * 60);
}
