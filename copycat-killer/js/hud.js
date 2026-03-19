// Copycat Killer - HUD & Pause Overlay

class GameHUD {
  constructor(scene) {
    this.scene = scene;
    this.pauseElements = null;
  }

  create(w, h) {
    this.scene.add.rectangle(w / 2, GAME_CONFIG.hudHeight / 2, w, GAME_CONFIG.hudHeight, COLORS.hudBar).setDepth(10);
    this.scoreText = this.scene.add.text(12, 14, 'SCORE: ' + GameState.score, {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', color: '#E8EEF8'
    }).setDepth(11);
    this.stageText = this.scene.add.text(w / 2, 14, 'STAGE ' + GameState.stage, {
      fontSize: '14px', fontFamily: 'monospace', color: '#E8EEF8'
    }).setOrigin(0.5, 0).setDepth(11);
    this.ghostCountText = this.scene.add.text(12, h - 24, 'GHOSTS: 0', {
      fontSize: '12px', fontFamily: 'monospace', color: '#44AAFF'
    }).setDepth(11);

    const pauseBtn = this.scene.add.rectangle(w - 28, 24, 44, 44, 0x333355, 0.8).setDepth(11).setInteractive();
    this.scene.add.text(w - 28, 24, '||', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(12);
    pauseBtn.on('pointerdown', () => this.scene.togglePause());
  }

  updateScore(score, ghostCount) {
    this.scoreText.setText('SCORE: ' + score);
    this.scoreText.setShadow(
      ghostCount >= 3 ? 2 : 0, ghostCount >= 3 ? 2 : 0,
      '#44AAFF', ghostCount >= 3 ? 4 : 0
    );
  }

  updateGhostCount(count) {
    this.ghostCountText.setText('GHOSTS: ' + count);
  }

  updateStage(stage) {
    this.stageText.setText('STAGE ' + stage);
  }

  punchScore() {
    this.scene.tweens.add({ targets: this.scoreText, scaleX: 1.35, scaleY: 1.35, duration: 90, yoyo: true });
  }

  punchGhostCount() {
    this.scene.tweens.add({ targets: this.ghostCountText, scaleX: 1.3, scaleY: 1.3, duration: 60, yoyo: true });
  }

  showPauseOverlay(w, h) {
    this.pauseElements = [];
    this.pauseElements.push(
      this.scene.add.rectangle(w / 2, h / 2, w, h, 0x0A0A12, 0.85).setDepth(20)
    );
    const btns = [
      { text: 'RESUME', y: h * 0.35, color: 0x1A3A66, fn: () => this.scene.togglePause() },
      { text: 'RESTART', y: h * 0.43, color: 0x331A1A, fn: () => this.scene.restartFromPause() },
      { text: 'HOW TO PLAY', y: h * 0.51, color: 0x1A1A33, fn: () => this.scene.helpFromPause() },
      { text: 'MENU', y: h * 0.59, color: 0x1A1A1A, fn: () => this.scene.menuFromPause() }
    ];
    btns.forEach(b => {
      const r = this.scene.add.rectangle(w / 2, b.y, 200, 52, b.color).setDepth(21).setInteractive();
      const t = this.scene.add.text(w / 2, b.y, b.text, {
        fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FFFFFF'
      }).setOrigin(0.5).setDepth(22);
      r.on('pointerdown', b.fn);
      t.setInteractive().on('pointerdown', b.fn);
      this.pauseElements.push(r, t);
    });
  }

  hidePauseOverlay() {
    if (this.pauseElements) {
      this.pauseElements.forEach(e => e.destroy());
      this.pauseElements = null;
    }
  }
}

function particleBurst(scene, x, y, texture, count, minSpeed, maxSpeed, dur, depth) {
  for (let i = 0; i < count; i++) {
    const p = scene.add.image(x, y, texture).setDepth(depth || 14);
    const a = Math.random() * Math.PI * 2, s = minSpeed + Math.random() * (maxSpeed - minSpeed);
    scene.tweens.add({ targets: p, x: x + Math.cos(a) * s, y: y + Math.sin(a) * s,
      alpha: 0, duration: dur, onComplete: () => p.destroy() });
  }
}

function screenFlash(scene, color, alpha, dur) {
  const f = scene.add.rectangle(scene.gameWidth / 2, scene.gameHeight / 2,
    scene.gameWidth, scene.gameHeight, color, alpha).setDepth(15);
  scene.tweens.add({ targets: f, alpha: 0, duration: dur, onComplete: () => f.destroy() });
}
