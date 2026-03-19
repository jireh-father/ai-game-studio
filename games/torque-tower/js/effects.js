// Torque Tower - Visual Effects & HUD Mixin
// These methods are mixed into GameScene prototype

const GameEffects = {
  createHUD() {
    this.scoreText = this.add.text(12, 12, 'SCORE: ' + this.score, {
      fontSize: '15px', fontFamily: 'Courier New', fill: COLORS.hudText, fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(100);

    this.stageText = this.add.text(GAME_WIDTH / 2, 12, 'STAGE ' + this.stage, {
      fontSize: '15px', fontFamily: 'Courier New', fill: COLORS.hudText
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    // Help button
    const helpBtn = this.add.circle(GAME_WIDTH - 52, 24, 14, 0x2C3E50).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH - 52, 24, '?', { fontSize: '16px', fontFamily: 'Courier New', fill: COLORS.hudText, fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    helpBtn.on('pointerdown', () => {
      this.pauseGame();
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });

    // Pause button
    const pauseBtn = this.add.circle(GAME_WIDTH - 20, 24, 14, 0x2C3E50).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH - 20, 24, 'II', { fontSize: '12px', fontFamily: 'Courier New', fill: COLORS.hudText, fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    pauseBtn.on('pointerdown', () => this.pauseGame());

    // Tilt meter
    this.tiltBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 18, GAME_WIDTH - 20, 10, 0x1A1F2E)
      .setScrollFactor(0).setDepth(100).setStrokeStyle(1, 0x2C3E50);
    this.tiltFill = this.add.rectangle(10, GAME_HEIGHT - 18, 0, 8, 0x00C9A7)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'STABILITY', {
      fontSize: '8px', fontFamily: 'Courier New', fill: '#556677'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    // Combo text
    this.comboText = this.add.text(GAME_WIDTH / 2, 55, '', {
      fontSize: '16px', fontFamily: 'Courier New', fill: COLORS.accent, fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);

    // Control hint (stages 1-3)
    if (this.stage <= 3) {
      this.hintText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'TAP LEFT / RIGHT', {
        fontSize: '12px', fontFamily: 'Courier New', fill: '#556677'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    }
  },

  updateHUD() {
    this.scoreText.setText('SCORE: ' + this.score);
    this.stageText.setText('STAGE ' + this.stage);
  },

  updateTiltMeter() {
    const pct = Math.min(this.towerTilt / TILT_THRESHOLDS.collapse, 1);
    const barW = (GAME_WIDTH - 20) * pct;
    let color = 0x00C9A7;
    if (this.towerTilt > TILT_THRESHOLDS.danger) color = 0xFF2222;
    else if (this.towerTilt > TILT_THRESHOLDS.warning) color = 0xFF8C00;
    this.tweens.add({ targets: this.tiltFill, displayWidth: barW, duration: 300, ease: 'Power2' });
    this.tiltFill.setFillStyle(color);
  },

  spawnTapParticles(x, y, dir, color) {
    for (let i = 0; i < 3; i++) {
      const p = this.add.rectangle(x + dir * 20, y + (i - 1) * 8, 4, 4, Phaser.Display.Color.HexStringToColor(color).color);
      p.setDepth(50);
      this.tweens.add({
        targets: p, x: p.x + dir * (40 + Math.random() * 30), y: p.y + (Math.random() - 0.5) * 40,
        alpha: 0, duration: 200, onComplete: () => p.destroy()
      });
    }
  },

  spawnLandingParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const p = this.add.rectangle(x, y, 5, 5, color).setDepth(50);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * (60 + Math.random() * 40),
        y: y + Math.sin(angle) * (60 + Math.random() * 40),
        alpha: 0, scale: 0, duration: 350, onComplete: () => p.destroy()
      });
    }
  },

  showPerfectEffects() {
    // Hit-stop via setTimeout (NEVER delayedCall with timeScale=0)
    const ts = this.matter.world.engine.timing.timeScale;
    this.matter.world.engine.timing.timeScale = 0;
    setTimeout(() => {
      if (this.matter.world && this.matter.world.engine) {
        this.matter.world.engine.timing.timeScale = ts;
      }
    }, 60);

    // White flash
    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFFFFFF, 0.25)
      .setScrollFactor(0).setDepth(150);
    this.tweens.add({ targets: flash, alpha: 0, duration: 120, onComplete: () => flash.destroy() });

    // Block squash/stretch
    if (this.activeBlock) {
      this.tweens.add({
        targets: this.activeBlock, scaleX: 1.05, scaleY: 0.85, duration: 50, yoyo: true,
        onComplete: () => {
          if (this.activeBlock) this.tweens.add({ targets: this.activeBlock, scaleX: 1, scaleY: 1, duration: 50 });
        }
      });
    }

    // Particle burst
    if (this.activeBlock) this.spawnLandingParticles(this.activeBlock.x, this.activeBlock.y, 8, 0xFFFFFF);

    // Combo text
    if (this.combo >= 2) {
      this.comboText.setText('PERFECT x' + this.combo + '!').setAlpha(1).setScale(1);
      this.tweens.add({
        targets: this.comboText, scale: 1.6, duration: 150, yoyo: true,
        onComplete: () => {
          this.tweens.add({ targets: this.comboText, alpha: 0, duration: 400, delay: 300 });
        }
      });
    }

    this.cameras.main.shake(100, 0.003);
  },

  showGoodEffects() {
    if (this.activeBlock) this.spawnLandingParticles(this.activeBlock.x, this.activeBlock.y, 4, 0xE8EAF0);
  },

  showBadEffects() {
    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFF4444, 0.2)
      .setScrollFactor(0).setDepth(150);
    this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
    this.cameras.main.shake(150, 0.005);
  },

  showScoreFloat(x, y, points, quality) {
    const colors = { perfect: '#FFFFFF', good: '#E8EAF0', bad: '#FF4444', veryBad: '#FF4444', milestone: '#FFD700' };
    const txt = this.add.text(x, y, '+' + points, {
      fontSize: '18px', fontFamily: 'Courier New', fill: colors[quality] || '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(110);
    this.tweens.add({ targets: txt, y: y - 60, alpha: 0, duration: 700, ease: 'Power2', onComplete: () => txt.destroy() });
    this.tweens.add({ targets: this.scoreText, scale: 1.35, duration: 125, yoyo: true });
  },

  showPauseOverlay() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    const overlay = this.add.container(0, 0).setScrollFactor(0).setDepth(300);

    overlay.add(this.add.rectangle(w / 2, h / 2, w, h, 0x1A1F2E, 0.85).setScrollFactor(0));
    overlay.add(this.add.text(w / 2, h * 0.3, 'PAUSED', {
      fontSize: '28px', fontFamily: 'Courier New', fill: COLORS.accent, fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0));

    const resumeBtn = this.add.rectangle(w / 2, h * 0.48, 200, 44, 0x00D4FF).setScrollFactor(0).setInteractive({ useHandCursor: true });
    const resumeTxt = this.add.text(w / 2, h * 0.48, 'RESUME', { fontSize: '18px', fontFamily: 'Courier New', fill: '#0D1117', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0);
    resumeTxt.disableInteractive();
    overlay.add(resumeBtn); overlay.add(resumeTxt);

    const helpBtn = this.add.rectangle(w / 2, h * 0.58, 200, 38, 0x2C3E50).setScrollFactor(0).setInteractive({ useHandCursor: true });
    const helpTxt = this.add.text(w / 2, h * 0.58, 'HOW TO PLAY', { fontSize: '14px', fontFamily: 'Courier New', fill: COLORS.hudText }).setOrigin(0.5).setScrollFactor(0);
    helpTxt.disableInteractive();
    overlay.add(helpBtn); overlay.add(helpTxt);

    const quitBtn = this.add.rectangle(w / 2, h * 0.68, 200, 38, 0x2C3E50).setScrollFactor(0).setInteractive({ useHandCursor: true });
    const quitTxt = this.add.text(w / 2, h * 0.68, 'QUIT TO MENU', { fontSize: '14px', fontFamily: 'Courier New', fill: COLORS.hudText }).setOrigin(0.5).setScrollFactor(0);
    quitTxt.disableInteractive();
    overlay.add(quitBtn); overlay.add(quitTxt);

    overlay.add(this.add.text(w / 2, h * 0.78, 'SCORE: ' + this.score + '  |  STAGE ' + this.stage, {
      fontSize: '12px', fontFamily: 'Courier New', fill: '#8899AA'
    }).setOrigin(0.5).setScrollFactor(0));

    resumeBtn.on('pointerdown', () => { overlay.destroy(); this.scene.resume(); });
    helpBtn.on('pointerdown', () => { this.scene.launch('HelpScene', { returnTo: 'GameScene' }); });
    quitBtn.on('pointerdown', () => { overlay.destroy(); this.scene.stop('GameScene'); this.scene.start('MenuScene'); });
  }
};
