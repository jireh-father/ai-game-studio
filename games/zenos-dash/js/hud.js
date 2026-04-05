// Zeno's Dash - HUD & Pause overlay (mixin for GameScene)

const HUDMixin = {
  createHUD() {
    const w = GAME_WIDTH;
    this.add.rectangle(w / 2, 22, w, 44, 0x0A0A0F, 0.8).setDepth(20);

    this.scoreText = this.add.text(10, 12, 'SCORE: ' + GameState.score, {
      fontSize: '16px', fontFamily: 'monospace', color: COLORS.hud
    }).setDepth(21);

    this.stageText = this.add.text(w / 2, 12, 'STAGE ' + GameState.stage, {
      fontSize: '14px', fontFamily: 'monospace', color: COLORS.hud
    }).setOrigin(0.5, 0).setDepth(21);

    const pauseBtn = this.add.text(w - 10, 12, '||', {
      fontSize: '22px', fontFamily: 'monospace', color: COLORS.hud
    }).setOrigin(1, 0).setDepth(22).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', (p) => {
      p.event.stopPropagation();
      this.togglePause();
    });

    this.gapText = this.add.text(this.playerX, TRACK_Y - 45,
      Math.round(this.finishLineX - this.playerX) + 'px', {
      fontSize: '12px', fontFamily: 'monospace', color: COLORS.gapText
    }).setOrigin(0.5).setDepth(10);

    this.pursuerDistText = this.add.text(GAME_WIDTH / 2, TRACK_Y + 30, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#FF6688'
    }).setOrigin(0.5, 0).setDepth(10);
  },

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.showPauseOverlay();
    } else {
      this.hidePauseOverlay();
      this.lastInputTime = Date.now();
    }
  },

  showPauseOverlay() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this._pauseGroup = [];

    const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A0F, 0.85).setDepth(50);
    this._pauseGroup.push(bg);

    const title = this.add.text(w / 2, 180, 'PAUSED', {
      fontSize: '28px', fontFamily: 'monospace', color: COLORS.hud
    }).setOrigin(0.5).setDepth(51);
    this._pauseGroup.push(title);

    const resumeBg = this.add.rectangle(w / 2, 280, 180, 50, 0x00D4FF)
      .setInteractive({ useHandCursor: true }).setDepth(51);
    const resumeTxt = this.add.text(w / 2, 280, 'RESUME', {
      fontSize: '20px', fontFamily: 'monospace', color: '#0A0A0F', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(52).disableInteractive();
    resumeBg.on('pointerdown', () => { playClickSound(); this.togglePause(); });
    this._pauseGroup.push(resumeBg, resumeTxt);

    const menuBg = this.add.rectangle(w / 2, 345, 140, 40, 0x333344)
      .setInteractive({ useHandCursor: true }).setDepth(51);
    const menuTxt = this.add.text(w / 2, 345, 'MENU', {
      fontSize: '16px', fontFamily: 'monospace', color: COLORS.hud
    }).setOrigin(0.5).setDepth(52).disableInteractive();
    menuBg.on('pointerdown', () => {
      playClickSound();
      this.cleanupEffects();
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
    this._pauseGroup.push(menuBg, menuTxt);

    const helpBtn = this.add.text(w / 2, 400, '? How to Play', {
      fontSize: '14px', fontFamily: 'monospace', color: COLORS.gapText
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });
    helpBtn.on('pointerdown', () => {
      playClickSound();
      this.scene.pause('GameScene');
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });
    this._pauseGroup.push(helpBtn);
  },

  hidePauseOverlay() {
    if (this._pauseGroup) {
      this._pauseGroup.forEach(obj => obj.destroy());
      this._pauseGroup = null;
    }
  }
};
