// game.js - Core gameplay scene

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.BG);
        this.score = 0;
        this.stageNumber = 1;
        this.streak = 0;
        this.nextExpected = 1;
        this.timerMs = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.stageTransitioning = false;
        this.wrongTaps = 0;
        this.lastColorCategory = -1;
        this.sameColorRun = 0;
        this.freezeActive = false;
        this.freezeTimer = null;
        this.continueUsed = false;
        this.tileSprites = [];
        this.tileTexts = [];
        this.particles = [];

        AdsManager.resetRun();
        this.createHUD();
        this.loadStage(this.stageNumber);

        // Visibility change handler
        this._visHandler = () => {
            if (document.hidden && !this.isGameOver) this.pauseGame();
        };
        document.addEventListener('visibilitychange', this._visHandler);
    }

    createHUD() {
        const cx = CANVAS_WIDTH / 2;
        // Background bar
        this.add.rectangle(cx, 28, CANVAS_WIDTH, 56, 0x0A1628, 0.9).setDepth(100);

        this.scoreText = this.add.text(10, 12, 'SCORE: ' + String(this.score).padStart(6, '0'), {
            fontFamily: FONT_FAMILY, fontSize: '16px', color: COLORS.HUD_ACCENT
        }).setDepth(101);

        this.stageText = this.add.text(cx, 12, '\u2605 STAGE ' + this.stageNumber, {
            fontFamily: FONT_FAMILY, fontSize: '14px', color: COLORS.HUD_TEXT
        }).setOrigin(0.5, 0).setDepth(101);

        // Pause button
        const pauseZone = this.add.zone(CANVAS_WIDTH - 30, 28, 50, 50).setDepth(102)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.pauseGame());
        this.add.text(CANVAS_WIDTH - 30, 28, 'II', {
            fontFamily: FONT_FAMILY, fontSize: '18px', color: COLORS.CYAN
        }).setOrigin(0.5).setDepth(101);

        // Timer bar background
        this.add.rectangle(cx, 68, CANVAS_WIDTH - 20, 10, 0x112233).setDepth(100);
        this.timerBar = this.add.rectangle(10, 63, CANVAS_WIDTH - 20, 10, 0x00E5FF).setOrigin(0, 0).setDepth(101);

        this.add.text(CANVAS_WIDTH - 14, 80, 'SECURITY BREACH TIMER', {
            fontFamily: FONT_FAMILY, fontSize: '8px', color: '#556677'
        }).setOrigin(1, 0).setDepth(100);

        // Streak display
        this.streakText = this.add.text(cx, 96, '', {
            fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.STREAK_HOT
        }).setOrigin(0.5).setDepth(101).setAlpha(0);

        // Modifier badge
        this.modifierText = this.add.text(cx, 120, '', {
            fontFamily: FONT_FAMILY, fontSize: '13px', color: COLORS.PURPLE
        }).setOrigin(0.5).setDepth(101);

        // Hint text (stages 1-4)
        this.hintText = this.add.text(cx, CANVAS_HEIGHT - 60, '', {
            fontFamily: FONT_FAMILY, fontSize: '15px', color: COLORS.CYAN
        }).setOrigin(0.5).setDepth(50);
    }

    loadStage(stageNum) {
        // Clear old tiles
        this.tileSprites.forEach(s => { if (s && s.sprite) s.sprite.destroy(); if (s && s.text) s.text.destroy(); });
        this.tileSprites = [];
        this.tileTexts = [];

        const { tiles, params, layout } = generateGrid(stageNum);
        this.stageParams = params;
        this.timerMs = params.timeBudget;
        this.nextExpected = 1;
        this.wrongTaps = 0;
        this.lastColorCategory = -1;
        this.sameColorRun = 0;
        this.stageTransitioning = false;

        // Update HUD
        this.stageText.setText('\u2605 STAGE ' + stageNum);
        this.updateTimerBar();
        this.updateStreakDisplay();

        // Show modifiers
        if (params.modifiers.length > 0) {
            this.modifierText.setText(params.modifiers.join(' + ')).setAlpha(1);
            this.tweens.add({ targets: this.modifierText, alpha: 0, duration: 2000, delay: 1500 });
        } else {
            this.modifierText.setText('');
        }

        // Hint for stages 1-4
        if (stageNum <= 4) {
            this.hintText.setText('NEXT: 1').setAlpha(1);
        } else {
            this.hintText.setAlpha(0);
        }

        // Rest stage indicator
        if (params.isRest) {
            const restText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50, 'VAULT SECURED', {
                fontFamily: FONT_FAMILY, fontSize: '20px', color: '#FFD700'
            }).setOrigin(0.5).setDepth(200);
            this.tweens.add({ targets: restText, alpha: 0, y: restText.y - 40, duration: 800, delay: 400, onComplete: () => restText.destroy() });
        }

        // Challenge stage indicator
        if (params.isChallenge) {
            const chalText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50, 'CHALLENGE STAGE', {
                fontFamily: FONT_FAMILY, fontSize: '22px', color: '#FFD700'
            }).setOrigin(0.5).setDepth(200);
            this.tweens.add({ targets: chalText, alpha: 0, y: chalText.y - 40, duration: 1000, delay: 600, onComplete: () => chalText.destroy() });
        }

        // Create tile sprites with stagger animation
        tiles.forEach((tile, index) => {
            const texKey = tile.isPowerTile ? 'tilePower' : TILE_TEXTURE_BY_COLOR[tile.colorCategory];
            const sprite = this.add.image(tile.x + tile.tileSize / 2, tile.y + tile.tileSize / 2, texKey)
                .setDisplaySize(tile.tileSize, tile.tileSize).setDepth(10)
                .setInteractive({ useHandCursor: true }).setAlpha(0);

            sprite.tileData = tile;
            sprite.on('pointerdown', () => this.onTileTap(sprite));

            // Number or icon text
            let displayStr = '';
            if (tile.isPowerTile) {
                displayStr = POWER_ICONS[tile.powerType] || '\u26A1';
            } else if (tile.isFaceDown) {
                displayStr = '?';
            } else if (tile.isDecoy) {
                displayStr = String(tile.decoyNumber);
            } else {
                displayStr = String(tile.number);
            }

            const numText = this.add.text(tile.x + tile.tileSize / 2, tile.y + tile.tileSize / 2, displayStr, {
                fontFamily: FONT_FAMILY, fontSize: tile.tileSize > 65 ? '22px' : '18px',
                color: tile.isPowerTile ? COLORS.POWER_GOLD : CATEGORY_COLORS[tile.colorCategory],
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(11).setAlpha(0);

            // Stagger entrance
            this.tweens.add({ targets: [sprite, numText], alpha: 1, scale: { from: 0.5, to: 1 }, duration: 200, delay: index * 40, ease: 'Back.easeOut' });

            // Reveal ghost tiles after 1.2s
            if (tile.isFaceDown) {
                this.time.delayedCall(1200, () => {
                    if (!tile.isTapped) {
                        numText.setText(String(tile.number));
                        tile.isFaceDown = false;
                    }
                });
            }

            this.tileSprites.push({ sprite, text: numText, tileData: tile });
        });
    }

    onTileTap(sprite) {
        if (this.isGameOver || this.isPaused || this.stageTransitioning) return;
        const tile = sprite.tileData;
        if (!tile || tile.isTapped) return;

        // Resume audio context on first interaction
        if (SoundManager.ctx && SoundManager.ctx.state === 'suspended') SoundManager.ctx.resume();

        // Power tile - always activatable
        if (tile.isPowerTile) {
            tile.isTapped = true;
            this.activatePowerTile(tile, sprite);
            return;
        }

        // Decoy tile - counts as wrong tap
        if (tile.isDecoy && tile.number !== this.nextExpected) {
            this.onWrongTap(sprite, tile);
            return;
        }

        if (tile.number === this.nextExpected) {
            this.onCorrectTap(sprite, tile);
        } else {
            this.onWrongTap(sprite, tile);
        }
    }

    onCorrectTap(sprite, tile) {
        tile.isTapped = true;
        this.streak++;
        const streakLevel = this.getStreakLevel();
        const multiplier = STREAK_MULTIPLIERS[streakLevel];

        // Score calculation
        let points = Math.floor(SCORE_VALUES.correctTap * multiplier);
        let bonusText = '';

        // Same-color chain bonus
        if (tile.colorCategory === this.lastColorCategory) {
            this.sameColorRun++;
            const colorBonus = Math.floor(SCORE_VALUES.sameColorBonus * multiplier);
            points += colorBonus;
            bonusText = ' +' + SCORE_VALUES.sameColorBonus + ' CHAIN';
        } else {
            this.sameColorRun = 1;
        }
        this.lastColorCategory = tile.colorCategory;

        this.score += points;
        this.timerMs = Math.min(this.timerMs + this.stageParams.refill, this.stageParams.timeBudget);
        this.nextExpected++;

        // Update HUD
        this.scoreText.setText('SCORE: ' + String(this.score).padStart(6, '0'));
        this.tweens.add({ targets: this.scoreText, scaleX: 1.35, scaleY: 1.35, duration: 80, yoyo: true });
        this.updateStreakDisplay();

        // Hint update
        if (this.stageNumber <= 4) {
            this.hintText.setText('NEXT: ' + this.nextExpected);
        }

        // Juice: screen shake
        const shakeIntensity = streakLevel >= 3 ? 0.004 : 0.002;
        this.cameras.main.shake(80, shakeIntensity);

        // Juice: shard particles
        this.spawnShards(sprite.x, sprite.y, CATEGORY_COLORS[tile.colorCategory], 8 + streakLevel * 2);

        // Juice: floating score text
        const scoreColor = streakLevel >= 2 ? COLORS.STREAK_GOD : COLORS.GREEN;
        const floatStr = '+' + points + (multiplier > 1 ? ' x' + multiplier : '');
        this.spawnFloatingText(sprite.x, sprite.y, floatStr, scoreColor, '18px');
        if (bonusText) {
            this.spawnFloatingText(sprite.x, sprite.y + 20, bonusText, CATEGORY_COLORS[tile.colorCategory], '14px');
        }

        // Sound
        SoundManager.playCorrectTap(streakLevel);

        // Haptic
        if (navigator.vibrate) navigator.vibrate(30);

        // Remove tile
        this.removeTile(sprite, tile);

        // Hit-stop (use setTimeout, not delayedCall)
        // Not using physics, so just brief visual pause effect

        // Check stage clear
        const remaining = this.tileSprites.filter(t => t.tileData && !t.tileData.isTapped && !t.tileData.isPowerTile);
        if (remaining.length === 0) {
            this.onStageClear();
        }
    }

    onWrongTap(sprite, tile) {
        // Flash red
        sprite.setTint(0xFF1744);
        this.time.delayedCall(120, () => { if (sprite.active) sprite.clearTint(); });

        // Scale recoil
        this.tweens.add({ targets: sprite, scaleX: 0.85, scaleY: 0.85, duration: 60, yoyo: true });

        // Timer penalty
        this.timerMs -= this.stageParams.wrongPenalty;

        // Reset streak
        this.streak = 0;
        this.sameColorRun = 0;
        this.lastColorCategory = -1;
        this.updateStreakDisplay();

        // Shake
        this.cameras.main.shake(150, 0.005);

        // Floating penalty text
        this.spawnFloatingText(CANVAS_WIDTH / 2, 68, '-1.5s', COLORS.ERROR_RED, '16px');

        SoundManager.playWrongTap();
        if (navigator.vibrate) navigator.vibrate([50, 20, 50]);

        // Check timer
        if (this.timerMs <= 0) {
            this.timerMs = 0;
            this.onTimerExpired();
        }
    }

    activatePowerTile(tile, sprite) {
        this.removeTile(sprite, tile);

        switch (tile.powerType) {
            case 'bomb':
                SoundManager.playBomb();
                this.cameras.main.shake(150, 0.006);
                // Find 4 nearest untapped non-power tiles
                const remaining = this.tileSprites.filter(t => t.tileData && !t.tileData.isTapped && !t.tileData.isPowerTile);
                const sorted = remaining.sort((a, b) => {
                    const da = Math.abs(a.tileData.gridRow - tile.gridRow) + Math.abs(a.tileData.gridCol - tile.gridCol);
                    const db = Math.abs(b.tileData.gridRow - tile.gridRow) + Math.abs(b.tileData.gridCol - tile.gridCol);
                    return da - db;
                });
                const toClear = sorted.slice(0, 4);
                let bombPoints = SCORE_VALUES.bombActivate;
                toClear.forEach(t => {
                    t.tileData.isTapped = true;
                    bombPoints += SCORE_VALUES.bombPerTile;
                    this.spawnShards(t.sprite.x, t.sprite.y, CATEGORY_COLORS[t.tileData.colorCategory], 6);
                    this.tweens.add({ targets: [t.sprite, t.text], alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 200, onComplete: () => { t.sprite.destroy(); t.text.destroy(); } });
                    // Adjust nextExpected if needed
                });
                this.score += bombPoints;
                this.scoreText.setText('SCORE: ' + String(this.score).padStart(6, '0'));
                this.spawnFloatingText(sprite.x, sprite.y, '+' + bombPoints + ' BOMB', COLORS.POWER_GOLD, '20px');
                // Recalculate nextExpected after bomb clears
                this.recalcNextExpected();
                // Check clear
                const afterBomb = this.tileSprites.filter(t => t.tileData && !t.tileData.isTapped && !t.tileData.isPowerTile);
                if (afterBomb.length === 0) this.onStageClear();
                break;

            case 'freeze':
                SoundManager.playFreeze();
                this.freezeActive = true;
                this.timerBar.setFillStyle(0xB3E5FC, 0.8);
                this.spawnFloatingText(sprite.x, sprite.y, 'FREEZE 3s', '#B3E5FC', '18px');
                if (this.freezeTimer) clearTimeout(this.freezeTimer);
                this.freezeTimer = setTimeout(() => {
                    this.freezeActive = false;
                    this.freezeTimer = null;
                }, 3000);
                break;

            case 'reveal':
                SoundManager.playReveal();
                this.spawnFloatingText(sprite.x, sprite.y, 'REVEAL', COLORS.POWER_GOLD, '18px');
                this.tileSprites.forEach(t => {
                    if (t.tileData && t.tileData.isFaceDown && !t.tileData.isTapped) {
                        t.text.setText(String(t.tileData.number));
                        t.tileData.isFaceDown = false;
                    }
                });
                break;
        }
    }

    recalcNextExpected() {
        // Find the lowest untapped non-power tile number
        const untapped = this.tileSprites
            .filter(t => t.tileData && !t.tileData.isTapped && !t.tileData.isPowerTile)
            .map(t => t.tileData.number)
            .sort((a, b) => a - b);
        this.nextExpected = untapped.length > 0 ? untapped[0] : this.stageParams.tileCount + 1;
    }

    removeTile(sprite, tile) {
        const entry = this.tileSprites.find(t => t.tileData === tile);
        if (entry) {
            this.tweens.add({ targets: [entry.sprite, entry.text], alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 150, onComplete: () => {
                entry.sprite.destroy(); entry.text.destroy();
            }});
        }
    }

    onStageClear() {
        if (this.stageTransitioning) return;
        this.stageTransitioning = true;

        // Stage clear bonus
        let clearBonus = SCORE_VALUES.stageClear * this.stageNumber;
        const multiplier = STREAK_MULTIPLIERS[this.getStreakLevel()];
        clearBonus = Math.floor(clearBonus * multiplier);

        // Perfect stage bonus
        if (this.wrongTaps === 0) {
            clearBonus += SCORE_VALUES.perfectStage;
            this.spawnFloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30, '+' + SCORE_VALUES.perfectStage + ' PERFECT!', COLORS.STREAK_GOD, '24px');
        }

        // Challenge bonus
        if (this.stageParams.isChallenge) {
            clearBonus += SCORE_VALUES.challengeBonus;
        }

        this.score += clearBonus;
        this.scoreText.setText('SCORE: ' + String(this.score).padStart(6, '0'));

        // "LOCK CRACKED" text
        const isRest = this.stageParams.isRest;
        const clearLabel = isRest ? 'VAULT SECURED' : 'LOCK CRACKED';
        const clearText = this.add.text(CANVAS_WIDTH / 2, -80, clearLabel, {
            fontFamily: FONT_FAMILY, fontSize: '28px', color: COLORS.STAGE_CLEAR, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(200);

        this.tweens.add({
            targets: clearText, y: CANVAS_HEIGHT / 2 - 80, duration: 350, ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(500, () => {
                    this.tweens.add({ targets: clearText, alpha: 0, duration: 300, onComplete: () => clearText.destroy() });
                });
            }
        });

        this.spawnFloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '+' + clearBonus + ' CLEAR', COLORS.STAGE_CLEAR, '20px');

        // Grid-wide shard explosion
        this.tileSprites.forEach(t => {
            if (t.sprite && t.sprite.active) {
                this.spawnShards(t.sprite.x, t.sprite.y, CATEGORY_COLORS[t.tileData.colorCategory] || COLORS.CYAN, 4);
            }
        });

        SoundManager.playStageClear();
        this.cameras.main.shake(200, 0.004);

        // Advance to next stage after delay
        this.time.delayedCall(800, () => {
            this.stageNumber++;
            this.loadStage(this.stageNumber);
        });
    }

    onTimerExpired() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        // Death effects
        this.cameras.main.shake(350, 0.012);
        const redFlash = this.add.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT, 0xFF1744, 0.6).setDepth(300);
        this.tweens.add({ targets: redFlash, alpha: 0, duration: 250, delay: 80, onComplete: () => redFlash.destroy() });

        // Remaining tiles flash and shrink
        this.tileSprites.forEach(t => {
            if (t.sprite && t.sprite.active) {
                t.sprite.setTint(0xFF1744);
                this.tweens.add({ targets: [t.sprite, t.text], scaleX: 0.8, scaleY: 0.8, alpha: 0, duration: 300 });
            }
        });

        SoundManager.playGameOver();
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        // Save high scores
        const hs = window.loadHighScore ? window.loadHighScore() : 0;
        const isNewRecord = this.score > hs;
        if (isNewRecord && window.saveHighScore) window.saveHighScore(this.score);
        const hstg = window.loadHighStage ? window.loadHighStage() : 0;
        if (this.stageNumber > hstg && window.saveHighStage) window.saveHighStage(this.stageNumber);

        AdsManager.onGameOver();

        // Show game over after 500ms
        this.time.delayedCall(500, () => {
            this.showGameOver(isNewRecord);
        });
    }

    showGameOver(isNewRecord) {
        const cx = CANVAS_WIDTH / 2;
        const overlay = this.add.container(0, 0).setDepth(400);

        overlay.add(this.add.rectangle(cx, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT, 0x050A0F, 0.95));

        // SYSTEM LOCKOUT
        const lockoutText = this.add.text(cx, 200, 'SYSTEM\nLOCKOUT', {
            fontFamily: FONT_FAMILY, fontSize: '36px', color: COLORS.GAME_OVER, align: 'center', fontStyle: 'bold'
        }).setOrigin(0.5);
        overlay.add(lockoutText);

        overlay.add(this.add.text(cx, 270, 'SECURITY BREACH DETECTED', {
            fontFamily: FONT_FAMILY, fontSize: '12px', color: '#556677'
        }).setOrigin(0.5).setAlpha(0));

        // Score
        overlay.add(this.add.text(cx, 320, 'SCORE: ' + String(this.score).padStart(6, '0'), {
            fontFamily: FONT_FAMILY, fontSize: '26px', color: COLORS.CYAN
        }).setOrigin(0.5));

        overlay.add(this.add.text(cx, 360, 'STAGE REACHED: ' + this.stageNumber, {
            fontFamily: FONT_FAMILY, fontSize: '16px', color: COLORS.GREEN
        }).setOrigin(0.5));

        // New record
        if (isNewRecord) {
            const recordText = this.add.text(cx, 395, 'NEW RECORD!', {
                fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.STREAK_GOD
            }).setOrigin(0.5);
            overlay.add(recordText);
            this.tweens.add({ targets: recordText, scaleX: 1.2, scaleY: 1.2, duration: 400, yoyo: true, repeat: -1 });
        }

        let btnY = 440;

        // Continue button (once per run)
        if (AdsManager.canContinue()) {
            const contY = btnY;
            this.time.delayedCall(500, () => {
                this.createOverlayButton(overlay, cx, contY, 260, 52, 'WATCH AD TO CONTINUE', 0x1A1400, 0xFFD700, () => {
                    AdsManager.useContinue();
                    AdsManager.showRewarded('continue', () => {
                        overlay.destroy();
                        this.isGameOver = false;
                        this.timerMs = Math.floor(this.stageParams.timeBudget * 0.5);
                        this.updateTimerBar();
                    });
                });
            });
            btnY += 65;
        }

        // Play again
        const playY = btnY;
        this.time.delayedCall(600, () => {
            this.createOverlayButton(overlay, cx, playY, 200, 52, 'PLAY AGAIN', 0x0D2F5A, 0x00E5FF, () => {
                overlay.destroy();
                this.scene.stop('GameScene');
                this.scene.start('GameScene');
            });
        });
        btnY += 65;

        // Menu
        const menuY = btnY;
        this.time.delayedCall(700, () => {
            this.createOverlayButton(overlay, cx, menuY, 140, 44, 'MENU', 0x070D17, 0x334455, () => {
                overlay.destroy();
                this.scene.stop('GameScene');
                this.scene.start('MenuScene');
            });
        });
    }

    createOverlayButton(container, x, y, w, h, label, fillColor, borderColor, callback) {
        const gfx = this.add.graphics().setDepth(401);
        gfx.fillStyle(fillColor, 1);
        gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
        gfx.lineStyle(2, borderColor, 1);
        gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6);
        container.add(gfx);

        const txt = this.add.text(x, y, label, {
            fontFamily: FONT_FAMILY, fontSize: '15px', color: COLORS.BTN_TEXT
        }).setOrigin(0.5).setDepth(402);
        container.add(txt);

        const zone = this.add.zone(x, y, w + 8, h + 8).setDepth(403)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => { SoundManager.playUIClick(this); callback(); });
        container.add(zone);
        return zone;
    }

    pauseGame() {
        if (this.isGameOver || this.isPaused) return;
        this.isPaused = true;

        const cx = CANVAS_WIDTH / 2;
        this.pauseOverlay = this.add.container(0, 0).setDepth(500);
        this.pauseOverlay.add(this.add.rectangle(cx, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT, 0x050A0F, 0.85));

        this.pauseOverlay.add(this.add.text(cx, 260, '// PAUSED //', {
            fontFamily: FONT_FAMILY, fontSize: '24px', color: COLORS.HUD_TEXT
        }).setOrigin(0.5));

        this.createOverlayButton(this.pauseOverlay, cx, 340, 180, 48, 'RESUME', 0x0D2F5A, 0x00E5FF, () => {
            this.pauseOverlay.destroy();
            this.isPaused = false;
        });

        this.createOverlayButton(this.pauseOverlay, cx, 400, 180, 48, '? HOW TO PLAY', 0x0D2F5A, 0x00E5FF, () => {
            this.pauseOverlay.destroy();
            this.scene.pause('GameScene');
            this.scene.launch('HelpScene', { returnTo: 'GameScene' });
            this.scene.get('HelpScene').events.once('shutdown', () => {
                this.scene.resume('GameScene');
                this.isPaused = false;
            });
        });

        this.createOverlayButton(this.pauseOverlay, cx, 460, 180, 48, 'MENU', 0x1A0D00, 0xFF9100, () => {
            this.pauseOverlay.destroy();
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });
    }

    // Utility methods
    getStreakLevel() {
        for (let i = STREAK_THRESHOLDS.length - 1; i >= 0; i--) {
            if (this.streak >= STREAK_THRESHOLDS[i]) return i + 1;
        }
        return 0;
    }

    updateStreakDisplay() {
        const level = this.getStreakLevel();
        if (level === 0) {
            this.streakText.setAlpha(0);
        } else {
            this.streakText.setText('STREAK x' + STREAK_MULTIPLIERS[level] + ' ' + STREAK_NAMES[level]);
            this.streakText.setColor(STREAK_COLORS[level]);
            this.streakText.setAlpha(1);
            this.tweens.add({ targets: this.streakText, scaleX: 1.5, scaleY: 1.5, duration: 100, yoyo: true });
        }
    }

    updateTimerBar() {
        if (!this.timerBar) return;
        const pct = Math.max(0, this.timerMs / this.stageParams.timeBudget);
        this.timerBar.setDisplaySize((CANVAS_WIDTH - 20) * pct, 10);
        const isCritical = pct < 0.25;
        this.timerBar.setFillStyle(this.freezeActive ? 0xB3E5FC : (isCritical ? 0xFF1744 : 0x00E5FF), 1);
    }

    spawnShards(x, y, color, count) {
        const colorNum = Phaser.Display.Color.HexStringToColor(color).color;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 80 + Math.random() * 150;
            const shard = this.add.rectangle(x, y, 6 + Math.random() * 4, 3, colorNum).setDepth(50).setRotation(angle);
            this.tweens.add({
                targets: shard, x: x + Math.cos(angle) * speed * 0.4, y: y + Math.sin(angle) * speed * 0.4,
                alpha: 0, rotation: angle + Math.random() * 3, duration: 380,
                onComplete: () => shard.destroy()
            });
        }
    }

    spawnFloatingText(x, y, text, color, size) {
        const txt = this.add.text(x, y, text, {
            fontFamily: FONT_FAMILY, fontSize: size || '18px', color: color, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(150);
        this.tweens.add({ targets: txt, y: y - 70, alpha: 0, duration: 550, delay: 200, onComplete: () => txt.destroy() });
    }

    update(time, delta) {
        if (this.isGameOver || this.isPaused || this.stageTransitioning) return;

        // Drain timer
        if (!this.freezeActive) {
            const drainMs = (this.stageParams.drainRate / 1000) * delta;
            this.timerMs -= drainMs;
        }

        if (this.timerMs <= 0) {
            this.timerMs = 0;
            this.updateTimerBar();
            this.onTimerExpired();
            return;
        }

        this.updateTimerBar();

        // Timer critical pulsing
        if (this.timerMs / this.stageParams.timeBudget < 0.25) {
            const pulse = 1 + Math.sin(time * 0.01) * 0.03;
            this.timerBar.setScale(pulse, 1);
        } else {
            this.timerBar.setScale(1, 1);
        }

        // DRIFT modifier
        if (this.stageParams.modifiers.includes('DRIFT')) {
            this.tileSprites.forEach(t => {
                if (t.sprite && t.sprite.active && !t.tileData.isTapped) {
                    const ox = Math.sin(time * 0.0005 + t.tileData.id * 1.7) * 4;
                    const oy = Math.cos(time * 0.0007 + t.tileData.id * 2.3) * 3;
                    const baseX = t.tileData.x + t.tileData.tileSize / 2;
                    const baseY = t.tileData.y + t.tileData.tileSize / 2;
                    t.sprite.setPosition(baseX + ox, baseY + oy);
                    t.text.setPosition(baseX + ox, baseY + oy);
                }
            });
        }
    }

    shutdown() {
        if (this._visHandler) {
            document.removeEventListener('visibilitychange', this._visHandler);
        }
        if (this.freezeTimer) clearTimeout(this.freezeTimer);
    }
}
