// Valve Panic - Core GameScene

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    init(data) { this.isContinue = data && data.continueGame; }

    create() {
        const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;
        this.add.rectangle(W / 2, H / 2, W, H, CONFIG.COLORS.BG);

        this.pipes = [];
        this.pipeGraphics = [];
        this.activePipe = -1;
        this.score = 0;
        this.combo = 0;
        this.bestCombo = 0;
        this.elapsedMs = 0;
        this.lastInputTime = 0;
        this.isDead = false;
        this.maxPipesReached = CONFIG.TIMING.START_PIPES;
        this.scoreTimer = 0;
        this.steamTimer = 0;
        this.linkCheckTimer = 0;
        this.pipeAddTimer = 0;

        for (let i = 0; i < CONFIG.TIMING.START_PIPES; i++) this.addPipe(i);
        this.rebuildPipeGraphics();
        this.createHUD();

        this.input.on('pointerdown', (ptr) => this.onPointerDown(ptr));
        this.input.on('pointerup', () => this.onPointerUp());

        if (this.isContinue) {
            for (const p of this.pipes) p.fill = 0.60;
        }

        this.visHandler = () => {
            if (document.hidden && !this.isDead) this.pauseGame();
        };
        document.addEventListener('visibilitychange', this.visHandler);
    }

    createHUD() {
        const W = CONFIG.GAME_WIDTH;
        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            fontSize: '18px', fontFamily: 'Arial Black', fill: '#FFF',
            stroke: '#000', strokeThickness: 2
        }).setDepth(50);
        this.timeText = this.add.text(W / 2, 10, '0s', {
            fontSize: '18px', fontFamily: 'Arial', fill: '#95A5A6',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5, 0).setDepth(50);
        const hi = localStorage.getItem(CONFIG.STORAGE_KEYS.HIGH_SCORE) || 0;
        this.add.text(W - 10, 10, 'HI:' + hi, {
            fontSize: '14px', fontFamily: 'Arial', fill: '#636E72',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(1, 0).setDepth(50);
        const pb = this.add.rectangle(W - 24, 56, 36, 36, 0x636E72, 0.6)
            .setDepth(55).setInteractive();
        this.add.text(W - 24, 56, '||', {
            fontSize: '18px', fontFamily: 'Arial Black', fill: '#FFF'
        }).setOrigin(0.5).setDepth(56).disableInteractive();
        pb.on('pointerdown', () => this.pauseGame());
    }

    addPipe(index) {
        const rates = this.pipes.map(p => p.fillRate);
        const params = Stages.generatePipeParams(this.elapsedMs / 1000, index, rates);
        this.pipes.push(params);
        this.maxPipesReached = Math.max(this.maxPipesReached, this.pipes.length);
        if (index >= CONFIG.TIMING.START_PIPES) {
            this.addScore(CONFIG.SCORING.NEW_PIPE);
            Effects.floatingScore(this, CONFIG.GAME_WIDTH / 2, 80, '+100 NEW PIPE', '#4ECDC4', 20);
        }
    }

    rebuildPipeGraphics() {
        for (const pg of this.pipeGraphics) {
            if (pg.container) pg.container.destroy();
            if (pg.zone) pg.zone.destroy();
            if (pg._linkLine) pg._linkLine.destroy();
        }
        this.pipeGraphics = PipeRenderer.createPipeGraphics(this, this.pipes);
    }

    onPointerDown(ptr) {
        if (this.isDead) return;
        this.lastInputTime = this.elapsedMs;
        for (let i = 0; i < this.pipeGraphics.length; i++) {
            const pg = this.pipeGraphics[i];
            if (!pg || !pg.zone) continue;
            const b = pg.zone.getBounds();
            if (b.contains(ptr.x, ptr.y)) {
                this.activePipe = i;
                pg.valve.setFillStyle(CONFIG.COLORS.VALVE_ACTIVE);
                const vy = CONFIG.PIPE.TOP_Y + CONFIG.PIPE.HEIGHT + CONFIG.PIPE.VALVE_Y_OFFSET;
                Effects.valveTap(this, pg.x, vy);
                Effects.scalePunch(this, pg.valve, 1.4, 100);
                return;
            }
        }
    }

    onPointerUp() {
        if (this.isDead || this.activePipe < 0) return;
        const idx = this.activePipe;
        const pipe = this.pipes[idx];
        const pg = this.pipeGraphics[idx];
        if (pg) pg.valve.setFillStyle(CONFIG.COLORS.VALVE_IDLE);
        const wasAbove90 = pipe.fill > 0.90;

        if (pipe.fill > CONFIG.DIFFICULTY.SAFE_THRESHOLD) {
            const surgeAmt = pipe.fill * CONFIG.DIFFICULTY.SURGE_MULTIPLIER;
            pipe.fill = Math.min(pipe.fill + surgeAmt, 1.0);
            this.combo = 0;
            this.addScore(CONFIG.SCORING.SURGE_PENALTY);
            if (pg) Effects.surgeEffect(this, pg.container, pg.x, CONFIG.PIPE.TOP_Y + CONFIG.PIPE.HEIGHT / 2);
            if (pipe.linkedTo >= 0 && this.pipes[pipe.linkedTo]) {
                this.pipes[pipe.linkedTo].fill = Math.min(
                    this.pipes[pipe.linkedTo].fill + CONFIG.DIFFICULTY.LINK_SURGE_SHARE, 1.0);
            }
        } else {
            this.combo++;
            this.bestCombo = Math.max(this.bestCombo, this.combo);
            const bonus = CONFIG.SCORING.CLEAN_DRAIN + (this.combo - 1) * CONFIG.SCORING.COMBO_BONUS;
            this.addScore(bonus);
            const vy = CONFIG.PIPE.TOP_Y + CONFIG.PIPE.HEIGHT + CONFIG.PIPE.VALVE_Y_OFFSET;
            if (pg) Effects.cleanDrain(this, pg.x, vy, this.combo);
            if (this.combo > 1) Effects.comboText(this, this.combo);
            if (wasAbove90 && pipe.fill <= CONFIG.DIFFICULTY.SAFE_THRESHOLD) {
                this.addScore(CONFIG.SCORING.EMERGENCY_SAVE);
                if (pg) Effects.emergencySave(this, pg.container, pg.x, CONFIG.PIPE.TOP_Y + CONFIG.PIPE.HEIGHT / 2);
            }
        }
        this.activePipe = -1;
    }

    addScore(pts) {
        this.score = Math.max(0, this.score + pts);
        this.scoreText.setText('Score: ' + this.score);
        if (pts > 0) Effects.scalePunch(this, this.scoreText, 1.25, 120);
    }

    pauseGame() {
        this.scene.pause();
        this.scene.launch('PauseScene');
    }

    triggerBurst(pipeIdx) {
        if (this.isDead) return;
        this.isDead = true;
        const pipe = this.pipes[pipeIdx];
        const pg = this.pipeGraphics[pipeIdx];
        const bx = pg ? pg.x : CONFIG.GAME_WIDTH / 2;
        Effects.burstExplosion(this, bx, CONFIG.PIPE.TOP_Y + CONFIG.PIPE.HEIGHT / 2, pipe.color);
        setTimeout(() => {
            if (this.scene.isActive('GameScene')) {
                const bt = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.BEST_TIME) || '0');
                const ss = Math.floor(this.elapsedMs / 1000);
                if (ss > bt) localStorage.setItem(CONFIG.STORAGE_KEYS.BEST_TIME, ss);
                this.scene.start('GameOverScene', {
                    score: this.score, time: ss,
                    maxPipes: this.maxPipesReached, bestCombo: this.bestCombo
                });
            }
        }, CONFIG.TIMING.BURST_DELAY);
    }

    update(time, delta) {
        if (this.isDead) return;
        const dt = delta / 1000;
        this.elapsedMs += delta;
        const elapsedSec = this.elapsedMs / 1000;
        this.timeText.setText(Math.floor(elapsedSec) + 's');

        this.scoreTimer += delta;
        if (this.scoreTimer >= 1000) { this.scoreTimer -= 1000; this.addScore(CONFIG.SCORING.PER_SECOND); }

        this.pipeAddTimer += delta;
        if (this.pipeAddTimer > 1000) {
            this.pipeAddTimer = 0;
            const target = Stages.getTargetPipeCount(this.elapsedMs);
            if (this.pipes.length < target) {
                this.addPipe(this.pipes.length);
                this.rebuildPipeGraphics();
                for (const p of this.pipes) p._slowUntil = this.elapsedMs + CONFIG.DIFFICULTY.SLOW_DURATION;
            }
        }

        this.linkCheckTimer += delta;
        if (this.linkCheckTimer > 5000) { this.linkCheckTimer = 0; Stages.tryCreateLink(this.pipes, elapsedSec); }

        if (this.elapsedMs - this.lastInputTime > CONFIG.TIMING.INACTIVITY_TIMEOUT) {
            let wi = 0, wf = -1;
            for (let i = 0; i < this.pipes.length; i++) {
                if (this.pipes[i].fill > wf) { wf = this.pipes[i].fill; wi = i; }
            }
            this.pipes[wi].fill = 1.0;
        }

        for (let i = 0; i < this.pipes.length; i++) {
            const pipe = this.pipes[i];
            if (pipe.isBurst) continue;
            if (pipe.graceTimer > 0) pipe.graceTimer -= delta;

            if (i === this.activePipe) {
                pipe.fill -= Stages.getDifficulty(elapsedSec).drainRate * dt;
                if (pipe.fill < 0) pipe.fill = 0;
            } else {
                let rate = pipe.fillRate;
                if (pipe.graceTimer > 0) rate *= 0.5;
                if (pipe._slowUntil && this.elapsedMs < pipe._slowUntil) rate *= CONFIG.DIFFICULTY.SLOW_ON_SPAWN;
                pipe.fill += rate * dt;
            }

            if (pipe.fill >= 1.0) { pipe.fill = 1.0; pipe.isBurst = true; this.triggerBurst(i); return; }

            const pg = this.pipeGraphics[i];
            if (pg) PipeRenderer.updateVisuals(pg, pipe, delta, i === this.activePipe, dt, this);
        }

        this.steamTimer += delta;
        if (this.activePipe >= 0 && this.steamTimer > 80) {
            this.steamTimer = 0;
            const pg = this.pipeGraphics[this.activePipe];
            if (pg) Effects.steamParticle(this, pg.x,
                CONFIG.PIPE.TOP_Y + CONFIG.PIPE.HEIGHT + CONFIG.PIPE.VALVE_Y_OFFSET - 15);
        }
    }

    shutdown() { document.removeEventListener('visibilitychange', this.visHandler); }
}
