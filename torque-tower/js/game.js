// Torque Tower - Core Game Scene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.score = 0;
    this.stage = 1;
    this.blockIndex = 0;
    this.blocksLanded = 0;
    this.towerTilt = 0;
    this.combo = 0;
    this.perfectsThisStage = 0;
    this.gameOver = false;
    this.stageTransitioning = false;
    this.activeBlock = null;
    this.blockInFlight = false;
    this.landedBlocks = [];
    this.towerTopY = GAME_HEIGHT - 40;
    this.lastInputTime = Date.now();
    this.holdingLeft = false;
    this.holdingRight = false;
    this.lastTapTime = 0;
    this.tapCount = 0;

    this.cameras.main.setBackgroundColor(COLORS.bgNum);
    this.matter.world.setBounds(0, -5000, GAME_WIDTH, 5640);

    // Platform
    this.platform = this.matter.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'platform', null, { isStatic: true });

    // Camera marker
    this.towerMarker = this.add.rectangle(GAME_WIDTH / 2, this.towerTopY - 250, 1, 1, 0x000000, 0);
    this.cameras.main.startFollow(this.towerMarker, false, 1, 0.05);

    this.createHUD();
    this.setupInput();

    this.visHandler = () => { if (document.hidden && !this.gameOver) this.pauseGame(); };
    document.addEventListener('visibilitychange', this.visHandler);

    this.time.delayedCall(500, () => this.spawnBlock());
  }

  setupInput() {
    this.input.on('pointerdown', (pointer) => {
      if (this.gameOver) return;
      this.lastInputTime = Date.now();
      if (pointer.y < 48) return;

      if (pointer.x < GAME_WIDTH / 2) {
        this.holdingLeft = true;
        this.applyTorque(-1);
      } else {
        this.holdingRight = true;
        this.applyTorque(1);
      }
    });
    this.input.on('pointerup', () => {
      this.holdingLeft = false;
      this.holdingRight = false;
    });
  }

  applyTorque(direction) {
    if (!this.activeBlock || !this.blockInFlight || this.gameOver) return;
    const bt = BLOCK_TYPES[this.activeBlockType];
    const impulse = TAP_IMPULSE * bt.torqueMult * direction;
    const rad = impulse * Math.PI / 180;
    this.activeBlock.setAngularVelocity(this.activeBlock.body.angularVelocity + rad);

    this.spawnTapParticles(this.activeBlock.x, this.activeBlock.y, direction, bt.color);
    this.tweens.add({ targets: this.activeBlock, scaleX: 1.08, scaleY: 1.08, duration: 40, yoyo: true, ease: 'Quad.easeOut' });

    const now = Date.now();
    if (now - this.lastTapTime < 500) { this.tapCount = Math.min(this.tapCount + 1, 5); }
    else { this.tapCount = 0; }
    this.lastTapTime = now;
  }

  spawnBlock() {
    if (this.gameOver || this.stageTransitioning) return;
    const type = getBlockTypeForStage(this.stage, this.blockIndex);
    const bt = BLOCK_TYPES[type];
    this.activeBlockType = type;

    const spawnY = this.towerTopY - 350;
    this.activeBlock = this.matter.add.image(GAME_WIDTH / 2, spawnY, type, null, {
      friction: 0.8, frictionStatic: 1, restitution: 0.05, density: 0.002
    });
    this.activeBlock.setFixedRotation();
    this.activeBlock.body.inertia = Infinity;
    this.activeBlock.body.inverseInertia = 0;

    const spin = generateBlockSpin(this.stage, this.blockIndex);
    this.activeBlock.setAngularVelocity(spin * Math.PI / 180);
    this.activeBlock.body.inertia = bt.torqueMult < 1 ? 200 : (bt.torqueMult > 1 ? 20 : 80);
    this.activeBlock.body.inverseInertia = 1 / this.activeBlock.body.inertia;

    const config = getStageConfig(this.stage);
    const fallSpeed = (this.towerTopY - spawnY + 350) / (config.fallDuration / 1000);
    this.activeBlock.setVelocityY(fallSpeed / 60);

    this.activeBlock.setAlpha(0).setScale(0.8);
    this.tweens.add({ targets: this.activeBlock, alpha: 1, scaleX: 1, scaleY: 1, duration: 100 });

    this.blockInFlight = true;
  }

  update(time, delta) {
    if (this.gameOver) return;

    if (Date.now() - this.lastInputTime > INACTIVITY_TIMEOUT) {
      this.triggerCollapse();
      return;
    }

    if (this.blockInFlight && this.activeBlock) {
      const dt = delta / 1000;
      const bt = BLOCK_TYPES[this.activeBlockType];
      if (this.holdingLeft) {
        this.activeBlock.setAngularVelocity(this.activeBlock.body.angularVelocity + (-HOLD_TORQUE * bt.torqueMult * Math.PI / 180 * dt));
      }
      if (this.holdingRight) {
        this.activeBlock.setAngularVelocity(this.activeBlock.body.angularVelocity + (HOLD_TORQUE * bt.torqueMult * Math.PI / 180 * dt));
      }

      if (this.activeBlock.y >= this.towerTopY - 10) {
        this.evaluateLanding();
      }

      if (this.activeBlock.x < 30) this.activeBlock.setVelocityX(2);
      if (this.activeBlock.x > GAME_WIDTH - 30) this.activeBlock.setVelocityX(-2);
    }

    // Tower wobble
    if (this.towerTilt > TILT_THRESHOLDS.warning) {
      const amp = this.towerTilt > TILT_THRESHOLDS.danger ? 8 : 2;
      const freq = this.towerTilt > TILT_THRESHOLDS.danger ? 12 : 8;
      this.landedBlocks.forEach(b => {
        if (b && b.active) b.x = b.getData('origX') + Math.sin(time / 1000 * freq * Math.PI * 2) * amp;
      });
    }

    if (this.hintText && this.stage > 3) {
      this.hintText.setAlpha(Math.max(0, this.hintText.alpha - 0.02));
    }
  }

  evaluateLanding() {
    if (!this.blockInFlight || !this.activeBlock || this.gameOver) return;
    this.blockInFlight = false;

    const angle = Math.abs(normalizeAngle(this.activeBlock.rotation));
    const flatAngle = angle > 90 ? 180 - angle : angle;

    this.activeBlock.setStatic(true);
    this.activeBlock.setData('origX', this.activeBlock.x);
    this.landedBlocks.push(this.activeBlock);
    this.blocksLanded++;

    let points = 0, quality = '';

    if (flatAngle <= TOLERANCE.perfect) {
      points = SCORE_VALUES.perfect;
      quality = 'perfect';
      this.combo++;
      this.perfectsThisStage++;
      if (this.combo >= 3) points *= 2;
      else if (this.combo >= 2) points = Math.floor(points * 1.5);
      this.showPerfectEffects();
    } else if (flatAngle <= TOLERANCE.good) {
      points = SCORE_VALUES.good; quality = 'good'; this.combo = 0;
      this.showGoodEffects();
    } else if (flatAngle <= TOLERANCE.bad) {
      points = SCORE_VALUES.bad; quality = 'bad'; this.combo = 0;
      this.towerTilt += flatAngle; this.showBadEffects();
    } else {
      points = SCORE_VALUES.veryBad; quality = 'veryBad'; this.combo = 0;
      this.towerTilt += flatAngle; this.showBadEffects();
    }

    this.score += points;
    this.updateHUD();
    if (points > 0) this.showScoreFloat(this.activeBlock.x, this.activeBlock.y, points, quality);
    this.updateTiltMeter();

    if (this.towerTilt >= TILT_THRESHOLDS.collapse) {
      this.triggerCollapse();
      return;
    }

    this.towerTopY -= 20;
    this.tweens.add({ targets: this.towerMarker, y: this.towerTopY - 250, duration: 300, ease: 'Power2' });

    if (this.blocksLanded % SCORE_VALUES.milestoneEvery === 0) {
      this.score += SCORE_VALUES.milestone;
      this.showScoreFloat(GAME_WIDTH / 2, this.towerTopY, SCORE_VALUES.milestone, 'milestone');
      this.updateHUD();
    }

    this.blockIndex++;
    if (this.blockIndex >= BLOCKS_PER_STAGE && !this.stageTransitioning) {
      this.stageTransitioning = true;
      this.completeStage();
    } else {
      this.time.delayedCall(INTER_BLOCK_DELAY, () => this.spawnBlock());
    }
  }

  completeStage() {
    let bonus = SCORE_VALUES.stageBonus + this.stage * SCORE_VALUES.stageBonusPerStage;
    if (this.perfectsThisStage >= BLOCKS_PER_STAGE) bonus += SCORE_VALUES.perfectStage;
    this.score += bonus;
    this.updateHUD();

    const banner = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'STAGE ' + this.stage + '\nCLEAR!', {
      fontSize: '26px', fontFamily: 'Courier New', fill: COLORS.accent, fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setScale(0);

    this.tweens.add({
      targets: banner, scale: 1.1, duration: 200, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: banner, scale: 1, duration: 100, onComplete: () => {
          this.time.delayedCall(600, () => {
            this.tweens.add({ targets: banner, y: -50, alpha: 0, duration: 300, onComplete: () => {
              banner.destroy();
              this.stage++; this.blockIndex = 0; this.perfectsThisStage = 0;
              this.stageTransitioning = false;
              this.stageText.setText('STAGE ' + this.stage);
              this.spawnBlock();
            }});
          });
        }});
      }
    });
  }

  triggerCollapse() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.blockInFlight = false;

    this.time.delayedCall(0, () => {
      this.landedBlocks.forEach((block, i) => {
        if (block && block.active) {
          block.setStatic(false);
          block.setVelocity((Math.random() - 0.5) * 9, -(Math.random() * 6 + 3));
          block.setAngularVelocity((Math.random() - 0.5) * 0.3);
          this.tweens.add({ targets: block, alpha: 0, duration: 200, delay: i * 50 + 600 });
        }
      });
    });

    this.cameras.main.shake(800, 0.015);

    const vignette = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFF0000, 0)
      .setScrollFactor(0).setDepth(140);
    this.tweens.add({ targets: vignette, alpha: 0.4, duration: 300 });

    this.time.delayedCall(1200, () => {
      this.scene.launch('GameOverScene', { score: this.score, stage: this.stage, blocks: this.blocksLanded });
    });
  }

  pauseGame() {
    if (this.gameOver) return;
    this.scene.pause();
    this.showPauseOverlay();
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}

// Mixin effects methods onto GameScene prototype
Object.assign(GameScene.prototype, GameEffects);
