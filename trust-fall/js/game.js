// game.js - GameScene: core gameplay, input, obstacles, collisions

class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    init(data) { this.continueData = (data && data.continueData) || null; }

    create() {
        var w = GAME.WIDTH, h = GAME.HEIGHT;
        var bg = this.add.graphics();
        bg.fillGradientStyle(0x0D1B2A, 0x0D1B2A, 0x1B3A4B, 0x1B3A4B, 1);
        bg.fillRect(0, 0, w, h);

        // State init
        this.score = this.continueData ? this.continueData.score : 0;
        this.currentStage = this.continueData ? this.continueData.stage : 1;
        this.lives = this.continueData ? 1 : TIMING.LIVES_START;
        this.combo = 0;
        this.bestCombo = 0;
        this.isJumping = false;
        this.inputEnabled = true;
        this.isInvincible = false;
        this.isGameOver = false;
        this.stageTransitioning = false;
        this.isPaused = false;
        this.lastTapTime = 0;
        this.lastInputTime = Date.now();
        this.bufferedInput = false;
        this.waveIndex = 0;
        this.obstaclesActive = [];
        this.survivalTimer = 0;
        this.currentJumpA = JUMP.HEIGHT;
        this.currentJumpB = JUMP.HEIGHT;
        this.threadColor = 0xE0E0E0;
        this.threadWidth = 2;
        this.threadAlpha = 0.8;

        // Platforms
        this.platformA = this.add.image(GAME.PLATFORM_A_X, GAME.PLATFORM_Y, 'platform');
        this.platformB = this.add.image(GAME.PLATFORM_B_X, GAME.PLATFORM_Y, 'platform');

        // Characters
        this.charA = this.add.image(GAME.CHAR_A_X, GAME.CHAR_Y, 'charA');
        this.charB = this.add.image(GAME.CHAR_B_X, GAME.CHAR_Y, 'charB');
        this.charA.baseX = GAME.CHAR_A_X; this.charA.baseY = GAME.CHAR_Y;
        this.charB.baseX = GAME.CHAR_B_X; this.charB.baseY = GAME.CHAR_Y;

        // Thread graphics
        this.threadGfx = this.add.graphics();

        // Obstacle pool
        this.obstaclePool = [];
        for (var i = 0; i < OBSTACLE_POOL_SIZE; i++) {
            var obs = this.add.image(-100, -100, 'obstacle').setVisible(false).setActive(false);
            obs.hitbox = { w: 28, h: 36 };
            obs.speed = 0; obs.lane = 'left'; obs.dodged = false; obs.nearMissChecked = false;
            this.obstaclePool.push(obs);
        }

        // Red flash overlay
        this.redFlash = this.add.rectangle(w / 2, h / 2, w, h, 0xF44336, 0).setDepth(50);

        // HUD (delegated to GameHUD helper)
        GameHUD.create(this);

        // Input
        this.input.on('pointerdown', this.onPointerDown, this);

        // Visibility
        this.visHandler = this.onVisChange.bind(this);
        document.addEventListener('visibilitychange', this.visHandler);

        this.startStage(this.currentStage);
    }

    onPointerDown(pointer) {
        if (this.isGameOver) return;
        if (pointer.x > GAME.WIDTH - 60 && pointer.y < 50) return;
        if (this.isPaused) return;
        if (!this.inputEnabled) { this.bufferedInput = true; return; }
        var now = this.time.now;
        if (now - this.lastTapTime < JUMP.COOLDOWN) return;
        this.lastTapTime = now; this.lastInputTime = Date.now();
        if (this.isJumping) { this.bufferedInput = true; return; }
        this.handleTap();
    }

    handleTap() {
        if (this.isGameOver || this.isPaused) return;
        this.isJumping = true; this.bufferedInput = false;
        GameJuice.doJump(this);
    }

    startStage(stageNum) {
        this.stageTransitioning = true;
        this.currentStage = stageNum;
        GameHUD.updateStage(this);
        var stageData = generateStage(stageNum);
        this.currentStageData = stageData;
        this.waveIndex = 0;
        this.currentJumpA = stageData.jumpA;
        this.currentJumpB = stageData.jumpB;
        if (stageData.isBoss) this.threadColor = 0xFFD740;
        else this.updateThreadColor();

        var label = stageData.isBoss ? 'BOSS STAGE ' + stageNum : 'STAGE ' + stageNum;
        var at = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 40, label, {
            fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        }).setOrigin(0.5).setScale(0).setDepth(70);
        var self = this;
        this.tweens.add({
            targets: at, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut',
            onComplete: function() {
                self.time.delayedCall(600, function() {
                    self.tweens.add({ targets: at, alpha: 0, duration: 300, onComplete: function() {
                        at.destroy(); self.stageTransitioning = false; self.spawnNextWave();
                    }});
                });
            }
        });
    }

    spawnNextWave() {
        if (this.isGameOver || this.isPaused) return;
        if (this.waveIndex >= this.currentStageData.waves.length) { this.onStageClear(); return; }
        var wave = this.currentStageData.waves[this.waveIndex];
        this.waveIndex++;
        var self = this;
        this.time.delayedCall(wave.leftObstacle.delay, function() {
            if (self.isGameOver) return;
            self.spawnObstacle('left', wave.leftObstacle.speed, wave.leftObstacle.type);
            if (wave.leftObstacle.double) self.time.delayedCall(300, function() {
                if (!self.isGameOver) self.spawnObstacle('left', wave.leftObstacle.speed, wave.leftObstacle.type);
            });
        });
        this.time.delayedCall(wave.rightObstacle.delay, function() {
            if (self.isGameOver) return;
            self.spawnObstacle('right', wave.rightObstacle.speed, wave.rightObstacle.type);
            if (wave.rightObstacle.double) self.time.delayedCall(300, function() {
                if (!self.isGameOver) self.spawnObstacle('right', wave.rightObstacle.speed, wave.rightObstacle.type);
            });
        });
        if (this.waveIndex < this.currentStageData.waves.length) {
            this.time.delayedCall(this.currentStageData.waveGap, function() {
                if (!self.isGameOver && !self.isPaused) self.spawnNextWave();
            });
        }
    }

    spawnObstacle(lane, speed, type) {
        var obs = null;
        for (var i = 0; i < this.obstaclePool.length; i++) {
            if (!this.obstaclePool[i].active) { obs = this.obstaclePool[i]; break; }
        }
        if (!obs) return;
        obs.setTexture(type === 'fast' ? 'fastObstacle' : 'obstacle');
        obs.setVisible(true).setActive(true).setAlpha(1).setScale(1);
        obs.lane = lane; obs.speed = speed; obs.dodged = false; obs.nearMissChecked = false;
        obs.hitbox = type === 'fast' ? { w: 22, h: 28 } : { w: 28, h: 36 };
        if (lane === 'left') { obs.x = -40; obs.y = GAME.CHAR_Y; obs.setFlipX(false); }
        else { obs.x = GAME.WIDTH + 40; obs.y = GAME.CHAR_Y; obs.setFlipX(true); }
        this.obstaclesActive.push(obs);
    }

    update(time, delta) {
        if (this.isGameOver || this.isPaused) return;
        if (Date.now() - this.lastInputTime > TIMING.INACTIVITY_TIMEOUT) { this.onInactivityDeath(); return; }
        this.survivalTimer += delta;
        if (this.survivalTimer >= 1000) { this.survivalTimer -= 1000; this.addScore(SCORING.SURVIVAL_PER_SEC); }
        this.moveAndCheckObstacles();
        this.drawThread();
    }

    moveAndCheckObstacles() {
        var rem = [];
        for (var i = 0; i < this.obstaclesActive.length; i++) {
            var o = this.obstaclesActive[i];
            if (!o.active) { rem.push(i); continue; }
            if (o.lane === 'left') o.x += o.speed; else o.x -= o.speed;
            var ch = o.lane === 'left' ? this.charA : this.charB;
            var cx = o.lane === 'left' ? GAME.CHAR_A_X : GAME.CHAR_B_X;
            if ((o.lane === 'left' && o.x > GAME.WIDTH + 50) || (o.lane === 'right' && o.x < -50)) {
                if (!o.dodged) { o.dodged = true; this.onDodge(o); }
                o.setVisible(false).setActive(false); rem.push(i); continue;
            }
            if (!o.dodged && !this.isInvincible) {
                if (Math.abs(ch.x - o.x) < 16 + o.hitbox.w / 2 && Math.abs(ch.y - o.y) < 20 + o.hitbox.h / 2) {
                    o.dodged = true; this.onHit(ch, o);
                    o.setVisible(false).setActive(false); rem.push(i); continue;
                }
            }
            if (!o.dodged) {
                var passed = (o.lane === 'left' && o.x > cx + 20) || (o.lane === 'right' && o.x < cx - 20);
                if (passed) {
                    o.dodged = true; this.onDodge(o);
                    if (!o.nearMissChecked) {
                        o.nearMissChecked = true;
                        if (Math.abs(ch.x - o.x) < 16 + o.hitbox.w / 2 + SCORING.NEAR_MISS_PX) this.onNearMiss(ch);
                    }
                }
            }
        }
        for (var j = rem.length - 1; j >= 0; j--) this.obstaclesActive.splice(rem[j], 1);
    }

    onDodge(obs) {
        this.combo++;
        if (this.combo > this.bestCombo) this.bestCombo = this.combo;
        var isPerfect = this.isJumping && Math.random() < 0.3;
        var pts = (isPerfect ? SCORING.DODGE_PERFECT : SCORING.DODGE_NORMAL) + this.combo * SCORING.COMBO_BONUS;
        this.addScore(pts);
        GameHUD.showCombo(this); this.checkComboMilestone(); this.updateThreadColor();
        GameJuice.onDodge(this, obs, isPerfect);
        var self = this;
        if (this.obstaclesActive.length === 0 && this.waveIndex >= this.currentStageData.waves.length && !this.stageTransitioning) {
            this.time.delayedCall(400, function() { if (!self.isGameOver && !self.stageTransitioning) self.onStageClear(); });
        }
    }

    onNearMiss(ch) {
        this.addScore(SCORING.NEAR_MISS);
        JuiceEffects.floatingText(this, ch.x, ch.y - 30, '+5', COLORS.UI_TEXT, 16, 40, 500);
        ch.setTint(0xFFFFFF);
        var self = this; this.time.delayedCall(50, function() { if (ch) ch.clearTint(); });
    }

    onHit(ch, obs) {
        this.lives--; this.combo = 0;
        GameHUD.showCombo(this); GameHUD.updateLives(this);
        GameJuice.onHit(this, ch, obs);
        this.isInvincible = true;
        var self = this;
        this.time.delayedCall(TIMING.INVINCIBILITY_DURATION, function() { self.isInvincible = false; });
        if (this.lives <= 0) this.time.delayedCall(TIMING.DEATH_TO_GAMEOVER, function() { self.gameOver(); });
    }

    onStageClear() {
        if (this.stageTransitioning || this.isGameOver) return;
        this.stageTransitioning = true;
        this.addScore(SCORING.STAGE_CLEAR_BASE + this.currentStage * SCORING.STAGE_CLEAR_PER_STAGE);
        if (this.currentStageData.isBoss && this.lives < TIMING.LIVES_MAX) { this.lives++; GameHUD.updateLives(this); }
        GameJuice.onStageClear(this);
        var self = this;
        this.time.delayedCall(1500, function() { if (!self.isGameOver) self.startStage(self.currentStage + 1); });
    }

    onInactivityDeath() {
        if (this.isGameOver) return;
        this.isGameOver = true; this.inputEnabled = false;
        GameJuice.onInactivityDeath(this);
        var self = this;
        this.time.delayedCall(1000, function() { self.gameOver(); });
    }

    gameOver() {
        if (this.scene.isActive('GameOverScene')) return;
        this.isGameOver = true; this.inputEnabled = false;
        document.removeEventListener('visibilitychange', this.visHandler);
        this.scene.start('GameOverScene', { score: this.score, stage: this.currentStage, bestCombo: this.bestCombo });
    }

    addScore(pts) {
        this.score += pts;
        GameHUD.updateScore(this);
        JuiceEffects.floatingText(this, GAME.WIDTH / 2, 460, '+' + pts, COLORS.REWARD);
    }

    checkComboMilestone() {
        var m = { 5: 'IN SYNC!', 10: 'SOUL BOND!', 15: 'PERFECT TRUST!', 20: 'UNBREAKABLE!', 25: 'LEGENDARY!' };
        if (!m[this.combo]) return;
        GameJuice.showMilestone(this, m[this.combo]);
    }

    updateThreadColor() {
        if (this.combo >= 25) this.threadColor = 0xFF00FF;
        else if (this.combo >= 20) this.threadColor = 0xFFD740;
        else if (this.combo >= 5) this.threadColor = 0x00E5FF;
        else this.threadColor = 0xE0E0E0;
    }

    drawThread() {
        this.threadGfx.clear();
        this.threadGfx.lineStyle(this.threadWidth, this.threadColor, this.threadAlpha);
        this.threadGfx.lineBetween(this.charA.x + 20, this.charA.y, this.charB.x - 20, this.charB.y);
    }

    togglePause() {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) GamePause.show(this); else GamePause.hide(this);
    }

    onVisChange() {
        if (document.hidden && !this.isPaused && !this.isGameOver) this.togglePause();
    }

    shutdown() { document.removeEventListener('visibilitychange', this.visHandler); }
}
