/**
 * Canvas 2D particle system for Stage 08 — spray drying.
 *
 * Physically plausible, deliberately lightweight:
 *  - concentrate is atomized at the nozzle into a downward cone of droplets
 *  - droplets fall with gravity + drag inside co-current hot air
 *  - each droplet "dries" over its fall: shrinks and turns from translucent
 *    warm-white liquid to opaque matte powder
 *  - dried particles settle against the chamber cone and build a heap
 *
 * The scroll timeline drives `setProgress(p)`; emission and heap size are
 * functions of p so the whole thing scrubs believably. The rAF loop only
 * runs while the stage is pinned (start/stop from ScrollTrigger callbacks).
 */

export type SprayGeometry = {
  /** all coordinates normalized 0..1 relative to canvas size */
  centerX: number;
  nozzleY: number;
  /** half-width of the cylindrical chamber section */
  chamberHalfWidth: number;
  /** y where the cone section starts */
  coneTopY: number;
  /** y of the cone outlet */
  coneBottomY: number;
  /** half-width of the outlet */
  outletHalfWidth: number;
};

export type SprayColors = {
  droplet: string; // e.g. material --m-milk-warm
  powder: string; // e.g. material --m-powder
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r0: number;
  /** 0 = wet droplet, 1 = dry powder */
  dry: number;
  spin: number;
};

const GRAVITY = 320; // px/s² (tuned for a ~700px-tall canvas)
const DRAG = 0.995;
const DRY_RATE = 0.65; // dryness gained per second of fall

