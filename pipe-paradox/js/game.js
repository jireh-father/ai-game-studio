// game.js - GameScene: grid, pipe placement, rule shifts, juice
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  create() {
    const G = CONFIG.GRID;
    this.gridOffsetX = (CONFIG.GAME.width - G.cols * G.cellSize) / 2;
    this.gridOffsetY = CONFIG.HUD_HEIGHT + 4;
    this.grid = []; this.sources = []; this.drains = [];
    this.activeRules = [CONFIG.RULES[0]]; this.lastRuleId = 0;
    this.ruleTimer = CONFIG.DIFFICULTY.BASE_RULE_TIMER; this.ruleElapsed = 0;
    this.lastInputTime = Date.now(); this.gameActive = true;
    this.previewShown = false; this.nextRule = null; this.tapTimes = {};
    this._lastOverflows = 0; this._pressureWaveApplied = false;
    SoundManager.init();
    this.initGrid();
    this.drawGrid();
    this.setupSourcesAndDrains();
    this.scene.launch('UIScene');
    this.input.on('pointerdown', (p) => this.onPointerDown(p));
    this.input.on('pointerup', (p) => this.onPointerUp(p));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.gameActive) this.scene.pause();
    });
    this.emitHUD(1);
  }

  initGrid() {
    for (let r = 0; r < CONFIG.GRID.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < CONFIG.GRID.cols; c++) {
        this.grid[r][c] = { type: 'empty', rotation: 0, pressure: 0,
          flowState: 'EMPTY', sprite: null, pressBar: null, isSource: false, isDrain: false };
      }
    }
  }

  drawGrid() {
    const G = CONFIG.GRID, gfx = this.add.graphics();
    gfx.lineStyle(1, Phaser.Display.Color.HexStringToColor(CONFIG.COLORS.GRID).color, 0.3);
    for (let r = 0; r <= G.rows; r++) {
      const y = this.gridOffsetY + r * G.cellSize;
      gfx.lineBetween(this.gridOffsetX, y, this.gridOffsetX + G.cols * G.cellSize, y);
    }
    for (let c = 0; c <= G.cols; c++) {
      const x = this.gridOffsetX + c * G.cellSize;
      gfx.lineBetween(x, this.gridOffsetY, x, this.gridOffsetY + G.rows * G.cellSize);
    }
  }

  cellCenter(r, c) {
    return {
      x: this.gridOffsetX + c * CONFIG.GRID.cellSize + CONFIG.GRID.cellSize / 2,
      y: this.gridOffsetY + r * CONFIG.GRID.cellSize + CONFIG.GRID.cellSize / 2
    };
  }

  setupSourcesAndDrains() {
    const diff = StageManager.calculateDifficulty(GameState.cycleNumber);
    this.ruleTimer = diff.ruleTimer;
    const ns = StageManager.placeSources(diff.sourceCount, []);
    const nd = StageManager.placeDrains(diff.drainCount, ns, []);
    ns.forEach(s => this.addSource(s.r, s.c));
    nd.forEach(d => this.addDrain(d.r, d.c));
  }

  addSource(r, c) {
    this.grid[r][c].isSource = true; this.grid[r][c].type = 'source';
    const pos = this.cellCenter(r, c);
    const sp = this.add.image(pos.x, pos.y, 'source').setDisplaySize(48, 48);
    this.grid[r][c].sprite = sp;
    this.tweens.add({ targets: sp, scaleX: 1.15*(48/56), scaleY: 1.15*(48/56), duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.sources.push({ r, c });
  }

  addDrain(r, c) {
    this.grid[r][c].isDrain = true; this.grid[r][c].type = 'drain';
    const pos = this.cellCenter(r, c);
    const sp = this.add.image(pos.x, pos.y, 'drain').setDisplaySize(48, 48);
    this.grid[r][c].sprite = sp;
    this.tweens.add({ targets: sp, angle: 360, duration: 2000, repeat: -1 });
    this.drains.push({ r, c });
  }

  onPointerDown(pointer) {
    if (!this.gameActive) return;
    this.lastInputTime = Date.now();
    const rc = this.pointerToCell(pointer);
    if (rc) this.tapTimes[`${rc.r},${rc.c}`] = Date.now();
  }

  onPointerUp(pointer) {
    if (!this.gameActive) return;
    const rc = this.pointerToCell(pointer);
    if (!rc) return;
    const key = `${rc.r},${rc.c}`;
    const held = Date.now() - (this.tapTimes[key] || 0);
    const cell = this.grid[rc.r][rc.c];
    if (cell.isSource || cell.isDrain) return;
    if (held >= CONFIG.DIFFICULTY.LONG_PRESS_MS && cell.type !== 'empty') {
      this.removePipe(rc.r, rc.c);
    } else {
      this.handleCellTap(rc.r, rc.c);
    }
    delete this.tapTimes[key];
  }

  pointerToCell(pointer) {
    const c = Math.floor((pointer.x - this.gridOffsetX) / CONFIG.GRID.cellSize);
    const r = Math.floor((pointer.y - this.gridOffsetY) / CONFIG.GRID.cellSize);
    if (r < 0 || r >= CONFIG.GRID.rows || c < 0 || c >= CONFIG.GRID.cols) return null;
    return { r, c };
  }

  handleCellTap(r, c) {
    const cell = this.grid[r][c];
    const types = CONFIG.PIPE_TYPES;
    if (cell.type === 'empty') {
      cell.type = 'straight'; cell.rotation = 0;
    } else {
      const conns = CONFIG.PIPE_CONNECTIONS[cell.type];
      cell.rotation = (cell.rotation + 1) % conns.length;
      if (cell.rotation === 0) {
        const idx = types.indexOf(cell.type);
        cell.type = types[(idx + 1) % types.length];
        if (cell.type === 'empty') { this.removePipeSprite(r, c); this.juiceTap(r, c); return; }
      }
    }
    this.renderPipe(r, c);
    this.juiceTap(r, c);
    SoundManager.play('place');
  }

  removePipe(r, c) {
    const cell = this.grid[r][c];
    cell.type = 'empty'; cell.rotation = 0; cell.pressure = 0; cell.flowState = 'EMPTY';
    this.removePipeSprite(r, c);
    this.juiceTap(r, c);
    SoundManager.play('remove');
  }

  removePipeSprite(r, c) {
    const cell = this.grid[r][c];
    if (cell.sprite && !cell.isSource && !cell.isDrain) { cell.sprite.destroy(); cell.sprite = null; }
    if (cell.pressBar) { cell.pressBar.destroy(); cell.pressBar = null; }
  }

  renderPipe(r, c) {
    const cell = this.grid[r][c];
    this.removePipeSprite(r, c);
    if (cell.type === 'empty' || cell.isSource || cell.isDrain) return;
    const pos = this.cellCenter(r, c);
    if (!this.textures.exists(cell.type)) return;
    const sp = this.add.image(pos.x, pos.y, cell.type).setDisplaySize(50, 50);
    sp.setAngle(cell.rotation * 90);
    cell.sprite = sp;
    this.tweens.add({ targets: sp, scaleX: sp.scaleX*1.35, scaleY: sp.scaleY*1.35, duration: 80, yoyo: true, ease: 'Back.easeOut' });
  }

  juiceTap(r, c) {
    const pos = this.cellCenter(r, c);
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI*2*i)/8;
      const p = this.add.circle(pos.x, pos.y, 3, 0x4FC3F7);
      this.tweens.add({ targets: p, x: pos.x+Math.cos(a)*40, y: pos.y+Math.sin(a)*40, alpha: 0, duration: 300, onComplete: () => p.destroy() });
    }
    const flash = this.add.rectangle(pos.x, pos.y, CONFIG.GRID.cellSize, CONFIG.GRID.cellSize, 0xFFFFFF, 0.5);
    this.tweens.add({ targets: flash, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
  }

  update(time, delta) {
    if (!this.gameActive) return;
    const dt = delta / 1000;
    this.ruleElapsed += dt;
    const pct = 1 - (this.ruleElapsed / this.ruleTimer);

    // Preview upcoming rule 2s before shift
    if (!this.previewShown && this.ruleTimer - this.ruleElapsed <= 2) {
      this.previewShown = true;
      const pool = StageManager.getUnlockedRules(GameState.cycleNumber);
      this.nextRule = StageManager.selectRule(pool, this.lastRuleId);
      this.events.emit('rulePreview', this.nextRule.name);
      SoundManager.play('ruleWarn');
    }
    if (this.ruleElapsed >= this.ruleTimer) this.onRuleShift();

    // Flow simulation
    FlowEngine.simulate(this.grid, this.sources, this.drains, this.activeRules, (r2, c2, pts) => {
      GameState.score += pts;
      this.showFloatingScore(r2, c2, pts);
      SoundManager.play('score');
    });

    // Inactivity pressure multiplier
    const idle = Date.now() - this.lastInputTime;
    const mult = idle > CONFIG.DIFFICULTY.INACTIVITY_THRESHOLD ? CONFIG.DIFFICULTY.INACTIVITY_PRESSURE_MULT : 1;
    FlowEngine.updatePressure(this.grid, dt, mult, this.sources);

    // Pressure wave rule
    if (this.activeRules.some(r => r.id === 7) && !this._pressureWaveApplied) {
      this._pressureWaveApplied = true;
      for (let r = 0; r < CONFIG.GRID.rows; r++)
        for (let c = 0; c < CONFIG.GRID.cols; c++)
          if (this.grid[r][c].type !== 'empty') this.grid[r][c].pressure = Math.max(this.grid[r][c].pressure, 50);
    }

    // Update visuals: tint, pressure bars, fog
    FlowEngine.updateVisuals(this, this.grid, this.activeRules, (r2,c2) => this.cellCenter(r2,c2));

    // Check overflows
    const ov = FlowEngine.findOverflow(this.grid);
    if (ov) this.triggerOverflow(ov.r, ov.c);

    this.emitHUD(pct);
  }

  triggerOverflow(r, c) {
    const pos = this.cellCenter(r, c);
    GameState.overflows++;
    this.events.emit('overflow', GameState.overflows);
    // Explosion particles
    for (let i = 0; i < 20; i++) {
      const a = (Math.PI*2*i)/20, col = i%2===0 ? 0x00E5FF : 0xFF1744;
      const p = this.add.circle(pos.x, pos.y, 4, col);
      this.tweens.add({ targets: p, x: pos.x+Math.cos(a)*60, y: pos.y+Math.sin(a)*60, alpha: 0, scale: 0, duration: 600, onComplete: () => p.destroy() });
    }
    this.cameras.main.shake(400, 0.01);
    const flash = this.add.rectangle(CONFIG.GAME.width/2, CONFIG.GAME.height/2, CONFIG.GAME.width, CONFIG.GAME.height, 0xFF1744, 0.3);
    this.tweens.add({ targets: flash, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
    // Destroy pipe
    const cell = this.grid[r][c];
    if (cell.sprite && !cell.isSource && !cell.isDrain) {
      this.tweens.add({ targets: cell.sprite, scaleX: 1.5*cell.sprite.scaleX, scaleY: 1.5*cell.sprite.scaleY, alpha: 0, duration: 300, onComplete: () => { if(cell.sprite){cell.sprite.destroy();cell.sprite=null;} }});
    }
    cell.type='empty'; cell.rotation=0; cell.pressure=0; cell.flowState='EMPTY';
    if (cell.pressBar) { cell.pressBar.destroy(); cell.pressBar = null; }
    SoundManager.play('overflow');
    if (GameState.overflows >= 3) this.gameOver();
  }

  onRuleShift() {
    GameState.cycleNumber++; this.ruleElapsed = 0; this.previewShown = false; this._pressureWaveApplied = false;
    const diff = StageManager.calculateDifficulty(GameState.cycleNumber);
    this.ruleTimer = diff.ruleTimer;
    const pool = StageManager.getUnlockedRules(GameState.cycleNumber);
    this.activeRules = diff.compound ? StageManager.selectCompoundRules(pool, this.lastRuleId) : [this.nextRule || StageManager.selectRule(pool, this.lastRuleId)];
    this.lastRuleId = this.activeRules[0].id; this.nextRule = null;
    // Reset scored flags
    [...this.drains, ...this.sources].forEach(d => { this.grid[d.r][d.c]._scored = false; });
    // Streak
    const hadOverflow = GameState.overflows > this._lastOverflows;
    if (!hadOverflow) {
      GameState.streak++;
      GameState.score += CONFIG.SCORE.SURVIVE_SHIFT + Math.min(CONFIG.SCORE.STREAK_MAX, GameState.streak) * CONFIG.SCORE.STREAK_BONUS;
    } else { GameState.streak = 0; }
    this._lastOverflows = GameState.overflows;
    // New sources/drains
    if (diff.sourceCount > this.sources.length) {
      StageManager.placeSources(diff.sourceCount - this.sources.length, [...this.sources, ...this.drains]).forEach(s => this.addSource(s.r, s.c));
    }
    if (diff.drainCount > this.drains.length) {
      StageManager.placeDrains(diff.drainCount - this.drains.length, this.sources, [...this.sources, ...this.drains]).forEach(d => this.addDrain(d.r, d.c));
    }
    // Juice
    this.cameras.main.shake(200, 0.006);
    const wf = this.add.rectangle(CONFIG.GAME.width/2, CONFIG.GAME.height/2, CONFIG.GAME.width, CONFIG.GAME.height, 0xFFFFFF, 0.4);
    this.tweens.add({ targets: wf, alpha: 0, duration: 100, onComplete: () => wf.destroy() });
    SoundManager.play('ruleShift');
  }

  showFloatingScore(r, c, pts) {
    const pos = this.cellCenter(r, c);
    const txt = this.add.text(pos.x, pos.y, `+${pts}`, { fontSize: '18px', fill: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5);
    this.tweens.add({ targets: txt, y: pos.y-50, alpha: 0, duration: 600, onComplete: () => txt.destroy() });
  }

  gameOver() {
    this.gameActive = false;
    this.cameras.main.shake(500, 0.015);
    SoundManager.play('gameOver');
    this.time.delayedCall(100, () => {
      this.events.emit('gameOver', { score: GameState.score, cycles: GameState.cycleNumber });
    });
  }

  emitHUD(timerPct) {
    this.events.emit('updateHUD', {
      score: GameState.score, ruleName: this.activeRules.map(r => r.name).join(' + '),
      streak: GameState.streak, timerPct: timerPct || 1
    });
  }

}
