// Every instruction in the game is spoken out loud. Nothing here requires the
// child to read: speech is the primary channel and the HUD text is a bonus.

const NICE_VOICES = [
  'google us english',
  'samantha',
  'karen',
  'moira',
  'tessa',
  'microsoft aria',
  'microsoft jenny',
  'microsoft zira',
  'female',
];

export class Voice {
  constructor() {
    this.supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.enabled = true;
    this.voice = null;
    this.lastText = '';
    this.lastOpts = {};
    this.busy = false;
    if (this.supported) {
      this._choose();
      window.speechSynthesis.addEventListener?.('voiceschanged', () => this._choose());
    }
  }

  _choose() {
    if (!this.supported) return;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return;
    const english = voices.filter((v) => /^en[-_]?/i.test(v.lang) || /english/i.test(v.name));
    let best = null;
    for (const key of NICE_VOICES) {
      best = english.find((v) => v.name.toLowerCase().includes(key));
      if (best) break;
    }
    if (!best) best = english.find((v) => v.localService) || english[0] || voices[0];
    this.voice = best || null;
  }

  /**
   * Speak a line. Interrupting by default keeps responses snappy.
   * @param {string} text
   * @param {{pitch?:number, rate?:number, interrupt?:boolean, volume?:number, onEnd?:Function}} opts
   */
  say(text, opts = {}) {
    if (!text) return;
    this.lastText = text;
    this.lastOpts = opts;
    if (!this.supported || !this.enabled) {
      opts.onEnd?.();
      return;
    }
    const {
      pitch = 1.12,
      rate = 0.92,
      interrupt = true,
      volume = 1,
      onEnd = null,
    } = opts;

    try {
      if (interrupt) window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (this.voice) u.voice = this.voice;
      u.lang = this.voice?.lang || 'en-US';
      u.pitch = pitch;
      u.rate = rate;
      u.volume = volume;
      u.onstart = () => {
        this.busy = true;
      };
      u.onend = () => {
        this.busy = false;
        onEnd?.();
      };
      u.onerror = () => {
        this.busy = false;
        onEnd?.();
      };
      window.speechSynthesis.speak(u);
    } catch {
      opts.onEnd?.();
    }
  }

  /** Repeat whatever was said last (the 🔁 bubble button). */
  repeat() {
    if (this.lastText) this.say(this.lastText, { ...this.lastOpts, interrupt: true });
  }

  stop() {
    if (!this.supported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    this.busy = false;
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) this.stop();
  }

  /** Speech is technically present but often silent until the first gesture. */
  warmUp() {
    if (!this.supported) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  }
}
