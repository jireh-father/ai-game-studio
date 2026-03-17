// Echo Thief - Core Gameplay (HUD/effects in hud.js)
class GameScene extends Phaser.Scene {
    constructor() { super('game'); }

    init(data) {
        this.continueRun = data && data.continueRun || false;
        this.initScore = data && data.score || 0;
        this.initStage = data && data.stage || 1;
    }

    create() {
        const w = GAME_WIDTH, h = GAME_HEIGHT;
        this.gameOver = false;
        this.stageTransitioning = false;
        this.isPaused = false;
        this.pauseElements = null;
        this.score = this.continueRun ? this.initScore : 0;
        this.stage = this.continueRun ? this.initStage : 1;
        this.noisePct = this.continueRun ? 50 : 0;
        this.stageTimer = STAGE_DURATION;
        this.chainTimer = 0;
        this.lastContactTime = 0;
        this.comboCount = 0;
        this.shiftIndex = 0;
        this.shiftTimeout = null;
        this.survivalAccum = 0;
        this.hitStopTimer = 0;
        this._closeCallActive = false;
        this._silenceAccum = 0;
        this.lastDirX = 0;
        this.lastDirY = -1;
        this.waveTrailPositions = [];

        // Background
        this.add.rectangle(w / 2, h / 2, w, h, COLORS.BG);

        // Trail graphics
        this.trailGfx = this.add.graphics().setDepth(1);

        // Generate stage
        this.stageData = generateStage(this.stage);
        this.waveSpeed = this.stageData.params.waveSpeed;
        this.passiveDecay = this.stageData.params.passiveNoiseDecay;

        this.spawnSilenceZones();
        this.spawnCreatures();

        // Create wave (player)
        this.wave = this.add.image(w / 2, PLAY_AREA_TOP + PLAY_AREA_HEIGHT / 2, 'wave').setDepth(3);
        this.tweens.add({ targets: this.wave, alpha: { from: 0.8, to: 1 }, duration: 800, yoyo: true, repeat: -1 });

        // HUD (defined in hud.js)
        this.createHUD();

        // Input
        this.isPointerDown = false;
        this.pointerX = this.wave.x;
        this.pointerY = this.wave.y;
        this.lastInputTime = Date.now();
        this.input.on('pointerdown', (p) => { this.isPointerDown = true; this.pointerX = p.x; this.pointerY = p.y; this.lastInputTime = Date.now(); });
        this.input.on('pointermove', (p) => { if (p.isDown) { this.isPointerDown = true; this.pointerX = p.x; this.pointerY = p.y; this.lastInputTime = Date.now(); } });
        this.input.on('pointerup', () => { this.isPointerDown = false; this.lastInputTime = Date.now(); });

        // Schedule creature shifts
        this.scheduleCreatureShift();

        // Visibility handler
        this.visHandler = () => {
            if (document.hidden && !this.gameOver) this.togglePause(true);
        };
        document.addEventListener('visibilitychange', this.visHandler);
    }

    spawnCreatures() {
        this.creatureSprites = [];
        this.stageData.creatures.forEach((c, i) => {
            const key = c.isLoud ? 'creature-loud' : 'creature';
            const img = this.add.image(c.x, c.y, key).setDepth(2);
            this.tweens.add({ targets: img, scaleX: 1.05, scaleY: 1.05, duration: 2000, yoyo: true, repeat: -1, delay: i * 300 });
            if (c.isLoud) {
                this.tweens.add({ targets: img, alpha: { from: 0.7, to: 1 }, duration: 800, yoyo: true, repeat: -1 });
            }
            this.creatureSprites.push({ data: c, image: img, flashCooldown: 0 });
        });
    }

    spawnSilenceZones() {
        this.silenceSprites = [];
        this.stageData.silenceZones.forEach(sz => {
            const s = this.add.ellipse(sz.x, sz.y, sz.radius * 2, sz.radius * 1.8, COLORS.SILENCE_HEX, 0.5).setDepth(0);
            const border = this.add.ellipse(sz.x, sz.y, sz.radius * 2, sz.radius * 1.8).setDepth(0);
            border.setStrokeStyle(2, COLORS.SILENCE_EDGE_HEX, 0.6);
            border.setFillStyle(0, 0);
            this.tweens.add({ targets: border, alpha: { from: 0.3, to: 0.7 }, duration: 1500, yoyo: true, repeat: -1 });
            this.silenceSprites.push({ zone: sz, sprite: s, border });
        });
    }

