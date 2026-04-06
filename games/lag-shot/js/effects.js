// Lag Shot - Visual Effects & Juice (mixed into GameScene prototype)
const GameEffects = {
  // Particle burst at position with given color
  emitParticles(x, y, color, count, speed, lifespan) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.4 + Math.random() * 0.6);
      const p = this.add.circle(x, y, 3, color).setAlpha(1).setDepth(15);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * spd * (lifespan / 1000),
        y: y + Math.sin(angle) * spd * (lifespan / 1000),
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: lifespan, ease: 'Quad.easeOut',
        onComplete: () => p.destroy()
      });
    }
  },

  // Scale punch effect on a sprite
  scalePunch(target, scale, duration) {
    if (!target || !target.active) return;
    this.tweens.add({
      targets: target,
      scaleX: scale, scaleY: scale,
      duration: duration / 2, yoyo: true,
      ease: 'Quad.easeOut'
    });
  },

  // Floating score text
  floatingText(x, y, text, color, fontSize) {
    const txt = this.add.text(x, y, text, {
      fontSize: fontSize || '20px', fontFamily: 'monospace',
      fill: color || COLORS.combo, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: txt, y: y - 50, alpha: 0,
      duration: 600, ease: 'Quad.easeOut',
      onComplete: () => txt.destroy()
    });
  },

  // Muzzle flash at ghost position
  muzzleFlash(x, y) {
    const flash = this.add.circle(x, y, 16, 0xFFFFFF, 1).setDepth(12);
    this.tweens.add({
      targets: flash, alpha: 0, scaleX: 0.3, scaleY: 0.3,
      duration: 80, onComplete: () => flash.destroy()
    });
  },

  // Death effects sequence
  deathEffects() {
    // Screen shake
    this.cameras.main.shake(400, 0.02);
    // Red flash
    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFF0000, 0.6).setDepth(50);
    this.tweens.add({
      targets: flash, alpha: 0, duration: 300,
      onComplete: () => flash.destroy()
    });
    // Player death animation
    if (this.player) {
      this.tweens.add({
        targets: this.player, scaleX: 2, scaleY: 2, alpha: 0, duration: 200
      });
    }
    // Particle explosion from player
    if (this.player) {
      this.emitParticles(this.player.x, this.player.y, COLORS_INT.player, 16, 200, 500);
    }
    // Sound
    audioManager.playPlayerDeath();
  },

  // Wave clear effects
  waveClearEffects(waveNum) {
    const cx = GAME_WIDTH / 2, cy = (GAME_HEIGHT + HUD_HEIGHT) / 2;
    this.emitParticles(cx, cy, 0xFFFFFF, 20, 180, 500);
    const txt = this.add.text(cx, cy, 'WAVE ' + waveNum + ' CLEAR!', {
      fontSize: '22px', fontFamily: 'monospace', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(25).setScale(0);
    this.tweens.add({
      targets: txt, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(800, () => {
          this.tweens.add({
            targets: txt, scaleX: 0, scaleY: 0, duration: 200,
            onComplete: () => txt.destroy()
          });
        });
      }
    });
    audioManager.playWaveClear();
  },

  // Combo display
  showCombo(count) {
    if (this.comboText) this.comboText.destroy();
    const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2 - 40;
    const size = count >= 5 ? '36px' : '28px';
    this.comboText = this.add.text(cx, cy, 'x' + count + '!', {
      fontSize: size, fontFamily: 'monospace', fill: COLORS.combo, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(25).setScale(0);
    this.tweens.add({
      targets: this.comboText,
      scaleX: count >= 5 ? 1.5 : 1.2, scaleY: count >= 5 ? 1.5 : 1.2,
      duration: 100, yoyo: true, ease: 'Quad.easeOut',
      onYoyo: () => {
        if (this.comboText) { this.comboText.setScale(1); }
      }
    });
    if (count >= 3) {
      this.emitParticles(cx, cy, 0xFFEE00, count >= 5 ? 12 : 6, 120, 300);
    }
    if (count >= 5) {
      audioManager.playComboMilestone();
    }
    // Auto-hide combo text
    if (this.comboHideTimer) this.comboHideTimer.remove();
    this.comboHideTimer = this.time.delayedCall(COMBO_DISPLAY_DURATION, () => {
      if (this.comboText) {
        this.tweens.add({
          targets: this.comboText, alpha: 0, duration: 200,
          onComplete: () => { if (this.comboText) { this.comboText.destroy(); this.comboText = null; } }
        });
      }
    });
  },

  // Prediction kill ring
  predictionRing(x, y) {
    const ring = this.add.circle(x, y, 40, 0x000000, 0).setStrokeStyle(2, 0xFFCC00, 0.8).setDepth(14);
    this.tweens.add({
      targets: ring, scaleX: 3, scaleY: 3, alpha: 0,
      duration: 300, onComplete: () => ring.destroy()
    });
    this.floatingText(x, y + 20, '+PREDICTED!', COLORS.gold, '14px');
    audioManager.playPrediction();
  },

  // Enemy hit flash
  enemyHitFlash(enemy) {
    if (!enemy || !enemy.active) return;
    const origTint = enemy.tintTopLeft;
    enemy.setTint(0xFFFFFF);
    setTimeout(() => {
      if (enemy && enemy.active) enemy.clearTint();
    }, 80);
  },

  // Bullet trail particles
  bulletTrail(x, y) {
    for (let i = 0; i < 3; i++) {
      const p = this.add.circle(
        x + (Math.random() - 0.5) * 4,
        y + (Math.random() - 0.5) * 4,
        2, 0xFFFFFF, 0.6
      ).setDepth(10);
      this.tweens.add({
        targets: p, alpha: 0, scaleX: 0, scaleY: 0,
        duration: 60, onComplete: () => p.destroy()
      });
    }
  },

  // Near-miss screen shake
  nearMissShake() {
    this.cameras.main.shake(150, 0.005);
  },

  // Shutdown cleanup
  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    if (this._visHandler) {
      document.removeEventListener('visibilitychange', this._visHandler);
    }
  }
};
