// The HUD is intentionally sparse: big numbers, big pictures, and one sentence
// at a time. Text always mirrors the spoken line so grown-ups can follow too.

export class HUD {
  constructor({ voice, audio } = {}) {
    this.voice = voice;
    this.audio = audio;
    this.bubble = document.getElementById('bubble');
    this.bubbleText = document.getElementById('bubble-text');
    this.bubbleFace = document.getElementById('bubble-face');
    this.repeatBtn = document.getElementById('repeat-btn');
    this.repeatAction = null;
    this.feedback = document.getElementById('feedback');
    this.hint = document.getElementById('hint');
    this.bannerEl = document.getElementById('banner');
    this.bannerTitle = document.getElementById('banner-title');
    this.bannerSub = document.getElementById('banner-sub');
    this.sparkleCount = document.getElementById('sparkle-count');
    this.sparkleChip = document.getElementById('chip-sparkles');
    this.starSlots = document.querySelectorAll('#star-slots i');
    this.zoneChip = document.getElementById('chip-zone');
    this.goalText = document.getElementById('goal-text');
    this.crosshair = document.getElementById('crosshair');
    this.toastStack = document.getElementById('toast-stack');
    this.fader = document.getElementById('fader');
    this.ui = document.getElementById('ui');

    this._bubbleTimer = null;
    this._feedbackTimer = null;
    this._bannerTimer = null;
    this._hintTimer = null;

    this.repeatBtn?.addEventListener('click', () => {
      this.audio?.ui();
      if (this.repeatAction) this.repeatAction();
      else this.voice?.repeat();
    });
  }

  setVisible(on) {
    this.ui.classList.toggle('hidden', !on);
  }

  showBubble(text, face = '✨', repeatAction = null) {
    if (!this.bubble) return;
    this.bubbleText.textContent = text;
    this.bubbleFace.textContent = face;
    this.repeatAction = repeatAction;
    this.bubble.classList.remove('hidden');
    clearTimeout(this._bubbleTimer);
    this._bubbleTimer = setTimeout(() => this.hideBubble(), 14000);
  }

  hideBubble() {
    this.bubble?.classList.add('hidden');
    clearTimeout(this._bubbleTimer);
  }

  showFeedback(text, kind = 'good') {
    if (!this.feedback) return;
    this.feedback.textContent = text;
    this.feedback.className = kind;
    clearTimeout(this._feedbackTimer);
    this._feedbackTimer = setTimeout(() => {
      this.feedback.classList.add('hidden');
    }, 1600);
  }

  showHint(text, duration = 4200) {
    if (!this.hint) return;
    this.hint.textContent = text;
    this.hint.classList.remove('hidden');
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => this.hint.classList.add('hidden'), duration);
  }

  hideHint() {
    this.hint?.classList.add('hidden');
    clearTimeout(this._hintTimer);
  }

  showBanner(title, sub = '', duration = 3600) {
    if (!this.bannerEl) return;
    this.bannerTitle.textContent = title;
    this.bannerSub.textContent = sub;
    this.bannerEl.classList.remove('hidden');
    clearTimeout(this._bannerTimer);
    this._bannerTimer = setTimeout(() => this.bannerEl.classList.add('hidden'), duration);
  }

  hideBanner() {
    this.bannerEl?.classList.add('hidden');
    clearTimeout(this._bannerTimer);
  }

  setZone(name) {
    if (this.zoneChip) this.zoneChip.textContent = name;
  }

  setGoal(text) {
    if (this.goalText) this.goalText.textContent = text;
  }

  setSparkles(n) {
    if (!this.sparkleCount) return;
    if (this.sparkleCount.textContent !== String(n)) {
      this.sparkleCount.textContent = n;
      this.sparkleChip?.classList.remove('pulse');
      void this.sparkleChip?.offsetWidth;
      this.sparkleChip?.classList.add('pulse');
    }
  }

  setStars(count, total = 5) {
    this.starSlots?.forEach((el, i) => {
      el.textContent = i < count ? '★' : '☆';
      el.classList.toggle('lit', i < count);
    });
    this.starSlots?.forEach((el, i) => {
      if (i >= total) el.style.display = 'none';
    });
  }

  setCrosshairHot(hot) {
    this.crosshair?.classList.toggle('is-hot', !!hot);
    this.crosshair?.classList.toggle('is-soft', !hot);
  }

  toast(text, icon = '✨') {
    if (!this.toastStack) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span>${icon}</span><span></span>`;
    el.lastChild.textContent = text;
    this.toastStack.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 450);
    }, 2800);
  }

  fade(on) {
    return new Promise((resolve) => {
      this.fader?.classList.toggle('on', on);
      setTimeout(resolve, 520);
    });
  }

  setFadeImmediate(on) {
    this.fader?.classList.toggle('on', on);
  }

  showEnding(stats) {
    const panel = document.getElementById('ending');
    const list = document.getElementById('ending-stats');
    const text = document.getElementById('ending-text');
    if (list) {
      list.innerHTML = '';
      for (const [label, value] of stats) {
        const div = document.createElement('div');
        const b = document.createElement('b');
        b.textContent = value;
        const s = document.createElement('span');
        s.textContent = label;
        div.append(b, s);
        list.appendChild(div);
      }
    }
    if (text) text.textContent = 'Every light in the hollow is singing, and it is all because of you.';
    panel?.classList.remove('hidden');
  }

  hideEnding() {
    document.getElementById('ending')?.classList.add('hidden');
  }

  showPause(show, progressText = '') {
    const panel = document.getElementById('pause-screen');
    panel?.classList.toggle('hidden', !show);
    const p = document.getElementById('pause-progress');
    if (p) p.textContent = progressText;
  }
}
