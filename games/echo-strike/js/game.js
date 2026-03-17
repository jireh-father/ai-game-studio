// Echo Strike - Core Game Scene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  init(data) { this.continued = data && data.continued; }

  create() {
    const w = CONFIG.GAME_WIDTH, h = CONFIG.GAME_HEIGHT;
    this.cameras.main.setBackgroundColor(COLORS.BG);
    this.cameras.main.fadeIn(300, 10, 10, 15);
    GameRenderer.init(this);
    if (!this.continued) { window.GameState.score = 0; window.GameState.stage = 1; window.GameState.combo = 0; }
    this.gameOver = false; this.stageTransitioning = false; this.paused = false;
    this.stageHits = 0; this.echoQueue = []; this.activeTargets = [];
    this.echoGhosts = []; this.echoComboCount = 0;
    this.wallFlashSide = null; this.wallFlashColor = 0; this.wallFlashTime = 0;
    this.walls = { left: 0, right: 0, top: 0, bottom: 0 };
    this.lastTapTime = Date.now(); this.lastTimeContract = Date.now();
    this.wallGfx = this.add.graphics().setDepth(5);
    this.dangerGfx = this.add.graphics().setDepth(4);
    const gs = window.GameState;
    this.scoreText = this.add.text(10, 10, `${gs.score}`, {
      fontSize: '18px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold' }).setDepth(20);
    this.stageText = this.add.text(w / 2, 10, `Stage ${gs.stage}`, {
      fontSize: '14px', fontFamily: 'Arial', fill: '#AAAAAA' }).setOrigin(0.5, 0).setDepth(20);
    this.comboText = this.add.text(w - 10, 10, '', {
      fontSize: '14px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold' }).setOrigin(1, 0).setDepth(20);
    this.input.on('pointerdown', (pointer) => this.handleTap(pointer.x, pointer.y));
    const pauseBtn = this.add.text(w - 10, 10, '| |', {
      fontSize: '18px', fontFamily: 'Arial', fill: '#666666'
    }).setOrigin(1, 0).setDepth(21).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', (p, lx, ly, e) => { e.stopPropagation(); this.showPause(); });
    GameRenderer.drawBgGrid(this);
    this.visHandler = () => { if (document.hidden && !this.gameOver) this.showPause(); };
    document.addEventListener('visibilitychange', this.visHandler);
    this.startStage();
  }

  startStage() {
    this.stageTransitioning = false; this.stageHits = 0;
    this.stageParams = getStageParams(window.GameState.stage);
    this.stageText.setText(`Stage ${window.GameState.stage}`);
    this.activeTargets.forEach(t => { if (t.sprite) t.sprite.setVisible(false); });
    this.activeTargets = [];
    const wb = this.getWallBounds();
    const positions = generateTargetPositions(window.GameState.stage, this.stageParams.targetCount, wb);
    const types = assignTargetTypes(window.GameState.stage, this.stageParams.targetCount);
    positions.forEach((pos, i) => this.spawnTarget(pos.x, pos.y, types[i]));
    if (window.GameState.stage > 1) GameRenderer.playSound('stageAdvance');
  }

  getWallBounds() {
    return { left: this.walls.left, right: CONFIG.GAME_WIDTH - this.walls.right,
      top: CONFIG.HUD_HEIGHT + this.walls.top, bottom: CONFIG.GAME_HEIGHT - this.walls.bottom };
  }

  spawnTarget(x, y, type) {
    const texKey = type === 'fast' ? 'fastPulser' : type === 'decoy' ? 'decoy' : 'target';
    const sprite = this.add.image(x, y, texKey).setDepth(10).setAlpha(0.2);
    const cycle = this.stageParams.pulseCycle * (type === 'fast' ? 0.5 : 1);
    const radius = this.stageParams.targetRadius;
    sprite.setDisplaySize(radius * 2, radius * 2);
    this.activeTargets.push({ sprite, x, y, type, radius, cycle,
      hitWindow: this.stageParams.hitWindow, bright: false, alive: true, cycleCount: 0,
      phaseStart: Date.now() + Math.random() * cycle * 0.5 });
  }

  update() {
    if (this.gameOver || this.paused) return;
    const now = Date.now();
    this.activeTargets.forEach(t => {
      if (!t.alive) return;
      const elapsed = (now - t.phaseStart) % t.cycle;
      const brightStart = t.cycle - t.hitWindow;
      t.bright = elapsed >= brightStart;
      if (t.bright) {
        t.sprite.setAlpha(0.8 + ((elapsed - brightStart) / t.hitWindow) * 0.2);
        t.sprite.setTint(0xFFFFFF);
      } else {
        t.sprite.setAlpha(0.15 + (elapsed / brightStart) * 0.3);
        t.sprite.clearTint();
      }
      const newCycles = Math.floor((now - t.phaseStart) / t.cycle);
      if (newCycles > t.cycleCount) {
        t.cycleCount = newCycles;
        if (t.type !== 'decoy') this.onMiss(t);
      }
    });
    for (let i = this.echoQueue.length - 1; i >= 0; i--) {
      if (now >= this.echoQueue[i].fireTime) {
        this.fireEcho(this.echoQueue[i]);
        this.echoQueue.splice(i, 1);
      }
    }
    this.echoGhosts = GameRenderer.updateEchoGhosts(this.echoGhosts);
    GameRenderer.drawWalls(this.wallGfx, this.walls, this.wallFlashSide, this.wallFlashColor, this.wallFlashTime);
    GameRenderer.drawDanger(this.dangerGfx, this.walls);
    // Time-based wall contraction (ensures death within ~25s even with no misses)
    if (now - this.lastTimeContract >= WALL_CONFIG.TIME_CONTRACT_INTERVAL_MS) {
      this.lastTimeContract = now;
      const sides = ['left', 'right', 'top', 'bottom'];
      const side = sides[Math.floor(Math.random() * 4)];
      this.walls[side] = Math.min(this.walls[side] + WALL_CONFIG.TIME_CONTRACT_PX, CONFIG.GAME_WIDTH / 2);
    }
    // Inactivity acceleration: if no taps for 5s, contract faster
    if (now - this.lastTapTime >= WALL_CONFIG.INACTIVITY_THRESHOLD_MS) {
      const inactiveTicks = Math.floor((now - this.lastTapTime - WALL_CONFIG.INACTIVITY_THRESHOLD_MS) / WALL_CONFIG.INACTIVITY_INTERVAL_MS);
      const contractAmt = WALL_CONFIG.INACTIVITY_CONTRACT_PX * Math.min(inactiveTicks, 5);
      if (contractAmt > 0 && (now % WALL_CONFIG.INACTIVITY_INTERVAL_MS < 20)) {
        const sides = ['left', 'right', 'top', 'bottom'];
        sides.forEach(s => { this.walls[s] = Math.min(this.walls[s] + contractAmt, CONFIG.GAME_WIDTH / 2); });
      }
    }
    this.checkDeath();
    if (!this.stageTransitioning && this.stageHits >= this.stageParams.hitsRequired) this.advanceStage();
  }

  handleTap(x, y) {
    if (this.gameOver || this.paused) return;
    this.lastTapTime = Date.now();
    let hitTarget = null, closestDist = Infinity;
    this.activeTargets.forEach(t => {
      if (!t.alive || !t.bright) return;
      const dist = Math.sqrt((t.x - x) ** 2 + (t.y - y) ** 2);
      if (dist <= t.radius + 10 && dist < closestDist) { closestDist = dist; hitTarget = t; }
    });
    if (!hitTarget) return;
    if (hitTarget.type === 'decoy') { this.onDecoyTap(hitTarget); return; }
    this.onHit(hitTarget, x, y);
  }

  onHit(target, tapX, tapY) {
    const gs = window.GameState;
    const elapsed = (Date.now() - target.phaseStart) % target.cycle;
    const isPerfect = (elapsed - (target.cycle - target.hitWindow)) < 100;
    gs.combo++; this.echoComboCount = 0;
    const mult = this.getComboMultiplier();
    let points = Math.floor(SCORING.BASE_HIT * mult);
    if (isPerfect) points += SCORING.PERFECT_BONUS;
    gs.score += points; this.stageHits++;
    this.tweens.add({ targets: target.sprite, scaleX: 1.4, scaleY: 1.4, duration: 50, yoyo: true });
    GameRenderer.burstParticles(tapX, tapY, 'particle', 16 + Math.floor(gs.combo / 5) * 4);
    if (isPerfect) GameRenderer.burstParticles(tapX, tapY, 'particleLime', 6);
    this.cameras.main.shake(120, Math.min(0.003 + gs.combo * 0.0005, 0.008));
    this.cameras.main.zoomTo(1.03, 60);
    setTimeout(() => { if (!this.gameOver) this.cameras.main.zoomTo(1, 200); }, 60);
    this.scene.pause();
    setTimeout(() => { if (!this.gameOver) this.scene.resume(); }, 40);
    GameRenderer.floatingText(tapX, tapY, `+${points}`, '#00D4FF', isPerfect ? 24 : 20);
    if (isPerfect) GameRenderer.floatingText(tapX, tapY - 20, 'PERFECT', COLORS.PERFECT_HIT, 16);
    GameRenderer.playSound('hit', gs.combo);
    this.updateHUD();
    target.alive = false; target.sprite.setVisible(false);
    this.respawnTarget(target);
    this.plantEcho(tapX, tapY);
  }

  onMiss(target) {
    if (this.gameOver) return;
    window.GameState.combo = 0; this.echoComboCount = 0;
    this.updateHUD();
    this.contractWall(this.getNearestWall(target.x, target.y), this.stageParams.missPenalty);
    if (target.sprite && target.sprite.active) {
      target.sprite.setTint(0xFF2200);
      this.time.delayedCall(150, () => { if (target.sprite && target.sprite.active) target.sprite.clearTint(); });
    }
    GameRenderer.playSound('miss');
  }

  onDecoyTap(target) {
    target.sprite.setTint(0xFF0000);
    this.tweens.add({ targets: target.sprite, alpha: 0, duration: 200 });
    this.cameras.main.shake(80, 0.002);
    GameRenderer.playSound('miss');
  }

  plantEcho(x, y) {
    if (this.echoQueue.length >= ECHO_CONFIG.MAX_QUEUE) {
      const oldest = this.echoQueue.shift();
      const gi = this.echoGhosts.findIndex(g => g.echoId === oldest.id);
      if (gi >= 0) {
        if (this.echoGhosts[gi].sprite) this.echoGhosts[gi].sprite.destroy();
        if (this.echoGhosts[gi].arc) this.echoGhosts[gi].arc.destroy();
        this.echoGhosts.splice(gi, 1);
      }
    }
    const echoId = Date.now() + Math.random();
    this.echoQueue.push({ x, y, fireTime: Date.now() + ECHO_CONFIG.DELAY_MS, id: echoId });
    const ghost = this.add.image(x, y, 'echoGhost').setDepth(8).setAlpha(0).setDisplaySize(52, 52);
    this.tweens.add({ targets: ghost, alpha: 0.5, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true,
      onYoyo: () => { ghost.setScale(1); ghost.setAlpha(0.4); } });
    const arc = this.add.graphics().setDepth(9);
    this.echoGhosts.push({ sprite: ghost, arc, x, y, startTime: Date.now(), echoId });
  }

  fireEcho(echo) {
    if (this.gameOver) return;
    let hitTarget = null, closestDist = Infinity;
    this.activeTargets.forEach(t => {
      if (!t.alive || !t.bright || t.type === 'decoy') return;
      const dist = Math.sqrt((t.x - echo.x) ** 2 + (t.y - echo.y) ** 2);
      if (dist <= ECHO_CONFIG.HIT_RADIUS && dist < closestDist) { closestDist = dist; hitTarget = t; }
    });
    if (hitTarget) this.onEchoHit(hitTarget, echo);
    else { GameRenderer.playSound('echoMiss'); GameRenderer.echoFireFlash(echo.x, echo.y, false); }
  }

  onEchoHit(target, echo) {
    const gs = window.GameState;
    gs.combo += 2; this.echoComboCount++;
    let points = Math.floor(SCORING.ECHO_HIT * this.getComboMultiplier() * 1.5);
    if (this.echoComboCount >= 3) points += SCORING.ECHO_COMBO_BONUS;
    gs.score += points; this.stageHits++;
    this.expandWall(this.getNearestWall(target.x, target.y), WALL_CONFIG.ECHO_PUSH_BACK);
    GameRenderer.burstParticles(echo.x, echo.y, 'particle', 24);
    GameRenderer.burstParticles(echo.x, echo.y, 'particleWhite', 8);
    this.cameras.main.shake(180, 0.005);
    this.tweens.add({ targets: target.sprite, scaleX: 1.5, scaleY: 1.5, duration: 60, yoyo: true });
    GameRenderer.echoFireFlash(echo.x, echo.y, true);
    GameRenderer.floatingText(echo.x, echo.y, `+${points} ECHO`, '#00FFEE', 24);
    if (this.echoComboCount >= 3)
      GameRenderer.floatingText(echo.x, echo.y - 30, `ECHO CHAIN x${this.echoComboCount}`, '#FFD700', 22);
    GameRenderer.playSound('echoHit', gs.combo);
    this.updateHUD();
    target.alive = false; target.sprite.setVisible(false);
    this.respawnTarget(target);
  }

  respawnTarget(old) {
    this.time.delayedCall(300, () => {
      if (this.gameOver) return;
      const pos = generateTargetPositions(window.GameState.stage + Date.now() % 100, 1, this.getWallBounds());
      if (pos.length) { const t = assignTargetTypes(window.GameState.stage, 1); this.spawnTarget(pos[0].x, pos[0].y, t[0]); }
      const idx = this.activeTargets.indexOf(old);
      if (idx >= 0) this.activeTargets.splice(idx, 1);
    });
  }

  getNearestWall(x, y) {
    const d = { left: x, right: CONFIG.GAME_WIDTH - x, top: y, bottom: CONFIG.GAME_HEIGHT - y };
    let min = Infinity, side = 'left';
    for (const [s, v] of Object.entries(d)) { if (v < min) { min = v; side = s; } }
    return side;
  }

  contractWall(side, amt) {
    this.walls[side] = Math.min(this.walls[side] + amt, CONFIG.GAME_WIDTH / 2);
    this.wallFlashSide = side; this.wallFlashColor = COLORS_INT.WALL_GLOW; this.wallFlashTime = Date.now();
  }
  expandWall(side, amt) {
    this.walls[side] = Math.max(this.walls[side] - amt, 0);
    this.wallFlashSide = side; this.wallFlashColor = COLORS_INT.WALL_EXPAND; this.wallFlashTime = Date.now();
  }
  checkDeath() {
    if (this.walls.left + this.walls.right >= CONFIG.GAME_WIDTH ||
        this.walls.top + this.walls.bottom >= CONFIG.GAME_HEIGHT) this.triggerGameOver();
  }
  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.cameras.main.shake(350, 0.012);
    GameRenderer.deathFlash(this); GameRenderer.playSound('gameOver');
    this.time.delayedCall(650, () => { this.scene.stop('GameScene'); this.scene.start('GameOverScene'); });
  }
  advanceStage() {
    this.stageTransitioning = true; window.GameState.stage++;
    this.time.delayedCall(500, () => { if (!this.gameOver) this.startStage(); });
  }
  getComboMultiplier() {
    const c = window.GameState.combo; let m = 1;
    for (const t of SCORING.COMBO_TIERS) { if (c >= t.min) m = t.mult; }
    return m;
  }
  updateHUD() {
    const gs = window.GameState;
    this.scoreText.setText(`${gs.score}`);
    this.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });
    if (gs.combo > 0) {
      this.comboText.setText(`x${gs.combo}`);
      this.comboText.setFontSize(Math.min(14 + Math.floor(gs.combo / 5) * 2, 28));
      this.tweens.add({ targets: this.comboText, scaleX: 1.2, scaleY: 1.2, duration: 60, yoyo: true });
    } else this.comboText.setText('');
  }
  showPause() {
    if (this.gameOver || this.paused) return;
    this.paused = true;
    this.pauseOverlay = GameRenderer.createPauseOverlay(this);
  }
  resumeGame() {
    this.paused = false;
    if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
  }
  shutdown() {
    this.tweens.killAll(); this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}
