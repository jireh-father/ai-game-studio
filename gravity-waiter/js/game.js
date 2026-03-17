// Gravity Waiter - Core Gameplay Scene
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
        this.cameras.main.setBackgroundColor(CONFIG.COLOR.BG_WALL);
        // State
        this.score = 0; this.strikes = CONFIG.MAX_STRIKES; this.stageNumber = 1;
        this.rotationCount = 0; this.trayAngle = 0; this.trayAngularVel = 0;
        this.dishes = []; this.gameOver = false; this.gameOverTriggered = false;
        this.stageTransitioning = false; this.cascadeTimer = 0; this.perfectChain = 0;
        this.lastRotationDirs = []; this.dishesSurvived = 0; this.isDragging = false;
        this.pausePhysics = false; this.paused = false; this.comboEscalation = 0;
        this.sessionSeed = Date.now() % 100000; this.bumpCooldown = 0;
        this.lastInputTime = Date.now();

        drawBackground(this);
        this.tray = this.add.image(W / 2, CONFIG.TRAY_Y, 'tray').setOrigin(0.5);
        this.dishContainer = this.add.container(W / 2, CONFIG.TRAY_Y);
        this.warningBorder = this.add.rectangle(W / 2, H / 2, W, H, 0x00B4FF, 0).setStrokeStyle(8, 0x00B4FF, 0);
        this.dangerOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0xE63946, 0).setDepth(5);

        this.createHUD(); this.createPauseOverlay(); this.setupInput();
        this.stageParams = StageManager.getStageParams(this.stageNumber);
        this.startRotationTimer(); this.startDishSpawnTimer();
        this.scoreTimer = this.time.addEvent({ delay: 1000, loop: true,
            callback: () => { if (!this.gameOver && !this.paused) this.addScore(CONFIG.SCORE.PER_SECOND); } });
        this.visHandler = () => { if (document.hidden && !this.gameOver) this.togglePause(true); };
        document.addEventListener('visibilitychange', this.visHandler);
        this.spawnDish(); this.cameras.main.fadeIn(200);
    }

    createHUD() {
        const W = CONFIG.WIDTH;
        this.add.rectangle(W / 2, 30, W, 60, 0x000000, 0.65).setDepth(10);
        this.scoreText = this.add.text(14, 18, 'SCORE: ' + this.score, {
            fontSize: '18px', fontStyle: 'bold', color: '#FFF', fontFamily: 'Arial' }).setDepth(10);
        this.stageText = this.add.text(W / 2, 18, 'STAGE ' + this.stageNumber, {
            fontSize: '16px', color: '#FFF', fontFamily: 'Arial' }).setOrigin(0.5, 0).setDepth(10);
        this.strikeIcons = [];
        for (let i = 0; i < CONFIG.MAX_STRIKES; i++)
            this.strikeIcons.push(this.add.image(W - 30 - i * 28, 30, 'strike_active').setDepth(10));
        this.add.text(14, 42, '\u2759\u2759', { fontSize: '16px', color: '#FFF', fontFamily: 'Arial' })
            .setDepth(10).setInteractive({ useHandCursor: true }).on('pointerup', () => this.togglePause());
    }

    createPauseOverlay() {
        const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
        this.pauseGroup = this.add.container(0, 0).setDepth(20).setVisible(false);
        this.pauseGroup.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75));
        this.pauseGroup.add(this.add.text(W / 2, 200, 'PAUSED', {
            fontSize: '28px', fontStyle: 'bold', color: '#FFF', fontFamily: 'Arial' }).setOrigin(0.5));
        const B = [
            { y: 310, t: 'RESUME', c: 0x27AE60, fn: () => this.togglePause(false) },
            { y: 380, t: 'HOW TO PLAY', c: 0x7F8C8D, fn: () => this.scene.launch('HelpScene', { returnTo: 'GameScene', wasRunning: true }) },
            { y: 450, t: 'RESTART', c: 0xE67E22, fn: () => { this.pauseGroup.setVisible(false); this.scene.stop(); this.scene.start('GameScene'); } },
            { y: 520, t: 'MENU', c: 0x2C3E50, fn: () => { this.scene.stop(); this.scene.start('MenuScene'); } }
        ];
        for (const b of B) {
            const r = this.add.rectangle(W / 2, b.y, 240, 50, b.c).setInteractive({ useHandCursor: true });
            this.pauseGroup.add([r, this.add.text(W / 2, b.y, b.t, {
                fontSize: '18px', fontStyle: 'bold', color: '#FFF', fontFamily: 'Arial' }).setOrigin(0.5).disableInteractive()]);
            r.on('pointerup', b.fn);
        }
    }

    setupInput() {
        this.input.on('pointerdown', (p) => { if (!this.paused && !this.gameOver) { this.isDragging = true; this.lastPointerX = p.x; this.lastInputTime = Date.now(); } });
        this.input.on('pointermove', (p) => {
            if (!this.isDragging || this.paused || this.gameOver) return;
            const dx = Phaser.Math.Clamp(p.x - this.lastPointerX, -CONFIG.MAX_DRAG_PER_FRAME, CONFIG.MAX_DRAG_PER_FRAME);
            this.trayAngularVel += dx * CONFIG.DRAG_SENSITIVITY; this.lastPointerX = p.x; this.lastInputTime = Date.now();
        });
        this.input.on('pointerup', () => { this.isDragging = false; });
    }

    update(time, delta) {
        if (this.gameOver || this.paused || this.pausePhysics) return;
        const dt = delta / 1000;
        if (!this.isDragging) { this.trayAngle *= CONFIG.TRAY_DAMPING; this.trayAngularVel *= 0.85; }
        this.trayAngle += this.trayAngularVel * dt * 60;
        this.trayAngularVel *= 0.9;
        this.trayAngle = Phaser.Math.Clamp(this.trayAngle, -CONFIG.TRAY_MAX_LEAN, CONFIG.TRAY_MAX_LEAN);
        this.tray.setAngle(this.trayAngle); this.dishContainer.setAngle(this.trayAngle);
        const absA = Math.abs(this.trayAngle);
        this.dangerOverlay.setAlpha(absA > 30 ? Math.min(0.3, (absA - 30) / 15 * 0.3) : 0);
        if (absA > CONFIG.CASCADE_ANGLE) { this.cascadeTimer += delta; if (this.cascadeTimer >= CONFIG.CASCADE_TIME) { this.triggerGameOver(true); return; } } else this.cascadeTimer = 0;
        const trayRad = Phaser.Math.DegToRad(this.trayAngle), halfT = CONFIG.TRAY_WIDTH / 2, fallen = [];
        for (let i = 0; i < this.dishes.length; i++) {
            const d = this.dishes[i];
            d.velocity += Math.sin(trayRad) * CONFIG.GRAVITY_STRENGTH * d.weight * dt;
            d.velocity *= CONFIG.DISH_FRICTION; d.relativeX += d.velocity * dt; d.sprite.x = d.relativeX;
            if (Math.abs(d.relativeX) > halfT + d.width / 2) fallen.push(i);
        }
        for (let i = fallen.length - 1; i >= 0; i--) this.dishFallOff(fallen[i]);
        // Inactivity death: force tray destabilization after 25s idle
        if (Date.now() - this.lastInputTime > 25000) {
            this.trayAngularVel += (Math.random() < 0.5 ? -1 : 1) * 15;
            this.lastInputTime = Date.now();
        }
        if (this.stageParams.customerBumpChance > 0) {
            this.bumpCooldown -= delta;
            if (this.bumpCooldown <= 0 && Math.random() < this.stageParams.customerBumpChance * dt) { this.applyCustomerBump(); this.bumpCooldown = 2000; }
        }
    }

    spawnDish() {
        if (this.gameOver || this.dishes.length >= this.stageParams.maxStackSize) return;
        const pick = StageManager.pickDishType(this.stageParams.dishPool), dish = pick.dish;
        const ox = (Math.random() - 0.5) * 20, sy = -(this.dishes.length * 16 + 20);
        const key = pick.type === 'plate' ? 'plate' : pick.type === 'fish' ? 'fish' : pick.type === 'cake' ? 'cake' : 'bowl';
        const spr = this.add.image(ox, sy, key);
        spr.setScale(dish.w / (spr.width || 60), dish.h / (spr.height || 12));
        this.dishContainer.add(spr);
        Effects.scalePunch(this, spr, spr.scaleX * 1.3, 100);
        this.dishes.push({ sprite: spr, relativeX: ox, velocity: 0, width: dish.w, height: dish.h, weight: dish.weight, type: pick.type });
        this.dishesSurvived++; this.addScore(CONFIG.SCORE.DISH_ADDED);
        SoundFX.play(this, 'clink');
        Effects.spawnParticles(this, CONFIG.WIDTH / 2 + ox, CONFIG.TRAY_Y + sy, 0xFFFFFF, 8);
    }

    dishFallOff(idx) {
        const d = this.dishes[idx]; if (!d) return;
        const wx = CONFIG.WIDTH / 2 + d.relativeX, wy = CONFIG.TRAY_Y - idx * 16 - 20;
        Effects.spawnParticles(this, wx, wy, 0xFFFFFF, 12);
        d.sprite.destroy(); this.dishes.splice(idx, 1);
        for (let i = 0; i < this.dishes.length; i++) this.dishes[i].sprite.y = -(i * 16 + 20);
        this.strikes--; this.updateStrikeIcons();
        this.cameras.main.shake(250, 0.008); SoundFX.play(this, 'shatter');
        Effects.showFloatingText(this, wx, wy, '-1', '#E63946', 20);
        if (this.strikes <= 0 && !this.gameOverTriggered) this.triggerGameOver(false);
    }

    applyCustomerBump() {
        this.trayAngularVel += (Math.random() < 0.5 ? -1 : 1) * 8;
        Effects.flashOverlay(this, 0xFFD700, 0.4, 300); this.cameras.main.shake(150, 0.005);
        SoundFX.play(this, 'bump');
        const pre = this.strikes;
        this.time.delayedCall(3000, () => {
            if (this.gameOver) return;
            const pts = this.strikes === pre ? CONFIG.SCORE.BUMP_SURVIVED * 2 : CONFIG.SCORE.BUMP_SURVIVED;
            this.addScore(pts);
            if (this.strikes === pre) Effects.showFloatingText(this, CONFIG.WIDTH / 2, CONFIG.TRAY_Y - 80, '+30 BUMP!', '#FFD700', 22);
        });
    }

    startRotationTimer() {
        this.rotationTimer = this.time.delayedCall(this.stageParams.rotationInterval, () => {
            if (this.gameOver || this.paused) { this.startRotationTimer(); return; } this.triggerRotation();
        });
    }

    triggerRotation() {
        const dir = StageManager.getRotationDirection(this.lastRotationDirs);
        this.lastRotationDirs.push(dir); if (this.lastRotationDirs.length > 2) this.lastRotationDirs.shift();
        const wd = this.stageParams.rotationWarningDuration;
        this.warningBorder.setStrokeStyle(8, 0x00B4FF, 0.9);
        this.tweens.add({ targets: this.warningBorder, strokeAlpha: { from: 0, to: 0.9 }, duration: wd / 2, yoyo: true,
            onComplete: () => this.warningBorder.setStrokeStyle(8, 0x00B4FF, 0) });
        const arr = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 60, dir === 1 ? '\u21BB' : '\u21BA',
            { fontSize: '64px', color: '#00B4FF', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(8).setAlpha(0);
        const sc = 1.2 + this.comboEscalation * 0.1;
        this.tweens.add({ targets: arr, alpha: 1, scaleX: { from: 0.5, to: sc }, scaleY: { from: 0.5, to: sc }, duration: wd, onComplete: () => arr.destroy() });
        SoundFX.play(this, 'warning');
        this.time.delayedCall(wd, () => { if (!this.gameOver) this.executeRotation(dir); });
    }

    executeRotation(dir) {
        this.pausePhysics = true; setTimeout(() => { this.pausePhysics = false; }, 40);
        for (const d of this.dishes) d.velocity += dir * 120 * d.weight;
        this.trayAngularVel += dir * 5; this.cameras.main.shake(200, 0.006);
        for (const d of this.dishes) this.tweens.add({ targets: d.sprite, scaleX: d.sprite.scaleX * 1.15, duration: 100, yoyo: true });
        SoundFX.play(this, 'rotation'); this.rotationCount++;
        const absA = Math.abs(this.trayAngle), perfect = absA <= CONFIG.PERFECT_ANGLE_THRESHOLD;
        let gain = perfect ? CONFIG.SCORE.PERFECT_ROTATION : CONFIG.SCORE.ROTATION_SURVIVED;
        if (perfect) {
            this.perfectChain++; this.comboEscalation = Math.min(5, this.comboEscalation + 1);
            if (this.perfectChain >= 3) { gain += CONFIG.SCORE.PERFECT_CHAIN_BONUS;
                Effects.showFloatingText(this, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'PERFECT x' + this.perfectChain + '!', '#FFD700', 26 + this.perfectChain * 2);
                Effects.flashOverlay(this, 0xFFFFFF, 0.3, 200, 7); SoundFX.play(this, 'perfect'); }
        } else if (absA > CONFIG.CHAIN_BREAK_ANGLE) { this.perfectChain = 0; this.comboEscalation = Math.max(0, this.comboEscalation - 1); }
        this.addScore(gain);
        Effects.showFloatingText(this, CONFIG.WIDTH / 2, CONFIG.TRAY_Y - 100, perfect ? '+' + gain + ' PERFECT!' : '+' + gain, perfect ? '#FFD700' : '#FFF', perfect ? 24 : 20);
        if (this.rotationCount % CONFIG.ROTATIONS_PER_STAGE === 0 && !this.stageTransitioning) this.advanceStage();
        if (this.rotationCount % 5 === 0) { this.addScore(CONFIG.SCORE.MILESTONE); Effects.showFloatingText(this, CONFIG.WIDTH / 2, 80, '+50 MILESTONE!', '#FFD700', 22); }
        this.startRotationTimer();
    }

    advanceStage() {
        this.stageTransitioning = true; this.stageNumber++;
        this.stageParams = StageManager.getStageParams(this.stageNumber);
        this.stageText.setText('STAGE ' + this.stageNumber);
        Effects.scalePunch(this, this.stageText, 1.5, 200);
        if (this.stageParams.isRest) { this.cameras.main.setBackgroundColor('#D4EDDA');
            this.time.delayedCall(5000, () => { if (!this.gameOver) this.cameras.main.setBackgroundColor(CONFIG.COLOR.BG_WALL); }); }
        this.startDishSpawnTimer(); this.stageTransitioning = false;
    }

    addScore(pts) { this.score += pts; this.scoreText.setText('SCORE: ' + this.score); Effects.scalePunch(this, this.scoreText, 1.3, 90); }

    updateStrikeIcons() {
        for (let i = 0; i < CONFIG.MAX_STRIKES; i++) this.strikeIcons[i].setTexture(i < this.strikes ? 'strike_active' : 'strike_lost');
        this.tweens.add({ targets: this.strikeIcons, x: '+=6', duration: 50, yoyo: true, repeat: 2 });
    }

    triggerGameOver() {
        if (this.gameOverTriggered) return; this.gameOverTriggered = true; this.gameOver = true;
        if (this.rotationTimer) this.rotationTimer.remove(); if (this.dishSpawnTimer) this.dishSpawnTimer.remove(); if (this.scoreTimer) this.scoreTimer.remove();
        this.cameras.main.shake(400, 0.015); Effects.flashOverlay(this, 0xE63946, 0.6, 500, 15);
        for (const d of this.dishes) this.tweens.add({ targets: d.sprite, x: d.sprite.x + (Math.random() - 0.5) * 300,
            y: d.sprite.y + 200 + Math.random() * 200, angle: Math.random() * 360, alpha: 0, duration: 600 });
        SoundFX.play(this, 'gameover');
        let hs = 0; try { hs = parseInt(localStorage.getItem('gravity-waiter_high_score')) || 0; } catch (e) {}
        const nr = this.score > hs;
        if (nr) { try { localStorage.setItem('gravity-waiter_high_score', String(this.score)); } catch (e) {} hs = this.score; }
        this.time.delayedCall(800, () => { this.scene.launch('GameOverScene', { score: this.score, highScore: hs, isNewRecord: nr, dishesSurvived: this.dishesSurvived, stageReached: this.stageNumber }); });
    }

    continueAfterAd() {
        this.strikes = 1; this.gameOver = false; this.gameOverTriggered = false; this.lastInputTime = Date.now();
        this.updateStrikeIcons(); this.startRotationTimer(); this.startDishSpawnTimer();
        this.scoreTimer = this.time.addEvent({ delay: 1000, loop: true,
            callback: () => { if (!this.gameOver && !this.paused) this.addScore(CONFIG.SCORE.PER_SECOND); } });
    }

    startDishSpawnTimer() {
        if (this.dishSpawnTimer) this.dishSpawnTimer.remove();
        this.dishSpawnTimer = this.time.addEvent({ delay: this.stageParams.dishSpawnInterval, loop: true,
            callback: () => { if (!this.gameOver && !this.paused) this.spawnDish(); } });
    }

    togglePause(force) { if (this.gameOver) return; this.paused = force !== undefined ? force : !this.paused; this.pauseGroup.setVisible(this.paused); }

    shutdown() { this.tweens.killAll(); this.time.removeAllEvents(); document.removeEventListener('visibilitychange', this.visHandler); }
}
