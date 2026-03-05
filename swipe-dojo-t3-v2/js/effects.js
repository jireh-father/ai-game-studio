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
  },

  _finishingBlowEffect(isPerfectFinish) {
    this.time.timeScale = 0;
    setTimeout(() => { if (this.time) this.time.timeScale = 1; }, FINISHING_BLOW.HITSTOP_MS);
    audioSynth.playFinishingBlow();
    this.cameras.main.setZoom(FINISHING_BLOW.ZOOM);
    this.cameras.main.shake(400, FINISHING_BLOW.SHAKE_INTENSITY);
    this.tweens.add({ targets: this.cameras.main, zoom: 1, duration: 600, delay: FINISHING_BLOW.HITSTOP_MS, ease: 'Cubic.easeOut' });
    this.cameras.main.flash(200, 255, 215, 0, false, null, null, 0.7);
    const em = this.add.particles(GAME_WIDTH / 2, 200, 'particle', {
      speed: { min: 150, max: 400 }, angle: { min: 0, max: 360 }, lifespan: 500,
      quantity: FINISHING_BLOW.PARTICLE_COUNT, tint: [0xFFD700, 0xFFFFFF, 0xFF6B00],
      scale: { start: 1.0, end: 0 }, maxParticles: FINISHING_BLOW.PARTICLE_COUNT
    });
    this.time.delayedCall(600, () => em.destroy());
    if (isPerfectFinish) this._showCriticalFinishText();
  },

  _showCriticalFinishText() {
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'CRITICAL FINISH', {
      fontSize: '32px', fontFamily: 'Arial Black', color: '#FFD700', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(60).setScale(0.3);
    this.tweens.add({ targets: txt, scaleX: 1.1, scaleY: 1.1, duration: 200, ease: 'Back.easeOut' });
    let hue = 0;
    this.time.addEvent({ delay: 50, repeat: 20, callback: () => { hue = (hue + 30) % 360; txt.setColor(`hsl(${hue}, 100%, 60%)`); } });
    this.tweens.add({ targets: txt, alpha: 0, y: txt.y - 40, duration: 400, delay: 800, onComplete: () => txt.destroy() });
  },

  _startLastStandEffects() {
    this.lastStandBorder = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 4, GAME_HEIGHT - 4)
      .setStrokeStyle(4, LAST_STAND.BORDER_COLOR, 0.8).setFillStyle(0x000000, 0).setDepth(90);
    this.lastStandPulse = this.tweens.add({ targets: this.lastStandBorder, alpha: { from: 0.3, to: 1 }, duration: LAST_STAND.HEARTBEAT_MS / 2, yoyo: true, repeat: -1 });
    this.cameras.main.setZoom(LAST_STAND.ZOOM);
    this.lastStandOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x330000, 0.15).setDepth(0);
  },

  _stopLastStandEffects() {
    if (this.lastStandPulse) { this.lastStandPulse.stop(); this.lastStandPulse = null; }
    if (this.lastStandBorder) { this.lastStandBorder.destroy(); this.lastStandBorder = null; }
    if (this.lastStandOverlay) { this.lastStandOverlay.destroy(); this.lastStandOverlay = null; }
    this.cameras.main.setZoom(1);
    this.cameras.main.flash(100, 0, 255, 100, false, null, null, 0.4);
  },

  _showComebackText() {
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'COMEBACK!', {
      fontSize: '36px', fontFamily: 'Arial Black', color: LAST_STAND.COMEBACK_COLOR, stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(61).setScale(0.4);
    audioSynth.playComeback();
    this.cameras.main.flash(100, 0, 255, 100, false, null, null, 0.5);
    this.tweens.add({ targets: txt, scaleX: 1.2, scaleY: 1.2, duration: 200, ease: 'Back.easeOut' });
    this.tweens.add({ targets: txt, alpha: 0, y: txt.y - 50, duration: 400, delay: 600, onComplete: () => txt.destroy() });
  },

  _showOverkillStamp() {
    const em = this.add.particles(GAME_WIDTH / 2, 200, 'particle', {
      speed: { min: 100, max: 350 }, angle: { min: 0, max: 360 }, lifespan: 400,
      quantity: 30 * OVERKILL.PARTICLE_MULT, tint: [0xFF0000, 0xFFD700, 0xFF6B00],
      scale: { start: 0.9, end: 0 }, maxParticles: 30 * OVERKILL.PARTICLE_MULT
    });
    this.time.delayedCall(500, () => em.destroy());
    audioSynth.playOverkill();
    const stamp = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'OVERKILL', {
      fontSize: '40px', fontFamily: 'Arial Black', color: '#FF2020', stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setDepth(62).setRotation(-0.12).setScale(2.5).setAlpha(0);
    this.tweens.add({ targets: stamp, scaleX: 1, scaleY: 1, alpha: 1, duration: 150, ease: 'Back.easeOut', onComplete: () => {
      this.cameras.main.shake(150, 0.006);
      this.tweens.add({ targets: stamp, alpha: 0, duration: 400, delay: 500, onComplete: () => stamp.destroy() });
    }});
  },

  // --- v2: Combo Announcer ---
  _showComboAnnouncer(combo) {
    const milestone = combo >= 30 ? 30 : combo;
    const cfg = COMBO_ANNOUNCER[milestone];
    if (!cfg) return;
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, cfg.text, {
      fontSize: '38px', fontFamily: 'Arial Black', color: cfg.color,
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(65).setAlpha(0);
    this._applyAnnouncerStyle(txt, cfg.style);
    this.tweens.add({ targets: txt, alpha: 0, duration: 200, delay: COMBO_ANNOUNCE_DURATION, onComplete: () => txt.destroy() });
  },

  _applyAnnouncerStyle(txt, style) {
    txt.setAlpha(1);
    switch (style) {
      case 'bounce': txt.setScale(0.3); this.tweens.add({ targets: txt, scaleX: 1.1, scaleY: 1.1, duration: 200, ease: 'Bounce.easeOut' }); break;
      case 'slam': txt.setY(GAME_HEIGHT / 2 - 200); this.tweens.add({ targets: txt, y: GAME_HEIGHT / 2 - 90, duration: 180, ease: 'Cubic.easeIn' }); this.time.delayedCall(180, () => this.cameras.main.shake(80, 0.004)); break;
      case 'spin': txt.setRotation(-3).setScale(0.2); this.tweens.add({ targets: txt, rotation: 0, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' }); break;
      case 'shake': this.tweens.add({ targets: txt, x: { from: txt.x - 8, to: txt.x + 8 }, duration: 40, yoyo: true, repeat: 5 }); break;
      case 'scaleHuge': txt.setScale(3); this.tweens.add({ targets: txt, scaleX: 1, scaleY: 1, duration: 350, ease: 'Cubic.easeOut' }); break;
      case 'rainbow':
        this.tweens.add({ targets: txt, scaleX: 1.05, scaleY: 1.05, duration: 200, yoyo: true, repeat: 2 });
        let hue = 0;
        this.time.addEvent({ delay: 50, repeat: Math.floor(COMBO_ANNOUNCE_DURATION / 50), callback: () => { hue = (hue + 25) % 360; txt.setColor(`hsl(${hue}, 100%, 60%)`); } });
        break;
    }
  }
};
