// Pressure Cooker - Core Gameplay Scene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.currentStage = data.stage || 1;
    this.score = data.score || 0;
    this.usedContinue = data.continued || false;
    this.gameOver = false;
    this.paused = false;
    this.pauseSim = false;
    this.stageTransitioning = false;
    this.clutchChain = 0;
    this.clutchActive = false;
    this.clutchTimer = 0;
    this.lastInputTime = Date.now();
    this.scorePerSecTimer = 0;
    this.steamTimer = 0;
    this.chambers = [];
    this.stageTimeRemaining = 0;
    this.stageDuration = 0;
  }

  create() {
    const w = this.cameras.main.width;
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.createHUD();
    this.loadStage(this.currentStage);

    const pauseBtn = this.add.text(w - 30, 20, '| |', {
      fontSize: '20px', fontFamily: 'monospace', color: COLORS.hudText, fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);
    pauseBtn.on('pointerdown', () => { this.lastInputTime = Date.now(); this.togglePause(); });

    this.visHandler = () => { if (document.hidden && !this.paused && !this.gameOver) this.togglePause(); };
    document.addEventListener('visibilitychange', this.visHandler);
    this.input.on('pointerdown', () => { this.lastInputTime = Date.now(); });
  }

  loadStage(stageNum) {
    this.chambers.forEach(ch => { if (ch.container) ch.container.destroy(); });
    this.chambers = [];
    const config = STAGES.getChamberConfig(stageNum);
    this.stageDuration = config.duration;
    this.stageTimeRemaining = config.duration;
    this.stageTransitioning = false;

    const w = this.cameras.main.width, h = this.cameras.main.height;
    const layout = config.layout;
    const totalW = layout.cols * layout.w + (layout.cols - 1) * LAYOUT.chamberGap;
    const totalH = layout.rows * layout.h + (layout.rows - 1) * LAYOUT.chamberGap;
    const areaTop = LAYOUT.hudHeight + 10;
    const areaBot = h - LAYOUT.timerHeight - 10;
    const startX = (w - totalW) / 2 + layout.w / 2;
    const startY = areaTop + (areaBot - areaTop - totalH) / 2 + layout.h / 2;
    const initPressure = this.usedContinue ? 30 : 0;

    for (let i = 0; i < config.chambers.length; i++) {
      const chData = config.chambers[i];
      const col = i % layout.cols;
      const row = Math.floor(i / layout.cols);
      const cx = startX + col * (layout.w + LAYOUT.chamberGap);
      const cy = startY + row * (layout.h + LAYOUT.chamberGap);
      const container = this.add.container(cx, cy);
      container.add(this.add.image(0, 0, 'chamber').setDisplaySize(layout.w, layout.h));
      const fillGfx = this.add.graphics();
      container.add(fillGfx);

      if (chData.isHot) container.add(this.add.image(0, 0, 'hotOverlay').setDisplaySize(layout.w, layout.h));
      if (chData.isMultiplier) container.add(this.add.image(0, 0, 'multiplierOverlay').setDisplaySize(layout.w, layout.h));

      const lockImg = this.add.image(0, 0, 'lockedOverlay').setDisplaySize(layout.w, layout.h).setVisible(chData.isLocked);
      container.add(lockImg);
      const lockText = this.add.text(0, 0, '', { fontSize: '14px', fontFamily: 'monospace', color: COLORS.hudText, fontStyle: 'bold' }).setOrigin(0.5);
      container.add(lockText);
      const pctText = this.add.text(0, layout.h / 2 - 18, '0%', { fontSize: '12px', fontFamily: 'monospace', color: COLORS.hudText }).setOrigin(0.5);
      container.add(pctText);

      const zone = this.add.zone(0, 0, layout.w, layout.h)
        .setInteractive(new Phaser.Geom.Rectangle(-layout.w / 2, -layout.h / 2, layout.w, layout.h), Phaser.Geom.Rectangle.Contains);
      container.add(zone);

      const chamberObj = { ...chData, pressure: initPressure, container, fillGfx, lockImg, lockText, pctText, zone, w: layout.w, h: layout.h, pulseActive: false };
      this.chambers.push(chamberObj);
      const idx = i;
      zone.on('pointerdown', () => {
        this.lastInputTime = Date.now();
        if (!this.gameOver && !this.paused) this.ventChamber(idx);
      });
    }
    this.currentLayout = layout;
    this.usedContinue = false;
    this.updateHUD();
  }

  ventChamber(index) {
    const ch = this.chambers[index];
    if (!ch || ch.isLocked) { Effects.playLockedThud(); return; }
    const pressure = ch.pressure;
    if (pressure < 1) return;

    const isNearMiss = pressure >= DIFFICULTY.nearMissThreshold;
    const isClutchLevel = pressure >= DIFFICULTY.clutchThreshold;
    const transferAmount = pressure * (ch.isMultiplier ? 2 : 1);
    const neighbors = STAGES.getNeighbors(index, this.chambers.length, this.currentLayout);
    const perNeighbor = neighbors.length > 0 ? transferAmount / neighbors.length : 0;

    ch.pressure = 0;
    neighbors.forEach(ni => {
      this.chambers[ni].pressure = Math.min(100, this.chambers[ni].pressure + perNeighbor);
      this.neighborTransferEffect(ni, perNeighbor);
    });
    this.ventEffect(index, pressure);

    if (isNearMiss) {
      const pts = SCORE_VALUES.nearMiss * (this.clutchActive ? SCORE_VALUES.clutchMultiplier : 1);
      this.addScore(pts);
      this.floatingScore(ch.container.x, ch.container.y - ch.h / 2 - 10, '+' + pts, COLORS.nearMiss);
    }
    neighbors.forEach(ni => {
      if (this.chambers[ni].pressure > 80) this.addScore(SCORE_VALUES.cascadeSurvived);
    });

    if (isClutchLevel) {
      this.clutchChain++;
      if (isNearMiss) this.nearMissEffect(index, this.clutchChain);
      if (this.clutchChain >= DIFFICULTY.clutchChainRequired && !this.clutchActive) {
        this.clutchActive = true;
        this.clutchTimer = SCORE_VALUES.clutchDuration;
        this.clutchActivateEffect();
      }
    } else {
      this.clutchChain = 0;
    }
  }

  update(time, delta) {
    if (this.gameOver || this.paused || this.pauseSim) return;
    const dt = delta / 1000;

    this.stageTimeRemaining -= delta;
    if (this.timerBar) {
      this.timerBar.setSize(this.cameras.main.width * Math.max(0, this.stageTimeRemaining / this.stageDuration), LAYOUT.timerHeight);
    }

    this.scorePerSecTimer += delta;
    if (this.scorePerSecTimer >= 1000) {
      this.scorePerSecTimer -= 1000;
      const allBelow50 = this.chambers.every(c => c.pressure < 50);
      this.addScore(SCORE_VALUES.perSecond * (allBelow50 ? SCORE_VALUES.perSecondAllBelow50Mult : 1));
    }

    if (this.clutchActive) {
      this.clutchTimer -= delta;
      if (this.clutchTimer <= 0) { this.clutchActive = false; this.clutchChain = 0; }
    }

    this.steamTimer += delta;
    if (this.steamTimer >= 500) {
      this.steamTimer -= 500;
      this.chambers.forEach(ch => this.steamParticles(ch));
    }

    for (const ch of this.chambers) {
      if (ch.isLocked) {
        ch.lockedTimer -= delta;
        if (ch.lockedTimer <= 0) { ch.isLocked = false; ch.lockImg.setVisible(false); ch.lockText.setText(''); }
        else ch.lockText.setText(Math.ceil(ch.lockedTimer / 1000) + 's');
      } else {
        ch.pressure += ch.fillRate * dt;
      }
      ch.pressure = Phaser.Math.Clamp(ch.pressure, 0, 100);
      if (ch.pressure >= 100 && !this.gameOver) { this.onExplosion(ch.index); return; }
      this.updateChamberVisual(ch);
    }

    if (this.stageTimeRemaining <= 0 && !this.stageTransitioning) this.onStageClear();

    if (Date.now() - this.lastInputTime > DIFFICULTY.inactivityDeathMs && !this.gameOver) {
      const target = this.chambers.reduce((best, c) => c.pressure > best.pressure ? c : best, this.chambers[0]);
      target.pressure = 100;
      this.onExplosion(target.index);
    }
  }

  onStageClear() {
    this.stageTransitioning = true;
    const maxP = this.chambers.reduce((m, c) => Math.max(m, c.pressure), 0);
    const pts = Math.floor(SCORE_VALUES.stageClearBase * this.currentStage * (maxP < 70 ? SCORE_VALUES.stageClearCleanMult : 1));
    this.addScore(pts);
    this.stageClearEffect();
    this.time.delayedCall(800, () => {
      if (this.gameOver) return;
      this.currentStage++;
      this.loadStage(this.currentStage);
    });
  }

  onExplosion(chamberIdx) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.input.enabled = false;
    this.explosionEffect(chamberIdx);
    Effects.playExplosion();
    this.time.delayedCall(900, () => {
      this.scene.launch('GameOverScene', { score: this.score, stage: this.currentStage, usedContinue: this.usedContinue });
    });
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}

// Mixin effects and UI methods
Object.assign(GameScene.prototype, GameEffects);
Object.assign(GameScene.prototype, GameUI);
