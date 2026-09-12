import {
  BALL_MIN_TICKS,
  BALL_SPEED,
  BLAST_RADIUS,
  CANNON_RELOAD_TICKS,
  CURSOR_FAST_MULT,
  CURSOR_SPEED,
  DIFFICULTY,
  ENEMY_SCATTER,
  SCORCH_ROUNDS,
  SCORE,
  SHIP_STATS,
} from "../config";
import { cannonAt, dist, removeCannon } from "../entities";
import { coastWaterTiles, idx, inBounds, isWater } from "../grid";
import { Cannonball, GameState, Ship, ShipKind, newId, setBanner } from "../state";
import { DT, GRID_H, GRID_W, Phase, PlayerInput, TICK_RATE, Tile } from "../types";
import { enterBuild } from "./build";

export function enterBattle(s: GameState): void {
  s.phase = Phase.Battle;
  const cfg = DIFFICULTY[s.difficulty];
  s.timer = cfg.battleSeconds * TICK_RATE;
  const p = s.players[0]!;
  p.nextCannon = 0;
  for (const c of s.cannons) c.cooldown = 0;
  spawnFleet(s, cfg.shipsBase + cfg.shipsPerRound * s.round);
  setBanner(s, "BATTLE!");
}

function shipKindsForRound(s: GameState, n: number): ShipKind[] {
  const kinds: ShipKind[] = [];
  for (let i = 0; i < n; i++) {
    const r = s.rng.next();
    if (s.round >= 2 && r < 0.2) kinds.push("flagship");
    else if (s.round >= 1 && r < 0.5) kinds.push("carrier");
    else kinds.push("gunship");
  }
  return kinds;
}

function spawnFleet(s: GameState, count: number): void {
  const p = s.players[0]!;
  const home = s.castles[p.homeCastle]!;
  // Anchor points: coast water tiles, biased toward the player's home.
  const coast = coastWaterTiles(s.tiles)
    .map((t) => ({ ...t, d: dist(t.x, t.y, home.x, home.y) }))
    .sort((a, b) => a.d - b.d);
  const candidates = coast.slice(0, Math.max(10, Math.min(coast.length, 8 + count * 4)));
  // Spawn points: deep water on the map border.
  const spawns: { x: number; y: number }[] = [];
  for (let x = 0; x < GRID_W; x++) if (isWater(s.tiles, x, 0) && isWater(s.tiles, x, 2)) spawns.push({ x, y: 0 });
  for (let y = 0; y < GRID_H; y++) if (isWater(s.tiles, 0, y) && isWater(s.tiles, 2, y)) spawns.push({ x: 0, y });
  if (!spawns.length) spawns.push({ x: 0, y: 0 });

  for (const kind of shipKindsForRound(s, count)) {
    const st = SHIP_STATS[kind];
    const sp = s.rng.pick(spawns);
    // Spread the fleet out: don't anchor two ships on the same tile if we can help it.
    let target = s.rng.pick(candidates);
    for (let tries = 0; tries < 8 && s.ships.some((o) => o.target.x === target.x + 0.5 && o.target.y === target.y + 0.5); tries++)
      target = s.rng.pick(candidates);
    const ship: Ship = {
      id: newId(s),
      kind,
      x: sp.x + 0.5,
      y: sp.y + 0.5,
      hp: st.hp,
      target: { x: target.x + 0.5, y: target.y + 0.5 },
      anchored: false,
      fireCooldown: st.fireTicks + s.rng.int(60),
      troops: st.troops,
      sinking: 0,
    };
    s.ships.push(ship);
  }
}

