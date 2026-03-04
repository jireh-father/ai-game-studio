// HUD, Menu, GameOver, and overlay scenes

class HUD {
  constructor(scene) {
    this.scene = scene;
    this._createHUD();
  }

  _createHUD() {
    const s = this.scene;
    // Top HUD background
    s.add.rectangle(GAME_WIDTH / 2, 24, GAME_WIDTH, 48, COLOR.HUD_BG).setDepth(40);
    // Score text
    this.scoreText = s.add.text(8, 12, 'SCORE: 0', {
      fontSize: '14px', color: '#F0F8FF', fontFamily: 'Arial bold',
    }).setDepth(41);
    // Wave text
    this.waveText = s.add.text(GAME_WIDTH / 2, 12, 'WAVE 1', {
      fontSize: '13px', color: '#F0F8FF', fontFamily: 'Arial', align: 'center',
    }).setOrigin(0.5, 0).setDepth(41);
    // Smell meter label
    s.add.text(GAME_WIDTH - 8, 10, 'SMELL', {
      fontSize: '9px', color: '#ADFF2F', fontFamily: 'Arial',
    }).setOrigin(1, 0).setDepth(41);
    // Smell bg
    s.add.rectangle(GAME_WIDTH - 46, 28, 80, 12, COLOR.SMELL_BG).setDepth(41);
    this.smellBar = s.add.rectangle(GAME_WIDTH - 86, 28, 0, 10, COLOR.SMELL_FILL).setOrigin(0, 0.5).setDepth(42);
    this.smellBar.x = GAME_WIDTH - 86;
    // Timer bar (below HUD)
    s.add.rectangle(GAME_WIDTH / 2, 50, GAME_WIDTH, 8, 0x333333).setDepth(40);
    this.timerBar = s.add.rectangle(0, 50, GAME_WIDTH, 8, COLOR.TIMER_FILL).setOrigin(0, 0.5).setDepth(41);

    // Bottom bar
    s.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - BOTTOM_BAR_HEIGHT / 2, GAME_WIDTH, BOTTOM_BAR_HEIGHT, COLOR.HUD_BG).setDepth(40);
    // Power-up button
    this.powerUpBtn = s.add.text(28, GAME_HEIGHT - BOTTOM_BAR_HEIGHT + 10, '⚡\nPOWER', {
      fontSize: '11px', color: '#F4A261', fontFamily: 'Arial', align: 'center',
    }).setOrigin(0.5, 0).setDepth(41).setInteractive({ useHandCursor: true });
    this.powerUpBtn.on('pointerdown', () => this._usePowerUp());
    // Wave label bottom
    this.waveLabel = s.add.text(GAME_WIDTH / 2, GAME_HEIGHT - BOTTOM_BAR_HEIGHT + 12, 'WAVE 1', {
      fontSize: '12px', color: '#F0F8FF', fontFamily: 'Arial bold', align: 'center',
    }).setOrigin(0.5, 0).setDepth(41);
    // Lives
    this.livesText = s.add.text(GAME_WIDTH - 8, GAME_HEIGHT - BOTTOM_BAR_HEIGHT + 14, '♥ ♥ ♥', {
      fontSize: '16px', color: '#E63946', fontFamily: 'Arial',
    }).setOrigin(1, 0).setDepth(41);

