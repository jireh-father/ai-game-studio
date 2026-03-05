// Toilet Unclogger - Core Game Scene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create(data) {
    data = data || {};
    const w = this.scale.width, h = this.scale.height;
    this.gameWidth = w; this.gameHeight = h;
    this.isGameOver = false; this.isPaused = false;
    this.score = data.score || 0;
    this.combo = 0; this.maxCombo = 0;
    this.lastTapTime = 0;
    this.stageMgr = new StageManager(this);
    this.hud = new HUD(this);
    this.renderer = new ToiletRenderer(this);
    this.renderer.init();
    this.beatMarkers = [];
    this.activeToiletIndex = 0;
    this.toiletData = [];
    this.swipeStartX = 0; this.swipeStartTime = 0;
    this.continued = data.continued || false;
    this.trackX = 36; this.trackW = 40;
    this.hitZoneY = h * 0.62; this.trackTop = h * 0.12;
    this.waterBarY = h * 0.88;
    this.pauseOverlay = null;

    // Pause button
    const pauseBtn = this.add.text(w - 20, 12, '||', {
      fontSize: '22px', fontFamily: 'Arial', fill: CONFIG.CSS_COLORS.DARK_SLATE, fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(100).setInteractive();
    pauseBtn.on('pointerdown', () => this.pauseGame());

    this.input.on('pointerdown', (p) => this._onPointerDown(p));
    this.input.on('pointerup', (p) => this._onPointerUp(p));

    const startStage = this.continued ? (data.stage || 1) : 1;
    this._startStage(startStage);
    this.hud.updateScore(this.score);
    this.idleTimer = 0;

    // Recalculate layout on resize (orientation change)
    this.scale.on('resize', (gameSize) => {
      const nw = gameSize.width, nh = gameSize.height;
      this.gameWidth = nw; this.gameHeight = nh;
      this.trackX = 36; this.trackW = 40;
      this.hitZoneY = nh * 0.62; this.trackTop = nh * 0.12;
      this.waterBarY = nh * 0.88;
      this.renderer.clearToilets();
      this.renderer.drawToilets(this.toiletData, this.activeToiletIndex);
      this.renderer.drawBeatTrack(this.trackX, this.trackW, this.trackTop, this.hitZoneY);
    });
  }

  _startStage(num) {
    this.currentStage = num;
    this.stageData = this.stageMgr.generateStage(num);
    this.beatMarkers.forEach(m => m.marker && m.marker.destroy());
    this.beatMarkers = [];
    this.renderer.clearToilets();
    this.toiletData = this.stageData.toilets.map(t => ({
      clogs: t.clogs, currentClogIndex: 0,
      waterLevel: this.continued ? CONFIG.WATER.CONTINUE_DRAIN : CONFIG.WATER.START_LEVEL,
      beatsHit: 0, totalBeats: t.clogs[0] ? t.clogs[0].beats : 8,
    }));
    this.continued = false;
    this.activeToiletIndex = 0;
    this.nextBeatTime = this.time.now + 1000;
    this.renderer.drawToilets(this.toiletData, this.activeToiletIndex);
    this.renderer.drawBeatTrack(this.trackX, this.trackW, this.trackTop, this.hitZoneY);
    this.hud.updateStage(num);
    this.hud.showStageAnnounce(num, this.stageData.isBoss);
  }

  _currentClog() {
    const td = this.toiletData[this.activeToiletIndex];
    return td ? td.clogs[td.currentClogIndex] || null : null;
  }

  update(time, delta) {
    if (this.isGameOver || this.isPaused) return;
    const dt = delta / 1000;
    const bpm = this.stageData.bpm * (this._currentClog()?.bpmMod || 1);
    const beatInterval = 60000 / bpm;

    if (time >= this.nextBeatTime) {
      const marker = this.add.circle(this.trackX, this.trackTop, 12, CONFIG.COLORS.BEAT_GREEN).setDepth(35);
      this.beatMarkers.push({ marker, y: this.trackTop, hit: false });
      this.nextBeatTime += beatInterval;
    }

    const speed = (this.hitZoneY - this.trackTop) / (beatInterval / 1000 * 2);
    for (let i = this.beatMarkers.length - 1; i >= 0; i--) {
      const bm = this.beatMarkers[i];
      if (bm.hit) continue;
      bm.y += speed * dt;
      bm.marker.setY(bm.y);
      if (bm.y > this.hitZoneY + 40) {
        bm.marker.destroy(); this.beatMarkers.splice(i, 1); this._onMiss();
      }
    }

    const riseRate = this.stageData.waterRise;
    for (let i = 0; i < this.toiletData.length; i++) {
      this.toiletData[i].waterLevel = Math.min(100, this.toiletData[i].waterLevel + riseRate * dt);
      if (this.toiletData[i].waterLevel >= 100) { this._onOverflow(i); return; }
    }

    this.idleTimer += delta;
    if (this.idleTimer >= CONFIG.WATER.IDLE_TIMEOUT) {
      this.toiletData[this.activeToiletIndex].waterLevel = 100;
      this._onOverflow(this.activeToiletIndex); return;
    }

    this.renderer.updateDanger(time, this.toiletData[this.activeToiletIndex].waterLevel);
    this.renderer.updateWaterVisuals(this.toiletData, this.activeToiletIndex, this.waterBarY);
  }

  _onPointerDown(pointer) {
    if (this.isGameOver || this.isPaused) return;
    this.swipeStartX = pointer.x; this.swipeStartTime = this.time.now;
    this.idleTimer = 0;
    const now = this.time.now;
    if (now - this.lastTapTime < CONFIG.TAP_DEBOUNCE) return;
    this.lastTapTime = now;
    this._handleTap();
  }

  _onPointerUp(pointer) {
    if (this.isGameOver || this.isPaused) return;
    const dx = pointer.x - this.swipeStartX;
    const dt = this.time.now - this.swipeStartTime;
    if (Math.abs(dx) > CONFIG.SWIPE_THRESHOLD && dt < CONFIG.SWIPE_TIME && this.toiletData.length > 1) {
      if (dx > 0 && this.activeToiletIndex < this.toiletData.length - 1) this._switchToilet(1);
      else if (dx < 0 && this.activeToiletIndex > 0) this._switchToilet(-1);
    }
  }

  _switchToilet(dir) {
    this.activeToiletIndex = Phaser.Math.Clamp(this.activeToiletIndex + dir, 0, this.toiletData.length - 1);
    SFX.play('tap');
    this.renderer.clearToilets();
    this.renderer.drawToilets(this.toiletData, this.activeToiletIndex);
  }

  _handleTap() {
    this.renderer.animatePlunger();
    SFX.vibrate(30);
    let nearest = null, nearestDist = Infinity;
    for (const bm of this.beatMarkers) {
      if (bm.hit) continue;
      const dist = Math.abs(bm.y - this.hitZoneY);
      if (dist < nearestDist) { nearestDist = dist; nearest = bm; }
    }
    const bpm = this.stageData.bpm * (this._currentClog()?.bpmMod || 1);
    const speed = (this.hitZoneY - this.trackTop) / (60 / bpm * 2);
    const timeDist = nearest ? (nearestDist / speed) * 1000 : 9999;

    if (nearest && timeDist <= this.stageData.perfectW) this._onPerfectHit(nearest);
    else if (nearest && timeDist <= this.stageData.goodW) this._onGoodHit(nearest);
    else this._onOffBeat();
  }

  _onPerfectHit(bm) {
    bm.hit = true;
    this.beatMarkers.splice(this.beatMarkers.indexOf(bm), 1);
    bm.marker.destroy();
    this.renderer.beatFlash(this.trackX, this.hitZoneY);
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.score += CONFIG.SCORING.PERFECT_HIT;
    this._applyWaterDrop(1.2);
    this._addClogProgress(1.2);
    this.hud.updateScore(this.score); this.hud.updateCombo(this.combo);
    this.hud.floatText(this.trackX + 30, this.hitZoneY, `+${CONFIG.SCORING.PERFECT_HIT}`);
    this.renderer.emitParticles(this.trackX, this.hitZoneY,
      [CONFIG.COLORS.BEAT_GREEN, CONFIG.COLORS.WATER_CLEAN], 15 + Math.floor(this.combo / 5) * 5);
    this.cameras.main.shake(80, 0.003 + this.combo * 0.0003);
    if (this.combo > 0 && this.combo % 5 === 0) {
      SFX.play('combo');
      this.hud.floatText(this.gameWidth / 2, this.gameHeight * 0.3, `x${this.combo}!`, CONFIG.CSS_COLORS.BEAT_GREEN);
    }
    SFX.play('perfect');
  }

  _onGoodHit(bm) {
    bm.hit = true;
    this.beatMarkers.splice(this.beatMarkers.indexOf(bm), 1);
    bm.marker.destroy();
    this.combo++;
    this.score += CONFIG.SCORING.GOOD_HIT;
    this._applyWaterDrop(0.8);
    this._addClogProgress(0.8);
    this.hud.updateScore(this.score); this.hud.updateCombo(this.combo);
    this.hud.floatText(this.trackX + 30, this.hitZoneY, `+${CONFIG.SCORING.GOOD_HIT}`, CONFIG.CSS_COLORS.GOOD_YELLOW);
    this.renderer.emitParticles(this.trackX, this.hitZoneY,
      [CONFIG.COLORS.GOOD_YELLOW, CONFIG.COLORS.WATER_CLEAN], 8);
    this.cameras.main.shake(50, 0.002);
    SFX.play('good');
  }

  _onOffBeat() {
    this.score += CONFIG.SCORING.OFF_BEAT;
    this.hud.updateScore(this.score);
    this._applyWaterDrop(0.2);
    this._addClogProgress(0.2);
    this.renderer.emitParticles(this.trackX, this.hitZoneY, [0x9E9E9E], 4);
    SFX.play('offbeat');
  }

  _onMiss() {
    this.combo = 0; this.hud.updateCombo(0);
    this.toiletData[this.activeToiletIndex].waterLevel = Math.min(100,
      this.toiletData[this.activeToiletIndex].waterLevel + CONFIG.WATER.MISS_SURGE);
    SFX.play('miss');
  }

  _applyWaterDrop(mult) {
    const td = this.toiletData[this.activeToiletIndex];
    const clog = this._currentClog();
    const drop = clog ? (100 / clog.beats) * mult : 3 * mult;
    td.waterLevel = Math.max(0, td.waterLevel - drop);
  }

  _addClogProgress(mult) {
    const td = this.toiletData[this.activeToiletIndex];
    td.beatsHit += mult;
    if (td.beatsHit >= td.totalBeats) this._clearClog();
  }

  _clearClog() {
    const td = this.toiletData[this.activeToiletIndex];
    SFX.play('clog_clear');
    const bonus = CONFIG.SCORING.CLOG_CLEAR_BASE + this.currentStage * CONFIG.SCORING.CLOG_CLEAR_STAGE_BONUS;
    this.score += bonus;
    this.hud.updateScore(this.score);
    this.hud.floatText(this.gameWidth / 2, this.gameHeight * 0.4, `+${bonus}`, CONFIG.CSS_COLORS.BEAT_GREEN);
    const numT = this.toiletData.length;
    const tx = this.renderer.toiletX(this.activeToiletIndex, numT, this.gameWidth);
    const ty = this.gameHeight * 0.45;
    this.renderer.animateClogPop(this.activeToiletIndex, tx, ty);
    this.renderer.emitParticles(tx, ty, [CONFIG.COLORS.WATER_CLEAN, 0xFFFFFF], 20);
    this.cameras.main.shake(100, 0.005);

    td.currentClogIndex++; td.beatsHit = 0;
    if (td.currentClogIndex < td.clogs.length) {
      td.totalBeats = td.clogs[td.currentClogIndex].beats;
      setTimeout(() => {
        const newClog = this._currentClog();
        if (newClog) this.renderer.redrawClog(this.activeToiletIndex, newClog.id, tx, ty);
      }, 300);
    } else {
      if (this.toiletData.every(t => t.currentClogIndex >= t.clogs.length)) this._completeStage();
    }
  }

  _completeStage() {
    SFX.play('stage_clear');
    this.cameras.main.flash(150, 255, 255, 255);
    this.time.delayedCall(1200, () => { if (!this.isGameOver) this._startStage(this.currentStage + 1); });
  }

  _onOverflow(toiletIndex) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    SFX.play('overflow');
    this.cameras.main.shake(400, 0.015);
    this.cameras.main.flash(100, 255, 255, 255);
    const numT = this.toiletData.length;
    const tx = this.renderer.toiletX(toiletIndex, numT, this.gameWidth);
    this.renderer.overflowBurst(tx, this.gameHeight * 0.45);
    const clog = this._currentClog();
    const td = this.toiletData[toiletIndex];
    const lastClog = td && td.clogs.length > 0 ? td.clogs[Math.min(td.currentClogIndex, td.clogs.length - 1)] : null;
    const clogName = clog ? clog.name : (lastClog ? lastClog.name : 'Mystery Clog');
    setTimeout(() => {
      this.scene.start('GameOverScene', {
        score: this.score, stage: this.currentStage,
        clogName: clogName, canContinue: AdManager.canShowContinue(),
      });
    }, 800);
  }

  pauseGame() {
    if (this.isPaused || this.isGameOver) return;
    this.isPaused = true;
    this._showPauseOverlay();
  }

  _showPauseOverlay() {
    const w = this.gameWidth, h = this.gameHeight;
    if (this.pauseOverlay) this.pauseOverlay.destroy();
    const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7).setDepth(300);
    const title = this.add.text(w / 2, h * 0.3, 'PAUSED', {
      fontSize: '36px', fontFamily: 'Arial Black', fill: '#FFFFFF',
    }).setOrigin(0.5).setDepth(301);
    const mkBtn = (y, label, color, cb) => {
      const r = this.add.rectangle(w / 2, y, 180, 45, color).setDepth(301).setInteractive();
      const t = this.add.text(w / 2, y, label, {
        fontSize: '20px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(302);
      r.on('pointerdown', cb);
      return [r, t];
    };
    const els = [bg, title];
    els.push(...mkBtn(h * 0.45, 'RESUME', 0x4CAF50, () => { this._closePause(); }));
    els.push(...mkBtn(h * 0.55, 'RESTART', 0xFFA726, () => { this._closePause(); AdManager.resetRun(); this.scene.restart(); }));
    els.push(...mkBtn(h * 0.65, 'QUIT', 0xEF5350, () => { this._closePause(); this.scene.start('MenuScene'); }));
    this.pauseOverlay = this.add.container(0, 0, els).setDepth(300);
  }

  _closePause() {
    if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
    this.isPaused = false;
  }
}
