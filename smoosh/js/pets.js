// =============================================================================
// SMOOSH! - pets.js
// Field pets v2.1: your animals roam and auto-attack BY ELEMENT
//   fire = heavy single (x2.2) · electric = chain 2 · water = splash ·
//   leaf = steady hits whose kills pay x1.5 gold
// ...and monsters FIGHT BACK: contact damage drains pet HP; at 0 the pet is
// KO'd (flies home to the nest) and respawns after a short nap.
// =============================================================================

class FieldPets {

    KO_SECONDS = 6;
    // v3.0 review fix: clone/summon temp-spirit lifecycle tuning (see
    // spawnTemp()) - 8s lifetime per the review brief, capped so an ultimate
    // burst (x4 magnitude -> up to 8 wisps in one summon cast) can't snowball
    // the field if several clone/summon pets are casting around the same time.
    TEMP_LIFE_S = 8;
    TEMP_CAP = 14;

    constructor(scene) {
        this.scene = scene;
        this.agents = [];
        this.rebuild();
    }

    // v2.5: EVERY owned pet marches out - no slot limit.
    activePets() {
        return SaveManager.state.pets.slice().sort((a, b) => b.level - a.level);
    }

    rebuild() {
        for (const a of this.agents) {
            a.sprite.destroy(); a.badge.destroy(); a.hpBg.destroy(); a.hpFill.destroy();
        }
        this.agents = [];
        const pets = this.activePets();
        const st = SaveManager.state;
        const n = pets.length;
        // whole armies shrink so 50 pets still fit around the nest
        const size = n <= 3 ? 64 : n <= 8 ? 54 : n <= 16 ? 46 : 38;
        const cols = Math.min(Math.max(n, 1), 8);

        pets.forEach((pet, i) => {
            const def = PET_SPECIES.find(p => p.id === pet.species);
            const col = i % cols, row = Math.floor(i / cols);
            const rowCount = Math.min(cols, n - row * cols);
            const x = CONFIG.NEST.x + (col - (rowCount - 1) / 2) * (size + 14);
            const y = CONFIG.NEST.y - 84 - row * (size + 20);
            const sprite = this.scene.add.image(x, y, 'pet-' + pet.species)
                .setDepth(4).setDisplaySize(size, size);
            const badge = this.scene.add.text(x, y - size * 0.72, 'Lv.' + pet.level, {
                fontFamily: CONFIG.FONT,
                fontSize: (size >= 50 ? 14 : 12) + 'px', // v4.0 Phase C final-review: labels sit over the light
                // bgField (nest/battle field bg), not a dark surface - dark
                // ink text + a light stroke reads correctly there.
                color: Balance.hex(CONFIG.PASTEL.ink), stroke: Balance.hex(CONFIG.PASTEL.white), strokeThickness: 3
            }).setOrigin(0.5).setDepth(4);
            const barW = size - 6;
            const hpBg = this.scene.add.image(x, y - size * 0.56, 'white-tex')
                .setDepth(4).setTint(0x0a0714).setAlpha(0.8).setDisplaySize(barW + 4, 7);
            const hpFill = this.scene.add.image(x, y - size * 0.56, 'white-tex')
                .setDepth(5).setTint(0x7dffb2).setDisplaySize(barW, 4);
            const maxHp = Balance.petHP(pet.level, st.upgrades.tap, pet.rarity);
            this.agents.push({
                pet, def, sprite, badge, hpBg, hpFill, size, barW,
                hp: maxHp, maxHp,
                ko: false, koLeft: 0,
                cooldown: Math.random() * 0.8,
                hitTick: 0,
                homeX: x, homeY: y, bobT: Math.random() * 6,
                status: {},  // v3.0: statusId -> {until, dotPerSec?, forceTarget?} - see _updateAgentStatus
                skillCdUntil: this.scene.time.now + 500 + Math.random() * 3000, // v3.0 Task 9: desync first casts
                reviveUsed: false, // v3.0 review fix: revive passive's once-per-stage flag - see _knockOut/onStageStart
                invulnUntil: 0 // v6 final-review fix: post-revive damage immunity window - see _revive/damageAgent
            });
        });
    }

