# Clonepart design notes

Rampart (Atari Games, 1990) is a strategy/action hybrid: the player defends a
walled territory of castles and cannons, alternating between timed phases of
bombardment and repair. These notes describe the rules we are reproducing,
written from our own understanding of the game; they are the reference for the
implementation in `src/game/`.

## Core idea

The player owns whatever land is completely enclosed by wall and contains at
least one castle. Owning castles earns cannons; cannons must sit on owned land;
the enemy blows holes in the walls; the player must patch the holes with
awkward Tetris-style pieces before time runs out. Lose every enclosed castle and
the game is over.

The tension comes from the repair phase: damage is scattered, pieces are usually
bigger than the gaps, and every misfit piece leaves rubble that blocks future
placements. The board gets progressively harder to fix.

## Phase cycle

```
Castle select  →  Cannon placement  →  Battle  →  Build & repair  →  Resolve
                        ↑                                                │
                        └────────────────────────────────────────────────┘
```

Every phase except Resolve is timed. Difficulty shortens the timers and
enlarges the enemy fleet.

### Castle select

At the start of a battle the player picks one castle on the map to be their
home. The game builds a starter wall around it automatically. Where the home
sits matters: it determines how far cannon shots must travel to reach the coast.

In two-player games a river divides the map and each player may only pick a
castle on their own side.

### Cannon placement

The player places cannons anywhere on owned land. Each cannon is 2×2 tiles and
cannot overlap a wall, castle, troop, or another cannon.

Cannons granted per round: 2 for the home castle plus 1 for every other
enclosed castle (subject to available space). The phase ends when all cannons
are placed, the timer expires, or the player elects to skip.

### Battle

Single player: a fleet sails in from open water, anchors along the coast and
bombards walls, cannons and castles. Two player: the players bombard each
other's territory directly.

- The player moves a targeting cursor and fires; cannons fire one at a time in
  sequence. A fresh volley cannot start until every shot from the previous
  volley has landed.
- Cannonballs are slow enough that moving targets must be led.
- One hit destroys a wall tile. Cannons are disabled by one hit and destroyed
  by a second. Castles are not destroyed but attract fire.
- The player can shoot their own walls to clear awkward rubble before the
  build phase.
- Points are awarded per hit and per ship sunk. The phase ends on the timer.

#### Enemy units (single player)

| Unit          | Hits to sink | Behaviour |
| ------------- | ------------ | --------- |
| Gunship       | 2 | Fires quickly. The basic threat. |
| Troop carrier | 4 | Fires slowly; when anchored at a shore it unloads troops onto the land. |
| Flagship      | 3 | Fast, fires flaming shot. Wall destroyed by it becomes scorched and cannot be rebuilt on for several rounds. |
| Troop         | 1 | Land unit unloaded by carriers. Moves only during the build phase, marching inland toward castles. Occupies its tile so nothing can be built on it. Killed by cannon fire or by being walled in. |

More ships appear each round, and stronger types are introduced as the level
progresses.

### Build & repair

The player receives random wall pieces one at a time and places them with
move/rotate/drop. A piece can go anywhere on plain land — not on water,
castles, cannons, existing wall, troops, or scorched ground. Pieces keep coming
until the timer runs out.

Piece set: single blocks are rare; most pieces are 3–4 tiles in tetromino-like
shapes, plus a few larger 5-tile shapes. Rotation is 90° clockwise.

Goals in this phase, in rough priority:
1. Close every gap in the wall around the home castle.
2. Claim enough interior space for next round's cannons.
3. Extend the wall to enclose additional castles.
4. Wall in enemy troops to eliminate them.
5. Build wall along the shoreline so carriers cannot land troops.

### Resolve

After the build timer:

- Territory is recomputed. A region counts as owned only if it is fully sealed
  by wall (the map edge and water do **not** count as barriers — a coastline
  must be walled) and contains at least one castle. Owned land is drawn with a
  distinctive checkerboard.
- Cannons that are not entirely on owned land are lost.
- Troops standing on owned land (i.e. now walled in) are eliminated.
- Points are awarded for newly claimed land and castles.
- If the player owns no castle, the game is over.
- Otherwise the round counter advances. A battle is won after a set number of
  rounds; in two-player games the higher score wins if both survive.

## Map

Maps are tile grids of water, land and castles. Land bordering water is drawn
as beach. Our first map is 40×28 tiles with a bay to the north-west and five
castles spread across the land, each with enough clearance for its starter wall.

Later maps should vary the coastline (to change how many fronts the player must
defend), castle spacing (how greedy expansion can be), and for the final level an
island attacked from every side.

## Presentation

- Native resolution 320×240 with 8-pixel tiles and a 16-pixel HUD strip,
  integer-scaled to the window. Chunky pixel art, small saturated palette.
- Cursor styles per phase: highlight box (castle select), ghost cannon with a
  remaining count (placement), crosshair (battle), ghost piece coloured by
  legality (build).
- Cannonballs draw an arc with a ground shadow so flight time reads clearly.
- Short centred banner on each phase change; HUD shows score, round, timer,
  castle and cannon counts.

## Planned extensions

- **Local two-player**: two input sources, river maps, shooting each other's
  walls, execution screen for the loser as a flourish.
- **Network play**: the simulation already advances by one input record per
  player per tick from a seeded RNG, so lockstep over WebSockets only needs
  input exchange and a start handshake.
- **AI opponent**: a command producer that plays the two-player game like a
  human — leads targets imperfectly, prioritises gaps by size, with skill
  levels controlling reaction time, aim error and piece-placement quality.
- Level select order, difficulty bonuses, more battlefields, sound.
