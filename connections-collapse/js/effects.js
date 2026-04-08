// Juice effects - burst, shake, hit-stop, audio
const Effects = {
  shake(scene, intensity = 0.008, dur = 150) {
    scene.cameras.main.shake(dur, intensity);
  },
  punch(scene, target, scale = 1.3, dur = 90) {
    if (!target || !target.scene) return;
    scene.tweens.add({
      targets: target,
      scaleX: scale, scaleY: scale,
      duration: dur, yoyo: true, ease: 'Quad.out'
    });
  },
  burst(scene, x, y, color, count = 20) {
    // PARTICLE CAP 48 hard cap
    count = Math.min(count, PARTICLE_CAP);
    const particles = scene.add.particles(x, y, 'particle', {
      speed: { min: 120, max: 320 },
      angle: { min: 0, max: 360 },
      lifespan: 450,
      quantity: count,
      scale: { start: 0.7, end: 0 },
      tint: color,
      blendMode: 'ADD'
    });
    particles.setDepth(100);
    scene.time.delayedCall(600, () => particles.destroy());
  },
  floatText(scene, x, y, text, color = '#ffd700', size = 22) {
    const t = scene.add.text(x, y, text, {
      fontFamily: 'Arial Black', fontSize: size + 'px',
      color, stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(200);
    scene.tweens.add({
      targets: t, y: y - 60, alpha: 0,
      duration: 700, ease: 'Cubic.out',
      onComplete: () => t.destroy()
    });
  },
  hitStop(scene, ms = 40) {
    if (scene.physics && scene.physics.world) scene.physics.world.pause();
    // Use setTimeout, not delayedCall (known bug)
    setTimeout(() => {
      if (scene.scene && scene.scene.isActive() && scene.physics && scene.physics.world)
        scene.physics.world.resume();
    }, ms);
  },
  flash(scene, color = 0xffffff, dur = 100) {
    scene.cameras.main.flash(dur, (color >> 16) & 255, (color >> 8) & 255, color & 255);
  },
  beep(freq = 440, dur = 0.08, type = 'square', vol = 0.08) {
    try {
      if (!window._actx) window._actx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = window._actx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.stop(ctx.currentTime + dur);
    } catch (e) {}
  },
  clearSound(combo = 0) {
    const base = 440 + combo * 80;
    this.beep(base, 0.08, 'square', 0.1);
    setTimeout(() => this.beep(base * 1.5, 0.1, 'square', 0.08), 60);
  },
  wrongSound() {
    this.beep(140, 0.2, 'sawtooth', 0.12);
  },
  deathSound() {
    this.beep(100, 0.4, 'sawtooth', 0.15);
    setTimeout(() => this.beep(60, 0.5, 'sawtooth', 0.15), 200);
  },
  selectSound() {
    this.beep(700, 0.04, 'sine', 0.06);
  }
};
