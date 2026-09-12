import { CANNON_SIZE, CASTLE_SIZE, idx, inBounds, isShore, isWater } from "../game/grid";
import { canPlaceCannon, canPlacePiece } from "../game/entities";
import { ballPosition } from "../game/phases/battle";
import { GameState } from "../game/state";
import { GRID_H, GRID_W, HUD_H, NATIVE_H, NATIVE_W, Phase, TILE, Tile } from "../game/types";
import { drawText, drawTextCentered } from "./font";
import { drawHud } from "./hud";
import {
  PAL,
  drawCannon,
  drawCastle,
  drawCrater,
  drawExplosion,
  drawLand,
  drawScorched,
  drawShip,
  drawShore,
  drawTroop,
  drawWall,
  drawWater,
} from "./tiles";

export class Renderer {
  private readonly off: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly screen: CanvasRenderingContext2D;
  private scale = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.off = document.createElement("canvas");
    this.off.width = NATIVE_W;
    this.off.height = NATIVE_H;
    this.ctx = this.off.getContext("2d")!;
    this.screen = canvas.getContext("2d")!;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize(): void {
    this.scale = Math.max(1, Math.floor(Math.min(window.innerWidth / NATIVE_W, window.innerHeight / NATIVE_H)));
    this.canvas.width = NATIVE_W * this.scale;
    this.canvas.height = NATIVE_H * this.scale;
    this.screen.imageSmoothingEnabled = false;
  }

  render(s: GameState): void {
    const ctx = this.ctx;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, NATIVE_W, NATIVE_H);

    if (s.phase === Phase.Title) {
      this.drawTitle(s);
    } else {
      ctx.save();
      ctx.translate(0, HUD_H);
      this.drawMap(s);
      this.drawEntities(s);
      this.drawCursor(s);
      this.drawBalls(s);
      this.drawOverlay(s);
      ctx.restore();
      drawHud(ctx, s);
    }

