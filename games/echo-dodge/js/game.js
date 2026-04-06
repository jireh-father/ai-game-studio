// Echo Dodge - Core Gameplay Scene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.initEffects();
    this.ensureAudio();
    const w = this.cameras.main.width, h = this.cameras.main.height;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.clearDeathEffects();

    // State
    this.isDead = false;
    this.paused = false;
    this.stageTransitioning = false;
    this.pointerDown = false;
    this.activePointerId = null;
    this.lastSegmentTime = 0;
    this.lastTargetUpdate = 0;
    this.ghostTargetX = w / 2;
    this.ghostTargetY = h / 2;
    this.lastInputTime = Date.now();
    this.lastMoveAngle = 0;
    this.nearMissChecked = new Set();
    this.stageTimer = 0;
    this.surviveAccum = 0;
    this.score = window.GameState.score;
    this.stage = window.GameState.stage;

    // Grid
    const gfx = this.add.graphics();
    gfx.lineStyle(1, COLORS.grid, 0.3);
    for (let x = 0; x < w; x += 40) gfx.lineBetween(x, 0, x, h);
    for (let y = 0; y < h; y += 40) gfx.lineBetween(0, y, w, y);

    // Trail pool
    this.trailPool = [];
    for (let i = 0; i < TRAIL.POOL_SIZE; i++) {
      this.trailPool.push(this.add.image(0, 0, 'trail').setVisible(false).setActive(false));
    }
    this.activeTrail = [];

    // Player
    this.player = this.add.image(w / 2, h / 2, 'player').setDepth(10);
    this.startPlayerGlow();
    this.enemies = [];

    // HUD
    this.createHUD();
    this.loadStage(this.stage);

    // Input
    this.input.on('pointerdown', (p) => {
      if (this.isDead || this.paused) return;
      this.ensureAudio();
      this.pointerDown = true;
      this.activePointerId = p.id;
      this.lastInputTime = Date.now();
      this.playerScalePunch();
    });
    this.input.on('pointermove', (p) => {
      if (this.isDead || this.paused || !this.pointerDown || p.id !== this.activePointerId) return;
      this.player.x = Phaser.Math.Clamp(p.x, 16, w - 16);
      this.player.y = Phaser.Math.Clamp(p.y, 16, h - 16);
      this.lastInputTime = Date.now();
    });
    this.input.on('pointerup', (p) => {
      if (p.id === this.activePointerId) { this.pointerDown = false; this.activePointerId = null; }
    });

    this.visHandler = () => { if (document.hidden && !this.isDead && !this.paused) this.togglePause(); };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  createHUD() {
    const w = this.cameras.main.width;
    this.add.rectangle(w / 2, 24, w, 48, 0x0A0A20, 0.8).setDepth(50);
    this.stageText = this.add.text(12, 14, `Stage ${this.stage}`, {
      fontSize: '15px', fill: COLORS.hud, fontStyle: 'bold' }).setDepth(51);
    this.scoreText = this.add.text(w / 2, 14, this.score.toLocaleString(), {
      fontSize: '17px', fill: COLORS.playerHex, fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(51);
    this.timerText = this.add.text(w - 12, 14, '', {
      fontSize: '15px', fill: COLORS.hud }).setOrigin(1, 0).setDepth(51);
    this.streakText = this.add.text(w / 2, 44, '', {
      fontSize: '18px', fill: COLORS.accent, fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(51).setVisible(false);
    const pb = this.add.text(w - 40, 14, '||', {
      fontSize: '18px', fill: '#888899', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(52).setInteractive({ useHandCursor: true });
    pb.on('pointerdown', () => { if (!this.isDead) this.togglePause(); });
  }

  loadStage(stageNum) {
    const params = getDifficultyParams(stageNum);
    this.stageParams = params;
    this.stageTimer = params.stageDuration;
    this.stageTransitioning = false;
    this.enemies.forEach(e => e.destroy());
    this.enemies = [];
    const w = this.cameras.main.width, h = this.cameras.main.height;
    const positions = getEnemySpawnPositions(params.enemyCount, w, h, this.player.x, this.player.y);
    positions.forEach((pos, i) => {
      const isPulse = params.isPulseEnabled && i === params.enemyCount - 1;
      const e = this.add.image(pos.x, pos.y, isPulse ? 'enemyPulse' : 'enemy').setDepth(8);
      e.speed = params.enemySpeed; e.isPulse = isPulse; e.vx = 0; e.vy = 0;
      if (isPulse) { e.pulseTimer = 0; e.pulsePaused = false; }
      this.enemies.push(e);
    });
    this.playEnemySpawn();
    this.updateHUD();
    if (params.isRest) this.cameras.main.flash(300, 0, 80, 0);
  }

  updateHUD() {
    if (this.stageText) this.stageText.setText(`Stage ${this.stage}`);
    if (this.scoreText) this.scoreText.setText(this.score.toLocaleString());
    if (this.timerText) {
      const t = Math.max(0, Math.ceil(this.stageTimer));
      this.timerText.setText(`${t}s`);
      this.timerText.setFill(t <= 3 ? COLORS.accent : COLORS.hud);
    }
  }

  addScore(pts) {
    this.score += pts;
    window.GameState.score = this.score;
    this.updateHUD();
    this.scoreHudPunch();
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) { this.scene.pause(); this.scene.launch('PauseScene'); }
    else { this.scene.resume(); }
  }

  update(time, delta) {
    if (this.isDead || this.paused) return;
    const dt = delta / 1000;
    const w = this.cameras.main.width, h = this.cameras.main.height;

    // Inactivity death
    if (Date.now() - this.lastInputTime > INACTIVITY_DEATH_MS) { this.triggerDeath(); return; }

    // Place trail
    if (this.pointerDown && time - this.lastSegmentTime > TRAIL.SEGMENT_INTERVAL_MS) {
      const last = this.activeTrail[this.activeTrail.length - 1];
      const dx = last ? this.player.x - last.x : TRAIL.MIN_MOVE_DIST + 1;
      const dy = last ? this.player.y - last.y : 0;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > TRAIL.MIN_MOVE_DIST) {
        const seg = this.trailPool.find(s => !s.active);
        if (seg) {
          seg.setPosition(this.player.x, this.player.y).setVisible(true).setActive(true).setAlpha(1).clearTint();
          seg.birthTime = time;
          seg.setScale(1.4);
          this.tweens.add({ targets: seg, scaleX: 1, scaleY: 1, duration: 80 });
          this.activeTrail.push(seg);
          this.lastMoveAngle = Math.atan2(dy, dx);
          this.spawnDriftParticle(this.player.x, this.player.y, this.lastMoveAngle);
          this.playTrailTick();
          this.lastSegmentTime = time;
        }
      }
    }

    // Age trail + collision
    const lifetime = this.stageParams.trailLifetime;
    const nmPx = this.stageParams.nearMissPx;
    for (let i = this.activeTrail.length - 1; i >= 0; i--) {
      const s = this.activeTrail[i];
      const age = time - s.birthTime;
      if (age > lifetime) {
        s.setVisible(false).setActive(false);
        this.activeTrail.splice(i, 1);
        this.nearMissChecked.delete(s);
      } else {
        s.setAlpha(1 - age / lifetime);
        if (age > 200) {
          const pd = Math.sqrt((this.player.x - s.x) ** 2 + (this.player.y - s.y) ** 2);
          if (pd < TRAIL.COLLISION_RADIUS) { this.triggerDeath(); return; }
          if (pd < nmPx && !this.nearMissChecked.has(s)) {
            this.nearMissChecked.add(s);
            this.triggerNearMiss(s.x, s.y);
          }
        }
      }
    }

    // Enemy AI (in effects mixin)
    if (time - this.lastTargetUpdate > ENEMY.TARGET_UPDATE_MS) {
      this.ghostTargetX = this.player.x;
      this.ghostTargetY = this.player.y;
      this.lastTargetUpdate = time;
    }
    if (this.updateEnemies(dt, w, h)) { this.triggerDeath(); return; }

    // Survival scoring
    this.surviveAccum += delta;
    if (this.surviveAccum >= 1000) { this.surviveAccum -= 1000; this.addScore(SCORE.SURVIVE_PER_SEC); }

    // Stage timer
    this.stageTimer -= dt;
    this.updateHUD();
    if (this.stageTimer <= 0 && !this.stageTransitioning) this.advanceStage();

    this.updateParticles(delta);
  }

  advanceStage() {
    this.stageTransitioning = true;
    this.stage++;
    window.GameState.stage = this.stage;
    this.addScore(SCORE.STAGE_CLEAR_MULT * (this.stage - 1));
    this.spawnFloatingText(this.cameras.main.width / 2, this.cameras.main.height / 2, `STAGE ${this.stage}!`);
    this.stageClearEffect();
    this.time.delayedCall(500, () => { if (!this.isDead) this.loadStage(this.stage); });
  }

  triggerDeath() {
    if (this.isDead) return;
    this.isDead = true;
    this.triggerDeathEffects();
    let isHighScore = false;
    if (this.score > window.GameState.highScore) {
      window.GameState.highScore = this.score;
      localStorage.setItem('echo-dodge_high_score', this.score);
      isHighScore = true;
    }
    this.time.delayedCall(600, () => {
      this.scene.launch('GameOverScene', { score: this.score, stage: this.stage, isHighScore });
    });
  }

  shutdown() {
    this.shutdownEffects();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}

Object.assign(GameScene.prototype, GameEffects);
