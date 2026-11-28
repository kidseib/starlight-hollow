/**
 * Adaptive render resolution.
 *
 * A child on a school laptop should not get a slideshow because the screen is
 * high-DPI, and a fast desktop should not be stuck at a soft image because one
 * slow laptop needed it. The scalar moves between 0.65 and 1 of the capped
 * device ratio. It only steps down after a sustained slow patch and steps back
 * up after a sustained fast one, so it never pumps between frames.
 */

export const RENDER_QUALITY = {
  minScale: 0.65,
  maxScale: 1,
  slowMs: 23,
  fastMs: 15.5,
  step: 0.1,
};

/** Pure decision function, so the governor can be tested without a GPU. */
export function nextRenderScale(scale, avgMs, config = {}) {
  const { minScale, maxScale, slowMs, fastMs, step } = { ...RENDER_QUALITY, ...config };
  if (!Number.isFinite(avgMs) || avgMs <= 0) return scale;
  if (avgMs > slowMs) return Math.max(minScale, +(scale - step).toFixed(2));
  if (avgMs < fastMs) return Math.min(maxScale, +(scale + step).toFixed(2));
  return scale;
}

export class AdaptiveResolution {
  /**
   * @param {import('three').WebGLRenderer} renderer
   * @param {{ deviceRatio?: number, maxRatio?: number, startScale?: number }} options
   */
  constructor(renderer, options = {}) {
    this.renderer = renderer;
    const device = options.deviceRatio ?? globalThis.devicePixelRatio ?? 1;
    this.base = Math.min(device, options.maxRatio ?? 1.75);
    this.scale = Math.min(1, options.startScale ?? (this.base > 1.5 ? 0.85 : 1));
    this.minScale = this.base > 1.2 ? 0.65 : 1;
    this.avgMs = 16.7;
    this.cooldown = 1.5;
    this.steps = 0;
    this.apply();
  }

  get pixelRatio() {
    return +(this.base * this.scale).toFixed(2);
  }

  apply() {
    this.renderer.setPixelRatio(this.pixelRatio);
  }

  resize() {
    this.apply();
  }

  /**
   * Feed one frame of wall-clock time. Returns true when the resolution moved.
   * `dt` comes from the clamped game loop, so a 10 s tab-switch stall cannot
   * slam the quality to the floor.
   */
  sample(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return false;
    const ms = Math.min(dt * 1000, 80);
    this.avgMs += (ms - this.avgMs) * 0.06;
    this.cooldown -= dt;
    if (this.cooldown > 0) return false;
    const next = nextRenderScale(this.scale, this.avgMs, { minScale: this.minScale, maxScale: 1 });
    if (next === this.scale) return false;
    this.scale = next;
    this.steps++;
    this.apply();
    this.cooldown = next < 1 ? 2.5 : 5;
    return true;
  }
}
