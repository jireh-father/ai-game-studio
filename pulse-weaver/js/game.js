// GameScene — Core gameplay: drawing, pulse, transformations, combos

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.stageNum = data.stage || GameState.currentStage || 1;
    this.currentStageData = data;
  }

  create() {
    this._resetState();
    const stage = getStage(this.stageNum);
    this.stageData = stage;
    this.cameras.main.setBackgroundColor(isRestStage(this.stageNum) ? COLORS.backgroundAlt : COLORS.background);
    this._createGhostBg();
    this._loadElements(stage);
    this.input.on('pointerdown', p => this._onDown(p));
    this.input.on('pointermove', p => this._onMove(p));
    this.input.on('pointerup',   p => this._onUp(p));
    this.hud = new HUD(this);
    this.hud.setStage(this.stageNum);
    this.hud.setAttempt(1);
    this.hud.setScore(0);
    this.pathGfx = this.add.graphics().setDepth(5);
    this.pulseGfx = this.add.graphics().setDepth(6);
    this.fxGfx = this.add.graphics().setDepth(8);
    this.particles = [];
    const ms = this.stageNum <= 10 ? 'stage1' : this.stageNum <= 25 ? 'stage11' : this.stageNum <= 50 ? 'stage26' : 'stage51';
    AudioEngine.startMusic(ms);
    this._showStageIntro();
  }

  _resetState() {
    Object.assign(this, {
      attemptCount: 1, score: 0, comboMult: 1, combosFound: 0, newRecipes: [],
      isDrawing: false, pathPoints: [], drawnPathLength: 0,
      pulseActive: false, pulseT: 0, pulsePathLength: 0, pulsePathPoints: [],
      lastTransformed: [], stageStartTime: 0, elements: [],
      requiredTargetIds: [], pendingRetry: false, _completed: false,
    });
  }

  _loadElements(stage) {
    this.requiredTargetIds = [...stage.requiredTargetIds];
    this.elements = stage.elements.map(el => ({
      id: el.id, type: el.type, x: el.x, y: el.y,
      isTarget: el.isTarget, cleared: false,
      cfg: getElementConfig(el.type), gfx: null, overlayGfx: null, targetRingGfx: null,
    }));
    this.elements.forEach(el => renderElement(this, el));
  }

  _createGhostBg() {
    this.ghostGfx = this.add.graphics().setDepth(1);
    this.ghosts = Array.from({length: 8}, (_, i) => ({
      baseX: 30 + (i % 4) * 90 + Math.sin(i) * 20,
      baseY: PLAY_AREA_TOP + 30 + Math.floor(i / 4) * 280 + Math.cos(i) * 20,
      r: 10 + (i % 3) * 5, t: i * 1.3,
    }));
  }

  _onDown(p) {
    if (this.pulseActive || this.pendingRetry || p.y < TOP_BAR_HEIGHT || p.y > GAME_HEIGHT - BOTTOM_BAR_HEIGHT) return;
    this.isDrawing = true;
    this.pathPoints = [{ x: p.x, y: p.y }];
    this.drawnPathLength = 0;
    AudioEngine.resume(); AudioEngine.playDrawStart(); AudioEngine.setMusicVolume(0.1, 0.2);
  }

  _onMove(p) {
    if (!this.isDrawing) return;
    const last = this.pathPoints[this.pathPoints.length - 1];
    const dist = Math.hypot(p.x - last.x, p.y - last.y);
    if (dist >= PATH_SAMPLE_INTERVAL) { this.pathPoints.push({ x: p.x, y: p.y }); this.drawnPathLength += dist; }
  }

  _onUp(p) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    if (this.drawnPathLength < MIN_PATH_LENGTH) {
      const el = this.elements.find(e => Math.hypot(p.x - e.x, p.y - e.y) <= ELEMENT_RADIUS);
      if (el) this._showTooltip(el, p.x, p.y);
      this.pathPoints = [];
      AudioEngine.setMusicVolume(0.3, 0.3);
      return;
    }
    this._launchPulse();
  }

  _showTooltip(el, x, y) {
    this._tooltip && this._tooltip.destroy();
    const cfg = el.cfg, tx = Math.min(x, GAME_WIDTH - 130), ty = Math.max(TOP_BAR_HEIGHT + 30, y - 70);
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x1A237E, 0.92); g.fillRoundedRect(tx - 60, ty - 10, 120, 60, 8);
    const mk = (s, dy, c) => this.add.text(tx, ty + dy, s, { fontSize: `${s.length > 10 ? 11 : 13}px`, fontFamily: 'sans-serif', color: c }).setOrigin(0.5).setDepth(21);
    const t1 = mk(cfg.name, 8, `#${cfg.color.toString(16).padStart(6,'0')}`);
    const t2 = mk(`Type: ${el.type}`, 28, '#B0BEC5');
    const t3 = mk(el.isTarget ? 'TARGET' : 'Element', 44, el.isTarget ? '#7FFFD4' : '#546E7A');
    this._tooltip = this.add.container(0, 0, [g, t1, t2, t3]).setDepth(20);
    this.time.delayedCall(2000, () => { this._tooltip && this._tooltip.destroy(); this._tooltip = null; });
  }

  _launchPulse() {
    if (this.pathPoints.length < 2) return;
    this.pulseActive = true; this.pulsePathPoints = [...this.pathPoints];
    this.pulseT = 0; this.lastTransformed = [];
    this.stageStartTime = this.time.now;
    this._tooltip && this._tooltip.destroy();
    this._arcLengths = [0];
    for (let i = 1; i < this.pulsePathPoints.length; i++) {
      this._arcLengths.push(this._arcLengths[i-1] + Math.hypot(
        this.pulsePathPoints[i].x - this.pulsePathPoints[i-1].x,
        this.pulsePathPoints[i].y - this.pulsePathPoints[i-1].y));
    }
    this.pulsePathLength = this._arcLengths[this._arcLengths.length - 1];
    AudioEngine.setMusicVolume(0.1, 0.1);
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.ghostGfx.clear();
    this.ghosts.forEach(g => {
      g.t += 0.001;
      this.ghostGfx.fillStyle(0x7FFFD4, 0.06);
      this.ghostGfx.fillCircle(g.baseX + Math.sin(g.t) * 15, g.baseY + Math.cos(g.t * 0.7) * 15, g.r);
    });
    const t = time * 0.003;
    this.elements.forEach(el => {
      if (!el.isTarget || el.cleared || !el.targetRingGfx) return;
      const a = Math.sin(t) * 0.3 + 0.7, sc = Math.sin(t) * 0.1 + 1.0;
      el.targetRingGfx.clear();
      el.targetRingGfx.lineStyle(2, 0xFFFFFF, a);
      el.targetRingGfx.strokeCircle(el.x, el.y, (ELEMENT_RADIUS + 10) * sc);
      el.targetRingGfx.lineStyle(4, 0x7FFFD4, a * 0.4);
      el.targetRingGfx.strokeCircle(el.x, el.y, (ELEMENT_RADIUS + 12) * sc);
    });
    this.fxGfx.clear();
    this.particles = this.particles.filter(p => p.life < p.maxLife);
    this.particles.forEach(p => {
      p.life += delta; p.x += p.vx * dt; p.y += p.vy * dt;
      this.fxGfx.fillStyle(p.color, 1 - p.life / p.maxLife);
      this.fxGfx.fillCircle(p.x, p.y, p.r);
    });
    if (this.particles.length > 64) this.particles.splice(0, this.particles.length - 64);
    if (this.isDrawing) this._renderPath();
    if (this.pulseActive) this._updatePulse(dt);
  }

  _renderPath() {
    this.pathGfx.clear();
    if (this.pathPoints.length < 2) return;
    const pts = this.pathPoints;
    this.pathGfx.lineStyle(8, 0x7FFFD4, 0.35);
    this.pathGfx.beginPath(); this.pathGfx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => this.pathGfx.lineTo(p.x, p.y)); this.pathGfx.strokePath();
    this.pathGfx.lineStyle(2, 0xFFFFFF, 0.9);
    this.pathGfx.beginPath(); this.pathGfx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => this.pathGfx.lineTo(p.x, p.y)); this.pathGfx.strokePath();
  }

  _updatePulse(dt) {
    this.pulseT += PULSE_SPEED * dt;
    if (this.pulseT >= this.pulsePathLength) { this._onPulseEnd(); return; }
    const pos = this._pulsePos(this.pulseT);
    this.elements.forEach(el => {
      if (el.cleared || el._transforming) return;
      if (Math.hypot(pos.x - el.x, pos.y - el.y) <= ELEMENT_COLLISION_RADIUS) this._transform(el);
    });
    this.pulseGfx.clear(); this.pathGfx.clear();
    const tailS = Math.max(0, this.pulseT - 150);
    for (let i = 1; i <= 20; i++) {
      const t1 = tailS + ((i-1)/20)*(this.pulseT-tailS), t2 = tailS + (i/20)*(this.pulseT-tailS);
      const p1 = this._pulsePos(t1), p2 = this._pulsePos(t2), a = i / 20;
      this.pathGfx.lineStyle(6, 0x7FFFD4, a*0.35); this.pathGfx.beginPath();
      this.pathGfx.moveTo(p1.x, p1.y); this.pathGfx.lineTo(p2.x, p2.y); this.pathGfx.strokePath();
      this.pathGfx.lineStyle(2, 0xFFFFFF, a*0.8); this.pathGfx.beginPath();
      this.pathGfx.moveTo(p1.x, p1.y); this.pathGfx.lineTo(p2.x, p2.y); this.pathGfx.strokePath();
    }
    this.pulseGfx.fillStyle(0x7FFFD4, 0.5); this.pulseGfx.fillCircle(pos.x, pos.y, 18);
    this.pulseGfx.fillStyle(0xFFFFFF, 0.9); this.pulseGfx.fillCircle(pos.x, pos.y, 8);
  }

  _pulsePos(dist) {
    const al = this._arcLengths, pts = this.pulsePathPoints;
    if (!al || al.length < 2) return pts[0] || { x: 0, y: 0 };
    const d = Math.min(Math.max(dist, 0), al[al.length - 1]);
    let lo = 0, hi = al.length - 1;
    while (lo < hi - 1) { const mid = (lo + hi) >> 1; al[mid] <= d ? lo = mid : hi = mid; }
    const t = (al[hi] - al[lo]) > 0 ? (d - al[lo]) / (al[hi] - al[lo]) : 0;
    return { x: pts[lo].x + (pts[hi].x - pts[lo].x) * t, y: pts[lo].y + (pts[hi].y - pts[lo].y) * t };
  }

  _transform(el) {
    el._transforming = true;
    const prev = this.lastTransformed.length > 0 ? this.lastTransformed[this.lastTransformed.length - 1] : null;
    const combo2 = prev ? findCombo(prev, el.type) : null;
    const combo3 = this.lastTransformed.length >= 2 ? find3Combo([...this.lastTransformed.slice(-2), el.type]) : null;
    const cancelled = combo2 && combo2.result === 'cancelled';

    if (cancelled) { el.cleared = true; this._fadeElement(el); this.lastTransformed = []; return; }
    if (combo2) this._doCombo2(combo2, el);
    if (combo3) this._doCombo3(combo3, el);

    const base = TRANSFORM_ALONE[el.type];
    if (el.isTarget || (base && base.remove)) el.cleared = true;

    let pts = SCORE_VALUES.transform + (combo2 ? combo2.score : 0) + (combo3 ? combo3.score : 0);
    this.score += pts; this.hud.setScore(this.score);
    this._emitParticles(el.x, el.y, el.cfg.color, 8);
    this.tweens.add({ targets: [el.gfx, el.overlayGfx].filter(Boolean), scaleX: 1.4, scaleY: 1.4, duration: 150, yoyo: true });
    if (el.cleared && el.targetRingGfx) {
      this.tweens.add({ targets: el.targetRingGfx, alpha: 0, duration: 200, onComplete: () => { el.targetRingGfx && el.targetRingGfx.destroy(); el.targetRingGfx = null; } });
    }
    this.lastTransformed.push(el.type);
    if (this.lastTransformed.length > 3) this.lastTransformed.shift();
    if (combo2 || combo3) { this.combosFound++; this.comboMult = Math.min(this.comboMult + 1, 9); this.hud.showCombo(this.comboMult); }
    AudioEngine.playTransform(el.type);
    this.time.delayedCall(450, () => { el._transforming = false; this._checkComplete(); });
  }

  _doCombo2(combo, el) {
    const ring = this.add.graphics().setDepth(7);
    ring.lineStyle(4, combo.color || 0x7FFFD4, 1); ring.strokeCircle(el.x, el.y, 5);
    this.tweens.add({ targets: ring, scaleX: 12, scaleY: 12, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
    AudioEngine.playCombo(combo.chord);
    if (!GameState.recipesDiscovered.has(combo.result)) {
      GameState.recipesDiscovered.add(combo.result); this.newRecipes.push(combo.name);
      this.score += combo.score * 2; this._showBanner(`NEW RECIPE: ${combo.name}!`); saveState();
    }
  }

  _doCombo3(combo, el) {
    const flash = this.add.graphics().setDepth(9);
    flash.fillStyle(combo.color || 0x7FFFD4, 0.6); flash.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.tweens.add({ targets: flash, alpha: 0, duration: 800, onComplete: () => flash.destroy() });
    AudioEngine.playCombo([523, 659, 784, 1047]);
    GameState.settings.vibration && navigator.vibrate && navigator.vibrate([50, 30, 50]);
  }

  _showBanner(msg) {
    const b = this.add.text(GAME_WIDTH / 2, -30, msg, { fontSize: '14px', fontFamily: 'sans-serif', color: '#1A237E', fontStyle: 'bold', backgroundColor: '#7FFFD4', padding: { x: 10, y: 5 } }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets: b, y: TOP_BAR_HEIGHT + 40, duration: 300 });
    this.time.delayedCall(1500, () => this.tweens.add({ targets: b, y: -30, duration: 300, onComplete: () => b.destroy() }));
  }

  _emitParticles(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, sp = 80 + Math.random() * 40;
      this.particles.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, color, r: 5, life: 0, maxLife: 500 });
    }
  }

  _checkComplete() {
    if (this._completed) return false;
    const done = this.requiredTargetIds.every(id => this.elements.find(e => e.id === id)?.cleared);
    if (done && !this.pulseActive) { this._completed = true; this._onComplete(); return true; }
    return false;
  }

  _onPulseEnd() {
    this.pulseActive = false; this.pulseGfx.clear(); this.pathGfx.clear();
    this.lastTransformed = []; AudioEngine.setMusicVolume(0.25, 0.3);
    if (!this._checkComplete()) {
      AudioEngine.playStageFail();
      this.elements.filter(e => e.isTarget && !e.cleared).forEach(el => {
        this.tweens.add({ targets: [el.gfx, el.overlayGfx, el.targetRingGfx].filter(Boolean), x: '+=3', duration: 60, yoyo: true, repeat: 5 });
      });
      this.pendingRetry = true;
      this.time.delayedCall(800, () => {
        this.pendingRetry = false; this.attemptCount++;
        this.hud.setAttempt(this.attemptCount);
        if (this.attemptCount >= HINT_TRIGGER_ATTEMPTS) this.hud.enableHint(true);
        this.elements.forEach(el => {
          el._transforming = false;
          if (el.isTarget) { el.cleared = false; if (!el.targetRingGfx) el.targetRingGfx = this.add.graphics().setDepth(4); }
          if (!el.gfx) renderElement(this, el);
          else { el.gfx.setAlpha(1).setScale(1); el.overlayGfx && el.overlayGfx.setAlpha(1).setScale(1); }
        });
        this.lastTransformed = []; this.comboMult = 1; this._completed = false;
      });
    }
  }

  _onComplete() {
    this.elements.forEach((el, i) => el.gfx && this.time.delayedCall(i * 60, () => {
      this._emitParticles(el.x, el.y, el.cfg.color, 6);
      this.tweens.add({ targets: [el.gfx, el.overlayGfx].filter(Boolean), alpha: 0, scale: 1.5, duration: 400 });
    }));
    const elapsed = (this.time.now - this.stageStartTime) / 1000;
    const speedBonus = elapsed < 3 ? 500 : elapsed < 10 ? Math.floor(500 * (10 - elapsed) / 7) : 0;
    const noRetry = this.attemptCount === 1 ? 200 : 0;
    const pathRatio = this.drawnPathLength / MAX_PATH_LENGTH;
    const compact = pathRatio <= 0.3 ? 300 : pathRatio <= 0.8 ? Math.floor(300 * (0.8 - pathRatio) / 0.5) : 0;
    this.score += speedBonus + noRetry + compact + Math.floor(1000 * Math.max(1, this.stageNum * 0.5));
    if (this.score > GameState.highScore) GameState.highScore = this.score;
    GameState.currentStage = Math.max(GameState.currentStage, this.stageNum + 1);
    saveState();
    const stars = this.attemptCount === 1 && speedBonus >= 200 ? 3 : this.attemptCount === 1 ? 2 : 1;
    GameState.settings.vibration && navigator.vibrate && navigator.vibrate([50, 30, 50]);
    const go = () => this.scene.start('ResultsScene', {
      stage: this.stageNum, score: this.score, stars,
      combosFound: this.combosFound, totalCombos: COMBO_RECIPES.length,
      newRecipes: this.newRecipes, attemptCount: this.attemptCount,
    });
    this.time.delayedCall(1500, () => {
      if (this.stageNum % 10 === 0) AdManager.maybeShowInterstitial('milestone', go);
      else go();
    });
  }

  _fadeElement(el) {
    this.tweens.add({ targets: [el.gfx, el.overlayGfx].filter(Boolean), alpha: 0, scale: 0.5, duration: 200, onComplete: () => {
      el.gfx && el.gfx.destroy(); el.gfx = null;
      el.overlayGfx && el.overlayGfx.destroy(); el.overlayGfx = null;
    }});
  }

  _showStageIntro() {
    const cx = GAME_WIDTH / 2, ov = this.add.graphics().setDepth(15);
    ov.fillStyle(0x1A237E, 0.85); ov.fillRect(0, GAME_HEIGHT/2 - 50, GAME_WIDTH, 100);
    const txt = this.add.text(cx, GAME_HEIGHT/2, `Stage ${this.stageNum}`, { fontSize: '28px', fontFamily: 'sans-serif', color: '#7FFFD4', fontStyle: 'bold' }).setOrigin(0.5).setDepth(16);
    this.time.delayedCall(800, () => this.tweens.add({ targets: [ov, txt], alpha: 0, duration: 300, onComplete: () => { ov.destroy(); txt.destroy(); } }));
  }

  onPause() {
    AudioEngine.setMusicVolume(0.05, 0.2); AudioEngine.setMusicFilter(400, 0.2);
    this.scene.pause(); this.scene.launch('PauseScene'); this.scene.bringToTop('PauseScene');
    this.events.once('resume', () => { AudioEngine.setMusicVolume(0.25, 0.5); AudioEngine.setMusicFilter(1200, 0.5); });
  }

  onHintRequest() {
    if (this.attemptCount < HINT_TRIGGER_ATTEMPTS) return;
    const targets = this.elements.filter(e => e.isTarget && !e.cleared);
    if (!targets.length) return;
    AdManager.showRewardedForHint(ok => {
      if (!ok) return;
      const gfx = this.add.graphics().setDepth(11);
      gfx.lineStyle(3, 0x7FFFD4, 0.5); gfx.beginPath();
      gfx.moveTo(targets[0].x - 30, targets[0].y - 30);
      targets.forEach(e => gfx.lineTo(e.x, e.y)); gfx.strokePath();
      this.tweens.add({ targets: gfx, alpha: 0, duration: 1500, delay: 500, onComplete: () => gfx.destroy() });
    });
  }
}
