// game.js - GameScene: core gameplay, input, state management

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.stageTransitioning = false;
        this.gameOver = false;
        this.ballMoving = false;
        this.queuedDir = null;
        this.deaths = 0;
        this.combo = 0;
        this.gemsCollected = 0;
        this.moveCount = 0;
        this.boosted = false;
        this.ghostTrails = [];
        this.inactivityActive = false;
        this.inactVignette = null;
        this.inactivityProgress = 0;
        this.lastInputTime = Date.now();
        this.paused = false;
        this.phasingTimer = 0;
        this.phasingState = true;
        this.mazeGroup = this.add.group();
        this.trailGfx = this.add.graphics().setDepth(1);
        this.loadMaze(GameState.currentMaze);
        this.setupInput();
        this.createHUD();
    }

    loadMaze(mazeNum) {
        this.stageTransitioning = false;
        this.ballMoving = false;
        this.queuedDir = null;
        this.combo = 0;
        this.gemsCollected = 0;
        this.moveCount = 0;
        this.boosted = false;
        this.ghostTrails = [];
        this.inactivityActive = false;
        this.lastInputTime = Date.now();
        this.phasingTimer = 0;
        this.phasingState = true;
        this.trailGfx.clear();
        this.mazeGroup.clear(true, true);
        if (this.inactVignette) { this.inactVignette.destroy(); this.inactVignette = null; }
        this.level = generateLevel(mazeNum);
        const W = GAME_CONFIG.GAME_WIDTH;
        const playH = GAME_CONFIG.GAME_HEIGHT - GAME_CONFIG.HUD_HEIGHT - GAME_CONFIG.TIMER_HEIGHT;
        this.cellSize = Math.floor(Math.min(W / this.level.size, playH / this.level.size));
        this.offsetX = Math.floor((W - this.cellSize * this.level.size) / 2);
        this.offsetY = GAME_CONFIG.HUD_HEIGHT + Math.floor((playH - this.cellSize * this.level.size) / 2);
        this.timerTotal = this.level.timer;
        this.timerLeft = this.level.timer;
        renderMaze(this);
        if (this.ball) this.ball.destroy();
        const cs = this.cellSize;
        const bx = this.offsetX + this.level.entry.c * cs + cs / 2;
        const by = this.offsetY + this.level.entry.r * cs + cs / 2;
        this.ballRow = this.level.entry.r;
        this.ballCol = this.level.entry.c;
        this.ball = this.add.image(bx, by, 'ball').setDisplaySize(cs * 0.55, cs * 0.55).setDepth(5);
        this.mazeGroup.add(this.ball);
    }

    setupInput() {
        this.swipeStart = null;
        this.input.on('pointerdown', (p) => {
            if (this.paused || this.gameOver || this.stageTransitioning) return;
            if (p.x > GAME_CONFIG.GAME_WIDTH - 50 && p.y < 50) { this.togglePause(); return; }
            this.swipeStart = { x: p.x, y: p.y, time: Date.now() };
        });
        this.input.on('pointerup', (p) => {
            if (!this.swipeStart || this.paused || this.gameOver || this.stageTransitioning) return;
            const dx = p.x - this.swipeStart.x, dy = p.y - this.swipeStart.y;
            const dt = Date.now() - this.swipeStart.time;
            this.swipeStart = null;
            if (dt > GAME_CONFIG.SWIPE_MAX_TIME) return;
            const adx = Math.abs(dx), ady = Math.abs(dy);
            if (adx < GAME_CONFIG.SWIPE_MIN_DIST && ady < GAME_CONFIG.SWIPE_MIN_DIST) return;
            const dir = adx > ady ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
            this.lastInputTime = Date.now();
            if (this.inactivityActive) this.retractInactivitySpikes();
            if (this.ballMoving) { this.queuedDir = dir; return; }
            this.executeSwipe(dir);
        });
    }

    executeSwipe(dir) {
        if (this.ballMoving || this.gameOver || this.stageTransitioning) return;
        const dest = findSlideDestination(this.level.grid, this.ballRow, this.ballCol, dir);
        if (dest.row === this.ballRow && dest.col === this.ballCol) return;
        this.ballMoving = true;
        this.moveCount++;
        const cs = this.cellSize;
        const tx = this.offsetX + dest.col * cs + cs / 2;
        const ty = this.offsetY + dest.row * cs + cs / 2;
        const ddx = (dest.col - this.ballCol) * cs, ddy = (dest.row - this.ballRow) * cs;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        let speed = this.level.params.ballSpeed;
        if (this.boosted) speed *= this.level.params.boostMult;
        const duration = Math.max(80, (dist / speed) * 1000);
        const hz = dir === 'left' || dir === 'right';
        this.ball.setScale(hz ? this.ball.scaleX * 1.3 : this.ball.scaleX * 0.8,
                           hz ? this.ball.scaleY * 0.8 : this.ball.scaleY * 1.3);
        this.cameras.main.shake(80, 0.003);
        this.ghostTrails.push({ sr: this.ballRow, sc: this.ballCol, er: dest.row, ec: dest.col, time: Date.now() });
        this.tweens.add({
            targets: this.ball, x: tx, y: ty, duration, ease: 'Power2',
            onComplete: () => {
                this.ballRow = dest.row; this.ballCol = dest.col;
                this.ball.setDisplaySize(cs * 0.55, cs * 0.55);
                this.ballMoving = false;
                this.checkGhostTrailCross();
                this.checkCell();
                if (this.queuedDir && !this.gameOver && !this.stageTransitioning) {
                    const d = this.queuedDir; this.queuedDir = null; this.executeSwipe(d);
                }
            }
        });
        this.updateMoveHUD();
    }

    checkGhostTrailCross() {
        if (this.boosted) return;
        const now = Date.now(), r = this.ballRow, c = this.ballCol;
        for (const trail of this.ghostTrails) {
            if (now - trail.time > GAME_CONFIG.GHOST_TRAIL_DURATION || now - trail.time < 200) continue;
            const mnR = Math.min(trail.sr, trail.er), mxR = Math.max(trail.sr, trail.er);
            const mnC = Math.min(trail.sc, trail.ec), mxC = Math.max(trail.sc, trail.ec);
            if (r >= mnR && r <= mxR && c >= mnC && c <= mxC) { this.activateBoost(); return; }
        }
    }

    activateBoost() {
        this.boosted = true;
        this.combo++;
        this.addScore(SCORING.GHOST_BOOST + (this.combo - 1) * SCORING.GHOST_CHAIN_INC, COLORS.BALL_HEX);
        this.ball.setTint(COLORS.BOOST_AURA);
        const fl = this.add.rectangle(195, 350, 390, 700, COLORS.BOOST_AURA, 0.15).setDepth(10);
        this.tweens.add({ targets: fl, alpha: 0, duration: 100, onComplete: () => fl.destroy() });
        const sz = Math.min(52, 28 + this.combo * 4);
        const ct = this.add.text(195, 90, `x${this.combo} ECHO!`, {
            fontSize: sz + 'px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.BALL_HEX, stroke: COLORS.BG_HEX, strokeThickness: 3
        }).setOrigin(0.5).setDepth(11);
        this.tweens.add({ targets: ct, y: 50, alpha: 0, duration: 1000, onComplete: () => ct.destroy() });
        this.time.delayedCall(GAME_CONFIG.BOOST_DURATION, () => { this.boosted = false; if (this.ball) this.ball.clearTint(); });
    }

    checkCell() {
        if (this.gameOver || this.stageTransitioning) return;
        const r = this.ballRow, c = this.ballCol;
        for (const g of this.gemSprites) {
            if (!g.collected && g.r === r && g.c === c) {
                g.collected = true; this.gemsCollected++;
                this.addScore(this.boosted ? SCORING.GEM * SCORING.GEM_BOOSTED_MULT : SCORING.GEM, COLORS.GEM_HEX);
                this.tweens.add({ targets: g.sprite, scaleX: g.sprite.scaleX * 1.6, scaleY: g.sprite.scaleY * 1.6, alpha: 0, duration: 150, onComplete: () => g.sprite.destroy() });
                emitParticles(this, g.sprite.x, g.sprite.y, COLORS.GEM, 12);
                this.updateGemHUD();
            }
        }
        for (const s of this.spikeSprites) if (s.r === r && s.c === c) { this.die(); return; }
        if (r === this.level.exit.r && c === this.level.exit.c) this.reachExit();
    }

    die() {
        if (this.gameOver || this.stageTransitioning) return;
        this.deaths++; this.ballMoving = false; this.queuedDir = null;
        this.cameras.main.shake(300, 0.012);
        const fl = this.add.rectangle(195, 350, 390, 700, COLORS.SPIKE, 0.3).setDepth(10);
        this.tweens.add({ targets: fl, alpha: 0, duration: 150, onComplete: () => fl.destroy() });
        emitParticles(this, this.ball.x, this.ball.y, COLORS.SPIKE, 8);
        this.tweens.add({
            targets: this.ball, scaleX: 0, scaleY: 0, angle: 360, duration: GAME_CONFIG.DEATH_ANIM_MS,
            onComplete: () => {
                if (this.deaths >= GAME_CONFIG.MAX_DEATHS) { this.gameOver = true; saveGameState(); showGameOver(this); }
                else this.time.delayedCall(200, () => { if (!this.gameOver) { this.loadMaze(GameState.currentMaze); this.updateHUD(); } });
            }
        });
        try { navigator.vibrate([50, 30, 80]); } catch (e) {}
    }

    reachExit() {
        if (this.stageTransitioning) return;
        this.stageTransitioning = true;
        let stars = 1;
        if (this.gemsCollected >= this.level.params.gemCount) stars = 2;
        if (this.moveCount <= this.level.par && stars === 2) stars = 3;
        let sc = SCORING.EXIT + stars * SCORING.EXIT_STAR_BONUS + Math.floor(this.timerLeft) * SCORING.TIME_BONUS;
        if (this.moveCount <= this.level.par) sc += SCORING.UNDER_PAR;
        if (stars === 3) sc += SCORING.PERFECT;
        this.addScore(sc, COLORS.EXIT_HEX);
        GameState.totalStars += stars; this.deaths = 0;
        this.tweens.add({ targets: this.exitSprite, scaleX: 2.5, scaleY: 2.5, alpha: 0, duration: 500 });
        this.tweens.add({ targets: this.ball, scaleX: 0, scaleY: 0, duration: 300, delay: 100 });
        emitParticles(this, this.exitSprite.x, this.exitSprite.y, COLORS.EXIT, 15);
        showStars(this, stars);
        this.time.delayedCall(GAME_CONFIG.STAR_DISPLAY_MS + 800, () => {
            GameState.currentMaze++;
            if (GameState.currentMaze > GameState.bestMaze) GameState.bestMaze = GameState.currentMaze;
            saveGameState(); this.loadMaze(GameState.currentMaze); this.updateHUD();
        });
    }

    addScore(pts, color) {
        GameState.score += pts;
        if (GameState.score > GameState.highScore) GameState.highScore = GameState.score;
        const ft = this.add.text(195, 200, `+${pts}`, { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: color || '#FFF' }).setOrigin(0.5).setDepth(11);
        this.tweens.add({ targets: ft, y: 140, alpha: 0, duration: 600, onComplete: () => ft.destroy() });
        this.updateScoreHUD();
    }

    togglePause() { this.paused = !this.paused; if (this.paused) showPauseMenu(this); else hidePauseMenu(this); }
    createHUD() { createGameHUD(this); }
    updateHUD() { updateGameHUD(this); }
    updateScoreHUD() { if (this.scoreText) this.scoreText.setText(GameState.score); }
    updateMoveHUD() { if (this.moveText) this.moveText.setText(`Moves: ${this.moveCount} / Par: ${this.level.par}`); }
    updateGemHUD() { updateGemCounter(this); }

    retractInactivitySpikes() {
        this.inactivityActive = false;
        if (this.inactVignette) { this.inactVignette.destroy(); this.inactVignette = null; }
    }

    update(time, delta) {
        if (this.paused || this.gameOver || this.stageTransitioning) return;
        this.timerLeft -= delta / 1000;
        if (this.timerLeft <= 0) { this.timerLeft = 0; this.die(); return; }
        updateTimerBar(this);
        renderGhostTrails(this);
        updatePhasingWalls(this, delta);
        updateMovingSpikes(this, delta);
        if (Date.now() - this.lastInputTime > GAME_CONFIG.INACTIVITY_TIMEOUT && !this.inactivityActive) {
            this.inactivityActive = true; this.inactivityProgress = 0;
            this.inactVignette = this.add.rectangle(195, 350, 390, 700, COLORS.INACTIVITY, 0).setDepth(9);
            this.tweens.add({ targets: this.inactVignette, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
        }
        if (this.inactivityActive) {
            this.inactivityProgress += GAME_CONFIG.INACTIVITY_SPEED * delta / 1000;
            const halfW = (this.level.size * this.cellSize) / 2;
            if (this.inactivityProgress >= halfW) { this.die(); return; }
            if (this.ball) {
                const lim = halfW - this.inactivityProgress;
                if (Math.abs(this.ball.x - (this.offsetX + halfW)) > lim || Math.abs(this.ball.y - (this.offsetY + halfW)) > lim) this.die();
            }
        }
    }
}
