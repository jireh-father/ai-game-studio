class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    init(data) {
        this.continueFromStage = data && data.continueFromStage ? data.continueFromStage : null;
    }

    create() {
        const w = GAME_WIDTH, h = GAME_HEIGHT;

        // State
        if (this.continueFromStage) {
            GameState.stage = this.continueFromStage;
            GameState.lives = 3;
        }
        this.score = GameState.score;
        this.stage = GameState.stage;
        this.lives = GameState.lives;
        this.comboStreak = GameState.comboStreak;
        this.stageConfig = getStageConfig(this.stage);
        this.tapsDone = 0;
        this.snoreMeter = 0;
        this.doubleMeterActive = shouldDoubleMeter(this.stageConfig);
        this.doublePhase = false;
        this.lastNoseTap = 0;
        this.lastOrganIndex = -1;
        this.gameOver = false;
        this.snoring = false;
        this.stageTransitioning = false;
        this.paused = false;
        this.activePrompts = [];
        this.promptTimer = 0;
        this.spikeMultiplier = 1.0;
        this.spikeTimer = 0;

        // Background
        this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A);

        // Patient body
        this.patient = this.add.image(w / 2, 340, 'patient').setOrigin(0.5);

        // Nose tap zone
        this.noseZone = this.add.image(80, 292, 'nose_highlight').setScale(0.9)
            .setInteractive(new Phaser.Geom.Circle(40, 40, 40), Phaser.Geom.Circle.Contains)
            .setAlpha(0.7);
        this.noseZone.on('pointerdown', () => this.onNoseTap());
        this.tweens.add({
            targets: this.noseZone, alpha: 0.5, scaleX: 0.85, scaleY: 0.85,
            duration: 800, yoyo: true, repeat: -1
        });

        // HUD
        this.scoreText = this.add.text(16, 12, 'Score: ' + this.score, {
            fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: COLORS.HUD_TEXT
        });
        this.stageText = this.add.text(w / 2, 12, 'Stage ' + this.stage, {
            fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: COLORS.HUD_TEXT
        }).setOrigin(0.5, 0);

        // Hearts
        this.heartIcons = [];
        for (let i = 0; i < 3; i++) {
            const key = i < this.lives ? 'heart_full' : 'heart_empty';
            this.heartIcons.push(this.add.image(w - 80 + i * 28, 24, key));
        }

        // Snore meter
        this.meterBg = this.add.rectangle(w / 2, 70, w - 32, 28, 0x2B2D42).setOrigin(0.5);
        this.meterFill = this.add.rectangle(16, 57, 0, 24, 0xFFD60A).setOrigin(0, 0);
        this.add.text(20, 66, 'SNORE', {
            fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold', color: '#0D1B2A'
        }).setDepth(2);
        this.add.text(w - 50, 62, 'zzz', {
            fontSize: '11px', fontFamily: 'monospace', color: '#8D99AE'
        }).setDepth(2);
        this.meterGlow = this.add.rectangle(w / 2, 70, w - 28, 32, 0xFF4136, 0)
            .setStrokeStyle(3, 0xFF4136, 0);

        // Combo text
        this.comboText = this.add.text(w / 2, 110, '', {
            fontSize: '28px', fontFamily: 'monospace', fontStyle: 'bold', color: COLORS.COMBO
        }).setOrigin(0.5).setAlpha(0);

        // Pause button
        const pauseBtn = this.add.text(w / 2, 44, '| |', {
            fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', color: '#8D99AE'
        }).setOrigin(0.5).setInteractive();
        pauseBtn.on('pointerdown', () => this.togglePause());

        // Progress
        this.progressText = this.add.text(w / 2, 96, this.tapsDone + '/' + this.stageConfig.tapsToAdvance, {
            fontSize: '12px', fontFamily: 'monospace', color: '#8D99AE'
        }).setOrigin(0.5);

        // Organ pool
        this.organPool = [];
        for (let i = 0; i < 6; i++) {
            const org = this.add.image(0, 0, 'organ_heart').setVisible(false)
                .setInteractive(new Phaser.Geom.Circle(30, 30, 30), Phaser.Geom.Circle.Contains);
            org.on('pointerdown', () => this.onOrganTap(org));
            this.organPool.push(org);
        }

        // Scalpel
        this.scalpel = this.add.image(w / 2, 400, 'scalpel').setVisible(false);

        // Visibility handler
        this.visHandler = () => {
            if (document.hidden && !this.paused && !this.gameOver) this.togglePause();
        };
        document.addEventListener('visibilitychange', this.visHandler);

        this.promptTimer = this.stageConfig.promptInterval * 1000;
        showStageBannerEffect(this, this.stage, this.stageConfig.isRestStage);
    }

    update(time, delta) {
        if (this.gameOver || this.paused || this.snoring) return;
        const dt = delta / 1000;

        // Snore meter
        let fillRate = 1.0 / this.stageConfig.snoreFillTime;
        if (this.stageConfig.speedSpike) {
            this.spikeTimer -= dt;
            if (this.spikeTimer <= 0) {
                this.spikeMultiplier = 0.7 + Math.random() * 0.6;
                this.spikeTimer = 0.5 + Math.random();
            }
            fillRate *= this.spikeMultiplier;
        }
        this.snoreMeter = Math.min(1.0, this.snoreMeter + fillRate * dt);

        // Meter visual
        const maxW = GAME_WIDTH - 32;
        this.meterFill.width = maxW * this.snoreMeter;
        this.meterFill.fillColor = this.snoreMeter > 0.75 ? 0xFF4136 :
            this.snoreMeter > 0.5 ? 0xFFA500 : 0xFFD60A;
        this.meterGlow.strokeAlpha = this.snoreMeter > 0.75 ?
            0.5 + Math.sin(time * 0.01) * 0.5 : 0;

        if (this.snoreMeter >= 1.0) { this.onSnoreMax(); return; }

        // Prompt spawning
        this.promptTimer -= delta;
        if (this.promptTimer <= 0 && this.countActivePrompts() < this.stageConfig.maxSimultaneous) {
            this.spawnOrganPrompt();
            this.promptTimer = this.stageConfig.promptInterval * 1000;
        }
    }

    onNoseTap() {
        if (this.gameOver || this.snoring || this.paused) return;
        const now = Date.now();
        if (now - this.lastNoseTap < NOSE_TAP_DEBOUNCE) return;
        this.lastNoseTap = now;

        if (this.doubleMeterActive && !this.doublePhase && this.snoreMeter >= 0.95) {
            this.snoreMeter = 0.5;
            this.doublePhase = true;
        } else {
            this.snoreMeter = 0;
            this.doublePhase = false;
        }

        showNoseTapEffects(this);
        playGameSound(this, 'honk');
    }

    onOrganTap(organ) {
        if (this.gameOver || this.snoring || this.paused) return;
        if (!organ.visible || !organ.getData('active')) return;

        const isFake = organ.getData('fake');
        const x = organ.x, y = organ.y;

        organ.setData('active', false).setVisible(false);
        if (organ.blinkTween) organ.blinkTween.stop();
        if (organ.expireTimer) organ.expireTimer.remove();
        const idx = this.activePrompts.indexOf(organ);
        if (idx > -1) this.activePrompts.splice(idx, 1);

        if (isFake) {
            playGameSound(this, 'sad');
            spawnParticles(this, x, y, 'particle', 8);
            return;
        }

        this.comboStreak++;
        const mult = getComboMultiplier(this.comboStreak);
        const dangerBonus = this.snoreMeter > 0.9 ? SCORE_VALUES.DANGER_BONUS : 0;
        const points = Math.floor((SCORE_VALUES.ORGAN_HIT + dangerBonus) * mult);
        this.score += points;
        GameState.score = Math.min(this.score, MAX_SCORE_DISPLAY);
        this.scoreText.setText('Score: ' + GameState.score);

        showOrganTapEffects(this, x, y, points, dangerBonus, this.comboStreak, mult);
        this.tweens.add({ targets: organ, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 200 });
        playGameSound(this, 'squelch');

        this.tapsDone++;
        this.progressText.setText(this.tapsDone + '/' + this.stageConfig.tapsToAdvance);
        if (this.tapsDone >= this.stageConfig.tapsToAdvance && !this.stageTransitioning) {
            this.advanceStage();
        }
    }

    onSnoreMax() {
        if (this.snoring || this.gameOver) return;
        this.snoring = true;
        this.lives--;
        GameState.lives = this.lives;
        this.comboStreak = 0;
        GameState.comboStreak = 0;
        this.updateHearts();
        showSnoreEffects(this);
        playGameSound(this, 'snore');

        this.time.delayedCall(SNORE_EFFECT_DELAY, () => {
            if (this.lives <= 0) { this.triggerGameOver(); }
            else { this.snoreMeter = 0; this.snoring = false; }
        });
    }

    advanceStage() {
        this.stageTransitioning = true;
        this.score += SCORE_VALUES.STAGE_CLEAR;
        GameState.score = Math.min(this.score, MAX_SCORE_DISPLAY);
        this.scoreText.setText('Score: ' + GameState.score);
        this.clearAllPrompts();
        showStageFlash(this);
        playGameSound(this, 'stageClear');

        this.stage++;
        GameState.stage = this.stage;
        this.stageConfig = getStageConfig(this.stage);
        this.tapsDone = 0;
        this.doubleMeterActive = shouldDoubleMeter(this.stageConfig);
        this.doublePhase = false;
        this.stageText.setText('Stage ' + this.stage);
        this.progressText.setText('0/' + this.stageConfig.tapsToAdvance);
        showStageBannerEffect(this, this.stage, this.stageConfig.isRestStage);
        this.time.delayedCall(500, () => { this.stageTransitioning = false; });
    }

    triggerGameOver() {
        this.gameOver = true;
        this.clearAllPrompts();
        this.cameras.main.fadeEffect.start(false, 500, 0, 0, 0, 0.3);
        playGameSound(this, 'gameOver');
        this.time.delayedCall(800, () => {
            this.scene.stop('GameScene');
            this.scene.start('GameOverScene');
        });
    }

    spawnOrganPrompt() {
        const freeOrgan = this.organPool.find(o => !o.getData('active'));
        if (!freeOrgan) return;
        const { index, pos } = getOrganPosition(this.lastOrganIndex);
        this.lastOrganIndex = index;
        const isFake = shouldSpawnFake(this.stageConfig);
        const key = isFake ? 'organ_fake' : this.getOrganKey(pos.name);

        freeOrgan.setTexture(key).setPosition(pos.x, pos.y)
            .setVisible(true).setAlpha(1).setScale(1)
            .setData('active', true).setData('fake', isFake);
        this.activePrompts.push(freeOrgan);

        freeOrgan.blinkTween = this.tweens.add({
            targets: freeOrgan, alpha: 0.4, duration: 300, yoyo: true, repeat: -1
        });
        freeOrgan.expireTimer = this.time.delayedCall(this.stageConfig.promptWindow * 1000, () => {
            if (freeOrgan.getData('active')) {
                freeOrgan.setData('active', false).setVisible(false);
                if (freeOrgan.blinkTween) freeOrgan.blinkTween.stop();
                const i = this.activePrompts.indexOf(freeOrgan);
                if (i > -1) this.activePrompts.splice(i, 1);
            }
        });
    }

    getOrganKey(name) {
        if (name === 'heart') return 'organ_heart';
        if (name === 'stomach') return 'organ_stomach';
        return 'organ_lung';
    }

    countActivePrompts() { return this.activePrompts.length; }

    clearAllPrompts() {
        for (const org of this.organPool) {
            if (org.getData('active')) {
                org.setData('active', false).setVisible(false);
                if (org.blinkTween) org.blinkTween.stop();
                if (org.expireTimer) org.expireTimer.remove();
            }
        }
        this.activePrompts = [];
    }

    updateHearts() {
        for (let i = 0; i < 3; i++) {
            this.heartIcons[i].setTexture(i < this.lives ? 'heart_full' : 'heart_empty');
            if (i === this.lives) {
                this.tweens.add({ targets: this.heartIcons[i], scaleX: 1.5, scaleY: 1.5, duration: 100, yoyo: true });
            }
        }
    }

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) showPauseOverlay(this);
        else hidePauseOverlay(this);
    }

    shutdown() {
        this.tweens.killAll();
        this.time.removeAllEvents();
        document.removeEventListener('visibilitychange', this.visHandler);
    }
}
