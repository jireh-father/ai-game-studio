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

    // Gravity flip zones
    this.gravZones = [];
    (wave.gravZones || []).forEach(gz => this.createGravZone(gz));

    this.shards = [];
    this.activeBall = null; this.ballInFlight = false; this.ballSprite = null;
    this.waveTimeLeft = this.waveDiff.timer; this.waveTimerActive = true; this.lastTickTime = 5;
    this.isAiming = false; this.aimStartX = 0; this.aimStartY = 0; this.trajectoryDots = [];
    this.maxChainDepth = 0; this.panelsDestroyedThisWave = 0; this.panelsDestroyedThisLaunch = 0;
    this.waveStartTime = this.time.now;

    // Fusion timer
    this.fusionTimer = 0;
    this.fusionWarnings = [];

    // Ball personality - idle hop
    this._ballIdleTime = 0;
    this._ballIdleTween = null;

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

    const color = p.type === 'armored' ? CFG.COLOR.ARMORED : p.type === 'reinforced' ? CFG.COLOR.REINFORCED : CFG.COLOR.GLASS;
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

    sprite._highlight = hi;
    sprite._body = body;
    body._sprite = sprite;
    body._hp = p.hp;
    body._type = p.type;
    body._w = w;
    body._h = h;
    body._fused = !!p.fused;
    body._fusionShardBonus = p.fused ? CFG.FUSION_SHARD_BONUS : 0;

    // Fused panel glow
    if (p.fused) {
      const glow = this.add.rectangle(p.x, p.y, w + 6, h + 6, CFG.FUSION_GLOW_COLOR, 0.25).setDepth(19);
      this.tweens.add({ targets: glow, alpha: 0.1, duration: 800, yoyo: true, repeat: -1 });
      sprite._fusionGlow = glow;
      body._sprite._fusionGlow = glow;
    }

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

  createGravZone(gz) {
    const y = gz.y;
    const strip = this.add.rectangle(CFG.WIDTH / 2, y, CFG.WIDTH, CFG.GRAV_ZONE_HEIGHT, CFG.GRAV_ZONE_COLOR, CFG.GRAV_ZONE_ALPHA).setDepth(10);
    // Animated chevrons
    const chevrons = [];
    for (let cx = 30; cx < CFG.WIDTH; cx += 60) {
      const ch = this.add.text(cx, y, '\u25B2', {
        fontSize: '10px', color: '#9B59B6',
      }).setOrigin(0.5).setDepth(11).setAlpha(0.5);
      this.tweens.add({
        targets: ch, y: y - 8, alpha: 0.1, duration: 600,
        repeat: -1, ease: 'Sine.InOut',
        onRepeat: () => { ch.y = y + 4; ch.alpha = 0.5; }
      });
      chevrons.push(ch);
    }
    this.gravZones.push({ y, h: CFG.GRAV_ZONE_HEIGHT, strip, chevrons });
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
    // Cancel idle hop on interaction
    if (this._ballIdleTween) { this._ballIdleTween.stop(); this._ballIdleTween = null; }
    this._ballIdleTime = 0;
    // Create preview ball for drag personality
    if (!this.ballSprite) {
      const lx = CFG.WIDTH / 2, ly = CFG.LAUNCH_ZONE_TOP - 20;
      this.ballSprite = this.add.circle(lx, ly, CFG.BALL_RADIUS, CFG.COLOR.BALL, 0.7).setDepth(30);
      this.ballSprite._isPreview = true;
    }
  }

  onPointerMove(pointer) {
    if (!this.isAiming) return;
    this.drawTrajectory(pointer);
    this.lastInputTime = this.time.now;
    // Ball personality: squash/stretch during drag
    if (this.ballSprite && !this.ballInFlight) {
      const dx = pointer.x - this.aimStartX, dy = pointer.y - this.aimStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = Math.min(dist / 200, 1);
      this.ballSprite.setScale(Phaser.Math.Linear(1.0, 0.8, ratio), Phaser.Math.Linear(1.0, 1.2, ratio));
    }
  }

  onPointerUp(pointer) {
    if (!this.isAiming) return;
    this.isAiming = false;
    this.clearTrajectory();
    const dx = pointer.x - this.aimStartX;
    const dy = pointer.y - this.aimStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Remove preview ball
    if (this.ballSprite && this.ballSprite._isPreview) { this.ballSprite.destroy(); this.ballSprite = null; }
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
    this.panelsDestroyedThisLaunch = 0;

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
      if (body._sprite) {
        body._sprite.setPosition(body.position.x, body.position.y);
        if (body._sprite._fusionGlow) body._sprite._fusionGlow.setPosition(body.position.x, body.position.y);
      }
    }

    for (const b of this.barriers) {
      if (b._rotSpeed) {
        const newAngle = b._baseAngle + Math.sin(time * 0.001 * b._rotSpeed) * Math.PI * 0.5;
        Phaser.Physics.Matter.Matter.Body.setAngle(b, newAngle);
        if (b._sprite) { b._sprite.setPosition(b.position.x, b.position.y); b._sprite.setRotation(newAngle); }
      }
    }

    // Fusion timer
    if (this.waveTimerActive && this.glassBodies.length >= 2) {
      this.fusionTimer += delta;
      const timeToFusion = CFG.FUSION_INTERVAL - this.fusionTimer;
      if (timeToFusion <= CFG.FUSION_WARN_TIME && timeToFusion > 0) this.showFusionWarnings();
      if (this.fusionTimer >= CFG.FUSION_INTERVAL) {
        this.fusionTimer = 0;
        this.performFusion();
        this.clearFusionWarnings();
      }
    }

    // Gravity flip zones - check ball and shards
    if (this.gravZones.length > 0) {
      this.checkGravZones(this.activeBall, delta);
      for (const shard of this.shards) this.checkGravZones(shard, delta);
    }

    // Ball idle hop
    if (!this.ballInFlight && !this.isAiming && this.waveTimerActive) {
      this._ballIdleTime += delta;
      if (this._ballIdleTime >= CFG.BALL_IDLE_TIMEOUT && !this._ballIdleTween) {
        this._ballIdleTween = this.tweens.add({
          targets: this.ballIndicators[0] ? {} : {},
          duration: 1, // dummy, we use the ball indicators' y for visual
        });
        // Hop the ball indicators
        const bi = this.ballIndicators;
        if (bi.length > 0) {
          const target = bi[Math.max(0, window.GameState.ballsLeft - 1)];
          if (target) {
            this._ballIdleTween = this.tweens.add({
              targets: target, y: target.y + CFG.BALL_IDLE_HOP,
              duration: CFG.BALL_IDLE_HOP_DUR, ease: 'Sine.InOut',
              yoyo: true, repeat: -1,
            });
          }
        }
      }
    }

    if (this.waveTimerActive && time - this.lastInputTime > 30000) this.onWaveFailed();
  }

  checkGravZones(body, delta) {
    if (!body || !body.position) return;
    const Body = Phaser.Physics.Matter.Matter.Body;
    const by = body.position.y;
    for (const gz of this.gravZones) {
      const zTop = gz.y - gz.h / 2;
      const zBot = gz.y + gz.h / 2;
      if (!body._flippedZones) body._flippedZones = new Set();
      const zKey = gz.y;
      if (by >= zTop && by <= zBot) {
        if (!body._flippedZones.has(zKey)) {
          body._flippedZones.add(zKey);
          const vel = body.velocity;
          Body.setVelocity(body, { x: vel.x, y: vel.y * CFG.GRAV_ZONE_DAMPING });
          playGravFlip();
          this.fx.gravSparks(body.position.x, gz.y);
        }
      } else {
        body._flippedZones.delete(zKey);
      }
    }
  }

  showFusionWarnings() {
    if (this.fusionWarnings.length > 0) return;
    const pairs = this.findFusionPairs();
    for (const [a, b] of pairs) {
      const ring1 = this.add.circle(a.position.x, a.position.y, 30, 0, 0).setStrokeStyle(2, CFG.FUSION_WARN_COLOR).setDepth(25);
      const ring2 = this.add.circle(b.position.x, b.position.y, 30, 0, 0).setStrokeStyle(2, CFG.FUSION_WARN_COLOR).setDepth(25);
      this.tweens.add({ targets: [ring1, ring2], scaleX: 1.3, scaleY: 1.3, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
      this.fusionWarnings.push(ring1, ring2);
    }
  }

  clearFusionWarnings() {
    this.fusionWarnings.forEach(w => { if (w.active) w.destroy(); });
    this.fusionWarnings = [];
  }

  findFusionPairs() {
    const pairs = [];
    const used = new Set();
    for (let i = 0; i < this.glassBodies.length; i++) {
      if (used.has(i)) continue;
      for (let j = i + 1; j < this.glassBodies.length; j++) {
        if (used.has(j)) continue;
        const a = this.glassBodies[i], b = this.glassBodies[j];
        const dx = a.position.x - b.position.x, dy = a.position.y - b.position.y;
        if (Math.sqrt(dx * dx + dy * dy) <= CFG.FUSION_PROXIMITY) {
          pairs.push([a, b]);
          used.add(i); used.add(j);
          break;
        }
      }
    }
    return pairs;
  }

  performFusion() {
    const pairs = this.findFusionPairs();
    for (const [a, b] of pairs) {
      // Determine fused type
      const typeRank = { normal: 1, reinforced: 2, armored: 3 };
      const sum = (typeRank[a._type] || 1) + (typeRank[b._type] || 1);
      let newType, newHp;
      if (sum >= 4) { newType = 'armored'; newHp = 3; }
      else if (sum >= 3) { newType = 'armored'; newHp = 3; }
      else { newType = 'reinforced'; newHp = 2; }

      const mx = (a.position.x + b.position.x) / 2;
      const my = (a.position.y + b.position.y) / 2;
      const baseW = newType === 'armored' ? 48 : 44;
      const baseH = newType === 'armored' ? 38 : 34;
      const w = Math.round(baseW * CFG.FUSION_SIZE_MULT);
      const h = Math.round(baseH * CFG.FUSION_SIZE_MULT);

      // Remove both originals
      this.removeGlassPanel(a);
      this.removeGlassPanel(b);

      // Create fused panel
      this.createGlassPanel({ x: mx, y: my, type: newType, hp: newHp, w, h, fused: true });

      // Effects
      this.fx.fusionEffect(mx, my, a.position ? a.position : {x: mx-20, y: my}, b.position ? b.position : {x: mx+20, y: my});
      playFusion();
    }
  }

  removeGlassPanel(body) {
    const idx = this.glassBodies.indexOf(body);
    if (idx === -1) return;
    this.glassBodies.splice(idx, 1);
    const sprite = body._sprite;
    if (sprite) {
      if (sprite._highlight) sprite._highlight.destroy();
      if (sprite._rivets) sprite._rivets.destroy();
      if (sprite._crack) sprite._crack.destroy();
      if (sprite._fusionGlow) sprite._fusionGlow.destroy();
      sprite.destroy();
      const si = this.glassSprites.indexOf(sprite);
      if (si !== -1) this.glassSprites.splice(si, 1);
    }
    this.time.delayedCall(0, () => this.matter.world.remove(body));
  }

  shutdown() { document.removeEventListener('visibilitychange', this._onVisChange); }
}

// Mix in collision and flow methods
Object.assign(GameScene.prototype, CollisionMixin, FlowMixin);
