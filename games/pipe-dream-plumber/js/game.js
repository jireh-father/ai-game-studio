// game.js - GameScene: grid, pipe placement, input, scene management

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) { this.continueGame = data && data.continueGame; }

  create() {
    if (this.continueGame && this._savedState) { this.restoreState(); return; }
    this.score = 0; this.stageNum = 1; this.streak = 0;
    this.floodLevel = 0; this.isFlowing = false; this.isPaused = false;
    this.flowFronts = []; this.selectedPipe = null; this.selectedTrayIdx = -1;
    this.lastTapTime = 0; this.inactivityTimer = 0;
    this.countdownActive = true; this.countdownTime = 0;
    this.waterStarted = false; this.gameOverTriggered = false;
    this.gridSprites = []; this.traySprites = []; this.trayPipes = [];
    this.floodOverlay = null; this.timerBar = null; this.timerText = null;
    this.pauseOverlay = null; this.connectedDrains = new Set();
    this.startStage();
  }

  startStage() {
    this.children.removeAll(true);
    this.gridSprites = []; this.traySprites = [];
    this.floodLevel = 0; this.isFlowing = false;
    this.flowFronts = []; this.connectedDrains = new Set();
    this.waterStarted = false; this.gameOverTriggered = false;
    this.countdownActive = true; this.inactivityTimer = 0;
    this.selectedPipe = null; this.selectedTrayIdx = -1;

    const w = this.scale.width, h = this.scale.height;
    this.stageData = generateStage(this.stageNum);
    const { grid, params, theme, humor } = this.stageData;
    this.grid = grid;
    this.countdownTime = params.timer * 1000;
    this.countdownMax = this.countdownTime;
    this.waterSpeed = params.waterSpeed;
    this.flowAccum = 0;

    const bgColor = Phaser.Display.Color.HexStringToColor(theme.bg).color;
    this.add.rectangle(w / 2, h / 2, w, h, bgColor);

    // Humor text
    const ht = this.add.text(w / 2, 50, humor, {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'italic', fill: COLORS.pipeOutline
    }).setOrigin(0.5).setAlpha(0.7).setDepth(5);
    this.tweens.add({ targets: ht, alpha: 0, delay: 2000, duration: 1000 });

    // Grid layout
    const rows = params.rows || grid.length;
    const cols = params.cols || grid[0].length;
    const cellSize = Math.min(Math.floor((w - 20) / cols), Math.floor((h - 240) / rows), 60);
    this.cellSize = cellSize;
    this.gridOffX = (w - cols * cellSize) / 2;
    this.gridOffY = 60;
    this.rows = rows; this.cols = cols;

    this.drawGrid(rows, cols, cellSize);
    this.drawTimerBar(rows, cellSize, w, params.timer);
    this.trayPipes = generateTray(this.stageNum);
    this.trayY = h - 70;
    this.drawTray();
    this.hud = createHUD(this);
    updateHUD(this.hud, this);

    this.floodOverlay = this.add.rectangle(w / 2, h, w, 0, 0x4FC3F7, 0.55).setOrigin(0.5, 1).setDepth(40);
    this._visHandler = () => { if (document.hidden) this.pauseGame(); };
    document.addEventListener('visibilitychange', this._visHandler);
  }

  drawGrid(rows, cols, cellSize) {
    for (let r = 0; r < rows; r++) {
      this.gridSprites[r] = [];
      for (let c = 0; c < cols; c++) {
        const cx = this.gridOffX + c * cellSize + cellSize / 2;
        const cy = this.gridOffY + r * cellSize + cellSize / 2;
        const cell = this.grid[r][c];
        let sprite;
        if (cell.type === 'source') {
          sprite = this.add.image(cx, cy, 'source').setDisplaySize(cellSize, cellSize);
          Effects.sourcePulse(this, sprite);
        } else if (cell.type === 'drain') {
          sprite = this.add.image(cx, cy, 'drain').setDisplaySize(cellSize, cellSize);
        } else if (cell.type === 'obstacle') {
          sprite = this.add.image(cx, cy, 'obstacle').setDisplaySize(cellSize, cellSize);
        } else {
          sprite = this.add.image(cx, cy, 'cell').setDisplaySize(cellSize, cellSize);
          sprite.setInteractive({ useHandCursor: true });
          const row = r, col = c;
          sprite.on('pointerdown', () => this.handleCellTap(row, col));
        }
        sprite.setDepth(2);
        this.gridSprites[r][c] = { bg: sprite, pipe: null, water: null };
      }
    }
  }

  drawTimerBar(rows, cellSize, w, timerSecs) {
    const timerY = this.gridOffY + rows * cellSize + 10;
    this.add.rectangle(w / 2, timerY, w - 40, 24, 0x263238).setDepth(10);
    this.timerBar = this.add.rectangle(w / 2, timerY, w - 40, 20, 0x66BB6A).setDepth(11);
    this.timerText = this.add.text(w / 2, timerY, `${timerSecs}s`, {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#fff'
    }).setOrigin(0.5).setDepth(12);
  }

  drawTray() {
    this.traySprites.forEach(s => { if (s.bg) s.bg.destroy(); if (s.icon) s.icon.destroy(); if (s.sel) s.sel.destroy(); });
    this.traySprites = [];
    const w = this.scale.width;
    const slotW = 52, gap = 8;
    const totalW = this.trayPipes.length * (slotW + gap) - gap;
    const startX = (w - totalW) / 2 + slotW / 2;
    this.add.rectangle(w / 2, this.trayY, w, 80, Phaser.Display.Color.HexStringToColor(COLORS.trayBg).color).setDepth(9);

    for (let i = 0; i < this.trayPipes.length; i++) {
      const x = startX + i * (slotW + gap);
      const bg = this.add.rectangle(x, this.trayY, slotW, slotW, 0xECEFF1).setStrokeStyle(2, 0x37474F).setDepth(10);
      let icon = null;
      if (this.trayPipes[i]) {
        const texKey = PIPE_SVG_MAP[this.trayPipes[i]];
        icon = this.add.image(x, this.trayY, texKey).setDisplaySize(slotW - 8, slotW - 8).setDepth(11);
      }
      bg.setInteractive({ useHandCursor: true });
      const idx = i;
      bg.on('pointerdown', () => this.handleTrayTap(idx));
      const sel = this.add.rectangle(x, this.trayY, slotW + 4, slotW + 4, 0xFFFFFF, 0)
        .setStrokeStyle(3, 0xFFFFFF).setDepth(12).setVisible(false);
      this.traySprites.push({ bg, icon, sel });
    }
  }

  handleTrayTap(idx) {
    if (this.isPaused || this.gameOverTriggered || !this.trayPipes[idx]) return;
    this.resetInactivity();
    sfx.play('uiClick');
    this.traySprites.forEach(s => s.sel.setVisible(false));
    this.selectedPipe = this.trayPipes[idx];
    this.selectedTrayIdx = idx;
    this.traySprites[idx].sel.setVisible(true);
    this.highlightValidCells(true);
  }

  highlightValidCells(show) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        const gs = this.gridSprites[r][c];
        if (show && cell.type === 'empty' && !cell.pipeType && this.selectedPipe) gs.bg.setTint(0xE8F5E9);
        else if (cell.type === 'empty' && !cell.pipeType) gs.bg.clearTint();
      }
    }
  }

  handleCellTap(r, c) {
    if (this.isPaused || this.gameOverTriggered) return;
    this.resetInactivity();
    const cell = this.grid[r][c];
    if (cell.pipeType && !cell.hasWater) {
      cell.rotation = (cell.rotation + 1) % (PIPE_DEFS[cell.pipeType].rotStates === 2 ? 2 : 4);
      const gs = this.gridSprites[r][c];
      if (gs.pipe) { Effects.pipeRotateAnim(this, gs.pipe); }
      sfx.play('pipeRotate');
      Effects.scalePunch(this, gs.pipe, 1.15, 80);
      this.score += 5;
      updateHUD(this.hud, this);
    } else if (!cell.pipeType && cell.type === 'empty' && this.selectedPipe) {
      this.placePipe(r, c);
    } else if (cell.pipeType && cell.hasWater) {
      const gs = this.gridSprites[r][c];
      if (gs.pipe) this.tweens.add({ targets: gs.pipe, x: gs.pipe.x + 3, duration: 50, yoyo: true, repeat: 2 });
    }
  }

  placePipe(r, c) {
    const cell = this.grid[r][c];
    cell.pipeType = this.selectedPipe; cell.rotation = 0;
    const cx = this.gridOffX + c * this.cellSize + this.cellSize / 2;
    const cy = this.gridOffY + r * this.cellSize + this.cellSize / 2;
    const texKey = PIPE_SVG_MAP[this.selectedPipe];
    const pipe = this.add.image(cx, cy, texKey).setDisplaySize(this.cellSize - 4, this.cellSize - 4).setDepth(5);
    pipe.setScale(0.5);
    this.tweens.add({ targets: pipe, scaleX: (this.cellSize - 4) / 48, scaleY: (this.cellSize - 4) / 48, duration: 100, ease: 'Bounce.easeOut' });
    this.gridSprites[r][c].pipe = pipe;
    Effects.pipePlace(this, cx, cy);
    sfx.play('pipePlace');
    this.score += SCORING.pipePlaced;
    Effects.scoreFloat(this, cx, cy - 20, `+${SCORING.pipePlaced}`, COLORS.accent);
    updateHUD(this.hud, this);
    // Remove from tray and schedule refill
    this.trayPipes[this.selectedTrayIdx] = null;
    if (this.traySprites[this.selectedTrayIdx].icon) this.traySprites[this.selectedTrayIdx].icon.destroy();
    this.traySprites[this.selectedTrayIdx].icon = null;
    this.traySprites[this.selectedTrayIdx].sel.setVisible(false);
    const refillIdx = this.selectedTrayIdx;
    this.time.delayedCall(getRefillDelay(this.stageNum), () => this.refillTraySlot(refillIdx));
    this.selectedPipe = null; this.selectedTrayIdx = -1;
    this.highlightValidCells(false);
    // Sympathetic pulse
    for (const [dr, dc] of DIR_DR) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.gridSprites[nr][nc].pipe)
        Effects.scalePunch(this, this.gridSprites[nr][nc].pipe, 1.08, 80);
    }
  }

  refillTraySlot(idx) {
    if (this.gameOverTriggered) return;
    this.trayPipes[idx] = generateTray(this.stageNum)[0];
    this.drawTray();
  }

  togglePause() {
    if (this.gameOverTriggered) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) this.showPauseMenu(); else this.hidePauseMenu();
  }

  pauseGame() { if (!this.isPaused && !this.gameOverTriggered) this.togglePause(); }

  showPauseMenu() {
    const w = this.scale.width, h = this.scale.height;
    this.pauseGroup = [];
    const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6).setDepth(200);
    this.pauseGroup.push(bg);
    const btns = [
      { text: 'Resume', color: 0x66BB6A, y: h * 0.35, action: () => this.togglePause() },
      { text: 'How to Play', color: 0xFFB300, y: h * 0.47, action: () => { this.hidePauseMenu(); this.scene.launch('HelpScene', { returnTo: 'GameScene' }); this.scene.pause(); }},
      { text: 'Restart', color: 0x78909C, y: h * 0.59, action: () => { this.hidePauseMenu(); this.scene.restart(); }},
      { text: 'Quit', color: 0xEF5350, y: h * 0.71, action: () => { this.hidePauseMenu(); this.scene.start('MenuScene'); }}
    ];
    btns.forEach(b => {
      const btn = this.add.rectangle(w / 2, b.y, 180, 50, b.color).setInteractive({ useHandCursor: true }).setDepth(201);
      const txt = this.add.text(w / 2, b.y, b.text, { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#fff' }).setOrigin(0.5).setDepth(202);
      btn.on('pointerdown', () => { sfx.play('uiClick'); b.action(); });
      this.pauseGroup.push(btn, txt);
    });
  }

  hidePauseMenu() { this.isPaused = false; if (this.pauseGroup) this.pauseGroup.forEach(o => o.destroy()); this.pauseGroup = null; }
  resetInactivity() { this.inactivityTimer = 0; }

  update(time, delta) {
    if (this.isPaused || this.gameOverTriggered) return;
    this.inactivityTimer += delta;
    if (this.inactivityTimer >= INACTIVITY_TIMEOUT && !this.waterStarted) WaterFlow.startWater(this, true);
    if (this.countdownActive && !this.waterStarted) {
      this.countdownTime -= delta;
      const secs = Math.max(0, Math.ceil(this.countdownTime / 1000));
      if (this.timerText) this.timerText.setText(`${secs}s`);
      const pct = Math.max(0, this.countdownTime / this.countdownMax);
      if (this.timerBar) this.timerBar.setScale(pct, 1);
      if (secs <= 3 && secs > 0) { if (this.timerText) this.timerText.setColor(COLORS.danger); sfx.play('tick'); }
      if (this.countdownTime <= 0) { this.countdownActive = false; WaterFlow.startWater(this, false); }
    }
    if (this.waterStarted && this.flowFronts.length > 0) {
      this.flowAccum += delta;
      while (this.flowAccum >= this.currentWaterSpeed && this.flowFronts.length > 0) {
        this.flowAccum -= this.currentWaterSpeed;
        WaterFlow.advanceWater(this);
      }
    }
    if (this.floodLevel > 0 && this.floodLevel < 1) {
      this.floodLevel += FLOOD_RATE * (delta / 1000);
      if (this.floodLevel >= 1) this.triggerGameOver();
      WaterFlow.updateFloodVisual(this);
    }
  }

  triggerGameOver() {
    if (this.gameOverTriggered) return;
    this.gameOverTriggered = true;
    Effects.deathShake(this); Effects.redFlash(this); sfx.play('gameOver');
    const isNewRecord = this.score > GameState.highScore;
    if (isNewRecord) GameState.highScore = this.score;
    if (this.stageNum > GameState.bestStage) GameState.bestStage = this.stageNum;
    GameState.gamesPlayed++; saveState();
    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', { score: this.score, stage: this.stageNum, isNewRecord });
    });
  }

  shutdown() { if (this._visHandler) document.removeEventListener('visibilitychange', this._visHandler); }
}
