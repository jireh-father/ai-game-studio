// Conveyor Crunch - Core GameScene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  init(data) { this.continueData = data && data.continueFrom ? data.continueFrom : null; }
  create() {
    this.cameras.main.setBackgroundColor(CONFIG.BG_COLOR);
    this.cameras.main.setAlpha(1);
    // State
    this.score = 0; this.stage = 1; this.combo = 0;
    this.strikes = 0; this.pile = 0; this.itemsThisStage = 0;
    this.perfectStage = true; this.gameOver = false; this.isPaused = false;
    this.items = []; this.pileItems = []; this.swipeQueued = null;
    // Continue from ad
    if (this.continueData) {
      this.score = this.continueData.score || 0;
      this.stage = this.continueData.stage || 1;
      this.strikes = 0; this.pile = 0;
    }
    AdManager.reset();
    this.createBelt();
    this.setupStage();
    HUD.create(this);
    HUD.updateScore(this, this.score);
    HUD.updateStage(this, this.stage);
    HUD.updateStrikes(this, this.strikes);
    HUD.updatePile(this, this.pile);
    this.setupSwipe();
    this.startSpawning();
    this.resetInactivityTimer();
    // Visibility handler
    this.visHandler = () => { if (document.hidden && !this.gameOver) this.pauseGame(); };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  createBelt() {
    this.add.image(CONFIG.WIDTH / 2, GAME.BELT_Y, 'belt').setDisplaySize(CONFIG.WIDTH, GAME.BELT_HEIGHT).setDepth(5);
    // Belt ridges animation
    this.ridges = [];
    for (let x = -20; x < CONFIG.WIDTH + 40; x += 30) {
      const r = this.add.rectangle(x, GAME.BELT_Y, 2, GAME.BELT_HEIGHT - 10, 0x3E4451, 0.5).setDepth(6);
      this.ridges.push(r);
    }
    this.beltTween = this.tweens.addCounter({
      from: 0, to: 30, duration: 800, repeat: -1,
      onUpdate: (t) => {
        const off = t.getValue();
        this.ridges.forEach((r, i) => { r.x = -20 + i * 30 - off; });
      }
    });
  }

  setupStage() {
    this.stageParams = getStageParams(this.stage);
    const colors = pickStageColors(this.stageParams);
    this.bins = assignBins(colors.baseColors, this.bins, this.stageParams.binSwap && this.stage > 1);
    this.itemQueue = generateItemQueue(this.stageParams, colors, this.bins);
    this.itemQueueIdx = 0;
    this.itemsThisStage = 0;
    this.perfectStage = true;
    this.drawBins();
    if (this.stageParams.isRush) Effects.rushWarning(this);
    if (this.stageParams.binSwap && this.stage > 7) this.flashBinSwap();
  }

  drawBins() {
    if (this.leftBin) this.leftBin.destroy();
    if (this.rightBin) this.rightBin.destroy();
    if (this.leftLabel) this.leftLabel.destroy();
    if (this.rightLabel) this.rightLabel.destroy();
    if (this.leftSwatch) this.leftSwatch.destroy();
    if (this.rightSwatch) this.rightSwatch.destroy();
    const binY = 80;
    const lc = parseInt(this.bins.left.replace('#',''), 16);
    const rc = parseInt(this.bins.right.replace('#',''), 16);
    this.leftBin = this.add.rectangle(55, binY, GAME.BIN_WIDTH, GAME.BIN_HEIGHT, 0x2C3E50)
      .setStrokeStyle(3, lc).setDepth(10);
    this.rightBin = this.add.rectangle(CONFIG.WIDTH - 55, binY, GAME.BIN_WIDTH, GAME.BIN_HEIGHT, 0x2C3E50)
      .setStrokeStyle(3, rc).setDepth(10);
    this.leftSwatch = this.add.rectangle(55, binY - 25, 40, 16, lc).setDepth(11);
    this.rightSwatch = this.add.rectangle(CONFIG.WIDTH - 55, binY - 25, 40, 16, rc).setDepth(11);
    const ln = COLOR_NAMES[this.bins.left] || '?';
    const rn = COLOR_NAMES[this.bins.right] || '?';
    this.leftLabel = this.add.text(55, binY + 10, ln, {
      fontSize: '14px', fontFamily: 'Arial Black', fill: '#FFF'
    }).setOrigin(0.5).setDepth(11);
    this.rightLabel = this.add.text(CONFIG.WIDTH - 55, binY + 10, rn, {
      fontSize: '14px', fontFamily: 'Arial Black', fill: '#FFF'
    }).setOrigin(0.5).setDepth(11);
  }

  flashBinSwap() {
    const txt = this.add.text(CONFIG.WIDTH/2, 80, 'SWAP!', {
      fontSize: '28px', fontFamily: 'Arial Black', fill: COLORS.REWARD, stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({ targets: [this.leftBin, this.rightBin], alpha: 0.3, duration: 100, yoyo: true, repeat: 5 });
    this.tweens.add({ targets: txt, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
  }

  setupSwipe() {
    this.swipeStart = null;
    this.input.on('pointerdown', (p) => {
      if (this.gameOver || this.isPaused) return;
      this.swipeStart = { x: p.x, y: p.y, time: this.time.now };
    });
    this.input.on('pointerup', (p) => {
      if (!this.swipeStart || this.gameOver || this.isPaused) return;
      const dx = p.x - this.swipeStart.x;
      const dy = p.y - this.swipeStart.y;
      const dt = this.time.now - this.swipeStart.time;
      this.swipeStart = null;
      if (dt > GAME.SWIPE_MAX_TIME) return;
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (ax > GAME.SWIPE_THRESHOLD && ax > ay * 1.5) {
        this.handleSwipe(dx < 0 ? 'left' : 'right');
      } else if (ay > GAME.SWIPE_THRESHOLD && dy < 0 && ay > ax * 1.5) {
        this.handleSwipe('up');
      }
    });
  }

  handleSwipe(dir) {
    this.resetInactivityTimer();
    const item = this.items[0];
    if (!item || item.getData('sorting')) return;
    item.setData('sorting', true);
    const targetBin = item.getData('targetBin');
    const isDecoy = item.getData('isDecoy');
    const spawnTime = item.getData('spawnTime');
    let correct = false;
    if (dir === 'up' && isDecoy) { correct = true; }
    else if (dir === 'left' && targetBin === 'left') { correct = true; }
    else if (dir === 'right' && targetBin === 'right') { correct = true; }
    else if (dir === 'up' && !isDecoy) { correct = false; }
    this.items.shift();
    if (correct) this.onCorrectSort(item, dir, spawnTime);
    else this.onWrongSort(item, dir);
  }

  onCorrectSort(item, dir, spawnTime) {
    this.combo++;
    const isSpeed = (this.time.now - spawnTime) < SCORING.SPEED_WINDOW;
    const pts = SCORING.BASE_SORT * Math.min(this.combo, SCORING.COMBO_MAX) + (isSpeed ? SCORING.SPEED_BONUS : 0);
    const isDecoy = item.getData('isDecoy');
    const total = isDecoy ? pts + SCORING.DECOY_BONUS : pts;
    this.score += total;
    HUD.updateScore(this, this.score);
    HUD.updateCombo(this, this.combo);
    // Toss animation
    const binObj = dir === 'left' ? this.leftBin : (dir === 'right' ? this.rightBin : null);
    if (binObj) {
      Effects.tossItem(this, item, binObj.x, binObj.y, () => {
        Effects.binBounce(this, binObj);
      });
    } else {
      this.tweens.add({ targets: item, y: item.y - 100, alpha: 0, duration: 200, onComplete: () => item.destroy() });
    }
    const pCount = 15 + this.combo * 3;
    const c = item.getData('itemColor') || '#FFFFFF';
    Effects.particleBurst(this, item.x, item.y, c, pCount, 500);
    Effects.shake(this, 0.003, 100);
    Effects.floatingText(this, item.x, item.y - 20, '+' + total, this.combo >= 5 ? COLORS.REWARD : '#FFF');
    Effects.comboText(this, this.combo);
    this.itemsThisStage++;
    this.checkStageComplete();
  }

  onWrongSort(item, dir) {
    this.combo = 0;
    this.perfectStage = false;
    this.strikes++;
    HUD.updateStrikes(this, this.strikes);
    HUD.updateCombo(this, this.combo);
    Effects.wrongFlash(this, item);
    Effects.vignetteFlash(this);
    Effects.shake(this, 0.006, 150);
    this.itemsThisStage++;
    if (this.strikes >= GAME.MAX_STRIKES) {
      this.triggerGameOver('3 STRIKES!');
    } else {
      this.checkStageComplete();
    }
  }

  pileUpItem(item) {
    if (!item || item.getData('sorting') || item.getData('piled')) return;
    item.setData('piled', true);
    this.items = this.items.filter(i => i !== item);
    this.pile++;
    this.combo = 0;
    this.perfectStage = false;
    HUD.updatePile(this, this.pile);
    HUD.updateCombo(this, 0);
    const px = GAME.PILE_X + Phaser.Math.Between(-5, 5);
    const py = CONFIG.HEIGHT - 130 - (this.pile - 1) * 22;
    this.tweens.add({ targets: item, x: px, y: py, scaleX: 0.6, scaleY: 0.6, duration: 300 });
    this.pileItems.push(item);
    Effects.pileImpact(this, px, py);
    this.itemsThisStage++;
    if (this.pile >= GAME.MAX_PILE) this.triggerGameOver('BELT OVERFLOW!');
    else this.checkStageComplete();
  }

  checkStageComplete() {
    const needed = this.stageParams.isRush ? GAME.RUSH_ITEMS : GAME.ITEMS_PER_STAGE;
    if (this.itemsThisStage >= needed) {
      if (this.perfectStage) { this.score += SCORING.PERFECT_STAGE; HUD.updateScore(this, this.score); }
      if (this.stageParams.isRush) { this.score += SCORING.RUSH_BONUS; HUD.updateScore(this, this.score); }
      Effects.stageClear(this, this.stage, this.perfectStage);
      this.stage++;
      HUD.updateStage(this, this.stage);
      this.setupStage();
    }
  }

  startSpawning() {
    this.spawnTimer = this.time.addEvent({
      delay: this.stageParams.spawnInterval,
      callback: this.spawnItem, callbackScope: this, loop: true
    });
  }

  spawnItem() {
    if (this.gameOver || this.isPaused) return;
    if (this.items.length >= 6) return; // max on screen
    if (this.itemQueueIdx >= this.itemQueue.length) return;
    const data = this.itemQueue[this.itemQueueIdx++];
    const texKey = data.isDecoy ? 'decoy' : 'item_' + data.color.replace('#','') + '_' + data.shape;
    const y = GAME.BELT_Y;
    const item = this.add.image(GAME.ITEM_SPAWN_X, y, texKey)
      .setDisplaySize(GAME.ITEM_SIZE, GAME.ITEM_SIZE).setDepth(20);
    item.setData('targetBin', data.targetBin);
    item.setData('isDecoy', data.isDecoy);
    item.setData('itemColor', data.color);
    item.setData('spawnTime', this.time.now);
    item.setData('sorting', false);
    item.setData('piled', false);
    if (data.rotates) {
      item.setAlpha(0.3);
      this.time.delayedCall(800, () => { if (item.scene) item.setAlpha(1); });
      this.tweens.add({ targets: item, angle: 360, duration: 1200, repeat: 0 });
    }
    const speed = this.stageParams.beltSpeed;
    const restMul = data.isRestItem ? 0.5 : 1;
    const travelDist = GAME.ITEM_SPAWN_X - GAME.PILE_X;
    const dur = (travelDist / (speed * restMul)) * 1000;
    this.tweens.add({
      targets: item, x: GAME.PILE_X, duration: dur, ease: 'Linear',
      onComplete: () => { if (!item.getData('sorting') && !item.getData('piled')) this.pileUpItem(item); }
    });
    this.items.push(item);
    // Update spawn timer delay for next stage params
    if (this.spawnTimer) this.spawnTimer.delay = this.stageParams.spawnInterval;
  }

  resetInactivityTimer() {
    if (this.inactTimer) clearTimeout(this.inactTimer);
    this.inactTimer = setTimeout(() => {
      if (!this.gameOver && !this.isPaused && this.items.length > 0) {
        this.pileUpItem(this.items[0]);
        this.resetInactivityTimer();
      }
    }, GAME.INACTIVITY_TIMEOUT);
  }

  triggerGameOver(cause) {
    if (this.gameOver) return;
    this.gameOver = true;
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.inactTimer) clearTimeout(this.inactTimer);
    if (this.beltTween) this.beltTween.stop();
    this.tweens.killAll();
    Effects.deathSequence(this, () => {
      this.scene.start('GameOverScene', { score: this.score, stage: this.stage, cause });
    });
  }

  pauseGame() {
    if (this.isPaused || this.gameOver) return;
    this.isPaused = true;
    this.scene.pause();
    this.scene.launch('PauseScene', { returnTo: 'GameScene' });
  }

  shutdown() {
    document.removeEventListener('visibilitychange', this.visHandler);
    if (this.inactTimer) clearTimeout(this.inactTimer);
  }
}
