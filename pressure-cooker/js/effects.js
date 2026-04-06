// Pressure Cooker - Juice Effects & Audio
const Effects = {
  audioCtx: null,
  getAudioCtx: function() {
    if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return this.audioCtx;
  },
  _tone: function(type, freq, vol, dur, freqEnd) {
    try {
      const ctx = this.getAudioCtx();
      const osc = ctx.createOscillator(); osc.type = type;
      if (freqEnd) { osc.frequency.setValueAtTime(freq, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + dur); }
      else osc.frequency.value = freq;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(g).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + dur);
    } catch(e) {}
  },
  _noise: function(dur, vol, hpFreq) {
    try {
      const ctx = this.getAudioCtx();
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      if (hpFreq) {
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = hpFreq;
        src.connect(hp).connect(g).connect(ctx.destination);
      } else src.connect(g).connect(ctx.destination);
      src.start();
    } catch(e) {}
  },
  playHiss: function(pressure) {
    this._noise(0.18, 0.25, pressure > 80 ? 2000 : pressure > 50 ? 1200 : 800);
  },
  playThud: function() { this._tone('sine', 80, 0.3, 0.12); },
  playNearMissClang: function() { this._tone('triangle', 1800, 0.3, 0.25); },
  playClick: function() { this._tone('sine', 1000, 0.15, 0.08); },
  playLockedThud: function() { this._tone('sine', 60, 0.2, 0.1); },
  playClutch: function() { this._tone('sawtooth', 261, 0.2, 0.3, 1047); },
  playGameOver: function() { this._tone('sawtooth', 400, 0.25, 0.6, 80); },
  playStageClear: function() {
    [523, 659, 784].forEach((f, i) => {
      try {
        const ctx = this.getAudioCtx();
        const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.2);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.2);
        osc.connect(g).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.2); osc.stop(ctx.currentTime + i * 0.2 + 0.2);
      } catch(e) {}
    });
  },
  playExplosion: function() {
    this._tone('sine', 40, 0.6, 0.5);
    this._noise(0.6, 0.3, 2000);
  }
};

