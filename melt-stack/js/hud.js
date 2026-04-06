// Melt Stack - HUD & Pause Overlay (mixed into GameScene)
const GameHUD = {
  createHUD() {
    this.add.rectangle(GAME_WIDTH / 2, 24, GAME_WIDTH, 48, PALETTE.hudBg, 0.5).setDepth(50).setScrollFactor(0);
    this.scoreText = this.add.text(12, 14, 'SCORE: ' + GameState.score, {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setDepth(51).setScrollFactor(0);
    this.stageText = this.add.text(GAME_WIDTH / 2, 14, 'STAGE: ' + GameState.stage, {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5, 0).setDepth(51).setScrollFactor(0);
    this.bestText = this.add.text(GAME_WIDTH - 12, 14, 'BEST: ' + GameState.bestScore, {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#AAAAAA'
    }).setOrigin(1, 0).setDepth(51).setScrollFactor(0);

    this.warningText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'MELTING!', {
      fontSize: '24px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FF9500'
    }).setOrigin(0.5).setDepth(55).setScrollFactor(0).setAlpha(0);

    const helpBg = this.add.circle(36, GAME_HEIGHT - 32, 22, 0x333333, 0.8).setDepth(50).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    this.add.text(36, GAME_HEIGHT - 32, '?', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);
    helpBg.on('pointerdown', () => {
      if (!this.paused) this.togglePause();
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });

    const pauseBg = this.add.circle(GAME_WIDTH - 36, GAME_HEIGHT - 32, 22, 0x333333, 0.8).setDepth(50).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH - 36, GAME_HEIGHT - 32, 'II', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);
    pauseBg.on('pointerdown', () => this.togglePause());
  },

  updateHUD() {
    if (this.scoreText) this.scoreText.setText('SCORE: ' + GameState.score);
    if (this.stageText) this.stageText.setText('STAGE: ' + GameState.stage);
  },

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) this.showPauseOverlay();
    else this.hidePauseOverlay();
  },

  showPauseOverlay() {
    if (this.pauseGroup) return;
    this.pauseGroup = [];
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8)
      .setDepth(200).setScrollFactor(0);
    this.pauseGroup.push(bg);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, 'PAUSED', {
      fontSize: '32px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
    this.pauseGroup.push(title);

    const btns = [
      { label: 'RESUME', y: 0.45, color: PALETTE.buttonAlt, action: () => this.togglePause() },
      { label: 'RESTART', y: 0.55, color: PALETTE.buttonBg, action: () => {
        this.hidePauseOverlay();
        this.scene.stop('GameScene');
        GameState.reset();
        this.scene.start('GameScene');
      }},
      { label: 'MENU', y: 0.65, color: -1, action: () => {
        this.hidePauseOverlay();
        this.scene.stop('GameScene');
        this.scene.start('MenuScene');
      }}
    ];
    btns.forEach(b => {
      let btnBg;
      if (b.color === -1) {
        btnBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * b.y, 200, 52, 0x000000, 0)
          .setStrokeStyle(2, 0xFFFFFF).setDepth(201).setScrollFactor(0).setInteractive({ useHandCursor: true });
      } else {
        btnBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * b.y, 200, 52, b.color)
          .setDepth(201).setScrollFactor(0).setInteractive({ useHandCursor: true });
      }
      const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * b.y, b.label, {
        fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
      }).setOrigin(0.5).setDepth(202).setScrollFactor(0);
      btnBg.on('pointerdown', b.action);
      this.pauseGroup.push(btnBg, txt);
    });

    const helpBg = this.add.circle(36, GAME_HEIGHT - 60, 22, 0x333333, 0.8)
      .setDepth(201).setScrollFactor(0).setInteractive({ useHandCursor: true });
    const helpTxt = this.add.text(36, GAME_HEIGHT - 60, '?', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(202).setScrollFactor(0);
    helpBg.on('pointerdown', () => {
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });
    this.pauseGroup.push(helpBg, helpTxt);
  },

  hidePauseOverlay() {
    if (this.pauseGroup) {
      this.pauseGroup.forEach(obj => obj.destroy());
      this.pauseGroup = null;
    }
    this.paused = false;
  }
};
