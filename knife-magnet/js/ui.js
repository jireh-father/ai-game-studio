class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.rectangle(w / 2, h / 2, w, h, COLORS.bg);

    // Background decorative lines
    const bg = this.add.graphics();
    bg.lineStyle(1, 0x2A2F3E, 0.5);
    bg.lineBetween(0, h * 0.25, w, h * 0.25);
    bg.lineBetween(0, h * 0.75, w, h * 0.75);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        bg.strokeRect(c * 68 + 5, r * 45 + h * 0.15, 60, 40);
      }
    }

    // Title
    this.add.text(w / 2, h * 0.22, 'KNIFE', {
      fontSize: '48px', fontFamily: 'Arial', color: COLORS_HEX.uiText,
      fontStyle: 'bold'
    }).setOrigin(0.5).setShadow(0, 0, COLORS_HEX.primary, 8);

    this.add.text(w / 2, h * 0.32, 'MAGNET', {
      fontSize: '48px', fontFamily: 'Arial', color: COLORS_HEX.primary,
      fontStyle: 'bold'
    }).setOrigin(0.5).setShadow(0, 0, COLORS_HEX.primary, 12);

    this.add.text(w / 2, h * 0.40, 'Catch. Dodge. Survive.', {
      fontSize: '14px', fontFamily: 'Arial', color: COLORS_HEX.secondary,
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Decorative knife
    this.add.image(w / 2, h * 0.50, 'knife_normal').setScale(2.5).setAlpha(0.3);

    // Play button
    const playBg = this.add.rectangle(w / 2, h * 0.60, 200, 56, COLORS.primary)
      .setInteractive({ useHandCursor: true });
    const playTxt = this.add.text(w / 2, h * 0.60, 'PLAY', {
      fontSize: '24px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    playTxt.disableInteractive();

    playBg.on('pointerdown', () => playBg.setScale(0.95));
    playBg.on('pointerup', () => {
      playBg.setScale(1);
      window.GameState.score = 0;
      window.GameState.stage = 1;
      window.GameState.lives = STARTING_LIVES;
      window.GameState.streak = 0;
      AdManager.reset();
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
    });

    // High score
    const hs = window.GameState.highScore || 0;
    this.add.text(w / 2, h * 0.69, 'BEST: ' + hs, {
      fontSize: '16px', fontFamily: 'Arial', color: COLORS_HEX.reward
    }).setOrigin(0.5);

    // Help button
    const helpBg = this.add.rectangle(60, h - 50, 56, 56, 0x2A2F3E)
      .setInteractive({ useHandCursor: true });
    this.add.text(60, h - 50, '?', {
      fontSize: '28px', fontFamily: 'Arial', color: COLORS_HEX.primary,
      fontStyle: 'bold'
    }).setOrigin(0.5).disableInteractive();

    helpBg.on('pointerup', () => {
      this.scene.pause('MenuScene');
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const gs = window.GameState;

    this.add.rectangle(w / 2, h / 2, w, h, COLORS.uiBg, 0.95);

    this.add.text(w / 2, h * 0.18, 'GAME OVER', {
      fontSize: '36px', fontFamily: 'Arial', color: COLORS_HEX.danger,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.28, 'Stage ' + gs.stage, {
      fontSize: '20px', fontFamily: 'Arial', color: COLORS_HEX.uiText
    }).setOrigin(0.5);

    // Animated score counter
    const scoreText = this.add.text(w / 2, h * 0.38, '0', {
      fontSize: '42px', fontFamily: 'Arial', color: COLORS_HEX.reward,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.addCounter({
      from: 0, to: gs.score, duration: 800, ease: 'Power2',
      onUpdate: (tw) => {
        scoreText.setText(Math.floor(tw.getValue()).toString());
      }
    });

    // New best check
    const isNewBest = gs.score > gs.highScore;
    if (isNewBest) {
      gs.highScore = gs.score;
      localStorage.setItem('knife-magnet_high_score', gs.score);
      const bestTxt = this.add.text(w / 2, h * 0.47, 'NEW BEST!', {
        fontSize: '20px', fontFamily: 'Arial', color: COLORS_HEX.reward,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({
        targets: bestTxt, scaleX: 1.2, scaleY: 1.2,
        duration: 400, yoyo: true, repeat: -1
      });
    }

    let btnY = h * 0.56;

    // Continue ad button (once per game)
    if (!AdManager.continueUsed) {
      const adBg = this.add.rectangle(w / 2, btnY, 220, 44, COLORS.cursed)
        .setInteractive({ useHandCursor: true });
      this.add.text(w / 2, btnY, 'WATCH AD TO CONTINUE', {
        fontSize: '14px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
      }).setOrigin(0.5).disableInteractive();
      adBg.on('pointerup', () => {
        AdManager.showRewarded('continue', () => {
          window.GameState.lives = 1;
          this.scene.stop('GameOverScene');
          this.scene.start('GameScene');
        });
      });
      btnY += 56;
    }

    // Play Again
    const playBg = this.add.rectangle(w / 2, btnY, 200, 50, COLORS.primary)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).disableInteractive();

    playBg.on('pointerdown', () => playBg.setScale(0.95));
    playBg.on('pointerup', () => {
      playBg.setScale(1);
      window.GameState.score = 0;
      window.GameState.stage = 1;
      window.GameState.lives = STARTING_LIVES;
      window.GameState.streak = 0;
      AdManager.reset();
      this.scene.stop('GameOverScene');
      this.scene.start('GameScene');
    });
    btnY += 56;

    // Menu button
    const menuBg = this.add.rectangle(w / 2, btnY, 160, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    menuBg.setStrokeStyle(2, COLORS.secondary);
    this.add.text(w / 2, btnY, 'MENU', {
      fontSize: '16px', fontFamily: 'Arial', color: COLORS_HEX.secondary
    }).setOrigin(0.5).disableInteractive();

    menuBg.on('pointerup', () => {
      this.scene.stop('GameOverScene');
      this.scene.start('MenuScene');
    });

    // Interstitial check
    if (AdManager.shouldShowInterstitial()) {
      AdManager.showInterstitial();
    }
  }
}
