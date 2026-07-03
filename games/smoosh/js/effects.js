// =============================================================================
// SMOOSH! - effects.js
// Pooled juice: burst particles, goo splat decals, damage texts, coin pops,
// confetti. Pools are per-scene, stored on scene._fxPools (rebuilt each
// scene create because Phaser destroys display objects on shutdown).
// =============================================================================

const Effects = {

    CONFETTI_COLORS: [0x7dffb2, 0xff9ad5, 0x6fa8ff, 0xffe066, 0xc7a4ff, 0xffffff],

    _pools(scene) {
        if (!scene._fxPools || scene._fxPoolsScene !== scene.scene.key + scene.time.startTime) {
            scene._fxPools = { bursts: [], goos: [], texts: [], coins: [] };
            scene._fxPoolsScene = scene.scene.key + scene.time.startTime;
            scene.events.once('shutdown', () => { scene._fxPools = null; });
        }
        return scene._fxPools;
    },

    _acquire(scene, pool, maker) {
        for (const o of pool) if (!o.visible) return o;
        const o = maker();
        pool.push(o);
        return o;
    },

    // Pop particles flying out of a kill. `scale` grows size AND reach.
    burst(scene, x, y, tint, n, scale) {
        const pools = this._pools(scene);
        const count = n || 10;
        const k = scale || 1;
        for (let i = 0; i < count; i++) {
            const spr = this._acquire(scene, pools.bursts, () =>
                scene.add.image(0, 0, 'pop-tex').setDepth(6));
            spr.setPosition(x, y).setVisible(true).setActive(true)
                .setAlpha(1).setScale(Phaser.Math.FloatBetween(0.5, 1.2) * k)
                .setTint(tint || 0xffffff);
            const ang = Math.random() * Math.PI * 2;
            const dist = Phaser.Math.Between(40, 130) * k;
            scene.tweens.add({
                targets: spr,
                x: x + Math.cos(ang) * dist,
                y: y + Math.sin(ang) * dist,
                alpha: 0, scale: 0.1,
                duration: Phaser.Math.Between(250, 450) + k * 60,
                ease: 'Quad.easeOut',
                onComplete: () => spr.setVisible(false).setActive(false)
            });
        }
    },

    // Expanding shockwave ring.
    ring(scene, x, y, tint, radius) {
        const spr = scene.add.image(x, y, 'ring-tex').setDepth(7)
            .setTint(tint || 0xffffff).setAlpha(0.9).setScale(0.3);
        scene.tweens.add({
            targets: spr, scale: (radius || 100) / 32, alpha: 0,
            duration: 380, ease: 'Quad.easeOut',
            onComplete: () => spr.destroy()
        });
    },

    // Soft additive flash at a point.
    flash(scene, x, y, tint, size) {
        const spr = scene.add.image(x, y, 'pop-tex').setDepth(8)
            .setTint(tint || 0xffffff).setAlpha(0.85)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDisplaySize(size || 80, size || 80);
        scene.tweens.add({
            targets: spr, alpha: 0, scale: spr.scaleX * 1.8,
            duration: 220, ease: 'Quad.easeOut',
            onComplete: () => spr.destroy()
        });
    },

    // Full-screen color flash (kept subtle-able via alpha).
    screenFlash(scene, color, alpha, ms) {
        const r = scene.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2,
            CONFIG.WIDTH, CONFIG.HEIGHT, color || 0xffffff, alpha || 0.25)
            .setDepth(19);
        scene.tweens.add({
            targets: r, alpha: 0, duration: ms || 260, ease: 'Quad.easeOut',
            onComplete: () => r.destroy()
        });
    },

    // One-stop kill FX, scaled to the monster's size (m = Monster).
    // Small jelly = a pop; chunky = a blast; boss handled separately.
    killFx(scene, m, feverBoost) {
        const k = Math.min(3, m.r / 40) * (feverBoost ? 1.4 : 1);
        const tint = m.def.color || 0xffffff;
        this.burst(scene, m.x, m.y, tint, Math.round(8 + k * 8), 0.7 + k * 0.5);
        this.ring(scene, m.x, m.y, tint, 60 + m.r * 1.6);
        this.flash(scene, m.x, m.y, 0xffffff, 50 + m.r * 1.2);
        this.goo(scene, m.x, m.y, tint, 0.7 + k * 0.55);
        if (m.r >= 50) {
            scene.cameras.main.shake(70 + m.r, 0.0015 + m.r * 0.00002);
            this.goo(scene, m.x - m.r * 0.6, m.y + m.r * 0.4, tint, 0.6);
        }
    },

    // Goo splat left on the floor; fades out. Pool capped at 40.
    goo(scene, x, y, tint, scale) {
        const pools = this._pools(scene);
        if (pools.goos.filter(g => g.visible).length >= 40) return;
        const spr = this._acquire(scene, pools.goos, () =>
            scene.add.image(0, 0, 'goo-tex').setDepth(1));
        spr.setPosition(x, y).setVisible(true).setActive(true)
            .setAlpha(0.5).setScale(Phaser.Math.FloatBetween(0.8, 1.5) * (scale || 1))
            .setAngle(Phaser.Math.Between(0, 360))
            .setTint(tint || 0xffffff);
        scene.tweens.add({
            targets: spr, alpha: 0, duration: 4000, ease: 'Quad.easeIn',
            onComplete: () => spr.setVisible(false).setActive(false)
        });
    },

    // Floating text v2.1 - the juicy version. Pool capped at 24.
    // opts: { crit: bool, big: bool }
    damageText(scene, x, y, str, color, opts) {
        const o = opts || {};
        const pools = this._pools(scene);
        if (pools.texts.filter(t => t.visible).length >= 24) return;
        const t = this._acquire(scene, pools.texts, () =>
            scene.add.text(0, 0, '', {
                fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
                stroke: '#141020', strokeThickness: 6
            }).setOrigin(0.5).setDepth(12));

        const size = o.crit ? 46 : o.big ? 38 : 27;
        const drift = Phaser.Math.Between(-30, 30);
        t.setPosition(x + Phaser.Math.Between(-8, 8), y)
            .setText(str).setColor(color || '#e8e6f5')
            .setFontSize(size)
            .setAngle(Phaser.Math.Between(-9, 9))
            .setVisible(true).setActive(true).setAlpha(1).setScale(0.3);

        // pop-in punch, then float away with a slight arc
        scene.tweens.add({
            targets: t, scale: o.crit ? 1.25 : 1, duration: 130, ease: 'Back.easeOut'
        });
        scene.tweens.add({
            targets: t, y: y - (o.crit ? 96 : 70), x: t.x + drift,
            angle: 0, alpha: 0,
            delay: o.crit ? 160 : 90,
            duration: o.crit ? 620 : 480, ease: 'Quad.easeOut',
            onComplete: () => t.setVisible(false).setActive(false)
        });
        if (o.crit) {
            scene.tweens.add({
                targets: t, scale: 0.95, delay: 130, duration: 80, yoyo: true
            });
        }
    },

    // Coins fly to the HUD counter.
    coinPop(scene, x, y, n, toHud) {
        const pools = this._pools(scene);
        const to = toHud || { x: CONFIG.WIDTH - 60, y: 60 };
        for (let i = 0; i < n; i++) {
            const spr = this._acquire(scene, pools.coins, () =>
                scene.add.image(0, 0, 'coin-tex').setDepth(12));
            spr.setPosition(x + Phaser.Math.Between(-24, 24), y + Phaser.Math.Between(-16, 16))
                .setVisible(true).setActive(true).setAlpha(1).setScale(0.9);
            scene.tweens.add({
                targets: spr, x: to.x, y: to.y, scale: 0.4,
                delay: i * 35, duration: 360, ease: 'Quad.easeIn',
                onComplete: () => spr.setVisible(false).setActive(false)
            });
        }
    },

    confetti(scene, x, y) {
        for (let i = 0; i < 36; i++) {
            const spr = scene.add.image(x, y, 'confetti-tex')
                .setDepth(15)
                .setTint(Phaser.Utils.Array.GetRandom(this.CONFETTI_COLORS))
                .setScale(Phaser.Math.FloatBetween(0.6, 1.2));
            const ang = Phaser.Math.FloatBetween(-Math.PI, 0);
            const speed = Phaser.Math.Between(260, 600);
            const vx = Math.cos(ang) * speed;
            const vy = Math.sin(ang) * speed;
            const life = Phaser.Math.FloatBetween(0.8, 1.2);
            scene.tweens.addCounter({
                from: 0, to: 1, duration: life * 1000,
                onUpdate: (tw) => {
                    if (!spr.active) return;
                    const t = tw.getValue() * life;
                    spr.x = x + vx * t;
                    spr.y = y + vy * t + 0.5 * 1600 * t * t;
                    spr.angle += 9;
                    if (t > life * 0.6) spr.alpha = 1 - (t - life * 0.6) / (life * 0.4);
                },
                onComplete: () => spr.destroy()
            });
        }
    }
};

if (typeof module !== 'undefined') module.exports = { Effects };
