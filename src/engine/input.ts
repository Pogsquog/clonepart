import { PlayerId, PlayerInput } from "../game/types";

/**
 * Keyboard -> PlayerInput. Direction keys are level-sensitive; action keys are
 * edge-triggered (one press yields exactly one `true`, consumed by `poll`).
 */
export class KeyboardInput {
  private held = new Set<string>();
  private pressed = new Set<string>();
  /** Keys released before the next poll; they still count as held for one tick. */
  private latched = new Set<string>();
  private pendingLeft = 0;
  private pendingRight = 0;

  constructor(private readonly player: PlayerId = 1) {
    window.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      this.held.add(e.code);
      this.pressed.add(e.code);
      if (e.code === "ArrowLeft") this.pendingLeft++;
      if (e.code === "ArrowRight") this.pendingRight++;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    });
    window.addEventListener("keyup", (e) => {
      if (this.held.has(e.code)) this.latched.add(e.code);
      this.held.delete(e.code);
    });
    window.addEventListener("blur", () => this.held.clear());
  }

  private any(...codes: string[]): boolean {
    return codes.some((c) => this.held.has(c) || this.latched.has(c));
  }

  private tap(...codes: string[]): boolean {
    let hit = false;
    for (const c of codes) if (this.pressed.delete(c)) hit = true;
    return hit;
  }

  /** Menu-only: left/right taps since last poll. */
  menuTaps(): { left: boolean; right: boolean } {
    const r = { left: this.pendingLeft > 0, right: this.pendingRight > 0 };
    this.pendingLeft = 0;
    this.pendingRight = 0;
    return r;
  }

  poll(): PlayerInput {
    const dx = (this.any("ArrowRight", "KeyD") ? 1 : 0) - (this.any("ArrowLeft", "KeyA") ? 1 : 0);
    const dy = (this.any("ArrowDown", "KeyS") ? 1 : 0) - (this.any("ArrowUp", "KeyW") ? 1 : 0);
    const inp: PlayerInput = {
      player: this.player,
      dx,
      dy,
      fast: this.any("ShiftLeft", "ShiftRight"),
      action: this.tap("Space", "KeyZ", "Enter"),
      rotate: this.tap("KeyX", "ControlLeft", "ControlRight"),
      cancel: this.tap("KeyC", "Escape"),
    };
    this.pressed.clear();
    this.latched.clear();
    return inp;
  }
}