    _cooldownFor(element) {
        return { fire: 1.6, electric: 1.2, water: 1.4, leaf: 1.0 }[element] || 1.3;
    }

    _drawHp(a) {
        const frac = Math.max(0, a.hp / a.maxHp);
        const y = a.sprite.y - a.size * 0.56;
        a.hpBg.setPosition(a.sprite.x, y);
        a.hpFill.setDisplaySize(Math.max(2, a.barW * frac), 4);
        a.hpFill.setPosition(a.sprite.x - a.barW / 2 + (a.barW * frac) / 2, y);
        a.hpFill.setTint(frac > 0.5 ? 0x7dffb2 : frac > 0.25 ? 0xffe066 : 0xff6b6b);
        const show = frac < 1 && !a.ko;
        a.hpBg.setVisible(show); a.hpFill.setVisible(show);
    }

    // v3.0: consume a monster skill's status effects landed on this pet agent.
    // Expires timed entries (Object.assign'd by Effects.applySkillEffect) and
    // ticks poison/burn DoT 1x/sec via an accumulated delta - stun/freeze/
    // slow/taunt are read directly by update() where they change behavior.
    _updateAgentStatus(a, dt) {
        const now = this.scene.time.now;
        for (const key of Object.keys(a.status)) {
            const s = a.status[key];
            if (s.until !== undefined && now >= s.until) { delete a.status[key]; continue; }
            if (s.dotPerSec) {
                s._acc = (s._acc || 0) + dt;
                while (s._acc >= 1 && !a.ko && !a._expired) {
                    s._acc -= 1;
                    this.damageAgent(a, s.dotPerSec, key === 'poison' ? 0x9dff70 : 0xff9a5a);
                }
            }
        }
        const frozen = !!a.status.freeze;
        if (frozen) a.sprite.setTint(0xbfe8ff);
        else if (a._wasFrozen) a.sprite.clearTint();
        a._wasFrozen = frozen;

        // v3.0 Task 9: a pet's own stealth cast (fox/raccoon/bat) fades it out
        // AND makes monster attack-targeting skip it (Monster._updateAttack).
        const stealthy = !!a.status.stealth;
        if (stealthy) a.sprite.setAlpha(Skills.STATUS.stealth.alpha);
        else if (a._wasStealthy) a.sprite.setAlpha(1);
        a._wasStealthy = stealthy;
    }

    _knockOut(a) {
        // v3.0 review fix: a clone/summon spirit has nothing to "nap and
        // return" to - KO just ends its short life immediately.
        if (a.temp) { this._expireTemp(a); return; }

        // v3.0 review fix: revive passive (alpaca/chameleon) - ONCE per
        // stage, a KO becomes a brief ~1s "downed" beat instead of the full
        // 6s nap, then _revive() brings it back at Skills.ARCHETYPES.revive.mag
        // (50%) hp with a golden flash. Reuses the exact same ko/koLeft timer
        // path update() already runs - only the duration/badge/FX/return-hp
        // differ - so no new per-frame branch is needed anywhere else.
        const reviving = a.def.skill === 'revive' && !a.reviveUsed;
        if (reviving) a.reviveUsed = true;

        a.ko = true;
        a._reviving = reviving;
        a.koLeft = reviving ? 1 : this.KO_SECONDS;
        a.sprite.setTint(0x555060).setAlpha(0.55);
        a.badge.setText(reviving ? '✨' : ('😵 ' + this.KO_SECONDS.toFixed(0) + 's'));
        Sfx.clank();
        if (typeof Effects !== 'undefined') {
            Effects.burst(this.scene, a.sprite.x, a.sprite.y, reviving ? 0xffd54a : 0x8d86a8, 10, 1);
            Effects.damageText(this.scene, a.sprite.x, a.sprite.y - 50,
                I18n.t(reviving ? 'battle.down' : 'battle.ko'),
                reviving ? '#ffd54a' : '#ff6b6b', { big: true });
        }
        this.scene.tweens.add({
            targets: a.sprite, x: a.homeX, y: a.homeY, angle: 0,
            duration: 500, ease: 'Quad.easeOut'
        });
    }

