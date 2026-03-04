// Stack Panic - Rendering & Juice Effects (extracted from game.js)

const BlockRenderer = {
    drawBlocks(scene) {
        if (!scene.blockGraphics) {
            scene.blockGraphics = scene.add.graphics().setDepth(8);
        }
        scene.blockGraphics.clear();

        for (const b of scene.droppedBlocks) {
            if (!b.body) continue;
            const pos = b.body.position;
            const angle = b.body.angle;
            this.drawSingleBlock(scene.blockGraphics, pos.x, pos.y, b.width, b.height, b.color, angle);
        }

        if (scene.swingBlock) {
            const pos = scene.swingBlock.body.position;
            this.drawSingleBlock(scene.blockGraphics, pos.x, pos.y, scene.swingBlock.width, scene.swingBlock.height, scene.swingBlock.color, 0);
            this.drawBlockShadow(scene);
        }
    },

    drawSingleBlock(g, x, y, w, h, color, angle) {
        const hlColor = color === COLORS.block ? COLORS.blockHighlight :
            color === COLORS.blockAccent1 ? 0xFFA080 : 0x80E080;
        const shColor = color === COLORS.block ? COLORS.blockShadow :
            color === COLORS.blockAccent1 ? 0xA03020 : 0x2E7D32;

        if (Math.abs(angle) > 0.01) {
            const cos = Math.cos(angle), sin = Math.sin(angle);
            const hw = w / 2, hh = h / 2;
            const corners = [
                { rx: -hw, ry: -hh }, { rx: hw, ry: -hh },
                { rx: hw, ry: hh }, { rx: -hw, ry: hh }
            ];
            const pts = corners.map(c => ({
                x: x + c.rx * cos - c.ry * sin,
                y: y + c.rx * sin + c.ry * cos
            }));
            g.fillStyle(color);
            g.beginPath();
            g.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < 4; i++) g.lineTo(pts[i].x, pts[i].y);
            g.closePath();
            g.fillPath();

            g.lineStyle(3, hlColor, 0.7);
            g.beginPath();
            g.moveTo(pts[0].x, pts[0].y);
            g.lineTo(pts[1].x, pts[1].y);
            g.strokePath();

            g.lineStyle(3, shColor, 0.8);
            g.beginPath();
            g.moveTo(pts[2].x, pts[2].y);
            g.lineTo(pts[3].x, pts[3].y);
            g.strokePath();
        } else {
            g.fillStyle(color);
            g.fillRoundedRect(x - w / 2, y - h / 2 + 2, w, h - 2, BLOCK_RADIUS);
            g.fillStyle(hlColor, 0.7);
            g.fillRect(x - w / 2 + 1, y - h / 2 + 2, w - 2, 4);
            g.fillStyle(shColor, 0.8);
            g.fillRect(x - w / 2 + 1, y + h / 2 - 4, w - 2, 4);
            g.fillStyle(shColor, 0.5);
            g.fillRect(x + w / 2 - 4, y - h / 2 + 4, 4, h - 6);
        }
    },

    drawBlockShadow(scene) {
        let topY = PLATFORM_Y;
        for (const b of scene.droppedBlocks) {
            if (b.settled && b.body) {
                const by = b.body.position.y - b.height / 2;
                if (by < topY) topY = by;
            }
        }
        const pos = scene.swingBlock.body.position;
        const w = scene.swingBlock.width;
        scene.blockGraphics.fillStyle(0x000000, 0.15);
        scene.blockGraphics.fillEllipse(pos.x, topY - 2, w * 0.8, 6);
    },

    drawGhost(scene, px, w, h) {
        scene.ghostGraphics.clear();
        let topY = PLATFORM_Y;
        for (const b of scene.droppedBlocks) {
            if (b.settled && b.body) {
                const by = b.body.position.y - b.height / 2;
                if (by < topY) topY = by;
            }
        }
        scene.ghostGraphics.lineStyle(2, 0xFFFFFF, 0.4);
        const gx = px - w / 2, gy = topY - h;
        this.drawDashedRect(scene.ghostGraphics, gx, gy, w, h, 6, 4);
    },

    drawDashedRect(g, x, y, w, h, dash, gap) {
        const sides = [
            [x, y, x + w, y], [x + w, y, x + w, y + h],
            [x + w, y + h, x, y + h], [x, y + h, x, y]
        ];
        for (const [x1, y1, x2, y2] of sides) {
            const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const dx = (x2 - x1) / len, dy = (y2 - y1) / len;
            let d = 0, drawing = true;
            while (d < len) {
                const seg = drawing ? dash : gap;
                const end = Math.min(d + seg, len);
                if (drawing) {
                    g.beginPath();
                    g.moveTo(x1 + dx * d, y1 + dy * d);
                    g.lineTo(x1 + dx * end, y1 + dy * end);
                    g.strokePath();
                }
                d = end;
                drawing = !drawing;
            }
        }
    },

    drawVignette(scene) {
        scene.vignetteGraphics.clear();
        if (scene.tilt >= TILT_WARNING_THRESHOLD) {
            const intensity = (scene.tilt - TILT_WARNING_THRESHOLD) / (TILT_MAX - TILT_WARNING_THRESHOLD);
            const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.004 * Math.PI);
            const alpha = intensity * 0.3 * pulse;
            scene.vignetteGraphics.fillStyle(COLORS.danger, alpha);
            scene.vignetteGraphics.fillRect(0, 0, 20, GAME_HEIGHT);
            scene.vignetteGraphics.fillRect(GAME_WIDTH - 20, 0, 20, GAME_HEIGHT);
            scene.vignetteGraphics.fillRect(0, 0, GAME_WIDTH, 20);
            scene.vignetteGraphics.fillRect(0, GAME_HEIGHT - 20, GAME_WIDTH, 20);
        }
    },

    drawPendulum(scene, px, py) {
        scene.pendulumGraphics.clear();
        scene.pendulumGraphics.lineStyle(2, COLORS.pendulumLine);
        scene.pendulumGraphics.beginPath();
        scene.pendulumGraphics.moveTo(PENDULUM_PIVOT_X, PENDULUM_PIVOT_Y);
        scene.pendulumGraphics.lineTo(px, py);
        scene.pendulumGraphics.strokePath();
        scene.pendulumGraphics.fillStyle(0xAAAAAA);
        scene.pendulumGraphics.fillCircle(PENDULUM_PIVOT_X, PENDULUM_PIVOT_Y, 6);
    }
};

