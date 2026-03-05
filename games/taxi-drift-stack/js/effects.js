// effects.js - Particle systems, screen shake, visual juice helpers

function spawnDriftSmoke(scene, x, y, combo) {
    const count = 5 + Math.min(combo, 10);
    const color = combo >= 10 ? 0xFF2D7B : 0xFF6B00;
    for (let i = 0; i < count; i++) {
        const p = scene.add.circle(x + Phaser.Math.Between(-6, 6), y + Phaser.Math.Between(-6, 6),
            Phaser.Math.Between(3, 6), color, 0.6);
        p.setDepth(5);
        scene.tweens.add({
            targets: p,
            x: p.x + Phaser.Math.Between(-20, 20),
            y: p.y + Phaser.Math.Between(-20, 20),
            alpha: 0,
            scale: 0.3,
            duration: 400,
            onComplete: () => p.destroy()
        });
    }
}

function spawnLandingBurst(scene, x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const speed = Phaser.Math.Between(80, 200);
        const size = Phaser.Math.Between(2, 5);
        const p = scene.add.circle(x, y, size, color, 1);
        p.setDepth(15);
        scene.tweens.add({
            targets: p,
            x: x + Math.cos(angle) * speed,
            y: y + Math.sin(angle) * speed,
            alpha: 0,
            scale: 0,
            duration: Phaser.Math.Between(250, 400),
            onComplete: () => p.destroy()
        });
    }
}

function spawnCrashExplosion(scene, x, y) {
    const colors = [0xFFD600, 0xFF6B00, 0xFF1744];
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const speed = Phaser.Math.Between(60, 160);
        const c = colors[i % 3];
        const p = scene.add.circle(x, y, Phaser.Math.Between(2, 6), c, 1);
        p.setDepth(20);
        scene.tweens.add({
            targets: p,
            x: x + Math.cos(angle) * speed,
            y: y + Math.sin(angle) * speed,
            alpha: 0,
            duration: 400,
            onComplete: () => p.destroy()
        });
    }
}

function spawnArcTrail(scene, positions) {
    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const alpha = 1 - (i / positions.length) * 0.9;
        const ghost = scene.add.image(pos.x, pos.y, 'passenger');
        ghost.setAlpha(alpha).setDepth(12).setScale(1 - i * 0.05);
        scene.tweens.add({
            targets: ghost,
            alpha: 0,
            duration: 300,
            delay: i * 30,
            onComplete: () => ghost.destroy()
        });
    }
}

function showFloatingScore(scene, x, y, text, color) {
    const txt = scene.add.text(x, y, text, {
        fontSize: '22px', fontFamily: 'Arial Black, Arial',
        color: color, fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(25);
    scene.tweens.add({
        targets: txt,
        y: y - 60,
        alpha: 0,
        scale: 1.3,
        duration: 700,
        ease: 'Power2',
        onComplete: () => txt.destroy()
    });
}

function shakeCamera(scene, intensity, duration) {
    scene.cameras.main.shake(duration, intensity / 300);
}

function flashCamera(scene, color, duration, alpha) {
    const hex = typeof color === 'number' ? color : parseInt(color.replace('#', ''), 16);
    const r = (hex >> 16) & 0xFF;
    const g = (hex >> 8) & 0xFF;
    const b = hex & 0xFF;
    const flash = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2,
        GAME_WIDTH, GAME_HEIGHT, hex, alpha || 0.5).setDepth(50);
    scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: duration,
        onComplete: () => flash.destroy()
    });
}

function spawnSpeedLines(scene, count) {
    for (let i = 0; i < count; i++) {
        const x = Phaser.Math.Between(20, GAME_WIDTH - 20);
        const y = Phaser.Math.Between(0, 50);
        const line = scene.add.rectangle(x, y, 2, Phaser.Math.Between(15, 35), 0xFFFFFF, 0.3);
        line.setDepth(3);
        scene.tweens.add({
            targets: line,
            y: GAME_HEIGHT + 20,
            alpha: 0,
            duration: 300,
            onComplete: () => line.destroy()
        });
    }
}

function spawnComboFire(scene, x, y) {
    for (let i = 0; i < 3; i++) {
        const colors = [0xFF6B00, 0xFF1744, 0xFFD600];
        const p = scene.add.circle(
            x + Phaser.Math.Between(-8, 8),
            y + Phaser.Math.Between(5, 15),
            Phaser.Math.Between(2, 5), colors[i], 0.8);
        p.setDepth(6);
        scene.tweens.add({
            targets: p,
            y: p.y + 20,
            alpha: 0,
            scale: 0,
            duration: 300,
            onComplete: () => p.destroy()
        });
    }
}

function punchScale(scene, target, scale, duration) {
    scene.tweens.add({
        targets: target,
        scaleX: scale,
        scaleY: scale,
        duration: duration / 2,
        yoyo: true,
        ease: 'Back.easeOut'
    });
}

function spawnStageClearParticles(scene) {
    for (let i = 0; i < 25; i++) {
        const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
        const y = Phaser.Math.Between(100, GAME_HEIGHT - 200);
        const c = i < 15 ? 0xFFD700 : 0xFFFFFF;
        const p = scene.add.circle(x, y, Phaser.Math.Between(2, 5), c, 1);
        p.setDepth(30);
        scene.tweens.add({
            targets: p,
            y: p.y - Phaser.Math.Between(40, 100),
            x: p.x + Phaser.Math.Between(-30, 30),
            alpha: 0,
            duration: Phaser.Math.Between(400, 800),
            onComplete: () => p.destroy()
        });
    }
}
