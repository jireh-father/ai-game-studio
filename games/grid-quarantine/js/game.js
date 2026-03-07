// ============================================================
// game.js - GameScene: grid logic, infection, walls, containment
// ============================================================
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        Object.assign(this, { stageTransitioning: false, gameOver: false, paused: false,
            lastTapTime: 0, lastTapCell: null, lastWallTime: 0, lastActivityTime: Date.now(),
            wallsPlacedThisStage: [], spreadTimerEvent: null, infectedCells: [], dormantCounters: {} });
        this.stageData = generateStage(GameState.stage, GameState.runSeed);
        GameState.wallsRemaining = GameState.wallsTotal = this.stageData.wallSupply;
        this.buildGrid();
        this.spawnInfections();
        this.startSpread();
        this.setupInput();
        this.scene.launch('UIScene');
        this.events.emit('updateHUD');
        if (this.stageData.isRest)
            this.floatText('BREATHER', this.cameras.main.centerX, this.cameras.main.centerY - 60, COLORS.SUCCESS, 22);
        if (this.stageData.mutations.length > 0 && GameState.stage > 1) {
            const prev = generateStage(GameState.stage - 1, GameState.runSeed);
            const m = this.stageData.mutations[this.stageData.mutations.length - 1];
            if (!prev.mutations.includes(m)) {
                const hex = '#' + (MUTATION_COLORS[m] || COLORS.INFECTION_BASIC).toString(16).padStart(6, '0');
                const t = this.add.text(370, GRID.HUD_HEIGHT + 20, 'MUTATION: ' + m.toUpperCase() + '!',
                    { fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold', color: hex }).setDepth(110);
                this.tweens.add({ targets: t, x: 20, duration: 300, hold: 1500,
                    onComplete: () => this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() }) });
            }
        }
    }

    buildGrid() {
        const gs = this.stageData.gridSize, w = this.cameras.main.width, h = this.cameras.main.height;
        const aW = w - GRID.PADDING * 2, aH = h - GRID.HUD_HEIGHT - GRID.SUPPLY_HEIGHT - GRID.PADDING * 2;
        this.cellSize = Phaser.Math.Clamp(Math.min(Math.floor(aW / gs), Math.floor(aH / gs)), GRID.CELL_MIN_PX, GRID.CELL_MAX_PX);
        this.gridX = (w - gs * this.cellSize) / 2;
        this.gridY = GRID.HUD_HEIGHT + (aH - gs * this.cellSize) / 2 + GRID.PADDING;
        this.grid = [];
        this.gfx = this.add.graphics();
        for (let r = 0; r < gs; r++) { this.grid[r] = []; for (let c = 0; c < gs; c++) this.grid[r][c] = { state: CELL_STATES.EMPTY, mutation: null }; }
        this.drawGrid();
    }

    drawGrid() {
        this.gfx.clear();
        const gs = this.stageData.gridSize, cs = this.cellSize, g = this.gfx;
        for (let r = 0; r < gs; r++) for (let c = 0; c < gs; c++) {
            const x = this.gridX + c * cs + 1, y = this.gridY + r * cs + 1, s = cs - 2, cell = this.grid[r][c];
            if (cell.state === CELL_STATES.EMPTY) {
                g.fillStyle(COLORS.EMPTY_CELL, 1).fillRoundedRect(x, y, s, s, 3);
                g.lineStyle(1, COLORS.GRID_LINE, 0.5).strokeRoundedRect(x, y, s, s, 3);
            } else if (cell.state === CELL_STATES.WALL) {
                g.fillStyle(COLORS.WALL, 0.9).fillRoundedRect(x, y, s, s, 3);
                g.lineStyle(1, 0xFFFFFF, 0.15).strokeRoundedRect(x + 3, y + 3, s - 6, s - 6, 2);
            } else {
                const col = MUTATION_COLORS[cell.mutation] || COLORS.INFECTION_BASIC;
                g.fillStyle(col, 0.8).fillRoundedRect(x, y, s, s, 3);
                const cx = x + s / 2, cy = y + s / 2, dr = s * 0.08;
                g.fillStyle(0x000000, 0.4);
                g.fillCircle(cx, cy - s * 0.15, dr).fillCircle(cx - s * 0.13, cy + s * 0.08, dr).fillCircle(cx + s * 0.13, cy + s * 0.08, dr);
            }
            if (cell.state === CELL_STATES.EMPTY && (r === 0 || r === gs - 1 || c === 0 || c === gs - 1))
                for (const ic of this.infectedCells)
                    if (Math.abs(ic.row - r) + Math.abs(ic.col - c) <= 2) { g.lineStyle(2, COLORS.DANGER, 0.25).strokeRoundedRect(x, y, s, s, 3); break; }
        }
    }

    spawnInfections() {
        this.infectedCells = [];
        for (const src of this.stageData.infectionSources) {
            this.grid[src.row][src.col] = { state: CELL_STATES.INFECTED, mutation: src.mutation };
            this.infectedCells.push({ row: src.row, col: src.col, mutation: src.mutation });
            if (src.mutation === MUTATION_TYPES.DORMANT) this.dormantCounters[`${src.row},${src.col}`] = 0;
        }
        this.drawGrid();
    }

    startSpread() {
        if (this.spreadTimerEvent) this.spreadTimerEvent.remove();
        this.spreadInterval = this.stageData.spreadInterval;
        this.spreadTimerEvent = this.time.addEvent({ delay: this.spreadInterval, callback: () => this.spreadInfection(), loop: true });
    }

    setupInput() {
        this.input.on('pointerdown', (p) => {
            if (this.stageTransitioning || this.gameOver || this.paused) return;
            this.lastActivityTime = Date.now();
            const col = Math.floor((p.x - this.gridX) / this.cellSize), row = Math.floor((p.y - this.gridY) / this.cellSize);
            const gs = this.stageData.gridSize;
            if (row < 0 || row >= gs || col < 0 || col >= gs) return;
            const now = Date.now(), cell = this.grid[row][col], key = `${row},${col}`;
            if (cell.state === CELL_STATES.WALL && GameState.stage >= 6 && this.lastTapCell === key && now - this.lastTapTime < TIMING.DOUBLE_TAP) {
                this.reclaimWall(row, col); this.lastTapCell = null; return;
            }
            this.lastTapTime = now; this.lastTapCell = key;
            if (cell.state === CELL_STATES.EMPTY && GameState.wallsRemaining > 0) {
                if (now - this.lastWallTime < TIMING.TAP_COOLDOWN) return;
                this.placeWall(row, col); this.lastWallTime = now;
            }
        });
    }

    placeWall(r, c) {
        this.grid[r][c].state = CELL_STATES.WALL;
        GameState.wallsRemaining--;
        this.wallsPlacedThisStage.push(`${r},${c}`);
        this.drawGrid();
        this.cameras.main.shake(60, 0.0015);
        this.burst(r, c, COLORS.WALL, 6, 30);
        this.events.emit('updateHUD');
        if (navigator.vibrate) navigator.vibrate(15);
        this.checkContainment();
    }

    reclaimWall(r, c) {
        const k = `${r},${c}`;
        if (!this.wallsPlacedThisStage.includes(k)) return;
        this.grid[r][c] = { state: CELL_STATES.EMPTY, mutation: null };
        GameState.wallsRemaining++;
        this.wallsPlacedThisStage = this.wallsPlacedThisStage.filter(x => x !== k);
        this.drawGrid(); this.events.emit('updateHUD');
    }

    burst(row, col, color, count, rad) {
        const cx = this.gridX + col * this.cellSize + this.cellSize / 2, cy = this.gridY + row * this.cellSize + this.cellSize / 2;
        for (let i = 0; i < count; i++) {
            const a = Math.PI * 2 * i / count, d = this.add.circle(cx, cy, 3, color, 1).setDepth(50);
            this.tweens.add({ targets: d, x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad, alpha: 0, duration: 300, onComplete: () => d.destroy() });
        }
    }

    spreadInfection() {
        if (this.stageTransitioning || this.gameOver || this.paused) return;
        const gs = this.stageData.gridSize, ni = [], cur = [...this.infectedCells];
        for (const ic of cur) {
            const dirs = this.getDirs(ic.mutation);
            for (const [dr, dc] of dirs) {
                let tr = ic.row + dr, tc = ic.col + dc;
                if (ic.mutation === MUTATION_TYPES.JUMPER) { tr = ic.row + dr * 2; tc = ic.col + dc * 2; }
                if (tr < 0 || tr >= gs || tc < 0 || tc >= gs) continue;
                if (this.grid[tr][tc].state === CELL_STATES.EMPTY) ni.push({ row: tr, col: tc, mutation: ic.mutation });
                else if (this.grid[tr][tc].state === CELL_STATES.WALL && ic.mutation === MUTATION_TYPES.SPLITTER) {
                    const ps = dc === 0 ? [[0, 2], [0, -2]] : [[2, 0], [-2, 0]];
                    for (const [pr, pc] of ps) { const sr = ic.row + pr, sc = ic.col + pc;
                        if (sr >= 0 && sr < gs && sc >= 0 && sc < gs && this.grid[sr][sc].state === CELL_STATES.EMPTY) { ni.push({ row: sr, col: sc, mutation: MUTATION_TYPES.BASIC }); break; } }
                }
            }
            if (ic.mutation === MUTATION_TYPES.ACCELERATOR && this.spreadInterval > TIMING.SPREAD_MIN + 50) {
                this.spreadInterval = Math.max(TIMING.SPREAD_MIN, this.spreadInterval - 50);
                this.spreadTimerEvent.remove();
                this.spreadTimerEvent = this.time.addEvent({ delay: this.spreadInterval, callback: () => this.spreadInfection(), loop: true });
            }
        }
        for (const ic of cur) {
            if (ic.mutation !== MUTATION_TYPES.DORMANT) continue;
            const k = `${ic.row},${ic.col}`;
            this.dormantCounters[k] = (this.dormantCounters[k] || 0) + 1;
            if (this.dormantCounters[k] >= TIMING.DORMANT_TICKS) {
                delete this.dormantCounters[k];
                for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
                    if (!dr && !dc) continue; const tr = ic.row + dr, tc = ic.col + dc;
                    if (tr >= 0 && tr < gs && tc >= 0 && tc < gs && this.grid[tr][tc].state === CELL_STATES.EMPTY)
                        ni.push({ row: tr, col: tc, mutation: MUTATION_TYPES.BASIC });
                }
            }
        }
        for (const n of ni) { if (this.grid[n.row][n.col].state !== CELL_STATES.EMPTY) continue;
            this.grid[n.row][n.col] = { state: CELL_STATES.INFECTED, mutation: n.mutation }; this.infectedCells.push(n); }
        this.drawGrid();
        for (const ic of this.infectedCells)
            if (ic.row === 0 || ic.row === gs - 1 || ic.col === 0 || ic.col === gs - 1) { this.onEdgeBreach(); return; }
        this.checkContainment();
    }

    getDirs(m) {
        const b = [[0,1],[0,-1],[1,0],[-1,0]];
        return m === MUTATION_TYPES.DIAGONAL ? [...b,[1,1],[1,-1],[-1,1],[-1,-1]] : m === MUTATION_TYPES.DORMANT ? [] : b;
    }

    checkContainment() {
        if (this.stageTransitioning || this.gameOver) return;
        const gs = this.stageData.gridSize;
        for (const ic of this.infectedCells) {
            const vis = new Set([`${ic.row},${ic.col}`]), q = [`${ic.row},${ic.col}`];
            while (q.length) { const [cr, cc] = q.shift().split(',').map(Number);
                for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) { const nr = cr + dr, nc = cc + dc;
                    if (nr < 0 || nr >= gs || nc < 0 || nc >= gs) continue;
                    const k = `${nr},${nc}`; if (vis.has(k)) continue; vis.add(k);
                    const s = this.grid[nr][nc].state;
                    if (s === CELL_STATES.EMPTY) return; if (s === CELL_STATES.INFECTED) q.push(k); } }
        }
        this.onStageCleared();
    }

    onEdgeBreach() {
        if (this.stageTransitioning) return;
        this.stageTransitioning = true;
        if (this.spreadTimerEvent) this.spreadTimerEvent.remove();
        GameState.score = Math.max(0, GameState.score + SCORING.EDGE_BREACH_PENALTY);
        GameState.lives--;
        this.cameras.main.shake(JUICE.BREACH_SHAKE_DUR, JUICE.CAMERA_SHAKE_BREACH / 1000);
        this.flash(COLORS.DANGER);
        this.events.emit('updateHUD'); this.events.emit('lifeLost');
        this.time.delayedCall(TIMING.DEATH_DELAY, () => {
            if (GameState.lives <= 0) { this.gameOver = true;
                this.time.delayedCall(TIMING.STAGE_TRANSITION, () => { this.scene.stop('UIScene'); this.scene.start('GameOverScene'); });
            } else { this.scene.stop('UIScene'); this.scene.restart(); }
        });
    }

    onStageCleared() {
        if (this.stageTransitioning) return;
        this.stageTransitioning = true;
        if (this.spreadTimerEvent) this.spreadTimerEvent.remove();
        let pts = this.infectedCells.length * SCORING.CELL_CONTAINED + SCORING.STAGE_CLEAR_BASE + GameState.wallsRemaining * SCORING.EFFICIENCY_PER_WALL;
        if (GameState.wallsTotal - GameState.wallsRemaining <= this.stageData.minWalls) { pts += SCORING.PERFECT;
            this.time.delayedCall(200, () => this.floatText('PERFECT!', this.cameras.main.centerX, this.cameras.main.centerY - 40, COLORS.PERFECT_GOLD, 32)); }
        GameState.score += pts;
        if (GameState.stage > GameState.highestStage) GameState.highestStage = GameState.stage;
        this.floatText('+' + pts, this.cameras.main.centerX, this.cameras.main.centerY, COLORS.SUCCESS, 26);
        const mid = Math.floor(this.stageData.gridSize / 2);
        this.burst(mid, mid, COLORS.SUCCESS, 20, 60);
        this.events.emit('updateHUD'); this.events.emit('stageCleared');
        this.time.delayedCall(TIMING.DEATH_DELAY + TIMING.STAGE_TRANSITION, () => { GameState.stage++; this.scene.stop('UIScene'); this.scene.restart(); });
    }

    flash(color) {
        const f = this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY, this.cameras.main.width, this.cameras.main.height, color, 0).setDepth(100);
        this.tweens.add({ targets: f, alpha: 0.4, duration: 100, yoyo: true, onComplete: () => f.destroy() });
    }

    floatText(text, x, y, color, size) {
        const t = this.add.text(x, y, text, { fontSize: size + 'px', fontFamily: 'Arial', fontStyle: 'bold',
            color: '#' + color.toString(16).padStart(6, '0') }).setOrigin(0.5).setDepth(110);
        this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 800, onComplete: () => t.destroy() });
    }

    update() {
        if (this.gameOver || this.paused || this.stageTransitioning) return;
        if (Date.now() - this.lastActivityTime > 30000) {
            this.lastActivityTime = Date.now();
            this.onEdgeBreach();
        }
    }
    pauseGame() { this.paused = true; if (this.spreadTimerEvent) this.spreadTimerEvent.paused = true; }
    resumeGame() { this.paused = false; this.lastActivityTime = Date.now(); if (this.spreadTimerEvent) this.spreadTimerEvent.paused = false; }
}
