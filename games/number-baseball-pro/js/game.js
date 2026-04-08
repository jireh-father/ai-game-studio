// Number Baseball Pro - GameScene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    Effects.initAudio();
    this.gameOver = false;
    this.stageTransitioning = false;
    this.submitting = false;
    this.lastInputTime = Date.now();
    this.history = [];
    this.input_digits = [];
    this.historyTexts = [];
    this.revealedSlots = []; // indices revealed by REVEAL powerup
    this.ghostActive = false;
    this.strikeBoostActive = false;
    this.revealMode = false;
    this.xrayActive = false;

    this.cfg = getStageConfig(GameState.stage);
    this.stageType = this.cfg.type;
    this.secret = generateSecret(this.cfg.digits);
    this.attemptsLeft = this.cfg.attempts;
    this.timeLeft = this.cfg.timeSec;
    this.maxTime = this.cfg.timeSec;

    // Special stage setup
    this.forbiddenDigits = [];
    if (this.stageType === 'forbidden') {
      this.forbiddenDigits = pickForbidden(this.secret, 2);
    }
    this.liarGuessIndex = -1;
    if (this.stageType === 'liar') {
      // pick a random guess index 0..min(attempts-1, 5) to lie on
      this.liarGuessIndex = Math.floor(Math.random() * Math.min(this.attemptsLeft, 5));
    }

    // Background
    this.bgRect = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, getStageThemeBg(this.stageType));

    // Boss intro: grant free powerup
    if (this.stageType === 'boss' && !this.bossBonusGiven) {
      const pool = POWERUP_KEYS.slice();
      GameState.powerups.push(pool[Math.floor(Math.random() * pool.length)]);
      this.bossBonusGiven = true;
    }

    this.createHUD();
    this.createHistoryPanel();
    this.createInputBar();
    this.createKeypad();
    this.createPowerupBar();
    this.flashStageBanner();

    this.timerEvent = this.time.addEvent({ delay: 1000, callback: this.tick, callbackScope: this, loop: true });
  }

  createHUD() {
    this.add.rectangle(GAME_WIDTH/2, 28, GAME_WIDTH, 56, PALETTE.panel);
    this.add.line(0, 56, 0, 0, GAME_WIDTH, 0, PALETTE.border).setOrigin(0, 0);

    this.scoreText = this.add.text(16, 14, 'SCORE\n' + GameState.score, {
      fontSize: '12px', fontFamily: 'Arial', color: COLORS_HEX.text, align: 'left'
    });
    this.stageText = this.add.text(GAME_WIDTH/2, 22, 'STAGE ' + GameState.stage, {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: getStageBannerColor(this.stageType)
    }).setOrigin(0.5);
    const badgeLabel = this.stageType === 'normal' ? (this.cfg.digits + ' DIGITS') : getStageBannerText(GameState.stage, this.stageType);
    this.digitsText = this.add.text(GAME_WIDTH/2, 44, badgeLabel, {
      fontSize: '10px', fontFamily: 'Arial', fontStyle: 'bold', color: getStageBannerColor(this.stageType)
    }).setOrigin(0.5);

    this.attemptsText = this.add.text(GAME_WIDTH - 16, 14, 'TRIES\n' + (this.attemptsLeft > 900 ? '\u221e' : this.attemptsLeft), {
      fontSize: '12px', fontFamily: 'Arial', color: COLORS_HEX.text, align: 'right'
    }).setOrigin(1, 0);

    // Timer bar
    this.timerBg = this.add.rectangle(GAME_WIDTH/2, 76, GAME_WIDTH - 32, 22, PALETTE.panelLight)
      .setStrokeStyle(1, PALETTE.border);
    this.timerFill = this.add.rectangle(16, 76, GAME_WIDTH - 32, 20, PALETTE.success).setOrigin(0, 0.5);
    this.timerText = this.add.text(GAME_WIDTH/2, 76, this.timeLeft + 's', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.text
    }).setOrigin(0.5);

    // Temperature label (shown after first guess)
    this.tempText = this.add.text(GAME_WIDTH - 16, 94, '', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.dim
    }).setOrigin(1, 0);
  }

  createHistoryPanel() {
    const panelY = 110;
    const panelH = 210;
    this.add.rectangle(GAME_WIDTH/2, panelY + panelH/2, GAME_WIDTH - 24, panelH, PALETTE.panel)
      .setStrokeStyle(2, PALETTE.border);
    const label = this.stageType === 'amnesia' ? 'MEMORY FOGGED' : 'GUESSES';
    this.historyTitle = this.add.text(GAME_WIDTH/2, panelY + 12, label, {
      fontSize: '10px', fontFamily: 'Arial', color: this.stageType === 'amnesia' ? COLORS_HEX.amnesia : COLORS_HEX.dim
    }).setOrigin(0.5);
    this.historyStartY = panelY + 32;
    this.historyEndY = panelY + panelH - 10;
  }

  renderHistory() {
    this.historyTexts.forEach(t => t.destroy());
    this.historyTexts = [];
    const lineH = 28;
    const maxLines = Math.floor((this.historyEndY - this.historyStartY) / lineH);
    let visible = this.history.slice();
    if (this.stageType === 'amnesia') visible = visible.slice(-1);
    const start = Math.max(0, visible.length - maxLines);
    for (let i = start; i < visible.length; i++) {
      const h = visible[i];
      const y = this.historyStartY + (i - start) * lineH;
      const num = (this.history.indexOf(h) + 1) + '.';
      const guessStr = h.guess.join(' ');
      const numText = this.add.text(20, y, num, {
        fontSize: '12px', fontFamily: 'Arial', color: COLORS_HEX.dim
      });
      const guessText = this.add.text(48, y, guessStr, {
        fontSize: '17px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.text
      });
      this.historyTexts.push(numText, guessText);

      // Wordle-style colored squares — only shown for X-RAY guesses
      const sqSize = 10;
      const sqGap = 3;
      const totalSqW = h.perSlot.length * sqSize + (h.perSlot.length - 1) * sqGap;
      const sqStartX = GAME_WIDTH - 28 - totalSqW;
      if (h.usedXray) {
        h.perSlot.forEach((k, idx) => {
          const col = k === 'strike' ? PALETTE.strike : k === 'ball' ? PALETTE.ball : PALETTE.miss;
          const sq = this.add.rectangle(sqStartX + idx * (sqSize + sqGap) + sqSize/2, y + 10, sqSize, sqSize, col);
          this.historyTexts.push(sq);
        });
      }

      // S/B label
      let resultStr, resultColor;
      if (h.out) { resultStr = 'OUT'; resultColor = COLORS_HEX.dim; }
      else {
        const parts = [];
        if (h.strikes > 0) parts.push(h.strikes + 'S');
        if (h.balls > 0) parts.push(h.balls + 'B');
        resultStr = parts.join(' ');
        resultColor = h.strikes >= h.balls ? COLORS_HEX.strike : COLORS_HEX.ball;
      }
      const resultText = this.add.text(sqStartX - 8, y, resultStr, {
        fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', color: resultColor
      }).setOrigin(1, 0);
      this.historyTexts.push(resultText);
    }
  }

  createInputBar() {
    const y = 358;
    this.add.text(GAME_WIDTH/2, y - 30, 'YOUR GUESS', {
      fontSize: '10px', fontFamily: 'Arial', color: COLORS_HEX.dim
    }).setOrigin(0.5);
    this.inputSlots = [];
    const slotW = 40;
    const gap = 6;
    const totalW = this.cfg.digits * slotW + (this.cfg.digits - 1) * gap;
    const startX = GAME_WIDTH/2 - totalW/2 + slotW/2;
    for (let i = 0; i < this.cfg.digits; i++) {
      const x = startX + i * (slotW + gap);
      const bg = this.add.rectangle(x, y, slotW, 46, PALETTE.panel).setStrokeStyle(2, PALETTE.border)
        .setInteractive({ useHandCursor: true });
      const t = this.add.text(x, y, '', {
        fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.text
      }).setOrigin(0.5);
      const slotIndex = i;
      bg.on('pointerdown', () => this.onSlotTap(slotIndex));
      this.inputSlots.push({ bg, t, x, y });
    }
  }

  onSlotTap(idx) {
    if (this.gameOver || this.submitting) return;
    if (this.revealMode) {
      this.revealMode = false;
      this.revealedSlots.push(idx);
      const slot = this.inputSlots[idx];
      slot.t.setText(String(this.secret[idx]));
      slot.t.setColor(COLORS_HEX.gold);
      slot.bg.setFillStyle(PALETTE.panelLight);
      slot.bg.setStrokeStyle(3, PALETTE.strike);
      Effects.reveal();
      SceneEffects.starBurst.call(this, slot.x, slot.y, PALETTE.strike, 10);
      SceneEffects.scalePunch.call(this, slot.bg, 1.25, 180);
      this.lastInputTime = Date.now();
      // Lock this input slot to the revealed digit
      this.input_digits[idx] = this.secret[idx];
      this.updateInputBar();
      this.updateSubmitState();
      this.renderPowerupBar();
    }
  }

  updateInputBar() {
    for (let i = 0; i < this.cfg.digits; i++) {
      const slot = this.inputSlots[i];
      const v = this.input_digits[i];
      if (this.revealedSlots.indexOf(i) !== -1) continue;
      slot.t.setText(v != null ? String(v) : '');
      slot.t.setColor(COLORS_HEX.text);
      slot.bg.setFillStyle(PALETTE.panel);
      slot.bg.setStrokeStyle(2, v != null ? PALETTE.accent : PALETTE.border);
    }
  }

  createKeypad() {
    const padTop = 430;
    const btnSize = 52;
    const gap = 6;
    const cols = 5;
    const totalW = cols * btnSize + (cols - 1) * gap;
    const startX = GAME_WIDTH/2 - totalW/2 + btnSize/2;
    this.digitButtons = {};
    for (let d = 0; d < 10; d++) {
      const col = d % cols;
      const row = Math.floor(d / cols);
      const x = startX + col * (btnSize + gap);
      const y = padTop + row * (btnSize + gap);
      const isForbidden = this.forbiddenDigits.indexOf(d) !== -1;
      const bg = this.add.rectangle(x, y, btnSize, btnSize, isForbidden ? PALETTE.bgForbidden : PALETTE.keypadBg)
        .setStrokeStyle(2, isForbidden ? PALETTE.forbidden : PALETTE.border).setInteractive({ useHandCursor: true });
      const t = this.add.text(x, y, String(d), {
        fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: isForbidden ? COLORS_HEX.forbidden : COLORS_HEX.text
      }).setOrigin(0.5);
      const digit = d;
      bg.on('pointerdown', () => this.onDigitTap(digit, bg, t));
      this.digitButtons[d] = { bg, t, x, y };
      if (isForbidden) {
        // red X overlay
        const g = this.add.graphics().setDepth(10);
        g.lineStyle(3, 0xff3040, 1);
        g.lineBetween(x - 16, y - 16, x + 16, y + 16);
        g.lineBetween(x + 16, y - 16, x - 16, y + 16);
      }
    }

    // Action row
    const actionY = padTop + 2 * (btnSize + gap) + 12;
    const clearBg = this.add.rectangle(GAME_WIDTH/2 - 80, actionY, 130, 44, PALETTE.panelLight)
      .setStrokeStyle(2, PALETTE.border).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH/2 - 80, actionY, 'CLEAR', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.dim
    }).setOrigin(0.5);
    clearBg.on('pointerdown', () => { Effects.tap(); this.clearInput(); });

    this.submitBg = this.add.rectangle(GAME_WIDTH/2 + 80, actionY, 130, 44, PALETTE.out)
      .setStrokeStyle(2, PALETTE.border).setInteractive({ useHandCursor: true });
    this.submitText = this.add.text(GAME_WIDTH/2 + 80, actionY, 'OK', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.text
    }).setOrigin(0.5);
    this.submitBg.on('pointerdown', () => this.onSubmit());
    this.updateSubmitState();
  }

  createPowerupBar() {
    const y = GAME_HEIGHT - 30;
    this.powerupBarTexts = [];
    this.renderPowerupBar();
  }

  renderPowerupBar() {
    if (this.powerupBarTexts) this.powerupBarTexts.forEach(o => o.destroy());
    this.powerupBarTexts = [];
    const y = GAME_HEIGHT - 28;
    const counts = {};
    GameState.powerups.forEach(k => counts[k] = (counts[k] || 0) + 1);
    const keys = Object.keys(counts);
    if (keys.length === 0) {
      const t = this.add.text(GAME_WIDTH/2, y, 'NO POWER-UPS', {
        fontSize: '10px', fontFamily: 'Arial', color: COLORS_HEX.dim
      }).setOrigin(0.5);
      this.powerupBarTexts.push(t);
      return;
    }
    const itemW = 78;
    const totalW = keys.length * itemW;
    let sx = GAME_WIDTH/2 - totalW/2 + itemW/2;
    keys.forEach(k => {
      const p = POWERUPS[k];
      const bg = this.add.rectangle(sx, y, itemW - 6, 34, PALETTE.panel)
        .setStrokeStyle(2, PALETTE.accentGold).setInteractive({ useHandCursor: true });
      const icon = this.add.text(sx - 22, y, p.icon, { fontSize: '18px' }).setOrigin(0.5);
      const label = this.add.text(sx + 2, y - 6, p.name, { fontSize: '9px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.text }).setOrigin(0, 0.5);
      const cnt = this.add.text(sx + 2, y + 6, 'x' + counts[k], { fontSize: '9px', fontFamily: 'Arial', color: COLORS_HEX.gold }).setOrigin(0, 0.5);
      bg.on('pointerdown', () => this.usePowerup(k));
      this.powerupBarTexts.push(bg, icon, label, cnt);
      sx += itemW;
    });
  }

  usePowerup(key) {
    if (this.gameOver || this.submitting) return;
    const idx = GameState.powerups.indexOf(key);
    if (idx === -1) return;
    this.lastInputTime = Date.now();
    Effects.powerup();
    if (key === 'xray') {
      this.xrayActive = true;
      SceneEffects.floatText.call(this, GAME_WIDTH/2, 340, 'X-RAY ARMED', COLORS_HEX.accent, 20, -30);
      SceneEffects.flash.call(this, PALETTE.accent, 200);
    } else if (key === 'reveal') {
      this.revealMode = true;
      SceneEffects.floatText.call(this, GAME_WIDTH/2, 340, 'TAP A SLOT', COLORS_HEX.gold, 18, -20);
    } else if (key === 'time') {
      this.timeLeft += 20;
      this.maxTime += 20;
      SceneEffects.floatText.call(this, GAME_WIDTH/2, 80, '+20s', COLORS_HEX.success, 26, -40);
      SceneEffects.flash.call(this, PALETTE.success, 200);
    } else if (key === 'ghost') {
      this.ghostActive = true;
      SceneEffects.floatText.call(this, GAME_WIDTH/2, 340, 'GHOST ARMED', COLORS_HEX.accent, 18, -20);
    } else if (key === 'strike_boost') {
      this.strikeBoostActive = true;
      SceneEffects.floatText.call(this, GAME_WIDTH/2, 340, 'BOOST ARMED', COLORS_HEX.strike, 18, -20);
    }
    GameState.powerups.splice(idx, 1);
    this.renderPowerupBar();
  }

  onDigitTap(d, bg, t) {
    if (this.gameOver || this.submitting) return;
    this.lastInputTime = Date.now();
    if (this.forbiddenDigits.indexOf(d) !== -1) {
      Effects.reject();
      SceneEffects.shake.call(this, 4, 120);
      this.tweens.add({ targets: bg, x: bg.x + 4, duration: 40, yoyo: true, repeat: 3, onComplete: () => bg.x = this.digitButtons[d].x });
      return;
    }
    const idx = this.input_digits.indexOf(d);
    if (idx !== -1) {
      // don't allow removing a revealed slot value
      if (this.revealedSlots.indexOf(idx) !== -1) return;
      this.input_digits.splice(idx, 1);
      // Shift: also clear revealedSlots indices above? Simpler: rebuild input respecting locked slots.
      // For simplicity, prevent removal if revealedSlots not empty after idx shift.
      Effects.tap();
    } else {
      if (this.input_digits.length >= this.cfg.digits) return;
      // Find first empty slot that isn't a revealed (locked) slot
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
      if (this.forbiddenDigits.indexOf(d) !== -1) continue;
      const used = this.input_digits.indexOf(d) !== -1;
      this.digitButtons[d].bg.setFillStyle(used ? PALETTE.accent : PALETTE.keypadBg);
    }
  }

  clearInput() {
    this.input_digits = [];
    this.revealedSlots = [];
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
    if (this.gameOver || this.submitting) return;
    if (this.input_digits.length !== this.cfg.digits) return;
    // Unique digit check
    const uniq = new Set(this.input_digits);
    if (uniq.size !== this.input_digits.length) {
      Effects.reject();
      SceneEffects.shake.call(this, 3, 100);
      SceneEffects.floatText.call(this, GAME_WIDTH/2, 340, 'NO REPEATS', COLORS_HEX.danger, 16, -30);
      return;
    }
    this.lastInputTime = Date.now();
    this.submitting = true;
    const guess = this.input_digits.slice();
    let result = evaluateGuess(this.secret, guess);

    // Strike boost: convert 1 ball to 1 strike (display only, win check on true strikes)
    let boostedResult = result;
    if (this.strikeBoostActive && result.balls > 0 && !result.win) {
      boostedResult = Object.assign({}, result, { strikes: result.strikes + 1, balls: result.balls - 1 });
      this.strikeBoostActive = false;
    }

    // Liar stage: flip S/B on liar guess
    let displayResult = boostedResult;
    const guessNum = this.history.length; // 0-indexed
    if (this.stageType === 'liar' && guessNum === this.liarGuessIndex && !result.win) {
      displayResult = Object.assign({}, boostedResult, {
        strikes: boostedResult.balls, balls: boostedResult.strikes
      });
    }

    // Temperature
    const temp = getTemperature(this.secret, guess);
    this.tempText.setText('\ud83c\udf21 ' + temp.label);
    this.tempText.setColor(temp.color);

    Effects.submit();
    this.playFlipReveal(guess, result.perSlot, () => {
      this.finalizeSubmit(guess, result, displayResult);
    });
  }

  playFlipReveal(guess, perSlot, onDone) {
    let done = 0;
    const total = this.cfg.digits;
    const xray = this.xrayActive;
    for (let i = 0; i < total; i++) {
      const slot = this.inputSlots[i];
      this.time.delayedCall(i * 180, () => {
        Effects.flip();
        this.tweens.add({
          targets: slot.bg, scaleY: 0, duration: 140, ease: 'Sine.easeIn',
          onComplete: () => {
            const kind = perSlot[i];
            // Default: hide per-slot info — flip to neutral panel color
            // X-RAY active: reveal per-slot color (strike/ball/miss)
            let col, textCol;
            if (xray) {
              col = kind === 'strike' ? PALETTE.strike : kind === 'ball' ? PALETTE.ball : PALETTE.miss;
              textCol = kind === 'miss' ? COLORS_HEX.dim : '#000000';
            } else {
              col = PALETTE.panelLight;
              textCol = COLORS_HEX.text;
            }
            slot.bg.setFillStyle(col);
            slot.bg.setStrokeStyle(2, xray ? col : PALETTE.border);
            slot.t.setColor(textCol);
            this.tweens.add({
              targets: slot.bg, scaleY: 1, duration: 140, ease: 'Sine.easeOut',
              onComplete: () => {
                if (xray) {
                  if (kind === 'strike') {
                    SceneEffects.starBurst.call(this, slot.x, slot.y, PALETTE.strike, 12);
                    Effects.strike();
                    const flash = this.add.rectangle(slot.x, slot.y, 44, 50, 0xffffff).setAlpha(0.8);
                    this.tweens.add({ targets: flash, alpha: 0, duration: 120, onComplete: () => flash.destroy() });
                  } else if (kind === 'ball') {
                    SceneEffects.orbitRing.call(this, slot.x, slot.y, PALETTE.ball, 20);
                    Effects.ball();
                  } else {
                    Effects.miss();
                  }
                } else {
                  // Hidden mode: subtle neutral feedback only
                  Effects.flip();
                }
                done++;
                if (done === total) this.time.delayedCall(180, onDone);
              }
            });
          }
        });
      });
    }
  }

  finalizeSubmit(guess, result, displayResult) {
    this.history.push({
      guess,
      strikes: displayResult.strikes,
      balls: displayResult.balls,
      out: displayResult.strikes === 0 && displayResult.balls === 0,
      perSlot: result.perSlot,
      usedXray: this.xrayActive
    });
    if (this.xrayActive) this.xrayActive = false;
    GameState.totalGuesses++;

    // Ghost: don't consume attempt
    const consumeAttempt = !this.ghostActive;
    if (consumeAttempt) this.attemptsLeft--;
    if (this.ghostActive) {
      SceneEffects.floatText.call(this, GAME_WIDTH/2, 340, 'GHOST!', COLORS_HEX.accent, 22, -40);
      this.ghostActive = false;
    }
    if (this.attemptsLeft > 900) this.attemptsText.setText('TRIES\n\u221e');
    else this.attemptsText.setText('TRIES\n' + this.attemptsLeft);

    if (result.win) {
      Effects.win();
      SceneEffects.flash.call(this, PALETTE.strike, 300);
      SceneEffects.shake.call(this, 8, 300);
      SceneEffects.goldFountain.call(this, GAME_WIDTH/2, GAME_HEIGHT, 30);
      // All slots flash gold
      this.inputSlots.forEach(s => {
        this.tweens.add({ targets: s.bg, scale: 1.3, duration: 180, yoyo: true });
      });
      this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 40, this.stageType === 'boss' ? 'BOSS DOWN!' : 'STAGE CLEAR!', {
        fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.gold
      }).setOrigin(0.5).setDepth(200);
      this.onStageWin();
      return;
    } else if (displayResult.strikes === 0 && displayResult.balls === 0) {
      Effects.out();
      SceneEffects.shake.call(this, 5, 180);
      this.inputSlots.forEach(s => {
        this.tweens.add({ targets: s.bg, alpha: 0.5, duration: 150, yoyo: true });
      });
    } else {
      SceneEffects.shake.call(this, 2, 100);
    }

    // Reset input after delay (but keep revealed slots)
    this.time.delayedCall(500, () => {
      if (this.gameOver) return;
      this.resetInputAfterGuess();
      this.renderHistory();
      this.submitting = false;
      if (this.attemptsLeft <= 0) {
        this.time.delayedCall(400, () => this.endGame('attempts'));
      }
    });
  }

  resetInputAfterGuess() {
    // Restore slot visuals, but preserve revealed slot values
    const revealedValues = {};
    this.revealedSlots.forEach(i => { revealedValues[i] = this.secret[i]; });
    this.input_digits = [];
    for (let i = 0; i < this.cfg.digits; i++) {
      if (revealedValues[i] != null) this.input_digits[i] = revealedValues[i];
    }
    for (let i = 0; i < this.cfg.digits; i++) {
      const slot = this.inputSlots[i];
      if (this.revealedSlots.indexOf(i) !== -1) {
        slot.bg.setFillStyle(PALETTE.panelLight);
        slot.bg.setStrokeStyle(3, PALETTE.strike);
        slot.t.setText(String(this.secret[i]));
        slot.t.setColor(COLORS_HEX.gold);
      } else {
        slot.bg.setFillStyle(PALETTE.panel);
        slot.bg.setStrokeStyle(2, PALETTE.border);
        slot.t.setText('');
        slot.t.setColor(COLORS_HEX.text);
      }
    }
    this.refreshKeypadDisabled();
    this.updateSubmitState();
  }

  onStageWin() {
    if (this.stageTransitioning) return;
    this.stageTransitioning = true;
    const remaining = Math.max(0, this.attemptsLeft);
    const remainingTime = Math.max(0, this.timeLeft);
    const mult = getStageMultiplier(this.stageType);
    let stageScore = SCORE.base + GameState.stage * SCORE.perStage
      + (remaining < 900 ? remaining * SCORE.perAttempt : 0)
      + remainingTime * SCORE.perSecond;
    stageScore = Math.round(stageScore * mult);
    GameState.addScore(stageScore);
    this.scoreText.setText('SCORE\n' + GameState.score);
    SceneEffects.floatText.call(this, GAME_WIDTH/2, 360, '+' + stageScore, COLORS_HEX.gold, 28, -80);

    const nextStage = GameState.stage + 1;
    GameState.stage = nextStage;
    const wasBoss = this.stageType === 'boss';
    this.time.delayedCall(1500, () => {
      if (wasBoss) {
        // No powerup select after boss
        this.scene.start('GameScene');
      } else {
        this.scene.start('PowerupSelectScene');
      }
    });
  }

  flashStageBanner() {
    const bannerText = this.stageType === 'normal'
      ? 'STAGE ' + GameState.stage + '\n' + this.cfg.digits + ' DIGITS'
      : (this.stageType === 'boss' ? 'STAGE ' + GameState.stage + '\n' : '') + getStageBannerText(GameState.stage, this.stageType);
    const color = getStageBannerColor(this.stageType);
    const banner = this.add.text(GAME_WIDTH/2, -100, bannerText, {
      fontSize: this.stageType === 'boss' ? '38px' : '32px',
      fontFamily: 'Arial', fontStyle: 'bold', color, align: 'center'
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({
      targets: banner, y: GAME_HEIGHT/2, duration: 400, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(700, () => {
          // shatter: split into characters, fly off
          const text = banner.text;
          const startX = banner.x - banner.width/2;
          banner.destroy();
          // simple fade shatter: spawn character texts at positions, fly
          const chars = text.split('');
          let cx = startX + 10;
          chars.forEach((ch, i) => {
            if (ch === '\n') { cx = startX + 10; return; }
            const t = this.add.text(cx + i * 18, GAME_HEIGHT/2, ch, {
              fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color
            }).setOrigin(0.5).setDepth(200);
            this.tweens.add({
              targets: t,
              x: t.x + (Math.random() - 0.5) * 600,
              y: t.y + (Math.random() - 0.5) * 600,
              angle: (Math.random() - 0.5) * 360,
              alpha: 0,
              duration: 500, ease: 'Power2',
              onComplete: () => t.destroy()
            });
          });
        });
      }
    });
  }

  tick() {
    if (this.gameOver) return;
    this.timeLeft--;
    GameState.totalTime++;
    const ratio = Math.max(0, this.timeLeft / this.maxTime);
    this.timerFill.width = (GAME_WIDTH - 32) * ratio;
    this.timerFill.setFillStyle(ratio > 0.5 ? PALETTE.success : ratio > 0.25 ? PALETTE.accentGold : PALETTE.danger);
    this.timerText.setText(this.timeLeft + 's');

    // Background tension gradient
    let bgColor = getStageThemeBg(this.stageType);
    if (ratio < 0.25) bgColor = PALETTE.bgCritical;
    else if (ratio < 0.5) bgColor = PALETTE.bgWorried;
    this.bgRect.setFillStyle(bgColor);

    if (this.timeLeft <= 5 && this.timeLeft > 0) Effects.warning();
    if (this.timeLeft <= 0) { this.endGame('timeout'); return; }
    if (Date.now() - this.lastInputTime > INACTIVITY_DEATH_MS) { this.endGame('idle'); return; }
  }

  endGame(reason) {
    if (this.gameOver) return;
    this.gameOver = true;
    if (this.timerEvent) this.timerEvent.destroy();
    Effects.death();
    SceneEffects.shake.call(this, 12, 400);
    SceneEffects.flash.call(this, PALETTE.danger, 300);

    // Revelation: darken screen, reveal secret digit-by-digit
    const overlay = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setDepth(300);
    this.tweens.add({ targets: overlay, alpha: 0.85, duration: 400 });

    this.time.delayedCall(450, () => {
      this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 100, 'THE ANSWER WAS...', {
        fontSize: '18px', fontFamily: 'Arial', color: COLORS_HEX.dim
      }).setOrigin(0.5).setDepth(301);

      this.secret.forEach((d, i) => {
        this.time.delayedCall(i * 280, () => {
          const x = GAME_WIDTH/2 - (this.secret.length - 1) * 22 + i * 44;
          const t = this.add.text(x, GAME_HEIGHT/2, String(d), {
            fontSize: '56px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.danger
          }).setOrigin(0.5).setDepth(301).setAlpha(0).setScale(2);
          this.tweens.add({
            targets: t, alpha: 1, scale: 1, duration: 220, ease: 'Back.easeOut'
          });
          Effects.beep(300 - i * 30, 0.2, 'sawtooth', 0.14);
          if (i === this.secret.length - 1) {
            this.time.delayedCall(400, () => SceneEffects.shake.call(this, 10, 250));
          }
        });
      });
    });

    GameState.saveBest();
    const isNewBest = GameState.score >= GameState.bestScore && GameState.score > 0;
    const delay = 700 + this.secret.length * 280 + 600;
    this.time.delayedCall(delay, () => {
      this.scene.start('GameOverScene', { reason, secret: this.secret, isNewBest });
    });
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
