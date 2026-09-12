import { PlayerInput } from "./types";

/** Convenience for tests/AI: build an input with only the named fields set. */
export function input(partial: Partial<PlayerInput> & { player: 1 | 2 }): PlayerInput {
  return {
    dx: 0,
    dy: 0,
    fast: false,
    action: false,
    rotate: false,
    cancel: false,
    ...partial,
  };
}
