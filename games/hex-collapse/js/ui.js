// ui.js — MenuScene, HUD overlay, GameOver overlay, Pause overlay

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    this.add.rectangle(W / 2, H / 2, W, H, 0x1A1A2E);
    this.add.text(W / 2, H * 0.25, 'HEX COLLAPSE', {
      fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.33, 'Place. Sum to 10. Cascade.', {
      fontSize: '16px', fontFamily: 'Arial', color: CONFIG.HEX_STROKE
    }).setOrigin(0.5);
    const playBtn = this.add.rectangle(W / 2, H * 0.55, 200, 60, 0x00E5FF).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H * 0.55, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#1A1A2E'
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      this.tweens.add({ targets: playBtn, scaleX: 0.9, scaleY: 0.9, duration: 60, yoyo: true,
        onComplete: () => this.scene.start('GameScene')
      });
    });
    const helpBtn = this.add.circle(W - 36, 36, 22, 0x3A3A5C).setInteractive({ useHandCursor: true });
    this.add.text(W - 36, 36, '?', { fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF' }).setOrigin(0.5);
    helpBtn.on('pointerdown', () => { this.scene.pause(); this.scene.launch('HelpScene', { returnTo: 'MenuScene' }); });
    const hs = parseInt(localStorage.getItem('hex_collapse_high_score') || '0');
    this.add.text(W / 2, H * 0.70, 'Best: ' + hs, { fontSize: '24px', fontFamily: 'Arial', color: COLORS.gold }).setOrigin(0.5);
    const soundOn = GameState.settings.sound;
    const soundBtn = this.add.circle(W - 36, H - 36, 22, 0x3A3A5C).setInteractive({ useHandCursor: true });
    const soundTxt = this.add.text(W - 36, H - 36, soundOn ? 'ON' : 'OFF', { fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF' }).setOrigin(0.5);
    soundBtn.on('pointerdown', () => {
      GameState.settings.sound = !GameState.settings.sound;
      soundTxt.setText(GameState.settings.sound ? 'ON' : 'OFF');
      localStorage.setItem('hex_collapse_settings', JSON.stringify(GameState.settings));
    });
  }
}

class HUDScene extends Phaser.Scene {
  constructor() { super('HUDScene'); }

  create() {
    const W = CONFIG.WIDTH;
    this.add.rectangle(W / 2, CONFIG.HUD_HEIGHT / 2, W, CONFIG.HUD_HEIGHT, 0x1A1A2E, 0.8);
    this.scoreTxt = this.add.text(16, 12, 'Score: ' + GameState.score, {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    });
    this.stageTxt = this.add.text(W / 2, 12, 'Stage ' + GameState.stage, {
      fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF'
    }).setOrigin(0.5, 0);
    const helpBtn = this.add.circle(W - 56, 24, 18, 0x3A3A5C).setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W - 56, 24, '?', { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF' }).setOrigin(0.5).setDepth(10);
    helpBtn.on('pointerdown', () => {
      const gs = this.scene.get('GameScene');
      if (gs) gs.pauseGame();
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });
    const pauseBtn = this.add.circle(W - 18, 24, 18, 0x3A3A5C).setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W - 18, 24, '||', { fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF' }).setOrigin(0.5).setDepth(10);
    pauseBtn.on('pointerdown', () => { const gs = this.scene.get('GameScene'); if (gs) gs.pauseGame(); });
    this.chainTxt = this.add.text(W / 2, CONFIG.HEIGHT / 2 + 100, '', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.gold
    }).setOrigin(0.5).setAlpha(0);
    const barY = CONFIG.HEIGHT - CONFIG.PROGRESS_HEIGHT / 2;
    this.add.rectangle(W / 2, barY, W - 32, 16, 0x3A3A5C, 0.5);
    this.progressBar = this.add.rectangle(16, barY, 0, 14, 0x00E5FF).setOrigin(0, 0.5);
    this.progressTxt = this.add.text(W / 2, barY, '', { fontSize: '11px', fontFamily: 'Arial', color: '#FFF' }).setOrigin(0.5);
    this.idleTxt = this.add.text(W / 2, CONFIG.HUD_HEIGHT + 10, '', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.danger
    }).setOrigin(0.5, 0).setAlpha(0);
    this.add.rectangle(W / 2, CONFIG.HEIGHT - CONFIG.PROGRESS_HEIGHT - CONFIG.PREVIEW_HEIGHT / 2, W, CONFIG.PREVIEW_HEIGHT, 0x1A1A2E, 0.7);
    const gs = this.scene.get('GameScene');
    if (gs) {
      gs.events.on('scoreUpdate', s => this._updateScore(s));
      gs.events.on('stageUpdate', s => { if (this.stageTxt) this.stageTxt.setText('Stage ' + s); });
      gs.events.on('chainUpdate', c => this._showChain(c));
      gs.events.on('progressUpdate', (cur, max) => this._updateProgress(cur, max));
      gs.events.on('idleUpdate', sec => this._updateIdle(sec));
    }
  }

  _updateScore(score) {
    if (!this.scoreTxt) return;
    this.scoreTxt.setText('Score: ' + score);
    this.tweens.add({ targets: this.scoreTxt, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });
  }

  _showChain(chain) {
    if (!this.chainTxt) return;
    if (chain > 1) {
      this.chainTxt.setText('CHAIN x' + chain + '!').setAlpha(1).setFontSize(28 + chain * 6);
      this.tweens.add({ targets: this.chainTxt, scaleX: 1.1, scaleY: 1.1, duration: 150, yoyo: true });
    } else { this.tweens.add({ targets: this.chainTxt, alpha: 0, duration: 300 }); }
  }

  _updateProgress(cur, max) {
    if (!this.progressBar) return;
    this.progressBar.width = (CONFIG.WIDTH - 32) * Math.min(cur / max, 1);
    this.progressTxt.setText('Collapses: ' + cur + '/' + max);
  }

  _updateIdle(sec) {
    if (!this.idleTxt) return;
    if (sec > 0) { this.idleTxt.setText('IDLE: ' + sec + 's').setAlpha(1).setColor(sec <= 10 ? COLORS.danger : '#FFF'); }
    else this.idleTxt.setAlpha(0);
  }

  shutdown() {
    const gs = this.scene.get('GameScene');
    if (gs) { gs.events.off('scoreUpdate'); gs.events.off('stageUpdate'); gs.events.off('chainUpdate'); gs.events.off('progressUpdate'); gs.events.off('idleUpdate'); }
  }
}

// Game Over overlay helper
const GameOverUI = {
  show(scene, isNewBest) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    scene.scene.stop('HUDScene');
    const objs = [];
    objs.push(scene.add.rectangle(W / 2, H / 2, W, H, 0x1A1A2E, 0.85).setDepth(100));
    objs.push(scene.add.text(W / 2, H * 0.2, 'GAME OVER', { fontSize: '40px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.danger }).setOrigin(0.5).setDepth(101));
    const st = scene.add.text(W / 2, H * 0.32, '' + GameState.score, { fontSize: '56px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF' }).setOrigin(0.5).setDepth(101);
    scene.tweens.add({ targets: st, scaleX: 1.2, scaleY: 1.2, duration: 200, yoyo: true }); objs.push(st);
    if (isNewBest) {
      const nb = scene.add.text(W / 2, H * 0.4, 'NEW BEST!', { fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.gold }).setOrigin(0.5).setDepth(101);
      scene.tweens.add({ targets: nb, scaleX: 1.5, scaleY: 1.5, duration: 300, yoyo: true, repeat: 1 }); objs.push(nb);
    }
    objs.push(scene.add.text(W / 2, H * 0.47, 'Stage ' + GameState.stage + '  |  Best Chain: x' + GameState.bestChain, { fontSize: '16px', fontFamily: 'Arial', color: CONFIG.HEX_STROKE }).setOrigin(0.5).setDepth(101));
    const contBtn = scene.add.rectangle(W / 2, H * 0.58, 220, 50, 0xFFD700).setInteractive({ useHandCursor: true }).setDepth(101);
    objs.push(contBtn);
    objs.push(scene.add.text(W / 2, H * 0.58, 'Continue (remove 3)', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#1A1A2E' }).setOrigin(0.5).setDepth(102));
    contBtn.on('pointerdown', () => {
      AdManager.showRewarded(() => {
        const filled = []; scene.grid.forEach((v, k) => { if (v) filled.push(k); });
        for (let i = 0; i < Math.min(3, filled.length); i++) {
          const idx = Math.floor(Math.random() * filled.length);
          const k = filled.splice(idx, 1)[0];
          scene.grid.set(k, null); scene.hexSprites.get(k).setAlpha(0.4).setTexture('hex');
          if (scene.numTexts.has(k)) { scene.numTexts.get(k).destroy(); scene.numTexts.delete(k); }
        }
        scene.isGameOver = false; scene.gameOverShown = false; scene.inputLocked = false;
        scene.lastInputTime = Date.now(); objs.forEach(o => o.destroy());
        scene.scene.launch('HUDScene');
      }, () => {});
    });
    const playBtn = scene.add.rectangle(W / 2, H * 0.68, 200, 50, 0x00E5FF).setInteractive({ useHandCursor: true }).setDepth(101);
    objs.push(playBtn);
    objs.push(scene.add.text(W / 2, H * 0.68, 'Play Again', { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#1A1A2E' }).setOrigin(0.5).setDepth(102));
    playBtn.on('pointerdown', () => { scene.scene.stop('HUDScene'); scene.scene.restart(); });
    const menuBtn = scene.add.rectangle(W / 2, H * 0.77, 140, 40, 0x3A3A5C).setInteractive({ useHandCursor: true }).setDepth(101);
    objs.push(menuBtn);
    objs.push(scene.add.text(W / 2, H * 0.77, 'Menu', { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF' }).setOrigin(0.5).setDepth(102));
    menuBtn.on('pointerdown', () => { scene.scene.stop('HUDScene'); scene.scene.start('MenuScene'); });
  }
};

// Pause overlay helper
const PauseUI = {
  show(gameScene) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const hudScene = gameScene.scene.get('HUDScene');
    if (!hudScene) return;
    const objs = [];
    objs.push(hudScene.add.rectangle(W / 2, H / 2, W, H, 0x1A1A2E, 0.85).setDepth(200));
    objs.push(hudScene.add.text(W / 2, H * 0.25, 'PAUSED', { fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF' }).setOrigin(0.5).setDepth(201));
    const btns = [
      { y: H * 0.42, label: 'Resume', color: 0x00E5FF, fn: () => { objs.forEach(o => o.destroy()); gameScene.scene.resume(); } },
      { y: H * 0.52, label: 'How to Play', color: 0x3A3A5C, fn: () => { objs.forEach(o => o.destroy()); hudScene.scene.launch('HelpScene', { returnTo: 'GameScene' }); } },
      { y: H * 0.62, label: 'Restart', color: 0x3A3A5C, fn: () => { objs.forEach(o => o.destroy()); gameScene.scene.resume(); gameScene.scene.stop('HUDScene'); gameScene.scene.restart(); } },
      { y: H * 0.72, label: 'Quit to Menu', color: 0x3A3A5C, fn: () => { objs.forEach(o => o.destroy()); gameScene.scene.resume(); gameScene.scene.stop('HUDScene'); gameScene.scene.start('MenuScene'); } }
    ];
    btns.forEach(b => {
      const btn = hudScene.add.rectangle(W / 2, b.y, 180, 50, b.color).setInteractive({ useHandCursor: true }).setDepth(201);
      const txt = hudScene.add.text(W / 2, b.y, b.label, { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: b.color === 0x00E5FF ? '#1A1A2E' : '#FFF' }).setOrigin(0.5).setDepth(202);
      btn.on('pointerdown', b.fn); objs.push(btn, txt);
    });
  }
};
