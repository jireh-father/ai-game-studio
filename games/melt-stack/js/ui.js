// Melt Stack - UI Scenes
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w / 2, h / 2, w, h, PALETTE.bg);

    // Animated falling blocks in background
    this.bgBlocks = [];
    for (let i = 0; i < 6; i++) {
      const bx = 40 + Math.random() * (w - 80);
      const by = Math.random() * h;
      const color = BLOCK_COLORS[i % BLOCK_COLORS.length];
      const block = this.add.rectangle(bx, by, 50 + Math.random() * 40, 20, color, 0.3);
      this.bgBlocks.push({ obj: block, speed: 20 + Math.random() * 30 });
    }

    // Title
    this.add.text(w / 2, h * 0.28, 'MELT', {
      fontSize: '72px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setShadow(0, 3, '#FF9500', 8);
    this.add.text(w / 2, h * 0.28 + 65, 'STACK', {
      fontSize: '72px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FF9500'
    }).setOrigin(0.5).setShadow(0, 3, '#FF3B00', 8);

    // Play button
    const playBg = this.add.rectangle(w / 2, h * 0.55, 200, 60, PALETTE.buttonBg, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.55, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    playBg.on('pointerdown', () => {
      GameState.reset();
      AdsManager.resetForNewGame();
      this.scene.start('GameScene');
    });

    // Best score
    this.add.text(w / 2, h * 0.55 + 50, 'BEST: ' + GameState.bestScore, {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: '#888888'
    }).setOrigin(0.5);

    // Help button
    const helpBg = this.add.circle(44, h - 36, 22, 0x333333).setInteractive({ useHandCursor: true });
    this.add.text(44, h - 36, '?', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    helpBg.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Sound toggle
    this.soundIcon = this.add.text(w - 44, h - 36, GameState.soundEnabled ? 'SND' : 'OFF', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    const soundBg = this.add.circle(w - 44, h - 36, 22, 0x333333).setInteractive({ useHandCursor: true }).setDepth(-1);
    soundBg.on('pointerdown', () => {
      GameState.soundEnabled = !GameState.soundEnabled;
      localStorage.setItem('melt-stack_settings.sound', GameState.soundEnabled.toString());
      this.soundIcon.setText(GameState.soundEnabled ? 'SND' : 'OFF');
    });
  }

  update(time, delta) {
    this.bgBlocks.forEach(b => {
      b.obj.y += b.speed * delta / 1000;
      if (b.obj.y > GAME_HEIGHT + 20) b.obj.y = -20;
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
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w / 2, h / 2, w, h, PALETTE.bg, 0.95);

    // MELTED title
    this.add.text(w / 2, h * 0.18, 'MELTED', {
      fontSize: '56px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FF9500'
    }).setOrigin(0.5).setShadow(0, 2, '#FF3B00', 4);

    // Score
    const scoreText = this.add.text(w / 2, h * 0.32, this.finalScore.toString(), {
      fontSize: '64px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setScale(0);
    this.tweens.add({ targets: scoreText, scale: 1, duration: 400, ease: 'Back.easeOut' });

    // New best banner
    if (this.isNewBest) {
      const banner = this.add.text(w / 2, h * 0.32 + 50, 'NEW BEST!', {
        fontSize: '24px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFE66D'
      }).setOrigin(0.5);
      this.tweens.add({ targets: banner, scale: { from: 0.8, to: 1.1 }, duration: 600, yoyo: true, repeat: -1 });
    }

    // Stage reached
    this.add.text(w / 2, h * 0.45, 'Stage Reached: ' + this.finalStage, {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', color: '#FFFFFF'
    }).setOrigin(0.5);

    // Revive button (rewarded ad)
    if (AdsManager.canRevive()) {
      const revBg = this.add.rectangle(w / 2, h * 0.56, 260, 52, 0xFFD700).setInteractive({ useHandCursor: true });
      this.add.text(w / 2, h * 0.56, 'WATCH AD - ADD 5 BLOCKS', {
        fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#333333'
      }).setOrigin(0.5);
      revBg.on('pointerdown', () => {
        AdsManager.reviveUsed = true;
        AdsManager.showRewarded(() => {
          this.scene.stop();
          this.scene.get('GameScene').revive();
          this.scene.resume('GameScene');
        });
      });
    }

    // Play Again
    const playBg = this.add.rectangle(w / 2, h * 0.67, 200, 52, PALETTE.buttonBg).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.67, 'PLAY AGAIN', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    playBg.on('pointerdown', () => {
      AdsManager.onGameOver();
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      GameState.reset();
      AdsManager.resetForNewGame();
      this.scene.start('GameScene');
    });

    // Menu
    const menuBg = this.add.rectangle(w / 2, h * 0.77, 200, 52, 0x000000, 0).setInteractive({ useHandCursor: true });
    menuBg.setStrokeStyle(2, 0xFFFFFF);
    this.add.text(w / 2, h * 0.77, 'MENU', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    menuBg.on('pointerdown', () => {
      AdsManager.onGameOver();
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
  }
}
