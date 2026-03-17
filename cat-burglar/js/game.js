class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    init(data) {
        this.continueFrom = data && data.continueFrom ? data.continueFrom : 0;
        this.continueScore = data && data.score ? data.score : 0;
    }

    create() {
        const w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
        this.gameOver = false;
        this.escapeActive = false;
        this.stageTransitioning = false;
        this.isPaused = false;
        this.pauseGroup = null;
        this.meterPulse = null;

        this.score = this.continueFrom ? this.continueScore : 0;
        this.stage = this.continueFrom || 1;
        this.sessionSalt = Date.now() % 100000;
        this.wakeMeter = this.continueFrom ? 0 : 0;
        this.comboCount = 0;
        this.lastSwipeTime = Date.now();
        this.lastComboTime = 0;
        this.itemsKnockedThisStage = 0;
        this.currentStageData = null;
        this.shelfItems = [];
        this.swipeStart = null;
        this.escapeDeadline = null;
        this.wakeReason = null;

        window.GameState.score = this.score;
        window.GameState.stage = this.stage;

        this.add.rectangle(w / 2, h / 2, w, h, COLORS.BG);
        this.add.rectangle(w / 2, h / 2 - 50, w, h * 0.6, COLORS.WALL, 0.2);

        if (this.textures.exists('cat')) {
            this.catSprite = this.add.image(50, CONFIG.SHELF_Y - 50, 'cat').setScale(0.7);
            this.tweens.add({ targets: this.catSprite, y: this.catSprite.y - 4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }

        this.dogSleep = this.textures.exists('dog_sleep') ? this.add.image(w / 2, CONFIG.DOG_Y, 'dog_sleep').setScale(1.1) : null;
        this.dogAwake = this.textures.exists('dog_awake') ? this.add.image(w / 2, CONFIG.DOG_Y, 'dog_awake').setScale(1.1).setVisible(false) : null;
        this.zzzText = this.add.text(w / 2 + 50, CONFIG.DOG_Y - 30, '', { fontSize: '16px', fill: '#888' });
        this.zzzTimer = 0;

        if (this.textures.exists('shelf')) {
            this.add.image(w / 2, CONFIG.SHELF_Y + CONFIG.ITEM_HEIGHT / 2 + 4, 'shelf');
        } else {
            this.add.rectangle(w / 2, CONFIG.SHELF_Y + CONFIG.ITEM_HEIGHT / 2 + 8, 320, 12, COLORS.SHELF);
        }

        HUD.create(this);
        this.loadStage(this.stage);
        this.setupInput();

        this.escapeArrow = this.add.text(w / 2, h / 2, '', { fontSize: '64px', fontFamily: 'Arial', fill: '#FF3333', fontStyle: 'bold' }).setOrigin(0.5).setVisible(false).setDepth(20);
        this.escapeCountText = this.add.text(w / 2, h / 2 - 80, '', { fontSize: '20px', fill: '#FF3333' }).setOrigin(0.5).setVisible(false).setDepth(20);
        this.escapeOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0xFF0000, 0).setDepth(19);

        this.visHandler = () => {
            if (document.hidden && !this.isPaused && !this.gameOver) { this.isPaused = true; HUD.showPause(this); }
            if (!document.hidden) this.lastSwipeTime = Date.now();
        };
        document.addEventListener('visibilitychange', this.visHandler);
    }

    loadStage(num) {
        this.currentStageData = generateStage(num, this.sessionSalt);
        this.itemsKnockedThisStage = 0;
        this.stageTransitioning = false;
        this.clearShelfItems();
        this.spawnItems();
        HUD.updateQuota(this);
        this.stageText.setText(`Stage ${num}`);
        if (this.currentStageData.isRest) HUD.showFloating(this, CONFIG.WIDTH / 2, 140, 'BONUS HAUL!', '#FFD700', 28);
    }

    clearShelfItems() {
        this.shelfItems.forEach(item => { if (item && item.sprite) item.sprite.destroy(); });
        this.shelfItems = [];
    }

    spawnItems() {
        const slots = this.currentStageData.slots;
        const totalW = slots.length * CONFIG.ITEM_WIDTH + (slots.length - 1) * 8;
        const startX = (CONFIG.WIDTH - totalW) / 2 + CONFIG.ITEM_WIDTH / 2;
        slots.forEach((slot, i) => {
            const x = startX + i * (CONFIG.ITEM_WIDTH + 8);
            const y = CONFIG.SHELF_Y;
            const texKey = 'item_' + slot.tier;
            let sprite;
            if (this.textures.exists(texKey)) {
                sprite = this.add.image(x, y, texKey).setInteractive({ useHandCursor: true });
            } else {
                sprite = this.add.rectangle(x, y, 36, 50, TIER_COLORS_INT[slot.tier]).setInteractive({ useHandCursor: true });
            }
            sprite.setDepth(5).setData('tier', slot.tier).setData('index', i).setData('knocked', false);
            this.shelfItems.push({ sprite, tier: slot.tier, points: slot.points, noise: slot.noise, knocked: false });
        });
    }

    setupInput() {
        this.input.on('pointerdown', (ptr) => {
            if (this.gameOver || this.isPaused) return;
            this.swipeStart = { x: ptr.x, y: ptr.y, time: Date.now() };
        });
        this.input.on('pointerup', (ptr) => {
            if (this.gameOver || this.isPaused || !this.swipeStart) return;
            const dx = ptr.x - this.swipeStart.x;
            const dy = ptr.y - this.swipeStart.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (this.escapeActive) { this.handleEscapeInput(dx, dy, dist); this.swipeStart = null; return; }
            if (dist < CONFIG.SWIPE_MIN_DIST) { this.swipeStart = null; return; }
            if (Math.abs(dy) > Math.abs(dx) && Math.abs(dx) < 20) { this.swipeStart = null; return; }
            const dir = dx > 0 ? 'right' : 'left';
            const hitItem = this.findItemAtPoint(this.swipeStart.x, this.swipeStart.y);
            if (hitItem && !hitItem.knocked) this.knockItem(hitItem, dir);
            this.swipeStart = null;
        });
    }

    findItemAtPoint(px, py) {
        for (const item of this.shelfItems) {
            if (item.knocked) continue;
            const s = item.sprite;
            const hw = CONFIG.ITEM_WIDTH / 2 + 18, hh = CONFIG.ITEM_HEIGHT / 2 + 18;
            if (px >= s.x - hw && px <= s.x + hw && py >= s.y - hh && py <= s.y + hh) return item;
        }
        return null;
    }

    knockItem(item, dir) {
        if (this.stageTransitioning || this.escapeActive) return;
        item.knocked = true;
        this.lastSwipeTime = Date.now();
        const now = Date.now();
        if (now - this.lastComboTime < CONFIG.COMBO_WINDOW) { this.comboCount++; }
        else if (now - this.lastComboTime < CONFIG.COMBO_FORGIVE && this.comboCount > 0) { /* keep */ }
        else { this.comboCount = 1; }
        this.lastComboTime = now;

        const comboMult = this.comboCount >= 4 ? 3.0 : this.comboCount >= 3 ? 2.0 : this.comboCount >= 2 ? 1.5 : 1.0;
        const pts = Math.floor(item.points * comboMult);
        this.score += pts;
        window.GameState.score = this.score;
        this.scoreText.setText(`Score: ${this.score}`);

        const noiseRed = this.comboCount >= 4 ? 0.7 : this.comboCount >= 3 ? 0.8 : this.comboCount >= 2 ? 0.9 : 1.0;
        this.wakeMeter = Math.min(CONFIG.METER_MAX, this.wakeMeter + item.noise * noiseRed * this.currentStageData.fillRateModifier);
        HUD.updateMeter(this);

        HUD.spawnParticles(this, item.sprite.x, item.sprite.y, item.tier, dir);
        const shakeInt = { cheap: 0.004, mid: 0.005, valuable: 0.007, heirloom: 0.010, precious: 0.012 };
        const shakeDur = (item.tier === 'heirloom' || item.tier === 'precious') ? 200 : 120;
        this.cameras.main.shake(shakeDur, shakeInt[item.tier] || 0.005);
        HUD.showFloating(this, item.sprite.x, item.sprite.y - 20, `+${pts}`, this.comboCount >= 2 ? '#FFE234' : '#F0EDE8', 18);
        this.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });

        if (this.comboCount >= 2) {
            this.comboText.setText(`x${this.comboCount} COMBO!`);
            this.tweens.add({ targets: this.comboText, scaleX: 1.4, scaleY: 1.4, duration: 100, yoyo: true });
        } else { this.comboText.setText(''); }

        const flyX = dir === 'right' ? item.sprite.x + 250 : item.sprite.x - 250;
        this.tweens.add({
            targets: item.sprite, x: flyX, y: item.sprite.y + 80, angle: dir === 'right' ? 720 : -720,
            alpha: 0, scaleX: 0, scaleY: 0, duration: 400, ease: 'Quad.easeIn',
            onComplete: () => { if (item.sprite) item.sprite.destroy(); }
        });

        this.itemsKnockedThisStage++;
        HUD.updateQuota(this);
        if (this.wakeMeter >= CONFIG.METER_MAX) this.triggerDogWake('meter');
    }

    triggerDogWake(reason) {
        if (this.escapeActive || this.gameOver) return;
        this.escapeActive = true;
        this.wakeReason = reason;
        this.comboCount = 0;
        this.comboText.setText('');
        if (this.dogSleep) this.dogSleep.setVisible(false);
        if (this.dogAwake) { this.dogAwake.setVisible(true); this.tweens.add({ targets: this.dogAwake, scaleX: 1.5, scaleY: 1.5, duration: 150, yoyo: true }); }
        this.zzzText.setText('');
        this.cameras.main.shake(200, 0.006);
        this.escapeOverlay.setAlpha(0.3);
        this.tweens.add({ targets: this.escapeOverlay, alpha: 0, duration: 300 });

        const rng = seededRandom(Date.now());
        this.escapeSequence = generateEscapeSequence(this.currentStageData.escapeSwipes, rng);
        this.escapeIndex = 0;
        this.escapeTimePerSwipe = this.currentStageData.escapeTime;
        this.showNextEscapeArrow();
    }

    showNextEscapeArrow() {
        if (this.escapeIndex >= this.escapeSequence.length) { this.escapeSucceeded(); return; }
        const arrows = { left: '<', right: '>', up: '^', down: 'v' };
        this.escapeArrow.setText(arrows[this.escapeSequence[this.escapeIndex]]).setVisible(true);
        this.escapeCountText.setText(`${this.escapeIndex + 1}/${this.escapeSequence.length}`).setVisible(true);
        this.tweens.add({ targets: this.escapeArrow, scaleX: 1.15, scaleY: 1.15, duration: 200, yoyo: true, repeat: -1 });
        this.escapeDeadline = Date.now() + this.escapeTimePerSwipe;
    }

    handleEscapeInput(dx, dy, dist) {
        if (!this.escapeActive || this.gameOver || dist < CONFIG.SWIPE_MIN_DIST) return;
        const swipeDir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        if (swipeDir === this.escapeSequence[this.escapeIndex]) {
            this.escapeIndex++;
            this.escapeArrow.setVisible(false);
            this.tweens.killTweensOf(this.escapeArrow);
            this.cameras.main.shake(80, 0.002);
            HUD.showFloating(this, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 40, 'OK!', '#27AE60', 22);
            this.showNextEscapeArrow();
        } else { this.escapeFailed(); }
    }

    escapeSucceeded() {
        this.escapeActive = false;
        this.escapeArrow.setVisible(false);
        this.escapeCountText.setVisible(false);
        this.tweens.killTweensOf(this.escapeArrow);
        if (this.dogSleep) this.dogSleep.setVisible(true);
        if (this.dogAwake) this.dogAwake.setVisible(false);
        this.wakeMeter = this.currentStageData.postEscapeMeter;
        HUD.updateMeter(this);
        this.lastSwipeTime = Date.now();
        this.score += 300;
        window.GameState.score = this.score;
        this.scoreText.setText(`Score: ${this.score}`);
        HUD.showFloating(this, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'ESCAPED!', '#27AE60', 28);
        this.cameras.main.flash(150, 39, 174, 96);
    }

    escapeFailed() {
        this.escapeActive = false;
        this.escapeArrow.setVisible(false);
        this.escapeCountText.setVisible(false);
        this.tweens.killTweensOf(this.escapeArrow);
        this.triggerGameOver(this.wakeReason === 'idle' ? 'idle' : 'caught');
    }

    triggerGameOver(type) {
        if (this.gameOver) return;
        this.gameOver = true;
        this.cameras.main.shake(400, 0.01);
        this.escapeOverlay.setAlpha(0.5);
        this.tweens.add({ targets: this.escapeOverlay, alpha: 0, duration: 300 });
        if (this.dogAwake) { this.dogAwake.setVisible(true); this.tweens.add({ targets: this.dogAwake, scaleX: 1.8, scaleY: 1.8, duration: 150 }); }
        this.time.delayedCall(600, () => {
            this.scene.stop('GameScene');
            this.scene.start('GameOverScene', { score: this.score, stage: this.stage, deathType: type });
        });
    }

    advanceStage() {
        this.stageTransitioning = true;
        this.score += 200 * this.stage;
        window.GameState.score = this.score;
        this.scoreText.setText(`Score: ${this.score}`);
        HUD.stageClearEffects(this);
        this.time.delayedCall(CONFIG.STAGE_CLEAR_DELAY, () => { this.stage++; window.GameState.stage = this.stage; this.loadStage(this.stage); });
    }

    togglePause() {
        if (this.gameOver || this.escapeActive) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) HUD.showPause(this); else HUD.hidePause(this);
    }

    shutdown() {
        this.tweens.killAll();
        this.time.removeAllEvents();
        if (this.visHandler) document.removeEventListener('visibilitychange', this.visHandler);
    }

    update() {
        if (this.gameOver || this.isPaused) return;
        const idleSeconds = Math.floor((Date.now() - this.lastSwipeTime) / 1000);
        if (idleSeconds >= CONFIG.IDLE_DEATH_SECONDS && !this.escapeActive) this.triggerDogWake('idle');
        if (!this.escapeActive) HUD.updateIdle(this, idleSeconds);

        if (!this.escapeActive && this.dogSleep && this.dogSleep.visible) {
            this.zzzTimer++;
            if (this.zzzTimer % 60 === 0) {
                this.zzzText.setText(['Z', 'z', 'Z'][Math.floor(this.zzzTimer / 60) % 3]);
                this.tweens.add({ targets: this.zzzText, y: CONFIG.DOG_Y - 40, alpha: 0, duration: 1500, onComplete: () => { this.zzzText.setAlpha(1).setY(CONFIG.DOG_Y - 30); } });
            }
        }

        if (this.escapeActive && this.escapeDeadline && Date.now() > this.escapeDeadline) this.escapeFailed();
        if (this.currentStageData && this.itemsKnockedThisStage >= this.currentStageData.quota && !this.stageTransitioning && !this.escapeActive) this.advanceStage();
        if (this.comboCount > 0 && Date.now() - this.lastComboTime > CONFIG.COMBO_FORGIVE) { this.comboCount = 0; this.comboText.setText(''); }
    }
}
