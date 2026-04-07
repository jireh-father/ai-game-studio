// Number Baseball - GameScene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    Effects.initAudio();
    this.gameOver = false;
    this.lastInputTime = Date.now();
    this.history = [];     // {guess: [], strikes, balls, out}
    this.input_digits = [];
    this.historyTexts = [];

    this.cfg = getStageConfig(GameState.stage);
    this.secret = generateSecret(this.cfg.digits);
    this.attemptsLeft = this.cfg.attempts;
    this.timeLeft = this.cfg.timeSec;
    this.stageStartTime = Date.now();

    // Background
    this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, PALETTE.bg);

    // HUD
    this.createHUD();

    // History panel
    this.createHistoryPanel();

    // Input bar
    this.createInputBar();

    // Keypad
    this.createKeypad();

    // Stage banner
    this.flashStageBanner();

    // Timer
    this.timerEvent = this.time.addEvent({ delay: 1000, callback: this.tick, callbackScope: this, loop: true });
  }

  createHUD() {
    this.add.rectangle(GAME_WIDTH/2, 28, GAME_WIDTH, 56, PALETTE.panel);
    this.add.line(0, 56, 0, 0, GAME_WIDTH, 0, PALETTE.border).setOrigin(0, 0);

    this.scoreText = this.add.text(16, 14, 'SCORE\n' + GameState.score, {
      fontSize: '12px', fontFamily: 'Arial', color: COLORS_HEX.text, align: 'left'
    });
    this.stageText = this.add.text(GAME_WIDTH/2, 28, 'STAGE ' + GameState.stage, {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.accent
    }).setOrigin(0.5);
    this.digitsText = this.add.text(GAME_WIDTH/2, 48, this.cfg.digits + ' DIGITS', {
      fontSize: '11px', fontFamily: 'Arial', color: COLORS_HEX.dim
    }).setOrigin(0.5);

    this.attemptsText = this.add.text(GAME_WIDTH - 16, 14, 'TRIES\n' + this.attemptsLeft, {
      fontSize: '12px', fontFamily: 'Arial', color: COLORS_HEX.text, align: 'right'
    }).setOrigin(1, 0);

    // Timer below HUD
    this.timerBg = this.add.rectangle(GAME_WIDTH/2, 76, GAME_WIDTH - 32, 24, PALETTE.panelLight)
      .setStrokeStyle(1, PALETTE.border);
    this.timerFill = this.add.rectangle(16, 76, GAME_WIDTH - 32, 22, PALETTE.success).setOrigin(0, 0.5);
    this.timerText = this.add.text(GAME_WIDTH/2, 76, this.timeLeft + 's', {
      fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.text
    }).setOrigin(0.5);

    // Pause/menu button
    const menuBtn = this.add.text(GAME_WIDTH - 16, 60, '⏸', {
      fontSize: '14px', fontFamily: 'Arial', color: COLORS_HEX.dim
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => {
      Effects.tap();
      this.endGame('menu');
    });
  }

  createHistoryPanel() {
    const panelY = 104;
    const panelH = 280;
    this.add.rectangle(GAME_WIDTH/2, panelY + panelH/2, GAME_WIDTH - 24, panelH, PALETTE.panel)
      .setStrokeStyle(2, PALETTE.border);
    this.historyTitle = this.add.text(GAME_WIDTH/2, panelY + 14, 'GUESSES', {
      fontSize: '11px', fontFamily: 'Arial', color: COLORS_HEX.dim
    }).setOrigin(0.5);
    this.historyStartY = panelY + 36;
    this.historyEndY = panelY + panelH - 12;
  }

  renderHistory() {
    // Clear old
    this.historyTexts.forEach(t => t.destroy());
    this.historyTexts = [];
    // Show last N entries that fit
    const lineH = 26;
    const maxLines = Math.floor((this.historyEndY - this.historyStartY) / lineH);
    const start = Math.max(0, this.history.length - maxLines);
    for (let i = start; i < this.history.length; i++) {
      const h = this.history[i];
      const y = this.historyStartY + (i - start) * lineH;
      const num = (i + 1) + '.';
      const guessStr = h.guess.join(' ');
      const numText = this.add.text(28, y, num, {
        fontSize: '13px', fontFamily: 'Arial', color: COLORS_HEX.dim
      });
      const guessText = this.add.text(60, y, guessStr, {
        fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.text
      });
      let resultStr, resultColor;
      if (h.out) { resultStr = 'OUT'; resultColor = COLORS_HEX.dim; }
      else {
        const parts = [];
        if (h.strikes > 0) parts.push(h.strikes + 'S');
        if (h.balls > 0) parts.push(h.balls + 'B');
        resultStr = parts.join(' ');
        resultColor = h.strikes >= h.balls ? COLORS_HEX.strike : COLORS_HEX.ball;
      }
      const resultText = this.add.text(GAME_WIDTH - 28, y, resultStr, {
        fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold', color: resultColor
      }).setOrigin(1, 0);
      this.historyTexts.push(numText, guessText, resultText);
    }
  }

  createInputBar() {
    const y = 410;
    this.add.text(GAME_WIDTH/2, y - 32, 'YOUR GUESS', {
      fontSize: '11px', fontFamily: 'Arial', color: COLORS_HEX.dim
    }).setOrigin(0.5).setDepth(10);
    this.inputSlots = [];
    const slotW = 44;
    const gap = 8;
    const totalW = this.cfg.digits * slotW + (this.cfg.digits - 1) * gap;
    const startX = GAME_WIDTH/2 - totalW/2 + slotW/2;
    for (let i = 0; i < this.cfg.digits; i++) {
      const x = startX + i * (slotW + gap);
      const bg = this.add.rectangle(x, y, slotW, 50, PALETTE.panel).setStrokeStyle(2, PALETTE.border);
      const t = this.add.text(x, y, '', {
        fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.text
      }).setOrigin(0.5);
      this.inputSlots.push({ bg, t });
    }
  }

  updateInputBar() {
    for (let i = 0; i < this.cfg.digits; i++) {
      const slot = this.inputSlots[i];
      const v = this.input_digits[i];
      slot.t.setText(v != null ? String(v) : '');
      slot.bg.setStrokeStyle(2, v != null ? PALETTE.accent : PALETTE.border);
    }
  }

  createKeypad() {
    const padTop = 470;
    const btnSize = 56;
    const gap = 8;
    const cols = 5;
    const totalW = cols * btnSize + (cols - 1) * gap;
    const startX = GAME_WIDTH/2 - totalW/2 + btnSize/2;
    this.digitButtons = {};
    for (let d = 0; d < 10; d++) {
      const col = d % cols;
      const row = Math.floor(d / cols);
      const x = startX + col * (btnSize + gap);
      const y = padTop + row * (btnSize + gap);
      const bg = this.add.rectangle(x, y, btnSize, btnSize, PALETTE.keypadBg)
        .setStrokeStyle(2, PALETTE.border).setInteractive({ useHandCursor: true });
      const t = this.add.text(x, y, String(d), {
        fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.text
      }).setOrigin(0.5);
      const digit = d;
      bg.on('pointerdown', () => this.onDigitTap(digit, bg, t));
      this.digitButtons[d] = { bg, t };
    }

    // Action row: clear and submit
    const actionY = padTop + 2 * (btnSize + gap) + 16;
    const clearBg = this.add.rectangle(GAME_WIDTH/2 - 80, actionY, 130, 50, PALETTE.panelLight)
      .setStrokeStyle(2, PALETTE.border).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH/2 - 80, actionY, 'CLEAR', {
      fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.dim
    }).setOrigin(0.5);
    clearBg.on('pointerdown', () => { Effects.tap(); this.clearInput(); });

    this.submitBg = this.add.rectangle(GAME_WIDTH/2 + 80, actionY, 130, 50, PALETTE.out)
      .setStrokeStyle(2, PALETTE.border).setInteractive({ useHandCursor: true });
    this.submitText = this.add.text(GAME_WIDTH/2 + 80, actionY, 'OK', {
      fontSize: '17px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.text
    }).setOrigin(0.5);
    this.submitBg.on('pointerdown', () => this.onSubmit());
    this.updateSubmitState();
  }

  onDigitTap(d, bg, t) {
    if (this.gameOver) return;
    this.lastInputTime = Date.now();
    // toggle: if already in input, remove
    const idx = this.input_digits.indexOf(d);
    if (idx !== -1) {
      this.input_digits.splice(idx, 1);
      Effects.tap();
    } else {
      if (this.input_digits.length >= this.cfg.digits) return;
      this.input_digits.push(d);
      Effects.digit();
      SceneEffects.scalePunch.call(this, bg, 1.15, 120);
    }
    this.refreshKeypadDisabled();
    this.updateInputBar();
    this.updateSubmitState();
  }

  refreshKeypadDisabled() {
    for (let d = 0; d < 10; d++) {
      const used = this.input_digits.indexOf(d) !== -1;
      this.digitButtons[d].bg.setFillStyle(used ? PALETTE.accent : PALETTE.keypadBg);
    }
  }

  clearInput() {
    this.input_digits = [];
    this.refreshKeypadDisabled();
    this.updateInputBar();
    this.updateSubmitState();
    this.lastInputTime = Date.now();
  }

  updateSubmitState() {
    const ready = this.input_digits.length === this.cfg.digits;
    this.submitBg.setFillStyle(ready ? PALETTE.success : PALETTE.out);
    this.submitText.setColor(ready ? COLORS_HEX.text : COLORS_HEX.dim);
  }

  onSubmit() {
    if (this.gameOver || this.input_digits.length !== this.cfg.digits) return;
    this.lastInputTime = Date.now();
    const guess = this.input_digits.slice();
    const result = evaluateGuess(this.secret, guess);
    this.history.push({ guess, strikes: result.strikes, balls: result.balls, out: result.out });
    GameState.totalGuesses++;
    this.attemptsLeft--;
    this.attemptsText.setText('TRIES\n' + this.attemptsLeft);

    Effects.submit();
    if (result.win) {
      Effects.win();
      SceneEffects.flash.call(this, PALETTE.success, 300);
      SceneEffects.shake.call(this, 6, 200);
      this.onStageWin();
    } else if (result.out) {
      Effects.out();
      SceneEffects.shake.call(this, 4, 150);
      SceneEffects.floatText.call(this, GAME_WIDTH/2, 410, 'OUT', COLORS_HEX.dim, 28, -40);
    } else {
      if (result.strikes > 0) Effects.strike();
      else Effects.ball();
      SceneEffects.shake.call(this, 2, 100);
      const msg = (result.strikes > 0 ? result.strikes + 'S ' : '') + (result.balls > 0 ? result.balls + 'B' : '');
      SceneEffects.floatText.call(this, GAME_WIDTH/2, 410, msg, result.strikes >= result.balls ? COLORS_HEX.strike : COLORS_HEX.ball, 28, -40);
    }
    this.renderHistory();
    this.input_digits = [];
    this.refreshKeypadDisabled();
    this.updateInputBar();
    this.updateSubmitState();

    if (!result.win && this.attemptsLeft <= 0) {
      this.time.delayedCall(700, () => this.endGame('attempts'));
    }
  }

  onStageWin() {
    const remaining = this.attemptsLeft;
    const remainingTime = this.timeLeft;
    const stageScore = SCORE.base + GameState.stage * SCORE.perStage
      + remaining * SCORE.remainingAttempt
      + remainingTime * SCORE.remainingSecond;
    GameState.addScore(stageScore);
    this.scoreText.setText('SCORE\n' + GameState.score);
    SceneEffects.floatText.call(this, GAME_WIDTH/2, 380, '+' + stageScore, COLORS_HEX.gold, 26, -60);
    GameState.stage++;
    this.time.delayedCall(1200, () => {
      if (this.gameOver) return;
      this.scene.restart();
    });
  }

  flashStageBanner() {
    const banner = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2, 'STAGE ' + GameState.stage + '\n' + this.cfg.digits + ' DIGITS', {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.accent, align: 'center'
    }).setOrigin(0.5).setDepth(200).setAlpha(0);
    this.tweens.add({
      targets: banner, alpha: 1, duration: 200, yoyo: true, hold: 700, ease: 'Sine.easeOut',
      onComplete: () => banner.destroy()
    });
  }

  tick() {
    if (this.gameOver) return;
    this.timeLeft--;
    GameState.totalTime++;
    const ratio = Math.max(0, this.timeLeft / this.cfg.timeSec);
    this.timerFill.width = (GAME_WIDTH - 32) * ratio;
    this.timerFill.setFillStyle(ratio > 0.5 ? PALETTE.success : ratio > 0.25 ? PALETTE.accentGold : PALETTE.danger);
    this.timerText.setText(this.timeLeft + 's');
    if (this.timeLeft <= 5 && this.timeLeft > 0) Effects.warning();
    if (this.timeLeft <= 0) { this.endGame('timeout'); return; }
    if (Date.now() - this.lastInputTime > INACTIVITY_DEATH_MS) { this.endGame('idle'); return; }
  }

  endGame(reason) {
    if (this.gameOver) return;
    this.gameOver = true;
    if (this.timerEvent) this.timerEvent.destroy();
    Effects.death();
    SceneEffects.shake.call(this, 10, 300);
    GameState.saveBest();
    const isNewBest = GameState.score >= GameState.bestScore && GameState.score > 0;
    this.time.delayedCall(500, () => {
      this.scene.start('GameOverScene', { reason, secret: this.secret, isNewBest });
    });
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
