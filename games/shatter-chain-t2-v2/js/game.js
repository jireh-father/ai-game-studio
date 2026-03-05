// Shatter Chain - Core Game Scene

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.fx = new EffectsManager(this);
    this._hitStopActive = false;
    this._ballHitThisLaunch = false;
    const gs = window.GameState;
    gs.waveNumber = gs.waveNumber || 1;
    gs.score = gs.score || 0;

    const wave = generateWave(gs.waveNumber, gs.sessionSeed);
    this.waveDiff = wave.diff;
    gs.ballsLeft = wave.diff.balls;
    this.totalPanels = wave.panels.length;

    this.cameras.main.setBackgroundColor(CFG.COLOR.BG);
    this.drawBackground();
    this.createWalls();

    this.glassBodies = [];
    this.glassSprites = [];
    wave.panels.forEach(p => this.createGlassPanel(p));

    this.barriers = [];
    wave.barriers.forEach(b => this.createBarrier(b));

    this.shards = [];
    this.activeBall = null; this.ballInFlight = false; this.ballSprite = null;
    this.waveTimeLeft = this.waveDiff.timer; this.waveTimerActive = true; this.lastTickTime = 5;
    this.isAiming = false; this.aimStartX = 0; this.aimStartY = 0; this.trajectoryDots = [];
    this.maxChainDepth = 0; this.panelsDestroyedThisWave = 0; this.panelsDestroyedThisLaunch = 0;
    this.waveStartTime = this.time.now;
    this.totalChainsTriggered = window.GameState._totalChains || 0;
    this.totalPanelsDestroyed = window.GameState._totalPanels || 0;
    this.bestSingleLaunchPanels = window.GameState._bestLaunchPanels || 0;
    this._chainSequenceCount = 0;

    this.createHUD();
    this.showWaveStart();

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.matter.world.on('collisionstart', this.onCollision, this);

    this.lastInputTime = this.time.now;
    document.addEventListener('visibilitychange', this._onVisChange = () => {
      if (document.hidden) this.scene.pause(); else this.scene.resume();
    });

    if (gs.waveNumber === 12) {
      const warn = this.add.text(CFG.WIDTH / 2, CFG.ARENA_TOP + CFG.ARENA_HEIGHT + 10,
        'LAST WAVE WITH 3 BALLS!', {
          fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
          color: CFG.COLOR.DANGER_HEX, stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(100).setAlpha(0);
      this.tweens.add({ targets: warn, alpha: 1, duration: 300, yoyo: true, hold: 2000, onComplete: () => warn.destroy() });
    }
  }

  drawBackground() {
    const g = this.add.graphics().setDepth(0);
    g.lineStyle(1, 0x1E1E35, 0.15);
    const size = 30;
    for (let row = 0; row < CFG.HEIGHT / (size * 1.5) + 1; row++) {
      for (let col = 0; col < CFG.WIDTH / (size * 1.73) + 1; col++) {
        const cx = col * size * 1.73 + (row % 2 ? size * 0.866 : 0);
        const cy = row * size * 1.5;
        g.strokeCircle(cx, cy, size * 0.5);
      }
    }
    g.lineStyle(2, CFG.COLOR.BORDER, 0.6);
    g.strokeRect(0, CFG.ARENA_TOP, CFG.WIDTH, CFG.ARENA_HEIGHT);
    g.lineStyle(1, 0x333355, 0.4);
    g.lineBetween(10, CFG.LAUNCH_ZONE_TOP, CFG.WIDTH - 10, CFG.LAUNCH_ZONE_TOP);
  }

  createWalls() {
    const t = 20;
    const opts = { isStatic: true, label: 'wall', collisionFilter: { category: CFG.CAT_WALL, mask: CFG.CAT_BALL | CFG.CAT_SHARD } };
    this.matter.add.rectangle(CFG.WIDTH / 2, -t / 2, CFG.WIDTH + 40, t, opts);
    this.matter.add.rectangle(-t / 2, CFG.HEIGHT / 2, t, CFG.HEIGHT + 40, opts);
    this.matter.add.rectangle(CFG.WIDTH + t / 2, CFG.HEIGHT / 2, t, CFG.HEIGHT + 40, opts);
    this.matter.add.rectangle(CFG.WIDTH / 2, CFG.HEIGHT + t / 2 + 60, CFG.WIDTH + 40, t, { ...opts, label: 'floor' });
  }

  createGlassPanel(p) {
    const w = p.w || 40, h = p.h || 30;
    const body = this.matter.add.rectangle(p.x, p.y, w, h, {
      ...GLASS_BODY,
      plugin: { glassType: p.type, hp: p.hp, baseX: p.baseX || p.x, baseY: p.y, moving: p.moving, moveSpeed: p.moveSpeed, moveAmp: p.moveAmp }
    });

    const color = p.type === 'bomb' ? CFG.COLOR.BOMB : p.type === 'ice' ? CFG.COLOR.ICE : p.type === 'armored' ? CFG.COLOR.ARMORED : p.type === 'reinforced' ? CFG.COLOR.REINFORCED : CFG.COLOR.GLASS;
    const sprite = this.add.rectangle(p.x, p.y, w, h, color, p.type === 'normal' ? 0.85 : 0.9).setDepth(20);

    const hi = this.add.graphics().setDepth(21);
    hi.lineStyle(1, CFG.COLOR.WHITE, 0.5);
    hi.lineBetween(p.x - w / 2 + 2, p.y - h / 2 + 2, p.x + w / 2 - 2, p.y - h / 2 + 2);
    hi.lineBetween(p.x - w / 2 + 2, p.y - h / 2 + 2, p.x - w / 2 + 2, p.y + h / 2 - 2);

    if (p.type === 'armored') {
      const rv = this.add.graphics().setDepth(22);
      rv.fillStyle(0x8A8A9A, 1);
      [[p.x - w/2+6, p.y - h/2+6], [p.x + w/2-6, p.y - h/2+6],
       [p.x - w/2+6, p.y + h/2-6], [p.x + w/2-6, p.y + h/2-6]].forEach(([rx, ry]) => rv.fillCircle(rx, ry, 2.5));
      sprite._rivets = rv;
    }
    if (p.type === 'reinforced') {
      hi.lineStyle(0.5, 0x8ACCE8, 0.5);
      hi.strokeRect(p.x - w/2+3, p.y - h/2+3, w-6, h-6);
    }
    if (p.type === 'bomb') {
      const fuse = this.add.circle(p.x, p.y, 4, CFG.COLOR.WHITE, 0.9).setDepth(22);
      this.tweens.add({ targets: fuse, scaleX: 1.4, scaleY: 1.4, alpha: 0.4, duration: 400, yoyo: true, repeat: -1 });
      sprite._fuse = fuse;
    }
    if (p.type === 'ice') {
      const iceG = this.add.graphics().setDepth(22);
      iceG.lineStyle(0.8, CFG.COLOR.WHITE, 0.45);
      iceG.lineBetween(p.x - w/2+4, p.y - h/2+4, p.x + w/2-4, p.y + h/2-4);
      iceG.lineBetween(p.x + w/2-4, p.y - h/2+4, p.x - w/2+4, p.y + h/2-4);
      sprite._iceDecor = iceG;
    }

    sprite._highlight = hi;
    sprite._body = body;
    body._sprite = sprite;
    body._hp = p.hp;
    body._type = p.type;
    body._w = w;
    body._h = h;
    this.glassBodies.push(body);
    this.glassSprites.push(sprite);
  }

  createBarrier(b) {
    const body = this.matter.add.rectangle(b.x + b.w/2, b.y, b.w, b.h, { ...BARRIER_BODY });
    Phaser.Physics.Matter.Matter.Body.setAngle(body, b.angle);
    const sprite = this.add.rectangle(b.x + b.w/2, b.y, b.w, b.h, CFG.COLOR.BARRIER).setDepth(20);
    sprite.setRotation(b.angle);
    body._sprite = sprite;
    body._rotSpeed = b.rotSpeed;
    body._baseAngle = b.angle;
    this.barriers.push(body);
  }

  createHUD() {
    const gs = window.GameState;
    const s = { fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: CFG.COLOR.WHITE_HEX };
    this.hudWave = this.add.text(10, 12, `WAVE ${gs.waveNumber}`, s).setDepth(300);
    if (this.waveDiff.isRest) { this.hudWave.setText('BONUS WAVE'); this.hudWave.setColor(CFG.COLOR.SCORE_HEX); }
    this.hudScore = this.add.text(CFG.WIDTH/2, 12, `${gs.score}`, { ...s, fontSize: '16px' }).setOrigin(0.5, 0).setDepth(300);
    this.hudBest = this.add.text(CFG.WIDTH-10, 12, `BEST: ${gs.highScore}`, { ...s, fontSize: '11px', color: '#999' }).setOrigin(1, 0).setDepth(300);
    this.timerBar = this.add.rectangle(0, CFG.ARENA_TOP - CFG.TIMER_BAR_H, CFG.WIDTH, CFG.TIMER_BAR_H, CFG.COLOR.GLASS).setOrigin(0, 0).setDepth(300);
    this.ballIndicators = [];
    this.updateBallIndicators();
  }

  updateBallIndicators() {
    this.ballIndicators.forEach(b => b.destroy());
    this.ballIndicators = [];
    const gs = window.GameState;
    const total = this.waveDiff.balls;
    const startX = CFG.WIDTH / 2 - (total - 1) * 18;
    for (let i = 0; i < total; i++) {
      const filled = i < gs.ballsLeft;
      const c = this.add.circle(startX + i * 36, CFG.HEIGHT - 40, 10, filled ? CFG.COLOR.BALL : 0x333355, filled ? 1 : 0.4).setDepth(300);
      c.setStrokeStyle(filled ? 1.5 : 1, filled ? CFG.COLOR.BALL_HI : 0x555577);
      this.ballIndicators.push(c);
    }
  }

  showWaveStart() {
    const gs = window.GameState;
    const label = this.waveDiff.isRest ? 'BONUS WAVE' : this.waveDiff.isBoss ? 'BOSS WAVE' : `WAVE ${gs.waveNumber}`;
    const color = this.waveDiff.isRest ? CFG.COLOR.SCORE_HEX : this.waveDiff.isBoss ? CFG.COLOR.DANGER_HEX : CFG.COLOR.WHITE_HEX;
    const txt = this.add.text(CFG.WIDTH/2, CFG.HEIGHT/2, label, {
      fontSize: '40px', fontFamily: 'Arial', fontStyle: 'bold', color, stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(400).setAlpha(0);
    this.tweens.add({ targets: txt, alpha: 1, duration: 200, hold: 400, yoyo: true, onComplete: () => txt.destroy() });
  }

  onPointerDown(pointer) {
    if (this.ballInFlight || !this.waveTimerActive || window.GameState.ballsLeft <= 0) return;
    if (pointer.y < CFG.LAUNCH_ZONE_TOP) return;
    this.isAiming = true;
    this.aimStartX = pointer.x;
    this.aimStartY = pointer.y;
    this.lastInputTime = this.time.now;
  }

  onPointerMove(pointer) {
    if (!this.isAiming) return;
    this.drawTrajectory(pointer);
    this.lastInputTime = this.time.now;
  }

  onPointerUp(pointer) {
    if (!this.isAiming) return;
    this.isAiming = false;
    this.clearTrajectory();
    const dx = pointer.x - this.aimStartX;
    const dy = pointer.y - this.aimStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < CFG.BALL_DRAG_MIN) return;
    this.launchBall(dx, dy, dist);
    this.lastInputTime = this.time.now;
  }

  drawTrajectory(pointer) {
    this.clearTrajectory();
    const dx = pointer.x - this.aimStartX, dy = pointer.y - this.aimStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < CFG.BALL_DRAG_MIN) return;
    const speed = Phaser.Math.Clamp(dist / 30, CFG.BALL_SPEED_MIN, CFG.BALL_SPEED_MAX);
    const angle = Math.atan2(dy, dx);
    const vx = Math.cos(angle) * speed, vy = Math.sin(angle) * speed;
    const lx = CFG.WIDTH / 2, ly = CFG.LAUNCH_ZONE_TOP - 20;
    for (let i = 0; i < 8; i++) {
      const t = (i + 1) * 6;
      const dot = this.add.circle(lx + vx * t, ly + vy * t + 0.2 * t * t, 3, CFG.COLOR.WHITE, Math.max(0.1, 0.6 - i * 0.065)).setDepth(50);
      this.trajectoryDots.push(dot);
    }
  }

  clearTrajectory() { this.trajectoryDots.forEach(d => d.destroy()); this.trajectoryDots = []; }

  launchBall(dx, dy, dist) {
    const gs = window.GameState;
    gs.ballsLeft--;
    this.updateBallIndicators();
    this._ballHitThisLaunch = false;
    this._frozenThisLaunch = false;
    this.panelsDestroyedThisLaunch = 0;
    this._chainSequenceCount = 0;

    const speed = Phaser.Math.Clamp(dist / 30, CFG.BALL_SPEED_MIN, CFG.BALL_SPEED_MAX);
    const angle = Math.atan2(dy, dx);
    const lx = CFG.WIDTH / 2, ly = CFG.LAUNCH_ZONE_TOP - 20;

    const ball = this.matter.add.circle(lx, ly, CFG.BALL_RADIUS, { ...BALL_BODY });
    ball._isBall = true;
    this.ballSprite = this.add.circle(lx, ly, CFG.BALL_RADIUS, CFG.COLOR.BALL).setDepth(30);
    this.ballSprite.setStrokeStyle(1.5, 0x888890);
    const spec = this.add.ellipse(lx - 4, ly - 5, 8, 5, CFG.COLOR.WHITE, 0.5).setDepth(31);
    this.ballSprite._spec = spec;
    this.ballSprite._body = ball;

    Phaser.Physics.Matter.Matter.Body.setVelocity(ball, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed });
    this.activeBall = ball;
    this.ballInFlight = true;
    this.fx.launchStretch(this.ballSprite);
    playLaunch();

    if (gs.ballsLeft === 0 && this.glassBodies.length >= 2) this.fx.slowMotion(800, 0.5);
    try { navigator.vibrate(20); } catch (e) {}
  }

  update(time, delta) {
    if (this.waveTimerActive) {
      this.waveTimeLeft -= delta;
      const frac = Math.max(0, this.waveTimeLeft / this.waveDiff.timer);
      this.timerBar.width = CFG.WIDTH * frac;
      if (this.waveTimeLeft <= CFG.TIMER_WARNING) {
        this.timerBar.setFillStyle(CFG.COLOR.DANGER);
        this.timerBar.setScale(1, 1 + Math.sin(time / 250) * 0.03);
        const sec = Math.ceil(this.waveTimeLeft / 1000);
        if (sec < this.lastTickTime && sec >= 0) { this.lastTickTime = sec; playTimerTick(); }
      }
      if (this.waveTimeLeft <= 0) { this.waveTimeLeft = 0; this.fx.shake(0.005, 200); this.onWaveFailed(); }
    }

    if (this.ballInFlight && this.activeBall) {
      const bx = this.activeBall.position.x, by = this.activeBall.position.y;
      if (this.ballSprite) {
        this.ballSprite.setPosition(bx, by);
        if (this.ballSprite._spec) this.ballSprite._spec.setPosition(bx - 4, by - 5);
      }
      this.fx.addTrail(this.ballSprite);
      if (by > CFG.HEIGHT + 40 || bx < -40 || bx > CFG.WIDTH + 40) this.onBallLost();
    }

    for (const shard of this.shards) {
      if (shard._sprite && shard.position) {
        shard._sprite.setPosition(shard.position.x, shard.position.y);
        shard._sprite.setRotation(shard.angle);
      }
    }

    for (const body of this.glassBodies) {
      const p = body.plugin;
      if (p && p.moving) {
        const nx = p.baseX + Math.sin(time * 0.001 * p.moveSpeed) * p.moveAmp;
        Phaser.Physics.Matter.Matter.Body.setPosition(body, { x: nx, y: p.baseY });
      }
      if (body._sprite) body._sprite.setPosition(body.position.x, body.position.y);
    }

    for (const b of this.barriers) {
      if (b._rotSpeed) {
        const newAngle = b._baseAngle + Math.sin(time * 0.001 * b._rotSpeed) * Math.PI * 0.5;
        Phaser.Physics.Matter.Matter.Body.setAngle(b, newAngle);
        if (b._sprite) { b._sprite.setPosition(b.position.x, b.position.y); b._sprite.setRotation(newAngle); }
      }
    }

    if (this.waveTimerActive && time - this.lastInputTime > 30000) this.onWaveFailed();
  }

  shutdown() { document.removeEventListener('visibilitychange', this._onVisChange); }
}

// Mix in collision and flow methods
Object.assign(GameScene.prototype, CollisionMixin, FlowMixin);
