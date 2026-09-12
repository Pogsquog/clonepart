import { GameState } from "./state";
import { Phase, PlayerInput } from "./types";
import { updateBattle } from "./phases/battle";
import { updateBuild, updateResolve } from "./phases/build";
import { updateCannonPlace } from "./phases/cannonPlace";
import { enterCastleSelect, updateCastleSelect } from "./phases/castleSelect";

/**
 * Advance the simulation by exactly one tick. Pure with respect to the outside
 * world: only `state` and `inputs` matter, so replays and lockstep netplay work.
 */
export function step(s: GameState, inputs: readonly PlayerInput[]): void {
  s.tick++;
  if (s.timer > 0) s.timer--;
  if (s.bannerTicks > 0) s.bannerTicks--;
  const inp = inputs.find((i) => i.player === 1) ?? { player: 1 as const, dx: 0, dy: 0, fast: false, action: false, rotate: false, cancel: false };

  switch (s.phase) {
    case Phase.Title:
      if (inp.action) startGame(s);
      break;
    case Phase.CastleSelect:
      updateCastleSelect(s, inp);
      break;
    case Phase.CannonPlace:
      updateCannonPlace(s, inp);
      break;
    case Phase.Battle:
      updateBattle(s, inp);
      break;
    case Phase.Build:
      updateBuild(s, inp);
      break;
    case Phase.Resolve:
      updateResolve(s);
      break;
    case Phase.GameOver:
    case Phase.Victory:
      break;
  }
}

export function startGame(s: GameState): void {
  enterCastleSelect(s);
}