export function updateBattle(s: GameState, inp: PlayerInput): void {
  const p = s.players[0]!;
  const speed = CURSOR_SPEED * (inp.fast ? CURSOR_FAST_MULT : 1) * DT;
  p.cursor.x = Math.max(0, Math.min(GRID_W - 0.01, p.cursor.x + inp.dx * speed));
  p.cursor.y = Math.max(0, Math.min(GRID_H - 0.01, p.cursor.y + inp.dy * speed));

  if (inp.action) tryFire(s);

  for (const c of s.cannons) if (c.cooldown > 0) c.cooldown--;
  updateShips(s);
  updateBalls(s);
  updateExplosions(s);

  if (s.timer <= 0) {
    s.ships = [];
    s.balls = [];
    s.explosions = [];
    enterBuild(s);
  }
}

function tryFire(s: GameState): void {
  const p = s.players[0]!;
  const ready = s.cannons.filter((c) => c.owner === p.id && c.hp >= 2);
  if (!ready.length) return;
  // A volley is fired cannon by cannon; the next volley waits for all balls to land.
  if (p.nextCannon >= ready.length) {
    if (s.balls.some((b) => b.owner === p.id)) return;
    p.nextCannon = 0;
  }
  const c = ready[p.nextCannon]!;
  if (c.cooldown > 0) return;
  c.cooldown = CANNON_RELOAD_TICKS;
  p.nextCannon++;
  const from = { x: c.x + 1, y: c.y + 1 };
  const to = { x: p.cursor.x, y: p.cursor.y };
  fireBall(s, p.id, from, to, false);
}

export function fireBall(s: GameState, owner: 0 | 1 | 2, from: { x: number; y: number }, to: { x: number; y: number }, flaming: boolean): void {
  const d = dist(from.x, from.y, to.x, to.y);
  const ball: Cannonball = {
    id: newId(s),
    owner,
    from: { ...from },
    to: { ...to },
    t: 0,
    duration: Math.max(BALL_MIN_TICKS, Math.round((d / BALL_SPEED) * TICK_RATE)),
    flaming,
  };
  s.balls.push(ball);
}

function updateShips(s: GameState): void {
  for (const ship of s.ships) {
    if (ship.sinking > 0) {
      ship.sinking--;
      continue;
    }
    const st = SHIP_STATS[ship.kind];
    if (!ship.anchored) {
      const dx = ship.target.x - ship.x;
      const dy = ship.target.y - ship.y;
      const d = Math.hypot(dx, dy);
      const step = st.speed * DT;
      if (d <= step) {
        ship.x = ship.target.x;
        ship.y = ship.target.y;
        ship.anchored = true;
      } else {
        const nx = ship.x + (dx / d) * step;
        const ny = ship.y + (dy / d) * step;
        // Never sail onto land; anchor where we are if the next tile is land.
        if (isWater(s.tiles, Math.floor(nx), Math.floor(ny))) {
          ship.x = nx;
          ship.y = ny;
        } else {
          ship.anchored = true;
        }
      }
    }
    if (ship.fireCooldown > 0) ship.fireCooldown--;
    const inRange = ship.anchored || dist(ship.x, ship.y, ship.target.x, ship.target.y) < 6;
    if (inRange && ship.fireCooldown === 0) {
      const target = pickEnemyTarget(s, ship);
      if (target) {
        const aim = {
          x: target.x + 0.5 + (s.rng.next() * 2 - 1) * ENEMY_SCATTER,
          y: target.y + 0.5 + (s.rng.next() * 2 - 1) * ENEMY_SCATTER,
        };
        fireBall(s, 0, { x: ship.x, y: ship.y }, aim, st.flaming);
        ship.fireCooldown = st.fireTicks + s.rng.int(30);
      }
    }
    if (ship.anchored && ship.troops > 0 && s.tick % 90 === 0) unloadTroop(s, ship);
  }
  s.ships = s.ships.filter((sh) => !(sh.sinking === 0 && sh.hp <= 0));
}

