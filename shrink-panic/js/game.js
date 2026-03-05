// Shrink Panic - Core GameScene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.continueData = data ? data.continueData : null;
  }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.gw = w; this.gh = h;
    SFX.init(); SFX.resume();
    if (!this.continueData) AdManager.reset();

    // State
    this.score = this.continueData ? this.continueData.score : 0;
    this.expandEnergy = 0;
    this.missCount = 0;
    this.combo = 0;
    this.bestCombo = this.continueData ? this.continueData.bestCombo : 0;
    this.targetsHit = this.continueData ? this.continueData.targetsHit : 0;
    this.elapsedTime = this.continueData ? this.continueData.time : 0;
    this.lastTapTime = Date.now();
    this.lastDoubleTap = 0;
    this.isIdle = false;
    this.gameOver = false;
    this.expandReady = false;
    this.targets = [];
    this.paused = false;
    this._lastHitTime = 0;

    // Viewport
    const vpPct = this.continueData ? 0.30 : 1.0;
    const margin = CONFIG.GAMEPLAY.VIEWPORT_MARGIN;
    const hudH = CONFIG.GAMEPLAY.HUD_HEIGHT;
    this.vpFull = { x: margin / 2, y: hudH + margin / 2, width: w - margin, height: h - hudH - margin };
    this.vp = {
      x: this.vpFull.x + this.vpFull.width * (1 - vpPct) / 2,
      y: this.vpFull.y + this.vpFull.height * (1 - vpPct) / 2,
      width: this.vpFull.width * vpPct,
      height: this.vpFull.height * vpPct
    };

    // Graphics layers
    this.add.rectangle(w / 2, h / 2, w, h, CONFIG.COLORS.VOID).setDepth(0);
    this.activeArea = this.add.rectangle(0, 0, 0, 0, CONFIG.COLORS.BG_ACTIVE).setOrigin(0).setDepth(1);
    this.vpBorder = this.add.rectangle(0, 0, 0, 0).setOrigin(0)
      .setStrokeStyle(3, CONFIG.COLORS.VIEWPORT_BORDER).setFillStyle(0, 0).setDepth(3);
    this.tweens.add({ targets: this.vpBorder, alpha: 0.7, duration: 800, yoyo: true, repeat: -1 });

    this._updateVPGraphics();
    HUD.create(this, w);
    this._setupInput();
    this._startSpawner();

    // Survival score timer
    this.time.addEvent({ delay: 1000, callback: () => {
      if (!this.gameOver) {
        this.score += CONFIG.SCORING.SURVIVAL_PER_SEC;
        HUD.update(this);
      }
    }, loop: true });

    this.continueData = null;
  }

  _setupInput() {
    this.input.on('pointerdown', (pointer) => {
      if (this.gameOver || this.paused) return;
      SFX.resume();
      const now = Date.now();
      this.lastTapTime = now;
      this.isIdle = false;
      this.vpBorder.setStrokeStyle(3, CONFIG.COLORS.VIEWPORT_BORDER);

      // Double tap
      if (now - this.lastDoubleTap < CONFIG.GAMEPLAY.DOUBLE_TAP_THRESHOLD) {
        if (this.expandEnergy >= CONFIG.GAMEPLAY.EXPAND_COST) {
          this._doExpand();
          this.lastDoubleTap = 0;
          return;
        }
      }
      this.lastDoubleTap = now;
      this._checkTargetHit(pointer.x, pointer.y);
    });
  }

  _checkTargetHit(px, py) {
    if (!StageManager.isInsideViewport(px, py, this.vp)) return;
    let hit = null, hitDist = Infinity;
    for (const t of this.targets) {
      if (!t.active) continue;
      if (!StageManager.isInsideViewport(t.x, t.y, this.vp)) continue;
      const d = Phaser.Math.Distance.Between(px, py, t.x, t.y);
      const r = CONFIG.TARGET_TYPES[t.getData('type')].size / 2 + 10;
      if (d < r && d < hitDist) { hit = t; hitDist = d; }
    }
    if (hit) this._hitTarget(hit);
  }

  _hitTarget(target) {
    const type = target.getData('type');
    const info = CONFIG.TARGET_TYPES[type];
    const x = target.x, y = target.y;
    target.setActive(false).setVisible(false);

    if (type === 'decoy') {
      this.expandEnergy = Math.max(0, this.expandEnergy - 1);
      SFX.tapDecoy();
      Effects.burstParticles(this, x, y, info.color, 8);
      Effects.scorePopup(this, x, y, '-1 Energy', info.hex);
      this.cameras.main.shake(100, 0.008);
      HUD.update(this);
      return;
    }

    // Combo
    const now = Date.now();
    this.combo = (now - this._lastHitTime < CONFIG.GAMEPLAY.COMBO_WINDOW) ? this.combo + 1 : 1;
    this._lastHitTime = now;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;

    // Score
    let pts = info.points + Math.max(0, this.combo - 1) * CONFIG.SCORING.COMBO_INCREMENT;
    const nearEdge = StageManager.isNearEdge(x, y, this.vp);
    if (nearEdge) pts += CONFIG.SCORING.EDGE_BONUS;
    this.score += pts;
    this.targetsHit++;
    this.expandEnergy = Math.min(CONFIG.GAMEPLAY.EXPAND_COST, this.expandEnergy + 1);
    if (this.expandEnergy < CONFIG.GAMEPLAY.EXPAND_COST) this.expandReady = false;

    // Juice
    if (type === 'fleeting') SFX.tapFleeting();
    else if (type === 'small') SFX.tapSmall(this.combo);
    else SFX.tapNormal(this.combo);

    Effects.burstParticles(this, x, y, info.color, 15);
    Effects.scorePopup(this, x, y - 10, '+' + pts, info.hex);
    if (nearEdge) Effects.scorePopup(this, x, y - 35, 'EDGE!', '#00FFFF');
    if (this.combo > 1) Effects.comboText(this, x, y, this.combo);
    Effects.haptic();

    this.cameras.main.shake(100, 0.004);
    this.cameras.main.setZoom(1.02);
    setTimeout(() => { if (this.cameras && this.cameras.main) this.cameras.main.setZoom(1); }, 150);

    // Hit-stop via setTimeout (NOT delayedCall with timeScale)
    this.scene.pause();
    setTimeout(() => { if (!this.gameOver) this.scene.resume(); }, 30);

    HUD.punchScore(this);
    HUD.update(this);
  }

  _doExpand() {
    this.expandEnergy = 0;
    this.expandReady = false;
    const rec = CONFIG.GAMEPLAY.EXPAND_RECOVERY;
    const dw = this.vpFull.width * rec, dh = this.vpFull.height * rec;
    this.vp.x = Math.max(this.vpFull.x, this.vp.x - dw / 2);
    this.vp.y = Math.max(this.vpFull.y, this.vp.y - dh / 2);
    this.vp.width = Math.min(this.vpFull.width, this.vp.width + dw);
    this.vp.height = Math.min(this.vpFull.height, this.vp.height + dh);
    this.score += CONFIG.SCORING.EXPAND_BONUS;

    SFX.expandBurst();
    Effects.expandWave(this, this.vp);
    this.cameras.main.setZoom(1.05);
    setTimeout(() => { if (this.cameras && this.cameras.main) this.cameras.main.setZoom(1); }, 300);
    const flash = this.add.rectangle(this.gw / 2, this.gh / 2, this.gw, this.gh, 0x00FFFF, 0.15).setDepth(400);
    this.tweens.add({ targets: flash, alpha: 0, duration: 80, onComplete: () => flash.destroy() });
    HUD.update(this);
    this._updateVPGraphics();
  }

  _startSpawner() { this._spawnTarget(); }

  _spawnTarget() {
    if (this.gameOver) return;
    const diff = StageManager.getDifficulty(this.elapsedTime);
    const active = this.targets.filter(t => t.active);
    if (active.length < diff.maxTargets) {
      const type = StageManager.getTargetType(this.elapsedTime);
      const mercy = this._vpPercent() < 0.25;
      const pos = StageManager.generateTargetPosition(this.gw, this.gh, this.vp, this.elapsedTime, mercy);
      if (StageManager.validateSpawn(pos.x, pos.y, this.targets, type)) {
        this._createTarget(pos.x, pos.y, type, diff.lifespan);
      }
    }
    this.time.delayedCall(Math.max(400, diff.spawnInterval), () => this._spawnTarget());
  }

  _createTarget(x, y, type, lifespan) {
    if (type === 'fleeting') lifespan = 1200;
    const target = this.add.image(x, y, 'target_' + type).setDepth(5).setScale(0);
    target.setData('type', type);
    target.setInteractive();
    this.tweens.add({ targets: target, scaleX: 1, scaleY: 1, duration: 150, ease: 'Back.easeOut' });
    this.tweens.add({ targets: target, scaleX: 1.15, scaleY: 1.15, duration: 400, yoyo: true, repeat: -1, delay: 200 });
    this.targets.push(target);
    this.time.delayedCall(lifespan, () => {
      if (target.active) {
        target.setActive(false).setVisible(false);
        if (StageManager.isInsideViewport(x, y, this.vp)) this._onMiss();
      }
    });
  }

  _onMiss() {
    this.combo = 0;
    this.missCount++;
    if (this.missCount >= CONFIG.GAMEPLAY.MISS_MAX) {
      this.missCount = 0;
      this._collapseViewport();
    }
    HUD.update(this);
  }

  _collapseViewport() {
    const p = CONFIG.GAMEPLAY.MISS_PENALTY;
    const dw = this.vp.width * p, dh = this.vp.height * p;
    this.vp.x += dw / 2; this.vp.y += dh / 2;
    this.vp.width -= dw; this.vp.height -= dh;
    SFX.missPenalty();
    Effects.collapseShake(this);
    let f = 0;
    const ft = this.time.addEvent({ delay: 100, callback: () => {
      this.vpBorder.setStrokeStyle(3, f % 2 === 0 ? CONFIG.COLORS.DANGER_FLASH : CONFIG.COLORS.VIEWPORT_BORDER);
      if (++f >= 6) ft.remove();
    }, repeat: 5 });
    this._updateVPGraphics();
  }

  _vpPercent() {
    return (this.vp.width * this.vp.height) / (this.vpFull.width * this.vpFull.height);
  }

  _updateVPGraphics() {
    this.activeArea.setPosition(this.vp.x, this.vp.y).setSize(this.vp.width, this.vp.height);
    this.vpBorder.setPosition(this.vp.x, this.vp.y).setSize(this.vp.width, this.vp.height);
  }

  _togglePause() {
    this.paused = true;
    this.scene.pause();
    this.scene.launch('PauseScene');
  }

  update(time, delta) {
    if (this.gameOver || this.paused) return;
    const dt = delta / 1000;
    const diff = StageManager.getDifficulty(this.elapsedTime);
    this.elapsedTime += dt;

    // Idle check
    const idleMs = Date.now() - this.lastTapTime;
    const mult = idleMs > CONFIG.GAMEPLAY.IDLE_THRESHOLD ? CONFIG.GAMEPLAY.IDLE_MULTIPLIER : 1;
    if (idleMs > CONFIG.GAMEPLAY.IDLE_THRESHOLD && !this.isIdle) {
      this.isIdle = true;
      this.vpBorder.setStrokeStyle(3, 0xFFA500);
    }

    // Shrink viewport
    const rate = diff.shrinkRate * mult * dt;
    this.vp.x += rate; this.vp.y += rate;
    this.vp.width = Math.max(0, this.vp.width - rate * 2);
    this.vp.height = Math.max(0, this.vp.height - rate * 2);
    this._updateVPGraphics();

    // Target visibility
    for (const t of this.targets) {
      if (t.active) t.setVisible(StageManager.isInsideViewport(t.x, t.y, this.vp));
    }

    // Game over check
    if (this.vp.width < CONFIG.GAMEPLAY.MIN_VIEWPORT || this.vp.height < CONFIG.GAMEPLAY.MIN_VIEWPORT) {
      this._doGameOver();
    }
  }

  _doGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    SFX.gameOver();
    Effects.deathSpiral(this, this.vp, () => {
      setTimeout(() => {
        this.scene.start('GameOverScene', {
          score: this.score, time: this.elapsedTime,
          targetsHit: this.targetsHit, bestCombo: this.bestCombo
        });
      }, 400);
    });
  }
}