    this.screen.imageSmoothingEnabled = false;
    this.screen.drawImage(this.off, 0, 0, this.canvas.width, this.canvas.height);
  }

  private drawMap(s: GameState): void {
    const ctx = this.ctx;
    const t = s.tiles;
    for (let y = 0; y < GRID_H; y++)
      for (let x = 0; x < GRID_W; x++) {
        const px = x * TILE;
        const py = y * TILE;
        const i = idx(x, y);
        switch (t[i]) {
          case Tile.Water:
            drawWater(ctx, px, py, x, y, s.tick);
            break;
          case Tile.Wall:
            drawWall(ctx, px, py);
            break;
          case Tile.Scorched:
            drawScorched(ctx, px, py);
            break;
          case Tile.Castle:
          case Tile.Cannon:
            drawLand(ctx, px, py, x, y, s.owner[i]!);
            break;
          default:
            if (!s.owner[i] && isShore(t, x, y)) {
              drawShore(ctx, px, py, isWater(t, x - 1, y), isWater(t, x + 1, y), isWater(t, x, y - 1), isWater(t, x, y + 1));
            } else {
              drawLand(ctx, px, py, x, y, s.owner[i]!);
            }
            if (s.craters[i]) drawCrater(ctx, px, py);
        }
      }
    for (const c of s.castles) drawCastle(ctx, c.x * TILE, c.y * TILE, c.owner !== 0, s.tick);
    for (const c of s.cannons) drawCannon(ctx, c.x * TILE, c.y * TILE, c.hp < 2);
  }

  private drawEntities(s: GameState): void {
    const ctx = this.ctx;
    for (const tr of s.troops) drawTroop(ctx, tr.x * TILE, tr.y * TILE, s.tick);
    for (const sh of s.ships) {
      const facing = sh.target.x >= sh.x ? 1 : -1;
      drawShip(ctx, sh.x * TILE, sh.y * TILE, sh.kind, facing, sh.sinking, s.tick);
    }
  }

  private drawBalls(s: GameState): void {
    const ctx = this.ctx;
    for (const b of s.balls) {
      const p = ballPosition(b);
      const gx = Math.round(p.x * TILE);
      const gy = Math.round(p.y * TILE);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(gx - 1, gy - 1, 3, 2);
      const by = Math.round(gy - p.h * TILE);
      ctx.fillStyle = b.flaming ? PAL.fire : PAL.ball;
      ctx.fillRect(gx - 1, by - 1, 3, 3);
      if (b.flaming) {
        ctx.fillStyle = PAL.fireHot;
        ctx.fillRect(gx, by - 3, 1, 2);
      }
    }
    for (const e of s.explosions) drawExplosion(ctx, e.x * TILE, e.y * TILE, e.ticks);
  }

  private drawCursor(s: GameState): void {
    const ctx = this.ctx;
    const p = s.players[0]!;
    const blink = (s.tick >> 3) & 1;
    switch (s.phase) {
      case Phase.CastleSelect: {
        const c = s.castles[s.selectedCastle]!;
        const px = c.x * TILE - 2;
        const py = c.y * TILE - 2;
        const sz = CASTLE_SIZE * TILE + 4;
        ctx.fillStyle = blink ? PAL.cursor : PAL.hudGold;
        this.outline(px, py, sz, sz);
        break;
      }
      case Phase.CannonPlace: {
        const x = Math.round(p.cursor.x);
        const y = Math.round(p.cursor.y);
        const ok = canPlaceCannon(s, p.id, x, y);
        ctx.globalAlpha = 0.7;
        drawCannon(ctx, x * TILE, y * TILE, false);
        ctx.globalAlpha = 1;
        ctx.fillStyle = ok ? PAL.cursorGood : PAL.cursorBad;
        this.outline(x * TILE, y * TILE, CANNON_SIZE * TILE, CANNON_SIZE * TILE);
        drawText(ctx, String(p.cannonsToPlace), x * TILE + 6, y * TILE - 7, PAL.hudText);
        break;
      }
      case Phase.Battle: {
        const cx = Math.round(p.cursor.x * TILE);
        const cy = Math.round(p.cursor.y * TILE);
        ctx.fillStyle = blink ? PAL.cursor : PAL.hudGold;
        ctx.fillRect(cx - 5, cy, 3, 1);
        ctx.fillRect(cx + 3, cy, 3, 1);
        ctx.fillRect(cx, cy - 5, 1, 3);
        ctx.fillRect(cx, cy + 3, 1, 3);
        ctx.fillRect(cx, cy, 1, 1);
        break;
      }
      case Phase.Build: {
        if (!p.piece) break;
        const x = Math.round(p.cursor.x);
        const y = Math.round(p.cursor.y);
        const ok = canPlacePiece(s, p.piece.cells, x, y);
        for (const c of p.piece.cells) {
          const px = (x + c.x) * TILE;
          const py = (y + c.y) * TILE;
          if (inBounds(x + c.x, y + c.y)) {
            ctx.globalAlpha = 0.75;
            drawWall(ctx, px, py);
            ctx.globalAlpha = 1;
          }
          ctx.fillStyle = ok ? PAL.cursorGood : PAL.cursorBad;
          this.outline(px, py, TILE, TILE);
        }
        break;
      }
      default:
        break;
    }
  }

  private outline(x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x, y, 1, h);
    ctx.fillRect(x + w - 1, y, 1, h);
  }

  private drawOverlay(s: GameState): void {
    const ctx = this.ctx;
    const midY = (GRID_H * TILE) / 2;
    if (s.phase === Phase.GameOver || s.phase === Phase.Victory) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, midY - 24, NATIVE_W, 48);
      drawTextCentered(ctx, s.phase === Phase.Victory ? "VICTORY!" : "GAME OVER", NATIVE_W / 2, midY - 16, PAL.hudGold, 3);
      drawTextCentered(ctx, `SCORE ${s.players[0]!.score}`, NATIVE_W / 2, midY + 4, PAL.hudText, 1);
      drawTextCentered(ctx, "PRESS SPACE / ENTER", NATIVE_W / 2, midY + 14, PAL.hudText, 1);
    } else if (s.bannerTicks > 0 && s.banner) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, midY - 10, NATIVE_W, 20);
      drawTextCentered(ctx, s.banner, NATIVE_W / 2, midY - 5, PAL.hudGold, 2);
    }
  }

  private drawTitle(s: GameState): void {
    const ctx = this.ctx;
    // Backdrop: a strip of sea and a strip of land with a castle on it.
    for (let y = 0; y < GRID_H + 2; y++)
      for (let x = 0; x < GRID_W; x++) {
        const py = y * TILE;
        if (y < 14) drawWater(ctx, x * TILE, py, x, y, s.tick);
        else if (y === 14) drawShore(ctx, x * TILE, py, false, false, true, false);
        else drawLand(ctx, x * TILE, py, x, y, 0);
      }
    for (let x = 12; x < 28; x++) {
      drawWall(ctx, x * TILE, 18 * TILE);
      drawWall(ctx, x * TILE, 26 * TILE);
    }
    for (let y = 18; y <= 26; y++) {
      drawWall(ctx, 12 * TILE, y * TILE);
      drawWall(ctx, 27 * TILE, y * TILE);
    }
    drawCastle(ctx, 18 * TILE, 21 * TILE, true, s.tick);
    drawCannon(ctx, 14 * TILE, 22 * TILE, false);
    drawCannon(ctx, 23 * TILE, 22 * TILE, false);
    drawShip(ctx, 6 * TILE, 6 * TILE, "gunship", 1, 0, s.tick);
    drawShip(ctx, 30 * TILE, 4 * TILE, "flagship", -1, 0, s.tick);
    drawShip(ctx, 20 * TILE, 9 * TILE, "carrier", 1, 0, s.tick);

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 24, NATIVE_W, 60);
    drawTextCentered(ctx, "CLONEPART", NATIVE_W / 2, 32, PAL.hudGold, 5);
    drawTextCentered(ctx, "A RAMPART CLONE", NATIVE_W / 2, 64, PAL.hudText, 1);

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 100, NATIVE_W, 40);
    const diff = s.difficulty.toUpperCase();
    drawTextCentered(ctx, `< ${diff} >`, NATIVE_W / 2, 106, PAL.hudGold, 2);
    if ((s.tick >> 4) & 1) drawTextCentered(ctx, "PRESS SPACE OR ENTER TO START", NATIVE_W / 2, 124, PAL.hudText, 1);
    drawTextCentered(ctx, "ARROWS/WASD MOVE  SHIFT FAST  SPACE/Z ACTION  X ROTATE  C CANCEL", NATIVE_W / 2, NATIVE_H - 10, PAL.hudText, 1);
  }
}
