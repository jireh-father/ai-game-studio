// effects.js — Visual effects, near-miss handling, pause overlay for GameScene

// Mixin methods added to GameScene prototype
GameScene.prototype.onNearMiss = function() {
  const now = Date.now();
  if (now - this.lastComboTime < 500) return;

  this.lastComboTime = now;
  this.comboCount = Math.min(this.comboCount + 1, COMBO_MAX);

  const multiplier = Math.floor(this.currentStage / 5) + 1;
  this.addScore(SCORE_VALUES.NEAR_MISS * multiplier);
  createFloatingText(this, this.performer.x, this.performer.y - 20,
    `+${SCORE_VALUES.NEAR_MISS * multiplier}`, COLORS.NEAR_MISS_FLASH, 22, 40, 1000);

  if (this.comboCount > 1) {
    this.addScore(SCORE_VALUES.COMBO_BONUS);
    createFloatingText(this, this.performer.x, this.performer.y - 45,
      `+${SCORE_VALUES.COMBO_BONUS} COMBO x${this.comboCount}!`, COLORS.COMBO_TEXT, 20, 50, 1000);
  }

  // Gold edge flash
  const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFFD700, 0.3).setDepth(55);
  this.tweens.add({ targets: flash, alpha: 0, duration: 250, onComplete: () => flash.destroy() });

  // Scale punch based on combo level
  const punchScale = 1.3 + this.comboCount * 0.1;
  this.tweens.add({ targets: this.performer, scaleX: punchScale, scaleY: punchScale, duration: 80, yoyo: true });

  // Combo x3+: star burst
  if (this.comboCount >= 3) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const px = this.performer.x + Math.cos(angle) * 5;
      const py = this.performer.y + Math.sin(angle) * 5;
      const star = this.add.image(px, py, 'star').setScale(0.2).setDepth(60);
      this.tweens.add({
        targets: star,
        x: px + Math.cos(angle) * 80, y: py + Math.sin(angle) * 80,
        scaleX: 0, scaleY: 0, alpha: 0, duration: 300,
        onComplete: () => star.destroy()
      });
    }
  }
  // Combo x4: camera zoom
  if (this.comboCount >= 4) {
    this.cameras.main.setZoom(1.04);
    this.time.delayedCall(200, () => this.cameras.main.setZoom(1));
  }
};

GameScene.prototype.updateVignette = function() {
  this.vignetteGraphics.clear();
  const activeTiles = this.stageManager.activeTileCount;
  const totalTiles = this.stageManager.gridSize * this.stageManager.gridSize;
  const ratio = activeTiles / totalTiles;
  if (ratio < 0.5) {
    const intensity = (0.5 - ratio) * 0.7;
    this.vignetteGraphics.fillStyle(0x8B0000, intensity);
    this.vignetteGraphics.fillRect(0, 0, GAME_WIDTH, 20);
    this.vignetteGraphics.fillRect(0, GAME_HEIGHT - 20, GAME_WIDTH, 20);
    this.vignetteGraphics.fillRect(0, 0, 20, GAME_HEIGHT);
    this.vignetteGraphics.fillRect(GAME_WIDTH - 20, 0, 20, GAME_HEIGHT);
  }
};

GameScene.prototype.onStageComplete = function() {
  if (this.stageTransitioning || this.gameOver) return;
  this.stageTransitioning = true;

  const bonus = SCORE_VALUES.STAGE_CLEAR * this.currentStage;
  this.addScore(bonus);
  createFloatingText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, `+${bonus}`, COLORS.STAGE_CLEAR, 36, 60, 900);

  const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFFE566, 0.7).setDepth(70);
  this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });
  this.cameras.main.shake(100, 0.003);

  setTimeout(() => {
    if (this.gameOver) return;
    this.currentStage++;
    this.stageManager.destroy();
    const params = this.stageManager.init(this, this.currentStage);
    this.friction = params.friction;
    this.maxSpeed = params.maxSpeed;

    const spawn = this.stageManager.getPerformerSpawnPos();
    this.performer.setPosition(spawn.x, spawn.y);
    this.vx = 0;
    this.vy = 0;
    this.stageText.setText(`Stage ${this.currentStage}`);
    this.survivalTimer = 0;
    this.idleTimer = 0;
    this.idleWarning = false;
    this.performer.clearTint();

    this.stageManager.startRemovals();
    this.stageTransitioning = false;
  }, 1200);
};

GameScene.prototype.onDeath = function() {
  if (this.gameOver) return;
  this.gameOver = true;
  this.stageManager.clearTimers();

  this.tweens.add({
    targets: this.performer, angle: { from: -20, to: 20 },
    duration: 75, repeat: 3, yoyo: true
  });

  this.cameras.main.shake(400, 0.008);

  setTimeout(() => {
    this.tweens.add({
      targets: this.performer, y: this.performer.y + 200, alpha: 0,
      duration: 400, ease: 'Power2'
    });
    this.ghosts.forEach(g => g.setAlpha(0));
  }, 300);

  const isHighScore = this.score > GameState.highScore;
  if (isHighScore) {
    GameState.highScore = this.score;
    localStorage.setItem('shrinking-stage_high_score', this.score.toString());
  }
  if (this.currentStage > GameState.highestStage) {
    GameState.highestStage = this.currentStage;
    localStorage.setItem('shrinking-stage_highest_stage', this.currentStage.toString());
  }
  GameState.gamesPlayed++;

  setTimeout(() => {
    this.scene.launch('GameOverScene', {
      score: this.score, stage: this.currentStage, isHighScore: isHighScore
    });
  }, 1200);
};

GameScene.prototype.pauseGame = function() {
  this.scene.pause();
  this.stageManager.clearTimers();
  this.showPauseOverlay();
};

GameScene.prototype.showPauseOverlay = function() {
  const cx = GAME_WIDTH / 2;
  const overlay = this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1A1410, 0.8).setDepth(200);
  const pauseContainer = [overlay];

  const title = this.add.text(cx, 160, 'PAUSED', {
    fontSize: '32px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT, fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(201);
  pauseContainer.push(title);

  const buttons = ['Resume', 'How to Play', 'Restart', 'Menu'];
  const actions = [
    () => {
      pauseContainer.forEach(o => o.destroy());
      this.scene.resume();
      this.stageManager.startRemovals();
      this.lastInputTime = Date.now();
    },
    () => {
      pauseContainer.forEach(o => o.destroy());
      this.scene.launch('HowToPlayScene', { returnTo: 'GameScene' });
    },
    () => {
      pauseContainer.forEach(o => o.destroy());
      this.shutdown();
      this.scene.restart();
    },
    () => {
      pauseContainer.forEach(o => o.destroy());
      this.shutdown();
      this.scene.start('MenuScene');
    }
  ];

  buttons.forEach((label, i) => {
    const y = 260 + i * 65;
    const btn = this.add.rectangle(cx, y, 220, 52, 0x3D0B10, 1).setInteractive({ useHandCursor: true }).setDepth(201);
    btn.setStrokeStyle(2, 0xFAF5E8);
    const txt = this.add.text(cx, y, label, {
      fontSize: '18px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT
    }).setOrigin(0.5).setDepth(202);
    btn.on('pointerdown', actions[i]);
    pauseContainer.push(btn, txt);
  });
};
