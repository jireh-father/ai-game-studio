// Visual effects and pause overlay mixed into GameScene via prototype
GameScene.prototype.drawMagnetRing = function(time) {
  this.magnetRing.clear();
  this.magnetPulseTime += 16;
  const catchWindow = this.currentStageData ? this.currentStageData.catchWindow : 600;
  const holdDur = time - this.holdStartTime;
  const pct = Math.min(holdDur / catchWindow, 1.2);

  let color = COLORS.primary;
  let pulseSpeed = 600;
  if (pct > 0.8) { color = COLORS.dangerRing; pulseSpeed = 100; }
  else if (pct > 0.5) { color = COLORS.warning; pulseSpeed = 200; }

  const alpha = 0.4 + Math.sin(this.magnetPulseTime / pulseSpeed * Math.PI * 2) * 0.15;

  this.magnetRing.lineStyle(3, color, alpha + 0.2);
  this.magnetRing.strokeCircle(PLAYER_X, PLAYER_Y, MAGNET_RADIUS);
  this.magnetRing.lineStyle(1, color, alpha * 0.6);
  this.magnetRing.strokeCircle(PLAYER_X, PLAYER_Y, 140);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + this.magnetPulseTime * 0.001;
    const x1 = PLAYER_X + Math.cos(a) * MAGNET_RADIUS;
    const y1 = PLAYER_Y + Math.sin(a) * MAGNET_RADIUS;
    const x2 = PLAYER_X + Math.cos(a + 0.5) * MAGNET_RADIUS;
    const y2 = PLAYER_Y + Math.sin(a + 0.5) * MAGNET_RADIUS;
    this.magnetRing.lineStyle(6, 0xFFFFFF, 0.3);
    this.magnetRing.lineBetween(x1, y1, x2, y2);
  }
};

GameScene.prototype.catchKnife = function(knife) {
  knife.caught = true;
  knife.active = false;
  this.waveCatches++;
  this.waveKnivesResolved++;

  const gs = window.GameState;
  gs.streak++;
  const multiplier = 1 + Math.floor(gs.streak / 5) * 0.5;
  const baseScore = Math.floor(SCORE_VALUES.catchBase * Math.min(multiplier, 4));
  gs.score += baseScore;

  // Catch flash
  const flash = this.add.circle(knife.x, knife.y, 2, 0xFFFFFF).setDepth(15);
  this.tweens.add({
    targets: flash, scaleX: 15, scaleY: 15, alpha: 0, duration: 150,
    onComplete: () => flash.destroy()
  });

  // Particles
  const pCount = 10 + this.waveCatches * 4;
  for (let i = 0; i < pCount; i++) {
    const p = this.add.image(knife.x, knife.y, 'particle').setDepth(12);
    const angle = Phaser.Math.FloatBetween(-0.5, 0.5) + Math.atan2(knife.vy, knife.vx);
    const speed = Phaser.Math.FloatBetween(80, 160);
    this.tweens.add({
      targets: p,
      x: knife.x + Math.cos(angle) * speed,
      y: knife.y + Math.sin(angle) * speed,
      alpha: 0, duration: 400,
      onComplete: () => p.destroy()
    });
  }

  // Scale punch on player
  this.tweens.add({
    targets: this.player, scaleX: 1.15, scaleY: 1.15,
    duration: 50, yoyo: true
  });

  // Camera zoom
  const zoomAmt = 1.03 + this.waveCatches * 0.005;
  this.cameras.main.zoomTo(Math.min(zoomAmt, 1.05), 100);
  this.time.addEvent({ delay: 200, callback: () => this.cameras.main.zoomTo(1, 150) });

  this.hitStopTimer = 40;
  this.floatText(knife.x, knife.y - 20, '+' + baseScore, COLORS_HEX.reward);

  this.tweens.add({
    targets: this.scoreText, scaleX: 1.3, scaleY: 1.3,
    duration: 75, yoyo: true
  });

  this.returnKnife(knife);
  this.checkWaveComplete();
};

GameScene.prototype.cursedDodge = function(knife) {
  if (knife.caught || knife.missed) return;
  knife.missed = true;
  knife.active = false;
  this.waveKnivesResolved++;

  window.GameState.score += SCORE_VALUES.cursedDodge;
  this.floatText(knife.x, knife.y - 20, '+' + SCORE_VALUES.cursedDodge + ' DODGE!', COLORS_HEX.primary);
  this.returnKnife(knife);
  this.checkWaveComplete();
};

GameScene.prototype.cursedExplosion = function(knife) {
  knife.caught = true;
  knife.active = false;
  this.waveKnivesResolved++;

  for (let i = 0; i < 12; i++) {
    const color = i % 2 === 0 ? COLORS.cursed : COLORS.danger;
    const shard = this.add.rectangle(knife.x, knife.y,
      Phaser.Math.Between(8, 20), Phaser.Math.Between(4, 10), color).setDepth(15);
    const angle = (i / 12) * Math.PI * 2;
    const speed = Phaser.Math.Between(200, 400);
    this.tweens.add({
      targets: shard,
      x: knife.x + Math.cos(angle) * speed * 0.5,
      y: knife.y + Math.sin(angle) * speed * 0.5,
      rotation: Phaser.Math.FloatBetween(-Math.PI, Math.PI),
      alpha: 0, duration: 500,
      onComplete: () => shard.destroy()
    });
  }

  const cflash = this.add.circle(knife.x, knife.y, 5, 0xFFFFFF).setDepth(16);
  this.tweens.add({
    targets: cflash, scaleX: 12, scaleY: 12, alpha: 0, duration: 200,
    onComplete: () => cflash.destroy()
  });

  this.cameras.main.shake(400, 0.015);
  const vignette = this.add.rectangle(200, 300, 400, 600, COLORS.cursed, 0).setDepth(18);
  this.tweens.add({
    targets: vignette, alpha: 0.6, duration: 150, yoyo: true,
    onComplete: () => vignette.destroy()
  });

  this.returnKnife(knife);
  this.loseLife();
};

