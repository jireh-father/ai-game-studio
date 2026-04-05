// Prime Butcher — game.js (core gameplay scene)
// Block management in entities.js, effects in effects.js (prototype mixins)

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.score = window.GameState.score;
    this.stage = window.GameState.stage;
    this.combo = 0;
    this.lastCutTime = 0;
    this.gameOver = false;
    this.paused = false;
    this.stageTransitioning = false;
    this.lastInputTime = Date.now();

    this.fallingBlocks = [];
    this.stackedBlocks = [];
    this.stackHeight = 0;
    this.stageTimer = StageManager.getStageDuration(this.stage);
    this.spawnAccum = 0;
    this.activeBlockCount = 0;
    this.dangerActive = false;

    // Ceiling and floor lines
    this.add.rectangle(GAME_WIDTH / 2, PLAY_AREA_TOP, GAME_WIDTH, 3, COLORS.ceilingLine).setDepth(5);
    this.add.rectangle(GAME_WIDTH / 2, PLAY_AREA_BOTTOM, GAME_WIDTH, 2, 0x444444).setDepth(5);

    // Danger border (hidden initially)
    this.dangerBorder = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    this.dangerBorder.setStrokeStyle(8, COLORS.dangerBorder);
    this.dangerBorder.setFillStyle(0, 0);
    this.dangerBorder.setDepth(10).setVisible(false);

    // Swipe trail graphics
    this.trailGfx = this.add.graphics().setDepth(8);

    // Input handling
    this.swipeStart = null;
    this.input.on('pointerdown', (p) => {
      this.lastInputTime = Date.now();
      this.swipeStart = { x: p.x, y: p.y, time: p.downTime };
    });
    this.input.on('pointerup', (p) => {
      this.lastInputTime = Date.now();
      if (!this.swipeStart || this.gameOver || this.paused) return;
      const dx = p.x - this.swipeStart.x;
      const dy = p.y - this.swipeStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MIN_SWIPE_DIST) return;
      this.evaluateSwipe(this.swipeStart.x, this.swipeStart.y, p.x, p.y);
      this.swipeStart = null;
    });

    // Stage timer event (1 per second)
    this.timerEvent = this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        if (this.gameOver || this.paused) return;
        this.stageTimer--;
        this.events.emit('timerUpdate', this.stageTimer);
        if (this.stageTimer <= 0 && !this.stageTransitioning) this.advanceStage();
      }
    });

    // Boss spawn for boss stages
    if (StageManager.isBossStage(this.stage)) {
      this.time.delayedCall(2000, () => { if (!this.gameOver) this.spawnBossBlock(); });
    }

    // Launch HUD
    this.scene.launch('HUDScene', { gameScene: this });
    this.events.emit('scoreUpdate', this.score);
    this.events.emit('stageUpdate', this.stage);
    this.events.emit('timerUpdate', this.stageTimer);

    // Visibility handler
    this.visHandler = () => { if (document.hidden && !this.gameOver) this.togglePause(); };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  update(time, delta) {
    if (this.gameOver || this.paused) return;

    // Inactivity death
    if (Date.now() - this.lastInputTime > INACTIVITY_TIMEOUT) {
      this.triggerGameOver(); return;
    }

    // Spawn logic
    const params = StageManager.getDifficultyParams(this.stage);
    this.spawnAccum += delta;
    if (this.spawnAccum >= params.spawnInterval && this.activeBlockCount < params.maxSimult) {
      this.spawnAccum = 0;
      this.spawnBlock();
    }

    // Update falling blocks
    const speed = params.speed * (delta / 1000);
    for (let i = this.fallingBlocks.length - 1; i >= 0; i--) {
      const b = this.fallingBlocks[i];
      if (b.frozen) continue;
      b.container.y += speed;

      const landY = PLAY_AREA_BOTTOM - this.stackHeight;
      if (b.container.y + BLOCK_HEIGHT / 2 >= landY) {
        b.container.y = landY - BLOCK_HEIGHT / 2;
        this.fallingBlocks.splice(i, 1);
        this.activeBlockCount--;
        if (b.isPrime) { this.dissolvePrime(b); }
        else { this.landOnStack(b); }
      }
    }

    this.checkStackHeight();
  }

  checkStackHeight() {
    const stackTop = PLAY_AREA_BOTTOM - this.stackHeight;
    const dangerThreshold = PLAY_AREA_TOP + PLAY_AREA_HEIGHT * 0.2;

    if (stackTop <= PLAY_AREA_TOP && !this.gameOver) {
      this.triggerGameOver(); return;
    }

    const inDanger = stackTop <= dangerThreshold;
    if (inDanger && !this.dangerActive) {
      this.dangerActive = true;
      this.dangerBorder.setVisible(true);
      this.dangerPulse = this.tweens.add({
        targets: this.dangerBorder, alpha: 0, duration: 250, yoyo: true, repeat: -1
      });
      this.playSound('danger');
    } else if (!inDanger && this.dangerActive) {
      this.dangerActive = false;
      if (this.dangerPulse) this.dangerPulse.stop();
      this.dangerBorder.setVisible(false).setAlpha(1);
    }
  }

  advanceStage() {
    this.stageTransitioning = true;
    const bonus = SCORE_VALUES.stageClear * this.stage;
    this.addScore(bonus, GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.stageFlash();

    this.stage++;
    window.GameState.stage = this.stage;
    this.stageTimer = StageManager.getStageDuration(this.stage);
    this.events.emit('stageUpdate', this.stage);
    this.events.emit('timerUpdate', this.stageTimer);

    if (StageManager.isBossStage(this.stage)) {
      this.time.delayedCall(2000, () => { if (!this.gameOver) this.spawnBossBlock(); });
    }
    this.time.delayedCall(500, () => { this.stageTransitioning = false; });
  }

  addScore(pts, x, y, isPrime) {
    this.score += pts;
    window.GameState.score = this.score;
    if (this.score > window.GameState.highScore) {
      window.GameState.highScore = this.score;
      window.GameState.newRecord = true;
    }
    this.events.emit('scoreUpdate', this.score);
    this.floatScoreText(pts, x, y, isPrime);
  }

  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    window.GameState.score = this.score;
    window.GameState.stage = this.stage;
    this.deathEffects();
    this.time.delayedCall(500, () => {
      this.scene.stop('HUDScene');
      this.scene.stop('GameScene');
      this.scene.start('GameOverScene');
    });
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.scene.launch('PauseScene', { gameScene: this });
    } else {
      this.scene.stop('PauseScene');
    }
  }

  lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
    let t0 = 0, t1 = 1;
    const dx = x2 - x1, dy = y2 - y1;
    const edges = [[-dx, x1 - rx], [dx, rx + rw - x1], [-dy, y1 - ry], [dy, ry + rh - y1]];
    for (const [p, q] of edges) {
      if (p === 0) { if (q < 0) return false; }
      else {
        const r = q / p;
        if (p < 0) { if (r > t1) return false; t0 = Math.max(t0, r); }
        else { if (r < t0) return false; t1 = Math.min(t1, r); }
      }
    }
    return t0 <= t1;
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}
