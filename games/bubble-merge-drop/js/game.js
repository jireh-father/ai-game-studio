// game.js — Core GameScene: physics, drop, merge, floor rise
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.score = 0; this.level = 1; this.elapsedTime = 0;
    this.gameOver = false; this.paused = false; this.stageTransitioning = false;
    this.chainCount = 0; this.chainTimer = null; this.lastInputTime = Date.now();
    this.bombCooldown = 0; this.lastWasBomb = false;
    this.graceActive = false; this.graceTimer = null;
    this.overflowWarningLoop = null; this.floorRisePx = 0;
    this.droppingBubble = false; this.merging = new Set();
    this.bubbleSprites = new Map();
    Ads.resetPerGame();
    const C = CONFIG.CONTAINER;
    this.add.rectangle(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT, 0x1A1A2E);
    const wallOpts = { isStatic: true, friction: 0.2, restitution: 0.2, label: 'wall' };
    this.matter.add.rectangle(C.x - 2, C.y + C.height / 2, 6, C.height, wallOpts);
    this.matter.add.rectangle(C.x + C.width + 2, C.y + C.height / 2, 6, C.height, wallOpts);
    this.floorBody = this.matter.add.rectangle(C.x + C.width / 2, C.y + C.height, C.width + 10, 14, { isStatic: true, label: 'floor', friction: 0.5 });
    this.containerGfx = this.add.graphics().setDepth(2);
    this.drawContainer();
    this.floorLine = this.add.graphics().setDepth(3);
    this.dangerLine = this.add.graphics().setDepth(3);
    this.dangerLine.lineStyle(1, 0xFF4757, 0.5);
    for (let x = C.x; x < C.x + C.width; x += 12) this.dangerLine.lineBetween(x, CONFIG.DANGER_Y, x + 6, CONFIG.DANGER_Y);
    this.createHUD();
    this.dropRailY = 70;
    this.pendingX = CONFIG.GAME_WIDTH / 2;
    this.levelConfig = Stages.getLevelConfig(0);
    this.nextBubbleData = Stages.generateNextBubble(this.levelConfig, false, 0);
    this.spawnPendingBubble();
    this.forcedDropTime = this.levelConfig.forcedDropTimer;
    this.dropCountdown = this.forcedDropTime;
    this.timerArc = this.add.graphics().setDepth(10);
    this.input.on('pointermove', (p) => {
      if (this.gameOver || this.paused) return;
      this.lastInputTime = Date.now();
      this.pendingX = Phaser.Math.Clamp(p.x, C.x + 20, C.x + C.width - 20);
      if (this.pendingSprite) this.pendingSprite.x = this.pendingX;
    });
    this.input.on('pointerup', (p) => {
      if (this.gameOver || this.paused || this.droppingBubble) return;
      if (p.y < CONFIG.DANGER_Y + 40) { this.lastInputTime = Date.now(); this.dropBubble(); }
    });
    this.input.on('pointerdown', (p) => {
      if (this.gameOver || this.paused) return;
      this.lastInputTime = Date.now();
      if (p.y > CONFIG.DANGER_Y + 40) this.dropBubble();
    });
    this.elapsedTimer = this.time.addEvent({ delay: 1000, callback: () => {
      if (!this.gameOver && !this.paused) { this.elapsedTime++; this.updateLevel(); }
    }, loop: true });
    this.survivalTimer = this.time.addEvent({ delay: CONFIG.SURVIVAL_INTERVAL, callback: () => {
      if (!this.gameOver) this.addScore(CONFIG.SCORE_VALUES.SURVIVAL);
    }, loop: true });
    this.floorTimer = this.time.addEvent({ delay: this.levelConfig.floorRiseInterval * 1000, callback: () => this.riseFloor(), loop: true });
    this.matter.world.on('collisionstart', (event) => this.onCollision(event));
    this.visHandler = () => { if (document.hidden && !this.gameOver) this.togglePause(); };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  drawContainer() {
    const C = CONFIG.CONTAINER; this.containerGfx.clear();
    this.containerGfx.lineStyle(2, 0xAAAAFF, 0.3);
    this.containerGfx.strokeRect(C.x - 3, C.y, C.width + 6, C.height + 10);
  }

  spawnPendingBubble() {
    if (this.pendingSprite) this.pendingSprite.destroy();
    const data = this.nextBubbleData;
    const texKey = data.type === 'bomb' ? 'bomb' : data.type === 'rainbow' ? 'rainbow' : 'bubble';
    this.pendingSprite = this.add.image(this.pendingX, this.dropRailY, texKey).setDepth(15);
    this.pendingSprite.setScale(data.radius / 30);
    if (data.type === 'plain') this.pendingSprite.setTint(CONFIG.COLOR_TINTS[data.color]);
    if (data.type === 'rainbow') this.startRainbowTween(this.pendingSprite);
    if (this.driftIndicator) { this.driftIndicator.destroy(); this.driftIndicator = null; }
    if (data.drift !== 0) {
      const arrow = data.drift > 0 ? '>' : '<';
      this.driftIndicator = this.add.text(this.pendingX + (data.drift > 0 ? 20 : -20), this.dropRailY - 12, arrow, {
        fontSize: '12px', fill: '#FFD700', fontFamily: 'Arial'
      }).setOrigin(0.5).setDepth(16);
    }
    this.pendingData = data;
    this.dropCountdown = this.forcedDropTime;
    this.droppingBubble = false;
    this.levelConfig = Stages.getLevelConfig(this.elapsedTime);
    if (data.type === 'bomb') { this.lastWasBomb = true; this.bombCooldown = 3; }
    else { this.lastWasBomb = false; if (this.bombCooldown > 0) this.bombCooldown--; }
    this.nextBubbleData = Stages.generateNextBubble(this.levelConfig, this.lastWasBomb, this.bombCooldown);
  }

  startRainbowTween(sprite) {
    const colors = [0xFF4757, 0x1E90FF, 0x2ED573, 0xFFA502, 0xA855F7];
    let idx = 0;
    sprite.rainbowTimer = this.time.addEvent({ delay: 300, callback: () => {
      idx = (idx + 1) % colors.length; sprite.setTint(colors[idx]);
    }, loop: true });
  }

  dropBubble() {
    if (this.droppingBubble || this.gameOver || !this.pendingData) return;
    this.droppingBubble = true;
    Effects.playDrop();
    Effects.scalePunch(this, this.pendingSprite, 1.2, 100);
    if (this.driftIndicator) { this.driftIndicator.destroy(); this.driftIndicator = null; }
    const data = this.pendingData;
    const dropX = Phaser.Math.Clamp(this.pendingX + data.drift, CONFIG.CONTAINER.x + data.radius, CONFIG.CONTAINER.x + CONFIG.CONTAINER.width - data.radius);
    if (this.pendingSprite.rainbowTimer) this.pendingSprite.rainbowTimer.destroy();
    this.pendingSprite.destroy(); this.pendingSprite = null;
    const body = this.matter.add.circle(dropX, CONFIG.DANGER_Y + 5, data.radius, {
      restitution: 0.3, friction: 0.2, frictionAir: 0.01, label: 'bubble'
    });
    body.gameData = { color: data.color, type: data.type, tier: data.tier, radius: data.radius, merging: false };
    const texKey = data.type === 'bomb' ? 'bomb' : data.type === 'rainbow' ? 'rainbow' : 'bubble';
    const sprite = this.add.image(dropX, CONFIG.DANGER_Y + 5, texKey).setDepth(5);
    sprite.setScale(data.radius / 30);
    if (data.type === 'plain') sprite.setTint(CONFIG.COLOR_TINTS[data.color]);
    if (data.type === 'rainbow') this.startRainbowTween(sprite);
    this.bubbleSprites.set(body.id, sprite);
    this.time.delayedCall(400, () => { if (!this.gameOver) this.spawnPendingBubble(); });
  }

  onCollision(event) {
    for (const pair of event.pairs) {
      const a = pair.bodyA, b = pair.bodyB;
      if (!a.gameData || !b.gameData) {
        if ((a.gameData && a.label !== 'wall') || (b.gameData && b.label !== 'wall')) {
          Effects.playLand(); this.cameras.main.shake(120, 0.002);
        }
        continue;
      }
      if (a.gameData.merging || b.gameData.merging) continue;
      if (this.canMerge(a.gameData, b.gameData)) {
        a.gameData.merging = true; b.gameData.merging = true;
        this.time.delayedCall(0, () => this.mergeBubbles(a, b));
      }
    }
  }

  canMerge(dA, dB) {
    if (dA.type === 'bomb' || dB.type === 'bomb') return true;
    if (dA.type === 'rainbow' || dB.type === 'rainbow') return true;
    return dA.color === dB.color && dA.tier === dB.tier;
  }

  mergeBubbles(bodyA, bodyB) {
    const dA = bodyA.gameData, dB = bodyB.gameData;
    if (!dA || !dB) return;
    const mx = (bodyA.position.x + bodyB.position.x) / 2;
    const my = (bodyA.position.y + bodyB.position.y) / 2;
    const isBomb = dA.type === 'bomb' || dB.type === 'bomb';
    this.destroyBubble(bodyA); this.destroyBubble(bodyB);
    if (isBomb) { this.triggerBombExplosion(mx, my); return; }
    const newTier = Math.min((dA.tier || 0) + 1, CONFIG.TIER_SIZES.length - 1);
    const color = dA.type === 'rainbow' ? dB.color : dA.color;
    if (dA.type === 'rainbow' || dB.type === 'rainbow') Effects.playRainbowMerge(); else Effects.playMerge(newTier);
    const baseScore = Stages.getScoreForTier(newTier);
    this.chainCount++;
    const mult = Stages.getComboMultiplier(this.chainCount);
    const pts = Math.floor(baseScore * mult);
    this.addScore(pts);
    Effects.mergeFlash(this, mx, my, 40 + newTier * 15);
    Effects.particles(this, mx, my, 8 + newTier * 4, CONFIG.COLOR_TINTS[color] || 0xFFFFFF, 60 + newTier * 20, 300 + newTier * 50);
    Effects.floatScore(this, mx, my - 10, '+' + pts, 18 + newTier * 4, newTier >= 2 ? '#FFD700' : '#FFFFFF');
    if (newTier >= 2) this.cameras.main.shake(200, 0.003 + newTier * 0.001);
    if (this.chainCount >= 2) {
      Effects.chainText(this, this.chainCount);
      Effects.playChainMerge(this.chainCount);
      if (this.chainCount >= 3) this.addScore(CONFIG.CHAIN_BONUS);
    }
    const newRadius = CONFIG.BASE_RADIUS * this.levelConfig.radiusMult * CONFIG.TIER_SIZES[newTier];
    const newBody = this.matter.add.circle(mx, my, newRadius, {
      restitution: 0.3, friction: 0.2, frictionAir: 0.01, label: 'bubble'
    });
    newBody.gameData = { color, type: 'plain', tier: newTier, radius: newRadius, merging: false };
    const sprite = this.add.image(mx, my, 'bubble').setScale(newRadius / 30).setTint(CONFIG.COLOR_TINTS[color]).setDepth(5);
    Effects.scalePunch(this, sprite, 1.35 + newTier * 0.1, 220 + newTier * 20);
    this.bubbleSprites.set(newBody.id, sprite);
    if (this.chainTimer) this.chainTimer.destroy();
    this.chainTimer = this.time.delayedCall(500, () => { this.chainCount = 0; });
  }

  triggerBombExplosion(x, y) {
    Effects.playBombExplode(); Effects.explosionFlash(this, x, y);
    Effects.shockwaveRing(this, x, y); Effects.particles(this, x, y, 30, 0xFF6B35, 130, 500);
    this.cameras.main.shake(350, 0.008);
    this.matter.world.getAllBodies().forEach(b => {
      if (!b.gameData || b.gameData.merging) return;
      const dx = b.position.x - x, dy = b.position.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < 100) {
        b.gameData.merging = true;
        this.time.delayedCall(0, () => { this.destroyBubble(b); this.addScore(CONFIG.SCORE_VALUES.BOMB_CLEAR); });
      }
    });
  }

  destroyBubble(body) {
    const sprite = this.bubbleSprites.get(body.id);
    if (sprite) { if (sprite.rainbowTimer) sprite.rainbowTimer.destroy(); sprite.destroy(); this.bubbleSprites.delete(body.id); }
    try { this.matter.world.remove(body); } catch (e) {}
  }

  riseFloor() {
    if (this.gameOver || this.paused) return;
    this.floorRisePx++;
    const C = CONFIG.CONTAINER;
    const newY = C.y + C.height - this.floorRisePx;
    Phaser.Physics.Matter.Matter.Body.setPosition(this.floorBody, { x: C.x + C.width / 2, y: newY });
    this.floorLine.clear(); this.floorLine.lineStyle(2, 0xFF4757, 0.6);
    for (let x = C.x; x < C.x + C.width; x += 14) this.floorLine.lineBetween(x, newY - 5, x + 7, newY - 5);
  }

  checkOverflow() {
    let overflow = false;
    for (const b of this.matter.world.getAllBodies()) {
      if (!b.gameData || b.gameData.merging) continue;
      const speed = Math.sqrt(b.velocity.x * b.velocity.x + b.velocity.y * b.velocity.y);
      if (b.position.y < CONFIG.DANGER_Y - 5) { overflow = true; break; }
    }
    if (overflow && !this.graceActive) {
      this.graceActive = true; Effects.playOverflowWarning();
      this.overflowWarningLoop = this.time.addEvent({ delay: 400, callback: () => Effects.playOverflowWarning(), loop: true });
      this.graceTimer = this.time.delayedCall(CONFIG.GRACE_PERIOD, () => { if (!this.gameOver) this.triggerGameOver(); });
    } else if (!overflow && this.graceActive && !this.graceTimerLocked) {
      this.graceActive = false;
      if (this.graceTimer) { this.graceTimer.destroy(); this.graceTimer = null; }
      if (this.overflowWarningLoop) { this.overflowWarningLoop.destroy(); this.overflowWarningLoop = null; }
    }
  }

  update(time, delta) {
    if (this.gameOver || this.paused) return;
    const dt = delta / 1000;
    this.bubbleSprites.forEach((sprite, bodyId) => {
      const body = this.matter.world.getAllBodies().find(b => b.id === bodyId);
      if (body) { sprite.x = body.position.x; sprite.y = body.position.y; }
    });
    if (!this.droppingBubble) {
      this.dropCountdown -= dt; this.updateTimerArc();
      if (this.dropCountdown <= 0) { Effects.playAutoDrop(); this.dropBubble(); }
    }
    this.checkOverflow(); this.enforceBodyLimit();
    // Inactivity death
    if (Date.now() - this.lastInputTime > CONFIG.INACTIVITY_DEATH) { this.triggerGameOver(); }
  }

  shutdown() {
    this.tweens.killAll(); this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
    this.bubbleSprites.forEach(s => { if (s.rainbowTimer) s.rainbowTimer.destroy(); s.destroy(); });
    this.bubbleSprites.clear(); this.merging.clear();
  }
}
