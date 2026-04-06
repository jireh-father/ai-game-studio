class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.continuing = data && data.continuing;
  }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.gameOver = false;
    this.paused = false;
    this._hitStopped = false;
    this.lastInputTime = Date.now();

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x12103A, 0x12103A, 0x0A0A14, 0x0A0A14, 1);
    bg.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) {
      this.add.circle(Math.random() * w, Math.random() * h * 0.7, 0.8 + Math.random(), 0xF0F0FF, 0.2 + Math.random() * 0.4);
    }

    // Pivot
    this.pivotX = w / 2;
    this.pivotY = PIVOT_Y;
    this.add.image(this.pivotX, this.pivotY, 'pivot').setDepth(5);

    // Graphics
    this.ropeGfx = this.add.graphics().setDepth(4);
    this.trailGfx = this.add.graphics().setDepth(3);
    this.trailPositions = [];

    // Hammer state
    this.hammerAngle = 0;
    this.angularVelocity = 0;
    this.isDragging = false;
    this.hammerFrozen = false;
    this.freezeTimer = null;
    this.prevAngles = [];
    this.hammerSprite = this.add.image(this.pivotX, this.pivotY + HAMMER_ROPE_LENGTH, 'hammer').setDepth(6);
    this.hammerRadius = 36;

    // Base
    this.baseY = BASE_Y;
    this.add.image(w / 2, this.baseY + 20, 'base').setDepth(2);
    this.rubbleGfx = this.add.graphics().setDepth(2);
    if (!this.continuing) GameState.rubbleLayers = 0;
    this.drawRubble();

    // Danger overlay
    this.dangerOverlay = this.add.graphics().setDepth(25).setAlpha(0);

    // Meteors
    this.meteors = [];
    this.swingHitsThisSwing = 0;

    // Input
    this.input.on('pointerdown', (p) => this.onPointerDown(p));
    this.input.on('pointermove', (p) => this.onPointerMove(p));
    this.input.on('pointerup', () => this.onPointerUp());

    // Visibility handler
    this.visHandler = () => { if (document.hidden && !this.gameOver) this.togglePause(); };
    document.addEventListener('visibilitychange', this.visHandler);

    // Effects
    Effects.init(this);

    // Start wave
    if (this.continuing) {
      this.startWave(GameState.stage);
    } else {
      GameState.reset();
      this.startWave(1);
    }
  }

  startWave(stageNum) {
    GameState.stage = stageNum;
    const ui = this.scene.get('UIScene');
    if (ui) { ui.updateStage(); ui.updateRubble(); }
    if (stageNum > 1) Effects.stageAdvanceBanner(stageNum);

    const wave = StageManager.generateWave(stageNum);
    wave.forEach(m => {
      this.time.delayedCall(m.delay_ms, () => {
        if (this.gameOver || this.paused) return;
        this.spawnMeteor(m);
      });
    });
  }

  onPointerDown(pointer) {
    if (this.gameOver || this.paused) return;
    this.lastInputTime = Date.now();
    const dx = pointer.x - this.hammerSprite.x;
    const dy = pointer.y - this.hammerSprite.y;
    if (Math.sqrt(dx * dx + dy * dy) < 60) {
      this.isDragging = true;
      this.prevAngles = [];
      this.swingHitsThisSwing = 0;
      Effects.scalePunch(this.hammerSprite, 1.15, 80);
      if (navigator.vibrate) navigator.vibrate(12);
    }
  }

  onPointerMove(pointer) {
    if (!this.isDragging || this.gameOver || this.paused || this.hammerFrozen) return;
    this.lastInputTime = Date.now();
    const dx = pointer.x - this.pivotX;
    const dy = -(pointer.y - this.pivotY);
    let angle = Math.atan2(dx, dy);
    angle = Phaser.Math.Clamp(angle, -2.62, 2.62);
    this.prevAngles.push({ angle, time: performance.now() });
    if (this.prevAngles.length > 5) this.prevAngles.shift();
    this.hammerAngle = angle;
  }

  onPointerUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.lastInputTime = Date.now();
    if (this.hammerFrozen) return;
    const pa = this.prevAngles;
    if (pa.length >= 2) {
      const last = pa[pa.length - 1];
      const prev = pa[Math.max(0, pa.length - 3)];
      const dt = (last.time - prev.time) / 1000;
      if (dt > 0.001) {
        this.angularVelocity = Phaser.Math.Clamp((last.angle - prev.angle) / dt, -12, 12);
      }
    }
  }

  update(time, delta) {
    if (this.gameOver || this.paused || this._hitStopped) return;
    const dt = delta / 1000;

    // Inactivity death
    if (Date.now() - this.lastInputTime > INACTIVITY_TIMEOUT) {
      this.triggerDeath();
      return;
    }

    // Hammer physics
    if (!this.isDragging && !this.hammerFrozen) {
      this.hammerAngle += this.angularVelocity * dt;
      this.angularVelocity *= Math.pow(0.985, delta / 16.67);
      if (Math.abs(this.angularVelocity) < 0.01) this.angularVelocity = 0;
      this.hammerAngle = Phaser.Math.Clamp(this.hammerAngle, -2.62, 2.62);
    }

    // Hammer position
    const hx = this.pivotX + HAMMER_ROPE_LENGTH * Math.sin(this.hammerAngle);
    const hy = this.pivotY + HAMMER_ROPE_LENGTH * Math.cos(this.hammerAngle);
    this.hammerSprite.setPosition(hx, hy);
    this.hammerSprite.setRotation(this.hammerAngle);

    // Rope
    this.ropeGfx.clear();
    this.ropeGfx.lineStyle(3, 0xA89070, 1);
    this.ropeGfx.lineBetween(this.pivotX, this.pivotY, hx, hy);

    // Trail
    this.updateTrail(hx, hy);

    // Meteor update + collision
    const maxY = this.baseY - GameState.rubbleLayers * RUBBLE_LAYER_HEIGHT;
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      if (!m.active) continue;
      m.y += m.speed * dt;
      m.sprite.setPosition(m.x, m.y);
      if (m.graceTimer > 0) m.graceTimer -= delta;
      if (m.y >= maxY && m.graceTimer <= 0) { this.resolveMeteor(m, true); continue; }
      const dx = hx - m.x, dy = hy - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.hammerRadius + m.radius && Math.abs(this.angularVelocity) > 0.3) {
        this.smashMeteor(m);
      }
    }

    // Wave complete
    if (StageManager.isWaveComplete() && !StageManager.stageTransitioning) {
      this.advanceStage();
    }

    // Danger overlay
    const pct = GameState.rubbleLayers / MAX_RUBBLE_LAYERS;
    this.dangerOverlay.clear();
    if (pct > 0.5) {
      this.dangerOverlay.fillStyle(0xFF2020, 0.12 + Math.sin(time / 400) * 0.08);
      this.dangerOverlay.fillRect(0, 0, this.scale.width, this.scale.height);
    }
  }

  advanceStage() {
    StageManager.stageTransitioning = true;
    if (StageManager.isCleanSweep()) {
      const bonus = CLEAN_SWEEP_BONUS(GameState.stage);
      GameState.score += bonus;
      Effects.cleanSweepBanner();
      GameState.rubbleLayers = Math.max(0, GameState.rubbleLayers - 1);
      this.drawRubble();
      const ui = this.scene.get('UIScene');
      if (ui) { ui.updateScore(); ui.updateRubble(); }
    }
    this.time.delayedCall(1200, () => {
      if (!this.gameOver) this.startWave(GameState.stage + 1);
    });
  }

  togglePause() {
    this.paused = !this.paused;
    const ui = this.scene.get('UIScene');
    if (this.paused) {
      this.scene.pause('GameScene');
      if (ui) ui.showPause();
    } else {
      this.scene.resume('GameScene');
      if (ui) ui.hidePause();
    }
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
    if (this.freezeTimer) clearTimeout(this.freezeTimer);
    this.meteors = [];
  }
}
