// Audio via Web Audio API
const AudioFX = {
  ctx: null,
  enabled: true,
  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
  },
  tone(freq, dur, type, vol) {
    if (!this.enabled || !this.ctx) return;
    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.3, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(); o.stop(this.ctx.currentTime + dur);
    } catch (e) {}
  },
  sweep(f1, f2, dur, vol) {
    if (!this.enabled || !this.ctx) return;
    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f1, this.ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), this.ctx.currentTime + dur);
      g.gain.setValueAtTime(vol || 0.3, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(); o.stop(this.ctx.currentTime + dur);
    } catch (e) {}
  },
  noise(dur, vol) {
    if (!this.enabled || !this.ctx) return;
    try {
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol || 0.3, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      src.connect(g); g.connect(this.ctx.destination);
      src.start();
    } catch (e) {}
  },
  click() { this.tone(1000, 0.05, 'sine', 0.2); },
  thunk() { this.tone(80, 0.15, 'square', 0.4); },
  smite() { this.noise(0.08, 0.5); this.tone(440, 0.3, 'sine', 0.4); },
  whoosh() { this.sweep(800, 200, 0.15, 0.3); },
  bell() { this.tone(880, 0.6, 'sine', 0.4); },
  gameOver() { this.sweep(440, 110, 0.8, 0.4); },
  perfect() { this.tone(660, 0.08, 'sine', 0.3); setTimeout(() => this.tone(880, 0.08, 'sine', 0.3), 80); setTimeout(() => this.tone(1320, 0.12, 'sine', 0.3), 160); }
};

// Visual effects mixed into GameScene
const GameEffects = {
  spawnParticles(x, y, count, color, speedMin, speedMax) {
    color = color || 0xFFD700;
    for (let i = 0; i < count; i++) {
      const p = this.add.rectangle(x, y, 5, 5, color);
      p.setDepth(50);
      const ang = Math.random() * Math.PI * 2;
      const sp = speedMin + Math.random() * (speedMax - speedMin);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(ang) * sp,
        y: y + Math.sin(ang) * sp,
        alpha: 0,
        duration: 400,
        onComplete: () => p.destroy()
      });
    }
  },
  flashRed() {
    const r = this.add.rectangle(180, 360, 360, 720, 0xFF2222).setAlpha(0.6).setDepth(100);
    this.tweens.add({ targets: r, alpha: 0, duration: 300, onComplete: () => r.destroy() });
  },
  floatText(x, y, text, color, size) {
    const t = this.add.text(x, y, text, {
      fontSize: (size || 20) + 'px', color: color || '#FFD700',
      fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 700, onComplete: () => t.destroy() });
    this.tweens.add({ targets: t, scale: 1.3, duration: 100, yoyo: true });
  },
  hitStop(ms) {
    if (this.matter && this.matter.world) {
      this.matter.world.enabled = false;
      setTimeout(() => { if (this.matter && this.matter.world) this.matter.world.enabled = true; }, ms);
    }
  }
};
