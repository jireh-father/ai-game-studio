// Mirror Logic - GameScene (core gameplay)

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    if (data && data.continueStage) GameState.stage = data.continueStage;
  }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.stageData = generateStage(GameState.stage);
    this.mirrors = [];
    this.mirrorsPlaced = 0;
    this.mirrorsRemoved = 0;
    this.hitTargetsThisStage = new Set();
    this.paused = false;
    this.stageCleared = false;
    this.dead = false;
    this.tapCooldown = 0;
    this.longPressTimer = null;
    this.pointerCol = undefined;
    this.pointerRow = undefined;

    const sd = this.stageData;
    this.cellSize = Math.min(GRID.MAX_CELL,
      Math.floor((w - GRID.PADDING * 2) / sd.cols),
      Math.floor((h - GRID.HUD_TOP - GRID.HUD_BOTTOM - 20) / sd.rows));
    this.cellSize = Math.max(GRID.MIN_CELL, this.cellSize);
    this.gridOffsetX = Math.floor((w - sd.cols * this.cellSize) / 2);
    this.gridOffsetY = GRID.HUD_TOP + Math.floor((h - GRID.HUD_TOP - GRID.HUD_BOTTOM - sd.rows * this.cellSize) / 2);

    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0E1A);

    // Build grid cells
    this.gridCells = [];
    for (let c = 0; c < sd.cols; c++) {
      this.gridCells[c] = [];
      for (let r = 0; r < sd.rows; r++) {
        const pos = this.gridToScreen(c, r);
        const sprite = this.add.image(pos.x, pos.y, 'cell').setDisplaySize(this.cellSize, this.cellSize);
        this.gridCells[c][r] = { sprite, type: 'empty', obj: null };
      }
    }

    // Stage border
    if (sd.borderColor) {
      const bx = this.gridOffsetX + (sd.cols * this.cellSize) / 2;
      const by = this.gridOffsetY + (sd.rows * this.cellSize) / 2;
      this.add.rectangle(bx, by, sd.cols * this.cellSize + 4, sd.rows * this.cellSize + 4)
        .setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(sd.borderColor).color).setFillStyle(0, 0);
    }

    // Place entities
    this.placeEntity(sd.emitter.col, sd.emitter.row, 'emitter', 'emitter');
    sd.targets.forEach(t => this.placeEntity(t.col, t.row, 'target', 'target_' + t.num));
    sd.walls.forEach(wl => this.placeEntity(wl.col, wl.row, wl.type, wl.type === 'wallBomb' ? 'wallBomb' : 'wall'));

    // Laser graphics layers
    this.laserGlowGfx = this.add.graphics();
    this.laserGfx = this.add.graphics();

    this.createHUD(w);

    // Timer via setInterval (avoids timeScale=0 bug)
    this.timeLeft = sd.timer;
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      if (this.paused || this.stageCleared || this.dead) return;
      this.timeLeft--;
      this.updateTimerDisplay();
      if (this.timeLeft <= 0) { clearInterval(this.timerInterval); this.triggerExplosion(null, "TIME'S UP!"); }
    }, 1000);

    // Input handlers
    this.input.on('pointerdown', p => this.handlePointerDown(p));
    this.input.on('pointerup', p => this.handlePointerUp(p));

    // Visibility
    this.visHandler = () => { if (document.hidden && !this.paused) this.togglePause(); };
    document.addEventListener('visibilitychange', this.visHandler);

    this.traceLaserBeam();
  }

  placeEntity(col, row, type, textureKey) {
    const pos = this.gridToScreen(col, row);
    const sprite = this.add.image(pos.x, pos.y, textureKey).setDisplaySize(this.cellSize - 2, this.cellSize - 2);
    this.gridCells[col][row] = { sprite, type, obj: null };
  }

  gridToScreen(col, row) {
    return { x: this.gridOffsetX + col * this.cellSize + this.cellSize / 2, y: this.gridOffsetY + row * this.cellSize + this.cellSize / 2 };
  }

  createHUD(w) {
    const h = this.scale.height;
    this.scoreText = this.add.text(10, 12, `Score: ${GameState.score}`, { fontSize: '16px', fontFamily: 'monospace', color: COLORS.UI_TEXT }).setDepth(10);
    this.stageText = this.add.text(w / 2, 12, `Stg ${GameState.stage}`, { fontSize: '16px', fontFamily: 'monospace', color: COLORS.UI_TEXT }).setOrigin(0.5, 0).setDepth(10);
    this.timerText = this.add.text(w - 10, 12, `${this.stageData.timer}s`, { fontSize: '20px', fontFamily: 'monospace', color: COLORS.TIMER_NORMAL, fontStyle: 'bold' }).setOrigin(1, 0).setDepth(10);
    this.mirrorText = this.add.text(10, h - GRID.HUD_BOTTOM + 16, `Mirrors: 0/${this.stageData.mirrorBudget}`, { fontSize: '14px', fontFamily: 'monospace', color: COLORS.UI_TEXT }).setDepth(10);

    // Help & Pause buttons
    const makeCircleBtn = (x, y, label, cb) => {
      const btn = this.add.circle(x, y, 20, 0x1A2040).setStrokeStyle(2, 0xC0C8D8).setInteractive({ useHandCursor: true }).setDepth(10);
      this.add.text(x, y, label, { fontSize: label === '?' ? '20px' : '16px', fontFamily: 'monospace', color: COLORS.MIRROR }).setOrigin(0.5).setDepth(10);
      btn.on('pointerdown', (p) => { p.event.stopPropagation(); cb(); });
    };
    makeCircleBtn(w - 80, h - GRID.HUD_BOTTOM + 28, '?', () => { if (!this.paused) this.togglePause(); this.scene.launch('HelpScene', { returnTo: 'GameScene' }); });
    makeCircleBtn(w - 30, h - GRID.HUD_BOTTOM + 28, '||', () => this.togglePause());
  }

  updateTimerDisplay() {
    if (!this.timerText) return;
    this.timerText.setText(`${this.timeLeft}s`);
    if (this.timeLeft <= TIMER.CRITICAL) {
      this.timerText.setColor(COLORS.TIMER_CRITICAL);
      this.tweens.add({ targets: this.timerText, scaleX: 1.2, scaleY: 1.2, duration: 250, yoyo: true });
    } else if (this.timeLeft <= TIMER.WARNING) {
      this.timerText.setColor(COLORS.TIMER_WARNING);
      this.tweens.add({ targets: this.timerText, scaleX: 1.05, scaleY: 1.05, duration: 400, yoyo: true });
    } else {
      this.timerText.setColor(COLORS.TIMER_NORMAL);
    }
  }

  handlePointerDown(pointer) {
    if (this.paused || this.stageCleared || this.dead) return;
    if (Date.now() - this.tapCooldown < 150) return;
    this.tapCooldown = Date.now();
    const col = Math.floor((pointer.x - this.gridOffsetX) / this.cellSize);
    const row = Math.floor((pointer.y - this.gridOffsetY) / this.cellSize);
    if (col < 0 || col >= this.stageData.cols || row < 0 || row >= this.stageData.rows) return;
    this.pointerCol = col; this.pointerRow = row;
    if (this.gridCells[col][row].type === 'mirror') {
      this.longPressTimer = setTimeout(() => { this.removeMirror(col, row); this.longPressTimer = null; }, 400);
    }
  }

  handlePointerUp() {
    if (this.paused || this.stageCleared || this.dead) return;
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer); this.longPressTimer = null;
      if (this.pointerCol !== undefined) {
        const cell = this.gridCells[this.pointerCol][this.pointerRow];
        if (cell.type === 'mirror') this.rotateMirror(this.pointerCol, this.pointerRow);
        else if (cell.type === 'empty') this.placeMirror(this.pointerCol, this.pointerRow);
      }
    } else if (this.pointerCol !== undefined) {
      if (this.justRemoved) { this.justRemoved = false; }
      else {
        const cell = this.gridCells[this.pointerCol][this.pointerRow];
        if (cell.type === 'empty') this.placeMirror(this.pointerCol, this.pointerRow);
      }
    }
    this.pointerCol = undefined; this.pointerRow = undefined;
  }

  placeMirror(col, row) {
    if (this.mirrorsPlaced >= this.stageData.mirrorBudget) {
      Effects.showFloatingText(this, this.scale.width / 2, this.scale.height / 2, 'No mirrors left!', COLORS.TIMER_WARNING);
      return;
    }
    const pos = this.gridToScreen(col, row);
    const sprite = this.add.image(pos.x, pos.y, 'mirror45').setDisplaySize(this.cellSize - 2, this.cellSize - 2);
    this.gridCells[col][row] = { sprite, type: 'mirror', obj: { angle: 45 } };
    this.mirrors.push({ col, row, angle: 45 });
    this.mirrorsPlaced++;
    this.mirrorText.setText(`Mirrors: ${this.mirrorsPlaced}/${this.stageData.mirrorBudget}`);
    Effects.onMirrorPlace(this, sprite, pos.x, pos.y);
    this.traceLaserBeam();
  }

  rotateMirror(col, row) {
    const cell = this.gridCells[col][row];
    const m = this.mirrors.find(m => m.col === col && m.row === row);
    if (!m) return;
    m.angle = m.angle === 45 ? 135 : 45;
    cell.obj.angle = m.angle;
    cell.sprite.setTexture(m.angle === 45 ? 'mirror45' : 'mirror135');
    const pos = this.gridToScreen(col, row);
    Effects.onMirrorRotate(this, cell.sprite, pos.x, pos.y);
    this.traceLaserBeam();
  }

  removeMirror(col, row) {
    const cell = this.gridCells[col][row];
    if (cell.type !== 'mirror') return;
    this.justRemoved = true;
    cell.sprite.destroy();
    const pos = this.gridToScreen(col, row);
    const newSprite = this.add.image(pos.x, pos.y, 'cell').setDisplaySize(this.cellSize, this.cellSize);
    this.gridCells[col][row] = { sprite: newSprite, type: 'empty', obj: null };
    this.mirrors = this.mirrors.filter(m => !(m.col === col && m.row === row));
    this.mirrorsPlaced--;
    this.mirrorsRemoved++;
    this.mirrorText.setText(`Mirrors: ${this.mirrorsPlaced}/${this.stageData.mirrorBudget}`);
    this.traceLaserBeam();
  }

  traceLaserBeam() {
    if (this.dead || this.stageCleared) return;
    const sd = this.stageData;
    const result = traceLaser(sd.emitter, this.mirrors, sd.targets, sd.walls, sd.cols, sd.rows);
    Effects.renderLaser(this, result.path, this.laserGlowGfx, this.laserGfx, (c, r) => this.gridToScreen(c, r));
    this.checkTargets(result.hitTargets);
    if (result.hitWallBomb && !this.dead) this.triggerExplosion(result.path[result.path.length - 1], 'DETONATED!');
  }

  checkTargets(hitTargets) {
    if (this.dead || this.stageCleared) return;
    for (let i = 0; i < hitTargets.length; i++) {
      if (hitTargets[i] !== i + 1) { this.triggerExplosion(null, 'WRONG ORDER!'); return; }
    }
    for (const num of hitTargets) {
      if (!this.hitTargetsThisStage.has(num)) {
        this.hitTargetsThisStage.add(num);
        const t = this.stageData.targets.find(t => t.num === num);
        if (t) { Effects.onTargetHit(this, t, this.gridCells[t.col][t.row], this.hitTargetsThisStage.size, this.mirrorsRemoved); Effects.updateScoreText(this, this.scoreText); }
      }
    }
    if (this.hitTargetsThisStage.size === this.stageData.targets.length) this.triggerStageClear();
  }

  triggerStageClear() {
    if (this.stageCleared) return;
    this.stageCleared = true;
    clearInterval(this.timerInterval);
    let stageScore = SCORING.STAGE_CLEAR + Math.max(0, this.timeLeft) * SCORING.TIME_BONUS_PER_SEC;
    if (this.mirrorsRemoved === 0) stageScore += SCORING.PERFECT_BONUS;
    if (this.timeLeft >= SCORING.SPEED_THRESHOLD) stageScore += SCORING.SPEED_BONUS;
    if (this.stageData.isBoss) stageScore += SCORING.BOSS_BONUS;
    GameState.streak++;
    let mult = 1;
    for (const [thr, m] of Object.entries(SCORING.STREAK_THRESHOLDS)) { if (GameState.streak >= parseInt(thr)) mult = m; }
    stageScore = Math.floor(stageScore * mult);
    GameState.score += stageScore;
    Effects.onStageClear(this, stageScore, mult);
    this.time.delayedCall(700, () => {
      GameState.stage++; GameState.highestStage = Math.max(GameState.highestStage, GameState.stage); saveSettings();
      this.cleanupScene(); this.scene.restart();
    });
  }

  triggerExplosion(point, deathType) {
    if (this.dead) return;
    this.dead = true; clearInterval(this.timerInterval);
    const cx = point ? this.gridToScreen(point.col, point.row).x : this.scale.width / 2;
    const cy = point ? this.gridToScreen(point.col, point.row).y : this.scale.height / 2;
    Effects.onExplosion(this, cx, cy);
    this.time.delayedCall(700, () => {
      AdManager.onGameOver(); saveSettings(); this.cleanupScene();
      this.scene.start('GameOverScene', { deathType: deathType || 'DETONATED!', score: GameState.score, stage: GameState.stage });
    });
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) this.showPauseOverlay();
    else this.hidePauseOverlay();
  }

  showPauseOverlay() {
    const w = this.scale.width, h = this.scale.height;
    this.pauseBg = this.add.rectangle(w / 2, h / 2, w, h, 0x0A0E1A, 0.8).setDepth(50).setInteractive();
    this.pauseEls = [this.pauseBg];
    const addBtn = (y, label, col, cb) => {
      const btn = this.add.rectangle(w / 2, y, 180, 48, 0x0A0E1A).setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(col).color).setInteractive({ useHandCursor: true }).setDepth(51);
      const txt = this.add.text(w / 2, y, label, { fontSize: '18px', fontFamily: 'monospace', color: col }).setOrigin(0.5).setDepth(51);
      btn.on('pointerdown', cb); this.pauseEls.push(btn, txt);
    };
    const t = this.add.text(w / 2, h * 0.3, 'PAUSED', { fontSize: '32px', fontFamily: 'monospace', color: COLORS.UI_TEXT, fontStyle: 'bold' }).setOrigin(0.5).setDepth(51);
    this.pauseEls.push(t);
    addBtn(h * 0.45, 'RESUME', COLORS.SUCCESS, () => this.togglePause());
    addBtn(h * 0.55, 'HELP', COLORS.MIRROR, () => this.scene.launch('HelpScene', { returnTo: 'GameScene' }));
    addBtn(h * 0.65, 'RESTART', COLORS.TIMER_WARNING, () => { this.hidePauseOverlay(); GameState.score = 0; GameState.stage = 1; GameState.streak = 0; this.cleanupScene(); this.scene.restart(); });
    addBtn(h * 0.75, 'MENU', COLORS.UI_TEXT, () => { this.cleanupScene(); this.scene.start('MenuScene'); });
  }

  hidePauseOverlay() { if (this.pauseEls) { this.pauseEls.forEach(e => e.destroy()); this.pauseEls = null; } this.paused = false; }

  cleanupScene() { clearInterval(this.timerInterval); if (this.longPressTimer) clearTimeout(this.longPressTimer); document.removeEventListener('visibilitychange', this.visHandler); }
  shutdown() { this.cleanupScene(); }
}
