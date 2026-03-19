// ui.js — MenuScene, GameOverScene, HelpScene, PauseOverlay

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w/2, h/2, w, h, 0xF5F5F0);

    // Animated background bubbles
    this.bgBubbles = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < BUBBLES_PER_ROW; c++) {
        const x = c * BUBBLE_CELL + BUBBLE_CELL / 2;
        const y = h - 80 + r * 56;
        const b = this.add.image(x, y, 'bubble_gray').setAlpha(0.3);
        this.bgBubbles.push(b);
      }
    }

    // Title
    this.add.text(w/2, 160, 'BUBBLE WRAP\nBOSS', {
      fontSize: '36px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.HUD_TEXT, align: 'center', lineSpacing: 4
    }).setOrigin(0.5);

    this.add.text(w/2, 240, 'Pop before the deadline!', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif',
      color: COLORS.SUBTITLE
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.rectangle(w/2, 320, 200, 56, 0x1E88E5, 1).setInteractive({ useHandCursor: true });
    this.add.text(w/2, 320, 'PLAY', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.UI_BUTTON_TEXT
    }).setOrigin(0.5);

    playBtn.on('pointerdown', () => {
      this.playClickSound();
      this.cameras.main.fadeOut(300, 245, 245, 240);
      this.time.delayedCall(300, () => {
        this.scene.stop('MenuScene');
        this.scene.start('GameScene');
      });
    });

    // High score
    const hs = window.GameState ? window.GameState.highScore : 0;
    this.add.text(w/2, 390, 'BEST: ' + hs, {
      fontSize: '16px', fontFamily: 'Arial, sans-serif',
      color: COLORS.SUBTITLE
    }).setOrigin(0.5);

    // Help button
    const helpBtn = this.add.rectangle(60, h - 50, 48, 48, 0x000000, 0)
      .setStrokeStyle(2, 0x90A4AE).setInteractive({ useHandCursor: true });
    this.add.text(60, h - 50, '?', {
      fontSize: '24px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.GRAY
    }).setOrigin(0.5);

    helpBtn.on('pointerdown', () => {
      this.playClickSound();
      this.scene.pause('MenuScene');
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    this.cameras.main.fadeIn(300, 245, 245, 240);
  }

  update() {
    // Scroll background bubbles upward slowly
    for (const b of this.bgBubbles) {
      b.y -= 0.3;
      if (b.y < -30) b.y = GAME_HEIGHT + 30;
    }
  }

  playClickSound() {
    if (!this.sys.game.device.audio.webAudio) return;
    try {
      const ctx = this.sound.context;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);
    } catch(e) {}
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.stageReached = data.stage || 1;
    this.isNewBest = data.isNewBest || false;
  }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.7);

    // Game Over text
    this.add.text(w/2, 140, 'GAME OVER', {
      fontSize: '36px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.DEADLINE
    }).setOrigin(0.5);

    // Score
    this.add.text(w/2, 220, this.finalScore.toLocaleString(), {
      fontSize: '48px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.HUD_TEXT
    }).setOrigin(0.5);

    if (this.isNewBest) {
      const bestTxt = this.add.text(w/2, 270, 'NEW BEST!', {
        fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
        color: COLORS.GOLD
      }).setOrigin(0.5).setScale(0.5);
      this.tweens.add({ targets: bestTxt, scale: 1, duration: 300, ease: 'Back.easeOut' });
    }

    this.add.text(w/2, 310, 'Stage Reached: ' + this.stageReached, {
      fontSize: '18px', fontFamily: 'Arial, sans-serif',
      color: COLORS.SUBTITLE
    }).setOrigin(0.5);

    let btnY = 380;

    // Continue button (ad)
    if (AdManager.canContinue()) {
      const contBtn = this.add.rectangle(w/2, btnY, 240, 56, 0xF9A825, 1).setInteractive({ useHandCursor: true });
      this.add.text(w/2, btnY, 'WATCH AD: CONTINUE', {
        fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
        color: '#000000'
      }).setOrigin(0.5);
      contBtn.on('pointerdown', () => {
        AdManager.continueUsed = true;
        AdManager.showRewarded(() => {
          this.scene.stop('GameOverScene');
          this.scene.start('GameScene', { continueGame: true, score: this.finalScore, stage: this.stageReached });
        });
      });
      btnY += 70;
    }

    // Play Again
    const playBtn = this.add.rectangle(w/2, btnY, 200, 52, 0x1E88E5, 1).setInteractive({ useHandCursor: true });
    this.add.text(w/2, btnY, 'PLAY AGAIN', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.UI_BUTTON_TEXT
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });
    btnY += 64;

    // Menu
    const menuBtn = this.add.rectangle(w/2, btnY, 160, 48, 0x616161, 1).setInteractive({ useHandCursor: true });
    this.add.text(w/2, btnY, 'MENU', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.UI_BUTTON_TEXT
    }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
  }
}

class PauseOverlay extends Phaser.Scene {
  constructor() { super('PauseOverlay'); }

  init(data) {
    this.currentScore = data.score || 0;
    this.currentStage = data.stage || 1;
  }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.6);

    this.add.text(w/2, 160, 'PAUSED', {
      fontSize: '32px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.UI_BUTTON_TEXT
    }).setOrigin(0.5);

    this.add.text(w/2, 210, 'Score: ' + this.currentScore + '  Stage: ' + this.currentStage, {
      fontSize: '16px', fontFamily: 'Arial, sans-serif',
      color: COLORS.SUBTITLE
    }).setOrigin(0.5);

    const btns = [
      { label: 'RESUME', y: 280, color: 0x1E88E5, action: () => {
        this.scene.stop('PauseOverlay');
        this.scene.resume('GameScene');
      }},
      { label: 'RESTART', y: 340, color: 0x757575, action: () => {
        this.scene.stop('PauseOverlay');
        this.scene.stop('GameScene');
        this.scene.start('GameScene');
      }},
      { label: '? HELP', y: 400, color: 0x757575, action: () => {
        this.scene.pause('PauseOverlay');
        this.scene.launch('HelpScene', { returnTo: 'PauseOverlay' });
      }},
      { label: 'MENU', y: 460, color: 0x424242, action: () => {
        this.scene.stop('PauseOverlay');
        this.scene.stop('GameScene');
        this.scene.start('MenuScene');
      }}
    ];

    for (const b of btns) {
      const btn = this.add.rectangle(w/2, b.y, 180, 48, b.color, 1).setInteractive({ useHandCursor: true });
      this.add.text(w/2, b.y, b.label, {
        fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
        color: COLORS.UI_BUTTON_TEXT
      }).setOrigin(0.5);
      btn.on('pointerdown', b.action);
    }
  }
}
