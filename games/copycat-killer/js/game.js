// Copycat Killer - Core Game Scene

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) { this.continued = data && data.continued; }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.gameWidth = w;
    this.gameHeight = h;
    this.gameOver = false;
    this.paused = false;
    this.stageTransitioning = false;

    this.stageParams = StageGenerator.getStageParams(GameState.stage);
    this.arenaLeft = (w - this.stageParams.arenaWidth) / 2;
    this.arenaRight = this.arenaLeft + this.stageParams.arenaWidth;
    this.arenaTop = GAME_CONFIG.hudHeight;
    this.arenaBottom = h;

    this.add.rectangle(w / 2, h / 2, w, h, COLORS.background);
    this.arenaBorder = this.add.graphics();
    this.drawArenaBorder();

    // Player
    this.player = this.add.image(w / 2, h * 0.7, 'player');
    this.playerX = w / 2;
    this.playerY = h * 0.7;
    this.targetX = this.playerX;
    this.targetY = this.playerY;
    this.lastInputTime = Date.now();

    // Trail
    this.trail = [];
    for (let i = 0; i < GAME_CONFIG.trailCount; i++) {
      const t = this.add.image(this.playerX, this.playerY, 'player');
      t.setAlpha(0);
      t.setScale(0.7);
      this.trail.push(t);
    }
    this.trailPositions = [];

    // Systems
    this.recorder = new GhostRecorder();
    this.ghosts = [];
    this.ghostSpawnTimer = 0;
    this.ghostCount = 0;
    this.gameTime = 0;
    this.obstacles = [];
    this.waveTimer = 0;
    this.waveIndex = 0;
    this.idlePunishment = new IdlePunishment(this);
    this.idlePunishment.init(this.playerX, this.playerY);
    this.scoreAccum = 0;
    this.stageTimer = this.stageParams.stageDuration;

    // HUD (before any stage logic)
    this.hud = new GameHUD(this);
    this.hud.create(w, h);

    // Audio
    try { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { this.audioCtx = null; }

    // Input
    this.input.on('pointermove', (p) => this.handleInput(p));
    this.input.on('pointerdown', (p) => this.handleInput(p));

    if (this.continued) { this.ghosts = []; this.recorder.reset(); }

    this.visHandler = () => { if (document.hidden && !this.gameOver) this.togglePause(); };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  handleInput(p) {
    if (this.gameOver || this.paused) return;
    this.targetX = Phaser.Math.Clamp(p.x, this.arenaLeft + 15, this.arenaRight - 15);
    this.targetY = Phaser.Math.Clamp(p.y, this.arenaTop + 15, this.arenaBottom - 15);
    this.lastInputTime = Date.now();
  }

  playSound(freq, dur, type, freqEnd) {
    if (!this.audioCtx || !AUDIO.enabled) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      if (freqEnd) osc.frequency.linearRampToValueAtTime(freqEnd, this.audioCtx.currentTime + dur / 1000);
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + dur / 1000);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + dur / 1000);
    } catch (e) {}
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (this.paused) this.hud.showPauseOverlay(this.gameWidth, this.gameHeight);
    else this.hud.hidePauseOverlay();
  }

  restartFromPause() {
    this.hud.hidePauseOverlay();
    GameState.reset();
    this.scene.stop('GameScene');
    this.scene.start('GameScene');
  }

  helpFromPause() {
    this.scene.pause('GameScene');
    this.scene.launch('HelpScene', { returnTo: 'GameScene' });
  }

  menuFromPause() {
    this.hud.hidePauseOverlay();
    GameState.reset();
    this.scene.stop('GameScene');
    this.scene.start('MenuScene');
  }

  update(time, delta) {
    if (this.gameOver || this.paused) return;
    const dt = delta / 1000;
    this.gameTime += delta;

    // Move player
    this.playerX += (this.targetX - this.playerX) * GAME_CONFIG.playerLerp;
    this.playerY += (this.targetY - this.playerY) * GAME_CONFIG.playerLerp;
    this.player.x = this.playerX;
    this.player.y = this.playerY;

    // Trail
    this.trailPositions.unshift({ x: this.playerX, y: this.playerY });
    if (this.trailPositions.length > GAME_CONFIG.trailCount * 3) this.trailPositions.pop();
    for (let i = 0; i < this.trail.length; i++) {
      const idx = (i + 1) * 3;
      if (idx < this.trailPositions.length) {
        this.trail[i].x = this.trailPositions[idx].x;
        this.trail[i].y = this.trailPositions[idx].y;
        this.trail[i].setAlpha(GAME_CONFIG.trailAlphaStart - i * GAME_CONFIG.trailAlphaDecay);
      }
    }

    // Ghost recording & spawning
    this.recorder.record(this.playerX, this.playerY, this.gameTime);
    this.ghostSpawnTimer += delta;
    if (this.ghostSpawnTimer >= GAME_CONFIG.ghostReplayDelay) {
      this.ghostSpawnTimer -= GAME_CONFIG.ghostReplayDelay;
      this.spawnGhost();
    }

    // Update ghosts
    const ghostSpeed = GameState.stage >= 31 ? 1.2 : 1.0;
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      if (this.ghosts[i].update(this.gameTime, ghostSpeed)) {
        this.ghosts[i].destroy();
        this.ghosts.splice(i, 1);
      }
    }
    this.ghostCount = this.ghosts.length;
    this.hud.updateGhostCount(this.ghostCount);

    // Obstacle waves
    this.waveTimer += delta;
    if (this.waveTimer >= this.stageParams.waveInterval) {
      this.waveTimer -= this.stageParams.waveInterval;
      this.spawnWave();
    }
    this.updateObstacles(dt);

    // Collisions
    if (this.checkCollisions()) return;

    // Idle punishment
    if (this.idlePunishment.update(this.playerX, this.playerY, delta, this.stageParams.idleTrigger)) {
      this.triggerDeath(); return;
    }
    if (Date.now() - this.lastInputTime > 25000) { this.triggerDeath(); return; }

    // Score & stage
    this.updateScore(dt);
    this.stageTimer -= delta;
    if (this.stageTimer <= 0 && !this.stageTransitioning) this.advanceStage();
  }

  spawnGhost() {
    if (this.ghosts.length >= this.stageParams.maxGhosts) return;
    const path = this.recorder.getFullPath();
    if (path.length < 10) return;
    this.ghosts.push(new GhostReplayer(this, path, this.ghosts.length));
    this.playSound(440, 300, 'sine', 220);
    this.hud.punchGhostCount();
  }

  spawnWave() {
    const wave = WaveGenerator.generateWave(GameState.stage, this.waveIndex, this.arenaLeft, this.stageParams.arenaWidth);
    this.waveIndex++;
    wave.forEach(ob => {
      ob.sprite = this.add.image(ob.x, ob.y, ob.type === 'mega' ? 'megaObstacle' : 'obstacle');
      ob.nearMissTriggered = false;
      ob.bounced = false;
      this.obstacles.push(ob);
    });
  }

  updateObstacles(dt) {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const ob = this.obstacles[i];
      ob.y += ob.speed * dt;
      ob.sprite.y = ob.y;
      if (ob.bounce && !ob.bounced && ob.y >= this.arenaBottom - 20) {
        ob.speed = -ob.speed * 0.7;
        ob.bounced = true;
      }
      if (ob.y > this.arenaBottom + 40 || (ob.bounced && ob.y < this.arenaTop - 40)) {
        ob.sprite.destroy();
        this.obstacles.splice(i, 1);
      }
    }
  }

  checkCollisions() {
    for (const ghost of this.ghosts) {
      if (ghost.done) continue;
      const d = Phaser.Math.Distance.Between(this.playerX, this.playerY, ghost.sprite.x, ghost.sprite.y);
      if (d < GAME_CONFIG.ghostKillDist) { this.triggerDeath(); return true; }
      if (d < GAME_CONFIG.ghostNearMissDist && !ghost.nearMissTriggered) {
        ghost.nearMissTriggered = true;
        this.nearMiss(this.playerX, this.playerY, SCORE_CONFIG.nearMissGhost, COLORS.nearMiss);
        this.playSound(370, 120, 'square', 520);
      }
    }
    for (const ob of this.obstacles) {
      const d = Phaser.Math.Distance.Between(this.playerX, this.playerY, ob.x, ob.y);
      const kill = GAME_CONFIG.playerRadius + ob.radius;
      if (d < kill) { this.triggerDeath(); return true; }
      if (d < kill + 20 && !ob.nearMissTriggered) {
        ob.nearMissTriggered = true;
        this.nearMiss(this.playerX, this.playerY, SCORE_CONFIG.nearMissObstacle, COLORS.nearMissObstacle);
        this.playSound(800, 80, 'sawtooth');
      }
    }
    return false;
  }

  nearMiss(x, y, points, color) {
    GameState.score += points;
    this.player.setTint(color);
    setTimeout(() => { if (this.player && this.player.active) this.player.clearTint(); }, 80);
    const txt = this.add.text(x, y - 10, '+' + points, {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold',
      color: color === COLORS.nearMiss ? '#FFFF00' : '#FF8800'
    }).setOrigin(0.5);
    this.tweens.add({ targets: txt, y: y - 50, alpha: 0, duration: 600, onComplete: () => txt.destroy() });
    this.hud.punchScore();
  }

  updateScore(dt) {
    const mult = this.ghostCount >= 5 ? SCORE_CONFIG.multiplier5Ghosts :
                 this.ghostCount >= 3 ? SCORE_CONFIG.multiplier3Ghosts : 1;
    const rate = SCORE_CONFIG.perSecond + this.ghostCount * SCORE_CONFIG.ghostBonusPerSecond;
    this.scoreAccum += rate * mult * dt;
    if (this.scoreAccum >= 1) {
      const add = Math.floor(this.scoreAccum);
      GameState.score += add;
      this.scoreAccum -= add;
    }
    this.hud.updateScore(GameState.score, this.ghostCount);
  }

  advanceStage() {
    this.stageTransitioning = true;
    GameState.score += GameState.stage * SCORE_CONFIG.stageClearMultiplier;
    GameState.stage++;
    this.ghosts.forEach(g => {
      this.tweens.add({ targets: g.sprite, alpha: 0, duration: 200, onComplete: () => g.destroy() });
    });
    this.ghosts = [];
    this.recorder.reset();
    this.ghostSpawnTimer = 0;
    this.obstacles.forEach(o => o.sprite.destroy());
    this.obstacles = [];

    const banner = this.add.text(this.gameWidth / 2, -50, 'STAGE ' + (GameState.stage - 1) + ' CLEAR!', {
      fontSize: '26px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FFD700'
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets: banner, y: this.gameHeight * 0.4, duration: 300, ease: 'Power2',
      onComplete: () => { this.time.delayedCall(1500, () => {
        this.tweens.add({ targets: banner, y: -50, duration: 300, onComplete: () => banner.destroy() });
      }); }
    });
    particleBurst(this, this.gameWidth / 2, this.gameHeight / 2, 'goldParticle', 20, 100, 250, 600);
    this.playSound(262, 150, 'sine');
    setTimeout(() => this.playSound(330, 150, 'sine'), 100);
    setTimeout(() => this.playSound(392, 300, 'sine'), 200);
    screenFlash(this, 0x1A1A2A, 0.5, 200);

    this.time.delayedCall(2000, () => {
      this.stageParams = StageGenerator.getStageParams(GameState.stage);
      this.arenaLeft = (this.gameWidth - this.stageParams.arenaWidth) / 2;
      this.arenaRight = this.arenaLeft + this.stageParams.arenaWidth;
      this.drawArenaBorder();
      this.stageTimer = this.stageParams.stageDuration;
      this.hud.updateStage(GameState.stage);
      this.waveIndex = 0;
      this.waveTimer = 0;
      this.stageTransitioning = false;
    });
  }

  drawArenaBorder() {
    this.arenaBorder.clear();
    if (this.arenaLeft > 0) {
      this.arenaBorder.lineStyle(1, 0x333366, 0.4);
      this.arenaBorder.strokeRect(this.arenaLeft, this.arenaTop,
        this.stageParams.arenaWidth, this.arenaBottom - this.arenaTop);
    }
  }

  triggerDeath() {
    if (this.gameOver) return;
    this.gameOver = true;
    if (GameState.score > GameState.highScore) {
      GameState.highScore = GameState.score;
      saveHighScore(GameState.highScore);
    }
    this.player.setAlpha(0);
    this.cameras.main.shake(400, 0.025);
    particleBurst(this, this.playerX, this.playerY, 'particle', 16, 150, 300, 350);
    screenFlash(this, COLORS.obstacle, 0.7, 200);
    this.playSound(80, 600, 'sawtooth', 30);
    setTimeout(() => {
      if (!this.scene.isActive('GameScene')) return;
      this.time.delayedCall(300, () => { this.scene.launch('GameOverScene'); });
    }, 80);
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
    if (this.idlePunishment) this.idlePunishment.destroy();
  }
}
