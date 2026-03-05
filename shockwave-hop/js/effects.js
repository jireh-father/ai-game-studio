// Shockwave Hop - Juice Effects

const Effects = {
  scene: null,

  init(scene) {
    this.scene = scene;
  },

  jumpParticles(x, y) {
    const s = this.scene;
    if (!s || !s.textures.exists('particle')) return;
    const p = s.add.particles(x, y, 'particle', {
      speed: { min: 40, max: 120 },
      angle: { min: 240, max: 300 },
      lifespan: 300,
      quantity: 8,
      scale: { start: 0.8, end: 0 },
      gravityY: 200
    });
    s.time.delayedCall(350, () => p.destroy());
  },

  landingSquash(player) {
    const s = this.scene;
    if (!s) return;
    s.tweens.add({
      targets: player, scaleY: 0.7, scaleX: 1.2,
      duration: 80, yoyo: true, ease: 'Sine.easeOut'
    });
  },

  jumpStretch(player) {
    const s = this.scene;
    if (!s) return;
    s.tweens.add({
      targets: player, scaleY: 1.3, scaleX: 0.85,
      duration: 100, yoyo: true, ease: 'Sine.easeOut'
    });
  },

  counterShockwaveBurst(x, y, comboLevel) {
    const s = this.scene;
    if (!s || !s.textures.exists('particle')) return;
    const count = 20 + Math.min(comboLevel, 5) * 3;
    const tintKey = comboLevel >= 3 ? 'particleGold' : 'particle';
    const tex = s.textures.exists(tintKey) ? tintKey : 'particle';
    const p = s.add.particles(x, y, tex, {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      lifespan: 400,
      quantity: count,
      scale: { start: 0.6, end: 0 }
    });
    s.time.delayedCall(450, () => p.destroy());
  },

  hazardDestroyEffect(x, y) {
    const s = this.scene;
    if (!s) return;
    // White flash
    const flash = s.add.circle(x, y, 15, 0xFFFFFF, 0.8);
    s.tweens.add({
      targets: flash, alpha: 0, scale: 2,
      duration: 80, onComplete: () => flash.destroy()
    });
    // Orange particles
    if (s.textures.exists('particleOrange')) {
      const p = s.add.particles(x, y, 'particleOrange', {
        speed: { min: 60, max: 180 },
        angle: { min: 0, max: 360 },
        lifespan: 250,
        quantity: 8,
        scale: { start: 0.6, end: 0 }
      });
      s.time.delayedCall(300, () => p.destroy());
    }
  },

  floatingScore(x, y, text, color) {
    const s = this.scene;
    if (!s) return;
    const col = color || COLORS_HEX.reward;
    const txt = s.add.text(x, y, text, {
      fontSize: '22px', fontFamily: 'Arial Black, sans-serif',
      color: col, stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(50);
    txt.disableInteractive();
    s.tweens.add({
      targets: txt, y: y - 60, alpha: 0,
      duration: 600, onComplete: () => txt.destroy()
    });
  },

  screenShake(intensity, duration) {
    const s = this.scene;
    if (!s) return;
    s.cameras.main.shake(duration || 200, intensity || 0.005);
  },

  screenFlash(color, duration) {
    const s = this.scene;
    if (!s) return;
    s.cameras.main.flash(duration || 150,
      (color >> 16) & 0xFF, (color >> 8) & 0xFF, color & 0xFF, false, null, 0.3);
  },

  cameraZoom(amount, duration) {
    const s = this.scene;
    if (!s) return;
    s.cameras.main.zoomTo(amount || 1.03, 80);
    s.time.delayedCall(duration || 200, () => {
      if (s.cameras && s.cameras.main) s.cameras.main.zoomTo(1, 150);
    });
  },

  hitStop(duration) {
    const s = this.scene;
    if (!s) return;
    s.physics && s.physics.pause && s.physics.pause();
    setTimeout(() => {
      if (s.physics && s.physics.resume) s.physics.resume();
    }, duration || 40);
  },

  deathEffect(x, y) {
    const s = this.scene;
    if (!s) return;
    this.screenShake(0.015, 250);
    this.screenFlash(COLORS.danger, 150);
  },

  platformPulse(platform) {
    const s = this.scene;
    if (!s || !platform) return;
    s.tweens.add({
      targets: platform, scaleX: 1.05, scaleY: 1.3,
      duration: 150, yoyo: true, ease: 'Sine.easeOut'
    });
  },

  comboText(combo) {
    const s = this.scene;
    if (!s) return;
    const size = Math.min(24 + combo * 4, 48);
    const txt = s.add.text(GAME.width / 2, GAME.height / 2 - 40,
      `x${combo} COMBO!`, {
        fontSize: size + 'px', fontFamily: 'Arial Black, sans-serif',
        color: COLORS_HEX.reward, stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5).setDepth(50);
    txt.disableInteractive();
    s.tweens.add({
      targets: txt, alpha: 0, y: txt.y - 30, scale: 1.3,
      duration: 1500, onComplete: () => txt.destroy()
    });
  },

  perfectClear() {
    const s = this.scene;
    if (!s) return;
    const txt = s.add.text(GAME.width / 2, GAME.height / 2 - 80,
      'PERFECT!', {
        fontSize: '48px', fontFamily: 'Arial Black, sans-serif',
        color: COLORS_HEX.reward, stroke: '#000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(50);
    txt.disableInteractive();
    s.tweens.add({
      targets: txt, alpha: 0, scale: 1.5,
      duration: 800, delay: 200, onComplete: () => txt.destroy()
    });
    if (s.textures.exists('particleGold')) {
      const p = s.add.particles(GAME.width / 2, GAME.height / 2 - 80, 'particleGold', {
        speed: { min: 80, max: 250 }, angle: { min: 0, max: 360 },
        lifespan: 600, quantity: 30, scale: { start: 0.8, end: 0 }
      });
      s.time.delayedCall(650, () => p.destroy());
    }
  },

  stageClearText(stageNum) {
    const s = this.scene;
    if (!s) return;
    const txt = s.add.text(GAME.width + 100, GAME.height / 2 - 60,
      `STAGE ${stageNum} CLEAR`, {
        fontSize: '28px', fontFamily: 'Arial Black, sans-serif',
        color: COLORS_HEX.primary, stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5).setDepth(50);
    txt.disableInteractive();
    s.tweens.add({
      targets: txt, x: GAME.width / 2,
      duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        s.time.delayedCall(500, () => {
          s.tweens.add({
            targets: txt, alpha: 0,
            duration: 300, onComplete: () => txt.destroy()
          });
        });
      }
    });
  },

  platformRipple(x, y) {
    const s = this.scene;
    if (!s) return;
    const line = s.add.rectangle(x, y, 60, 2, 0xFFFFFF, 0.6).setDepth(5);
    s.tweens.add({
      targets: line, alpha: 0, scaleX: 2,
      duration: 100, onComplete: () => line.destroy()
    });
  }
};
