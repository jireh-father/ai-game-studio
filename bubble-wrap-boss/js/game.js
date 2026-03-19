// game.js — Core gameplay: bubble grid, scrolling, tap handling, strikes, scoring
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  init(data) {
    this.isContinue = data && data.continueGame;
    this.initScore = (data && data.score) || 0;
    this.initStage = (data && data.stage) || 1;
  }

  create() {
    this.score = this.isContinue ? this.initScore : 0;
    this.stage = this.isContinue ? this.initStage : 1;
    this.strikes = this.isContinue ? 2 : 0;
    this.combo = 0;
    this.gameOver = false;
    this.stageTransitioning = false;
    this.scrollPaused = false;
    this.lastInputTime = Date.now();
    this.activeRows = [];
    this.rowsSpawned = 0;
    this.rowsCleared = 0;
    this.stageConfig = null;
    this.spawnTimer = null;
    this.blinkTimers = [];

    this.visHandler = () => {
      if (document.hidden && !this.gameOver) this.pauseGame();
    };
    document.addEventListener('visibilitychange', this.visHandler);

    this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0xF5F5F0);
    this.add.image(GAME_WIDTH/2, DEADLINE_Y, 'deadline_bar').setDisplaySize(GAME_WIDTH, 8);

    this.createHUD();
    this.createSoundBank();
    this.startStage();

    const pauseBtn = this.add.text(GAME_WIDTH - 16, 16, '| |', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.SUBTITLE
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(100);
    pauseBtn.on('pointerdown', () => this.pauseGame());

    this.input.on('pointerdown', () => { this.lastInputTime = Date.now(); });
  }

  startStage() {
    this.stageConfig = getStageConfig(this.stage);
    this.rowsSpawned = 0;
    this.rowsCleared = 0;
    this.stageTransitioning = false;
    this.updateHUD();
    this.updatePriorityIndicator(this.stageConfig.colorPriority);
    this.spawnNextRow();
  }

  spawnNextRow() {
    if (this.gameOver || this.stageTransitioning) return;
    if (this.rowsSpawned >= this.stageConfig.rowCount) return;

    const rowData = generateRow(this.stage, this.rowsSpawned);
    this.createBubbleRow(rowData, this.rowsSpawned);
    this.rowsSpawned++;

    if (this.stageConfig.doubleRow && this.rowsSpawned < this.stageConfig.rowCount) {
      const rowData2 = generateRow(this.stage, this.rowsSpawned);
      this.createBubbleRow(rowData2, this.rowsSpawned, 56);
      this.rowsSpawned++;
    }

    if (this.rowsSpawned < this.stageConfig.rowCount) {
      this.spawnTimer = this.time.delayedCall(this.stageConfig.spawnDelay, () => this.spawnNextRow());
    }
  }

  createBubbleRow(rowData, rowIndex, extraY) {
    const y = SPAWN_Y + (extraY || 0);
    const container = this.add.container(0, y);
    container.rowData = rowData;
    container.rowIndex = rowIndex;
    container.allPopped = false;
    container.bubbleSprites = [];

    for (let i = 0; i < rowData.length; i++) {
      const bData = rowData[i];
      const x = i * BUBBLE_CELL + BUBBLE_CELL / 2;
      const texKey = BUBBLE_COLOR_MAP[bData.color];
      const sprite = this.add.image(x, 0, texKey);
      sprite.setInteractive(new Phaser.Geom.Rectangle(-2, -2, 52, 52), Phaser.Geom.Rectangle.Contains);
      sprite.bubbleData = bData;
      sprite.parentRow = container;
      sprite.on('pointerdown', () => this.handleTap(sprite, container));
      container.add(sprite);
      container.bubbleSprites.push(sprite);

      if (bData.isBlink) {
        sprite.blinkStart = Date.now();
        const timer = this.time.addEvent({
          delay: 125, loop: true,
          callback: () => {
            if (bData.popped) { timer.remove(); return; }
            sprite.setAlpha(sprite.alpha < 1 ? 1 : 0.3);
          }
        });
        this.blinkTimers.push({ timer, sprite, data: bData });
      }
    }
    this.activeRows.push(container);
  }

  handleTap(sprite, container) {
    if (this.gameOver || this.stageTransitioning) return;
    const bData = sprite.bubbleData;
    if (bData.popped) return;
    this.lastInputTime = Date.now();

    if (bData.isBonus || canTapColor(bData.color, this.stageConfig.colorPriority, container.rowData)) {
      this.popBubble(sprite, container);
    } else {
      this.wrongColorTap(sprite);
    }
  }

  popBubble(sprite, container) {
    const bData = sprite.bubbleData;
    bData.popped = true;

    const basePoints = bData.isBonus ? SCORE.SILVER_BONUS : SCORE.POP;
    const multiplier = Math.min(1.0 + this.combo * 0.1, 3.0);
    const points = Math.round(basePoints * multiplier);
    this.score += points;
    this.combo++;

    if (this.combo === 5) { this.score += SCORE.COMBO_5; this.showCombo(5); }
    if (this.combo === 10) { this.score += SCORE.COMBO_10; this.showCombo(10); }
    if (this.combo === 15) this.showCombo(15);

    this.popParticles(sprite.x + container.x, sprite.y + container.y, bData.color);
    this.tweens.add({
      targets: sprite, scaleX: 1.3, scaleY: 1.3, duration: 60, yoyo: true,
      onComplete: () => sprite.setTexture('bubble_popped')
    });
    this.playPopSound();

    this.scrollPaused = true;
    setTimeout(() => { this.scrollPaused = false; }, 50);

    this.showFloatingScore(sprite.x + container.x, sprite.y + container.y, points, bData.color);
    this.tweens.add({ targets: this.scoreText, scaleX: 1.25, scaleY: 1.25, duration: 80, yoyo: true });
    this.updateHUD();
    sprite.disableInteractive();
    this.checkRowClear(container);
  }

  wrongColorTap(sprite) {
    sprite.setTint(0xFFFFFF);
    this.time.delayedCall(80, () => sprite.clearTint());
    this.playBuzzSound();
    this.addStrike();
    this.combo = 0;
  }

  deadlineCrossed(sprite, container) {
    if (sprite.bubbleData.popped) return;
    sprite.bubbleData.popped = true;
    sprite.disableInteractive();
    sprite.setAlpha(0.3);
    this.playWhooshSound();
    this.addStrike();
    this.combo = 0;
  }

  addStrike() {
    if (this.gameOver) return;
    this.strikes++;
    this.cameras.main.shake(250, 0.015);
    this.updateHUD();
    if (this.strikes <= MAX_STRIKES) {
      const icon = this.strikeIcons[this.strikes - 1];
      this.tweens.add({ targets: icon, scaleX: 1.5, scaleY: 1.5, duration: 80, yoyo: true, ease: 'Quad.easeOut' });
    }
    if (this.strikes >= MAX_STRIKES) this.triggerGameOver();
  }

  triggerGameOver() {
    this.gameOver = true;
    if (this.spawnTimer) this.spawnTimer.remove();
    this.cameras.main.shake(500, 0.05);
    this.playGameOverSound();

    const overlay = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x808080, 0);
    this.tweens.add({ targets: overlay, alpha: 0.6, duration: 400 });

    AdManager.trackDeath();
    let isNewBest = false;
    if (this.score > window.GameState.highScore) {
      window.GameState.highScore = this.score;
      saveHighScore(this.score);
      isNewBest = true;
    }

    const finalScore = this.score;
    const finalStage = this.stage;
    this.time.delayedCall(800, () => {
      this.scene.launch('GameOverScene', { score: finalScore, stage: finalStage, isNewBest: isNewBest });
    });
  }

  checkRowClear(container) {
    const allPopped = container.rowData.every(b => b.popped);
    if (!allPopped) return;
    container.allPopped = true;
    this.rowsCleared++;

    const allTapped = container.bubbleSprites.every(s => s.texture && s.texture.key === 'bubble_popped');
    if (allTapped) {
      this.score += SCORE.ROW_CLEAR;
      this.showRowBonus(container.y);
      this.playRowClearSound();
    }
    this.checkStageComplete();
  }

  checkStageComplete() {
    if (this.stageTransitioning || this.gameOver) return;
    const allDone = this.activeRows.every(r => r.allPopped || r.y < DEADLINE_Y - 20);
    if (this.rowsSpawned >= this.stageConfig.rowCount && allDone) this.advanceStage();
  }

  advanceStage() {
    if (this.stageTransitioning) return;
    this.stageTransitioning = true;
    this.score += SCORE.STAGE_CLEAR;
    this.updateHUD();
    this.playStageClearSound();

    const flash = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0xFFFFFF, 0).setDepth(90);
    this.tweens.add({ targets: flash, alpha: 0.6, duration: 150, yoyo: true, hold: 100, onComplete: () => flash.destroy() });

    for (const row of this.activeRows) row.destroy();
    this.activeRows = [];

    this.time.delayedCall(400, () => { this.stage++; this.startStage(); });
  }

  update(time, delta) {
    if (this.gameOver || this.stageTransitioning || this.scrollPaused) return;

    const speed = this.stageConfig.scrollSpeed;
    const dy = speed * delta / 1000;

    for (let i = this.activeRows.length - 1; i >= 0; i--) {
      const row = this.activeRows[i];
      if (row.allPopped) continue;
      row.y -= dy;

      if (row.y <= DEADLINE_Y) {
        for (const sprite of row.bubbleSprites) {
          if (!sprite.bubbleData.popped) this.deadlineCrossed(sprite, row);
        }
        row.allPopped = true;
        this.rowsCleared++;
        this.checkStageComplete();
      }
    }

    for (let i = this.blinkTimers.length - 1; i >= 0; i--) {
      const bt = this.blinkTimers[i];
      if (bt.data.popped) { this.blinkTimers.splice(i, 1); continue; }
      if (Date.now() - bt.sprite.blinkStart > 1500) {
        bt.data.popped = true;
        bt.sprite.disableInteractive();
        bt.sprite.setAlpha(0.1);
        bt.timer.remove();
        this.addStrike();
        this.combo = 0;
        this.blinkTimers.splice(i, 1);
      }
    }

    if (Date.now() - this.lastInputTime > INACTIVITY_TIMEOUT && !this.gameOver) {
      this.triggerGameOver();
    }
  }

  pauseGame() {
    if (this.gameOver) return;
    this.scene.pause('GameScene');
    this.scene.launch('PauseOverlay', { score: this.score, stage: this.stage });
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
    this.blinkTimers = [];
  }
}

// Apply sound + visual effects methods from effects.js
applyEffectsMixin(GameScene);
