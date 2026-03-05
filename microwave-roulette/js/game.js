// Microwave Roulette - Core Game Scene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.CREAM);
    this.w = w; this.h = h;
    this.score = 0; this.lives = CONFIG.LIVES; this.combo = 0; this.maxCombo = 0;
    this.stageNum = 1; this.itemsCooked = 0; this.needleAngle = 0;
    this.gameOver = false; this.lastTapTime = 0; this.completedZones = 0;
    this.bossHoldStart = 0; this.bossTapCount = 0; this.bossWindow = 0;
    this.inactivityTimer = 0; this.paused = false; this.stage = null;
    this.mcx = w / 2 - 10; this.mcy = h * 0.40;
    this.ringRadius = Math.min(w, h) * 0.14;
    Renderer.drawMicrowave(this);
    this.createHUD();
    this.ringGfx = this.add.graphics();
    this.needleGfx = this.add.graphics();
    const ty = this.mcy + this.ringRadius;
    this.itemText = this.add.text(w / 2, ty + 90, '', {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', color: CONFIG.HEX.CHARCOAL,
    }).setOrigin(0.5);
    this.hintText = this.add.text(w / 2, ty + 115, 'TAP to stop!', {
      fontSize: '13px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5);
    this.distractGfx = this.add.graphics();
    this.startStage();
    this.input.on('pointerdown', (p) => this.handleTap(p));
    this.input.on('pointerup', () => this.handleRelease());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !this.gameOver) this.togglePause(true);
    });
    this.pauseBtn = this.add.text(w - 12, 12, '||', {
      fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold', color: CONFIG.HEX.CHARCOAL,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(10);
    this.pauseBtn.on('pointerdown', (p) => { p.event.stopPropagation(); this.togglePause(); });
    this.cameras.main.fadeIn(200);
  }

  createHUD() {
    const w = this.w, ts = { fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold' };
    this.scoreText = this.add.text(12, 12, 'Score: 0', { ...ts, color: CONFIG.HEX.CHARCOAL }).setDepth(10);
    this.stageText = this.add.text(w / 2, 12, 'Stage 1', { ...ts, color: CONFIG.HEX.CHARCOAL }).setOrigin(0.5, 0).setDepth(10);
    this.livesText = this.add.text(w - 50, 12, this.getLivesStr(), { ...ts, color: CONFIG.HEX.RED }).setOrigin(1, 0).setDepth(10);
    this.comboText = this.add.text(w / 2, 36, '', {
      fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', color: CONFIG.HEX.GOLD,
    }).setOrigin(0.5, 0).setDepth(10).setAlpha(0);
  }

  getLivesStr() {
    let s = '';
    for (let i = 0; i < CONFIG.LIVES; i++) s += i < this.lives ? '\u2665' : '\u2661';
    return s;
  }

  startStage() {
    this.stage = StageGen.generate(this.stageNum);
    this.completedZones = 0; this.needleAngle = 0; this.inactivityTimer = 0;
    this.bossHoldStart = 0; this.bossTapCount = 0; this.bossWindow = 0;
    this.stageText.setText(`Stage ${this.stageNum}`);
    this.itemText.setText(`"${this.stage.item.name}"`);
    if (this.stageNum > 3) this.hintText.setAlpha(0);
    if (this.stage.isBoss) {
      const hints = { hold: 'HOLD to slow-cook!', rapid: 'TAP FAST to thaw!', triple: 'Triple precision stop!' };
      this.hintText.setText(hints[this.stage.bossType]).setAlpha(1).setColor(CONFIG.HEX.RED);
    }
    if (!GameState.cookbook.includes(this.stage.item.name)) {
      GameState.cookbook.push(this.stage.item.name); GameState.save();
      Effects.newItemPopup(this, this.w / 2, this.mcy - this.ringRadius - 40);
      this.addScore(CONFIG.SCORE.NEW_ITEM, this.w / 2, this.mcy - this.ringRadius - 20);
    }
    Renderer.drawItem(this);
    if (this.microwaveGfx) {
      this.tweens.add({ targets: this.microwaveGfx, scaleX: 1.03, scaleY: 1.03, duration: 100, yoyo: true, ease: 'Bounce' });
    }
  }

  update(time, delta) {
    if (this.gameOver || this.paused || !this.stage) return;
    const stage = this.stage;
    const dir = stage.reverseTimer ? -1 : 1;
    this.needleAngle = (this.needleAngle + dir * (stage.speed * 360 / 1000) * delta) % 360;
    if (this.needleAngle < 0) this.needleAngle += 360;
    if (stage.zoneMovement > 0) {
      stage.greenZones.forEach(z => {
        z.angle = (z.angle + z.movementDir * z.movementSpeed * (delta / 16.67)) % 360;
        if (z.angle < 0) z.angle += 360;
      });
    }
    this.inactivityTimer += delta;
    if (this.inactivityTimer >= CONFIG.INACTIVITY_MS) { this.onExplosion(); return; }
    if (stage.isBoss && stage.bossType === 'hold' && this.bossHoldStart > 0) {
      if (time - this.bossHoldStart >= 1500) { this.onBossClear(); return; }
    }
    if (stage.isBoss && stage.bossType === 'rapid' && this.bossWindow > 0) {
      this.bossWindow -= delta;
      if (this.bossWindow <= 0) {
        if (this.bossTapCount >= 8) this.onBossClear(); else this.onExplosion();
        return;
      }
    }
    Renderer.drawRing(this);
    Renderer.drawNeedle(this);
    Renderer.drawDistractions(this, time);
    Renderer.updateDigitalTimer(this);
  }

  handleTap(pointer) {
    if (this.gameOver || this.paused) return;
    const now = Date.now(), stage = this.stage;
    const isRapid = stage && stage.isBoss && stage.bossType === 'rapid';
    if (!isRapid && now - this.lastTapTime < 100) return;
    this.lastTapTime = now; this.inactivityTimer = 0;
    if (pointer.y < 40 && pointer.x > this.w - 50) return;
    if (!stage) return;
    if (stage.isBoss && stage.bossType === 'hold') { this.bossHoldStart = this.time.now; return; }
    if (stage.isBoss && stage.bossType === 'rapid') {
      if (this.bossWindow <= 0) this.bossWindow = 2000;
      this.bossTapCount++;
      Effects.tapJuice(this, pointer.x, pointer.y, false);
      return;
    }
    this.evaluateTap();
  }

  handleRelease() {
    if (!this.stage || !this.stage.isBoss || this.stage.bossType !== 'hold') return;
    const held = this.time.now - this.bossHoldStart;
    if (held >= 500 && held < 1500) {
      this.addScore(CONFIG.SCORE.NEAR_MISS, this.w / 2, this.mcy - 60);
      this.combo = 0; this.updateComboDisplay();
    } else if (held < 500) { this.onExplosion(); }
    this.bossHoldStart = 0;
  }

  evaluateTap() {
    const zone = this.stage.greenZones[this.completedZones];
    if (!zone) { this.onExplosion(); return; }
    const diff = this.angleDiff(this.needleAngle, zone.angle);
    const halfArc = zone.arc / 2, perfT = zone.arc * 0.15;
    if (Math.abs(diff) <= perfT) this.onPerfect();
    else if (Math.abs(diff) <= halfArc) this.onGood();
    else if (Math.abs(diff) <= halfArc + 10) this.onNearMiss();
    else this.onExplosion();
  }

  angleDiff(a, b) {
    let d = a - b;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return d;
  }

  onPerfect() {
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    const mult = Math.min(1 + this.combo * CONFIG.COMBO_MULT_PER, CONFIG.COMBO_MAX_MULT);
    this.addScore(Math.floor(CONFIG.SCORE.PERFECT * mult), this.w / 2, this.mcy - 60);
    Effects.perfectJuice(this);
    this.completedZones++;
    this.checkZoneComplete();
  }

  onGood() {
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    const mult = Math.min(1 + this.combo * CONFIG.COMBO_MULT_PER, CONFIG.COMBO_MAX_MULT);
    this.addScore(Math.floor(CONFIG.SCORE.GOOD * mult), this.w / 2, this.mcy - 60);
    Effects.tapJuice(this, this.mcx, this.mcy, true);
    this.completedZones++;
    this.checkZoneComplete();
  }

  onNearMiss() {
    this.combo = 0;
    this.addScore(CONFIG.SCORE.NEAR_MISS, this.w / 2, this.mcy - 40);
    this.updateComboDisplay();
    Effects.freezeEffect(this);
    this.completedZones++;
    this.checkZoneComplete();
  }

  checkZoneComplete() {
    this.updateComboDisplay();
    if (this.completedZones >= this.stage.zoneCount) {
      if (this.stage.zoneCount > 1)
        this.addScore(CONFIG.SCORE.MULTI_ZONE_BONUS * this.stage.zoneCount, this.w / 2, this.mcy - 80);
      this.itemsCooked++;
      this.stageNum++;
      this.startStage();
    } else {
      this.cameras.main.flash(60, 0, 230, 165, true);
    }
  }

  onBossClear() {
    this.addScore(CONFIG.SCORE.BOSS_CLEAR, this.w / 2, this.mcy - 60);
    Effects.perfectJuice(this);
    this.itemsCooked++;
    this.stageNum++;
    this.startStage();
  }

  onExplosion() {
    this.lives--; this.combo = 0;
    this.livesText.setText(this.getLivesStr());
    this.updateComboDisplay();
    Effects.explosionJuice(this);
    if (this.lives <= 0) {
      this.gameOver = true;
      setTimeout(() => {
        this.scene.start('GameOverScene', {
          score: this.score, stage: this.stageNum,
          combo: this.maxCombo, itemsCooked: this.itemsCooked,
        });
      }, 700);
    } else {
      setTimeout(() => { if (!this.gameOver) { this.stageNum++; this.startStage(); } }, 700);
    }
  }

  addScore(pts, x, y) {
    this.score += pts;
    this.scoreText.setText(`Score: ${this.score}`);
    Effects.scorePunch(this);
    Effects.floatingScore(this, pts, x, y);
  }

  updateComboDisplay() {
    if (this.combo >= 2) {
      this.comboText.setText(`x${this.combo}`).setFontSize(Math.min(20 + this.combo * 2, 48)).setAlpha(1);
      this.tweens.add({ targets: this.comboText, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
      if (this.combo % 5 === 0) Effects.comboMilestone(this);
    } else { this.comboText.setAlpha(0); }
  }

  togglePause(forceOn) {
    if (this.gameOver) return;
    this.paused = forceOn !== undefined ? forceOn : !this.paused;
    if (this.paused) this.showPauseOverlay();
    else if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
  }

  showPauseOverlay() {
    if (this.pauseOverlay) return;
    const w = this.w, h = this.h, c = this.add.container(0, 0).setDepth(50);
    this.pauseOverlay = c;
    c.add(this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7).setInteractive());
    c.add(this.add.text(w / 2, h * 0.3, 'PAUSED', {
      fontSize: '36px', fontFamily: 'monospace', fontStyle: 'bold', color: CONFIG.HEX.WHITE,
    }).setOrigin(0.5));
    const btn = (y, label, cb) => {
      const b = this.add.rectangle(w / 2, y, 160, 40, CONFIG.COLORS.TEAL, 1).setInteractive({ useHandCursor: true });
      const t = this.add.text(w / 2, y, label, { fontSize: '18px', fontFamily: 'monospace', color: CONFIG.HEX.WHITE }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      b.on('pointerdown', cb); t.on('pointerdown', cb); c.add(b); c.add(t);
    };
    btn(h * 0.45, 'RESUME', () => this.togglePause(false));
    btn(h * 0.53, 'RESTART', () => { this.pauseOverlay.destroy(); this.scene.restart(); });
    btn(h * 0.61, 'MENU', () => { this.pauseOverlay.destroy(); this.scene.start('MenuScene'); });
  }
}
