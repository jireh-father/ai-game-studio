// game.js - GameScene: drift physics, launch mechanics, collision

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.cameras.main.setBackgroundColor(PALETTE.BG);
        this.isDrifting = false;
        this.driftStartTime = 0;
        this.passengerFlying = false;
        this.crashed = false;
        this.transitioning = false;
        this.paused = false;
        this.smokeTimer = 0;
        this.speedLineTimer = 0;
        this.driftProgress = 0;
        this.taxiReady = false;

        this.stageData = generateStage(GameState.stage);
        this.setupRoad();
        this.setupTaxi();
        this.setupTarget();
        setupHUD(this);
        this.setupInput();
        this.resetInactivityTimer();

        if (GameState.stage === 1) this.showHoldPrompt();
        const bpm = Math.min(160, 100 + Math.floor((GameState.stage - 1) / 5) * 3);
        audioSynth.startMusic(bpm);
    }

    setupRoad() {
        const g = this.add.graphics().setDepth(1);
        const sd = this.stageData;
        const cx = GAME_WIDTH / 2;
        const roadW = 54;

        g.fillStyle(PALETTE.ROAD_HEX, 1);
        g.fillRect(cx - roadW / 2, GAME_HEIGHT / 2 + 40, roadW, GAME_HEIGHT / 2);

        const curveCX = cx + sd.curveDirection * sd.curveRadius;
        const curveCY = GAME_HEIGHT / 2 + 40;
        const startAng = sd.curveDirection > 0 ? 180 : 0;
        const sweepAng = -sd.curveDirection * sd.curveAngle;
        const steps = 30;

        for (let i = 0; i < steps; i++) {
            const a1 = Phaser.Math.DegToRad(startAng + (sweepAng * i / steps));
            const a2 = Phaser.Math.DegToRad(startAng + (sweepAng * (i + 1) / steps));
            const r = sd.curveRadius;
            g.fillStyle(PALETTE.ROAD_HEX, 1);
            g.fillTriangle(
                curveCX + (r - roadW / 2) * Math.cos(a1), curveCY + (r - roadW / 2) * Math.sin(a1),
                curveCX + (r + roadW / 2) * Math.cos(a1), curveCY + (r + roadW / 2) * Math.sin(a1),
                curveCX + (r + roadW / 2) * Math.cos(a2), curveCY + (r + roadW / 2) * Math.sin(a2)
            );
            g.fillTriangle(
                curveCX + (r - roadW / 2) * Math.cos(a1), curveCY + (r - roadW / 2) * Math.sin(a1),
                curveCX + (r + roadW / 2) * Math.cos(a2), curveCY + (r + roadW / 2) * Math.sin(a2),
                curveCX + (r - roadW / 2) * Math.cos(a2), curveCY + (r - roadW / 2) * Math.sin(a2)
            );
            if (i % 4 === 0) {
                g.lineStyle(1, 0xE8E8E8, 0.5);
                g.lineBetween(
                    curveCX + r * Math.cos(a1), curveCY + r * Math.sin(a1),
                    curveCX + r * Math.cos(a2), curveCY + r * Math.sin(a2)
                );
            }
        }

        // Decorative buildings
        const bldgPos = [[40,100],[280,80],[60,500],[290,480],[30,280],[310,300],[150,60],[200,550]];
        bldgPos.forEach(([x, y]) => {
            this.add.image(x, y, 'building').setDepth(2).setAlpha(0.6)
                .setScale(Phaser.Math.FloatBetween(0.6, 1.0));
        });

        this.curveCX = curveCX;
        this.curveCY = curveCY;
        this.curveStartAngle = startAng;
        this.curveSweep = sweepAng;
    }

    setupTaxi() {
        const cx = GAME_WIDTH / 2;
        this.taxiStartY = GAME_HEIGHT - 100;
        this.taxi = this.add.image(cx, this.taxiStartY, 'taxi').setDepth(10).setScale(1.5);
        this.taxi.setAngle(-90);
        this.passenger = this.add.image(cx, this.taxiStartY - 5, 'passenger').setDepth(11).setScale(1.5);
        this.powerArc = this.add.graphics().setDepth(9);

        this.taxi.y = GAME_HEIGHT + 40;
        this.passenger.y = GAME_HEIGHT + 35;
        this.tweens.add({
            targets: [this.taxi, this.passenger], y: this.taxiStartY,
            duration: 500, ease: 'Power2',
            onComplete: () => { this.taxiReady = true; }
        });
    }

    setupTarget() {
        const sd = this.stageData;
        const exitAngle = Phaser.Math.DegToRad(this.curveStartAngle + this.curveSweep);
        const exitX = this.curveCX + sd.curveRadius * Math.cos(exitAngle);
        const exitY = this.curveCY + sd.curveRadius * Math.sin(exitAngle);
        const perpAngle = exitAngle + (sd.curveDirection > 0 ? -Math.PI / 2 : Math.PI / 2);
        const dist = Math.min(sd.targetDistance, 200);

        this.targetX = Phaser.Math.Clamp(exitX + Math.cos(perpAngle) * dist, 50, GAME_WIDTH - 50);
        this.targetY = Phaser.Math.Clamp(exitY + Math.sin(perpAngle) * dist, 80, GAME_HEIGHT / 2 - 20);
        this.target = this.add.image(this.targetX, this.targetY, 'target').setDepth(4);
        this.target.setScale(Math.max(0.5, sd.targetRadius / 40));

        this.tweens.add({ targets: this.target, alpha: 0.7, duration: 500, yoyo: true, repeat: -1 });
        if (sd.isMovingTarget) {
            this.tweens.add({ targets: this.target, x: this.targetX + 40, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        if (sd.isBoss) this.target.setTint(0xFFD700);
    }

    setupInput() {
        this.input.on('pointerdown', () => {
            if (this.paused || this.crashed || this.passengerFlying || !this.taxiReady || this.transitioning) return;
            this.startDrift();
        });
        this.input.on('pointerup', () => {
            if (this.paused || this.crashed || !this.isDrifting || this.transitioning) return;
            this.releaseDrift();
        });
    }

    startDrift() {
        this.isDrifting = true;
        this.driftStartTime = this.time.now;
        this.clearInactivityTimer();
        audioSynth.playDriftStart();
    }

    releaseDrift() {
        this.isDrifting = false;
        audioSynth.stopDrift();
        this.powerArc.clear();
        const holdTime = this.time.now - this.driftStartTime;
        this.driftProgress = Math.min(holdTime / this.stageData.maxDriftTime, 1.2);
        const perfectDrift = this.driftProgress >= 0.85 && this.driftProgress <= 1.05;
        audioSynth.playLaunch();
        this.launchPassenger(this.driftProgress, perfectDrift);
    }

    launchPassenger(power, perfectDrift) {
        this.passengerFlying = true;
        const tgtX = this.target.x + (this.stageData.windDrift || 0);
        const tgtY = this.target.y;
        const accuracy = 1 - Math.abs(power - 0.9) * 1.5;
        const landX = Phaser.Math.Linear(this.taxi.x, tgtX, Phaser.Math.Clamp(accuracy + 0.3, 0, 1.2));
        const landY = Phaser.Math.Linear(this.taxi.y, tgtY, Phaser.Math.Clamp(accuracy + 0.3, 0, 1.2));
        const arcPositions = [];

        this.tweens.add({
            targets: this.passenger, x: landX, y: landY, duration: 500, ease: 'Sine.easeOut',
            onUpdate: () => {
                arcPositions.push({ x: this.passenger.x, y: this.passenger.y });
                if (arcPositions.length % 5 === 0) spawnArcTrail(this, arcPositions.slice(-8));
            },
            onComplete: () => this.resolvePassengerLanding(landX, landY, perfectDrift)
        });
        this.tweens.add({ targets: this.passenger, scale: 2.2, duration: 250, yoyo: true });
    }

    resolvePassengerLanding(lx, ly, perfectDrift) {
        const dist = Phaser.Math.Distance.Between(lx, ly, this.target.x, this.target.y);
        const tgtR = this.stageData.targetRadius;
        const mult = this.stageData.isBoss ? 3 : GameState.getComboMult();
        let quality, points;

        if (dist < tgtR * 0.35) {
            quality = 'bullseye'; points = Math.round(SCORE_VALUES.BULLSEYE * mult); GameState.combo++;
        } else if (dist < tgtR * 0.7) {
            quality = 'good'; points = Math.round(SCORE_VALUES.GOOD * mult); GameState.combo++;
        } else if (dist < tgtR * 1.2) {
            quality = 'ok'; points = Math.round(SCORE_VALUES.OK * mult); GameState.combo = 0;
        } else if (dist < tgtR * 2.0) {
            quality = 'near_miss'; points = SCORE_VALUES.NEAR_MISS; GameState.combo = 0;
        } else {
            quality = 'miss'; points = 0; GameState.combo = 0;
        }
        if (perfectDrift && quality !== 'miss') points += SCORE_VALUES.PERFECT_DRIFT;
        GameState.score += points;

        applyLandingJuice(this, lx, ly, quality, points);
        audioSynth.playLanding(quality);

        if (quality === 'miss') { GameState.lives--; updateLives(this); }
        if (points > 0) updateScoreDisplay(this);
        if (GameState.combo > 0 && GameState.combo % 5 === 0) audioSynth.playComboMilestone(GameState.combo / 5);
        updateComboDisplay(this);

        if (GameState.lives <= 0) {
            this.crashed = true;
            setTimeout(() => this.scene.start('GameOverScene'), 800);
            return;
        }
        this.passengerFlying = false;
        this.advanceStage();
    }

    advanceStage() {
        this.transitioning = true;
        GameState.stage++;
        GameState.score += SCORE_VALUES.STAGE_CLEAR + 50 * GameState.combo;
        updateScoreDisplay(this);
        audioSynth.playStageClear();
        spawnStageClearParticles(this);
        audioSynth.stopMusic();
        setTimeout(() => this.scene.restart(), 600);
    }

    handleCrash(reason) {
        if (this.crashed) return;
        this.crashed = true;
        this.isDrifting = false;
        this.clearInactivityTimer();
        audioSynth.stopDrift();
        audioSynth.playCrash();
        this.powerArc.clear();
        spawnCrashExplosion(this, this.taxi.x, this.taxi.y);
        shakeCamera(this, 10, 300);
        this.tweens.add({ targets: this.taxi, angle: this.taxi.angle + 360, scale: 0.6, alpha: 0.4, duration: 400 });
        if (reason === 'inactivity') GameState.lives = 0;
        else GameState.lives--;
        updateLives(this);
        setTimeout(() => {
            if (GameState.lives <= 0) this.scene.start('GameOverScene');
            else this.scene.restart();
        }, 700);
    }

    showHoldPrompt() {
        const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 160, 'HOLD TO DRIFT!', {
            fontSize: '22px', fontFamily: 'Arial Black', color: '#00E5FF',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(30);
        this.tweens.add({ targets: txt, alpha: 0, duration: 500, delay: 2500, onComplete: () => txt.destroy() });
    }

    resetInactivityTimer() {
        this.clearInactivityTimer();
        this.inactivityTimer = this.time.delayedCall(INACTIVITY_DEATH_MS, () => this.handleCrash('inactivity'));
    }

    clearInactivityTimer() {
        if (this.inactivityTimer) { this.inactivityTimer.remove(); this.inactivityTimer = null; }
    }

    togglePause() {
        if (this.paused) {
            this.paused = false;
            if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
            this.resetInactivityTimer();
        } else {
            this.paused = true;
            this.clearInactivityTimer();
            showPauseOverlay(this);
        }
    }

    update(time, delta) {
        if (this.paused || this.crashed || this.transitioning) return;
        if (this.isDrifting && this.taxiReady) {
            const holdTime = time - this.driftStartTime;
            const progress = holdTime / this.stageData.maxDriftTime;
            this.driftProgress = progress;
            const sd = this.stageData;
            const clampedP = Math.min(progress, 1.2);
            const angle = Phaser.Math.DegToRad(this.curveStartAngle + this.curveSweep * clampedP);
            this.taxi.x = Phaser.Math.Clamp(this.curveCX + sd.curveRadius * Math.cos(angle), 20, GAME_WIDTH - 20);
            this.taxi.y = Phaser.Math.Clamp(this.curveCY + sd.curveRadius * Math.sin(angle), 60, GAME_HEIGHT - 60);
            this.taxi.setAngle(-90 + (this.curveSweep * clampedP));
            this.passenger.x = this.taxi.x;
            this.passenger.y = this.taxi.y - 5;
            drawPowerArc(this, clampedP);
            this.smokeTimer += delta;
            if (this.smokeTimer > 80) { spawnDriftSmoke(this, this.taxi.x, this.taxi.y + 10, GameState.combo); this.smokeTimer = 0; }
            this.cameras.main.shake(50, 0.001);
            audioSynth.updateDriftPitch(clampedP);
            if (progress > 1.0 + OVERDRIFT_MARGIN) this.handleCrash('overdrift');
            if (progress > 0.9 && progress < 1.0 + OVERDRIFT_MARGIN) {
                this.taxi.setTint(Math.floor(time / 100) % 2 === 0 ? 0xFF1744 : 0xFFD600);
            } else { this.taxi.clearTint(); }
        }
        if (GameState.combo >= 5 && this.taxiReady && !this.passengerFlying) spawnComboFire(this, this.taxi.x, this.taxi.y);
        if (this.stageData.speed > BASE_SPEED * 1.5) {
            this.speedLineTimer += delta;
            if (this.speedLineTimer > 200) { spawnSpeedLines(this, Math.floor(this.stageData.speed / 60)); this.speedLineTimer = 0; }
        }
    }
}
