// Melt Stack - Core GameScene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.initAudio();
    this.tower = [];
    this.gameOver = false;
    this.paused = false;
    this.hitStop = false;
    this.meltFrozen = false;
    this.stageTransitioning = false;
    this.lastInputTime = Date.now();
    this.slidingDirection = 1;
    this.freezeOverlay = null;
    this.streakText = null;
    this.pauseGroup = null;
    this.dripTimer = 0;

    const params = getStageParams(GameState.stage);
    this.currentBlockSpeed = params.blockSpeedPxPerS;
    this.currentMeltDuration = params.meltDurationMs;
    this.currentBlockWidth = params.startWidthPx;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, PALETTE.bg).setScrollFactor(0);

    if (this.textures.exists('melt-glow')) {
      this.meltGlow = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'melt-glow').setDepth(5).setScrollFactor(0);
      this.tweens.add({ targets: this.meltGlow, alpha: { from: 0.6, to: 1 }, duration: 667, yoyo: true, repeat: -1 });
    }

    this.cameras.main.scrollY = 0;

    this.createHUD();
    this.addTowerBlock(GAME_WIDTH / 2, INITIAL_WIDTH, true);

    this.slidingX = GAME_WIDTH / 2;
    this.slidingBlockGfx = this.add.graphics().setDepth(20);
    this.drawSlidingBlock();

    this.input.on('pointerdown', (pointer) => {
      if (this.gameOver || this.paused) return;
      if (pointer.y < 48 || pointer.y > GAME_HEIGHT - 48) return;
      this.lastInputTime = Date.now();
      this.dropBlock();
    });

    this.visHandler = () => {
      if (document.hidden && !this.paused && !this.gameOver) this.togglePause();
    };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  addTowerBlock(centerX, width) {
    const towerBaseY = GAME_HEIGHT - 80;
    const blockY = towerBaseY - this.tower.length * BLOCK_HEIGHT;
    const color = BLOCK_COLORS[this.tower.length % BLOCK_COLORS.length];
    const gfx = this.add.graphics().setDepth(10);
    const block = {
      go: gfx, x: centerX, y: blockY, width: width,
      currentHeight: BLOCK_HEIGHT, color: color,
      meltDurationMs: getEffectiveMeltMs(this.currentMeltDuration, width)
    };
    this.drawBlock(block);
    this.tower.push(block);
    return block;
  }

  drawBlock(block) {
    block.go.clear();
    const r = Math.min(6, block.currentHeight / 2);
    block.go.fillStyle(block.color, 1.0);
    block.go.fillRoundedRect(block.x - block.width / 2, block.y - block.currentHeight, block.width, block.currentHeight, r);
    block.go.lineStyle(2, 0xFFFFFF, 1.0);
    block.go.strokeRoundedRect(block.x - block.width / 2, block.y - block.currentHeight, block.width, block.currentHeight, r);
  }

  drawSlidingBlock() {
    const y = this.getSlidingY();
    this.slidingBlockGfx.clear();
    const color = BLOCK_COLORS[this.tower.length % BLOCK_COLORS.length];
    this.slidingBlockGfx.fillStyle(color, 1.0);
    this.slidingBlockGfx.fillRoundedRect(this.slidingX - this.currentBlockWidth / 2, y, this.currentBlockWidth, BLOCK_HEIGHT, 6);
    this.slidingBlockGfx.lineStyle(2, 0xFFFFFF, 1.0);
    this.slidingBlockGfx.strokeRoundedRect(this.slidingX - this.currentBlockWidth / 2, y, this.currentBlockWidth, BLOCK_HEIGHT, 6);
  }

  getSlidingY() {
    if (this.tower.length === 0) return GAME_HEIGHT - 80 - BLOCK_HEIGHT - 60;
    const top = this.tower[this.tower.length - 1];
    return top.y - top.currentHeight - BLOCK_HEIGHT - 20;
  }

  dropBlock() {
    if (this.gameOver || this.tower.length === 0) return;
    const top = this.tower[this.tower.length - 1];
    const oL = Math.max(this.slidingX - this.currentBlockWidth / 2, top.x - top.width / 2);
    const oR = Math.min(this.slidingX + this.currentBlockWidth / 2, top.x + top.width / 2);
    const oW = oR - oL;

    if (oW <= 0) {
      this.floatingText(GAME_WIDTH / 2, this.getSlidingY(), 'MISSED!', '#FF6B6B', 22, 50, 600);
      this.soundSlice();
      this.spawnNextBlock(top.x, top.width);
      return;
    }

    const newCX = (oL + oR) / 2;
    const isPerfect = Math.abs(this.slidingX - top.x) <= PERFECT_TOLERANCE
      && Math.abs(this.currentBlockWidth - top.width) <= PERFECT_TOLERANCE;

    if (!isPerfect && oW < this.currentBlockWidth) {
      this.soundSlice();
      this.sliceOverhang(top.x, top.width);
    }

    const cx = isPerfect ? top.x : newCX;
    const w = isPerfect ? top.width : oW;
    const block = this.addTowerBlock(cx, w);

    this.updateCamera();
    GameState.blocksDropped++;
    if (isPerfect) {
      GameState.perfectStreak++;
      GameState.addScore(SCORE_VALUES.perfect + SCORE_VALUES.streakBonus * (GameState.perfectStreak - 1));
      this.onPerfectDrop(block);
    } else {
      GameState.perfectStreak = 0;
      GameState.addScore(SCORE_VALUES.normal);
      this.soundDrop();
      this.shakeScreen(4, 200);
      this.floatingText(GAME_WIDTH / 2, this.getSlidingY() + 40, '+' + SCORE_VALUES.normal, '#FFFFFF', 20, 50, 600);
    }

    this.scalePunch(this.scoreText, 1.25, 250);
    this.updateHUD();

    if (isNewStage(GameState.blocksDropped) && !this.stageTransitioning) {
      this.stageTransitioning = true;
      GameState.stage++;
      this.advanceStage();
    }

    this.currentBlockWidth = w;
    this.spawnNextBlock(cx, w);
  }

  sliceOverhang(topX, topW) {
    const sliceGfx = this.add.graphics().setDepth(15);
    const color = BLOCK_COLORS[(this.tower.length - 1) % BLOCK_COLORS.length];
    sliceGfx.fillStyle(color, 0.7);
    const dir = this.slidingX > topX ? 1 : -1;
    const sx = dir > 0 ? topX + topW / 2 : this.slidingX - this.currentBlockWidth / 2;
    const sw = Math.abs(this.slidingX - topX) + (this.currentBlockWidth - topW) / 2;
    sliceGfx.fillRoundedRect(sx, this.getSlidingY() + BLOCK_HEIGHT + 20, Math.max(sw, 4), BLOCK_HEIGHT, 4);
    this.tweens.add({ targets: sliceGfx, y: 300, alpha: 0, duration: 500, ease: 'Power2', onComplete: () => sliceGfx.destroy() });
  }

  onPerfectDrop(block) {
    this.soundPerfect();
    this.shakeScreen(6, 200);
    this.flashScreen(PALETTE.perfectFlash, 0.6 + Math.min(GameState.perfectStreak * 0.1, 0.35), 300);
    const starCount = Math.min(12 + (GameState.perfectStreak - 1) * 4, 32);
    this.spawnStarBurst(GAME_WIDTH / 2, this.getSlidingY() + 40, starCount);
    const pts = SCORE_VALUES.perfect + SCORE_VALUES.streakBonus * (GameState.perfectStreak - 1);
    this.floatingText(GAME_WIDTH / 2, this.getSlidingY() + 30, '+' + pts + ' PERFECT!', '#00CFFF', 24, 80, 800);

    this.meltFrozen = true;
    this.showFreezeTint();
    this.soundFreeze();
    setTimeout(() => { this.meltFrozen = false; }, FREEZE_DURATION);

    this.hitStop = true;
    setTimeout(() => { this.hitStop = false; }, HIT_STOP_MS);

    this.tweens.add({ targets: this.cameras.main, zoom: 1.04, duration: 150, yoyo: true, ease: 'Sine.easeOut' });

    if (GameState.perfectStreak >= 2) {
      this.showStreakText(GameState.perfectStreak);
      this.soundStreak(GameState.perfectStreak);
    }
  }

  spawnNextBlock(centerX, width) {
    this.slidingDirection *= -1;
    this.slidingX = this.slidingDirection > 0 ? -width / 2 : GAME_WIDTH + width / 2;
    this.currentBlockWidth = width;
    const params = getStageParams(GameState.stage);
    if (params.isCoolStage && GameState.blocksDropped % BLOCKS_PER_STAGE === 0) {
      this.currentBlockWidth = INITIAL_WIDTH;
    }
    this.drawSlidingBlock();
  }

  advanceStage() {
    const params = getStageParams(GameState.stage);
    this.currentBlockSpeed = params.blockSpeedPxPerS;
    this.currentMeltDuration = params.meltDurationMs;
    GameState.addScore(SCORE_VALUES.stageMilestone * GameState.stage);
    this.updateHUD();
    this.soundStageMilestone();
    this.floatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'STAGE ' + GameState.stage, '#FFE66D', 28, 60, 1000);
    this.stageTransitioning = false;
  }

  meltUpdate(delta) {
    if (this.meltFrozen || this.tower.length === 0) return;
    const bottom = this.tower[0];
    bottom.currentHeight -= (BLOCK_HEIGHT / bottom.meltDurationMs) * delta;

    if (bottom.currentHeight <= 0) {
      bottom.go.destroy();
      this.tower.shift();
      this.repositionTower();
      if (this.tower.length === 0) { this.triggerDeath(); return; }
      this.tower[0].meltDurationMs = getEffectiveMeltMs(this.currentMeltDuration, this.tower[0].width);
    } else {
      this.drawBlock(bottom);
    }

    this.dripTimer += delta;
    if (this.dripTimer > 333 && this.tower.length > 0 && this.textures.exists('drip')) {
      this.dripTimer = 0;
      const b = this.tower[0];
      const drip = this.add.image(b.x + (Math.random() - 0.5) * b.width, b.y, 'drip').setDepth(6).setScale(0.8);
      this.tweens.add({ targets: drip, y: drip.y + 40, alpha: 0, duration: 800, onComplete: () => drip.destroy() });
    }

    if (this.tower.length <= 2 && this.warningText) {
      this.warningText.setAlpha(0.5 + 0.5 * Math.sin(Date.now() * 0.025));
    } else if (this.warningText) {
      this.warningText.setAlpha(0);
    }
  }

  repositionTower() {
    const baseY = GAME_HEIGHT - 80;
    this.tower.forEach((block, i) => { block.y = baseY - i * BLOCK_HEIGHT; if (i > 0) this.drawBlock(block); });
    this.updateCamera();
  }

  updateCamera() {
    // Scroll the camera up when the tower gets tall so the sliding block stays visible
    const slidingY = this.getSlidingY();
    const MIN_SCREEN_Y = 140; // below HUD, leaves room for sliding block + label
    const targetScrollY = Math.min(0, slidingY - MIN_SCREEN_Y);
    if (Math.abs(targetScrollY - this.cameras.main.scrollY) > 1) {
      this.tweens.add({
        targets: this.cameras.main,
        scrollY: targetScrollY,
        duration: 250,
        ease: 'Power2'
      });
    }
  }

  triggerDeath() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.slidingBlockGfx.setVisible(false);
    GameState.saveBest();
    const isNewBest = GameState.score >= GameState.bestScore;
    this.playDeathSequence(GAME_WIDTH / 2, GAME_HEIGHT - 80, () => {
      this.scene.pause();
      this.scene.launch('GameOverScene', { score: GameState.score, stage: GameState.stage, isNewBest: isNewBest });
    });
  }

  revive() {
    this.gameOver = false;
    this.slidingBlockGfx.setVisible(true);
    const top = this.tower.length > 0 ? this.tower[this.tower.length - 1] : null;
    const w = top ? top.width : 120;
    const cx = top ? top.x : GAME_WIDTH / 2;
    for (let i = 0; i < 5; i++) this.addTowerBlock(cx, w);
    this.currentBlockWidth = w;
    this.spawnNextBlock(cx, w);
    this.lastInputTime = Date.now();
  }

  update(time, delta) {
    if (this.gameOver || this.paused || this.hitStop) return;
    if (Date.now() - this.lastInputTime > INACTIVITY_DEATH_MS) { this.triggerDeath(); return; }

    this.slidingX += this.slidingDirection * this.currentBlockSpeed * (delta / 1000);
    const halfW = this.currentBlockWidth / 2;
    if (this.slidingX + halfW > GAME_WIDTH) { this.slidingX = GAME_WIDTH - halfW; this.slidingDirection = -1; }
    else if (this.slidingX - halfW < 0) { this.slidingX = halfW; this.slidingDirection = 1; }
    this.drawSlidingBlock();
    this.meltUpdate(delta);
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}

Object.assign(GameScene.prototype, GameEffects);
Object.assign(GameScene.prototype, GameHUD);
