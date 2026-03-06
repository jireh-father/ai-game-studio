// effects.js — Juice: particles, sounds, floating text, screen effects

const SFX = {
  playTap(scene) {
    if (!GameState.settings.sound) return;
    try {
      const ctx = scene.sound.context;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = 200 + (Math.random() - 0.5) * 40;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.08);
    } catch(e) {}
  },

  playCollapse(scene, chain) {
    if (!GameState.settings.sound) return;
    try {
      const ctx = scene.sound.context;
      const dur = 0.12;
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const src = ctx.createBufferSource(); src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 2000 + (chain || 0) * 100;
      const gain = ctx.createGain(); gain.gain.value = 0.2;
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      src.start();
      // Bass boom on chain 4+
      if (chain >= 4) {
        const bass = ctx.createOscillator(); const bg = ctx.createGain();
        bass.type = 'sine'; bass.frequency.value = 60;
        bg.gain.setValueAtTime(0.25, ctx.currentTime);
        bg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        bass.connect(bg); bg.connect(ctx.destination);
        bass.start(); bass.stop(ctx.currentTime + 0.25);
      }
    } catch(e) {}
  },

  playDeath(scene) {
    if (!GameState.settings.sound) return;
    try {
      const ctx = scene.sound.context;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.6);
    } catch(e) {}
  },

  playStageAdvance(scene) {
    if (!GameState.settings.sound) return;
    try {
      const ctx = scene.sound.context;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.35);
    } catch(e) {}
  },

  burstParticles(scene, x, y, count, color, lifespan) {
    const c = Phaser.Display.Color.HexStringToColor(color).color;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 80 + Math.random() * 200;
      const p = scene.add.circle(x, y, 3 + Math.random() * 3, c).setDepth(50);
      scene.tweens.add({
        targets: p, x: x + Math.cos(angle) * speed, y: y + Math.sin(angle) * speed,
        alpha: 0, scale: 0, duration: lifespan, onComplete: () => p.destroy()
      });
    }
  },

  floatingScore(scene, x, y, pts, chain) {
    const txt = scene.add.text(x, y, '+' + pts, {
      fontSize: (20 + (chain || 1) * 4) + 'px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.gold
    }).setOrigin(0.5).setDepth(60);
    scene.tweens.add({ targets: txt, y: y - 60, alpha: 0, duration: 600, onComplete: () => txt.destroy() });
  },

  showStageText(scene, stage) {
    SFX.playStageAdvance(scene);
    const txt = scene.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'STAGE ' + stage + '!', {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.accent
    }).setOrigin(0.5).setScale(2).setDepth(70);
    scene.tweens.add({ targets: txt, scaleX: 1, scaleY: 1, duration: 500, ease: 'Cubic.easeOut' });
    scene.tweens.add({ targets: txt, alpha: 0, delay: 1500, duration: 500, onComplete: () => txt.destroy() });
  },

  showPerfectClear(scene) {
    GameState.score += SCORE_VALUES.perfectClear;
    scene.events.emit('scoreUpdate', GameState.score);
    const txt = scene.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 60, 'PERFECT!', {
      fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.gold
    }).setOrigin(0.5).setDepth(70);
    scene.cameras.main.flash(200, 255, 255, 255, false, null, null, 0.3);
    scene.tweens.add({ targets: txt, alpha: 0, delay: 1200, duration: 500, onComplete: () => txt.destroy() });
    SFX.floatingScore(scene, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 30, 500, 1);
  }
};
