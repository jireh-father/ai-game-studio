// Number Baseball Pro - Effects (Web Audio sounds + juice helpers)
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
  reject() { this.beep(120, 0.18, 'sawtooth', 0.14); },
  submit() { this.beep(523, 0.08, 'triangle', 0.1); },
  flip() { this.beep(500, 0.05, 'square', 0.08); },
  strike() {
    this.beep(900, 0.09, 'sawtooth', 0.12);
    setTimeout(() => this.beep(1200, 0.12, 'sawtooth', 0.1), 60);
  },
  ball() { this.beep(560, 0.1, 'triangle', 0.1); },
  miss() { this.beep(200, 0.08, 'sawtooth', 0.08); },
  out() { this.beep(150, 0.3, 'sawtooth', 0.14); },
  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.beep(f, 0.15, 'triangle', 0.15), i * 85));
  },
  death() {
    [400, 300, 200, 100, 60].forEach((f, i) => setTimeout(() => this.beep(f, 0.2, 'sawtooth', 0.16), i * 120));
  },
  warning() { this.beep(660, 0.08, 'square', 0.08); },
  powerup() {
    [700, 900, 1100].forEach((f, i) => setTimeout(() => this.beep(f, 0.08, 'triangle', 0.12), i * 60));
  },
  reveal() { this.beep(1200, 0.15, 'sine', 0.12); },
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
  },
  burstParticles(x, y, color, count, range) {
    count = count || 12;
    range = range || 50;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4);
      const dist = range * (0.6 + Math.random() * 0.6);
      const size = 3 + Math.random() * 3;
      const p = this.add.rectangle(x, y, size, size, color).setDepth(150);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0, scaleY: 0,
        duration: 400 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => p.destroy()
      });
    }
  },
  starBurst(x, y, color, count) {
    count = count || 12;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 30;
      const star = this.add.star(x, y, 5, 3, 7, color).setDepth(150);
      this.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0, angle: 360, scale: 0,
        duration: 500, ease: 'Power2',
        onComplete: () => star.destroy()
      });
    }
  },
  orbitRing(x, y, color, radius) {
    radius = radius || 18;
    for (let i = 0; i < 4; i++) {
      const startA = (Math.PI * 2 * i) / 4;
      const c = this.add.circle(x + Math.cos(startA)*radius, y + Math.sin(startA)*radius, 3, color).setDepth(150);
      const obj = { t: 0 };
      this.tweens.add({
        targets: obj, t: 1, duration: 400, ease: 'Sine.easeInOut',
        onUpdate: () => {
          const a = startA + obj.t * Math.PI * 2;
          c.x = x + Math.cos(a) * radius;
          c.y = y + Math.sin(a) * radius;
          c.alpha = 1 - obj.t;
        },
        onComplete: () => c.destroy()
      });
    }
  },
  goldFountain(x, y, count) {
    count = count || 30;
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI/2 + (Math.random() - 0.5) * 1.2;
      const speed = 150 + Math.random() * 200;
      const p = this.add.circle(x, y, 3 + Math.random()*3, PALETTE.strike).setDepth(150);
      const tgt = {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        t: 0
      };
      this.tweens.add({
        targets: tgt, t: 1, duration: 900, ease: 'Power2',
        onUpdate: () => {
          p.x = x + tgt.vx * tgt.t * 0.7;
          p.y = y + tgt.vy * tgt.t * 0.7 + 500 * tgt.t * tgt.t * 0.5;
          p.alpha = 1 - tgt.t;
        },
        onComplete: () => p.destroy()
      });
    }
  }
};
