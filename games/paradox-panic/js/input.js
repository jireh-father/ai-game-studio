// Paradox Panic - Input & Pause (mixin for GameScene)
Object.assign(GameScene.prototype, {
  createSwipeHints() {
    const w = this.scale.width;
    const y = this.scale.height - 150;
    this.hintLeft = this.add.text(20, y, '<< FALSE', {
      fontSize: '12px', fontFamily: 'monospace', color: COLORS.falseHex
    }).setAlpha(0.6).setDepth(5);
    this.hintRight = this.add.text(w - 20, y, 'TRUE >>', {
      fontSize: '12px', fontFamily: 'monospace', color: COLORS.trueHex
    }).setOrigin(1, 0).setAlpha(0.6).setDepth(5);
  },

  createPauseButton() {
    const w = this.scale.width;
    this.pauseBtn = this.add.text(w - 10, 12, '| |', {
      fontSize: '18px', fontFamily: 'monospace', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(15)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.togglePause());
  },

  createPauseOverlay() {
    const w = this.scale.width, h = this.scale.height;
    this.pauseOverlay = this.add.container(0, 0).setDepth(50).setVisible(false);
    this.pauseOverlay.add(this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.8));
    this.pauseOverlay.add(this.add.text(w/2, h/2 - 120, 'PAUSED', {
      fontSize: '32px', fontFamily: 'monospace', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5));
    const btnStyle = { fontSize: '18px', fontFamily: 'monospace', color: '#FFFFFF', fontStyle: 'bold',
      backgroundColor: COLORS.uiBgHex, padding: { x: 40, y: 12 } };
    const resumeBtn = this.add.text(w/2, h/2 - 40, 'RESUME', btnStyle).setOrigin(0.5)
      .setInteractive().on('pointerdown', () => this.togglePause());
    const restartBtn = this.add.text(w/2, h/2 + 20, 'RESTART', btnStyle).setOrigin(0.5)
      .setInteractive().on('pointerdown', () => { this.scene.stop(); this.scene.start('GameScene'); });
    const menuBtn = this.add.text(w/2, h/2 + 80, 'MENU', btnStyle).setOrigin(0.5)
      .setInteractive().on('pointerdown', () => { this.scene.stop(); this.scene.start('MenuScene'); });
    const helpBtn = this.add.text(w/2, h/2 + 140, '? HOW TO PLAY', {
      ...btnStyle, backgroundColor: COLORS.paradoxHex
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
      this.scene.pause();
    });
    this.pauseOverlay.add([resumeBtn, restartBtn, menuBtn, helpBtn]);
  },

  togglePause(forcePause) {
    if (this.gameOver) return;
    this.paused = forcePause !== undefined ? forcePause : !this.paused;
    this.pauseOverlay.setVisible(this.paused);
    if (this.paused) {
      if (this.cardTimer) this.cardTimer.paused = true;
    } else {
      if (this.cardTimer) this.cardTimer.paused = false;
      this.lastInputTime = Date.now();
    }
  },

  setupInput() {
    let startX = 0, startY = 0;
    this.input.on('pointerdown', (p) => {
      if (this.paused || this.gameOver) return;
      startX = p.x; startY = p.y;
      this.lastInputTime = Date.now();
    });
    this.input.on('pointerup', (p) => {
      if (this.paused || this.gameOver || this.swipeActive) return;
      const dx = p.x - startX;
      const dy = Math.abs(p.y - startY);
      if (Math.abs(dx) >= GAME_CONFIG.swipeMinX && dy < GAME_CONFIG.swipeMaxY) {
        this.lastInputTime = Date.now();
        this.handleSwipe(dx > 0 ? 'TRUE' : 'FALSE');
      }
    });
  }
});
