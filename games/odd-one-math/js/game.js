class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.score = 0; this.stage = 0; this.strikes = 3; this.streak = 0;
    this.gameOver = false; this.inputEnabled = false; this.stageTransitioning = false;
    this.paused = false; this.categoriesSeen = [];
    this.lastInputTime = Date.now();
    this.continuedOnce = false;

    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, COLOR.bg);
    this.createHUD();
    this.createCards();
    this.createTimerBar();
    this.createRevealPanel();
    this.createPauseOverlay();
    this.nextQuestion();

    this.visHandler = () => { if (document.hidden && !this.paused && !this.gameOver) this.togglePause(); };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  createHUD() {
    this.scoreTxt = this.add.text(16, 16, `${this.score}`, { fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', color: COLOR.scoreText }).setDepth(100);
    this.stageTxt = this.add.text(GAME_W / 2, 16, 'Stage 1', { fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#64748B' }).setOrigin(0.5, 0).setDepth(100);
    this.strikeIcons = [];
    for (let i = 0; i < 3; i++) {
      const icon = this.add.image(GAME_W - 80 + i * 22, 26, 'strike-on').setDepth(100);
      this.strikeIcons.push(icon);
    }
    const pauseBtn = this.add.text(GAME_W - 16, 16, '\u23F8', { fontSize: '24px' }).setOrigin(1, 0).setDepth(100).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => { if (!this.gameOver) this.togglePause(); });
    this.streakTxt = this.add.text(GAME_W / 2, 48, '', { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLOR.streakAccent }).setOrigin(0.5, 0).setDepth(100).setAlpha(0);
  }

  createCards() {
    this.cards = [];
    const startX = GAME_W / 2 - CARD_SIZE / 2 - CARD_GAP / 2;
    const startY = 90;
    const positions = [
      [startX, startY], [startX + CARD_SIZE + CARD_GAP, startY],
      [startX, startY + CARD_SIZE + CARD_GAP], [startX + CARD_SIZE + CARD_GAP, startY + CARD_SIZE + CARD_GAP]
    ];
    for (let i = 0; i < 4; i++) {
      const [x, y] = positions[i];
      const cx = x + CARD_SIZE / 2, cy = y + CARD_SIZE / 2;
      const bg = this.add.image(cx, cy, 'card').setDepth(10);
      const numTxt = this.add.text(cx, cy, '', {
        fontSize: '40px', fontFamily: 'monospace', fontStyle: 'bold', color: COLOR.numberText
      }).setOrigin(0.5).setDepth(11);
      const hitZone = this.add.rectangle(cx, cy, CARD_SIZE, CARD_SIZE, 0xffffff, 0.001).setDepth(12)
        .setInteractive({ useHandCursor: true });
      const idx = i;
      hitZone.on('pointerdown', () => this.handleAnswer(idx));
      this.cards.push({ bg, numTxt, hitZone, cx, cy, x, y });
    }
  }

  createTimerBar() {
    this.timerBg = this.add.rectangle(GAME_W / 2, 410, 300, 16, 0xE2E8F0).setDepth(10);
    this.timerBar = this.add.rectangle(GAME_W / 2, 410, 300, 12, COLOR.timerSafe).setDepth(11);
    this.timerTxt = this.add.text(GAME_W - 20, 410, '', { fontSize: '12px', fontFamily: 'monospace', color: '#64748B' }).setOrigin(1, 0.5).setDepth(11);
  }

  createRevealPanel() {
    this.revealPanel = this.add.container(0, GAME_H + 120).setDepth(500);
    const bg = this.add.rectangle(GAME_W / 2, 0, GAME_W, 120, COLOR.revealBg);
    this.revealTitleTxt = this.add.text(GAME_W / 2, -30, '', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
    this.revealDescTxt = this.add.text(GAME_W / 2, 0, '', { fontSize: '12px', fontFamily: 'Arial', color: '#94A3B8', wordWrap: { width: 320 }, align: 'center' }).setOrigin(0.5);
    this.revealPanel.add([bg, this.revealTitleTxt, this.revealDescTxt]);
  }

  createPauseOverlay() {
    this.pauseContainer = this.add.container(0, 0).setDepth(1000).setVisible(false);
    const overlay = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x0F172A, 0.85);
    const title = this.add.text(GAME_W / 2, 160, 'PAUSED', { fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF' }).setOrigin(0.5);
    const btns = [
      { label: 'RESUME', y: 260, cb: () => this.togglePause() },
      { label: 'RESTART', y: 325, cb: () => { this.scene.stop(); this.scene.start('GameScene'); } },
      { label: 'HOW TO PLAY', y: 390, cb: () => { this.scene.pause(); this.scene.launch('HelpScene', { returnTo: 'GameScene' }); } },
      { label: 'MENU', y: 455, cb: () => { this.scene.stop(); this.scene.start('MenuScene'); } }
    ];
    const items = [overlay, title];
    btns.forEach(b => {
      const btn = this.add.rectangle(GAME_W / 2, b.y, 240, 48, COLOR.accent).setInteractive({ useHandCursor: true });
      const txt = this.add.text(GAME_W / 2, b.y, b.label, { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF' }).setOrigin(0.5);
      btn.on('pointerdown', () => { Effects.buttonSound(this); b.cb(); });
      items.push(btn, txt);
    });
    this.pauseContainer.add(items);
  }

  togglePause() {
    this.paused = !this.paused;
    this.pauseContainer.setVisible(this.paused);
    if (this.paused) { this.timerPausedAt = this.timerRemaining; }
  }

  nextQuestion() {
    this.stageTransitioning = false;
    this.stage++;
    this.currentQuestion = StageGen.generateQuestion(this.stage);
    this.categoriesSeen.push(this.currentQuestion.catName);
    this.updateHUD();
    this.cards.forEach((c, i) => {
      c.bg.setTexture('card');
      c.numTxt.setText(this.currentQuestion.numbers[i]).setStyle({ color: COLOR.numberText, fontSize: '40px' });
    });
    this.timerDuration = this.currentQuestion.timer;
    this.timerRemaining = this.timerDuration;
    this.timerBar.setScale(1, 1).setFillStyle(COLOR.timerSafe);
    this.inputEnabled = true;
    this.revealPanel.setY(GAME_H + 120);
  }

  handleAnswer(idx) {
    if (!this.inputEnabled || this.gameOver || this.paused) return;
    this.inputEnabled = false;
    this.lastInputTime = Date.now();
    const q = this.currentQuestion;
    const correct = idx === q.impostorIndex;

    if (correct) {
      this.onCorrect(idx);
    } else {
      this.onWrong(idx);
    }
  }

  onCorrect(idx) {
    const q = this.currentQuestion;
    this.cards[idx].bg.setTexture('card-correct');
    this.streak++;
    const timeBonus = Math.floor(this.timerRemaining / SCORE.timeBonusInterval) * SCORE.timeBonus;
    const streakBonus = SCORE.streakBonus * this.streak;
    const points = SCORE.base + timeBonus + streakBonus;
    this.score += points;

    Effects.cardPunch(this, this.cards[idx].bg, 1.12, 200);
    Effects.cardPunch(this, this.cards[idx].numTxt, 1.12, 200);
    Effects.correctSound(this);
    Effects.floatingText(this, this.cards[idx].cx, this.cards[idx].cy - 30, `+${points}`, '#FFFFFF', 24);
    Effects.cardPunch(this, this.scoreTxt, 1.15, 120);
    Effects.bgFlash(this, COLOR.bgFlash, 0.4, 100);

    const pCount = this.streak >= 20 ? 16 : this.streak >= 10 ? 12 : 8;
    const pColor = this.streak >= 20 ? 0xA855F7 : this.streak >= 10 ? 0xEAB308 : COLOR.correctFlash;
    Effects.particleBurst(this, this.cards[idx].cx, this.cards[idx].cy, pCount, pColor);

    if (this.score > GameState.highScore) {
      GameState.highScore = this.score;
      localStorage.setItem('odd-one-math_high_score', this.score);
    }

    if (SCORE.milestones[this.streak]) {
      this.score += SCORE.milestones[this.streak];
      Effects.streakMilestone(this, this.streak);
    }

    this.updateStreak();
    this.showReveal(true);
  }

  onWrong(idx) {
    if (idx !== undefined) this.cards[idx].bg.setTexture('card-wrong');
    this.cards[this.currentQuestion.impostorIndex].bg.setTexture('card-impostor');
    this.streak = 0;
    this.updateStreak();
    this.strikes--;
    this.updateStrikes();

    Effects.screenShake(this, 6, 250);
    Effects.wrongSound(this);
    Effects.redFlash(this);

    if (this.strikes <= 0) {
      this.triggerDeath();
    } else {
      this.showReveal(false);
    }
  }

  triggerDeath() {
    this.gameOver = true;
    this.inputEnabled = false;
    const cardObjs = this.cards.map(c => ({ x: c.cx, y: c.cy }));
    Effects.deathSequence(this, cardObjs, () => {
      const isNewHigh = this.score >= GameState.highScore;
      const canCont = AdsManager.canContinue() && !this.continuedOnce;
      this.scene.launch('GameOverScene', {
        score: this.score, stage: this.stage,
        categoriesSeen: this.categoriesSeen, isNewHigh,
        canContinue: canCont,
        continueCallback: canCont ? () => {
          this.scene.stop('GameOverScene');
          this.continuedOnce = true;
          this.strikes = 1; this.gameOver = false;
          this.updateStrikes();
          AdsManager.useContinue(() => { this.nextQuestion(); });
        } : null
      });
    });
  }

  showReveal(correct) {
    const q = this.currentQuestion;
    this.revealTitleTxt.setText(correct ? 'CORRECT!' : 'WRONG!');
    this.revealTitleTxt.setColor(correct ? '#22C55E' : '#EF4444');
    this.revealDescTxt.setText(q.ruleText);
    this.tweens.add({
      targets: this.revealPanel, y: GAME_H - 120, duration: 300,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          this.tweens.add({
            targets: this.revealPanel, y: GAME_H + 120, duration: 200,
            onComplete: () => { if (!this.gameOver) this.nextQuestion(); }
          });
        });
      }
    });
  }

  updateHUD() {
    this.scoreTxt.setText(`${this.score}`);
    this.stageTxt.setText(`Stage ${this.stage}`);
    this.updateStrikes();
  }

  updateStrikes() {
    for (let i = 0; i < 3; i++) {
      this.strikeIcons[i].setTexture(i < this.strikes ? 'strike-on' : 'strike-off');
    }
  }

  updateStreak() {
    if (this.streak >= 2) {
      this.streakTxt.setText(`x${this.streak} STREAK`).setAlpha(1);
      Effects.cardPunch(this, this.streakTxt, 1.3, 150);
    } else {
      this.streakTxt.setAlpha(0);
    }
  }

  update(time, delta) {
    if (this.gameOver || this.paused || !this.inputEnabled) return;

    // Inactivity death
    if (Date.now() - this.lastInputTime > 25000 && !this.gameOver) {
      this.strikes = 0; this.updateStrikes(); this.triggerDeath(); return;
    }

    this.timerRemaining -= delta / 1000;
    if (this.timerRemaining < 0) this.timerRemaining = 0;
    const pct = this.timerRemaining / this.timerDuration;
    this.timerBar.setScale(pct, 1);
    const barColor = pct > 0.6 ? COLOR.timerSafe : pct > 0.2 ? COLOR.timerWarn : COLOR.timerDanger;
    this.timerBar.setFillStyle(barColor);
    this.timerTxt.setText(this.timerRemaining.toFixed(1) + 's');

    if (this.timerRemaining <= 0 && !this.stageTransitioning) {
      this.stageTransitioning = true;
      this.inputEnabled = false;
      Effects.timeoutSound(this);
      this.onWrong(undefined);
    }
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}
