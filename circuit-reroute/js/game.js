// game.js - GameScene: grid rendering, input, electricity simulation

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BACKGROUND);
    if (!GameState._initialized) {
      GameState.score = 0; GameState.stage = 1;
      GameState.lives = GAME_CONFIG.INITIAL_LIVES; GameState.streak = 0;
      GameState._initialized = true;
    }
    this.bestStreak = GameState.bestStreak || 0;
    this.stageData = null;
    this.tileSprites = [];
    this.electrifiedTiles = new Set();
    this.glowTrail = [];
    this.electricity = { state: 'IDLE', heads: [], progress: 0 };
    this.countdown = 0;

    this.scene.launch('HUDScene');
    this._buildStage();
  }

  _buildStage() {
    this.tileSprites.forEach(row => row.forEach(s => { if (s) s.destroy(); }));
    this.tileSprites = [];
    this.electrifiedTiles.clear();
    this.glowTrail.forEach(g => { if (g) g.destroy(); });
    this.glowTrail = [];
    if (this._stageExtras) this._stageExtras.forEach(o => { if (o) o.destroy(); });
    this._stageExtras = [];

    this.stageData = StageGenerator.generate(GameState.stage);
    const { grid, sourceRow, params } = this.stageData;
    const gs = params.gridSize;
    const { width, height } = this.scale;
    const tileSize = Math.floor(Math.min(width - 20, height - 140) / gs);
    this.tileSize = tileSize;
    this.gridOriginX = (width - gs * tileSize) / 2;
    this.gridOriginY = 65;

    this.events.emit('stageUpdate', GameState.stage);
    this.events.emit('livesUpdate', GameState.lives);
    this.events.emit('streakUpdate', GameState.streak);

    if (params.isBoss) {
      const border = this.add.rectangle(width / 2, this.gridOriginY + gs * tileSize / 2,
        gs * tileSize + 8, gs * tileSize + 8).setStrokeStyle(4, 0xFF3344, 0.6);
      this._stageExtras.push(border);
    }

    for (let r = 0; r < gs; r++) {
      this.tileSprites[r] = [];
      for (let c = 0; c < gs; c++) {
        const cell = grid[r][c];
        const x = this.gridOriginX + c * tileSize + tileSize / 2;
        const y = this.gridOriginY + r * tileSize + tileSize / 2;
        let texKey = 'straight';
        if (cell.isSource) texKey = 'source';
        else if (cell.isBulb) texKey = 'bulb_unlit';
        else if (cell.tileType === TILE_TYPES.ELBOW) texKey = 'elbow';
        else if (cell.tileType === TILE_TYPES.T_JUNCTION) texKey = 't_junction';
        else if (cell.tileType === TILE_TYPES.CROSS) texKey = 'cross';

        const sprite = this.add.image(x, y, texKey).setDisplaySize(tileSize - 2, tileSize - 2);
        if (!cell.isSource && !cell.isBulb) sprite.setAngle(cell.rotation * 90);
        sprite.setAlpha(0);
        this.tweens.add({ targets: sprite, alpha: 1, duration: 200, delay: (r * gs + c) * 15 });

        if (!cell.isSource && !cell.isBulb && !cell.locked) {
          sprite.setInteractive({ useHandCursor: true });
          sprite.on('pointerdown', () => this._rotateTile(r, c));
        }
        if (cell.locked && !cell.isSource && !cell.isBulb) {
          const lock = this.add.image(x, y, 'lock').setDisplaySize(tileSize * 0.5, tileSize * 0.5);
          lock.setAlpha(0);
          this.tweens.add({ targets: lock, alpha: 0.8, duration: 200, delay: (r * gs + c) * 15 });
          this._stageExtras.push(lock);
        }
        this.tileSprites[r][c] = sprite;
      }
    }

    this.countdown = params.countdown;
    this.events.emit('timerUpdate', this.countdown);
    this.electricity = {
      state: 'IDLE',
      heads: [{ row: sourceRow, col: 0, progress: 0, fromEdge: 3 }],
      speed: params.speed
    };

    for (let i = 0; i < 4; i++) {
      const g = this.add.circle(0, 0, 6 - i * 1.5, 0xFFFFAA, 1 - i * 0.25).setVisible(false).setDepth(10);
      this.glowTrail.push(g);
    }

    this.time.delayedCall(GAME_CONFIG.GRID_APPEAR_DELAY, () => {
      if (this.electricity.state === 'IDLE') this.electricity.state = 'FLOWING';
    });
  }

  update(time, delta) {
    if (!this.electricity || this.electricity.state !== 'FLOWING') return;

    this.countdown -= delta / 1000;
    this.events.emit('timerUpdate', this.countdown);
    if (this.countdown <= 0) { this._onDeath(); return; }

    const { grid, params } = this.stageData;
    const gs = params.gridSize;

    for (let h = 0; h < this.electricity.heads.length; h++) {
      const head = this.electricity.heads[h];
      if (head.done) continue;
      head.progress += this.electricity.speed * (delta / 1000);

      if (head.progress >= 1) {
        head.progress = 0;
        this._electrifyTile(head.row, head.col);
        const conns = this._getConnections(head.row, head.col);
        const exitEdges = [];
        for (let e = 0; e < 4; e++) { if (conns[e] && e !== head.fromEdge) exitEdges.push(e); }
        if (exitEdges.length === 0) { this._onDeadEnd(head.row, head.col); return; }

        const exit = exitEdges[0];
        const nr = head.row + [-1, 0, 1, 0][exit];
        const nc = head.col + [0, 1, 0, -1][exit];
        if (nr < 0 || nr >= gs || nc < 0 || nc >= gs) { this._onDeadEnd(head.row, head.col); return; }
        const opp = [2, 3, 0, 1][exit];
        const nConns = this._getConnections(nr, nc);
        if (!nConns[opp] && !grid[nr][nc].isSource && !grid[nr][nc].isBulb) {
          this._onDeadEnd(head.row, head.col); return;
        }
        if (grid[nr][nc].isBulb) { this._onStageComplete(); return; }
        head.row = nr; head.col = nc; head.fromEdge = opp;
        this.cameras.main.shake(50, 0.001);
      }
      this._updateGlow(head);
    }
  }

  _getConnections(row, col) {
    const cell = this.stageData.grid[row][col];
    if (cell.isSource) return [false, true, false, false];
    if (cell.isBulb) return [false, false, false, true];
    const type = cell.tileType;
    const maxRot = type === TILE_TYPES.STRAIGHT ? 2 : (type === TILE_TYPES.CROSS ? 1 : 4);
    const rot = cell.rotation % maxRot;
    return TILE_CONNECTIONS[type][rot] || [false, false, false, false];
  }

  _electrifyTile(row, col) {
    const key = `${row},${col}`;
    if (this.electrifiedTiles.has(key)) return;
    this.electrifiedTiles.add(key);
    const sprite = this.tileSprites[row]?.[col];
    if (sprite) sprite.setTint(0xFFE44D);
  }

  _updateGlow(head) {
    const x = this.gridOriginX + head.col * this.tileSize + this.tileSize / 2;
    const y = this.gridOriginY + head.row * this.tileSize + this.tileSize / 2;
    if (this.glowTrail[0]) {
      this.glowTrail[0].setPosition(x, y).setVisible(true);
      for (let i = 1; i < this.glowTrail.length; i++) {
        this.glowTrail[i].setPosition(x - i * 3, y).setVisible(true);
      }
    }
  }

  _rotateTile(row, col) {
    const cell = this.stageData.grid[row][col];
    if (cell.locked || cell.isSource || cell.isBulb) {
      if (cell.locked) Effects.lockShake(this, this.tileSprites[row][col]);
      return;
    }
    const maxRot = cell.tileType === TILE_TYPES.STRAIGHT ? 2 : (cell.tileType === TILE_TYPES.CROSS ? 1 : 4);
    cell.rotation = (cell.rotation + 1) % maxRot;
    const sprite = this.tileSprites[row][col];
    this.tweens.add({ targets: sprite, angle: sprite.angle + 90, duration: 80, ease: 'Quad.easeOut' });
    Effects.scalePunch(this, sprite, 1.15);
    const px = this.gridOriginX + col * this.tileSize + this.tileSize / 2;
    const py = this.gridOriginY + row * this.tileSize + this.tileSize / 2;
    Effects.rotateParticles(this, px, py);
  }

  _onDeadEnd(row, col) {
    this.electricity.state = 'DEAD_END';
    const px = this.gridOriginX + col * this.tileSize + this.tileSize / 2;
    const py = this.gridOriginY + row * this.tileSize + this.tileSize / 2;
    Effects.explosionAt(this, px, py);
    Effects.flashTileRed(this, this.tileSprites[row]?.[col]);
    this.time.delayedCall(GAME_CONFIG.DEATH_EFFECT_DURATION, () => this._onDeath());
  }

  _onDeath() {
    GameState.lives--;
    GameState.streak = 0;
    this.events.emit('livesUpdate', GameState.lives);
    this.events.emit('streakUpdate', 0);
    if (GameState.lives <= 0) this._gameOver();
    else this.time.delayedCall(400, () => this._buildStage());
  }

  _onStageComplete() {
    this.electricity.state = 'COMPLETE';
    const { path, bulbRow, params } = this.stageData;
    const bc = params.gridSize - 1;
    path.forEach((p, i) => {
      this.time.delayedCall(i * 50, () => {
        const s = this.tileSprites[p.row]?.[p.col];
        if (s) { s.setTint(0xFFD700); Effects.scalePunch(this, s, 1.2, 100); }
      });
    });
    this.time.delayedCall(path.length * 50, () => {
      const bulb = this.tileSprites[bulbRow]?.[bc];
      if (bulb) { bulb.setTexture('bulb_lit'); Effects.scalePunch(this, bulb, 1.4, 150); }
    });
    const bx = this.gridOriginX + bc * this.tileSize + this.tileSize / 2;
    const by = this.gridOriginY + bulbRow * this.tileSize + this.tileSize / 2;
    this.time.delayedCall(path.length * 50 + 100, () => Effects.bulbBurst(this, bx, by));

    const timeLeft = Math.max(0, Math.ceil(this.countdown));
    let pts = SCORE_VALUES.STAGE_CLEAR_BASE + SCORE_VALUES.STAGE_CLEAR_PER_STAGE * GameState.stage;
    pts += timeLeft * SCORE_VALUES.TIME_BONUS_PER_SEC;
    if (timeLeft >= params.countdown - 3) pts += SCORE_VALUES.SPEED_BONUS;
    GameState.streak++;
    if (GameState.streak > this.bestStreak) { this.bestStreak = GameState.streak; GameState.bestStreak = this.bestStreak; }
    let mult = 1;
    for (const t of SCORE_VALUES.STREAK_THRESHOLDS) { if (GameState.streak >= t.streak) mult = t.mult; }
    pts = Math.floor(pts * mult);
    GameState.score += pts;

    Effects.floatingScore(this, this.scale.width / 2, this.scale.height / 2, pts);
    Effects.streakText(this, mult);
    Effects.screenFlash(this);
    this.events.emit('scoreUpdate', GameState.score);
    this.events.emit('streakUpdate', GameState.streak);

    GameState.stage++;
    this.time.delayedCall(700, () => this._buildStage());
  }

  _gameOver() {
    const isNewHigh = GameState.score > (GameState.highScore || 0);
    if (isNewHigh) {
      GameState.highScore = GameState.score;
      localStorage.setItem('circuit_reroute_high_score', GameState.score);
    }
    this.scene.stop('HUDScene');
    this.scene.launch('GameOverScene', {
      score: GameState.score, stage: GameState.stage,
      bestStreak: this.bestStreak, isNewHigh
    });
    GameState.score = 0; GameState.stage = 1;
    GameState.lives = GAME_CONFIG.INITIAL_LIVES; GameState.streak = 0;
    GameState._initialized = false;
  }

  continueAfterAd() {
    GameState.lives = 1;
    this.events.emit('livesUpdate', GameState.lives);
    this._buildStage();
  }
}