// GameScene prototype mixin for visual effects
const GameEffects = {
  ventEffect: function(chamberIdx, pressure) {
    const ch = this.chambers[chamberIdx];
    if (!ch || !ch.container) return;
    const cx = ch.container.x, cy = ch.container.y;
    const flash = this.add.rectangle(cx, cy, ch.w, ch.h, 0xAADDFF, 0.9);
    this.tweens.add({ targets: flash, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
    this.tweens.add({ targets: ch.container, scaleX: 0.92, scaleY: 0.92, duration: 60, yoyo: true, ease: 'Sine.easeOut' });
    for (let i = 0; i < 8; i++) {
      const s = this.add.image(cx + Phaser.Math.Between(-15, 15), cy - ch.h / 2, 'steam').setAlpha(0.7);
      this.tweens.add({ targets: s, y: s.y - 60 - Math.random() * 30, alpha: 0, scaleX: 0.3, scaleY: 0.3, duration: 500, onComplete: () => s.destroy() });
    }
    if (pressure > 80) {
      this.pauseSim = true;
      setTimeout(() => { if (this.scene.isActive()) this.pauseSim = false; }, 40);
    }
    Effects.playHiss(pressure);
  },

  neighborTransferEffect: function(chamberIdx, amount) {
    const ch = this.chambers[chamberIdx];
    if (!ch || !ch.container) return;
    this.tweens.add({ targets: ch.container, scaleX: 1.10, scaleY: 1.10, duration: 100, yoyo: true, ease: 'Sine.easeOut' });
    const tint = this.add.rectangle(ch.container.x, ch.container.y, ch.w, ch.h, 0xFF8C00, 0.5);
    this.tweens.add({ targets: tint, alpha: 0, duration: 250, onComplete: () => tint.destroy() });
    if (amount > 30) this.cameras.main.shake(150, 0.004);
    Effects.playThud();
  },

  nearMissEffect: function(chamberIdx, chainCount) {
    const ch = this.chambers[chamberIdx];
    if (!ch || !ch.container) return;
    const cx = ch.container.x, cy = ch.container.y - ch.h / 2 - 20;
    const shakeAmt = 4 + (Math.min(chainCount, 3) - 1) * 2;
    const label = chainCount >= DIFFICULTY.clutchChainRequired ? '+CLUTCH!' : (chainCount > 1 ? '+CLOSE! x' + chainCount : '+CLOSE!');
    const color = chainCount >= DIFFICULTY.clutchChainRequired ? COLORS.clutchGold : COLORS.nearMiss;
    const txt = this.add.text(cx, cy, label, { fontSize: '18px', fontFamily: 'monospace', color: color, fontStyle: 'bold' }).setOrigin(0.5);
    this.tweens.add({ targets: txt, y: cy - 50, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
    this.cameras.main.shake(200, shakeAmt / 1000);
    const zoomLevel = chainCount >= 3 ? 1.06 : 1.04;
    this.cameras.main.zoomTo(zoomLevel, 150);
    this.time.delayedCall(150, () => this.cameras.main.zoomTo(1.0, 200));
    this.pauseSim = true;
    setTimeout(() => { if (this.scene.isActive()) this.pauseSim = false; }, 60);
    Effects.playNearMissClang();
  },

  clutchActivateEffect: function() {
    const cx = this.cameras.main.centerX, cy = this.cameras.main.centerY - 60;
    const txt = this.add.text(cx, cy, 'CLUTCH CHAIN x2', { fontSize: '22px', fontFamily: 'monospace', color: COLORS.clutchGold, fontStyle: 'bold' }).setOrigin(0.5).setScale(0.5);
    this.tweens.add({ targets: txt, scaleX: 1.2, scaleY: 1.2, duration: 150, yoyo: true, hold: 2000,
      onComplete: () => { this.tweens.add({ targets: txt, alpha: 0, duration: 400, onComplete: () => txt.destroy() }); }
    });
    Effects.playClutch();
  },

  stageClearEffect: function() {
    const w = this.cameras.main.width, h = this.cameras.main.height;
    const flash = this.add.rectangle(w / 2, h / 2, w, h, 0xFFFFFF, 0.6).setDepth(100);
    this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });
    const txt = this.add.text(w / 2, h / 2, '+STAGE BONUS', { fontSize: '24px', fontFamily: 'monospace', color: COLORS.stageBonus, fontStyle: 'bold' }).setOrigin(0.5).setScale(0.8).setDepth(101);
    this.tweens.add({ targets: txt, scaleX: 1.1, scaleY: 1.1, duration: 200, yoyo: true,
      onComplete: () => { this.tweens.add({ targets: txt, y: txt.y - 60, alpha: 0, duration: 600, onComplete: () => txt.destroy() }); }
    });
    Effects.playStageClear();
  },

  explosionEffect: function(chamberIdx) {
    const ch = this.chambers[chamberIdx];
    if (!ch || !ch.container) return;
    const cx = ch.container.x, cy = ch.container.y;
    const w = this.cameras.main.width, h = this.cameras.main.height;
    for (let i = 0; i < 24; i++) {
      const key = i < 8 ? 'particle' : (i < 16 ? 'particleWhite' : 'particleRed');
      const p = this.add.image(cx, cy, key).setDepth(200);
      const angle = Math.random() * Math.PI * 2, speed = 120 + Math.random() * 200;
      this.tweens.add({ targets: p, x: cx + Math.cos(angle) * speed * 0.7, y: cy + Math.sin(angle) * speed * 0.7 + 100,
        scaleX: 0.1, scaleY: 0.1, alpha: 0, duration: 700, ease: 'Sine.easeOut', onComplete: () => p.destroy() });
    }
    this.cameras.main.shake(600, 0.018);
    const redFlash = this.add.rectangle(w / 2, h / 2, w, h, 0xCC0000, 0.7).setDepth(199);
    this.tweens.add({ targets: redFlash, alpha: 0, duration: 400, onComplete: () => redFlash.destroy() });
    this.cameras.main.zoomTo(1.15, 150);
    this.time.delayedCall(150, () => this.cameras.main.zoomTo(1.0, 400));
    Effects.playExplosion();
  },

  floatingScore: function(x, y, text, color) {
    const t = this.add.text(x, y, text, { fontSize: '16px', fontFamily: 'monospace', color: color || COLORS.scoreFloat, fontStyle: 'bold' }).setOrigin(0.5).setDepth(150);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  },

  steamParticles: function(chamber) {
    if (!chamber.container || chamber.pressure < 60) return;
    const cx = chamber.container.x, topY = chamber.container.y - chamber.h / 2;
    const s = this.add.image(cx + Phaser.Math.Between(-10, 10), topY, 'steam').setAlpha(0.5);
    this.tweens.add({ targets: s, y: topY - 40, alpha: 0, scaleX: 0.3, scaleY: 0.3, duration: 600, onComplete: () => s.destroy() });
  }
};
