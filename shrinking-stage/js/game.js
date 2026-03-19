// game.js — GameScene: performer physics, swipe input, tile collision, scoring
// Effects, death, stage complete, pause overlay are in effects.js (prototype methods)

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.continueFromStage = data?.continueFromStage || 0;
    this.continueScore = data?.continueScore || 0;
  }

  create() {
    this.gameOver = false;
    this.stageTransitioning = false;
    this.stageManager = new StageManager();

    // State
    if (this.continueFromStage > 0) {
      this.currentStage = this.continueFromStage;
      this.score = this.continueScore;
    } else {
      this.currentStage = 1;
      this.score = 0;
    }
    this.vx = 0;
    this.vy = 0;
    this.idleTimer = 0;
    this.idleWarning = false;
    this.comboCount = 0;
    this.lastComboTime = 0;
    this.lastInputTime = Date.now();
    this.survivalTimer = 0;

    // Init stage
    const params = this.stageManager.init(this, this.currentStage);
    this.friction = params.friction;
    this.maxSpeed = params.maxSpeed;

    if (this.continueFromStage > 0) {
      this.stageManager.rebuildForContinue();
    }

    // Performer
    const spawn = this.stageManager.getPerformerSpawnPos();
    this.performer = this.add.image(spawn.x, spawn.y, 'performer').setDepth(10);
    this.performer.setDisplaySize(36, 36);

    // Trail ghosts
    this.ghosts = [];
    for (let i = 0; i < 3; i++) {
      const g = this.add.image(spawn.x, spawn.y, 'performer').setDepth(9);
      g.setDisplaySize(36, 36);
      g.setAlpha(0.1 * (3 - i));
      this.ghosts.push(g);
    }
    this.ghostPositions = [];

    // Danger vignette
    this.vignetteGraphics = this.add.graphics().setDepth(50);

    // Create HUD BEFORE any stage methods
    this.createHUD();

    // Input
    this.swipeStart = null;
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y < 48 && pointer.x > GAME_WIDTH - 50) {
        this.pauseGame();
        return;
      }
      this.swipeStart = { x: pointer.x, y: pointer.y, time: Date.now() };
    });

    this.input.on('pointerup', (pointer) => {
      if (!this.swipeStart || this.gameOver || this.stageTransitioning) return;
      const dx = pointer.x - this.swipeStart.x;
      const dy = pointer.y - this.swipeStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const elapsed = Date.now() - this.swipeStart.time;
      this.swipeStart = null;
      this.lastInputTime = Date.now();

      if (dist < 5 && elapsed < 150) {
        const tdx = pointer.x - GAME_WIDTH / 2;
        const tdy = pointer.y - GAME_HEIGHT / 2;
        const tlen = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
        this.applyForce(tdx / tlen, tdy / tlen, this.maxSpeed * FORCE_PARAMS.TAP_FORCE_RATIO);
      } else if (dist >= 5) {
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const forceMag = Math.min(Math.max(dist / FORCE_PARAMS.SWIPE_DIVISOR, 0.15), 1.0) * this.maxSpeed;
        this.applyForce(dx / len, dy / len, forceMag);
      }
    });

    // Start tile removal
    this.stageManager.startRemovals();

    // Visibility handler
    this.visHandler = () => {
      if (document.hidden) {
        this.scene.pause();
        this.stageManager.clearTimers();
      } else {
        this.scene.resume();
        this.stageManager.startRemovals();
      }
    };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  createHUD() {
    this.add.rectangle(GAME_WIDTH / 2, 24, GAME_WIDTH, 48, 0x3D0B10).setDepth(80);
    this.scoreText = this.add.text(12, 24, `${this.score}`, {
      fontSize: '20px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT, fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(81);
    this.stageText = this.add.text(GAME_WIDTH / 2, 24, `Stage ${this.currentStage}`, {
      fontSize: '16px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT
    }).setOrigin(0.5).setDepth(81);
    this.add.text(GAME_WIDTH - 16, 24, '||', {
      fontSize: '22px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT, fontStyle: 'bold'
    }).setOrigin(1, 0.5).setDepth(81);
  }

  applyForce(dx, dy, magnitude) {
    this.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vx + dx * magnitude));
    this.vy = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vy + dy * magnitude));

    // Swipe visual feedback
    const flashX = dx > 0 ? GAME_WIDTH - 10 : (dx < 0 ? 10 : GAME_WIDTH / 2);
    const flashY = dy > 0 ? GAME_HEIGHT - 10 : (dy < 0 ? 58 : GAME_HEIGHT / 2);
    const flash = this.add.rectangle(flashX, flashY, 30, 30, 0xFFFFFF, 0.15).setDepth(60);
    this.tweens.add({ targets: flash, alpha: 0, duration: 120, onComplete: () => flash.destroy() });

    // Performer lean
    const angle = Math.atan2(this.vy, this.vx) * (180 / Math.PI);
    const leanAngle = Phaser.Math.Clamp(angle * 0.05, -15, 15);
    this.tweens.add({ targets: this.performer, angle: leanAngle, duration: 150 });
  }

  addScore(points) {
    this.score += points;
    this.scoreText.setText(`${this.score}`);
    this.tweens.add({ targets: this.scoreText, scaleX: 1.25, scaleY: 1.25, duration: 100, yoyo: true });
  }

  update(time, delta) {
    if (this.gameOver || this.stageTransitioning) return;

    const dt = delta / 1000;
    const frictionFactor = Math.pow(this.friction, delta / 16.67);

    // Apply friction
    this.vx *= frictionFactor;
    this.vy *= frictionFactor;

    // Clamp speed
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }

    // Move performer
    this.performer.x += this.vx * dt;
    this.performer.y += this.vy * dt;

    // Update ghost trail
    this.ghostPositions.unshift({ x: this.performer.x, y: this.performer.y });
    if (this.ghostPositions.length > 10) this.ghostPositions.pop();
    for (let i = 0; i < this.ghosts.length; i++) {
      const idx = (i + 1) * 3;
      if (this.ghostPositions[idx]) {
        this.ghosts[i].setPosition(this.ghostPositions[idx].x, this.ghostPositions[idx].y);
        this.ghosts[i].setAlpha(speed > 150 ? 0.1 * (3 - i) : 0);
      }
    }

    // Check tile under performer
    if (!this.stageManager.isTileAt(this.performer.x, this.performer.y)) {
      this.onDeath();
      return;
    }

    // Near-miss detection
    const gapDist = this.stageManager.getNearestGapDist(this.performer.x, this.performer.y);
    if (gapDist < NEAR_MISS_DIST && gapDist > 0 && speed < 100) {
      this.onNearMiss();
    }

    // Idle death mechanic (velocity-based)
    if (speed < IDLE_DEATH.VELOCITY_THRESHOLD) {
      this.idleTimer += delta;
      if (this.idleTimer >= IDLE_DEATH.DEATH_TIME) {
        this.onDeath();
        return;
      }
      if (this.idleTimer >= IDLE_DEATH.WARNING_TIME && !this.idleWarning) {
        this.idleWarning = true;
        this.performer.setTint(0xFF4444);
        this.cameras.main.shake(100, 0.003);
        createFloatingText(this, this.performer.x, this.performer.y - 30, 'MOVE!', '#FF4444', 20, 30, 1500);
      }
    } else {
      this.idleTimer = 0;
      if (this.idleWarning) {
        this.idleWarning = false;
        this.performer.clearTint();
      }
    }

    // Inactivity death (no input for 25s)
    if (Date.now() - this.lastInputTime > 25000) {
      this.onDeath();
      return;
    }

    // Survival tick scoring
    this.survivalTimer += delta;
    if (this.survivalTimer >= 2000) {
      this.survivalTimer -= 2000;
      const multiplier = Math.floor(this.currentStage / 5) + 1;
      this.addScore(SCORE_VALUES.SURVIVAL_TICK * multiplier);
      createFloatingText(this, 80, 60, `+${SCORE_VALUES.SURVIVAL_TICK * multiplier}`, COLORS.STAGE_CLEAR, 16, 25, 800);
    }

    // Danger vignette
    this.updateVignette();

    // Combo timeout
    if (this.comboCount > 0 && Date.now() - this.lastComboTime > COMBO_TIMEOUT) {
      this.comboCount = 0;
    }
  }

  shutdown() {
    this.stageManager.clearTimers();
    this.stageManager.destroy();
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}
// Note: onNearMiss, updateVignette, onStageComplete, onDeath, pauseGame,
// showPauseOverlay are defined in effects.js via prototype assignment
