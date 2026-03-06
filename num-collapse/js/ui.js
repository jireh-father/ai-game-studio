// ui.js - MenuScene, UIScene (HUD), GameOverScene, Pause overlay

// Simple Web Audio sound effects
const SoundFX = {
  ctx: null,
  enabled: true,
  _getCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  play(type, opts = {}) {
    if (!this.enabled) return;
    const ctx = this._getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    const t = ctx.currentTime;
    if (type === 'click') {
      osc.type = 'square'; osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.3, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t); osc.stop(t + 0.05);
    } else if (type === 'merge') {
      osc.type = 'sine'; osc.frequency.value = 400 + (opts.sum || 2) * 40;
      gain.gain.setValueAtTime(0.4, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t); osc.stop(t + 0.15);
    } else if (type === 'chain') {
      const step = opts.step || 1;
      osc.type = 'sine'; osc.frequency.value = 600 + step * 100;
      gain.gain.setValueAtTime(0.5, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t); osc.stop(t + 0.15);
      if (step >= 3) { // chord
        [1.25, 1.5].forEach(m => {
          const o2 = ctx.createOscillator(), g2 = ctx.createGain();
          o2.connect(g2); g2.connect(ctx.destination);
          o2.type = 'sine'; o2.frequency.value = (600 + step * 100) * m;
          g2.gain.setValueAtTime(0.3, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          o2.start(t); o2.stop(t + 0.3);
        });
      }
    } else if (type === 'invalid') {
      osc.type = 'sawtooth'; osc.frequency.value = 200;
      gain.gain.setValueAtTime(0.2, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.start(t); osc.stop(t + 0.1);
    } else if (type === 'spawn') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(500, t); osc.frequency.linearRampToValueAtTime(300, t + 0.08);
      gain.gain.setValueAtTime(0.15, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.start(t); osc.stop(t + 0.08);
    } else if (type === 'death') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(600, t); osc.frequency.linearRampToValueAtTime(100, t + 0.6);
      gain.gain.setValueAtTime(0.4, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.start(t); osc.stop(t + 0.6);
    } else if (type === 'highscore') {
      [523, 659, 784, 1047].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.3, t + i * 0.15); g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.2);
        o.start(t + i * 0.15); o.stop(t + i * 0.15 + 0.2);
      });
    }
  }
};

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x1A1A2E);
    this.add.text(w / 2, 120, 'NUM COLLAPSE', { fontSize: '34px', fontFamily: 'Arial Black', fill: '#FFFFFF' }).setOrigin(0.5);
    this.add.text(w / 2, 158, 'Merge. Collapse. Chain.', { fontSize: '14px', fontFamily: 'Arial', fill: '#4ECDC4' }).setOrigin(0.5);

    // Play button
    const btnBg = this.add.rectangle(w / 2, 280, 180, 56, 0x4ECDC4).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, 280, 'PLAY', { fontSize: '24px', fontFamily: 'Arial Black', fill: '#0F0F23' }).setOrigin(0.5);
    btnBg.on('pointerdown', () => {
      SoundFX.play('click');
      this.scene.start('GameScene');
    });

    // Help button
    const helpBtn = this.add.circle(w - 30, 24, 20, 0x000000, 0).setStrokeStyle(2, 0x4ECDC4).setInteractive({ useHandCursor: true });
    this.add.text(w - 30, 24, '?', { fontSize: '18px', fontFamily: 'Arial Black', fill: '#4ECDC4' }).setOrigin(0.5);
    helpBtn.on('pointerdown', () => {
      SoundFX.play('click');
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // High score
    this.add.text(w / 2, 340, 'BEST: ' + GameState.highScore, { fontSize: '16px', fontFamily: 'Arial', fill: '#FFD700' }).setOrigin(0.5);
    this.add.text(w / 2, 370, 'Games: ' + GameState.gamesPlayed, { fontSize: '12px', fontFamily: 'Arial', fill: '#888888' }).setOrigin(0.5);
  }
}

