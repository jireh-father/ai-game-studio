// Torque Tower - UI Scenes
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0D1117);

    // Title with drop-in animation
    const titleChars = 'TORQUE TOWER'.split('');
    titleChars.forEach((ch, i) => {
      const t = this.add.text(w / 2 - 100 + i * 17, h * 0.25, ch, {
        fontSize: '28px', fontFamily: 'Courier New', fill: COLORS.accent, fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({
        targets: t, alpha: 1, y: h * 0.28,
        duration: 300, delay: i * 60, ease: 'Back.easeOut'
      });
    });

    // Subtitle
    this.add.text(w / 2, h * 0.36, 'Spin. Stack. Survive.', {
      fontSize: '13px', fontFamily: 'Courier New', fill: '#8899AA'
    }).setOrigin(0.5);

    // Best score
    const best = window.GameState ? window.GameState.highScore : 0;
    this.add.text(w / 2, h * 0.42, 'BEST: ' + best, {
      fontSize: '16px', fontFamily: 'Courier New', fill: COLORS.hudText
    }).setOrigin(0.5);

    // Animated block preview
    const previewBlock = this.add.image(w / 2, h * 0.52, 'standard');
    this.tweens.add({ targets: previewBlock, angle: 360, duration: 4000, repeat: -1 });

    // Play button
    const playBtn = this.add.rectangle(w / 2, h * 0.66, 240, 50, 0x00D4FF).setInteractive({ useHandCursor: true });
    const playTxt = this.add.text(w / 2, h * 0.66, 'PLAY', {
      fontSize: '22px', fontFamily: 'Courier New', fill: '#0D1117', fontStyle: 'bold'
    }).setOrigin(0.5);
    playTxt.disableInteractive();

    playBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 13, 17, 23);
      this.time.delayedCall(200, () => {
        this.scene.stop('MenuScene');
        this.scene.start('GameScene');
      });
    });

    // How to Play button
    const helpBtn = this.add.rectangle(w / 2, h * 0.76, 240, 40, 0x2C3E50).setInteractive({ useHandCursor: true });
    const helpTxt = this.add.text(w / 2, h * 0.76, 'HOW TO PLAY', {
      fontSize: '16px', fontFamily: 'Courier New', fill: COLORS.hudText
    }).setOrigin(0.5);
    helpTxt.disableInteractive();

    helpBtn.on('pointerdown', () => {
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Sound toggle
    const soundOn = window.GameState ? window.GameState.soundEnabled : true;
    const soundTxt = this.add.text(w - 20, 20, soundOn ? 'SND:ON' : 'SND:OFF', {
      fontSize: '11px', fontFamily: 'Courier New', fill: '#8899AA'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    soundTxt.on('pointerdown', () => {
      if (window.GameState) {
        window.GameState.soundEnabled = !window.GameState.soundEnabled;
        soundTxt.setText(window.GameState.soundEnabled ? 'SND:ON' : 'SND:OFF');
        localStorage.setItem('torque-tower-sound', window.GameState.soundEnabled);
      }
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.stageReached = data.stage || 1;
    this.blocksLanded = data.blocks || 0;
  }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w / 2, h / 2, w, h, 0x1A1F2E, 0.92);

    // Title
    const title = this.add.text(w / 2, h * 0.18, 'TOWER\nCOLLAPSED', {
      fontSize: '28px', fontFamily: 'Courier New', fill: COLORS.badFlash, fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, x: w / 2 - 3, duration: 50, yoyo: true, repeat: 5 });

    // Score
    const scoreText = this.add.text(w / 2, h * 0.35, this.finalScore.toString(), {
      fontSize: '42px', fontFamily: 'Courier New', fill: COLORS.accent, fontStyle: 'bold'
    }).setOrigin(0.5).setScale(0);
    this.tweens.add({ targets: scoreText, scale: 1, duration: 400, ease: 'Back.easeOut', delay: 300 });

    // High score check
    const isNewRecord = this.finalScore > (window.GameState ? window.GameState.highScore : 0);
    if (isNewRecord && window.GameState) {
      window.GameState.highScore = this.finalScore;
      localStorage.setItem('torque-tower-high', this.finalScore);
    }
    if (isNewRecord && this.finalScore > 0) {
      const record = this.add.text(w / 2, h * 0.43, 'NEW RECORD!', {
        fontSize: '18px', fontFamily: 'Courier New', fill: '#FFD700', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({ targets: record, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });
    }

    // Stats
    this.add.text(w / 2, h * 0.52, 'REACHED STAGE ' + this.stageReached, {
      fontSize: '14px', fontFamily: 'Courier New', fill: COLORS.hudText
    }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.57, 'STACKED ' + this.blocksLanded + ' BLOCKS', {
      fontSize: '14px', fontFamily: 'Courier New', fill: '#8899AA'
    }).setOrigin(0.5);

    // Play Again
    const retryBtn = this.add.rectangle(w / 2, h * 0.70, 240, 50, 0x00D4FF).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.70, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'Courier New', fill: '#0D1117', fontStyle: 'bold'
    }).setOrigin(0.5).disableInteractive();

    retryBtn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });

    // Menu button
    const menuBtn = this.add.rectangle(w / 2, h * 0.80, 240, 40, 0x2C3E50).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.80, 'MENU', {
      fontSize: '16px', fontFamily: 'Courier New', fill: COLORS.hudText
    }).setOrigin(0.5).disableInteractive();

    menuBtn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    if (window.GameState) window.GameState.gamesPlayed++;
    AdManager.trackGameOver();
  }
}
