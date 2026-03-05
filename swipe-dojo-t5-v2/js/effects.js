// Swipe Dojo - Visual Effects & Juice
'use strict';

// Mixin: adds effect methods to GameScene
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
    if (this.combo >= 20) {
      this.cameras.main.setZoom(1.03);
    } else if (this.combo >= 10) {
      this.cameras.main.setZoom(1.015);
    }
  },

  _blockParticles(quality) {
    const count = quality === 'perfect' ? 25 : quality === 'good' ? 18 : 10;
    const color = DIRECTION_COLORS[this.expectedDirection];
    const emitter = this.add.particles(GAME_WIDTH / 2, 200, 'particle', {
      speed: { min: 80, max: 250 },
      angle: { min: 0, max: 360 },
      lifespan: 300,
      quantity: count,
      tint: color,
      scale: { start: 0.8, end: 0 },
      maxParticles: count
    });
    this.time.delayedCall(400, () => emitter.destroy());
  },

  _comboMilestoneParticles() {
    const emitter = this.add.particles(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'particle', {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      lifespan: 400,
      quantity: 30,
      tint: PALETTE.comboGlow,
      scale: { start: 0.7, end: 0 },
      maxParticles: 30
    });
    this.time.delayedCall(500, () => emitter.destroy());
  },

  _floatingScore(points, quality) {
    const colors = { perfect: PALETTE.comboGlowHex, good: '#FFFFFF', late: '#AAAAAA' };
    const txt = this.add.text(GAME_WIDTH / 2, 260, `+${points}`, {
      fontSize: '22px', fontFamily: 'Arial Black', color: colors[quality] || '#FFFFFF',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: txt, y: txt.y - 60, alpha: 0, duration: 600,
      onComplete: () => txt.destroy()
    });
  },

  _drawArrow(dir) {
    this.arrowGraphics.clear();
    const color = DIRECTION_COLORS[dir];
    const cx = GAME_WIDTH / 2;
    const cy = 200;

    this.arrowGraphics.fillStyle(color, 1);
    this.arrowGraphics.lineStyle(3, color, 0.4);
    this.arrowGraphics.strokeCircle(cx, cy, 36);

    if (dir === 'UP') {
      this.arrowGraphics.fillTriangle(cx, cy - 30, cx - 16, cy - 4, cx + 16, cy - 4);
      this.arrowGraphics.fillRect(cx - 5, cy - 4, 10, 22);
    } else if (dir === 'DOWN') {
      this.arrowGraphics.fillTriangle(cx, cy + 30, cx - 16, cy + 4, cx + 16, cy + 4);
      this.arrowGraphics.fillRect(cx - 5, cy - 18, 10, 22);
    } else if (dir === 'LEFT') {
      this.arrowGraphics.fillTriangle(cx - 30, cy, cx - 4, cy - 16, cx - 4, cy + 16);
      this.arrowGraphics.fillRect(cx - 4, cy - 5, 22, 10);
    } else if (dir === 'RIGHT') {
      this.arrowGraphics.fillTriangle(cx + 30, cy, cx + 4, cy - 16, cx + 4, cy + 16);
      this.arrowGraphics.fillRect(cx - 18, cy - 5, 22, 10);
    }

    // Spawn scale animation
    this.arrowGraphics.setScale(0.4);
    this.tweens.add({ targets: this.arrowGraphics, scaleX: 1, scaleY: 1, duration: 150, ease: 'Back.easeOut' });

    // Glow pulse
    if (this.arrowGlowTween) this.arrowGlowTween.stop();
    this.arrowGlowTween = this.tweens.add({
      targets: this.arrowGraphics, alpha: { from: 0.5, to: 1 }, duration: 200, yoyo: true, repeat: -1
    });
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
    const emitter = this.add.particles(GAME_WIDTH / 2, 200, 'particle', {
      speed: { min: 120, max: 350 },
      angle: { min: 0, max: 360 },
      lifespan: 400,
      quantity: 30,
      tint: this.currentStage.fillColor,
      scale: { start: 0.9, end: 0 },
      maxParticles: 30
    });
    this.time.delayedCall(500, () => emitter.destroy());
  },

  _stageClearCelebration() {
    this.tweens.add({
      targets: this.cameras.main, zoom: 1.05, duration: 250, yoyo: true, ease: 'Sine.easeInOut'
    });
    const colors = [PALETTE.comboGlow, 0xFFFFFF, PALETTE.arrowUp, PALETTE.arrowDown];
    colors.forEach(c => {
      const em = this.add.particles(
        Phaser.Math.Between(60, GAME_WIDTH - 60),
        Phaser.Math.Between(150, 400), 'particle', {
        speed: { min: 80, max: 250 }, angle: { min: 0, max: 360 },
        lifespan: 500, quantity: 10, tint: c,
        scale: { start: 0.6, end: 0 }, maxParticles: 10
      });
      this.time.delayedCall(600, () => em.destroy());
    });
  },

  // --- Swipe Trail ---
  _initTrail() {
    this.trailGraphics = this.add.graphics().setDepth(15);
    this.trailPoints = [];
    this.trailFading = false;
  },

  _addTrailPoint(x, y) {
    if (this.trailFading) return;
    this.trailPoints.push({ x, y });
    if (this.trailPoints.length > TRAIL.MAX_POINTS) this.trailPoints.shift();
    this._renderTrail();
  },

  _renderTrail() {
    this.trailGraphics.clear();
    if (this.trailPoints.length < 2) return;
    const color = DIRECTION_COLORS[this.expectedDirection] || 0xFFFFFF;
    this.trailGraphics.lineStyle(TRAIL.LINE_WIDTH, color, 0.7);
    this.trailGraphics.beginPath();
    this.trailGraphics.moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
    for (let i = 1; i < this.trailPoints.length; i++) {
      this.trailGraphics.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
    }
    this.trailGraphics.strokePath();
  },

  _fadeTrail(success) {
    this.trailFading = true;
    if (success && this.trailPoints.length >= 2) this._spawnTrailParticles();
    this.tweens.add({
      targets: this.trailGraphics, alpha: 0, duration: TRAIL.FADE_MS,
      onComplete: () => {
        this.trailGraphics.clear();
        this.trailGraphics.setAlpha(1);
        this.trailPoints = [];
        this.trailFading = false;
      }
    });
  },

  _spawnTrailParticles() {
    const color = DIRECTION_COLORS[this.expectedDirection] || 0xFFFFFF;
    for (let i = 1; i < this.trailPoints.length; i++) {
      const p = this.trailPoints[i];
      const em = this.add.particles(p.x, p.y, 'particle', {
        speed: { min: TRAIL.PARTICLE_SPEED_MIN, max: TRAIL.PARTICLE_SPEED_MAX },
        angle: { min: 0, max: 360 }, lifespan: TRAIL.PARTICLE_LIFE,
        quantity: TRAIL.PARTICLES_PER_SEGMENT, tint: color,
        scale: { start: 0.5, end: 0 }, maxParticles: TRAIL.PARTICLES_PER_SEGMENT
      });
      this.time.delayedCall(TRAIL.PARTICLE_LIFE + 50, () => em.destroy());
    }
  },

  // --- Arrow Approach Animation ---
  _drawArrowWithApproach(dir, onComplete) {
    const cx = GAME_WIDTH / 2;
    const cy = 200;
    // Draw arrow at center, small scale
    this._drawArrow(dir);
    // Override the default spawn tween from _drawArrow
    this.tweens.killTweensOf(this.arrowGraphics);
    if (this.arrowGlowTween) { this.arrowGlowTween.stop(); this.arrowGlowTween = null; }
    this.arrowGraphics.setScale(ARROW_APPROACH.START_SCALE);
    this.arrowGraphics.setAlpha(0.5);
    this.tweens.add({
      targets: this.arrowGraphics,
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: ARROW_APPROACH.DURATION_MS,
      ease: ARROW_APPROACH.EASE,
      onComplete: () => {
        // Start glow pulse after approach
        this.arrowGlowTween = this.tweens.add({
          targets: this.arrowGraphics, alpha: { from: 0.5, to: 1 },
          duration: 200, yoyo: true, repeat: -1
        });
        if (onComplete) onComplete();
      }
    });
  },

  // --- Burst Indicator ---
  _showBurstText(count) {
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, `BURST x${count}!`, {
      fontSize: '32px', fontFamily: 'Arial Black', color: '#FF6B00',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(35).setScale(0.5).setAlpha(0);
    this.tweens.add({
      targets: txt, scale: 1.2, alpha: 1, duration: 200, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: txt, alpha: 0, y: txt.y - 40, duration: 600,
          onComplete: () => txt.destroy()
        });
      }
    });
  },

  _showPauseOverlay() {
    const cx = GAME_WIDTH / 2;
    const bg = this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.88).setInteractive().setDepth(100);
    const title = this.add.text(cx, 200, 'PAUSED', {
      fontSize: '40px', fontFamily: 'Arial Black', color: PALETTE.uiText
    }).setOrigin(0.5).setDepth(101);

    const resume = this.add.rectangle(cx, 310, 200, 50, PALETTE.comboGlow).setInteractive().setDepth(101);
    const resumeT = this.add.text(cx, 310, 'RESUME', {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#000000'
    }).setOrigin(0.5).setDepth(102);
    resume.on('pointerdown', () => this.togglePause());

    const restart = this.add.rectangle(cx, 380, 200, 50, 0x555555).setInteractive().setDepth(101);
    const restartT = this.add.text(cx, 380, 'RESTART', {
      fontSize: '22px', fontFamily: 'Arial Black', color: PALETTE.uiText
    }).setOrigin(0.5).setDepth(102);
    restart.on('pointerdown', () => {
      audioSynth.stopMusic();
      this.scene.restart();
    });

    const menu = this.add.text(cx, 450, 'MENU', {
      fontSize: '18px', fontFamily: 'Arial', color: '#888888'
    }).setOrigin(0.5).setDepth(101).setInteractive();
    menu.on('pointerdown', () => {
      audioSynth.stopMusic();
      this.scene.start('MenuScene');
    });

    this.pauseOverlayParts = [bg, title, resume, resumeT, restart, restartT, menu];
  },

  _hidePauseOverlay() {
    this.pauseOverlayParts.forEach(p => p.destroy());
    this.pauseOverlayParts = [];
  }
};
