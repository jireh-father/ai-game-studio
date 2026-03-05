// effects.js - Particles, screen shake, scale punch, floating text, juice
const Effects = {
    stealParticles(scene, x, y, chain) {
        const count = 20 + Math.min(chain, 10) * 2;
        for (let i = 0; i < count; i++) {
            const p = scene.add.circle(x, y, Phaser.Math.Between(2, 5), 0x00E676, 1);
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const speed = Phaser.Math.Between(80, 250);
            scene.tweens.add({
                targets: p, x: x + Math.cos(angle) * speed, y: y + Math.sin(angle) * speed,
                alpha: 0, scale: 0, duration: 400, ease: 'Power2',
                onComplete: () => p.destroy()
            });
        }
    },

    bombDodgeParticles(scene, x, y) {
        for (let i = 0; i < 10; i++) {
            const p = scene.add.circle(x, y, 3, 0x00F5FF, 0.8);
            scene.tweens.add({
                targets: p, x: x + Phaser.Math.Between(-40, 40),
                y: y - Phaser.Math.Between(30, 80), alpha: 0, duration: 300,
                onComplete: () => p.destroy()
            });
        }
    },

    bosscrackEffect(scene, x, y, hitNum) {
        const count = 15 + hitNum * 10;
        for (let i = 0; i < count; i++) {
            const p = scene.add.circle(x, y, Phaser.Math.Between(2, 6), 0xFFD700, 1);
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const dist = Phaser.Math.Between(60, 180);
            scene.tweens.add({
                targets: p, x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist, alpha: 0, scale: 0.2,
                duration: 500, ease: 'Power2', onComplete: () => p.destroy()
            });
        }
    },

    damageFlash(scene) {
        const flash = scene.add.rectangle(
            scene.cameras.main.centerX, scene.cameras.main.centerY,
            scene.cameras.main.width, scene.cameras.main.height, 0xFF1744, 0.25
        ).setDepth(90).setScrollFactor(0);
        scene.tweens.add({
            targets: flash, alpha: 0, duration: 200,
            onComplete: () => flash.destroy()
        });
    },

    screenShake(scene, intensity, duration) {
        scene.cameras.main.shake(duration || 150, intensity || 0.005);
    },

    deathShake(scene) {
        scene.cameras.main.shake(400, 0.015);
    },

    scalePunch(scene, target, scale, duration) {
        if (!target || !target.scene) return;
        scene.tweens.add({
            targets: target, scaleX: scale || 1.3, scaleY: scale || 1.3,
            duration: duration || 80, yoyo: true, ease: 'Back.easeOut'
        });
    },

    cameraZoomPunch(scene) {
        scene.cameras.main.setZoom(1.03);
        scene.tweens.add({
            targets: scene.cameras.main, zoom: 1, duration: 200, ease: 'Power2'
        });
    },

    floatingText(scene, x, y, text, color, shake) {
        const txt = scene.add.text(x, y, text, {
            fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold',
            color: color || '#00E676', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(80);

        if (shake) {
            scene.tweens.add({
                targets: txt, x: x + 3, duration: 50,
                yoyo: true, repeat: 3
            });
        }
        scene.tweens.add({
            targets: txt, y: y - 60, alpha: 0, duration: 600,
            onComplete: () => txt.destroy()
        });
    },

    comboText(scene, chain) {
        const tier = chain >= 10 ? 3 : chain >= 6 ? 2 : chain >= 3 ? 1 : 0;
        if (tier === 0) return;
        const colors = ['#FFFFFF', '#FFB300', '#FF6D00', '#FF1744'];
        const sizes = [36, 44, 52, 60];
        const cx = scene.cameras.main.centerX;
        const cy = scene.cameras.main.centerY;
        const txt = scene.add.text(cx, cy, `x${chain}!`, {
            fontSize: `${sizes[tier]}px`, fontFamily: 'Arial', fontStyle: 'bold',
            color: colors[tier], stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(85);
        scene.tweens.add({
            targets: txt, scaleX: 1.5, scaleY: 1.5, alpha: 0, y: cy - 40,
            duration: 700, ease: 'Power2', onComplete: () => txt.destroy()
        });
        // Border flash
        const borderColors = [0xFFFFFF, 0xFFD700, 0xFF6D00, 0xFF1744];
        const border = scene.add.rectangle(cx, cy,
            scene.cameras.main.width, scene.cameras.main.height,
            borderColors[tier], 0
        ).setDepth(89).setScrollFactor(0).setStrokeStyle(4, borderColors[tier], 0.8);
        scene.tweens.add({
            targets: border, alpha: 0, duration: 300,
            onComplete: () => border.destroy()
        });
    },

    playerFlinch(scene, player) {
        if (!player || !player.scene) return;
        let count = 0;
        const interval = setInterval(() => {
            if (!player || !player.scene) { clearInterval(interval); return; }
            player.setTint(count % 2 === 0 ? 0xFFFFFF : 0x00F5FF);
            count++;
            if (count >= 6) { clearInterval(interval); if (player.scene) player.clearTint(); }
        }, 50);
    },

    comboGlow(scene, player, chain) {
        if (!player || !player.scene) return;
        if (chain >= 10) player.setTint(0xFF1744);
        else if (chain >= 6) player.setTint(0xFF6D00);
        else if (chain >= 3) player.setTint(0xFFB300);
        else player.clearTint();
    },

    deathRedFlash(scene, callback) {
        const flash = scene.add.rectangle(
            scene.cameras.main.centerX, scene.cameras.main.centerY,
            scene.cameras.main.width, scene.cameras.main.height, 0xFF1744, 0.4
        ).setDepth(95).setScrollFactor(0);
        scene.tweens.add({
            targets: flash, alpha: 0, duration: 500,
            onComplete: () => { flash.destroy(); if (callback) callback(); }
        });
    },

    swipeTrail(scene, x, y) {
        for (let i = 0; i < 8; i++) {
            const p = scene.add.circle(
                x + i * 8, y + Phaser.Math.Between(-5, 5),
                Phaser.Math.Between(2, 4), 0x00F5FF, 0.7
            );
            scene.tweens.add({
                targets: p, alpha: 0, x: p.x - 40, duration: 300,
                delay: i * 15, onComplete: () => p.destroy()
            });
        }
    }
};
