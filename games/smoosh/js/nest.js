// =============================================================================
// SMOOSH! - nest.js
// The Nest: the thing you protect. Sits bottom-center of the field.
// Nibbler monsters attach and bite it; thorns bite back; regen heals it.
// If it breaks, the stage FAILS (retry). One nest level drives HP / regen /
// thorns / pet slots (see Balance.nest*).
// =============================================================================

// v7 T5 bugfix (nest carryover clobbered by replay): pure decision - should
// the live HP fraction be mirrored into SaveManager.state.nestHpFrac right
// now? Only for the REAL progression nest, NEVER while playing a stage-map
// REPLAY (scene.replayStage truthy) - a replay always force-repairs to full
// HP right after construction (game.js create()), and redraw() fires every
// frame off Nest.update(); without this guard that forced repair's redraw()
// unconditionally wrote nestHpFrac = 1, silently clobbering the real run's
// carried-over damage the moment a player visited a replay stage and hit the
// always-live back button. Extracted as a standalone function (rather than
// inlined in redraw()) so it's testable without a full Phaser scene stub -
// see tests/nesthpfrac.test.js.
function shouldPersistNestHpFrac(scene) {
    return !(scene && scene.replayStage);
}

class Nest {

    constructor(scene) {
        this.scene = scene;
        this.r = 96; // approach radius

        this.sprite = scene.add.image(CONFIG.NEST.x, CONFIG.NEST.y, 'nest-tex')
            .setDepth(2).setDisplaySize(200, 136);
        this.bar = scene.add.graphics().setDepth(8);
        // v4.0 Phase C final-review: label sits over the light bgField
        // backdrop, not a dark surface - dark ink text + a light stroke
        // reads correctly there (same convention as pets.js's Lv. badge).
        this.label = scene.add.text(CONFIG.NEST.x, CONFIG.NEST.y + 84, '', {
            fontFamily: CONFIG.FONT, fontSize: '18px', color: Balance.hex(CONFIG.PASTEL.ink), stroke: Balance.hex(CONFIG.PASTEL.white), strokeThickness: 4
        }).setOrigin(0.5).setDepth(8);

        this._breatheT = 0;
        this._hurtFlash = 0;
        // v7 Task 5: restore the carried-over HP fraction across an app
        // close+reopen (see redraw()'s persist-sync below) instead of always
        // handing out a free full heal on (re)construction. A replay-from-map
        // session explicitly re-repairs right after construction instead
        // (see game.js create()) - a replay is a clean-slate do-over,
        // independent of the live run's nest condition. Guard against a
        // saved frac <= 0: that can only be a stale mid-break snapshot (see
        // redraw() comment), and constructing an already-broken, un-fixable
        // nest would softlock the stage - fall back to a full repair instead.
        // v7 T5 bugfix: `scene.replayStage` is already set by the time this
        // constructor runs (GameScene.init() sets it before create() calls
        // `new Nest(this)`), so the `this.redraw()` a few lines down - and
        // game.js's follow-up `if (this.replayStage) this.nest.repair()` -
        // both route through the shouldPersistNestHpFrac() guard and never
        // touch the saved fraction. Only the REAL run's redraw() calls
        // persist.
        const savedFrac = (typeof SaveManager !== 'undefined' && SaveManager.state &&
            Number.isFinite(SaveManager.state.nestHpFrac)) ? SaveManager.state.nestHpFrac : 1;
        if (savedFrac > 0) {
            this.hp = Math.min(this.maxHp, this.maxHp * savedFrac);
            this.broken = false;
            this.sprite.clearTint().setAlpha(1);
            this.redraw();
        } else {
            this.repair();
        }
    }

    get maxHp() { return Balance.nestMaxHp(SaveManager.state.nestLevel); }

    repair() {
        this.hp = this.maxHp;
        this.broken = false;
        this.sprite.clearTint().setAlpha(1);
        this.redraw();
    }

    // v7 Task 5: normal stage-clear progression - damage carries over into
    // the next stage (no free full heal) but tops up a LITTLE so it can't
    // snowball into an unwinnable spiral. See Balance.nestCarryHeal +
    // CONFIG.NEST.stageClearHealPct (tunable). Never called on a broken
    // nest in practice (breaking triggers onNestBroken's retry flow, which
    // uses repair() instead), but stays defensive just in case.
    carryHeal(frac) {
        this.hp = Balance.nestCarryHeal(this.hp, this.maxHp, frac);
        this.broken = this.hp <= 0;
        this.sprite.clearTint().setAlpha(this.broken ? 0.7 : 1);
        this.redraw();
    }

