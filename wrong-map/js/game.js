// Wrong Map - Core Gameplay Scene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG);
    this.gameOver = false;
    this.stageTransitioning = false;
    this.inputLocked = false;
    this.paused = false;
    this.roomStartTime = Date.now();
    this.lastInputTime = Date.now();
    this.ghostSpawned = false;
    this.ghostActive = false;
    this.ghostBfsTimer = 0;
    this.ghostNextTile = null;
    this.ghostMoveProgress = 0;

    // Generate room
    this.roomData = generateRoom(GameState.room);
    GameState.lastRoom = this.roomData;
    const G = CONFIG.GRID_SIZE;
    const T = CONFIG.TILE_SIZE;

    // Grid offset to center the maze
    this.gridOffsetX = (CONFIG.GAME_WIDTH - G * T) / 2;
    this.gridOffsetY = 65;

    // Render maze tiles
    this.tileSprites = [];
    for (let y = 0; y < G; y++) {
      this.tileSprites[y] = [];
      for (let x = 0; x < G; x++) {
        const isWall = this.roomData.true_grid[y][x] === 1;
        const px = this.gridOffsetX + x * T + T / 2;
        const py = this.gridOffsetY + y * T + T / 2;
        const tile = this.add.rectangle(px, py, T - 2, T - 2, isWall ? CONFIG.COLORS.WALL : CONFIG.COLORS.FLOOR);
        this.tileSprites[y][x] = tile;
      }
    }

    // Exit tile glow
    const ex = this.gridOffsetX + this.roomData.exit.x * T + T / 2;
    const ey = this.gridOffsetY + this.roomData.exit.y * T + T / 2;
    this.exitSprite = this.add.image(ex, ey, 'exit_tile').setScale(T / 44);
    this.tweens.add({ targets: this.exitSprite, scaleX: T / 38, scaleY: T / 38, duration: 800, yoyo: true, repeat: -1 });

    // Player
    this.playerTile = { x: this.roomData.entry.x, y: this.roomData.entry.y };
    const ppx = this.tileToPixel(this.playerTile.x, this.playerTile.y);
    this.player = this.add.image(ppx.x, ppx.y, 'player').setScale(T / 32);
    this.player.setDepth(10);

    // Ghost (hidden until spawn)
    this.ghostTile = { x: this.roomData.entry.x, y: this.roomData.entry.y };
    const gpx = this.tileToPixel(this.ghostTile.x, this.ghostTile.y);
    this.ghost = this.add.image(gpx.x, gpx.y, 'ghost').setScale(T / 36).setAlpha(0);
    this.ghost.setDepth(9);

    // Ghost spawn timer
    let delay = CONFIG.GHOST_DELAY(GameState.room);
    if (CONFIG.isRestRoom(GameState.room)) delay += 2000;
    this.ghostSpawnTimer = this.time.delayedCall(delay, () => {
      this.ghostSpawned = true;
      this.ghostActive = true;
      this.ghost.setAlpha(0.7);
      this.tweens.add({ targets: this.ghost, alpha: 0.7, duration: 300, from: 0 });
      this.playGhostSpawnEffect();
    });

    // Ghost speed
    this.ghostSpeed = CONFIG.GHOST_SPEED(GameState.room);
    // Time between ghost tile moves in ms
    this.ghostMoveInterval = 1000 / this.ghostSpeed;
    this.ghostMoveTimer = 0;

    // D-pad buttons
    this.createDPad();

    // Launch HUD scene
    if (!this.scene.isActive('HUDScene')) {
      this.scene.launch('HUDScene');
    } else {
      this.scene.get('HUDScene').events.emit('refreshHUD');
    }

    // Milestone room warning
    if (CONFIG.isMilestoneRoom(GameState.room)) {
      this.playMilestoneWarning();
    }

    // Visibility handler
    this.visHandler = () => {
      if (document.hidden && !this.gameOver) this.togglePause();
    };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  tileToPixel(tx, ty) {
    return {
      x: this.gridOffsetX + tx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      y: this.gridOffsetY + ty * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2
    };
  }

  createDPad() {
    const cy = CONFIG.GAME_HEIGHT - 80;
    const cx = CONFIG.GAME_WIDTH / 2;
    const sz = 60;
    const gap = 8;
    const dirs = [
      { label: '\u25C0', dx: -1, dy: 0, ox: -(sz + gap), oy: 0 },
      { label: '\u25B6', dx: 1, dy: 0, ox: (sz + gap), oy: 0 },
      { label: '\u25B2', dx: 0, dy: -1, ox: 0, oy: -(sz / 2 + gap) },
      { label: '\u25BC', dx: 0, dy: 1, ox: 0, oy: (sz / 2 + gap) }
    ];

    dirs.forEach(d => {
      const bx = cx + d.ox;
      const by = cy + d.oy;
      const btn = this.add.rectangle(bx, by, sz, sz, 0x1E3A5F, 0.8).setInteractive();
      const txt = this.add.text(bx, by, d.label, { fontSize: '24px', color: CONFIG.HEX.PLAYER }).setOrigin(0.5);
      txt.setDepth(20);
      btn.setDepth(19);
      btn.on('pointerdown', () => {
        this.lastInputTime = Date.now();
        if (!this.inputLocked && !this.gameOver && !this.paused && !this.stageTransitioning) {
          this.movePlayer(d.dx, d.dy);
        }
      });
    });
  }

  movePlayer(dx, dy) {
    const nx = this.playerTile.x + dx;
    const ny = this.playerTile.y + dy;
    const G = CONFIG.GRID_SIZE;

    // Out of bounds = blocked
    if (nx < 0 || nx >= G || ny < 0 || ny >= G) return;

    // Check TRUE grid
    if (this.roomData.true_grid[ny][nx] === 1) {
      // Wall collision = death
      this.playWallHitEffect(nx, ny);
      this.death('wall');
      return;
    }

    // Valid move - lock input during tween
    this.inputLocked = true;
    this.playerTile = { x: nx, y: ny };
    const target = this.tileToPixel(nx, ny);

    // Tile flash effect
    this.flashTile(nx, ny);
    // Move particles
    this.playMoveParticles(this.player.x, this.player.y);
    // Scale punch
    this.playScalePunch(this.player, 1.15, 80);

    this.tweens.add({
      targets: this.player,
      x: target.x, y: target.y,
      duration: CONFIG.MOVE_TWEEN_MS,
      ease: 'Power2',
      onComplete: () => {
        this.inputLocked = false;
        // Check exit
        if (nx === this.roomData.exit.x && ny === this.roomData.exit.y) {
          this.roomComplete();
        }
      }
    });

    // Update minimap in HUD
    if (this.scene.isActive('HUDScene')) {
      this.scene.get('HUDScene').events.emit('updateMinimap', this.playerTile, this.ghostTile);
    }
  }

  roomComplete() {
    if (this.stageTransitioning || this.gameOver) return;
    this.stageTransitioning = true;

    // Calculate score
    const elapsed = Date.now() - this.roomStartTime;
    GameState.streak++;
    const mult = Math.min(GameState.streak, CONFIG.SCORE.STREAK_MAX);
    let pts = CONFIG.SCORE.EXIT * mult;
    if (elapsed < CONFIG.SCORE.SPEED_THRESHOLD) pts += CONFIG.SCORE.SPEED_BONUS * mult;

    // Clutch bonus: ghost within 3 tiles
    if (this.ghostSpawned) {
      const dist = bfsDistance(this.ghostTile, this.playerTile, this.roomData.true_grid);
      if (dist <= 3) pts += CONFIG.SCORE.CLUTCH_BONUS * mult;
    }

    GameState.score += pts;
    // Effects
    this.playExitEffect(this.player.x, this.player.y, pts);

    this.time.delayedCall(500, () => {
      GameState.room++;
      this.scene.restart();
    });
  }

  death(cause) {
    if (this.gameOver) return;
    this.gameOver = true;
    GameState.deathCount++;

    if (cause === 'wall') {
      this.playWallDeathEffect();
    } else {
      this.playGhostDeathEffect();
    }

    const isNewBest = GameState.saveHighScore();

    this.time.delayedCall(1000, () => {
      this.scene.stop('HUDScene');
      this.scene.stop('GameScene');
      this.scene.start('DeathScene', { cause, isNewBest });
    });
  }

  update(time, delta) {
    if (this.gameOver || this.paused || this.stageTransitioning) return;

    // Inactivity death
    if (Date.now() - this.lastInputTime > CONFIG.INACTIVITY_LIMIT) {
      this.death('ghost');
      return;
    }

    // Ghost movement
    if (this.ghostActive) {
      this.ghostBfsTimer += delta;
      this.ghostMoveTimer += delta;

      // Recalculate path every 500ms
      if (this.ghostBfsTimer >= CONFIG.GHOST_BFS_INTERVAL) {
        this.ghostBfsTimer = 0;
        this.ghostNextTile = bfsNextStep(this.ghostTile, this.playerTile, this.roomData.true_grid);
      }

      // Move ghost
      if (this.ghostNextTile && this.ghostMoveTimer >= this.ghostMoveInterval) {
        this.ghostMoveTimer = 0;
        this.ghostTile = { x: this.ghostNextTile.x, y: this.ghostNextTile.y };
        const gp = this.tileToPixel(this.ghostTile.x, this.ghostTile.y);
        this.tweens.add({ targets: this.ghost, x: gp.x, y: gp.y, duration: 200, ease: 'Linear' });

        // Recalculate immediately after move
        this.ghostNextTile = bfsNextStep(this.ghostTile, this.playerTile, this.roomData.true_grid);

        // Check collision
        if (this.ghostTile.x === this.playerTile.x && this.ghostTile.y === this.playerTile.y) {
          this.death('ghost');
          return;
        }
      }

      // Ghost proximity flicker
      const dist = Math.abs(this.ghostTile.x - this.playerTile.x) + Math.abs(this.ghostTile.y - this.playerTile.y);
      if (dist <= 3 && !this.ghostFlickering) {
        this.ghostFlickering = true;
        this.ghostFlickerTween = this.tweens.add({
          targets: this.ghost, alpha: 0.9, duration: 200, yoyo: true, repeat: -1
        });
      } else if (dist > 3 && this.ghostFlickering) {
        this.ghostFlickering = false;
        if (this.ghostFlickerTween) this.ghostFlickerTween.stop();
        this.ghost.setAlpha(0.7);
      }

      // Update HUD ghost distance bar
      if (this.scene.isActive('HUDScene')) {
        this.scene.get('HUDScene').events.emit('updateGhostBar', dist);
      }
    }
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.physics && this.physics.pause && this.physics.pause();
      if (this.scene.isActive('HUDScene')) {
        this.scene.get('HUDScene').events.emit('showPause');
      }
    } else {
      this.physics && this.physics.resume && this.physics.resume();
    }
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}
