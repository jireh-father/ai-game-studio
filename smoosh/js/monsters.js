// =============================================================================
// SMOOSH! - monsters.js
// Pooled Monster wrapper around a Phaser Image. Owns movement patterns and
// the squash-on-hit visual. GameScene owns damage math, gold, and death FX.
// =============================================================================

class Monster {

    constructor(scene) {
        this.scene = scene;
        this.sprite = scene.add.image(-999, -999, '__DEFAULT').setVisible(false).setDepth(3);
        // per-monster HP bar (white-tex strips, revealed after first damage)
        this.hpBg = scene.add.image(-999, -999, 'white-tex')
            .setVisible(false).setDepth(7).setTint(0x0a0714).setAlpha(0.8);
        this.hpFill = scene.add.image(-999, -999, 'white-tex')
            .setVisible(false).setDepth(8);
        this.alive = false;
        this._gen = 0; // v3.0 review fix: bumped every spawn() - see _updateStatus
    }

    _hpColor(frac) {
        if (frac > 0.5) return 0x7dffb2;
        if (frac > 0.25) return 0xffe066;
        return 0xff6b6b;
    }

    // Bar width follows the monster's size; shown once it has taken damage.
    updateHpBar() {
        const show = this.alive && this.hp < this.maxHp;
        this.hpBg.setVisible(show);
        this.hpFill.setVisible(show);
        if (!show) return;
        const w = Math.max(34, this.r * 1.35);
        const h = Math.max(5, Math.min(10, this.r * 0.16));
        const y = this.y - this.r * this.hitScale - h - 8;
        const frac = Math.max(0, this.hp / this.maxHp);
        this.hpBg.setPosition(this.x, y).setDisplaySize(w + 4, h + 4);
        this.hpFill.setDisplaySize(Math.max(2, w * frac), h);
        this.hpFill.setPosition(this.x - w / 2 + (w * frac) / 2, y);
        this.hpFill.setTint(this._hpColor(frac));
    }

    // def = SPECIES entry; stage decides HP via Balance.
    // opts.boss: promote ANY species to a giant boss (rotation system).
    spawn(def, stage, x, y, opts) {
        this.def = def;
        this.stage = stage;
        this.isBoss = !!(opts && opts.boss) || def.kind === 'boss';
        // v3.0 review fix: acquireMonster() can hand back THIS SAME pooled
        // instance synchronously from inside a DoT tick that just killed it
        // (onKill -> onSpecialDeath/fillFromQueue -> acquireMonster ->
        // spawn(), all before the DoT while-loop in _updateStatus below
        // finishes unwinding). Bumping a generation counter here lets that
        // loop notice "this object stopped being MY monster mid-tick" and
        // bail before it either double-damages the freshly-spawned replacement
        // or crashes reading a status key that spawn() just reset away.
        this._gen++;

        const baseHP = Balance.mobHP(stage);
        this.maxHp = this.isBoss
            ? Math.round(baseHP * Balance.bossHpMult(stage))
            : Math.max(1, Math.round(baseHP * def.hpMult));
        this.hp = this.maxHp;
        this.alive = true;
        this.tappable = true;
        this.awake = def.move !== 'sleeper';   // sleepers wait for the first hit
        this.noSplit = false;                  // set true on splitter children

        // giant bosses: fixed huge radius, slow, simple wander
        this.r = this.isBoss ? Math.max(210, def.radius) : def.radius;
        this.moveType = this.isBoss ? 'amble' : def.move;
        // v1.2: everything speeds up as stages climb
        const spd = def.speed * Balance.speedMult(stage);
        this.speedBase = this.isBoss ? Math.max(18, spd * 0.3) : spd;

        // movement state
        this.dir = Math.random() * Math.PI * 2;
        this.dirTimer = 0;
        this.dashTimer = Math.random() * 1.6;  // desync dashes/hops
        this.dashing = false;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.orbitCx = x;
        this.orbitCy = y;
        this.despawnLeft = def.despawnMs ? def.despawnMs / 1000 : 0;
        this.recentHits = [];                  // timestamps for shield rapid-tap window

        // v2.0: nest raiders walk to the nest and bite it
        this.nibbler = !!(opts && opts.nibbler);
        this.biting = false;

        // v2.4: every species FIGHTS BACK in its own style
        this.attackType = def.attack || 'none';
        this.attackCd = 1 + Math.random() * 2; // desync first strikes
        this.charging = 0;                     // seconds left in a charge dash
        this.chargeHit = null;                 // agents already hit this charge

        // v3.0: every species also has a PERSONALITY SKILL (Skills.ARCHETYPES).
        // noSkill = true for skill-spawned clones/summons (they don't cast further).
        this.noSkill = !!(opts && opts.noSkill);
        this.skillCdUntil = this.scene.time.now + 1000 + Math.random() * 3000; // desync first casts
        this.status = {};       // statusId -> {until, dotPerSec?, amount?, add?, forceTarget?}
        this._wasStealthy = false;
        this._wasFrozen = false;

        // quirks
        this.quirk = def.quirk || null;
        this.iceOn = this.quirk === 'ice';
        this.phaseT = Math.random() * 2;
        this.hitScale = 1;                     // shy jellies shrink their hitbox

        const s = this.sprite;
        s.setTexture('sp-' + def.id + '-idle');
        s.setDisplaySize(this.r * 2, this.r * 2);
        s.setPosition(x, y);
        s.setAlpha(1).setVisible(true).setActive(true).setAngle(0);
        s.clearTint();
        if (this.iceOn) s.setTint(0xbfe8ff);
        this._baseScaleX = s.scaleX;
        this._baseScaleY = s.scaleY;
        this._squashT = 0;

        // spawn pop-in
        s.setScale(this._baseScaleX * 0.2, this._baseScaleY * 0.2);
        this.scene.tweens.add({
            targets: s, scaleX: this._baseScaleX, scaleY: this._baseScaleY,
            duration: this.isBoss ? 450 : 220, ease: 'Back.easeOut'
        });
    }

