// Gravity Liar - UI Scenes (Menu, GameOver, Pause)

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.bg);

    // Title
    this.add.text(w / 2, h * 0.22, 'GRAVITY\nLIAR', {
      fontSize: '48px', fontFamily: 'Arial', fill: '#00E5FF',
      fontStyle: 'bold', align: 'center', lineSpacing: 4
    }).setOrigin(0.5);

    // Tagline
    this.add.text(w / 2, h * 0.38, 'The arrow lies. Will you?', {
      fontSize: '14px', fontFamily: 'Arial', fill: '#B0BEC5', fontStyle: 'italic'
    }).setOrigin(0.5);

    // Arrow visual
    this.add.image(w / 2, h * 0.48, 'arrow').setScale(0.8).setAlpha(0.3);

    // PLAY button
    const playBtn = this.add.rectangle(w / 2, h * 0.6, 200, 56, COLORS.correctTap)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.6, 'PLAY', {
      fontSize: '22px', fontFamily: 'Arial', fill: '#000000', fontStyle: 'bold'
    }).setOrigin(0.5);

    playBtn.on('pointerdown', () => {
      playUIClick();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      GameState.reset();
      AdManager.resetForNewGame();
      this.scene.start('GameScene');
    });

    // Help button
    const helpBtn = this.add.rectangle(30, 30, 44, 44, 0x1A1A2E)
      .setInteractive({ useHandCursor: true });
    this.add.text(30, 30, '?', {
      fontSize: '22px', fontFamily: 'Arial', fill: '#E8E8F0', fontStyle: 'bold'
    }).setOrigin(0.5);

    helpBtn.on('pointerdown', () => {
      playUIClick();
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // High score
    const hs = GameState.highScore;
    if (hs > 0) {
      this.add.text(w / 2, h * 0.74, 'BEST: ' + hs, {
        fontSize: '16px', fontFamily: 'Arial', fill: '#FFD600'
      }).setOrigin(0.5);
      this.add.text(w / 2, h * 0.79, 'Best Stage: ' + GameState.bestStage, {
        fontSize: '13px', fontFamily: 'Arial', fill: '#B0BEC5'
      }).setOrigin(0.5);
    }

    // Subtle ball floating animation
    const ball = this.add.image(w / 2, h * 0.88, 'ball').setScale(0.7).setAlpha(0.4);
    this.tweens.add({
      targets: ball, y: h * 0.88 - 10, duration: 1200,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.stageReached = data.stage || 1;
    this.isHighScore = data.isHighScore || false;
    this.canContinue = data.canContinue || false;
  }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.bg, 0.92);

    // Game Over title
    this.add.text(w / 2, h * 0.18, 'GAME OVER', {
      fontSize: '36px', fontFamily: 'Arial', fill: COLORS.gameOver, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Score count-up
    const scoreTxt = this.add.text(w / 2, h * 0.3, '0', {
      fontSize: '48px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.addCounter({
      from: 0, to: this.finalScore, duration: 1200, ease: 'Cubic.easeOut',
      onUpdate: (t) => { scoreTxt.setText(Math.floor(t.getValue())); }
    });

    // NEW BEST
    if (this.isHighScore) {
      this.time.delayedCall(1400, () => {
        const newBest = this.add.text(w / 2, h * 0.38, 'NEW BEST!', {
          fontSize: '20px', fontFamily: 'Arial', fill: COLORS.newBest, fontStyle: 'bold'
        }).setOrigin(0.5).setScale(0.5).setAlpha(0);
        this.tweens.add({
          targets: newBest, scale: 1.2, alpha: 1, duration: 400,
          ease: 'Back.easeOut', yoyo: true, hold: 600
        });
      });
    }

    // Stage reached
    this.add.text(w / 2, h * 0.44, 'Reached Stage ' + this.stageReached, {
      fontSize: '16px', fontFamily: 'Arial', fill: '#B0BEC5'
    }).setOrigin(0.5);

    let btnY = h * 0.55;

    // Play Again button (primary — always on top)
    const playBtn = this.add.rectangle(w / 2, btnY, 200, 52, COLORS.correctTap)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'Play Again', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#000000', fontStyle: 'bold'
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      playUIClick();
      GameState.reset();
      AdManager.resetForNewGame();
      this.scene.stop();
      this.scene.start('GameScene');
    });
    btnY += 58;

    // Rewarded ad button (secondary — below Play Again)
    if (this.canContinue && AdManager.canShowRewarded()) {
      const adBtn = this.add.rectangle(w / 2, btnY, 200, 52, 0x1A1A2E)
        .setStrokeStyle(2, COLORS.comboBar).setInteractive({ useHandCursor: true });
      this.add.text(w / 2, btnY, 'Watch Ad (+1 Life)', {
        fontSize: '14px', fontFamily: 'Arial', fill: '#FFD600', fontStyle: 'bold'
      }).setOrigin(0.5);
      adBtn.on('pointerdown', () => {
        playUIClick();
        AdManager.showRewarded(() => {
          GameState.lives = 1;
          GameState.pendingContinue = true;
          this.scene.stop();
          this.scene.start('GameScene');
        });
      });
      btnY += 64;
    }

    // Menu button
    const menuBtn = this.add.rectangle(w / 2, btnY, 180, 44, 0x1A1A2E)
      .setStrokeStyle(1, 0x444466).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'Menu', {
      fontSize: '14px', fontFamily: 'Arial', fill: '#B0BEC5'
    }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => {
      playUIClick();
      this.scene.stop();
      this.scene.start('MenuScene');
    });

    // Show interstitial if needed
    AdManager.onGameOver();
    AdManager.showInterstitial();
    playGameOverSound();
  }
}
