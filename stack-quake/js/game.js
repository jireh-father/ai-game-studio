// Stack Quake - Core GameScene

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.continueFrom = data && data.continueFrom ? data.continueFrom : 0;
    this.continueScore = data && data.continueScore ? data.continueScore : 0;
    this.restoreWidth = data && data.restoreWidth ? data.restoreWidth : 0;
  }

  create() {
    this.score = this.continueScore;
    this.floor = this.continueFrom;
    this.platformWidth = this.restoreWidth || PLATFORM_START_WIDTH;
    this.platformCenterX = GAME_WIDTH / 2;
    this.gameOver = false;
    this.isDropping = false;
    this.stageTransitioning = false;
    this.comboCount = 0;
    this.lastSlicedWidth = 0;
    this.quakeEventActive = false;
    this.lastInputTime = Date.now();
    this.paused = false;

    this.towerBlocks = [];
    this.towerBaseY = 560;
    this.topY = this.towerBaseY;

    this.towerContainer = this.add.container(0, 0);

    this.groundBlock = this.add.rectangle(
      this.platformCenterX, this.towerBaseY, this.platformWidth, FLOOR_HEIGHT, 0x3A86FF
    );
    this.towerContainer.add(this.groundBlock);
    this.towerBlocks.push(this.groundBlock);

    this.floorElapsedMs = 0;
    this.currentParams = getFloorParams(1);

    this.createHUD();
    this.createSlidingBlock();

    this.input.on('pointerdown', this.handleTap, this);
    this.startAutoDropTimer();

    this.visHandler = () => {
      if (document.hidden && !this.gameOver) this.pauseGame();
    };
    document.addEventListener('visibilitychange', this.visHandler);

    this.dangerOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFF0054, 0);
    this.dangerOverlay.setDepth(50);

    this.updateHUD();
  }

  createHUD() {
    this.scoreText = this.add.text(16, 8, 'SCORE: ' + this.score.toLocaleString(), {
      fontSize: '16px', fontFamily: 'Arial', fill: COLORS.UI_TEXT, fontStyle: 'bold'
    }).setDepth(100).setScrollFactor(0);

    this.floorText = this.add.text(GAME_WIDTH / 2, 8, 'FLOOR: ' + this.floor, {
      fontSize: '16px', fontFamily: 'Arial', fill: COLORS.UI_TEXT, fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);

    const pauseBtn = this.add.text(GAME_WIDTH - 36, 8, '||', {
      fontSize: '20px', fontFamily: 'Arial', fill: COLORS.UI_TEXT, fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', (p) => { p.event.stopPropagation(); this.pauseGame(); });

    const helpBtn = this.add.text(GAME_WIDTH - 70, 8, '?', {
      fontSize: '20px', fontFamily: 'Arial', fill: COLORS.UI_TEXT, fontStyle: 'bold',
      backgroundColor: '#333333', padding: { x: 6, y: 2 }
    }).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0).setInteractive({ useHandCursor: true });
    helpBtn.on('pointerdown', (p) => {
      p.event.stopPropagation();
      this.scene.pause('GameScene');
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });

    this.widthBarBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 20, PLATFORM_START_WIDTH, 6, 0x333333).setDepth(100).setScrollFactor(0);
    this.widthBar = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 20, this.platformWidth, 6, 0x3A86FF).setDepth(101).setScrollFactor(0);
  }

  updateHUD() {
    this.scoreText.setText('SCORE: ' + this.score.toLocaleString());
    this.floorText.setText('FLOOR: ' + this.floor);
    this.tweens.add({ targets: this.widthBar, displayWidth: this.platformWidth, duration: 150 });
    const pct = this.platformWidth / PLATFORM_START_WIDTH;
    this.widthBar.setFillStyle(pct < 0.25 ? 0xFF0054 : pct < 0.4 ? 0xFF6B35 : 0x3A86FF);
  }

  createSlidingBlock() {
    const startX = this.floor % 2 === 0 ? BLOCK_WIDTH / 2 + 10 : GAME_WIDTH - BLOCK_WIDTH / 2 - 10;
    this.slidingBlock = this.add.rectangle(startX, 70, BLOCK_WIDTH, BLOCK_HEIGHT, 0xE84855);
    this.slidingBlock.setDepth(10);
    this.blockDirection = this.floor % 2 === 0 ? 1 : -1;
    this.isDropping = false;
  }

  startAutoDropTimer() {
    if (this.autoDropTimer) this.autoDropTimer.remove();
    this.autoDropTimer = this.time.delayedCall(AUTO_DROP_MS, () => {
      if (!this.gameOver && !this.isDropping && !this.paused) this.dropBlock();
    });
  }

  handleTap(pointer) {
    if (this.gameOver || this.isDropping || this.paused || this.quakeEventActive) return;
    this.lastInputTime = Date.now();
    spawnTapRipple(this, pointer.x, pointer.y);
    this.dropBlock();
  }

  dropBlock() {
    if (this.isDropping || this.gameOver) return;
    this.isDropping = true;
    if (this.autoDropTimer) this.autoDropTimer.remove();

    const targetY = this.topY - FLOOR_HEIGHT;
    const blockX = this.slidingBlock.x;

    this.tweens.add({
      targets: this.slidingBlock, y: targetY, duration: 120, ease: 'Quad.easeIn',
      onComplete: () => this.resolveDropLanding(blockX, targetY)
    });
  }

  resolveDropLanding(blockX, blockY) {
    const quakeOff = computeQuakeOffset(this.floorElapsedMs, this.currentParams);
    const platLeft = this.platformCenterX + quakeOff - this.platformWidth / 2;
    const platRight = this.platformCenterX + quakeOff + this.platformWidth / 2;
    const blockLeft = blockX - BLOCK_WIDTH / 2;
    const blockRight = blockX + BLOCK_WIDTH / 2;

    const overhangLeft = Math.max(0, platLeft - blockLeft);
    const overhangRight = Math.max(0, blockRight - platRight);
    const totalOverhang = overhangLeft + overhangRight;

    if (totalOverhang >= BLOCK_WIDTH) {
      spawnFragment(this, blockX, blockY, BLOCK_WIDTH, blockX > this.platformCenterX ? 1 : -1);
      this.slidingBlock.destroy();
      this.triggerGameOver();
      return;
    }

    const placedWidth = BLOCK_WIDTH - totalOverhang;
    this.lastSlicedWidth = totalOverhang;

    if (overhangLeft > 2) spawnFragment(this, blockLeft + overhangLeft / 2, blockY, overhangLeft, -1);
    if (overhangRight > 2) spawnFragment(this, blockRight - overhangRight / 2, blockY, overhangRight, 1);

    this.platformWidth = Math.max(PLATFORM_MIN_WIDTH, this.platformWidth - totalOverhang);

    const platCenter = this.platformCenterX + quakeOff;
    const centerDiff = Math.abs(blockX - platCenter);
    let scoreGain = SCORE_PLACE;
    let isPerfect = false;
    let isNearPerfect = false;

    if (centerDiff <= PERFECT_RANGE_PX) {
      isPerfect = true;
      this.comboCount++;
      const comboBonus = Math.min(PERFECT_COMBO_INCREMENT * this.comboCount, PERFECT_COMBO_CAP);
      scoreGain = SCORE_PERFECT + comboBonus - PERFECT_COMBO_INCREMENT;
      if (this.lastSlicedWidth > 0) {
        const restore = this.lastSlicedWidth * WIDTH_RESTORE_PERCENT;
        this.platformWidth = Math.min(PLATFORM_START_WIDTH, this.platformWidth + restore);
      }
    } else if (centerDiff <= NEAR_PERFECT_RANGE_PX) {
      isNearPerfect = true;
      this.comboCount = 0;
      scoreGain = SCORE_NEAR;
    } else {
      this.comboCount = 0;
    }

    if (this.floor > 10) scoreGain += (this.floor - 10) * SCORE_ALTITUDE_BONUS;
    if (this.platformWidth > PLATFORM_START_WIDTH * 0.8) scoreGain += SCORE_WIDTH_BONUS;
    this.score += scoreGain;

    const newBlock = this.add.rectangle(this.platformCenterX, blockY, placedWidth, FLOOR_HEIGHT, 0x3A86FF);
    newBlock.setFillStyle(0x3A86FF + (this.floor % 5) * 0x050505);
    this.towerContainer.add(newBlock);
    this.towerBlocks.push(newBlock);

    this.slidingBlock.destroy();
    applyLandingJuice(this, blockX, blockY, scoreGain, isPerfect, isNearPerfect, totalOverhang);

    this.floor++;
    this.topY = blockY;

    if (this.topY < 200) {
      this.towerContainer.y += FLOOR_HEIGHT;
      this.topY += FLOOR_HEIGHT;
    }

    if (this.platformWidth <= PLATFORM_MIN_WIDTH) { this.triggerGameOver(); return; }

    if (isQuakeEvent(this.floor)) { this.fireQuakeEvent(); return; }

    const pc = isPatternChange(this.floor);
    if (pc.changed) showPatternChangeLabel(this, pc.label);

    this.updateHUD();
    this.startNextFloor();
  }

  fireQuakeEvent() {
    this.quakeEventActive = true;
    playQuakeEvent(this);
    this.time.delayedCall(1200, () => {
      if (!this.gameOver) {
        this.quakeEventActive = false;
        this.updateHUD();
        this.startNextFloor();
      }
    });
  }

  startNextFloor() {
    this.floorElapsedMs = 0;
    this.currentParams = getFloorParams(this.floor + 1);
    const delay = isQuakeEvent(this.floor) ? 1000 : 0;
    this.time.delayedCall(delay, () => {
      if (!this.gameOver) {
        this.createSlidingBlock();
        this.startAutoDropTimer();
      }
    });
  }

  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    if (this.autoDropTimer) this.autoDropTimer.remove();

    playTowerCollapse(this);

    const isNewBest = this.score > GameState.highScore;
    if (isNewBest) GameState.highScore = this.score;
    GameState.save();

    this.time.delayedCall(400, () => {
      this.scene.launch('GameOverScene', {
        score: this.score, floor: this.floor, isNewBest: isNewBest, lastWidth: this.platformWidth
      });
    });
  }

  pauseGame() {
    if (this.paused || this.gameOver) return;
    this.paused = true;
    this.scene.pause('GameScene');
    this.scene.launch('PauseScene');
  }

  update(time, delta) {
    if (this.gameOver || this.paused || this.quakeEventActive) return;

    if (Date.now() - this.lastInputTime > INACTIVITY_DEATH_MS && !this.isDropping) {
      this.triggerGameOver();
      return;
    }

    if (this.slidingBlock && this.slidingBlock.active && !this.isDropping) {
      this.slidingBlock.x += this.blockDirection * this.currentParams.blockSpeed;
      if (this.slidingBlock.x >= GAME_WIDTH - BLOCK_WIDTH / 2) {
        this.slidingBlock.x = GAME_WIDTH - BLOCK_WIDTH / 2;
        this.blockDirection = -1;
      } else if (this.slidingBlock.x <= BLOCK_WIDTH / 2) {
        this.slidingBlock.x = BLOCK_WIDTH / 2;
        this.blockDirection = 1;
      }
    }

    this.floorElapsedMs += delta;
    this.towerContainer.x = computeQuakeOffset(this.floorElapsedMs, this.currentParams);
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}