GameScene.prototype.knifeStab = function(knife) {
  knife.missed = true;
  knife.active = false;
  this.waveKnivesResolved++;

  this.cameras.main.shake(350, 0.01);

  const vignette = this.add.rectangle(200, 300, 400, 600, COLORS.danger, 0).setDepth(18);
  this.tweens.add({
    targets: vignette, alpha: 0.5, duration: 150, yoyo: true,
    onComplete: () => vignette.destroy()
  });

  this.tweens.add({
    targets: this.player, x: PLAYER_X - 8, duration: 50,
    yoyo: true, repeat: 3
  });

  this.returnKnife(knife);
  this.loseLife();
  this.checkWaveComplete();
};

GameScene.prototype.dropKnife = function(knife) {
  knife.missed = true;
  knife.active = false;
  this.waveKnivesResolved++;

  this.tweens.add({
    targets: knife, y: knife.y + 60, rotation: Math.PI / 2,
    alpha: 0, duration: 400,
    onComplete: () => this.returnKnife(knife)
  });

  this.cameras.main.shake(200, 0.006);
  this.loseLife();
  this.checkWaveComplete();
};

GameScene.prototype.floatText = function(x, y, text, color, size) {
  const txt = this.add.text(x, y, text, {
    fontSize: (size || 18) + 'px', fontFamily: 'Arial',
    color: color || COLORS_HEX.reward, fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(15);
  this.tweens.add({
    targets: txt, y: y - 60, alpha: 0, duration: 600,
    onComplete: () => txt.destroy()
  });
};

GameScene.prototype.togglePause = function(forcePause) {
  if (this.gameOver) return;
  this.paused = forcePause !== undefined ? forcePause : !this.paused;
  if (this.paused) this.showPauseOverlay();
  else this.hidePauseOverlay();
};

GameScene.prototype.showPauseOverlay = function() {
  if (this.pauseOverlay) return;
  const w = 400, h = 600;
  this.pauseOverlay = this.add.container(0, 0).setDepth(50);

  const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);
  this.pauseOverlay.add(bg);

  const title = this.add.text(w / 2, 200, 'PAUSED', {
    fontSize: '32px', fontFamily: 'Arial', color: COLORS_HEX.uiText, fontStyle: 'bold'
  }).setOrigin(0.5);
  this.pauseOverlay.add(title);

  const resumeBg = this.add.rectangle(w / 2, 280, 180, 44, COLORS.primary).setInteractive();
  this.pauseOverlay.add(resumeBg);
  const resumeTxt = this.add.text(w / 2, 280, 'RESUME', {
    fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
  }).setOrigin(0.5);
  this.pauseOverlay.add(resumeTxt);
  resumeBg.on('pointerup', () => this.togglePause(false));

  const helpBg = this.add.rectangle(w / 2, 340, 180, 44, 0x2A2F3E).setInteractive();
  this.pauseOverlay.add(helpBg);
  this.pauseOverlay.add(this.add.text(w / 2, 340, 'HOW TO PLAY', {
    fontSize: '16px', fontFamily: 'Arial', color: COLORS_HEX.primary
  }).setOrigin(0.5));
  helpBg.on('pointerup', () => {
    this.scene.pause('GameScene');
    this.scene.launch('HelpScene', { returnTo: 'GameScene' });
  });

  const restartBg = this.add.rectangle(w / 2, 400, 180, 44, 0x2A2F3E).setInteractive();
  this.pauseOverlay.add(restartBg);
  this.pauseOverlay.add(this.add.text(w / 2, 400, 'RESTART', {
    fontSize: '16px', fontFamily: 'Arial', color: COLORS_HEX.danger
  }).setOrigin(0.5));
  restartBg.on('pointerup', () => {
    this.hidePauseOverlay();
    window.GameState.score = 0;
    window.GameState.stage = 1;
    window.GameState.lives = STARTING_LIVES;
    window.GameState.streak = 0;
    this.scene.stop('GameScene');
    this.scene.start('GameScene');
  });

  const quitTxt = this.add.text(w / 2, 460, 'QUIT TO MENU', {
    fontSize: '14px', fontFamily: 'Arial', color: COLORS_HEX.secondary
  }).setOrigin(0.5).setInteractive();
  this.pauseOverlay.add(quitTxt);
  quitTxt.on('pointerup', () => {
    this.hidePauseOverlay();
    this.scene.stop('GameScene');
    this.scene.start('MenuScene');
  });
};

GameScene.prototype.hidePauseOverlay = function() {
  if (this.pauseOverlay) {
    this.pauseOverlay.destroy();
    this.pauseOverlay = null;
  }
};