    // A monster attack (or another pet's offense - PvP/future) lands on this
    // pet. v3.0 Task 9: panda/hedgehog/turtle's shield skill absorbs damage
    // here first, mirroring Monster.hit()'s shield consumption.
    damageAgent(a, dmg, tint) {
        if (a.ko) return;
        // v6 final-review fix: brief post-revive immunity (see _revive) -
        // incoming damage only, a shielded pet can still attack normally.
        if (a.invulnUntil && this.scene.time.now < a.invulnUntil) {
            Sfx.clank();
            Haptic.tick(0.8);
            return;
        }
        const shield = a.status.shield;
        if (shield && shield.amount > 0) {
            const absorbed = Math.min(shield.amount, dmg);
            shield.amount -= absorbed;
            dmg -= absorbed;
            if (shield.amount <= 0) delete a.status.shield;
            if (dmg <= 0) {
                Sfx.clank();
                Haptic.tick(0.8);
                return;
            }
        }
        a.hp -= dmg;
        a.sprite.setTintFill(0xffffff);
        this.scene.time.delayedCall(70, () => { if (!a.ko && a.sprite.active) a.sprite.clearTint(); });
        if (typeof Effects !== 'undefined') {
            Effects.burst(this.scene, a.sprite.x, a.sprite.y, tint || 0xff6b6b, 4, 0.5);
            Effects.damageText(this.scene, a.sprite.x, a.sprite.y - 46,
                Balance.fmt(dmg), '#ff9a9a');
        }
        this.scene.tweens.add({
            targets: a.sprite, angle: Phaser.Math.Between(-16, 16),
            duration: 70, yoyo: true,
            onComplete: () => { if (a.sprite.active) a.sprite.setAngle(0); }
        });
        if (a.hp <= 0) this._knockOut(a);
    }

    // v3.0 review fix: hpFrac param - the normal 6s nap returns at full hp
    // (default), the revive passive's ~1s downed beat returns at
    // Skills.ARCHETYPES.revive.mag (50%) instead (see _knockOut/update()).
    _revive(a, hpFrac) {
        const frac = hpFrac || 1;
        a.ko = false;
        a._reviving = false;
        a.hp = Math.max(1, Math.round(a.maxHp * frac));
        a.status = {}; // v3.0: a fresh nap wipes stale CC/DoT from before the KO
        // v6 final-review fix: ~1.2s of incoming-damage immunity (see
        // damageAgent) - while this pet was KO'd, EVERY monster offensive
        // skill was whiffing (no valid target); the instant it revives it's
        // the only target for potentially every ready skill at once, which
        // would otherwise re-KO it on the very same frame it stood back up.
        a.invulnUntil = this.scene.time.now + 1200;
        a.sprite.clearTint().setAlpha(1);
        a.badge.setText('Lv.' + a.pet.level);
        if (typeof Effects !== 'undefined') {
            Effects.ring(this.scene, a.sprite.x, a.sprite.y, frac < 1 ? 0xffd54a : a.def.color, 80);
        }
        this.scene.tweens.add({
            targets: a.sprite, scale: { from: 0.2, to: a.sprite.scale }, duration: 260, ease: 'Back.easeOut'
        });
    }

    // =========================================================================
    // v3.0 Task 9 - pet personality skills. Mirrors Monster._updateSkill/
    // Monsters.allyCtx/enemyCtx exactly, just built off pet agents instead of
    // Monster instances: ally skills (heal/shield/buffaura/goldaura/critaura/
    // stealth) target OTHER PET AGENTS (heal also considers the Nest); every
    // offensive skill targets LIVE MONSTERS. Reuses Monsters.ALLY_SKILLS/
    // SPAWN_SKILLS (skill-id metadata, caster-agnostic) and the shared
    // Effects.applySkillEffect translator (effects.js) for the actual cast.
    // =========================================================================

