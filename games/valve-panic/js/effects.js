// Valve Panic - Juice Effects & Particles

const Effects = {
    // Floating score text that rises and fades
    floatingScore(scene, x, y, text, color, size) {
        const sz = size || 22;
        const txt = scene.add.text(x, y, text, {
            fontSize: sz + 'px', fontFamily: 'Arial Black, Arial',
            fill: color || CONFIG.COLORS.GOLD, stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);
        scene.tweens.add({
            targets: txt, y: y - 60, alpha: 0, duration: 600,
            ease: 'Power2', onComplete: () => txt.destroy()
        });
    },

    // Screen shake
    shake(scene, intensity, duration) {
        if (scene.cameras && scene.cameras.main) {
            scene.cameras.main.shake(duration || 150, intensity || 0.004);
        }
    },

    // Scale punch on a game object
    scalePunch(scene, obj, scale, duration) {
        if (!obj || !obj.scene) return;
        scene.tweens.add({
            targets: obj, scaleX: scale || 1.3, scaleY: scale || 1.3,
            duration: duration || 80, yoyo: true, ease: 'Back.easeOut'
        });
    },

    // Particle burst at position
    particleBurst(scene, x, y, count, color, speed, lifespan) {
        const c = count || 15;
        for (let i = 0; i < c; i++) {
            const angle = (Math.PI * 2 * i) / c + Math.random() * 0.3;
            const spd = (speed || 150) * (0.5 + Math.random() * 0.5);
            const p = scene.add.circle(x, y, 3 + Math.random() * 2, color || 0xFFFFFF)
                .setDepth(90).setAlpha(0.9);
            scene.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * spd * 0.4,
                y: y + Math.sin(angle) * spd * 0.4,
                alpha: 0, scaleX: 0.2, scaleY: 0.2,
                duration: lifespan || 400, ease: 'Power2',
                onComplete: () => p.destroy()
            });
        }
    },

    // Valve tap feedback
    valveTap(scene, x, y) {
        this.particleBurst(scene, x, y, 8, 0xFFFFFF, 120, 300);
        this.shake(scene, 0.002, 80);
    },

    // Steam particles while draining
    steamParticle(scene, x, y) {
        const p = scene.add.circle(
            x + (Math.random() - 0.5) * 16, y,
            2 + Math.random() * 2, 0xFFFFFF
        ).setDepth(80).setAlpha(0.5);
        scene.tweens.add({
            targets: p, y: y - 30 - Math.random() * 20,
            alpha: 0, scaleX: 2, scaleY: 2,
            duration: 400 + Math.random() * 200,
            onComplete: () => p.destroy()
        });
    },

    // Clean drain sparkle effect
    cleanDrain(scene, x, y, combo) {
        const count = 10 + (combo || 0) * 5;
        this.particleBurst(scene, x, y, count, 0xFFFFFF, 180, 350);
        this.floatingScore(scene, x, y - 40, '+' + (CONFIG.SCORING.CLEAN_DRAIN +
            (combo || 0) * CONFIG.SCORING.COMBO_BONUS), CONFIG.COLORS.GOLD);
    },

    // Emergency save glow
    emergencySave(scene, pipeGraphics, x, y) {
        const glow = scene.add.circle(x, y, 30, 0xFFD700, 0.4).setDepth(85);
        scene.tweens.add({
            targets: glow, scaleX: 1.8, scaleY: 1.8, alpha: 0,
            duration: 500, onComplete: () => glow.destroy()
        });
        this.floatingScore(scene, x, y - 60, '+200 SAVE!', CONFIG.COLORS.GOLD, 32);
        this.particleBurst(scene, x, y, 20, 0xFFD700, 200, 500);
    },

    // Surge penalty effect
    surgeEffect(scene, pipeContainer, x, y) {
        this.shake(scene, 0.004, 150);
        this.floatingScore(scene, x, y - 20, '-25', CONFIG.COLORS.SURGE_COLOR, 20);
        // Pink flash pulses
        for (let i = 0; i < 3; i++) {
            const flash = scene.add.rectangle(x, y, CONFIG.PIPE.WIDTH + 8,
                CONFIG.PIPE.HEIGHT + 8, 0xFF69B4, 0.3).setDepth(75);
            scene.tweens.add({
                targets: flash, alpha: 0, delay: i * 100,
                duration: 100, onComplete: () => flash.destroy()
            });
        }
        if (pipeContainer) this.scalePunch(scene, pipeContainer, 1.08, 120);
    },

    // Burst explosion
    burstExplosion(scene, x, y, color) {
        this.shake(scene, 0.012, 400);
        // Fragment particles
        this.particleBurst(scene, x, y, 12, color, 300, 800);
        // Droplets
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const d = scene.add.circle(x, y, 4, color, 0.8).setDepth(95);
            scene.tweens.add({
                targets: d,
                x: x + Math.cos(angle) * (80 + Math.random() * 60),
                y: y + 40 + Math.random() * 80,
                alpha: 0, duration: 600 + Math.random() * 200,
                ease: 'Power1', onComplete: () => d.destroy()
            });
        }
        // Red flash overlay
        const flash = scene.add.rectangle(
            CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
            CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT, 0xFF0000, 0.35
        ).setDepth(200);
        scene.tweens.add({
            targets: flash, alpha: 0, duration: 300,
            onComplete: () => flash.destroy()
        });
    },

    // Combo text effect
    comboText(scene, combo) {
        const sz = Math.min(24 + combo * 4, 48);
        const colorIdx = combo % CONFIG.PIPE_COLOR_HEX.length;
        const txt = scene.add.text(CONFIG.GAME_WIDTH / 2, 130,
            'x' + combo + ' COMBO!', {
                fontSize: sz + 'px', fontFamily: 'Arial Black, Arial',
                fill: CONFIG.PIPE_COLOR_HEX[colorIdx],
                stroke: '#000', strokeThickness: 4
            }).setOrigin(0.5).setDepth(100);
        scene.tweens.add({
            targets: txt, scaleX: 1.3, scaleY: 1.3,
            duration: 100, yoyo: true
        });
        scene.tweens.add({
            targets: txt, alpha: 0, delay: 800,
            duration: 300, onComplete: () => txt.destroy()
        });
    },

    // New pipe slide-in animation
    pipeSlideIn(scene, container, targetY) {
        container.y = CONFIG.GAME_HEIGHT + 50;
        scene.tweens.add({
            targets: container, y: targetY,
            duration: 300, ease: 'Back.easeOut'
        });
    }
};
