/** 3x5 pixel font. Each glyph is 5 rows of 3 bits, MSB = left pixel. */
const GLYPHS: Record<string, number[]> = {
  A: [0b010, 0b101, 0b111, 0b101, 0b101],
  B: [0b110, 0b101, 0b110, 0b101, 0b110],
  C: [0b011, 0b100, 0b100, 0b100, 0b011],
  D: [0b110, 0b101, 0b101, 0b101, 0b110],
  E: [0b111, 0b100, 0b110, 0b100, 0b111],
  F: [0b111, 0b100, 0b110, 0b100, 0b100],
  G: [0b011, 0b100, 0b101, 0b101, 0b011],
  H: [0b101, 0b101, 0b111, 0b101, 0b101],
  I: [0b111, 0b010, 0b010, 0b010, 0b111],
  J: [0b001, 0b001, 0b001, 0b101, 0b010],
  K: [0b101, 0b101, 0b110, 0b101, 0b101],
  L: [0b100, 0b100, 0b100, 0b100, 0b111],
  M: [0b101, 0b111, 0b111, 0b101, 0b101],
  N: [0b110, 0b101, 0b101, 0b101, 0b101],
  O: [0b010, 0b101, 0b101, 0b101, 0b010],
  P: [0b110, 0b101, 0b110, 0b100, 0b100],
  Q: [0b010, 0b101, 0b101, 0b110, 0b011],
  R: [0b110, 0b101, 0b110, 0b101, 0b101],
  S: [0b011, 0b100, 0b010, 0b001, 0b110],
  T: [0b111, 0b010, 0b010, 0b010, 0b010],
  U: [0b101, 0b101, 0b101, 0b101, 0b111],
  V: [0b101, 0b101, 0b101, 0b101, 0b010],
  W: [0b101, 0b101, 0b111, 0b111, 0b101],
  X: [0b101, 0b101, 0b010, 0b101, 0b101],
  Y: [0b101, 0b101, 0b010, 0b010, 0b010],
  Z: [0b111, 0b001, 0b010, 0b100, 0b111],
  "0": [0b111, 0b101, 0b101, 0b101, 0b111],
  "1": [0b010, 0b110, 0b010, 0b010, 0b111],
  "2": [0b111, 0b001, 0b111, 0b100, 0b111],
  "3": [0b111, 0b001, 0b011, 0b001, 0b111],
  "4": [0b101, 0b101, 0b111, 0b001, 0b001],
  "5": [0b111, 0b100, 0b111, 0b001, 0b111],
  "6": [0b111, 0b100, 0b111, 0b101, 0b111],
  "7": [0b111, 0b001, 0b010, 0b010, 0b010],
  "8": [0b111, 0b101, 0b111, 0b101, 0b111],
  "9": [0b111, 0b101, 0b111, 0b001, 0b111],
  " ": [0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0b010],
  ",": [0, 0, 0, 0b010, 0b100],
  ":": [0, 0b010, 0, 0b010, 0],
  "!": [0b010, 0b010, 0b010, 0, 0b010],
  "?": [0b110, 0b001, 0b010, 0, 0b010],
  "-": [0, 0, 0b111, 0, 0],
  "/": [0b001, 0b001, 0b010, 0b100, 0b100],
  "&": [0b010, 0b101, 0b010, 0b101, 0b011],
  ">": [0b100, 0b010, 0b001, 0b010, 0b100],
  "<": [0b001, 0b010, 0b100, 0b010, 0b001],
  "(": [0b001, 0b010, 0b010, 0b010, 0b001],
  ")": [0b100, 0b010, 0b010, 0b010, 0b100],
};

export const FONT_W = 4; // 3px glyph + 1px spacing
export const FONT_H = 6;

export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, scale = 1): void {
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const g = GLYPHS[ch] ?? GLYPHS["?"]!;
    for (let r = 0; r < 5; r++) {
      const bits = g[r]!;
      for (let c = 0; c < 3; c++) {
        if (bits & (0b100 >> c)) ctx.fillRect(cx + c * scale, y + r * scale, scale, scale);
      }
    }
    cx += FONT_W * scale;
  }
}

export function textWidth(text: string, scale = 1): number {
  return text.length * FONT_W * scale - scale;
}

export function drawTextCentered(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, color: string, scale = 1): void {
  drawText(ctx, text, Math.round(cx - textWidth(text, scale) / 2), y, color, scale);
}