    redraw() {
        const w = 220, h = 16;
        const x = CONFIG.NEST.x - w / 2, y = CONFIG.NEST.y + 62;
        const frac = Math.max(0, this.hp / this.maxHp);
        this.bar.clear();
        // v4.0 Phase C final-review: HP-bar backing stays near-black on
        // purpose regardless of theme - the colored fill needs a dark
        // backing to read (same exception class as ui.js:14's button
        // shadow / the settlement/nest-broken dim scrims). Standardized
        // both layers to the one sanctioned scrim value.
        this.bar.fillStyle(0x0a0714, 0.85).fillRoundedRect(x - 3, y - 3, w + 6, h + 6, 10);
        this.bar.fillStyle(0x0a0714, 1).fillRoundedRect(x, y, w, h, 8);
        if (frac > 0.01) {
            const color = frac > 0.5 ? 0x7dffb2 : frac > 0.25 ? 0xffe066 : 0xff6b6b;
            this.bar.fillStyle(color, 1)
                .fillRoundedRect(x + 2, y + 2, Math.max(8, (w - 4) * frac), h - 4, 6);
        }
        this.label.setText('🥚 NEST Lv.' + SaveManager.state.nestLevel);
        // v7 Task 5: keep the live HP fraction mirrored into the save so a
        // mid-run app close+reopen restores the same damaged nest (see
        // constructor) instead of a free full heal. No explicit persist()
        // call here by design - this just updates the in-memory state
        // object, and piggybacks on the many SaveManager.persist() calls
        // already sprinkled through normal play (addGold on every kill,
        // stage-clear, etc.) to reach disk, so it costs nothing extra.
        // redraw() runs every frame while biters are attached/regen is
        // active, so this can transiently mirror a hp<=0 read the instant
        // the nest breaks (before Nest.update() flips this.broken) - the
        // constructor's savedFrac<=0 guard exists specifically for that.
        //
        // v7 T5 bugfix: this write is scoped OFF a stage-map REPLAY session
        // via shouldPersistNestHpFrac() (top of file) - a replay's forced
        // repair()->redraw() must never overwrite the real run's carried
        // fraction with a free full heal. See that function's comment for
        // the full exploit this closes.
        if (typeof SaveManager !== 'undefined' && SaveManager.state && shouldPersistNestHpFrac(this.scene)) {
            SaveManager.state.nestHpFrac = this.maxHp > 0 ? Math.max(0, this.hp / this.maxHp) : 1;
        }
    }

    // Called every frame with the currently-biting monsters.
    update(dt, biters) {
        if (this.broken) return;

        this._breatheT += dt;
        this.sprite.setScale(
            (200 / this.sprite.width) * (1 + Math.sin(this._breatheT * 2) * 0.012),
            (136 / this.sprite.height) * (1 - Math.sin(this._breatheT * 2) * 0.012));

        const L = SaveManager.state.nestLevel;

        if (biters.length) {
            this.hp -= Balance.NEST_BITE_DPS * biters.length * dt * Balance.monsterAtkMult(this.scene.stageNum || 1);
            this._hurtFlash += dt;
            if (this._hurtFlash > 0.35) {
                this._hurtFlash = 0;
                this.sprite.setTint(0xff9a9a);
                this.scene.time.delayedCall(90, () => {
                    if (!this.broken) this.sprite.clearTint();
                });
            }
            // thorns bite back
            const thorns = Balance.nestThorns(L, SaveManager.state.upgrades.tap);
            if (thorns > 0) {
                for (const b of biters) {
                    this.scene.damageMonster(b, thorns * dt, false, b.x, b.y, 'thorns');
                }
            }
        } else if (this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + Balance.nestRegen(L) * dt);
        }

        this.redraw();

        if (this.hp <= 0) {
            this.broken = true;
            this.sprite.setTint(0x555060).setAlpha(0.7);
            if (typeof Effects !== 'undefined') {
                Effects.burst(this.scene, CONFIG.NEST.x, CONFIG.NEST.y, CONFIG.PASTEL.inkSoft, 26, 1.6);
                Effects.screenFlash(this.scene, CONFIG.PASTEL.danger, 0.35, 500);
            }
            this.scene.onNestBroken();
        }
    }
}

// v7 T5 bugfix: exported for tests/nesthpfrac.test.js. No-op in the browser
// (module is undefined there) - same convention as balance.js/save.js/etc.
if (typeof module !== 'undefined') module.exports = { Nest, shouldPersistNestHpFrac };
