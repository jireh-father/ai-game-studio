// Gravity Waiter - Rendering, Effects & Sound

const Effects = {
    showFloatingText(scene, x, y, text, color, size) {
        const txt = scene.add.text(x, y, text, {
            fontSize: size + 'px', fontStyle: 'bold', color: color, fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(9);
        scene.tweens.add({
            targets: txt, y: y - 70, alpha: 0, duration: 700,
            onComplete: () => txt.destroy()
        });
    },

    spawnParticles(scene, x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 160;
            const p = scene.add.circle(x, y, 3, color).setDepth(8);
            scene.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * speed * 0.4,
                y: y + Math.sin(angle) * speed * 0.4,
                alpha: 0, scaleX: 0, scaleY: 0,
                duration: 350 + Math.random() * 100,
                onComplete: () => p.destroy()
            });
        }
    },

    flashOverlay(scene, color, alpha, duration, depth) {
        const flash = scene.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2,
            CONFIG.WIDTH, CONFIG.HEIGHT, color, alpha).setDepth(depth || 6);
        scene.tweens.add({
            targets: flash, alpha: 0, duration: duration,
            onComplete: () => flash.destroy()
        });
        return flash;
    },

    scalePunch(scene, target, scale, duration) {
        scene.tweens.add({
            targets: target,
            scaleX: scale, scaleY: scale,
            duration: duration || 100, yoyo: true
        });
    }
};

const SoundFX = {
    play(scene, type) {
        if (window.GW && window.GW.muted) return;
        try {
            const ctx = scene.sound.context;
            if (!ctx || ctx.state === 'closed') return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            const t = ctx.currentTime;

            const sounds = {
                clink: () => {
                    osc.frequency.setValueAtTime(800, t);
                    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
                    gain.gain.setValueAtTime(0.15, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                    osc.start(t); osc.stop(t + 0.15);
                },
                shatter: () => {
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(600, t);
                    osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);
                    gain.gain.setValueAtTime(0.2, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                    osc.start(t); osc.stop(t + 0.3);
                },
                rotation: () => {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(300, t);
                    osc.frequency.exponentialRampToValueAtTime(80, t + 0.5);
                    gain.gain.setValueAtTime(0.2, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                    osc.start(t); osc.stop(t + 0.5);
                },
                warning: () => {
                    osc.frequency.setValueAtTime(1200, t);
                    gain.gain.setValueAtTime(0.1, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                    osc.start(t); osc.stop(t + 0.1);
                },
                bump: () => {
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(150, t);
                    gain.gain.setValueAtTime(0.2, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                    osc.start(t); osc.stop(t + 0.2);
                },
                gameover: () => {
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(800, t);
                    osc.frequency.exponentialRampToValueAtTime(80, t + 0.6);
                    gain.gain.setValueAtTime(0.25, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
                    osc.start(t); osc.stop(t + 0.6);
                },
                perfect: () => {
                    osc.frequency.setValueAtTime(600, t);
                    osc.frequency.exponentialRampToValueAtTime(900, t + 0.1);
                    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
                    gain.gain.setValueAtTime(0.12, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                    osc.start(t); osc.stop(t + 0.3);
                }
            };

            if (sounds[type]) sounds[type]();
        } catch (e) {}
    }
};

function drawBackground(scene) {
    const W = CONFIG.WIDTH;
    const g = scene.add.graphics();
    // Window
    g.fillStyle(0x87CEEB); g.fillRoundedRect(40, 120, 120, 90, 5);
    g.lineStyle(4, 0x8B6914); g.strokeRoundedRect(40, 120, 120, 90, 5);
    g.lineStyle(2, 0x8B6914);
    g.lineBetween(100, 120, 100, 210);
    g.lineBetween(40, 165, 160, 165);
    // Chalkboard
    g.fillStyle(0x2D5A1B); g.fillRoundedRect(210, 120, 110, 80, 4);
    g.lineStyle(3, 0x8B6914); g.strokeRoundedRect(210, 120, 110, 80, 4);
    // Floor
    const floorY = CONFIG.TRAY_Y + 80;
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 10; col++) {
            const clr = (row + col) % 2 === 0 ? 0xCC2200 : 0xFFFAFA;
            g.fillStyle(clr);
            g.fillRect(col * 40, floorY + row * 40, 40, 40);
        }
    }
}
