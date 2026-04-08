// effects.js - juice effects and audio
window.Effects = {
  screenShake(scene, intensity, duration) {
    scene.cameras.main.shake(duration, intensity / 1000);
  },
  spawnParticles(scene, x, y, count, color, speedMin, speedMax, lifespan) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      const p = scene.add.circle(x, y, 3 + Math.random() * 3, color);
      p.setDepth(100);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed * (lifespan / 1000),
        y: y + Math.sin(angle) * speed * (lifespan / 1000),
        alpha: 0,
        scale: 0.2,
        duration: lifespan,
        onComplete: () => p.destroy()
      });
    }
  },
  floatingText(scene, x, y, text, color, rise, duration) {
    const t = scene.add.text(x, y, text, { fontSize: '18px', color, fontStyle: 'bold' }).setOrigin(0.5);
    t.setDepth(200);
    scene.tweens.add({
      targets: t,
      y: y - rise,
      alpha: 0,
      duration,
      onComplete: () => t.destroy()
    });
  },
  scalePunch(obj, peak, duration) {
    if (!obj || !obj.scene) return;
    obj.scene.tweens.add({
      targets: obj,
      scaleX: peak,
      scaleY: peak,
      duration: duration / 2,
      yoyo: true,
      ease: 'Cubic.easeOut'
    });
  },
  flashScreen(scene, color, opacity, duration) {
    const r = scene.add.rectangle(scene.scale.width / 2, scene.scale.height / 2, scene.scale.width, scene.scale.height, color, opacity);
    r.setDepth(500);
    scene.tweens.add({ targets: r, alpha: 0, duration, onComplete: () => r.destroy() });
  },
  hitStop(scene, duration, callback) {
    const wasPaused = scene.physics && scene.physics.world && scene.physics.world.isPaused;
    setTimeout(() => { if (callback) callback(); }, duration);
  },
  // Procedural audio via Web Audio
  _ctx: null,
  _ensureCtx() {
    if (!this._ctx) {
      try { this._ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    return this._ctx;
  },
  playTone(freq, duration, type, volume) {
    if (!window.GameState || !window.GameState.settings.sfx) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.value = volume || 0.15;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);
      osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {}
  },
  playHop() { this.playTone(800 + Math.random() * 80, 80, 'square', 0.08); },
  playCorrupt() {
    this.playTone(440, 80, 'sawtooth', 0.1);
    setTimeout(() => this.playTone(660, 80, 'sawtooth', 0.1), 80);
  },
  playWrongFlag() { this.playTone(200, 200, 'square', 0.15); },
  playDeath() {
    this.playTone(1000, 100, 'square', 0.2);
    setTimeout(() => this.playTone(1000, 100, 'square', 0.2), 150);
    setTimeout(() => this.playTone(100, 400, 'sawtooth', 0.25), 300);
  },
  playStageClear() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.playTone(f, 150, 'triangle', 0.15), i * 125));
  },
  playDecoy() { this.playTone(120, 400, 'sawtooth', 0.3); },
  playAIAdvance() { this.playTone(300, 100, 'sine', 0.05); },
  playClick() { this.playTone(600, 50, 'square', 0.08); }
};
