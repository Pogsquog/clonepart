/** Deterministic PRNG (mulberry32). The simulation must only use this, never Math.random. */
export class Rng {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  /** Float in [0, 1). */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  /** Integer in [lo, hi] inclusive. */
  range(lo: number, hi: number): number {
    return lo + this.int(hi - lo + 1);
  }

  pick<T>(arr: readonly T[]): T {
    const v = arr[this.int(arr.length)];
    if (v === undefined) throw new Error("pick from empty array");
    return v;
  }

  get seed(): number {
    return this.s;
  }

  set seed(v: number) {
    this.s = v >>> 0;
  }
}
