// Slash Dash - HUD Manager & Pause Overlay
const HUD = {
  scoreText: null, stageText: null, comboText: null,
  strikeIcons: [], pauseBtn: null, inversionText: null,

  create(scene) {
    const W = GAME.CANVAS_W;
    scene.add.rectangle(W / 2, 30, W, 60, 0x0A0A0F, 0.7).setDepth(80);

    this.strikeIcons = [];
    for (let i = 0; i < GAME.MAX_STRIKES; i++) {
      this.strikeIcons.push(scene.add.image(20 + i * 30, 30, 'strikeActive').setDepth(81));
    }

    this.stageText = scene.add.text(W / 2, 30, 'STAGE ' + GameState.stage, {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.SCORE_TEXT
    }).setOrigin(0.5).setDepth(81);

    this.scoreText = scene.add.text(W - 60, 22, GameState.score.toString(), {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.SCORE_TEXT
    }).setOrigin(1, 0.5).setDepth(81);

    this.comboText = scene.add.text(W - 60, 42, '', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.COMBO_GOLD
    }).setOrigin(1, 0.5).setDepth(81).setAlpha(0);

    this.pauseBtn = scene.add.rectangle(W - 26, 30, 44, 44, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true }).setDepth(82);
    scene.add.text(W - 26, 30, '\u23F8', {
      fontSize: '22px', fontFamily: 'Arial', color: COLORS.BTN_TEXT
    }).setOrigin(0.5).setDepth(82);

    // Danger line
    const dg = scene.add.graphics().setDepth(5);
    dg.lineStyle(2, 0xFF2244, 0.3);
    for (let x = 0; x < W; x += 16) {
      dg.beginPath(); dg.moveTo(x, GAME.PLAYER_ZONE_Y); dg.lineTo(x + 8, GAME.PLAYER_ZONE_Y); dg.strokePath();
    }

    this.inversionText = scene.add.text(W / 2, 68, 'INVERSION ACTIVE', {
      fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.POISON_ORB
    }).setOrigin(0.5).setDepth(81).setAlpha(0);

    this.updateStrikes(scene, GameState.strikes);
  },

  updateScore(scene) {
    if (this.scoreText) {
      this.scoreText.setText(GameState.score.toString());
      Effects.scalePunch(scene, this.scoreText, 1.25, 150);
    }
  },

  updateStrikes(scene, strikes) {
    for (let i = 0; i < GAME.MAX_STRIKES; i++) {
      if (!this.strikeIcons[i]) continue;
      this.strikeIcons[i].setTexture(i < (GAME.MAX_STRIKES - strikes) ? 'strikeActive' : 'strikeSpent');
      if (i === GAME.MAX_STRIKES - strikes) Effects.scalePunch(scene, this.strikeIcons[i], 1.4, 200);
    }
  },

  updateStage() {
    if (this.stageText) this.stageText.setText('STAGE ' + GameState.stage);
  },

  updateCombo(scene) {
    if (!this.comboText) return;
    if (GameState.combo >= 3) {
      this.comboText.setText('x' + getComboMultiplier(GameState.combo).toFixed(1));
      this.comboText.setAlpha(1);
      Effects.scalePunch(scene, this.comboText, 1.3, 100);
    } else {
      this.comboText.setAlpha(0);
    }
  },

  setInversion(active) {
    if (this.inversionText) this.inversionText.setAlpha(active ? 1 : 0);
  }
};

const PauseOverlay = {
  container: null,

  show(scene, onResume, onRestart, onHelp, onMenu) {
    const W = GAME.CANVAS_W, H = GAME.CANVAS_H;
    this.container = scene.add.container(0, 0).setDepth(100);
    this.container.add(scene.add.rectangle(W / 2, H / 2, W, H, 0x0A0A0F, 0.8));
    this.container.add(scene.add.text(W / 2, H / 2 - 120, 'PAUSED', {
      fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.BTN_TEXT
    }).setOrigin(0.5));

    const btns = [
      { label: 'RESUME', cb: onResume }, { label: 'RESTART', cb: onRestart },
      { label: 'HOW TO PLAY', cb: onHelp }, { label: 'MENU', cb: onMenu }
    ];
    btns.forEach((b, i) => {
      const by = H / 2 - 50 + i * 58;
      const r = scene.add.rectangle(W / 2, by, 180, 48,
        Phaser.Display.Color.HexStringToColor(COLORS.BTN_PRIMARY).color)
        .setInteractive({ useHandCursor: true });
      const t = scene.add.text(W / 2, by, b.label, {
        fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.BTN_TEXT
      }).setOrigin(0.5);
      r.on('pointerdown', () => { Effects.playClickSound(); b.cb(); });
      this.container.add([r, t]);
    });
  },

  hide() {
    if (this.container) { this.container.destroy(); this.container = null; }
  }
};
