// ui.js - MenuScene, UIScene (HUD, pause, game over)

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = CONFIG.GAME.width, H = CONFIG.GAME.height;
    const C = CONFIG.COLORS;

    // Blueprint grid background
    const g = this.add.graphics();
    g.lineStyle(1, Phaser.Display.Color.HexStringToColor(C.GRID).color, 0.2);
    for (let x = 0; x <= W; x += 30) { g.lineBetween(x, 0, x, H); }
    for (let y = 0; y <= H; y += 30) { g.lineBetween(0, y, W, y); }

    // Title
    this.add.text(W / 2, 160, 'PIPE PARADOX', { fontSize: '32px', fill: C.UI_TEXT, fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(W / 2, 200, 'Route the flow. Survive the shift.', { fontSize: '14px', fill: C.UI_ACCENT }).setOrigin(0.5);

    // Animated pipes decoration
    if (this.textures.exists('straight')) {
      const p1 = this.add.image(80, 280, 'straight').setDisplaySize(40, 40).setAlpha(0.3);
      const p2 = this.add.image(310, 280, 'elbow').setDisplaySize(40, 40).setAlpha(0.3);
      this.tweens.add({ targets: [p1, p2], angle: 360, duration: 8000, repeat: -1 });
    }

    // Play button
    const playBtn = this.add.rectangle(W / 2, 320, 200, 60, Phaser.Display.Color.HexStringToColor(C.UI_ACCENT).color, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, 320, 'PLAY', { fontSize: '24px', fill: '#0A1628', fontStyle: 'bold' }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      this.tweens.add({ targets: playBtn, scaleX: 1.1, scaleY: 1.1, duration: 80, yoyo: true,
        onComplete: () => {
          GameState.reset();
          AdManager.reset();
          this.scene.start('GameScene');
        }
      });
    });

    // High score
    this.add.text(W / 2, 400, `Best: ${GameState.highScore}`, { fontSize: '16px', fill: C.STREAK }).setOrigin(0.5);

    // Help button
    const helpBtn = this.add.circle(60, 440, 22, Phaser.Display.Color.HexStringToColor(C.UI_ACCENT).color)
      .setInteractive({ useHandCursor: true });
    this.add.text(60, 440, '?', { fontSize: '22px', fill: '#0A1628', fontStyle: 'bold' }).setOrigin(0.5);
    helpBtn.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Sound toggle
    this.soundIcon = this.add.text(330, 440, GameState.soundEnabled ? 'SND' : 'MUTE',
      { fontSize: '14px', fill: C.UI_ACCENT, fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.soundIcon.on('pointerdown', () => {
      GameState.soundEnabled = !GameState.soundEnabled;
      this.soundIcon.setText(GameState.soundEnabled ? 'SND' : 'MUTE');
    });
  }
}

// UIScene - parallel HUD + overlays
class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create() {
    const W = CONFIG.GAME.width, C = CONFIG.COLORS;
    this.isGameOver = false;
    this.isPaused = false;
    this.pauseGroup = null;
    this.gameOverGroup = null;

    // HUD top bar bg
    this.add.rectangle(W / 2, CONFIG.HUD_HEIGHT / 2, W, CONFIG.HUD_HEIGHT,
      Phaser.Display.Color.HexStringToColor(C.DARK_SLATE).color, 0.85).setDepth(100);

    // Score
    this.scoreTxt = this.add.text(10, 8, `Score: ${GameState.score}`,
      { fontSize: '18px', fill: C.UI_TEXT, fontStyle: 'bold' }).setDepth(101);

    // Rule name
    this.ruleTxt = this.add.text(W / 2, 8, 'NORMAL',
      { fontSize: '15px', fill: C.UI_ACCENT, fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(101);

    // Streak
    this.streakTxt = this.add.text(W - 10, 8, '',
      { fontSize: '16px', fill: C.STREAK, fontStyle: 'bold' }).setOrigin(1, 0).setDepth(101);

    // Help button in HUD
    const helpBtn = this.add.circle(20, 36, 12, Phaser.Display.Color.HexStringToColor(C.UI_ACCENT).color)
      .setDepth(101).setInteractive({ useHandCursor: true });
    this.add.text(20, 36, '?', { fontSize: '14px', fill: '#0A1628', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);
    helpBtn.on('pointerdown', () => this.showPause());

    // Timer bar
    this.timerBar = this.add.rectangle(120, 36, 140, 10, 0x4FC3F7).setOrigin(0, 0.5).setDepth(101);
    this.timerBarBg = this.add.rectangle(120, 36, 140, 10, 0x1A3A5C).setOrigin(0, 0.5).setDepth(100);

    // Overflow indicators
    this.overflowDots = [];
    for (let i = 0; i < 3; i++) {
      const dot = this.add.circle(300 + i * 24, 36, 8, Phaser.Display.Color.HexStringToColor(C.GRID).color)
        .setStrokeStyle(2, 0xFF1744).setDepth(101);
      this.overflowDots.push(dot);
    }

    // Bottom bar
    const BY = CONFIG.GAME.height - CONFIG.BOTTOM_BAR_HEIGHT;
    this.add.rectangle(W / 2, BY + 32, W, CONFIG.BOTTOM_BAR_HEIGHT,
      Phaser.Display.Color.HexStringToColor(C.DARK_SLATE).color, 0.85).setDepth(100);

    // Rule preview
    this.rulePreview = this.add.text(15, BY + 20, 'Next: --',
      { fontSize: '13px', fill: C.UI_TEXT }).setDepth(101);

    // Pause button
    const pauseBtn = this.add.rectangle(W - 35, BY + 32, 44, 44, Phaser.Display.Color.HexStringToColor(C.UI_ACCENT).color)
      .setDepth(101).setInteractive({ useHandCursor: true });
    this.add.text(W - 35, BY + 32, '||', { fontSize: '18px', fill: '#0A1628', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(102);
    pauseBtn.on('pointerdown', () => this.showPause());

    // Listen for game events
    const gs = this.scene.get('GameScene');
    if (gs) {
      gs.events.on('updateHUD', this.updateHUD, this);
      gs.events.on('gameOver', this.showGameOver, this);
      gs.events.on('rulePreview', this.updateRulePreview, this);
      gs.events.on('overflow', this.onOverflow, this);
    }
  }

  updateHUD(data) {
    if (!this.scoreTxt) return;
    this.scoreTxt.setText(`Score: ${data.score}`);
    this.ruleTxt.setText(data.ruleName || 'NORMAL');
    this.streakTxt.setText(data.streak > 1 ? `x${data.streak}` : '');
    // Timer bar
    const pct = Math.max(0, data.timerPct || 0);
    this.timerBar.setDisplaySize(140 * pct, 10);
    if (pct < 0.4) this.timerBar.setFillStyle(0xFF1744);
    else this.timerBar.setFillStyle(0x4FC3F7);
  }

  updateRulePreview(name) {
    if (this.rulePreview) this.rulePreview.setText(`Next: ${name}`);
  }

  onOverflow(count) {
    for (let i = 0; i < 3; i++) {
      if (i < count) {
        this.overflowDots[i].setFillStyle(0xFF1744);
        this.tweens.add({ targets: this.overflowDots[i], scaleX: 1.4, scaleY: 1.4, duration: 150, yoyo: true });
      }
    }
  }

  showPause() {
    if (this.isGameOver || this.isPaused) return;
    this.isPaused = true;
    const gs = this.scene.get('GameScene');
    if (gs) gs.scene.pause();
    this.createPauseOverlay();
  }

  createPauseOverlay() {
    const W = CONFIG.GAME.width, H = CONFIG.GAME.height, C = CONFIG.COLORS;
    this.pauseGroup = this.add.group();
    const bg = this.add.rectangle(W/2, H/2, W, H, 0x0A1628, 0.8).setDepth(200).setInteractive();
    this.pauseGroup.add(bg);
    const btns = [
      { y: 220, txt: 'Resume', col: C.UI_ACCENT, fn: () => this.resumeGame() },
      { y: 290, txt: 'How to Play', col: C.UI_ACCENT, fn: () => { this.scene.launch('HelpScene', { returnTo: 'UIScene' }); } },
      { y: 360, txt: 'Restart', col: '#FF8C00', fn: () => this.restartGame() },
      { y: 430, txt: 'Menu', col: C.DANGER, fn: () => this.quitToMenu() }
    ];
    btns.forEach(b => {
      const r = this.add.rectangle(W/2, b.y, 180, 50, Phaser.Display.Color.HexStringToColor(b.col).color).setDepth(201).setInteractive({useHandCursor:true});
      const t = this.add.text(W/2, b.y, b.txt, {fontSize:'18px',fill:'#0A1628',fontStyle:'bold'}).setOrigin(0.5).setDepth(202);
      r.on('pointerdown', b.fn);
      this.pauseGroup.addMultiple([r, t]);
    });
  }

  resumeGame() {
    if (this.pauseGroup) { this.pauseGroup.destroy(true); this.pauseGroup = null; }
    this.isPaused = false;
    const gs = this.scene.get('GameScene');
    if (gs) gs.scene.resume();
  }

  restartGame() {
    if (this.pauseGroup) { this.pauseGroup.destroy(true); this.pauseGroup = null; }
    this.isPaused = false;
    this.isGameOver = false;
    if (this.gameOverGroup) { this.gameOverGroup.destroy(true); this.gameOverGroup = null; }
    GameState.reset();
    this.scene.get('GameScene').scene.restart();
    this.scene.restart();
  }

  quitToMenu() {
    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('MenuScene');
  }

  showGameOver(data) {
    this.isGameOver = true;
    const W = CONFIG.GAME.width, H = CONFIG.GAME.height, C = CONFIG.COLORS;
    GameState.saveHighScore();

    // Delay for death effects
    this.time.delayedCall(800, () => {
      this.gameOverGroup = this.add.group();
      const bg = this.add.rectangle(W/2,H/2,W,H,0x0A1628,0.85).setDepth(300).setInteractive();
      this.gameOverGroup.add(bg);

      const goTxt = this.add.text(W/2, 140, 'GAME OVER', {fontSize:'28px',fill:C.DANGER,fontStyle:'bold'}).setOrigin(0.5).setDepth(301);
      const sTxt = this.add.text(W/2, 200, `${GameState.score}`, {fontSize:'48px',fill:C.UI_TEXT,fontStyle:'bold'}).setOrigin(0.5).setDepth(301);
      this.tweens.add({targets:sTxt, scaleX:1.3, scaleY:1.3, duration:200, yoyo:true});
      this.gameOverGroup.addMultiple([goTxt, sTxt]);

      if (GameState.score >= GameState.highScore && GameState.score > 0) {
        const nb = this.add.text(W/2, 240, 'NEW BEST!', {fontSize:'20px',fill:C.STREAK,fontStyle:'bold'}).setOrigin(0.5).setDepth(301);
        this.tweens.add({targets:nb, alpha:0.5, duration:500, yoyo:true, repeat:-1});
        this.gameOverGroup.add(nb);
      }

      const cycTxt = this.add.text(W/2, 270, `${GameState.cycleNumber} rule cycles survived`, {fontSize:'16px',fill:C.UI_ACCENT}).setOrigin(0.5).setDepth(301);
      this.gameOverGroup.add(cycTxt);

      // Play again
      const paBtn = this.add.rectangle(W/2, 380, 200, 50, Phaser.Display.Color.HexStringToColor(C.UI_ACCENT).color).setDepth(301).setInteractive({useHandCursor:true});
      const paTxt = this.add.text(W/2, 380, 'Play Again', {fontSize:'20px',fill:'#0A1628',fontStyle:'bold'}).setOrigin(0.5).setDepth(302);
      paBtn.on('pointerdown', () => this.restartGame());
      this.gameOverGroup.addMultiple([paBtn, paTxt]);

      // Menu
      const mBtn = this.add.rectangle(W/2, 450, 200, 50, Phaser.Display.Color.HexStringToColor(C.DARK_SLATE).color)
        .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(C.UI_ACCENT).color).setDepth(301).setInteractive({useHandCursor:true});
      const mTxt = this.add.text(W/2, 450, 'Menu', {fontSize:'18px',fill:C.UI_ACCENT,fontStyle:'bold'}).setOrigin(0.5).setDepth(302);
      mBtn.on('pointerdown', () => this.quitToMenu());
      this.gameOverGroup.addMultiple([mBtn, mTxt]);

      AdManager.showInterstitial();
    });
  }

  shutdown() {
    const gs = this.scene.get('GameScene');
    if (gs) {
      gs.events.off('updateHUD', this.updateHUD, this);
      gs.events.off('gameOver', this.showGameOver, this);
      gs.events.off('rulePreview', this.updateRulePreview, this);
      gs.events.off('overflow', this.onOverflow, this);
    }
  }
}
