// Swipe Dojo - Visual Effects, Juice & Gameplay Resolution
'use strict';

const GameEffects = {
  // --- Gameplay resolution methods (moved from game.js for line budget) ---
  _resolveBlock(quality, points) {
    if (quality !== 'late') { this.combo++; if (this.combo > this.maxCombo) this.maxCombo = this.combo; }
    else { this.combo = 0; }
    const multiplier = quality !== 'late' ? Math.min(4, 1 + this.combo * 0.1) : 1;
    const gained = Math.floor(points * multiplier);
    this.score += gained;
    this.hud.updateScore(this.score);
    this.hud.updateCombo(this.combo);
    audioSynth.playBlock(quality, this.combo);
    if (this.combo > 0 && this.combo % 5 === 0) { audioSynth.playComboMilestone(this.combo); this._comboMilestoneParticles(); }
    this._floatingScore(gained, quality);
    this._blockJuice(quality);
    this.currentEnemyHP--;
    this._updateHPBar();
    this.tweens.add({ targets: this.enemySprite, scaleX: 1.2, scaleY: 1.2, duration: 60, yoyo: true });
    this._blockParticles(quality);
    if (this.currentEnemyHP <= 0) { this._enemyDefeated(); }
    else if (!this.inRage) { this.currentAttackIndex++; this.time.delayedCall(300, () => this._spawnArrow()); }
  },

  _onMiss() {
    this.combo = 0;
    this.hud.updateCombo(0);
    this.cameras.main.setZoom(1);
    audioSynth.playMiss();
    this._takeDamage();
  },

  _takeDamage() {
    this.lives--;
    this.damageTaken = true;
    this.hud.updateLives(this.lives);
    this.cameras.main.flash(150, 255, 0, 0, false, null, null, 0.5);
    this.cameras.main.shake(200, 0.006);
    this.playerSprite.setTint(0xFF0000);
    this.time.delayedCall(400, () => this.playerSprite.clearTint());
    audioSynth.playLifeLost();
    if (this.lives <= 0) { this._triggerDeath(); }
    else if (!this.inRage) { this.currentAttackIndex++; this.time.delayedCall(500, () => this._spawnArrow()); }
  },

  _triggerDeath() {
    this.gameOver = true;
    this.arrowActive = false;
    this._clearArrow();
    if (this.arrowTimer) this.arrowTimer.remove();
    if (this.inactivityTimer) this.inactivityTimer.remove();
    this.cameras.main.shake(400, 0.015);
    this.cameras.main.flash(250, 255, 0, 0, false, null, null, 0.8);
    audioSynth.playDeath();
    audioSynth.stopMusic();
    this.tweens.add({ targets: this.playerSprite, alpha: 0.2, scaleX: 0.7, scaleY: 0.7, duration: 400 });
    this.time.delayedCall(700, () => {
      this.scene.start('GameOverScene', {
        score: this.score, stage: this.stage,
        maxCombo: this.maxCombo, perfectStage: !this.damageTaken
      });
    });
  },

  _enemyDefeated() {
    const defeatBonus = SCORE.ENEMY_DEFEAT + this.combo * 50;
    this.score += defeatBonus;
    this._floatingScore(defeatBonus, 'perfect');
    audioSynth.playEnemyDeath();
    this._enemyDeathBurst();
    this.tweens.add({
      targets: this.enemySprite, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 300,
      onComplete: () => { this.enemySprite.setScale(1).setAlpha(1); }
    });
    this._stageClear();
  },

  _stageClear() {
    let clearBonus = SCORE.STAGE_CLEAR + this.combo * 100;
    if (!this.damageTaken) clearBonus += SCORE.PERFECT_STAGE;
    this.score += clearBonus;
    this.hud.updateScore(this.score);
    audioSynth.playStageClear();
    this._stageClearCelebration();
    const newBPM = Math.min(150, 90 + Math.floor(this.stage / 5) * 2);
    audioSynth.setBPM(newBPM);
    this.stage++;
    this.time.delayedCall(800, () => this._startStage());
  },

  // --- Rage mode ---
  _startRageBarrage() {
    this.inRage = true;
    this.rageArrowsLeft = RAGE.ARROW_COUNT;
    this.rageArrowsBlocked = 0;
    this._showRageBorder();
    audioSynth.playRageStart();
    this._spawnRageArrow();
  },

  _spawnRageArrow() {
    if (this.gameOver || this.rageArrowsLeft <= 0) { this._endRageBarrage(); return; }
    this.rageArrowsLeft--;
    const dir = DIRECTIONS[Math.floor(Math.random() * 4)];
    this._drawArrow(dir);
    this.arrowActive = true;
    this.expectedDirection = dir;
    this.tankSwipesLeft = 1;
    this.arrowSpawnTime = this.time.now;
    this.arrowWindowMs = this.currentStage.attackWindow;
    audioSynth.playArrowSpawn(dir);
    this.arrowTimer = this.time.delayedCall(this.arrowWindowMs, () => {
      if (this.arrowActive) {
        this.arrowActive = false;
        this._clearArrow();
        this._onMiss();
        this.time.delayedCall(RAGE.ARROW_GAP_MS, () => this._spawnRageArrow());
      }
    });
  },

  _endRageBarrage() {
    this.inRage = false;
    if (this.rageArrowsBlocked === RAGE.ARROW_COUNT) {
      this.score += RAGE.TOTAL_BONUS;
      this._floatingScore(RAGE.TOTAL_BONUS, 'perfect');
      this.hud.updateScore(this.score);
      audioSynth.playStageClear();
    }
    this._hideRageBorder();
    this.time.delayedCall(400, () => this._spawnArrow());
  },

  _showRageBorder() {
    this.rageBorderGfx.clear();
    this.rageBorderGfx.lineStyle(RAGE.BORDER_WIDTH, RAGE.BORDER_COLOR, 1);
    this.rageBorderGfx.strokeRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.rageBorderGfx.setAlpha(RAGE.BORDER_ALPHA);
    if (this._rageBorderTween) this._rageBorderTween.stop();
    this._rageBorderTween = this.tweens.add({
      targets: this.rageBorderGfx, alpha: { from: 0.2, to: 0.6 }, duration: 200, yoyo: true, repeat: -1
    });
  },

  _hideRageBorder() {
    if (this._rageBorderTween) { this._rageBorderTween.stop(); this._rageBorderTween = null; }
    if (this.rageBorderGfx) { this.rageBorderGfx.clear(); this.rageBorderGfx.setAlpha(0); }
  },

  // --- Juice with combo intensity scaling ---
  _blockJuice(quality) {
    const m = IMPACT_SCALE.getMultiplier(this.combo);
    if (quality === 'perfect') {
      this.cameras.main.flash(80, 255, 255, 255, false, null, null, Math.min(1, 0.6 * m));
      this.cameras.main.shake(100, 0.004 * m);
      this.time.timeScale = 0;
      setTimeout(() => { if (this.time) this.time.timeScale = 1; }, 40);
    } else if (quality === 'good') {
      this.cameras.main.flash(50, 255, 255, 255, false, null, null, Math.min(1, 0.3 * m));
      this.cameras.main.shake(80, 0.002 * m);
      this.time.timeScale = 0;
      setTimeout(() => { if (this.time) this.time.timeScale = 1; }, 30);
    }
    if (this.combo >= 20) { this.cameras.main.setZoom(1.03); }
    else if (this.combo >= 10) { this.cameras.main.setZoom(1.015); }
  },

  _emitParticles(x, y, count, tint, speedMin, speedMax, life, scaleStart) {
    const em = this.add.particles(x, y, 'particle', {
      speed: { min: speedMin, max: speedMax }, angle: { min: 0, max: 360 },
      lifespan: life, quantity: count, tint, scale: { start: scaleStart, end: 0 }, maxParticles: count
    });
    this.time.delayedCall(life + 100, () => em.destroy());
  },

  _blockParticles(quality) {
    const m = IMPACT_SCALE.getMultiplier(this.combo);
    const count = Math.floor((quality === 'perfect' ? 25 : quality === 'good' ? 18 : 10) * m);
    this._emitParticles(GAME_WIDTH / 2, 200, count, DIRECTION_COLORS[this.expectedDirection], 80 * m, 250 * m, 300, 0.8 * Math.min(m, 2));
  },

  _comboMilestoneParticles() {
    const m = IMPACT_SCALE.getMultiplier(this.combo);
    this._emitParticles(GAME_WIDTH / 2, GAME_HEIGHT / 2, Math.floor(30 * m), PALETTE.comboGlow, 100 * m, 300 * m, 400, 0.7 * Math.min(m, 2));
  },

  _floatingScore(points, quality) {
    const colors = { perfect: PALETTE.comboGlowHex, good: '#FFFFFF', late: '#AAAAAA' };
    const size = Math.floor(22 * Math.min(IMPACT_SCALE.getMultiplier(this.combo), 2));
    const txt = this.add.text(GAME_WIDTH / 2, 260, `+${points}`, {
      fontSize: size + 'px', fontFamily: 'Arial Black', color: colors[quality] || '#FFFFFF',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({ targets: txt, y: txt.y - 60, alpha: 0, duration: 600, onComplete: () => txt.destroy() });
  },

  // --- Tank swipe juice ---
  _tankSwipeJuice() {
    this.cameras.main.shake(60, 0.003);
    audioSynth.playBlock('good', this.combo);
    const txt = this.add.text(GAME_WIDTH / 2, 240, 'x1 MORE!', {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#FF00FF', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({ targets: txt, y: txt.y - 30, alpha: 0, duration: 400, onComplete: () => txt.destroy() });
    this.tweens.add({ targets: this.arrowGraphics, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });
  },

  // --- Fast variant telegraph flash ---
  _flashTelegraph(dir, earlyMs) {
    const color = DIRECTION_COLORS[dir];
    const cx = GAME_WIDTH / 2;
    const flash = this.add.circle(cx, 200, 40, color, 0.3).setDepth(19);
    this.tweens.add({ targets: flash, alpha: 0, duration: earlyMs, onComplete: () => flash.destroy() });
  },

  // --- Swipe trail afterimage ---
  _drawSwipeTrail(dir) {
    if (!this.trailGraphics || this.trailPoints.length < 2) { this.trailPoints = []; return; }
    const color = DIRECTION_COLORS[dir];
    this.trailGraphics.clear();
    this.trailGraphics.lineStyle(TRAIL.LINE_WIDTH, color, 0.8);
    this.trailGraphics.beginPath();
    this.trailGraphics.moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
    for (let i = 1; i < this.trailPoints.length; i++) {
      this.trailGraphics.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
    }
    this.trailGraphics.strokePath();
    this.trailPoints = [];
    this.tweens.add({
      targets: this.trailGraphics, alpha: 0, duration: TRAIL.FADE_MS,
      onComplete: () => { this.trailGraphics.clear(); this.trailGraphics.setAlpha(1); }
    });
  },

  _drawArrow(dir) {
    const g = this.arrowGraphics, color = DIRECTION_COLORS[dir], cx = GAME_WIDTH / 2, cy = 200;
    g.clear(); g.fillStyle(color, 1); g.lineStyle(3, color, 0.4); g.strokeCircle(cx, cy, 36);
    const d = { UP: [cx,cy-30,cx-16,cy-4,cx+16,cy-4,cx-5,cy-4,10,22], DOWN: [cx,cy+30,cx-16,cy+4,cx+16,cy+4,cx-5,cy-18,10,22],
      LEFT: [cx-30,cy,cx-4,cy-16,cx-4,cy+16,cx-4,cy-5,22,10], RIGHT: [cx+30,cy,cx+4,cy-16,cx+4,cy+16,cx-18,cy-5,22,10] }[dir];
    g.fillTriangle(d[0],d[1],d[2],d[3],d[4],d[5]); g.fillRect(d[6],d[7],d[8],d[9]);
    g.setScale(0.4);
    this.tweens.add({ targets: g, scaleX: 1, scaleY: 1, duration: 150, ease: 'Back.easeOut' });
    if (this.arrowGlowTween) this.arrowGlowTween.stop();
    this.arrowGlowTween = this.tweens.add({ targets: g, alpha: { from: 0.5, to: 1 }, duration: 200, yoyo: true, repeat: -1 });
  },

  _startArrowUrgency() {
    if (this.arrowUrgencyTween) this.arrowUrgencyTween.stop();
    this.arrowUrgencyTween = this.tweens.add({
      targets: this.arrowGraphics, x: { from: -4, to: 4 }, duration: 60, yoyo: true, repeat: 6
    });
  },

  _clearArrow() {
    this.arrowGraphics.clear();
    this.arrowGraphics.setScale(1).setAlpha(1).setX(0);
    if (this.arrowGlowTween) { this.arrowGlowTween.stop(); this.arrowGlowTween = null; }
    if (this.arrowUrgencyTween) { this.arrowUrgencyTween.stop(); this.arrowUrgencyTween = null; }
  },

  _enemyDeathBurst() {
    const m = IMPACT_SCALE.getMultiplier(this.combo);
    this._emitParticles(GAME_WIDTH / 2, 200, Math.floor(30 * m), this.currentStage.fillColor, 120 * m, 350 * m, 400, 0.9 * Math.min(m, 2));
  },

  _stageClearCelebration() {
    this.tweens.add({ targets: this.cameras.main, zoom: 1.05, duration: 250, yoyo: true, ease: 'Sine.easeInOut' });
    [PALETTE.comboGlow, 0xFFFFFF, PALETTE.arrowUp, PALETTE.arrowDown].forEach(c => {
      this._emitParticles(Phaser.Math.Between(60, GAME_WIDTH - 60), Phaser.Math.Between(150, 400), 10, c, 80, 250, 500, 0.6);
    });
  },

  _showPauseOverlay() {
    const cx = GAME_WIDTH / 2;
    const bg = this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.88).setInteractive().setDepth(100);
    const title = this.add.text(cx, 200, 'PAUSED', { fontSize: '40px', fontFamily: 'Arial Black', color: PALETTE.uiText }).setOrigin(0.5).setDepth(101);
    const resume = this.add.rectangle(cx, 310, 200, 50, PALETTE.comboGlow).setInteractive().setDepth(101);
    const resumeT = this.add.text(cx, 310, 'RESUME', { fontSize: '22px', fontFamily: 'Arial Black', color: '#000000' }).setOrigin(0.5).setDepth(102);
    resume.on('pointerdown', () => this.togglePause());
    const restart = this.add.rectangle(cx, 380, 200, 50, 0x555555).setInteractive().setDepth(101);
    const restartT = this.add.text(cx, 380, 'RESTART', { fontSize: '22px', fontFamily: 'Arial Black', color: PALETTE.uiText }).setOrigin(0.5).setDepth(102);
    restart.on('pointerdown', () => { audioSynth.stopMusic(); this.scene.restart(); });
    const menu = this.add.text(cx, 450, 'MENU', { fontSize: '18px', fontFamily: 'Arial', color: '#888888' }).setOrigin(0.5).setDepth(101).setInteractive();
    menu.on('pointerdown', () => { audioSynth.stopMusic(); this.scene.start('MenuScene'); });
    this.pauseOverlayParts = [bg, title, resume, resumeT, restart, restartT, menu];
  },

  _hidePauseOverlay() {
    this.pauseOverlayParts.forEach(p => p.destroy());
    this.pauseOverlayParts = [];
  }
};
