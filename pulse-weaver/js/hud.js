// HUD class and PauseScene

class HUD {
  constructor(scene) {
    this.scene = scene;
    this.scoreValue = 0;
    this._build();
  }

  _build() {
    const s = this.scene;
    const topBar = s.add.graphics().setDepth(10);
    topBar.fillStyle(0x1A237E, 0.85);
    topBar.fillRect(0, 0, GAME_WIDTH, TOP_BAR_HEIGHT);

    const btmBar = s.add.graphics().setDepth(10);
    btmBar.fillStyle(0x1A237E, 0.85);
    btmBar.fillRect(0, GAME_HEIGHT - BOTTOM_BAR_HEIGHT, GAME_WIDTH, BOTTOM_BAR_HEIGHT);

    this.pauseBtn = s.add.text(12, TOP_BAR_HEIGHT / 2, '❚❚', {
      fontSize: '18px', fontFamily: 'sans-serif', color: '#ECEFF1',
    }).setOrigin(0, 0.5).setDepth(11).setInteractive({ useHandCursor: true });
    this.pauseBtn.on('pointerdown', () => s.onPause());

    this.stageLabel = s.add.text(GAME_WIDTH / 2, TOP_BAR_HEIGHT / 2, '', {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#ECEFF1',
    }).setOrigin(0.5).setDepth(11);

    this.scoreTxt = s.add.text(GAME_WIDTH - 12, TOP_BAR_HEIGHT / 2, '0', {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#ECEFF1', fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(11);

    this.attemptTxt = s.add.text(12, GAME_HEIGHT - BOTTOM_BAR_HEIGHT / 2, 'Attempt: 1', {
      fontSize: '12px', fontFamily: 'sans-serif', color: '#90A4AE',
    }).setOrigin(0, 0.5).setDepth(11);

    this.comboBadge = s.add.text(GAME_WIDTH / 2, GAME_HEIGHT - BOTTOM_BAR_HEIGHT / 2, '', {
      fontSize: '14px', fontFamily: 'sans-serif', color: '#1A237E', fontStyle: 'bold',
      backgroundColor: '#FFD700', padding: { x: 8, y: 3 },
    }).setOrigin(0.5).setDepth(11).setAlpha(0);

    this.hintBtn = s.add.text(GAME_WIDTH - 12, GAME_HEIGHT - BOTTOM_BAR_HEIGHT / 2, '?', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#7FFFD4',
    }).setOrigin(1, 0.5).setDepth(11).setInteractive({ useHandCursor: true });
    this.hintBtn.on('pointerdown', () => s.onHintRequest());
    this.hintBtn.setAlpha(0.3);
  }

  setStage(n) { this.stageLabel.setText(`Stage ${n}`); }
  setAttempt(n) { this.attemptTxt.setText(`Attempt: ${n}`); }

  setScore(val) {
    const from = this.scoreValue;
    this.scoreValue = val;
    this.scene.tweens.addCounter({
      from, to: val, duration: 300,
      onUpdate: t => this.scoreTxt.setText(Math.floor(t.getValue()).toLocaleString()),
    });
  }

  showCombo(mult) {
    this.comboBadge.setText(`Combo ×${mult}`);
    this.scene.tweens.killTweensOf(this.comboBadge);
    this.comboBadge.setAlpha(1);
    this.scene.tweens.add({ targets: this.comboBadge, alpha: 0, duration: 400, delay: 2000 });
  }

  enableHint(show) {
    this.hintBtn.setAlpha(show ? 1 : 0.3);
    if (show) this.hintBtn.setInteractive({ useHandCursor: true });
  }
}

class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create() {
    const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
    const panelW = 280, panelH = 280;

    this.add.graphics().fillStyle(0x000000, 0.7).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.add.graphics().fillStyle(0x1A237E, 1).fillRoundedRect(cx - panelW/2, cy - panelH/2, panelW, panelH, 16);
    this.add.text(cx, cy - panelH/2 + 28, 'PAUSED', { fontSize: '22px', fontFamily: 'sans-serif', color: '#ECEFF1', fontStyle: 'bold' }).setOrigin(0.5);

    this._btn(cx, cy - 50, 'RESUME', true, () => { this.scene.stop(); this.scene.resume('GameScene'); });
    this._btn(cx, cy + 10, 'RESTART', false, () => {
      this.scene.stop(); this.scene.stop('GameScene');
      const gs = this.scene.manager.getScene('GameScene');
      this.scene.start('GameScene', gs ? gs.currentStageData : { stage: GameState.currentStage });
    });
    this._btn(cx, cy + 70, 'SETTINGS', false, () => this.scene.launch('SettingsScene'));
    this._btn(cx, cy + 130, 'QUIT TO MENU', false, () => {
      this.scene.stop(); this.scene.stop('GameScene');
      AdManager.maybeShowInterstitial('quit', () => this.scene.start('MenuScene'));
    });
  }

  _btn(x, y, label, filled, cb) {
    const w = 220, h = 48;
    const g = this.add.graphics();
    if (filled) { g.fillStyle(0x7FFFD4, 1); g.fillRoundedRect(x - w/2, y - h/2, w, h, h/2); }
    else { g.lineStyle(2, 0x7FFFD4, 1); g.strokeRoundedRect(x - w/2, y - h/2, w, h, h/2); }
    const txt = this.add.text(x, y, label, { fontSize: '15px', fontFamily: 'sans-serif', color: filled ? '#1A237E' : '#7FFFD4', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).on('pointerdown', () => { AudioEngine.playButton(); cb(); });
  }
}
