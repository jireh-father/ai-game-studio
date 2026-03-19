class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  init(data) {
    this.stageNum = data.stage || 1;
    this.score = data.score || 0;
    this.streak = data.streak || 0;
    this.isContinue = data.isContinue || false;
  }
  create() {
    const { width, height } = this.scale;
    this.gameWidth = width;
    this.gameHeight = height;
    this.gameOver = false;
    this.stageTransitioning = false;
    this.inputLocked = false;
    this.gridDirty = true;
    this.stageStartTime = Date.now();
    this.tilesMoved = 0;
    this.lastInputTime = Date.now();
    this.streakMultiplier = CONFIG.STREAK_MULTIPLIERS[Math.min(this.streak, CONFIG.STREAK_MULTIPLIERS.length - 1)];

    this.gridGfx = this.add.graphics();
    this.overlayGfx = this.add.graphics().setDepth(50);
    this.dangerRing = this.add.graphics().setDepth(15).setAlpha(0);

    this._createHUD();
    this._initFloatingTexts();
    this._loadStage();

    this.input.on('pointerup', (pointer) => this._onTileTap(pointer));

    this.add.text(width - 28, 26, 'II', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', fill: '#E8EAF0', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(60).setInteractive({ useHandCursor: true })
    .on('pointerup', () => this._togglePause());

    this.add.text(width - 70, 26, '?', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', fill: '#00E5FF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(60).setInteractive({ useHandCursor: true })
    .on('pointerup', () => {
      this.scene.pause('GameScene');
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });

    this.isPaused = false;
    this._visHandler = () => {
      if (document.hidden && !this.gameOver) this.scene.pause('GameScene');
    };
    document.addEventListener('visibilitychange', this._visHandler);
  }

  _loadStage() {
    const sd = Stages.generateStage(this.stageNum);
    this.gridSize = sd.gridSize;
    this.playerPos = { ...sd.playerStart };
    this.goalPos = { ...sd.goalStart };

    const availW = this.gameWidth - 20;
    const availH = this.gameHeight - CONFIG.GRID.HUD_HEIGHT - CONFIG.GRID.TIMER_BAR_HEIGHT - 40;
    this.tileSize = Math.min(
      Math.floor((availW - (this.gridSize - 1) * CONFIG.GRID.GAP) / this.gridSize),
      Math.floor((availH - (this.gridSize - 1) * CONFIG.GRID.GAP) / this.gridSize), 80
    );
    this.tileSize = Math.max(this.tileSize, CONFIG.GRID.MIN_TILE_SIZE);
    const gridW = this.gridSize * this.tileSize + (this.gridSize - 1) * CONFIG.GRID.GAP;
    this.gridOffsetX = (this.gameWidth - gridW) / 2;
    this.gridOffsetY = CONFIG.GRID.HUD_HEIGHT + (availH - gridW) / 2 + 10;

    this.tileStates = new Array(this.gridSize * this.gridSize).fill('safe');
    sd.prePoisonedTiles.forEach(t => {
      this.tileStates[t.row * this.gridSize + t.col] = 'pre_poisoned';
    });
    this.isContinue = false;

    if (this.playerSprite) this.playerSprite.destroy();
    if (this.goalSprite) this.goalSprite.destroy();

    const pPos = this._tileCenter(this.playerPos.col, this.playerPos.row);
    this.playerSprite = this.add.image(pPos.x, pPos.y, 'player')
      .setDisplaySize(this.tileSize * 0.7, this.tileSize * 0.7).setDepth(20);

    const gPos = this._tileCenter(this.goalPos.col, this.goalPos.row);
    this.goalSprite = this.add.image(gPos.x, gPos.y, 'goal')
      .setDisplaySize(this.tileSize * 0.5, this.tileSize * 0.5).setDepth(10);
    this.tweens.add({ targets: this.goalSprite, scaleX: this.goalSprite.scaleX * 1.15, scaleY: this.goalSprite.scaleY * 1.15, duration: 800, yoyo: true, repeat: -1 });

    this._createGoalTimer();

    const interval = Stages.getGoalInterval(this.stageNum);
    this.goalInterval = interval;
    if (this.goalTimerEvent) this.goalTimerEvent.remove();
    if (this.goalWarningEvent) this.goalWarningEvent.remove();
    this.goalTimerEvent = this.time.addEvent({ delay: interval, callback: () => this._advanceGoal(), loop: true });
    const warnDur = Stages.getGoalWarningDuration(this.stageNum);
    this.goalWarningEvent = this.time.addEvent({ delay: interval - warnDur, callback: () => this._goalWarning(), loop: true });

    this.stageStartTime = Date.now();
    this.tilesMoved = 0;
    this.gridDirty = true;
    this.stageTransitioning = false;
    this.gameOver = false;
    this.inputLocked = false;

    if (this.stageText) this.stageText.setText(`Stage ${this.stageNum}`);
    if (this.scoreText) this.scoreText.setText(`Score: ${this.score}`);
  }

  _tileCenter(col, row) {
    return {
      x: this.gridOffsetX + col * (this.tileSize + CONFIG.GRID.GAP) + this.tileSize / 2,
      y: this.gridOffsetY + row * (this.tileSize + CONFIG.GRID.GAP) + this.tileSize / 2
    };
  }

  _onTileTap(pointer) {
    if (this.inputLocked || this.gameOver || this.stageTransitioning || this.isPaused) return;
    this.lastInputTime = Date.now();
    const col = Math.floor((pointer.x - this.gridOffsetX) / (this.tileSize + CONFIG.GRID.GAP));
    const row = Math.floor((pointer.y - this.gridOffsetY) / (this.tileSize + CONFIG.GRID.GAP));
    if (col < 0 || col >= this.gridSize || row < 0 || row >= this.gridSize) return;

    const dc = Math.abs(col - this.playerPos.col), dr = Math.abs(row - this.playerPos.row);
    if (!((dc === 1 && dr === 0) || (dc === 0 && dr === 1))) {
      this.tweens.add({ targets: this.playerSprite, x: this.playerSprite.x + 6, duration: 50, yoyo: true, repeat: 2 });
      return;
    }

    const state = this.tileStates[row * this.gridSize + col];
    if (state === 'poisoned' || state === 'pre_poisoned') { this._triggerDeath('poison'); return; }
    this._executeMove(col, row);
  }

  _executeMove(col, row) {
    this.inputLocked = true;
    const prevIdx = this.playerPos.row * this.gridSize + this.playerPos.col;
    const prevCenter = this._tileCenter(this.playerPos.col, this.playerPos.row);

    this.tileStates[prevIdx] = 'poisoned';
    this.tilesMoved++;
    this.gridDirty = true;

    const ghost = this.add.circle(prevCenter.x, prevCenter.y, this.tileSize * 0.3, CONFIG.COLORS.PLAYER, 0.3).setDepth(5);
    this.tweens.add({ targets: ghost, alpha: 0, duration: 400, onComplete: () => ghost.destroy() });

    this.playerPos = { col, row };
    const nc = this._tileCenter(col, row);
    this.tweens.add({
      targets: this.playerSprite, x: nc.x, y: nc.y,
      duration: CONFIG.TIMING.MOVE_TWEEN_MS, ease: 'Cubic.Out',
      onComplete: () => {
        this.tweens.add({ targets: this.playerSprite, scaleX: this.playerSprite.scaleX * 1.3, scaleY: this.playerSprite.scaleY * 1.3, duration: 60, yoyo: true });
        this.time.timeScale = 0;
        setTimeout(() => { if (this.time) this.time.timeScale = 1; }, CONFIG.TIMING.HIT_STOP_MOVE);
        this._spawnParticles(prevCenter.x, prevCenter.y, CONFIG.COLORS.PLAYER, this._getParticleCount(), 30);
        this._playTone(440, 80, 'sine', 0.4);
        if (this.playerPos.col === this.goalPos.col && this.playerPos.row === this.goalPos.row) {
          this._stageClear();
        } else { setTimeout(() => { this.inputLocked = false; }, 10); }
      }
    });
  }

  _advanceGoal() {
    if (this.gameOver || this.stageTransitioning) return;
    const newPos = Stages.advanceGoalOneStep(this.goalPos, this.playerPos, this.gridSize, new Set());
    this.goalPos = newPos;
    const center = this._tileCenter(newPos.col, newPos.row);
    this.tweens.add({
      targets: this.goalSprite, x: center.x, y: center.y, duration: 150, ease: 'Cubic.Out',
      onComplete: () => {
        this._spawnParticles(center.x, center.y, CONFIG.COLORS.GOAL, 6, 40);
        this._playTone(150, 120, 'sine', 0.3);
      }
    });
    if (newPos.col === this.playerPos.col && newPos.row === this.playerPos.row) this._triggerDeath('goal');
  }

  _goalWarning() {
    if (this.gameOver || this.stageTransitioning) return;
    this.tweens.add({ targets: this.goalSprite, tint: CONFIG.COLORS.WARNING_PULSE, duration: 100, yoyo: true, repeat: 2, onComplete: () => this.goalSprite.clearTint() });
    this._playTone(200, 100, 'sine', 0.2);
  }

  _triggerDeath(reason) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.inputLocked = true;
    if (this.goalTimerEvent) this.goalTimerEvent.remove();
    if (this.goalWarningEvent) this.goalWarningEvent.remove();

    const hitMs = reason === 'goal' ? CONFIG.TIMING.HIT_STOP_DEATH_GOAL : CONFIG.TIMING.HIT_STOP_DEATH_POISON;
    this.time.timeScale = 0;
    setTimeout(() => { if (this.time) this.time.timeScale = 1; }, hitMs);

    this.cameras.main.shake(reason === 'goal' ? 250 : 350, reason === 'goal' ? 0.004 : 0.006);
    const flashColor = reason === 'goal' ? CONFIG.COLORS.DEATH_GOLD : CONFIG.COLORS.DANGER_FLASH;
    this.overlayGfx.clear().setAlpha(1);
    this.overlayGfx.fillStyle(flashColor, 0.65);
    this.overlayGfx.fillRect(0, 0, this.gameWidth, this.gameHeight);
    this.tweens.add({ targets: this.overlayGfx, alpha: 0, duration: 400, delay: 50 });

    const rot = reason === 'goal' ? Math.PI * 4 : Math.PI * 2;
    this.tweens.add({ targets: this.playerSprite, scaleX: 0.01, scaleY: 0.01, rotation: rot, duration: reason === 'goal' ? 300 : 250 });

    const pc = this._tileCenter(this.playerPos.col, this.playerPos.row);
    this._spawnParticles(pc.x, pc.y, reason === 'goal' ? CONFIG.COLORS.GOAL : CONFIG.COLORS.TILE_POISONED_GLOW, 12, 110);
    this._playTone(reason === 'goal' ? 1000 : 800, reason === 'goal' ? 300 : 400, 'sawtooth', 0.5, true);

    setTimeout(() => {
      this.scene.stop('GameScene');
      this.scene.start('GameOverScene', { score: this.score, stage: this.stageNum, reason, canContinue: ADS.canContinue() });
    }, CONFIG.TIMING.DEATH_DELAY_MS);
  }

  _stageClear() {
    if (this.stageTransitioning) return;
    this.stageTransitioning = true;
    this.inputLocked = true;
    if (this.goalTimerEvent) this.goalTimerEvent.remove();
    if (this.goalWarningEvent) this.goalWarningEvent.remove();

    const elapsed = Date.now() - this.stageStartTime;
    let pts = CONFIG.SCORE.STAGE_BASE + this.stageNum * CONFIG.SCORE.STAGE_MULT;
    let bonus = '';
    if (elapsed < CONFIG.SCORE.SPEED_THRESHOLD) { pts += CONFIG.SCORE.SPEED_BONUS; bonus = '+50 FAST!'; }
    const poisoned = this.tileStates.filter(s => s === 'poisoned').length;
    if (poisoned / (this.gridSize * this.gridSize) <= CONFIG.SCORE.EFFICIENCY_THRESHOLD) {
      pts += CONFIG.SCORE.EFFICIENCY_BONUS;
      bonus = bonus ? bonus + '\n+75 EFFICIENT!' : '+75 EFFICIENT!';
    }
    if (this.gridSize >= 8) pts = Math.floor(pts * 2.0);
    else if (this.gridSize >= 6) pts = Math.floor(pts * 1.5);
    this.streak++;
    this.streakMultiplier = CONFIG.STREAK_MULTIPLIERS[Math.min(this.streak, CONFIG.STREAK_MULTIPLIERS.length - 1)];
    pts += CONFIG.SCORE.STREAK_BONUS * this.streak;
    pts = Math.floor(pts * this.streakMultiplier);
    this.score += pts;

    const gc = this._tileCenter(this.goalPos.col, this.goalPos.row);
    this._spawnParticles(gc.x, gc.y, CONFIG.COLORS.GOAL, 20, 100);
    this.overlayGfx.clear().setAlpha(1);
    this.overlayGfx.fillStyle(CONFIG.COLORS.STAGE_CLEAR, 0.2);
    this.overlayGfx.fillRect(0, 0, this.gameWidth, this.gameHeight);
    this.tweens.add({ targets: this.overlayGfx, alpha: 0, duration: 400 });

    this._showFloatingText(gc.x, gc.y - 20, `+${pts}`, '#FFFFFF');
    if (bonus) this._showFloatingText(gc.x, gc.y + 10, bonus, '#FFD700');
    this.tweens.add({ targets: this.stageText, scaleX: 1.4, scaleY: 1.4, duration: 150, yoyo: true });
    this.tweens.add({ targets: this.scoreText, scaleX: 1.25, scaleY: 1.25, duration: 100, yoyo: true });
    this.scoreText.setText(`Score: ${this.score}`);
    [440, 550, 660, 880].forEach((f, i) => setTimeout(() => this._playTone(f, 150, 'sine', 0.4), i * 120));

    setTimeout(() => {
      this.stageNum++;
      if (this.streakMultiplier > 1 && !this.streakText) {
        this.streakText = this.add.text(12, 36, `x${this.streakMultiplier}`, { fontSize: '13px', fontFamily: 'Arial, sans-serif', fill: '#FFD700' }).setDepth(60);
      } else if (this.streakText) { this.streakText.setText(`x${this.streakMultiplier}`); }
      this._loadStage();
    }, CONFIG.TIMING.STAGE_CLEAR_DELAY);
  }

  _togglePause() {
    if (this.gameOver) return;
    this.isPaused = true;
    this.scene.pause('GameScene');
    this.scene.launch('PauseScene');
  }

  update(time) {
    if (this.gameOver || this.stageTransitioning) return;
    if (Date.now() - this.lastInputTime > 25000) { this._triggerDeath('poison'); return; }

    if (this.goalTimerEvent && this.timerDots) {
      const frac = this.goalTimerEvent.getProgress();
      const filled = Math.ceil((1 - frac) * 5);
      for (let i = 0; i < 5; i++) {
        if (this.timerDots[i]) this.timerDots[i].setFillStyle(i < filled ? CONFIG.COLORS.GOAL : 0x333333);
      }
    }

    if (this.playerPos && this.goalPos) {
      const dist = Math.abs(this.playerPos.col - this.goalPos.col) + Math.abs(this.playerPos.row - this.goalPos.row);
      if (dist <= 2) {
        this.dangerRing.setAlpha(0.5 + 0.5 * Math.sin(time * 0.005));
        const pc = this._tileCenter(this.playerPos.col, this.playerPos.row);
        this.dangerRing.clear();
        this.dangerRing.lineStyle(2, 0xFF4444);
        this.dangerRing.strokeCircle(pc.x, pc.y, this.tileSize * 0.5);
      } else { this.dangerRing.clear(); }
    }

    if (this.gridDirty) { this._drawGrid(); this.gridDirty = false; }
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this._visHandler);
  }
}
