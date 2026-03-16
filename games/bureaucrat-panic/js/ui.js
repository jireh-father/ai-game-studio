// ui.js — MenuScene, GameOverScene, HUD overlay

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = DIMS.width, h = DIMS.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0xF5F0E8);

    // Desk decoration
    this.add.rectangle(w / 2, h - 40, w, 80, 0xD5CFC4);

    // Title
    this.add.text(w / 2, 120, 'BUREAUCRAT\nPANIC', {
      fontSize: '36px', fontFamily: 'monospace', fontStyle: 'bold',
      fill: COLORS.govBlue, align: 'center', lineSpacing: 4
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(w / 2, 195, 'You have 12 seconds per form.', {
      fontSize: '13px', fontFamily: 'monospace', fill: COLORS.warmGray
    }).setOrigin(0.5);

    // High score
    const hs = window.GameState ? window.GameState.highScore : 0;
    if (hs > 0) {
      this.add.text(w / 2, 230, 'BEST: ' + hs, {
        fontSize: '14px', fontFamily: 'monospace', fill: COLORS.comboGold
      }).setOrigin(0.5);
    }

    // PLAY button
    const playBtn = this.add.rectangle(w / 2, 310, 200, 56, 0x2B4C8C, 1).setInteractive({ useHandCursor: true });
    playBtn.setStrokeStyle(2, 0x1A1A2E);
    const playTxt = this.add.text(w / 2, 310, 'PLAY', {
      fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#FFFFFF'
    }).setOrigin(0.5);

    playBtn.on('pointerdown', () => {
      synthClick();
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.time.delayedCall(200, () => {
        this.scene.stop('MenuScene');
        this.scene.start('GameScene');
      });
    });

    // Help button
    const helpBtn = this.add.circle(300, 520, 24, 0xFFFFFF, 1).setInteractive({ useHandCursor: true });
    helpBtn.setStrokeStyle(2, 0x2B4C8C);
    this.add.text(300, 520, '?', {
      fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.govBlue
    }).setOrigin(0.5);

    helpBtn.on('pointerdown', () => {
      synthClick();
      this.scene.pause('MenuScene');
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Sound toggle
    this.soundOn = window.GameState ? window.GameState.soundOn !== false : true;
    const soundBtn = this.add.circle(60, 520, 24, 0xFFFFFF, 1).setInteractive({ useHandCursor: true });
    soundBtn.setStrokeStyle(2, 0x2B4C8C);
    const soundTxt = this.add.text(60, 520, this.soundOn ? '🔊' : '🔇', {
      fontSize: '20px'
    }).setOrigin(0.5);

    soundBtn.on('pointerdown', () => {
      this.soundOn = !this.soundOn;
      if (window.GameState) window.GameState.soundOn = this.soundOn;
      soundTxt.setText(this.soundOn ? '🔊' : '🔇');
    });

    this.cameras.main.fadeIn(200);
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.stageReached = data.stage || 1;
    this.combo = data.maxCombo || 0;
  }

  create() {
    const w = DIMS.width, h = DIMS.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0xF5F0E8);

    // FIRED stamp
    const firedText = this.add.text(w / 2, 110, 'FIRED.', {
      fontSize: '52px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.stampRed
    }).setOrigin(0.5).setScale(2);

    this.tweens.add({
      targets: firedText, scaleX: 1, scaleY: 1, duration: 200,
      ease: 'Back.easeOut'
    });

    synthFired();

    // Stats
    this.add.text(w / 2, 210, 'STAGE REACHED: ' + this.stageReached, {
      fontSize: '16px', fontFamily: 'monospace', fill: COLORS.inkBlack
    }).setOrigin(0.5);

    this.add.text(w / 2, 250, 'YOUR SCORE', {
      fontSize: '12px', fontFamily: 'monospace', fill: COLORS.warmGray
    }).setOrigin(0.5);

    this.add.text(w / 2, 280, '' + this.finalScore, {
      fontSize: '36px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.inkBlack
    }).setOrigin(0.5);

    // High score check
    const gs = window.GameState;
    const isNewBest = this.finalScore > gs.highScore;
    if (isNewBest) {
      gs.highScore = this.finalScore;
      try { localStorage.setItem('bureaucrat-panic_high_score', gs.highScore); } catch (e) {}
    }

    const bestColor = isNewBest ? COLORS.comboGold : COLORS.warmGray;
    this.add.text(w / 2, 320, 'BEST: ' + gs.highScore, {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', fill: bestColor
    }).setOrigin(0.5);

    if (isNewBest) {
      const newBest = this.add.text(w / 2, 350, 'NEW BEST!', {
        fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.comboGold
      }).setOrigin(0.5);
      this.tweens.add({ targets: newBest, scaleX: 1.3, scaleY: 1.3, yoyo: true, duration: 300, repeat: 2 });
    }

    let btnY = 390;

    // Continue button (rewarded ad, once per session)
    if (AdsManager.canContinue()) {
      const contBtn = this.add.rectangle(w / 2, btnY, 240, 48, 0xE67E22, 1).setInteractive({ useHandCursor: true });
      contBtn.setStrokeStyle(2, 0x1A1A2E);
      this.add.text(w / 2, btnY, 'CONTINUE? Watch Ad', {
        fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#FFFFFF'
      }).setOrigin(0.5);
      contBtn.on('pointerdown', () => {
        synthClick();
        AdsManager.showRewardedContinue(() => {
          this.scene.stop('GameOverScene');
          this.scene.start('GameScene', { continueFromStage: this.stageReached, score: this.finalScore });
        });
      });
      btnY += 65;
    }

    // Play again
    const playBtn = this.add.rectangle(w / 2, btnY, 240, 48, 0x2B4C8C, 1).setInteractive({ useHandCursor: true });
    playBtn.setStrokeStyle(2, 0x1A1A2E);
    this.add.text(w / 2, btnY, 'PLAY AGAIN', {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#FFFFFF'
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      synthClick();
      AdsManager.onGameOver();
      if (AdsManager.shouldShowInterstitial()) {
        AdsManager.showInterstitial(() => {
          this.scene.stop('GameOverScene');
          this.scene.start('GameScene');
        });
      } else {
        this.scene.stop('GameOverScene');
        this.scene.start('GameScene');
      }
    });
    btnY += 60;

    // Menu button
    const menuBtn = this.add.rectangle(w / 2, btnY, 160, 44, 0xF5F0E8, 1).setInteractive({ useHandCursor: true });
    menuBtn.setStrokeStyle(2, 0x2B4C8C);
    this.add.text(w / 2, btnY, 'MENU', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.govBlue
    }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => {
      synthClick();
      this.scene.stop('GameOverScene');
      this.scene.start('MenuScene');
    });

    this.cameras.main.fadeIn(300);
  }
}

