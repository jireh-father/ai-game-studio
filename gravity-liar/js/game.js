// Gravity Liar - Core Gameplay Scene

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.gameOver = false;
    this.stageTransitioning = false;
    this.dying = false;
    this.paused = false;
    this.switchCount = 0;
    this.stageElapsed = 0;
    this.rampElapsed = 0;
    this.scoreTimer = 0;
    this.currentRampMultiplier = 1;
    this.trailPositions = [];

    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.bg);

    // Arena walls
    this.add.rectangle(WALL_W / 2, h / 2, WALL_W, h, COLORS.wallColor);
    this.add.rectangle(w - WALL_W / 2, h / 2, WALL_W, h, COLORS.wallColor);
    this.add.rectangle(w / 2, ARENA_TOP / 2, w, ARENA_TOP, COLORS.wallColor);

    // Load stage config
    const isContinue = GameState.pendingContinue;
    GameState.pendingContinue = false;
    this.stageConfig = getStageConfig(GameState.stage);
    this.currentLieOffset = this.stageConfig.lieOffset;

    // Death zone
    this.deathZoneH = this.stageConfig.deathZoneH;
    this.deathZoneY = h - this.deathZoneH / 2;
    this.add.rectangle(w / 2, this.deathZoneY, w, this.deathZoneH, COLORS.deathZone);
    for (let x = 0; x < w; x += 18) {
      this.add.triangle(x + 9, h - this.deathZoneH - 2, 0, 14, 9, 0, 18, 14, COLORS.deathSpikes);
    }
    this.deathGlow = this.add.rectangle(w / 2, this.deathZoneY, w, this.deathZoneH + 8, COLORS.deathGlow, 0.2);
    this.tweens.add({
      targets: this.deathGlow, alpha: { from: 0.1, to: 0.3 },
      duration: 800, yoyo: true, repeat: -1
    });

    // Ball — spawn higher (h*0.25) for safer learning window
    this.ball = this.physics.add.image(w / 2, h * 0.25, 'ball');
    this.ball.setCircle(12, 12, 12);
    this.ball.setBounce(BOUNCE);
    this.ball.setCollideWorldBounds(true);
    this.ball.body.setMaxVelocity(500, 500);
    this.ball.body.world.setBounds(WALL_W, ARENA_TOP, w - WALL_W * 2, h - ARENA_TOP - this.deathZoneH);

    // 2s invincibility on stage start — ball flashes, can't die
    this.invincible = true;
    this.tweens.add({
      targets: this.ball, alpha: { from: 0.4, to: 1 }, duration: 200,
      yoyo: true, repeat: 4, onComplete: () => { this.ball.setAlpha(1); }
    });
    this.time.delayedCall(2000, () => { this.invincible = false; });

    this.trueGravityAngle = 0;
    this.applyGravity();

    // Arrows
    this.arrow = this.add.image(w / 2, ARENA_TOP + 50, 'arrow').setScale(0.7);
    this.updateArrowDisplay();
    this.tweens.add({
      targets: this.arrow, scaleX: { from: 0.7, to: 0.74 }, scaleY: { from: 0.7, to: 0.74 },
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    this.arrow2 = null;
    if (this.stageConfig.arrowCount >= 2) {
      this.arrow2 = this.add.image(w / 2 + 50, ARENA_TOP + 50, 'arrow2').setScale(0.5);
      this.arrow.setX(w / 2 - 30);
      this.updateArrowDisplay();
    }

    // Ball trail
    this.trailCircles = [];
    for (let i = 0; i < 5; i++) {
      const c = this.add.circle(0, 0, BALL_RADIUS * 0.8, COLORS.ball, 0.3 - i * 0.05);
      c.setVisible(false);
      this.trailCircles.push(c);
    }

    // Flash overlays (reused)
    this.leftFlash = this.add.rectangle(WALL_W / 2, h / 2, WALL_W + 4, h, 0xFFFFFF, 0).setDepth(5);
    this.rightFlash = this.add.rectangle(w - WALL_W / 2, h / 2, WALL_W + 4, h, 0xFFFFFF, 0).setDepth(5);
    this.edgeFlash = this.add.rectangle(w / 2, h / 2, w, h, COLORS.lieFlash, 0).setDepth(8);
    this.redFlash = this.add.rectangle(w / 2, h / 2, w, h, COLORS.deathZone, 0).setDepth(8);

    // HUD (from hud.js)
    createHUD(this);

    // Tap input
    const tapZone = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0)
      .setDepth(4).setInteractive();
    tapZone.on('pointerdown', (ptr) => {
      if (this.gameOver || this.dying || this.paused || this.stageTransitioning) return;
      const side = ptr.x < w / 2 ? -1 : 1;
      this.onWallTap(side, ptr.x, ptr.y);
    });

    // Tap hints (stages 1-3)
    if (GameState.stage <= 3) {
      const hint = this.add.text(w / 4, h * 0.65, 'TAP', {
        fontSize: '20px', fontFamily: 'Arial', fill: '#00E5FF'
      }).setOrigin(0.5).setAlpha(0.15);
      const hint2 = this.add.text(3 * w / 4, h * 0.65, 'TAP', {
        fontSize: '20px', fontFamily: 'Arial', fill: '#00E5FF'
      }).setOrigin(0.5).setAlpha(0.15);
      this.time.delayedCall(3000, () => {
        this.tweens.add({ targets: [hint, hint2], alpha: 0, duration: 500 });
      });
    }

    // Lie switch timer
    this.lieSwitchTimer = null;
    if (this.stageConfig.lieSwitchInterval) this.startLieSwitchTimer();

    // Rest stage glow
    if (this.stageConfig.isRest) {
      const border = this.add.rectangle(w / 2, h / 2, w - 4, h - 4, 0x000000, 0)
        .setStrokeStyle(4, COLORS.restGlow, 0.6);
      this.tweens.add({ targets: border, alpha: 0, duration: 1000 });
    }

    // Milestone text
    const milestone = getMilestoneText(GameState.stage);
    if (milestone) {
      const mt = this.add.text(w / 2, h * 0.35, milestone, {
        fontSize: '16px', fontFamily: 'Arial', fill: '#FFD600', fontStyle: 'bold'
      }).setOrigin(0.5).setScale(0.8).setDepth(10);
      this.tweens.add({
        targets: mt, scale: 1.1, duration: 300, yoyo: true, hold: 1500,
        onComplete: () => { this.tweens.add({ targets: mt, alpha: 0, duration: 500 }); }
      });
    }

    this.stageTimeRemaining = this.stageConfig.duration;
    this.firstAttempt = !isContinue;

    // Visibility handler
    this.visHandler = () => {
      if (document.hidden && !this.gameOver) pauseGame(this);
    };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  update(time, delta) {
    if (this.gameOver || this.paused || this.dying) return;

    if (!this.stageTransitioning) {
      this.stageElapsed += delta;
      this.stageTimeRemaining -= delta;
      this.rampElapsed += delta;
      this.scoreTimer += delta;
    }

    // Speed ramp
    if (this.rampElapsed >= RAMP_INTERVAL) {
      this.rampElapsed -= RAMP_INTERVAL;
      this.currentRampMultiplier *= (1 + RAMP_RATE);
      this.applyGravity();
    }

    // Score per second
    if (this.scoreTimer >= 1000) {
      this.scoreTimer -= 1000;
      addScore(this, SCORE_SURVIVE_SEC);
    }

    // Death check (skip if invincible)
    const ballBottom = this.ball.y + BALL_RADIUS;
    if (ballBottom >= GAME_HEIGHT - this.deathZoneH && !this.dying && !this.stageTransitioning && !this.invincible) {
      this.onBallDeath();
      return;
    }

    // Stage clear
    if (this.stageTimeRemaining <= 0 && !this.stageTransitioning) {
      this.onStageClear();
      return;
    }

    // Trail update
    this.trailPositions.unshift({ x: this.ball.x, y: this.ball.y });
    if (this.trailPositions.length > 5) this.trailPositions.pop();
    this.trailCircles.forEach((c, i) => {
      if (this.trailPositions[i + 1]) {
        c.setPosition(this.trailPositions[i + 1].x, this.trailPositions[i + 1].y);
        c.setVisible(true);
      }
    });
  }

  applyGravity() {
    const mag = Math.min(this.stageConfig.gravityMag * this.currentRampMultiplier, MAX_GRAVITY * 1.5);
    const rad = Phaser.Math.DegToRad(this.trueGravityAngle);
    this.ball.body.setAcceleration(Math.sin(rad) * mag, Math.cos(rad) * mag);
  }

  updateArrowDisplay() {
    if (!this.arrow) return;
    const displayAngle = (this.trueGravityAngle + this.currentLieOffset) % 360;
    this.arrow.setAngle(displayAngle);
    if (GameState.stage <= 2) this.arrow.setTint(COLORS.arrowTruth);
    else this.arrow.clearTint();

    if (this.arrow2 && this.stageConfig.arrowCount >= 2) {
      const cfg = getTwoArrowConfig(GameState.stage, this.switchCount);
      this.arrow.setAngle((this.trueGravityAngle + cfg.arrow1Offset) % 360);
      this.arrow2.setAngle((this.trueGravityAngle + cfg.arrow2Offset) % 360);
    }
  }

  onWallTap(side, px, py) {
    this.ball.setVelocityX(this.ball.body.velocity.x + IMPULSE_X * side);
    doWallTapEffects(this, side, px, py);

    addScore(this, SCORE_CORRECT_TAP * getComboMultiplier());
    showFloatingText(this, px, py - 30, '+' + Math.floor(SCORE_CORRECT_TAP * getComboMultiplier()), '#00E5FF');

    GameState.streak++;
    playStreakSound(GameState.streak);
    updateStreakDisplay(this);

    // Streak milestone
    const s = GameState.streak;
    if (s === 5 || s === 10 || s === 15) {
      showFloatingText(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.4, getComboMultiplier() + 'x!', '#FFD600', 20, true);
    }
    playTapSound();
  }

  startLieSwitchTimer() {
    if (this.lieSwitchTimer) this.lieSwitchTimer.remove();
    this.lieSwitchTimer = this.time.addEvent({
      delay: this.stageConfig.lieSwitchInterval,
      callback: () => this.onLieSwitch(), loop: true
    });
  }

  onLieSwitch() {
    if (this.gameOver || this.stageTransitioning || this.dying) return;
    this.switchCount++;
    this.currentLieOffset = getNextLieOffset(this.currentLieOffset);
    doLieSwitchEffects(this);
    addScore(this, SCORE_LIE_SWITCH);
    showFloatingText(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.45, '+' + SCORE_LIE_SWITCH, '#CE93D8');
  }

  onBallDeath() {
    this.dying = true;
    this.firstAttempt = false;
    GameState.lives--;
    doDeathEffects(this);

    if (GameState.streak > 0) {
      GameState.streak = 0;
      updateStreakDisplay(this);
      playStreakBreakSound();
    }

    this.liveDots.forEach((dot, i) => {
      dot.setFillStyle(i < GameState.lives ? COLORS.livesOn : COLORS.livesOff);
    });

    this.time.delayedCall(600, () => {
      if (GameState.lives <= 0) this.triggerGameOver();
      else this.restartStage();
    });
  }

  restartStage() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.ball.setPosition(w / 2, h * 0.25).setVelocity(0, 0).setScale(1);
    this.ball.body.setAcceleration(0, 0);

    const dots = this.add.text(w / 2, h * 0.5, '...', {
      fontSize: '24px', fontFamily: 'Arial', fill: '#FFFFFF'
    }).setOrigin(0.5).setDepth(10);

    this.time.delayedCall(500, () => {
      dots.destroy();
      this.dying = false;
      this.invincible = true;
      this.tweens.add({
        targets: this.ball, alpha: { from: 0.4, to: 1 }, duration: 200,
        yoyo: true, repeat: 4, onComplete: () => { this.ball.setAlpha(1); }
      });
      this.time.delayedCall(2000, () => { this.invincible = false; });
      this.switchCount = 0;
      this.currentLieOffset = this.stageConfig.lieOffset;
      this.stageElapsed = 0;
      this.rampElapsed = 0;
      this.currentRampMultiplier = 1;
      this.stageTimeRemaining = this.stageConfig.duration;
      this.applyGravity();
      this.updateArrowDisplay();
      if (this.stageConfig.lieSwitchInterval) this.startLieSwitchTimer();
    });
  }

  triggerGameOver() {
    this.gameOver = true;
    const isHS = GameState.score > GameState.highScore;
    if (isHS) {
      GameState.highScore = GameState.score;
      GameState.bestStage = Math.max(GameState.bestStage, GameState.stage);
      GameState.save();
    }
    this.scene.stop('GameScene');
    this.scene.start('GameOverScene', {
      score: GameState.score, stage: GameState.stage,
      isHighScore: isHS, canContinue: true
    });
  }

  onStageClear() {
    this.stageTransitioning = true;
    if (this.lieSwitchTimer) this.lieSwitchTimer.remove();

    let bonus = SCORE_STAGE_CLEAR + GameState.stage * 20;
    if (this.firstAttempt) bonus += SCORE_FIRST_ATTEMPT;
    addScore(this, bonus);
    doStageClearEffects(this);
    showFloatingText(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.5, '+' + bonus, '#FFD600', 18);

    this.time.delayedCall(1500, () => {
      GameState.stage++;
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
    destroyPause(this);
  }
}
