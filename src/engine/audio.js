// All music and sound effects are synthesised at runtime, so the game needs
// no audio downloads and works fully offline.

const ZONE_MUSIC = {
  meadow: { root: 261.63, melody: [0, -1, 4, -1, 7, -1, 4, 2, 0, -1, 4, -1, 9, -1, 7, -1], chord: [0, 4, 7, 11] },
  grove: { root: 329.63, melody: [0, 2, 4, -1, 7, 4, 2, -1, 0, 4, 7, -1, 9, 7, 4, -1], chord: [0, 4, 7, 14] },
  falls: { root: 293.66, melody: [0, -1, 7, -1, 9, -1, 7, 4, 2, -1, 4, -1, 7, 9, 7, -1], chord: [0, 3, 7, 10] },
  peaks: { root: 392.0, melody: [0, 4, 7, 9, 12, 9, 7, 4, 0, 7, 12, -1, 9, 7, 4, -1], chord: [0, 5, 7, 12] },
  words: { root: 349.23, melody: [0, 4, 7, 4, 9, 7, 4, 2, 0, 4, 9, 7, 12, 9, 7, 4], chord: [0, 4, 7, 11] },
  cove: { root: 233.08, melody: [0, 2, 4, 2, 7, 4, 2, -1, 0, 4, 7, 9, 7, 4, 2, -1], chord: [0, 5, 7, 12] },
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

  portal() {
    this.tone({ freq: 180, to: 720, type: 'sine', dur: 0.5, gain: 0.12, echo: 0.3 });
    this.noise({ dur: 0.5, gain: 0.08, freq: 2000, q: 1.2 });
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