    scheduleCreatureShift() {
        if (this.gameOver) return;
        const interval = this.stageData.params.creatureShiftInterval;
        this.shiftTimeout = setTimeout(() => {
            if (this.gameOver || this.isPaused) { this.scheduleCreatureShift(); return; }
            this.shiftIndex++;
            this.creatureSprites.forEach(cs => {
                this.tweens.add({ targets: cs.image, alpha: { from: 1, to: 0.3 }, duration: 50, yoyo: true, repeat: 9 });
            });
            setTimeout(() => {
                if (this.gameOver) return;
                const newPos = getCreatureShiftPositions(this.stage, this.shiftIndex, this.stageData.creatures);
                this.creatureSprites.forEach((cs, i) => {
                    if (newPos[i]) {
                        cs.data.x = newPos[i].x;
                        cs.data.y = newPos[i].y;
                        this.tweens.add({ targets: cs.image, x: newPos[i].x, y: newPos[i].y, duration: 300, ease: 'Quad.easeInOut' });
                    }
                });
                this.scheduleCreatureShift();
            }, 500);
        }, interval);
    }

    update(time, delta) {
        if (this.gameOver || this.isPaused) return;
        const dt = delta / 1000;

        if (this.hitStopTimer > 0) { this.hitStopTimer -= delta; return; }

        this.moveWave();
        this.updateTrail();
        this.checkCreatureCollisions(time);
        this.checkSilenceZones(dt);

        // Passive noise decay
        this.noisePct = Math.max(0, this.noisePct - this.passiveDecay * dt);

        // Inactivity penalty: +5% noise/sec after 10s idle
        const idleSeconds = (Date.now() - this.lastInputTime) / 1000;
        if (idleSeconds >= 10) {
            this.noisePct = Math.min(100, this.noisePct + 5 * dt);
        }

        // Chain silence tracking
        this.chainTimer += dt;
        if (this.chainTimer >= 3 && this.chainTimer - dt < 3) {
            this.addScore(SCORE_VALUES.CHAIN_SILENCE);
            this.showFloatingText(this.wave.x, this.wave.y - 30, '+CHAIN BONUS +500', COLORS.GOLD, 24, 800);
        }
        if (this.chainTimer > 0) {
            this.chainText.setText('CHAIN: ' + this.chainTimer.toFixed(1) + 's').setAlpha(0.7);
        }

        // Survival score
        this.survivalAccum += dt;
        if (this.survivalAccum >= 1) { this.survivalAccum -= 1; this.addScore(SCORE_VALUES.SURVIVE_PER_SEC); }

        // Stage timer
        this.stageTimer -= dt;
        if (this.stageTimer <= 0 && !this.stageTransitioning) { this.advanceStage(); }

        this.updateHUD();

        if (this.noisePct >= 100) { this.triggerBurst(); }

        this.creatureSprites.forEach(cs => { if (cs.flashCooldown > 0) cs.flashCooldown -= delta; });
    }

    moveWave() {
        if (this.isPointerDown) {
            const dx = this.pointerX - this.wave.x;
            const dy = this.pointerY - this.wave.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) { this.lastDirX = dx / dist; this.lastDirY = dy / dist; }
        }
        this.wave.x += this.lastDirX * this.waveSpeed;
        this.wave.y += this.lastDirY * this.waveSpeed;