const JuiceEffects = {
    emitParticles(scene, x, y, count, color, arc, lifespan) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.random() - 0.5) * arc * Math.PI / 180 - Math.PI / 2;
            const speed = 80 + Math.random() * 200;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 3 + Math.random() * 3;
            const p = scene.add.rectangle(x, y, size, size, color).setDepth(50);
            scene.tweens.add({
                targets: p, x: x + vx * (lifespan / 1000), y: y + vy * (lifespan / 1000) + 50,
                alpha: 0, duration: lifespan, ease: 'Power2',
                onComplete: () => p.destroy()
            });
        }
    },

    screenFlash(scene, color, maxAlpha, duration) {
        const flash = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, color, 0)
            .setDepth(95).setScrollFactor(0);
        scene.tweens.add({
            targets: flash, alpha: maxAlpha, duration: duration * 0.3, yoyo: true,
            onComplete: () => flash.destroy()
        });
    },

    floatingScore(scene, x, y, text, color) {
        const txt = scene.add.text(x, y, text, {
            fontSize: '22px', fontStyle: 'bold', color: color
        }).setOrigin(0.5).setDepth(60).setScrollFactor(0);
        scene.tweens.add({
            targets: txt, y: y - 60, alpha: 0, duration: 700,
            onComplete: () => txt.destroy()
        });
    },

    firstBlockImpact(scene, pos) {
        this.emitParticles(scene, pos.x, pos.y, 50, COLORS.perfect, 360, 600);
        scene.cameras.main.shake(300, 0.015);
        scene.cameras.main.zoomTo(1.06, 150, 'Power2', true, (cam, progress) => {
            if (progress === 1) scene.cameras.main.zoomTo(1, 150);
        });
        audioManager.play('land_perfect', { pitch: 1.2 });
    },

    landingJuice(scene, quality, pos, points, blockData) {
        if (quality === 'perfect') {
            this.screenFlash(scene, COLORS.perfect, 0.35, 120);
            this.emitParticles(scene, pos.x, pos.y, 40, COLORS.perfect, 120, 500);
            scene.matter.world.pause();
            scene.time.delayedCall(40, () => { if (!scene.gameOver) scene.matter.world.resume(); });
            scene.cameras.main.zoomTo(1.04, 100, 'Power2', true, (cam, p) => {
                if (p === 1) scene.cameras.main.zoomTo(1, 100);
            });
            const pitch = 1 + Math.min(0.3, scene.perfectStreak * 0.05);
            audioManager.play('land_perfect', { pitch });
            if (scene.perfectStreak >= 2) {
                const txt = scene.add.text(GAME_WIDTH / 2, pos.y - 40, 'PERFECT!', {
                    fontSize: '28px', fontStyle: 'bold', color: '#FFD700'
                }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
                scene.tweens.add({ targets: txt, scaleX: 1.2, scaleY: 1.2, duration: 125, yoyo: true });
                scene.tweens.add({ targets: txt, y: txt.y - 30, alpha: 0, duration: 600, delay: 250, onComplete: () => txt.destroy() });
            }
        } else if (quality === 'great') {
            this.emitParticles(scene, pos.x, pos.y, 20, blockData.color, 120, 350);
            scene.cameras.main.shake(80, 0.002);
            audioManager.play('land_great');
        } else {
            this.emitParticles(scene, pos.x, pos.y, 12, blockData.color, 90, 250);
            scene.cameras.main.shake(60, 0.001);
            audioManager.play('land_normal');
        }

        this.floatingScore(scene, pos.x, pos.y - 20, `+${points}`, quality === 'perfect' ? '#FFD700' : '#FFFFFF');
        this.vibrate(quality === 'perfect' ? 40 : 20);

        Phaser.Physics.Matter.Matter.Body.setAngularVelocity(blockData.body, (Math.random() - 0.5) * 0.02);
    },

    missJuice(scene, pos) {
        scene.cameras.main.shake(250, 0.008);
        this.screenFlash(scene, COLORS.danger, 0.3, 200);
        audioManager.play('miss');
        this.vibrate(50);
        if (pos) this.emitParticles(scene, pos.x, pos.y, 8, COLORS.blockShadow, 90, 400);
    },

    collapseJuice(scene) {
        const topBlocks = scene.droppedBlocks.slice(-3);
        for (const b of topBlocks) {
            if (b.body && !b.body.isStatic) {
                Phaser.Physics.Matter.Matter.Body.applyForce(b.body, b.body.position, {
                    x: (Math.random() - 0.5) * 0.08, y: -0.06
                });
            }
        }
        scene.cameras.main.shake(500, 0.015);
        audioManager.play('collapse');
        scene.matter.world.engine.timing.timeScale = 0.3;
        scene.cameras.main.zoomTo(0.75, 800);

        const desat = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
            .setDepth(80).setScrollFactor(0);
        scene.tweens.add({ targets: desat, alpha: 0.5, duration: 600 });
    },

    vibrate(ms) {
        try {
            const settings = StorageManager.getSettings();
            if (settings.vibration && navigator.vibrate) navigator.vibrate(ms);
        } catch (e) { /* ignore */ }
    }
};
