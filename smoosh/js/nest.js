// =============================================================================
// SMOOSH! - nest.js
// The Nest: the thing you protect. Sits bottom-center of the field.
// Nibbler monsters attach and bite it; thorns bite back; regen heals it.
// If it breaks, the stage FAILS (retry). One nest level drives HP / regen /
// thorns / pet slots (see Balance.nest*).
// =============================================================================

class Nest {

    constructor(scene) {
        this.scene = scene;
        this.r = 96; // approach radius

        this.sprite = scene.add.image(CONFIG.NEST.x, CONFIG.NEST.y, 'nest-tex')
            .setDepth(2).setDisplaySize(200, 136);
        this.bar = scene.add.graphics().setDepth(8);
        this.label = scene.add.text(CONFIG.NEST.x, CONFIG.NEST.y + 84, '', {
            fontFamily: 'Arial, sans-serif', fontSize: '18px', fontStyle: 'bold',
            color: '#e8e6f5', stroke: '#141020', strokeThickness: 4
        }).setOrigin(0.5).setDepth(8);

        this.repair();
        this._breatheT = 0;
        this._hurtFlash = 0;
    }

    get maxHp() { return Balance.nestMaxHp(SaveManager.state.nestLevel); }

    repair() {
        this.hp = this.maxHp;
        this.broken = false;
        this.sprite.clearTint().setAlpha(1);
        this.redraw();
    }

    redraw() {
        const w = 220, h = 16;
        const x = CONFIG.NEST.x - w / 2, y = CONFIG.NEST.y + 62;
        const frac = Math.max(0, this.hp / this.maxHp);
        this.bar.clear();
        this.bar.fillStyle(0x0a0714, 0.85).fillRoundedRect(x - 3, y - 3, w + 6, h + 6, 10);
        this.bar.fillStyle(0x241f3d, 1).fillRoundedRect(x, y, w, h, 8);
        if (frac > 0.01) {
            const color = frac > 0.5 ? 0x7dffb2 : frac > 0.25 ? 0xffe066 : 0xff6b6b;
            this.bar.fillStyle(color, 1)
                .fillRoundedRect(x + 2, y + 2, Math.max(8, (w - 4) * frac), h - 4, 6);
        }
        this.label.setText('🥚 NEST Lv.' + SaveManager.state.nestLevel);
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
            this.hp -= Balance.NEST_BITE_DPS * biters.length * dt;
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
                Effects.burst(this.scene, CONFIG.NEST.x, CONFIG.NEST.y, 0x96714a, 26, 1.6);
                Effects.screenFlash(this.scene, 0xff6b6b, 0.35, 500);
            }
            this.scene.onNestBroken();
        }
    }
}
