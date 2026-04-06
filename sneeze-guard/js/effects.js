// Sneeze Guard - Juice Effects (mixin for GameScene)
const GameEffects = {
    // Snot particle burst on guard (perfect/good block)
    snotSplatterOnGuard: function(x, y, count) {
        const n = count || 12;
        for (let i = 0; i < n; i++) {
            const r = 4 + Math.random() * 8;
            const circle = this.add.circle(x, y, r, 0x7FD43A, 0.9);
            circle.setDepth(20);
            const angle = (-90 + (Math.random() - 0.5) * 120) * Math.PI / 180;
            const speed = 80 + Math.random() * 70;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            this.tweens.add({
                targets: circle, x: x + vx * 0.8, y: y + vy * 0.8 + 40,
                alpha: 0, duration: 800, ease: 'Quad.easeOut',
                onComplete: () => circle.destroy()
            });
        }
    },

    // Contamination burst toward food
    contaminationBurst: function(fromX, fromY) {
        const targetY = 180;
        for (let i = 0; i < 24; i++) {
            const r = 6 + Math.random() * 10;
            const circle = this.add.circle(fromX, fromY, r, 0x7FD43A, 0.85);
            circle.setDepth(20);
            const spread = (Math.random() - 0.5) * 200;
            const tx = fromX + spread;
            const ty = targetY + Math.random() * 30;
            this.tweens.add({
                targets: circle, x: tx, y: ty, alpha: 0,
                duration: 600 + Math.random() * 200, ease: 'Quad.easeIn',
                onComplete: () => circle.destroy()
            });
        }
    },

    // Floating score text
    showFloatingText: function(x, y, text, color, sizeMult) {
        const mult = sizeMult || 1.0;
        const fontSize = Math.round(28 * mult);
        const txt = this.add.text(x, y, text, {
            fontSize: fontSize + 'px', fontFamily: 'Arial Black, Arial',
            fontStyle: 'bold', color: color, stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(30);

        txt.setScale(1.2 * mult);
        this.tweens.add({
            targets: txt, scale: 1.0, duration: 200
        });
        this.tweens.add({
            targets: txt, y: y - 80, alpha: 0,
            duration: 600, delay: 100, ease: 'Quad.easeOut',
            onComplete: () => txt.destroy()
        });
    },

    // Screen shake
    doScreenShake: function(intensity, duration) {
        this.cameras.main.shake(duration || 300, intensity || 0.005);
    },

    // Scale punch on any object
    scalePunch: function(target, scale, duration) {
        if (!target || !target.scene) return;
        this.tweens.add({
            targets: target, scaleX: scale || 1.4, scaleY: scale || 1.4,
            duration: duration || 80, yoyo: true, ease: 'Quad.easeOut'
        });
    },

    // Hit-stop using setTimeout (NOT delayedCall with timeScale=0)
    doHitstop: function(ms) {
        this.scene.pause();
        setTimeout(() => {
            if (this.scene && !this.gameOver) {
                this.scene.resume();
            }
        }, ms || CONFIG.HITSTOP_MS);
    },

    // Guard raise sparkles
    guardSparkles: function(guardY, count) {
        const n = count || 3;
        const gw = CONFIG.GAME_WIDTH;
        for (let i = 0; i < n; i++) {
            const sx = 40 + Math.random() * (gw - 80);
            const sparkle = this.add.circle(sx, guardY, 4, 0xFFFFFF, 1);
            sparkle.setDepth(22);
            const angle = (-90 + (Math.random() - 0.5) * 60) * Math.PI / 180;
            this.tweens.add({
                targets: sparkle,
                x: sx + Math.cos(angle) * 40,
                y: guardY + Math.sin(angle) * 40,
                alpha: 0, scale: 0, duration: 200,
                onComplete: () => sparkle.destroy()
            });
        }
    },

    // Camera zoom punch (subtle)
    cameraZoomPunch: function() {
        this.cameras.main.zoomTo(1.03, 60);
        this.time.delayedCall(60, () => {
            if (this.cameras && this.cameras.main) {
                this.cameras.main.zoomTo(1.0, 180);
            }
        });
    },

    // Green vignette flash
    greenVignetteFlash: function() {
        const vignette = this.add.rectangle(
            CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
            CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT,
            0x7FD43A, 0.35
        ).setDepth(50);
        this.tweens.add({
            targets: vignette, alpha: 0, duration: 300,
            onComplete: () => vignette.destroy()
        });
    },

    // Heart loss animation
    animateHeartLoss: function(heartSprite) {
        if (!heartSprite) return;
        this.tweens.add({
            targets: heartSprite,
            scaleX: 1.4, scaleY: 1.4, duration: 100, yoyo: true,
            onComplete: () => {
                if (heartSprite && heartSprite.scene) {
                    heartSprite.setTint(0xCCCCCC);
                }
            }
        });
    },

    // Streak glow effect on score HUD
    showStreakBanner: function(streakCount) {
        const txt = this.add.text(
            CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 40,
            'STREAK x' + streakCount + '!',
            { fontSize: '36px', fontFamily: 'Arial Black, Arial',
              fontStyle: 'bold', color: CONFIG.COLOR.GOLD,
              stroke: '#000', strokeThickness: 4 }
        ).setOrigin(0.5).setDepth(35).setAlpha(0);

        this.tweens.add({
            targets: txt, alpha: 1, scaleX: 1.3, scaleY: 1.3,
            duration: 150, yoyo: true, hold: 200,
            onComplete: () => txt.destroy()
        });
    },

    // Patron exit animation (angry, stomps off right)
    patronStompOff: function(patron) {
        if (!patron || !patron.scene) return;
        this.tweens.add({
            targets: patron, x: CONFIG.GAME_WIDTH + 60,
            duration: 600, ease: 'Quad.easeIn'
        });
    },

    // Exclamation mark above patron
    showExclamation: function(x, y) {
        const ex = this.add.image(x, y - 50, 'exclamation').setDepth(25);
        this.tweens.add({
            targets: ex, y: y - 70, alpha: 0, duration: 800,
            onComplete: () => ex.destroy()
        });
    },

    // Haptic feedback
    vibrate: function(ms) {
        if (navigator.vibrate) navigator.vibrate(ms || 40);
    },

    // Shutdown cleanup
    shutdown: function() {
        this.tweens.killAll();
        this.time.removeAllEvents();
        if (this._visHandler) {
            document.removeEventListener('visibilitychange', this._visHandler);
        }
    }
};
