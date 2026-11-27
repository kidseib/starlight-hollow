import * as THREE from 'three';
import { GlyphPad } from '../world/pads.js';
import { buildStationBase, buildPatternTile } from '../world/props.js';
import { mulberry32, shuffleInPlace, clamp } from '../engine/utils.js';
import { ENCOURAGE_LINES, PRAISE_LINES } from '../content.js';

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const ACTIVATE_RADIUS = 10.5;
const LEAVE_RADIUS = 18;

/**
 * A station is one little learning game: three or so glowing signs floating
 * above a stone plinth. Walk up, listen, and zap.
 */
export class Station {
  constructor(def, island, ctx) {
    this.def = def;
    this.island = island;
    this.ctx = ctx;
    this.solved = false;
    this.active = false;
    this.watching = false;
    this.progress = 0;
    this.pads = [];
    this.patternTiles = [];
    this.patternSpecs = [];
    this.patternPulse = [];
    this.patternReveal = -1;
    this.timers = [];
    this.time = 0;
    this.feedbackCooldown = 0;
    this.encourageIndex = 0;

    const palette = island.zone.palette;
    const localX = def.x;
    const localZ = def.z;
    const groundY = island.heightAtLocal(localX, localZ);
    this.center = new THREE.Vector3(
      island.origin.x + localX,
      island.origin.y + groundY,
      island.origin.z + localZ
    );

    // direction the station faces (towards the island centre by default)
    const face = def.faceTo ?? { x: 0, z: 0 };
    this.facing = Math.atan2(face.x - localX, face.z - localZ);

    // Station meshes live in world space: the island group is already offset by
    // the zone origin, so parenting here would double the offset.
    this.base = buildStationBase(palette, 2.5);
    this.base.group.position.copy(this.center);
    ctx.scene.add(this.base.group);

    if (def.sign) {
      this.base.marker.material.map = ctx.glyphTexture(def.sign);
      this.base.marker.material.needsUpdate = true;
      this.base.marker.scale.setScalar(2.1);
    }

    this._buildPads();
    this._buildPattern();
  }

  _buildPads() {
    const rng = mulberry32(hashString(this.def.id));
    const specs = this.def.pads.map((p) => ({ ...p }));
    // Shuffle so the answer is never in the same place twice.
    shuffleInPlace(specs, rng);

    const count = specs.length;
    const spacing = count >= 4 ? 2.15 : 2.35;
    const heights = count <= 2 ? [2.1] : [2.05, 2.35, 2.05, 2.35];
    const fx = Math.sin(this.facing);
    const fz = Math.cos(this.facing);
    const rx = Math.cos(this.facing);
    const rz = -Math.sin(this.facing);
    const rowDistance = 1.2;

    specs.forEach((spec, i) => {
      const offset = (i - (count - 1) / 2) * spacing;
      const local = new THREE.Vector3(
        this.center.x + fx * rowDistance + rx * offset,
        this.center.y + heights[i % heights.length],
        this.center.z + fz * rowDistance + rz * offset
      );
      const pad = new GlyphPad(spec, local, { index: i, seed: hashString(spec.key ?? String(i)) % 97 });
      pad.station = this;
      pad.def = spec;
      this.ctx.scene.add(pad.group);
      this.pads.push(pad);
    });
  }

  _buildPattern() {
    if (!this.def.pattern) return;
    const tiles = this.def.pattern;
    const width = tiles.length * 1.18;
    const startX = -width / 2 + 0.59;
    const angle = this.facing;
    for (let i = 0; i < tiles.length; i++) {
      const spec = tiles[i];
      const tile = buildPatternTile(spec.kind === 'mystery' ? { kind: 'mystery' } : spec);
      const offset = startX + i * 1.18;
      // Sit the row above the pads and in front of the sign plate, so it never
      // hides behind the plate from a child's eye height.
      const px = this.center.x + Math.sin(angle) * 1.85 + Math.cos(angle) * offset;
      const pz = this.center.z + Math.cos(angle) * 1.85 - Math.sin(angle) * offset;
      tile.position.set(px, this.center.y + 3.1, pz);
      tile.rotation.y = angle;
      tile.userData.homeY = this.center.y + 3.1;
      this.ctx.scene.add(tile);
      this.patternTiles.push(tile);
      this.patternSpecs.push(spec);
      this.patternPulse.push(0);
    }
    this.patternAngle = angle;
  }

  /**
   * The sequence above a pattern plinth: tiles pop in one after another, the
   * blank slot breathes, and the tiles bob so the row reads as a little phrase
   * rather than a texture.
   */
  _updatePattern(dt, time) {
    if (!this.patternTiles.length) return;
    if (this.patternReveal >= 0) this.patternReveal = Math.min(this.patternReveal + dt * 2.4, this.patternTiles.length + 0.4);

    this.patternTiles.forEach((tile, i) => {
      const appear = this.patternReveal < 0 ? 1 : clamp(this.patternReveal - i, 0, 1);
      const isBlank = this.patternSpecs[i]?.kind === 'mystery' && !this.solved;
      this.patternPulse[i] = Math.max(0, this.patternPulse[i] - dt * 2.6);

      let scale = (0.35 + 0.65 * appear) * (isBlank ? 1 + Math.sin(time * 3.1) * 0.07 : 1);
      scale += this.patternPulse[i] * 0.28;
      tile.scale.setScalar(scale);
      tile.position.y = tile.userData.homeY + Math.sin(time * 1.3 + i * 0.8) * 0.07;
      tile.rotation.y = this.patternAngle + Math.sin(time * 0.6 + i) * 0.05;
    });
  }