    get x() { return this.sprite.x; }
    get y() { return this.sprite.y; }
    get radius() { return this.r || (this.def ? this.def.radius : 0); }

    // dt seconds; pointer = {x,y} last pointer position (for flee).
    update(dt, pointer) {
        if (!this.alive) return;

        // goldie lifetime
        if (this.despawnLeft > 0) {
            this.despawnLeft -= dt;
            if (this.despawnLeft <= 1) this.sprite.setAlpha(Math.max(0.25, this.despawnLeft));
            if (this.despawnLeft <= 0) {
                this.alive = false;
                this.sprite.setVisible(false).setActive(false);
                this.hpBg.setVisible(false);
                this.hpFill.setVisible(false);
                if (this.scene.onMonsterDespawned) this.scene.onMonsterDespawned(this);
                return;
            }
        }

        // ghosty: phase in/out - untappable while faded
        if (this.quirk === 'phase') {
            this.phaseT = (this.phaseT + dt) % 3.6;
            const hidden = this.phaseT > 2.2;
            this.tappable = !hidden;
            this.sprite.setAlpha(hidden ? 0.22 : 1);
        }

        // shy: shrinks (and its hitbox with it) when your finger is near
        if (this.quirk === 'shy') {
            let near = false;
            if (pointer) {
                const dx = this.x - pointer.x, dy = this.y - pointer.y;
                near = dx * dx + dy * dy < 180 * 180;
            }
            const target = near ? 0.5 : 1;
            this.hitScale += (target - this.hitScale) * Math.min(1, dt * 8);
        }

        if (!this.awake) return; // sleeping blinky

        // v3.0: expire/mirror statuses landed by a pet's skill or by this
        // monster's own self-cast (stealth/shield/buffs). stun & freeze
        // shut down BOTH the attack and the skill tick below - CC means CC.
        const now = this.scene.time.now;
        this._updateStatus(now, dt);
        // v3.0 Task 9: a poison/burn DoT tick inside _updateStatus can kill
        // this very monster (onKill runs synchronously). Bail out immediately
        // so the rest of this frame's update() never acts on a corpse.
        if (!this.alive) return;
        if (this.status.stun || this.status.freeze) {
            this._squashT += dt * 6;
            this.updateHpBar();
            return;
        }

        this._updateAttack(dt);
        this._updateSkill(now);

        // mid-charge: ram forward, trampling pets in the way
        if (this.charging > 0) {
            this.charging -= dt;
            const F = CONFIG.FIELD;
            let nx = this.x + Math.cos(this.dir) * this.speedBase * 4.5 * dt;
            let ny = this.y + Math.sin(this.dir) * this.speedBase * 4.5 * dt;
            nx = Math.max(F.x + this.r, Math.min(F.x + F.w - this.r, nx));
            ny = Math.max(F.y + this.r, Math.min(F.y + F.h - this.r, ny));
            this.sprite.setPosition(nx, ny);
            if (this.scene.monsterChargeCheck) this.scene.monsterChargeCheck(this);
            this._squashT += dt * 6;
            this.updateHpBar();
            return;
        }

        // Nest raiders override their species walk: seek, then chomp.
        if (this.nibbler) {
            const nx = CONFIG.NEST.x, ny = CONFIG.NEST.y;
            const dx = nx - this.x, dy = ny - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const biteRange = 96 + this.r * 0.6;
            // v6 final-review fix: re-evaluate against distance every frame
            // instead of a one-way sticky flag - a knockback/pull (including
            // the new PULL skill, whose whole point is peeling a nibbler off
            // the nest) displaces this monster out of biteRange, so it must
            // stop draining the nest and walk back in rather than keep
            // biting from wherever it got shoved to.
            if (dist >= biteRange) this.biting = false;
            if (this.biting || dist < biteRange) {
                this.biting = true;
                // chomp wobble
                this.sprite.setAngle(Math.sin(this._squashT * 4) * 14);
                this._squashT += dt * 6;
                this.updateHpBar();
                return;
            }
            this.dir = Math.atan2(dy, dx);
            const spd = this.speedBase * 0.8;
            this.sprite.setPosition(this.x + Math.cos(this.dir) * spd * dt,
                this.y + Math.sin(this.dir) * spd * dt);
            this._squashT += dt * 6;
            this.updateHpBar();
            return;
        }

        // v3.0: 'slow' status - every moveType below reads this.speedBase, so
        // scaling it here (and restoring after) is a single-point-of-truth fix.
        const speedBaseSave = this.speedBase;
        if (this.status.slow) this.speedBase *= Skills.STATUS.slow.speedMult;

        let speed = this.speedBase;
        let handled = false;

        switch (this.moveType) {
            case 'zigzag':
                this.dirTimer -= dt;
                if (this.dirTimer <= 0) {
                    this.dir += (Math.random() < 0.5 ? 1 : -1) * (Math.PI / 2) * (0.7 + Math.random() * 0.6);
                    this.dirTimer = 0.35 + Math.random() * 0.4;
                }
                break;
            case 'dash':
                this.dashTimer -= dt;
                if (this.dashTimer <= 0) {
                    this.dashing = !this.dashing;
                    this.dashTimer = this.dashing ? 0.4 : 1.2 + Math.random() * 0.8;
                    if (this.dashing) this.dir = Math.random() * Math.PI * 2;
                }
                speed = this.dashing ? this.speedBase * 3 : this.speedBase * 0.35;
                break;
            case 'hop':
                // bunny hops: short bursts with a squash-stretch arc
                this.dashTimer -= dt;
                if (this.dashTimer <= 0) {
                    this.dashing = !this.dashing;
                    this.dashTimer = this.dashing ? 0.45 : 0.35 + Math.random() * 0.3;
                    if (this.dashing) this.dir = Math.random() * Math.PI * 2;
                }
                speed = this.dashing ? this.speedBase * 2.2 : 0;
                if (this.dashing && !this._squashing) {
                    const t = 1 - this.dashTimer / 0.45; // 0..1 through the hop
                    const arc = Math.sin(t * Math.PI) * 0.22;
                    this.sprite.scaleX = this._baseScaleX * (1 - arc * 0.5);
                    this.sprite.scaleY = this._baseScaleY * (1 + arc);
                }
                break;
            case 'orbit': {
                // circles around a slowly drifting center (Saturn jelly)
                this.orbitAngle += dt * 2.2;
                this._amble(dt);
                this.orbitCx += Math.cos(this.dir) * this.speedBase * 0.4 * dt;
                this.orbitCy += Math.sin(this.dir) * this.speedBase * 0.4 * dt;
                const F0 = CONFIG.FIELD;
                this.orbitCx = Math.max(F0.x + this.r + 60, Math.min(F0.x + F0.w - this.r - 60, this.orbitCx));
                this.orbitCy = Math.max(F0.y + this.r + 60, Math.min(F0.y + F0.h - this.r - 60, this.orbitCy));
                this.sprite.setPosition(
                    this.orbitCx + Math.cos(this.orbitAngle) * 60,
                    this.orbitCy + Math.sin(this.orbitAngle) * 60);
                handled = true;
                break;
            }
            case 'chase': // lovey: drifts toward your finger, hearts in its eyes
                if (pointer) {
                    this.dir = Math.atan2(pointer.y - this.y, pointer.x - this.x);
                } else {
                    this._amble(dt);
                }
                break;
            case 'ricochet':
                // straight lines, hard wall bounces - no random turns
                break;
            case 'float': {
                // rises like a bubble; wraps from top back to the bottom
                const F1 = CONFIG.FIELD;
                let ny1 = this.y - this.speedBase * dt;
                const nx1 = this.x + Math.sin(this._squashT * 0.7) * 30 * dt;
                if (ny1 < F1.y + this.r) ny1 = F1.y + F1.h - this.r;
                this.sprite.setPosition(
                    Math.max(F1.x + this.r, Math.min(F1.x + F1.w - this.r, nx1)), ny1);
                handled = true;
                break;
            }
            case 'flee': {
                if (pointer) {
                    const dx = this.x - pointer.x, dy = this.y - pointer.y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < 200 * 200) {
                        this.dir = Math.atan2(dy, dx);
                        speed = this.speedBase * 1.6;
                        break;
                    }
                }
                this._amble(dt);
                break;
            }
            default: // 'amble' and awake sleepers
                this._amble(dt);
        }

