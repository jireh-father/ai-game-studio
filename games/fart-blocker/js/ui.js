// ui.js — MenuScene, GameOverScene, HUD, Pause overlay

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x1A1A2E);

    // Animated player character
    const player = this.add.image(w / 2, h * 0.28, 'player').setScale(1.8);
    this.tweens.add({
      targets: player, y: player.y - 8, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Title
    this.add.text(w / 2, h * 0.48, 'FART BLOCKER', {
      fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.uiText
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.54, 'Keep it together in there.', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'italic', color: COLORS.warningYellow
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.rectangle(w / 2, h * 0.65, 200, 56, 0x2DC653)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.65, 'PLAY', {
      fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
    }).setOrigin(0.5).setDepth(1);

    playBtn.on('pointerdown', () => {
      AudioSystem.playUIClick();
      GameState.score = 0;
      GameState.stage = 1;
      GameState.lives = DIFFICULTY_BASE.initialLives;
      GameState.comboChain = 0;
      GameState.comboActive = false;
      AdManager.reset();
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
    });

    // How to Play button
    const helpBtn = this.add.rectangle(w / 2, h * 0.75, 200, 44, 0x3A86FF)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.75, '? HOW TO PLAY', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
    }).setOrigin(0.5).setDepth(1);

    helpBtn.on('pointerdown', () => {
      AudioSystem.playUIClick();
      this.scene.pause('MenuScene');
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // High score
    const hs = GameState.highScore || 0;
    this.add.text(20, h - 30, 'BEST: ' + hs, {
      fontSize: '14px', fontFamily: 'Arial', color: '#AAA'
    }).setOrigin(0, 0.5);

    // Sound toggle
    const soundIcon = this.add.text(w - 20, h - 30, AudioSystem.sfxOn ? '🔊' : '🔇', {
      fontSize: '24px'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    soundIcon.on('pointerdown', () => {
      AudioSystem.sfxOn = !AudioSystem.sfxOn;
      AudioSystem.musicOn = AudioSystem.sfxOn;
      AudioSystem.setVolume(AudioSystem.sfxOn, AudioSystem.musicOn);
      soundIcon.setText(AudioSystem.sfxOn ? '🔊' : '🔇');
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x1A1A2E, 0.92).setDepth(0);

    // Disaster cloud
    const cloud = this.add.image(w / 2, h * 0.18, 'cloudPuff').setScale(4).setAlpha(0.6);
    this.tweens.add({ targets: cloud, scaleX: 5, scaleY: 5, alpha: 0.3, duration: 2000, repeat: -1, yoyo: true });

    this.add.text(w / 2, h * 0.30, 'STAGE ' + GameState.stage + ' REACHED', {
      fontSize: '18px', fontFamily: 'Arial', color: '#AAA'
    }).setOrigin(0.5).setDepth(1);

    this.add.text(w / 2, h * 0.37, 'SCORE: ' + GameState.score, {
      fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.uiText
    }).setOrigin(0.5).setDepth(1);

    // New record check
    const isNewRecord = GameState.score > GameState.highScore;
    if (isNewRecord) {
      GameState.highScore = GameState.score;
      try { localStorage.setItem(STORAGE_KEYS.highScore, GameState.highScore); } catch (e) {}

      const rec = this.add.text(w / 2, h * 0.44, 'NEW RECORD!', {
        fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.warningYellow
      }).setOrigin(0.5).setDepth(1);

      this.tweens.add({ targets: rec, scaleX: 1.2, scaleY: 1.2, duration: 400, yoyo: true, repeat: -1 });
      AudioSystem.playHighScore();
    }

    let btnY = h * 0.55;

    // Continue with ad (if available)
    if (AdManager.canContinue()) {
      const contBtn = this.add.rectangle(w / 2, btnY, 220, 48, 0xFF6B35)
        .setInteractive({ useHandCursor: true }).setDepth(1);
      this.add.text(w / 2, btnY, 'WATCH AD - CONTINUE', {
        fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
      }).setOrigin(0.5).setDepth(2);

      contBtn.on('pointerdown', () => {
        AudioSystem.playUIClick();
        AdManager.showRewarded('continue', (rewarded) => {
          if (rewarded) {
            GameState.lives = 1;
            this.scene.stop('GameOverScene');
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
          }
        });
      });
      btnY += 60;
    }

    // Play Again
    const retryBtn = this.add.rectangle(w / 2, btnY, 200, 50, 0x2DC653)
      .setInteractive({ useHandCursor: true }).setDepth(1);
    this.add.text(w / 2, btnY, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
    }).setOrigin(0.5).setDepth(2);

    retryBtn.on('pointerdown', () => {
      AudioSystem.playUIClick();
      GameState.score = 0;
      GameState.stage = 1;
      GameState.lives = DIFFICULTY_BASE.initialLives;
      GameState.comboChain = 0;
      GameState.comboActive = false;
      AdManager.reset();
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });
    btnY += 58;

    // Menu
    const menuBtn = this.add.rectangle(w / 2, btnY, 200, 44, 0x555555)
      .setInteractive({ useHandCursor: true }).setDepth(1);
    this.add.text(w / 2, btnY, 'MENU', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
    }).setOrigin(0.5).setDepth(2);

    menuBtn.on('pointerdown', () => {
      AudioSystem.playUIClick();
      AdManager.onGameOver();
      if (AdManager.shouldShowInterstitial()) {
        AdManager.showInterstitial(() => {
          this.scene.stop('GameOverScene');
          this.scene.stop('GameScene');
          this.scene.start('MenuScene');
        });
      } else {
        this.scene.stop('GameOverScene');
        this.scene.stop('GameScene');
        this.scene.start('MenuScene');
      }
    });
  }
}