    _petSkillDmg(a) {
        const st = SaveManager.state;
        return Balance.petDamage(a.pet.level, st.upgrades.tap, a.pet.rarity, a.pet.necklace);
    }

    _allySkillCtx(a, now) {
        const targets = [];
        for (const other of this.agents) {
            if (other === a || other.ko) continue;
            targets.push({ id: other, hp: other.hp, maxHp: other.maxHp,
                x: other.sprite.x, y: other.sprite.y,
                dist: Math.hypot(other.sprite.x - a.sprite.x, other.sprite.y - a.sprite.y) });
        }
        return {
            self: { hp: a.hp, maxHp: a.maxHp, dmg: this._petSkillDmg(a), elem: a.def.element,
                x: a.sprite.x, y: a.sprite.y },
            targets, now
        };
    }

    _enemySkillCtx(a, now) {
        const targets = [];
        for (const m of this.scene.active) {
            if (!m.alive || m.tappable === false) continue;
            targets.push({ id: m, hp: m.hp, maxHp: m.maxHp, x: m.x, y: m.y,
                dist: Math.hypot(m.x - a.sprite.x, m.y - a.sprite.y) });
        }
        return {
            self: { hp: a.hp, maxHp: a.maxHp, dmg: this._petSkillDmg(a), elem: a.def.element,
                x: a.sprite.x, y: a.sprite.y },
            targets, now
        };
    }

    // Cast this pet's personality skill when its own (separate-from-attack)
    // cooldown is up. Passives (rage/revive) are never cast, matching
    // Monster._updateSkill's identical early-return - no engine consumes
    // them today on either side.
    _updateAgentSkill(a, now) {
        if (!a.def.skill) return;
        const scene = this.scene;
        if (scene.transitioning) return;
        if (!Skills.ready(a, now)) return;

        const A = Skills.ARCHETYPES[a.def.skill];
        if (!A || A.passive) return;

        const ally = Monsters.ALLY_SKILLS.has(a.def.skill) || Monsters.SPAWN_SKILLS.has(a.def.skill);
        const ctx = ally ? this._allySkillCtx(a, now) : this._enemySkillCtx(a, now);

        const eff = Skills.cast(a.def.skill, ctx);
        // v6 Task 6 ruling (reverses v3.0 Task 7) - see Monster._updateSkill's
        // identical comment / Skills.isWhiff's doc comment: whiffs (null, or
        // a cast that landed on nobody) retry soon instead of going dark for
        // the whole cd.
        // v6 final-review fix: "soon" is Skills.WHIFF_RETRY_MS (see the
        // matching Monster._updateSkill fix) rather than every frame, so a
        // pet stuck whiffing (e.g. no live monster in range) doesn't rebuild
        // its cast ctx 60x/sec for nothing. A successful cast below still
        // pays the FULL archetype cd, unchanged.
        if (Skills.isWhiff(eff)) { a.skillCdUntil = now + Skills.WHIFF_RETRY_MS; return; }

        a.skillCdUntil = now + A.cd;
        Effects.applySkillEffect(scene, 'pet', a, eff);
        // v6 Task 6: telegraph flash + uppercase name popup + a per-kind FX
        // pass bigger/more distinct than the old generic ring below it replaced.
        if (typeof Effects !== 'undefined') Effects.skillCastFx(scene, 'pet', a, a.def.skill, eff);
        Sfx.petYelp(a.def.element);
    }

