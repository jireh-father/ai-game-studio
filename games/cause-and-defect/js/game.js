// game.js - GameScene: machine rendering, cascade, scrolling, fix selection

class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    create() {
        this.compSprites = []; this.connectors = []; this.fixButtons = [];
        this.cascadeFrontIdx = -1; this.cascadeTimer = null; this.stageTimer = 0;
        this.stageTransitioning = false; this.fixOptionsVisible = false;
        this.scrollVelocity = 0; this.isDragging = false; this.lastPointerX = 0;
        this.inactiveTime = 0; this.inactivityBoost = false;
        this.machineContainer = null; this.rootGlow = null; this.cascadeBar = null;
        this.isPaused = false; this.wrongTaps = 0; this.wrongFixes = 0;
        this.stageStartTime = 0; this.stageData = null;
        this.cameras.main.setBackgroundColor(COLORS.BG);
        this.startStage(window.GameState.currentStage);
    }

    startStage(num) {
        this.stageTransitioning = true;
        this.clearStage();
        const gs = window.GameState;
        gs.currentStage = num;
        this.stageData = generateStage(num, gs.sessionSalt);
        this.wrongTaps = 0; this.wrongFixes = 0;
        this.inactiveTime = 0; this.inactivityBoost = false;
        this.fixOptionsVisible = false; this.cascadeFrontIdx = -1;
        this.machineContainer = this.add.container(0, 0);
        // BG panel
        const bgC = this.stageData.isRest ? COLORS.REST_BG : COLORS.WOOD;
        this.machineContainer.add(this.add.rectangle(this.stageData.machineWidth / 2, GAME_SETTINGS.COMPONENT_Y, this.stageData.machineWidth, 300, bgC, 0.3));
        this.renderComponents();
        if (this.stageData.isBoss) this.compSprites.forEach(s => s.setTint(COLORS.GOLD));
        this.cascadeBar = this.add.rectangle(20, 480, 320, 4, COLORS.FAIL_RED, 0.6).setOrigin(0, 0.5).setScale(0, 1);
        this.stageTimer = this.stageData.parTime;
        this.stageStartTime = Date.now();
        this.introPan();
        this.setupInput();
        this.showStageAnnounce(num);
        this.scene.launch('HUDScene');
        this.stageTransitioning = false;
    }

    renderComponents() {
        this.stageData.components.forEach((comp, idx) => {
            const sprite = this.add.image(comp.x, comp.y, comp.type + '_healthy').setInteractive({ useHandCursor: true });
            sprite.on('pointerdown', () => this.handleComponentTap(idx));
            this.machineContainer.add(sprite);
            this.compSprites.push(sprite);
            if (idx < this.stageData.components.length - 1) {
                const nx = this.stageData.components[idx + 1].x;
                const cw = nx - comp.x - 60;
                if (cw > 4) {
                    const conn = this.add.rectangle(comp.x + 30 + cw / 2, comp.y, Math.max(cw, 8), 6, COLORS.IRON);
                    this.machineContainer.add(conn); this.connectors.push(conn);
                } else this.connectors.push(null);
            }
            if (comp.isRootCause) {
                this.rootGlow = this.add.circle(comp.x, comp.y, 30, COLORS.FAIL_ORANGE, 0.35);
                this.machineContainer.add(this.rootGlow);
                this.machineContainer.sendToBack(this.rootGlow);
                this.tweens.add({ targets: this.rootGlow, scaleX: 1.15, scaleY: 1.15, alpha: 0.55, duration: 800, yoyo: true, repeat: -1 });
            }
            if (comp.isDecoy) {
                const dg = this.add.circle(comp.x, comp.y, 26, COLORS.FAIL_RED, 0.15);
                this.machineContainer.add(dg); this.machineContainer.sendToBack(dg);
            }
        });
    }

    introPan() {
        const maxS = Math.max(0, this.stageData.machineWidth - GAME_SETTINGS.GAME_WIDTH);
        if (maxS > 0) {
            this.machineContainer.x = 0;
            this.tweens.add({ targets: this.machineContainer, x: -maxS, duration: 1200, ease: 'Sine.easeInOut',
                onComplete: () => { this.tweens.add({ targets: this.machineContainer, x: 0, duration: 800, ease: 'Sine.easeInOut', onComplete: () => this.beginCascade() }); }
            });
        } else this.time.delayedCall(600, () => this.beginCascade());
    }

    setupInput() {
        this.input.on('pointerdown', (p) => { this.isDragging = true; this.lastPointerX = p.x; this.inactiveTime = 0; this.inactivityBoost = false; });
        this.input.on('pointermove', (p) => { if (!this.isDragging) return; const dx = p.x - this.lastPointerX; this.scrollVelocity = dx; this.lastPointerX = p.x; this.applyScroll(dx); this.inactiveTime = 0; });
        this.input.on('pointerup', () => { this.isDragging = false; this.inactiveTime = 0; });
    }

    showStageAnnounce(num) {
        let txt = this.stageData.isBoss ? 'BOSS MACHINE' : `STAGE ${num}`;
        const col = this.stageData.isBoss ? COLORS.GOLD_HEX : COLORS.UI_TEXT_HEX;
        const ann = this.add.text(180, 250, txt, { fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: col }).setOrigin(0.5).setDepth(100).setScale(1.4);
        this.tweens.add({ targets: ann, scale: 1, duration: 400, ease: 'Back.easeOut', onComplete: () => {
            this.time.delayedCall(500, () => this.tweens.add({ targets: ann, alpha: 0, duration: 300, onComplete: () => ann.destroy() }));
        }});
    }

    beginCascade() {
        if (this.stageTransitioning) return;
        const startIdx = this.stageData.rootCauseIndex + 1;
        if (startIdx >= this.stageData.components.length) { this.completeStageEarly(); return; }
        this.cascadeFrontIdx = startIdx;
        this.failComponent(startIdx);
        this.cascadeTimer = this.time.addEvent({ delay: this.stageData.cascadeSpeed, callback: () => this.advanceCascade(), loop: true });
    }

    completeStageEarly() { this.calculateScore(this.stageData.components.length - 1); }

    advanceCascade() {
        if (this.isPaused || this.stageTransitioning) return;
        this.cascadeFrontIdx++;
        if (this.cascadeFrontIdx >= this.stageData.components.length) { if (this.cascadeTimer) this.cascadeTimer.remove(); this.playExplosion(); return; }
        this.failComponent(this.cascadeFrontIdx);
    }

    failComponent(idx) {
        if (idx < 0 || idx >= this.compSprites.length) return;
        const s = this.compSprites[idx]; const comp = this.stageData.components[idx];
        comp.failed = true; s.setTexture(comp.type + '_failed');
        for (let i = 0; i < JUICE.SPARK_PARTICLES; i++) {
            const p = this.add.circle(s.x + Phaser.Math.Between(-8, 8), s.y + Phaser.Math.Between(-8, 8), 2, COLORS.FAIL_ORANGE);
            this.machineContainer.add(p);
            this.tweens.add({ targets: p, x: p.x + Phaser.Math.Between(-30, 30), y: p.y + Phaser.Math.Between(-40, 10), alpha: 0, duration: JUICE.SPARK_LIFESPAN, onComplete: () => p.destroy() });
        }
        this.tweens.add({ targets: s, x: s.x + 2, duration: 40, yoyo: true, repeat: 3 });
    }

    handleComponentTap(idx) {
        if (this.stageTransitioning || this.fixOptionsVisible || this.isPaused) return;
        this.inactiveTime = 0;
        const comp = this.stageData.components[idx]; const sprite = this.compSprites[idx];
        this.tweens.add({ targets: sprite, scaleX: JUICE.TAP_SCALE, scaleY: JUICE.TAP_SCALE, duration: 80, yoyo: true });
        if (comp.isRootCause) { this.showFixOptions(); }
        else {
            this.wrongTaps++;
            sprite.setTint(COLORS.FAIL_RED);
            this.time.delayedCall(300, () => { if (sprite && sprite.active) sprite.clearTint(); });
            const toast = this.add.text(sprite.x, sprite.y - 30, 'Not the cause!', { fontSize: '14px', color: COLORS.FAIL_RED_HEX, fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5).setDepth(100);
            this.machineContainer.add(toast);
            this.tweens.add({ targets: toast, y: toast.y - 25, alpha: 0, duration: 800, onComplete: () => toast.destroy() });
        }
    }

    showFixOptions() {
        this.fixOptionsVisible = true;
        this.stageData.fixOptions.forEach((opt, i) => {
            const by = GAME_SETTINGS.FIX_ZONE_Y + i * 56;
            const bg = this.add.rectangle(180, by, 300, 48, COLORS.BTN_PRIMARY, 0.9).setInteractive({ useHandCursor: true }).setDepth(90);
            const txt = this.add.text(180, by, opt.text, { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).setDepth(91).setInteractive();
            const cb = () => this.handleFixSelection(opt);
            bg.on('pointerdown', cb); txt.on('pointerdown', cb);
            this.fixButtons.push(bg, txt);
            bg.setScale(0.8); txt.setScale(0.8);
            this.tweens.add({ targets: [bg, txt], scale: 1, duration: 150, delay: i * 60 });
        });
    }

    hideFixOptions() { this.fixButtons.forEach(b => { if (b && b.active) b.destroy(); }); this.fixButtons = []; this.fixOptionsVisible = false; }

    handleFixSelection(opt) {
        if (this.stageTransitioning || !this.fixOptionsVisible) return;
        this.hideFixOptions(); const gs = window.GameState;
        if (opt.type === 'correct') { if (this.cascadeTimer) this.cascadeTimer.remove(); this.playCascadeRepair(); }
        else if (opt.type === 'plausible') { this.wrongFixes++; this.boostCascade(GAME_SETTINGS.CASCADE_BOOST_PLAUSIBLE); this.shakeScreen(JUICE.WRONG_SHAKE_PLAUS); this.flashBorder(); }
        else { this.wrongFixes++; gs.lives--; this.boostCascade(GAME_SETTINGS.CASCADE_BOOST_ABSURD); this.shakeScreen(JUICE.WRONG_SHAKE_ABSURD); this.flashBorder(); gs.score += SCORING.ABSURD_PENALTY; this.events.emit('livesChanged'); this.events.emit('scoreChanged');
            if (gs.lives <= 0) { if (this.cascadeTimer) this.cascadeTimer.remove(); this.time.delayedCall(400, () => this.gameOver()); }
        }
    }

    boostCascade(factor) {
        if (!this.cascadeTimer) return;
        const nd = Math.max(200, this.cascadeTimer.delay * (1 - factor));
        this.cascadeTimer.remove();
        this.cascadeTimer = this.time.addEvent({ delay: nd, callback: () => this.advanceCascade(), loop: true });
    }

    playCascadeRepair() {
        this.stageTransitioning = true; if (this.cascadeTimer) this.cascadeTimer.remove();
        const savedCount = this.stageData.components.filter(c => !c.failed && !c.isRootCause).length;
        const failed = this.stageData.components.filter(c => c.failed);
        let delay = 0;
        [...failed].reverse().forEach((comp) => {
            this.time.delayedCall(delay, () => {
                const s = this.compSprites[comp.index]; if (!s || !s.active) return;
                s.setTexture(comp.type + '_healthy'); comp.failed = false;
                this.tweens.add({ targets: s, scaleX: 1.2, scaleY: 1.2, duration: 80, yoyo: true });
                for (let i = 0; i < 4; i++) {
                    const p = this.add.circle(s.x + Phaser.Math.Between(-10, 10), s.y, 3, Math.random() > 0.4 ? COLORS.SUCCESS_GREEN : COLORS.GOLD);
                    this.machineContainer.add(p);
                    this.tweens.add({ targets: p, y: p.y - 40, alpha: 0, duration: 400, onComplete: () => p.destroy() });
                }
            }); delay += 120;
        });
        this.time.delayedCall(delay, () => { if (this.rootGlow) { this.tweens.killTweensOf(this.rootGlow); this.rootGlow.destroy(); this.rootGlow = null; } });
        this.time.delayedCall(delay + 200, () => this.calculateScore(savedCount));
    }

    calculateScore(savedCount) {
        const gs = window.GameState; const elapsed = (Date.now() - this.stageStartTime) / 1000;
        const timeLeft = Math.max(0, this.stageData.parTime - elapsed);
        let pts = SCORING.BASE_FIX + Math.floor(timeLeft) * SCORING.TIME_BONUS_PER_SEC + savedCount * SCORING.COMPONENT_SAVED;
        const perfect = this.wrongTaps === 0 && this.wrongFixes === 0 && timeLeft > 0;
        if (perfect) pts = Math.floor(pts * SCORING.PERFECT_MULTIPLIER);
        else if (elapsed < 5) pts = Math.floor(pts * SCORING.SPEED_MULTIPLIER);
        if (this.wrongTaps === 0 && this.wrongFixes === 0) { gs.streak++; pts += gs.streak * SCORING.STREAK_BONUS; } else gs.streak = 0;
        if (this.stageData.isBoss) pts *= 2;
        gs.score += pts; this.events.emit('scoreChanged');
        let stars = 1; if (timeLeft > 0) stars = 2; if (perfect) stars = 3;
        const t = this.add.text(180, 300, `+${pts}`, { fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.GOLD_HEX }).setOrigin(0.5).setDepth(100);
        this.tweens.add({ targets: t, y: 240, alpha: 0, duration: JUICE.SCORE_FLOAT_MS, onComplete: () => t.destroy() });
        this.time.delayedCall(400, () => {
            gs.totalStars += stars; this.events.emit('stageComplete', { stars });
            this.time.delayedCall(1200, () => { if (this.stageTransitioning) this.startStage(gs.currentStage + 1); });
        });
    }

    playExplosion() {
        if (this.stageTransitioning) return; this.stageTransitioning = true;
        if (this.cascadeTimer) this.cascadeTimer.remove();
        this.shakeScreen(JUICE.EXPLOSION_SHAKE);
        const last = this.compSprites[this.compSprites.length - 1];
        if (last) {
            for (let i = 0; i < JUICE.EXPLOSION_DEBRIS; i++) {
                const d = this.add.rectangle(last.x + Phaser.Math.Between(-5, 5), last.y, 4 + Math.random() * 4, 2 + Math.random() * 3, [COLORS.BRASS, COLORS.IRON, COLORS.COPPER][i % 3]);
                this.machineContainer.add(d);
                this.tweens.add({ targets: d, x: d.x + Phaser.Math.Between(-80, 80), y: d.y + Phaser.Math.Between(-80, 40), alpha: 0, angle: Phaser.Math.Between(0, 360), duration: 600, onComplete: () => d.destroy() });
            }
            const boom = this.add.circle(last.x, last.y, 8, COLORS.FAIL_RED, 0.9);
            this.machineContainer.add(boom);
            this.tweens.add({ targets: boom, scaleX: 4, scaleY: 4, alpha: 0, duration: 400, onComplete: () => boom.destroy() });
        }
        const gs = window.GameState; gs.lives--; this.events.emit('livesChanged');
        if (gs.lives <= 0) this.time.delayedCall(800, () => this.gameOver());
        else this.time.delayedCall(800, () => this.startStage(gs.currentStage));
    }

    gameOver() {
        const gs = window.GameState; gs.gamesPlayed++;
        if (gs.score > gs.highScore) gs.highScore = gs.score;
        if (gs.currentStage > gs.highestStage) gs.highestStage = gs.currentStage;
        if (gs.streak > gs.bestStreak) gs.bestStreak = gs.streak;
        saveGameState(); this.scene.stop('HUDScene'); this.scene.start('GameOverScene');
    }

    shakeScreen(i) { this.cameras.main.shake(JUICE.EXPLOSION_MS, i / 1000); }
    flashBorder() { const f = this.add.rectangle(180, 380, 360, 760, COLORS.FAIL_RED, 0.6).setDepth(200); this.tweens.add({ targets: f, alpha: 0, duration: 150, yoyo: true, repeat: 1, onComplete: () => f.destroy() }); }
    applyScroll(dx) { if (!this.machineContainer) return; const m = Math.max(0, this.stageData.machineWidth - GAME_SETTINGS.GAME_WIDTH); this.machineContainer.x = Phaser.Math.Clamp(this.machineContainer.x + dx, -m, 0); }

    clearStage() {
        this.compSprites.forEach(s => { if (s && s.active) s.destroy(); }); this.compSprites = [];
        this.connectors.forEach(c => { if (c && c.active) c.destroy(); }); this.connectors = [];
        this.hideFixOptions();
        if (this.machineContainer) { this.machineContainer.destroy(); this.machineContainer = null; }
        if (this.cascadeTimer) { this.cascadeTimer.remove(); this.cascadeTimer = null; }
        if (this.rootGlow) { this.rootGlow.destroy(); this.rootGlow = null; }
        if (this.cascadeBar) { this.cascadeBar.destroy(); this.cascadeBar = null; }
        this.input.removeAllListeners();
    }

    update(time, delta) {
        if (this.isPaused || this.stageTransitioning) return;
        if (!this.isDragging && Math.abs(this.scrollVelocity) > 0.5) { this.applyScroll(this.scrollVelocity); this.scrollVelocity *= 0.92; }
        else if (!this.isDragging) this.scrollVelocity = 0;
        if (this.cascadeFrontIdx >= 0) { this.stageTimer -= delta / 1000; if (this.stageTimer < 0) this.stageTimer = 0; this.events.emit('timerUpdate', this.stageTimer); }
        if (this.cascadeBar && this.cascadeBar.active && this.stageData) this.cascadeBar.setScale(Math.max(0, this.cascadeFrontIdx) / this.stageData.components.length, 1);
        this.inactiveTime += delta;
        if (this.inactiveTime > GAME_SETTINGS.INACTIVITY_DEATH_MS && !this.inactivityBoost) { this.inactivityBoost = true; this.boostCascade(0.5); }
        if (this.inactivityBoost && this.inactiveTime > GAME_SETTINGS.INACTIVITY_DEATH_MS + 2000) { this.boostCascade(0.3); this.inactiveTime = GAME_SETTINGS.INACTIVITY_DEATH_MS; }
    }

    shutdown() { this.clearStage(); }
}
