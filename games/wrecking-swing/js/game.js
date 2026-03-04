// Wrecking Swing - Core Gameplay Scene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG);
    Object.assign(this, { stageScore: 0, swingsUsed: 0, chainCount: 0, lastHitTime: 0,
      ballReleased: false, ballSettling: false, blocksDestroyed: 0, totalBlocks: 0,
      paused: false, hitStopActive: false, chainText: null, trailSprites: [], blockBodies: [] });
    this.swingsLeft = window.WS.swingsLeft || CONFIG.SWING_COUNT;
    this.lastTapTime = this.time.now;
    const stageData = StageGenerator.generateTower(window.WS.stage);
    if (stageData.isBoss) this.swingsLeft = 1;
    this.pendulumArc = stageData.pendulumArc;
    this.pendulumSpeed = stageData.pendulumSpeed;

    // Ground
    this.matter.add.rectangle(CONFIG.GAME_WIDTH / 2, CONFIG.GROUND_Y,
      CONFIG.GAME_WIDTH, CONFIG.PLATFORM_HEIGHT,
      { isStatic: true, friction: CONFIG.PHYSICS.GROUND_FRICTION, restitution: 0, label: 'ground' });
    this.matter.add.rectangle(-10, CONFIG.GAME_HEIGHT / 2, 20, CONFIG.GAME_HEIGHT, { isStatic: true, label: 'wall' });
    this.matter.add.rectangle(CONFIG.GAME_WIDTH + 10, CONFIG.GAME_HEIGHT / 2, 20, CONFIG.GAME_HEIGHT, { isStatic: true, label: 'wall' });
    this.add.rectangle(CONFIG.GAME_WIDTH / 2, CONFIG.GROUND_Y, CONFIG.GAME_WIDTH, CONFIG.PLATFORM_HEIGHT, CONFIG.COLORS.GROUND);

    // Tower blocks
    this.spawnBlocks(stageData.blocks);

    // Graphics layers
    this.craneGraphics = this.add.graphics();
    this.cableGraphics = this.add.graphics();
    this.ballSprite = this.add.graphics();
    this.idleGraphics = this.add.graphics();

    // Crane pivot
    this.craneX = CONFIG.GAME_WIDTH / 2;
    this.craneY = CONFIG.CRANE_Y;
    this.cableLength = CONFIG.CABLE_LENGTH_BASE;

    // Ball body (collision disabled initially)
    this.ballBody = this.matter.add.circle(this.craneX, this.craneY + this.cableLength, CONFIG.BALL_RADIUS, {
      restitution: CONFIG.PHYSICS.BALL_RESTITUTION, friction: CONFIG.PHYSICS.BALL_FRICTION,
      frictionAir: 0, density: CONFIG.PHYSICS.BALL_DENSITY, label: 'ball',
      collisionFilter: { category: 0x0002, mask: 0 }
    });

    // Pendulum
    this.pendulumAngle = 0;
    this.startPendulum();

    Effects.drawCrane(this.craneGraphics);
    HUD.create(this);

    this.input.on('pointerdown', this.onTap, this);
    this.matter.world.on('collisionstart', this.onCollision, this);
    SoundManager.play('uiTap');
  }

  startPendulum() {
    if (this.pendulumTween) this.pendulumTween.stop();
    this.pendulumAngle = -1.0;
    this.pendulumTween = this.tweens.add({
      targets: this, pendulumAngle: 1.0,
      duration: this.pendulumSpeed * 1000,
      ease: 'Sine.easeInOut', yoyo: true, repeat: -1
    });
  }

  spawnBlocks(blockDefs) {
    this.totalBlocks = blockDefs.length;
    blockDefs.forEach(def => {
      const body = this.matter.add.rectangle(def.x, def.y, CONFIG.BLOCK_W, CONFIG.BLOCK_H, {
        restitution: CONFIG.PHYSICS.BLOCK_RESTITUTION, friction: CONFIG.PHYSICS.BLOCK_FRICTION,
        frictionAir: CONFIG.PHYSICS.BLOCK_FRICTION_AIR, density: CONFIG.PHYSICS.BLOCK_DENSITY, label: 'block'
      });
      body.blockType = def.type;
      body.hitCount = 0;
      body.toRemove = false;
      const color = def.type === 'armored' ? CONFIG.COLORS.BLOCK_ARMORED : CONFIG.COLORS.BLOCK_NORMAL;
      const stroke = def.type === 'armored' ? CONFIG.COLORS.BLOCK_ARMORED_STROKE : CONFIG.COLORS.BLOCK_NORMAL_STROKE;
      const sprite = this.add.rectangle(def.x, def.y, CONFIG.BLOCK_W, CONFIG.BLOCK_H, color);
      sprite.setStrokeStyle(2, stroke);
      body.gameObject = sprite;
      this.blockBodies.push(body);
    });
  }

  showPause() { HUD.showPause(this); }
  updateSwingDots() { HUD.updateSwingDots(this); }

  onTap() {
    if (this.paused || this.hitStopActive || this.ballReleased) return;
    this.releaseBall(false);
  }

  releaseBall(isIdle) {
    this.ballReleased = true;
    this.lastTapTime = this.time.now;
    if (this.pendulumTween) this.pendulumTween.stop();

    const arcRad = (this.pendulumAngle * this.pendulumArc / 2) * (Math.PI / 180);
    const speed = CONFIG.BALL_RELEASE_SPEED;
    const vx = Math.sin(arcRad) * speed;
    const vy = Math.cos(arcRad) * speed * 0.4;

    const MatterBody = Phaser.Physics.Matter.Matter.Body;
    MatterBody.set(this.ballBody, 'collisionFilter', { category: 0x0002, mask: -1 });
    this.matter.body.setVelocity(this.ballBody, { x: vx / 60, y: vy / 60 });

    this.tweens.add({ targets: this.ballSprite, scaleX: 1.15, scaleY: 1.15, duration: 60, yoyo: true });
    SoundManager.play(isIdle ? 'autoRelease' : 'release');

    if (isIdle) {
      this.addScore(CONFIG.SCORE_IDLE_PENALTY, { x: CONFIG.GAME_WIDTH / 2, y: 100 });
      this.cameras.main.flash(300, 200, 60, 20);
    }

    this.swingsUsed++;
    this.swingsLeft--;
    this.updateSwingDots();
    this.time.delayedCall(500, () => { this.ballSettling = true; });
  }

  onCollision(event) {
    event.pairs.forEach(pair => {
      const a = pair.bodyA, b = pair.bodyB;
      const isBallA = a.label === 'ball', isBallB = b.label === 'ball';
      const blockBody = (isBallA && b.label === 'block') ? b : (isBallB && a.label === 'block') ? a : null;

      if ((isBallA || isBallB) && blockBody && !blockBody.toRemove) {
        this.handleBlockHit(blockBody);
      }

      // Block-block chain
      if (a.label === 'block' && b.label === 'block') {
        const spd = Math.abs(a.velocity.x) + Math.abs(a.velocity.y) + Math.abs(b.velocity.x) + Math.abs(b.velocity.y);
        if (spd > 8 && !a.toRemove && a.blockType !== 'armored') {
          this.destroyBlock(a, true);
        }
      }
    });
  }

  handleBlockHit(blockBody) {
    if (blockBody.blockType === 'armored' && blockBody.hitCount === 0) {
      blockBody.hitCount = 1;
      blockBody.blockType = 'cracked';
      if (blockBody.gameObject) {
        blockBody.gameObject.fillColor = CONFIG.COLORS.BLOCK_CRACKED;
        blockBody.gameObject.setStrokeStyle(2, CONFIG.COLORS.BLOCK_CRACKED_STROKE);
      }
      SoundManager.play('armorHit');
      this.cameras.main.shake(100, 0.003);
      return;
    }
    this.destroyBlock(blockBody, false);
  }

  destroyBlock(blockBody, isChain) {
    if (blockBody.toRemove) return;
    blockBody.toRemove = true;
    const pos = { x: blockBody.position.x, y: blockBody.position.y };

    if (this.blocksDestroyed === 0 && !this.hitStopActive) {
      this.hitStopActive = true;
      this.matter.world.pause();
      this.time.delayedCall(40, () => { this.matter.world.resume(); this.hitStopActive = false; });
    }

    this.time.delayedCall(0, () => {
      if (blockBody.gameObject) blockBody.gameObject.destroy();
      this.matter.world.remove(blockBody);
      this.blocksDestroyed++;

      const now = this.time.now;
      this.chainCount = (now - this.lastHitTime < CONFIG.CHAIN_WINDOW) ? this.chainCount + 1 : 1;
      this.lastHitTime = now;

      let pts = pos.y < CONFIG.GROUND_Y - 100 ? CONFIG.SCORE_AIR_BLOCK : CONFIG.SCORE_BLOCK;
      if (isChain || this.chainCount > 1) {
        pts += CONFIG.SCORE_CHAIN * (1 + CONFIG.CHAIN_MULTIPLIER_STEP * Math.min(this.chainCount, CONFIG.MAX_CHAIN));
      }
      this.addScore(pts, pos);
      Effects.spawnDestructionParticles(this, pos, isChain);

      const shakeI = 0.004 + Math.min(this.chainCount, 8) * 0.001;
      this.cameras.main.shake(220, shakeI);
      SoundManager.play('blockHit', this.chainCount);

      if (this.chainCount >= 2) Effects.showChainText(this, this.chainCount);

      if (this.blocksDestroyed / this.totalBlocks > 0.8) {
        this.cameras.main.zoomTo(1.04, 150, 'Quad.easeOut', false, (c, p) => {
          if (p === 1) this.cameras.main.zoomTo(1.0, 200);
        });
      }
    });
  }

  addScore(pts, pos) {
    this.stageScore += pts;
    window.WS.score += pts;
    this.scoreText.setText(window.WS.score.toLocaleString());
    this.tweens.add({ targets: this.scoreText, scaleX: 1.25, scaleY: 1.25, duration: 80, yoyo: true });
    Effects.showFloatingScore(this, pts, pos);
  }

  update(time) {
    if (this.paused) return;

    if (!this.ballReleased) {
      const arcRad = (this.pendulumAngle * this.pendulumArc / 2) * (Math.PI / 180);
      const bx = this.craneX + Math.sin(arcRad) * this.cableLength;
      const by = this.craneY + Math.cos(arcRad) * this.cableLength;
      const MB = Phaser.Physics.Matter.Matter.Body;
      MB.setPosition(this.ballBody, { x: bx, y: by });
      MB.setVelocity(this.ballBody, { x: 0, y: 0 });

      Effects.drawCable(this.cableGraphics, this.craneX, this.craneY, bx, by);
      Effects.drawBall(this.ballSprite, bx, by);

      const elapsed = time - this.lastTapTime;
      if (elapsed >= CONFIG.IDLE_WARNING) {
        const progress = Math.min(1, (elapsed - CONFIG.IDLE_WARNING) / (CONFIG.IDLE_TIMEOUT - CONFIG.IDLE_WARNING));
        Effects.drawIdleRing(this.idleGraphics, bx, by, progress);
        if (elapsed >= CONFIG.IDLE_TIMEOUT) this.releaseBall(true);
      } else {
        this.idleGraphics.clear();
      }
    } else {
      const bp = this.ballBody.position;
      Effects.drawBall(this.ballSprite, bp.x, bp.y);
      this.cableGraphics.clear();
      Effects.addTrail(this, bp.x, bp.y);

      this.blockBodies.forEach(body => {
        if (!body.toRemove && body.gameObject) {
          body.gameObject.x = body.position.x;
          body.gameObject.y = body.position.y;
          body.gameObject.rotation = body.angle;
        }
      });

      if (bp.y > CONFIG.GAME_HEIGHT + 50 || bp.x < -50 || bp.x > CONFIG.GAME_WIDTH + 50) {
        this.onSwingEnd();
      }

      if (this.ballSettling) {
        const allSlow = this.blockBodies.every(b =>
          b.toRemove || (Math.abs(b.velocity.x) < CONFIG.SETTLE_THRESHOLD && Math.abs(b.velocity.y) < CONFIG.SETTLE_THRESHOLD));
        if (allSlow && bp.y > CONFIG.GROUND_Y) this.onSwingEnd();
      }
      this.idleGraphics.clear();
    }
  }

  onSwingEnd() {
    if (!this.ballReleased) return;
    this.ballReleased = false;
    this.ballSettling = false;
    this.chainCount = 0;
    this.trailSprites.forEach(t => t.destroy());
    this.trailSprites = [];

    const remaining = this.blockBodies.filter(b => !b.toRemove).length;

    if (remaining === 0) {
      let bonus = CONFIG.SCORE_CLEAR;
      const isPerfect = this.swingsUsed === 1;
      const is2Swing = this.swingsUsed === 2;
      if (isPerfect) bonus += CONFIG.SCORE_PERFECT;
      else if (is2Swing) bonus += CONFIG.SCORE_2SWING;
      this.stageScore += bonus;
      window.WS.score += bonus;
      this.scoreText.setText(window.WS.score.toLocaleString());
      this.cameras.main.flash(300, 255, 179, 0);
      this.cameras.main.shake(150, 0.003);
      this.time.delayedCall(400, () => {
        this.scene.start('StageEndScene', {
          stageScore: this.stageScore, stage: window.WS.stage,
          swingsUsed: this.swingsUsed, isPerfect, is2Swing
        });
      });
      return;
    }

    if (this.swingsLeft <= 0) {
      this.time.delayedCall(300, () => {
        this.scene.start('StageEndScene', {
          stageScore: this.stageScore, stage: window.WS.stage,
          swingsUsed: this.swingsUsed, isPerfect: false, is2Swing: false
        });
      });
      return;
    }

    this.resetBall();
  }

  resetBall() {
    const MB = Phaser.Physics.Matter.Matter.Body;
    MB.set(this.ballBody, 'collisionFilter', { category: 0x0002, mask: 0 });
    MB.setVelocity(this.ballBody, { x: 0, y: 0 });
    this.lastTapTime = this.time.now;
    this.blocksDestroyed = 0;
    this.startPendulum();
  }

}