        if (this.wave.x < WAVE_RADIUS) { this.wave.x = WAVE_RADIUS; this.lastDirX = Math.abs(this.lastDirX); }
        if (this.wave.x > GAME_WIDTH - WAVE_RADIUS) { this.wave.x = GAME_WIDTH - WAVE_RADIUS; this.lastDirX = -Math.abs(this.lastDirX); }
        if (this.wave.y < PLAY_AREA_TOP + WAVE_RADIUS) { this.wave.y = PLAY_AREA_TOP + WAVE_RADIUS; this.lastDirY = Math.abs(this.lastDirY); }
        if (this.wave.y > GAME_HEIGHT - WAVE_RADIUS) { this.wave.y = GAME_HEIGHT - WAVE_RADIUS; this.lastDirY = -Math.abs(this.lastDirY); }
    }

    updateTrail() {
        this.waveTrailPositions.unshift({ x: this.wave.x, y: this.wave.y });
        if (this.waveTrailPositions.length > 8) this.waveTrailPositions.pop();
        this.trailGfx.clear();
        for (let i = 1; i < this.waveTrailPositions.length; i++) {
            const p = this.waveTrailPositions[i];
            this.trailGfx.fillStyle(COLORS.WAVE_HEX, 0.6 * Math.pow(0.75, i));
            this.trailGfx.fillCircle(p.x, p.y, Math.max(2, 12 - i));
        }
    }

    checkCreatureCollisions(time) {
        this.creatureSprites.forEach(cs => {
            if (cs.flashCooldown > 0) return;
            if (Phaser.Math.Distance.Between(this.wave.x, this.wave.y, cs.data.x, cs.data.y) < CONTACT_DISTANCE) {
                this.handleCreatureContact(cs, time);
            }
        });
    }

    handleCreatureContact(cs, time) {
        const noiseAdd = cs.data.isLoud ? 45 : Phaser.Math.Between(25, 40);
        this.noisePct = Math.min(100, this.noisePct + noiseAdd);
        cs.flashCooldown = 500;
        this.chainTimer = 0;
        this.chainText.setAlpha(0);

        if (time - this.lastContactTime < 2000) { this.comboCount++; } else { this.comboCount = 1; }
        this.lastContactTime = time;

        this.tweens.add({ targets: cs.image, alpha: 0.2, duration: 75, yoyo: true });
        const shake = Math.min(0.01, (cs.data.isLoud ? 0.006 : 0.003) + this.comboCount * 0.001);
        this.cameras.main.shake(120, shake);
        this.emitParticles(cs.data.x, cs.data.y, 'particle-amber', 12 + this.comboCount * 4);
        this.hitStopTimer = 40;
        this.showFloatingText(cs.data.x, cs.data.y - 20, '+' + noiseAdd + '%', cs.data.isLoud ? '#FF4500' : '#FFB347', 16, 400);
        this.tweens.add({ targets: this.meterBar, scaleY: 1.3, duration: 50, yoyo: true });
        if (this.noisePct >= 80) this._closeCallActive = true;
    }

    checkSilenceZones(dt) {
        let inSilence = false;
        this.silenceSprites.forEach(ss => {
            if (!ss.zone.visible) return;
            const dx = this.wave.x - ss.zone.x, dy = this.wave.y - ss.zone.y;
            if (dx * dx + dy * dy < ss.zone.radiusSq) {
                inSilence = true;
                const prev = this.noisePct;
                this.noisePct = Math.max(0, this.noisePct - SILENCE_DRAIN_PER_SECOND * dt);
                if (this._closeCallActive && prev >= 80 && this.noisePct < 50) {
                    this.addScore(SCORE_VALUES.CLOSE_CALL);
                    this.showFloatingText(this.wave.x, this.wave.y - 40, '+CLOSE CALL! +100', '#FF6600', 18, 600);
                    this._closeCallActive = false;
                }
            }
        });
        if (inSilence) {
            this._silenceAccum += dt;
            if (this._silenceAccum >= 1) { this._silenceAccum -= 1; this.addScore(SCORE_VALUES.SILENCE_PER_SEC); }
        } else { this._silenceAccum = 0; }
    }

    addScore(pts) {
        this.score += pts;
        GameState.currentScore = this.score;
        if (this.scoreText) this.tweens.add({ targets: this.scoreText, scaleX: 1.25, scaleY: 1.25, duration: 75, yoyo: true });
    }

    advanceStage() {
        this.stageTransitioning = true;
        this.stage++;
        GameState.currentStage = this.stage;
        this.stageTimer = STAGE_DURATION;

        const pts = SCORE_VALUES.STAGE_COMPLETE_BASE + SCORE_VALUES.STAGE_COMPLETE_BONUS * this.stage;
        this.addScore(pts);
        this.showFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'STAGE CLEAR! +' + pts, COLORS.WAVE, 20, 700);

        const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.WAVE_HEX, 0.2).setDepth(10);
        this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });

        this.stageData = generateStage(this.stage);
        this.waveSpeed = this.stageData.params.waveSpeed;
        this.passiveDecay = this.stageData.params.passiveNoiseDecay;

        this.creatureSprites.forEach(cs => cs.image.destroy());
        this.spawnCreatures();

        this.silenceSprites.forEach(ss => { ss.sprite.destroy(); ss.border.destroy(); });
        this.spawnSilenceZones();

        if (this.shiftTimeout) clearTimeout(this.shiftTimeout);
        this.shiftIndex = 0;
        this.scheduleCreatureShift();
        this.stageTransitioning = false;
    }

    triggerBurst() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.cameras.main.shake(400, 0.015);

        const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFFFFFF, 0.9).setDepth(15);
        this.tweens.add({ targets: flash, alpha: 0, duration: 200 });
        this.tweens.add({ targets: this.wave, scaleX: 3.5, scaleY: 3.5, duration: 150 });
        this.tweens.add({ targets: this.wave, alpha: 0, duration: 100, delay: 150 });
        this.emitParticles(this.wave.x, this.wave.y, 'particle', 24, 200);

        if (this.shiftTimeout) clearTimeout(this.shiftTimeout);

        setTimeout(() => {
            if (!this.scene.isActive('game')) return;
            this.scene.launch('gameover', { score: this.score, stage: this.stage, canContinue: !GameState.hasUsedContinue });
        }, 700);
    }

    shutdown() {
        this.tweens.killAll();
        if (this.shiftTimeout) clearTimeout(this.shiftTimeout);
        document.removeEventListener('visibilitychange', this.visHandler);
    }
}
