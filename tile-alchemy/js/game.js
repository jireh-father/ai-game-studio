// game.js - GameScene: grid setup, input handling, core merge logic

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.gameOver = false;
    this.paused = false;
    this.stageTransitioning = false;
    this.inputLocked = false;
    this.selectedTile = null;
    this.chainCount = 0;
    this.cascading = false;
    this.idleTimer = 0;
    this.idleWarningActive = false;
    this.voidRapidMode = false;
    this.pauseOverlayGroup = null;
    this.gameOverGroup = null;

    GameState.score = 0;
    GameState.stage = 1;
    GameState.mergesThisStage = 0;
    GameState.mergesSincePure = 0;
    GameState.voidCount = 0;
    AdManager.reset();

    this.stageConfig = getStageConfig(1);
    this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, COLORS.BG);

    // Draw grid backgrounds
    this.gridBgs = [];
    for (let r = 0; r < 5; r++) {
      this.gridBgs[r] = [];
      for (let c = 0; c < 5; c++) {
        const pos = this.cellToPixel(r, c);
        this.gridBgs[r][c] = this.add.image(pos.x, pos.y, 'empty_cell').setDepth(1);
      }
    }

    // Init grid data
    this.grid = [];
    for (let r = 0; r < 5; r++) {
      this.grid[r] = [];
      for (let c = 0; c < 5; c++) {
        this.grid[r][c] = { element: null, sprite: null, symbol: null };
      }
    }
    fillEmptyCells(this.grid, this.stageConfig.tierWeights);
    this.renderAllTiles();

    // HUD
    this.hud = new HUD(this);
    this.hud.updateMergeProgress(0, this.stageConfig.mergeTarget);

    // Selection glow
    this.selectionGlow = this.add.rectangle(0, 0, 60, 60, 0x000000, 0)
      .setStrokeStyle(3, COLORS.SELECTION).setDepth(5).setVisible(false);
    this.tweens.add({ targets: this.selectionGlow, alpha: { from: 0.6, to: 1 }, duration: 600, yoyo: true, repeat: -1 });

    // Input
    this.input.on('pointerdown', (pointer) => this.handleTap(pointer));

    // Void spread timer
    this.startVoidTimer();

    // Idle warning overlay
    this.idleOverlay = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, COLORS.DANGER, 0).setDepth(15);
    this.idleText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'WAKE UP,\nALCHEMIST!', {
      fontSize: '32px', fontFamily: 'Arial', color: '#FF1744', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5).setDepth(16).setVisible(false);

    // Blur handler
    this.game.events.on('blur', () => { if (!this.gameOver) this.pauseGame(); });
  }

  startVoidTimer() {
    if (this.voidTimerEvent) this.voidTimerEvent.remove();
    const interval = this.voidRapidMode ? CONFIG.IDLE_RAPID_INTERVAL : this.stageConfig.voidSpreadInterval;
    this.voidTimerEvent = this.time.addEvent({ delay: interval, callback: () => this.spreadVoid(), loop: true });
  }

  cellToPixel(r, c) {
    return {
      x: CONFIG.GRID_OFFSET_X + c * CONFIG.CELL_STEP + CONFIG.CELL_SIZE / 2,
      y: CONFIG.GRID_OFFSET_Y + r * CONFIG.CELL_STEP + CONFIG.CELL_SIZE / 2,
    };
  }

  pixelToCell(px, py) {
    const c = Math.floor((px - CONFIG.GRID_OFFSET_X) / CONFIG.CELL_STEP);
    const r = Math.floor((py - CONFIG.GRID_OFFSET_Y) / CONFIG.CELL_STEP);
    if (r >= 0 && r < 5 && c >= 0 && c < 5) return { r, c };
    return null;
  }

  renderTile(r, c) {
    const cell = this.grid[r][c];
    if (cell.sprite) { cell.sprite.destroy(); cell.sprite = null; }
    if (cell.symbol) { cell.symbol.destroy(); cell.symbol = null; }
    if (!cell.element) return;
    const pos = this.cellToPixel(r, c);
    const def = ELEMENT_DEFS[cell.element];
    const texKey = cell.element === 'void' ? 'void_tile' : (cell.element === 'pure' ? 'pure_tile' : 'tile_' + cell.element);
    cell.sprite = this.add.image(pos.x, pos.y, texKey).setDepth(2);
    cell.symbol = this.add.text(pos.x, pos.y, def.symbol, {
      fontSize: (def.tier >= 2 ? '18' : '22') + 'px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);
  }

  renderAllTiles() {
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) this.renderTile(r, c);
  }

  handleTap(pointer) {
    if (this.gameOver || this.paused || this.inputLocked || this.cascading) return;
    this.resetIdle();
    const cell = this.pixelToCell(pointer.x, pointer.y);
    if (!cell) return;
    const { r, c } = cell;
    const el = this.grid[r][c].element;
    if (!el) return;
    if (!this.selectedTile) {
      if (el === 'void') return;
      this.selectTile(r, c);
    } else {
      const s = this.selectedTile;
      if (s.r === r && s.c === c) { this.deselectTile(); return; }
      if (this.isAdjacent(s.r, s.c, r, c)) {
        this.deselectTile();
        this.attemptMerge(s.r, s.c, r, c);
      } else {
        this.deselectTile();
        if (el !== 'void') this.selectTile(r, c);
      }
    }
  }

  selectTile(r, c) {
    this.selectedTile = { r, c };
    const pos = this.cellToPixel(r, c);
    this.selectionGlow.setPosition(pos.x, pos.y).setVisible(true);
    const sp = this.grid[r][c].sprite;
    if (sp) this.tweens.add({ targets: sp, scaleX: 1.15, scaleY: 1.15, duration: 60, yoyo: true });
    if (navigator.vibrate) navigator.vibrate(10);
  }

  deselectTile() { this.selectedTile = null; this.selectionGlow.setVisible(false); }
  isAdjacent(r1, c1, r2, c2) { return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1; }

  getAdjacentCells(r, c) {
    const adj = [];
    if (r > 0) adj.push({ r: r - 1, c });
    if (r < 4) adj.push({ r: r + 1, c });
    if (c > 0) adj.push({ r, c: c - 1 });
    if (c < 4) adj.push({ r, c: c + 1 });
    return adj;
  }

  clearCell(r, c) {
    if (this.grid[r][c].sprite) { this.grid[r][c].sprite.destroy(); this.grid[r][c].sprite = null; }
    if (this.grid[r][c].symbol) { this.grid[r][c].symbol.destroy(); this.grid[r][c].symbol = null; }
    this.grid[r][c].element = null;
  }

  attemptMerge(r1, c1, r2, c2) {
    const elA = this.grid[r1][c1].element;
    const elB = this.grid[r2][c2].element;
    const result = lookupMerge(elA, elB);
    if (result === '__cleanse__') this.executeCleanse(r1, c1, r2, c2, elA, elB);
    else if (result) this.executeMerge(r1, c1, r2, c2, result, 1);
    else this.spawnVoidTile(r1, c1, r2, c2, elA, elB);
  }

  executeMerge(r1, c1, r2, c2, result, chainStep) {
    this.inputLocked = true;
    this.cascading = true;
    const pos1 = this.cellToPixel(r1, c1);
    // Flash both tiles
    [this.grid[r1][c1], this.grid[r2][c2]].forEach(cell => {
      if (cell.sprite) this.tweens.add({ targets: cell.sprite, alpha: 0, duration: CONFIG.MERGE_FLASH_DURATION });
      if (cell.symbol) this.tweens.add({ targets: cell.symbol, alpha: 0, duration: CONFIG.MERGE_FLASH_DURATION });
    });
    this.time.delayedCall(CONFIG.MERGE_FLASH_DURATION, () => {
      this.clearCell(r1, c1);
      this.clearCell(r2, c2);
      this.grid[r1][c1].element = result;
      this.renderTile(r1, c1);
      // Transmutation pop
      const sp = this.grid[r1][c1].sprite;
      const sym = this.grid[r1][c1].symbol;
      if (sp) { sp.setScale(0); this.tweens.add({ targets: sp, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' }); }
      if (sym) { sym.setScale(0); this.tweens.add({ targets: sym, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' }); }
      // Particles & score
      spawnParticles(this, pos1.x, pos1.y, ELEMENT_DEFS[result].color, 20 + chainStep * 6);
      const tier = ELEMENT_DEFS[result].tier;
      const base = SCORE_VALUES.MERGE_TIER[Math.min(tier, 3)] || 50;
      const points = base * chainStep;
      GameState.score += points;
      showFloatingText(this, pos1.x, pos1.y - 10, '+' + points, '#FFD700', 18 + chainStep * 4);
      if (chainStep > 1) showFloatingText(this, pos1.x, pos1.y + 20, 'x' + chainStep + '!', '#FFD700', 24 + chainStep * 6);
      this.cameras.main.shake(120, Math.min(14, 2 + (chainStep - 1) * 2) / 1000);
      if (result === 'philosopher') philosopherEffect(this, pos1.x, pos1.y);
      if (GameState.voidCount === 0) GameState.score += SCORE_VALUES.BOARD_SURVIVAL_BONUS;
      GameState.mergesThisStage++;
      GameState.mergesSincePure++;
      this.hud.updateScore();
      this.hud.updateMergeProgress(GameState.mergesThisStage, this.stageConfig.mergeTarget);
      this.hud.updatePure();
      if (GameState.mergesSincePure >= CONFIG.PURE_CRYSTAL_FREQUENCY) {
        GameState.mergesSincePure = 0;
        this.spawnPureCrystal();
        this.hud.updatePure();
      }
      this.time.delayedCall(50, () => {
        applyGravity(this, () => { this.checkChainReaction(r1, c1, result, chainStep); });
      });
    });
  }

  checkChainReaction(r, c, element, chainStep) {
    const adj = this.getAdjacentCells(r, c);
    let bestMerge = null, bestTier = -1;
    for (const a of adj) {
      const el = this.grid[a.r][a.c].element;
      if (!el || el === 'void' || el === null) continue;
      const res = lookupMerge(element, el);
      if (res && res !== '__cleanse__') {
        const t = ELEMENT_DEFS[res].tier;
        if (t > bestTier) { bestTier = t; bestMerge = { r: a.r, c: a.c, result: res }; }
      }
    }
    if (bestMerge) {
      this.time.delayedCall(CONFIG.CHAIN_DELAY, () => {
        this.executeMerge(r, c, bestMerge.r, bestMerge.c, bestMerge.result, chainStep + 1);
      });
    } else {
      this.cascading = false;
      this.inputLocked = false;
      this.checkStageAdvance();
      this.checkBoardState();
    }
  }

  spawnPureCrystal() {
    const candidates = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      const el = this.grid[r][c].element;
      if (el && el !== 'void' && el !== 'pure') candidates.push({ r, c });
    }
    if (candidates.length === 0) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    this.clearCell(pick.r, pick.c);
    this.grid[pick.r][pick.c].element = 'pure';
    this.renderTile(pick.r, pick.c);
    const pos = this.cellToPixel(pick.r, pick.c);
    spawnParticles(this, pos.x, pos.y, COLORS.PURE_CRYSTAL, 12);
  }

  resetIdle() {
    this.idleTimer = 0;
    if (this.voidRapidMode) { this.voidRapidMode = false; this.startVoidTimer(); }
    if (this.idleWarningActive) {
      this.idleWarningActive = false;
      this.idleOverlay.setAlpha(0);
      this.idleText.setVisible(false);
    }
  }

  update(time, delta) {
    if (this.gameOver || this.paused) return;
    this.idleTimer += delta;
    if (this.idleTimer >= CONFIG.IDLE_TIMEOUT && !this.idleWarningActive) {
      this.idleWarningActive = true;
      this.idleText.setVisible(true);
      this.tweens.add({ targets: this.idleOverlay, alpha: 0.15, duration: 400, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: this.idleText, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });
      if (!this.voidRapidMode) {
        this.voidRapidMode = true;
        if (GameState.voidCount === 0) {
          const r = Math.floor(Math.random() * 5), c = Math.floor(Math.random() * 5);
          this.clearCell(r, c); this.grid[r][c].element = 'void';
          GameState.voidCount++; this.renderTile(r, c); this.hud.updateVoid(GameState.voidCount);
        }
        this.startVoidTimer();
      }
    }
  }

  pauseGame() { this.paused = true; if (this.voidTimerEvent) this.voidTimerEvent.paused = true; }
  resumeGame() { this.paused = false; if (this.voidTimerEvent) this.voidTimerEvent.paused = false; }
}