        if (!handled) {
            // integrate + bounce off field walls
            const F = CONFIG.FIELD;
            const r = this.r;
            let nx = this.x + Math.cos(this.dir) * speed * dt;
            let ny = this.y + Math.sin(this.dir) * speed * dt;
            if (nx < F.x + r) { nx = F.x + r; this.dir = Math.PI - this.dir; }
            if (nx > F.x + F.w - r) { nx = F.x + F.w - r; this.dir = Math.PI - this.dir; }
            if (ny < F.y + r) { ny = F.y + r; this.dir = -this.dir; }
            if (ny > F.y + F.h - r) { ny = F.y + F.h - r; this.dir = -this.dir; }
            this.sprite.setPosition(nx, ny);
        }

        this.speedBase = speedBaseSave; // restore - slow only applies for this frame's move

        // idle wobble (jelly!) + shy shrink
        this._squashT += dt * 6;
        if (!this._squashing && this.moveType !== 'hop') {
            const w = 1 + Math.sin(this._squashT) * 0.03;
            this.sprite.scaleX = this._baseScaleX * w * this.hitScale;
            this.sprite.scaleY = this._baseScaleY * (2 - w) * this.hitScale;
        }

        this.updateHpBar();
    }

    _amble(dt) {
        this.dirTimer -= dt;
        if (this.dirTimer <= 0) {
            this.dir = Math.random() * Math.PI * 2;
            this.dirTimer = 0.5 + Math.random();
        }
    }

    // =========================================================================
    // v2.4 attack AI. Targets the nearest active pet; ranged styles will
    // shell the NEST instead when no pet is up. Bosses hit 2.5x harder.
    // =========================================================================
    ATTACK_DEFS = {
        melee:  { cd: 2.0, range: 110, dmg: 0.15 },
        spit:   { cd: 2.6, range: 420, dmg: 0.10 },
        spray:  { cd: 3.0, range: 380, dmg: 0.06 },
        charge: { cd: 3.2, range: 320, dmg: 0.22 },
        slam:   { cd: 2.8, range: 130, dmg: 0.18 },
        zap:    { cd: 2.4, range: 300, dmg: 0.12 }
    };

    _updateAttack(dt) {
        if (this.attackType === 'none' || this.charging > 0) return;
        const scene = this.scene;
        if (!scene.fieldPets || scene.transitioning) return;
        const A = this.ATTACK_DEFS[this.attackType];
        if (!A) return;

        this.attackCd -= dt;
        if (this.attackCd > 0) return;

        // nearest living, targetable pet - a pet's taunt cast overrides this
        // entirely (mirrors pets.js's own forced-target pattern, including
        // the untargetable/stealth guard).
        let target = null, best = Infinity;
        const taunt = this.status.taunt;
        if (taunt && taunt.forceTarget && !taunt.forceTarget.ko && !taunt.forceTarget.status.stealth) {
            target = taunt.forceTarget;
            best = (target.sprite.x - this.x) ** 2 + (target.sprite.y - this.y) ** 2;
        } else {
            for (const a of scene.fieldPets.agents) {
                if (a.ko || a.status.stealth) continue;
                const d2 = (a.sprite.x - this.x) ** 2 + (a.sprite.y - this.y) ** 2;
                if (d2 < best) { best = d2; target = a; }
            }
        }
        const ranged = ['spit', 'spray', 'zap'].includes(this.attackType);
        let tx, ty, isNest = false;
        if (target && Math.sqrt(best) <= A.range + this.r) {
            tx = target.sprite.x; ty = target.sprite.y;
        } else if (ranged && scene.nest && !scene.nest.broken) {
            const dn = Math.hypot(CONFIG.NEST.x - this.x, CONFIG.NEST.y - this.y);
            if (dn > A.range + this.r) return;
            tx = CONFIG.NEST.x; ty = CONFIG.NEST.y; isNest = true;
        } else {
            return;
        }

        const bossMult = this.isBoss ? 2.5 : 1;
        // v3.0: orbity's buffaura skill temporarily juices nearby monsters' attacks
        const buffMult = this.status.buff_dmg ? 1 + this.status.buff_dmg.add : 1;
        this.attackCd = A.cd * (this.isBoss ? 0.8 : 1) * (0.85 + Math.random() * 0.3);
        // v6 Task 2 (A3): single choke point for every regular attack style
        // (melee/slam/charge/spit/spray/zap all read this one `dmg` value) -
        // Balance.monsterAtkMult(stage) is applied here ONCE so it covers all
        // of them, including charge (stashed below as `_chargeDmg`).
        const dmg = Balance.mobHP(this.stage) * A.dmg * bossMult * buffMult * Balance.monsterAtkMult(this.stage);
        Sfx.monsterAttack(this.r);

        switch (this.attackType) {
            case 'melee': {
                // lunge-bite
                const lx = this.x + (tx - this.x) * 0.5, ly = this.y + (ty - this.y) * 0.5;
                this.scene.tweens.add({
                    targets: this.sprite, x: lx, y: ly,
                    duration: 110, yoyo: true, ease: 'Quad.easeOut'
                });
                scene.time.delayedCall(110, () => {
                    if (!this.alive) return;
                    scene.monsterStrikeArea(this, tx, ty, 70, dmg, isNest);
                    // v6 Task 5: melee already dealt damage above but had no
                    // FX of its own next to slam's ring+shake / charge's
                    // flash - additive-only chomp: neon bite impact at the
                    // strike point + a quick pinch-scale "chomp" on the
                    // attacker + a crunch SFX, all landing right on impact.
                    if (typeof Effects !== 'undefined') Effects.biteFx(scene, tx, ty, this.def.color);
                    if (typeof Sfx !== 'undefined') Sfx.crunch();
                    this.scene.tweens.add({
                        targets: this.sprite,
                        scaleX: this._baseScaleX * 1.22, scaleY: this._baseScaleY * 0.78,
                        duration: 70, yoyo: true, ease: 'Quad.easeOut'
                    });
                });
                break;
            }
            case 'slam': {
                // wind up, then ground-pound everything nearby
                this.scene.tweens.add({
                    targets: this.sprite,
                    scaleX: this._baseScaleX * 1.3, scaleY: this._baseScaleY * 1.3,
                    duration: 260, yoyo: true, ease: 'Quad.easeIn',
                    onYoyo: () => {
                        if (!this.alive) return;
                        const radius = (this.r + 90) * (this.isBoss ? 1.5 : 1);
                        if (typeof Effects !== 'undefined') {
                            Effects.ring(scene, this.x, this.y, this.def.color, radius);
                        }
                        scene.cameras.main.shake(this.isBoss ? 160 : 70, 0.002);
                        scene.monsterStrikeArea(this, this.x, this.y, radius, dmg, true);
                    }
                });
                break;
            }
            case 'charge': {
                // flash, aim, RAM
                this.sprite.setTintFill(0xffffff);
                scene.time.delayedCall(140, () => {
                    if (!this.alive) return;
                    if (!this.iceOn) this.sprite.clearTint();
                    this.dir = Math.atan2(ty - this.y, tx - this.x);
                    this.charging = 0.5;
                    this.chargeHit = new Set();
                    this._chargeDmg = dmg;
                });
                break;
            }
            case 'spit':
                scene.monsterProjectile(this, tx, ty, dmg, isNest, 0);
                break;
            case 'spray':
                for (const off of [-0.35, 0, 0.35]) {
                    scene.monsterProjectile(this, tx, ty, dmg, isNest, off);
                }
                break;
            case 'zap':
                scene.monsterZap(this, tx, ty, dmg, isNest);
                break;
        }
    }

    // =========================================================================
    // v3.0 - personality skills (Skills.ARCHETYPES). Every species casts one;
    // Effects.applySkillEffect() (effects.js) is the pure-descriptor -> Phaser
    // translator, shared with pets.js's own auto-cast engine (Task 9).
    // =========================================================================

    // Expire timed statuses, tick poison/burn DoT (v3.0 Task 9 - a NEW
    // consumer: pet skills can now land poison/burn on monsters, which never
    // happened in Task 8), and mirror the ones with a visible side effect
    // (stealth/freeze) onto the sprite. Runs every frame, even mid-charge.
    _updateStatus(now, dt) {
        // v3.0 review fix: snapshot the generation BEFORE any damageMonster()
        // call below can recycle this pooled instance into a brand-new
        // monster (see the _gen++ comment in spawn()). If it changes mid-loop,
        // `this` is no longer the monster we started this function for - bail
        // out completely rather than keep iterating a status-key list that no
        // longer matches `this.status` (spawn() just reset it to {}), which
        // would otherwise either apply leftover DoT to the wrong monster or
        // throw reading `.until`/`.dotPerSec` off an undefined entry.
        const gen = this._gen;
        for (const key of Object.keys(this.status)) {
            const s = this.status[key];
            if (s.until !== undefined && now >= s.until) { delete this.status[key]; continue; }
            if (s.dotPerSec && this.alive) {
                s._acc = (s._acc || 0) + dt;
                while (s._acc >= 1 && this.alive) {
                    s._acc -= 1;
                    this.scene.damageMonster(this, s.dotPerSec, false, this.x, this.y,
                        key === 'poison' ? 'poison' : 'burn');
                    if (this._gen !== gen) return; // recycled mid-tick - stop touching it
                }
            }
        }

        const stealthy = !!this.status.stealth;
        if (stealthy) {
            this.tappable = false;
            this.sprite.setAlpha(0.35);
        } else if (this._wasStealthy) {
            this.tappable = true;
            this.sprite.setAlpha(1);
        }
        this._wasStealthy = stealthy;

        const frozen = !!this.status.freeze;
        if (frozen) {
            this.sprite.setTint(Skills.STATUS.freeze.tint);
        } else if (this._wasFrozen && !this.iceOn) {
            this.sprite.clearTint();
        }
        this._wasFrozen = frozen;
    }

    // Cast this species' personality skill when its cooldown is up. Reuses
    // the same per-frame cadence spot as _updateAttack (called right after it).
    _updateSkill(now) {
        if (this.noSkill || this.charging > 0 || !this.def.skill) return;
        const scene = this.scene;
        if (scene.transitioning) return;
        if (!Skills.ready(this, now)) return;

        const A = Skills.ARCHETYPES[this.def.skill];
        if (!A || A.passive) return; // rage/revive are passive - engines never cast() them

        const ally = Monsters.ALLY_SKILLS.has(this.def.skill) || Monsters.SPAWN_SKILLS.has(this.def.skill);
        if (!ally && !scene.fieldPets) return;
        const ctx = ally ? Monsters.allyCtx(scene, this, now) : Monsters.enemyCtx(scene, this, now);

        const eff = Skills.cast(this.def.skill, ctx);
        // v6 Task 6 ruling (reverses v3.0 Task 7): a whiff - either no cast
        // at all (e.g. execute below threshold, pull with nobody in range)
        // OR a cast that landed on nobody (taunt/knockback/slam with an
        // empty targets[]) - retries soon instead of going dark for the
        // skill's whole cd. See Skills.isWhiff's doc comment for the full
        // reasoning.
        // v6 final-review fix: "soon" is Skills.WHIFF_RETRY_MS, NOT next
        // frame - a whiff that retries every single frame (e.g. every pet KO'd,
        // so an offensive skill whiffs indefinitely) means the instant one pet
        // revives, every monster whose cd "elapsed" mid-whiff casts on that
        // same frame, alpha-striking the pet right back down. The retry gate
        // desyncs those casts across monsters instead of firing them in
        // lockstep. A successful cast below still pays the FULL archetype cd.
        if (Skills.isWhiff(eff)) { this.skillCdUntil = now + Skills.WHIFF_RETRY_MS; return; }

        this.skillCdUntil = now + A.cd;
        // v3.0 Task 9: the descriptor -> Phaser translator now lives in
        // effects.js (Effects.applySkillEffect) so pets.js can reuse it too.
        Effects.applySkillEffect(scene, 'monster', this, eff);
        // v6 Task 6: telegraph flash + uppercase name popup + a per-kind FX
        // pass bigger/more distinct than the old generic ring below it replaced.
        if (typeof Effects !== 'undefined') Effects.skillCastFx(scene, 'monster', this, this.def.skill, eff);
        Sfx.monsterAttack(this.r);
    }

    contains(x, y, forgiveness) {
        const dx = x - this.x, dy = y - this.y;
        const r = this.r * this.hitScale + (forgiveness || 0);
        return dx * dx + dy * dy <= r * r;
    }

    // Cloney: teleports a short hop away when hurt but not killed.
    blinkAway() {
        const F = CONFIG.FIELD;
        const ang = Math.random() * Math.PI * 2;
        const nx = Math.max(F.x + this.r, Math.min(F.x + F.w - this.r,
            this.x + Math.cos(ang) * 140));
        const ny = Math.max(F.y + this.r, Math.min(F.y + F.h - this.r,
            this.y + Math.sin(ang) * 140));
        this.sprite.setPosition(nx, ny);
        this.sprite.setAlpha(0.2);
        this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 180 });
    }

    // Apply damage; plays the squash. Returns true if this hit killed it.
    hit(dmg) {
        if (!this.alive) return false;
        this.awake = true;

        // v3.0: tank/shieldy's shield skill absorbs damage before HP.
        const shield = this.status.shield;
        if (shield && shield.amount > 0) {
            const absorbed = Math.min(shield.amount, dmg);
            shield.amount -= absorbed;
            dmg -= absorbed;
            if (shield.amount <= 0) delete this.status.shield;
            if (dmg <= 0) {
                // mirrors game.js Feel.shieldBlock() without forward-referencing
                // Feel (defined in game.js, which loads after monsters.js)
                Sfx.clank();
                Haptic.tick(0.8);
                this.updateHpBar();
                return false;
            }
        }

        this.hp -= dmg;

        const s = this.sprite;
        if (!this._squashing) { // continuous damage (thorns) must not spam tweens
            this._squashing = true;
            s.setTexture('sp-' + this.def.id + '-squash');
            this.scene.tweens.add({
                targets: s,
                scaleX: this._baseScaleX * 1.25,
                scaleY: this._baseScaleY * 0.7,
                duration: 55, yoyo: true, ease: 'Quad.easeOut',
                onComplete: () => {
                    this._squashing = false;
                    if (this.alive) s.setTexture('sp-' + this.def.id + '-idle');
                }
            });
        }

        if (this.hp <= 0) {
            this.alive = false;
            this.updateHpBar();
            return true;
        }
        this.updateHpBar();
        return false;
    }

    // Hide + release (death FX are the scene's job).
    burst() {
        this.sprite.setVisible(false).setActive(false);
        this.hpBg.setVisible(false);
        this.hpFill.setVisible(false);
    }
}

