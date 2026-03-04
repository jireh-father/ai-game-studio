// game.js — Core gameplay scene for Magma Flow
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.stageNum = data.stage || 1;
    this.score = data.score || 0;
    this.comboStreak = data.combo || 0;
    this.bestScore = data.best || 0;
    this.consecutiveFails = data.fails || 0;
  }

  create() {
    this.stageData = generateStage(this.stageNum);
    this.particles = [];
    this.walls = [];
    this.isDrawing = false;
    this.wallStart = null;
    this.currentWallGfx = null;
    this.idleTimer = 0;
    this.stageTimer = this.stageData.timeLimit * 1000;
    this.emitTimers = this.stageData.sources.map(() => 0);
    this.totalEmitted = 0;
    this.totalCaptured = 0;
    this.countdownLeft = 3;
    this.playing = false;
    this.stageEnded = false;
    this.lavaFlowing = false;
    this.emitDuration = this.stageData.timeLimit * 1000 * 0.6;
    this.emitElapsed = 0;
    this.sparks = [];

    // Graphics layers
    this.bgGfx = this.add.graphics();
    this.obstGfx = this.add.graphics();
    this.wallGfx = this.add.graphics();
    this.lavaGfx = this.add.graphics();
    this.fxGfx = this.add.graphics();

    this.drawStageElements();
    this.setupInput();
    this.setupSounds();

    this.scene.launch('UIScene', {
      stage: this.stageNum, score: this.score,
      timeLimit: this.stageData.timeLimit, combo: this.comboStreak
    });

    this.showCountdown();
  }

  setupSounds() {
    if (!this.sndCtx) {
      try { this.sndCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { this.sndCtx = null; }
    }
  }

  playSound(freq, dur, type, vol) {
    if (!this.sndCtx) return;
    try {
      const o = this.sndCtx.createOscillator();
      const g = this.sndCtx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.value = vol || 0.3;
      g.gain.exponentialRampToValueAtTime(0.001, this.sndCtx.currentTime + dur / 1000);
      o.connect(g); g.connect(this.sndCtx.destination);
      o.start(); o.stop(this.sndCtx.currentTime + dur / 1000);
    } catch (e) {}
  }

  showCountdown() {
    const ui = this.scene.get('UIScene');
    if (ui) ui.events.emit('countdown', this.countdownLeft);
    this.playSound(800, 100, 'square', 0.4);
    this.time.delayedCall(CONFIG.COUNTDOWN_MS, () => {
      this.countdownLeft--;
      if (this.countdownLeft > 0) {
        this.showCountdown();
      } else {
        if (ui) ui.events.emit('countdown', 0);
        this.playSound(1200, 200, 'square', 0.5);
        this.playing = true;
        this.lavaFlowing = true;
      }
    });
  }

  drawStageElements() {
    // Background
    this.bgGfx.fillStyle(CONFIG.COL_BG_TOP, 1).fillRect(0, 0, 360, 360);
    this.bgGfx.fillStyle(CONFIG.COL_BG, 1).fillRect(0, 360, 360, 360);
    // Sources
    this.sourceGfx = this.add.graphics();
    this.stageData.sources.forEach(s => {
      this.sourceGfx.fillStyle(CONFIG.COL_LAVA_HOT, 1).fillCircle(s.x, s.y, 20);
      this.sourceGfx.fillStyle(CONFIG.COL_LAVA_WARM, 1).fillCircle(s.x, s.y, 12);
      this.sourceGfx.lineStyle(3, CONFIG.COL_TARGET_RIM, 1).strokeCircle(s.x, s.y, 20);
    });
    // Targets
    this.targetObjs = this.stageData.targets.map(t => {
      const g = this.add.graphics();
      g.setData('baseX', t.x); g.setData('target', t);
      this.drawCauldron(g, t, 0);
      return g;
    });
    // Obstacles
    this.stageData.obstacles.forEach(o => {
      this.obstGfx.fillStyle(CONFIG.COL_OBSTACLE, 1).fillPoints(o.verts, true);
      this.obstGfx.lineStyle(2, 0x3D2B1F, 1).strokePoints(o.verts, true);
    });
  }

  drawCauldron(g, t, fillPct) {
    g.clear();
    const hw = t.width / 2, h = t.height;
    g.fillStyle(CONFIG.COL_OBSTACLE, 1).fillPoints([
      { x: t.x - hw, y: t.y }, { x: t.x + hw, y: t.y },
      { x: t.x + hw * 0.7, y: t.y + h }, { x: t.x - hw * 0.7, y: t.y + h }
    ], true);
    g.fillStyle(CONFIG.COL_TARGET_RIM, 1).fillRect(t.x - hw - 4, t.y - 4, t.width + 8, 8);
    g.fillStyle(fillPct > 0 ? CONFIG.COL_TARGET_ACTIVE : CONFIG.COL_TARGET_INNER, 0.6 + fillPct * 0.4);
    g.fillEllipse(t.x, t.y + 12, hw * 1.2, 12);
  }

  setupInput() {
    this.input.on('pointerdown', (ptr) => {
      if (!this.playing || this.stageEnded) return;
      if (this.sndCtx && this.sndCtx.state === 'suspended') this.sndCtx.resume();
      this.idleTimer = 0;
      this.isDrawing = true;
      this.wallStart = { x: this.snapGrid(ptr.x), y: this.snapGrid(ptr.y) };
      this.spawnSpark(ptr.x, ptr.y, CONFIG.COL_WALL, 8);
      this.playSound(600, 150, 'sine', 0.3);
    });
    this.input.on('pointermove', (ptr) => {
      if (!this.isDrawing) return;
      this.drawCurrentWall(ptr);
    });
    this.input.on('pointerup', (ptr) => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      this.finalizeWall(ptr);
    });
  }

  snapGrid(v) { return Math.round(v / CONFIG.WALL_SNAP) * CONFIG.WALL_SNAP; }

  drawCurrentWall(ptr) {
    if (!this.currentWallGfx) this.currentWallGfx = this.add.graphics();
    this.currentWallGfx.clear();
    const ex = this.snapGrid(ptr.x), ey = this.snapGrid(ptr.y);
    let dx = ex - this.wallStart.x, dy = ey - this.wallStart.y;
    let len = Math.sqrt(dx * dx + dy * dy);
    if (len > CONFIG.WALL_MAX_LENGTH) {
      dx = (dx / len) * CONFIG.WALL_MAX_LENGTH;
      dy = (dy / len) * CONFIG.WALL_MAX_LENGTH;
    }
    this.currentWallGfx.lineStyle(10, CONFIG.COL_WALL, 0.3);
    this.currentWallGfx.lineBetween(this.wallStart.x, this.wallStart.y,
      this.wallStart.x + dx, this.wallStart.y + dy);
    this.currentWallGfx.lineStyle(CONFIG.WALL_WIDTH, CONFIG.COL_WALL, 0.8);
    this.currentWallGfx.lineBetween(this.wallStart.x, this.wallStart.y,
      this.wallStart.x + dx, this.wallStart.y + dy);
  }

  finalizeWall(ptr) {
    if (this.currentWallGfx) { this.currentWallGfx.destroy(); this.currentWallGfx = null; }
    const ex = this.snapGrid(ptr.x), ey = this.snapGrid(ptr.y);
    let dx = ex - this.wallStart.x, dy = ey - this.wallStart.y;
    let len = Math.sqrt(dx * dx + dy * dy);
    if (len < CONFIG.WALL_MIN_LENGTH) return;
    if (len > CONFIG.WALL_MAX_LENGTH) {
      dx = (dx / len) * CONFIG.WALL_MAX_LENGTH;
      dy = (dy / len) * CONFIG.WALL_MAX_LENGTH;
    }
    const wall = {
      x1: this.wallStart.x, y1: this.wallStart.y,
      x2: this.wallStart.x + dx, y2: this.wallStart.y + dy,
      ttl: this.stageData.wallTTL, age: 0
    };
    if (this.walls.length >= this.stageData.maxWalls) {
      const old = this.walls.shift();
      this.spawnSpark((old.x1 + old.x2) / 2, (old.y1 + old.y2) / 2, CONFIG.COL_LAVA_HARD, 6);
    }
    this.walls.push(wall);
    this.cameras.main.shake(150, 0.003);
    this.playSound(400, 200, 'sawtooth', 0.3);
  }

  spawnSpark(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      this.sparks.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 50,
        life: 300, maxLife: 300, color
      });
    }
  }

  updateWalls(delta) {
    this.walls.forEach(w => { w.age += delta; });
    this.walls = this.walls.filter(w => w.age < w.ttl);
  }

  updateMovingTargets() {
    this.stageData.targets.forEach((t, i) => {
      if (!t.moving) return;
      t.x = this.targetObjs[i].getData('baseX') +
        Math.sin(this.time.now * t.moveSpeed * 0.002) * t.moveRange;
      this.drawCauldron(this.targetObjs[i], t,
        Math.min(1, this.totalCaptured / Math.max(1, this.totalEmitted)));
    });
  }

  checkStageEnd() {
    if (this.stageEnded) return;
    if (this.stageTimer <= 0) { this.triggerStageFail(); return; }
    if (this.totalEmitted > 5 && !this.lavaFlowing) {
      const ratio = this.totalCaptured / this.totalEmitted;
      const active = this.particles.filter(p => p.state === 'flowing' && !p.inTarget);
      if (active.length === 0) {
        if (ratio >= CONFIG.STAGE_CLEAR_PERCENT) this.triggerStageClear();
        else this.triggerStageFail();
        return;
      }
    }
  }

  triggerStageClear() {
    this.stageEnded = true; this.lavaFlowing = false; this.comboStreak++;
    const base = 100 * this.stageNum;
    const timeRatio = this.stageTimer / (this.stageData.timeLimit * 1000);
    const speedBonus = timeRatio > 0.5 ? 50 * this.stageNum : 0;
    const effBonus = this.walls.length <= 2 ? 30 * this.stageNum : 0;
    const mult = CONFIG.getComboMult(this.comboStreak);
    const stageScore = Math.floor((base + speedBonus + effBonus) * mult);
    this.score += stageScore;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      try { localStorage.setItem('magmaflow_best', this.bestScore.toString()); } catch (e) {}
    }
    this.cameras.main.shake(200, 0.006);
    this.playSound(1000, 300, 'sine', 0.6);
    const ui = this.scene.get('UIScene');
    if (ui) ui.events.emit('stageClear', { stageScore, speedBonus, effBonus, mult, total: this.score });
    this.time.delayedCall(1800, () => {
      this.scene.stop('UIScene');
      this.scene.restart({ stage: this.stageNum + 1, score: this.score, combo: this.comboStreak, best: this.bestScore, fails: 0 });
    });
  }

  triggerStageFail() {
    this.stageEnded = true; this.lavaFlowing = false;
    this.comboStreak = 0; this.consecutiveFails++;
    this.cameras.main.shake(600, 0.01);
    this.playSound(80, 500, 'sawtooth', 0.5);
    const ui = this.scene.get('UIScene');
    if (ui) ui.events.emit('stageFail', { fails: this.consecutiveFails });
    this.time.delayedCall(CONFIG.DEATH_ANIM, () => {
      this.scene.stop('UIScene');
      this.scene.restart({ stage: this.stageNum, score: this.score, combo: 0, best: this.bestScore, fails: this.consecutiveFails });
    });
  }

  triggerGameOver(reason) {
    this.stageEnded = true; this.lavaFlowing = false;
    this.cameras.main.shake(600, 0.01);
    this.playSound(60, 800, 'sawtooth', 0.5);
    const ui = this.scene.get('UIScene');
    if (ui) ui.events.emit('gameOver', { score: this.score, stage: this.stageNum, best: this.bestScore, reason });
  }

  update(time, delta) {
    if (!this.playing || this.stageEnded) return;
    this.idleTimer += delta;
    if (this.idleTimer >= CONFIG.IDLE_LIMIT) { this.triggerGameOver('idle'); return; }
    if (this.idleTimer >= CONFIG.IDLE_WARN) {
      const ui = this.scene.get('UIScene');
      if (ui) ui.events.emit('idleWarn', this.idleTimer);
      if (this.idleTimer >= 9000 && Math.floor(this.idleTimer / 300) % 2 === 0) {
        this.cameras.main.flash(150, 255, 50, 50);
      }
    }
    this.stageTimer -= delta;
    const ui = this.scene.get('UIScene');
    if (ui) ui.events.emit('timerUpdate', this.stageTimer / (this.stageData.timeLimit * 1000));
    if (this.lavaFlowing) LavaPhysics.emitLava(this, delta);
    LavaPhysics.updateParticles(this, delta);
    this.updateWalls(delta);
    this.updateMovingTargets();
    LavaPhysics.renderLava(this);
    LavaPhysics.renderWalls(this);
    LavaPhysics.updateSparks(this, delta);
    this.checkStageEnd();
  }
}
