// effects.js — Juice effects: particles, shake, audio synthesis, floating text
window.Effects = {
  audioCtx: null,

  getAudioCtx() {
    if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return this.audioCtx;
  },

  playTone(freq, duration, type, volume) {
    try {
      const ctx = this.getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume || 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {}
  },

  playSweep(freqStart, freqEnd, duration) {
    try {
      const ctx = this.getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + duration / 1000);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {}
  },

  playDrop() { this.playSweep(800, 200, 150); },
  playLand() { this.playTone(120, 80, 'sine', 0.1); },
  playMerge(tier) {
    const freqs = [440, 330, 220, 110, 80];
    this.playTone(freqs[Math.min(tier, 4)], 120 + tier * 40, 'sine', 0.18);
  },
  playChainMerge(chainLen) {
    this.playTone(440 + chainLen * 50, 100, 'sine', 0.2);
  },
  playBombExplode() { this.playTone(80, 400, 'sawtooth', 0.2); },
  playRainbowMerge() {
    const notes = [262, 330, 392, 523];
    notes.forEach((f, i) => setTimeout(() => this.playTone(f, 80, 'sine', 0.12), i * 25));
  },
  playOverflowWarning() { this.playTone(880, 200, 'square', 0.1); },
  playGameOver() { this.playSweep(440, 110, 800); },
  playAutoDrop() { this.playTone(200, 100, 'square', 0.08); },
  playClick() { this.playTone(1000, 30, 'sine', 0.06); },
  playHighScore() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.playTone(f, 120, 'sine', 0.12), i * 80));
  },

  mergeFlash(scene, x, y, radius) {
    const g = scene.add.graphics();
    g.fillStyle(0xFFFFFF, 1.0);
    g.fillCircle(x, y, radius);
    g.setDepth(50);
    scene.tweens.add({ targets: g, alpha: 0, duration: 180, onComplete: () => g.destroy() });
  },

  scalePunch(scene, target, scale, duration) {
    if (!target || !target.scene) return;
    scene.tweens.add({
      targets: target, scaleX: scale, scaleY: scale,
      duration: duration / 2, yoyo: true, ease: 'Back.Out'
    });
  },

  particles(scene, x, y, count, color, speed, lifetime) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
      const p = scene.add.image(x, y, 'particle').setScale(0.3).setTint(color).setDepth(45);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      scene.tweens.add({
        targets: p, x: x + vx * (lifetime / 1000), y: y + vy * (lifetime / 1000),
        alpha: 0, scaleX: 0, scaleY: 0, duration: lifetime,
        onComplete: () => p.destroy()
      });
    }
  },

  floatScore(scene, x, y, text, size, color) {
    const txt = scene.add.text(x, y, text, {
      fontSize: size + 'px', fill: color || '#FFFFFF',
      fontFamily: 'Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(60);
    scene.tweens.add({
      targets: txt, y: y - 50, alpha: 0, duration: 700,
      onComplete: () => txt.destroy()
    });
  },

  chainText(scene, chainLen) {
    const size = 24 + (chainLen - 2) * 4;
    const txt = scene.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 40,
      'CHAIN x' + chainLen + '!', {
        fontSize: Math.min(size, 36) + 'px', fill: CONFIG.UI.COMBO_TEXT,
        fontFamily: 'Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5).setDepth(70);
    scene.tweens.add({
      targets: txt, y: txt.y - 60, alpha: 0, scaleX: 1.3, scaleY: 1.3,
      duration: 800, onComplete: () => txt.destroy()
    });
  },

  shockwaveRing(scene, x, y) {
    const g = scene.add.graphics().setDepth(55);
    let r = 20;
    const tw = scene.tweens.addCounter({
      from: 20, to: 120, duration: 300,
      onUpdate: (t) => {
        g.clear(); r = t.getValue();
        g.lineStyle(3, 0xFFFFFF, 1 - (r - 20) / 100);
        g.strokeCircle(x, y, r);
      },
      onComplete: () => g.destroy()
    });
  },

  explosionFlash(scene, x, y) {
    const g = scene.add.graphics().setDepth(55);
    g.fillStyle(0xFF6B35, 0.9);
    g.fillCircle(x, y, 80);
    scene.tweens.add({
      targets: g, alpha: 0, scaleX: 1.8, scaleY: 1.8,
      duration: 350, onComplete: () => g.destroy()
    });
  },

  deathFlash(scene) {
    const overlay = scene.add.rectangle(
      CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
      CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT, 0xFF4757, 0
    ).setDepth(80);
    scene.tweens.add({
      targets: overlay, fillAlpha: 0.6, duration: 200, yoyo: true,
      hold: 100, onComplete: () => overlay.destroy()
    });
  }
};
