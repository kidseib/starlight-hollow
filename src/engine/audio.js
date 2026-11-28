// All music and sound effects are synthesised at runtime, so the game needs
// no audio downloads and works fully offline.

const ZONE_MUSIC = {
  meadow: { root: 261.63, melody: [0, -1, 4, -1, 7, -1, 4, 2, 0, -1, 4, -1, 9, -1, 7, -1], chord: [0, 4, 7, 11] },
  grove: { root: 329.63, melody: [0, 2, 4, -1, 7, 4, 2, -1, 0, 4, 7, -1, 9, 7, 4, -1], chord: [0, 4, 7, 14] },
  falls: { root: 293.66, melody: [0, -1, 7, -1, 9, -1, 7, 4, 2, -1, 4, -1, 7, 9, 7, -1], chord: [0, 3, 7, 10] },
  peaks: { root: 392.0, melody: [0, 4, 7, 9, 12, 9, 7, 4, 0, 7, 12, -1, 9, 7, 4, -1], chord: [0, 5, 7, 12] },
  words: { root: 349.23, melody: [0, 4, 7, 4, 9, 7, 4, 2, 0, 4, 9, 7, 12, 9, 7, 4], chord: [0, 4, 7, 11] },
  cove: { root: 233.08, melody: [0, 2, 4, 2, 7, 4, 2, -1, 0, 4, 7, 9, 7, 4, 2, -1], chord: [0, 5, 7, 12] },
  // Lantern Hollow: a slow, low, water-coloured bed a fifth below the meadow.
  hollow: { root: 196.0, melody: [0, -1, 3, 7, -1, 10, 7, 3, 0, -1, 3, 7, 12, 10, 7, 3], chord: [0, 3, 7, 10] },
  ending: { root: 523.25, melody: [0, 4, 7, 12, 16, 12, 7, 4, 0, 7, 12, 16, 19, 16, 12, 7], chord: [0, 4, 7, 16] },
};

