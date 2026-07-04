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
            // unknown kinds: silently ignored - nothing in the 24-monster/
            // 50-pet tables produces a kind this switch doesn't cover.
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

    // stun/freeze/slow/taunt/poison/burn (offense) + stealth (self). Task 7
    // ruling: an empty targets[] is a safe no-op (cooldown already paid by
    // the caller before applySkillEffect runs). Side-agnostic: both Monster
    // and pet-agent objects use the same `status` map shape.
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
    // clamped to the play field. Task 7 ruling: empty targets[] is a no-op.
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