class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }
  create() {
    const w = this.scale.width;
    this.scoreText = this.add.text(10, 10, 'Score: ' + GameState.score, { fontSize: '20px', fontFamily: 'Arial Black', fill: '#FFFFFF' });
    this.bestText = this.add.text(w - 10, 10, 'Best: ' + GameState.highScore, { fontSize: '16px', fontFamily: 'Arial', fill: '#888888' }).setOrigin(1, 0);
    this.chainText = this.add.text(10, 40, '', { fontSize: '14px', fontFamily: 'Arial Black', fill: '#FFD700' }).setAlpha(0);
    this.waveText = this.add.text(w / 2, 40, 'Wave: ' + GameState.wave, { fontSize: '14px', fontFamily: 'Arial', fill: '#FFFFFF' }).setOrigin(0.5, 0);

    // Pause button
    const pauseBtn = this.add.text(w - 20, 40, '||', { fontSize: '18px', fontFamily: 'Arial Black', fill: '#FFFFFF' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => this._togglePause());

    // Help button in HUD
    const helpBtn = this.add.text(w - 55, 40, '?', { fontSize: '16px', fontFamily: 'Arial Black', fill: '#4ECDC4' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    helpBtn.on('pointerdown', () => {
      SoundFX.play('click');
      this.scene.pause('GameScene');
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });

    // Spawn timer bar
    this.spawnBar = this.add.rectangle(w / 2, 455, w - 40, 8, 0x4ECDC4).setOrigin(0.5);
    this.spawnBarBg = this.add.rectangle(w / 2, 455, w - 40, 8, 0x2D2D44).setOrigin(0.5);
    this.spawnBar.setDepth(1);

    // Pause overlay elements (hidden by default)
    this.pauseOverlay = null;
    this.isPaused = false;

    // Listen for game events
    this.scene.get('GameScene').events.on('scoreUpdate', this._onScoreUpdate, this);
    this.scene.get('GameScene').events.on('chainUpdate', this._onChainUpdate, this);
    this.scene.get('GameScene').events.on('waveUpdate', this._onWaveUpdate, this);
    this.scene.get('GameScene').events.on('spawnTimerUpdate', this._onSpawnTimer, this);
    this.scene.get('GameScene').events.on('floatScore', this._onFloatScore, this);
  }

  _onScoreUpdate(score) {
    if (!this.scoreText) return;
    this.scoreText.setText('Score: ' + score);
    this.tweens.add({ targets: this.scoreText, scaleX: JUICE.scorePunchScale, scaleY: JUICE.scorePunchScale, duration: JUICE.scorePunchMs / 2, yoyo: true, ease: 'Back.easeOut' });
  }

  _onChainUpdate(chain) {
    if (!this.chainText) return;
    if (chain >= 2) {
      const colors = ['#FFFFFF', '#FFD700', '#FF8C00', '#FF4444'];
      const ci = Math.min(chain - 1, 3);
      this.chainText.setText('Chain: x' + chain).setAlpha(1).setStyle({ fill: colors[ci], fontSize: (14 + chain * 2) + 'px' });
    } else {
      this.chainText.setAlpha(0);
    }
  }

  _onWaveUpdate(wave) { if (this.waveText) this.waveText.setText('Wave: ' + wave); }

  _onSpawnTimer(pct) {
    if (this.spawnBar) this.spawnBar.setScale(Math.max(0, pct), 1);
  }

  _onFloatScore(x, y, pts) {
    const txt = this.add.text(x, y, '+' + pts, { fontSize: '18px', fontFamily: 'Arial Black', fill: '#FFD700' }).setOrigin(0.5);
    this.tweens.add({ targets: txt, y: y - JUICE.scoreFloatDist, alpha: 0, duration: JUICE.scoreFloatMs, onComplete: () => txt.destroy() });
  }

  _togglePause() {
    if (this.isPaused) return this._resumeGame();
    this.isPaused = true;
    this.scene.pause('GameScene');
    const w = this.scale.width, h = this.scale.height;
    this.pauseOverlay = this.add.container(0, 0);
    const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.75).setInteractive();
    const title = this.add.text(w / 2, h / 2 - 100, 'PAUSED', { fontSize: '28px', fontFamily: 'Arial Black', fill: '#FFFFFF' }).setOrigin(0.5);

    const resumeBtn = this.add.rectangle(w / 2, h / 2 - 30, 160, 48, 0x4ECDC4).setInteractive({ useHandCursor: true });
    const resumeTxt = this.add.text(w / 2, h / 2 - 30, 'RESUME', { fontSize: '18px', fontFamily: 'Arial Black', fill: '#0F0F23' }).setOrigin(0.5);
    resumeBtn.on('pointerdown', () => this._resumeGame());

    const helpBtn = this.add.rectangle(w / 2, h / 2 + 30, 160, 48, 0x000000, 0).setStrokeStyle(2, 0x4ECDC4).setInteractive({ useHandCursor: true });
    const helpTxt = this.add.text(w / 2, h / 2 + 30, 'HOW TO PLAY', { fontSize: '14px', fontFamily: 'Arial Black', fill: '#4ECDC4' }).setOrigin(0.5);
    helpBtn.on('pointerdown', () => { SoundFX.play('click'); this.scene.launch('HelpScene', { returnTo: 'GameScene' }); });

    const restartBtn = this.add.rectangle(w / 2, h / 2 + 90, 160, 48, 0x000000, 0).setStrokeStyle(2, 0xFF6B6B).setInteractive({ useHandCursor: true });
    const restartTxt = this.add.text(w / 2, h / 2 + 90, 'RESTART', { fontSize: '14px', fontFamily: 'Arial Black', fill: '#FF6B6B' }).setOrigin(0.5);
    restartBtn.on('pointerdown', () => { this._clearPause(); this.scene.stop('GameScene'); this.scene.stop('UIScene'); this.scene.start('GameScene'); });

    const menuBtn = this.add.text(w / 2, h / 2 + 140, 'MENU', { fontSize: '14px', fontFamily: 'Arial', fill: '#888888' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => { this._clearPause(); this.scene.stop('GameScene'); this.scene.stop('UIScene'); this.scene.start('MenuScene'); });

    this.pauseOverlay.add([bg, title, resumeBtn, resumeTxt, helpBtn, helpTxt, restartBtn, restartTxt, menuBtn]);
  }

  _resumeGame() {
    this._clearPause();
    this.scene.resume('GameScene');
  }

  _clearPause() {
    this.isPaused = false;
    if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) { this.finalScore = data.score || 0; this.finalWave = data.wave || 1; this.bestChain = data.bestChain || 0; this.isNewBest = data.isNewBest || false; }
  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85).setInteractive();
    this.add.text(w / 2, 100, 'GAME OVER', { fontSize: '32px', fontFamily: 'Arial Black', fill: '#FF6B6B' }).setOrigin(0.5);
    const scoreTxt = this.add.text(w / 2, 180, this.finalScore, { fontSize: '48px', fontFamily: 'Arial Black', fill: '#FFFFFF' }).setOrigin(0.5).setScale(0);
    this.tweens.add({ targets: scoreTxt, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.easeOut' });

    if (this.isNewBest) {
      const nb = this.add.text(w / 2, 220, 'NEW BEST!', { fontSize: '18px', fontFamily: 'Arial Black', fill: '#FFD700' }).setOrigin(0.5);
      this.tweens.add({ targets: nb, y: 215, duration: 300, yoyo: true, repeat: 2 });
      SoundFX.play('highscore');
    }

    this.add.text(w / 2, 250, 'Wave ' + this.finalWave, { fontSize: '16px', fontFamily: 'Arial', fill: '#888888' }).setOrigin(0.5);
    this.add.text(w / 2, 275, 'Best Chain: x' + this.bestChain, { fontSize: '14px', fontFamily: 'Arial', fill: '#4ECDC4' }).setOrigin(0.5);

    // Continue button (ad)
    if (AdManager.canContinue()) {
      const contBtn = this.add.rectangle(w / 2, 320, 200, 48, 0xFFD700).setInteractive({ useHandCursor: true });
      this.add.text(w / 2, 320, 'CONTINUE (-3 cells)', { fontSize: '14px', fontFamily: 'Arial Black', fill: '#0F0F23' }).setOrigin(0.5);
      contBtn.on('pointerdown', () => { AdManager.showRewarded('continue', () => { this.scene.stop(); this.events.emit('continue'); }); });
    }

    // Play Again
    const playBtn = this.add.rectangle(w / 2, 375, 180, 48, 0x4ECDC4).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, 375, 'PLAY AGAIN', { fontSize: '18px', fontFamily: 'Arial Black', fill: '#0F0F23' }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      SoundFX.play('click');
      this.scene.stop('GameScene');
      this.scene.stop();
      this.scene.stop('UIScene');
      this.scene.start('GameScene');
    });

    // Menu
    const menuBtn = this.add.text(w / 2, 430, 'MENU', { fontSize: '14px', fontFamily: 'Arial', fill: '#888888' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => {
      SoundFX.play('click');
      this.scene.stop('GameScene');
      this.scene.stop();
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    });
  }
}
