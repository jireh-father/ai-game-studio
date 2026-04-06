// game.js — Core GameScene: ball, gates, collision, scoring, combo, zones

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.continueFrom = data && data.continueFrom;
    this.initScore = (data && data.score) || 0;
    this.initStage = (data && data.stage) || 1;
  }

  create() {
    var w = SCREEN.WIDTH;
    var h = SCREEN.HEIGHT;
    var self = this;

    // State
    this.score = this.continueFrom ? this.initScore : 0;
    this.stage = this.continueFrom ? this.initStage : 1;
    this.combo = 0;
    this.maxCombo = 0;
    this.gatesCleared = 0;
    this.gatesInStage = 0;
    this.gameOver = false;
    this.paused = false;
    this.hitStopped = false;
    this.stageTransitioning = false;
    this.currentColor = 'RED';
    this.comboFadeTimer = 0;
    this.lastInputTime = Date.now();
    this.gravityFlipped = false;
    this.speedMultiplier = 1;

    // Background
    this.add.rectangle(w / 2, h / 2, w, h, BG_COLOR);
    for (var gx = 0; gx < w; gx += 80) {
      this.add.line(0, 0, gx, 0, gx + 80, h, 0xFFFFFF, 0.03).setOrigin(0);
    }

    // Ball
    this.ball = this.add.circle(w / 2, SCREEN.BALL_Y, JUICE.BALL_RADIUS, COLORS.RED.hex).setDepth(30);
    this.ballHighlight = this.add.circle(w / 2 - 3, SCREEN.BALL_Y - 3, 5, 0xFFFFFF, 0.35).setDepth(31);
    this.ballGlow = this.add.circle(w / 2, SCREEN.BALL_Y, 18).setDepth(29);
    this.ballGlow.setStrokeStyle(3, COLORS.RED.hex, 0.4);
    this.ballGlow.setFillStyle(0x000000, 0);
    this.ballGlow.setAlpha(0);

    // Combo glow ring
    this.comboGlowRing = this.add.circle(w / 2, SCREEN.BALL_Y, 22).setDepth(28);
    this.comboGlowRing.setStrokeStyle(3, 0x00FFFF, 0.6);
    this.comboGlowRing.setFillStyle(0x000000, 0);
    this.comboGlowRing.setVisible(false);

    // Trail
    this.trail = [];
    for (var t = 0; t < JUICE.TRAIL_LENGTH; t++) {
      this.trail.push(this.add.circle(w / 2, SCREEN.BALL_Y, JUICE.BALL_RADIUS - 2, COLORS.RED.hex, 0.4 - t * 0.08).setDepth(20));
    }

    // Gates
    this.activeGates = [];
    this.stageData = null;
    this.nextGateIdx = 0;
    this.scrollOffset = 0;

    // HUD (before loadStage!)
    this.createHUD();

    // Combo text
    this.comboText = this.add.text(w / 2, SCREEN.BALL_Y - 40, '', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COMBO_COLOR
    }).setOrigin(0.5).setDepth(50).setAlpha(0);

    // Pause button
    var pauseBtn = this.add.text(w - 36, 12, '||', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#888899'
    }).setOrigin(0.5, 0).setDepth(100).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', function(ptr) { ptr.event.stopPropagation(); self.togglePause(); });

    // Input
    this.input.on('pointerdown', function() {
      if (self.gameOver || self.paused) return;
      self.lastInputTime = Date.now();
      self.cycleColor();
    });

    // Visibility handler
    this.visHandler = function() {
      if (document.hidden && !self.paused && !self.gameOver) self.togglePause();
    };
    document.addEventListener('visibilitychange', this.visHandler);
    document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

    this.loadStage(this.stage);
  }

  createHUD() {
    this.scoreText = this.add.text(12, 8, 'SCORE: ' + this.score, {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setDepth(100);
    this.stageText = this.add.text(SCREEN.WIDTH / 2, 8, 'STAGE ' + this.stage, {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5, 0).setDepth(100);
    this.hiText = this.add.text(SCREEN.WIDTH - 12, 8, 'HI: ' + (GameState ? GameState.highScore : 0), {
      fontSize: '14px', fontFamily: 'Arial', color: '#888899'
    }).setOrigin(1, 0).setDepth(100);
  }

  updateHUD() {
    if (this.scoreText) this.scoreText.setText('SCORE: ' + this.score);
    if (this.stageText) this.stageText.setText('STAGE ' + this.stage);
  }

  cycleColor() {
    var idx = (COLOR_CYCLE.indexOf(this.currentColor) + 1) % COLOR_CYCLE.length;
    this.currentColor = COLOR_CYCLE[idx];
    var c = COLORS[this.currentColor];
    this.ball.setFillStyle(c.hex);
    this.ballGlow.setStrokeStyle(3, c.hex, 0.4);
    this.updateTrailColors();
    AUDIO.playTap(this.currentColor);
    this.tapJuice();
  }

  loadStage(stageNum) {
    this.stageData = generateStage(stageNum);
    this.nextGateIdx = 0;
    this.gatesCleared = 0;
    this.gatesInStage = this.stageData.gates.length;
    this.stageTransitioning = false;
    var gates = this.stageData.gates;
    for (var i = 0; i < gates.length; i++) {
      gates[i].worldY = -100 - i * JUICE.GATE_SPACING;
    }
    this.scrollOffset = 0;
    this.spawnVisibleGates();
  }

  spawnVisibleGates() {
    while (this.nextGateIdx < this.stageData.gates.length) {
      var gd = this.stageData.gates[this.nextGateIdx];
      if (gd.worldY + this.scrollOffset > SCREEN.HEIGHT + 150) break;
      gd.gfx = this.add.graphics().setDepth(10);
      gd.angle = gd.rotation || 0;
      this.drawGate(gd);
      this.activeGates.push(gd);
      this.nextGateIdx++;
    }
  }

  drawGate(gd) {
    var gfx = gd.gfx;
    if (!gfx) return;
    gfx.clear();
    var cx = SCREEN.WIDTH / 2;
    var cy = gd.worldY + this.scrollOffset;
    var outerR = JUICE.GATE_OUTER_R;
    var innerR = JUICE.GATE_INNER_R;
    var mid = (outerR + innerR) / 2;
    var thick = outerR - innerR;
    var off = Phaser.Math.DegToRad(gd.angle);

    for (var a = 0; a < gd.arcs.length; a++) {
      var arc = gd.arcs[a];
      var sR = Phaser.Math.DegToRad(arc.startAngle) + off;
      var eR = Phaser.Math.DegToRad(arc.endAngle) + off;
      var col = arc.isSafe ? COLORS[arc.color].hex : (COLORS[arc.color] ? COLORS[arc.color].hex : GATE_BODY_COLOR);
      gfx.lineStyle(thick, col, arc.isSafe ? 0.9 : 0.7);
      gfx.beginPath();
      gfx.arc(cx, cy, mid, sR, eR, false);
      gfx.strokePath();
    }
    gfx.lineStyle(1, 0x888899, 0.4);
    gfx.strokeCircle(cx, cy, outerR);
    gfx.strokeCircle(cx, cy, innerR);
  }

  update(time, delta) {
    if (this.gameOver || this.paused || this.hitStopped) return;
    var dt = delta / 1000;
    var params = this.stageData ? this.stageData.params : getDifficultyParams(this.stage);
    var speed = params.speed * this.speedMultiplier;

    if (Date.now() - this.lastInputTime > 25000) { this.onDeath(); return; }

    this.scrollOffset += speed * dt;
    if (time % 3 < 1) this.updateTrail();

    for (var i = this.activeGates.length - 1; i >= 0; i--) {
      var g = this.activeGates[i];
      var sy = g.worldY + this.scrollOffset;

      // Chaos gate color rotation
      if (g.isChaos && !g.passed) {
        g.chaosTimer = (g.chaosTimer || 0) + delta;
        if (g.chaosTimer > 800) {
          g.chaosTimer = 0;
          if (Math.abs(sy - SCREEN.BALL_Y) > JUICE.GATE_OUTER_R + 50) {
            var ci = COLOR_CYCLE.indexOf(g.safeColor);
            g.safeColor = COLOR_CYCLE[(ci + 1) % COLOR_CYCLE.length];
            g.arcs = buildGateArcs(g.safeColor, params.colorsInUse, g.arcGap, Date.now());
          }
        }
      }
      if (g.rotationSpeed > 0) g.angle = (g.angle + g.rotationSpeed * dt) % 360;
      this.drawGate(g);

      // Collision check
      if (!g.passed && Math.abs(sy - SCREEN.BALL_Y) < (JUICE.GATE_OUTER_R - JUICE.GATE_INNER_R) / 2 + JUICE.BALL_RADIUS) {
        this.checkGateCollision(g, sy);
      }
      // Gravity flip
      if (g.gravityFlip && !g.gravityTriggered && Math.abs(sy - SCREEN.BALL_Y) < 50) {
        g.gravityTriggered = true;
        this.gravityFlipped = !this.gravityFlipped;
      }
      // Speed zone
      if (g.speedZone && !g.speedTriggered && Math.abs(sy - SCREEN.BALL_Y) < 50) {
        g.speedTriggered = true;
        this.speedMultiplier = 1.5;
        var self = this;
        this.time.delayedCall(2000, function() { self.speedMultiplier = 1; });
      }
      // Cleanup
      if (sy > SCREEN.HEIGHT + 150) {
        if (g.gfx) g.gfx.destroy();
        this.activeGates.splice(i, 1);
      }
    }

    this.spawnVisibleGates();
    if (this.gatesCleared >= this.gatesInStage && !this.stageTransitioning) this.advanceStage();

    if (this.comboFadeTimer > 0) {
      this.comboFadeTimer -= delta;
      if (this.comboFadeTimer <= 0 && this.comboText) {
        this.tweens.add({ targets: this.comboText, alpha: 0, duration: 300 });
      }
    }
  }

  checkGateCollision(gate, screenY) {
    var ballAngle = Phaser.Math.Angle.Between(SCREEN.WIDTH / 2, screenY, this.ball.x, SCREEN.BALL_Y);
    var ballDeg = ((Phaser.Math.RadToDeg(ballAngle) % 360) + 360) % 360;
    var off = gate.angle % 360;
    var matched = false;
    for (var a = 0; a < gate.arcs.length; a++) {
      var arc = gate.arcs[a];
      var s = ((arc.startAngle + off) % 360 + 360) % 360;
      var e = ((arc.endAngle + off) % 360 + 360) % 360;
      var inArc = s < e ? (ballDeg >= s && ballDeg <= e) : (ballDeg >= s || ballDeg <= e);
      if (inArc && arc.isSafe && arc.color === this.currentColor) { matched = true; break; }
    }
    gate.passed = true;
    if (matched) this.onGatePassed(gate);
    else this.onDeath();
  }

  onGatePassed(gate) {
    this.gatesCleared++;
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    var mult = this.combo >= 10 ? 3 : this.combo >= 5 ? 2 : this.combo >= 2 ? 1.5 : 1;
    var pts = Math.floor(10 * mult);
    this.score += pts;
    this.updateHUD();
    this.gateClearJuice(gate, this.combo, pts);
    this.updateComboGlow(this.combo);
  }

  advanceStage() {
    this.stageTransitioning = true;
    this.stage++;
    this.score += this.stage * 25;
    this.updateHUD();
    this.stageClearJuice(this.stage);
    var self = this;
    this.time.delayedCall(1000, function() { self.loadStage(self.stage); });
  }

  onDeath() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.deathJuice();
    var self = this;
    this.time.delayedCall(1400, function() {
      self.scene.stop('GameScene');
      self.scene.start('GameOverScene', { score: self.score, stage: self.stage, maxCombo: self.maxCombo });
    });
  }

  // togglePause, showPauseOverlay, hidePauseOverlay are in effects.js mixin
}

Object.assign(GameScene.prototype, GameEffects);