    // Pause button
    s.add.text(GAME_WIDTH - 10, 8, '⏸', { fontSize: '20px', color: '#B0C4DE' })
      .setOrigin(1, 0).setDepth(41).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._showPause());
  }

  updateScore(score) {
    this.scoreText.setText('SCORE: ' + score.toLocaleString());
  }

  updateWave(wave, isRest) {
    const label = isRest ? `WAVE ${wave} 🛒` : `WAVE ${wave}`;
    this.waveText.setText(label);
    this.waveLabel.setText(label);
  }

  updateTimer(pct) {
    this.timerBar.width = GAME_WIDTH * pct;
    this.timerBar.setFillStyle(pct < 0.3 ? COLOR.TIMER_URGENT : COLOR.TIMER_FILL);
  }

  updateSmell(pct) {
    // pct is 0-100
    this.smellBar.width = (pct / 100) * 80;
  }

  updateLives(lives) {
    const hearts = '♥ '.repeat(lives) + '♡ '.repeat(3 - lives);
    this.livesText.setText(hearts.trim());
  }

  addScore(points, col, row, scene) {
    scene.score = (scene.score || 0) + points;
    this.updateScore(scene.score);
    this.showScorePop(points, gridToScreen(col, row).x, gridToScreen(col, row).y, scene);
  }

  showScorePop(points, x, y, scene) {
    const txt = scene.add.text(x, y, '+' + points, {
      fontSize: '16px', color: '#FFD700', fontFamily: 'Arial bold',
    }).setOrigin(0.5, 0.5).setDepth(60);
    scene.tweens.add({ targets: txt, y: y - 40, alpha: 0, duration: 600, onComplete: () => txt.destroy() });
  }

  showCombo(combo, scene) {
    if (this._comboBadge) this._comboBadge.destroy();
    this._comboBadge = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, `x${combo} COMBO!`, {
      fontSize: '28px', color: '#FFD700', fontFamily: 'Arial bold', stroke: '#1A1A2E', strokeThickness: 3,
    }).setOrigin(0.5, 0.5).setDepth(60).setScale(0.5);
    scene.tweens.add({
      targets: this._comboBadge, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.Out',
      onComplete: () => scene.time.delayedCall(1200, () => {
        if (this._comboBadge) {
          scene.tweens.add({ targets: this._comboBadge, alpha: 0, duration: 300, onComplete: () => { if (this._comboBadge) this._comboBadge.destroy(); } });
        }
      }),
    });
  }

  _usePowerUp() {
    const scene = this.scene;
    // Show rewarded ad for smell blocker; activate on reward
    AdManager.showRewardedSmellBlocker(scene.waveNumber, () => {
      scene.smellBlocked = 3;
      scene._playSound('snap');
      const txt = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'SMELL BLOCKED!\n3 waves', {
        fontSize: '18px', color: '#ADFF2F', fontFamily: 'Arial bold', align: 'center',
      }).setOrigin(0.5, 0.5).setDepth(60);
      scene.tweens.add({ targets: txt, alpha: 0, duration: 1500, onComplete: () => txt.destroy() });
    }, null);
  }

  _showPause() {
    new PauseOverlay(this.scene);
  }
}

class PauseOverlay {
  constructor(scene) {
    this.scene = scene;
    scene.waveActive = false;
    this._create();
  }

  _create() {
    const s = this.scene;
    this.bg = s.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1A1A2E, 0.8).setDepth(80);
    this.title = s.add.text(GAME_WIDTH / 2, 180, 'PAUSED', {
      fontSize: '32px', color: '#F0F8FF', fontFamily: 'Arial bold',
    }).setOrigin(0.5, 0.5).setDepth(81);

    this._btn(GAME_WIDTH / 2, 280, 'RESUME', '#52B788', () => this._resume());
    this._btn(GAME_WIDTH / 2, 344, 'RESTART', '#F4A261', () => { this._closeAll(); s.scene.restart(); });
    this._btn(GAME_WIDTH / 2, 408, 'QUIT TO MENU', '#B0C4DE', () => { this._closeAll(); s.scene.start('MenuScene'); });
    this.elements = [this.bg, this.title];
  }

  _btn(x, y, label, color, cb) {
    const btn = this.scene.add.text(x, y, label, {
      fontSize: '20px', color: '#FFFFFF', fontFamily: 'Arial bold',
      backgroundColor: color, padding: { x: 24, y: 12 },
    }).setOrigin(0.5, 0.5).setDepth(81).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', cb);
    this.elements.push(btn);
    return btn;
  }

  _resume() {
    this._closeAll();
    this.scene.waveActive = true;
  }

  _closeAll() {
    for (const e of this.elements) if (e && e.active) e.destroy();
  }
}

