// hud.js — HUD creation, pause overlay, timer arc, body limit enforcement
Object.assign(GameScene.prototype, {
  createHUD() {
    this.add.rectangle(CONFIG.GAME_WIDTH / 2, 25, CONFIG.GAME_WIDTH, 50, 0x16213E).setDepth(20);
    this.scoreTxt = this.add.text(10, 15, 'SCORE: ' + this.score, {
      fontSize: '16px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setDepth(21);
    this.levelTxt = this.add.text(CONFIG.GAME_WIDTH / 2, 15, 'LVL ' + this.level, {
      fontSize: '14px', fill: '#FFD700', fontFamily: 'Arial'
    }).setOrigin(0.5, 0).setDepth(21);
    const pauseBtn = this.add.rectangle(CONFIG.GAME_WIDTH - 22, 25, 36, 36, 0x57606F, 0.6).setDepth(22).setInteractive({ useHandCursor: true });
    this.add.text(CONFIG.GAME_WIDTH - 22, 25, 'II', {
      fontSize: '16px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(23).disableInteractive();
    pauseBtn.on('pointerdown', () => this.togglePause());
    const helpBtn = this.add.rectangle(CONFIG.GAME_WIDTH - 60, 25, 36, 36, 0x57606F, 0.6).setDepth(22).setInteractive({ useHandCursor: true });
    this.add.text(CONFIG.GAME_WIDTH - 60, 25, '?', {
      fontSize: '16px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(23).disableInteractive();
    helpBtn.on('pointerdown', () => {
      if (!this.paused) this.togglePause();
      this.scene.pause('GameScene');
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });
  },

  addScore(pts) {
    this.score += pts;
    if (this.scoreTxt) {
      this.scoreTxt.setText('SCORE: ' + this.score);
      Effects.scalePunch(this, this.scoreTxt, 1.25, 150);
    }
  },

  updateLevel() {
    const newConfig = Stages.getLevelConfig(this.elapsedTime);
    if (newConfig.level !== this.level) {
      this.level = newConfig.level;
      this.levelConfig = newConfig;
      this.forcedDropTime = newConfig.forcedDropTimer;
      if (this.levelTxt) this.levelTxt.setText('LVL ' + this.level);
      this.floorTimer.delay = newConfig.floorRiseInterval * 1000;
    }
  },

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.matter.world.pause();
      this.showPauseOverlay();
    } else {
      this.matter.world.resume();
      this.hidePauseOverlay();
    }
  },

  showPauseOverlay() {
    if (this.pauseContainer) return;
    const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;
    this.pauseContainer = this.add.container(0, 0).setDepth(90);
    this.pauseContainer.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8));
    this.pauseContainer.add(this.add.text(W / 2, H * 0.3, 'PAUSED', {
      fontSize: '28px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5));
    const btns = [
      { y: H * 0.45, label: 'RESUME', color: 0x2ED573, action: () => this.togglePause() },
      { y: H * 0.55, label: 'RESTART', color: 0x57606F, action: () => { this.scene.stop(); this.scene.start('GameScene'); } },
      { y: H * 0.65, label: 'HELP', color: 0x57606F, action: () => { this.scene.pause('GameScene'); this.scene.launch('HelpScene', { returnTo: 'GameScene' }); } },
      { y: H * 0.75, label: 'MENU', color: 0x57606F, action: () => { this.scene.stop(); this.scene.start('MenuScene'); } }
    ];
    btns.forEach(b => {
      const rect = this.add.rectangle(W / 2, b.y, 160, 44, b.color, 1).setInteractive({ useHandCursor: true });
      const txt = this.add.text(W / 2, b.y, b.label, {
        fontSize: '18px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5).disableInteractive();
      rect.on('pointerdown', () => { Effects.playClick(); b.action(); });
      this.pauseContainer.add([rect, txt]);
    });
  },

  hidePauseOverlay() {
    if (this.pauseContainer) { this.pauseContainer.destroy(true); this.pauseContainer = null; }
  },

  updateTimerArc() {
    this.timerArc.clear();
    const cx = CONFIG.GAME_WIDTH - 30, cy = this.dropRailY, r = 12;
    const pct = this.dropCountdown / this.forcedDropTime;
    let color = 0x2ED573;
    if (this.dropCountdown <= 1.0) color = 0xFFA502;
    if (this.dropCountdown <= 0.5) color = 0xFF4757;
    this.timerArc.lineStyle(3, color, 0.9);
    this.timerArc.beginPath();
    this.timerArc.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * pct), false);
    this.timerArc.strokePath();
  },

  enforceBodyLimit() {
    const bodies = this.matter.world.getAllBodies().filter(b => b.gameData && !b.gameData.merging);
    if (bodies.length > CONFIG.BODY_LIMIT) {
      bodies.sort((a, b) => a.gameData.radius - b.gameData.radius);
      const victim = bodies[0];
      victim.gameData.merging = true;
      const s = this.bubbleSprites.get(victim.id);
      if (s) Effects.particles(this, s.x, s.y, 6, 0xFFFFFF, 40, 200);
      this.time.delayedCall(0, () => this.destroyBubble(victim));
    }
  },

  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    Effects.playGameOver();
    Effects.deathFlash(this);
    this.cameras.main.shake(500, 0.01);
    const hs = parseInt(localStorage.getItem('bubble-merge-drop_high_score') || '0');
    const isHighScore = this.score > hs;
    if (isHighScore) localStorage.setItem('bubble-merge-drop_high_score', this.score);
    const bodies = this.matter.world.getAllBodies();
    let delay = 0;
    bodies.forEach(b => {
      if (!b.gameData) return;
      const sprite = this.bubbleSprites.get(b.id);
      if (sprite) {
        this.time.delayedCall(delay, () => {
          this.tweens.add({ targets: sprite, scaleX: 0, scaleY: 0, duration: 200, onComplete: () => sprite.destroy() });
        });
        delay += 30;
      }
    });
    this.time.delayedCall(600, () => {
      this.scene.launch('GameOverScene', { score: this.score, level: this.level, isHighScore });
    });
  }
});