  /** Light up the sequence in order, like a finger running along it. */
  _playPatternLoop() {
    if (!this.patternTiles.length) return;
    this.patternTiles.forEach((tile, i) => {
      this._schedule(0.25 + i * 0.3, () => {
        this.patternPulse[i] = 1;
        this.ctx.audio?.chime?.(i);
      });
    });
  }

  /** Fill the blank slot with the answer once the child solves it. */
  _fillPatternBlank() {
    const index = this.patternSpecs.findIndex((s) => s && s.kind === 'mystery');
    if (index < 0) return;
    const tile = this.patternTiles[index];
    const answerSpec =
      this.def.patternAnswer ??
      this.def.pads?.find((p) => (p.key ?? p.text ?? p.shape) === this.def.answerKey);
    if (!tile || !answerSpec) return;
    const face = tile.children.find((c) => c.isMesh && c.material?.map);
    if (!face) return;
    face.material.map = this.ctx.glyphTexture(answerSpec);
    face.material.needsUpdate = true;
    this.patternPulse[index] = 1;
  }

  // ------------------------------------------------------------ lifecycle --

  get worldCenter() {
    return this.center;
  }

  distanceTo(pos) {
    return this.center.distanceTo(pos);
  }

  activate() {
    if (this.active || this.solved) return;
    this.active = true;
    this.progress = 0;
    this.ctx.onPrompt?.();
    if (this.def.type === 'pattern') {
      this.patternReveal = 0;
      this._playPatternLoop();
    }
    for (const pad of this.pads) pad.setState('active');
    this.ctx.audio?.unlock();
    this.repeatPrompt();
  }

  /** Restore a station that was already solved in a previous session. */
  restoreSolved() {
    this.solved = true;
    this.active = false;
    this.patternReveal = this.patternTiles.length + 1;
    for (const pad of this.pads) pad.setState('correct');
    this.base.setSolved();
    this._fillPatternBlank();
  }

  deactivate() {
    if (!this.active) return;
    this.ctx.hud?.hideBubble(this);
    this.active = false;
    this.watching = false;
    this.progress = 0;
    this.timers.length = 0;
    if (!this.solved) {
      for (const pad of this.pads) pad.setState('sleep');
    }
  }

  repeatPrompt() {
    if (!this.active || this.solved || this.watching) return;
    this.ctx.hud?.showBubble(this.def.prompt, this.def.sign?.text ?? '✨', this);
    this.ctx.voice?.say(this.def.prompt);
    if (this.def.type === 'memory') {
      // Replace pending demos and retry narration. A replay starts a fresh copy round.
      this.timers.length = 0;
      this.watching = true;
      this._schedule(1.2, () => this._playMemory());
    }
  }

  _schedule(delay, fn) {
    this.timers.push({ t: delay, fn });
  }

  // ------------------------------------------------------------ gameplay --

  onPadHit(pad) {
    if (this.solved) return 'solved';
    if (!this.active) {
      // First zap wakes the station up and counts as a real attempt.
      this.activate();
      return 'activated';
    }
    if (this.watching) return 'watching';
    if (pad.state === 'correct') return 'already';

    const type = this.def.type;
    if (type === 'pick' || type === 'pattern') {
      if (pad.key === this.def.answerKey) {
        this._padsCorrect([pad]);
        this._solve();
        return 'correct';
      }
      this._wrong([pad]);
      return 'wrong';
    }

    // sequence & memory follow an expected order
    const expected = this.def.answerKeys[this.progress];
    if (pad.key === expected) {
      pad.setState('correct');
      this.progress += 1;
      this.ctx.audio?.chime(this.progress - 1);
      this.ctx.fx?.burst(pad.group.position, {
        color: this.def.type === 'memory' ? 0xc9a8ff : 0x8dffd0,
        count: 10,
        speed: 3,
        life: 0.6,
        size: 0.45,
      });
      if (this.progress >= this.def.answerKeys.length) {
        this._solve();
        return 'correct';
      }
      return 'step';
    }

    this._sequenceReset(pad);
    return 'wrong';
  }

  _padsCorrect(list) {
    for (const pad of list) pad.setState('correct');
    for (const pad of this.pads) {
      if (!list.includes(pad)) pad.setState('sleep');
    }
  }

