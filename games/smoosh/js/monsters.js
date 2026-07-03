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

        this._updateAttack(dt);

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
            if (this.biting || dist < 96 + this.r * 0.6) {
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

        // nearest living pet
        let target = null, best = Infinity;
        for (const a of scene.fieldPets.agents) {
            if (a.ko) continue;
            const d2 = (a.sprite.x - this.x) ** 2 + (a.sprite.y - this.y) ** 2;
            if (d2 < best) { best = d2; target = a; }
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
        this.attackCd = A.cd * (this.isBoss ? 0.8 : 1) * (0.85 + Math.random() * 0.3);
        const dmg = Balance.mobHP(this.stage) * A.dmg * bossMult;
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
                    if (this.alive) scene.monsterStrikeArea(this, tx, ty, 70, dmg, isNest);
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

if (typeof module !== 'undefined') module.exports = { Monster };