export class GameAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.zone = 'meadow';
    this.musicStep = 0;
    this.musicClock = 0;
    this.stepLength = 0.46;
    this.musicPlaying = true;
    this.listenerPos = null;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.55;
    this.sfxBus.connect(this.master);

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.22;
    this.musicBus.connect(this.master);

    // A soft echo keeps the bells sounding spacious and magical.
    this.delay = this.ctx.createDelay(1.0);
    this.delay.delayTime.value = 0.34;
    this.feedback = this.ctx.createGain();
    this.feedback.gain.value = 0.26;
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);
    this.delay.connect(this.musicBus);

    // Gentle low-pass on the master so nothing is ever harsh for little ears.
    const softener = this.ctx.createBiquadFilter();
    softener.type = 'lowpass';
    softener.frequency.value = 7200;
    this.master.disconnect();
    this.master.connect(softener);
    softener.connect(this.ctx.destination);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  setZone(zoneId) {
    if (!ZONE_MUSIC[zoneId]) return;
    this.zone = zoneId;
    this.musicStep = 0;
    this.musicClock = 0;
  }

  // ---- primitives ----------------------------------------------------------

  tone({ freq = 440, to = null, type = 'sine', dur = 0.18, gain = 0.2, at = 0, attack = 0.006, bus = 'sfx', echo = 0 }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + at;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (to !== null && to !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    }
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(bus === 'music' ? this.musicBus : this.sfxBus);
    if (echo > 0) {
      const send = this.ctx.createGain();
      send.gain.value = echo;
      g.connect(send);
      send.connect(this.delay);
    }
    osc.start(t0);
    osc.stop(t0 + dur + 0.06);
  }

  noise({ dur = 0.2, gain = 0.16, freq = 1200, q = 1, at = 0, type = 'bandpass', bus = 'sfx' }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + at;
    const rate = this.ctx.sampleRate;
    const len = Math.max(32, Math.floor(rate * dur));
    const buffer = this.ctx.createBuffer(1, len, rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const fade = 1 - i / len;
      data[i] = (Math.random() * 2 - 1) * fade * fade;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t0);
    filter.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(bus === 'music' ? this.musicBus : this.sfxBus);
    src.start(t0);
  }

  // ---- effects ------------------------------------------------------------

  zap() {
    this.tone({ freq: 900, to: 320, type: 'triangle', dur: 0.16, gain: 0.16 });
    this.noise({ dur: 0.12, gain: 0.08, freq: 2600, q: 0.9 });
  }

  pop() {
    this.tone({ freq: 520, to: 1180, type: 'sine', dur: 0.1, gain: 0.14 });
    this.noise({ dur: 0.08, gain: 0.05, freq: 3200 });
  }

  correct() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      this.tone({ freq: f, type: 'triangle', dur: 0.32, gain: 0.15, at: i * 0.075, bus: 'sfx', echo: 0.12 });
    });
  }

  wrong() {
    this.tone({ freq: 392, to: 330, type: 'sine', dur: 0.22, gain: 0.13 });
    this.tone({ freq: 294, to: 262, type: 'sine', dur: 0.3, gain: 0.1, at: 0.12 });
  }

  step() {
    this.tone({ freq: 392, type: 'sine', dur: 0.2, gain: 0.12, echo: 0.1 });
  }

  chime(index = 0) {
    const scale = [523.25, 587.33, 659.25, 783.99, 880];
    this.tone({ freq: scale[index % scale.length], type: 'sine', dur: 0.34, gain: 0.11, echo: 0.2 });
  }

  collect() {
    this.tone({ freq: 1046, to: 1568, type: 'sine', dur: 0.13, gain: 0.09 });
    this.tone({ freq: 1568, type: 'sine', dur: 0.16, gain: 0.05, at: 0.05 });
  }

  jump() {
    this.tone({ freq: 320, to: 620, type: 'sine', dur: 0.16, gain: 0.11 });
  }

  land() {
    this.noise({ dur: 0.12, gain: 0.09, freq: 380, type: 'lowpass' });
  }

  whoosh() {
    this.noise({ dur: 0.38, gain: 0.12, freq: 1200, q: 0.7 });
  }

  star() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f, i) => {
      this.tone({ freq: f, type: 'triangle', dur: 0.7, gain: 0.13, at: i * 0.11, echo: 0.3 });
    });
    this.tone({ freq: 261.63, type: 'sine', dur: 1.4, gain: 0.1, at: 0.1, echo: 0.2 });
  }

  /**
   * The hub grew: a warm four-note rise in the key of the stage, with a low
   * pad under it. Deliberately unlike `collect()` (a bright blip) and `star()`
   * (a five-note sparkle), so a child can hear the meadow change.
   */
  grow(stage = 0) {
    const roots = [261.63, 293.66, 329.63, 349.23, 392, 440];
    const root = roots[Math.max(0, Math.min(roots.length - 1, stage))];
    [0, 4, 7, 12].forEach((semi, i) => {
      const freq = root * 2 ** (semi / 12);
      this.tone({ freq, type: 'sine', dur: 0.6, gain: 0.1 - i * 0.012, at: i * 0.1, echo: 0.3 });
    });
    this.tone({ freq: root / 2, type: 'triangle', dur: 1.0, gain: 0.07, at: 0.02, echo: 0.2 });
    this.noise({ dur: 0.45, gain: 0.028, freq: 3200, q: 1 });
  }

  /** A drift of leaves: a dry rustle that settles into a soft pat. */
  rustle() {
    this.noise({ dur: 0.42, gain: 0.11, freq: 2400, q: 0.7 });
    this.noise({ dur: 0.3, gain: 0.07, freq: 5200, q: 1.2, at: 0.07 });
    this.tone({ freq: 392, to: 262, type: 'sine', dur: 0.3, gain: 0.045, at: 0.05, echo: 0.18 });
  }

  /** Sun crystal: three glassy strikes that keep ringing. */
  crystal() {
    [1046.5, 1318.5, 1568].forEach((freq, i) => {
      this.tone({ freq, type: 'triangle', dur: 0.55, gain: 0.07 - i * 0.008, at: i * 0.07, echo: 0.42 });
    });
    this.tone({ freq: 523.25, type: 'sine', dur: 0.7, gain: 0.05, at: 0.02, echo: 0.22 });
    this.noise({ dur: 0.26, gain: 0.018, freq: 6200, q: 1.4 });
  }

  /** The Leafwhisk's whoosh: one looping breath whose pitch and level follow the load. */
  suckStart() {
    if (!this.ctx || this.muted || this.suckNodes) return;
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * 1.2);
    const buffer = this.ctx.createBuffer(1, len, rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 480;
    filter.Q.value = 0.9;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.0001;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxBus);
    src.start();
    this.suckNodes = { src, filter, gain };
  }

  /** 0..1: how much is in the air, so the whoosh rises and settles with it. */
  suckSet(level) {
    if (!this.ctx || this.muted || !this.suckNodes) return;
    const t = this.ctx.currentTime;
    const amount = Math.max(0, Math.min(1, level));
    this.suckNodes.gain.gain.setTargetAtTime(0.015 + amount * 0.075, t, 0.09);
    this.suckNodes.filter.frequency.setTargetAtTime(430 + amount * 900, t, 0.1);
  }

  suckStop() {
    if (!this.ctx || !this.suckNodes) return;
    const { src, gain } = this.suckNodes;
    const t = this.ctx.currentTime;
    gain.gain.setTargetAtTime(0.0001, t, 0.06);
    this.suckNodes = null;
    setTimeout(() => {
      try { src.stop(); } catch { /* already stopped */ }
    }, 350);
  }

  /** A gathered bundle: a soft pop with a leafy tick. */
  pop() {
    this.tone({ freq: 523, to: 784, type: 'sine', dur: 0.12, gain: 0.1, echo: 0.2 });
    this.noise({ dur: 0.16, gain: 0.06, freq: 1800, q: 0.8, at: 0.02 });
  }

  /**
   * Giving a bundle to Pip's garden: each family has its own little ceremony, so
   * a child can hear which gift landed without looking at the screen.
   */
  give(kind = 'petal') {
    if (kind === 'dust') {
      // A warm whoomph, then a few soft crackles from the coals.
      this.tone({ freq: 130, to: 78, type: 'sine', dur: 0.55, gain: 0.14, attack: 0.02, echo: 0.12 });
      this.tone({ freq: 196, to: 147, type: 'triangle', dur: 0.3, gain: 0.05, at: 0.02, echo: 0.2 });
      for (let i = 0; i < 4; i++) {
        this.noise({ dur: 0.1, gain: 0.035, freq: 1400 + i * 260, q: 1.6, at: 0.06 + i * 0.09 });
      }
      return;
    }
    if (kind === 'mote') {
      // Glassy and high, like a lantern settling on its hook.
      this.tone({ freq: 1318.5, type: 'sine', dur: 0.5, gain: 0.07, echo: 0.45 });
      this.tone({ freq: 1568, type: 'triangle', dur: 0.42, gain: 0.045, at: 0.08, echo: 0.5 });
      this.tone({ freq: 2093, type: 'sine', dur: 0.3, gain: 0.03, at: 0.16, echo: 0.6 });
      this.noise({ dur: 0.2, gain: 0.014, freq: 6200, q: 1.2 });
      return;
    }
    // Petals: a soft three-note smile with a leafy rustle underneath.
    [659.25, 830.6, 987.8].forEach((freq, i) => {
      this.tone({ freq, type: 'sine', dur: 0.28, gain: 0.075 - i * 0.012, at: i * 0.07, echo: 0.28 });
    });
    this.noise({ dur: 0.18, gain: 0.03, freq: 2400, q: 0.9, at: 0.01 });
  }

  /** The arbor waking: a low warm swell with a shimmer on top. */
  arbor() {
    this.tone({ freq: 98, to: 147, type: 'sine', dur: 1.1, gain: 0.13, attack: 0.08, echo: 0.35 });
    [293.7, 392, 493.9].forEach((freq, i) => {
      this.tone({ freq, type: 'triangle', dur: 0.9, gain: 0.055 - i * 0.01, at: 0.12 + i * 0.12, echo: 0.5 });
    });
    this.noise({ dur: 0.6, gain: 0.03, freq: 5200, q: 1.4, at: 0.1 });
  }

  /** A wish: a small rising sparkle that ends high and soft. */
  wish() {
    this.tone({ freq: 880, to: 1318.5, type: 'sine', dur: 0.35, gain: 0.06, echo: 0.4 });
    this.tone({ freq: 1568, type: 'sine', dur: 0.3, gain: 0.035, at: 0.14, echo: 0.55 });
    this.noise({ dur: 0.18, gain: 0.012, freq: 7000, q: 1.6, at: 0.05 });
  }

  /** Switching tools: two small clicks, like a latch. */
  tool() {
    this.tone({ freq: 659, to: 659, type: 'square', dur: 0.05, gain: 0.035 });
    this.tone({ freq: 880, to: 880, type: 'square', dur: 0.05, gain: 0.03, at: 0.07 });
    this.noise({ dur: 0.08, gain: 0.03, freq: 2600, q: 1.2, at: 0.06 });
  }

  portal() {
    this.tone({ freq: 180, to: 720, type: 'sine', dur: 0.5, gain: 0.12, echo: 0.3 });
    this.noise({ dur: 0.5, gain: 0.08, freq: 2000, q: 1.2 });
  }

  /**
   * Three little creature calls, made from the same oscillators as everything
   * else: a frog's wet croak, a bird's two-note chirp, an owl's soft hoot. They
   * are the question in the listening-path puzzle, so they must be distinct at
   * phone-speaker volume.
   */
  creatureCall(kind = 'frog') {
    if (kind === 'bird') {
      this.tone({ freq: 1250, to: 1750, dur: 0.09, gain: 0.12, type: 'triangle', bus: 'sfx', echo: 0.12 });
      this.tone({ freq: 1500, to: 2050, dur: 0.08, gain: 0.11, at: 0.14, type: 'triangle', bus: 'sfx' });
      this.tone({ freq: 1320, to: 1850, dur: 0.1, gain: 0.1, at: 0.27, type: 'triangle', bus: 'sfx' });
      return;
    }
    if (kind === 'owl') {
      this.tone({ freq: 305, to: 250, dur: 0.34, gain: 0.17, type: 'sine', bus: 'sfx', echo: 0.18 });
      this.tone({ freq: 290, to: 236, dur: 0.32, gain: 0.14, at: 0.44, type: 'sine', bus: 'sfx' });
      return;
    }
    // frog: two low, wet croaks
    this.tone({ freq: 150, to: 92, dur: 0.17, gain: 0.17, type: 'sawtooth', bus: 'sfx' });
    this.noise({ dur: 0.09, gain: 0.05, freq: 520, q: 2.4, at: 0.02, bus: 'sfx' });
    this.tone({ freq: 142, to: 88, dur: 0.15, gain: 0.15, at: 0.24, type: 'sawtooth', bus: 'sfx' });
  }

  giggle() {
    const base = 620 + Math.random() * 140;
    [0, 1, 2].forEach((i) => {
      this.tone({ freq: base + i * 90, to: base + 40 + i * 110, type: 'sine', dur: 0.09, gain: 0.09, at: i * 0.075 });
    });
  }

  scan() {
    this.tone({ freq: 660, to: 1320, type: 'sine', dur: 0.3, gain: 0.08, echo: 0.2 });
  }

  ui() {
    this.tone({ freq: 780, type: 'sine', dur: 0.08, gain: 0.1 });
  }

  unlock() {
    [392, 523.25, 659.25, 880].forEach((f, i) =>
      this.tone({ freq: f, type: 'triangle', dur: 0.5, gain: 0.12, at: i * 0.1, echo: 0.25 })
    );
    this.noise({ dur: 0.6, gain: 0.07, freq: 2400, q: 0.8 });
  }

  // ---- music --------------------------------------------------------------

  update(dt) {
    if (!this.ctx || this.muted || !this.musicPlaying) return;
    const song = ZONE_MUSIC[this.zone] || ZONE_MUSIC.meadow;
    this.musicClock += dt;
    while (this.musicClock >= this.stepLength) {
      this.musicClock -= this.stepLength;
      const step = this.musicStep++;
      const semi = song.melody[step % song.melody.length];
      if (semi >= 0) {
        const freq = song.root * Math.pow(2, semi / 12) * 2;
        this.tone({
          freq,
          type: 'triangle',
          dur: 0.5,
          gain: 0.055,
          bus: 'music',
          echo: 0.35,
          attack: 0.02,
        });
      }
      if (step % 8 === 0) {
        const chord = song.chord;
        chord.forEach((c, i) => {
          this.tone({
            freq: song.root * Math.pow(2, c / 12) * 0.5,
            type: 'sine',
            dur: 3.6,
            gain: 0.05,
            bus: 'music',
            attack: 1.1,
            echo: 0.15,
            at: i * 0.02,
          });
        });
      }
      if (step % 4 === 2) {
        this.noise({ dur: 0.9, gain: 0.02, freq: 5200, q: 0.6, bus: 'music' });
      }
    }
  }
}