    update(dt) {
        const scene = this.scene;
        for (const a of this.agents) {
            // v3.0 review fix: clone/summon spirits are on a lifespan, not a
            // formation slot - tick it down and mark for post-loop removal
            // (never splice `this.agents` mid-iteration, same reasoning as
            // GameScene.update()'s `this.active.slice()` snapshot).
            if (a.temp && !a.ko) {
                a.tempLife -= dt;
                if (a.tempLife <= 0) { this._expireTemp(a); continue; }
            }

            a.bobT += dt;
            a.badge.setPosition(a.sprite.x, a.sprite.y - a.size * 0.72);
            this._drawHp(a);

            if (a.ko) {
                a.koLeft -= dt;
                // v3.0 review fix: the revive passive's ~1s "downed" beat
                // keeps its own ✨ badge (set in _knockOut) instead of the
                // normal countdown text.
                if (!a._reviving) a.badge.setText('😵 ' + Math.max(0, a.koLeft).toFixed(0) + 's');
                if (a.koLeft <= 0) this._revive(a, a._reviving ? Skills.ARCHETYPES.revive.mag : 1);
                continue;
            }

            if (scene.transitioning) {
                a.sprite.x += (a.homeX - a.sprite.x) * Math.min(1, dt * 3);
                a.sprite.y += (a.homeY - a.sprite.y) * Math.min(1, dt * 3) + Math.sin(a.bobT * 3) * 0.3;
                continue;
            }

            // v3.0: consume monster-cast statuses BEFORE seeking/attacking -
            // stun/freeze skip this pet's turn entirely this frame.
            this._updateAgentStatus(a, dt);
            if (a.status.stun || a.status.freeze) continue;

            // v7 Task 10 (Sandbox): a manually-possessed avatar (SandboxScene
            // flags exactly one agent `manual:true` and gives it a shared
            // `manualVector` object it mutates from a joystick) skips the
            // normal seek/home AI + auto-attack + personality-skill cast
            // entirely for THIS frame - it only moves along the joystick
            // vector at the same constant speed every pet already walks at
            // (260, see the seek-block below); attacking is a deliberate
            // player action fired directly via FieldPets._attack() from
            // SandboxScene's ATTACK button, never from this loop. Every other
            // agent - including this one whenever `manual` is unset/false,
            // i.e. every real game scene - takes the untouched branch below
            // completely unaffected. Mirrors SandboxMath.clampManualMove
            // (sandbox.js), pulled out there so the same integrate+clamp math
            // has a pure, Node-testable seam.
            if (a.manual) {
                const F = CONFIG.FIELD;
                const vx = (a.manualVector && a.manualVector.x) || 0;
                const vy = (a.manualVector && a.manualVector.y) || 0;
                const half = a.size / 2;
                let nx = a.sprite.x + vx * 260 * dt;
                let ny = a.sprite.y + vy * 260 * dt;
                a.sprite.x = Math.max(F.x + half, Math.min(F.x + F.w - half, nx));
                a.sprite.y = Math.max(F.y + half, Math.min(F.y + F.h - half, ny));
                if (Math.abs(vx) > 0.05) a.sprite.flipX = vx < 0;
                // Still ticks down (never auto-fires here) so the ATTACK
                // button's own "am I off cooldown?" readout - driven off this
                // same a.cooldown field - clears normally after a manual press
                // instead of staying permanently on cooldown.
                a.cooldown -= dt;
                continue;
            }

            // v3.0 review fix: rage passive's "hurt and dangerous" pulse -
            // purely visual, independent of the skill-cast cooldown below.
            this._updateRageTint(a, dt);

            // v3.0 Task 9: this pet's own personality skill, independent of
            // its regular attack cooldown (mirrors Monster._updateSkill).
            this._updateAgentSkill(a, scene.time.now);

            // (v2.4: passive contact damage removed - monsters now land REAL
            // attacks via their per-species styles; see Monster._updateAttack)

            a.cooldown -= dt;

            // nearest attackable monster (nest raiders first!) - taunt overrides
            // the search entirely and forces the tauntor as the sole target.
            let target = null, best = Infinity;
            const taunt = a.status.taunt;
            if (taunt && taunt.forceTarget && taunt.forceTarget.alive && taunt.forceTarget.tappable !== false) {
                target = taunt.forceTarget;
            } else {
                for (const m of scene.active) {
                    if (!m.alive || m.tappable === false) continue;
                    const dx = m.x - a.sprite.x, dy = m.y - a.sprite.y;
                    let d2 = dx * dx + dy * dy;
                    if (m.biting) d2 *= 0.25;
                    if (d2 < best) { best = d2; target = m; }
                }
            }

            if (!target) {
                a.sprite.x += (a.homeX - a.sprite.x) * Math.min(1, dt * 2);
                a.sprite.y += (a.homeY - a.sprite.y) * Math.min(1, dt * 2) + Math.sin(a.bobT * 3) * 0.4;
                continue;
            }

            const dx = target.x - a.sprite.x, dy = target.y - a.sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const range = target.r + 46;

            if (dist > range) {
                const spd = 260 * (a.status.slow ? Skills.STATUS.slow.speedMult : 1);
                a.sprite.x += (dx / dist) * spd * dt;
                a.sprite.y += (dy / dist) * spd * dt + Math.sin(a.bobT * 6) * 0.5;
            } else if (a.cooldown <= 0) {
                // v3.0 review fix: rage passive - badly hurt (<30% hp) rage
                // pets reset their attack cooldown at mag (0.6x), i.e. ~40%
                // faster swings, until they heal back up or get KO'd.
                const rageMult = this._rageActive(a) ? Skills.ARCHETYPES.rage.mag : 1;
                a.cooldown = this._cooldownFor(a.def.element) * rageMult;
                this._attack(a, target);
            }
        }
        this._sweepExpiredTemps();
    }

