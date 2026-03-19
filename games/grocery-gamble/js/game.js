// Grocery Gamble - Core Game Scene
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.gameOver = false;
        this.stageTransitioning = false;
        this.isDragging = false;
        this.dragItem = null;
        this.idleTimer = 0;
        this.lastInputTime = Date.now();
        this.beltItems = [];
        this.beltOffset = 0;
        this.needleY = 0;
        this.needleTargetY = 0;
        this.hitStopped = false;

        const w = GAME_WIDTH, h = GAME_HEIGHT;

        // Background
        this.add.rectangle(w / 2, h / 2, w, h, COLORS.background);

        // Belt area
        this.add.rectangle(100, 200, 200, 160, COLORS.beltDark, 0.3).setDepth(1);
        this.beltLines = [];
        for (let i = 0; i < 6; i++) {
            const line = this.add.rectangle(i * 40, 200, 2, 140, COLORS.secondary).setDepth(2);
            this.beltLines.push(line);
        }
        this.add.text(100, 128, 'CONVEYOR', {
            fontSize: '10px', fontFamily: 'Arial', fontStyle: 'bold', color: HEX.secondary
        }).setOrigin(0.5).setDepth(3);

        // Scale platform
        if (this.textures.exists('scale')) {
            this.scalePlatform = this.add.image(170, 440, 'scale').setDepth(3);
        } else {
            this.scalePlatform = this.add.rectangle(170, 440, 180, 60, COLORS.secondary).setDepth(3);
        }
        this.scaleZone = new Phaser.Geom.Rectangle(80, 410, 180, 60);

        // Weight meter
        this.add.rectangle(310, 230, 36, 200, COLORS.uiBg).setDepth(2);
        this.add.rectangle(310, 230, 36, 200, 0xBDC3C7, 0).setStrokeStyle(1, 0xBDC3C7).setDepth(2);
        this.greenZone = this.add.rectangle(310, 230, 32, 40, COLORS.primary, 0.7).setDepth(3);
        this.needle = this.add.rectangle(310, 230, 40, 3, COLORS.danger).setDepth(4);
        this.add.text(310, 125, 'HEAVY', { fontSize: '8px', fontFamily: 'Arial', color: HEX.secondary }).setOrigin(0.5).setDepth(3);
        this.add.text(310, 335, 'LIGHT', { fontSize: '8px', fontFamily: 'Arial', color: HEX.secondary }).setOrigin(0.5).setDepth(3);

        // Cashier
        if (this.textures.exists('cashier_normal')) {
            this.cashier = this.add.image(330, 430, 'cashier_normal').setScale(0.8).setDepth(2);
        } else {
            this.cashier = this.add.rectangle(330, 430, 40, 60, COLORS.cashierSkin).setDepth(2);
        }

        // Display texts
        this.scaleDisplay = this.add.text(170, 420, '', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#1ABC9C'
        }).setOrigin(0.5).setDepth(5);
        this.itemLabel = this.add.text(100, 290, '', {
            fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', color: HEX.text
        }).setOrigin(0.5).setDepth(5);
        this.stageClearText = this.add.text(w / 2, h / 2, '', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: HEX.primary
        }).setOrigin(0.5).setDepth(20).setAlpha(0);

        // Pause button
        const pauseBtn = this.add.text(w - 25, 75, '||', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: HEX.text
        }).setOrigin(0.5).setDepth(15).setInteractive();
        pauseBtn.on('pointerdown', () => this.togglePause());

        // Pause overlay
        this.pauseOverlay = this.add.container(0, 0).setDepth(30).setVisible(false);
        this.createPauseOverlay();

        // Input handlers
        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerup', this.onPointerUp, this);

        // Visibility
        this.visHandler = () => { if (document.hidden && !this.gameOver) this.togglePause(); };
        document.addEventListener('visibilitychange', this.visHandler);

        // Particle refs
        this.particleGold = this.textures.exists('particle') ? 'particle' : null;
        this.particleRed = this.textures.exists('particle_red') ? 'particle_red' : null;

        // Load first stage
        this.loadStage(GameState.stage);
    }

    createPauseOverlay() {
        const w = GAME_WIDTH, h = GAME_HEIGHT;
        const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);
        const title = this.add.text(w / 2, 200, 'PAUSED', {
            fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);

        const btns = [
            { y: 300, label: 'RESUME', color: COLORS.primary, action: () => this.togglePause() },
            { y: 360, label: 'RESTART', color: COLORS.amber, action: () => {
                GameState.reset();
                this.scene.stop('HUDScene'); this.scene.stop('GameScene');
                this.scene.start('GameScene'); this.scene.start('HUDScene');
            }},
            { y: 420, label: 'HELP (?)', color: 0x3498DB, action: () => {
                this.scene.pause('GameScene'); this.scene.pause('HUDScene');
                this.scene.launch('HelpScene', { returnTo: 'GameScene' });
            }},
            { y: 480, label: 'MENU', color: 0x555555, action: () => {
                this.scene.stop('HUDScene'); this.scene.stop('GameScene');
                this.scene.start('MenuScene');
            }}
        ];

        const elements = [bg, title];
        btns.forEach(b => {
            const rect = this.add.rectangle(w / 2, b.y, 200, 45, b.color).setInteractive();
            const txt = this.add.text(w / 2, b.y, b.label, {
                fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
            }).setOrigin(0.5);
            rect.on('pointerdown', b.action);
            elements.push(rect, txt);
        });
        this.pauseOverlay.add(elements);
    }

    togglePause() {
        this.pauseOverlay.setVisible(!this.pauseOverlay.visible);
        this.paused = this.pauseOverlay.visible;
    }

    loadStage(stageNum) {
        this.stageTransitioning = false;
        this.currentStage = generateStage(stageNum);
        this.stageItems = [...this.currentStage.items];
        this.itemsHandled = 0;
        this.totalItems = this.stageItems.length;
        this.stageAlarmsThisStage = 0;

        this.beltItems.forEach(bi => { if (bi.sprite) bi.sprite.destroy(); });
        this.beltItems = [];
        this.spawnNextItem();

        const meterHeight = 200;
        const zoneHeight = Math.max(12, (this.currentStage.windowPercent / 50) * meterHeight);
        this.greenZone.setSize(32, zoneHeight);
    }

    spawnNextItem() {
        if (this.stageItems.length === 0) return;
        const itemData = this.stageItems.shift();

        let sprite;
        if (this.textures.exists(itemData.key)) {
            sprite = this.add.image(350, 200, itemData.key).setDepth(6).setInteractive();
        } else {
            sprite = this.add.rectangle(350, 200, 40, 40, COLORS.amber).setDepth(6).setInteractive();
        }

        sprite.itemData = itemData;
        sprite.onBelt = true;

        if (itemData.isRush) {
            sprite.rushIndicator = this.add.rectangle(350, 200, 55, 55, 0x000000, 0)
                .setStrokeStyle(3, COLORS.danger).setDepth(5);
            this.tweens.add({ targets: sprite.rushIndicator, alpha: 0, duration: 400, yoyo: true, repeat: -1 });
        }

        this.beltItems.push({ sprite, data: itemData });
        this.positionGreenZone(itemData.targetWeight);
        this.itemLabel.setText(itemData.label + (itemData.isFragile ? ' [FRAGILE]' : ''));
    }

    positionGreenZone(targetWeight) {
        const meterTop = 130, meterBottom = 330, range = 700;
        const normalizedY = meterTop + ((1 - targetWeight / range) * (meterBottom - meterTop));
        this.greenZone.setY(Phaser.Math.Clamp(normalizedY, meterTop, meterBottom));
        this.greenZoneCenter = this.greenZone.y;
    }

    removeItem(sprite, data) {
        if (data.isRush && sprite.rushIndicator) sprite.rushIndicator.destroy();
        sprite.destroy();
        this.beltItems = this.beltItems.filter(bi => bi.sprite !== sprite);
        this.itemsHandled++;

        if (this.itemsHandled >= this.totalItems && !this.stageTransitioning) {
            this.stageComplete();
        } else if (this.stageItems.length > 0) {
            this.time.delayedCall(300, () => this.spawnNextItem());
        }
    }

    stageComplete() {
        if (this.stageTransitioning || this.gameOver) return;
        this.stageTransitioning = true;

        let bonus = 0;
        if (this.stageAlarmsThisStage === 0) bonus += SCORING.noAlarmStage;
        if (GameState.suspicion <= 0) bonus += SCORING.zeroSuspicionStage;
        if (bonus > 0) {
            GameState.score += bonus;
            this.events.emit('updateScore');
            this.events.emit('floatScore', { x: GAME_WIDTH / 2, y: 300, value: bonus });
        }

        this.stageClearText.setText('STAGE ' + GameState.stage + ' CLEARED!');
        this.stageClearText.setAlpha(1);
        this.tweens.add({
            targets: this.stageClearText, scaleX: 1.2, scaleY: 1.2, duration: 300, yoyo: true,
            hold: 400, onComplete: () => {
                this.stageClearText.setAlpha(0).setScale(1);
                GameState.stage++;
                this.events.emit('updateStage');
                this.loadStage(GameState.stage);
            }
        });
    }

    triggerBeltOverflow() { this.triggerGameOver('overflow'); }

    update(time, delta) {
        if (this.gameOver || this.paused || this.hitStopped) return;

        // Belt animation
        this.beltOffset = (this.beltOffset + delta * 0.05) % 40;
        this.beltLines.forEach((line, i) => { line.setX(((i * 40) - this.beltOffset + 240) % 240); });

        // Needle
        this.needle.setY(Phaser.Math.Linear(this.needle.y, this.needleTargetY, 0.1));
        if (this.currentStage && this.currentStage.needleDrift > 0) {
            this.needle.setY(this.needle.y + this.currentStage.needleDrift * Math.sin(time * 0.003));
        }

        // Suspicion drain
        if (GameState.suspicion > 0) {
            GameState.suspicion = Math.max(0, GameState.suspicion - SUSPICION_DRAIN_RATE * delta / 1000);
            this.events.emit('updateSuspicion');
        }

        // Belt overflow
        if (this.beltItems.length > 0 && !this.isDragging && !this.stageTransitioning) {
            this.idleTimer += delta;
            if (this.idleTimer > OVERFLOW_WARNING) {
                this.events.emit('showOverflow', Math.ceil((OVERFLOW_THRESHOLD - this.idleTimer) / 1000));
            }
            if (this.idleTimer >= OVERFLOW_THRESHOLD && !this.stageTransitioning) {
                this.stageTransitioning = true;
                this.triggerBeltOverflow();
            }
        } else if (this.idleTimer > 0) {
            this.idleTimer = 0;
            this.events.emit('showOverflow', 0);
        }

        // Rush items
        this.beltItems.forEach(bi => {
            if (bi.data.isRush && bi.sprite && bi.sprite.onBelt) {
                bi.data.rushTimer -= delta;
                if (bi.data.rushTimer <= 0) {
                    this.triggerAlarm(bi.sprite);
                    this.removeItem(bi.sprite, bi.data);
                }
            }
        });

        // Inactivity death
        if (Date.now() - this.lastInputTime > INACTIVITY_DEATH && !this.gameOver) {
            this.triggerGameOver('busted');
        }

        // Suspicion game over
        if (GameState.suspicion >= 100 && !this.gameOver) {
            this.triggerGameOver('busted');
        }

        this.updateCashierExpression();
    }

    shutdown() {
        this.tweens.killAll();
        this.time.removeAllEvents();
        document.removeEventListener('visibilitychange', this.visHandler);
    }
}

// Mix in input and render methods
Object.assign(GameScene.prototype, InputMixin, RenderMixin);
