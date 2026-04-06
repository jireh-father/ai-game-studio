// Lag Shot - Core Gameplay Scene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.startWave = (data && data.continueFromWave) || 1;
    this.startScore = (data && data.continueScore) || 0;
  }

  create() {
    this.gameOver = false;
    this.paused = false;
    this.stageTransitioning = false;
    this.score = this.startScore;
    this.wave = this.startWave;
    this.combo = 0;
    this.lastKillTime = 0;
    this.lastTapTime = 0;
    this.singleTapTimer = null;
    this.lastInputTime = Date.now();
    this.lagBuffer = [];
    this.waveActive = false;
    this.waveForceTimer = 0;
    this.enemiesAlive = 0;
    this.comboText = null;
    this.comboHideTimer = null;

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0A0A0F);
    for (let gx = 0; gx < GAME_WIDTH; gx += 40) {
      for (let gy = HUD_HEIGHT; gy < GAME_HEIGHT; gy += 40) {
        this.add.image(gx + 20, gy + 20, 'grid').setAlpha(0.3);
      }
    }

    // Player
    this.player = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 120, 'player').setDepth(10);
    // Ghost (lag indicator)
    this.ghost = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 120, 'player-ghost').setDepth(9).setAlpha(0.4);
    this.tweens.add({ targets: this.ghost, alpha: 0.2, duration: 400, yoyo: true, repeat: -1 });
    this.aimLabel = this.add.text(0, 0, 'AIM', {
      fontSize: '10px', fontFamily: 'monospace', fill: '#00FFFF'
    }).setOrigin(0.5).setAlpha(0.4).setDepth(9);

    // Groups
    this.bullets = this.add.group();
    this.enemies = this.add.group();

    // HUD (from hud.js mixin)
    this.createHUD();

    // Input
    this.input.on('pointerdown', (pointer) => this.handlePointerDown(pointer));

    // Visibility handler
    this._visHandler = () => { if (document.hidden && !this.paused) this.togglePause(); };
    document.addEventListener('visibilitychange', this._visHandler);

    // Start first wave
    this.time.delayedCall(500, () => this.startWaveSpawn());
  }

  handlePointerDown(pointer) {
    if (this.gameOver || this.paused) return;
    if (pointer.y < HUD_HEIGHT) return;
    this.lastInputTime = Date.now();
    audioManager.init();

    const now = Date.now();
    if (now - this.lastTapTime < DOUBLE_TAP_WINDOW) {
      clearTimeout(this.singleTapTimer);
      this.lastTapTime = 0;
      this.fireFromLagPosition(pointer.x, pointer.y);
    } else {
      this.lastTapTime = now;
      const px = pointer.x, py = pointer.y;
      this.singleTapTimer = setTimeout(() => {
        this.movePlayerTo(px, py);
      }, DOUBLE_TAP_WINDOW);
    }
  }

  movePlayerTo(x, y) {
    if (this.gameOver || this.paused) return;
    this.emitParticles(this.player.x, this.player.y, COLORS_INT.player, 4, 60, 200);
    this.player.x = x;
    this.player.y = Math.max(HUD_HEIGHT + 12, y);
    this.player.setAlpha(0);
    this.tweens.add({ targets: this.player, alpha: 1, duration: 80 });
    this.scalePunch(this.player, 1.3, 120);
    audioManager.playMove();
  }

  fireFromLagPosition(tapX, tapY) {
    if (this.gameOver) return;
    const lagPos = this.getLagPosition(this.time.now);
    this.muzzleFlash(lagPos.x, lagPos.y);
    this.scalePunch(this.ghost, 1.5, 150);
    const bullet = this.add.circle(lagPos.x, lagPos.y, 4, 0xFFFFFF).setDepth(11);
    const angle = Math.atan2(tapY - lagPos.y, tapX - lagPos.x);
    bullet.vx = Math.cos(angle) * BULLET_SPEED;
    bullet.vy = Math.sin(angle) * BULLET_SPEED;
    bullet.firedPlayerDist = Phaser.Math.Distance.Between(lagPos.x, lagPos.y, this.player.x, this.player.y);
    bullet.trailTimer = 0;
    this.bullets.add(bullet);
    this.cameras.main.shake(80, 0.003);
    audioManager.playShoot();
  }

  getLagPosition(currentTime) {
    const targetTime = currentTime - LAG_DELAY_MS;
    for (let i = this.lagBuffer.length - 1; i >= 0; i--) {
      if (this.lagBuffer[i].timestamp <= targetTime) return this.lagBuffer[i];
    }
    return { x: this.player.x, y: this.player.y };
  }

  startWaveSpawn() {
    if (this.gameOver) return;
    this.waveActive = true;
    this.waveForceTimer = 0;
    this.stageTransitioning = false;
    const params = getWaveParams(this.wave);
    this.waveText.setText('Wave: ' + this.wave);
    const spawnCount = Math.min(params.enemyCount, MAX_ENEMIES_ON_SCREEN - this.enemies.getLength());
    const usedPositions = [];
    for (let i = 0; i < spawnCount; i++) {
      this.time.delayedCall(i * 300, () => {
        if (this.gameOver) return;
        const edge = getRandomEdge();
        const pos = getSpawnPosition(edge, this.player.x, this.player.y);
        let valid = true;
        for (const up of usedPositions) {
          if (Phaser.Math.Distance.Between(pos.x, pos.y, up.x, up.y) < 80) { valid = false; break; }
        }
        if (!valid) { pos.x += 80; pos.y += 40; }
        usedPositions.push(pos);
        const type = selectEnemyType(params.enemyTypes, this.wave + i);
        this.spawnEnemy(type, pos, params);
      });
    }
  }

  update(time, delta) {
    if (this.gameOver || this.paused) return;

    // Inactivity death
    if (Date.now() - this.lastInputTime > INACTIVITY_DEATH_MS) {
      this.triggerDeath();
      return;
    }

    // Lag buffer
    this.lagBuffer.push({ x: this.player.x, y: this.player.y, timestamp: time });
    const cutoff = time - (LAG_DELAY_MS + 200);
    while (this.lagBuffer.length > 0 && this.lagBuffer[0].timestamp < cutoff) {
      this.lagBuffer.shift();
    }

    // Ghost position
    const lagPos = this.getLagPosition(time);
    this.ghost.x = lagPos.x;
    this.ghost.y = lagPos.y;
    this.aimLabel.x = lagPos.x;
    this.aimLabel.y = lagPos.y + 16;

    // Entity updates (from entities.js mixin)
    this.updateBullets(delta);
    this.updateEnemies(delta);
    this.checkBulletEnemyCollisions();

    // Wave force timer
    if (this.waveActive) {
      this.waveForceTimer += delta;
      if (this.waveForceTimer >= WAVE_FORCE_TIMER && !this.stageTransitioning) {
        this.advanceWave();
      }
    }
  }

  checkWaveComplete() {
    if (this.gameOver || this.stageTransitioning) return;
    const alive = this.enemies.getChildren().filter(e => e.active).length;
    if (alive <= 0) this.advanceWave();
  }

  advanceWave() {
    if (this.stageTransitioning || this.gameOver) return;
    this.stageTransitioning = true;
    this.waveActive = false;
    this.enemiesAlive = 0;
    this.score += SCORE_VALUES.waveClear;
    this.scoreText.setText('Score: ' + this.score);
    this.waveClearEffects(this.wave);
    this.wave++;
    this.time.delayedCall(WAVE_SPAWN_DELAY, () => {
      if (!this.gameOver) this.startWaveSpawn();
    });
  }

  triggerDeath() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.deathEffects();
    this.enemies.getChildren().forEach(e => { e.arcPaused = true; });

    const gs = window.gameState;
    const isNew = this.score > gs.highScore;
    if (isNew) {
      gs.highScore = this.score;
      localStorage.setItem('lag-shot_high_score', gs.highScore);
    }
    gs.gamesPlayed++;
    gs.sessionGameOvers++;

    this.time.delayedCall(500, () => {
      this.scene.launch('GameOverScene', {
        score: this.score, wave: this.wave,
        isHighScore: isNew, continueWave: this.wave
      });
    });
  }
}

// Mix in all modules
Object.assign(GameScene.prototype, GameEffects, GameHUD, GameEntities);
