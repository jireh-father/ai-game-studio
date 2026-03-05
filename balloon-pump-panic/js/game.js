// Balloon Pump Panic - Core Gameplay

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        const W = GAME_CONFIG.width, H = GAME_CONFIG.height;
        this.W = W; this.H = H;

        // Background
        this.add.rectangle(W/2, H*0.3, W, H*0.6, COLORS.bg);
        this.add.rectangle(W/2, H*0.75, W, H*0.5, COLORS.bgBottom);
        this.add.rectangle(W/2, H*(1-GAME_CONFIG.pumpZoneRatio/2), W, H*GAME_CONFIG.pumpZoneRatio, COLORS.pumpZone).setAlpha(0.5);
        this.add.text(W/2, H*0.88, 'TAP TO PUMP', { fontSize:'16px', fontFamily:'Arial', color:'#90A4AE' }).setOrigin(0.5).setAlpha(0.6);

        this.pump = this.add.image(W/2, H*0.82, 'pump').setScale(1.2);

        // State
        this.score = 0; this.lives = GAME_CONFIG.lives; this.streak = 0;
        this.stageNum = 1; this.stageBalloons = []; this.currentBalloonIdx = 0;
        this.inflation = 0; this.balloonState = 'IDLE';
        this.balloonsPopped = 0; this.lastTapTime = 0;
        this.lastBalloonTap = 0; this.idleTimer = null;

        // Meter
        this.meterBg = this.add.rectangle(W-30, H*0.35, 12, 120, 0x000000, 0.2);
        this.meterFill = this.add.rectangle(W-30, H*0.35+60, 10, 0, COLORS.success).setOrigin(0.5,1);

        // Balloon
        this.balloon = this.add.image(W/2, H*0.38, 'balloon').setInteractive({useHandCursor:true}).setVisible(false);
        this.balloon.on('pointerdown', () => this.onBalloonTap());

        // Launch HUD
        this.scene.launch('HUDScene');
        this.hud = this.scene.get('HUDScene');

        // Pump zone input
        this.add.rectangle(W/2, H*(1-GAME_CONFIG.pumpZoneRatio/2), W, H*GAME_CONFIG.pumpZoneRatio, 0,0).setInteractive().on('pointerdown', () => this.onPumpTap());

        // Visibility
        this.visHandler = () => { if (document.hidden && this.scene.isActive()) this.scene.pause(); };
        document.addEventListener('visibilitychange', this.visHandler);

        AdManager.resetForNewGame();
        this.loadStage();
    }

    loadStage() {
        this.stageBalloons = generateStage(this.stageNum);
        this.currentBalloonIdx = 0;
        this.updateHUD();
        this.spawnBalloon();
    }

    updateHUD() {
        const h = this.scene.get('HUDScene');
        if (!h || !h.scene.isActive()) return;
        h.updateScore(this.score); h.updateStage(this.stageNum); h.updateLives(this.lives);
    }

    spawnBalloon() {
        if (this.currentBalloonIdx >= this.stageBalloons.length) {
            this.balloonState = 'TRANSITIONING';
            Effects.stageTransition(this, this.stageNum);
            this.stageNum++;
            this.time.delayedCall(1000, () => this.loadStage());
            return;
        }
        this.cfg = this.stageBalloons[this.currentBalloonIdx];
        this.inflation = 0; this.balloonState = 'INFLATING';
        const baseScale = this.cfg.isBoss ? 0.8 : 0.6;
        this.balloon.setVisible(true).setScale(baseScale).setAlpha(1).setPosition(this.W/2, this.H*0.38).setRotation(0);
        this.balloon.setTint(this.cfg.isBonus ? COLORS.gold : COLORS.calm);
        this.meterFill.setDisplaySize(10, 0);
        this.tweens.add({ targets:this.balloon, scaleX:baseScale+0.1, scaleY:baseScale+0.1, duration:200, ease:'Back.Out' });
        this.resetIdleTimer();
        this.showZone();
    }

    onPumpTap() {
        if (this.balloonState !== 'INFLATING') return;
        const now = Date.now();
        if (now - this.lastTapTime < GAME_CONFIG.minTapInterval) return;
        this.lastTapTime = now;

        const add = this.cfg.inflatePerTap * (1 - this.inflation / 200);
        this.inflation = Math.min(100, this.inflation + add);

        const bs = this.cfg.isBoss ? 0.8 : 0.6;
        this.balloon.setScale(bs + (this.inflation/100)*0.9);
        this.updateVisuals();

        if (this.inflation > 50) {
            const w = (this.inflation/100)*0.08;
            this.tweens.add({ targets:this.balloon, rotation:w, duration:100, yoyo:true, ease:'Sine.InOut' });
        }

        Effects.scalePunch(this.pump, 0.85, 60);
        Effects.pumpAirPuff(this, this.W/2, this.H*0.72);
        if (navigator.vibrate) navigator.vibrate(10);

        if (this.inflation >= this.cfg.popThreshold || this.inflation >= 100) {
            this.onExplode(); return;
        }
        this.resetIdleTimer();
    }

    onBalloonTap() {
        if (this.balloonState !== 'INFLATING') return;
        const now = Date.now();
        if (now - this.lastBalloonTap < GAME_CONFIG.balloonTapDebounce) return;
        this.lastBalloonTap = now;
        this.balloonState = 'TRANSITIONING';
        this.clearIdleTimer();

        const inf = this.inflation;
        let zone = SCORING.zones[0];
        for (const z of SCORING.zones) { if (inf >= z.min && inf <= z.max) { zone = z; break; } }
        const mult = zone.mult * (this.cfg.scoreMultiplier || 1);
        const pts = Math.round((zone.base + this.streak * SCORING.streakBonus) * mult);
        this.score += pts; this.streak++; this.balloonsPopped++;

        const bx = this.balloon.x, by = this.balloon.y;
        Effects.popEffect(this, bx, by, this.streak);
        Effects.screenShake(this, 0.004 + this.streak*0.001, 120);
        Effects.cameraZoom(this, 1.03, 200);
        const clr = inf >= 95 ? '#FFD600' : inf >= 70 ? '#FF6D00' : '#66BB6A';
        Effects.floatingText(this, bx, by-30, '+'+pts, clr, 28+this.streak*2);
        if (zone.label === 'PERFECT!') Effects.floatingText(this, bx, by-60, 'PERFECT!', '#FFD600', 32);

        this.tweens.add({
            targets:this.balloon, scaleX:this.balloon.scaleX*1.4, scaleY:this.balloon.scaleY*1.4,
            alpha:0, duration:100, onComplete:()=>this.balloon.setVisible(false)
        });

        const h = this.scene.get('HUDScene');
        if (h && h.scene.isActive()) { h.updateScore(this.score); h.updateStreak(this.streak); h.updateZone('',0); }
        this.time.delayedCall(200, () => { this.currentBalloonIdx++; this.spawnBalloon(); });
    }

    onExplode() {
        this.balloonState = 'TRANSITIONING'; this.clearIdleTimer();
        this.lives--; this.streak = 0;
        const bx = this.balloon.x, by = this.balloon.y;
        Effects.explodeEffect(this, bx, by);
        Effects.screenShake(this, 0.012, 300);
        Effects.redFlash(this); Effects.cameraZoom(this, 1.06, 400);
        this.balloon.setVisible(false);
        if (navigator.vibrate) navigator.vibrate(50);
        const h = this.scene.get('HUDScene');
        if (h && h.scene.isActive()) { h.loseLifeAnim(this.lives); h.updateStreak(0); h.updateZone('',0); }
        this.afterLifeLoss(GAME_CONFIG.deathRestartDelay);
    }

    onEscape() {
        if (this.balloonState !== 'INFLATING') return;
        this.balloonState = 'TRANSITIONING'; this.clearIdleTimer();
        this.lives--; this.streak = 0;
        Effects.escapeEffect(this, this.balloon.x, this.balloon.y);
        this.tweens.add({ targets:this.balloon, y:-100, alpha:0, duration:800, ease:'Quad.In', onComplete:()=>this.balloon.setVisible(false) });
        const h = this.scene.get('HUDScene');
        if (h && h.scene.isActive()) { h.loseLifeAnim(this.lives); h.updateStreak(0); }
        this.afterLifeLoss(600);
    }

    afterLifeLoss(delay) {
        if (this.lives <= 0) {
            this.time.delayedCall(delay, () => {
                this.scene.stop('HUDScene');
                this.scene.launch('GameOverScene', { score:this.score, stage:this.stageNum, popped:this.balloonsPopped });
            });
        } else {
            this.time.delayedCall(delay, () => { this.currentBalloonIdx++; this.spawnBalloon(); });
        }
    }

    continueWithLife() {
        this.lives = 1; this.balloonState = 'IDLE';
        this.scene.launch('HUDScene');
        this.time.delayedCall(100, () => { this.updateHUD(); this.spawnBalloon(); });
    }

    updateVisuals() {
        if (!this.cfg.isBonus) {
            const inf = this.inflation;
            this.balloon.setTint(inf>=90?COLORS.critical:inf>=70?COLORS.danger:inf>=50?COLORS.warning:COLORS.calm);
        }
        const h = (this.inflation/100)*120;
        this.meterFill.setDisplaySize(10, h);
        this.meterFill.setFillStyle(this.inflation>=80?COLORS.danger:this.inflation>=50?COLORS.warning:COLORS.success);
        this.showZone();
    }

    showZone() {
        const h = this.scene.get('HUDScene');
        if (!h || !h.scene.isActive()) return;
        let label = '';
        for (const z of SCORING.zones) { if (this.inflation>=z.min && this.inflation<=z.max) { label=z.label; break; } }
        h.updateZone(label, this.inflation);
    }

    resetIdleTimer() { this.clearIdleTimer(); this.idleTimer = setTimeout(()=>this.onEscape(), GAME_CONFIG.idleTimeout); }
    clearIdleTimer() { if (this.idleTimer) { clearTimeout(this.idleTimer); this.idleTimer = null; } }

    update(time, delta) {
        if (this.balloonState === 'INFLATING' && this.cfg && this.cfg.isSpeedBalloon) {
            this.inflation = Math.max(0, this.inflation - this.cfg.deflateRate*(delta/1000));
            const bs = this.cfg.isBoss ? 0.8 : 0.6;
            this.balloon.setScale(bs + (this.inflation/100)*0.9);
            this.updateVisuals();
        }
        if (this.balloonState === 'INFLATING' && this.inflation > 80 && (!this.sweatT || time-this.sweatT>400)) {
            this.sweatT = time;
            const d = this.add.circle(this.balloon.x+(Math.random()>0.5?15:-15), this.balloon.y-20, 2, 0xFFFFFF, 0.8).setDepth(30);
            this.tweens.add({ targets:d, y:d.y+6, alpha:0, duration:300, onComplete:()=>d.destroy() });
        }
    }

    shutdown() { this.clearIdleTimer(); document.removeEventListener('visibilitychange', this.visHandler); }
}
