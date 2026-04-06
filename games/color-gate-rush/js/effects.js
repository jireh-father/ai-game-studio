// effects.js — Visual effects, particles, screen shake, hit-stop, audio
// Mixed into GameScene.prototype via Object.assign

var GameEffects = {
  // Ball scale punch on tap
  tapJuice: function() {
    if (!this.ball) return;
    this.tweens.add({
      targets: this.ball,
      scaleX: JUICE.TAP_SCALE,
      scaleY: JUICE.TAP_SCALE,
      duration: JUICE.TAP_SCALE_MS / 2,
      yoyo: true,
      ease: 'Back.Out'
    });
    // Glow ring flash
    if (this.ballGlow) {
      this.ballGlow.setAlpha(0.8);
      this.tweens.add({
        targets: this.ballGlow,
        alpha: 0,
        duration: 120
      });
    }
    // Haptic
    if (navigator.vibrate) navigator.vibrate(15);
  },

  // Gate clear effects
  gateClearJuice: function(gateObj, combo, points) {
    // Hit-stop via setTimeout (never timeScale)
    var self = this;
    this.hitStopped = true;
    setTimeout(function() { self.hitStopped = false; }, JUICE.HITSTOP_MS);

    // Gate flash and fade
    if (gateObj && gateObj.gfx) {
      this.tweens.add({
        targets: gateObj.gfx,
        alpha: 0,
        duration: JUICE.GATE_CLEAR_FLASH_MS
      });
    }

    // Ball white flash
    if (this.ball) {
      var origTint = this.ball.fillColor;
      this.ball.setFillStyle(0xFFFFFF);
      setTimeout(function() {
        if (self.ball) self.ball.setFillStyle(origTint);
      }, 80);
    }

    // Floating score text
    this.showFloatingScore(points);

    // Score HUD punch
    if (this.scoreText) {
      this.tweens.add({
        targets: this.scoreText,
        scaleX: 1.35, scaleY: 1.35,
        duration: 100,
        yoyo: true,
        ease: 'Back.Out'
      });
    }

    // Sound
    AUDIO.playGateClear(combo);

    // Combo text
    if (combo >= 2) {
      this.showComboText(combo);
    }

    // Camera mini-shake on clear
    this.cameras.main.shake(80, 0.003);
  },

  showFloatingScore: function(points) {
    var txt = this.add.text(
      SCREEN.WIDTH / 2, SCREEN.BALL_Y - 30,
      '+' + points,
      { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }
    ).setOrigin(0.5).setDepth(50);
    this.tweens.add({
      targets: txt,
      y: SCREEN.BALL_Y - 70,
      alpha: 0,
      duration: JUICE.SCORE_FLOAT_MS,
      onComplete: function() { txt.destroy(); }
    });
  },

  showComboText: function(combo) {
    if (this.comboText) {
      this.comboText.setText('x' + combo);
      this.comboText.setAlpha(1);
      this.tweens.add({
        targets: this.comboText,
        scaleX: 1.4, scaleY: 1.4,
        duration: 75,
        yoyo: true,
        ease: 'Back.Out'
      });
    }
    this.comboFadeTimer = JUICE.COMBO_FADE_MS;
  },

  // Death effects sequence
  deathJuice: function() {
    var self = this;
    var ballX = SCREEN.WIDTH / 2;
    var ballY = SCREEN.BALL_Y;
    var colorHex = COLORS[this.currentColor].hex;

    // Screen shake
    this.cameras.main.shake(JUICE.DEATH_SHAKE_MS, JUICE.DEATH_SHAKE_PX);

    // Ball explosion particles
    for (var i = 0; i < JUICE.PARTICLE_COUNT; i++) {
      var angle = (Math.PI * 2 / JUICE.PARTICLE_COUNT) * i;
      var speed = JUICE.PARTICLE_SPEED * (0.6 + Math.random() * 0.4);
      var p = this.add.circle(ballX, ballY, 4, colorHex).setDepth(40);
      this.tweens.add({
        targets: p,
        x: ballX + Math.cos(angle) * speed * 0.6,
        y: ballY + Math.sin(angle) * speed * 0.6 + 80,
        alpha: 0,
        duration: JUICE.PARTICLE_LIFETIME,
        ease: 'Power2',
        onComplete: function() { p.destroy(); }
      });
    }

    // Ball fade
    if (this.ball) {
      this.tweens.add({ targets: this.ball, alpha: 0, duration: 150 });
    }
    if (this.ballHighlight) {
      this.tweens.add({ targets: this.ballHighlight, alpha: 0, duration: 150 });
    }
    if (this.ballGlow) {
      this.tweens.add({ targets: this.ballGlow, alpha: 0, duration: 150 });
    }

    // White flash
    this.time.delayedCall(20, function() {
      self.cameras.main.flash(JUICE.DEATH_FLASH_MS, 255, 255, 255);
    });

    // Death sound
    AUDIO.playDeath();
  },

  // Stage clear effects
  stageClearJuice: function(nextStage) {
    var self = this;
    // Scanline sweep
    var scanline = this.add.rectangle(SCREEN.WIDTH / 2, 0, SCREEN.WIDTH, 4, 0xFFFFFF).setDepth(60).setAlpha(0.8);
    this.tweens.add({
      targets: scanline,
      y: SCREEN.HEIGHT,
      duration: JUICE.STAGE_CLEAR_MS,
      onComplete: function() { scanline.destroy(); }
    });

    // Stage number popup
    var stageText = this.add.text(
      SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2,
      'STAGE ' + nextStage,
      { fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }
    ).setOrigin(0.5).setDepth(60).setScale(0);

    this.tweens.add({
      targets: stageText,
      scaleX: 1.3, scaleY: 1.3,
      duration: 125,
      ease: 'Back.Out',
      onComplete: function() {
        self.tweens.add({
          targets: stageText,
          scaleX: 1, scaleY: 1,
          duration: 125,
          onComplete: function() {
            self.time.delayedCall(600, function() {
              self.tweens.add({
                targets: stageText,
                alpha: 0,
                duration: 200,
                onComplete: function() { stageText.destroy(); }
              });
            });
          }
        });
      }
    });

    AUDIO.playStageComplete();
  },

  // Trail update
  updateTrail: function() {
    if (!this.trail || !this.ball) return;
    // Shift positions
    for (var i = this.trail.length - 1; i > 0; i--) {
      this.trail[i].x = this.trail[i - 1].x;
      this.trail[i].y = this.trail[i - 1].y;
    }
    if (this.trail.length > 0) {
      this.trail[0].x = this.ball.x;
      this.trail[0].y = this.ball.y;
    }
  },

  updateTrailColors: function() {
    if (!this.trail) return;
    var hex = COLORS[this.currentColor].hex;
    var alphas = [0.4, 0.3, 0.2, 0.1, 0.05];
    for (var i = 0; i < this.trail.length; i++) {
      this.trail[i].setFillStyle(hex);
      this.trail[i].setAlpha(alphas[i] || 0.05);
    }
  },

  // Combo glow ring management
  updateComboGlow: function(combo) {
    if (!this.comboGlowRing) return;
    if (combo >= 5) {
      this.comboGlowRing.setVisible(true);
      var glowColor = combo >= 10 ? 0xFFD700 : 0x00FFFF;
      this.comboGlowRing.setStrokeStyle(3, glowColor, 0.6);
      var rate = combo >= 10 ? 400 : 600;
      if (!this.comboGlowTween || !this.comboGlowTween.isPlaying()) {
        this.comboGlowTween = this.tweens.add({
          targets: this.comboGlowRing,
          scaleX: 1.15, scaleY: 1.15,
          duration: rate / 2,
          yoyo: true,
          repeat: -1
        });
      }
    } else {
      this.comboGlowRing.setVisible(false);
      if (this.comboGlowTween) {
        this.comboGlowTween.stop();
        this.comboGlowTween = null;
      }
    }
  },

  togglePause: function() {
    this.paused = !this.paused;
    if (this.paused) this.showPauseOverlay();
    else this.hidePauseOverlay();
  },

  showPauseOverlay: function() {
    var w = SCREEN.WIDTH, h = SCREEN.HEIGHT, self = this;
    this.pauseGroup = [];
    var push = function(o) { self.pauseGroup.push(o); return o; };
    push(this.add.rectangle(w/2, h/2, w, h, 0x0A0A14, 0.88).setDepth(200));
    push(this.add.text(w/2, 240, 'PAUSED', { fontSize:'28px', fontFamily:'Arial', fontStyle:'bold', color:'#FFFFFF' }).setOrigin(0.5).setDepth(201));
    var makeBtn = function(y, label, bg, border, tc, cb) {
      var b = self.add.rectangle(w/2, y, 180, 48, bg).setDepth(201).setInteractive({ useHandCursor:true });
      if (border) b.setStrokeStyle(1, border);
      push(b);
      var t = self.add.text(w/2, y, label, { fontSize:'18px', fontFamily:'Arial', fontStyle:'bold', color:tc }).setOrigin(0.5).setDepth(202);
      t.disableInteractive(); push(t);
      b.on('pointerdown', function(p) { p.event.stopPropagation(); cb(); });
    };
    makeBtn(310, 'RESUME', 0x00FFCC, null, '#000000', function() { self.togglePause(); });
    makeBtn(376, 'RESTART', 0x1A1A2E, 0xFFFFFF, '#FFFFFF', function() { self.scene.stop('GameScene'); self.scene.start('GameScene'); });
    makeBtn(436, 'HOW TO PLAY', 0x1A1A2E, 0x888899, '#FFFFFF', function() { self.scene.pause('GameScene'); self.scene.launch('HelpScene', { returnTo:'GameScene' }); });
    makeBtn(494, 'MENU', 0x1A1A2E, 0x888899, '#888899', function() { self.scene.stop('GameScene'); self.scene.start('MenuScene'); });
  },

  hidePauseOverlay: function() {
    if (this.pauseGroup) { this.pauseGroup.forEach(function(o) { o.destroy(); }); this.pauseGroup = null; }
  },

  shutdown: function() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    if (this.visHandler) {
      document.removeEventListener('visibilitychange', this.visHandler);
    }
  }
};
