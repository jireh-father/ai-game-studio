// Swipe Dojo - Visual Effects & Juice
'use strict';

// Mixin: adds effect methods to GameScene
const GameEffects = {
  _blockJuice(quality) {
    if (quality === 'perfect') {
      this.cameras.main.flash(80, 255, 255, 255, false, null, null, 0.6);
      this.cameras.main.shake(100, 0.004);
      this.time.timeScale = 0;
      setTimeout(() => { if (this.time) this.time.timeScale = 1; }, 40);
    } else if (quality === 'good') {
      this.cameras.main.flash(50, 255, 255, 255, false, null, null, 0.3);
      this.cameras.main.shake(80, 0.002);
      this.time.timeScale = 0;
      setTimeout(() => { if (this.time) this.time.timeScale = 1; }, 30);
    }
    if (this.combo >= 20) {
      this.cameras.main.setZoom(1.03);
    } else if (this.combo >= 10) {
      this.cameras.main.setZoom(1.015);
    }
  },

  _blockParticles(quality) {
    const count = quality === 'perfect' ? 25 : quality === 'good' ? 18 : 10;
    const em = this.add.particles(GAME_WIDTH / 2, 200, 'particle', {
      speed: { min: 80, max: 250 }, angle: { min: 0, max: 360 }, lifespan: 300,
      quantity: count, tint: DIRECTION_COLORS[this.expectedDirection], scale: { start: 0.8, end: 0 }, maxParticles: count
    });
    this.time.delayedCall(400, () => em.destroy());
  },

  _comboMilestoneParticles() {
    const em = this.add.particles(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'particle', {
      speed: { min: 100, max: 300 }, angle: { min: 0, max: 360 }, lifespan: 400,
      quantity: 30, tint: PALETTE.comboGlow, scale: { start: 0.7, end: 0 }, maxParticles: 30
    });
    this.time.delayedCall(500, () => em.destroy());
  },

  _floatingScore(points, quality) {
    const colors = { perfect: PALETTE.comboGlowHex, good: '#FFFFFF', late: '#AAAAAA' };
    const txt = this.add.text(GAME_WIDTH / 2, 260, `+${points}`, {
      fontSize: '22px', fontFamily: 'Arial Black', color: colors[quality] || '#FFFFFF',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: txt, y: txt.y - 60, alpha: 0, duration: 600,
      onComplete: () => txt.destroy()
    });
  },

  _drawArrow(dir) {
    this.arrowGraphics.clear();
    const color = DIRECTION_COLORS[dir];
    const cx = GAME_WIDTH / 2;
    const cy = 200;

    this.arrowGraphics.fillStyle(color, 1);
    this.arrowGraphics.lineStyle(3, color, 0.4);
    this.arrowGraphics.strokeCircle(cx, cy, 36);

    if (dir === 'UP') {
      this.arrowGraphics.fillTriangle(cx, cy - 30, cx - 16, cy - 4, cx + 16, cy - 4);
      this.arrowGraphics.fillRect(cx - 5, cy - 4, 10, 22);
    } else if (dir === 'DOWN') {
      this.arrowGraphics.fillTriangle(cx, cy + 30, cx - 16, cy + 4, cx + 16, cy + 4);
      this.arrowGraphics.fillRect(cx - 5, cy - 18, 10, 22);
    } else if (dir === 'LEFT') {
      this.arrowGraphics.fillTriangle(cx - 30, cy, cx - 4, cy - 16, cx - 4, cy + 16);
      this.arrowGraphics.fillRect(cx - 4, cy - 5, 22, 10);
    } else if (dir === 'RIGHT') {
      this.arrowGraphics.fillTriangle(cx + 30, cy, cx + 4, cy - 16, cx + 4, cy + 16);
      this.arrowGraphics.fillRect(cx - 18, cy - 5, 22, 10);
    }

    // Spawn scale animation
    this.arrowGraphics.setScale(0.4);
    this.tweens.add({ targets: this.arrowGraphics, scaleX: 1, scaleY: 1, duration: 150, ease: 'Back.easeOut' });

    // Glow pulse
    if (this.arrowGlowTween) this.arrowGlowTween.stop();
    this.arrowGlowTween = this.tweens.add({
      targets: this.arrowGraphics, alpha: { from: 0.5, to: 1 }, duration: 200, yoyo: true, repeat: -1
    });
  },

  _startArrowUrgency() {
    if (this.arrowUrgencyTween) this.arrowUrgencyTween.stop();
    this.arrowUrgencyTween = this.tweens.add({
      targets: this.arrowGraphics, x: { from: -4, to: 4 }, duration: 60, yoyo: true, repeat: 6
    });
  },

  _clearArrow() {
    this.arrowGraphics.clear();
    this.arrowGraphics.setScale(1).setAlpha(1).setX(0);
    if (this.arrowGlowTween) { this.arrowGlowTween.stop(); this.arrowGlowTween = null; }
    if (this.arrowUrgencyTween) { this.arrowUrgencyTween.stop(); this.arrowUrgencyTween = null; }
  },

  _enemyDeathBurst() {
    const em = this.add.particles(GAME_WIDTH / 2, 200, 'particle', {
      speed: { min: 120, max: 350 }, angle: { min: 0, max: 360 }, lifespan: 400,
      quantity: 30, tint: this.currentStage.fillColor, scale: { start: 0.9, end: 0 }, maxParticles: 30
    });
    this.time.delayedCall(500, () => em.destroy());
  },

  _stageClearCelebration() {
    this.tweens.add({
      targets: this.cameras.main, zoom: 1.05, duration: 250, yoyo: true, ease: 'Sine.easeInOut'
    });
    const colors = [PALETTE.comboGlow, 0xFFFFFF, PALETTE.arrowUp, PALETTE.arrowDown];
    colors.forEach(c => {
      const em = this.add.particles(
        Phaser.Math.Between(60, GAME_WIDTH - 60),
        Phaser.Math.Between(150, 400), 'particle', {
        speed: { min: 80, max: 250 }, angle: { min: 0, max: 360 },
        lifespan: 500, quantity: 10, tint: c,
        scale: { start: 0.6, end: 0 }, maxParticles: 10
      });
      this.time.delayedCall(600, () => em.destroy());
    });
  },

  _showPauseOverlay() {
    const cx = GAME_WIDTH / 2;
    const bg = this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.88).setInteractive().setDepth(100);
    const title = this.add.text(cx, 200, 'PAUSED', {
      fontSize: '40px', fontFamily: 'Arial Black', color: PALETTE.uiText
    }).setOrigin(0.5).setDepth(101);

    const resume = this.add.rectangle(cx, 310, 200, 50, PALETTE.comboGlow).setInteractive().setDepth(101);
    const resumeT = this.add.text(cx, 310, 'RESUME', {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#000000'
    }).setOrigin(0.5).setDepth(102);
    resume.on('pointerdown', () => this.togglePause());

    const restart = this.add.rectangle(cx, 380, 200, 50, 0x555555).setInteractive().setDepth(101);
    const restartT = this.add.text(cx, 380, 'RESTART', {
      fontSize: '22px', fontFamily: 'Arial Black', color: PALETTE.uiText
    }).setOrigin(0.5).setDepth(102);
    restart.on('pointerdown', () => {
      audioSynth.stopMusic();
      this.scene.restart();
    });

    const menu = this.add.text(cx, 450, 'MENU', {
      fontSize: '18px', fontFamily: 'Arial', color: '#888888'
    }).setOrigin(0.5).setDepth(101).setInteractive();
    menu.on('pointerdown', () => {
      audioSynth.stopMusic();
      this.scene.start('MenuScene');
    });

    this.pauseOverlayParts = [bg, title, resume, resumeT, restart, restartT, menu];
  },

  _hidePauseOverlay() {
    this.pauseOverlayParts.forEach(p => p.destroy());
    this.pauseOverlayParts = [];
  },

  // v2: Counter-attack system
  _openCounterWindow() {
    this.counterWindowOpen = true;
    this._showCounterFlash();
    if (this.counterTimer) this.counterTimer.remove();
    this.counterTimer = this.time.delayedCall(COUNTER_WINDOW_MS, () => { this.counterWindowOpen = false; });
  },

  _executeCounter() {
    this.counterWindowOpen = false;
    if (this.counterTimer) { this.counterTimer.remove(); this.counterTimer = null; }
    this.currentEnemyHP -= COUNTER_BONUS_DAMAGE;
    const bm = this.scoreMult * (this.doublePointsActive ? 2 : 1);
    const bonus = Math.floor(COUNTER_BONUS_SCORE * bm);
    this.score += bonus;
    this.hud.updateScore(this.score);
    this._floatingScore(bonus, 'perfect');
    this._counterSlashEffect();
    this._updateHPBar();
    audioSynth.playBlock('perfect', this.combo);
    if (this.currentEnemyHP <= 0) this._enemyDefeated();
  },

  _showCounterFlash() {
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'COUNTER!', {
      fontSize: '32px', fontFamily: 'Arial Black', color: '#00AAFF',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(30).setAlpha(0);
    this.tweens.add({
      targets: txt, alpha: 1, scaleX: 1.3, scaleY: 1.3, duration: 150, yoyo: true,
      hold: 300, onComplete: () => txt.destroy()
    });
  },

  _counterSlashEffect() {
    this.cameras.main.flash(60, 0, 170, 255, false, null, null, 0.5);
    this.cameras.main.shake(80, 0.005);
    const emitter = this.add.particles(GAME_WIDTH / 2, 200, 'particle', {
      speed: { min: 150, max: 350 }, angle: { min: -30, max: 30 },
      lifespan: 250, quantity: 20, tint: 0x00AAFF,
      scale: { start: 0.9, end: 0 }, maxParticles: 20
    });
    this.time.delayedCall(350, () => emitter.destroy());
    // Blue slash line
    const g = this.add.graphics().setDepth(25);
    g.lineStyle(4, 0x00AAFF, 1);
    g.lineBetween(GAME_WIDTH / 2 - 50, 220, GAME_WIDTH / 2 + 50, 180);
    this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
  },

  // v2: Power-up spawning & collection
  _spawnPowerup() {
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    const x = Phaser.Math.Between(80, GAME_WIDTH - 80);
    const bg = this.add.circle(x, 180, 22, type.color, 0.85).setDepth(25).setInteractive();
    const txt = this.add.text(x, 180, type.emoji, { fontSize: '20px' }).setOrigin(0.5).setDepth(26);
    const lbl = this.add.text(x, 210, type.desc, { fontSize: '10px', fontFamily: 'Arial Black', color: type.hex }).setOrigin(0.5).setDepth(26);
    this.tweens.add({ targets: [bg, txt, lbl], y: '+=120', duration: POWERUP_FLOAT_DURATION, ease: 'Sine.easeIn' });
    bg.on('pointerdown', () => {
      this._collectPowerup(type);
      this._powerupCollectEffect(bg.x, bg.y, type.color);
      bg.destroy(); txt.destroy(); lbl.destroy();
    });
    this.time.delayedCall(POWERUP_FLOAT_DURATION, () => { if (bg.active) { bg.destroy(); txt.destroy(); lbl.destroy(); } });
  },

  _collectPowerup(type) {
    audioSynth.playComboMilestone(10);
    if (type.id === 'shield') {
      this.activeShield = true;
      this.hud.showShieldIcon();
      this.playerSprite.setTint(0x00FFFF);
      this.time.delayedCall(300, () => this.playerSprite.clearTint());
    } else if (type.id === 'slow') {
      this.slowTimeActive = true;
      this.hud.showPowerupTimer('SLOW', type.hex, type.duration);
      this.time.delayedCall(type.duration, () => { this.slowTimeActive = false; });
    } else if (type.id === 'double') {
      this.doublePointsActive = true;
      this.hud.showPowerupTimer('x2', type.hex, type.duration);
      this.time.delayedCall(type.duration, () => { this.doublePointsActive = false; });
    }
  },

  _powerupCollectEffect(x, y, color) {
    const emitter = this.add.particles(x, y, 'particle', {
      speed: { min: 80, max: 200 }, angle: { min: 0, max: 360 },
      lifespan: 300, quantity: 15, tint: color,
      scale: { start: 0.7, end: 0 }, maxParticles: 15
    });
    this.time.delayedCall(400, () => emitter.destroy());
    this.cameras.main.flash(60, 255, 255, 255, false, null, null, 0.3);
  },

  _shieldBreakEffect() {
    const emitter = this.add.particles(GAME_WIDTH / 2, GAME_HEIGHT - 140, 'particle', {
      speed: { min: 100, max: 250 }, angle: { min: 0, max: 360 },
      lifespan: 300, quantity: 20, tint: 0x00FFFF,
      scale: { start: 0.8, end: 0 }, maxParticles: 20
    });
    this.time.delayedCall(400, () => emitter.destroy());
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 180, 'SHIELD!', {
      fontSize: '20px', fontFamily: 'Arial Black', color: '#00FFFF', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({ targets: txt, y: txt.y - 40, alpha: 0, duration: 500, onComplete: () => txt.destroy() });
  },

  // v2: Heal effect for perfect streak
  _healEffect() {
    this.cameras.main.flash(100, 0, 255, 100, false, null, null, 0.4);
    const heart = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 120, '\u2764', {
      fontSize: '32px'
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: heart, y: heart.y - 80, alpha: 0, duration: 800, onComplete: () => heart.destroy() });
    const emitter = this.add.particles(GAME_WIDTH / 2, GAME_HEIGHT - 140, 'particle', {
      speed: { min: 50, max: 150 }, angle: { min: 240, max: 300 },
      lifespan: 400, quantity: 12, tint: 0x00FF88,
      scale: { start: 0.6, end: 0 }, maxParticles: 12
    });
    this.time.delayedCall(500, () => emitter.destroy());
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, '+1 HP', {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#00FF88', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: txt, y: txt.y - 40, alpha: 0, duration: 600, onComplete: () => txt.destroy() });
  }
};
