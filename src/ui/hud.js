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
    this.bubbleOwner = null;
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
    this.upgradeRow = document.getElementById('upgrade-row');
    this.shop = document.getElementById('shop');
    this.shopItems = document.getElementById('shop-items');
    this.shopPurse = document.getElementById('shop-purse');
    this.shopLine = document.getElementById('shop-line');
    this.shopClose = document.getElementById('shop-close');
    this.shopHandlers = {};
    this.shopClose?.addEventListener('click', () => this.shopHandlers.onClose?.());
    this.shopItems?.addEventListener('click', (e) => {
      const card = e.target.closest('.shop-card');
      if (card) this.shopHandlers.onBuy?.(card.dataset.id);
    });
    this.shopItems?.addEventListener('pointerenter', (e) => {
      const card = e.target.closest?.('.shop-card');
      if (card) this.shopHandlers.onSpeak?.(card.dataset.id);
    }, true);
    this.fader = document.getElementById('fader');
    this.ui = document.getElementById('ui');

    this._bubbleTimer = null;
    this._feedbackTimer = null;
    this._bannerTimer = null;
    this._hintTimer = null;
  }

  replayBubble() {
    // Game handles sign replay; only ordinary dialogue can fall back to the bubble.
    if (this.bubbleOwner || !this.bubble || this.bubble.classList.contains('hidden')) return;
    const text = this.bubbleText.textContent;
    this.showBubble(text, this.bubbleFace.textContent);
    this.voice?.say(text);
  }

  setVisible(on) {
    this.ui.classList.toggle('hidden', !on);
  }

  showBubble(text, face = '✨', owner = null) {
    if (!this.bubble) return;
    this.bubbleText.textContent = text;
    this.bubbleFace.textContent = face;
    this.bubbleOwner = owner;
    this.bubble.classList.remove('hidden');
    this.bubble.inert = false;
    clearTimeout(this._bubbleTimer);
    this._bubbleTimer = setTimeout(() => this.hideBubble(), 14000);
  }

  hideBubble(owner) {
    if (owner !== undefined && owner !== this.bubbleOwner) return;
    this.bubbleOwner = null;
    if (this.bubble) {
      this.bubble.classList.add('hidden');
      this.bubble.inert = true;
    }
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

  /** Small picture badges under the sparkle counter: what has been bought. */
  setUpgrades(items = []) {
    if (!this.upgradeRow) return;
    this.upgradeRow.innerHTML = '';
    for (const item of items) {
      const el = document.createElement('span');
      el.className = 'upgrade-chip';
      el.title = item.name;
      el.textContent = item.icon;
      this.upgradeRow.appendChild(el);
    }
    this.upgradeRow.classList.toggle('hidden', items.length === 0);
  }

  /**
   * The market panel. Cards stay clickable even when the child cannot afford
   * them, so Momo can answer with a friendly voice instead of a dead button.
   */
  showShop({ items = [], sparkles = 0, line = '', handlers = {} } = {}) {
    this.shopHandlers = handlers;
    this._renderShop(items, sparkles, line);
    this.shop?.classList.remove('hidden');
    this.shop?.setAttribute('aria-hidden', 'false');
  }

  refreshShop({ items = [], sparkles = 0 } = {}) {
    if (!this.shopItems) return;
    this._renderShop(items, sparkles, null);
  }

  _renderShop(items, sparkles, line) {
    if (!this.shopItems) return;
    if (line !== null && this.shopLine) this.shopLine.textContent = line;
    if (this.shopPurse) this.shopPurse.textContent = String(sparkles);
    this.shopItems.innerHTML = '';
    for (const item of items) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `shop-card ${item.status}`;
      card.dataset.id = item.id;
      card.setAttribute('aria-label', `${item.name}, ${item.owned ? 'yours already' : `${item.price} sparkles`}`);

      const ico = document.createElement('span');
      ico.className = 'shop-ico';
      ico.textContent = item.owned ? '⭐' : item.icon;

      const name = document.createElement('span');
      name.className = 'shop-name';
      name.textContent = item.name;

      const blurb = document.createElement('span');
      blurb.className = 'shop-blurb';
      blurb.textContent = item.owned ? 'Yours!' : item.blurb;

      const price = document.createElement('span');
      price.className = 'shop-price';
      price.textContent = item.owned ? '⭐' : `✨ ${item.price}`;

      card.append(ico, name, blurb, price);
      this.shopItems.appendChild(card);
    }
  }

  hideShop() {
    this.shop?.classList.add('hidden');
    this.shop?.setAttribute('aria-hidden', 'true');
    this.shopHandlers = {};
  }

  shakeShop(id) {
    const card = this.shopItems?.querySelector(`.shop-card[data-id="${id}"]`);
    if (!card) return;
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
  }

  showPause(show, progressText = '') {
    const panel = document.getElementById('pause-screen');
    panel?.classList.toggle('hidden', !show);
    const p = document.getElementById('pause-progress');
    if (p) p.textContent = progressText;
  }
}
