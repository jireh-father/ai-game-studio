// =============================================================================
// SMOOSH! - effects.js
// Pooled juice: burst particles, goo splat decals, damage texts, coin pops,
// confetti. Pools are per-scene, stored on scene._fxPools (rebuilt each
// scene create because Phaser destroys display objects on shutdown).
// =============================================================================

const Effects = {

    // v4.0 Phase C Task 2: role-mapped from the old hardcoded rainbow
    // (mint/pink/blue/yellow/purple/white) onto the closest pastel token per
    // swatch, keeping the same 6-color celebratory spread.
    CONFETTI_COLORS: [CONFIG.PASTEL.good, CONFIG.PASTEL.fever, CONFIG.PASTEL.elements.water.base,
        CONFIG.PASTEL.elements.electric.base, CONFIG.PASTEL.accent, CONFIG.PASTEL.white],

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
                .setTint(tint || CONFIG.PASTEL.white);
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
            .setTint(tint || CONFIG.PASTEL.white).setAlpha(0.9).setScale(0.3);
        scene.tweens.add({
            targets: spr, scale: (radius || 100) / 32, alpha: 0,
            duration: 380, ease: 'Quad.easeOut',
            onComplete: () => spr.destroy()
        });
    },

    // Soft additive flash at a point.
    flash(scene, x, y, tint, size) {
        const spr = scene.add.image(x, y, 'pop-tex').setDepth(8)
            .setTint(tint || CONFIG.PASTEL.white).setAlpha(0.85)
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
            CONFIG.WIDTH, CONFIG.HEIGHT, color || CONFIG.PASTEL.white, alpha || 0.25)
            .setDepth(19);
        scene.tweens.add({
            targets: r, alpha: 0, duration: ms || 260, ease: 'Quad.easeOut',
            onComplete: () => r.destroy()
        });
    },

    // =========================================================================
    // v6 Task 7 - whole-screen FEVER spectacle. Previously fever only got a
    // one-shot flash+ring+banner at the trigger instant, then a bare camera-
    // background hue cycle for the rest of the window - it read as "started"
    // but not "happening". This builds a persistent layer (border glow +
    // rainbow field tint + CRT-style scanline sweep + a denser drifting
    // ember field) that lives for the WHOLE fever duration.
    //
    // Depth 9: matches the existing convention (monsters=3, pet/nest hp
    // bars=4-8) of "sits above every field entity, below the depth-10+ HUD"
    // - the same band effects.js's own flash()/ring()/biteFx() already use
    // for impact FX layered over monsters (see depth 6-9 above), so the
    // spectacle reads as an ambient field-wide layer, never blocking taps or
    // hiding the HUD numbers players need mid-fever.
    //
    // Returns a plain handle - {update(dt), destroy()} - NOT tied into any
    // pool: this is a single long-lived effect (one per fever activation),
    // not a bursty one-shot, so it owns its own objects outright and frees
    // them all in destroy(). The caller (GameScene) ticks update(dt) once a
    // frame from updateFever() and MUST call destroy() on every fever-end
    // path (natural timeout AND scene shutdown) - see game.js task-7 notes.
    // =========================================================================
    feverOverlay(scene) {
        const F = CONFIG.FIELD;
        const BW = 14; // border glow thickness

        const mkBar = (x, y, w, h) => scene.add.rectangle(x, y, w, h, CONFIG.PASTEL.fever, 0.55)
            .setBlendMode(Phaser.BlendModes.ADD).setDepth(9);
        const border = [
            mkBar(F.x + F.w / 2, F.y - BW / 2, F.w + BW * 2, BW),           // top
            mkBar(F.x + F.w / 2, F.y + F.h + BW / 2, F.w + BW * 2, BW),     // bottom
            mkBar(F.x - BW / 2, F.y + F.h / 2, BW, F.h + BW * 2),           // left
            mkBar(F.x + F.w + BW / 2, F.y + F.h / 2, BW, F.h + BW * 2)      // right
        ];

        // rainbow field tint - a soft additive wash across the whole field
        const tint = scene.add.rectangle(F.x + F.w / 2, F.y + F.h / 2, F.w, F.h, CONFIG.PASTEL.fever, 0.12)
            .setBlendMode(Phaser.BlendModes.ADD).setDepth(9);

        // CRT-style scanline sweep (nods to the v5.0 RETRO ARCADE theme)
        const scan = scene.add.graphics().setDepth(9).setBlendMode(Phaser.BlendModes.ADD);

        // denser drifting embers - upward-floating sparks, always-on for the
        // whole window (regular kill/skill FX already cover the "burst"
        // moments; this is the ambient "the whole field is charged" layer)
        const EMBER_N = 16;
        const embers = [];
        for (let i = 0; i < EMBER_N; i++) {
            const e = scene.add.image(
                F.x + Math.random() * F.w, F.y + Math.random() * F.h, 'pop-tex')
                .setDepth(9).setBlendMode(Phaser.BlendModes.ADD)
                .setScale(Phaser.Math.FloatBetween(0.35, 0.85))
                .setAlpha(Phaser.Math.FloatBetween(0.25, 0.55))
                .setTint(CONFIG.PASTEL.fever);
            e._vy = Phaser.Math.FloatBetween(22, 52);
            e._vx = Phaser.Math.FloatBetween(-12, 12);
            embers.push(e);
        }

        let hue = 0, scanY = 0;
        return {
            update(dt) {
                if (!tint.active) return; // destroyed mid-frame (scene teardown race)
                hue = (hue + dt * 0.55) % 1;
                const c = Phaser.Display.Color.HSVToRGB(hue, 0.85, 1);
                const col = Phaser.Display.Color.GetColor(c.r, c.g, c.b);

                tint.setFillStyle(col, 0.12);
                const pulse = 0.45 + Math.sin(hue * Math.PI * 10) * 0.2;
                for (const b of border) b.setFillStyle(col, pulse);

                scanY = (scanY + dt * 200) % 44;
                scan.clear();
                scan.fillStyle(col, 0.10);
                for (let y = F.y - 44 + scanY; y < F.y + F.h; y += 44) {
                    scan.fillRect(F.x, y, F.w, 3);
                }

                for (const e of embers) {
                    e.y -= e._vy * dt;
                    e.x += e._vx * dt;
                    if (e.y < F.y - 10) { e.y = F.y + F.h + 10; e.x = F.x + Math.random() * F.w; }
                    else if (e.x < F.x - 10 || e.x > F.x + F.w + 10) e.x = F.x + Math.random() * F.w;
                    e.setTint(col);
                }
            },
            destroy() {
                for (const b of border) b.destroy();
                tint.destroy();
                scan.destroy();
                for (const e of embers) e.destroy();
            }
        };
    },

    // Companion to feverOverlay() above - null-safe so every call site can
    // fire-and-forget without an existence check of its own.
    clearFeverOverlay(handle) {
        if (handle && typeof handle.destroy === 'function') handle.destroy();
    },

    // v6 Task 5: neon "bite" impact for a monster's melee lunge-strike - the
    // melee path already dealt damage (monsters.js `melee` case ->
    // monsterStrikeArea) but had no FX of its own, so it read as if the
    // attack never landed next to slam's ring+shake and charge's white
    // flash. Punchy-but-cheap: a tight additive flash + tight ring (both
    // self-destroying, same pattern as flash()/ring() above) plus 2-4
    // pooled spark shards flung a short distance (reuses the `bursts` pool
    // so it never allocates beyond the existing kill-burst pool ceiling).
    biteFx(scene, x, y, color) {
        const tint = color || CONFIG.PASTEL.danger;
        this.flash(scene, x, y, tint, 46);
        this.ring(scene, x, y, tint, 46);
        const pools = this._pools(scene);
        const n = Phaser.Math.Between(2, 4);
        for (let i = 0; i < n; i++) {
            const spr = this._acquire(scene, pools.bursts, () =>
                scene.add.image(0, 0, 'pop-tex').setDepth(9));
            spr.setPosition(x, y).setVisible(true).setActive(true)
                .setAlpha(1).setScale(Phaser.Math.FloatBetween(0.35, 0.6))
                .setTint(tint);
            const ang = Math.random() * Math.PI * 2;
            const dist = Phaser.Math.Between(18, 42);
            scene.tweens.add({
                targets: spr,
                x: x + Math.cos(ang) * dist,
                y: y + Math.sin(ang) * dist,
                alpha: 0, scale: 0.1,
                duration: Phaser.Math.Between(120, 200),
                ease: 'Quad.easeOut',
                onComplete: () => spr.setVisible(false).setActive(false)
            });
        }
    },

    // One-stop kill FX, scaled to the monster's size (m = Monster).
    // Small jelly = a pop; chunky = a blast; boss handled separately.
    killFx(scene, m, feverBoost) {
        const k = Math.min(3, m.r / 40) * (feverBoost ? 1.4 : 1);
        const tint = m.def.color || CONFIG.PASTEL.white;
        this.burst(scene, m.x, m.y, tint, Math.round(8 + k * 8), 0.7 + k * 0.5);
        this.ring(scene, m.x, m.y, tint, 60 + m.r * 1.6);
        this.flash(scene, m.x, m.y, CONFIG.PASTEL.white, 50 + m.r * 1.2);
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
            .setTint(tint || CONFIG.PASTEL.white);
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
                fontFamily: CONFIG.FONT, stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 6
            }).setOrigin(0.5).setDepth(12));

        const size = o.crit ? 46 : o.big ? 38 : 27;
        const drift = Phaser.Math.Between(-30, 30);
        t.setPosition(x + Phaser.Math.Between(-8, 8), y)
            .setText(str).setColor(color || Balance.hex(CONFIG.PASTEL.ink))
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

    // =========================================================================
    // v3.0 Task 9 - Effects.applySkillEffect(): the ONE shared translator that
    // turns a pure Skills.cast() descriptor into Phaser reality, for EITHER
    // caster side. Extracted from Task 8's Monsters.applyEffect (monsters.js)
    // so pets.js can reuse the exact same damage/heal/shield/status/knockback/
    // buff/spawn plumbing instead of forking it.
    //
    // side = 'monster' (self is a Monster, offense lands on pet agents, ally
    //        skills target other monsters/self) or
    //        'pet' (self is a FieldPets agent, offense lands on Monster
    //        instances via scene.damageMonster, ally skills target other pet
    //        agents/self/the Nest for heal).
    //
    // Monster behavior is UNCHANGED from Task 8 (same call shape, same
    // targets, same math) - only the pet-side branches are new.
    // =========================================================================

    applySkillEffect(scene, side, self, eff) {
        const now = scene.time.now;
        switch (eff.kind) {
            case 'status':    this._skillStatus(self, eff, now); break;
            case 'damage':    this._skillDamage(scene, side, self, eff); break;
            case 'heal':      this._skillHeal(scene, side, self, eff); break;
            case 'shield':    this._skillShield(scene, side, self, eff); break;
            case 'buff':      this._skillBuff(scene, side, self, eff, now); break;
            case 'knockback': this._skillKnockback(scene, side, self, eff); break;
            case 'spawn':     this._skillSpawn(scene, side, self, eff); break;
            case 'pull':      this._skillPull(scene, side, self, eff); break;
            // unknown kinds: silently ignored - nothing in the 24-monster/
            // 50-pet tables produces a kind this switch doesn't cover.
        }
    },

    // =========================================================================
    // v6 Task 6 - dramatic skill visibility. Monster/pet skills were already
    // fully functional (applySkillEffect above has always done the real
    // mutation) but read as ABSENT: every kind shared the exact same subtle
    // ring the cast sites drew afterward - indistinguishable from a normal
    // hit - and cooldowns were 7-14s to begin with. This section adds the
    // "you just saw something special happen" layer: a wind-up flash on the
    // caster in the archetype's OWN color (SKILL_COLOR - deliberately NOT
    // the caster's species/element tint, so a cast reads as its own event
    // class rather than a bigger hit), an uppercase name popup rising off
    // the caster ("FREEZE!", "PULL!"), and a per-archetype FX pass that's
    // bigger/more distinct than the plain hit-ring. Called by monsters.js's
    // _updateSkill and pets.js's _updateAgentSkill right after
    // applySkillEffect - same (scene, side, self) shape, plus the skill id
    // and its already-computed effect descriptor.
    // =========================================================================

    SKILL_COLOR: {
        stun: 0xccff00, slow: 0x00d9ff, knockback: 0xa79bd6, taunt: 0xff2f6e,
        shield: 0x00e5ff, heal: 0x39ff14, lifesteal: 0xff2f6e, poison: 0x9dff70,
        burn: 0xff9a5a, freeze: 0xbfe8ff, chain: 0xffe066, execute: 0xff2f6e,
        critaura: 0xccff00, goldaura: 0xffcc00, buffaura: 0xff2f6e,
        stealth: 0xa79bd6, clone: 0x00e5ff, summon: 0x00e5ff, dash: 0xffffff,
        slam: 0x00a870, pull: 0x39ff14
    },

    // Short uppercase label rising+fading above the caster. NOT pooled (a
    // pooled 24-cap exists for damageText because hits can fire many times a
    // second; skills fire at most once per multi-second cooldown even after
    // the v6 cd cuts, so one allocate-and-self-destroy text per cast is
    // cheap - same reasoning as confetti()'s unpooled sprites below).
    // fitToWidth-style clamp (ui.js's own helper isn't reusable here because
    // it stomps the entrance tween's scale - see the composable maxScale
    // math below) keeps a long id like "KNOCKBACK!" from overflowing near
    // the field edges.
    skillLabel(scene, x, y, id, color) {
        const t = scene.add.text(x, y, id.toUpperCase() + '!', {
            fontFamily: CONFIG.FONT, fontSize: '20px',
            color: Balance.hex(color || CONFIG.PASTEL.ink),
            stroke: Balance.hex(CONFIG.PASTEL.white), strokeThickness: 5
        }).setOrigin(0.5).setDepth(13);
        const maxScale = Math.min(1, 150 / Math.max(1, t.width));
        t.setScale(maxScale * 0.4);
        scene.tweens.add({ targets: t, scale: maxScale, y: y - 30, duration: 160, ease: 'Back.easeOut' });
        scene.tweens.add({
            targets: t, y: y - 60, alpha: 0, delay: 260, duration: 420, ease: 'Quad.easeOut',
            onComplete: () => t.destroy()
        });
    },

    // Jagged crackling bolt(s), self -> target1 -> target2 -> ... (mirrors
    // game.js GameScene.monsterZap's exact bolt-jitter recipe). Graphics
    // objects here are draw-once-and-fade (never scaled - they're drawn with
    // ABSOLUTE world coordinates baked into the path commands, so scaling
    // the object would drift the shape away from world origin instead of
    // expanding it in place; same reason game.js's monsterZap only fades
    // alpha too), each self-destroys onComplete.
    _fxLightning(scene, sx, sy, targets, color) {
        let fx = sx, fy = sy;
        for (const t of targets) {
            const tx = t.sprite.x, ty = t.sprite.y;
            const g = scene.add.graphics().setDepth(9);
            g.lineStyle(5, color, 1);
            g.beginPath();
            g.moveTo(fx, fy);
            const steps = 4;
            for (let i = 1; i <= steps; i++) {
                const tt = i / steps;
                g.lineTo(
                    fx + (tx - fx) * tt + (i < steps ? Phaser.Math.Between(-24, 24) : 0),
                    fy + (ty - fy) * tt + (i < steps ? Phaser.Math.Between(-24, 24) : 0));
            }
            g.strokePath();
            scene.tweens.add({ targets: g, alpha: 0, duration: 220, ease: 'Quad.easeOut', onComplete: () => g.destroy() });
            this.flash(scene, tx, ty, color, 50);
            fx = tx; fy = ty; // chains target-to-target, not just self-to-every-target
        }
    },

    // Icy sliver shards flung outward + a cold flash/ring - reuses the
    // shared `bursts` pool (safe: every reacquire in burst()/biteFx() calls
    // setScale with a SINGLE value, which resets both axes and clears the
    // non-uniform scale/rotation this leaves behind - see _pools()/_acquire()
    // above; pop-tex is a round particle so a leftover rotation is invisible
    // even before that reset happens).
    _fxIceShards(scene, x, y) {
        this.flash(scene, x, y, 0xbfe8ff, 70);
        this.ring(scene, x, y, 0xbfe8ff, 80);
        const pools = this._pools(scene);
        for (let i = 0; i < 6; i++) {
            const spr = this._acquire(scene, pools.bursts, () => scene.add.image(0, 0, 'pop-tex').setDepth(9));
            const ang = (i / 6) * Math.PI * 2;
            spr.setPosition(x, y).setVisible(true).setActive(true).setAlpha(1)
                .setScale(0.5, 0.18).setRotation(ang).setTint(0xbfe8ff);
            scene.tweens.add({
                targets: spr, x: x + Math.cos(ang) * 46, y: y + Math.sin(ang) * 46,
                alpha: 0, duration: 320, ease: 'Quad.easeOut',
                onComplete: () => spr.setVisible(false).setActive(false)
            });
        }
    },

    // A double-ring "bubble" for shield - reuses the already-correct
    // image-based ring()/flash() (their OWN scale tweens expand around each
    // sprite's own center) instead of a scaled Graphics object, which would
    // drift off-center for the same reason _fxLightning's bolts never scale.
    _fxBubble(scene, x, y, r) {
        this.ring(scene, x, y, CONFIG.PASTEL.accent, r * 1.6);
        scene.time.delayedCall(90, () => this.ring(scene, x, y, CONFIG.PASTEL.white, r * 1.3));
        this.flash(scene, x, y, CONFIG.PASTEL.accent, r * 1.8);
    },

    // Frog-tongue line: a graphics path from the caster to a point that
    // starts at the target's original spot and eases toward the caster over
    // `durationMs` (in lockstep with _skillPull's own sprite-position tween)
    // - reads as the tongue "retracting" and reeling its catch in. Uses
    // tweens.addCounter + per-frame clear()+redraw, the same idiom confetti()
    // below already uses for its parabolic arcs. `g.active` guard mirrors
    // confetti()'s `spr.active` check (scene shutdown can destroy objects
    // mid-tween).
    _fxTongue(scene, sx, sy, tx0, ty0, color, durationMs) {
        const g = scene.add.graphics().setDepth(9);
        scene.tweens.addCounter({
            from: 0, to: 1, duration: durationMs,
            onUpdate: (tw) => {
                if (!g.active) return;
                const t = tw.getValue();
                const ex = tx0 + (sx - tx0) * t, ey = ty0 + (sy - ty0) * t;
                g.clear();
                g.lineStyle(6, color, 1 - t * 0.3);
                g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.strokePath();
                g.fillStyle(color, 1); g.fillCircle(ex, ey, 8);
            },
            onComplete: () => g.destroy()
        });
    },

    // The public entry point (see the section banner above). side/self/id/eff
    // mirror applySkillEffect's own signature - id is the skill id (e.g.
    // 'freeze'), used both to pick SKILL_COLOR and to pick which per-kind FX
    // branch below runs.
    skillCastFx(scene, side, self, id, eff) {
        if (!self.sprite) return;
        const sx = self.sprite.x, sy = self.sprite.y;
        const color = this.SKILL_COLOR[id] !== undefined ? this.SKILL_COLOR[id]
            : (self.def && self.def.color) || CONFIG.PASTEL.white;
        const selfR = self.r || (self.size ? self.size / 2 : 40);

        this.flash(scene, sx, sy, color, selfR * 2.2);        // wind-up telegraph
        this.skillLabel(scene, sx, sy - selfR - 6, id, color); // "FREEZE!" etc

        // Real target refs (status/damage/knockback carry live entity
        // objects in eff.targets; heal/shield/stealth use string sentinels
        // ('self'/'ally-lowest') already resolved+FX'd inside
        // applySkillEffect, and buff/spawn have no targets[] at all) - only
        // these get per-target FX below.
        const targets = (eff.targets || []).filter(t => t && typeof t === 'object' && t.sprite);

        switch (id) {
            case 'freeze':
                for (const t of targets) this._fxIceShards(scene, t.sprite.x, t.sprite.y);
                break;
            case 'chain':
                this._fxLightning(scene, sx, sy, targets, color);
                break;
            case 'shield':
                this._fxBubble(scene, sx, sy, selfR);
                break;
            case 'knockback':
                this.ring(scene, sx, sy, color, selfR * 3);
                for (const t of targets) this.flash(scene, t.sprite.x, t.sprite.y, color, 50);
                break;
            case 'heal':
                for (let i = 0; i < 3; i++) {
                    scene.time.delayedCall(i * 90, () => this.ring(scene, sx, sy, CONFIG.PASTEL.good, selfR * (1.2 + i * 0.5)));
                }
                break;
            case 'critaura': case 'goldaura': case 'buffaura':
                for (let i = 0; i < 3; i++) {
                    scene.time.delayedCall(i * 100, () => this.ring(scene, sx, sy, color, selfR * (1.3 + i * 0.6)));
                }
                break;
            case 'stealth':
                this.burst(scene, sx, sy, color, 10, 1);
                break;
            case 'clone': case 'summon':
                this.burst(scene, sx, sy, color, 14, 1.2);
                this.ring(scene, sx, sy, color, selfR * 2.2);
                break;
            case 'pull':
                // bespoke tongue-line + arrival flash already drawn by
                // applySkillEffect's _skillPull - nothing more to layer here.
                break;
            default: {
                // stun/slow/taunt/poison/burn/lifesteal/execute/dash/slam: a
                // bigger flash+ring+burst combo per target, well beyond the
                // single subtle ring the old cast-site code drew for every
                // kind alike.
                const pts = targets.length ? targets.map(t => ({ x: t.sprite.x, y: t.sprite.y })) : [{ x: sx, y: sy }];
                for (const p of pts) {
                    this.flash(scene, p.x, p.y, color, 70);
                    this.ring(scene, p.x, p.y, color, 90);
                    this.burst(scene, p.x, p.y, color, 8, 1);
                }
            }
        }
    },

    // A target is "alive" from the CASTER's perspective: monster casters hit
    // pet agents (alive := !ko), pet casters hit Monster instances
    // (alive := m.alive). The Nest (heal-only ally target) uses `.broken`.
    _skillTargetAlive(casterSide, t) {
        if (!t) return false;
        if (t.broken !== undefined) return !t.broken; // the Nest
        return casterSide === 'monster' ? !t.ko : t.alive;
    },

    // stun/freeze/slow/taunt/poison/burn (offense) + stealth (self). An
    // empty targets[] is always a safe no-op here regardless - as of v6
    // Task 6 it also never actually reaches this function: the cast sites
    // (monsters.js/pets.js) now check Skills.isWhiff() BEFORE calling
    // applySkillEffect at all, so an empty-target cast pays no cooldown and
    // never gets this far (see isWhiff's doc comment - this reverses the old
    // v3.0 Task 7 ruling that paid the cooldown either way). Side-agnostic:
    // both Monster and pet-agent objects use the same `status` map shape.
    _skillStatus(self, eff, now) {
        // taunt's cast() flags `source: true` because the pure library can't
        // know the caster's identity - the engine fills it in here, for
        // EITHER side (a pet's taunt forces monsters to target it right back).
        const extra = eff.status === 'taunt' ? { forceTarget: self } : {};
        for (const id of eff.targets || []) {
            const t = id === 'self' ? self : id; // real refs pass straight through
            if (!t || t.ko === true || t.alive === false) continue;
            t.status = t.status || {};
            t.status[eff.status] = Object.assign(
                { until: now + eff.durationMs, dotPerSec: eff.dotPerSec }, extra);
        }
    },

    // chain/dash/slam/execute/lifesteal/knockback-adjacent damage. Monster
    // casters land on pet agents (unchanged Task 8 path); pet casters land on
    // Monster instances via scene.damageMonster, routed through the SAME
    // elemental multiplier + Super!/Resisted feedback the regular pet
    // auto-attack uses (FieldPets._elemHit) so a skill hit feels identical to
    // a normal hit, just bigger.
    _skillDamage(scene, side, self, eff) {
        const targets = eff.targets || [];
        for (const t of targets) {
            if (!this._skillTargetAlive(side, t)) continue;
            if (side === 'monster') {
                // Loop-scoped `continue` (not a function-level `return` guard
                // at the top of _skillDamage) is intentional: fieldPets is
                // constructed in GameScene.create() before any monster can
                // ever act, so in real play this is always true for every
                // target in this loop anyway - the per-target form just keeps
                // this branch from assuming that "no fieldPets" is a whole-
                // cast property rather than a per-target one.
                if (!scene.fieldPets) continue;
                const dmg = scene._petElemHit(self, t, eff.amount);
                scene.fieldPets.damageAgent(t, dmg, self.def.color);
            } else {
                const dmg = scene.fieldPets
                    ? scene.fieldPets._elemHit(scene, self.def.element, t, eff.amount)
                    : eff.amount;
                scene.damageMonster(t, dmg, false, t.x, t.y, 'pet:' + self.def.element);
            }
        }
        if (eff.dash && targets[0] && targets[0].sprite) {
            const sx = self.sprite.x, sy = self.sprite.y;
            const tsp = targets[0].sprite;
            const lx = sx + (tsp.x - sx) * 0.5, ly = sy + (tsp.y - sy) * 0.5;
            scene.tweens.add({ targets: self.sprite, x: lx, y: ly, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
        }
        if (eff.heal) { // lifesteal
            self.hp = Math.min(self.maxHp, self.hp + Math.round(eff.amount * eff.heal));
        }
    },

    // Resolves cast()'s 'self'/'ally-lowest' sentinels to a real target.
    // Monster side: ally pool = other living monsters (Task 8, unchanged).
    // Pet side: ally pool = non-KO pet agents, PLUS the Nest when
    // opts.includeNest (heal only - a healer feeding health to the base).
    _skillResolveAlly(scene, side, self, id, opts) {
        if (id === 'self') return self;
        if (id !== 'ally-lowest') return id; // already a resolved reference
        if (side === 'monster') {
            const alive = scene.active.filter(m => m.alive);
            if (!alive.length) return self;
            return alive.reduce((a, b) => (a.hp / a.maxHp <= b.hp / b.maxHp ? a : b));
        }
        const pool = [];
        if (scene.fieldPets) for (const a of scene.fieldPets.agents) if (!a.ko) pool.push(a);
        if (opts && opts.includeNest && scene.nest && !scene.nest.broken) pool.push(scene.nest);
        if (!pool.length) return self;
        return pool.reduce((a, b) => (a.hp / a.maxHp <= b.hp / b.maxHp ? a : b));
    },

    _skillHeal(scene, side, self, eff) {
        const t = this._skillResolveAlly(scene, side, self, (eff.targets || [])[0], { includeNest: true });
        if (!this._skillTargetAlive(side, t)) return;
        t.hp = Math.min(t.maxHp, t.hp + eff.amount);
        if (t.redraw) t.redraw(); // the Nest draws its own HP bar
        this.ring(scene, t.sprite.x, t.sprite.y, CONFIG.PASTEL.good, (t.r || (t.size || 120) / 2) * 1.3);
        this.damageText(scene, t.sprite.x, t.sprite.y - (t.r || (t.size || 120) / 2) - 10,
            '+' + Balance.fmt(eff.amount), Balance.hex(CONFIG.PASTEL.good));
    },

    // tank/shieldy/panda/hedgehog/turtle: a damage-absorbing pool, consumed
    // in Monster.hit() (monster targets) or FieldPets.damageAgent() (pet
    // targets) before HP. Task 7 ruling: amounts can be fractional - round
    // on application. Never targets the Nest (its HP isn't status-driven).
    _skillShield(scene, side, self, eff) {
        const t = this._skillResolveAlly(scene, side, self, (eff.targets || [])[0]);
        if (!this._skillTargetAlive(side, t)) return;
        t.status = t.status || {};
        const prev = t.status.shield ? t.status.shield.amount : 0;
        t.status.shield = { amount: Math.round(prev + eff.amount) };
        // generic mechanic FX (not element-tied) - matches game.js's shield
        // crack burst (shieldAllowsDamage) - neutral inkSoft.
        this.ring(scene, t.sprite.x, t.sprite.y, CONFIG.PASTEL.inkSoft, (t.r || (t.size || 120) / 2) * 1.5);
    },

    // buffaura/goldaura/critaura. Monster side (unchanged): applies to every
    // living monster's `status['buff_'+stat]` (consumed by
    // Monster._updateAttack's buff_dmg read; buff_gold/buff_crit are inert
    // for monsters by design - no engine hook needs them).
    // Pet side (NEW): team-wide auras don't ride individual agent status -
    // they buff the PLAYER's own numbers, so they're stored on
    // scene.teamBuffs[stat] and read by GameScene.teamBuffAdd() from
    // applyTap() (crit), onKill() (gold), and FieldPets._attack() (dmg).
    _skillBuff(scene, side, self, eff, now) {
        if (side === 'pet') {
            scene.teamBuffs = scene.teamBuffs || {};
            scene.teamBuffs[eff.stat] = { add: eff.add, until: now + eff.durationMs };
            return;
        }
        for (const t of scene.active) {
            if (!t.alive) continue;
            t.status = t.status || {};
            t.status['buff_' + eff.stat] = { until: now + eff.durationMs, add: eff.add };
        }
    },

    // drop/chunky/whale/horse: shoves targets outward (away from self),
    // clamped to the play field. Empty targets[] is a harmless no-op here,
    // though as of v6 Task 6 it never actually reaches this function for the
    // same reason noted on _skillStatus above (isWhiff() gates it earlier).
    _skillKnockback(scene, side, self, eff) {
        const F = CONFIG.FIELD;
        const sx = self.sprite.x, sy = self.sprite.y;
        for (const t of eff.targets || []) {
            if (!this._skillTargetAlive(side, t) || !t.sprite) continue;
            const dx = t.sprite.x - sx, dy = t.sprite.y - sy;
            const dist = Math.hypot(dx, dy) || 1;
            const half = (t.size ? t.size / 2 : (t.r || 40));
            const nx = Phaser.Math.Clamp(t.sprite.x + (dx / dist) * eff.distance, F.x + half, F.x + F.w - half);
            const ny = Phaser.Math.Clamp(t.sprite.y + (dy / dist) * eff.distance, F.y + half, F.y + F.h - half);
            scene.tweens.add({ targets: t.sprite, x: nx, y: ny, duration: 180, ease: 'Quad.easeOut' });
        }
    },

    // v6 Task 6 - frog-tongue PULL: drags the single nearest in-range foe
    // toward the caster over ~250ms (a retracting tongue-line FX, see
    // _fxTongue) then lands a damage tick on arrival. Mirrors _skillDamage's
    // exact monster-vs-pet damage routing (same elemental-multiplier
    // pipeline) so a pull's chip damage feels identical to any other skill
    // hit. Guards against a target that died/KO'd between cast() and this
    // call (nothing else runs in between today), AND re-guards inside the
    // delayed damage tick 250ms later - the target can easily die from
    // something else (e.g. its own poison DoT, or a tap) in that window.
    _skillPull(scene, side, self, eff) {
        const t = (eff.targets || [])[0];
        if (!this._skillTargetAlive(side, t) || !t.sprite || !self.sprite) return;
        const sx = self.sprite.x, sy = self.sprite.y;
        const tx = t.sprite.x, ty = t.sprite.y;
        const selfR = self.r || (self.size ? self.size / 2 : 40);
        const tR = t.r || (t.size ? t.size / 2 : 24);
        const color = (self.def && self.def.color) || CONFIG.PASTEL.good;
        const DUR = 250;

        this._fxTongue(scene, sx, sy, tx, ty, color, DUR);

        // Stop just outside the caster's own body (not fully overlapping),
        // clamped to the play field like _skillKnockback's shove does.
        const F = CONFIG.FIELD;
        const dist = Math.hypot(tx - sx, ty - sy) || 1;
        const stopAt = Math.min(dist, selfR + tR + 8);
        const nx = Phaser.Math.Clamp(sx + (tx - sx) / dist * stopAt, F.x + tR, F.x + F.w - tR);
        const ny = Phaser.Math.Clamp(sy + (ty - sy) / dist * stopAt, F.y + tR, F.y + F.h - tR);
        scene.tweens.add({ targets: t.sprite, x: nx, y: ny, duration: DUR, ease: 'Quad.easeIn' });

        scene.time.delayedCall(DUR, () => {
            if (!this._skillTargetAlive(side, t) || !t.sprite.active) return;
            this.flash(scene, t.sprite.x, t.sprite.y, color, 56);
            if (side === 'monster') {
                if (!scene.fieldPets) return;
                const dmg = scene._petElemHit(self, t, eff.amount);
                scene.fieldPets.damageAgent(t, dmg, self.def.color);
            } else {
                const dmg = scene.fieldPets
                    ? scene.fieldPets._elemHit(scene, self.def.element, t, eff.amount)
                    : eff.amount;
                scene.damageMonster(t, dmg, false, t.sprite.x, t.sprite.y, 'pet:' + self.def.element);
            }
        });
    },

    // twins/cloney/splitter/king (monster side, unchanged): spawn a scaled
    // copy via the existing cap-aware queueing.
    // Pet side (v3.0 review fix - was a documented no-op, see task-9-report.md
    // deviation #1): butterfly/axolotl (clone) and bee/ladybug (summon) now
    // materialize TEMPORARY spirit agents via FieldPets.spawnTemp() - ghostly,
    // weak (60% dmg / 30% hp), skill-less copies that despawn after 8s, on KO,
    // or on the next stage transition. They live in FieldPets.agents like any
    // pet but are never written to SaveManager.state.pets, so rebuild()/save
    // data never sees them - see spawnTemp()'s own comment in pets.js.
    _skillSpawn(scene, side, self, eff) {
        if (side === 'pet') {
            if (scene.fieldPets) scene.fieldPets.spawnTemp(self, eff);
            return;
        }
        const count = eff.count || 1;
        for (let i = 0; i < count; i++) {
            const baseDef = eff.what === 'minion' ? SPECIES.find(s => s.id === 'mini') : self.def;
            if (!baseDef) continue;
            const ox = Phaser.Math.Between(-40, 40), oy = Phaser.Math.Between(-40, 40);
            const trueAlive = scene.active.filter(x => x.alive).length;
            if (trueAlive < CONFIG.SPAWN.concurrentMax) {
                const scaledDef = Object.assign({}, baseDef, {
                    radius: Math.max(14, Math.round(baseDef.radius * Monsters.CLONE_SCALE.r)),
                    hpMult: baseDef.hpMult * Monsters.CLONE_SCALE.hp
                });
                const c = scene.acquireMonster();
                c.spawn(scaledDef, self.stage, self.x + ox, self.y + oy, { noSkill: true });
                scene.active.push(c);
            } else {
                scene.pendingWave.unshift({
                    speciesId: baseDef.id, noSkill: true, scale: Monsters.CLONE_SCALE
                });
            }
        }
    },

    // =========================================================================
    // v6 Task 11 - dramatic gacha reveal ceremony. shop.js's playReveal()
    // already ran a full shake -> flash/burst/ring [+legendary confetti/
    // burst/shake] -> rarity pillar + framed pet sequence - these four
    // functions are ADDITIVE polish layered around that same skeleton, not a
    // replacement. All four are unpooled, self-destroying one-shot ceremony
    // objects (same convention as confetti() below): a gacha pull happens at
    // most a few times a minute, never a per-frame hot path that would need
    // the _pools()/_acquire() pooling used by burst()/goo()/damageText()
    // above. Every object each function creates dies on its OWN tween's
    // onComplete regardless of caller behavior, AND (for gachaCharge, which
    // owns a repeating timer) via the returned handle's destroy() - callers
    // additionally push the plain-object/GameObject each function RETURNS
    // into their own cleanup array so `scene.tweens.killTweensOf(overlay)` +
    // `overlay.forEach(o => o.destroy())` (shop.js's close-tap handler) can
    // force-stop everything early without waiting for natural completion.
    // =========================================================================

    // The pre-reveal anticipation build: a growing+pulsing additive glow
    // behind the egg, a stream of rising sparks, and a brief deepening of
    // the modal scrim (the "screen dims/holds its breath" cue) - all tied to
    // ONE handle so shop.js's egg-shake chain can hand off to the reveal by
    // calling destroy() exactly once, the instant the shake finishes. Kept
    // deliberately RARITY-NEUTRAL (white) since the rarity itself isn't
    // revealed until after this phase ends.
    gachaCharge(scene, x, y, dimTarget, dimBaseAlpha) {
        const glow = scene.add.image(x, y, 'pop-tex').setDepth(30.1)
            .setBlendMode(Phaser.BlendModes.ADD).setTint(CONFIG.PASTEL.white)
            .setAlpha(0.3).setScale(1.1);
        // slow monotonic grow (scale only) + a fast heartbeat pulse (alpha
        // only) - kept on SEPARATE properties so the two tweens never fight
        // over the same value each frame.
        const growTween = scene.tweens.add({
            targets: glow, scale: 3, duration: 1050, ease: 'Sine.easeIn'
        });
        const pulseTween = scene.tweens.add({
            targets: glow, alpha: { from: 0.25, to: 0.55 }, duration: 130,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        const sparks = [];
        const sparkEvent = scene.time.addEvent({
            delay: 65, repeat: 13,
            callback: () => {
                const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
                const r0 = Phaser.Math.Between(46, 92);
                const sx = x + Math.cos(ang) * r0, sy = y + Math.sin(ang) * r0 * 0.9 + 30;
                const spr = scene.add.image(sx, sy, 'spark-tex').setDepth(30.15)
                    .setBlendMode(Phaser.BlendModes.ADD).setTint(CONFIG.PASTEL.white)
                    .setAlpha(0.8).setScale(0.45);
                sparks.push(spr);
                scene.tweens.add({
                    targets: spr, y: sy - 130, alpha: 0, scale: 0.1, duration: 600,
                    ease: 'Quad.easeOut', onComplete: () => spr.setVisible(false)
                });
            }
        });

        const dimTween = dimTarget ? scene.tweens.add({
            targets: dimTarget, alpha: Math.min(0.97, (dimBaseAlpha || 0.85) + 0.1),
            duration: 1050, ease: 'Sine.easeIn'
        }) : null;

        return {
            destroy() {
                growTween.remove(); pulseTween.remove();
                if (glow.active) glow.destroy();
                sparkEvent.remove(false);
                scene.tweens.killTweensOf(sparks);
                for (const s of sparks) if (s.active) s.destroy();
                if (dimTween) dimTween.remove();
                if (dimTarget && dimTarget.active) dimTarget.setAlpha(dimBaseAlpha || 0.85);
            }
        };
    },

    // Radial light-beam fan bursting from (x,y) and slowly rotating - the
    // classic gacha "the heavens open" beat. A single Graphics object drawn
    // ONCE in LOCAL coordinates (0,0 = the object's own position via
    // setPosition), so scaling/rotating the whole object sweeps the fan as
    // one rigid shape - unlike _fxLightning's bolts above, which bake
    // ABSOLUTE world coordinates into the path and therefore must never be
    // scaled/rotated the same way.
    lightRays(scene, x, y, color, opts) {
        const o = opts || {};
        const n = o.count || 10;
        const len = o.length || 520;
        const halfAngle = o.halfAngle || 0.11;
        const g = scene.add.graphics().setPosition(x, y).setDepth(o.depth || 30.3)
            .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
        g.fillStyle(color, 1);
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            g.beginPath();
            g.moveTo(0, 0);
            g.lineTo(Math.cos(a - halfAngle) * len, Math.sin(a - halfAngle) * len);
            g.lineTo(Math.cos(a + halfAngle) * len, Math.sin(a + halfAngle) * len);
            g.closePath();
            g.fillPath();
        }
        g.setScale(0.3);
        const life = o.life || 900;
        scene.tweens.add({ targets: g, scale: 1, alpha: o.peak || 0.4, duration: 220, ease: 'Quad.easeOut' });
        scene.tweens.add({
            targets: g, rotation: (o.spinDir || 1) * (o.spins || 0.6) * Math.PI * 2,
            duration: life, ease: 'Sine.easeOut'
        });
        scene.tweens.add({
            targets: g, alpha: 0, delay: Math.max(0, life - 260), duration: 260,
            ease: 'Quad.easeIn', onComplete: () => g.destroy()
        });
        return g;
    },

    // A brief full-screen ADDITIVE color flood in the rarity's own hue -
    // distinct from screenFlash() above (default blend, a quick "camera
    // snap" veil that DARKENS what's under it when alpha is high): this is
    // a slower "the room fills with neon light" wash meant to layer ON TOP
    // of screenFlash+lightRays, not replace either.
    rarityWash(scene, color, opts) {
        const o = opts || {};
        const r = scene.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2,
            CONFIG.WIDTH, CONFIG.HEIGHT, color, 0)
            .setDepth(o.depth || 34).setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({
            targets: r, alpha: o.peak || 0.4, duration: o.inMs || 110, ease: 'Quad.easeOut',
            onComplete: () => scene.tweens.add({
                targets: r, alpha: 0, duration: o.outMs || 480, ease: 'Quad.easeIn',
                onComplete: () => r.destroy()
            })
        });
        return r;
    },

    // A slow drifting sparkle field around a point (the framed pet reveal) -
    // pure ambience layered on top of the punchy one-shot burst()/ring()
    // calls already in playReveal, for "denser particles" at the reveal
    // beat. The timer spawns `count` sparkles then stops itself; destroy()
    // just cancels any NOT-YET-spawned future ones early - already-flying
    // sparkles finish their own fade-and-destroy tween regardless.
    sparkleTrail(scene, x, y, radius, color, opts) {
        const o = opts || {};
        const count = o.count || 14;
        const ev = scene.time.addEvent({
            delay: o.interval || 55, repeat: count - 1,
            callback: () => {
                const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
                const dist = Phaser.Math.FloatBetween(0.3, 1) * radius;
                const sx = x + Math.cos(ang) * dist, sy = y + Math.sin(ang) * dist;
                const spr = scene.add.image(sx, sy, 'spark-tex').setDepth(o.depth || 33)
                    .setBlendMode(Phaser.BlendModes.ADD).setTint(color)
                    .setAlpha(0.9).setScale(Phaser.Math.FloatBetween(0.35, 0.8));
                scene.tweens.add({
                    targets: spr, y: sy - Phaser.Math.Between(26, 60), alpha: 0, scale: 0.1,
                    duration: o.life || 650, ease: 'Quad.easeOut',
                    onComplete: () => spr.destroy()
                });
            }
        });
        return { destroy() { ev.remove(false); } };
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
