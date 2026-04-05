// Set Surgeon - HUD, Venn Diagram, and Timer (mixed into GameScene)
Object.assign(GameScene.prototype, {
  drawVennDiagram() {
    this.vennGfx = this.add.graphics().setDepth(1);
    const circles = CONFIG.CIRCLES;
    [['A', circles.A], ['B', circles.B], ['C', circles.C]].forEach(([key, c]) => {
      const color = Phaser.Display.Color.HexStringToColor(
        key === 'A' ? CONFIG.COLORS.CIRCLE_A : key === 'B' ? CONFIG.COLORS.CIRCLE_B : CONFIG.COLORS.CIRCLE_C
      ).color;
      this.vennGfx.fillStyle(color, 0.12);
      this.vennGfx.fillCircle(c.x, c.y, c.r);
      this.vennGfx.lineStyle(3, color, 1);
      this.vennGfx.strokeCircle(c.x, c.y, c.r);
    });

    this.labelA = this.add.text(circles.A.x - 50, circles.A.y - circles.A.r - 18, '???',
      { fontSize: '14px', fontFamily: 'monospace', fill: CONFIG.COLORS.CIRCLE_A, fontStyle: 'bold' }).setDepth(5);
    this.labelB = this.add.text(circles.B.x - 10, circles.B.y - circles.B.r - 18, '???',
      { fontSize: '14px', fontFamily: 'monospace', fill: CONFIG.COLORS.CIRCLE_B, fontStyle: 'bold' }).setDepth(5);
    this.labelC = this.add.text(circles.C.x - 20, circles.C.y + circles.C.r + 5, '???',
      { fontSize: '14px', fontFamily: 'monospace', fill: CONFIG.COLORS.CIRCLE_C, fontStyle: 'bold' }).setDepth(5);

    this.regionOverlays = {};
    Object.entries(CONFIG.REGION_CENTERS).forEach(([id, pos]) => {
      const overlay = this.add.circle(pos.x, pos.y, 28, 0xC3B1E1, 0).setDepth(2);
      this.regionOverlays[id] = overlay;
    });
  },

  createHUD() {
    this.add.rectangle(CONFIG.GAME_WIDTH / 2, CONFIG.HUD_HEIGHT / 2,
      CONFIG.GAME_WIDTH, CONFIG.HUD_HEIGHT, 0x2D3436).setDepth(80);

    this.lifeIcons = [];
    for (let i = 0; i < CONFIG.LIVES; i++) {
      const icon = this.add.image(20 + i * 28, CONFIG.HUD_HEIGHT / 2, 'lifeFull').setDepth(81);
      this.lifeIcons.push(icon);
    }

    this.roundText = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.HUD_HEIGHT / 2,
      'ROUND ' + GameState.round,
      { fontSize: '14px', fontFamily: 'monospace', fill: '#FFFFFF', fontStyle: 'bold' }
    ).setOrigin(0.5).setDepth(81);

    this.scoreText = this.add.text(CONFIG.GAME_WIDTH - 10, CONFIG.HUD_HEIGHT / 2,
      String(GameState.score),
      { fontSize: '16px', fontFamily: 'monospace', fill: '#FFFFFF', fontStyle: 'bold' }
    ).setOrigin(1, 0.5).setDepth(81);

    const pauseBtn = this.add.text(CONFIG.GAME_WIDTH - 10, 12, '| |',
      { fontSize: '12px', fontFamily: 'monospace', fill: '#FFFFFF', fontStyle: 'bold' }
    ).setOrigin(1, 0).setDepth(82).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => { GameState.lastInputTime = Date.now(); this.togglePause(); });

    this.streakBadge = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.HUD_HEIGHT + 8, '',
      { fontSize: '16px', fontFamily: 'monospace', fill: CONFIG.COLORS.STREAK, fontStyle: 'bold' }
    ).setOrigin(0.5, 0).setDepth(81).setAlpha(0);
  },

  createTimerBar() {
    this.timerBarBg = this.add.rectangle(CONFIG.GAME_WIDTH / 2, CONFIG.SPAWN_Y - 30,
      CONFIG.GAME_WIDTH - 40, 8, 0x636E72, 0.3).setDepth(10);
    this.timerBar = this.add.rectangle(20, CONFIG.SPAWN_Y - 30,
      CONFIG.GAME_WIDTH - 40, 8, 0xF39C12).setOrigin(0, 0.5).setDepth(11);
  },

  createQueuePreview() {
    this.queuePreviews = [];
    for (let i = 0; i < 3; i++) {
      const txt = this.add.text(120 + i * 60, CONFIG.SPAWN_Y + 30, '',
        { fontSize: '14px', fontFamily: 'monospace', fill: '#636E72' }
      ).setOrigin(0.5).setAlpha(0.5).setDepth(10);
      this.queuePreviews.push(txt);
    }
    this.add.text(60, CONFIG.SPAWN_Y + 30, 'Next:',
      { fontSize: '12px', fontFamily: 'monospace', fill: '#636E72' }
    ).setOrigin(0.5).setDepth(10);
  },

  highlightRegion(regionId) {
    Object.entries(this.regionOverlays).forEach(([id, overlay]) => {
      overlay.setAlpha(id === regionId ? 0.3 : 0);
    });
  },

  clearHighlights() {
    Object.values(this.regionOverlays).forEach(o => o.setAlpha(0));
  },

  updateMultiplier() {
    if (GameState.streak >= 10) GameState.multiplier = CONFIG.SCORE.STREAK_10;
    else if (GameState.streak >= 6) GameState.multiplier = CONFIG.SCORE.STREAK_6;
    else if (GameState.streak >= 3) GameState.multiplier = CONFIG.SCORE.STREAK_3;
    else GameState.multiplier = 1;

    if (GameState.multiplier > 1) {
      this.streakBadge.setText('x' + GameState.multiplier);
      this.streakBadge.setAlpha(1);
      if (GameState.streak === 3 || GameState.streak === 6 || GameState.streak === 10) {
        this.streakMilestone();
      }
    }
  },

  updateScoreDisplay(added) {
    this.scoreText.setText(String(GameState.score));
    this.scorePunch();
    if (GameState.score > GameState.highScore) {
      GameState.highScore = GameState.score;
      try { localStorage.setItem('set-surgeon_high_score', String(GameState.highScore)); } catch(e){}
    }
  },

  updateLivesDisplay() {
    for (let i = 0; i < CONFIG.LIVES; i++) {
      this.lifeIcons[i].setTexture(i < GameState.lives ? 'lifeFull' : 'lifeEmpty');
    }
  },

  updateQueuePreview() {
    for (let i = 0; i < 3; i++) {
      const idx = this.currentIndex + 1 + i;
      if (this.roundData && idx < this.roundData.elements.length) {
        const el = this.roundData.elements[idx];
        this.queuePreviews[i].setText(el.type === 'number' ? String(el.value) : el.shape.name[0].toUpperCase());
      } else {
        this.queuePreviews[i].setText('');
      }
    }
  },

  revealRules(onDone) {
    const dur = 500;
    this.tweens.add({ targets: this.labelA, alpha: 0, duration: 200, onComplete: () => {
      this.labelA.setText(this.roundData.ruleA.label);
      this.tweens.add({ targets: this.labelA, alpha: 1, duration: dur });
    }});
    this.tweens.add({ targets: this.labelB, alpha: 0, duration: 200, onComplete: () => {
      this.labelB.setText(this.roundData.ruleB.label);
      this.tweens.add({ targets: this.labelB, alpha: 1, duration: dur });
    }});
    this.tweens.add({ targets: this.labelC, alpha: 0, duration: 200, onComplete: () => {
      this.labelC.setText(this.roundData.ruleC.label);
      this.tweens.add({ targets: this.labelC, alpha: 1, duration: dur });
    }});
    this.time.delayedCall(200 + dur + 1000, onDone);
  },

  showBanner(text, color, onComplete) {
    const banner = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2, text,
      { fontSize: '24px', fontFamily: 'monospace', fill: '#FFFFFF', fontStyle: 'bold',
        backgroundColor: color, padding: { x: 20, y: 10 } }
    ).setOrigin(0.5).setDepth(95).setScale(0);
    this.tweens.add({
      targets: banner, scale: 1, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(800, () => {
          this.tweens.add({
            targets: banner, alpha: 0, duration: 200,
            onComplete: () => { banner.destroy(); if (onComplete) onComplete(); }
          });
        });
      }
    });
  }
});
