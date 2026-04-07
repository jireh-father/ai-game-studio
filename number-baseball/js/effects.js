// Number Baseball - Effects (sounds via Web Audio, juice helpers)
const Effects = {
  ctx: null,
  initAudio() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  },
  beep(freq, dur, type = 'sine', vol = 0.15) {
    if (!this.ctx) return;
    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g); g.connect(this.ctx.destination);
      const t = this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t); o.stop(t + dur);
    } catch (e) {}
  },
  tap() { this.beep(440, 0.05, 'square', 0.08); },
  digit() { this.beep(660, 0.07, 'sine', 0.1); },
  submit() { this.beep(523, 0.1, 'triangle', 0.12); this.beep(659, 0.08, 'triangle', 0.1); },
  strike() {
    this.beep(800, 0.1, 'sawtooth', 0.12);
    setTimeout(() => this.beep(1000, 0.12, 'sawtooth', 0.1), 80);
  },
  ball() { this.beep(500, 0.1, 'triangle', 0.1); },
  out() { this.beep(150, 0.25, 'sawtooth', 0.12); },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.beep(f, 0.15, 'triangle', 0.15), i * 90));
  },
  death() {
    [400, 300, 200, 100].forEach((f, i) => setTimeout(() => this.beep(f, 0.18, 'sawtooth', 0.15), i * 100));
  },
  warning() { this.beep(660, 0.08, 'square', 0.08); },
};

const SceneEffects = {
  shake(intensity, duration) {
    if (!this.cameras || !this.cameras.main) return;
    this.cameras.main.shake(duration, intensity * 0.001);
  },
  flash(color, duration) {
    if (!this.cameras || !this.cameras.main) return;
    const c = Phaser.Display.Color.IntegerToRGB(color);
    this.cameras.main.flash(duration, c.r, c.g, c.b);
  },
  scalePunch(target, scale, duration) {
    if (!target || !target.scene) return;
    this.tweens.add({ targets: target, scale: scale, duration: duration / 2, yoyo: true, ease: 'Sine.easeOut' });
  },
  floatText(x, y, text, color, size, dy) {
    const t = this.add.text(x, y, text, {
      fontSize: size + 'px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: color
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({
      targets: t, y: y + (dy || -50), alpha: 0, duration: 800, ease: 'Power2',
      onComplete: () => t.destroy()
    });
  }
};
