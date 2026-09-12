# Clonepart - a Rampart Clone

The aim of this project is to make a modernised clone of Rampart.

**This is a clean-sheet reimplementation.** No code, assets, or data from any
original Rampart release are used. All source and graphics here are written
from scratch, working only from our own understanding of the game's rules,
written up in `design/description.md`. Rampart is a trademark of its respective
owners; this project is not affiliated with or endorsed by them.

The original DOS release is *not* part of this repository (`dos_version/` is
git-ignored); if you own a copy you can drop it there to compare against in
DOSBox.

## Running

Requires Node 20+.

```sh
npm install
npm run dev      # dev server at http://localhost:5173
npm test         # rule tests (Vitest)
npm run check    # type-check
npm run build    # production build in dist/
```

## Controls

| Action                | Keys              |
| --------------------- | ----------------- |
| Move cursor           | Arrows / WASD     |
| Fast cursor           | Shift             |
| Select / place / fire | Space, Z, Enter   |
| Rotate piece          | X, Ctrl           |
| Skip cannon placement | C, Escape         |
| Difficulty (title)    | Left / Right      |

## Game loop (v1, single player)

`Castle select → Cannon placement → Battle → Build & repair → Resolve → …`

- Castle select: pick a home castle; it gets a starter wall.
- Cannon placement: 2 cannons for the home castle plus 1 per other enclosed castle. Cannons are 2×2 and must sit on owned land.
- Battle: ships anchor on the coast and bombard walls, cannons and castles. Aim with the cursor and fire; cannonballs take time to fly so lead your targets. Cannons fire in turn; a new volley waits until the last one lands. Troop carriers unload troops on the shore; flagships leave scorched, unbuildable tiles.
- Build: place Tetris-style pieces to close gaps and enclose more castles. Troops march during this phase; wall them in to eliminate them.
- Resolve: anything fully enclosed by wall *and* containing a castle becomes your territory. Cannons outside it are lost. No enclosed castle = game over. Survive the round count for the difficulty to win.

## Architecture

The simulation is headless, deterministic and driven by one `PlayerInput` per player per tick (`src/game/sim.ts`). Rendering (`src/render/`) only reads state; input (`src/engine/input.ts`) only produces commands. That split is what will let a second player (local or over the network) or an AI opponent plug in later without touching the rules.

```
src/engine/   rng, fixed-timestep loop, keyboard input
src/game/     rules: state, grid, territory flood-fill, pieces, phases/
src/render/   pixel-art renderer, 3x5 font, HUD (320x240 native, integer scaled)
tests/        Vitest rule tests incl. a determinism replay check
```

In the browser devtools `clonepart.state()`, `clonepart.advance(ticks, input)` and `clonepart.reset(seed, difficulty)` are available for poking at the sim.

## Roadmap

- Local two-player (river-divided maps)
- Network multiplayer (lockstep over WebSockets)
- AI opponent that plays like a human, with skill levels
- More battlefields, sprite-sheet art, sound
