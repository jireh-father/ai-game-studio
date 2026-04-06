// Pressure Cooker - HUD & Pause Overlay (GameScene mixin)
const GameUI = {
  createHUD: function() {
    const w = this.cameras.main.width;
    this.add.rectangle(w / 2, 30, w, 60, 0x0D1A26, 0.85).setDepth(5);
    this.scoreText = this.add.text(16, 20, 'SCORE: ' + this.score.toLocaleString(), {
      fontSize: '14px', fontFamily: 'monospace', color: COLORS.hudText, fontStyle: 'bold'
    }).setDepth(10);
    this.stageText = this.add.text(w / 2, 20, 'STAGE ' + this.currentStage, {
      fontSize: '14px', fontFamily: 'monospace', color: COLORS.timerBar, fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(10);

    const h = this.cameras.main.height;
    this.timerBarBg = this.add.rectangle(w / 2, h - LAYOUT.timerHeight / 2, w, LAYOUT.timerHeight, 0x1A1A2A).setDepth(5);
    this.timerBar = this.add.rectangle(0, h - LAYOUT.timerHeight / 2, w, LAYOUT.timerHeight, 0x00CFFF).setOrigin(0, 0.5).setDepth(6);
  },

  addScore: function(pts) {
    this.score += pts;
    this.updateHUD();
    if (this.scoreText) {
      this.tweens.add({
        targets: this.scoreText, scaleX: 1.25, scaleY: 1.25, duration: 100, yoyo: true
      });
    }
  },

  updateHUD: function() {
    if (this.scoreText) this.scoreText.setText('SCORE: ' + this.score.toLocaleString());
    if (this.stageText) this.stageText.setText('STAGE ' + this.currentStage);
  },

  togglePause: function() {
    this.paused = !this.paused;
    if (this.paused) this.showPauseOverlay();
    else this.hidePauseOverlay();
  },

  showPauseOverlay: function() {
    const w = this.cameras.main.width, h = this.cameras.main.height;
    this.pauseOverlay = this.add.container(0, 0).setDepth(300);
    this.pauseOverlay.add(this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7));
    this.pauseOverlay.add(this.add.text(w / 2, h * 0.25, 'PAUSED', {
      fontSize: '28px', fontFamily: 'monospace', color: COLORS.hudText, fontStyle: 'bold'
    }).setOrigin(0.5));

    const btns = [
      { y: h * 0.42, label: 'RESUME', action: () => this.togglePause() },
      { y: h * 0.52, label: 'RESTART', action: () => this.restartGame() },
      { y: h * 0.62, label: '? HOW TO PLAY', action: () => this.showHelpFromPause() },
      { y: h * 0.72, label: 'MENU', action: () => this.goMenu() }
    ];
    btns.forEach(b => {
      const bg = this.add.rectangle(w / 2, b.y, 180, 45, 0x4A6A8A).setInteractive({ useHandCursor: true });
      const txt = this.add.text(w / 2, b.y, b.label, {
        fontSize: '14px', fontFamily: 'monospace', color: COLORS.hudText, fontStyle: 'bold'
      }).setOrigin(0.5);
      bg.on('pointerdown', () => { Effects.playClick(); b.action(); });
      this.pauseOverlay.add([bg, txt]);
    });
  },

  hidePauseOverlay: function() {
    if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
  },

  restartGame: function() {
    this.hidePauseOverlay();
    this.scene.stop('GameScene');
    this.scene.start('GameScene', { stage: 1, score: 0 });
  },

  goMenu: function() {
    this.hidePauseOverlay();
    this.scene.stop('GameScene');
    this.scene.start('MenuScene');
  },

  showHelpFromPause: function() {
    this.scene.launch('HelpScene', { returnTo: 'GameScene' });
  },

  updateChamberVisual: function(ch) {
    if (!ch.fillGfx) return;
    ch.fillGfx.clear();
    const fillH = (ch.h - 16) * (ch.pressure / 100);
    const color = ch.pressure < 40 ? 0xF5D76E :
      ch.pressure < 70 ? 0xE8721A :
      ch.pressure < 90 ? 0xE8251A : 0xFFFFFF;
    const alpha = ch.pressure < 90 ? 0.85 : 0.95;
    ch.fillGfx.fillStyle(color, alpha);
    ch.fillGfx.fillRoundedRect(-ch.w / 2 + 8, ch.h / 2 - 8 - fillH, ch.w - 16, fillH, 4);

    ch.pctText.setText(Math.floor(ch.pressure) + '%');

    if (ch.pressure >= 80 && !ch.pulseActive) {
      ch.pulseActive = true;
      this.tweens.add({
        targets: ch.container, scaleX: 1.06, scaleY: 1.06, duration: 300,
        yoyo: true, repeat: -1
      });
    } else if (ch.pressure < 80 && ch.pulseActive) {
      ch.pulseActive = false;
      this.tweens.killTweensOf(ch.container);
      ch.container.setScale(1);
    }
  }
};
