// Mirror Logic - UI Scenes (Menu, GameOver, Pause overlay)

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0E1A);

    // Title
    this.add.text(w / 2, h * 0.18, 'MIRROR', { fontSize: '48px', fontFamily: 'monospace', color: COLORS.LASER, fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.26, 'LOGIC', { fontSize: '48px', fontFamily: 'monospace', color: COLORS.TARGET, fontStyle: 'bold' }).setOrigin(0.5);

    // Decorative laser line
    const gfx = this.add.graphics();
    gfx.lineStyle(3, 0xFF2244, 0.6);
    gfx.beginPath();
    gfx.moveTo(20, h * 0.32);
    gfx.lineTo(w - 20, h * 0.32);
    gfx.strokePath();

    // Play button
    const playBtn = this.add.rectangle(w / 2, h * 0.48, 200, 64, 0x0A0E1A).setStrokeStyle(3, 0x44FF88).setInteractive({ useHandCursor: true });
    const playTxt = this.add.text(w / 2, h * 0.48, 'PLAY', { fontSize: '28px', fontFamily: 'monospace', color: COLORS.SUCCESS, fontStyle: 'bold' }).setOrigin(0.5);
    this.tweens.add({ targets: playBtn, scaleX: 1.05, scaleY: 1.05, duration: 800, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: playTxt, scaleX: 1.05, scaleY: 1.05, duration: 800, yoyo: true, repeat: -1 });

    playBtn.on('pointerdown', () => {
      GameState.score = 0;
      GameState.stage = 1;
      GameState.streak = 0;
      GameState.mirrorsRemoved = 0;
      this.scene.start('GameScene');
    });

    // Help button
    const helpBtn = this.add.rectangle(w / 2, h * 0.60, 150, 48, 0x0A0E1A).setStrokeStyle(2, 0xC0C8D8).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.60, 'HOW TO PLAY', { fontSize: '16px', fontFamily: 'monospace', color: COLORS.MIRROR }).setOrigin(0.5);
    helpBtn.on('pointerdown', () => {
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
      this.scene.pause();
    });

    // High score
    this.add.text(w / 2, h * 0.76, `HIGH SCORE: ${GameState.highScore}`, { fontSize: '18px', fontFamily: 'monospace', color: COLORS.TARGET_HIT }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.82, `BEST STAGE: ${GameState.highestStage}`, { fontSize: '14px', fontFamily: 'monospace', color: COLORS.UI_TEXT }).setOrigin(0.5);

    // Sound toggle
    const soundTxt = this.add.text(w - 30, 30, GameState.settings.sound ? '🔊' : '🔇', { fontSize: '24px' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    soundTxt.on('pointerdown', () => {
      GameState.settings.sound = !GameState.settings.sound;
      soundTxt.setText(GameState.settings.sound ? '🔊' : '🔇');
      saveSettings();
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.deathType = data.deathType || 'DETONATED!';
    this.finalScore = data.score || 0;
    this.stageReached = data.stage || 1;
  }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0E1A, 0.92);

    // Death text
    const deathTxt = this.add.text(w / 2, h * 0.15, this.deathType, { fontSize: '36px', fontFamily: 'monospace', color: COLORS.LASER, fontStyle: 'bold' }).setOrigin(0.5);
    this.tweens.add({ targets: deathTxt, scaleX: 1.1, scaleY: 1.1, duration: 300, yoyo: true });

    // Score count-up
    const scoreTxt = this.add.text(w / 2, h * 0.30, '0', { fontSize: '42px', fontFamily: 'monospace', color: COLORS.TARGET_HIT, fontStyle: 'bold' }).setOrigin(0.5);
    this.tweens.addCounter({ from: 0, to: this.finalScore, duration: 800, onUpdate: t => scoreTxt.setText(Math.floor(t.getValue()).toString()) });

    // High score check
    const isNew = this.finalScore > GameState.highScore;
    if (isNew) {
      GameState.highScore = this.finalScore;
      GameState.highestStage = Math.max(GameState.highestStage, this.stageReached);
      saveSettings();
      const newBest = this.add.text(w / 2, h * 0.40, 'NEW BEST!', { fontSize: '24px', fontFamily: 'monospace', color: COLORS.TARGET_HIT, fontStyle: 'bold' }).setOrigin(0.5);
      this.tweens.add({ targets: newBest, alpha: { from: 0.7, to: 1 }, duration: 400, yoyo: true, repeat: -1 });
    }

    this.add.text(w / 2, h * 0.47, `Stage ${this.stageReached}`, { fontSize: '20px', fontFamily: 'monospace', color: COLORS.UI_TEXT }).setOrigin(0.5);

    // Continue button (ad)
    if (AdManager.canContinue()) {
      const contBtn = this.add.rectangle(w / 2, h * 0.58, 220, 48, 0x0A0E1A).setStrokeStyle(2, 0xFF8800).setInteractive({ useHandCursor: true });
      this.add.text(w / 2, h * 0.58, 'CONTINUE (AD)', { fontSize: '16px', fontFamily: 'monospace', color: COLORS.TIMER_WARNING }).setOrigin(0.5);
      contBtn.on('pointerdown', () => {
        AdManager.continueUsed = true;
        AdManager.showRewarded(() => {
          this.scene.start('GameScene', { continueStage: this.stageReached });
        });
      });
    }

    // Play Again
    const playBtn = this.add.rectangle(w / 2, h * 0.70, 200, 56, 0x0A0E1A).setStrokeStyle(3, 0x44FF88).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.70, 'PLAY AGAIN', { fontSize: '22px', fontFamily: 'monospace', color: COLORS.SUCCESS, fontStyle: 'bold' }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      GameState.score = 0; GameState.stage = 1; GameState.streak = 0; GameState.mirrorsRemoved = 0;
      AdManager.resetSession();
      this.scene.start('GameScene');
    });

    // Menu
    const menuBtn = this.add.rectangle(w / 2, h * 0.82, 150, 44, 0x0A0E1A).setStrokeStyle(2, 0x666688).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.82, 'MENU', { fontSize: '18px', fontFamily: 'monospace', color: COLORS.UI_TEXT }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => { this.scene.start('MenuScene'); });

    AdManager.onGameOver();
  }
}