export class SprayEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private geo: SprayGeometry;
  private colors: SprayColors;
  private maxParticles: number;

  private particles: Particle[] = [];
  private progress = 0;
  private heap = 0; // 0..1 — heap fill amount
  private raf = 0;
  private running = false;
  private lastT = 0;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private emitCarry = 0;

  constructor(
    canvas: HTMLCanvasElement,
    opts: {
      geometry: SprayGeometry;
      colors: SprayColors;
      maxParticles: number;
    }
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("SprayEngine: 2d context unavailable");
    this.ctx = ctx;
    this.geo = opts.geometry;
    this.colors = opts.colors;
    this.maxParticles = opts.maxParticles;
  }

  resize(width: number, height: number) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = width;
    this.h = height;
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /** Scrub position of the stage timeline, 0..1. */
  setProgress(p: number) {
    this.progress = Math.min(1, Math.max(0, p));
    // Heap grows with scroll so scrubbing backwards shrinks it again.
    this.heap = Math.min(1, Math.max(0, (this.progress - 0.25) / 0.6));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastT = performance.now();
    const loop = (t: number) => {
      if (!this.running) return;
      // Clamp dt so background-tab jank doesn't explode the simulation.
      const dt = Math.min((t - this.lastT) / 1000, 1 / 30);
      this.lastT = t;
      this.step(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Reduced-motion / paused snapshot: full heap, a frozen mid-fall cloud. */
  renderStaticFrame() {
    this.heap = 0.85;
    this.particles = [];
    // Deterministic scatter so the still frame looks like arrested motion.
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < Math.min(this.maxParticles, 140); i++) {
      const t = rand();
      const spreadY =
        this.geo.nozzleY + t * (this.geo.coneTopY - this.geo.nozzleY) * 1.35;
      const halfW = this.halfWidthAt(spreadY) * (0.15 + 0.8 * t);
      this.particles.push({
        x: (this.geo.centerX + (rand() * 2 - 1) * halfW) * this.w,
        y: spreadY * this.h,
        vx: 0,
        vy: 0,
        r0: 1.6 + rand() * 2.4,
        dry: Math.min(1, t * 1.3),
        spin: 0,
      });
    }
    this.draw();
  }

  destroy() {
    this.stop();
    this.particles = [];
  }

  /** Chamber half-width (normalized) at a normalized y. */
  private halfWidthAt(ny: number): number {
    const g = this.geo;
    if (ny <= g.coneTopY) return g.chamberHalfWidth;
    if (ny >= g.coneBottomY) return g.outletHalfWidth;
    const t = (ny - g.coneTopY) / (g.coneBottomY - g.coneTopY);
    return g.chamberHalfWidth + (g.outletHalfWidth - g.chamberHalfWidth) * t;
  }

  /** Floor y (px) for a particle at x px — the cone wall or the heap. */
  private floorYAt(xPx: number): number {
    const g = this.geo;
    const dx = Math.abs(xPx / this.w - g.centerX);
    let ny: number;
    if (dx <= g.outletHalfWidth) {
      ny = g.coneBottomY;
    } else if (dx >= g.chamberHalfWidth) {
      ny = g.coneTopY;
    } else {
      const t =
        (dx - g.chamberHalfWidth) / (g.outletHalfWidth - g.chamberHalfWidth);
      ny = g.coneTopY + t * (g.coneBottomY - g.coneTopY);
    }
    // Heap mound: tallest at the center, gaussian falloff.
    const moundH =
      this.heap *
      0.15 *
      Math.exp(-Math.pow((xPx / this.w - g.centerX) / 0.085, 2));
    return (ny - moundH) * this.h;
  }

  private emit(count: number) {
    const g = this.geo;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) return;
      // Downward spray cone, ±58° off vertical.
      const angle = Math.PI / 2 + (Math.random() * 2 - 1) * 1.01;
      const speed = 120 + Math.random() * 150;
      this.particles.push({
        x: (g.centerX + (Math.random() * 2 - 1) * 0.012) * this.w,
        y: g.nozzleY * this.h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.6 + 40,
        r0: 2.2 + Math.random() * 2.2,
        dry: 0,
        spin: (Math.random() - 0.5) * 30,
      });
    }
  }

  private step(dt: number) {
    // Emission envelope: silent until ~12 % scroll, ramps to full by 45 %.
    const env = Math.min(1, Math.max(0, (this.progress - 0.12) / 0.33));
    this.emitCarry += env * this.maxParticles * 0.9 * dt;
    const n = Math.floor(this.emitCarry);
    if (n > 0) {
      this.emitCarry -= n;
      this.emit(n);
    }

    const g = this.geo;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += GRAVITY * dt;
      p.vx *= DRAG;
      // Hot air swirls the fall slightly.
      p.vx += Math.sin(p.y * 0.02 + p.spin) * 14 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.dry = Math.min(1, p.dry + DRY_RATE * dt);

      // Side walls.
      const halfPx = this.halfWidthAt(p.y / this.h) * this.w;
      const cxPx = g.centerX * this.w;
      if (p.x < cxPx - halfPx + p.r0) {
        p.x = cxPx - halfPx + p.r0;
        p.vx = Math.abs(p.vx) * 0.3;
      } else if (p.x > cxPx + halfPx - p.r0) {
        p.x = cxPx + halfPx - p.r0;
        p.vx = -Math.abs(p.vx) * 0.3;
      }

      // Settle on the cone/heap floor.
      if (p.y >= this.floorYAt(p.x)) {
        this.particles.splice(i, 1);
      }
    }
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    // Heap mound at the cone bottom.
    if (this.heap > 0.02) {
      const g = this.geo;
      const cx = g.centerX * this.w;
      const baseY = g.coneBottomY * this.h;
      const spread = 0.12 * this.w;
      const height = this.heap * 0.12 * this.h;
      ctx.beginPath();
      ctx.moveTo(cx - spread, baseY);
      ctx.quadraticCurveTo(cx - spread * 0.35, baseY - height * 1.05, cx, baseY - height);
      ctx.quadraticCurveTo(cx + spread * 0.35, baseY - height * 1.05, cx + spread, baseY);
      ctx.closePath();
      ctx.fillStyle = this.colors.powder;
      ctx.fill();
    }

    // Droplets → powder particles.
    for (const p of this.particles) {
      const r = p.r0 * (1 - 0.42 * p.dry);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = p.dry < 0.55 ? this.colors.droplet : this.colors.powder;
      ctx.globalAlpha = p.dry < 0.55 ? 0.5 + p.dry * 0.5 : 0.92;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/** Read a CSS custom property off :root (for canvas colors). */
export function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}
