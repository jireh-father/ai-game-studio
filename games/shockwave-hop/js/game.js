// Shockwave Hop - Core Game Scene

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.score = (data && data.score) || 0;
    this.currentStage = (data && data.continueFrom) || 1;
    this.lives = data && data.continueFrom ? 1 : GAME.lives;
    this.combo = 0;
    this.isJumping = false;
    this.jumpCooldownActive = false;
    this.isInvincible = false;
    this.isDead = false;
    this.rings = [];
    this.hazardOrbs = [];
    this.spikes = [];
    this.counterWaves = [];
    this.ringsCleared = 0;
    this.orbsDestroyed = 0;
    this.lastTapTime = 0;
    this.stageData = null;
    this.ringSpawnTimer = null;
    this.ringsSpawned = 0;
    this.playerGroundY = 0;
    this.bufferedTap = false;
  }

  create() {
    Effects.init(this);
    this.add.rectangle(GAME.width / 2, GAME.height / 2, GAME.width, GAME.height, COLORS.bg);
    // Platform
    this.platform = this.add.rectangle(GAME.width / 2, GAME.platformY,
      GAME.width - 20, GAME.platformHeight, COLORS.platform).setDepth(2);
    this.add.rectangle(GAME.width / 2, GAME.platformY - 3,
      GAME.width - 20, 2, COLORS.platformHighlight, 0.6).setDepth(2);
    // Player
    this.playerGroundY = GAME.platformY - 28;
    this.player = this.add.image(GAME.playerStartX, this.playerGroundY, 'player').setDepth(10);
    // Graphics for rings
    this.ringGraphics = this.add.graphics().setDepth(5);
    // HUD
    this.scoreTxt = this.add.text(15, 15, `Score: ${this.score}`, {
      fontSize: '16px', fontFamily: 'Arial Black, sans-serif',
      color: COLORS_HEX.uiText, stroke: '#000', strokeThickness: 2
    }).setDepth(60);
    this.stageTxt = this.add.text(GAME.width / 2, 15, `Stage ${this.currentStage}`, {
      fontSize: '16px', fontFamily: 'Arial Black, sans-serif',
      color: COLORS_HEX.primary, stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5, 0).setDepth(60);
    this.livesGroup = [];
    this.updateLivesDisplay();
    // Pause button
    const pb = this.add.circle(GAME.width - 30, 30, 18, COLORS.primary, 0.3)
      .setDepth(60).setInteractive({ useHandCursor: true });
    this.add.text(GAME.width - 30, 30, '||', {
      fontSize: '14px', fontFamily: 'Arial Black', color: COLORS_HEX.primary
    }).setOrigin(0.5).setDepth(60).disableInteractive();
    pb.on('pointerdown', (p) => { p.event.stopPropagation(); this.showPause(); });
    // Input
    this.input.on('pointerdown', (p) => this.handleTap(p));
    this.lastTapTime = Date.now();
    this.inactivityWarned = false;
    this.startStage(this.currentStage);
  }

  updateLivesDisplay() {
    this.livesGroup.forEach(h => h.destroy());
    this.livesGroup = [];
    for (let i = 0; i < GAME.lives; i++) {
      const k = i < this.lives ? 'heart' : 'heartEmpty';
      this.livesGroup.push(this.add.image(GAME.width - 65 + i * 22, 25, k).setDepth(60));
    }
  }

  startStage(num) {
    this.currentStage = num;
    this.stageData = generateStage(num);
    this.ringsCleared = 0;
    this.ringsSpawned = 0;
    this.orbsDestroyed = 0;
    this.stageTxt.setText(`Stage ${num}`);
    this.hazardOrbs.forEach(o => o.sprite && o.sprite.destroy());
    this.hazardOrbs = [];
    this.spikes.forEach(s => s.destroy());
    this.spikes = [];
    this.stageData.orbPositions.forEach(pos => {
      const orb = this.add.image(pos.x, pos.y, 'hazardOrb').setDepth(8);
      this.hazardOrbs.push({ sprite: orb, x: pos.x, y: pos.y, alive: true });
    });
    this.stageData.spikePositions.forEach(sx => {
      this.spikes.push(this.add.image(sx, GAME.platformY - 10, 'spike').setDepth(3));
    });
    this.scheduleNextRing();
  }

  scheduleNextRing() {
    if (this.isDead || this.ringsSpawned >= this.stageData.ringsToCreate) return;
    this.ringSpawnTimer = this.time.delayedCall(this.stageData.spawnDelay, () => {
      if (this.isDead) return;
      const pt = generateRingSpawnPoint(this.stageData);
      const isMega = this.stageData.hasMegaRing && this.ringsSpawned === 0;
      this.rings.push({ x: pt.x, y: pt.y, radius: 0, speed: this.stageData.ringSpeed,
        isMega, cleared: false, alpha: 1 });
      this.ringsSpawned++;
      this.scheduleNextRing();
    });
  }

  handleTap(pointer) {
    if (this.isDead) return;
    if (pointer.x > GAME.width - 55 && pointer.y < 55) return;
    this.lastTapTime = Date.now();
    this.inactivityWarned = false;
    if (this.jumpCooldownActive) { this.bufferedTap = true; return; }
    this.doJump();
  }

  doJump() {
    if (this.isJumping || this.isDead) return;
    this.isJumping = true;
    this.jumpCooldownActive = true;
    this.bufferedTap = false;
    Effects.jumpStretch(this.player);
    Effects.jumpParticles(this.player.x, this.playerGroundY);
    Effects.platformRipple(this.player.x, GAME.platformY);
    this.tweens.add({
      targets: this.player, y: this.playerGroundY - GAME.jumpHeight,
      duration: GAME.jumpDuration / 2, ease: 'Sine.easeOut', yoyo: true,
      onYoyo: () => this.checkRingClears(),
      onComplete: () => {
        this.isJumping = false;
        this.player.y = this.playerGroundY;
        Effects.landingSquash(this.player);
        this.checkSpikeCollision();
        if (this.bufferedTap) { this.bufferedTap = false; this.doJump(); }
      }
    });
    this.time.delayedCall(GAME.jumpCooldown, () => { this.jumpCooldownActive = false; });
  }

  checkRingClears() {
    const px = this.player.x, py = this.player.y;
    this.rings.forEach(r => {
      if (r.cleared) return;
      const d = Math.hypot(px - r.x, py - r.y);
      if (Math.abs(d - r.radius) < RING.hitRadius * 3 && this.isJumping) {
        r.cleared = true;
        this.onRingCleared(r);
      }
    });
  }

  onRingCleared(ring) {
    this.combo++;
    this.ringsCleared++;
    const pts = SCORING.ringClear + (this.combo - 1) * SCORING.comboBonus + (ring.isMega ? SCORING.megaRing : 0);
    this.addScore(pts);
    Effects.counterShockwaveBurst(this.player.x, this.player.y, this.combo);
    Effects.cameraZoom(1.03, 200);
    Effects.screenFlash(COLORS.primary, 60);
    if (this.combo >= 2) Effects.comboText(this.combo);
    const cb = Math.min(this.combo, 5) * 0.1;
    this.counterWaves.push({ x: this.player.x, y: this.player.y, radius: 0,
      maxRadius: GAME.counterShockwaveMaxRadius * (1 + cb),
      speed: GAME.counterShockwaveSpeed, alpha: 0.8 });
    if (this.ringsCleared >= this.stageData.ringsToCreate) this.onStageComplete();
  }

  onStageComplete() {
    let bonus = SCORING.stageClear + (this.currentStage > 5 ? SCORING.stageBonusAfter5 : 0);
    const alive = this.hazardOrbs.filter(o => o.alive).length;
    if (this.stageData.orbCount > 0 && alive === 0) { bonus += SCORING.perfectClear; Effects.perfectClear(); }
    this.addScore(bonus);
    Effects.stageClearText(this.currentStage);
    Effects.platformPulse(this.platform);
    this.time.delayedCall(800, () => { if (!this.isDead) this.startStage(this.currentStage + 1); });
  }

  addScore(pts) {
    this.score += pts;
    this.scoreTxt.setText(`Score: ${this.score}`);
    this.tweens.add({ targets: this.scoreTxt, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });
    Effects.floatingScore(this.player.x, this.player.y - 30, `+${pts}`);
  }

  checkSpikeCollision() {
    if (this.isInvincible || this.isDead) return;
    for (const s of this.spikes) {
      if (Math.abs(this.player.x - s.x) < 22) { this.playerHit(); return; }
    }
  }

  playerHit() {
    if (this.isInvincible || this.isDead) return;
    this.lives--;
    this.combo = 0;
    this.updateLivesDisplay();
    Effects.deathEffect(this.player.x, this.player.y);
    if (this.lives <= 0) { this.gameOver(); return; }
    this.isInvincible = true;
    this.tweens.add({ targets: this.player, alpha: 0.3, duration: 100, yoyo: true, repeat: 4,
      onComplete: () => { this.player.alpha = 1; this.isInvincible = false; } });
  }

  gameOver() {
    this.isDead = true;
    if (this.ringSpawnTimer) this.ringSpawnTimer.remove();
    const hs = StorageUtil.get(STORAGE_KEYS.highScore, 0);
    const isNew = this.score > hs;
    if (isNew) StorageUtil.set(STORAGE_KEYS.highScore, this.score);
    StorageUtil.set(STORAGE_KEYS.gamesPlayed, StorageUtil.get(STORAGE_KEYS.gamesPlayed, 0) + 1);
    const hStage = StorageUtil.get(STORAGE_KEYS.highestStage, 0);
    if (this.currentStage > hStage) StorageUtil.set(STORAGE_KEYS.highestStage, this.currentStage);
    this.time.delayedCall(GAME.deathAnimDelay, () => {
      this.scene.start('GameOverScene', { score: this.score, stage: this.currentStage, isNewHigh: isNew });
    });
  }

  showPause() { this.scene.pause(); this.scene.launch('PauseScene', { returnTo: 'GameScene' }); }

  update(time, delta) {
    if (this.isDead) return;
    const dt = delta / 1000;
    this.ringGraphics.clear();
    // Rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.radius += r.speed * dt;
      r.alpha = Math.max(0.3, 1 - r.radius / 300);
      const lw = Math.max(RING.minLineWidth, RING.lineWidth * (1 - r.radius / 300));
      this.ringGraphics.lineStyle(lw, r.isMega ? COLORS.reward : COLORS.secondary, r.alpha);
      this.ringGraphics.strokeCircle(r.x, r.y, r.radius);
      if (!r.cleared && !this.isJumping && !this.isInvincible) {
        const d = Math.hypot(this.player.x - r.x, this.playerGroundY - r.y);
        if (Math.abs(d - r.radius) < RING.hitRadius) { r.cleared = true; this.playerHit(); }
      }
      if (r.radius > 500) this.rings.splice(i, 1);
    }
    // Counter-shockwaves
    for (let i = this.counterWaves.length - 1; i >= 0; i--) {
      const cw = this.counterWaves[i];
      cw.radius += cw.speed * dt;
      cw.alpha = Math.max(0, 0.8 * (1 - cw.radius / cw.maxRadius));
      const lw = Math.max(1, 4 * (1 - cw.radius / cw.maxRadius));
      this.ringGraphics.lineStyle(lw, COLORS.primary, cw.alpha);
      this.ringGraphics.strokeCircle(cw.x, cw.y, cw.radius);
      this.hazardOrbs.forEach(orb => {
        if (!orb.alive) return;
        const d = Math.hypot(orb.x - cw.x, orb.y - cw.y);
        if (d < cw.radius + 10 && d > cw.radius - 15) {
          orb.alive = false; orb.sprite.destroy(); this.orbsDestroyed++;
          Effects.hazardDestroyEffect(orb.x, orb.y);
          Effects.floatingScore(orb.x, orb.y, '+50', COLORS_HEX.dangerLight);
          this.addScore(SCORING.orbDestroy);
        }
      });
      if (cw.radius >= cw.maxRadius) this.counterWaves.splice(i, 1);
    }
    // Inactivity
    if (Date.now() - this.lastTapTime >= GAME.inactivityTimeout && !this.inactivityWarned) {
      this.inactivityWarned = true;
      this.rings.push({ x: this.player.x, y: this.playerGroundY, radius: 0,
        speed: 300, isMega: false, cleared: false, alpha: 1 });
    }
  }
}
