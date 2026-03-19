// Permission Denied - Core Game Scene

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    init(data) {
        this.continuing = data && data.continuing;
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.DESKTOP_TEAL);
        if (!this.continuing) GameState.reset();
        this.challengeContainer = null;
        this.timerTotal = 0;
        this.timerRemaining = 0;
        this.gameOver = false;
        this.stageTransitioning = false;
        this.previousType = null;
        this.challengeStartTime = 0;
        this.lastInputTime = Date.now();
        this.paused = false;

        this.input.on('pointerdown', () => { this.lastInputTime = Date.now(); });

        this.visHandler = () => {
            if (document.hidden && !this.gameOver) {
                this.scene.pause('GameScene');
                this.paused = true;
            }
        };
        document.addEventListener('visibilitychange', this.visHandler);

        this.nextChallenge();
    }

    update(time, delta) {
        if (this.gameOver || this.stageTransitioning || this.paused) return;

        if (Date.now() - this.lastInputTime > 25000 && !this.gameOver) {
            this.triggerDeath();
            return;
        }

        if (this.timerRemaining > 0) {
            this.timerRemaining -= delta;
            const fraction = Math.max(0, this.timerRemaining / this.timerTotal);
            const hud = this.scene.get('HUDScene');
            if (hud && hud.updateTimer) hud.updateTimer(fraction);

            if (this.timerRemaining <= 0 && !this.gameOver) {
                this.triggerDeath();
            }
        }
    }

    nextChallenge() {
        if (this.gameOver) return;
        this.stageTransitioning = false;

        if (this.challengeContainer) { this.challengeContainer.destroy(); this.challengeContainer = null; }
        this.tweens.killAll();

        GameState.challengeNum++;
        const config = selectNextChallenge(GameState.challengeNum, this.previousType);
        this.previousType = config.type;
        this.currentConfig = config;

        const hud = this.scene.get('HUDScene');
        if (hud && hud.updateHUD) hud.updateHUD(GameState.score, GameState.challengeNum, GameState.streakMultiplier);

        // Real game segment every 5 challenges (after completing a set)
        if (GameState.challengeNum > 1 && (GameState.challengeNum - 1) % DIFFICULTY.CHALLENGES_PER_SET === 0) {
            this.startRealGameSegment();
            return;
        }

        this.renderChallenge(config);
    }

    renderChallenge(config) {
        this.challengeContainer = this.add.container(0, 0);
        this.timerTotal = config.timer_ms;
        this.timerRemaining = config.timer_ms;
        this.challengeStartTime = Date.now();

        switch (config.type) {
            case 'MOVING_BUTTON': this.renderMovingButton(config.params); break;
            case 'POPUP_CHAIN': this.renderPopupChain(config.params); break;
            case 'HOLD_CONFIRM': this.renderHoldConfirm(config.params); break;
            case 'TOS_SCROLL': this.renderTosScroll(config.params); break;
            case 'CAPTCHA': this.renderCaptcha(config.params); break;
            case 'LOADING_BAR': this.renderLoadingBar(config.params); break;
            case 'SLIDER': this.renderSlider(config.params); break;
        }
    }

    // Challenge renderers are in challenges.js (attached to prototype)

    onChallengeComplete(fx, fy) {
        if (this.gameOver || this.stageTransitioning) return;
        this.stageTransitioning = true;

        const elapsed = Date.now() - this.challengeStartTime;
        let points = SCORE_VALUES.COMPLETE;
        if (elapsed < 2000) points += SCORE_VALUES.SPEED_2S;
        else if (elapsed < 4000) points += SCORE_VALUES.SPEED_4S;

        GameState.streakMultiplier = Math.min(
            GameState.streakMultiplier + SCORE_VALUES.STREAK_INCREMENT,
            SCORE_VALUES.MAX_STREAK
        );
        points = Math.floor(points * GameState.streakMultiplier);
        GameState.score += points;

        if (GameState.challengeNum % DIFFICULTY.CHALLENGES_PER_SET === 0) {
            GameState.score += SCORE_VALUES.SET_BONUS;
        }

        this.spawnParticles(fx, fy, true);
        this.playChime();
        this.showFloatingScore(fx, fy, points);

        const hud = this.scene.get('HUDScene');
        if (hud && hud.punchScore) hud.punchScore();
        if (hud && hud.updateHUD) hud.updateHUD(GameState.score, GameState.challengeNum, GameState.streakMultiplier);

        const flash = this.add.rectangle(180, 320, 360, 640, 0xFFFFFF, 0.6).setDepth(100);
        this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });

        // Hit-stop via setTimeout (not delayedCall)
        this.time.timeScale = 0;
        setTimeout(() => {
            if (this.time) this.time.timeScale = 1;
            this.time.delayedCall(200, () => this.nextChallenge());
        }, 60);
    }

    triggerDeath() {
        if (this.gameOver) return;
        this.gameOver = true;

        this.playTone(440, 'sawtooth', 300);
        setTimeout(() => this.playTone(220, 'sawtooth', 400), 300);

        this.cameras.main.shake(500, 0.015);

        const redFlash = this.add.rectangle(180, 320, 360, 640, 0xDD2222, 0.5).setDepth(100);
        this.tweens.add({ targets: redFlash, alpha: 0, duration: 300 });

        this.time.delayedCall(300, () => {
            const timeout = this.add.container(180, -100).setDepth(110);
            const bsod = this.add.rectangle(0, 0, 300, 120, COLORS.BSOD_BLUE).setStrokeStyle(2, 0xFFFFFF);
            const txt = this.add.text(0, -20, 'SESSION TIMEOUT', {
                fontSize: '20px', fontFamily: 'Courier New, monospace', color: '#FFF', fontStyle: 'bold'
            }).setOrigin(0.5);
            const sub = this.add.text(0, 15, 'Your session has expired.', {
                fontSize: '11px', fontFamily: 'Courier New, monospace', color: '#FFF'
            }).setOrigin(0.5);
            timeout.add([bsod, txt, sub]);

            this.tweens.add({
                targets: timeout, y: 300, duration: 400, ease: 'Cubic.easeOut',
                onComplete: () => {
                    this.time.delayedCall(600, () => {
                        this.scene.stop('HUDScene');
                        this.scene.stop('GameScene');
                        this.scene.start('GameOverScene');
                    });
                }
            });
        });
    }

    startRealGameSegment() {
        this.stageTransitioning = true;
        if (this.challengeContainer) { this.challengeContainer.destroy(); this.challengeContainer = null; }

        const white = this.add.rectangle(180, 320, 360, 640, 0xFFFFFF, 0).setDepth(100);
        this.tweens.add({
            targets: white, alpha: 1, duration: 200,
            onComplete: () => {
                this.cameras.main.setBackgroundColor(COLORS.REAL_GAME_BG);
                this.playTone(1047, 'sine', 300);

                const cursor = this.add.image(180, 500, 'cursor').setDepth(101);
                const label = this.add.text(180, 100, 'REAL GAMEPLAY\nENJOY IT WHILE IT LASTS', {
                    fontSize: '14px', fontFamily: 'Courier New, monospace', color: '#333', align: 'center', lineSpacing: 6
                }).setOrigin(0.5).setDepth(101);
                const scoreBonus = this.add.text(180, 140, '+250 BONUS', {
                    fontSize: '16px', fontFamily: 'Courier New, monospace', color: COLORS.ACCEPT_GREEN_HEX, fontStyle: 'bold'
                }).setOrigin(0.5).setDepth(101);

                GameState.score += SCORE_VALUES.REAL_GAME_BONUS;
                const hud = this.scene.get('HUDScene');
                if (hud && hud.updateHUD) hud.updateHUD(GameState.score, GameState.challengeNum, GameState.streakMultiplier);

                this.input.on('pointermove', (ptr) => {
                    if (cursor && cursor.active) cursor.setPosition(ptr.x, ptr.y);
                });

                const blockTimer = this.time.addEvent({
                    delay: 400, repeat: 10, callback: () => {
                        const bx = 40 + Math.random() * 280;
                        const block = this.add.rectangle(bx, -20, 30, 30, COLORS.ACCEPT_GREEN, 0.4).setDepth(101);
                        this.tweens.add({ targets: block, y: 660, duration: 2000, onComplete: () => block.destroy() });
                    }
                });

                this.tweens.add({ targets: white, alpha: 0, duration: 300, delay: 100 });

                this.time.delayedCall(5000, () => {
                    this.cameras.main.setBackgroundColor(COLORS.DESKTOP_TEAL);
                    if (cursor && cursor.active) cursor.destroy();
                    if (label && label.active) label.destroy();
                    if (scoreBonus && scoreBonus.active) scoreBonus.destroy();
                    blockTimer.remove();
                    this.stageTransitioning = false;
                    this.nextChallenge();
                });
            }
        });
    }

    // === JUICE HELPERS ===
    spawnParticles(x, y, success) {
        const count = success ? this.getParticleCount() : 8;
        const color = success ? 0x4CAF50 : 0xDD2222;
        for (let i = 0; i < count; i++) {
            const p = this.add.circle(x, y, 3 + Math.random() * 3, color).setDepth(50);
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 150;
            this.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * speed * 0.5,
                y: y + Math.sin(angle) * speed * 0.5 + 40,
                alpha: 0, scale: 0, duration: 400,
                onComplete: () => p.destroy()
            });
        }
    }

    getParticleCount() {
        if (GameState.streakMultiplier >= 2.5) return 30;
        if (GameState.streakMultiplier >= 2.0) return 24;
        if (GameState.streakMultiplier >= 1.5) return 18;
        return 12;
    }

    showFloatingScore(x, y, points) {
        const txt = this.add.text(x, y, '+' + points, {
            fontSize: '18px', fontFamily: 'Courier New, monospace', color: '#FFFFFF', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(60);
        this.tweens.add({
            targets: txt, y: y - 70, x: x + 10, alpha: 0, duration: 700,
            ease: 'Cubic.easeOut', onComplete: () => txt.destroy()
        });
    }

    playTone(freq, type, duration) {
        try {
            const ctx = this.sound.context;
            if (ctx.state === 'suspended') ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type || 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration / 1000);
        } catch (e) { /* audio not available */ }
    }

    playChime() {
        const notes = [523, 659, 784];
        notes.forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 100), i * 100));
    }

    shutdown() {
        this.tweens.killAll();
        this.time.removeAllEvents();
        document.removeEventListener('visibilitychange', this.visHandler);
    }
}
