// Stack Quake - UI Scenes (Menu, GameOver, Pause)

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = GAME_WIDTH;
    this.add.rectangle(W / 2, GAME_HEIGHT / 2, W, GAME_HEIGHT, 0x0D0D0D);

    // Title with subtle animation
    const title = this.add.text(W / 2, 160, 'STACK\nQUAKE', {
      fontSize: '56px', fontFamily: 'Arial', fill: COLORS.UI_TEXT, fontStyle: 'bold', align: 'center', lineSpacing: 4
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, y: 165, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Subtitle
    this.add.text(W / 2, 220, 'HOW HIGH CAN YOU BUILD?', { fontSize: '14px', fill: '#888888' }).setOrigin(0.5);

    // Decorative shaking blocks
    const deco1 = this.add.rectangle(W / 2, 280, 120, 16, 0x3A86FF);
    const deco2 = this.add.rectangle(W / 2, 264, 100, 16, 0x3A86FF);
    const deco3 = this.add.rectangle(W / 2, 248, 80, 16, 0x3A86FF);
    [deco1, deco2, deco3].forEach((d, i) => {
      this.tweens.add({ targets: d, x: d.x + 3 + i, duration: 300 + i * 50, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    // PLAY button
    this.createButton(W / 2, 340, 200, 56, 0xE84855, 'PLAY', '24px', () => {
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
    });

    // HOW TO PLAY button
    this.createButton(W / 2, 410, 200, 44, 0x1A1A2E, '? HOW TO PLAY', '16px', () => {
      this.scene.pause('MenuScene');
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // HIGH SCORE display
    const hs = GameState.highScore;
    this.createButton(W / 2, 466, 200, 44, 0x1A1A2E, 'BEST: ' + hs.toLocaleString(), '16px', null);

    // Sound toggle
    const soundTxt = this.add.text(W - 40, 20, GameState.settings.sound ? 'SND' : 'MUTE', {
      fontSize: '14px', fill: COLORS.UI_TEXT
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    soundTxt.on('pointerdown', () => {
      GameState.settings.sound = !GameState.settings.sound;
      soundTxt.setText(GameState.settings.sound ? 'SND' : 'MUTE');
      GameState.save();
    });
  }

  createButton(x, y, w, h, color, label, fontSize, callback) {
    const bg = this.add.rectangle(x, y, w, h, color).setOrigin(0.5);
    const txt = this.add.text(x, y, label, { fontSize: fontSize, fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5);
    if (callback) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', callback);
      txt.disableInteractive();
    }
    return { bg, txt };
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalFloor = data.floor || 0;
    this.isNewBest = data.isNewBest || false;
    this.lastWidth = data.lastWidth || PLATFORM_START_WIDTH;
  }

  create() {
    const W = GAME_WIDTH;
    // Dark overlay
    this.add.rectangle(W / 2, GAME_HEIGHT / 2, W, GAME_HEIGHT, 0x000000, 0.7);

    // GAME OVER text
    const goText = this.add.text(W / 2, 140, 'GAME OVER', {
      fontSize: '40px', fontFamily: 'Arial', fill: COLORS.UI_TEXT, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.tweens.add({ targets: goText, scaleX: 1.05, scaleY: 1.05, duration: 600, yoyo: true, repeat: -1 });

    // Floor reached
    this.add.text(W / 2, 200, 'FLOOR ' + this.finalFloor, { fontSize: '22px', fill: COLORS.TOWER_HIGHLIGHT, fontStyle: 'bold' }).setOrigin(0.5);

    // Score with count-up
    const scoreText = this.add.text(W / 2, 260, '0', {
      fontSize: '36px', fontFamily: 'Arial', fill: COLORS.PERFECT_FLASH, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.tweens.addCounter({
      from: 0, to: this.finalScore, duration: 800,
      onUpdate: (t) => { scoreText.setText(Math.round(t.getValue()).toLocaleString()); }
    });

    // New best
    if (this.isNewBest) {
      const bestTxt = this.add.text(W / 2, 300, 'NEW BEST!', {
        fontSize: '20px', fill: COLORS.PERFECT_FLASH, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({ targets: bestTxt, scaleX: 1.2, scaleY: 1.2, duration: 400, yoyo: true, repeat: -1 });
    }

    let btnY = 360;

    // Continue with ad (once per session)
    if (AdManager.canContinue()) {
      this.createButton(W / 2, btnY, 200, 52, 0xFFD60A, 'CONTINUE (AD)', '16px', '#000000', () => {
        AdManager.continueUsed = true;
        AdManager.showRewarded(() => {
          this.scene.stop('GameOverScene');
          this.scene.stop('GameScene');
          this.scene.start('GameScene', { continueFrom: this.finalFloor, continueScore: this.finalScore, restoreWidth: Math.max(PLATFORM_MIN_WIDTH + 40, this.lastWidth * 1.3) });
        });
      });
      btnY += 64;
    }

    // Play again
    this.createButton(W / 2, btnY, 200, 52, 0xE84855, 'PLAY AGAIN', '18px', '#FFFFFF', () => {
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });
    btnY += 64;

    // Menu
    this.createButton(W / 2, btnY, 200, 52, 0x1A1A2E, 'MENU', '18px', '#FFFFFF', () => {
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    AdManager.trackGameOver({ score: this.finalScore, floor: this.finalFloor });
  }

  createButton(x, y, w, h, color, label, fontSize, textColor, callback) {
    const bg = this.add.rectangle(x, y, w, h, Phaser.Display.Color.HexStringToColor(typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color.replace('#', '')).color || color).setOrigin(0.5);
    bg.setFillStyle(color);
    const txt = this.add.text(x, y, label, { fontSize: fontSize, fontFamily: 'Arial', fill: textColor, fontStyle: 'bold' }).setOrigin(0.5);
    if (callback) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', callback);
      txt.disableInteractive();
    }
  }
}