function pickEnemyTarget(s: GameState, ship: Ship): { x: number; y: number } | null {
  const targets: { x: number; y: number; w: number }[] = [];
  for (let y = 0; y < GRID_H; y++)
    for (let x = 0; x < GRID_W; x++) {
      const t = s.tiles[idx(x, y)];
      if (t === Tile.Wall || t === Tile.Cannon || t === Tile.Castle) {
        const d = dist(x, y, ship.x, ship.y);
        const w = (t === Tile.Wall ? 4 : t === Tile.Cannon ? 1.5 : 0.5) / (1 + d * 0.15);
        targets.push({ x, y, w });
      }
    }
  if (!targets.length) return null;
  let total = 0;
  for (const t of targets) total += t.w;
  let r = s.rng.next() * total;
  for (const t of targets) {
    r -= t.w;
    if (r < 0) return t;
  }
  return targets[targets.length - 1]!;
}

function unloadTroop(s: GameState, ship: Ship): void {
  const cx = Math.floor(ship.x);
  const cy = Math.floor(ship.y);
  const spots: { x: number; y: number }[] = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (!inBounds(x, y) || s.tiles[idx(x, y)] !== Tile.Land) continue;
      if (s.troops.some((t) => t.x === x && t.y === y)) continue;
      spots.push({ x, y });
    }
  if (!spots.length) return;
  const spot = s.rng.pick(spots);
  s.troops.push({ id: newId(s), x: spot.x, y: spot.y, moveCooldown: 0 });
  ship.troops--;
}

function updateBalls(s: GameState): void {
  const landed: Cannonball[] = [];
  for (const b of s.balls) {
    b.t++;
    if (b.t >= b.duration) landed.push(b);
  }
  if (!landed.length) return;
  s.balls = s.balls.filter((b) => b.t < b.duration);
  for (const b of landed) impact(s, b);
}

function impact(s: GameState, b: Cannonball): void {
  const tx = Math.floor(b.to.x);
  const ty = Math.floor(b.to.y);
  s.explosions.push({ x: b.to.x, y: b.to.y, ticks: 18 });
  const p = s.players[0]!;

  // Ships and troops within the blast (player shots only; the fleet doesn't friendly-fire).
  if (b.owner !== 0) {
    for (const ship of s.ships) {
      if (ship.sinking > 0) continue;
      if (dist(ship.x, ship.y, b.to.x, b.to.y) <= BLAST_RADIUS) {
        ship.hp--;
        p.score += SCORE.shipHit;
        if (ship.hp <= 0) {
          ship.sinking = 45;
          p.score += SHIP_STATS[ship.kind].score;
        }
      }
    }
    const before = s.troops.length;
    s.troops = s.troops.filter((t) => dist(t.x + 0.5, t.y + 0.5, b.to.x, b.to.y) > BLAST_RADIUS);
    p.score += (before - s.troops.length) * SCORE.troopKill;
  }

  if (!inBounds(tx, ty)) return;
  const i = idx(tx, ty);
  const tile = s.tiles[i];
  if (tile === Tile.Wall) {
    s.tiles[i] = Tile.Land;
    s.craters[i] = 1;
    if (b.flaming) {
      s.tiles[i] = Tile.Scorched;
      s.scorch[i] = SCORCH_ROUNDS;
    }
  } else if (tile === Tile.Land) {
    s.craters[i] = 1;
    if (b.flaming) {
      s.tiles[i] = Tile.Scorched;
      s.scorch[i] = SCORCH_ROUNDS;
    }
  } else if (tile === Tile.Cannon) {
    const c = cannonAt(s, tx, ty);
    if (c) {
      c.hp--;
      if (c.hp <= 0) removeCannon(s, c);
    }
  }
}

function updateExplosions(s: GameState): void {
  for (const e of s.explosions) e.ticks--;
  s.explosions = s.explosions.filter((e) => e.ticks > 0);
}

export function ballPosition(b: Cannonball): { x: number; y: number; h: number } {
  const f = b.t / b.duration;
  const x = b.from.x + (b.to.x - b.from.x) * f;
  const y = b.from.y + (b.to.y - b.from.y) * f;
  const d = dist(b.from.x, b.from.y, b.to.x, b.to.y);
  const h = 4 * f * (1 - f) * Math.min(3, d * 0.25); // arc height in tiles
  return { x, y, h };
}
