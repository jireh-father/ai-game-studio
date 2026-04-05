// Set Surgeon - Core Gameplay Scene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init() {
    this.roundData = null;
    this.currentIndex = 0;
    this.activeElement = null;
    this.elementAttempts = 0;
    this.elementStartTime = 0;
    this.timerEvent = null;
    this.timeRemaining = 0;
    this.paused = false;
    this.gameOver = false;
    this.stageTransitioning = false;
    this.allFirstTry = true;
    this.dragging = false;
    GameState.lastInputTime = Date.now();
  }

  create() {
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG);
    GameState.score = 0;
    GameState.round = 1;
    GameState.lives = CONFIG.LIVES;
    GameState.streak = 0;
    GameState.multiplier = 1.0;

    this.drawVennDiagram();
    this.createHUD();
    this.createTimerBar();
    this.createQueuePreview();

    this.redFlash = this.add.rectangle(
      CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
      CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT, 0xE74C3C, 0
    ).setDepth(90);

    this.startRound();

    this.visHandler = () => {
      if (document.hidden && !this.paused && !this.gameOver) this.togglePause();
    };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  startRound() {
    if (this.gameOver) return;
    this.stageTransitioning = false;
    this.currentIndex = 0;
    this.allFirstTry = true;
    this.roundData = StageManager.generateRound(GameState.round);
    this.roundText.setText('ROUND ' + GameState.round);
    this.labelA.setText('???');
    this.labelB.setText('???');
    this.labelC.setText('???');

    if (this.roundData.isRest) {
      this.showBanner('Easy Round!', CONFIG.COLORS.CORRECT, () => this.spawnNextElement());
    } else if (this.roundData.hintTime > 0) {
      this.showHints();
      this.time.delayedCall(this.roundData.hintTime, () => {
        this.labelA.setText('???');
        this.labelB.setText('???');
        this.labelC.setText('???');
        this.spawnNextElement();
      });
    } else {
      this.spawnNextElement();
    }
    this.updateQueuePreview();
  }

  showHints() {
    this.labelA.setText(this.roundData.ruleA.label);
    this.labelB.setText(this.roundData.ruleB.label);
    this.labelC.setText(this.roundData.ruleC.label);
  }

  spawnNextElement() {
    if (this.gameOver || this.stageTransitioning) return;
    if (this.currentIndex >= this.roundData.elements.length) {
      this.completeRound();
      return;
    }

    const elData = this.roundData.elements[this.currentIndex];
    this.elementAttempts = 0;
    this.elementStartTime = Date.now();
    this.timeRemaining = this.roundData.timerMs;

    if (this.activeElement) { this.activeElement.destroy(); this.activeElement = null; }

    if (elData.type === 'number') {
      this.activeElement = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.SPAWN_Y, String(elData.value),
        { fontSize: '22px', fontFamily: 'monospace', fill: CONFIG.COLORS.HUD_BG, fontStyle: 'bold',
          backgroundColor: '#FFFFFF', padding: { x: 10, y: 8 } }
      ).setOrigin(0.5).setDepth(50);
    } else {
      this.activeElement = this.add.image(CONFIG.GAME_WIDTH / 2, CONFIG.SPAWN_Y, elData.shape.texture)
        .setDepth(50);
    }

    this.activeElement.elData = elData;
    this.activeElement.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(this.activeElement);
    this.setupDrag();
    this.startElementTimer();
    this.updateQueuePreview();
  }

  setupDrag() {
    this.input.off('dragstart').off('drag').off('dragend');
    this.input.on('dragstart', (pointer, obj) => {
      GameState.lastInputTime = Date.now();
      this.dragging = true;
      this.tweens.add({ targets: obj, scaleX: 1.25, scaleY: 1.25, duration: 60 });
      if (navigator.vibrate) navigator.vibrate(15);
      this.playPickupSound();
    });
    this.input.on('drag', (pointer, obj, dragX, dragY) => {
      obj.x = dragX;
      obj.y = dragY;
      this.highlightRegion(StageManager.getRegionFromPoint(dragX, dragY));
    });
    this.input.on('dragend', (pointer, obj) => {
      this.dragging = false;
      this.clearHighlights();
      const region = StageManager.getRegionFromPoint(obj.x, obj.y);
      if (region) {
        this.evaluatePlacement(obj, region);
      } else {
        this.tweens.add({ targets: obj, x: CONFIG.GAME_WIDTH / 2, y: CONFIG.SPAWN_Y,
          scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' });
      }
    });
  }

  evaluatePlacement(obj, regionId) {
    this.elementAttempts++;
    const correct = StageManager.checkPlacement(obj.elData, regionId,
      this.roundData.ruleA, this.roundData.ruleB, this.roundData.ruleC);
    if (correct) this.onCorrectPlacement(obj, regionId);
    else this.onWrongPlacement(obj);
  }

  onCorrectPlacement(obj, regionId) {
    const center = CONFIG.REGION_CENTERS[regionId];
    const firstTry = this.elementAttempts === 1;
    const elapsed = Date.now() - this.elementStartTime;

    if (this.timerEvent) { this.timerEvent.remove(); this.timerEvent = null; }

    let base = firstTry ? CONFIG.SCORE.FIRST_TRY :
      this.elementAttempts === 2 ? CONFIG.SCORE.SECOND_TRY : CONFIG.SCORE.THIRD_TRY;
    let speed = elapsed < CONFIG.SCORE.SPEED_FAST_MS ? CONFIG.SCORE.SPEED_FAST :
      elapsed < CONFIG.SCORE.SPEED_MED_MS ? CONFIG.SCORE.SPEED_MED : 0;
    let total = Math.round((base + speed) * (firstTry ? GameState.multiplier : 1));

    if (firstTry) { GameState.streak++; this.updateMultiplier(); }
    else { GameState.streak = 0; GameState.multiplier = 1; this.allFirstTry = false; this.onStreakBreak(); }

    GameState.score += total;
    this.updateScoreDisplay(total);

    this.tweens.add({
      targets: obj, x: center.x, y: center.y, scaleX: 0.7, scaleY: 0.7, duration: 100,
      onComplete: () => this.tweens.add({ targets: obj, scaleX: 0.8, scaleY: 0.8, duration: 100 })
    });
    this.correctFeedback(obj.x, obj.y, regionId, total, firstTry, speed > 0);

    setTimeout(() => { this.currentIndex++; this.spawnNextElement(); }, (firstTry ? 80 : 0) + 200);
  }

  onWrongPlacement(obj) {
    if (GameState.streak > 0) {
      GameState.streak = 0; GameState.multiplier = 1; this.allFirstTry = false; this.onStreakBreak();
    }
    this.wrongFeedback(obj);
    this.time.delayedCall(300, () => {
      if (obj && obj.active) {
        this.tweens.add({ targets: obj, x: CONFIG.GAME_WIDTH / 2, y: CONFIG.SPAWN_Y,
          scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' });
      }
    });
  }

  startElementTimer() {
    this.timeRemaining = this.roundData.timerMs;
    const totalMs = this.roundData.timerMs;
    this.timerBar.width = CONFIG.GAME_WIDTH - 40;
    this.timerBar.fillColor = 0xF39C12;

    if (this.timerEvent) this.timerEvent.remove();
    this.timerEvent = this.time.addEvent({
      delay: 50, loop: true,
      callback: () => {
        if (this.paused || this.gameOver) return;
        this.timeRemaining -= 50;
        const pct = Math.max(0, this.timeRemaining / totalMs);
        this.timerBar.width = (CONFIG.GAME_WIDTH - 40) * pct;
        if (this.timeRemaining < 2000) this.timerBar.fillColor = 0xE74C3C;
        if (this.timeRemaining <= 0) {
          this.timerEvent.remove(); this.timerEvent = null; this.onTimeout();
        }
      }
    });
  }

  onTimeout() {
    GameState.lives--;
    this.updateLivesDisplay();
    this.timeoutFeedback();
    if (this.activeElement) { this.activeElement.destroy(); this.activeElement = null; }
    if (GameState.lives <= 0) {
      this.time.delayedCall(500, () => this.triggerGameOver());
    } else {
      this.time.delayedCall(500, () => { this.currentIndex++; this.spawnNextElement(); });
    }
  }

  completeRound() {
    if (this.stageTransitioning) return;
    this.stageTransitioning = true;
    if (this.timerEvent) { this.timerEvent.remove(); this.timerEvent = null; }
    if (this.allFirstTry) GameState.score += CONFIG.SCORE.ROUND_PERFECT;
    this.scoreText.setText(String(GameState.score));
    this.revealRules(() => { GameState.round++; this.time.delayedCall(800, () => this.startRound()); });
    this.roundCompleteFeedback();
  }

  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    if (this.timerEvent) { this.timerEvent.remove(); this.timerEvent = null; }
    this.labelA.setText(this.roundData.ruleA.label);
    this.labelB.setText(this.roundData.ruleB.label);
    this.labelC.setText(this.roundData.ruleC.label);
    this.time.delayedCall(1200, () => {
      GameState.gamesPlayed++;
      this.scene.stop('GameScene');
      this.scene.start('GameOverScene');
    });
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.scene.launch('PauseScene', { returnTo: 'GameScene' });
      this.scene.pause();
    } else {
      this.scene.resume();
    }
  }

  update() {
    if (this.paused || this.gameOver) return;
    if (Date.now() - GameState.lastInputTime > 25000) this.triggerGameOver();
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
    this.input.off('dragstart').off('drag').off('dragend');
  }
}
