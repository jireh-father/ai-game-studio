// Lag Shot - HUD & Pause Overlay (mixed into GameScene prototype)
const GameHUD = {
  createHUD() {
    this.add.rectangle(GAME_WIDTH / 2, HUD_HEIGHT / 2, GAME_WIDTH, HUD_HEIGHT, 0x0D0D1A).setDepth(30);
    this.scoreText = this.add.text(12, 14, 'Score: ' + this.score, {
      fontSize: '16px', fontFamily: 'monospace', fill: '#FFFFFF'
    }).setDepth(31);
    this.waveText = this.add.text(GAME_WIDTH / 2, 14, 'Wave: ' + this.wave, {
      fontSize: '16px', fontFamily: 'monospace', fill: '#FFFFFF'
    }).setOrigin(0.5, 0).setDepth(31);

    const helpBtn = this.add.circle(GAME_WIDTH - 20, 24, 16, 0x000000, 0)
      .setStrokeStyle(1.5, 0xFFFFFF).setInteractive({ useHandCursor: true }).setDepth(32);
    this.add.text(GAME_WIDTH - 20, 24, '?', {
      fontSize: '16px', fontFamily: 'monospace', fill: '#FFFFFF'
    }).setOrigin(0.5).setDepth(33).disableInteractive();
    helpBtn.on('pointerdown', (p) => {
      p.event.stopPropagation();
      this.togglePause();
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });

    const pauseBtn = this.add.circle(GAME_WIDTH - 56, 24, 16, 0x000000, 0)
      .setStrokeStyle(1.5, 0xFFFFFF).setInteractive({ useHandCursor: true }).setDepth(32);
    this.add.text(GAME_WIDTH - 56, 24, 'II', {
      fontSize: '14px', fontFamily: 'monospace', fill: '#FFFFFF'
    }).setOrigin(0.5).setDepth(33).disableInteractive();
    pauseBtn.on('pointerdown', (p) => {
      p.event.stopPropagation();
      this.togglePause();
    });
  },

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) this.showPauseOverlay();
    else this.hidePauseOverlay();
  },

  showPauseOverlay() {
    this.pauseOverlay = this.add.group();
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setDepth(40);
    const title = this.add.text(GAME_WIDTH / 2, 220, 'PAUSED', {
      fontSize: '28px', fontFamily: 'monospace', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(41);

    const resumeBg = this.add.rectangle(GAME_WIDTH / 2, 300, 180, 48, 0xFFFFFF).setDepth(41).setInteractive({ useHandCursor: true });
    const resumeTxt = this.add.text(GAME_WIDTH / 2, 300, 'RESUME', {
      fontSize: '18px', fontFamily: 'monospace', fill: '#000000'
    }).setOrigin(0.5).setDepth(42);
    resumeTxt.disableInteractive();
    resumeBg.on('pointerdown', () => { audioManager.playButton(); this.togglePause(); });

    const restartBg = this.add.rectangle(GAME_WIDTH / 2, 360, 180, 44, 0x000000, 0)
      .setStrokeStyle(1.5, 0xFFFFFF).setDepth(41).setInteractive({ useHandCursor: true });
    const restartTxt = this.add.text(GAME_WIDTH / 2, 360, 'RESTART', {
      fontSize: '16px', fontFamily: 'monospace', fill: '#FFFFFF'
    }).setOrigin(0.5).setDepth(42);
    restartTxt.disableInteractive();
    restartBg.on('pointerdown', () => {
      audioManager.playButton();
      this.scene.stop();
      this.scene.start('GameScene');
    });

    const menuBg = this.add.rectangle(GAME_WIDTH / 2, 420, 180, 44, 0x000000, 0)
      .setStrokeStyle(1.5, 0xFFFFFF).setDepth(41).setInteractive({ useHandCursor: true });
    const menuTxt = this.add.text(GAME_WIDTH / 2, 420, 'MENU', {
      fontSize: '16px', fontFamily: 'monospace', fill: '#FFFFFF'
    }).setOrigin(0.5).setDepth(42);
    menuTxt.disableInteractive();
    menuBg.on('pointerdown', () => {
      audioManager.playButton();
      this.scene.stop();
      this.scene.start('MenuScene');
    });

    this.pauseOverlay.addMultiple([bg, title, resumeBg, resumeTxt, restartBg, restartTxt, menuBg, menuTxt]);
  },

  hidePauseOverlay() {
    if (this.pauseOverlay) {
      this.pauseOverlay.clear(true, true);
      this.pauseOverlay = null;
    }
  }
};
