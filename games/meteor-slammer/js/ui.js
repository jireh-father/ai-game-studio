class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A14);

    // Star field bg
    for (let i = 0; i < 40; i++) {
      const sx = Math.random() * w, sy = Math.random() * h;
      const star = this.add.circle(sx, sy, 1 + Math.random(), 0xF0F0FF, 0.3 + Math.random() * 0.5);
      this.tweens.add({ targets: star, alpha: 0.1, duration: 1000 + Math.random() * 2000, yoyo: true, repeat: -1 });
    }

    // Title
    this.add.text(w / 2, h * 0.2, 'METEOR\nSLAMMER', { fontSize: '40px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.hud, align: 'center', lineSpacing: 4 }).setOrigin(0.5);

    // Hammer icon
    if (this.textures.exists('hammer')) {
      const hImg = this.add.image(w / 2, h * 0.38, 'hammer').setScale(1.2);
      this.tweens.add({ targets: hImg, angle: -15, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Play button
    const playBtn = this.add.rectangle(w / 2, h * 0.55, 200, 56, Phaser.Display.Color.HexStringToColor(COLORS.uiButton).color).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.55, 'PLAY', { fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).disableInteractive();
    playBtn.on('pointerdown', () => {
      GameState.reset();
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });

    // High score
    if (GameState.highScore > 0) {
      this.add.text(w / 2, h * 0.65, 'HIGH SCORE: ' + GameState.highScore, { fontSize: '16px', fontFamily: 'Arial', color: COLORS.meteorGold }).setOrigin(0.5);
    }

    // Help button
    const helpBtn = this.add.rectangle(w / 2, h * 0.75, 160, 44, 0x3A3A5A).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.75, '? HOW TO PLAY', { fontSize: '16px', fontFamily: 'Arial', color: '#C0C0D0' }).setOrigin(0.5).disableInteractive();
    helpBtn.on('pointerdown', () => {
      this.scene.pause('MenuScene');
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Sound toggle
    const sfxTxt = this.add.text(w - 16, 16, GameState.sfxOn ? 'SFX ON' : 'SFX OFF', { fontSize: '12px', fontFamily: 'Arial', color: '#A0A0C0' }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    sfxTxt.on('pointerdown', () => {
      GameState.sfxOn = !GameState.sfxOn;
      sfxTxt.setText(GameState.sfxOn ? 'SFX ON' : 'SFX OFF');
    });
  }
}

class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create() {
    const w = this.scale.width;
    this.scoreTxt = this.add.text(12, 8, 'SCORE: ' + GameState.score, { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.hud }).setDepth(50);
    this.stageTxt = this.add.text(w / 2, 8, 'STAGE ' + GameState.stage, { fontSize: '16px', fontFamily: 'Arial', color: COLORS.hud }).setOrigin(0.5, 0).setDepth(50);

    // Base fill bar
    this.fillBarBg = this.add.rectangle(w / 2, 36, w - 24, 10, 0x222233).setDepth(50);
    this.fillBar = this.add.rectangle(12, 36, 0, 8, 0x44CC44).setOrigin(0, 0.5).setDepth(51);

    // Warning icon (hidden initially)
    this.warnTxt = this.add.text(w - 16, 8, '!', { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.danger }).setOrigin(1, 0).setDepth(50).setAlpha(0);

    // Pause button
    const pauseZone = this.add.rectangle(w - 24, 56, 40, 40, 0x000000, 0).setDepth(55).setInteractive();
    this.add.text(w - 24, 56, '| |', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#A0A0C0' }).setOrigin(0.5).setDepth(54);
    pauseZone.on('pointerdown', () => {
      const gs = this.scene.get('GameScene');
      if (gs && !gs.gameOver) gs.togglePause();
    });

    this.pauseOverlay = null;
  }

  updateScore() {
    this.scoreTxt.setText('SCORE: ' + GameState.score);
    this.tweens.add({ targets: this.scoreTxt, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });
  }

  updateStage() {
    this.stageTxt.setText('STAGE ' + GameState.stage);
  }

  updateRubble() {
    const pct = GameState.rubbleLayers / MAX_RUBBLE_LAYERS;
    const barW = (this.scale.width - 24) * pct;
    this.tweens.add({ targets: this.fillBar, displayWidth: barW, duration: 300 });
    const color = pct > 0.75 ? 0xFF2020 : pct > 0.5 ? 0xFFAA00 : 0x44CC44;
    this.fillBar.setFillStyle(color);
    this.warnTxt.setAlpha(pct > 0.5 ? 1 : 0);
    if (pct > 0.5) {
      if (!this._warnTween) {
        this._warnTween = this.tweens.add({ targets: this.warnTxt, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
      }
    }
  }

  showPause() {
    if (this.pauseOverlay) return;
    const w = this.scale.width, h = this.scale.height;
    this.pauseOverlay = this.add.container(0, 0).setDepth(100);
    const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x1A1A2E, 0.85);
    const title = this.add.text(w / 2, h * 0.25, 'PAUSED', { fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.hud }).setOrigin(0.5);

    const makeBtn = (y, label, color, cb) => {
      const btn = this.add.rectangle(w / 2, y, 160, 48, color).setInteractive({ useHandCursor: true });
      const txt = this.add.text(w / 2, y, label, { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
      txt.disableInteractive();
      btn.on('pointerdown', cb);
      this.pauseOverlay.add([btn, txt]);
    };

    this.pauseOverlay.add([bg, title]);
    makeBtn(h * 0.4, 'RESUME', Phaser.Display.Color.HexStringToColor(COLORS.uiButton).color, () => {
      const gs = this.scene.get('GameScene');
      if (gs) gs.togglePause();
    });
    makeBtn(h * 0.5, 'RESTART', 0x3A3A5A, () => {
      this.hidePause();
      GameState.reset();
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });
    makeBtn(h * 0.6, '? HELP', 0x3A3A5A, () => {
      this.scene.pause('GameScene');
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });
    makeBtn(h * 0.7, 'QUIT', 0x5A2020, () => {
      this.hidePause();
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    });
  }

  hidePause() {
    if (this.pauseOverlay) { this.pauseOverlay.destroy(true); this.pauseOverlay = null; }
  }

  shutdown() {
    this.hidePause();
    if (this._warnTween) { this._warnTween.stop(); this._warnTween = null; }
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalStage = data.stage || 1;
    this.isNewHigh = data.isNewHigh || false;
  }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A14, 0.95);

    this.add.text(w / 2, h * 0.15, 'GAME OVER', { fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.danger }).setOrigin(0.5);

    const scoreTxt = this.add.text(w / 2, h * 0.32, '0', { fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.hud }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.24, 'SCORE', { fontSize: '16px', fontFamily: 'Arial', color: '#A0A0C0' }).setOrigin(0.5);

    // Count-up tween
    const counter = { val: 0 };
    this.tweens.add({
      targets: counter, val: this.finalScore, duration: 800, ease: 'Quad.easeOut',
      onUpdate: () => scoreTxt.setText(Math.floor(counter.val).toLocaleString())
    });

    if (this.isNewHigh) {
      const highTxt = this.add.text(w / 2, h * 0.40, 'NEW BEST!', { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.meteorGold }).setOrigin(0.5);
      this.tweens.add({ targets: highTxt, scaleX: 1.2, scaleY: 1.2, duration: 500, yoyo: true, repeat: -1 });
    }

    this.add.text(w / 2, h * 0.47, 'Stage Reached: ' + this.finalStage, { fontSize: '16px', fontFamily: 'Arial', color: '#A0A0C0' }).setOrigin(0.5);

    // Continue button (only first death)
    let btnY = h * 0.58;
    if (!GameState.continueUsed) {
      const contBtn = this.add.rectangle(w / 2, btnY, 220, 48, Phaser.Display.Color.HexStringToColor(COLORS.uiButton).color).setInteractive({ useHandCursor: true });
      this.add.text(w / 2, btnY, 'CONTINUE (AD)', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).disableInteractive();
      contBtn.on('pointerdown', () => {
        GameState.continueUsed = true;
        AdManager.showRewarded('continue', () => {
          GameState.rubbleLayers = Math.max(0, GameState.rubbleLayers - Math.floor(MAX_RUBBLE_LAYERS * 0.3));
          this.scene.stop('GameOverScene');
          this.scene.stop('GameScene');
          this.scene.start('GameScene', { continuing: true });
          this.scene.start('UIScene');
        }, () => {});
      });
      btnY += 58;
    }

    const playBtn = this.add.rectangle(w / 2, btnY, 200, 48, 0x3A3A5A).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'PLAY AGAIN', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).disableInteractive();
    playBtn.on('pointerdown', () => {
      GameState.reset();
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });

    const menuBtn = this.add.rectangle(w / 2, btnY + 58, 200, 48, 0x3A3A5A).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY + 58, 'MENU', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).disableInteractive();
    menuBtn.on('pointerdown', () => {
      GameState.reset();
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    });
  }
}
