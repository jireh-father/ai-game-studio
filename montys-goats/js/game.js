// Monty's Goats - Core Game Scene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.gameOver = false;
    this.inputLocked = false;
    this.phase = 'pick';
    this.stageTransitioning = false;
    this.lastInputTime = Date.now();
    this.roundData = null;
    this.selectedDoor = -1;
    this.timerRemaining = 0;
    this.timerTotal = 0;
    this.paused = false;

    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.background);

    // Monty avatar
    this.montyAvatar = this.add.image(w / 2, 90, 'monty').setScale(1.2);

    // Speech bubble
    this.speechBg = this.add.rectangle(w / 2, 160, 300, 50, COLORS.secondary, 0.85).setVisible(false);
    this.speechText = this.add.text(w / 2, 160, '', {
      fontSize: '15px', fontFamily: 'Arial, sans-serif', fill: '#FFFFFF',
      align: 'center', wordWrap: { width: 280 }
    }).setOrigin(0.5).setVisible(false).setDepth(5);

    this.doors = [];
    this.doorNumbers = [];
    this.createDoors(3);
    this.createDecisionButtons();

    // Timer bar
    this.timerBarBg = this.add.rectangle(w / 2, h - 30, w - 20, 14, 0x333333).setDepth(2);
    this.timerBar = this.add.rectangle(10, h - 30, w - 20, 14, COLORS.timerFull)
      .setOrigin(0, 0.5).setDepth(3);

    this.createHUD();

    // Pause button
    this.pauseBtn = this.add.text(w - 40, 18, '| |', {
      fontSize: '20px', fill: '#FFFFFF', fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);
    this.pauseBtn.on('pointerdown', () => this.togglePause());

    // Goat hint
    this.hintText = this.add.text(w / 2, 195, '', {
      fontSize: '13px', fontFamily: 'Arial', fill: '#32CD32', fontStyle: 'italic'
    }).setOrigin(0.5).setVisible(false).setDepth(5);

    // Flash overlays
    this.goldFlash = this.add.rectangle(w / 2, h / 2, w, h, COLORS.reward, 0).setDepth(20);
    this.redFlash = this.add.rectangle(w / 2, h / 2, w, h, COLORS.danger, 0).setDepth(20);

    this.visHandler = () => {
      if (document.hidden && !this.gameOver) this.togglePause(true);
    };
    document.addEventListener('visibilitychange', this.visHandler);

    this.startRound();
  }

  startRound() {
    if (this.gameOver || this.stageTransitioning) return;
    this.phase = 'pick';
    this.selectedDoor = -1;
    this.inputLocked = false;
    GameState.round++;

    this.pendingNumDoors = StageManager.getNumDoors(GameState.round);
    if (this.pendingNumDoors !== this.doors.length) {
      this.createDoors(this.pendingNumDoors);
    }

    this.doors.forEach((d, i) => {
      d.setTexture('doorClosed').setAlpha(1).setScale(1);
      const dw = this.pendingNumDoors === 4 ? 75 : 90;
      d.setDisplaySize(dw, dw * 1.6);
      this.doorNumbers[i].setVisible(true).setAlpha(1);
    });

    this.setDecisionVisible(false);
    this.speechBg.setVisible(false);
    this.speechText.setVisible(false);
    this.hintText.setVisible(false);
    this.timerBar.setScale(1, 1);
    this.updateHUD();
  }

  onDoorTap(index) {
    if (this.phase !== 'pick' || this.inputLocked || this.paused || this.gameOver) return;
    this.lastInputTime = Date.now();
    this.inputLocked = true;
    this.selectedDoor = index;
    this.roundData = StageManager.generateRound(GameState.round, index);
    this.doors[index].setTexture('doorSelected');
    this.doorPickEffect(index);
    this.time.delayedCall(400, () => this.montyReveal());
  }

  montyReveal() {
    this.phase = 'reveal';
    const rd = this.roundData;
    let delay = 0;
    rd.revealDoors.forEach((rIdx) => {
      this.time.delayedCall(delay, () => {
        this.doorFlipEffect(rIdx, 'doorGoat');
        this.doorNumbers[rIdx].setVisible(false);
      });
      delay += 300;
    });

    this.time.delayedCall(delay + 200, () => {
      if (rd.lieText) this.showSpeechBubble(rd.lieText);
      if (rd.goatHint) this.hintText.setText(rd.goatHint.text).setVisible(true);
      this.phase = 'decide';
      this.setDecisionVisible(true);
      this.inputLocked = false;
      this.timerTotal = rd.timerSeconds;
      this.timerRemaining = rd.timerSeconds;
      this.timerBar.displayWidth = this.scale.width - 20;
      this.timerBar.setFillStyle(COLORS.timerFull);
      this.montyBounceEffect();
    });
  }

  onDecision(action) {
    if (this.phase !== 'decide' || this.inputLocked || this.paused) return;
    this.lastInputTime = Date.now();
    this.inputLocked = true;
    this.phase = 'result';
    this.setDecisionVisible(false);
    this.buttonPunchEffect(action === 'switch' ? this.switchBg : this.stayBg);

    let finalDoor = this.selectedDoor;
    if (action === 'switch') {
      for (let i = 0; i < this.roundData.numDoors; i++) {
        if (i !== this.selectedDoor && !this.roundData.revealDoors.includes(i)) {
          finalDoor = i;
          break;
        }
      }
      this.doors[this.selectedDoor].setTexture('doorClosed');
      this.doors[finalDoor].setTexture('doorSelected');
    }
    this.time.delayedCall(300, () => this.revealResult(finalDoor, action));
  }

  revealResult(finalDoor, action) {
    const rd = this.roundData;
    const won = finalDoor === rd.carDoor;
    this.doorFlipEffect(finalDoor, won ? 'doorCar' : 'doorGoat');
    if (!won && rd.carDoor !== finalDoor) {
      this.time.delayedCall(200, () => this.doorFlipEffect(rd.carDoor, 'doorCar'));
    }
    this.time.delayedCall(400, () => won ? this.handleWin(action) : this.handleLoss());
  }

  handleWin(action) {
    GameState.strikes = 0;
    GameState.combo++;
    const mult = this.getComboMultiplier();
    let points = action === 'stay' ? SCORE_VALUES.correctStay : SCORE_VALUES.correctSwitch;
    if (this.roundData.numDoors === 4) points = SCORE_VALUES.correctSwitch4Door;
    if (this.timerRemaining > this.timerTotal - 3) points += SCORE_VALUES.quickBonus;
    points *= mult;
    GameState.score += points;
    if (GameState.score > GameState.highScore) {
      GameState.highScore = GameState.score;
      try { localStorage.setItem('montys-goats_high_score', GameState.highScore); } catch(e) {}
    }
    this.correctEffect(points);
    this.updateHUD();
    this.time.delayedCall(ROUND_END_DELAY + 400, () => { if (!this.gameOver) this.startRound(); });
  }

  handleLoss() {
    GameState.strikes++;
    GameState.combo = 0;
    this.wrongEffect();
    this.updateHUD();
    if (GameState.strikes >= 3) {
      this.time.delayedCall(500, () => this.triggerGoatMode());
    } else {
      this.time.delayedCall(ROUND_END_DELAY + 400, () => { if (!this.gameOver) this.startRound(); });
    }
  }

  triggerGoatMode() {
    this.gameOver = true;
    this.phase = 'goatMode';
    this.goatModeEffect();
    this.time.delayedCall(1800, () => {
      this.scene.stop('GameScene');
      this.scene.start('GameOverScene');
    });
  }

  triggerDeath() {
    if (this.gameOver || this.phase === 'goatMode') return;
    this.gameOver = true;
    this.phase = 'goatMode';
    this.goatModeEffect();
    this.time.delayedCall(1800, () => {
      this.scene.stop('GameScene');
      this.scene.start('GameOverScene');
    });
  }

  togglePause(forcePause) {
    if (this.gameOver) return;
    this.paused = forcePause !== undefined ? forcePause : !this.paused;
    if (this.paused) {
      this.scene.pause();
      this.scene.launch('PauseScene');
    } else {
      this.scene.resume();
    }
  }

  update(time, delta) {
    if (this.paused || this.gameOver) return;
    if (Date.now() - this.lastInputTime > INACTIVITY_TIMEOUT && !this.gameOver) {
      this.triggerDeath();
      return;
    }
    if (this.phase === 'decide' && this.timerRemaining > 0) {
      this.timerRemaining -= delta / 1000;
      const pct = Math.max(0, this.timerRemaining / this.timerTotal);
      this.timerBar.displayWidth = (this.scale.width - 20) * pct;
      if (this.timerRemaining < 3) this.timerBar.setFillStyle(COLORS.danger);
      else if (this.timerRemaining < 6) this.timerBar.setFillStyle(0xFF8C00);
      if (this.timerRemaining <= 0 && !this.stageTransitioning) {
        this.stageTransitioning = true;
        this.onTimerExpiry();
      }
    }
  }

  onTimerExpiry() {
    this.phase = 'result';
    this.setDecisionVisible(false);
    this.timerFlashEffect();
    this.time.delayedCall(100, () => {
      this.handleLoss();
      this.stageTransitioning = false;
    });
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}
