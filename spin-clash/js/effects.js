// effects.js — Particle effects, floating score, trails, visual juice

const Effects = {
    spawnHitParticles(scene, x, y, type, combo) {
        const color = CONFIG.ENEMY_TYPES[type] ? CONFIG.ENEMY_TYPES[type].color : CONFIG.COLORS.PLAYER;
        const count = Math.min(40, 20 + (combo - 1) * 5);
        const g = scene.add.graphics().setDepth(30);
        const particles = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 140;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 300,
            });
        }
        const startTime = scene.time.now;
        const update = () => {
            const elapsed = scene.time.now - startTime;
            g.clear();
            let alive = false;
            particles.forEach(p => {
                const t = elapsed / p.life;
                if (t >= 1) return;
                alive = true;
                p.x += p.vx * 0.016;
                p.y += p.vy * 0.016;
                g.fillStyle(color, 1 - t);
                g.fillCircle(p.x, p.y, 3 * (1 - t));
            });
            if (!alive) { g.destroy(); return; }
            scene.time.delayedCall(16, update);
        };
        update();
    },

    showFloatingScore(scene, x, y, pts) {
        const txt = scene.add.text(x, y, `+${pts}`, {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFD600',
        }).setOrigin(0.5).setDepth(60);
        scene.tweens.add({
            targets: txt, y: y - 60, alpha: 0, duration: 600,
            onComplete: () => txt.destroy(),
        });
    },

    drawAimArrow(scene, gfx, playerX, playerY, dragStart, pointer) {
        gfx.clear();
        const dx = pointer.x - dragStart.x;
        const dy = pointer.y - dragStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.DRAG_THRESHOLD) return;

        const clampDist = Math.min(dist, CONFIG.MAX_DRAG_PX);
        const angle = Math.atan2(dy, dx);
        const ex = playerX + Math.cos(angle) * clampDist;
        const ey = playerY + Math.sin(angle) * clampDist;

        gfx.lineStyle(2, CONFIG.COLORS.PLAYER, 0.6);
        const steps = 8;
        for (let i = 0; i < steps; i += 2) {
            const t1 = i / steps, t2 = (i + 1) / steps;
            gfx.lineBetween(
                playerX + (ex - playerX) * t1,
                playerY + (ey - playerY) * t1,
                playerX + (ex - playerX) * t2,
                playerY + (ey - playerY) * t2
            );
        }
        const aSize = 8;
        gfx.fillStyle(CONFIG.COLORS.PLAYER, 0.7);
        gfx.fillTriangle(
            ex + Math.cos(angle) * aSize, ey + Math.sin(angle) * aSize,
            ex + Math.cos(angle + 2.5) * aSize, ey + Math.sin(angle + 2.5) * aSize,
            ex + Math.cos(angle - 2.5) * aSize, ey + Math.sin(angle - 2.5) * aSize
        );
    },

    updateTrails(scene, trailGfx, trails, player, time) {
        const speed = Math.sqrt(player.body.velocity.x ** 2 + player.body.velocity.y ** 2);
        if (speed > 30) {
            trails.push({ x: player.x, y: player.y, time });
        }
        while (trails.length > CONFIG.PLAYER.TRAIL_COUNT) trails.shift();

        trailGfx.clear();
        trails.forEach((t, i) => {
            const age = time - t.time;
            if (age > 180) return;
            const alpha = 0.5 * (1 - age / 180);
            trailGfx.fillStyle(CONFIG.COLORS.PLAYER, alpha);
            trailGfx.fillCircle(t.x, t.y, CONFIG.PLAYER.RADIUS * (0.4 + (i / trails.length) * 0.4));
        });
    },

    drawTopGraphic(g, x, y, r, color, isPlayer) {
        g.fillStyle(color, 0.9);
        g.fillCircle(x, y, r);
        g.fillStyle(0xFFFFFF, isPlayer ? 0.6 : 0.5);
        g.fillCircle(x, y, r * 0.55);
        if (isPlayer) {
            g.fillStyle(color, 1);
            g.fillCircle(x, y, r * 0.22);
        }
        g.lineStyle(2, color, 0.7);
        g.strokeEllipse(x, y, r * 2.4, r * 0.6);
    },

    stageFlash(scene) {
        const flash = scene.add.rectangle(
            CONFIG.CENTER_X, CONFIG.HEIGHT / 2,
            CONFIG.WIDTH, CONFIG.HEIGHT, 0xFFFFFF, 0
        ).setDepth(80);
        scene.tweens.add({
            targets: flash, alpha: 0.7, duration: 150, yoyo: true,
            onComplete: () => flash.destroy(),
        });
    },
};