// ---- Menu Scene ----
class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    AdManager.showBanner(true);
    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLOR.FRIDGE_BG);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 20, GAME_HEIGHT - 20, 0xDCEFF9, 0.5);

    // Logo
    const logo = this.add.text(GAME_WIDTH / 2, 140, 'FRIDGE\nTETRIS', {
      fontSize: '44px', color: '#1A1A2E', fontFamily: 'Arial black', align: 'center',
      stroke: '#B0C4DE', strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setScale(0.5);
    this.tweens.add({ targets: logo, scaleX: 1, scaleY: 1, duration: 600, ease: 'Back.Out' });

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 210, 'Survive the grocery run!', {
      fontSize: '14px', color: '#B0C4DE', fontFamily: 'Arial',
    }).setOrigin(0.5, 0.5);

    // High score
    loadState();
    this.add.text(GAME_WIDTH / 2, 248, `BEST: ${GlobalState.highScore.toLocaleString()}`, {
      fontSize: '16px', color: '#FFD700', fontFamily: 'Arial bold',
    }).setOrigin(0.5, 0.5);

    // Fridge points
    this.add.text(12, 12, `♦ ${GlobalState.fridgePoints}`, {
      fontSize: '14px', color: '#F4A261', fontFamily: 'Arial bold',
    });

    // Settings button
    this.add.text(GAME_WIDTH - 12, 12, '⚙', { fontSize: '24px', color: '#B0C4DE' })
      .setOrigin(1, 0).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._showSettings());

    // PLAY button
    this._bigBtn(GAME_WIDTH / 2, 330, 'PLAY', '#E63946', () => {
      AdManager.showBanner(false);
      AdManager.resetRun();
      this.scene.start('GameScene');
    });

    // DAILY CHALLENGE button
    this._btn(GAME_WIDTH / 2, 408, 'DAILY CHALLENGE', '#F4A261', () => this._dailyChallenge());

    // SHOP button
    this._btn(GAME_WIDTH / 2, 464, 'SHOP ♦', '#52B788', () => this._showShop());

    // Tupperware character — texture pre-registered in BootScene
    const char = this.add.image(GAME_WIDTH / 2, 540, 'player_happy').setDisplaySize(80, 80);
    this.tweens.add({ targets: char, y: 530, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // Version info
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 10, 'v1.0', {
      fontSize: '10px', color: '#B0C4DE', fontFamily: 'Arial',
    }).setOrigin(0.5, 1);
  }

  _bigBtn(x, y, label, color, cb) {
    const btn = this.add.text(x, y, label, {
      fontSize: '24px', color: '#FFFFFF', fontFamily: 'Arial bold',
      backgroundColor: color, padding: { x: 40, y: 16 },
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', cb);
    return btn;
  }

  _btn(x, y, label, color, cb) {
    const btn = this.add.text(x, y, label, {
      fontSize: '16px', color: '#FFFFFF', fontFamily: 'Arial bold',
      backgroundColor: color, padding: { x: 28, y: 12 },
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', cb);
    return btn;
  }

  _dailyChallenge() {
    const txt = this.add.text(GAME_WIDTH / 2, 530, 'Coming soon!', {
      fontSize: '16px', color: '#1A1A2E', backgroundColor: '#FFF8E7', padding: { x: 12, y: 6 },
    }).setOrigin(0.5, 0.5);
    this.time.delayedCall(1500, () => txt.destroy());
  }

  _showShop() {
    new ShopOverlay(this);
  }

  _showSettings() {
    new SettingsOverlay(this);
  }
}

// ---- Game Over Scene ----
class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  create() {
    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1A1A2E);

    const score = GlobalState.lastScore || 0;
    const wave = GlobalState.lastWave || 0;
    const fp = GlobalState.lastFridgePoints || 0;
    const isNew = GlobalState.isNewHighScore;

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 120, 'THE HUMAN\nFORGOT YOU...', {
      fontSize: '24px', color: '#F0F8FF', fontFamily: 'Arial bold', align: 'center',
    }).setOrigin(0.5, 0.5).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 600 });

    // Score
    const scoreText = this.add.text(GAME_WIDTH / 2, 220, score.toLocaleString(), {
      fontSize: '52px', color: '#FFD700', fontFamily: 'Arial black',
    }).setOrigin(0.5, 0.5).setScale(0.5);
    this.tweens.add({ targets: scoreText, scaleX: 1, scaleY: 1, duration: 400, delay: 300, ease: 'Back.Out' });

    if (isNew) {
      const newRecord = this.add.text(GAME_WIDTH / 2, 270, '★ NEW RECORD! ★', {
        fontSize: '20px', color: '#FFD700', fontFamily: 'Arial bold',
      }).setOrigin(0.5, 0.5);
      this.tweens.add({ targets: newRecord, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
    }

    // Stats
    this.add.text(GAME_WIDTH / 2, 310, `Wave Reached: ${wave}`, {
      fontSize: '18px', color: '#B0C4DE', fontFamily: 'Arial',
    }).setOrigin(0.5, 0.5);
    this.add.text(GAME_WIDTH / 2, 340, `♦ ${fp} Fridge Points earned`, {
      fontSize: '14px', color: '#F4A261', fontFamily: 'Arial',
    }).setOrigin(0.5, 0.5);

    // Continue button (if not used)
    const canContinue = !AdManager.continueUsedThisRun;
    if (canContinue) {
      this._btn(GAME_WIDTH / 2, 400, 'WATCH AD TO CONTINUE', '#52B788', () => {
        AdManager.showRewardedContinue(() => {
          this.scene.start('GameScene');
        }, null);
      });
    }

    // Double FP button
    this._btn(GAME_WIDTH / 2, canContinue ? 460 : 400, 'DOUBLE FRIDGE POINTS', '#F4A261', () => {
      AdManager.showRewardedDoublePoints(() => {
        GlobalState.fridgePoints += fp;
        GlobalState.totalFridgePoints += fp;
        saveState();
        this.scene.restart();
      }, null);
    });

    // Play Again
    this._bigBtn(GAME_WIDTH / 2, canContinue ? 530 : 490, 'PLAY AGAIN', '#E63946', () => {
      AdManager.resetRun();
      this.scene.start('GameScene');
    });

    // Menu
    this._smallBtn(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'MENU', () => {
      this.scene.start('MenuScene');
    });
  }

  _bigBtn(x, y, label, color, cb) {
    const btn = this.add.text(x, y, label, {
      fontSize: '22px', color: '#FFFFFF', fontFamily: 'Arial bold',
      backgroundColor: color, padding: { x: 36, y: 14 },
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', cb);
    return btn;
  }

  _btn(x, y, label, color, cb) {
    const btn = this.add.text(x, y, label, {
      fontSize: '14px', color: '#FFFFFF', fontFamily: 'Arial bold',
      backgroundColor: color, padding: { x: 20, y: 10 },
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', cb);
    return btn;
  }

  _smallBtn(x, y, label, cb) {
    const btn = this.add.text(x, y, label, {
      fontSize: '16px', color: '#FFFFFF', fontFamily: 'Arial',
      stroke: '#B0C4DE', strokeThickness: 2, padding: { x: 16, y: 8 },
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', cb);
    return btn;
  }
}

// ---- Shop Overlay ----
class ShopOverlay {
  constructor(scene) {
    this.scene = scene;
    this._create();
  }

  _create() {
    const s = this.scene;
    this.elements = [];
    const bg = s.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1A1A2E, 0.95).setDepth(90);
    const title = s.add.text(GAME_WIDTH / 2, 50, 'SHOP', {
      fontSize: '28px', color: '#FFD700', fontFamily: 'Arial bold',
    }).setOrigin(0.5, 0.5).setDepth(91);
    const fp = s.add.text(GAME_WIDTH - 10, 20, `♦ ${GlobalState.fridgePoints}`, {
      fontSize: '16px', color: '#F4A261', fontFamily: 'Arial bold',
    }).setOrigin(1, 0).setDepth(91);
    const items = [
      { name: 'Fancy Bento Skin', cost: 500 },
      { name: 'Cracked Lid Skin', cost: 800 },
      { name: 'Royal Tupperware', cost: 1500 },
      { name: 'Extra Power-Up Slot', cost: 300 },
    ];
    items.forEach((item, i) => {
      const row = s.add.text(GAME_WIDTH / 2, 120 + i * 70, `${item.name}\n♦ ${item.cost}`, {
        fontSize: '14px', color: '#F0F8FF', fontFamily: 'Arial', align: 'center',
        backgroundColor: '#2A2A4E', padding: { x: 20, y: 10 },
      }).setOrigin(0.5, 0.5).setDepth(91).setInteractive({ useHandCursor: true });
      row.on('pointerdown', () => {
        if (GlobalState.fridgePoints >= item.cost) {
          GlobalState.fridgePoints -= item.cost;
          saveState();
          fp.setText(`♦ ${GlobalState.fridgePoints}`);
          row.setBackgroundColor('#52B788');
        }
      });
      this.elements.push(row);
    });
    const closeBtn = s.add.text(GAME_WIDTH - 12, 12, '✕', {
      fontSize: '24px', color: '#F0F8FF', fontFamily: 'Arial',
    }).setOrigin(1, 0).setDepth(91).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this._close([bg, title, fp, closeBtn, ...this.elements]));
    this.elements.push(bg, title, fp, closeBtn);
  }

  _close(elements) {
    for (const e of elements) if (e && e.active) e.destroy();
  }
}

// ---- Settings Overlay ----
class SettingsOverlay {
  constructor(scene) {
    this.scene = scene;
    this._create();
  }

  _create() {
    const s = this.scene;
    this.elements = [];
    const bg = s.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1A1A2E, 0.95).setDepth(90);
    const title = s.add.text(GAME_WIDTH / 2, 80, 'SETTINGS', {
      fontSize: '28px', color: '#F0F8FF', fontFamily: 'Arial bold',
    }).setOrigin(0.5, 0.5).setDepth(91);

    const settings = [
      { key: 'sound', label: 'Sound Effects' },
      { key: 'music', label: 'Music' },
      { key: 'vibration', label: 'Vibration' },
    ];
    settings.forEach((setting, i) => {
      s.add.text(GAME_WIDTH / 2 - 60, 180 + i * 70, setting.label, {
        fontSize: '16px', color: '#F0F8FF', fontFamily: 'Arial',
      }).setOrigin(0, 0.5).setDepth(91);
      const toggle = s.add.text(GAME_WIDTH / 2 + 80, 180 + i * 70,
        GlobalState.settings[setting.key] ? 'ON' : 'OFF', {
          fontSize: '16px', color: GlobalState.settings[setting.key] ? '#52B788' : '#888',
          fontFamily: 'Arial bold', backgroundColor: '#2A2A4E', padding: { x: 14, y: 8 },
        }).setOrigin(0.5, 0.5).setDepth(91).setInteractive({ useHandCursor: true });
      toggle.on('pointerdown', () => {
        GlobalState.settings[setting.key] = !GlobalState.settings[setting.key];
        toggle.setText(GlobalState.settings[setting.key] ? 'ON' : 'OFF');
        toggle.setColor(GlobalState.settings[setting.key] ? '#52B788' : '#888');
        saveState();
      });
      this.elements.push(toggle);
    });

    const closeBtn = s.add.text(GAME_WIDTH - 12, 12, '✕', {
      fontSize: '24px', color: '#F0F8FF', fontFamily: 'Arial',
    }).setOrigin(1, 0).setDepth(91).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      for (const e of [bg, title, closeBtn, ...this.elements]) if (e && e.active) e.destroy();
    });
    this.elements.push(bg, title, closeBtn);
  }
}
