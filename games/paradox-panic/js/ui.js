// Paradox Panic - UI Scenes (Menu, GameOver)
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.cameras.main.setBackgroundColor(COLORS.background);

    // Title
    this.add.text(w / 2, h * 0.18, 'PARADOX\nPANIC', {
      fontSize: '48px', fontFamily: 'monospace', color: COLORS.paradoxHex,
      fontStyle: 'bold', align: 'center', lineSpacing: 8
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(w / 2, h * 0.35, 'Can you spot the trap?', {
      fontSize: '16px', fontFamily: 'monospace', color: '#FFFFFF'
    }).setOrigin(0.5);

    // High score
    this.add.text(w / 2, h * 0.42, `BEST: ${GameState.highScore}`, {
      fontSize: '18px', fontFamily: 'monospace', color: COLORS.comboGoldHex, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.rectangle(w / 2, h * 0.55, 240, 64, COLORS.trueHint, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.55, 'PLAY', {
      fontSize: '28px', fontFamily: 'monospace', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      AudioManager.resume();
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
    });

    // Pulsing play button
    this.tweens.add({
      targets: playBtn, scaleX: 1.05, scaleY: 1.05,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Help button
    const helpBtn = this.add.rectangle(32, h - 40, 50, 50, COLORS.uiBg)
      .setInteractive({ useHandCursor: true });
    this.add.text(32, h - 40, '?', {
      fontSize: '28px', fontFamily: 'monospace', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    helpBtn.on('pointerdown', () => {
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
      this.scene.pause();
    });

    // Sound toggle
    const soundIcon = this.add.text(w - 32, 28, AudioManager.muted ? 'X' : '♪', {
      fontSize: '24px', fontFamily: 'monospace', color: '#FFFFFF'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    soundIcon.on('pointerdown', () => {
      AudioManager.muted = !AudioManager.muted;
      soundIcon.setText(AudioManager.muted ? 'X' : '♪');
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalStage = data.stage || 1;
    this.deathCause = data.cause || 'STRIKES';
  }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.cameras.main.setBackgroundColor(COLORS.background);

    // Game Over heading with shake
    const goText = this.add.text(w / 2, h * 0.12, 'GAME OVER', {
      fontSize: '40px', fontFamily: 'monospace', color: COLORS.strikeHex, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.tweens.add({ targets: goText, x: goText.x - 6, duration: 40, yoyo: true, repeat: 5 });

    // Cause
    this.add.text(w / 2, h * 0.22, this.deathCause === 'OVERFLOW' ? 'STACK OVERFLOW!' : '3 STRIKES!', {
      fontSize: '16px', fontFamily: 'monospace', color: '#FFFFFF'
    }).setOrigin(0.5);

    // Score with punch
    const scoreNum = this.add.text(w / 2, h * 0.32, `${this.finalScore}`, {
      fontSize: '56px', fontFamily: 'monospace', color: COLORS.comboGoldHex, fontStyle: 'bold'
    }).setOrigin(0.5).setScale(0.5);
    this.tweens.add({ targets: scoreNum, scaleX: 1.1, scaleY: 1.1, duration: 300, yoyo: true, ease: 'Back.easeOut' });

    // Stage
    this.add.text(w / 2, h * 0.42, `Reached Stage ${this.finalStage}`, {
      fontSize: '20px', fontFamily: 'monospace', color: '#FFFFFF'
    }).setOrigin(0.5);

    // New record
    if (GameState.newRecord) {
      const recordText = this.add.text(w / 2, h * 0.50, 'NEW RECORD!', {
        fontSize: '24px', fontFamily: 'monospace', color: COLORS.comboGoldHex, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({ targets: recordText, scaleX: 1.15, scaleY: 1.15, duration: 500, yoyo: true, repeat: -1 });
      // Sparkle particles
      for (let i = 0; i < 20; i++) {
        const px = w / 2 + (Math.random() - 0.5) * 200;
        const py = h * 0.50;
        const p = this.add.image(px, py, 'particleGold').setScale(1.5).setDepth(90);
        this.tweens.add({
          targets: p, y: py - 40 - Math.random() * 60, alpha: 0, scale: 0,
          duration: 600, delay: Math.random() * 300, onComplete: () => p.destroy()
        });
      }
    }

    let btnY = h * 0.58;

    // Continue ad button (once per session)
    if (!GameState.continueUsed) {
      const contBtn = this.add.rectangle(w / 2, btnY, 280, 52, COLORS.paradox)
        .setInteractive({ useHandCursor: true });
      this.add.text(w / 2, btnY, 'WATCH AD TO CONTINUE', {
        fontSize: '15px', fontFamily: 'monospace', color: '#FFFFFF', fontStyle: 'bold'
      }).setOrigin(0.5);
      contBtn.on('pointerdown', () => {
        AdsManager.showContinueAd(() => {
          GameState.continueUsed = true;
          GameState.strikes = 1;
          while (GameState.cardStackCount > 3) GameState.cardStackCount--;
          this.scene.stop('GameOverScene');
          this.scene.start('GameScene');
        });
      });
      btnY += 65;
    }

    // Play again
    const playBtn = this.add.rectangle(w / 2, btnY, 240, 52, COLORS.trueHint)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'monospace', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.start('GameScene');
    });
    btnY += 60;

    // Menu
    const menuBtn = this.add.rectangle(w / 2, btnY, 180, 48, COLORS.uiBg)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'MENU', {
      fontSize: '18px', fontFamily: 'monospace', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.start('MenuScene');
    });

    // Interstitial check
    AdsManager.onGameOver(GameState.sessionDeaths);
  }
}
