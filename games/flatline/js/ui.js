// Flatline - MenuScene & GameOverScene

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.background);

    // Background grid
    const grid = this.add.graphics();
    grid.lineStyle(0.5, COLORS.gridLine, 0.3);
    for (let y = 0; y < h; y += 30) grid.lineBetween(0, y, w, y);
    for (let x = 0; x < w; x += 72) grid.lineBetween(x, 0, x, h);

    // Idle ECG animation
    this.ecgGraphics = this.add.graphics();
    this.ecgOffset = 0;
    this.ecgY = h / 2 - 20;

    // Title
    this.add.text(w / 2, h / 2 - 120, 'FLATLINE', {
      fontSize: '42px', fontFamily: 'monospace', color: '#00FF7F',
      fontStyle: 'bold', letterSpacing: 8
    }).setOrigin(0.5);

    this.add.text(w / 2, h / 2 - 75, 'Keep the heart alive', {
      fontSize: '13px', fontFamily: 'monospace', color: '#80FFBB'
    }).setOrigin(0.5);

    this.add.text(w / 2, h / 2 - 50, 'BEST: ' + (GameState.highScore || 0), {
      fontSize: '14px', fontFamily: 'monospace', color: '#E8F4F8', alpha: 0.6
    }).setOrigin(0.5);

    // Play button
    const playBg = this.add.rectangle(w / 2, h / 2 + 30, 240, 64, 0x00FF7F)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h / 2 + 30, 'PLAY', {
      fontSize: '26px', fontFamily: 'monospace', color: '#050A0E', fontStyle: 'bold'
    }).setOrigin(0.5);
    playBg.on('pointerdown', () => {
      GameState.reset();
      AdManager.resetForNewGame();
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
      this.scene.start('HUDScene');
    });
    this.tweens.add({
      targets: playBg, scaleX: 1.03, scaleY: 1.03,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.InOut'
    });

    // Help button
    const helpBg = this.add.rectangle(40, 40, 44, 44, 0x0A1520)
      .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x00FF7F);
    this.add.text(40, 40, '?', {
      fontSize: '22px', fontFamily: 'monospace', color: '#00FF7F'
    }).setOrigin(0.5);
    helpBg.on('pointerdown', () => {
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Sound toggle
    this.soundOn = GameState.settings.sound;
    const soundBtn = this.add.text(w - 40, 40, this.soundOn ? 'SND' : 'MUTE', {
      fontSize: '11px', fontFamily: 'monospace', color: '#E8F4F8'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    soundBtn.on('pointerdown', () => {
      this.soundOn = !this.soundOn;
      GameState.settings.sound = this.soundOn;
      soundBtn.setText(this.soundOn ? 'SND' : 'MUTE');
    });
  }

  update() {
    if (!this.ecgGraphics) return;
    this.ecgOffset += 0.8;
    this.ecgGraphics.clear();
    this.ecgGraphics.lineStyle(2.5, COLORS.ecgNormal, 0.5);
    this.ecgGraphics.beginPath();
    const w = this.scale.width;
    for (let x = 0; x < w; x++) {
      const phase = (x + this.ecgOffset) % 200;
      let y = this.ecgY;
      if (phase > 80 && phase < 90) y -= (phase - 80) * 2;
      else if (phase >= 90 && phase < 100) y -= 20 + (phase - 90) * 6;
      else if (phase >= 100 && phase < 110) y += 40 - (110 - phase) * 3;
      else if (phase >= 110 && phase < 120) y -= (phase - 110) * 1.5;
      if (x === 0) this.ecgGraphics.moveTo(x, y);
      else this.ecgGraphics.lineTo(x, y);
    }
    this.ecgGraphics.strokePath();
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.background, 0.95);

    // Flatline red line animation
    const flatGfx = this.add.graphics();
    this.tweens.addCounter({
      from: 0, to: w, duration: FLATLINE_ANIM_MS, ease: 'Linear',
      onUpdate: (tween) => {
        flatGfx.clear();
        flatGfx.lineStyle(3, COLORS.flatlineRed, 0.9);
        flatGfx.lineBetween(0, h / 2 - 40, tween.getValue(), h / 2 - 40);
      }
    });

    this.add.text(w / 2, h / 2 - 80, 'FLATLINE', {
      fontSize: '36px', fontFamily: 'monospace', color: '#FF0000', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(w / 2, h / 2 - 10, 'STAGE REACHED: ' + GameState.stage, {
      fontSize: '14px', fontFamily: 'monospace', color: '#E8F4F8'
    }).setOrigin(0.5);

    const scoreText = this.add.text(w / 2, h / 2 + 30, '' + GameState.score, {
      fontSize: '38px', fontFamily: 'monospace', color: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.tweens.add({
      targets: scoreText, scaleX: 1.15, scaleY: 1.15,
      duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut'
    });

    if (GameState.score > GameState.highScore) {
      GameState.highScore = GameState.score;
      localStorage.setItem('flatline_high_score', GameState.highScore);
      const badge = this.add.text(w / 2, h / 2 + 65, 'NEW BEST!', {
        fontSize: '16px', fontFamily: 'monospace', color: '#FFD700', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({ targets: badge, alpha: 0.4, duration: 400, yoyo: true, repeat: -1 });
    }

    let btnY = h / 2 + 110;

    if (AdManager.canDefib()) {
      const defibBg = this.add.rectangle(w / 2, btnY, 260, 50, 0x00FF7F)
        .setInteractive({ useHandCursor: true });
      this.add.text(w / 2, btnY, 'DEFIBRILLATE (AD)', {
        fontSize: '15px', fontFamily: 'monospace', color: '#050A0E', fontStyle: 'bold'
      }).setOrigin(0.5);
      defibBg.on('pointerdown', () => {
        AdManager.showDefib(() => {
          GameState.strikes = Math.max(0, GameState.strikes - 1);
          this.scene.stop('GameOverScene');
          this.scene.stop('GameScene');
          this.scene.start('GameScene');
          this.scene.start('HUDScene');
        });
      });
      this.tweens.add({ targets: defibBg, fillColor: 0xFF3333, duration: 600, yoyo: true, repeat: -1 });
      btnY += 60;
    }

    const playBg = this.add.rectangle(w / 2, btnY, 240, 50, 0x00FF7F)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'PLAY AGAIN', {
      fontSize: '18px', fontFamily: 'monospace', color: '#050A0E', fontStyle: 'bold'
    }).setOrigin(0.5);
    playBg.on('pointerdown', () => {
      GameState.reset();
      AdManager.resetForNewGame();
      this.scene.stop('GameOverScene');
      this.scene.stop('HUDScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
      this.scene.start('HUDScene');
    });
    btnY += 56;

    const menuBg = this.add.rectangle(w / 2, btnY, 140, 44, 0x0A1520)
      .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0xE8F4F8);
    this.add.text(w / 2, btnY, 'MENU', {
      fontSize: '14px', fontFamily: 'monospace', color: '#E8F4F8'
    }).setOrigin(0.5);
    menuBg.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.stop('HUDScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    AdManager.onGameOver();
  }
}
