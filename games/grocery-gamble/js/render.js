// Grocery Gamble - Effects & Visual Juice (mixed into GameScene)
const RenderMixin = {
    successJuice(sprite, tier, points) {
        // Green flash
        const flash = this.add.rectangle(170, 440, 180, 60, COLORS.primary, 0).setDepth(8);
        this.tweens.add({
            targets: flash, alpha: 0.6, duration: 150, yoyo: true,
            onComplete: () => flash.destroy()
        });

        // Scale punch
        this.tweens.add({
            targets: this.scalePlatform, scaleX: 1.1, scaleY: 1.1, duration: 90, yoyo: true
        });

        // Screen shake + camera effects
        if (tier === 'perfect') {
            this.cameras.main.shake(120, 0.004);
            this.cameras.main.zoomTo(1.06, 100, 'Linear', true);
            this.time.delayedCall(200, () => this.cameras.main.zoomTo(1, 100));
            // Hit-stop via setTimeout
            this.hitStopped = true;
            setTimeout(() => { this.hitStopped = false; }, 60);
        } else if (tier === 'good') {
            this.cameras.main.shake(80, 0.002);
        }

        // Particles
        if (this.particleGold) {
            const p = this.add.particles(170, 440, 'particle', {
                speed: { min: 100, max: 200 }, lifespan: 400,
                quantity: tier === 'perfect' ? 25 : 12,
                scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 }
            });
            this.time.delayedCall(500, () => p.destroy());
        }

        // Combo banners
        if (GameState.combo === 3 || GameState.combo === 5 || GameState.combo === 8) {
            const labels = { 3: 'COMBO!', 5: 'HOT STREAK!', 8: 'UNSTOPPABLE!' };
            const banner = this.add.text(-100, 350, labels[GameState.combo], {
                fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: HEX.gold
            }).setOrigin(0, 0.5).setDepth(20);
            this.tweens.add({
                targets: banner, x: GAME_WIDTH / 2 - 60, duration: 300, ease: 'Back.Out',
                hold: 800, onComplete: () => {
                    this.tweens.add({
                        targets: banner, x: GAME_WIDTH + 100, duration: 300,
                        onComplete: () => banner.destroy()
                    });
                }
            });
        }
    },

    triggerAlarm(sprite) {
        GameState.alarmCount++;
        GameState.combo = 0;
        GameState.suspicion = Math.min(100, GameState.suspicion + SUSPICION_PER_MISS);
        this.stageAlarmsThisStage++;

        // Red flash
        const flash = this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.danger, 0
        ).setDepth(25);
        this.tweens.add({
            targets: flash, alpha: 0.5, duration: 200, yoyo: true,
            onComplete: () => flash.destroy()
        });

        this.cameras.main.shake(300, 0.01);

        // Cashier jump
        if (this.cashier) {
            this.tweens.add({ targets: this.cashier, y: this.cashier.y - 8, duration: 100, yoyo: true });
        }

        this.events.emit('updateAlarm');
        this.events.emit('updateSuspicion');
        this.events.emit('updateCombo');

        if (GameState.alarmCount >= MAX_ALARMS) {
            this.triggerGameOver('busted');
        } else if (GameState.suspicion >= 100) {
            this.triggerGameOver('busted');
        }

        this.updateCashierExpression();
    },

    shatterItem(sprite, data) {
        for (let i = 0; i < 8; i++) {
            const shard = this.add.rectangle(
                sprite.x + (Math.random() - 0.5) * 20, sprite.y,
                12, 8, COLORS.amber
            ).setAngle(Math.random() * 360).setDepth(12);

            this.tweens.add({
                targets: shard,
                x: shard.x + (Math.random() - 0.5) * 100,
                y: shard.y + Math.random() * 80 + 20,
                alpha: 0, angle: shard.angle + 180,
                duration: 600, onComplete: () => shard.destroy()
            });
        }

        this.triggerAlarm(sprite);
        this.removeItem(sprite, data);
    },

    triggerGameOver(reason) {
        if (this.gameOver) return;
        this.gameOver = true;

        if (GameState.score > GameState.highScore) {
            GameState.highScore = GameState.score;
            try { localStorage.setItem('grocery-gamble_high_score', GameState.highScore.toString()); } catch(e) {}
        }

        this.cameras.main.shake(500, 0.018);

        if (reason === 'overflow') {
            this.beltItems.forEach(bi => {
                if (bi.sprite) {
                    this.tweens.add({
                        targets: bi.sprite, x: bi.sprite.x + 15, duration: 50, yoyo: true, repeat: 5
                    });
                }
            });
        }

        const flash1 = this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.danger, 0
        ).setDepth(25);
        this.tweens.add({
            targets: flash1, alpha: 0.5, duration: 150, yoyo: true, repeat: 2,
            onComplete: () => {
                flash1.setAlpha(0.3);
                this.time.delayedCall(800, () => {
                    this.scene.stop('HUDScene');
                    this.scene.launch('GameOverScene', { reason });
                });
            }
        });
    },

    updateCashierExpression() {
        if (!this.cashier) return;
        if (GameState.suspicion > 60 && this.textures.exists('cashier_angry')) {
            this.cashier.setTexture('cashier_angry');
        } else if (this.textures.exists('cashier_normal')) {
            this.cashier.setTexture('cashier_normal');
        }
    }
};
