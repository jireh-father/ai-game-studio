// Speed Dating Dodge — HUD, Pause Overlay, Display Updates
// These methods are mixed into GameScene prototype

GameScene.prototype.createHUD = function() {
  const w = this.scale.width;
  this.add.rectangle(w/2, 28, w, 56, 0xFFF5E6, 0.95).setDepth(10);

  // Hearts
  this.hearts = [];
  for (let i = 0; i < CONFIG.MAX_FAILS; i++) {
    const hrt = this.add.text(14 + i * 32, 18, '\u2665', {
      fontSize: '24px', color: CONFIG.COLOR_PRIMARY
    }).setDepth(11);
    this.hearts.push(hrt);
  }

  // Date counter
  this.dateText = this.add.text(w/2, 18, 'Date: ' + this.dateNumber, {
    fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_TEXT
  }).setOrigin(0.5, 0).setDepth(11);

  // Chemistry dots
  this.chemDots = [];
  for (let i = 0; i < 3; i++) {
    const dot = this.add.circle(w - 70 + i * 20, 28, 7, 0x2C3A47, 0).setDepth(11);
    dot.setStrokeStyle(1.5, 0x2C3A47);
    this.chemDots.push(dot);
  }

  // Pause button
  const pauseBtn = this.add.rectangle(w - 28, 28, 44, 44, 0x000000, 0)
    .setInteractive().setDepth(12);
  this.add.text(w - 28, 28, '\u23F8', {
    fontSize: '22px', color: CONFIG.COLOR_TEXT
  }).setOrigin(0.5).setDepth(12);
  pauseBtn.on('pointerdown', () => this.togglePause());

  // Combo text
  this.comboText = this.add.text(w/2, 56, '', {
    fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_GOLD
  }).setOrigin(0.5, 0).setDepth(11).setAlpha(0);

  // Timer bar
  this.timerBarBg = this.add.rectangle(w/2, this.scale.height - 20, w - 20, 8, 0x333333)
    .setDepth(10);
  this.timerBar = this.add.rectangle(10, this.scale.height - 20, 0, 8, 0xF9CA24)
    .setOrigin(0, 0.5).setDepth(11);

  // Score display
  this.scoreText = this.add.text(w/2, this.scale.height - 36, 'Score: ' + this.score, {
    fontSize: '13px', fontFamily: 'Arial', color: CONFIG.COLOR_TEXT
  }).setOrigin(0.5).setDepth(10);
};

GameScene.prototype.updateHeartsDisplay = function() {
  this.hearts.forEach((h, i) => {
    if (i < this.failCount) {
      h.setColor('#8395A7');
      h.setAlpha(0.5);
    } else {
      h.setColor(CONFIG.COLOR_PRIMARY);
      h.setAlpha(1);
    }
  });
};

GameScene.prototype.updateChemistryDots = function() {
  this.chemDots.forEach((dot, i) => {
    if (i < this.chemistryStreak) {
      dot.setFillStyle(0x6AB04C, 1);
      this.tweens.add({ targets: dot, scaleX: 1.4, scaleY: 1.4, duration: 100, yoyo: true });
    } else {
      dot.setFillStyle(0x2C3A47, 0);
    }
  });
};

GameScene.prototype.updateComboDisplay = function() {
  if (this.combo >= 2) {
    const sz = Math.min(24, 18 + (this.combo - 2) * 2);
    this.comboText.setFontSize(sz);
    this.comboText.setText('x' + this.combo);
    this.comboText.setAlpha(1);
    this.tweens.add({ targets: this.comboText, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true });
  } else {
    this.tweens.add({ targets: this.comboText, alpha: 0, duration: 150 });
  }
};

GameScene.prototype.updateScoreDisplay = function() {
  if (this.scoreText) this.scoreText.setText('Score: ' + this.score);
};

GameScene.prototype.togglePause = function() {
  if (this.gameOver) return;
  this.isPaused = !this.isPaused;
  if (this.isPaused) this.showPauseOverlay();
  else this.hidePauseOverlay();
};

GameScene.prototype.showPauseOverlay = function() {
  const w = this.scale.width;
  const h = this.scale.height;

  this.pauseOverlay = [];
  const bg = this.add.rectangle(w/2, h/2, w, h, 0x2C3A47, 0.85).setDepth(50);
  const title = this.add.text(w/2, 120, 'PAUSED', {
    fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
  }).setOrigin(0.5).setDepth(51);
  this.pauseOverlay.push(bg, title);

  const buttons = [
    { text: 'Resume', y: 210, action: () => this.togglePause() },
    { text: 'How to Play', y: 270, action: () => {
      this.scene.launch('HelpScene', { returnTo: 'GameScene', wasGamePaused: true });
    }},
    { text: 'Restart', y: 330, action: () => {
      this.hidePauseOverlay();
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    }},
    { text: 'Menu', y: 390, action: () => {
      this.hidePauseOverlay();
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    }}
  ];

  buttons.forEach(b => {
    const btn = this.add.rectangle(w/2, b.y, 180, 48, 0xFF6B6B).setInteractive().setDepth(51);
    btn.setStrokeStyle(2, 0xC44D4D);
    const txt = this.add.text(w/2, b.y, b.text, {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
    }).setOrigin(0.5).setDepth(52);
    btn.on('pointerdown', () => { SFX.play('click'); b.action(); });
    this.pauseOverlay.push(btn, txt);
  });
};

GameScene.prototype.hidePauseOverlay = function() {
  if (this.pauseOverlay) {
    this.pauseOverlay.forEach(o => { if (o && o.destroy) o.destroy(); });
    this.pauseOverlay = null;
  }
  this.isPaused = false;
};