// =============================================================================
// v3.0 - Monsters ctx builders: turn the live field into the plain {self,
// targets, now} shape Skills.cast() (pure) expects. The actual descriptor ->
// Phaser translation is Effects.applySkillEffect (effects.js, Task 9) - kept
// there so pets.js can reuse the exact same plumbing for its own casts.
// =============================================================================
const Monsters = {

    // heal/shield/buffaura/goldaura/critaura/stealth target the CASTER'S OWN
    // side (other monsters, or self) rather than the enemy pet squad. Reused
    // as-is by pets.js (the skill-id -> ally/offense split doesn't depend on
    // which side is casting).
    ALLY_SKILLS: new Set(['heal', 'shield', 'buffaura', 'goldaura', 'critaura', 'stealth']),
    SPAWN_SKILLS: new Set(['clone', 'summon']),
    // Baseline "skill power" as a fraction of stage mob HP - independent of the
    // caster's ATTACK_DEFS style (some skill-casters, e.g. shysh/goldie, attack
    // 'none' but still need a damage number for their skill's Skills.cast ctx).
    SKILL_DMG_FRAC: 0.15,
    CLONE_SCALE: { r: 0.6, hp: 0.3 },

    // v6 Task 2 (A3): monsterAtkMult applied here. Safe for BOTH callers below
    // (allyCtx AND enemyCtx set self.dmg to this) - only offense archetypes
    // (poison/burn/lifesteal/chain/execute/dash/slam, see skills.js cast())
    // ever read ctx.self.dmg, and those only ever target pet agents (monster
    // casters' enemyCtx never includes the Nest or other monsters as targets)
    // - heal/shield/buffaura/goldaura/critaura/stealth (allyCtx's consumers)
    // read maxHp/mag instead, never dmg, so they're unaffected.
    skillDmg(self) {
        return Balance.mobHP(self.stage) * Monsters.SKILL_DMG_FRAC * (self.isBoss ? 2.5 : 1)
            * Balance.monsterAtkMult(self.stage);
    },

    // ctx for heal/shield/buffaura/goldaura/critaura/stealth/clone/summon:
    // targets = every OTHER living monster (not consumed by any of today's
    // ally archetypes, but built for spec fidelity / future archetypes).
    allyCtx(scene, self, now) {
        const targets = [];
        for (const m of scene.active) {
            if (!m.alive || m === self) continue;
            targets.push({ id: m, hp: m.hp, maxHp: m.maxHp, x: m.x, y: m.y,
                dist: Math.hypot(m.x - self.x, m.y - self.y) });
        }
        return {
            self: { hp: self.hp, maxHp: self.maxHp, dmg: Monsters.skillDmg(self), elem: self.def.elem, x: self.x, y: self.y },
            targets, now
        };
    },

    // ctx for every offensive skill (stun/slow/knockback/taunt/poison/burn/
    // freeze/chain/execute/lifesteal/dash/slam): targets = live, targetable
    // pet agents. v3.0 Task 9: a pet's own stealth cast (fox/raccoon/bat) now
    // makes it untargetable here too, same convention as m.tappable on monsters.
    enemyCtx(scene, self, now) {
        const targets = [];
        if (scene.fieldPets) {
            for (const a of scene.fieldPets.agents) {
                if (a.ko || a.status.stealth) continue;
                targets.push({ id: a, hp: a.hp, maxHp: a.maxHp, x: a.sprite.x, y: a.sprite.y,
                    dist: Math.hypot(a.sprite.x - self.x, a.sprite.y - self.y) });
            }
        }
        return {
            self: { hp: self.hp, maxHp: self.maxHp, dmg: Monsters.skillDmg(self), elem: self.def.elem, x: self.x, y: self.y },
            targets, now
        };
    }
};

if (typeof module !== 'undefined') module.exports = { Monster, Monsters };
