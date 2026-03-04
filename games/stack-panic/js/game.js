// Stack Panic - Core Game Scene (Pendulum, Physics, Blocks, Tilt)
// Rendering in render.js, Audio/Milestones in stages.js

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
        this.lastTapTime = 0;
        this.blockIndex = 0;
        this.droppedBlocks = [];

        // Managers
        this.milestones = new MilestoneManager();
        this.hud = new HUDManager(this);

        // Continue from rewarded ad
        if (data && data.continueGame && data.prevData) {
            this.score = data.prevData.score || 0;
            this.milestones.blocksLanded = data.prevData.blocksLanded || 0;
            this.milestones.currentMilestone = Math.floor(this.milestones.blocksLanded / 10) + 1;
            this.milestones.params = getMilestoneParams(this.milestones.currentMilestone);
            this.tilt = 0;
            this.targetTilt = 0;
            this.hud.updateScore(this.score);
            this.hud.updateMilestone(this.milestones.currentMilestone);
        }

        this._drawBackground();
        this._createPlatform();
        this._createPendulum();
        this._setupInput();
        this._setupCollisions();
        this._startIdleTimer();

        this.vignetteGraphics = this.add.graphics().setDepth(90).setScrollFactor(0);
        this.ghostGraphics = this.add.graphics().setDepth(5);
        this.firstBlockLanded = false;
    }

    _drawBackground() {
        const g = this.add.graphics();
        g.lineStyle(1, COLORS.grid, 0.2);
        for (let x = 0; x < GAME_WIDTH; x += 40) { g.moveTo(x, 0); g.lineTo(x, GAME_HEIGHT); }
        for (let y = 0; y < GAME_HEIGHT; y += 40) { g.moveTo(0, y); g.lineTo(GAME_WIDTH, y); }
        g.strokePath();
    }

    _createPlatform() {
        this.platform = this.matter.add.rectangle(
            GAME_WIDTH / 2, PLATFORM_Y + PLATFORM_HEIGHT / 2,
            PLATFORM_WIDTH, PLATFORM_HEIGHT,
            { isStatic: true, friction: 0.9, label: 'platform' }
        );
        this.platformVis = this.add.graphics();
        this.platformVis.fillStyle(COLORS.platform);
        this.platformVis.fillRoundedRect(GAME_WIDTH / 2 - PLATFORM_WIDTH / 2, PLATFORM_Y, PLATFORM_WIDTH, PLATFORM_HEIGHT, 4);
        this.platformVis.fillStyle(COLORS.platformHighlight);
        this.platformVis.fillRoundedRect(GAME_WIDTH / 2 - PLATFORM_WIDTH / 2, PLATFORM_Y, PLATFORM_WIDTH, 5, 2);
    }

    _createPendulum() {
        this.pendulumAngle = 0;
        this.pendulumSpeed = this.milestones.params.pendulumSpeed;
        this.pendulumTime = 0;
        this.swingBlock = null;
        this.pendulumGraphics = this.add.graphics().setDepth(10);
        this._spawnSwingBlock();
    }

    _spawnSwingBlock() {
        if (this.gameOver) return;
        const variant = this.milestones.getBlockVariant();
        const color = getBlockColor(this.blockIndex);
        const body = this.matter.add.rectangle(
            PENDULUM_PIVOT_X, PENDULUM_PIVOT_Y + PENDULUM_ARM_LENGTH,
            variant.width, variant.height,
            { isStatic: false, friction: 0.8, restitution: 0.05, frictionAir: 0.01, label: 'block_' + this.blockIndex,
              collisionFilter: { group: -1, mask: 0 } }
        );
        this.swingBlock = { body, width: variant.width, height: variant.height, color, index: this.blockIndex, irregular: variant.irregular };
        this.blockIndex++;
    }

    _setupInput() {
        this.input.on('pointerdown', () => {
            if (this.gameOver || this.paused) return;
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
                    if (otherLabel === 'platform' || otherLabel.startsWith('block_') || otherLabel === 'static_base') {
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

        block.body.collisionFilter.mask = 0xFFFFFFFF;
        block.body.collisionFilter.group = 0;
        Phaser.Physics.Matter.Matter.Body.setVelocity(block.body, { x: 0, y: 0 });

        this.droppedBlocks.push({
            body: block.body, width: block.width, height: block.height,
            color: block.color, settled: false, index: block.index
        });

        const pos = block.body.position;
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
        const overhang = Math.abs(pos.x - towerCenterX) - (PLATFORM_WIDTH / 2 - blockData.width / 2);
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

        const milestoneChanged = this.milestones.onBlockLanded(quality);
        if (milestoneChanged) {
            this.hud.showMilestoneBanner(this.milestones.currentMilestone);
            audioManager.play('milestone');
            this.pendulumSpeed = this.milestones.params.pendulumSpeed;
        }

        if (quality === 'perfect') this.targetTilt = Math.max(0, this.targetTilt - this.milestones.params.tiltRecovery);
        else if (quality === 'great') this.targetTilt = Math.max(0, this.targetTilt - this.milestones.params.tiltRecovery * 0.5);

        this.score += points;
        this.hud.updateScore(this.score);
        this.hud.updateStreak(this.perfectStreak);
        this.hud.updateMilestone(this.milestones.currentMilestone);

        JuiceEffects.landingJuice(this, quality, pos, points, blockData);
        if (!this.firstBlockLanded) { this.firstBlockLanded = true; JuiceEffects.firstBlockImpact(this, pos); }
        if (this.milestones.applyEarthquake(this)) audioManager.play('earthquake');
        this._compressBodies();
    }

    onMiss(pos) {
        this.noMissStreak = 0;
        this.perfectStreak = 0;
        this.hud.updateStreak(0);
        this.targetTilt = Math.min(TILT_MAX, this.targetTilt + TILT_PER_MISS);
        JuiceEffects.missJuice(this, pos);
        if (this.milestones.onMiss()) this._triggerGameOver();
    }

    _triggerGameOver() {
        if (this.gameOver) return;
        this.gameOver = true;
        JuiceEffects.collapseJuice(this);
        this.time.delayedCall(1200, () => {
            this.matter.world.engine.timing.timeScale = 1;
            this.scene.start('GameOverScene', {
                score: this.score, blocksLanded: this.milestones.blocksLanded,
                milestone: this.milestones.currentMilestone, tilt: this.tilt
            });
        });
    }

    _startIdleTimer() { this._resetIdleTimer(); }

    _resetIdleTimer() {
        if (this.idleTimer) this.idleTimer.remove();
        this.idleTimer = this.time.delayedCall(IDLE_DROP_TIMEOUT, () => {
            if (!this.gameOver && this.swingBlock) this._dropBlock();
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
        if (this.gameOver || this.paused) return;
        const dt = delta / 1000;

        if (this.swingBlock) {
            this.pendulumTime += dt * this.pendulumSpeed;
            const windDrift = this.milestones.getWindDrift();
            this.pendulumAngle = Math.sin(this.pendulumTime) * PENDULUM_MAX_ANGLE;
            const px = PENDULUM_PIVOT_X + Math.sin(this.pendulumAngle) * PENDULUM_ARM_LENGTH + windDrift;
            const py = PENDULUM_PIVOT_Y + Math.cos(this.pendulumAngle) * PENDULUM_ARM_LENGTH;
            Phaser.Physics.Matter.Matter.Body.setPosition(this.swingBlock.body, { x: px, y: py });
            Phaser.Physics.Matter.Matter.Body.setVelocity(this.swingBlock.body, { x: 0, y: 0 });
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
