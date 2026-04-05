class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    this.add.rectangle(cx, height / 2, width, height, COLORS.BG);

    // Title
    this.add.text(cx, 100, 'DIGIT', { fontFamily: "'Courier New', monospace", fontSize: '48px', fontStyle: 'bold', color: '#00D4FF' }).setOrigin(0.5);
    this.add.text(cx, 155, 'DROP', { fontFamily: "'Courier New', monospace", fontSize: '48px', fontStyle: 'bold', color: '#E8F4FD' }).setOrigin(0.5);

    // Falling digit decoration
    for (let i = 0; i < 5; i++) {
      const dx = 60 + Math.random() * (width - 120);
      const d = this.add.text(dx, -40 - Math.random() * 200, String(Math.floor(Math.random() * 10)), {
        fontFamily: "'Courier New', monospace", fontSize: '28px', fontStyle: 'bold', color: '#2E5C8A'
      }).setOrigin(0.5).setAlpha(0.3);
      this.tweens.add({ targets: d, y: height + 40, duration: 4000 + Math.random() * 3000, repeat: -1, delay: i * 600 });
    }

    // Play button
    const playBtn = this.add.rectangle(cx, 280, 220, 56, 0x1C2D40).setStrokeStyle(2, 0x00D4FF).setInteractive({ useHandCursor: true });
    this.add.text(cx, 280, 'PLAY', { fontFamily: "'Courier New', monospace", fontSize: '24px', fontStyle: 'bold', color: '#00D4FF' }).setOrigin(0.5).setInteractive().on('pointerdown', () => playBtn.emit('pointerdown'));

    playBtn.on('pointerdown', () => {
      SoundFX.uiClick();
      resetGameState();
      ADS.resetSession();
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
    });
    playBtn.on('pointerover', () => playBtn.setFillStyle(0x2E5C8A));
    playBtn.on('pointerout', () => playBtn.setFillStyle(0x1C2D40));

    // How to play
    const helpBtn = this.add.rectangle(cx, 355, 180, 42, 0x1C2D40).setStrokeStyle(1, 0x2E5C8A).setInteractive({ useHandCursor: true });
    this.add.text(cx, 355, 'HOW TO PLAY', { fontFamily: "'Courier New', monospace", fontSize: '14px', color: '#8BAFC8' }).setOrigin(0.5).setInteractive().on('pointerdown', () => helpBtn.emit('pointerdown'));

    helpBtn.on('pointerdown', () => {
      SoundFX.uiClick();
      this.scene.pause('MenuScene');
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // High score
    loadHighScore();
    this.add.text(cx, 430, 'HIGH SCORE', { fontFamily: "'Courier New', monospace", fontSize: '12px', color: '#2E5C8A' }).setOrigin(0.5);
    this.add.text(cx, 450, String(GameState.highScore), { fontFamily: "'Courier New', monospace", fontSize: '22px', fontStyle: 'bold', color: '#FFD700' }).setOrigin(0.5);

    // Sound toggle
    this.soundIcon = this.add.text(width - 36, 20, GameState.soundEnabled ? 'SND' : 'OFF', {
      fontFamily: "'Courier New', monospace", fontSize: '11px', color: GameState.soundEnabled ? '#00D4FF' : '#555'
    }).setOrigin(0.5).setInteractive();
    this.soundIcon.on('pointerdown', () => {
      GameState.soundEnabled = !GameState.soundEnabled;
      this.soundIcon.setText(GameState.soundEnabled ? 'SND' : 'OFF');
      this.soundIcon.setColor(GameState.soundEnabled ? '#00D4FF' : '#555');
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.formedNumber = data.formedNumber || 0;
    this.targetNumber = data.targetNumber || 0;
    this.stageReached = data.stage || 1;
    this.isNewHigh = data.isNewHigh || false;
  }

  create() {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    this.add.rectangle(cx, height / 2, width, height, COLORS.BG, 0.95);

    this.add.text(cx, 60, 'GAME OVER', { fontFamily: "'Courier New', monospace", fontSize: '32px', fontStyle: 'bold', color: '#FF3B3B' }).setOrigin(0.5);

    this.add.text(cx, 120, 'Stage ' + this.stageReached, { fontFamily: "'Courier New', monospace", fontSize: '16px', color: '#8BAFC8' }).setOrigin(0.5);

    // Score with count-up
    this.add.text(cx, 170, 'SCORE', { fontFamily: "'Courier New', monospace", fontSize: '14px', color: '#8BAFC8' }).setOrigin(0.5);
    const scoreTxt = this.add.text(cx, 200, '0', { fontFamily: "'Courier New', monospace", fontSize: '36px', fontStyle: 'bold', color: COLORS.SCORE }).setOrigin(0.5);

    this.tweens.addCounter({ from: 0, to: this.finalScore, duration: 800, onUpdate: (t) => scoreTxt.setText(String(Math.floor(t.getValue()))) });

    if (this.isNewHigh) {
      this.time.delayedCall(900, () => {
        const nh = this.add.text(cx, 240, 'NEW HIGH SCORE!', { fontFamily: "'Courier New', monospace", fontSize: '16px', fontStyle: 'bold', color: '#FFD700' }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: nh, alpha: 1, scaleX: 1.2, scaleY: 1.2, duration: 300, yoyo: true, repeat: 1 });
      });
    }

    // High score display
    this.add.text(cx, 275, 'Best: ' + GameState.highScore, { fontFamily: "'Courier New', monospace", fontSize: '14px', color: '#FFD700' }).setOrigin(0.5);

    // Buttons
    const retryBtn = this.add.rectangle(cx, 360, 200, 50, 0x1C2D40).setStrokeStyle(2, 0x00D4FF).setInteractive({ useHandCursor: true });
    this.add.text(cx, 360, 'PLAY AGAIN', { fontFamily: "'Courier New', monospace", fontSize: '18px', fontStyle: 'bold', color: '#00D4FF' }).setOrigin(0.5).setInteractive().on('pointerdown', () => retryBtn.emit('pointerdown'));

    retryBtn.on('pointerdown', () => {
      SoundFX.uiClick();
      resetGameState();
      ADS.resetSession();
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });

    const menuBtn = this.add.rectangle(cx, 425, 160, 42, 0x1C2D40).setStrokeStyle(1, 0x2E5C8A).setInteractive({ useHandCursor: true });
    this.add.text(cx, 425, 'MENU', { fontFamily: "'Courier New', monospace", fontSize: '14px', color: '#8BAFC8' }).setOrigin(0.5).setInteractive().on('pointerdown', () => menuBtn.emit('pointerdown'));

    menuBtn.on('pointerdown', () => {
      SoundFX.uiClick();
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    ADS.onGameOver();
    if (ADS.canShowInterstitial()) ADS.showInterstitial();
  }
}
