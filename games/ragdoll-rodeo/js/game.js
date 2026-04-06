// game.js — Core GameScene: create, input, update loop, grip/release

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.continueStage = data && data.continueStage ? data.continueStage : null;
    this.continueScore = data && data.continueScore ? data.continueScore : 0;
  }

  create() {
    GameState.score = this.continueScore || 0;
    GameState.stage = this.continueStage || 1;
    GameState.gripPercent = 100;
    GameState.isGripping = false;
    GameState.gameOver = false;
    GameState.streak = 0;
    GameState.lastInputTime = Date.now();
    this.paused = false;
    this.ejecting = false;
    this.stageTimer = 0;
    this.buckActive = false;
    this.buckElapsed = 0;
    this.currentBuck = null;
    this.bullBaseY = 380;
    this.bullX = GAME_WIDTH / 2;
    this.bullY = this.bullBaseY;
    this.bullAngle = 0;
    this.bullVelX = 0;
    this.bullVelY = 0;
    this.cowboyOffsetX = 0;
    this.cowboyOffsetY = -45;
    this.cowboyVelX = 0;
    this.cowboyVelY = 0;
    this.cowboyFlying = false;
    this.releaseTime = 0;
    this.regripWindowOpen = false;
    this.stageCleared = false;
    this.warningPulse = 0;

    this.stageMgr = new StageManager();
    this.drawArena();
    this.createBull();
    this.createCowboy();
    this.createGripMeter();
    this.createHUD();
    this.setupInput();
    this.loadStage(GameState.stage);

    this.visHandler = () => {
      if (document.hidden && !GameState.gameOver) this.togglePause();
    };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  drawArena() {
    this.add.rectangle(GAME_WIDTH / 2, 80, GAME_WIDTH, 160, COLORS.deepBlue);
    const crowd = this.add.graphics();
    crowd.fillStyle(0x1a0a00);
    for (let x = 0; x < GAME_WIDTH; x += 40) crowd.fillEllipse(x + 20, 158, 36, 24);
    this.add.rectangle(GAME_WIDTH / 2, 172, GAME_WIDTH, 12, COLORS.saddleBrown).setStrokeStyle(2, 0x5D4037);
    this.add.rectangle(GAME_WIDTH / 2, 440, GAME_WIDTH, 536, COLORS.arenaSand);
    this.add.ellipse(GAME_WIDTH / 2, 460, 180, 30, 0x000000, 0.12);
    this.touchZoneBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 70, GAME_WIDTH, 140, 0x000000, 0.2);
    this.touchHint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 70, 'HOLD ANYWHERE TO GRIP', {
      fontSize: '16px', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.7);
  }

  createBull() {
    this.bull = this.add.image(this.bullX, this.bullY, 'bull').setScale(1.3).setDepth(10);
    this.bullShadow = this.add.ellipse(this.bullX, 460, 100, 20, 0x000000, 0.15);
  }

  createCowboy() {
    this.cowboy = this.add.image(this.bullX + this.cowboyOffsetX, this.bullY + this.cowboyOffsetY, 'cowboy')
      .setScale(0.9).setDepth(20);
    this.ropeGfx = this.add.graphics().setDepth(15);
  }

  createGripMeter() {
    this.gripBg = this.add.rectangle(GAME_WIDTH / 2, 530, 204, 24, COLORS.darkBrown).setDepth(30);
    this.gripBg.setStrokeStyle(2, 0x1a0a00);
    this.gripFill = this.add.rectangle(GAME_WIDTH / 2, 530, 196, 18, COLORS.brightGreen).setDepth(31);
    this.gripIcon = this.add.text(GAME_WIDTH / 2 + 105, 530, '✊', { fontSize: '14px' }).setOrigin(0.5).setDepth(32);
  }

  createHUD() {
    this.scoreText = this.add.text(16, 12, 'Score: ' + GameState.score, {
      fontSize: '20px', fontFamily: 'Arial Black', fill: '#FFFFFF', stroke: '#000', strokeThickness: 3
    }).setDepth(50);
    this.stageText = this.add.text(GAME_WIDTH / 2, 12, 'Stage ' + GameState.stage, {
      fontSize: '18px', fontFamily: 'Arial Black', fill: COLORS_HEX.goldYellow, stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5, 0).setDepth(50);
    this.timerText = this.add.text(GAME_WIDTH / 2, 38, '', {
      fontSize: '16px', fill: '#FFFFFF', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5, 0).setDepth(50);
    this.streakText = this.add.text(16, 40, '', {
      fontSize: '16px', fontFamily: 'Arial Black', fill: COLORS_HEX.goldYellow, stroke: '#000', strokeThickness: 2
    }).setDepth(50);
    const helpBtn = this.add.text(GAME_WIDTH - 30, 16, '?', {
      fontSize: '26px', fontFamily: 'Arial Black', fill: '#FFFFFF',
      backgroundColor: '#2C3E50', padding: { x: 8, y: 2 }
    }).setOrigin(0.5, 0).setDepth(50).setInteractive();
    helpBtn.on('pointerdown', () => { GameState.lastInputTime = Date.now(); this.togglePause(); });
  }

  setupInput() {
    this.input.on('pointerdown', () => {
      GameState.lastInputTime = Date.now();
      if (this.paused || GameState.gameOver || this.ejecting) return;
      this.applyGrip();
    });
    this.input.on('pointerup', () => {
      GameState.lastInputTime = Date.now();
      if (this.paused || GameState.gameOver || this.ejecting) return;
      this.releaseGrip();
    });
  }

  loadStage(stageNum) {
    this.stageMgr.initStage(stageNum);
    this.stageTimer = this.stageMgr.survivalTime;
    this.stageCleared = false;
    GameState.gripPercent = 100;
    this.scheduleBuck();
    this.stageText.setText('Stage ' + stageNum);
    this.timerText.setText(this.stageTimer + 's');
    const card = this.add.text(GAME_WIDTH / 2, -40, 'STAGE ' + stageNum, {
      fontSize: '32px', fontFamily: 'Arial Black', fill: COLORS_HEX.goldYellow,
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({
      targets: card, y: GAME_HEIGHT / 3, duration: 400, ease: 'Back.easeOut',
      hold: 800, yoyo: true, onComplete: () => card.destroy()
    });
    if (stageNum > 2 && this.touchHint) {
      this.tweens.add({ targets: this.touchHint, alpha: 0, duration: 500 });
    }
  }

  scheduleBuck() {
    if (GameState.gameOver || this.ejecting || this.stageCleared) return;
    const next = this.stageMgr.getNextBuck();
    this.time.delayedCall(next.delay, () => {
      if (GameState.gameOver || this.ejecting || this.stageCleared) return;
      this.startBuck(next.pattern);
    });
  }

  startBuck(patternName) {
    const pattern = BUCK_PATTERNS[patternName];
    if (!pattern) return;
    this.buckActive = true;
    this.buckElapsed = 0;
    this.currentBuck = { ...pattern, name: patternName };
    const maxVel = this.stageMgr.getMaxVelocity();
    this.bullVelX = pattern.forceX * maxVel * (Math.random() > 0.5 ? 1 : -1);
    this.bullVelY = pattern.forceY * maxVel;
    Effects.soundBuck();
    Effects.dustPuff(this, this.bullX, 460);
    this.bull.setTint(0xFF0000);
    this.time.delayedCall(80, () => { if (this.bull && this.bull.active) this.bull.clearTint(); });
  }

  applyGrip() {
    if (this.cowboyFlying) return;
    const wasReleased = !GameState.isGripping;
    GameState.isGripping = true;
    Effects.soundGrip();
    Effects.scalePunch(this, this.cowboy, 1.1, 100);
    if (wasReleased && this.releaseTime > 0) {
      const elapsed = Date.now() - this.releaseTime;
      if (elapsed < this.stageMgr.getRegripWindow()) this.onReGrip(elapsed);
      this.releaseTime = 0;
      this.regripWindowOpen = false;
    }
  }

  releaseGrip() {
    if (this.cowboyFlying) return;
    GameState.isGripping = false;
    this.releaseTime = Date.now();
    this.regripWindowOpen = true;
    Effects.soundRelease();
    Effects.scalePunch(this, this.cowboy, 1.05, 120);
    for (let i = 0; i < 4; i++) {
      const px = this.cowboy.x + Phaser.Math.Between(-10, 10);
      const py = this.cowboy.y + Phaser.Math.Between(-5, 5);
      const dot = this.add.circle(px, py, 3, 0xFFFFFF, 0.7).setDepth(25);
      this.tweens.add({
        targets: dot, y: py - Phaser.Math.Between(40, 80),
        x: px + Phaser.Math.Between(-30, 30), alpha: 0, duration: 300,
        onComplete: () => dot.destroy()
      });
    }
  }

  onReGrip(elapsedMs) {
    GameState.streak++;
    GameState.score += SCORE.reGrip;
    Effects.soundReGrip();
    Effects.shake(this, 0.003, 150);
    Effects.zoomPulse(this, 1.06, 100);
    Effects.floatingText(this, this.cowboy.x, this.cowboy.y - 30, '+' + SCORE.reGrip, COLORS_HEX.brightGreen, 18);
    if (elapsedMs < 150) {
      GameState.score += SCORE.reGrip * (SCORE.perfectMultiplier - 1);
      Effects.soundPerfect();
      Effects.floatingText(this, this.cowboy.x, this.cowboy.y - 60, 'PERFECT!', COLORS_HEX.goldYellow, 28);
      Effects.particleBurst(this, this.cowboy.x, this.cowboy.y, 20, 'particle', 120);
    }
    if (GameState.streak >= 7) {
      Effects.floatingText(this, this.cowboy.x + 40, this.cowboy.y, 'LEGENDARY x' + GameState.streak + '!', COLORS_HEX.goldYellow, 16);
      Effects.shake(this, 0.005, 120);
    } else if (GameState.streak >= 5) {
      Effects.floatingText(this, this.cowboy.x + 40, this.cowboy.y, 'HOT STREAK x' + GameState.streak + '!', COLORS_HEX.hotOrange, 14);
    } else if (GameState.streak >= 3) {
      Effects.floatingText(this, this.cowboy.x + 40, this.cowboy.y, 'STREAK x' + GameState.streak + '!', '#FFFFFF', 13);
    }
    this.updateHUD();
  }

  updateHUD() {
    this.scoreText.setText('Score: ' + GameState.score);
    this.streakText.setText(GameState.streak >= 3 ? 'STREAK x' + GameState.streak : '');
  }

  update(time, delta) {
    if (this.paused || GameState.gameOver) return;
    const dt = delta / 1000;
    if (Date.now() - GameState.lastInputTime > 25000 && !this.ejecting) {
      this.triggerEjection(); return;
    }
    if (this.ejecting) { this.updateEjection(dt); return; }

    if (GameState.isGripping) {
      GameState.gripPercent -= this.stageMgr.getDrainRate() * dt;
      if (GameState.gripPercent <= 0) { GameState.gripPercent = 0; this.triggerEjection(); return; }
    } else {
      GameState.gripPercent = Math.min(100, GameState.gripPercent + this.stageMgr.getRecoveryRate() * dt);
    }
    this.updateGripMeter();

    if (GameState.gripPercent < 20) {
      this.warningPulse += dt * 6;
      this.gripFill.setAlpha(0.5 + Math.sin(this.warningPulse) * 0.5);
    } else { this.gripFill.setAlpha(1); }

    this.updateBull(dt);

    if (GameState.isGripping && !this.cowboyFlying) {
      this.cowboy.x = this.bullX + this.cowboyOffsetX;
      this.cowboy.y = this.bullY + this.cowboyOffsetY;
      this.cowboy.rotation = this.bullAngle * 0.5;
    } else if (!this.cowboyFlying) {
      this.cowboy.y -= 20 * dt;
      this.cowboy.x += Math.sin(time / 300) * 0.5;
      const dist = Phaser.Math.Distance.Between(this.cowboy.x, this.cowboy.y, this.bullX, this.bullY);
      if (dist > 120) { this.triggerEjection(); return; }
    }
    this.drawRope();

    this.stageTimer -= dt;
    this.timerText.setText(Math.ceil(Math.max(0, this.stageTimer)) + 's');
    if (this.stageTimer <= 0 && !this.stageCleared && !this.stageMgr.stageTransitioning) {
      this.stageMgr.stageTransitioning = true;
      this.onStageClear();
    }

    GameState.score += Math.round(SCORE.perSecond * dt * (GameState.gripPercent < 20 ? SCORE.lowGripMultiplier : 1));
    this.updateHUD();
  }
}