  _wrong(list) {
    for (const pad of list) pad.setState('wrong');
    this.ctx.audio?.wrong();
    this.ctx.onWrong?.(this);
    const line = ENCOURAGE_LINES[this.encourageIndex % ENCOURAGE_LINES.length];
    this.encourageIndex += 1;
    this.feedbackCooldown = 1.7;
    this.ctx.hud?.showFeedback('Try again!', 'again');
    this.ctx.voice?.say(line, { pitch: 1.18 });
    this._schedule(0.75, () => {
      for (const pad of list) if (!this.solved) pad.setState('active');
    });
    if (this.def.type === 'pattern') this._schedule(1.3, () => this._playPatternLoop());
    this._schedule(2.7, () => {
      if (this.solved || !this.active) return;
      this._showRetryHint();
    });
  }

  _sequenceReset(pad) {
    for (const p of this.pads) {
      if (p.state === 'correct') p.setState('active');
    }
    pad.setState('wrong');
    this.progress = 0;
    this.ctx.audio?.wrong();
    this.ctx.onWrong?.(this);
    this.feedbackCooldown = 1.9;
    this.ctx.hud?.showFeedback('Start again!', 'again');
    const line = ENCOURAGE_LINES[this.encourageIndex % ENCOURAGE_LINES.length];
    this.encourageIndex += 1;
    this.ctx.voice?.say(line, { pitch: 1.18 });
    this._schedule(0.8, () => {
      if (!this.solved && this.active) for (const p of this.pads) p.setState('active');
    });
    this._schedule(2.9, () => {
      if (this.solved || !this.active) return;
      this._showRetryHint();
    });
  }

  _showRetryHint() {
    const hint = this.def.hint ?? this.def.prompt;
    this.ctx.hud?.showBubble(hint, this.def.sign?.text ?? '💡', this);
    this.ctx.voice?.say(hint, { pitch: 1.12 });
  }

  _playMemory() {
    this.progress = 0;
    for (const pad of this.pads) pad.setState('active');
    const step = 0.72;
    this.def.answerKeys.forEach((key, index) => {
      this._schedule(0.35 + index * step, () => {
        const pad = this.pads.find((p) => p.key === key);
        if (!pad) return;
        pad.setState('correct');
        this.ctx.audio?.chime(index);
        this.ctx.fx?.burst(pad.group.position, { color: 0xc9a8ff, count: 8, speed: 2.2, life: 0.5, size: 0.4 });
        this._schedule(step * 0.55, () => {
          if (pad.state === 'correct') pad.setState('active');
        });
      });
    });
    this._schedule(0.45 + this.def.answerKeys.length * step, () => {
      this.watching = false;
      if (this.solved) return;
      this.ctx.voice?.say('Now you! Same order!', { pitch: 1.2 });
    });
  }

  _solve() {
    this.solved = true;
    this.active = false;
    this.watching = false;
    for (const pad of this.pads) pad.setState('correct');
    this.base.setSolved();
    this._fillPatternBlank();
    this.ctx.hud?.hideBubble(this);
    this.ctx.audio?.correct();
    this._schedule(0.35, () => this.ctx.audio?.star());
    const praise = PRAISE_LINES[Math.floor(Math.random() * PRAISE_LINES.length)];
    this.ctx.hud?.showFeedback(praise, 'good');
    this._schedule(0.4, () => this.ctx.voice?.say(praise, { pitch: 1.25 }));
    this.ctx.fx?.fountain(this.center.clone().setY(this.center.y + 1.2), 0xfff2b0, 34);
    this.ctx.fx?.burst(this.center.clone().setY(this.center.y + 1.6), {
      color: 0x8dffd0,
      count: 26,
      speed: 6,
      life: 1.1,
      size: 0.6,
      gravity: -3,
    });
    this.ctx.onStationSolved?.(this);
  }

  // --------------------------------------------------------------- update --

  update(dt, time, camera, playerPos) {
    this.time = time;
    this.feedbackCooldown = Math.max(0, this.feedbackCooldown - dt);

    for (let i = this.timers.length - 1; i >= 0; i--) {
      this.timers[i].t -= dt;
      if (this.timers[i].t <= 0) {
        const fn = this.timers[i].fn;
        this.timers.splice(i, 1);
        fn();
      }
    }

    this.base.update(dt, time);
    this._updatePattern(dt, time);
    for (const pad of this.pads) pad.update(dt, camera, time);

    if (this.solved && this.base.marker) {
      this.base.marker.material.opacity = 1;
    }

    if (!this.solved) {
      const dist = this.distanceTo(playerPos);
      if (!this.active && dist < ACTIVATE_RADIUS) this.activate();
      else if (this.active && dist > LEAVE_RADIUS) this.deactivate();
    }
  }

  /** Hide a whole station when its island is far away (render cost only). */
  setVisible(visible) {
    this.base.group.visible = visible;
    for (const pad of this.pads) pad.group.visible = visible;
    for (const tile of this.patternTiles) tile.visible = visible;
  }

  /** Pads worth aiming at right now. */
  aimCandidates() {
    if (!this.active || this.solved) return [];
    return this.pads.filter((p) => p.state === 'active');
  }

  highlight(pad) {
    for (const p of this.pads) p.setHighlight(p === pad);
  }
}
