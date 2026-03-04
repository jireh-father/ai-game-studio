// Stack Panic - Core Game Scene (Pendulum, Physics, Blocks, Tilt, Stages)
// Rendering in render.js, Audio/StageManager in stages.js

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create(data) {
        this.cameras.main.setBackgroundColor(COLORS.background);

        // State
        this.score = 0;
        this.tilt = 0;
        this.targetTilt = 0;
        this.perfectStreak = 0;
        this.noMissStreak = 0;
        this.gameOver = false;
        this.paused = false;
        this.transitioning = false;
        this.lastTapTime = 0;
        this.blockIndex = 0;
        this.droppedBlocks = [];
        this.obstacleObjects = [];

        // Stage manager
        this.stages = new StageManager();
        this.hud = new HUDManager(this);

        // Continue from rewarded ad
        if (data && data.continueGame && data.prevData) {
            this.score = data.prevData.score || 0;
            this.stages.totalBlocksLanded = data.prevData.blocksLanded || 0;
            this.stages.currentStage = data.prevData.stage || 1;
            this.stages.stageParams = generateStage(this.stages.currentStage);
            this.stages.blocksLandedInStage = data.prevData.blocksLandedInStage || 0;
            this.tilt = 0;
            this.targetTilt = 0;
            this.hud.updateScore(this.score);
        }

        this._drawBackground();
        this._createPlatform();
        this._createObstacles(this.stages.stageParams.obstacles);
        this._createPendulum();
        this._setupInput();
        this._setupCollisions();
        this._startIdleTimer();

        this.blockGraphics = null;
        this.vignetteGraphics = this.add.graphics().setDepth(90).setScrollFactor(0);
        this.ghostGraphics = this.add.graphics().setDepth(5);
        this.obstacleGraphics = this.add.graphics().setDepth(7);
        this.firstBlockLanded = false;

        this.hud.updateStage(this.stages.currentStage, this.stages.stageParams.traits);
        this.hud.updateProgress(this.stages.getProgress());
        this._drawObstacles();
    }

    _drawBackground() {
        const g = this.add.graphics();
        g.lineStyle(1, COLORS.grid, 0.2);
        for (let x = 0; x < GAME_WIDTH; x += 40) { g.moveTo(x, 0); g.lineTo(x, GAME_HEIGHT); }
        for (let y = 0; y < GAME_HEIGHT; y += 40) { g.moveTo(0, y); g.lineTo(GAME_WIDTH, y); }
        g.strokePath();
    }

    _createPlatform() {
        this.currentPlatformWidth = this.stages.stageParams.platformWidth;
        this.platform = this.matter.add.rectangle(
            GAME_WIDTH / 2, PLATFORM_Y + PLATFORM_HEIGHT / 2,
            this.currentPlatformWidth, PLATFORM_HEIGHT,
            { isStatic: true, friction: 0.9, label: 'platform' }
        );
        this.platformVis = this.add.graphics();
        this._drawPlatformVisual();
    }

    _drawPlatformVisual() {
        const w = this.currentPlatformWidth;
        this.platformVis.clear();
        this.platformVis.fillStyle(COLORS.platform);
        this.platformVis.fillRoundedRect(GAME_WIDTH / 2 - w / 2, PLATFORM_Y, w, PLATFORM_HEIGHT, 4);
        this.platformVis.fillStyle(COLORS.platformHighlight);
        this.platformVis.fillRoundedRect(GAME_WIDTH / 2 - w / 2, PLATFORM_Y, w, 5, 2);
    }

    _updatePlatformWidth(newWidth) {
        this.currentPlatformWidth = newWidth;
        this.matter.world.remove(this.platform);
        this.platform = this.matter.add.rectangle(
            GAME_WIDTH / 2, PLATFORM_Y + PLATFORM_HEIGHT / 2,
            newWidth, PLATFORM_HEIGHT,
            { isStatic: true, friction: 0.9, label: 'platform' }
        );
        this._drawPlatformVisual();
    }

    _createObstacles(obstacleConfigs) {
        for (const obs of obstacleConfigs) {
            const body = this.matter.add.rectangle(
                obs.x, PLATFORM_Y - obs.height / 2,
                obs.width, obs.height,
                { isStatic: true, friction: 0.9, label: 'obstacle' }
            );
            this.obstacleObjects.push({ body, x: obs.x, width: obs.width, height: obs.height });
        }
    }

    _drawObstacles() {
        if (!this.obstacleGraphics) return;
        this.obstacleGraphics.clear();
        for (const obs of this.obstacleObjects) {
            this.obstacleGraphics.fillStyle(COLORS.obstacle);
            this.obstacleGraphics.fillRoundedRect(
                obs.x - obs.width / 2, PLATFORM_Y - obs.height,
                obs.width, obs.height, 2
            );
            this.obstacleGraphics.fillStyle(COLORS.obstacleShadow);
            this.obstacleGraphics.fillRect(
                obs.x - obs.width / 2, PLATFORM_Y - 3,
                obs.width, 3
            );
        }
    }

    _clearObstacles() {
        for (const obs of this.obstacleObjects) {
            this.matter.world.remove(obs.body);
        }
        this.obstacleObjects = [];
        if (this.obstacleGraphics) this.obstacleGraphics.clear();
    }

    _createPendulum() {
        this.pendulumAngle = 0;
        this.pendulumSpeed = this.stages.stageParams.pendulumSpeed;
        this.pendulumTime = 0;
        this.swingBlock = null;
        this.pendulumGraphics = this.add.graphics().setDepth(10);
        this._spawnSwingBlock();
    }

    _spawnSwingBlock() {
        if (this.gameOver || this.transitioning) return;
        const variant = this.stages.getBlockVariant();
        const color = getBlockColor(this.blockIndex);
        const body = this.matter.add.rectangle(
            PENDULUM_PIVOT_X, PENDULUM_PIVOT_Y + PENDULUM_ARM_LENGTH,
            variant.width, variant.height,
            { isStatic: true, friction: 0.8, restitution: 0.03, frictionAir: 0.03, label: 'block_' + this.blockIndex }
        );
        this.swingBlock = { body, width: variant.width, height: variant.height, color, index: this.blockIndex, irregular: variant.irregular };
        this.blockIndex++;
    }

    _setupInput() {
        this.input.on('pointerdown', () => {
            if (this.gameOver || this.paused || this.transitioning) return;
            const now = Date.now();
            if (now - this.lastTapTime < TAP_COOLDOWN) return;
            this.lastTapTime = now;
            this._dropBlock();
        });
    }

    _setupCollisions() {
        this.matter.world.on('collisionstart', (event) => {
            for (const pair of event.pairs) {
                const labels = [pair.bodyA.label, pair.bodyB.label];
                const blockBody = labels[0].startsWith('block_') ? pair.bodyA : labels[1].startsWith('block_') ? pair.bodyB : null;
                if (!blockBody) continue;
                const otherLabel = blockBody === pair.bodyA ? pair.bodyB.label : pair.bodyA.label;
                if (this._isNewlyDropped(blockBody)) {
                    if (otherLabel === 'platform' || otherLabel.startsWith('block_') || otherLabel === 'static_base' || otherLabel === 'obstacle') {
                        this._onBlockLanded(blockBody);
                    }
                }
            }
        });
    }

    _isNewlyDropped(body) {
        const block = this.droppedBlocks.find(b => b.body === body);
        return block && !block.settled;
    }

    _dropBlock() {
        if (!this.swingBlock) return;
        const block = this.swingBlock;
        this.swingBlock = null;

        const pos = { x: block.body.position.x, y: block.body.position.y };
        this.matter.world.remove(block.body);

        // Use per-stage physics values
        const params = this.stages.stageParams;
        const newBody = this.matter.add.rectangle(
            pos.x, pos.y, block.width, block.height,
            { isStatic: false, friction: 0.9, restitution: params.restitution, frictionAir: params.frictionAir,
              label: 'block_' + block.index }
        );
        block.body = newBody;

        this.droppedBlocks.push({
            body: newBody, width: block.width, height: block.height,
            color: block.color, settled: false, index: block.index
        });

        JuiceEffects.emitParticles(this, pos.x, pos.y, 15, block.color, 180, 350);
        this.cameras.main.shake(120, 0.003);
        audioManager.play('drop_whoosh');
        JuiceEffects.vibrate(20);

        this._resetIdleTimer();
        this._checkTimePressure();
        this.time.delayedCall(500, () => this._spawnSwingBlock());
    }

    _onBlockLanded(body) {
        const blockData = this.droppedBlocks.find(b => b.body === body);
        if (!blockData || blockData.settled) return;
        blockData.settled = true;

        const pos = body.position;
        const towerCenterX = GAME_WIDTH / 2;
        const overhang = Math.abs(pos.x - towerCenterX) - (this.currentPlatformWidth / 2 - blockData.width / 2);
        const absOverhang = Math.max(0, overhang);

        let quality, points;
        if (absOverhang < PERFECT_OVERHANG_MAX) {
            quality = 'perfect';
            const streakMul = Math.min(PERFECT_STREAK_CAP, 1 + this.perfectStreak * 0.5);
            points = Math.round(SCORE_PERFECT * streakMul);
            if (this.perfectStreak >= 1) points += 100 * this.perfectStreak;
            this.perfectStreak++;
        } else if (absOverhang < GREAT_OVERHANG_MAX) {
            quality = 'great'; points = SCORE_GREAT; this.perfectStreak = 0;
        } else {
            quality = 'normal'; points = SCORE_NORMAL; this.perfectStreak = 0;
        }

        this.noMissStreak++;
        if (this.noMissStreak % 5 === 0) { points += SCORE_STREAK_BONUS; audioManager.play('streak'); }

        const result = this.stages.onBlockLanded(quality);

        if (quality === 'perfect') this.targetTilt = Math.max(0, this.targetTilt - this.stages.stageParams.tiltRecovery);
        else if (quality === 'great') this.targetTilt = Math.max(0, this.targetTilt - this.stages.stageParams.tiltRecovery * 0.5);

        this.score += points;
        this.hud.updateScore(this.score);
        this.hud.updateStreak(this.perfectStreak);
        this.hud.updateProgress(this.stages.getProgress());

        JuiceEffects.landingJuice(this, quality, pos, points, blockData);
        if (!this.firstBlockLanded) { this.firstBlockLanded = true; JuiceEffects.firstBlockImpact(this, pos); }
        if (this.stages.applyEarthquake(this)) audioManager.play('earthquake');
        this._compressBodies();

        if (result === 'stage_clear') {
            this._onStageClear();
        }
    }

    _onStageClear() {
        this.transitioning = true;

        // Remove pending swing block
        if (this.swingBlock) {
            this.matter.world.remove(this.swingBlock.body);
            this.swingBlock = null;
        }
        if (this.idleTimer) this.idleTimer.remove();

        // Stage clear bonus
        const bonus = this.stages.currentStage * 500;
        this.score += bonus;
        this.hud.updateScore(this.score);

        this.hud.showStageClearBanner(this.stages.currentStage, bonus);
        audioManager.play('stage_clear');

        this.time.delayedCall(2000, () => {
            // Clear all blocks
            for (const b of this.droppedBlocks) {
                if (b.body) this.matter.world.remove(b.body);
            }
            this.droppedBlocks = [];
            this._clearObstacles();

            // Advance stage
            this.stages.advanceStage();
            const params = this.stages.stageParams;

            // Recover some tilt between stages
            this.targetTilt = Math.max(0, this.targetTilt - 10);

            // Apply new stage params
            this._updatePlatformWidth(params.platformWidth);
            this.pendulumSpeed = params.pendulumSpeed;
            this._createObstacles(params.obstacles);
            this._drawObstacles();

            // Destroy old graphics and reset
            if (this.blockGraphics) { this.blockGraphics.destroy(); this.blockGraphics = null; }
            this.pendulumGraphics.clear();
            this.ghostGraphics.clear();
            this.firstBlockLanded = false;

            // Show stage intro
            this.hud.showStageIntroBanner(this.stages.currentStage, params.traits);
            this.hud.updateStage(this.stages.currentStage, params.traits);
            this.hud.updateProgress(0);

            this.time.delayedCall(1500, () => {
                this.transitioning = false;
                this._spawnSwingBlock();
                this._resetIdleTimer();
            });
        });
    }

    onMiss(pos) {
        this.noMissStreak = 0;
        this.perfectStreak = 0;
        this.hud.updateStreak(0);
        this.targetTilt = Math.min(TILT_MAX, this.targetTilt + TILT_PER_MISS);
        JuiceEffects.missJuice(this, pos);
        if (this.stages.onMiss()) this._triggerGameOver();
    }

    _triggerGameOver() {
        if (this.gameOver) return;
        this.gameOver = true;
        JuiceEffects.collapseJuice(this);
        this.time.delayedCall(1200, () => {
            this.matter.world.engine.timing.timeScale = 1;
            this.scene.start('GameOverScene', {
                score: this.score,
                blocksLanded: this.stages.totalBlocksLanded,
                stage: this.stages.currentStage,
                tilt: this.tilt
            });
        });
    }

    _startIdleTimer() { this._resetIdleTimer(); }

    _resetIdleTimer() {
        if (this.idleTimer) this.idleTimer.remove();
        this.idleTimer = this.time.delayedCall(IDLE_DROP_TIMEOUT, () => {
            if (!this.gameOver && !this.transitioning && this.swingBlock) this._dropBlock();
        });
    }

    _checkTimePressure() {
        const now = Date.now();
        if (this._lastDropTime && now - this._lastDropTime > TIME_PRESSURE_THRESHOLD) {
            this.pendulumSpeed = Math.min(this.pendulumSpeed * 1.15, PENDULUM_BASE_SPEED * 3.5);
        }
        this._lastDropTime = now;
    }

    togglePause() {
        this.paused = !this.paused;
        if (this.paused) { this.matter.world.pause(); this._showPauseOverlay(); }
        else { this.matter.world.resume(); this._hidePauseOverlay(); }
    }

    _showPauseOverlay() {
        const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
        this.pauseContainer = this.add.container(0, 0).setDepth(200).setScrollFactor(0);
        this.pauseContainer.add(this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6));
        this.pauseContainer.add(this.add.text(cx, cy - 80, 'PAUSED', { fontSize: '32px', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5));

        const makeBtn = (y, label, color, cb) => {
            const btn = this.add.rectangle(cx, y, 200, 52, color).setInteractive();
            const txt = this.add.text(cx, y, label, { fontSize: '20px', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
            btn.on('pointerdown', (p) => { p.event.stopPropagation(); cb(); });
            this.pauseContainer.add([btn, txt]);
        };
        makeBtn(cy, 'RESUME', 0x4CAF50, () => this.togglePause());
        makeBtn(cy + 65, 'RESTART', COLORS.block, () => this.scene.restart());
        makeBtn(cy + 130, 'QUIT TO MENU', 0x555577, () => this.scene.start('MenuScene'));
    }

    _hidePauseOverlay() {
        if (this.pauseContainer) { this.pauseContainer.destroy(); this.pauseContainer = null; }
    }

    update(time, delta) {
        if (this.gameOver || this.paused || this.transitioning) return;
        const dt = delta / 1000;

        if (this.swingBlock) {
            this.pendulumTime += dt * this.pendulumSpeed;
            const windDrift = this.stages.getWindDrift();
            this.pendulumAngle = Math.sin(this.pendulumTime) * PENDULUM_MAX_ANGLE;
            const px = PENDULUM_PIVOT_X + Math.sin(this.pendulumAngle) * PENDULUM_ARM_LENGTH + windDrift;
            const py = PENDULUM_PIVOT_Y + Math.cos(this.pendulumAngle) * PENDULUM_ARM_LENGTH;
            Phaser.Physics.Matter.Matter.Body.setPosition(this.swingBlock.body, { x: px, y: py });
            BlockRenderer.drawPendulum(this, px, py);
            BlockRenderer.drawGhost(this, px, this.swingBlock.width, this.swingBlock.height);
        } else {
            this.pendulumGraphics.clear();
            this.ghostGraphics.clear();
        }

        this.tilt = Phaser.Math.Linear(this.tilt, this.targetTilt, 0.05);
        this.cameras.main.setRotation(this.tilt * Math.PI / 180);
        this.hud.updateTilt(this.tilt / TILT_MAX);

        BlockRenderer.drawVignette(this);
        BlockRenderer.drawBlocks(this);
        this._freezeSettledBlocks();
        this._checkFallenBlocks();
    }

    _checkFallenBlocks() {
        for (const b of this.droppedBlocks) {
            if (b.settled || !b.body) continue;
            const pos = b.body.position;
            if (pos.y > PLATFORM_Y + PLATFORM_HEIGHT + 50) { b.settled = true; this.onMiss(pos); return; }
            if (pos.x < -50 || pos.x > GAME_WIDTH + 50) { b.settled = true; this._triggerGameOver(); return; }
        }
        for (const b of this.droppedBlocks) {
            if (!b.settled || !b.body || b.body.isStatic) continue;
            const pos = b.body.position;
            if (pos.y > PLATFORM_Y + PLATFORM_HEIGHT + 80 || pos.x < -80 || pos.x > GAME_WIDTH + 80) {
                this._triggerGameOver(); return;
            }
        }
        if (this.tilt >= TILT_MAX - 1) this._triggerGameOver();
    }

    _freezeSettledBlocks() {
        for (const b of this.droppedBlocks) {
            if (!b.body || b.body.isStatic || !b.settled) continue;
            if (b.body.position.y > PLATFORM_Y + PLATFORM_HEIGHT - 5) {
                Phaser.Physics.Matter.Matter.Body.setPosition(b.body, {
                    x: b.body.position.x, y: PLATFORM_Y + PLATFORM_HEIGHT - 5
                });
                Phaser.Physics.Matter.Matter.Body.setVelocity(b.body, { x: b.body.velocity.x, y: 0 });
            }
        }
    }

    _compressBodies() {
        const dynamicBlocks = this.droppedBlocks.filter(b => b.body && !b.body.isStatic && b.settled);
        if (dynamicBlocks.length > MAX_PHYSICS_BODIES) {
            dynamicBlocks.sort((a, b) => b.body.position.y - a.body.position.y);
            const toCompress = dynamicBlocks.slice(0, dynamicBlocks.length - MAX_PHYSICS_BODIES + 10);
            for (const block of toCompress) {
                Phaser.Physics.Matter.Matter.Body.setStatic(block.body, true);
                block.body.label = 'static_base';
            }
        }
    }
}
