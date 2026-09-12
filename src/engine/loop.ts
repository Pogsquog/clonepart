import { DT } from "../game/types";

/** Fixed-timestep simulation with render-on-animation-frame. */
export function startLoop(update: () => void, render: () => void): void {
  let acc = 0;
  let last = performance.now();
  const frame = (now: number) => {
    acc += Math.min(0.25, (now - last) / 1000);
    last = now;
    while (acc >= DT) {
      update();
      acc -= DT;
    }
    render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