    // v3.0 review fix - rage passive (cow/monkey): active while this agent's
    // own hp is below 30% of its max. Read by the cooldown reset above and
    // by _updateRageTint's visual pulse; not a Skills.cast() effect (rage is
    // `passive:true` - engines check ARCHETYPES directly, never cast() it).
    _rageActive(a) {
        return a.def.skill === 'rage' && a.hp / a.maxHp < 0.3;
    }

    // Subtle red pulse while rage is active - skipped entirely for stunned/
    // frozen agents (update() already `continue`s before calling this, so
    // their tint stays whatever _updateAgentStatus last set) and cleared the
    // moment rage drops (healed back up, or about to be KO'd/revived).
    _updateRageTint(a, dt) {
        if (!this._rageActive(a)) {
            if (a._raging) { a.sprite.clearTint(); a._raging = false; a._rageT = 0; }
            return;
        }
        a._raging = true;
        a._rageT = (a._rageT || 0) + dt * 6;
        const pulse = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(a._rageT)); // 0.35..0.70, subtle not full-red
        const g = Math.round(255 * (1 - pulse));
        a.sprite.setTint(Phaser.Display.Color.GetColor(255, g, g));
    }

    // v3.0 review fix: hide + flag a clone/summon spirit for removal. Actual
    // array splice + destroy() happens in _sweepExpiredTemps() right after
    // this frame's main loop finishes, so nothing ever mutates `this.agents`
    // mid-iteration.
    _expireTemp(a) {
        if (a._expired) return;
        a._expired = true;
        a.sprite.setVisible(false);
        a.badge.setVisible(false);
        a.hpBg.setVisible(false);
        a.hpFill.setVisible(false);
        if (typeof Effects !== 'undefined') Effects.burst(this.scene, a.sprite.x, a.sprite.y, 0xc7a4ff, 6, 0.6);
    }

    _sweepExpiredTemps() {
        for (let i = this.agents.length - 1; i >= 0; i--) {
            const a = this.agents[i];
            if (a._expired) {
                a.sprite.destroy(); a.badge.destroy(); a.hpBg.destroy(); a.hpFill.destroy();
                this.agents.splice(i, 1);
            }
        }
    }

    // =========================================================================
    // v3.0 review fix - clone/summon pet-cast spawn (was a documented no-op,
    // see task-9-report.md deviation #1 / effects.js _skillSpawn). Materializes
    // TEMPORARY "spirit" agents that fight alongside the real squad for
    // TEMP_LIFE_S seconds: clone (butterfly/axolotl) spawns 1 copy at the
    // caster's own size, summon (bee/ladybug) spawns `eff.count` smaller
    // wisps (no dedicated wisp art exists, so they reuse the caster's own
    // texture at a shrunk size - reads as "a swarm of the caster", which is
    // exactly what a bee/ladybug summon should look like anyway).
    //
    // Deliberately NOT real pets: they're built directly onto `this.agents`,
    // never touch `SaveManager.state.pets`, so activePets()/rebuild() (gacha
    // pulls, necklace drops, shop resume) never see them - and rebuild()'s
    // unconditional "destroy every current agent" sweep cleans them up for
    // free if one happens to be alive when it runs. Stage transitions and
    // KOs are handled explicitly (onStageStart(), _knockOut()) since neither
    // path calls rebuild().
    // =========================================================================
    spawnTemp(caster, eff) {
        const scene = this.scene;
        const st = SaveManager.state;
        const isClone = eff.what === 'clone';
        const room = this.TEMP_CAP - this.agents.filter(a => a.temp).length;
        const count = Math.max(0, Math.min(eff.count || 1, room));
        const baseHp = Balance.petHP(caster.pet.level, st.upgrades.tap, caster.pet.rarity);
        const sizeMult = isClone ? 1 : 0.55;

        for (let i = 0; i < count; i++) {
            const size = Math.max(22, Math.round(caster.size * sizeMult));
            const x = caster.sprite.x + Phaser.Math.Between(-40, 40);
            const y = caster.sprite.y + Phaser.Math.Between(-40, 40);
            const sprite = scene.add.image(x, y, 'pet-' + caster.pet.species)
                .setDepth(4).setDisplaySize(size, size).setAlpha(0.6);
            const badge = scene.add.text(x, y - size * 0.72, '👻', {
                fontFamily: CONFIG.FONT, fontSize: (size >= 50 ? 14 : 12) + 'px'
            }).setOrigin(0.5).setDepth(4).setAlpha(0.6);
            const barW = size - 6;
            const hpBg = scene.add.image(x, y - size * 0.56, 'white-tex')
                .setDepth(4).setTint(0x0a0714).setAlpha(0.5).setDisplaySize(barW + 4, 7);
            const hpFill = scene.add.image(x, y - size * 0.56, 'white-tex')
                .setDepth(5).setTint(0x7dffb2).setAlpha(0.6).setDisplaySize(barW, 4);
            const maxHp = Math.max(1, Math.round(baseHp * 0.3));

            this.agents.push({
                pet: { species: caster.pet.species, level: caster.pet.level,
                    rarity: caster.pet.rarity, necklace: null },
                def: Object.assign({}, caster.def, { skill: null }), // never re-casts
                sprite, badge, hpBg, hpFill, size, barW,
                hp: maxHp, maxHp,
                ko: false, koLeft: 0,
                cooldown: Math.random() * 0.4, hitTick: 0,
                homeX: x, homeY: y, bobT: Math.random() * 6,
                status: {}, skillCdUntil: Infinity, reviveUsed: true,
                temp: true, tempLife: this.TEMP_LIFE_S, tempDmgMult: 0.6
            });
        }
        if (typeof Effects !== 'undefined') {
            Effects.ring(scene, caster.sprite.x, caster.sprite.y, caster.def.color, caster.size * 1.4);
        }
    }

    // v3.0 review fix: called once per stage start (GameScene.startStage,
    // both normal progression and the nest-break retry funnel through it) -
    // resets the once-per-stage revive flag on every real agent and purges
    // any clone/summon spirits left over from the stage that just ended.
    // v6 task-3: also full-heals the whole squad (hp/status wiped, any KO'd
    // pet revived) so nothing a pet suffered last stage carries into the
    // fresh wave - runs BEFORE GameScene.startStage() calls fillFromQueue(),
    // so every pet is already standing at full hp when the new wave spawns.
    onStageStart() {
        for (let i = this.agents.length - 1; i >= 0; i--) {
            const a = this.agents[i];
            if (a.temp) {
                a.sprite.destroy(); a.badge.destroy(); a.hpBg.destroy(); a.hpFill.destroy();
                this.agents.splice(i, 1);
            }
        }
        for (const a of this.agents) {
            a.reviveUsed = false;
            if (a.ko) {
                // _revive() already does hp=maxHp/status={}/ko=false and
                // restores the sprite's tint/alpha/badge that _knockOut() set.
                this._revive(a, 1);
            } else {
                a.hp = a.maxHp;
                a.status = {};
            }
        }
    }

    // v3.0 review fix: "can the ultimate button actually DO something by
    // casting THIS agent's skill?" - used by GameScene.castUltimate()'s
    // fallback search so it never lands on a passive (rage/revive) pet and
    // silently whiffs the gauge. Delegates the archetype check to the pure
    // Skills.isCastable() so it stays unit-testable without a Phaser scene.
    isUltCastable(a) {
        return !!a.def.skill && Skills.isCastable(a.def.skill);
    }

    // v3.0: elemental type effectiveness (pet element vs monster's species.elem)
    // on top of the per-style multiplier baked into each case below. Shows
    // Super!/Resisted feedback text when the chart isn't neutral.
    _elemHit(scene, atkElem, m, styleDmg) {
        const { dmg, mult } = Balance.applyElement(styleDmg, atkElem, m.def.elem);
        if (mult !== 1 && typeof Effects !== 'undefined') {
            Effects.damageText(scene, m.x, m.y - m.radius - 30,
                mult > 1 ? 'Super!' : 'Resisted',
                Balance.hex(mult > 1 ? CONFIG.PASTEL.gold : CONFIG.PASTEL.inkSoft));
        }
        return dmg;
    }

    _attack(a, target) {
        const scene = this.scene;
        const st = SaveManager.state;
        // v3.0 Task 9: a pet-cast buffaura (squirrel/dolphin) juices every
        // pet's attack damage for its duration - see GameScene.teamBuffAdd.
        const dmgBuff = 1 + (scene.teamBuffAdd ? scene.teamBuffAdd('dmg') : 0);
        // v3.0 review fix: clone/summon spirits hit at 60% (tempDmgMult) -
        // everyone else's multiplier defaults to 1.
        const base = Balance.petDamage(a.pet.level, st.upgrades.tap, a.pet.rarity, a.pet.necklace)
            * dmgBuff * (a.tempDmgMult || 1);
        const tint = a.def.color;
        const petElem = a.def.element;

        scene.tweens.add({
            targets: a.sprite,
            x: target.x - Math.sign(target.x - a.sprite.x) * (target.r + 26),
            duration: 90, yoyo: true, ease: 'Quad.easeOut'
        });
        Sfx.petYelp(a.def.element); // adorable battle cry
        if (typeof Effects !== 'undefined') Effects.burst(scene, target.x, target.y, tint, 4, 0.5);

        const source = 'pet:' + a.def.element;
        const hit = (m, styleDmg) => scene.damageMonster(
            m, this._elemHit(scene, petElem, m, styleDmg), false, m.x, m.y, source);
        switch (a.def.element) {
            case 'fire':
                hit(target, base * 2.2);
                break;
            case 'electric': {
                hit(target, base);
                let second = null, best = Infinity;
                for (const m of scene.active) {
                    if (!m.alive || m === target || m.tappable === false) continue;
                    const d2 = (m.x - target.x) ** 2 + (m.y - target.y) ** 2;
                    if (d2 < best && d2 < 220 * 220) { best = d2; second = m; }
                }
                if (second) {
                    if (typeof Effects !== 'undefined') Effects.ring(scene, second.x, second.y, tint, 50);
                    hit(second, base * 0.6);
                }
                break;
            }
            case 'water': {
                if (typeof Effects !== 'undefined') Effects.ring(scene, target.x, target.y, tint, 110);
                const hits = scene.active.filter(m => m.alive && m.tappable !== false &&
                    (m.x - target.x) ** 2 + (m.y - target.y) ** 2 <= 110 * 110);
                for (const m of hits) hit(m, base * 0.8);
                break;
            }
            default: // leaf & other elements - steady hit, golden kills (GameScene pays x1.5)
                hit(target, base * 0.9);
        }
    }
}
