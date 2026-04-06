// Lag Shot - UI Scenes (Menu, GameOver, HUD helpers)

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A0F);

    // Subtle grid background
    for (let gx = 0; gx < w; gx += 40) {
      for (let gy = 0; gy < h; gy += 40) {
        this.add.image(gx + 20, gy + 20, 'grid').setAlpha(0.3);
      }
    }

    // Title
    this.add.text(w / 2, 160, 'LAG SHOT', {
      fontSize: '48px', fontFamily: 'monospace', fill: '#FFFFFF', fontStyle: 'bold', letterSpacing: 8
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(w / 2, 205, 'Shoot where you WERE', {
      fontSize: '16px', fontFamily: 'monospace', fill: COLORS.player, fontStyle: 'italic'
    }).setOrigin(0.5);

    // Ghost diamond animation
    const ghost = this.add.graphics();
    ghost.fillStyle(0x00FFFF, 0.3);
    ghost.fillPoints([
      { x: w / 2, y: 240 }, { x: w / 2 + 12, y: 252 },
      { x: w / 2, y: 264 }, { x: w / 2 - 12, y: 252 }
    ], true);
    this.tweens.add({ targets: ghost, alpha: 0.2, duration: 800, yoyo: true, repeat: -1 });

    // Play button
    const playBg = this.add.rectangle(w / 2, 310, 200, 56, 0xFFFFFF).setInteractive({ useHandCursor: true });
    const playText = this.add.text(w / 2, 310, 'PLAY', {
      fontSize: '22px', fontFamily: 'monospace', fill: '#000000', fontStyle: 'bold'
    }).setOrigin(0.5);
    playText.disableInteractive();
    playBg.on('pointerdown', () => {
      audioManager.init();
      audioManager.playButton();
      this.scene.stop();
      this.scene.start('GameScene');
    });

    // How to Play button
    const htpBg = this.add.rectangle(w / 2, 380, 200, 44, 0x000000, 0)
      .setStrokeStyle(2, 0xFFFFFF).setInteractive({ useHandCursor: true });
    const htpText = this.add.text(w / 2, 380, 'HOW TO PLAY', {
      fontSize: '16px', fontFamily: 'monospace', fill: '#FFFFFF'
    }).setOrigin(0.5);
    htpText.disableInteractive();
    htpBg.on('pointerdown', () => {
      audioManager.init();
      audioManager.playButton();
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // High score
    const gs = window.gameState || { highScore: 0 };
    this.add.text(w / 2, 450, 'Best: ' + gs.highScore, {
      fontSize: '14px', fontFamily: 'monospace', fill: '#FFFFFF'
    }).setOrigin(0.5).setAlpha(0.7);
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalWave = data.wave || 1;
    this.isHighScore = data.isHighScore || false;
    this.continueWave = data.continueWave || 1;
  }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A0F, 0.92);

    this.add.text(w / 2, 180, 'GAME OVER', {
      fontSize: '36px', fontFamily: 'monospace', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Score with scale punch
    const scoreTxt = this.add.text(w / 2, 255, '' + this.finalScore, {
      fontSize: '52px', fontFamily: 'monospace', fill: COLORS.player, fontStyle: 'bold'
    }).setOrigin(0.5).setScale(0.5);
    this.tweens.add({
      targets: scoreTxt, scaleX: 1.4, scaleY: 1.4, duration: 150,
      yoyo: true, ease: 'Quad.easeOut',
      onYoyo: () => scoreTxt.setScale(1)
    });

    this.add.text(w / 2, 315, 'Wave ' + this.finalWave, {
      fontSize: '18px', fontFamily: 'monospace', fill: '#FFFFFF'
    }).setOrigin(0.5);

    if (this.isHighScore) {
      const hsTxt = this.add.text(w / 2, 345, 'NEW BEST!', {
        fontSize: '20px', fontFamily: 'monospace', fill: COLORS.gold, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({ targets: hsTxt, alpha: 0.5, duration: 400, yoyo: true, repeat: -1 });
      // Gold particle burst
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const p = this.add.circle(w / 2, 345, 3, 0xFFCC00);
        this.tweens.add({
          targets: p,
          x: w / 2 + Math.cos(angle) * 60,
          y: 345 + Math.sin(angle) * 60,
          alpha: 0, duration: 600, delay: i * 30,
          onComplete: () => p.destroy()
        });
      }
    }

    // Continue (ad) button
    if (AdsManager.canShowContinue()) {
      const contBg = this.add.rectangle(w / 2, 400, 220, 48, 0x000000, 0)
        .setStrokeStyle(2, 0xFFCC00).setInteractive({ useHandCursor: true });
      const contText = this.add.text(w / 2, 400, 'CONTINUE (AD)', {
        fontSize: '16px', fontFamily: 'monospace', fill: COLORS.gold
      }).setOrigin(0.5);
      contText.disableInteractive();
      contBg.on('pointerdown', () => {
        audioManager.playButton();
        AdsManager.markContinueUsed();
        AdsManager.showRewarded(() => {
          this.scene.stop();
          this.scene.stop('GameScene');
          this.scene.start('GameScene', { continueFromWave: this.continueWave, continueScore: this.finalScore });
        });
      });
    }

    // Play Again
    const playBg = this.add.rectangle(w / 2, 470, 220, 52, 0xFFFFFF)
      .setInteractive({ useHandCursor: true });
    const playText = this.add.text(w / 2, 470, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'monospace', fill: '#000000', fontStyle: 'bold'
    }).setOrigin(0.5);
    playText.disableInteractive();
    playBg.on('pointerdown', () => {
      audioManager.playButton();
      AdsManager.showInterstitial(() => {
        this.scene.stop();
        this.scene.stop('GameScene');
        this.scene.start('GameScene');
      });
    });

    // Menu
    const menuBg = this.add.rectangle(w / 2, 540, 140, 40, 0x000000, 0)
      .setStrokeStyle(1.5, 0xFFFFFF).setInteractive({ useHandCursor: true });
    const menuText = this.add.text(w / 2, 540, 'MENU', {
      fontSize: '14px', fontFamily: 'monospace', fill: '#FFFFFF'
    }).setOrigin(0.5);
    menuText.disableInteractive();
    menuBg.on('pointerdown', () => {
      audioManager.playButton();
      this.scene.stop();
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
  }
}
