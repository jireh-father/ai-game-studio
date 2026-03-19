class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    init(data) {
        this.isRevive = data && data.revive;
        this.reviveScore = (data && data.score) || 0;
        this.reviveStage = (data && data.stage) || 1;
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.score = this.isRevive ? this.reviveScore : 0;
        this.stage = this.isRevive ? this.reviveStage : 1;
        this.lives = this.isRevive ? 1 : MAX_LIVES;
        this.combo = 0;
        this.sweetSpotWidth = this.isRevive ? Math.max(SWEET_SPOT.MIN, SWEET_SPOT.INITIAL - this.stage) : SWEET_SPOT.INITIAL;
        this.gameOver = false;
        this.gameState = 'waiting';
        this.stageTransitioning = false;
        this.lastInputTime = Date.now();
        this.hitstopEnd = 0;

        this.drawBackground(w, h);

        this.platformY = h * PLATFORM_Y_FRAC;
        this.platformBaseX = w / 2;
        this.platform = this.add.image(this.platformBaseX, this.platformY, 'platform').setDepth(3);

        this.sweetSpotRect = this.add.rectangle(
            this.platformBaseX, this.platformY - 2,
            this.sweetSpotWidth, PLATFORM_HEIGHT, COLORS.GOLD, 0.7
        ).setDepth(4);
        this.tweens.add({ targets: this.sweetSpotRect, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });

        this.decoyPlatform = this.add.image(-200, this.platformY, 'platform').setDepth(3).setAlpha(0).setTint(0xFF6666);
        this.decoyActive = false;

        this.character = this.add.image(w / 2, -40, 'player').setDepth(5);
        this.splatImg = this.add.image(w / 2, this.platformY, 'splat').setDepth(2).setAlpha(0);

        this.whiteFlash = this.add.rectangle(w / 2, h / 2, w, h, 0xFFFFFF, 0).setDepth(100);
        this.redFlash = this.add.rectangle(w / 2, h / 2, w, h, COLORS.DANGER, 0).setDepth(100);

        this.input.on('pointerdown', (pointer) => {
            if (pointer.y < 48) return;
            this.lastInputTime = Date.now();
            if (this.gameState === 'falling') this.attemptLanding();
        });

        this.visHandler = () => { if (document.hidden) this.scene.pause('GameScene'); };
        document.addEventListener('visibilitychange', this.visHandler);

        this.stageConfig = getStageConfig(this.stage);
        this.stageTime = 0;
        this.emitHUD(false, false);
        this.time.delayedCall(200, () => this.spawnCharacter());
    }

    drawBackground(w, h) {
        const bg = this.add.graphics().setDepth(0);
        bg.fillStyle(COLORS.SKY_TOP, 1);
        bg.fillRect(0, 0, w, h / 2);
        bg.fillStyle(COLORS.SKY_BOTTOM, 1);
        bg.fillRect(0, h / 2, w, h / 2);
        this.cityGraphics = this.add.graphics().setDepth(1);
        this.cityGraphics.fillStyle(0x0F172A, 0.3);
        const baseY = h * 0.92;
        [{ x: 0, w: 40, h: 80 }, { x: 50, w: 30, h: 120 }, { x: 90, w: 45, h: 60 },
         { x: 145, w: 35, h: 140 }, { x: 190, w: 50, h: 90 }, { x: 250, w: 40, h: 110 },
         { x: 300, w: 60, h: 70 }].forEach(b => {
            this.cityGraphics.fillRect(b.x, baseY - b.h, b.w, b.h + 60);
        });
        this.add.rectangle(w / 2, h * 0.94, w, h * 0.12, COLORS.GROUND).setDepth(1);
    }

    spawnCharacter() {
        if (this.gameOver) return;
        this.stageConfig = getStageConfig(this.stage);
        this.stageTime = 0;
        const w = this.scale.width;
        const startY = this.platformY - this.stageConfig.fallHeight;
        this.character.setTexture('player').setPosition(w / 2, startY).setAlpha(1).setScale(1);
        this.splatImg.setAlpha(0);
        this.platformBaseX = w / 2;
        this.updatePlatformPosition(0);
        this.sweetSpotRect.setSize(this.sweetSpotWidth, PLATFORM_HEIGHT);

        if (this.stageConfig.hasDecoys) {
            const decoyX = getDecoyPlatformX(this.stageConfig, this.platform.x, w);
            if (decoyX !== null) {
                this.decoyPlatform.setPosition(decoyX, this.platformY).setAlpha(0.85);
                this.decoyActive = true;
            }
        } else {
            this.decoyPlatform.setAlpha(0);
            this.decoyActive = false;
        }

        if (this.stageConfig.isRestStage) {
            this.sweetSpotWidth = 80;
            this.sweetSpotRect.setSize(80, PLATFORM_HEIGHT).setFillStyle(COLORS.GOLD, 0.9);
        }
        this.gameState = 'falling';
        this.stageTransitioning = false;
    }

    update(time, delta) {
        if (this.gameOver || this.gameState === 'waiting') return;
        if (Date.now() - this.lastInputTime > INACTIVITY_TIMEOUT && !this.gameOver) {
            this.triggerDeath();
            return;
        }
        if (this.gameState === 'hitstop') {
            if (Date.now() >= this.hitstopEnd) {
                this.gameState = 'resolving';
                this.resolveAfterHitstop();
            }
            return;
        }
        if (this.gameState !== 'falling') return;

        this.stageTime += delta;
        this.updatePlatformPosition(this.stageTime);

        const fallDelta = this.stageConfig.fallSpeed * (delta / 1000);
        this.character.y += fallDelta;

        if (this.stageConfig.windForce !== 0) {
            this.character.x += getWindOffset(this.stageConfig, delta);
            this.character.x = Phaser.Math.Clamp(this.character.x, 20, this.scale.width - 20);
        }
        if (this.cityGraphics) this.cityGraphics.y = -fallDelta * 0.15 + (this.cityGraphics.y || 0);

        const charFeetY = this.character.y + CHARACTER_HEIGHT / 2;
        if (charFeetY > this.platformY + 10 && !this.stageTransitioning) this.resolveMiss();
    }

    updatePlatformPosition(t) {
        const px = getPlatformX(this.stageConfig, t, this.platformBaseX);
        this.platform.x = px;
        this.sweetSpotRect.x = px;
    }

    attemptLanding() {
        if (this.gameState !== 'falling') return;
        this.gameState = 'resolving';
        const charFeetY = this.character.y + CHARACTER_HEIGHT / 2;
        const platformTopY = this.platformY - PLATFORM_HEIGHT / 2;
        const deltaY = charFeetY - platformTopY;

        if (deltaY < -40) {
            this.gameState = 'falling';
            this.spawnInputRipple(this.input.activePointer.x, this.input.activePointer.y);
            return;
        }
        this.spawnInputRipple(this.input.activePointer.x, this.input.activePointer.y);
        this.tweens.add({ targets: this.character, alpha: 0.4, duration: 40, yoyo: true });

        const deltaX = Math.abs(this.character.x - this.platform.x);
        if (deltaX <= this.sweetSpotWidth / 2) this.resolvePerfect();
        else if (deltaX <= 40) this.resolveGood();
        else this.resolveBad();
    }

    resolvePerfect() {
        const isRest = this.stageConfig.isRestStage;
        this.combo++;
        const multiplier = Math.min(this.combo, 10);
        const points = SCORE.PERFECT_BASE * multiplier * (isRest ? 3 : 1) + Math.floor(this.stageConfig.fallHeight / SCORE.HEIGHT_BONUS_RATE);
        this.score += points;
        if (this.combo > 0 && this.combo % SCORE.COMBO_BONUS_INTERVAL === 0) this.score += SCORE.COMBO_BONUS_POINTS;
        this.sweetSpotWidth = Math.min(SWEET_SPOT.MAX, this.sweetSpotWidth + SWEET_SPOT.PERFECT_EXPAND);

        this.character.y = this.platformY - CHARACTER_HEIGHT / 2 - PLATFORM_HEIGHT / 2;
        this.character.x = this.platform.x;
        this.gameState = 'hitstop';
        this.hitstopEnd = Date.now() + 60;

        this.screenFlash(0xFFFFFF, 0.5, 120);
        this.cameras.main.shake(180, 0.006);
        this.tweens.add({ targets: this.character, scaleX: 1.35, scaleY: 1.35, duration: 100, yoyo: true });
        this.character.setTexture('player_stuck');
        this.time.delayedCall(500, () => { if (this.character) this.character.setTexture('player'); });
        this.spawnParticles(this.platform.x, this.platformY, 12, 'particle_gold', 60, 120, 300);
        this.floatingText(this.character.x, this.character.y - 20, `+${points}`, '#F59E0B');
        this.playPerfectSound();
        if (this.combo >= 10) this.tweens.add({ targets: this.cameras.main, zoom: 1.05, duration: 150, yoyo: true });
    }

    resolveAfterHitstop() {
        this.checkHighScore();
        this.emitHUD(false, true);
        this.time.delayedCall(400, () => { this.stage++; this.stageTransitioning = false; this.spawnCharacter(); });
    }

    resolveGood() {
        this.combo = 0;
        this.score += SCORE.GOOD_BASE;
        this.character.y = this.platformY - CHARACTER_HEIGHT / 2 - PLATFORM_HEIGHT / 2;
        this.character.x = this.platform.x;
        this.cameras.main.shake(100, 0.003);
        this.tweens.add({ targets: this.character, scaleX: 1.2, scaleY: 1.2, duration: 80, yoyo: true });
        this.spawnParticles(this.character.x, this.platformY, 8, 'particle_green', 40, 80, 250);
        this.floatingText(this.character.x, this.character.y - 20, '+50', '#FFFFFF');
        this.playGoodSound();
        this.checkHighScore();
        this.emitHUD(false, true);
        this.time.delayedCall(400, () => { this.stage++; this.spawnCharacter(); });
    }

    resolveBad() {
        this.combo = 0;
        this.lives--;
        this.sweetSpotWidth = Math.max(SWEET_SPOT.MIN, this.sweetSpotWidth - SWEET_SPOT.BAD_SHRINK);
        this.triggerSplat();
    }

    resolveMiss() {
        if (this.stageTransitioning) return;
        this.stageTransitioning = true;
        this.gameState = 'resolving';
        this.combo = 0;
        this.lives--;
        this.sweetSpotWidth = Math.max(SWEET_SPOT.MIN, this.sweetSpotWidth - SWEET_SPOT.BAD_SHRINK);
        this.triggerSplat();
    }

    triggerSplat() {
        this.gameState = 'dead';
        this.character.setAlpha(0);
        this.splatImg.setPosition(this.character.x, this.platformY).setAlpha(1).setScale(0);
        this.tweens.add({
            targets: this.splatImg, scaleX: 1.4, scaleY: 1.4, duration: 100,
            onComplete: () => { this.tweens.add({ targets: this.splatImg, scaleX: 1.2, scaleY: 1.2, duration: 300 }); }
        });
        this.cameras.main.shake(350, 0.018);
        this.screenFlash(COLORS.DANGER, 0.4, 200);
        this.spawnParticles(this.character.x, this.platformY, 16, 'particle_blue', 80, 180, 500);
        this.playSplatSound();
        this.emitHUD(true, false);
        this.time.delayedCall(400, () => {
            this.splatImg.setAlpha(0);
            if (this.lives <= 0) this.doGameOver();
            else this.time.delayedCall(400, () => this.spawnCharacter());
        });
    }

    triggerDeath() {
        if (this.gameOver || this.gameState === 'dead') return;
        this.lives = 0;
        this.triggerSplat();
    }

    doGameOver() {
        this.gameOver = true;
        this.checkHighScore();
        const overlay = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, COLORS.UI_BG, 0).setDepth(50);
        this.tweens.add({
            targets: overlay, alpha: 0.8, duration: 400, onComplete: () => {
                this.playGameOverSound();
                const isHS = this.score > 0 && this.score >= (parseInt(localStorage.getItem(LS_KEY)) || 0);
                if (isHS) localStorage.setItem(LS_KEY, this.score.toString());
                this.events.emit('gameOver', { score: this.score, stage: this.stage });
                this.scene.stop('HUDScene');
                this.scene.stop('GameScene');
                this.scene.start('GameOverScene', { score: this.score, stage: this.stage, isHighScore: isHS });
            }
        });
    }

    checkHighScore() {
        const hs = parseInt(localStorage.getItem(LS_KEY)) || 0;
        if (this.score > hs) localStorage.setItem(LS_KEY, this.score.toString());
    }

    emitHUD(lifeLost, scorePulse) {
        this.events.emit('updateHUD', { score: this.score, stage: this.stage, lives: this.lives, combo: this.combo, lifeLost, scorePulse });
    }

    shutdown() {
        this.tweens.killAll();
        this.time.removeAllEvents();
        document.removeEventListener('visibilitychange', this.visHandler);
    }
}

// Mixin effects and audio methods
Object.assign(GameScene.prototype, GameEffects);
