// Slingshot Stack - Core GameScene

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create(data) {
    this.w = this.scale.width;
    this.h = this.scale.height;
    this.groundY = this.h - 60;
    this.slingshotX = CONFIG.GAMEPLAY.SLINGSHOT_X;
    this.slingshotY = this.groundY - 40;

    // State
    this.score = 0;
    this.blocksStacked = 0;
    this.combo = 0;
    this.misses = 0;
    this.isDragging = false;
    this.isFlinging = false;
    this.isCollapsing = false;
    this.inputDisabled = false;
    this.towerBodies = [];
    this.currentBlock = null;
    this.currentBlockGfx = null;
    this.currentBlockData = null;
    this.settleFrames = 0;
    this.dragStart = { x: 0, y: 0 };
    this.stuckTimer = null;
    this.isPaused = false;
    this.pauseOverlay = null;

    // Continue from rewarded ad
    if (data && data.continueData) {
      this.score = data.continueData.score || 0;
      this.blocksStacked = Math.max(0, (data.continueData.blocksStacked || 1) - 1);
    }

    adManager.resetForNewGame();
    stageManager.reset();

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(CONFIG.COLORS.SKY_TOP, CONFIG.COLORS.SKY_TOP, CONFIG.COLORS.SKY_BOTTOM, CONFIG.COLORS.SKY_BOTTOM, 1);
    bg.fillRect(0, 0, this.w * 2, this.h * 3);
    bg.setScrollFactor(0.5);

    // Ground
    this.matter.add.rectangle(this.w / 2, this.groundY + 30, this.w * 2, 60, {
      isStatic: true, friction: 1, label: 'ground'
    });
    const groundGfx = this.add.graphics();
    groundGfx.fillStyle(CONFIG.COLORS.GROUND);
    groundGfx.fillRect(-this.w, this.groundY, this.w * 4, 200);
    groundGfx.fillStyle(CONFIG.COLORS.GROUND_TOP);
    groundGfx.fillRect(-this.w, this.groundY, this.w * 4, 8);

    // Foundation
    const fbW = 80, fbH = 20;
    this.foundation = this.matter.add.rectangle(this.w / 2, this.groundY - fbH / 2, fbW, fbH, {
      isStatic: true, friction: 1, label: 'foundation'
    });
    const fbGfx = this.add.graphics();
    fbGfx.fillStyle(CONFIG.COLORS.TOWER_BASE);
    fbGfx.fillRoundedRect(this.w / 2 - fbW / 2, this.groundY - fbH, fbW, fbH, 3);

    this.towerTopY = this.groundY - fbH;

    // Slingshot visual
    this.slingshotGfx = this.add.graphics();
    this.drawSlingshot();

    // Band + trajectory layers
    this.bandGfx = this.add.graphics().setDepth(5);
    this.trajectoryGfx = this.add.graphics().setDepth(4);

    // Wind
    this.windGfx = this.add.graphics().setScrollFactor(0).setDepth(50);
    this.windForce = { x: 0, direction: 'none' };

    // HUD
    this.hud = createHUD(this);
    this.hud.scoreTxt.setText('Score: ' + this.score);
    this.hud.heightTxt.setText(this.blocksStacked + '');
    this.hud.pauseBtn.on('pointerdown', () => this.togglePause());

    // Camera
    this.cameras.main.setBounds(0, -2000, this.w, 2000 + this.h);
    this.cameras.main.scrollY = 0;

    // Inactivity
    this.lastInputTime = Date.now();
    this.inactivityTriggered = false;

    // Collision handler
    initEffects(this);

    // Input
    setupSlingshotInput(this);

    // Spawn first block
    this.spawnBlock();
  }

  drawSlingshot() {
    const g = this.slingshotGfx;
    const sx = this.slingshotX, sy = this.slingshotY;
    g.clear();
    g.fillStyle(CONFIG.COLORS.SLINGSHOT_WOOD);
    g.fillRoundedRect(sx - 18, sy - 45, 8, 50, 3);
    g.fillRoundedRect(sx + 10, sy - 45, 8, 50, 3);
    g.fillRoundedRect(sx - 12, sy, 24, 10, 3);
    g.fillRoundedRect(sx - 4, sy + 8, 8, 20, 2);
  }

  spawnBlock() {
    const blockData = stageManager.generateNextBlock(this.blocksStacked);
    this.currentBlockData = blockData;

    const bx = this.slingshotX, by = this.slingshotY - 50;
    this.currentBlock = this.matter.add.rectangle(bx, by, blockData.width, blockData.height, {
      isSensor: true, density: blockData.density,
      friction: blockData.friction, restitution: blockData.restitution,
      frictionAir: CONFIG.PHYSICS.AIR_FRICTION,
      label: 'block_' + this.blocksStacked, ignoreGravity: true
    });

    if (this.currentBlockGfx) this.currentBlockGfx.destroy();
    this.currentBlockGfx = this.add.graphics().setDepth(10);
    this.drawBlock(this.currentBlockGfx, 0, 0, blockData);
    this.currentBlockGfx.setPosition(bx, by);

    this.isFlinging = false;
    this.windForce = stageManager.getWindForce(this.blocksStacked);
    this.drawWindIndicator();
  }

  drawBlock(gfx, x, y, bd) {
    gfx.clear();
    gfx.fillStyle(bd.color);
    gfx.lineStyle(3, bd.strokeColor);
    gfx.fillRoundedRect(x - bd.width / 2, y - bd.height / 2, bd.width, bd.height, 4);
    gfx.strokeRoundedRect(x - bd.width / 2, y - bd.height / 2, bd.width, bd.height, 4);
    gfx.fillStyle(0xFFFFFF, 0.3);
    gfx.fillRoundedRect(x - bd.width / 2 + 4, y - bd.height / 2 + 4, bd.width * 0.35, bd.height * 0.35, 2);
  }

  drawWindIndicator() {
    this.windGfx.clear();
    if (this.windForce.direction === 'none') return;
    const wx = this.w / 2, wy = 75;
    const dir = this.windForce.direction === 'right' ? 1 : -1;
    const len = 20 + Math.abs(this.windForce.x) * 0.4;
    this.windGfx.lineStyle(3, CONFIG.COLORS.WIND_ARROW, 0.5);
    this.windGfx.beginPath();
    this.windGfx.moveTo(wx - dir * len / 2, wy);
    this.windGfx.lineTo(wx + dir * len / 2, wy);
    this.windGfx.strokePath();
    this.windGfx.fillStyle(CONFIG.COLORS.WIND_ARROW, 0.5);
    this.windGfx.fillTriangle(
      wx + dir * len / 2, wy,
      wx + dir * (len / 2 - 8), wy - 6,
      wx + dir * (len / 2 - 8), wy + 6
    );
  }

  update() {
    if (this.isPaused || this.isCollapsing) return;

    // Pin block to slingshot when idle (not dragging, not flung)
    const Body = Phaser.Physics.Matter.Matter.Body;
    if (this.currentBlock && !this.isDragging && !this.isFlinging && this.currentBlock.ignoreGravity) {
      Body.setPosition(this.currentBlock, { x: this.slingshotX, y: this.slingshotY - 50 });
      Body.setVelocity(this.currentBlock, { x: 0, y: 0 });
    }
    // Sync block graphics
    if (this.currentBlock && this.currentBlockGfx && !this.isDragging) {
      this.currentBlockGfx.setPosition(this.currentBlock.position.x, this.currentBlock.position.y);
      this.currentBlockGfx.setRotation(this.currentBlock.angle);
    }
    for (const tb of this.towerBodies) {
      if (tb.gfx && tb.body) {
        tb.gfx.setPosition(tb.body.position.x, tb.body.position.y);
        tb.gfx.setRotation(tb.body.angle);
      }
    }

    // Wind on in-flight block
    if (this.isFlinging && this.currentBlock && this.windForce.x !== 0) {
      Phaser.Physics.Matter.Matter.Body.applyForce(this.currentBlock, this.currentBlock.position, {
        x: this.windForce.x * 0.00001, y: 0
      });
    }

    // Check block settled
    if (!this.isFlinging && this.currentBlock && !this.currentBlock.ignoreGravity && !this.isDragging) {
      if (this.currentBlock.speed < CONFIG.PHYSICS.SETTLE_SPEED) {
        this.settleFrames++;
        if (this.settleFrames >= CONFIG.PHYSICS.SETTLE_FRAMES) this.onBlockSettled();
      } else {
        this.settleFrames = 0;
      }
      if (this.currentBlock.position.y > this.groundY + CONFIG.GAMEPLAY.COLLAPSE_THRESHOLD) {
        onBlockMiss(this);
      }
    }

    // Tower collapse check
    for (const tb of this.towerBodies) {
      if (tb.body && tb.body.position.y > this.groundY + CONFIG.GAMEPLAY.COLLAPSE_THRESHOLD) {
        triggerCollapse(this);
        return;
      }
    }

    // Inactivity
    if (!this.inactivityTriggered && Date.now() - this.lastInputTime > CONFIG.GAMEPLAY.INACTIVITY_TIMEOUT) {
      this.inactivityTriggered = true;
      autoFling(this);
    }

    this.updateCamera();
  }

  onBlockSettled() {
    if (!this.currentBlock) return;
    const block = this.currentBlock;
    const bd = this.currentBlockData;
    const towerCenterX = this.w / 2;
    const isPerfect = Math.abs(block.position.x - towerCenterX) < CONFIG.GAMEPLAY.PERFECT_THRESHOLD;

    // Add to tower
    this.towerBodies.push({ body: block, gfx: this.currentBlockGfx, data: bd });
    this.currentBlock = null;
    this.currentBlockGfx = null;
    this.blocksStacked++;

    // Score calc
    let points = isPerfect ? CONFIG.SCORE.PERFECT : CONFIG.SCORE.LAND;
    points += this.blocksStacked * CONFIG.SCORE.HEIGHT_BONUS;
    if (isPerfect) {
      this.combo++;
      points = Math.floor(points * Math.min(1 + this.combo * CONFIG.SCORE.COMBO_STEP, CONFIG.SCORE.MAX_COMBO));
    } else {
      this.combo = 0;
    }
    this.score += points;

    // Update HUD
    this.hud.scoreTxt.setText('Score: ' + this.score);
    this.hud.heightTxt.setText(this.blocksStacked + '');

    // Effects
    showLandingEffects(this, block, bd, isPerfect, points);
    showCombo(this, this.combo);
    if (this.blocksStacked % 5 === 0 && this.blocksStacked > 0) showHeightMilestone(this);

    this.towerTopY = Math.min(this.towerTopY, block.position.y - bd.height / 2);

    this.time.delayedCall(300, () => {
      if (!this.isCollapsing) this.spawnBlock();
    });
  }

  updateCamera() {
    const targetY = Math.min(0, this.towerTopY - this.h * 0.5);
    this.cameras.main.scrollY += (targetY - this.cameras.main.scrollY) * 0.05;
  }

  togglePause() {
    if (this.isCollapsing) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.matter.world.pause();
      this.showPauseOverlay();
    } else {
      this.matter.world.resume();
      this.hidePauseOverlay();
    }
  }

  showPauseOverlay() {
    const w = this.w, h = this.h, ov = [];
    ov.push(this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.6).setScrollFactor(0).setDepth(500));
    ov.push(this.add.text(w/2, h*0.3, 'PAUSED', {
      fontSize: '36px', fontFamily: 'Arial Black', fontStyle: 'bold', fill: '#FFFFFF'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501));
    const mkBtn = (label, y, fn) => {
      const bg = this.add.rectangle(w/2, y, 180, 44, 0x333333).setScrollFactor(0).setDepth(501).setInteractive();
      const tx = this.add.text(w/2, y, label, { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#FFFFFF'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(502).setInteractive();
      bg.on('pointerdown', fn); tx.on('pointerdown', fn);
      ov.push(bg, tx);
    };
    mkBtn('RESUME', h*0.45, () => this.togglePause());
    mkBtn('RESTART', h*0.55, () => { this.hidePauseOverlay(); this.scene.restart(); });
    mkBtn('MENU', h*0.65, () => { this.hidePauseOverlay(); this.scene.start('MenuScene'); });
    this.pauseOverlay = ov;
  }

  hidePauseOverlay() {
    if (this.pauseOverlay) {
      for (const obj of this.pauseOverlay) obj.destroy();
      this.pauseOverlay = null;
    }
  }
}
