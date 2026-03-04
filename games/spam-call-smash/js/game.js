// game.js — Core gameplay: input, patience, scoring, stage flow

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.patience = CONFIG.PATIENCE_MAX;
    this.score = 0;
    this.combo = 0;
    this.stage = 1;
    this.cards = [];
    this.gameOver = false;
    this.holdStartTime = 0;
    this.holdStartPos = null;
    this.holdCard = null;

    this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, CONFIG.COL_BG);
    this.vignette = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2,
      CONFIG.WIDTH, CONFIG.HEIGHT, 0xFF0000, 0).setDepth(90);

    this.createHUD();
    this.cardContainer = this.add.container(0, 0).setDepth(10);

    if (!this.textures.exists('particle')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xFFFFFF, 1); g.fillCircle(4, 4, 4);
      g.generateTexture('particle', 8, 8); g.destroy();
    }

    this.stageMgr = new StageManager(this);
    this.resetDeathTimer();
    this.showStageIntro(1);
  }

  createHUD() {
    this.stageTxt = this.add.text(16, 12, 'STAGE 1', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', fill: '#E8E8F0'
    }).setDepth(50);
    this.scoreTxt = this.add.text(CONFIG.WIDTH - 16, 12, '0', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', fill: '#E8E8F0'
    }).setOrigin(1, 0).setDepth(50);
    this.add.text(16, 34, 'PATIENCE', {
      fontSize: '9px', fontFamily: 'Arial, sans-serif', fill: '#888899'
    }).setDepth(50);
    this.pBarBg = this.add.rectangle(CONFIG.WIDTH / 2, 52, CONFIG.WIDTH - 32, 12, 0x222233).setDepth(50);
    this.pBar = this.add.rectangle(16, 46, CONFIG.WIDTH - 32, 12, CONFIG.COL_PATIENCE_FULL)
      .setOrigin(0, 0).setDepth(51);
    this.comboTxt = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 60, '', {
      fontSize: '26px', fontFamily: 'Arial Black, sans-serif', fill: '#FFFFFF',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(80).setAlpha(0);
    this.criticalTxt = this.add.text(CONFIG.WIDTH / 2, 74, 'LOSING PATIENCE...', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', fill: '#FF3B3B'
    }).setOrigin(0.5).setDepth(50).setAlpha(0);
  }

  showStageIntro(num) {
    this.stageTxt.setText('STAGE ' + num);
    const intro = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'STAGE ' + num, {
      fontSize: '36px', fontFamily: 'Arial Black, sans-serif', fill: '#FFFFFF',
      stroke: '#34C85A', strokeThickness: 3
    }).setOrigin(0.5).setDepth(100).setScale(0.5);
    this.tweens.add({
      targets: intro, scaleX: 1.2, scaleY: 1.2, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: intro, alpha: 0, duration: 200, delay: 300,
          onComplete: () => { intro.destroy(); this.stageMgr.startStage(num); }
        });
      }
    });
    if (num === 1) this.showTutorial = true;
  }

  resetDeathTimer() {
    if (this.deathTimer) this.deathTimer.remove();
    if (this.gameOver) return;
    this.deathTimer = this.time.delayedCall(CONFIG.DEATH_TIMER_MS, () => this.triggerGameOver());
  }

  spawnCard(callData) { Cards.spawn(this, callData); }

  // --- Input ---
  onCardDown(card, ptr) {
    if (!card.active || this.gameOver) return;
    this.resetDeathTimer();
    card.downTime = this.time.now;
    card.downPos = { x: ptr.x, y: ptr.y };

    const action = card.callData.action;
    if (action === 'tap' || action === 'multi-tap') {
      this.handleTap(card);
    } else if (action === 'hold') {
      this.startHold(card, ptr, card.callData.type === 'URGENT' ? 1000 : CONFIG.HOLD_THRESHOLD_MS);
    } else if (action === 'evolve') {
      if (card.callData.isSpam) { this.handleTap(card); }
      else { this.startHold(card, ptr, CONFIG.HOLD_THRESHOLD_MS); }
    }
  }

  startHold(card, ptr, duration) {
    this.holdCard = card;
    this.holdStartTime = this.time.now;
    this.holdStartPos = { x: ptr.x, y: ptr.y };
    card.holdDur = duration;
    card.holdRing = this.add.graphics().setDepth(20);
  }

  onCardUp(card, ptr) {
    if (!card.active || this.gameOver) return;
    if (this.holdCard === card) {
      const held = this.time.now - this.holdStartTime;
      const moved = card.downPos ? Phaser.Math.Distance.Between(
        card.downPos.x, card.downPos.y, ptr.x, ptr.y) : 0;
      if (moved > CONFIG.HOLD_CANCEL_PX) { this.cancelHold(card); return; }
      this.resolveCard(card, held >= (card.holdDur || CONFIG.HOLD_THRESHOLD_MS));
      this.cancelHold(card);
    }
  }

  cancelHold(card) {
    this.holdCard = null;
    if (card.holdRing) { card.holdRing.destroy(); card.holdRing = null; }
  }

  handleTap(card) {
    if (card.callData.action === 'multi-tap') {
      card.callData.tapCount = (card.callData.tapCount || 0) + 1;
      this.tweens.add({ targets: card, scaleX: 1.1, scaleY: 1.1, duration: 60, yoyo: true });
      if (card.callData.tapCount >= card.callData.taps) this.resolveCard(card, true);
      return;
    }
    this.resolveCard(card, card.callData.isSpam !== false);
  }

  resolveCard(card, correct) {
    if (!card.active) return;
    card.active = false;
    if (card.timerEvent) card.timerEvent.remove();
    this.cancelHold(card);
    if (correct) this.onCorrectAction(card);
    else this.onWrongAction(card);
    Cards.reposition(this);
    this.stageMgr.onCardResolved();
  }

  onCardTimeout(card) {
    if (!card.active) return;
    card.active = false;
    this.cancelHold(card);
    this.adjustPatience(card.callData.patienceDelta.miss);
    this.combo = 0;
    this.tweens.add({ targets: card, alpha: 0, duration: 300,
      onComplete: () => this.cardContainer.remove(card, true) });
    SoundFX.play(this, 'wrong');
    Juice.mistake(this);
    Cards.reposition(this);
    this.stageMgr.onCardResolved();
  }

  onCorrectAction(card) {
    this.combo++;
    const comboMult = CONFIG.COMBO_MULTS[Math.min(this.combo, CONFIG.COMBO_MULTS.length - 1)];
    const inFirst50 = (this.time.now - card.timerStartTime) < card.callData.timeWindow * 0.5;
    const pts = Math.round(card.callData.score * comboMult * (inFirst50 ? CONFIG.SPEED_BONUS_MULT : 1));
    this.score += pts;
    this.adjustPatience(card.callData.patienceDelta.right);
    this.scoreTxt.setText('' + this.score);
    const isSmash = card.callData.isSpam !== false;
    if (isSmash) Juice.smash(this, card); else Juice.answer(this, card);
    Juice.floatingScore(this, card.x, card.y, pts, isSmash);
    if (this.combo >= 2) Juice.combo(this);
    this.tweens.add({
      targets: card, x: isSmash ? -200 : CONFIG.WIDTH + 200,
      y: card.y - 100, angle: isSmash ? -35 : 15,
      alpha: 0, duration: CONFIG.CARD_EXIT_MS, ease: 'Power2',
      onComplete: () => this.cardContainer.remove(card, true)
    });
  }

  onWrongAction(card) {
    this.adjustPatience(card.callData.patienceDelta.wrong * this.stageMgr.getDrainMult());
    this.combo = 0;
    SoundFX.play(this, 'wrong');
    Juice.mistake(this);
    this.tweens.add({ targets: card, alpha: 0, duration: 400, delay: 200,
      onComplete: () => this.cardContainer.remove(card, true) });
  }

  adjustPatience(delta) {
    this.patience = Phaser.Math.Clamp(this.patience + delta, 0, CONFIG.PATIENCE_MAX);
    this.updatePatienceBar();
    if (this.patience <= 0 && !this.gameOver) this.triggerGameOver();
  }

  updatePatienceBar() {
    const pct = this.patience / CONFIG.PATIENCE_MAX;
    this.pBar.setSize(Math.max((CONFIG.WIDTH - 32) * pct, 0), 12);
    let col = CONFIG.COL_PATIENCE_FULL;
    if (pct < 0.5) col = CONFIG.COL_PATIENCE_MID;
    if (pct < 0.25) col = CONFIG.COL_PATIENCE_LOW;
    this.pBar.setFillStyle(col);
    this.criticalTxt.setAlpha(pct < 0.25 ? 1 : 0);
  }

  onStageClear() {
    this.stageMgr.cleanup();
    Juice.stageClear(this);
    const bonus = 50 * this.stage;
    this.score += bonus;
    this.scoreTxt.setText('' + this.score);
    const clearTxt = this.add.text(CONFIG.WIDTH / 2, -40, 'STAGE ' + this.stage + ' CLEAR!', {
      fontSize: '28px', fontFamily: 'Arial Black, sans-serif', fill: '#FFFFFF',
      stroke: '#34C85A', strokeThickness: 3
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({ targets: clearTxt, y: CONFIG.HEIGHT / 2, duration: 300, ease: 'Back.easeOut' });
    const bonusTxt = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 40, '+' + bonus + ' STAGE BONUS', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fill: '#FFD60A'
    }).setOrigin(0.5).setDepth(100).setAlpha(0);
    this.tweens.add({ targets: bonusTxt, alpha: 1, duration: 300, delay: 400 });
    this.time.delayedCall(1500, () => {
      clearTxt.destroy(); bonusTxt.destroy();
      this.stage++; this.showTutorial = false;
      this.showStageIntro(this.stage);
    });
  }

  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.stageMgr.cleanup();
    if (this.deathTimer) this.deathTimer.remove();
    Juice.gameOver(this);
    this.time.delayedCall(500, () => {
      this.scene.start('GameOverScene', { score: this.score, stage: this.stage });
    });
  }

  update(time) {
    if (this.gameOver) return;
    // Hold ring progress
    if (this.holdCard && this.holdCard.active && this.holdCard.holdRing) {
      const pct = Math.min((time - this.holdStartTime) / (this.holdCard.holdDur || CONFIG.HOLD_THRESHOLD_MS), 1);
      this.holdCard.holdRing.clear();
      this.holdCard.holdRing.lineStyle(3, 0x34C85A, 1);
      this.holdCard.holdRing.beginPath();
      this.holdCard.holdRing.arc(
        this.holdCard.x + CONFIG.CARD_W / 2 - 30, this.holdCard.y,
        14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct, false);
      this.holdCard.holdRing.strokePath();
      if (pct >= 1) this.resolveCard(this.holdCard, true);
    }
    // Timer arcs
    this.cards.forEach(c => {
      if (!c.active || !c.timerArc) return;
      const remaining = 1 - Math.min((time - c.timerStartTime) / c.callData.timeWindow, 1);
      c.timerArc.clear();
      if (remaining > 0) {
        c.timerArc.lineStyle(2, remaining > 0.3 ? 0xE8E8F0 : 0xFF3B3B, 0.6);
        c.timerArc.beginPath();
        c.timerArc.arc(CONFIG.CARD_W / 2 - 30, 0, 14,
          -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remaining, false);
        c.timerArc.strokePath();
      }
    });
    // Critical patience pulse
    if (this.patience < CONFIG.PATIENCE_CRITICAL && this.patience > 0) {
      this.vignette.setAlpha(0.3 * (0.5 + 0.5 * Math.sin(time / 500)));
    }
  }
}
