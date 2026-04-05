// Paradox Panic - Core Gameplay Scene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.gameOver = false;
    this.paused = false;
    this.stageTransitioning = false;
    this.swipeActive = false;
    this.paradoxCooldown = false;
    this.lastInputTime = Date.now();
    this.cardStack = [];
    this.comboCount = 0;

    GameState.score = 0;
    GameState.strikes = 0;
    GameState.stage = 0;
    Stages.reset();

    this.createHUD();
    this.createParadoxButton();
    this.createSwipeHints();
    this.createPauseButton();
    this.setupInput();
    this.startCardArrival();
    this.createPauseOverlay();

    this.visHandler = () => {
      if (document.hidden && !this.gameOver) this.togglePause(true);
    };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  createHUD() {
    const w = this.scale.width;
    // Top bar background
    this.add.rectangle(w / 2, 24, w, 48, COLORS.uiBg).setDepth(10);
    this.titleText = this.add.text(8, 12, 'PARADOX PANIC', {
      fontSize: '14px', fontFamily: 'monospace', color: COLORS.paradoxHex, fontStyle: 'bold'
    }).setDepth(11);
    this.scoreText = this.add.text(w / 2, 12, `Score: ${GameState.score}`, {
      fontSize: '16px', fontFamily: 'monospace', color: COLORS.scoreText, fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(11);

    // Bottom HUD bar
    const hudY = this.scale.height - 110;
    this.add.rectangle(w / 2, hudY, w, 40, COLORS.uiBg).setDepth(10);
    this.stageText = this.add.text(10, hudY - 10, `Stage: ${GameState.stage + 1}`, {
      fontSize: '13px', fontFamily: 'monospace', color: '#FFFFFF'
    }).setDepth(11);

    // Strike indicators
    this.strikeImages = [];
    for (let i = 0; i < GAME_CONFIG.maxStrikes; i++) {
      const si = this.add.image(w / 2 - 24 + i * 24, hudY, 'strikeEmpty').setDepth(11).setScale(1.2);
      this.strikeImages.push(si);
    }

    this.comboText = this.add.text(w - 10, hudY - 10, '', {
      fontSize: '13px', fontFamily: 'monospace', color: COLORS.comboGoldHex, fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(11);
  }

  createParadoxButton() {
    const w = this.scale.width;
    const btnY = this.scale.height - 45;
    this.paradoxBtn = this.add.image(w / 2, btnY, 'card')
      .setDisplaySize(180, 54).setDepth(12).setTint(COLORS.paradox)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, 180, 54), Phaser.Geom.Rectangle.Contains);
    this.paradoxBtnText = this.add.text(w / 2, btnY, 'PARADOX', {
      fontSize: '18px', fontFamily: 'monospace', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(13);
    // Pulsing animation
    this.tweens.add({
      targets: [this.paradoxBtn, this.paradoxBtnText],
      scaleX: 1.05, scaleY: 1.05, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
    this.paradoxBtn.on('pointerdown', () => this.handleParadox());
  }

  // createSwipeHints, createPauseButton, createPauseOverlay, togglePause, setupInput → input.js mixin

  startCardArrival() {
    const diff = Stages.getDifficulty(Stages.getStageNumber());
    this.cardTimer = this.time.addEvent({
      delay: diff.interval,
      callback: () => this.spawnCard(),
      loop: true
    });
    // Spawn first card immediately
    this.spawnCard();
  }

  spawnCard() {
    if (this.paused || this.gameOver) return;
    if (this.cardStack.length >= GAME_CONFIG.maxStack) {
      this.triggerDeath('OVERFLOW');
      return;
    }
    const cardData = Stages.generateCard();
    const w = this.scale.width;
    const baseY = 60;
    const stackOffset = 28;
    const yPos = baseY + this.cardStack.length * stackOffset;

    const cardBg = this.add.image(w/2, yPos, this.comboCount >= 2 ? 'cardGold' : 'card')
      .setDisplaySize(CARD_WIDTH, CARD_HEIGHT).setDepth(20 - this.cardStack.length).setAlpha(0);
    const cardText = this.add.text(w/2, yPos, cardData.text, {
      fontSize: '15px', fontFamily: 'monospace', color: COLORS.cardText,
      wordWrap: { width: CARD_WIDTH - 30 }, align: 'center'
    }).setOrigin(0.5).setDepth(21 - this.cardStack.length).setAlpha(0);

    this.tweens.add({ targets: [cardBg, cardText], alpha: 1, y: yPos, duration: 200, ease: 'Back.easeOut' });

    const entry = { bg: cardBg, text: cardText, data: cardData };
    this.cardStack.push(entry);
    this.repositionCards();

    // Stack warning at 4
    if (this.cardStack.length >= 4) {
      this.playStackWarning();
    }
    this.playCardArriveSound();
  }

  repositionCards() {
    const w = this.scale.width;
    const baseY = this.scale.height - 200;
    const stackOffset = -30;
    for (let i = 0; i < this.cardStack.length; i++) {
      const idx = this.cardStack.length - 1 - i;
      const targetY = baseY + idx * stackOffset;
      const card = this.cardStack[i];
      const isActive = i === this.cardStack.length - 1;
      this.tweens.add({ targets: [card.bg, card.text], y: targetY, duration: 150 });
      card.bg.setDepth(20 + i);
      card.text.setDepth(21 + i);
      card.bg.setAlpha(isActive ? 1 : 0.5 + i * 0.1);
      card.text.setAlpha(isActive ? 1 : 0.3);
    }
  }

  handleSwipe(direction) {
    if (this.cardStack.length === 0 || this.swipeActive) return;
    this.swipeActive = true;
    const card = this.cardStack[this.cardStack.length - 1];
    const isCorrect = card.data.answer === direction;

    if (isCorrect) {
      this.triggerCorrect(card, direction);
    } else if (card.data.answer === 'PARADOX') {
      this.triggerWrong(card, 'swipe_on_paradox');
    } else {
      this.triggerWrong(card, 'wrong_tf');
    }
  }

  handleParadox() {
    if (this.cardStack.length === 0 || this.paused || this.gameOver || this.paradoxCooldown) return;
    this.lastInputTime = Date.now();
    this.paradoxCooldown = true;
    setTimeout(() => { this.paradoxCooldown = false; }, GAME_CONFIG.paradoxDebounceMs);

    const card = this.cardStack[this.cardStack.length - 1];
    if (card.data.answer === 'PARADOX') {
      this.triggerCorrect(card, 'PARADOX');
    } else {
      this.triggerWrongParadox(card);
    }
  }

  triggerCorrect(card, type) {
    Stages.onCorrect();
    this.comboCount++;
    const diff = Stages.getDifficulty(Stages.getStageNumber());
    const basePoints = type === 'PARADOX' ? SCORING.paradoxBase : SCORING.correctBase;
    const comboIdx = Math.min(this.comboCount, SCORING.comboMultipliers.length - 1);
    const multi = SCORING.comboMultipliers[comboIdx];
    let points = Math.floor(basePoints * multi);

    // Speed bonus
    const elapsed = Date.now() - card.data.arrivalTime;
    if (elapsed < diff.speedSuper) { points += SCORING.speedSuperFast; this.showSpeedBonus(card, '+FAST!'); }
    else if (elapsed < diff.speedFast) { points += SCORING.speedFast; this.showSpeedBonus(card, '+50'); }

    GameState.score += points;
    const newStage = Stages.getStageNumber();
    if (newStage !== GameState.stage) {
      GameState.stage = newStage;
      this.onStageChange(newStage);
    }
    this.updateHUD();
    this.animateCorrect(card, type, points);
  }

  triggerWrong(card, reason) {
    GameState.strikes++;
    this.comboCount = 0;
    this.updateHUD();
    this.animateWrong(card);
    if (GameState.strikes >= GAME_CONFIG.maxStrikes) {
      this.time.delayedCall(400, () => this.triggerDeath('STRIKES'));
    } else {
      this.time.delayedCall(350, () => {
        this.removeTopCard();
        this.swipeActive = false;
      });
    }
  }

  triggerWrongParadox(card) {
    GameState.strikes += GAME_CONFIG.wrongParadoxPenalty;
    GameState.score = Math.max(0, GameState.score + SCORING.wrongParadox);
    this.comboCount = 0;
    this.updateHUD();
    this.animateWrongParadox(card);
    if (GameState.strikes >= GAME_CONFIG.maxStrikes) {
      this.time.delayedCall(500, () => this.triggerDeath('STRIKES'));
    } else {
      this.time.delayedCall(450, () => this.removeTopCard());
    }
  }

  removeTopCard() {
    if (this.cardStack.length === 0) return;
    const card = this.cardStack.pop();
    card.bg.destroy();
    card.text.destroy();
    this.repositionCards();
  }

  onStageChange(newStage) {
    // Update card arrival interval
    const diff = Stages.getDifficulty(newStage);
    if (this.cardTimer) this.cardTimer.remove();
    this.cardTimer = this.time.addEvent({
      delay: diff.interval, callback: () => this.spawnCard(), loop: true
    });
    // Fade swipe hints after stage 3
    if (newStage >= 3 && this.hintLeft) {
      this.tweens.add({ targets: [this.hintLeft, this.hintRight], alpha: 0, duration: 500 });
    }
    this.showStageChange(newStage);
  }

  updateHUD() {
    this.scoreText.setText(`Score: ${GameState.score}`);
    this.stageText.setText(`Stage: ${GameState.stage + 1}`);
    this.comboText.setText(this.comboCount >= 2 ? `x${this.comboCount}` : '');
    for (let i = 0; i < GAME_CONFIG.maxStrikes; i++) {
      this.strikeImages[i].setTexture(i < GameState.strikes ? 'strikeFilled' : 'strikeEmpty');
    }
  }

  triggerDeath(cause) {
    if (this.gameOver) return;
    this.gameOver = true;
    if (this.cardTimer) this.cardTimer.remove();
    this.animateDeath(cause);
    const delay = cause === 'OVERFLOW' ? 700 : 600;
    this.time.delayedCall(delay, () => {
      // Save high score
      if (GameState.score > GameState.highScore) {
        GameState.highScore = GameState.score;
        GameState.newRecord = true;
        localStorage.setItem('paradox-panic_high_score', GameState.highScore);
      } else {
        GameState.newRecord = false;
      }
      GameState.sessionDeaths++;
      this.scene.stop('GameScene');
      this.scene.start('GameOverScene', {
        score: GameState.score, stage: GameState.stage + 1, cause
      });
    });
  }

  update() {
    if (this.gameOver || this.paused) return;
    // Inactivity death
    if (Date.now() - this.lastInputTime > GAME_CONFIG.inactivityDeathMs && !this.gameOver) {
      this.triggerDeath('OVERFLOW');
    }
    // Stack overflow check
    if (this.cardStack.length >= GAME_CONFIG.maxStack && !this.stageTransitioning) {
      this.stageTransitioning = true;
      this.triggerDeath('OVERFLOW');
    }
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}
