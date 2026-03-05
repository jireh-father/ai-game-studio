// Shockwave Hop - UI Scenes (Menu, GameOver, HUD)

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const cx = GAME.width / 2;
    this.add.rectangle(cx, GAME.height / 2, GAME.width, GAME.height, COLORS.bg);

    // Decorative rings
    const g = this.add.graphics();
    g.lineStyle(2, COLORS.secondary, 0.15);
    g.strokeCircle(cx, 280, 120);
    g.lineStyle(2, COLORS.primary, 0.1);
    g.strokeCircle(cx, 280, 180);

    // Title
    const title = this.add.text(cx, 180, 'SHOCKWAVE\nHOP', {
      fontSize: '44px', fontFamily: 'Arial Black, sans-serif',
      color: COLORS_HEX.primary, align: 'center',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);
    this.tweens.add({
      targets: title, scale: 1.05,
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // High score
    const hs = StorageUtil.get(STORAGE_KEYS.highScore, 0);
    this.add.text(cx, 270, `HIGH SCORE: ${hs}`, {
      fontSize: '16px', fontFamily: 'Arial, sans-serif',
      color: COLORS_HEX.reward
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.rectangle(cx, 370, 200, 56, COLORS.primary, 0.9)
      .setInteractive({ useHandCursor: true });
    const playTxt = this.add.text(cx, 370, 'TAP TO PLAY', {
      fontSize: '22px', fontFamily: 'Arial Black, sans-serif',
      color: '#0A0E27'
    }).setOrigin(0.5);
    playTxt.disableInteractive();
    this.tweens.add({
      targets: [playBtn, playTxt], alpha: 0.6,
      duration: 800, yoyo: true, repeat: -1
    });
    playBtn.on('pointerdown', () => {
      AdManager.resetForNewGame();
      this.scene.start('GameScene');
    });

    // Help button
    const helpBtn = this.add.circle(35, 35, 22, COLORS.primary, 0.3)
      .setInteractive({ useHandCursor: true });
    this.add.text(35, 35, '?', {
      fontSize: '22px', fontFamily: 'Arial Black, sans-serif',
      color: COLORS_HEX.primary
    }).setOrigin(0.5).disableInteractive();
    helpBtn.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Sound toggle
    const soundOn = StorageUtil.getSettings().sound;
    const soundBtn = this.add.circle(GAME.width - 35, 35, 22, COLORS.primary, 0.3)
      .setInteractive({ useHandCursor: true });
    const soundTxt = this.add.text(GAME.width - 35, 35, soundOn ? '♪' : '♪̸', {
      fontSize: '20px', color: soundOn ? COLORS_HEX.primary : '#666'
    }).setOrigin(0.5);
    soundTxt.disableInteractive();
    soundBtn.on('pointerdown', () => {
      const s = StorageUtil.getSettings();
      s.sound = !s.sound;
      StorageUtil.set(STORAGE_KEYS.settings, JSON.stringify(s));
      soundTxt.setText(s.sound ? '♪' : '♪̸');
      soundTxt.setColor(s.sound ? COLORS_HEX.primary : '#666');
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.stageReached = data.stage || 1;
    this.isNewHigh = data.isNewHigh || false;
  }

  create() {
    const cx = GAME.width / 2;
    // Block accidental taps for 100ms
    this.input.enabled = false;
    this.time.delayedCall(100, () => { this.input.enabled = true; });

    this.add.rectangle(cx, GAME.height / 2, GAME.width, GAME.height, COLORS.bg, 0.92)
      .setDepth(0);

    this.add.text(cx, 120, 'GAME OVER', {
      fontSize: '36px', fontFamily: 'Arial Black, sans-serif',
      color: COLORS_HEX.danger, stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    // Score with count-up
    const scoreTxt = this.add.text(cx, 200, '0', {
      fontSize: '40px', fontFamily: 'Arial Black, sans-serif',
      color: COLORS_HEX.reward, stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
    this.tweens.addCounter({
      from: 0, to: this.finalScore, duration: 800,
      onUpdate: (t) => { scoreTxt.setText(Math.floor(t.getValue())); }
    });

    if (this.isNewHigh) {
      const newTxt = this.add.text(cx, 245, 'NEW HIGH SCORE!', {
        fontSize: '18px', fontFamily: 'Arial Black, sans-serif',
        color: COLORS_HEX.reward
      }).setOrigin(0.5);
      this.tweens.add({
        targets: newTxt, scale: 1.2,
        duration: 500, yoyo: true, repeat: -1
      });
    }

    this.add.text(cx, 280, `Stage Reached: ${this.stageReached}`, {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: COLORS_HEX.uiText
    }).setOrigin(0.5);

    // Continue button (ad)
    let btnY = 350;
    if (AdManager.canContinue()) {
      const contBtn = this.add.rectangle(cx, btnY, 220, 48, COLORS.reward, 0.9)
        .setInteractive({ useHandCursor: true });
      this.add.text(cx, btnY, 'Continue (Ad)', {
        fontSize: '18px', fontFamily: 'Arial Black, sans-serif', color: '#0A0E27'
      }).setOrigin(0.5).disableInteractive();
      contBtn.on('pointerdown', () => {
        AdManager.showRewarded((granted) => {
          if (granted) {
            this.scene.start('GameScene', { continueFrom: this.stageReached, score: this.finalScore });
          }
        });
      });
      btnY += 65;
    }

    // Play Again
    const playBtn = this.add.rectangle(cx, btnY, 200, 48, COLORS.primary, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, btnY, 'Play Again', {
      fontSize: '20px', fontFamily: 'Arial Black, sans-serif', color: '#0A0E27'
    }).setOrigin(0.5).disableInteractive();
    playBtn.on('pointerdown', () => {
      AdManager.resetForNewGame();
      AdManager.onGameOver();
      if (AdManager.shouldShowInterstitial()) {
        AdManager.showInterstitial(() => this.scene.start('GameScene'));
      } else {
        this.scene.start('GameScene');
      }
    });

    // Menu
    const menuBtn = this.add.rectangle(cx, btnY + 60, 140, 40, COLORS.platform, 0.8)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, btnY + 60, 'Menu', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: COLORS_HEX.uiText
    }).setOrigin(0.5).disableInteractive();
    menuBtn.on('pointerdown', () => { this.scene.start('MenuScene'); });
  }
}

// Storage utilities
const StorageUtil = {
  get(key, defaultVal) {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : defaultVal; }
    catch { return defaultVal; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
  getSettings() {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.settings);
      return s ? JSON.parse(s) : { sound: true };
    } catch { return { sound: true }; }
  }
};
