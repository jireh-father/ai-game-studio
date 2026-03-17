// Flatline - HUD Scene & Pause Overlay

function getStreakMultiplier(streak) {
  let mult = 1;
  for (const t of STREAK_THRESHOLDS) {
    if (streak >= t.count) mult = t.multiplier;
  }
  return mult;
}

class HUDScene extends Phaser.Scene {
  constructor() { super('HUDScene'); }

  create() {
    const w = this.scale.width;
    this.add.rectangle(w / 2, HUD_HEIGHT / 2, w, HUD_HEIGHT, COLORS.hudBg, 0.85).setDepth(10);
    this.add.rectangle(w / 2, GAME_HEIGHT - STRIKE_BAR_HEIGHT / 2, w, STRIKE_BAR_HEIGHT, COLORS.hudBg, 0.7).setDepth(10);

    this.scoreText = this.add.text(16, HUD_HEIGHT / 2, 'Score: ' + GameState.score, {
      fontSize: '16px', fontFamily: 'monospace', color: '#E8F4F8'
    }).setOrigin(0, 0.5).setDepth(11);

    this.stageText = this.add.text(w / 2, HUD_HEIGHT / 2, 'Stage ' + GameState.stage, {
      fontSize: '14px', fontFamily: 'monospace', color: '#00FF7F'
    }).setOrigin(0.5).setDepth(11);

    const pauseBtn = this.add.rectangle(w - 30, HUD_HEIGHT / 2, 44, 44, 0x000000, 0)
      .setDepth(12).setInteractive({ useHandCursor: true });
    this.add.text(w - 30, HUD_HEIGHT / 2, '||', {
      fontSize: '20px', fontFamily: 'monospace', color: '#E8F4F8'
    }).setOrigin(0.5).setDepth(11);
    pauseBtn.on('pointerdown', () => this.togglePause());

    this.hearts = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      const hx = w / 2 - 30 + i * 30;
      const hy = GAME_HEIGHT - STRIKE_BAR_HEIGHT / 2;
      const heart = this.add.text(hx, hy, '\u2665', {
        fontSize: '22px', color: '#FF3333'
      }).setOrigin(0.5).setDepth(11);
      this.hearts.push(heart);
    }

    this.bpmText = this.add.text(w - 16, GAME_HEIGHT - STRIKE_BAR_HEIGHT / 2, 'BPM: --', {
      fontSize: '10px', fontFamily: 'monospace', color: '#80FFBB'
    }).setOrigin(1, 0.5).setDepth(11);

    this.streakBadge = this.add.text(w / 2, GAME_HEIGHT - 80, '', {
      fontSize: '16px', fontFamily: 'monospace', color: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11).setAlpha(0);

    this.isPaused = false;
  }

  updateHUD() {
    if (!this.scoreText) return;
    this.scoreText.setText('Score: ' + GameState.score);
    this.stageText.setText('Stage ' + GameState.stage);
    for (let i = 0; i < MAX_LIVES; i++) {
      if (i < MAX_LIVES - GameState.strikes) {
        this.hearts[i].setText('\u2665').setColor('#FF3333');
      } else {
        this.hearts[i].setText('\u2661').setColor('#551111');
      }
    }
  }

  updateBPM(bpm) {
    if (this.bpmText) this.bpmText.setText('BPM: ' + Math.round(bpm));
  }

  showStreak(count) {
    if (!this.streakBadge) return;
    const mult = getStreakMultiplier(count);
    this.streakBadge.setText('x' + mult + ' STREAK');
    this.streakBadge.setAlpha(1);
    this.tweens.add({ targets: this.streakBadge, scaleX: 1.15, scaleY: 1.15, duration: 200, yoyo: true });
    if (this.streakTimer) this.streakTimer.remove();
    this.streakTimer = this.time.delayedCall(2000, () => {
      if (this.streakBadge) this.streakBadge.setAlpha(0);
    });
  }

  hideStreak() { if (this.streakBadge) this.streakBadge.setAlpha(0); }

  punchScore() {
    if (!this.scoreText) return;
    this.tweens.add({ targets: this.scoreText, scaleX: 1.25, scaleY: 1.25, duration: 70, yoyo: true });
  }

  animateHeartBreak(index) {
    if (index >= 0 && index < this.hearts.length) {
      const heart = this.hearts[index];
      this.tweens.add({ targets: heart, scaleX: 0, scaleY: 0, duration: 200, onComplete: () => {
        if (heart) heart.setVisible(false);
      }});
    }
  }

  togglePause() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.scene.pause('GameScene');
    this.showPauseOverlay();
  }

  showPauseOverlay() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.pauseContainer = this.add.container(0, 0).setDepth(20);
    this.pauseContainer.add(this.add.rectangle(w / 2, h / 2, w, h, 0x0A1520, 0.88));
    this.pauseContainer.add(this.add.text(w / 2, h / 2 - 120, 'PAUSED', {
      fontSize: '30px', fontFamily: 'monospace', color: '#E8F4F8', fontStyle: 'bold'
    }).setOrigin(0.5));

    const btns = [
      { label: 'RESUME', y: -40, action: () => this.resumeGame() },
      { label: '? HELP', y: 20, action: () => this.scene.launch('HelpScene', { returnTo: 'GameScene' }) },
      { label: 'RESTART', y: 80, action: () => this.restartGame(), color: 0xFF3333 },
      { label: 'MENU', y: 130, action: () => this.goMenu(), w: 140 }
    ];
    btns.forEach(b => {
      const bw = b.w || 200;
      const bg = this.add.rectangle(w / 2, h / 2 + b.y, bw, 48, b.color || 0x0A1520)
        .setStrokeStyle(1, 0x00FF7F).setInteractive({ useHandCursor: true });
      const txt = this.add.text(w / 2, h / 2 + b.y, b.label, {
        fontSize: '15px', fontFamily: 'monospace', color: '#E8F4F8'
      }).setOrigin(0.5);
      bg.on('pointerdown', b.action);
      this.pauseContainer.add([bg, txt]);
    });
  }

  resumeGame() {
    this.isPaused = false;
    if (this.pauseContainer) this.pauseContainer.destroy();
    this.scene.resume('GameScene');
  }

  restartGame() {
    this.isPaused = false;
    if (this.pauseContainer) this.pauseContainer.destroy();
    GameState.reset();
    this.scene.stop('HUDScene');
    this.scene.stop('GameScene');
    this.scene.start('GameScene');
    this.scene.start('HUDScene');
  }

  goMenu() {
    this.isPaused = false;
    if (this.pauseContainer) this.pauseContainer.destroy();
    this.scene.stop('HUDScene');
    this.scene.stop('GameScene');
    this.scene.start('MenuScene');
  }
}
