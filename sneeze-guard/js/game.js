// Sneeze Guard - Core Game Scene
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        const W = CONFIG.GAME_WIDTH;
        const H = CONFIG.GAME_HEIGHT;

        this.add.rectangle(W / 2, H / 2, W, H, 0xF5F0E8);
        this.add.rectangle(W / 2, 180, W - 40, 50, 0xC8B89A).setStrokeStyle(2, 0x8A7A6A);

        // Food trays
        this.trays = [];
        for (let i = 0; i < 4; i++) {
            const tray = this.add.image(70 + i * 100, 175, i % 2 === 0 ? 'tray' : 'tray_red');
            this.trays.push(tray);
        }

        // Guard
        this.guardLineY = 230;
        this.add.rectangle(W / 2, this.guardLineY, W - 30, 2, 0x4A90D9, 0.3);
        this.guard = this.add.image(W / 2, this.guardLineY + 80, 'guard');
        this.guard.setAlpha(0).setDepth(10);
        this.guardUp = false;

        // Patrons
        this.patronStartY = H + 40;
        this.patronTargetY = 400;
        this.patron = this.add.image(W / 2, this.patronStartY, 'patron_neutral').setScale(1.8).setDepth(5);
        this.patron2 = this.add.image(W / 2 - 80, this.patronStartY, 'patron_neutral').setScale(1.5).setDepth(5).setVisible(false);

        // State
        this.paused = false;
        this.gameOver = false;
        this.gameOverShown = false;
        this.eventTransitioning = false;
        this.stageTransitioning = false;
        this.currentEventIndex = 0;
        this.stageData = null;
        this.tapWindowOpen = false;
        this.tapWindowStart = 0;
        this.lastTapTime = 0;
        this.lastInputTime = Date.now();
        this.fakeoutActive = false;
        this.sneezeFired = false;
        this.splatCount = 0;

        // Visibility handler
        this._visHandler = () => {
            if (document.hidden && !this.paused && !this.gameOver) this.togglePause();
        };
        document.addEventListener('visibilitychange', this._visHandler);

        // Touch input
        this.input.on('pointerdown', () => {
            if (this.paused || this.gameOver) return;
            this.lastInputTime = Date.now();
            this.onTap();
        });
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

        // Tap hint
        if (GameState.stage <= 2) {
            this.add.text(W / 2, H - 40, 'TAP ANYWHERE TO RAISE GUARD', {
                fontSize: '14px', fontFamily: 'Arial', color: '#999'
            }).setOrigin(0.5).setDepth(1);
        }

        // Red vignette
        this.vignette = this.add.rectangle(W / 2, H / 2, W, H, 0xFF0000, 0).setDepth(40).setStrokeStyle(30, 0xFF0000, 0);

        // Launch HUD then load stage
        this.scene.launch('HUDScene');
        this.loadStage(GameState.stage);

        if (GameState.stage === 8) this.showTutorial('FAKE-OUTS!\nSome patrons fake a sneeze.\nDon\'t tap if no head tilt!');
        else if (GameState.stage === 12) this.showTutorial('MULTI-SNEEZE!\nTwo patrons may sneeze at once!');
    }

    update() {
        if (this.paused || this.gameOver) return;
        if (Date.now() - this.lastInputTime > CONFIG.INACTIVITY_TIMEOUT) {
            this.triggerDeath('Inactivity');
            return;
        }
        if (GameState.hygiene <= 2 && this.vignette) {
            this.vignette.setFillStyle(0xFF0000, 0);
            this.vignette.setStrokeStyle(30, 0xFF0000, 0.2 + Math.sin(this.time.now / 300) * 0.1);
        } else if (this.vignette) {
            this.vignette.setStrokeStyle(30, 0xFF0000, 0);
        }
    }

    loadStage(stageNum) {
        this.stageData = StageManager.generateStage(stageNum);
        this.currentEventIndex = 0;
        this.stageTransitioning = false;
        this.events.emit('updateHUD');
        this.startNextEvent();
    }

    startNextEvent() {
        if (this.gameOver || this.stageTransitioning) return;
        if (this.currentEventIndex >= this.stageData.events.length) { this.completeStage(); return; }

        this.eventTransitioning = false;
        const ev = this.stageData.events[this.currentEventIndex];
        this.tapWindowOpen = false;
        this.sneezeFired = false;
        this.fakeoutActive = false;
        this.guardUp = false;
        this.guard.setAlpha(0);

        this.patron.setPosition(CONFIG.GAME_WIDTH / 2, this.patronStartY);
        this.patron.setTexture('patron_neutral').setVisible(true).setAlpha(1);

        const isMulti = ev.multiCount > 1;
        if (isMulti) {
            this.patron.setX(CONFIG.GAME_WIDTH / 2 + 50);
            this.patron2.setPosition(CONFIG.GAME_WIDTH / 2 - 50, this.patronStartY);
            this.patron2.setTexture('patron_neutral').setVisible(true).setAlpha(1);
        } else {
            this.patron2.setVisible(false);
        }

        this.tweens.add({
            targets: this.patron, y: this.patronTargetY,
            duration: ev.approachSpeed, ease: 'Quad.easeOut',
            onComplete: () => this.startWindup(ev)
        });
        if (isMulti) {
            this.tweens.add({
                targets: this.patron2, y: this.patronTargetY + 20,
                duration: ev.approachSpeed * 1.1, ease: 'Quad.easeOut'
            });
        }
    }

    startWindup(ev) {
        if (this.gameOver) return;
        this.patron.setTexture('patron_windup1');
        const w1Duration = ev.windupDuration * 0.4;
        const w2Duration = ev.windupDuration * 0.6;

        this.time.delayedCall(w1Duration, () => {
            if (this.gameOver) return;
            if (ev.type === 'fake') {
                this.fakeoutActive = true;
                this.time.delayedCall(w2Duration, () => {
                    if (this.gameOver) return;
                    this.resolveFakeout();
                });
            } else {
                this.patron.setTexture('patron_windup2');
                this.tapWindowOpen = true;
                this.tapWindowStart = Date.now();
                this.time.delayedCall(ev.tapWindow, () => {
                    if (this.gameOver) return;
                    if (!this.sneezeFired && this.tapWindowOpen) {
                        this.tapWindowOpen = false;
                        this.handleContamination();
                    }
                });
            }
        });
    }

    handlePerfectBlock() {
        this.eventTransitioning = true;
        const mult = this.getStreakMultiplier();
        const points = CONFIG.SCORE.PERFECT * mult;
        GameState.score += points;
        GameState.streak++;
        this.doHitstop(CONFIG.HITSTOP_MS);
        const px = this.patron.x, py = this.guardLineY;
        this.snotSplatterOnGuard(px, py, 12);
        this.showFloatingText(px, py - 30, '+' + points + ' PERFECT!', CONFIG.COLOR.GOLD, 1.2);
        this.doScreenShake(0.006, 200);
        this.cameraZoomPunch();
        this.vibrate(60);
        if (this.splatCount < 3) {
            this.add.image(px + (Math.random() - 0.5) * 100, py, 'snot_splat').setScale(0.4).setAlpha(0.5).setDepth(11);
            this.splatCount++;
        }
        if (GameState.streak === CONFIG.SCORE.STREAK_DOUBLE || GameState.streak === CONFIG.SCORE.STREAK_TRIPLE) {
            this.showStreakBanner(GameState.streak);
        }
        this.events.emit('updateHUD');
        this.advanceToNextEvent(800);
    }

    handleGoodBlock() {
        this.eventTransitioning = true;
        const mult = this.getStreakMultiplier();
        const points = CONFIG.SCORE.GOOD * mult;
        GameState.score += points;
        GameState.streak++;
        this.snotSplatterOnGuard(this.patron.x, this.guardLineY, 6);
        this.showFloatingText(this.patron.x, this.guardLineY - 30, '+' + points + ' GOOD', '#88CC44', 1.0);
        this.doScreenShake(0.003, 120);
        this.events.emit('updateHUD');
        this.advanceToNextEvent(600);
    }

    handleEarlyBlock() {
        this.eventTransitioning = true;
        GameState.streak = 0;
        GameState.hygiene--;
        this.showExclamation(this.patron.x, this.patron.y);
        this.showFloatingText(CONFIG.GAME_WIDTH / 2, 300, 'BLOCKED!', '#FF3030', 1.0);
        this.doScreenShake(0.004, 200);
        this.patronStompOff(this.patron);
        this.events.emit('heartLoss', GameState.hygiene);
        this.events.emit('updateHUD');
        if (GameState.hygiene <= 0) this.triggerDeath('Early block');
        else this.advanceToNextEvent(800);
    }

    handleContamination() {
        this.eventTransitioning = true;
        GameState.streak = 0;
        GameState.hygiene--;
        this.contaminationBurst(this.patron.x, this.patron.y - 20);
        this.showFloatingText(CONFIG.GAME_WIDTH / 2, 280, 'CONTAMINATED!', CONFIG.COLOR.SNOT_DARK, 1.3);
        this.doScreenShake(0.008, 300);
        this.greenVignetteFlash();
        this.vibrate(80);
        const ti = Math.floor(Math.random() * this.trays.length);
        if (this.trays[ti]) {
            this.trays[ti].setTint(0x7FD43A);
            this.time.delayedCall(1500, () => { if (this.trays[ti] && this.trays[ti].scene) this.trays[ti].clearTint(); });
        }
        this.events.emit('heartLoss', GameState.hygiene);
        this.events.emit('updateHUD');
        if (GameState.hygiene <= 0) this.triggerDeath('Contamination');
        else this.advanceToNextEvent(900);
    }

    resolveFakeout() {
        if (this.gameOver) return;
        this.fakeoutActive = false;
        this.patron.setTexture('patron_neutral');
        const points = CONFIG.SCORE.FAKE_SURVIVED * this.getStreakMultiplier();
        GameState.score += points;
        this.showFloatingText(CONFIG.GAME_WIDTH / 2, 350, '+' + points + ' SURVIVED!', '#88AAFF', 1.0);
        this.events.emit('updateHUD');
        this.advanceToNextEvent(700);
    }

    advanceToNextEvent(delay) {
        this.time.delayedCall(delay, () => {
            if (this.gameOver) return;
            this.currentEventIndex++;
            this.startNextEvent();
        });
    }

    completeStage() {
        if (this.stageTransitioning) return;
        this.stageTransitioning = true;
        const bonus = CONFIG.SCORE.STAGE_CLEAR_BASE * GameState.stage;
        GameState.score += bonus;
        this.showFloatingText(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 50, 'STAGE ' + GameState.stage + ' CLEAR!', CONFIG.COLOR.GOLD, 1.5);
        this.showFloatingText(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2, '+' + bonus + ' BONUS', '#FFFFFF', 1.0);
        this.events.emit('updateHUD');
        this.time.delayedCall(1500, () => {
            if (this.gameOver) return;
            GameState.stage++;
            this.loadStage(GameState.stage);
            if (GameState.stage === 8) this.showTutorial('FAKE-OUTS!\nDon\'t tap if no head tilt!');
            else if (GameState.stage === 12) this.showTutorial('MULTI-SNEEZE!\nTwo may sneeze at once!');
        });
    }

    triggerDeath(reason) {
        if (this.gameOver) return;
        this.gameOver = true;
        this.doScreenShake(0.012, 500);
        this.vibrate(150);
        this.time.delayedCall(800, () => {
            if (this.gameOverShown) return;
            this.gameOverShown = true;
            this.scene.stop('HUDScene');
            this.scene.launch('GameOverScene', { score: GameState.score });
        });
    }

    getStreakMultiplier() {
        if (GameState.streak >= CONFIG.SCORE.STREAK_TRIPLE) return 3;
        if (GameState.streak >= CONFIG.SCORE.STREAK_DOUBLE) return 2;
        return 1;
    }
}

// Mixin effects and input into GameScene
Object.assign(GameScene.prototype, GameEffects);
Object.assign(GameScene.prototype, GameInput);