// HUD Manager (helper class, not a scene)
class HUDManager {
  constructor(scene) {
    this.scene = scene;
    this.elements = {};
  }

  create(score, strikes, stage) {
    const s = this.scene;
    const w = DIMS.width;

    // Timer bar background
    this.elements.timerBg = s.add.rectangle(w / 2, DIMS.timerBarY + 4, 320, DIMS.timerBarH, 0xBDC3C7).setDepth(10);
    this.elements.timerFill = s.add.rectangle(20, DIMS.timerBarY, 320, DIMS.timerBarH, 0xE67E22).setOrigin(0, 0).setDepth(11);
    this.elements.timerLabel = s.add.text(348, DIMS.timerBarY + 4, '', {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.inkBlack
    }).setOrigin(1, 0.5).setDepth(11);

    // Score
    this.elements.scoreText = s.add.text(16, DIMS.hudY, 'SCORE: ' + score, {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.inkBlack
    }).setDepth(10);

    // Multiplier
    this.elements.multiText = s.add.text(155, DIMS.hudY, '', {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.comboGold
    }).setDepth(10);

    // Combo
    this.elements.comboText = s.add.text(210, DIMS.hudY, '', {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.comboGold
    }).setDepth(10);

    // Strikes (3 squares)
    this.elements.strikes = [];
    for (let i = 0; i < 3; i++) {
      const x = 310 + i * 18;
      const sq = s.add.rectangle(x, DIMS.hudY + 8, 14, 14, i < strikes ? 0xC0392B : 0xBDC3C7)
        .setStrokeStyle(1, 0x1A1A2E).setDepth(10);
      this.elements.strikes.push(sq);
    }

    // Stage label
    this.elements.stageText = s.add.text(w / 2, DIMS.hudY + 22, 'STAGE ' + stage, {
      fontSize: '10px', fontFamily: 'monospace', fill: COLORS.warmGray
    }).setOrigin(0.5).setDepth(10);

    // Pause button
    const pauseBtn = s.add.rectangle(340, 10, 36, 36, 0xFFFFFF, 0.8)
      .setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).setDepth(20);
    pauseBtn.setStrokeStyle(1, 0x2B4C8C);
    s.add.text(340, 28, '||', {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.govBlue
    }).setOrigin(0.5).setDepth(19);

    pauseBtn.on('pointerdown', () => {
      if (s.gameOver || s.paused) return;
      synthClick();
      s.pauseGame();
    });
  }

  updateScore(score) {
    if (this.elements.scoreText) {
      this.elements.scoreText.setText('SCORE: ' + score);
      // Score punch
      this.scene.tweens.add({
        targets: this.elements.scoreText,
        scaleX: 1.4, scaleY: 1.4, duration: 100, yoyo: true, ease: 'Back.easeOut'
      });
    }
  }

  updateCombo(combo) {
    if (!this.elements.comboText || !this.elements.multiText) return;
    if (combo >= 3) {
      let mult = 1;
      if (combo >= 8) mult = 3.0;
      else if (combo >= 5) mult = 2.0;
      else mult = 1.5;
      this.elements.multiText.setText('x' + mult);
      this.elements.comboText.setText('COMBO ' + combo);
      this.scene.tweens.add({
        targets: this.elements.comboText,
        scaleX: 1.3, scaleY: 1.3, duration: 120, yoyo: true
      });
    } else {
      this.elements.multiText.setText('');
      this.elements.comboText.setText(combo > 0 ? 'x' + combo : '');
    }
  }

  updateStrikes(strikes) {
    for (let i = 0; i < 3; i++) {
      const color = i < strikes ? 0xC0392B : 0xBDC3C7;
      this.elements.strikes[i].setFillStyle(color);
      if (i === strikes - 1) {
        this.scene.tweens.add({
          targets: this.elements.strikes[i],
          scaleX: 1.6, scaleY: 1.6, duration: 150, yoyo: true
        });
      }
    }
  }

  updateTimer(pct, seconds) {
    if (!this.elements.timerFill) return;
    this.elements.timerFill.width = 320 * pct;
    const color = seconds <= 3 ? 0xE74C3C : 0xE67E22;
    this.elements.timerFill.setFillStyle(color);
    this.elements.timerLabel.setText(Math.ceil(seconds) + 's');
    if (seconds <= 3) {
      this.elements.timerLabel.setFill(COLORS.timerDanger);
    } else {
      this.elements.timerLabel.setFill(COLORS.inkBlack);
    }
  }

  updateStage(stage) {
    if (this.elements.stageText) {
      this.elements.stageText.setText('STAGE ' + stage);
    }
  }
}
