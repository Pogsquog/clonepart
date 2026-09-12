import { describe, expect, it } from "vitest";
import { input } from "../src/game/commands";
import { canPlaceCannon } from "../src/game/entities";
import { CANNON_SIZE, idx } from "../src/game/grid";
import { chooseCastle } from "../src/game/phases/castleSelect";
import { startGame, step } from "../src/game/sim";
import { createGame, GameState } from "../src/game/state";
import { Phase, PlayerInput, Tile } from "../src/game/types";

function run(s: GameState, ticks: number, inp: PlayerInput = input({ player: 1 })) {
  for (let i = 0; i < ticks; i++) step(s, [inp]);
}

function snapshot(s: GameState): string {
  return JSON.stringify({
    phase: s.phase,
    tick: s.tick,
    tiles: Array.from(s.tiles),
    owner: Array.from(s.owner),
    cannons: s.cannons,
    ships: s.ships,
    troops: s.troops,
    balls: s.balls,
    players: s.players,
    round: s.round,
    rngSeed: s.rng.seed,
  });
}

describe("sim", () => {
  it("choosing a castle builds a wall ring and claims it, then grants cannons", () => {
    const s = createGame(1, "normal");
    startGame(s);
    expect(s.phase).toBe(Phase.CastleSelect);
    chooseCastle(s, 0);
    expect(s.phase).toBe(Phase.CannonPlace);
    const c = s.castles[0]!;
    expect(c.owner).toBe(1);
    expect(s.tiles[idx(c.x - 3, c.y - 3)]).toBe(Tile.Wall);
    expect(s.owner[idx(c.x - 1, c.y - 1)]).toBe(1);
    expect(s.players[0]!.cannonsToPlace).toBe(2); // home castle grants 2
    // The 2x2 just below the castle is inside the ring and free.
    expect(canPlaceCannon(s, 1, c.x, c.y + 3)).toBe(true);
    expect(canPlaceCannon(s, 1, c.x - 3, c.y)).toBe(false); // on the wall
  });

  it("placing all cannons moves to battle, and cannons occupy tiles", () => {
    const s = createGame(1, "normal");
    startGame(s);
    chooseCastle(s, 0);
    const p = s.players[0]!;
    const c = s.castles[0]!;
    p.cursor = { x: c.x - 1, y: c.y + 3 };
    step(s, [input({ player: 1, action: true })]);
    expect(s.cannons.length).toBe(1);
    expect(s.tiles[idx(c.x - 1, c.y + 3)]).toBe(Tile.Cannon);
    expect(s.tiles[idx(c.x, c.y + 4)]).toBe(Tile.Cannon);
    // Same spot again is rejected.
    step(s, [input({ player: 1, action: true })]);
    expect(s.cannons.length).toBe(1);
    p.cursor = { x: c.x + 1, y: c.y + 3 };
    step(s, [input({ player: 1, action: true })]);
    expect(s.cannons.length).toBe(2);
    expect(s.phase).toBe(Phase.Battle);
    expect(s.ships.length).toBeGreaterThan(0);
    expect(CANNON_SIZE).toBe(2);
  });

  it("a full round cycles Battle -> Build -> Resolve -> CannonPlace when the wall holds", () => {
    const s = createGame(7, "easy");
    startGame(s);
    chooseCastle(s, 0);
    run(s, 1, input({ player: 1, cancel: true }));
    expect(s.phase).toBe(Phase.Battle);
    s.ships = []; // no bombardment: the ring must survive
    run(s, s.timer + 1);
    expect(s.phase).toBe(Phase.Build);
    run(s, s.timer + 1);
    expect(s.phase).toBe(Phase.Resolve);
    run(s, s.timer + 1);
    expect(s.phase).toBe(Phase.CannonPlace);
    expect(s.round).toBe(1);
    expect(s.castles[0]!.owner).toBe(1);
  });

  it("game over when no castle is enclosed after build", () => {
    const s = createGame(7, "easy");
    startGame(s);
    chooseCastle(s, 0);
    run(s, 1, input({ player: 1, cancel: true }));
    s.ships = [];
    run(s, s.timer + 1);
    const c = s.castles[0]!;
    s.tiles[idx(c.x - 3, c.y)] = Tile.Land; // breach the ring
    run(s, s.timer + 1);
    expect(s.phase).toBe(Phase.GameOver);
  });

  it("is deterministic: same seed and inputs produce identical states", () => {
    const play = () => {
      const s = createGame(1234, "normal");
      startGame(s);
      const pattern = (i: number) =>
        input({ player: 1, dx: (i % 7) - 3 > 0 ? 1 : -1, dy: i % 5 === 0 ? 1 : 0, action: i % 9 === 0, rotate: i % 13 === 0 });
      for (let i = 0; i < 60 * 90; i++) step(s, [pattern(i)]);
      return snapshot(s);
    };
    expect(play()).toBe(play());
  });
});
