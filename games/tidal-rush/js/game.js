// GameScene - Core gameplay: player, platforms, water, input

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.currentStage = 1;
    this.score = 0;
    this.combo = 0;
    this.isDead = false;
    this.lastInputTime = this.time.now;
    this.jumpStartTime = 0;
    this.isHolding = false;
    this.onGround = false;
    this.lastPlatformIndex = -1;
    this.bossActive = false;
    this.bossTimer = 0;
    this.waterPaused = 0;

    this.cameras.main.setBackgroundColor(CONFIG.COLORS.SKY_TOP);

    // Sky gradient bg (fixed to camera)
    const gfx = this.add.graphics();
    gfx.fillGradientStyle(0xFF6B35, 0xFF6B35, 0xF7931E, 0xF7931E, 1);
    gfx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    gfx.setDepth(-10);
    gfx.setScrollFactor(0);

    // Clouds (parallax via scrollFactor)
    for (let i = 0; i < 8; i++) {
      const c = this.add.ellipse(i * 150, 60 + Math.random() * 80,
        60 + Math.random() * 40, 20 + Math.random() * 15, 0xFFFFFF, 0.2);
      c.setDepth(-5).setScrollFactor(0.2, 0);
    }

    // Water (scrollFactor 0, screen-relative)
    this.waterY = CONFIG.WATER_START_Y;
    this.waterBody = this.add.rectangle(CONFIG.WIDTH / 2, 0, CONFIG.WIDTH + 20, 400, 0x023E8A)
      .setScrollFactor(0).setDepth(5).setOrigin(0.5, 0);
    this.waterSurface = this.add.rectangle(CONFIG.WIDTH / 2, 0, CONFIG.WIDTH + 20, 24, 0x0077B6)
      .setScrollFactor(0).setDepth(6).setOrigin(0.5, 0);

    this.foamCircles = [];
    for (let i = 0; i < 8; i++) {
      const fc = this.add.circle(i * 50 + 20, 0,
        2 + Math.random() * 3, 0xADE8F4, 0.7).setScrollFactor(0).setDepth(7);
      this.foamCircles.push(fc);
    }

    // Platform pool
    this.platformPool = this.physics.add.staticGroup();
    this.activePlatforms = [];

    // Player
    this.player = this.physics.add.sprite(80, CONFIG.HEIGHT - 250, 'player');
    this.player.setDisplaySize(CONFIG.PLAYER_WIDTH, CONFIG.PLAYER_HEIGHT);
    this.player.body.setSize(CONFIG.PLAYER_WIDTH - 4, CONFIG.PLAYER_HEIGHT - 2);
    this.player.setDepth(10);
    this.player.body.setGravityY(CONFIG.GRAVITY);

    this.physics.add.collider(this.player, this.platformPool, this.onLandPlatform, null, this);

    this.loadStage(this.currentStage);
    this.hud = new HUDManager(this);

    // Input
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointerup', this.onPointerUp, this);

    // Camera
    this.cameras.main.startFollow(this.player, false, 0.1, 0.05, -CONFIG.CAMERA_LEAD_X, 0);
    this.cameras.main.setBounds(-100, 0, 999999, CONFIG.HEIGHT);

    // Particle texture
    if (!this.textures.exists('particle')) {
      const pg = this.make.graphics({ add: false });
      pg.fillStyle(0xFFFFFF);
      pg.fillCircle(4, 4, 4);
      pg.generateTexture('particle', 8, 8);
      pg.destroy();
    }

    SoundManager.startAmbient();

    // Visibility handling
    this.visHandler = () => {
      if (document.hidden) this.scene.pause();
      else this.scene.resume();
    };
    document.addEventListener('visibilitychange', this.visHandler);
    this.events.on('shutdown', this.shutdown, this);
  }

  loadStage(stageNum) {
    const stageData = generateStage(stageNum);
    this.stageData = stageData;
    this.stageDiff = getStageDifficulty(stageNum);
    this.platformsInStage = stageData.platforms;
    this.nextPlatformIdx = 0;
    this.stageStartX = this.player ? this.player.x : 0;

    if (stageData.isBoss) { this.bossActive = false; this.bossTimer = 0; }
    if (stageData.isRest) { this.waterPaused = 5000; }

    this.spawnPlatformsAhead();
  }

  spawnPlatformsAhead() {
    const camRight = this.cameras.main.scrollX + CONFIG.WIDTH + 200;
    while (this.nextPlatformIdx < this.platformsInStage.length) {
      const pd = this.platformsInStage[this.nextPlatformIdx];
      const worldX = this.stageStartX + pd.x;
      if (worldX > camRight) break;
      this.spawnPlatform(pd, worldX);
      this.nextPlatformIdx++;
    }
  }

  spawnPlatform(pd, worldX) {
    const p = this.platformPool.create(worldX, pd.y, 'platform-' + pd.type);
    if (!p) return;
    p.setDisplaySize(pd.width, CONFIG.PLATFORM_HEIGHT);
    p.body.setSize(pd.width, CONFIG.PLATFORM_HEIGHT);
    p.body.updateFromGameObject();
    p.setDepth(3);
    p.platData = {
      type: pd.type, sinkMs: pd.sinkMs, landed: false, sinking: false,
      moveSpeed: pd.moveSpeed, moveRange: pd.moveRange,
      originX: worldX, originY: pd.y, index: pd.index, movePhase: 0
    };
    this.activePlatforms.push(p);
  }

  onPointerDown() {
    if (this.isDead) return;
    this.lastInputTime = this.time.now;
    this.jumpStartTime = this.time.now;
    this.isHolding = true;
    this.hud.hideInactivityWarning();
    if (this.onGround) this.doJump(false);
  }

  onPointerUp() {
    if (this.isDead) return;
    this.isHolding = false;
  }

  update(time, delta) {
    if (this.isDead) return;
    const diff = this.stageDiff;

    this.player.body.setVelocityX(diff.runSpeed);

    // Hold-jump
    if (this.isHolding && this.onGround && (time - this.jumpStartTime) > CONFIG.HOLD_THRESHOLD_MS) {
      this.doJump();
    }

    // Air stretch
    if (!this.player.body.touching.down) {
      this.onGround = false;
      this.player.setScale(this.player.body.velocity.y < -100 ? 0.85 : 1,
        this.player.body.velocity.y < -100 ? 1.15 : 1);
    }

    // Water rise
    if (this.waterPaused > 0) { this.waterPaused -= delta; }
    else {
      let riseRate = diff.waterRise;
      if (this.stageData && this.stageData.isBoss) {
        this.bossTimer += delta;
        if (this.bossTimer > 5000 && this.bossTimer < 15000) {
          if (!this.bossActive) {
            this.bossActive = true;
            SoundManager.playBossSurge();
            const bf = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2,
              CONFIG.WIDTH, CONFIG.HEIGHT, 0xFF6B35, 0.4).setScrollFactor(0).setDepth(80);
            this.tweens.add({ targets: bf, alpha: 0, duration: 300, onComplete: () => bf.destroy() });
          }
          riseRate *= 2;
        } else if (this.bossTimer >= 15000) { this.bossActive = false; }
      }
      this.waterY -= riseRate * (delta / 1000);
    }

    // Water visuals
    const screenWaterY = this.waterY - this.cameras.main.scrollY;
    this.waterSurface.setY(screenWaterY);
    this.waterBody.setY(screenWaterY + 24);
    const waveT = time / 500;
    this.foamCircles.forEach((fc, i) => {
      fc.setY(screenWaterY - 4 + Math.sin(waveT + i * 1.2) * 5);
    });

    // Death checks
    if (this.player.y + CONFIG.PLAYER_HEIGHT / 2 >= this.waterY) { this.triggerDeath('water'); return; }
    if (this.player.y > CONFIG.HEIGHT + 50) { this.triggerDeath('fall'); return; }

    // Water warning
    const waterDist = this.waterY - (this.player.y + CONFIG.PLAYER_HEIGHT / 2);
    this.hud.showWaterWarning(waterDist < 100);
    if (waterDist < 50) this.cameras.main.shake(100, 0.001);

    // Inactivity
    const idleSecs = (time - this.lastInputTime) / 1000;
    if (idleSecs >= CONFIG.INACTIVITY_DEATH_SECONDS) { this.triggerDeath('inactivity'); return; }
    if (idleSecs >= CONFIG.INACTIVITY_WARN_SECONDS) {
      this.hud.showInactivityWarning(CONFIG.INACTIVITY_DEATH_SECONDS - idleSecs);
    } else { this.hud.hideInactivityWarning(); }

    // Moving platforms
    this.activePlatforms.forEach(p => {
      if (!p.active) return;
      const pd = p.platData;
      if (pd.type === 'moving' && !pd.sinking) {
        pd.movePhase += delta / 1000;
        p.setX(pd.originX + Math.sin(pd.movePhase * pd.moveSpeed * 0.1) * pd.moveRange);
        p.body.updateFromGameObject();
      }
    });

    // Recycle off-screen platforms
    const camLeft = this.cameras.main.scrollX - 100;
    for (let i = this.activePlatforms.length - 1; i >= 0; i--) {
      if (this.activePlatforms[i].x + this.activePlatforms[i].displayWidth / 2 < camLeft) {
        this.recyclePlatform(this.activePlatforms[i]);
      }
    }

    this.spawnPlatformsAhead();

    // Stage completion check
    if (this.nextPlatformIdx >= this.platformsInStage.length) {
      if (this.activePlatforms.length === 0) { this.completeStage(); }
      else {
        const lastPlat = this.platformsInStage[this.platformsInStage.length - 1];
        if (this.player.x > this.stageStartX + lastPlat.x + lastPlat.width + 50) {
          this.completeStage();
        }
      }
    }
  }

  shutdown() {
    document.removeEventListener('visibilitychange', this.visHandler);
    SoundManager.stopAmbient();
    if (this.hud) this.hud.destroy();
  }
}
