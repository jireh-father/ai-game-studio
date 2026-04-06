// Slash Dash - UI Scenes (Menu, GameOver)

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = GAME.CANVAS_W, H = GAME.CANVAS_H;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0A0A0F);
    GameState.loadHighScore();

    // Ambient particles
    for (let i = 0; i < 15; i++) {
      const px = Math.random() * W, py = Math.random() * H;
      const dot = this.add.circle(px, py, 2, 0xFFFFFF, 0.2 + Math.random() * 0.3);
      this.tweens.add({
        targets: dot, y: py - 30 - Math.random() * 40, alpha: 0,
        duration: 2000 + Math.random() * 3000, repeat: -1, yoyo: true
      });
    }

    // Title
    this.add.text(W / 2, 160, 'SLASH DASH', {
      fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.BTN_TEXT,
      stroke: COLORS.SLASH_TRAIL, strokeThickness: 2
    }).setOrigin(0.5);

    const line = this.add.graphics();
    line.lineStyle(3, 0xFFAA33, 0.8);
    line.beginPath(); line.moveTo(W / 2 - 110, 160); line.lineTo(W / 2 + 110, 160); line.strokePath();
    line.setAlpha(0);
    this.tweens.add({ targets: line, alpha: 0.8, duration: 400, delay: 200 });

    this.add.text(W / 2, 210, 'Swipe RED. Hold for BLUE.', {
      fontSize: '14px', fontFamily: 'Arial', color: '#888888'
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.rectangle(W / 2, 320, 220, 64,
      Phaser.Display.Color.HexStringToColor(COLORS.BTN_PRIMARY).color)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, 320, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.BTN_TEXT
    }).setOrigin(0.5);

    playBtn.on('pointerdown', () => {
      Effects.initAudio();
      Effects.playClickSound();
      GameState.reset();
      Ads.init();
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
    });

    // High score
    if (GameState.highScore > 0) {
      this.add.text(W / 2, 375, 'BEST: ' + GameState.highScore, {
        fontSize: '18px', fontFamily: 'Arial', color: COLORS.COMBO_GOLD
      }).setOrigin(0.5);
      this.add.text(W / 2, 398, 'STAGE ' + GameState.stageRecord, {
        fontSize: '14px', fontFamily: 'Arial', color: '#888888'
      }).setOrigin(0.5);
    }

    // Help button
    const helpBtn = this.add.rectangle(W - 36, 36, 48, 48,
      Phaser.Display.Color.HexStringToColor(COLORS.UI_PANEL).color)
      .setStrokeStyle(2, 0xFFFFFF, 0.5).setInteractive({ useHandCursor: true });
    this.add.text(W - 36, 36, '?', {
      fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.BTN_TEXT
    }).setOrigin(0.5);

    helpBtn.on('pointerdown', () => {
      Effects.playClickSound();
      this.scene.pause('MenuScene');
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalStage = data.stage || 1;
    this.isNewBest = data.isNewBest || false;
  }

  create() {
    const W = GAME.CANVAS_W, H = GAME.CANVAS_H;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0A0A0F, 0.85);

    const panelY = H / 2;
    const panel = this.add.rectangle(W / 2, H + 200, W - 40, 380,
      Phaser.Display.Color.HexStringToColor(COLORS.UI_PANEL).color, 0.95)
      .setStrokeStyle(2, 0x333355);
    this.tweens.add({ targets: panel, y: panelY, duration: 400, ease: 'Back.easeOut' });

    const goText = this.add.text(W / 2, H + 200 - 140, 'GAME OVER', {
      fontSize: '38px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.RED_ORB
    }).setOrigin(0.5);
    this.tweens.add({ targets: goText, y: panelY - 140, duration: 400, ease: 'Back.easeOut' });

    const scoreTxt = this.add.text(W / 2, H + 200 - 70, '0', {
      fontSize: '52px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.BTN_TEXT
    }).setOrigin(0.5);
    this.tweens.add({ targets: scoreTxt, y: panelY - 70, duration: 400, ease: 'Back.easeOut' });

    let displayed = 0;
    const step = Math.max(Math.floor(this.finalScore / 30), 1);
    this.time.addEvent({
      delay: 20, repeat: 30, callback: () => {
        displayed = Math.min(displayed + step, this.finalScore);
        scoreTxt.setText(displayed.toString());
      }
    });

    if (this.isNewBest) {
      const nbTxt = this.add.text(W / 2, H + 200 - 30, 'NEW BEST!', {
        fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.COMBO_GOLD
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: nbTxt, y: panelY - 30, duration: 400, ease: 'Back.easeOut' });
      this.time.delayedCall(700, () => {
        nbTxt.setAlpha(1);
        Effects.playHighScoreSound();
        this.tweens.add({ targets: nbTxt, scaleX: 1.2, scaleY: 1.2, duration: 200, yoyo: true });
      });
    }

    const stageTxt = this.add.text(W / 2, H + 200 - 5, 'REACHED STAGE ' + this.finalStage, {
      fontSize: '16px', fontFamily: 'Arial', color: '#AAAAAA'
    }).setOrigin(0.5);
    this.tweens.add({ targets: stageTxt, y: panelY - 5, duration: 400, ease: 'Back.easeOut' });

    const btnW = 200, btnH = 48;
    const makeBtn = (label, yOff, color, cb) => {
      const bg = this.add.rectangle(W / 2, H + 200 + yOff, btnW, btnH,
        Phaser.Display.Color.HexStringToColor(color).color).setInteractive({ useHandCursor: true });
      const tx = this.add.text(W / 2, H + 200 + yOff, label, {
        fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.BTN_TEXT
      }).setOrigin(0.5);
      this.tweens.add({ targets: [bg, tx], y: panelY + yOff, duration: 400, ease: 'Back.easeOut' });
      bg.on('pointerdown', () => { Effects.playClickSound(); cb(); });
    };

    let nextY = 50;
    if (Ads.canContinue()) {
      makeBtn('CONTINUE (AD)', nextY, '#44AA33', () => {
        Ads.continueUsed = true;
        Ads.showRewarded(() => {
          GameState.strikes = 1;
          this.scene.stop('GameOverScene');
          this.scene.stop('GameScene');
          this.scene.start('GameScene', { continued: true });
        });
      });
      nextY += 58;
    }

    makeBtn('PLAY AGAIN', nextY, COLORS.BTN_PRIMARY, () => {
      GameState.reset();
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });

    makeBtn('MENU', nextY + 58, COLORS.UI_PANEL, () => {
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
  }
}
