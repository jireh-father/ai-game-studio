// Speed Dating Dodge — Core Gameplay Scene
// HUD methods in hud.js, rendering/effects in render.js (prototype mixins)
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Game state
    this.score = 0;
    this.dateNumber = 1;
    this.failCount = 0;
    this.combo = 0;
    this.chemistryStreak = 0;
    this.currentQuestionIdx = 0;
    this.currentDate = null;
    this.inputLocked = false;
    this.timerExpired = false;
    this.gameOver = false;
    this.isPaused = false;
    this.timerRemaining = 0;
    this.timerTotal = 0;
    this.adContinueUsed = false;
    this.dateObjects = [];

    DateGenerator.reset();
    this.add.rectangle(w/2, h/2, w, h, 0xFFF5E6);
    this.createHUD();
    this.createParticleTextures();
    this.registerSwipe();

    // Extra life from ad
    this.events.on('extraLife', () => {
      this.failCount = Math.max(0, this.failCount - 1);
      this.gameOver = false;
      this.adContinueUsed = true;
      this.updateHeartsDisplay();
      this.spawnNextDate();
    });

    // Visibility handler
    this.visHandler = () => {
      if (document.hidden && !this.gameOver && !this.isPaused) this.togglePause();
    };
    document.addEventListener('visibilitychange', this.visHandler);

    this.spawnNextDate();
  }

  registerSwipe() {
    let startX = 0, startTime = 0;
    this.input.on('pointerdown', (ptr) => {
      if (this.isPaused || this.gameOver) return;
      startX = ptr.x;
      startTime = this.time.now;
    });
    this.input.on('pointerup', (ptr) => {
      if (this.isPaused || this.gameOver || this.inputLocked) return;
      const dx = ptr.x - startX;
      const dt = this.time.now - startTime;
      if (Math.abs(dx) >= CONFIG.SWIPE_THRESHOLD_PX && dt <= CONFIG.SWIPE_MAX_DURATION_MS) {
        this.onSwipe(dx < 0 ? 'left' : 'right');
      }
    });
  }

  spawnNextDate() {
    if (this.gameOver) return;
    this.clearDateObjects();
    this.currentDate = DateGenerator.generateDate(this.dateNumber);
    this.currentQuestionIdx = 0;
    this.chemistryStreak = 0;
    this.timerExpired = false;
    this.updateChemistryDots();
    this.dateText.setText('Date: ' + this.dateNumber);
    SFX.play('whoosh');
    this.showDateIntro();
  }

  onSwipe(direction) {
    if (this.gameOver || this.timerExpired || !this.currentDate || this.inputLocked) return;
    this.inputLocked = true;

    const q = this.currentDate.questions[this.currentQuestionIdx];
    if (!q) return;

    const correctDir = DateGenerator.getCorrectAnswer(q, this.currentDate.personalityType);
    const isCorrect = direction === correctDir;
    const speedBonus = this.timerRemaining > this.timerTotal * 0.5;
    const bubble = direction === 'left' ? this.leftBubble : this.rightBubble;
    const bx = bubble ? bubble.x : this.scale.width / 2;
    const by = bubble ? bubble.y : 300;

    if (isCorrect) {
      this.onCorrectAnswer(bx, by, speedBonus, q.is_landmine);
    } else {
      this.onWrongAnswer(bx, by);
    }
    this.time.delayedCall(CONFIG.INPUT_LOCK_MS, () => { this.inputLocked = false; });
  }

  onCorrectAnswer(bx, by, speedBonus, isLandmine) {
    this.combo++;
    this.chemistryStreak++;
    const multi = Math.min(this.combo, CONFIG.MAX_COMBO_MULTI);
    let pts = CONFIG.BASE_SCORE * multi;
    if (speedBonus) pts += CONFIG.SPEED_BONUS;
    if (isLandmine) pts += CONFIG.LANDMINE_BONUS;

    let sparkTriggered = false;
    if (this.chemistryStreak >= CONFIG.SPARK_THRESHOLD) {
      pts += CONFIG.SPARK_BONUS;
      sparkTriggered = true;
    }

    this.score += pts;
    this.updateScoreDisplay();
    this.updateChemistryDots();
    this.updateComboDisplay();

    // Visual effects (from render.js)
    this.emitCorrectEffects(bx, by, pts, multi);

    // Sound with pitch mod
    const pitchMod = 1 + (Math.floor(this.combo / 3) * 0.05);
    SFX.play('correct', Math.min(pitchMod, 1.3));

    if (sparkTriggered) this.triggerSparkBonus();

    this.timerRemaining = 0;
    this.time.delayedCall(350, () => this.advanceQuestion());
  }

  onWrongAnswer(bx, by) {
    this.combo = 0;
    this.chemistryStreak = 0;
    this.failCount++;
    this.updateComboDisplay();
    this.updateChemistryDots();
    this.updateHeartsDisplay();

    // Visual effects (from render.js)
    this.emitWrongEffects(bx, by);

    SFX.play('wrong');
    SFX.play('heartbreak');

    if (this.failCount >= CONFIG.MAX_FAILS) {
      this.timerRemaining = 0;
      this.time.delayedCall(400, () => this.triggerGameOver());
      return;
    }

    this.timerRemaining = 0;
    this.time.delayedCall(500, () => {
      this.dateNumber++;
      this.spawnNextDate();
    });
  }

  advanceQuestion() {
    if (this.gameOver) return;
    this.currentQuestionIdx++;
    if (this.currentQuestionIdx >= this.currentDate.questions.length) {
      this.completeDate();
    } else {
      this.clearQuestionObjects();
      this.showQuestion();
    }
  }

  completeDate() {
    this.score += CONFIG.DATE_COMPLETE_BONUS;
    this.updateScoreDisplay();
    SFX.play('dateComplete');

    const w = this.scale.width;
    const bonusTxt = this.add.text(w/2, 200, '+' + CONFIG.DATE_COMPLETE_BONUS + ' Date Complete!', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_CORRECT
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: bonusTxt, y: 150, alpha: 0, duration: 800, onComplete: () => bonusTxt.destroy() });

    if (this.avatarCircle) {
      this.tweens.add({ targets: this.avatarCircle, x: w + 100, duration: 250 });
    }

    this.dateNumber++;
    this.time.delayedCall(600, () => this.spawnNextDate());
  }

  triggerGameOver() {
    this.gameOver = true;
    this.emitGameOverEffects();
    SFX.play('gameover');

    this.time.delayedCall(700, () => {
      this.scene.launch('GameOverScene', {
        score: this.score,
        dateReached: this.dateNumber,
        adContinueUsed: this.adContinueUsed
      });
    });
  }

  clearDateObjects() {
    this.dateObjects.forEach(obj => { if (obj && obj.destroy) obj.destroy(); });
    this.dateObjects = [];
    this.avatarCircle = null;
    this.mouthGraphics = null;
    this.leftBubble = null;
    this.rightBubble = null;
  }

  clearQuestionObjects() {
    const keep = 11; // avatar + eyes + mouth + blush + badge + icon + name
    const toRemove = this.dateObjects.splice(keep);
    toRemove.forEach(obj => { if (obj && obj.destroy) obj.destroy(); });
    this.leftBubble = null;
    this.rightBubble = null;
  }

  onTimerExpiry() {
    if (this.gameOver) return;
    SFX.play('wrong');
    this.onWrongAnswer(this.scale.width / 2, 310);
  }

  update(time, delta) {
    if (this.gameOver || this.isPaused || this.timerExpired) return;

    if (this.timerRemaining > 0) {
      this.timerRemaining -= delta;
      const pct = Math.max(0, this.timerRemaining / this.timerTotal);
      const barWidth = (this.scale.width - 20) * pct;
      this.timerBar.setSize(barWidth, 8);

      if (pct < 0.25) this.timerBar.setFillStyle(0xEE5A24);
      else this.timerBar.setFillStyle(0xF9CA24);

      if (this.timerRemaining <= 0 && !this.timerExpired) {
        this.timerExpired = true;
        this.onTimerExpiry();
      }
    }
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    if (this.visHandler) {
      document.removeEventListener('visibilitychange', this.visHandler);
    }
  }
}
