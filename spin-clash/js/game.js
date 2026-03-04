// game.js — Core gameplay scene: arena, tops, collision, spin, flick input

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG);
        this.score = 0;
        this.stage = 1;
        this.spinEnergy = 100;
        this.combo = 0;
        this.isHitStopped = false;
        this.lastHitStop = 0;
        this.isDead = false;
        this.isPaused = false;
        this.dragStart = null;
        this.aimGraphics = this.add.graphics().setDepth(50);
        this.trailGraphics = this.add.graphics().setDepth(5);
        this.trails = [];
        this.pauseOverlay = null;
        this.stageClearing = false;

        this.hud = new HUD(this);
        this.platformGfx = this.add.graphics().setDepth(0);
        this.enemies = [];

        this.loadStage(this.stage);
        this.setupInput();
        this.setupInactivityTimer();

        document.addEventListener('visibilitychange', this._onVisChange = () => {
            if (document.hidden && !this.isDead) this.showPause();
        });
    }

    loadStage(stageNum) {
        this.stageConfig = Stages.getStageConfig(stageNum);
        this.drawPlatform();
        this.spawnPlayer();
        this.spawnEnemies();
        this.spinEnergy = 100;
        this.combo = 0;
        this.stageClearing = false;
    }

    drawPlatform() {
        const r = this.stageConfig.platformRadius, g = this.platformGfx, cx = CONFIG.CENTER_X, cy = CONFIG.CENTER_Y;
        g.clear();
        g.fillStyle(CONFIG.COLORS.PLATFORM, 1); g.fillCircle(cx, cy, r);
        g.lineStyle(0.5, CONFIG.COLORS.PLATFORM_EDGE, 0.15);
        g.lineBetween(cx - r, cy, cx + r, cy); g.lineBetween(cx, cy - r, cx, cy + r);
        g.lineStyle(3, CONFIG.COLORS.PLATFORM_EDGE, 0.6); g.strokeCircle(cx, cy, r);
    }

    spawnPlayer() {
        if (this.player) this.player.destroy();
        if (this.playerGfx) this.playerGfx.destroy();
        this.playerGfx = this.add.graphics().setDepth(10);
        Effects.drawTopGraphic(this.playerGfx, 0, 0, CONFIG.PLAYER.RADIUS, CONFIG.COLORS.PLAYER, true);

        this.player = this.physics.add.sprite(CONFIG.CENTER_X, CONFIG.CENTER_Y, '__DEFAULT').setDepth(10);
        this.player.setVisible(false);
        this.player.body.setCircle(CONFIG.PLAYER.RADIUS);
        this.player.body.setOffset(-CONFIG.PLAYER.RADIUS, -CONFIG.PLAYER.RADIUS);
        this.player.body.setMaxVelocity(CONFIG.PLAYER.MAX_SPEED, CONFIG.PLAYER.MAX_SPEED);
        this.player.body.setDrag(CONFIG.PLAYER.DRAG);
        this.player.body.setBounce(0.5);
        this.ringAngle = 0;
    }

    spawnEnemies() {
        this.enemies.forEach(e => { e.gfx.destroy(); e.sprite.destroy(); });
        this.enemies = [];
        this.stageConfig.enemies.forEach(eData => {
            const tc = CONFIG.ENEMY_TYPES[eData.type];
            const gfx = this.add.graphics().setDepth(10);
            Effects.drawTopGraphic(gfx, 0, 0, tc.radius, tc.color, false);

            const sprite = this.physics.add.sprite(eData.x, eData.y, '__DEFAULT').setDepth(10);
            sprite.setVisible(false);
            sprite.body.setCircle(tc.radius);
            sprite.body.setOffset(-tc.radius, -tc.radius);
            sprite.body.setDrag(60);
            sprite.body.setBounce(eData.type === 'BOUNCER' ? 1.2 : 0.5);
            sprite.setData('type', eData.type);
            sprite.setData('hp', tc.hp);
            sprite.setData('platformRadius', this.stageConfig.platformRadius);
            this.enemies.push({ sprite, gfx, type: eData.type });
            this.physics.add.overlap(this.player, sprite, () => this.onCollision(sprite), null, this);
        });
    }

    setupInput() {
        this.input.on('pointerdown', (p) => {
            if (this.isDead || this.isPaused) return;
            this.dragStart = { x: p.x, y: p.y, time: this.time.now };
            this.resetInactivity();
        });
        this.input.on('pointermove', (p) => {
            if (!this.dragStart || this.isDead || this.isPaused) return;
            Effects.drawAimArrow(this, this.aimGraphics, this.player.x, this.player.y, this.dragStart, p);
        });
        this.input.on('pointerup', (p) => {
            if (!this.dragStart || this.isDead || this.isPaused) return;
            this.launchFlick(p);
            this.dragStart = null;
            this.aimGraphics.clear();
        });
    }

    launchFlick(pointer) {
        let dx = pointer.x - this.dragStart.x;
        let dy = pointer.y - this.dragStart.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.DRAG_THRESHOLD) {
            const angle = Math.random() * Math.PI * 2;
            dx = Math.cos(angle) * 30;
            dy = Math.sin(angle) * 30;
            dist = 30;
        }
        const clamp = Math.min(dist, CONFIG.MAX_DRAG_PX);
        const vx = (dx / dist) * clamp * CONFIG.LAUNCH_POWER;
        const vy = (dy / dist) * clamp * CONFIG.LAUNCH_POWER;
        this.player.body.setVelocity(vx, vy);
        this.tweens.add({ targets: this.playerGfx, scaleX: 1.15, scaleY: 1.15, duration: 60, yoyo: true });
        SoundFX.play('launch');
    }

    onCollision(enemySprite) {
        if (this.isDead || this.isHitStopped || this.stageClearing) return;
        const now = this.time.now;
        if (now - this.lastHitStop < CONFIG.HIT_STOP_GUARD_MS) return;

        const dx = enemySprite.x - this.player.x;
        const dy = enemySprite.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / dist, ny = dy / dist;
        enemySprite.body.setVelocity(nx * CONFIG.KNOCKBACK_BASE * CONFIG.KNOCKBACK_MULTI, ny * CONFIG.KNOCKBACK_BASE * CONFIG.KNOCKBACK_MULTI);
        this.player.body.setVelocity(-nx * 120, -ny * 120);

        enemySprite.setData('hp', enemySprite.getData('hp') - 1);
        this.doHitStop(now);
        Effects.spawnHitParticles(this, enemySprite.x, enemySprite.y, enemySprite.getData('type'), this.combo);
        this.cameras.main.shake(120, 0.004);
        this.cameras.main.zoomTo(1.04, 100, 'Sine.easeOut', false, (cam, p) => { if (p >= 1) cam.zoomTo(1, 200); });
        SoundFX.play('hit');

        this.combo++;
        const mult = CONFIG.COMBO_MULTIPLIERS[Math.min(this.combo, CONFIG.COMBO_MULTIPLIERS.length - 1)];
        const pts = Math.round(CONFIG.SCORE.KILL * mult);
        this.score += pts;
        Effects.showFloatingScore(this, enemySprite.x, enemySprite.y - 20, pts);
        this.hud.scorePunch();
        if (this.combo >= 2) this.hud.showCombo(this.combo);
    }

    doHitStop(now) {
        this.isHitStopped = true;
        this.lastHitStop = now;
        this.physics.world.timeScale = 100;
        this.time.delayedCall(CONFIG.HIT_STOP_MS, () => {
            this.physics.world.timeScale = 1;
            this.isHitStopped = false;
        });
    }

    checkEdges() {
        if (this.isDead || this.stageClearing) return;
        const pr = this.stageConfig.platformRadius;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            const dx = e.sprite.x - CONFIG.CENTER_X, dy = e.sprite.y - CONFIG.CENTER_Y;
            if (Math.sqrt(dx * dx + dy * dy) > pr + CONFIG.ENEMY_TYPES[e.type].radius * 0.5) {
                this.enemyOffEdge(i);
            }
        }
        const pdx = this.player.x - CONFIG.CENTER_X, pdy = this.player.y - CONFIG.CENTER_Y;
        if (Math.sqrt(pdx * pdx + pdy * pdy) > pr + CONFIG.PLAYER.RADIUS) this.playerDeath('fell');
    }

    enemyOffEdge(idx) {
        const e = this.enemies[idx];
        SoundFX.play('enemyOff');
        this.physics.world.timeScale = 1 / CONFIG.SLOW_MO_SCALE;
        this.time.delayedCall(CONFIG.SLOW_MO_DURATION, () => {
            if (!this.isDead) this.physics.world.timeScale = 1;
        });
        e.gfx.destroy();
        e.sprite.destroy();
        this.enemies.splice(idx, 1);
        if (this.enemies.length === 0 && !this.stageClearing) this.stageClear();
    }

    stageClear() {
        this.stageClearing = true;
        this.score += CONFIG.SCORE.STAGE_BONUS;
        if (this.spinEnergy > 50) this.score += CONFIG.SCORE.SPIN_BONUS;
        SoundFX.play('stageClear');
        this.hud.scorePunch();
        Effects.stageFlash(this);
        this.stage++;
        this.hud.stageBump(this.stage);

        this.time.delayedCall(500, () => {
            this.player.body.setVelocity(0, 0);
            this.player.setPosition(CONFIG.CENTER_X, CONFIG.CENTER_Y);
            const startSpin = this.spinEnergy;
            this.tweens.addCounter({
                from: startSpin, to: 100, duration: CONFIG.SPIN_REFILL_MS,
                onUpdate: (t) => { this.spinEnergy = t.getValue(); },
                onComplete: () => this.loadStage(this.stage),
            });
        });
    }

    playerDeath(reason) {
        if (this.isDead) return;
        this.isDead = true;
        this.player.body.setVelocity(0, 0);
        SoundFX.play('death');
        this.cameras.main.shake(300, 0.012);
        if (reason === 'spin') {
            this.tweens.add({ targets: this.playerGfx, scaleX: 0.9, scaleY: 1.1, duration: 60, yoyo: true, repeat: 6 });
        }
        if (this.cameras.main.postFX) this.cameras.main.postFX.addColorMatrix().desaturate();

        this.time.delayedCall(CONFIG.DEATH_ANIM_MS, () => {
            const isHigh = this.score > window.GAME_STATE.highScore;
            if (isHigh) window.GAME_STATE.highScore = this.score;
            window.GAME_STATE.gamesPlayed++;
            if (this.stage > window.GAME_STATE.highestStage) window.GAME_STATE.highestStage = this.stage;
            saveState();
            this.scene.start('GameOverScene', {
                score: this.score, stage: this.stage,
                highScore: window.GAME_STATE.highScore, isHighScore: isHigh,
            });
        });
    }

    setupInactivityTimer() {
        this.inactivityTimer = this.time.addEvent({ delay: CONFIG.INACTIVITY_DEATH_MS,
            callback: () => { if (!this.isDead && !this.isPaused) this.playerDeath('idle'); } });
    }
    resetInactivity() { if (this.inactivityTimer) { this.inactivityTimer.remove(); this.setupInactivityTimer(); } }

    togglePause() {
        if (this.isDead) return;
        this.isPaused ? this.hidePause() : this.showPause();
    }

    showPause() {
        if (this.isPaused) return;
        this.isPaused = true;
        this.physics.pause();
        const cx = CONFIG.WIDTH / 2;
        this.pauseOverlay = this.add.container(0, 0).setDepth(200);
        this.pauseOverlay.add(this.add.rectangle(cx, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, CONFIG.COLORS.UI_BG, 0.85).setInteractive());
        this.pauseOverlay.add(this.add.text(cx, 220, 'PAUSED', { fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5));
        const btn = (y, label, cb) => {
            const t = this.add.text(cx, y, label, { fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00E5FF' }).setOrigin(0.5).setInteractive();
            t.on('pointerdown', cb);
            this.pauseOverlay.add(t);
        };
        btn(300, 'RESUME', () => { SoundFX.play('uiTap'); this.hidePause(); });
        btn(350, 'RESTART', () => { SoundFX.play('uiTap'); this.scene.restart(); });
        btn(400, 'MENU', () => { SoundFX.play('uiTap'); this.scene.start('MenuScene'); });
    }

    hidePause() {
        this.isPaused = false;
        this.physics.resume();
        if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
    }

    update(time, delta) {
        if (this.isDead || this.isPaused || this.isHitStopped) return;
        this.spinEnergy -= this.stageConfig.spinDrain * (delta / 1000);
        if (this.spinEnergy <= 0) { this.spinEnergy = 0; this.playerDeath('spin'); return; }
        this.playerGfx.setPosition(this.player.x, this.player.y);
        this.ringAngle += this.spinEnergy * 0.3 * (delta / 1000);
        Effects.updateTrails(this, this.trailGraphics, this.trails, this.player, time);
        this.enemies.forEach(e => {
            e.gfx.setPosition(e.sprite.x, e.sprite.y);
            Stages.getEnemyBehavior(e.sprite, this.player.x, this.player.y, delta, this.stageConfig.speedMult);
        });
        this.checkEdges();
        const pSpeed = Math.sqrt(this.player.body.velocity.x ** 2 + this.player.body.velocity.y ** 2);
        if (pSpeed < 15 && this.combo > 0) this.combo = 0;
        this.hud.update(this.score, this.stage, this.spinEnergy, this.combo);
    }

    shutdown() {
        document.removeEventListener('visibilitychange', this._onVisChange);
        this.hud.destroy();
    }
}
