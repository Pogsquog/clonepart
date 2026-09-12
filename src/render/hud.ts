import { GameState } from "../game/state";
import { HUD_H, NATIVE_W, Phase, TICK_RATE } from "../game/types";
import { drawText, drawTextCentered } from "./font";
import { PAL } from "./tiles";

const PHASE_LABEL: Record<Phase, string> = {
  [Phase.Title]: "",
  [Phase.CastleSelect]: "SELECT CASTLE",
  [Phase.CannonPlace]: "PLACE CANNONS",
  [Phase.Battle]: "BATTLE",
  [Phase.Build]: "BUILD",
  [Phase.Resolve]: "",
  [Phase.GameOver]: "GAME OVER",
  [Phase.Victory]: "VICTORY",
};

export function drawHud(ctx: CanvasRenderingContext2D, s: GameState): void {
  ctx.fillStyle = PAL.hud;
  ctx.fillRect(0, 0, NATIVE_W, HUD_H);
  ctx.fillStyle = PAL.wallDark;
  ctx.fillRect(0, HUD_H - 1, NATIVE_W, 1);

  const p = s.players[0]!;
  drawText(ctx, `SCORE ${String(p.score).padStart(7, "0")}`, 4, 2, PAL.hudText);
  drawText(ctx, `ROUND ${s.round + 1}/${s.roundsToWin}`, 4, 9, PAL.hudText);

  drawTextCentered(ctx, PHASE_LABEL[s.phase], NATIVE_W / 2, 2, PAL.hudGold);
  const timed = s.phase === Phase.CastleSelect || s.phase === Phase.CannonPlace || s.phase === Phase.Battle || s.phase === Phase.Build;
  if (timed) {
    const secs = Math.ceil(s.timer / TICK_RATE);
    drawTextCentered(ctx, `TIME ${secs}`, NATIVE_W / 2, 9, secs <= 5 && (s.tick >> 3) & 1 ? PAL.cursorBad : PAL.hudText);
  }

  const castles = s.castles.filter((c) => c.owner === p.id).length;
  const cannons = s.cannons.filter((c) => c.hp >= 2).length;
  const right = NATIVE_W - 4;
  const line1 = `CASTLES ${castles}  CANNONS ${cannons}`;
  drawText(ctx, line1, right - line1.length * 4 + 1, 2, PAL.hudText);
  const line2 = s.phase === Phase.Battle ? `SHIPS ${s.ships.filter((sh) => sh.sinking === 0).length}` : s.phase === Phase.CannonPlace ? `TO PLACE ${p.cannonsToPlace}` : "";
  if (line2) drawText(ctx, line2, right - line2.length * 4 + 1, 9, PAL.hudGold);
}
