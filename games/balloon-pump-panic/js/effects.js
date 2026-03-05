// Balloon Pump Panic - Juice Effects

const Effects = {
    popEffect(scene, x, y, streak) {
        const count = 20 + (streak || 0) * 5;
        for (let i = 0; i < count; i++) {
            const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
            const p = scene.add.rectangle(x, y, 6, 6, color).setDepth(50);
            const angle = (Math.PI * 2 * i) / count;
            const speed = 120 + Math.random() * 180;
            scene.tweens.add({
                targets: p, x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed + 80,
                alpha: 0, scaleX: 0.2, scaleY: 0.2,
                duration: 400 + Math.random() * 200,
                ease: 'Quad.Out',
                onComplete: () => p.destroy()
            });
        }
    },

    explodeEffect(scene, x, y) {
        const colors = [0xFF6D00, 0xEF5350, 0xC62828];
        for (let i = 0; i < 30; i++) {
            const c = colors[i % 3];
            const p = scene.add.triangle(x, y, 0, 0, 8, 12, -4, 10, c).setDepth(50);
            p.setRotation(Math.random() * Math.PI * 2);
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 100 + Math.random() * 200;
            scene.tweens.add({
                targets: p, x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed + 120,
                alpha: 0, rotation: p.rotation + Math.random() * 4,
                duration: 500 + Math.random() * 200,
                ease: 'Quad.Out',
                onComplete: () => p.destroy()
            });
        }
    },

    escapeEffect(scene, x, y) {
        for (let i = 0; i < 8; i++) {
            const p = scene.add.circle(x + (Math.random() - 0.5) * 20, y, 4, 0x90CAF9, 0.7).setDepth(50);
            scene.tweens.add({
                targets: p, y: y + 40 + i * 15, alpha: 0,
                duration: 300 + i * 60, ease: 'Quad.Out',
                onComplete: () => p.destroy()
            });
        }
    },

    screenShake(scene, intensity, duration) {
        scene.cameras.main.shake(duration || 150, intensity || 0.005);
    },

    scalePunch(obj, scale, duration) {
        if (!obj || !obj.scene) return;
        obj.scene.tweens.add({
            targets: obj, scaleX: scale, scaleY: scale,
            duration: duration || 80, yoyo: true, ease: 'Bounce.Out'
        });
    },

    floatingText(scene, x, y, text, color, size) {
        const t = scene.add.text(x, y, text, {
            fontSize: (size || 28) + 'px', fontFamily: 'Arial Black, Arial',
            color: color || '#66BB6A', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(60);
        scene.tweens.add({
            targets: t, y: y - 60, alpha: 0,
            duration: 600, ease: 'Quad.Out',
            onComplete: () => t.destroy()
        });
    },

    redFlash(scene) {
        const flash = scene.add.rectangle(
            GAME_CONFIG.width / 2, GAME_CONFIG.height / 2,
            GAME_CONFIG.width, GAME_CONFIG.height, 0xEF5350, 0.3
        ).setDepth(55);
        scene.tweens.add({
            targets: flash, alpha: 0, duration: 300,
            onComplete: () => flash.destroy()
        });
    },

    cameraZoom(scene, zoom, recovery) {
        scene.cameras.main.setZoom(zoom || 1.03);
        scene.time.delayedCall(recovery || 200, () => {
            scene.tweens.add({
                targets: scene.cameras.main, zoom: 1,
                duration: 150, ease: 'Sine.Out'
            });
        });
    },

    stageTransition(scene, stageNum) {
        const txt = scene.add.text(
            GAME_CONFIG.width / 2, GAME_CONFIG.height / 2,
            'STAGE ' + stageNum + ' CLEAR!',
            { fontSize: '36px', fontFamily: 'Arial Black, Arial', color: '#FFFFFF',
              stroke: '#7E57C2', strokeThickness: 4 }
        ).setOrigin(0.5).setDepth(60).setScale(0);

        scene.tweens.add({
            targets: txt, scaleX: 1.2, scaleY: 1.2, duration: 200,
            ease: 'Back.Out', yoyo: false,
            onComplete: () => {
                scene.tweens.add({
                    targets: txt, scaleX: 1, scaleY: 1, duration: 200,
                    onComplete: () => {
                        scene.tweens.add({
                            targets: txt, alpha: 0, y: txt.y - 40,
                            duration: 400, delay: 200,
                            onComplete: () => txt.destroy()
                        });
                    }
                });
            }
        });

        // Confetti rain
        for (let i = 0; i < 40; i++) {
            const c = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
            const p = scene.add.rectangle(
                Math.random() * GAME_CONFIG.width, -10,
                5 + Math.random() * 4, 5 + Math.random() * 4, c
            ).setDepth(55);
            scene.tweens.add({
                targets: p, y: GAME_CONFIG.height + 20,
                x: p.x + (Math.random() - 0.5) * 60,
                rotation: Math.random() * 6,
                duration: 1000 + Math.random() * 500,
                delay: Math.random() * 400,
                onComplete: () => p.destroy()
            });
        }

        // White flash
        const wf = scene.add.rectangle(
            GAME_CONFIG.width / 2, GAME_CONFIG.height / 2,
            GAME_CONFIG.width, GAME_CONFIG.height, 0xFFFFFF, 0.4
        ).setDepth(54);
        scene.tweens.add({
            targets: wf, alpha: 0, duration: 200,
            onComplete: () => wf.destroy()
        });
    },

    pumpAirPuff(scene, x, y) {
        for (let i = 0; i < 3; i++) {
            const p = scene.add.circle(
                x + (Math.random() - 0.5) * 10, y,
                3 + Math.random() * 3, 0xFFFFFF, 0.7
            ).setDepth(45);
            scene.tweens.add({
                targets: p,
                y: y - 30 - Math.random() * 20,
                x: p.x + (Math.random() - 0.5) * 20,
                alpha: 0, scaleX: 2, scaleY: 2,
                duration: 150 + Math.random() * 100,
                onComplete: () => p.destroy()
            });
        }
    }
};
