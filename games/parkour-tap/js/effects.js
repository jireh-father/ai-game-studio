// effects.js - Audio, particles, screen shake, motion trails, animations

const SFX = {
  ctx: null, enabled: true,
  getCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  play(type, pm) {
    if (!this.enabled) return;
    const c = this.getCtx(), n = c.currentTime; pm = pm || 1;
    const g = c.createGain(); g.connect(c.destination);
    const osc = (freq, dur, t, wave) => {
      const o = c.createOscillator(); o.type = wave || 'sine';
      o.frequency.setValueAtTime(freq, n + (t || 0));
      const gg = t ? c.createGain() : g;
      if (t) { gg.connect(c.destination); gg.gain.setValueAtTime(0.12, n + t); gg.gain.linearRampToValueAtTime(0, n + t + dur); }
      else { g.gain.setValueAtTime(0.14, n); g.gain.linearRampToValueAtTime(0, n + dur); }
      o.connect(gg); o.start(n + (t || 0)); o.stop(n + (t || 0) + dur);
    };
    if (type === 'perfect') { osc(523 * pm, 0.08); osc(659 * pm, 0.08, 0.06); }
    else if (type === 'good') osc(392 * pm, 0.1);
    else if (type === 'stumble') osc(120, 0.2, 0, 'sawtooth');
    else if (type === 'crash') {
      osc(80, 0.3);
      const buf = c.createBuffer(1, c.sampleRate * 0.15, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const ns = c.createBufferSource(); ns.buffer = buf;
      g.gain.setValueAtTime(0.2, n); g.gain.linearRampToValueAtTime(0, n + 0.3);
      ns.connect(g); ns.start(n); ns.stop(n + 0.3);
    }
    else if (type === 'combo') [0, 0.08, 0.16].forEach((t, i) => osc(440 * Math.pow(2, i * 2 / 12) * pm, 0.1, t));
    else if (type === 'stageClear') [0, 0.08, 0.16, 0.24].forEach((t, i) => osc(523 * Math.pow(2, i * 2 / 12), 0.1, t));
    else if (type === 'gameOver') [0, 0.15, 0.3].forEach((t, i) => osc(330 * Math.pow(2, -i * 3 / 12), 0.2, t));
    else if (type === 'highScore') [0, 0.1, 0.2, 0.35].forEach((t, i) => osc(523 * Math.pow(2, [0, 4, 7, 12][i] / 12), 0.2, t));
    else if (type === 'click') {
      const buf = c.createBuffer(1, c.sampleRate * 0.03, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * 0.3;
      const ns = c.createBufferSource(); ns.buffer = buf;
      g.gain.setValueAtTime(0.1, n); g.gain.linearRampToValueAtTime(0, n + 0.05);
      ns.connect(g); ns.start(n); ns.stop(n + 0.05);
    }
  }
};

const Effects = {
  screenShake(sc, intensity, dur) {
    if (!sc || !sc.cameras) return;
    sc.cameras.main.shake(dur || 80, (intensity || 2) / 400);
  },
  scalePunch(obj, scale, dur) {
    if (!obj || !obj.scene) return;
    obj.scene.tweens.add({ targets: obj, scaleX: scale || 1.3, scaleY: scale || 1.3, duration: dur || 100, yoyo: true, ease: 'Quad.easeOut' });
  },
  floatingText(sc, text, x, y, color, size) {
    if (!sc || !sc.add) return;
    const t = sc.add.text(x, y, text, { fontSize: (size || 20) + 'px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: color || COLORS_HEX.COMBO_GLOW }).setOrigin(0.5).setDepth(100);
    sc.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 600, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  },
  cameraZoom(sc, z, d) {
    if (!sc || !sc.cameras) return;
    sc.tweens.add({ targets: sc.cameras.main, zoom: z || 1.03, duration: d || 100, yoyo: true, ease: 'Quad.easeOut' });
  },
  redFlash(sc) {
    if (!sc || !sc.add) return;
    const { width: w, height: h } = sc.cameras.main;
    const f = sc.add.rectangle(w / 2, h / 2, w, h, 0xFF0000, 0.3).setDepth(200).setScrollFactor(0);
    sc.tweens.add({ targets: f, alpha: 0, duration: 300, onComplete: () => f.destroy() });
  },
  whiteFlash(sc) {
    if (!sc || !sc.add) return;
    const { width: w, height: h } = sc.cameras.main;
    const f = sc.add.rectangle(w / 2, h / 2, w, h, 0xFFFFFF, 0.6).setDepth(200).setScrollFactor(0);
    sc.tweens.add({ targets: f, alpha: 0, duration: 200, onComplete: () => f.destroy() });
  },
  animateVault(sc, runner, startY) {
    sc.tweens.add({ targets: runner, y: startY - 50, angle: 360, duration: 300, ease: 'Sine.easeOut',
      onComplete: () => { sc.tweens.add({ targets: runner, y: startY, angle: 0, duration: 150, ease: 'Bounce.easeOut' }); }
    });
  },
  animateSlide(sc, runner) {
    const orig = runner.scaleY;
    sc.tweens.add({ targets: runner, scaleY: orig * 0.5, duration: 100, yoyo: true, hold: 100, ease: 'Quad.easeInOut' });
    for (let i = 0; i < 4; i++) {
      const ln = sc.add.rectangle(runner.x - 20 - i * 15, runner.y - 10 + i * 6, 25, 2, COLORS.RUNNER, 0.5).setDepth(45);
      sc.tweens.add({ targets: ln, alpha: 0, x: ln.x - 30, duration: 200, onComplete: () => ln.destroy() });
    }
  },
  animateWallJump(sc, runner, groundY) {
    const sy = runner.y;
    sc.tweens.add({ targets: runner, y: sy - 70, duration: 200, ease: 'Sine.easeOut',
      onComplete: () => { sc.tweens.add({ targets: runner, y: sy, duration: 200, ease: 'Bounce.easeOut' }); }
    });
    for (let i = 0; i < 6; i++) {
      const p = sc.add.circle(runner.x + Phaser.Math.Between(-10, 10), groundY + Phaser.Math.Between(-5, 5), 3, COLORS.GROUND, 0.6).setDepth(45);
      sc.tweens.add({ targets: p, alpha: 0, y: p.y + 20, x: p.x + Phaser.Math.Between(-20, 20), duration: 300, onComplete: () => p.destroy() });
    }
  },
  spawnGhostTrail(sc, runner, combo) {
    const g = sc.add.image(runner.x - 6, runner.y, 'runner').setScale(runner.scaleX).setAlpha(0.2).setDepth(40).setOrigin(0.5, 1);
    if (combo >= COMBO_THRESHOLDS.COLOR_SHIFT) g.setTint(COLORS.COMBO_GLOW);
    sc.tweens.add({ targets: g, alpha: 0, x: g.x - 15, duration: 200, onComplete: () => g.destroy() });
    return g;
  },
  wobbleRunner(sc, runner, baseX) {
    sc.tweens.add({ targets: runner, x: baseX - 5, duration: 33, yoyo: true, repeat: 5,
      onComplete: () => { runner.x = baseX; }
    });
  },
  squashRunner(sc, runner) {
    sc.tweens.add({ targets: runner, scaleX: 0.4, duration: 100, yoyo: true, hold: 100, ease: 'Quad.easeIn' });
  },
  fadeObstacle(sc, obs) {
    sc.tweens.add({ targets: [obs.sprite, obs.glow], alpha: 0, duration: 200,
      onComplete: () => { if (obs.sprite) obs.sprite.destroy(); if (obs.glow) obs.glow.destroy(); }
    });
  }
};
