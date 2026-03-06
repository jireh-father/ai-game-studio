// ui.js - MenuScene, GameOverScene, HUD, pause overlay

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BACKGROUND);

    this.add.text(width / 2, height * 0.22, 'CIRCUIT', {
      fontSize: '36px', fill: COLORS.UI_ACCENT, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.30, 'REROUTE', {
      fontSize: '36px', fill: COLORS.UI_ACCENT, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.37, 'Route the current. Save the circuit.', {
      fontSize: '14px', fill: COLORS.UI_TEXT
    }).setOrigin(0.5);

    this._createButton(width / 2, height * 0.55, 200, 60, 'PLAY', COLORS.UI_ACCENT, () => {
      this.scene.start('GameScene');
    });

    this._createButton(width / 2 - 60, height * 0.72, 44, 44, '?', COLORS.UI_ACCENT, () => {
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    const hs = GameState.highScore || 0;
    this.add.text(width / 2 + 30, height * 0.72, 'BEST: ' + hs, {
      fontSize: '18px', fill: COLORS.BULB_LIT
    }).setOrigin(0, 0.5);

    this._soundBtn = this.add.text(width - 40, 20, GameState.settings.sound ? '🔊' : '🔇', {
      fontSize: '24px'
    }).setInteractive().on('pointerdown', () => {
      GameState.settings.sound = !GameState.settings.sound;
      this._soundBtn.setText(GameState.settings.sound ? '🔊' : '🔇');
      localStorage.setItem('circuit_reroute_settings', JSON.stringify(GameState.settings));
    });
  }

  _createButton(x, y, w, h, label, color, cb) {
    const hex = typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : color;
    const bg = this.add.rectangle(x, y, w, h, hex, 0.9).setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontSize: h > 50 ? '28px' : '20px', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    bg.on('pointerdown', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 0.9, scaleY: 0.9, duration: 60, yoyo: true, onComplete: cb });
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.stageReached = data.stage || 1;
    this.bestStreak = data.bestStreak || 0;
    this.isNewHigh = data.isNewHigh || false;
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);

    this.add.text(width / 2, height * 0.12, 'SHORT CIRCUIT!', {
      fontSize: '28px', fill: COLORS.DANGER, fontStyle: 'bold'
    }).setOrigin(0.5);

    const scoreTxt = this.add.text(width / 2, height * 0.28, this.finalScore.toString(), {
      fontSize: '42px', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.tweens.add({ targets: scoreTxt, scaleX: 1.3, scaleY: 1.3, duration: 150, yoyo: true });

    if (this.isNewHigh) {
      const nh = this.add.text(width / 2, height * 0.36, 'NEW BEST!', {
        fontSize: '20px', fill: COLORS.BULB_LIT, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({ targets: nh, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
    }

    this.add.text(width / 2, height * 0.42, 'Stage ' + this.stageReached, {
      fontSize: '20px', fill: '#FFFFFF'
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.48, 'Best Streak: ' + this.bestStreak, {
      fontSize: '16px', fill: '#FFFFFF'
    }).setOrigin(0.5);

    if (AdManager.canContinue()) {
      this._createButton(width / 2, height * 0.58, 200, 50, 'Continue (Ad)', 0x00AA44, () => {
        AdManager.showRewarded('continue', () => {
          this.scene.stop();
          this.scene.get('GameScene').continueAfterAd();
        });
      });
    }

    this._createButton(width / 2, height * 0.70, 200, 50, 'Play Again',
      parseInt(COLORS.UI_ACCENT.replace('#', ''), 16), () => {
        AdManager.reset();
        this.scene.stop();
        this.scene.start('GameScene');
      });

    this._createButton(width / 2, height * 0.82, 140, 40, 'Menu', 0x555555, () => {
      AdManager.reset();
      this.scene.stop();
      this.scene.start('MenuScene');
    });

    AdManager.onGameOver();
  }

  _createButton(x, y, w, h, label, color, cb) {
    const bg = this.add.rectangle(x, y, w, h, color, 0.9).setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontSize: h > 40 ? '22px' : '16px', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    bg.on('pointerdown', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 0.9, scaleY: 0.9, duration: 60, yoyo: true, onComplete: cb });
    });
  }
}

class HUDScene extends Phaser.Scene {
  constructor() { super('HUDScene'); }

  create() {
    const { width } = this.scale;
    this.scoreTxt = this.add.text(16, 12, 'Score: ' + GameState.score, {
      fontSize: '20px', fill: '#FFFFFF', fontStyle: 'bold'
    });
    this.stageTxt = this.add.text(width / 2, 12, 'Stage ' + GameState.stage, {
      fontSize: '18px', fill: '#FFFFFF'
    }).setOrigin(0.5, 0);

    // Pause button
    const pauseBtn = this.add.rectangle(width - 50, 20, 44, 44, 0x333333, 0.7)
      .setInteractive({ useHandCursor: true });
    this.add.text(width - 50, 20, '||', { fontSize: '20px', fill: '#FFFFFF', fontStyle: 'bold' })
      .setOrigin(0.5);
    pauseBtn.on('pointerdown', () => this._togglePause());

    // Lives
    this.livesTxt = this.add.text(width - 90, 12, '', { fontSize: '18px', fill: COLORS.LIVES_HEART });
    this._updateLives();

    // Timer
    this.timerTxt = this.add.text(width / 2 - 40, this.scale.height - 36, '', {
      fontSize: '20px', fill: COLORS.TIMER_GREEN, fontStyle: 'bold'
    });

    // Streak
    this.streakTxt = this.add.text(width - 16, this.scale.height - 36, '', {
      fontSize: '16px', fill: COLORS.BULB_LIT
    }).setOrigin(1, 0);

    this._setupEvents();
    this.pauseOverlay = null;
  }

  _setupEvents() {
    const gs = this.scene.get('GameScene');
    if (!gs) return;
    gs.events.on('scoreUpdate', s => { if (this.scoreTxt) this._updateScore(s); });
    gs.events.on('stageUpdate', s => { if (this.stageTxt) this.stageTxt.setText('Stage ' + s); });
    gs.events.on('livesUpdate', l => { if (this.livesTxt) this._updateLives(); });
    gs.events.on('timerUpdate', t => { if (this.timerTxt) this._updateTimer(t); });
    gs.events.on('streakUpdate', s => { if (this.streakTxt) this._updateStreak(s); });
  }

  _updateScore(s) {
    this.scoreTxt.setText('Score: ' + s);
    this.tweens.add({ targets: this.scoreTxt, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
  }

  _updateLives() { this.livesTxt.setText('♥'.repeat(Math.max(0, GameState.lives))); }

  _updateTimer(t) {
    this.timerTxt.setText('Time: ' + Math.ceil(t) + 's');
    const color = t <= 3 ? COLORS.TIMER_RED : (t <= 5 ? COLORS.TIMER_YELLOW : COLORS.TIMER_GREEN);
    this.timerTxt.setColor(color);
    if (t <= 3) {
      this.tweens.add({ targets: this.timerTxt, scaleX: 1.2, scaleY: 1.2, duration: 200, yoyo: true });
    }
  }

  _updateStreak(s) {
    const mult = this._getMultiplier(s);
    this.streakTxt.setText(mult > 1 ? 'x' + mult.toFixed(1) : '');
  }

  _getMultiplier(streak) {
    let m = 1;
    for (const t of SCORE_VALUES.STREAK_THRESHOLDS) { if (streak >= t.streak) m = t.mult; }
    return m;
  }

  _togglePause() {
    const gs = this.scene.get('GameScene');
    if (!gs || !gs.scene.isActive()) return;
    if (this.pauseOverlay) { this._resumeGame(); return; }
    gs.scene.pause();
    gs.electricity.state = 'PAUSED';
    const { width, height } = this.scale;
    this.pauseOverlay = this.add.container(0, 0);
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    const title = this.add.text(width / 2, height * 0.25, 'PAUSED', {
      fontSize: '28px', fill: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5);
    this.pauseOverlay.add([bg, title]);
    this._pauseBtn(width / 2, height * 0.40, 'Resume', () => this._resumeGame());
    this._pauseBtn(width / 2, height * 0.52, 'How to Play', () => {
      this.scene.launch('HelpScene', { returnTo: 'HUDScene' });
    });
    this._pauseBtn(width / 2, height * 0.64, 'Restart', () => {
      this._clearPause(); gs.scene.resume(); gs.scene.restart();
    });
    this._pauseBtn(width / 2, height * 0.76, 'Quit', () => {
      this._clearPause(); gs.scene.stop(); this.scene.stop(); this.scene.start('MenuScene');
    });
  }

  _pauseBtn(x, y, label, cb) {
    const bg = this.add.rectangle(x, y, 180, 46, 0x444444, 0.9).setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, { fontSize: '20px', fill: '#FFFFFF' }).setOrigin(0.5);
    bg.on('pointerdown', cb);
    this.pauseOverlay.add([bg, txt]);
  }

  _resumeGame() {
    this._clearPause();
    const gs = this.scene.get('GameScene');
    if (gs) { gs.scene.resume(); gs.electricity.state = 'FLOWING'; }
  }

  _clearPause() {
    if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
  }
}
