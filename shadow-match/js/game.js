// Shadow Match - GameScene (core gameplay)
class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    create() {
        const w = this.cameras.main.width, h = this.cameras.main.height;
        this.stageTransitioning = false; this.gameOver = false; this.shadowX = -40;
        this.lastInputTime = Date.now(); this.inactivityWarning = false; this.inactivityAccel = false;
        this.hitStopFrames = 0; this.dragPiece = null; this.dragStartPos = null; this.dragMoved = false;
        this.piecesPlaced = 0; this.filledCells = {}; this.pieceObjects = [];
        const bg = this.add.graphics();
        bg.fillGradientStyle(COLORS_INT.SKY_TOP, COLORS_INT.SKY_TOP, COLORS_INT.SKY_DARK, COLORS_INT.SKY_DARK, 1);
        bg.fillRect(0, 0, w, h);
        this.add.circle(214, 60, 30, COLORS_INT.STREAK_FIRE, 0.4);
        this.add.rectangle(w / 2, TRAY_Y + TRAY_HEIGHT / 2, w, TRAY_HEIGHT, COLORS_INT.HUD_BG, 0.8).setDepth(5);
        this.shadowGfx = this.add.graphics().setDepth(10);
        this.gridGfx = this.add.graphics().setDepth(11).setAlpha(0);
        this.ghostGfx = this.add.graphics().setDepth(12);
        if (!this.scene.isActive('UIScene')) this.scene.launch('UIScene');
        this.buildStage(GameState.stage);
        this.setupInput();
    }

    buildStage(stageNum) {
        this.stageTransitioning = false; this.shadowX = -40; this.piecesPlaced = 0; this.filledCells = {};
        GameState.wrongThisStage = 0; this.inactivityWarning = false; this.inactivityAccel = false;
        this.lastInputTime = Date.now();
        this.pieceObjects.forEach(p => { if (p.con) p.con.destroy(); });
        this.pieceObjects = [];
        this.stageData = generateStageData(stageNum);
        this.driftSpeed = this.stageData.driftSpeed;
        this.solutionCount = this.stageData.solutionPieces.length;
        this.drawShadow(); this.createTrayPieces();
        this.events.emit('updateStage', stageNum);
        this.events.emit('updateStreak', GameState.streak);
        this.events.emit('updateScore', GameState.score);
    }

    drawShadow() {
        this.shadowGfx.clear();
        this.stageData.shadowCells.forEach(c => {
            const wx = this.shadowX + GRID.OFFSET_X + c.col * GRID.CELL_SIZE;
            const wy = GRID.OFFSET_Y + c.row * GRID.CELL_SIZE;
            this.shadowGfx.fillStyle(this.filledCells[c.col + ',' + c.row] ? COLORS_INT.PIECE_PLACED : COLORS_INT.SHADOW, 0.85);
            this.shadowGfx.fillRoundedRect(wx, wy, GRID.CELL_SIZE - 2, GRID.CELL_SIZE - 2, 3);
        });
    }

    createTrayPieces() {
        const pieces = this.stageData.pieces, cols = Math.min(pieces.length, 4);
        const cellW = 90, cellH = 80, startX = (428 - cols * cellW) / 2 + cellW / 2, startY = TRAY_Y + 30;
        pieces.forEach((pData, idx) => {
            const tx = startX + (idx % cols) * cellW, ty = startY + Math.floor(idx / cols) * cellH;
            const con = this.add.container(tx, ty).setDepth(20);
            const g = this.add.graphics();
            this.drawPieceGfx(g, pData.cells, 0.7, COLORS_INT.PIECE_FILL);
            con.add(g);
            const maxX = Math.max(...pData.cells.map(c => c[0])), maxY = Math.max(...pData.cells.map(c => c[1]));
            const cs = GRID.CELL_SIZE * 0.7;
            const hzW = (maxX + 1) * cs + 16, hzH = (maxY + 1) * cs + 16;
            const hz = this.add.rectangle(maxX * cs / 2, maxY * cs / 2, hzW, hzH, 0, 0);
            hz.setInteractive({ useHandCursor: true, draggable: true });
            con.add(hz);
            const po = { data: pData, con, gfx: g, hz, trayX: tx, trayY: ty, placed: false, idx, rot: 0 };
            hz.pieceRef = po;
            this.pieceObjects.push(po);
        });
    }

    drawPieceGfx(g, cells, scale, fill) {
        const cs = GRID.CELL_SIZE * scale;
        cells.forEach(c => {
            g.fillStyle(fill, 1);
            g.fillRoundedRect(c[0] * cs - cs * 0.5, c[1] * cs - cs * 0.5, cs - 2, cs - 2, 3);
            g.lineStyle(2, COLORS_INT.PIECE_OUTLINE, 1);
            g.strokeRoundedRect(c[0] * cs - cs * 0.5, c[1] * cs - cs * 0.5, cs - 2, cs - 2, 3);
        });
    }

    setupInput() {
        // Use Phaser's built-in drag system for reliable mouse + touch support
        this.input.on('dragstart', (ptr, gameObject) => {
            if (this.gameOver || this.stageTransitioning) return;
            const pc = gameObject.pieceRef;
            if (!pc || pc.placed) return;
            this.lastInputTime = Date.now();
            if (this.inactivityAccel) this.cancelInactivity();
            this.dragPiece = pc;
            this.dragStartPos = { x: ptr.x, y: ptr.y };
            this.dragMoved = false;
        });

        this.input.on('drag', (ptr, gameObject) => {
            const pc = gameObject.pieceRef;
            if (!pc || !this.dragPiece || this.dragPiece !== pc || this.gameOver) return;
            this.lastInputTime = Date.now();
            if (!this.dragMoved) {
                const dx = ptr.x - this.dragStartPos.x, dy = ptr.y - this.dragStartPos.y;
                if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
                    this.dragMoved = true;
                    pc.con.setDepth(50).setScale(1.15);
                    this.gridGfx.setAlpha(0.6);
                    this.pieceObjects.forEach(p => { if (p !== pc && !p.placed) p.con.setAlpha(0.6); });
                }
            }
            if (this.dragMoved) {
                pc.con.setPosition(ptr.x, ptr.y - 30);
                this.updateGhost(ptr.x, ptr.y - 30);
            }
        });

        this.input.on('dragend', (ptr, gameObject) => {
            const pc = gameObject.pieceRef;
            if (!pc || !this.dragPiece || this.dragPiece !== pc || this.gameOver) return;
            this.lastInputTime = Date.now();
            if (!this.dragMoved) {
                this.rotatePiece(pc);
                this.dragPiece = null;
                return;
            }
            this.dragPiece = null;
            this.ghostGfx.clear();
            this.gridGfx.setAlpha(0);
            this.pieceObjects.forEach(p => { if (!p.placed) p.con.setAlpha(1); });
            if (ptr.y > TRAY_Y - 20) { this.returnToTray(pc); return; }
            const snap = this.trySnap(pc, ptr.x, ptr.y - 30);
            snap ? this.snapPiece(pc, snap.col, snap.row) : this.bouncePiece(pc);
        });

        // Fallback: tap on tray area registers inactivity reset
        this.input.on('pointerdown', (ptr) => {
            if (this.gameOver || this.stageTransitioning) return;
            this.lastInputTime = Date.now();
            if (this.inactivityAccel) this.cancelInactivity();
        });
    }

    trySnap(pc, px, py) {
        const cells = pc.data.cells, bx = this.shadowX + GRID.OFFSET_X, by = GRID.OFFSET_Y;
        const sc = Math.round((px - bx) / GRID.CELL_SIZE - cells[0][0]);
        const sr = Math.round((py - by) / GRID.CELL_SIZE - cells[0][1]);
        const sSet = new Set(this.stageData.shadowCells.map(c => c.col + ',' + c.row));
        for (const c of cells) { const k = (sc+c[0])+','+(sr+c[1]); if (!sSet.has(k) || this.filledCells[k]) return null; }
        return { col: sc, row: sr };
    }

    updateGhost(px, py) {
        this.ghostGfx.clear(); if (!this.dragPiece) return;
        const cells = this.dragPiece.data.cells, bx = this.shadowX + GRID.OFFSET_X, by = GRID.OFFSET_Y;
        const sc = Math.round((px - bx) / GRID.CELL_SIZE - cells[0][0]);
        const sr = Math.round((py - by) / GRID.CELL_SIZE - cells[0][1]);
        const sSet = new Set(this.stageData.shadowCells.map(c => c.col + ',' + c.row));
        let valid = true;
        for (const c of cells) { if (!sSet.has((sc+c[0])+','+(sr+c[1])) || this.filledCells[(sc+c[0])+','+(sr+c[1])]) { valid = false; break; } }
        const clr = valid ? COLORS_INT.SUCCESS : COLORS_INT.DANGER;
        cells.forEach(c => { this.ghostGfx.fillStyle(clr, 0.3); this.ghostGfx.fillRoundedRect(bx+(sc+c[0])*GRID.CELL_SIZE, by+(sr+c[1])*GRID.CELL_SIZE, GRID.CELL_SIZE-2, GRID.CELL_SIZE-2, 3); });
    }

    snapPiece(pc, col, row) {
        pc.placed = true; pc.con.setScale(1).setDepth(15);
        pc.data.cells.forEach(c => { this.filledCells[(col+c[0])+','+(row+c[1])] = true; });
        pc.placedCol = col; pc.placedRow = row;
        this.redrawPlaced(pc);
        this.tweens.add({ targets: pc.con, scaleX: 1.15, scaleY: 1.15, duration: 40, yoyo: true });
        this.cameras.main.shake(60, 0.003 + Math.min(GameState.streak, STREAK_CAP) * 0.001);
        this.hitStopFrames = 2; this.piecesPlaced++;
        const mult = Math.max(1, GameState.streak), pts = SCORING.PIECE_PLACED * mult;
        GameState.score += pts; this.events.emit('updateScore', GameState.score);
        const bx = this.shadowX + GRID.OFFSET_X + col * GRID.CELL_SIZE, by = GRID.OFFSET_Y + row * GRID.CELL_SIZE;
        this.events.emit('floatScore', { x: bx + 20, y: by, amount: pts });
        this.emitParticles(bx + 20, by + 20, 8 + Math.min(GameState.streak, STREAK_CAP) * 2);
        this.drawShadow(); this.checkCompletion();
    }

    redrawPlaced(pc) {
        pc.gfx.clear(); const cs = GRID.CELL_SIZE, bx = this.shadowX + GRID.OFFSET_X, by = GRID.OFFSET_Y;
        pc.con.setPosition(0, 0);
        pc.data.cells.forEach(c => {
            const wx = bx + (pc.placedCol + c[0]) * cs, wy = by + (pc.placedRow + c[1]) * cs;
            pc.gfx.fillStyle(COLORS_INT.PIECE_PLACED, 0.9); pc.gfx.fillRoundedRect(wx, wy, cs-2, cs-2, 3);
            pc.gfx.lineStyle(2, COLORS_INT.PIECE_OUTLINE, 1); pc.gfx.strokeRoundedRect(wx, wy, cs-2, cs-2, 3);
        });
    }

    emitParticles(x, y, n) {
        for (let i = 0; i < n; i++) {
            const p = this.add.circle(x, y, 3, COLORS_INT.STREAK_FIRE).setDepth(30);
            const a = (i / n) * Math.PI * 2, s = 80 + Math.random() * 80;
            this.tweens.add({ targets: p, x: x + Math.cos(a)*s, y: y + Math.sin(a)*s, alpha: 0, duration: 300, onComplete: () => p.destroy() });
        }
    }

    bouncePiece(pc) {
        GameState.wrongThisStage++;
        this.tweens.add({ targets: pc.con, x: pc.con.x + 8, duration: 50, yoyo: true, repeat: 2, onComplete: () => this.returnToTray(pc) });
        this.shadowX += TIMING.SHADOW_LURCH;
        const f = this.add.rectangle(214, 380, 428, 760, COLORS_INT.DANGER, 0).setDepth(40);
        this.tweens.add({ targets: f, alpha: 0.15, duration: 60, yoyo: true, onComplete: () => f.destroy() });
        if (GameState.streak > 1) {
            const t = this.add.text(214, 300, 'STREAK LOST!', { fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.DANGER }).setOrigin(0.5).setDepth(50);
            this.tweens.add({ targets: t, y: 260, alpha: 0, duration: 500, onComplete: () => t.destroy() });
        }
    }

    returnToTray(pc) {
        pc.con.setScale(1).setDepth(20);
        this.tweens.add({ targets: pc.con, x: pc.trayX, y: pc.trayY, duration: 150, ease: 'Back.easeIn' });
    }

    rotatePiece(pc) {
        pc.data.cells = rotateCells(pc.data.cells); pc.gfx.clear();
        this.drawPieceGfx(pc.gfx, pc.data.cells, 0.7, COLORS_INT.PIECE_FILL);
        this.tweens.add({ targets: pc.con, scaleX: 1.1, scaleY: 1.1, duration: 60, yoyo: true });
    }

    checkCompletion() {
        if (this.stageTransitioning || this.gameOver) return;
        if (!this.stageData.shadowCells.every(c => this.filledCells[c.col + ',' + c.row])) return;
        this.stageTransitioning = true;
        const perfect = GameState.wrongThisStage === 0, mult = Math.max(1, GameState.streak);
        GameState.score += (SCORING.SHADOW_COMPLETE + this.solutionCount * SCORING.PER_PIECE_BONUS) * mult;
        if (perfect) {
            GameState.streak = Math.min(GameState.streak + 1, STREAK_CAP);
            GameState.score += SCORING.PERFECT_BONUS * mult;
            if (this.shadowX < 214) GameState.score += SCORING.SPEED_BONUS * mult;
            this.events.emit('showPerfect');
        } else { GameState.streak = 1; }
        if (GameState.streak > GameState.bestStreak) GameState.bestStreak = GameState.streak;
        if (this.stageData.isRest) GameState.score += SCORING.REST_BONUS;
        if (this.stageData.isBoss) GameState.score += SCORING.BOSS_BONUS;
        this.events.emit('updateScore', GameState.score);
        this.events.emit('updateStreak', GameState.streak);
        this.stageData.shadowCells.forEach((c, i) => {
            const wx = this.shadowX + GRID.OFFSET_X + c.col * GRID.CELL_SIZE + GRID.CELL_SIZE/2;
            const wy = GRID.OFFSET_Y + c.row * GRID.CELL_SIZE + GRID.CELL_SIZE/2;
            const d = this.add.circle(wx, wy, 5, COLORS_INT.SHADOW_GRID).setDepth(30);
            this.tweens.add({ targets: d, y: wy-60-Math.random()*60, x: wx+(Math.random()-0.5)*60, alpha: 0, duration: 600, delay: i*15, onComplete: () => d.destroy() });
        });
        this.cameras.main.zoomTo(1.03, 150, 'Sine.easeInOut', false, (_, p) => { if (p===1) this.cameras.main.zoomTo(1, 150); });
        this.time.delayedCall(TIMING.STAGE_DELAY, () => { GameState.stage++; this.buildStage(GameState.stage); });
    }

    triggerDeath() {
        if (this.gameOver) return; this.gameOver = true;
        this.pieceObjects.forEach(p => { if (p.con) p.con.setVisible(false); });
        this.stageData.shadowCells.forEach(c => {
            const wx = this.shadowX + GRID.OFFSET_X + c.col*GRID.CELL_SIZE + GRID.CELL_SIZE/2;
            const wy = GRID.OFFSET_Y + c.row*GRID.CELL_SIZE + GRID.CELL_SIZE/2;
            const fr = this.add.rectangle(wx, wy, 15, 15, COLORS_INT.SHADOW, 1).setDepth(30);
            this.tweens.add({ targets: fr, x: wx+(Math.random()-0.5)*400, y: wy+(Math.random()-0.5)*400, angle: Math.random()*720, alpha: 0, duration: 400, onComplete: () => fr.destroy() });
        });
        this.cameras.main.shake(300, 0.015);
        if (GameState.stage > GameState.highestStage) GameState.highestStage = GameState.stage;
        saveState();
        setTimeout(() => { this.events.emit('showGameOver'); }, TIMING.DEATH_DELAY);
    }

    rewindShadow() {
        this.gameOver = false; this.shadowX = 160; this.lastInputTime = Date.now();
        this.inactivityWarning = false; this.inactivityAccel = false; this.drawShadow();
    }

    cancelInactivity() {
        this.inactivityWarning = false; this.inactivityAccel = false;
        this.driftSpeed = this.stageData.driftSpeed; this.events.emit('hideWarning');
    }

    update() {
        if (this.gameOver || this.stageTransitioning) return;
        if (this.hitStopFrames > 0) { this.hitStopFrames--; return; }
        const activeDrift = (this.dragPiece && this.dragMoved) ? this.driftSpeed * 0.3 : this.driftSpeed;
        this.shadowX += activeDrift; this.drawShadow();
        if (this.dragPiece && this.dragMoved) {
            this.updateGhost(this.dragPiece.con.x, this.dragPiece.con.y);
            this.gridGfx.clear(); this.gridGfx.lineStyle(1, COLORS_INT.SHADOW_GRID, 0.6);
            this.stageData.shadowCells.forEach(c => { this.gridGfx.strokeRect(this.shadowX+GRID.OFFSET_X+c.col*GRID.CELL_SIZE, GRID.OFFSET_Y+c.row*GRID.CELL_SIZE, GRID.CELL_SIZE, GRID.CELL_SIZE); });
        }
        this.pieceObjects.forEach(p => { if (p.placed) this.redrawPlaced(p); });
        this.events.emit('updateDrift', (this.shadowX + 40) / (SHADOW_ESCAPE_X + 40));
        if (this.shadowX > SHADOW_ESCAPE_X) { this.triggerDeath(); return; }
        const el = Date.now() - this.lastInputTime;
        if (el > TIMING.INACTIVITY_THRESHOLD && !this.inactivityWarning) { this.inactivityWarning = true; this.events.emit('showWarning'); }
        if (el > TIMING.INACTIVITY_THRESHOLD + 2000 && !this.inactivityAccel) { this.inactivityAccel = true; this.driftSpeed = TIMING.INACTIVITY_ACCEL; }
    }
}
