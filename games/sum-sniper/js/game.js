// Sum Sniper - Core Game Scene
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.paused = false;
        this.gameOver = false;
        this.stageTransitioning = false;
        this.lastInputTime = Date.now();

        // Reset game state
        GameState.score = 0;
        GameState.stage = 1;
        GameState.strikes = 0;
        GameState.combo = 0;

        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0D1B2A);

        // Grid layout
        const totalW = GRID.COLS * GRID.CELL_SIZE + (GRID.COLS - 1) * GRID.GAP;
        const totalH = GRID.ROWS * GRID.CELL_SIZE + (GRID.ROWS - 1) * GRID.GAP;
        this.gridX = (GAME_WIDTH - totalW) / 2;
        this.gridY = 70;

        this.cellSprites = [];
        this.cellTexts = [];
        this.selectedChain = [];
        this.grid = null;
        this.target = 0;
        this.lastTarget = null;
        this.timerMs = 0;
        this.timerTotal = 0;
        this.timerRunning = false;

        // Launch HUD
        this.scene.launch('HUDScene');
        this.hud = this.scene.get('HUDScene');

        // Build cell sprites
        for (let r = 0; r < GRID.ROWS; r++) {
            this.cellSprites[r] = [];
            this.cellTexts[r] = [];
            for (let c = 0; c < GRID.COLS; c++) {
                const x = this.gridX + c * (GRID.CELL_SIZE + GRID.GAP) + GRID.CELL_SIZE / 2;
                const y = this.gridY + r * (GRID.CELL_SIZE + GRID.GAP) + GRID.CELL_SIZE / 2;
                const sprite = this.add.image(x, y, 'cell').setInteractive(
                    new Phaser.Geom.Rectangle(-GRID.CELL_SIZE/2, -GRID.CELL_SIZE/2, GRID.CELL_SIZE, GRID.CELL_SIZE),
                    Phaser.Geom.Rectangle.Contains
                );
                sprite.setData('row', r).setData('col', c);
                sprite.on('pointerdown', () => this.onCellTap(r, c));
                this.cellSprites[r][c] = sprite;

                const txt = this.add.text(x, y, '', {
                    fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.NUM_NORMAL
                }).setOrigin(0.5).setDepth(5);
                this.cellTexts[r][c] = txt;
            }
        }

        this.loadStage();

        // Visibility handler
        this.visHandler = () => { if (document.hidden && !this.paused && !this.gameOver) this.togglePause(); };
        document.addEventListener('visibilitychange', this.visHandler);
    }

    loadStage() {
        const result = Stages.generateWithGuarantee(GameState.stage, this.lastTarget);
        this.grid = result.grid;
        this.target = result.target;
        this.lastTarget = this.target;
        this.stageTransitioning = false;

        this.renderGrid();
        this.clearSelection();

        // Update HUD
        if (this.hud && this.hud.scene.isActive()) {
            this.hud.updateTarget(this.target);
            this.hud.updateStage(GameState.stage);
            this.hud.updateSum(0);
            this.hud.updateScore(GameState.score);
            this.hud.updateStrikes(GameState.strikes);
        }

        // Start timer
        this.timerTotal = getTimerMs(GameState.stage);
        this.timerMs = this.timerTotal;
        this.timerRunning = true;

        if (this.grid) for (let r = 0; r < GRID.ROWS; r++) for (let c = 0; c < GRID.COLS; c++) {
            if (this.grid[r][c].locked) {
                const lr = r, lc = c;
                this.time.delayedCall(3000, () => {
                    if (this.grid && this.grid[lr]) { this.grid[lr][lc].locked = false; this.updateCellVisual(lr, lc); }
                });
            }
        }
    }

    renderGrid() {
        for (let r = 0; r < GRID.ROWS; r++)
            for (let c = 0; c < GRID.COLS; c++) this.updateCellVisual(r, c);
    }

    updateCellVisual(r, c) {
        const cell = this.grid[r][c], sp = this.cellSprites[r][c], tx = this.cellTexts[r][c];
        if (!sp || !tx) return;
        sp.setVisible(true).setAlpha(1).setScale(1);
        if (cell.locked) { sp.setTexture('cellLocked'); tx.setText('').setColor('#555555'); }
        else if (cell.multiplier) { sp.setTexture('cellMultiplier'); tx.setText('x' + cell.value).setColor(COLORS.NUM_MULTIPLIER); }
        else { sp.setTexture('cell'); tx.setText('' + cell.value).setColor(cell.value < 0 ? COLORS.NUM_NEGATIVE : COLORS.NUM_NORMAL); }
    }

    onCellTap(r, c) {
        if (this.paused || this.gameOver || this.stageTransitioning) return;
        this.lastInputTime = Date.now();

        const cell = this.grid[r][c];
        if (cell.locked) {
            this.tweens.add({ targets: this.cellSprites[r][c], scaleX: 1.05, scaleY: 1.05, duration: 75, yoyo: true });
            return;
        }

        const idx = this.selectedChain.findIndex(p => p.row === r && p.col === c);
        if (idx >= 0) {
            // Tapping selected cell: deselect all
            this.clearSelection();
            return;
        }

        if (this.selectedChain.length > 0) {
            const last = this.selectedChain[this.selectedChain.length - 1];
            if (!Stages.isAdjacent(last, { row: r, col: c })) {
                // Non-adjacent: reset and start new chain
                this.clearSelection();
            }
        }

        this.selectedChain.push({ row: r, col: c });
        this.cellSprites[r][c].setTexture('cellSelected');
        this.cellTapEffect(this.cellSprites[r][c]);
        this.highlightAdjacent(r, c);

        const sum = Stages.getChainSum(this.grid, this.selectedChain);
        if (this.hud && this.hud.scene.isActive()) this.hud.updateSum(sum);
    }

    highlightAdjacent(r, c) {
        for (let rr = 0; rr < GRID.ROWS; rr++)
            for (let cc = 0; cc < GRID.COLS; cc++) {
                if (this.selectedChain.some(p => p.row === rr && p.col === cc)) continue;
                const cl = this.grid[rr][cc];
                this.cellSprites[rr][cc].setTexture(cl.locked ? 'cellLocked' : cl.multiplier ? 'cellMultiplier' : 'cell');
            }
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= GRID.ROWS || nc < 0 || nc >= GRID.COLS) continue;
            if (this.selectedChain.some(p => p.row === nr && p.col === nc)) continue;
            if (!this.grid[nr][nc].locked) this.cellSprites[nr][nc].setTexture('cellAdjacent');
        }
    }

    clearSelection() {
        this.selectedChain = [];
        this.renderGrid();
        if (this.hud && this.hud.scene.isActive()) this.hud.updateSum(0);
    }

    onConfirm() {
        if (this.paused || this.gameOver || this.stageTransitioning) return;
        if (this.selectedChain.length === 0) return;
        this.lastInputTime = Date.now();

        const valid = Stages.validateChain(this.grid, this.selectedChain, this.target);
        if (valid) {
            this.correctMatch();
        } else {
            this.recordMiss('wrong');
        }
    }

    correctMatch() {
        this.timerRunning = false;
        this.stageTransitioning = true;
        const chainLen = this.selectedChain.length;
        const remaining = this.timerMs;

        let points = chainLen <= SCORE.CHAIN_MULT.length ? Math.floor(SCORE.BASE * SCORE.CHAIN_MULT[chainLen - 1]) : Math.floor(SCORE.BASE * chainLen * SCORE.CHAIN_5_PLUS);
        if (Stages.hasNegative(this.grid, this.selectedChain)) points += SCORE.NEGATIVE_BONUS;
        if (remaining > this.timerTotal - 2000) { points += SCORE.SPEED_BONUS_FAST; this.speedBonusText(); }
        else if (remaining > this.timerTotal - 4000) points += SCORE.SPEED_BONUS_MED;
        GameState.combo++;
        points += SCORE.COMBO_BONUS[Math.min(GameState.combo, SCORE.COMBO_BONUS.length - 1)];

        GameState.score += points;
        GameState.stage++;

        // Hit-stop then effects
        const cells = [...this.selectedChain];
        setTimeout(() => {
            this.explosionEffect(cells, this.gridX, this.gridY);
            for (const c of cells) this.cellBurstEffect(this.cellSprites[c.row][c.col]);
            const cx = cells.reduce((a, c) => a + (this.gridX + c.col * (GRID.CELL_SIZE + GRID.GAP) + GRID.CELL_SIZE/2), 0) / cells.length;
            const cy = cells.reduce((a, c) => a + (this.gridY + c.row * (GRID.CELL_SIZE + GRID.GAP) + GRID.CELL_SIZE/2), 0) / cells.length;
            this.floatingScoreText(cx, cy, points, chainLen);
            this.comboEffect(GameState.combo);

            if (this.hud && this.hud.scene.isActive()) {
                this.hud.updateScore(GameState.score);
                this.hud.updateStrikes(GameState.strikes);
            }

            if (GameState.stage % 5 === 0) this.stageMilestoneFlash();

            // Check high score mid-game
            if (GameState.score > (GameState.highScore || 0)) {
                GameState.highScore = GameState.score;
                try { localStorage.setItem('sum-sniper_high_score', GameState.highScore); } catch(e) {}
            }

            this.time.delayedCall(350, () => { this.loadStage(); });
        }, 80);
    }

    recordMiss(reason) {
        GameState.strikes++;
        GameState.combo = 0;
        this.missFlashEffect();
        this.clearSelection();

        if (this.hud && this.hud.scene.isActive()) this.hud.updateStrikes(GameState.strikes);

        if (GameState.strikes >= MAX_STRIKES) {
            this.triggerGameOver();
        } else if (reason === 'timeout') {
            this.stageTransitioning = true;
            this.time.delayedCall(300, () => { this.loadStage(); });
        }
    }

    triggerGameOver() {
        this.gameOver = true;
        this.timerRunning = false;
        this.gameOverEffect(() => {
            this.scene.launch('GameOverScene', { score: GameState.score, stage: GameState.stage });
        });
    }

    continueAfterAd() {
        GameState.strikes = 0;
        this.gameOver = false;
        if (this.hud && this.hud.scene.isActive()) this.hud.updateStrikes(0);
        this.loadStage();
    }

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) {
            this.timerRunning = false;
            if (this.hud) this.hud.showPauseOverlay();
        } else {
            this.timerRunning = true;
            if (this.hud) this.hud.hidePauseOverlay();
        }
    }

    update(time, delta) {
        if (this.paused || this.gameOver || this.stageTransitioning) return;

        // Timer
        if (this.timerRunning) {
            this.timerMs -= delta;
            const ratio = Math.max(0, this.timerMs / this.timerTotal);
            if (this.hud && this.hud.scene.isActive()) this.hud.updateTimer(ratio);
            if (this.timerMs <= 0 && !this.stageTransitioning) {
                this.timerRunning = false;
                this.recordMiss('timeout');
            }
        }

        // Inactivity death
        if (Date.now() - this.lastInputTime > 25000 && !this.gameOver) {
            this.triggerGameOver();
        }
    }

    shutdown() {
        this.tweens.killAll();
        this.time.removeAllEvents();
        document.removeEventListener('visibilitychange', this.visHandler);
    }
}
Object.assign(GameScene.prototype, GameEffects);
