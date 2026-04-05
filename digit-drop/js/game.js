class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const { width, height } = this.cameras.main;
    this.gameWidth = width;
    this.gameHeight = height;
    this.gameOver = false;
    this.paused = false;
    this.stageTransitioning = false;
    this.roundAutoFills = 0;
    this.placementCount = 0;
    this.lastInputTime = Date.now();
    this.slotValues = [];
    this.slotObjects = [];
    this.slotTexts = [];
    this.currentDigit = null;
    this.dropTimerEvent = null;
    this.timerWarned = false;

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BG);
    this.createHUD();
    this.loadRound();

    this.visHandler = () => { if (document.hidden && !this.paused && !this.gameOver) this.togglePause(); };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  createHUD() {
    const w = this.gameWidth;
    this.crystals = [];
    for (let i = 0; i < 3; i++) {
      const img = this.add.image(24 + i * 28, 24, GameState.strikes > i ? 'crystal_broken' : 'crystal').setScale(0.9).setDepth(10);
      this.crystals.push(img);
    }
    this.stageTxt = this.add.text(w / 2, 16, 'Stage ' + GameState.stage, { fontFamily: "'Courier New', monospace", fontSize: '13px', color: '#8BAFC8' }).setOrigin(0.5).setDepth(10);
    this.targetLabel = this.add.text(w / 2, 36, '', { fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#2E5C8A' }).setOrigin(0.5).setDepth(10);
    this.targetTxt = this.add.text(w / 2, 52, '', { fontFamily: "'Courier New', monospace", fontSize: '22px', fontStyle: 'bold', color: COLORS.TARGET }).setOrigin(0.5).setDepth(10);

    const pauseBtn = this.add.text(w - 28, 24, '||', { fontFamily: "'Courier New', monospace", fontSize: '18px', fontStyle: 'bold', color: '#00D4FF' }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => { this.lastInputTime = Date.now(); this.togglePause(); });
    const helpBtn = this.add.text(w - 60, 24, '?', { fontFamily: "'Courier New', monospace", fontSize: '18px', fontStyle: 'bold', color: '#2E5C8A' }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
    helpBtn.on('pointerdown', () => { this.lastInputTime = Date.now(); if (!this.paused) this.togglePause(); this.scene.launch('HelpScene', { returnTo: 'GameScene' }); });

    this.scoreTxt = this.add.text(16, this.gameHeight - 40, 'Score: ' + GameState.score, { fontFamily: "'Courier New', monospace", fontSize: '14px', color: COLORS.SCORE }).setDepth(10);
    this.streakTxt = this.add.text(w - 16, this.gameHeight - 40, '', { fontFamily: "'Courier New', monospace", fontSize: '14px', fontStyle: 'bold', color: COLORS.STREAK }).setOrigin(1, 0).setDepth(10);
    this.updateStreakDisplay();
    this.previewTxt = this.add.text(w / 2, this.gameHeight - 70, '', { fontFamily: "'Courier New', monospace", fontSize: '16px', color: '#8BAFC8' }).setOrigin(0.5).setDepth(10);
    this.timerBar = this.add.rectangle(w / 2, 0, 0, 6, COLORS.TIMER_BAR).setOrigin(0.5, 0).setDepth(10);
    this.digitContainer = this.add.container(w / 2, 120).setDepth(20);
  }

  loadRound() {
    this.stageTransitioning = false;
    this.roundAutoFills = 0;
    this.placementCount = 0;
    this.timerWarned = false;
    const params = getStageParams(GameState.stage);
    this.stageParams = params;
    this.isRest = isRestStage(GameState.stage);
    const seed = GameState.stage * 7919 + Date.now() % 100000;
    this.digitSequence = generateDigitSequence(params.slotCount, params.poisonRate, seed);
    this.target = this.isRest ? 0 : calculateTarget(params.slotCount, params.targetPercentile);
    this.currentDigitIndex = 0;

    this.stageTxt.setText('Stage ' + GameState.stage);
    if (this.isRest) { this.targetLabel.setText('BONUS ROUND'); this.targetTxt.setText('No target!'); }
    else { this.targetLabel.setText('TARGET'); this.targetTxt.setText(formatTarget(this.target, params.slotCount).join('  ')); }

    this.clearSlots();
    this.buildSlots(params);
    this.updatePreview();
    this.spawnDigit();
  }

  clearSlots() {
    this.slotObjects.forEach(s => { if (s.bg) s.bg.destroy(); if (s.zone) s.zone.destroy(); });
    this.slotTexts.forEach(t => { if (t) t.destroy(); });
    this.slotObjects = [];
    this.slotTexts = [];
    this.slotValues = [];
  }

  buildSlots(params) {
    const count = params.slotCount;
    const maxW = this.gameWidth - 48;
    const slotW = Math.min(64, Math.floor((maxW - (count - 1) * 6) / count));
    const gap = 6;
    const totalW = count * slotW + (count - 1) * gap;
    const startX = (this.gameWidth - totalW) / 2 + slotW / 2;
    const slotY = this.gameHeight / 2 + 40;

    for (let i = 0; i < count; i++) {
      const x = startX + i * (slotW + gap);
      const bg = this.add.image(x, slotY, 'empty_slot').setDisplaySize(slotW, slotW * 1.25).setDepth(5);
      const tapW = Math.max(slotW + 12, 44);
      const zone = this.add.rectangle(x, slotY, tapW, slotW * 1.25 + 12, 0x000000, 0).setInteractive(
        new Phaser.Geom.Rectangle(-tapW / 2, -(slotW * 1.25 + 12) / 2, tapW, slotW * 1.25 + 12),
        Phaser.Geom.Rectangle.Contains
      ).setDepth(6);
      const idx = i;
      zone.on('pointerdown', () => this.onSlotTap(idx));
      this.slotObjects.push({ bg, zone, x, y: slotY, w: slotW, filled: false, locked: false });
      this.slotTexts.push(null);
      this.slotValues.push(null);
    }

    if (params.lockedSlots > 0) {
      const rng = seededRandom(GameState.stage * 31 + 99);
      for (let l = 0; l < Math.min(params.lockedSlots, count - 1); l++) {
        const li = count - 1 - l;
        const lockVal = 1 + Math.floor(rng() * 3);
        this.slotObjects[li].filled = true;
        this.slotObjects[li].locked = true;
        this.slotObjects[li].bg.setTexture('digit_tile');
        this.slotValues[li] = { value: lockVal, isPoison: false, effectiveValue: lockVal };
        const txt = this.add.text(this.slotObjects[li].x, this.slotObjects[li].y, String(lockVal), {
          fontFamily: "'Courier New', monospace", fontSize: Math.min(28, this.slotObjects[li].w - 8) + 'px', fontStyle: 'bold', color: '#555'
        }).setOrigin(0.5).setDepth(8);
        this.slotTexts[li] = txt;
      }
    }
  }

  spawnDigit() {
    if (this.currentDigitIndex >= this.digitSequence.length) { this.evaluateRound(); return; }
    this.digitContainer.removeAll(true);
    const d = this.digitSequence[this.currentDigitIndex];
    const texKey = d.isPoison ? 'digit_tile_poison' : 'digit_tile';
    const tile = this.add.image(0, 0, texKey).setDisplaySize(56, 56);
    const color = d.isPoison ? COLORS.DIGIT_POISON : (d.value >= 8 ? COLORS.DIGIT_HIGH : COLORS.DIGIT_NORMAL);
    const txt = this.add.text(0, 0, String(d.value), { fontFamily: "'Courier New', monospace", fontSize: '30px', fontStyle: 'bold', color }).setOrigin(0.5);
    this.digitContainer.add([tile, txt]);
    this.digitContainer.setPosition(this.gameWidth / 2, -60);
    this.tweens.add({ targets: this.digitContainer, y: 130, duration: 300, ease: 'Bounce.Out' });
    this.currentDigit = d;
    this.startDropTimer();
    if (d.isPoison) this.tweens.add({ targets: tile, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
  }

  startDropTimer() {
    if (this.dropTimerEvent) this.dropTimerEvent.remove();
    this.timerWarned = false;
    this.dropTimerStart = this.time.now;
    this.dropTimerDuration = this.stageParams.dropTimerMs;
    this.timerBar.setPosition(this.gameWidth / 2, 165);
    this.timerBar.setSize(this.gameWidth - 80, 6);
    this.timerBar.setFillStyle(COLORS.TIMER_BAR);
    this.dropTimerEvent = this.time.delayedCall(this.dropTimerDuration, () => this.autoFill());
  }

  onSlotTap(index) {
    if (this.gameOver || this.paused || this.stageTransitioning || !this.currentDigit) return;
    if (this.slotObjects[index].filled) return;
    this.lastInputTime = Date.now();
    this.placeDigit(index);
  }

  placeDigit(slotIndex) {
    if (this.dropTimerEvent) this.dropTimerEvent.remove();
    const d = this.currentDigit;
    const slot = this.slotObjects[slotIndex];
    slot.filled = true;
    slot.bg.setTexture('digit_tile');
    const effectiveValue = d.isPoison ? Math.max(0, d.value - 2) : d.value;
    this.slotValues[slotIndex] = { value: d.value, isPoison: d.isPoison, effectiveValue };
    const color = d.isPoison ? COLORS.DIGIT_POISON : (d.value >= 8 ? COLORS.DIGIT_HIGH : COLORS.DIGIT_NORMAL);
    const fontSize = Math.min(28, slot.w - 8);
    const txt = this.add.text(slot.x, slot.y, String(d.value), {
      fontFamily: "'Courier New', monospace", fontSize: fontSize + 'px', fontStyle: 'bold', color
    }).setOrigin(0.5).setDepth(8);
    this.slotTexts[slotIndex] = txt;
    this.digitContainer.setVisible(false);
    Effects.scalePunch(this, txt, 1.35, TIMING.SCALE_PUNCH_DURATION);
    Effects.hitStop(this);
    const particleKey = d.isPoison ? 'particle_red' : (d.value >= 8 ? 'particle_gold' : 'particle');
    const streakIdx = Math.min(GameState.streak, SCORING.STREAK_LEVELS.length - 1);
    const pCount = streakIdx >= 4 ? 16 : (streakIdx >= 1 ? 10 : 6);
    Effects.particleBurst(this, slot.x, slot.y, pCount, particleKey);
    if (d.isPoison) SoundFX.poisonPlace();
    else if (d.value >= 8) { SoundFX.highValuePlace(); Effects.cameraZoom(this, 1.04, 250); }
    else SoundFX.tap(this.placementCount);
    this.placementCount++;
    this.updatePreview();
    Effects.scalePunch(this, this.previewTxt, 1.15, 120);
    this.currentDigitIndex++;
    this.currentDigit = null;
    this.time.delayedCall(200, () => { if (!this.gameOver && !this.stageTransitioning) this.spawnDigit(); });
  }

  autoFill() {
    if (this.gameOver || this.paused || !this.currentDigit) return;
    this.roundAutoFills++;
    GameState.autoFillCount++;
    SoundFX.autoFill();
    let worstIdx = -1;
    for (let i = this.slotObjects.length - 1; i >= 0; i--) {
      if (!this.slotObjects[i].filled) { worstIdx = i; break; }
    }
    if (worstIdx === -1) { this.evaluateRound(); return; }
    Effects.flashRect(this, this.slotObjects[worstIdx].x, this.slotObjects[worstIdx].y, this.slotObjects[worstIdx].w, this.slotObjects[worstIdx].w * 1.25, COLORS.AUTOFILL_FLASH, 200);
    this.placeDigit(worstIdx);
  }

  update() {
    if (this.gameOver || this.paused || this.stageTransitioning) return;
    if (Date.now() - this.lastInputTime > 25000 && !this.gameOver) {
      GameState.strikes = 3;
      this.updateCrystals();
      this.triggerGameOver();
      return;
    }
    if (this.dropTimerEvent && this.currentDigit) {
      const elapsed = this.time.now - this.dropTimerStart;
      const ratio = Math.max(0, 1 - elapsed / this.dropTimerDuration);
      this.timerBar.setSize((this.gameWidth - 80) * ratio, 6);
      this.timerBar.setFillStyle(ratio < 0.35 ? COLORS.TIMER_LOW : COLORS.TIMER_BAR);
      if (ratio < 0.4 && !this.timerWarned) { this.timerWarned = true; SoundFX.timerTick(); }
    }
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}

Object.assign(GameScene.prototype, GameSceneMixin);
