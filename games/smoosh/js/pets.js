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
                fontFamily: 'Arial, sans-serif',
                fontSize: (size >= 50 ? 14 : 12) + 'px', fontStyle: 'bold',
                color: '#e8e6f5', stroke: '#141020', strokeThickness: 3
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
                homeX: x, homeY: y, bobT: Math.random() * 6
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

    _knockOut(a) {
        a.ko = true;
        a.koLeft = this.KO_SECONDS;
        a.sprite.setTint(0x555060).setAlpha(0.55);
        a.badge.setText('😵 ' + this.KO_SECONDS.toFixed(0) + 's');
        Sfx.clank();
        if (typeof Effects !== 'undefined') {
            Effects.burst(this.scene, a.sprite.x, a.sprite.y, 0x8d86a8, 10, 1);
            Effects.damageText(this.scene, a.sprite.x, a.sprite.y - 50, 'KO!', '#ff6b6b', { big: true });
        }
        this.scene.tweens.add({
            targets: a.sprite, x: a.homeX, y: a.homeY, angle: 0,
            duration: 500, ease: 'Quad.easeOut'
        });
    }

    // A monster attack lands on this pet.
    damageAgent(a, dmg, tint) {
        if (a.ko) return;
        a.hp -= dmg;
        a.sprite.setTintFill(0xffffff);
        this.scene.time.delayedCall(70, () => { if (!a.ko) a.sprite.clearTint(); });
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

    _revive(a) {
        a.ko = false;
        a.hp = a.maxHp;
        a.sprite.clearTint().setAlpha(1);
        a.badge.setText('Lv.' + a.pet.level);
        if (typeof Effects !== 'undefined') {
            Effects.ring(this.scene, a.sprite.x, a.sprite.y, a.def.color, 80);
        }
        this.scene.tweens.add({
            targets: a.sprite, scale: { from: 0.2, to: a.sprite.scale }, duration: 260, ease: 'Back.easeOut'
        });
    }

    update(dt) {
        const scene = this.scene;
        for (const a of this.agents) {
            a.bobT += dt;
            a.badge.setPosition(a.sprite.x, a.sprite.y - a.size * 0.72);
            this._drawHp(a);

            if (a.ko) {
                a.koLeft -= dt;
                a.badge.setText('😵 ' + Math.max(0, a.koLeft).toFixed(0) + 's');
                if (a.koLeft <= 0) this._revive(a);
                continue;
            }

            if (scene.transitioning) {
                a.sprite.x += (a.homeX - a.sprite.x) * Math.min(1, dt * 3);
                a.sprite.y += (a.homeY - a.sprite.y) * Math.min(1, dt * 3) + Math.sin(a.bobT * 3) * 0.3;
                continue;
            }

            // (v2.4: passive contact damage removed - monsters now land REAL
            // attacks via their per-species styles; see Monster._updateAttack)

            a.cooldown -= dt;

            // nearest attackable monster (nest raiders first!)
            let target = null, best = Infinity;
            for (const m of scene.active) {
                if (!m.alive || m.tappable === false) continue;
                const dx = m.x - a.sprite.x, dy = m.y - a.sprite.y;
                let d2 = dx * dx + dy * dy;
                if (m.biting) d2 *= 0.25;
                if (d2 < best) { best = d2; target = m; }
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
                const spd = 260;
                a.sprite.x += (dx / dist) * spd * dt;
                a.sprite.y += (dy / dist) * spd * dt + Math.sin(a.bobT * 6) * 0.5;
            } else if (a.cooldown <= 0) {
                a.cooldown = this._cooldownFor(a.def.element);
                this._attack(a, target);
            }
        }
    }

    _attack(a, target) {
        const scene = this.scene;
        const st = SaveManager.state;
        const base = Balance.petDamage(a.pet.level, st.upgrades.tap, a.pet.rarity, a.pet.necklace);
        const tint = a.def.color;

        scene.tweens.add({
            targets: a.sprite,
            x: target.x - Math.sign(target.x - a.sprite.x) * (target.r + 26),
            duration: 90, yoyo: true, ease: 'Quad.easeOut'
        });
        Sfx.petYelp(a.def.element); // adorable battle cry
        if (typeof Effects !== 'undefined') Effects.burst(scene, target.x, target.y, tint, 4, 0.5);

        const source = 'pet:' + a.def.element;
        switch (a.def.element) {
            case 'fire':
                scene.damageMonster(target, base * 2.2, false, target.x, target.y, source);
                break;
            case 'electric': {
                scene.damageMonster(target, base, false, target.x, target.y, source);
                let second = null, best = Infinity;
                for (const m of scene.active) {
                    if (!m.alive || m === target || m.tappable === false) continue;
                    const d2 = (m.x - target.x) ** 2 + (m.y - target.y) ** 2;
                    if (d2 < best && d2 < 220 * 220) { best = d2; second = m; }
                }
                if (second) {
                    if (typeof Effects !== 'undefined') Effects.ring(scene, second.x, second.y, tint, 50);
                    scene.damageMonster(second, base * 0.6, false, second.x, second.y, source);
                }
                break;
            }
            case 'water': {
                if (typeof Effects !== 'undefined') Effects.ring(scene, target.x, target.y, tint, 110);
                const hits = scene.active.filter(m => m.alive && m.tappable !== false &&
                    (m.x - target.x) ** 2 + (m.y - target.y) ** 2 <= 110 * 110);
                for (const m of hits) scene.damageMonster(m, base * 0.8, false, m.x, m.y, source);
                break;
            }
            default: // leaf - steady hit, golden kills (GameScene pays x1.5)
                scene.damageMonster(target, base * 0.9, false, target.x, target.y, source);
        }
    }
}
