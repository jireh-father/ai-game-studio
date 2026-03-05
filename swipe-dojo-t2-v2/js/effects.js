// Swipe Dojo - Visual Effects & Juice
'use strict';

const GameEffects = {
  _blockJuice(quality) {
    if (quality === 'perfect') {
      this.cameras.main.flash(80, 255, 255, 255, false, null, null, 0.6);
      this.cameras.main.shake(100, 0.004);
      this.time.timeScale = 0;
      setTimeout(() => { if (this.time) this.time.timeScale = 1; }, 40);
    } else if (quality === 'good') {
      this.cameras.main.flash(50, 255, 255, 255, false, null, null, 0.3);
      this.cameras.main.shake(80, 0.002);
      this.time.timeScale = 0;
      setTimeout(() => { if (this.time) this.time.timeScale = 1; }, 30);
    }
    if (this.combo >= 20) this.cameras.main.setZoom(1.03);
    else if (this.combo >= 10) this.cameras.main.setZoom(1.015);
  },

  _blockParticles(quality) {
    const n = quality === 'perfect' ? 25 : quality === 'good' ? 18 : 10;
    const em = this.add.particles(GAME_WIDTH / 2, 200, 'particle', {
      speed: { min: 80, max: 250 }, angle: { min: 0, max: 360 }, lifespan: 300,
      quantity: n, tint: DIRECTION_COLORS[this.expectedDirection],
      scale: { start: 0.8, end: 0 }, maxParticles: n
    });
    this.time.delayedCall(400, () => em.destroy());
  },

  _comboMilestoneParticles() {
    const em = this.add.particles(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'particle', {
      speed: { min: 100, max: 300 }, angle: { min: 0, max: 360 }, lifespan: 400,
      quantity: 30, tint: PALETTE.comboGlow, scale: { start: 0.7, end: 0 }, maxParticles: 30
    });
    this.time.delayedCall(500, () => em.destroy());
  },

  _floatingScore(points, quality) {
    const colors = { perfect: PALETTE.comboGlowHex, good: '#FFFFFF', late: '#AAAAAA' };
    const t = this.add.text(GAME_WIDTH / 2, 260, `+${points}`, {
      fontSize: '22px', fontFamily: 'Arial Black', color: colors[quality] || '#FFFFFF',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({ targets: t, y: t.y - 60, alpha: 0, duration: 600, onComplete: () => t.destroy() });
  },

  _drawArrow(dir) {
    this.arrowGraphics.clear();
    const c = DIRECTION_COLORS[dir], cx = GAME_WIDTH / 2, cy = 200;
    this.arrowGraphics.fillStyle(c, 1);
    this.arrowGraphics.lineStyle(3, c, 0.4);
    this.arrowGraphics.strokeCircle(cx, cy, 36);
    if (dir === 'UP') { this.arrowGraphics.fillTriangle(cx, cy-30, cx-16, cy-4, cx+16, cy-4); this.arrowGraphics.fillRect(cx-5, cy-4, 10, 22); }
    else if (dir === 'DOWN') { this.arrowGraphics.fillTriangle(cx, cy+30, cx-16, cy+4, cx+16, cy+4); this.arrowGraphics.fillRect(cx-5, cy-18, 10, 22); }
    else if (dir === 'LEFT') { this.arrowGraphics.fillTriangle(cx-30, cy, cx-4, cy-16, cx-4, cy+16); this.arrowGraphics.fillRect(cx-4, cy-5, 22, 10); }
    else if (dir === 'RIGHT') { this.arrowGraphics.fillTriangle(cx+30, cy, cx+4, cy-16, cx+4, cy+16); this.arrowGraphics.fillRect(cx-18, cy-5, 22, 10); }
    this.arrowGraphics.setScale(0.4);
    this.tweens.add({ targets: this.arrowGraphics, scaleX: 1, scaleY: 1, duration: 150, ease: 'Back.easeOut' });
    if (this.arrowGlowTween) this.arrowGlowTween.stop();
    this.arrowGlowTween = this.tweens.add({ targets: this.arrowGraphics, alpha: { from: 0.5, to: 1 }, duration: 200, yoyo: true, repeat: -1 });
  },

  _startArrowUrgency() {
    if (this.arrowUrgencyTween) this.arrowUrgencyTween.stop();
    this.arrowUrgencyTween = this.tweens.add({ targets: this.arrowGraphics, x: { from: -4, to: 4 }, duration: 60, yoyo: true, repeat: 6 });
  },

  _clearArrow() {
    this.arrowGraphics.clear();
    this.arrowGraphics.setScale(1).setAlpha(1).setX(0);
    if (this.arrowGlowTween) { this.arrowGlowTween.stop(); this.arrowGlowTween = null; }
    if (this.arrowUrgencyTween) { this.arrowUrgencyTween.stop(); this.arrowUrgencyTween = null; }
  },

  _enemyDeathBurst() {
    const em = this.add.particles(GAME_WIDTH / 2, 200, 'particle', {
      speed: { min: 120, max: 350 }, angle: { min: 0, max: 360 }, lifespan: 400,
      quantity: 30, tint: this.currentStage.fillColor, scale: { start: 0.9, end: 0 }, maxParticles: 30
    });
    this.time.delayedCall(500, () => em.destroy());
  },

  _stageClearCelebration() {
    this.tweens.add({ targets: this.cameras.main, zoom: 1.05, duration: 250, yoyo: true, ease: 'Sine.easeInOut' });
    [PALETTE.comboGlow, 0xFFFFFF, PALETTE.arrowUp, PALETTE.arrowDown].forEach(c => {
      const em = this.add.particles(Phaser.Math.Between(60, GAME_WIDTH-60), Phaser.Math.Between(150, 400), 'particle', {
        speed: { min: 80, max: 250 }, angle: { min: 0, max: 360 }, lifespan: 500,
        quantity: 10, tint: c, scale: { start: 0.6, end: 0 }, maxParticles: 10
      });
      this.time.delayedCall(600, () => em.destroy());
    });
  },

  _showPauseOverlay() {
    const cx = GAME_WIDTH / 2;
    const bg = this.add.rectangle(cx, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.88).setInteractive().setDepth(100);
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

  _hidePauseOverlay() { this.pauseOverlayParts.forEach(p => p.destroy()); this.pauseOverlayParts = []; },

  // --- Belt Progression ---
  _checkBeltPromotion() {
    let ni = 0;
    for (let i = BELT_RANKS.length - 1; i >= 0; i--) { if (this.stage >= BELT_RANKS[i].stage) { ni = i; break; } }
    if (ni > this.currentBeltIndex) {
      this.currentBeltIndex = ni;
      const tk = 'player_belt_' + ni;
      if (this.textures.exists(tk)) this.playerSprite.setTexture(tk);
      this.hud.updateBelt(ni);
      this._rankUpCelebration(BELT_RANKS[ni]);
    }
  },

  _rankUpCelebration(belt) {
    const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
    const txt = this.add.text(cx, cy - 40, 'RANK UP!', {
      fontSize: '36px', fontFamily: 'Arial Black', color: belt.color, stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(30).setScale(0.3).setAlpha(0);
    const sub = this.add.text(cx, cy + 10, belt.name, {
      fontSize: '22px', fontFamily: 'Arial Black', color: belt.color, stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(30).setAlpha(0);
    this.tweens.add({ targets: txt, scale: 1.2, alpha: 1, duration: 300, ease: 'Back.easeOut',
      onComplete: () => this.tweens.add({ targets: txt, alpha: 0, y: txt.y - 40, duration: 500, delay: 400, onComplete: () => txt.destroy() }) });
    this.tweens.add({ targets: sub, alpha: 1, duration: 200, delay: 150,
      onComplete: () => this.tweens.add({ targets: sub, alpha: 0, duration: 400, delay: 500, onComplete: () => sub.destroy() }) });
    const em = this.add.particles(cx, cy, 'particle', {
      speed: { min: 150, max: 400 }, angle: { min: 0, max: 360 }, lifespan: 500,
      quantity: 40, tint: belt.fill, scale: { start: 1, end: 0 }, maxParticles: 40
    });
    this.time.delayedCall(600, () => em.destroy());
    this.cameras.main.flash(200, 255, 255, 255, false, null, null, 0.5);
    this.cameras.main.shake(200, 0.005);
    audioSynth.playStageClear();
  },

  // --- Environment Themes ---
  _checkEnvironmentChange() {
    const ni = ENVIRONMENTS.findIndex(e => this.stage >= e.stageMin && this.stage <= e.stageMax);
    if (ni >= 0 && ni !== this.currentEnvIndex) {
      this._applyEnvironment(ni);
      this._showEnvironmentName(ENVIRONMENTS[ni].name);
      this._refreshAmbientParticles(ENVIRONMENTS[ni].particleColor);
    }
  },

  _applyEnvironment(idx) { this.cameras.main.setBackgroundColor(ENVIRONMENTS[idx].bg); this.currentEnvIndex = idx; },

  _showEnvironmentName(name) {
    const t = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, name.toUpperCase(), {
      fontSize: '20px', fontFamily: 'Arial Black', color: '#FFFFFF', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(30).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 0.8, duration: 300,
      onComplete: () => this.tweens.add({ targets: t, alpha: 0, duration: 600, delay: 800, onComplete: () => t.destroy() }) });
  },

  _spawnAmbientParticles() {
    const color = ENVIRONMENTS[this.currentEnvIndex].particleColor;
    for (let i = 0; i < 10; i++) {
      const p = this.add.circle(Phaser.Math.Between(20, GAME_WIDTH-20), Phaser.Math.Between(60, GAME_HEIGHT-20),
        Phaser.Math.Between(1, 3), color, 0.12).setDepth(1);
      this.tweens.add({ targets: p, y: p.y - 60, alpha: 0, duration: Phaser.Math.Between(3000, 5000), repeat: -1, yoyo: true });
      this.ambientParticles.push(p);
    }
  },

  _refreshAmbientParticles(color) { this.ambientParticles.forEach(p => { p.fillColor = color; p.fillAlpha = 0.12; }); },

  // --- Rage Special ---
  _unleashRageSpecial() {
    this.rageMeter = 0; this.rageOnCooldown = true; this.hud.updateRage(0);
    if (this.currentEnemyHP > 0) {
      this.currentEnemyHP = Math.max(0, this.currentEnemyHP - RAGE.SPECIAL_DAMAGE);
      this._updateHPBar();
      const bonus = RAGE.SPECIAL_DAMAGE * SCORE.PERFECT_BLOCK;
      this.score += bonus; this.hud.updateScore(this.score); this._floatingScore(bonus, 'perfect');
    }
    const cx = GAME_WIDTH / 2;
    const em = this.add.particles(cx, 200, 'particle', {
      speed: { min: 200, max: 500 }, angle: { min: 0, max: 360 }, lifespan: 500,
      quantity: 50, tint: [0xFF0000, 0xFF6600, 0xFFFF00], scale: { start: 1.2, end: 0 }, maxParticles: 50
    });
    this.time.delayedCall(600, () => em.destroy());
    this.cameras.main.flash(200, 255, 100, 0, false, null, null, 0.8);
    this.cameras.main.shake(300, 0.01);
    this.tweens.add({ targets: this.playerSprite, scaleX: 1.4, scaleY: 1.4, duration: 100, yoyo: true });
    this.tweens.add({ targets: this.enemySprite, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });
    audioSynth.playEnemyDeath();
    if (this.currentEnemyHP <= 0) this._enemyDefeated();
    this.time.delayedCall(RAGE.COOLDOWN_MS, () => { this.rageOnCooldown = false; });
  },

  // --- Swipe Trail ---
  _drawTrail() {
    this.trailGraphics.clear();
    if (this.trailPoints.length < 2) return;
    this.trailGraphics.lineStyle(TRAIL.LINE_WIDTH, this.trailColor, 0.8);
    this.trailGraphics.beginPath();
    this.trailGraphics.moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
    for (let i = 1; i < this.trailPoints.length; i++) this.trailGraphics.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
    this.trailGraphics.strokePath();
  },

  _fadeTrail() {
    if (this.trailFading) return;
    this.trailFading = true; this._drawTrail();
    this.tweens.add({ targets: this.trailGraphics, alpha: 0, duration: TRAIL.FADE_MS,
      onComplete: () => { this.trailGraphics.clear(); this.trailGraphics.setAlpha(1); this.trailPoints = []; this.trailFading = false; }
    });
  }
};
