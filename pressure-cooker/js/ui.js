// Pressure Cooker - UI Scenes
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.cameras.main.setBackgroundColor(COLORS.background);

    // Title
    this.add.text(w / 2, h * 0.22, 'PRESSURE\nCOOKER', {
      fontSize: '36px', fontFamily: 'monospace', color: COLORS.hudText,
      fontStyle: 'bold', align: 'center', lineSpacing: 8
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(w / 2, h * 0.36, 'Vent steam. Don\'t explode.', {
      fontSize: '13px', fontFamily: 'monospace', color: COLORS.timerBar
    }).setOrigin(0.5);

    // Animated background chambers
    this.bgChambers = [];
    for (let i = 0; i < 3; i++) {
      const cx = w * 0.25 + i * w * 0.25;
      const cy = h * 0.58;
      const rect = this.add.rectangle(cx, cy, 50, 100, 0x2A3A4A).setStrokeStyle(2, 0x4A6A8A).setAlpha(0.3);
      const fill = this.add.rectangle(cx, cy + 50, 42, 0, 0xF5D76E, 0.4).setOrigin(0.5, 1);
      this.bgChambers.push({ rect, fill, pressure: Math.random() * 40, rate: 5 + Math.random() * 8, maxH: 92 });
    }

    // Play button
    const playBg = this.add.rectangle(w / 2, h * 0.72, 200, 60, 0x00CFFF)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.72, 'PLAY', {
      fontSize: '24px', fontFamily: 'monospace', color: '#0D1A26', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.startGame());
    playBg.on('pointerdown', () => this.startGame());

    // How to Play button
    const helpBg = this.add.rectangle(w / 2, h * 0.82, 180, 50, 0x4A6A8A)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.82, '? HOW TO PLAY', {
      fontSize: '14px', fontFamily: 'monospace', color: COLORS.hudText, fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.showHelp());
    helpBg.on('pointerdown', () => this.showHelp());

    // Best score
    const best = localStorage.getItem('pressure-cooker_high_score') || 0;
    this.add.text(w / 2, h * 0.90, 'BEST: ' + Number(best).toLocaleString(), {
      fontSize: '14px', fontFamily: 'monospace', color: COLORS.timerBar
    }).setOrigin(0.5);
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.bgChambers.forEach(ch => {
      ch.pressure += ch.rate * dt;
      if (ch.pressure >= 100) ch.pressure = 0;
      const fillH = ch.maxH * (ch.pressure / 100);
      ch.fill.setSize(42, fillH);
    });
  }

  startGame() {
    Effects.playClick();
    this.scene.stop('MenuScene');
    this.scene.start('GameScene', { stage: 1, score: 0 });
  }

  showHelp() {
    Effects.playClick();
    this.scene.pause();
    this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalStage = data.stage || 1;
    this.usedContinue = data.usedContinue || false;
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Red tint bg
    this.add.rectangle(w / 2, h / 2, w, h, 0x110000, 0.9);

    // Game Over text with scale-in
    const goText = this.add.text(w / 2, h * 0.2, 'GAME OVER', {
      fontSize: '32px', fontFamily: 'monospace', color: COLORS.dangerText, fontStyle: 'bold'
    }).setOrigin(0.5).setScale(0.3);
    this.tweens.add({ targets: goText, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' });

    // Stage reached
    this.add.text(w * 0.3, h * 0.35, 'STAGE', {
      fontSize: '14px', fontFamily: 'monospace', color: COLORS.timerBar
    }).setOrigin(0.5);
    this.add.text(w * 0.3, h * 0.40, String(this.finalStage), {
      fontSize: '28px', fontFamily: 'monospace', color: COLORS.hudText, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Score
    this.add.text(w * 0.7, h * 0.35, 'SCORE', {
      fontSize: '14px', fontFamily: 'monospace', color: COLORS.timerBar
    }).setOrigin(0.5);
    this.add.text(w * 0.7, h * 0.40, this.finalScore.toLocaleString(), {
      fontSize: '28px', fontFamily: 'monospace', color: COLORS.hudText, fontStyle: 'bold'
    }).setOrigin(0.5);

    // High score check
    const best = parseInt(localStorage.getItem('pressure-cooker_high_score') || '0');
    if (this.finalScore > best) {
      localStorage.setItem('pressure-cooker_high_score', String(this.finalScore));
      const newBest = this.add.text(w / 2, h * 0.50, 'NEW BEST!', {
        fontSize: '20px', fontFamily: 'monospace', color: COLORS.clutchGold, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({ targets: newBest, scaleX: 1.15, scaleY: 1.15, duration: 500, yoyo: true, repeat: -1 });
    }

    let btnY = h * 0.62;

    // Continue button (rewarded ad, once per game)
    if (!this.usedContinue && Ads.isRewardedAvailable()) {
      const contBg = this.add.rectangle(w / 2, btnY, 200, 50, 0xFF8C00)
        .setInteractive({ useHandCursor: true });
      this.add.text(w / 2, btnY, 'CONTINUE?', {
        fontSize: '16px', fontFamily: 'monospace', color: '#0D1A26', fontStyle: 'bold'
      }).setOrigin(0.5);
      contBg.on('pointerdown', () => {
        Ads.showRewarded(() => {
          this.scene.stop('GameOverScene');
          this.scene.stop('GameScene');
          this.scene.start('GameScene', { stage: this.finalStage, score: this.finalScore, continued: true });
        }, () => {});
      });
      btnY += 65;
    }

    // Play Again
    const playBg = this.add.rectangle(w / 2, btnY, 200, 50, 0x00CFFF)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'PLAY AGAIN', {
      fontSize: '16px', fontFamily: 'monospace', color: '#0D1A26', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.retry());
    playBg.on('pointerdown', () => this.retry());
    btnY += 65;

    // Menu
    const menuBg = this.add.rectangle(w / 2, btnY, 200, 50, 0x4A6A8A)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'MENU', {
      fontSize: '16px', fontFamily: 'monospace', color: COLORS.hudText, fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.goMenu());
    menuBg.on('pointerdown', () => this.goMenu());

    Effects.playGameOver();
  }

  retry() {
    Effects.playClick();
    this.scene.stop('GameOverScene');
    this.scene.stop('GameScene');
    this.scene.start('GameScene', { stage: 1, score: 0 });
  }

  goMenu() {
    Effects.playClick();
    this.scene.stop('GameOverScene');
    this.scene.stop('GameScene');
    this.scene.start('MenuScene');
  }
}
