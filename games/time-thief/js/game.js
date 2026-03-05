// game.js - Core gameplay: timer, obstacles, movement, state, death
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        const w = this.cameras.main.width, h = this.cameras.main.height;
        this.gameWidth = w;
        this.gameHeight = h;
        this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A1A);

        // State
        this.timer = TIMER.start;
        this.drainRate = TIMER.drain;
        this.score = 0;
        this.stage = 1;
        this.stealCount = 0;
        this.chain = 0;
        this.totalStolen = 0;
        this.wallWidth = 0;
        this.isDead = false;
        this.isPaused = false;
        this.isDodging = false;
        this.lastInputTime = 0;
        this.inactivityActive = false;
        this.obstacles = [];
        this.spawnTimer = 0;
        this.afterBoss = 0;
        this.revived = false;
        this.playRight = w;

        // Player
        this.playerBaseY = h * 0.5;
        this.player = this.add.image(60, this.playerBaseY, 'player').setScale(1.1);

        // Wall visual
        this.wallGfx = this.add.rectangle(w, h / 2, 0, h, 0x2D1B69, 0.7).setOrigin(1, 0.5);

        // Stage queue
        this.stageQueue = generateObstacleQueue(this.stage, 10);
        this.queueIdx = 0;
        this.params = getDifficultyParams(this.stage);

        // Input via InputHandler
        InputHandler.init(this);
        this.lastInputTime = this.time.now;

        // Launch HUD
        this.scene.launch('UIScene');

        // Pause group holder
        this.pauseGroup = null;

        // Visibility handler
        this._visHandler = () => {
            if (document.hidden && !this.isDead && !this.isPaused) this.pauseGame();
        };
        document.addEventListener('visibilitychange', this._visHandler);
    }

    update(time, delta) {
        if (this.isDead || this.isPaused) return;
        const dt = delta / 1000;

        // Inactivity
        const idleTime = (time - this.lastInputTime) / 1000;
        if (idleTime >= TIMER.inactivityDelay) {
            this.drainRate = TIMER.inactivityDrain;
            this.inactivityActive = true;
        } else {
            this.drainRate = TIMER.drain;
            this.inactivityActive = false;
        }

        // Drain timer
        this.timer -= dt * this.drainRate;
        if (this.timer <= 0) { this.timer = 0; this.die(); return; }

        // Crush death
        if (this.wallWidth >= this.gameWidth * (1 - WALL.crushThreshold)) {
            this.die(); return;
        }

        // Spawn obstacles
        this.spawnTimer -= delta;
        if (this.spawnTimer <= 0 && this.queueIdx < this.stageQueue.length) {
            this._spawnNext();
            this.spawnTimer = this.params.spawnInterval;
        }

        // Move obstacles
        const speed = this.params.speed * dt;
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            if (!obs || !obs.scene) { this.obstacles.splice(i, 1); continue; }
            obs.x -= speed;
            if (obs.label) { obs.label.x = obs.x; obs.label.y = obs.y; }
            if (obs.pips) obs.pips.forEach((p, j) => {
                p.x = obs.x - 12 + j * 12; p.y = obs.y + 28;
            });

            // Passed player without steal
            if (obs.x < 30 && !obs.obstacleData.stolen && !obs.obstacleData.passed) {
                obs.obstacleData.passed = true;
                if (obs.obstacleData.type !== 'bomb') {
                    this._onMiss(obs);
                }
            }

            // Remove offscreen
            if (obs.x < -60) {
                this.destroyObstacle(obs);
                this.obstacles.splice(i, 1);
            }
        }

        // Update HUD
        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.updateHUD) {
            uiScene.updateHUD({
                timer: this.timer, stage: this.stage,
                chain: this.chain, score: this.score
            });
        }
    }

    _spawnNext() {
        if (this.queueIdx >= this.stageQueue.length) return;
        const data = this.stageQueue[this.queueIdx];
        const y = Phaser.Math.Between(this.gameHeight * 0.2, this.gameHeight * 0.75);
        const x = this.playRight + 30;
        const obs = createObstacleSprite(this, data, x, y);
        this.obstacles.push(obs);
        this.queueIdx++;
    }

    _onMiss(obs) {
        this.wallWidth += this.params.wallGrowth;
        this.playRight = this.gameWidth - this.wallWidth;
        this.wallGfx.width = this.wallWidth;
        this.chain = 0;
        Effects.comboGlow(this, this.player, 0);
    }

    hitStop(ms) {
        const savedSpeed = this.params.speed;
        this.params.speed = 0;
        setTimeout(() => { this.params.speed = savedSpeed; }, ms);
    }

    stageClear() {
        this.stealCount = 0;
        this.stage++;
        this.score += SCORING.stageClearBase * (this.stage - 1);
        this.params = getDifficultyParams(this.stage);

        Effects.floatingText(this, this.gameWidth / 2, this.gameHeight * 0.35,
            `Stage ${this.stage}!`, '#00F5FF');
        Effects.screenShake(this, 0.004, 150);

        if (this.afterBoss > 0) {
            this.stageQueue = [...generateRestBeat(), ...generateObstacleQueue(this.stage, 7)];
            this.afterBoss = 0;
        } else {
            this.stageQueue = generateObstacleQueue(this.stage, 10);
        }
        this.queueIdx = 0;
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        Effects.deathShake(this);
        Effects.deathRedFlash(this, () => {
            setTimeout(() => {
                this.scene.stop('UIScene');
                this.scene.start('GameOverScene', {
                    score: this.score, stage: this.stage,
                    totalStolen: this.totalStolen
                });
            }, 400);
        });
    }

    destroyObstacle(obs) {
        if (obs.label) obs.label.destroy();
        if (obs.pips) obs.pips.forEach(p => p.destroy());
        obs.destroy();
    }

    pauseGame() {
        if (this.isPaused || this.isDead) return;
        this.isPaused = true;
        this._showPause();
    }

    _showPause() {
        const w = this.gameWidth, h = this.gameHeight;
        this.pauseGroup = this.add.group();
        const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
            .setDepth(100).setInteractive();
        this.pauseGroup.add(bg);

        const items = [
            { y: h * 0.35, text: 'RESUME', cb: () => this._resumeGame() },
            { y: h * 0.45, text: 'HELP', cb: () => {
                this.scene.pause();
                this.scene.launch('HelpScene', { returnTo: 'GameScene' });
            }},
            { y: h * 0.55, text: 'RESTART', cb: () => {
                this._clearPause(); this.scene.stop('UIScene'); this.scene.restart();
            }},
            { y: h * 0.65, text: 'MENU', cb: () => {
                this._clearPause(); this.scene.stop('UIScene'); this.scene.start('MenuScene');
            }}
        ];
        items.forEach(item => {
            const btn = this.add.rectangle(w / 2, item.y, 160, 40, 0x0A0A1A)
                .setStrokeStyle(2, 0x00F5FF).setDepth(101).setInteractive({ useHandCursor: true });
            const txt = this.add.text(w / 2, item.y, item.text, {
                fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00F5FF'
            }).setOrigin(0.5).setDepth(102).disableInteractive();
            btn.on('pointerdown', item.cb);
            this.pauseGroup.add(btn);
            this.pauseGroup.add(txt);
        });
    }

    _resumeGame() {
        this._clearPause();
        this.isPaused = false;
        this.lastInputTime = this.time.now;
    }

    _clearPause() {
        if (this.pauseGroup) {
            this.pauseGroup.clear(true, true);
            this.pauseGroup = null;
        }
    }

    shutdown() {
        document.removeEventListener('visibilitychange', this._visHandler);
    }
}
