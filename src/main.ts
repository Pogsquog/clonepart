import { KeyboardInput } from "./engine/input";
import { startLoop } from "./engine/loop";
import { step } from "./game/sim";
import { createGame, GameState } from "./game/state";
import { Difficulty, NO_INPUT, Phase, PlayerInput } from "./game/types";
import { Renderer } from "./render/renderer";

const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

const canvas = document.getElementById("game") as HTMLCanvasElement;
const renderer = new Renderer(canvas);
const input = new KeyboardInput(1);

let difficulty: Difficulty = "normal";
let state: GameState = createGame(Date.now() >>> 0, difficulty);

startLoop(
  () => {
    const inp = input.poll();
    if (state.phase === Phase.Title) {
      const taps = input.menuTaps();
      let i = DIFFICULTIES.indexOf(difficulty);
      if (taps.left) i = (i + DIFFICULTIES.length - 1) % DIFFICULTIES.length;
      if (taps.right) i = (i + 1) % DIFFICULTIES.length;
      difficulty = DIFFICULTIES[i]!;
      state.difficulty = difficulty;
      state.roundsToWin = createGame(0, difficulty).roundsToWin;
    } else if ((state.phase === Phase.GameOver || state.phase === Phase.Victory) && inp.action) {
      state = createGame(Date.now() >>> 0, difficulty);
      input.menuTaps();
      return;
    } else {
      input.menuTaps();
    }
    step(state, [inp]);
  },
  () => renderer.render(state),
);

// Devtools hook: inspect state, or advance the sim by hand with a fixed input.
(window as unknown as { clonepart: unknown }).clonepart = {
  state: () => state,
  advance(ticks: number, inp: Partial<PlayerInput> = {}) {
    for (let i = 0; i < ticks; i++) step(state, [{ ...NO_INPUT(1), ...inp }]);
  },
  reset(seed: number, d: Difficulty = difficulty) {
    difficulty = d;
    state = createGame(seed, d);
  },
};
