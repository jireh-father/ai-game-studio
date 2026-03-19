// game.js — Core gameplay: question display, timer, answer handling, scoring

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.continuing = data && data.continuing;
  }

  create() {
    const { WIDTH, BTN_START_Y, BTN_HEIGHT, BTN_GAP, BTN_WIDTH } = GAME_CONFIG;
    this.cameras.main.setBackgroundColor(COLORS.BG);

    if (!this.continuing) {
      GameState.score = 0;
      GameState.stage = 1;
      GameState.streak = 0;
      GameState.bestStreak = 0;
      GameState.sessionSeed = Math.floor(Math.random() * 10000) + Date.now() % 100000;
      GameState.usedIndices = new Set();
    } else {
      GameState.streak = 0;
    }

    this.gameOver = false;
    this.inputLocked = false;
    this.stageTransitioning = false;
    this.currentStageConfig = getStageConfig(GameState.stage);
    this.stageQuestions = selectQuestions(GameState.stage, GameState.sessionSeed, GameState.usedIndices);
    this.currentQuestionIndex = 0;
    this.lastInputTime = Date.now();
    this.pauseOverlay = null;

    // Question card
    this.add.rectangle(WIDTH / 2, GAME_CONFIG.QUESTION_Y + GAME_CONFIG.QUESTION_H / 2,
      BTN_WIDTH, GAME_CONFIG.QUESTION_H, 0xF5F0E8, 1).setStrokeStyle(2, 0xC8C0B0);

    this.questionText = this.add.text(WIDTH / 2, GAME_CONFIG.QUESTION_Y + GAME_CONFIG.QUESTION_H / 2, '', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: '#0D1B2A', align: 'center', wordWrap: { width: BTN_WIDTH - 40 }
    }).setOrigin(0.5);

    // Timer bar
    this.add.rectangle(WIDTH / 2, GAME_CONFIG.TIMER_Y, BTN_WIDTH, GAME_CONFIG.TIMER_H, 0x1A2940, 1);
    this.timerBar = this.add.rectangle(WIDTH / 2 - BTN_WIDTH / 2, GAME_CONFIG.TIMER_Y,
      BTN_WIDTH, GAME_CONFIG.TIMER_H, 0xFF6B35, 1).setOrigin(0, 0.5);

    // Answer buttons
    this.buttons = [];
    this.buttonTexts = [];
    for (let i = 0; i < 3; i++) {
      const by = BTN_START_Y + i * (BTN_HEIGHT + BTN_GAP);
      const btn = this.add.rectangle(WIDTH / 2, by, BTN_WIDTH, BTN_HEIGHT, 0x2E4057, 1)
        .setStrokeStyle(2, 0x3D5070).setInteractive();
      const txt = this.add.text(WIDTH / 2, by, '', {
        fontSize: '22px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
        color: '#FFFFFF', align: 'center', wordWrap: { width: BTN_WIDTH - 20 }
      }).setOrigin(0.5);
      btn.on('pointerdown', () => this.onAnswerTapped(i));
      this.buttons.push(btn);
      this.buttonTexts.push(txt);
    }

    // HUD (from hud.js) — MUST be created before showQuestion
    createHUD(this);

    // Visibility handler
    this.visHandler = () => { if (document.hidden && !this.gameOver) showPauseOverlay(this); };
    document.addEventListener('visibilitychange', this.visHandler);

    this.showQuestion();
  }

  showQuestion() {
    if (this.gameOver) return;
    if (this.currentQuestionIndex >= this.stageQuestions.length) {
      this.advanceStage();
      return;
    }

    const question = this.stageQuestions[this.currentQuestionIndex];
    const { displayAnswers, deathIndex } = shuffleAnswers(question);
    this.currentDeathIndex = deathIndex;
    this.currentQuestion = question;
    this.questionText.setText(question.q);

    for (let i = 0; i < 3; i++) {
      this.buttons[i].setFillStyle(0x2E4057).setStrokeStyle(2, 0x3D5070).setScale(1);
      this.buttonTexts[i].setText(displayAnswers[i]);
    }

    this.inputLocked = false;
    this.startTimer(this.currentStageConfig.timerMs);
  }

  startTimer(durationMs) {
    if (this.timerTween && this.timerTween.isPlaying && this.timerTween.isPlaying()) this.timerTween.stop();
    this.timerBar.width = GAME_CONFIG.BTN_WIDTH;
    this.timerBar.setFillStyle(0xFF6B35);
    this.timerStartTime = this.time.now;
    this.timerDuration = durationMs;

    this.timerTween = this.tweens.add({
      targets: this.timerBar, width: 0, duration: durationMs, ease: 'Linear',
      onUpdate: () => {
        if (this.timerBar.width / GAME_CONFIG.BTN_WIDTH < 0.3) this.timerBar.setFillStyle(0xE63946);
      },
      onComplete: () => { if (!this.gameOver && !this.inputLocked) this.onTimerExpired(); }
    });
  }

  onAnswerTapped(buttonIndex) {
    if (this.inputLocked || this.gameOver) return;
    this.inputLocked = true;
    this.lastInputTime = Date.now();
    if (this.timerTween) this.timerTween.pause();

    if (buttonIndex === this.currentDeathIndex) {
      this.handleDeath('correct', buttonIndex);
    } else {
      this._lastSurvivedBtn = buttonIndex;
      const elapsed = this.time.now - this.timerStartTime;
      this.handleSurvive(buttonIndex, elapsed);
    }
  }

  handleSurvive(buttonIndex, elapsed) {
    const ratio = elapsed / this.timerDuration;
    let points = SCORE.BASE;
    if (ratio <= SCORE.SPEED_FAST_THRESHOLD) points += SCORE.SPEED_FAST;
    else if (ratio <= SCORE.SPEED_MID_THRESHOLD) points += SCORE.SPEED_MID;

    GameState.streak++;
    if (GameState.streak > GameState.bestStreak) GameState.bestStreak = GameState.streak;
    const multiplier = SCORE.getMultiplier(GameState.streak);
    const totalPoints = Math.floor(points * multiplier);
    GameState.score += totalPoints;

    // Button green flash + scale punch
    this.buttons[buttonIndex].setFillStyle(0x2DC653);
    this.tweens.add({
      targets: this.buttons[buttonIndex],
      scaleX: 1.08, scaleY: 1.08, duration: 60, yoyo: true, ease: 'Quad.easeOut'
    });

    updateScoreHUD(this, totalPoints);
    updateStreakDisplay(this);

    // Camera zoom micro-effect
    this.cameras.main.zoomTo(1.02, 60);
    setTimeout(() => { if (this.cameras && this.cameras.main) this.cameras.main.zoomTo(1.0, 60); }, 80);

    if (navigator.vibrate) navigator.vibrate(20);

    // Hit-stop
    this.scene.pause();
    setTimeout(() => {
      this.scene.resume();
      this.currentQuestionIndex++;
      this.time.delayedCall(200, () => this.showQuestion());
    }, 80);
  }

  handleDeath(reason, buttonIndex) {
    this.gameOver = true;
    if (this.timerTween) this.timerTween.pause();

    if (reason === 'correct' && buttonIndex !== undefined) {
      this.buttons[buttonIndex].setFillStyle(0xE63946);
      this.tweens.add({ targets: this.buttons[buttonIndex], scaleX: 1.12, scaleY: 1.12, duration: 40, yoyo: true });
      const bx = this.buttons[buttonIndex].x, by = this.buttons[buttonIndex].y;
      const g = this.add.graphics();
      g.lineStyle(5, 0xFFFFFF);
      g.beginPath(); g.moveTo(bx - 15, by - 15); g.lineTo(bx + 15, by + 15); g.strokePath();
      g.beginPath(); g.moveTo(bx + 15, by - 15); g.lineTo(bx - 15, by + 15); g.strokePath();
    }

    this.time.delayedCall(100, () => { this.buttons.forEach(b => b.setFillStyle(0xE63946)); });

    this.cameras.main.shake(500, 0.015);

    const flash = this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2,
      GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT, 0xFFFFFF, 0).setDepth(10);
    this.tweens.add({ targets: flash, alpha: 0.6, duration: 100, yoyo: true, onComplete: () => flash.destroy() });

    if (navigator.vibrate) navigator.vibrate([80, 50, 80]);

    this.time.delayedCall(300, () => {
      const deathText = reason === 'timeout'
        ? TIMEOUT_MESSAGES[Math.floor(Math.random() * TIMEOUT_MESSAGES.length)]
        : 'YOU KNEW IT WAS ' + this.currentQuestion.answers[this.currentQuestion.correctIndex] + '!';
      this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, deathText, {
        fontSize: '24px', fontFamily: 'Arial Black', fontStyle: 'bold', color: '#FFFFFF',
        align: 'center', wordWrap: { width: 300 }
      }).setOrigin(0.5).setDepth(11);
    });

    this.time.delayedCall(600, () => {
      this.scene.stop('GameScene');
      this.scene.start('GameOverScene', {
        reason: reason === 'timeout' ? 'timeout' : 'correct',
        score: GameState.score, stage: GameState.stage, bestStreak: GameState.bestStreak
      });
    });
  }

  onTimerExpired() {
    if (this.gameOver) return;
    this.inputLocked = true;
    this.tweens.add({
      targets: this.timerBar, scaleY: 1.6, duration: 100,
      yoyo: true, onComplete: () => { this.timerBar.scaleY = 0; }
    });
    this.handleDeath('timeout');
  }

  advanceStage() {
    if (this.stageTransitioning) return;
    this.stageTransitioning = true;

    GameState.stage++;
    this.stageText.setText('STG: ' + GameState.stage);
    this.currentStageConfig = getStageConfig(GameState.stage);
    this.stageQuestions = selectQuestions(GameState.stage, GameState.sessionSeed, GameState.usedIndices);
    this.currentQuestionIndex = 0;

    this.cameras.main.setBackgroundColor(COLORS.BG_PULSE);
    this.time.delayedCall(500, () => this.cameras.main.setBackgroundColor(COLORS.BG));

    showStageBanner(this, () => {
      this.stageTransitioning = false;
      this.showQuestion();
    });
  }

  update() {
    if (!this.gameOver && !this.stageTransitioning && Date.now() - this.lastInputTime > 25000) {
      this.handleDeath('timeout');
    }
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
    destroyPauseOverlay(this);
  }
}
