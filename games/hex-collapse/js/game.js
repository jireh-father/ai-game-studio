// game.js — GameScene: hex grid, placement, sum-10 detection, gravity, cascades

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    this.add.rectangle(W / 2, H / 2, W, H, 0x1A1A2E);
    GameState.score = 0; GameState.stage = 1; GameState.collapses = 0;
    GameState.chainCount = 0; GameState.bestChain = 0;
    this.stageConfig = StageManager.getConfig(1);
    this.boardRadius = this.stageConfig.radius;
    this.hexR = this.boardRadius === 2 ? CONFIG.HEX_R2 : CONFIG.HEX_R3;
    this.centerX = W / 2; this.centerY = H / 2 - 20;
    this.grid = new Map(); this.hexSprites = new Map(); this.numTexts = new Map();
    this.inputLocked = false; this.isGameOver = false;
    this.idleAutoFilling = false; this.lastInputTime = Date.now(); this.gameOverShown = false;
    this._buildBoard();
    this.currentTile = StageManager.generateTile(this.stageConfig);
    this.nextTile = StageManager.generateTile(this.stageConfig);
    this._drawPreview();
    this.ghostHex = this.add.image(0, 0, 'hex').setAlpha(0.3).setVisible(false).setScale(this.hexR * 2 / 56);
    this.input.on('pointerdown', (ptr) => this._onTap(ptr));
    this.input.on('pointermove', (ptr) => this._onMove(ptr));
    this.scene.launch('HUDScene');
    this.events.emit('scoreUpdate', GameState.score);
    this.events.emit('stageUpdate', GameState.stage);
    this.events.emit('progressUpdate', GameState.collapses, this.stageConfig.target);
    this.game.events.on('blur', () => { if (!this.isGameOver) this.pauseGame(); });
  }

  update() {
    if (this.isGameOver || this.inputLocked) return;
    const elapsed = Date.now() - this.lastInputTime;
    const idleSec = Math.max(0, Math.ceil((CONFIG.IDLE_TIMEOUT - elapsed) / 1000));
    if (elapsed >= CONFIG.IDLE_TIMEOUT && !this.idleAutoFilling) {
      this.idleAutoFilling = true; this._startAutoFill();
    }
    this.events.emit('idleUpdate', (elapsed > 5000 && elapsed < CONFIG.IDLE_TIMEOUT) ? idleSec : 0);
  }

  _buildBoard() {
    StageManager.getBoardCells(this.boardRadius).forEach(({ q, r }) => {
      const key = `${q},${r}`; this.grid.set(key, null);
      const pos = StageManager.axialToPixel(q, r, this.hexR, this.centerX, this.centerY);
      const sp = this.add.image(pos.x, pos.y, 'hex').setScale(this.hexR * 2 / 56).setAlpha(0.4);
      this.hexSprites.set(key, sp);
    });
  }

  _expandBoard(newRadius) {
    const oldCells = new Set(this.grid.keys());
    this.boardRadius = newRadius; this.hexR = CONFIG.HEX_R3;
    this.hexSprites.forEach(sp => sp.setScale(this.hexR * 2 / 56));
    this.grid.forEach((val, key) => {
      const [q, r] = key.split(',').map(Number);
      const pos = StageManager.axialToPixel(q, r, this.hexR, this.centerX, this.centerY);
      this.tweens.add({ targets: this.hexSprites.get(key), x: pos.x, y: pos.y, duration: 400 });
      if (this.numTexts.has(key)) this.tweens.add({ targets: this.numTexts.get(key), x: pos.x, y: pos.y, duration: 400 });
    });
    StageManager.getBoardCells(newRadius).forEach(({ q, r }, i) => {
      const key = `${q},${r}`;
      if (!oldCells.has(key)) {
        this.grid.set(key, null);
        const pos = StageManager.axialToPixel(q, r, this.hexR, this.centerX, this.centerY);
        const sp = this.add.image(pos.x, pos.y, 'hex').setScale(0).setAlpha(0.4);
        this.hexSprites.set(key, sp);
        this.tweens.add({ targets: sp, scaleX: this.hexR * 2 / 56, scaleY: this.hexR * 2 / 56, duration: 400, delay: i * 40, ease: 'Back.easeOut' });
      }
    });
    this.ghostHex.setScale(this.hexR * 2 / 56);
  }

  _onTap(ptr) {
    if (this.inputLocked || this.isGameOver || ptr.y < CONFIG.HUD_HEIGHT) return;
    const ax = StageManager.pixelToAxial(ptr.x, ptr.y, this.hexR, this.centerX, this.centerY);
    const key = `${ax.q},${ax.r}`;
    if (!this.grid.has(key) || this.grid.get(key) !== null) return;
    this._placeTile(ax.q, ax.r, this.currentTile);
  }

  _onMove(ptr) {
    if (this.inputLocked || this.isGameOver) return;
    const ax = StageManager.pixelToAxial(ptr.x, ptr.y, this.hexR, this.centerX, this.centerY);
    const key = `${ax.q},${ax.r}`;
    if (this.grid.has(key) && this.grid.get(key) === null) {
      const pos = StageManager.axialToPixel(ax.q, ax.r, this.hexR, this.centerX, this.centerY);
      this.ghostHex.setPosition(pos.x, pos.y).setVisible(true);
    } else this.ghostHex.setVisible(false);
  }

  _placeTile(q, r, tile) {
    this.inputLocked = true; this.lastInputTime = Date.now();
    this.idleAutoFilling = false; this.events.emit('idleUpdate', 0);
    const key = `${q},${r}`; this.ghostHex.setVisible(false);
    this.grid.set(key, { number: tile.number, type: tile.type });
    const pos = StageManager.axialToPixel(q, r, this.hexR, this.centerX, this.centerY);
    const texKey = tile.type === 'bomb' ? 'hex_bomb' : 'hex';
    const sp = this.hexSprites.get(key);
    if (sp) { sp.setTexture(texKey).setAlpha(1).setScale(0); }
    this.tweens.add({ targets: sp, scaleX: this.hexR * 2 / 56, scaleY: this.hexR * 2 / 56, duration: 150, ease: 'Back.easeOut' });
    if (tile.type === 'normal') {
      const txt = this.add.text(pos.x, pos.y, '' + tile.number, {
        fontSize: (this.hexR * 0.8) + 'px', fontFamily: 'Arial', fontStyle: 'bold', color: NUMBER_COLORS[tile.number]
      }).setOrigin(0.5);
      this.numTexts.set(key, txt);
    }
    SFX.burstParticles(this, pos.x, pos.y, 8, tile.number ? NUMBER_COLORS[tile.number] : '#E63946', 300);
    if (navigator.vibrate) navigator.vibrate(15);
    SFX.playTap(this);
    this.time.delayedCall(160, () => this._runCollapseChain(1));
  }

  _runCollapseChain(chain) {
    const groups = this._findSum10Groups();
    if (groups.length === 0) {
      GameState.chainCount = 0; this.events.emit('chainUpdate', 0);
      this._advanceTile(); return;
    }
    GameState.chainCount = chain;
    if (chain > GameState.bestChain) GameState.bestChain = chain;
    this.events.emit('chainUpdate', chain);
    const allKeys = new Set(); groups.forEach(g => g.forEach(k => allKeys.add(k)));
    // Flash gold
    allKeys.forEach(k => { const s = this.hexSprites.get(k); if (s) s.setTint(0xFFD700); });
    this.time.delayedCall(200, () => {
      allKeys.forEach(k => { const s = this.hexSprites.get(k); if (s) s.clearTint(); });
      let pts = allKeys.size * SCORE_VALUES.basePer * chain;
      GameState.score += pts; GameState.collapses++;
      this.events.emit('scoreUpdate', GameState.score);
      this.events.emit('progressUpdate', GameState.collapses, this.stageConfig.target);
      SFX.floatingScore(this, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 30, pts, chain);
      this.cameras.main.shake(150, Math.min(0.015, 0.003 + chain * 0.002));
      this.cameras.main.zoomTo(1.03, 100);
      this.time.delayedCall(200, () => this.cameras.main.zoomTo(1, 200));
      SFX.playCollapse(this, chain);
      // Collapse hexes
      allKeys.forEach(key => {
        this.grid.set(key, null);
        const sp = this.hexSprites.get(key); if (sp) { sp.setAlpha(0.4).setTexture('hex'); }
        SFX.burstParticles(this, sp.x, sp.y, 6, '#FFFFFF', 400);
        if (this.numTexts.has(key)) { this.numTexts.get(key).destroy(); this.numTexts.delete(key); }
      });
      this.time.delayedCall(300, () => this._applyGravity(() => {
        if (StageManager.shouldAdvance(GameState.collapses, GameState.stage)) {
          GameState.stage++; this.stageConfig = StageManager.getConfig(GameState.stage);
          this.events.emit('stageUpdate', GameState.stage);
          SFX.showStageText(this, GameState.stage);
          if (GameState.stage === 7 && this.boardRadius === 2) this._expandBoard(3);
        }
        let empty = true; this.grid.forEach(v => { if (v !== null) empty = false; });
        if (empty) SFX.showPerfectClear(this);
        this.time.delayedCall(chain >= 3 ? 600 : 50, () => this._runCollapseChain(chain + 1));
      }));
    });
  }

  _findSum10Groups() {
    const occupied = [];
    this.grid.forEach((val, key) => {
      if (val && val.type === 'normal') {
        const [q, r] = key.split(',').map(Number);
        occupied.push({ key, q, r, num: val.number });
      }
    });
    const groups = [], checked = new Set();
    for (const start of occupied) this._dfsSum(start, [start], start.num, occupied, groups, checked);
    return groups;
  }

  _dfsSum(node, path, sum, occupied, groups, checked) {
    if (sum === 10) {
      const sig = path.map(p => p.key).sort().join('|');
      if (!checked.has(sig)) { checked.add(sig); groups.push(path.map(p => p.key)); }
      return;
    }
    if (sum > 10 || path.length >= 6) return;
    for (const [dq, dr] of HEX_MATH.DIRS) {
      const nq = node.q + dq, nr = node.r + dr, nk = `${nq},${nr}`;
      if (path.some(p => p.key === nk)) continue;
      const found = occupied.find(o => o.key === nk);
      if (found && sum + found.num <= 10) this._dfsSum(found, [...path, found], sum + found.num, occupied, groups, checked);
    }
  }

  _applyGravity(cb) {
    let moved = false;
    const occ = [];
    this.grid.forEach((val, key) => {
      if (val) { const [q, r] = key.split(',').map(Number); occ.push({ q, r, key }); }
    });
    occ.sort((a, b) => StageManager.distToCenter(b.q, b.r) - StageManager.distToCenter(a.q, a.r));
    for (const cell of occ) {
      const closer = StageManager.getNeighbors(cell.q, cell.r).filter(n => {
        const nk = `${n.q},${n.r}`;
        return this.grid.has(nk) && this.grid.get(nk) === null &&
          StageManager.distToCenter(n.q, n.r) < StageManager.distToCenter(cell.q, cell.r);
      }).sort((a, b) => StageManager.distToCenter(a.q, a.r) - StageManager.distToCenter(b.q, b.r));
      if (closer.length > 0) {
        const t = closer[0], tk = `${t.q},${t.r}`;
        this.grid.set(tk, this.grid.get(cell.key)); this.grid.set(cell.key, null);
        const sp = this.hexSprites.get(cell.key), tsp = this.hexSprites.get(tk);
        if (sp && tsp) { tsp.setTexture(sp.texture.key).setAlpha(1); sp.setAlpha(0.4).setTexture('hex'); }
        if (this.numTexts.has(cell.key)) {
          const txt = this.numTexts.get(cell.key);
          const pos = StageManager.axialToPixel(t.q, t.r, this.hexR, this.centerX, this.centerY);
          this.tweens.add({ targets: txt, x: pos.x, y: pos.y, duration: 200, ease: 'Cubic.easeInOut' });
          this.numTexts.set(tk, txt); this.numTexts.delete(cell.key);
        }
        moved = true;
      }
    }
    moved ? this.time.delayedCall(250, () => this._applyGravity(cb)) : cb();
  }

  _advanceTile() {
    let hasEmpty = false; this.grid.forEach(v => { if (v === null) hasEmpty = true; });
    if (!hasEmpty) { this._triggerGameOver(); return; }
    this.currentTile = this.nextTile;
    this.nextTile = StageManager.generateTile(this.stageConfig);
    this._drawPreview(); this.inputLocked = false;
  }

  _drawPreview() {
    if (this.previewGroup) this.previewGroup.forEach(o => o.destroy());
    this.previewGroup = [];
    const py = CONFIG.HEIGHT - CONFIG.PROGRESS_HEIGHT - CONFIG.PREVIEW_HEIGHT / 2;
    const mkHex = (x, tile, scale) => {
      const h = this.add.image(x, py, tile.type === 'bomb' ? 'hex_bomb' : 'hex').setScale(scale);
      this.previewGroup.push(h);
      if (tile.type === 'normal') {
        const t = this.add.text(x, py, '' + tile.number, {
          fontSize: (scale > 0.7 ? '22' : '16') + 'px', fontFamily: 'Arial', fontStyle: 'bold', color: NUMBER_COLORS[tile.number]
        }).setOrigin(0.5);
        this.previewGroup.push(t);
      }
    };
    mkHex(80, this.currentTile, 0.8);
    this.previewGroup.push(this.add.text(160, py - 12, 'Next:', { fontSize: '12px', fontFamily: 'Arial', color: '#888' }).setOrigin(0.5, 0));
    mkHex(220, this.nextTile, 0.6);
  }

  _startAutoFill() {
    this.autoFillTimer = this.time.addEvent({
      delay: this.stageConfig.autoFill, loop: true,
      callback: () => {
        if (this.isGameOver) return;
        const empties = []; this.grid.forEach((v, k) => { if (v === null) empties.push(k); });
        if (empties.length === 0) { this._triggerGameOver(); return; }
        const rk = empties[Math.floor(Math.random() * empties.length)];
        const [q, r] = rk.split(',').map(Number);
        const tile = StageManager.generateTile(this.stageConfig);
        this.grid.set(rk, { number: tile.number, type: tile.type });
        const pos = StageManager.axialToPixel(q, r, this.hexR, this.centerX, this.centerY);
        const sp = this.hexSprites.get(rk);
        if (sp) { sp.setTexture('hex').setAlpha(1).setTint(0xFF1744); this.time.delayedCall(300, () => sp.clearTint()); }
        if (tile.type === 'normal') {
          const txt = this.add.text(pos.x, pos.y, '' + tile.number, {
            fontSize: (this.hexR * 0.8) + 'px', fontFamily: 'Arial', fontStyle: 'bold', color: NUMBER_COLORS[tile.number]
          }).setOrigin(0.5);
          this.numTexts.set(rk, txt);
        }
        let hasEmpty = false; this.grid.forEach(v => { if (v === null) hasEmpty = true; });
        if (!hasEmpty) this._triggerGameOver();
      }
    });
  }

  _triggerGameOver() {
    if (this.gameOverShown) return;
    this.isGameOver = true; this.gameOverShown = true; this.inputLocked = true;
    if (this.autoFillTimer) this.autoFillTimer.destroy();
    this.cameras.main.shake(400, 0.012);
    this.hexSprites.forEach(sp => sp.setTint(0xFF1744));
    this.time.delayedCall(200, () => this.hexSprites.forEach(sp => sp.clearTint()));
    SFX.playDeath(this);
    const hs = parseInt(localStorage.getItem('hex_collapse_high_score') || '0');
    const isNewBest = GameState.score > hs;
    if (isNewBest) localStorage.setItem('hex_collapse_high_score', '' + GameState.score);
    const gp = parseInt(localStorage.getItem('hex_collapse_games_played') || '0') + 1;
    localStorage.setItem('hex_collapse_games_played', '' + gp);
    this.time.delayedCall(700, () => GameOverUI.show(this, isNewBest));
  }

  pauseGame() {
    if (this.isGameOver) return;
    this.scene.pause();
    PauseUI.show(this);
  }
}
