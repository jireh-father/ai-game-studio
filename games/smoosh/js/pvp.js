// =============================================================================
// SMOOSH! - pvp.js  (v2.2 arena rework)
// PvP now happens ON THE SAME FIELD as the stage map: both armies roam the
// arena live - seeking, dashing, splashing and healing exactly like field
// pets do in a stage. My pets charge up from the bottom, the rival bot's
// army storms down from the top. Last army standing wins.
// (Battle.sim stays as the pure balance model + future async-PvP validator.)
// =============================================================================

class PvpScene extends Phaser.Scene {
    constructor() { super({ key: 'PvpScene' }); }

    create() {
        const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
        const st = SaveManager.state;

        const back = this.add.text(44, 56, '‹', {
            fontFamily: 'Arial, sans-serif', fontSize: '48px', fontStyle: 'bold', color: '#8d86a8'
        }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
        back.on('pointerdown', () => SmooshGame.goto('MenuScene'));

        this.add.text(W / 2, 56, 'PET BATTLE', {
            fontFamily: 'Arial, sans-serif', fontSize: '44px', fontStyle: 'bold', color: '#ff5ec4'
        }).setOrigin(0.5);
        this.add.text(W / 2, 108, '🏆 ' + st.pvp.rating + '  ·  ' +
            st.pvp.wins + 'W ' + st.pvp.losses + 'L', {
            fontFamily: 'Arial, sans-serif', fontSize: '24px', color: '#8d86a8'
        }).setOrigin(0.5);

        if (!st.pets.length) {
            this.add.text(W / 2, H * 0.42, 'You need pets to battle!\nHatch an egg in the shop 🥚', {
                fontFamily: 'Arial, sans-serif', fontSize: '32px', fontStyle: 'bold',
                color: '#8d86a8', align: 'center'
            }).setOrigin(0.5);
            makeUiButton(this, W / 2, H * 0.58, 420, 96, 'GO TO SHOP', 0x2fa86b,
                () => SmooshGame.goto('ShopScene'));
            return;
        }

        // === the SAME battlefield as the stage map ===
        const F = CONFIG.FIELD;
        this.add.rectangle(F.x + F.w / 2, F.y + F.h / 2, F.w, F.h, 0x1a1530)
            .setStrokeStyle(2, 0x2a2244).setDepth(0);
        this.add.text(F.x + 20, F.y + 18, 'RIVAL', {
            fontFamily: 'Arial, sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ff6b6b'
        }).setOrigin(0, 0.5).setDepth(1);
        this.add.text(F.x + 20, F.y + F.h - 18, 'YOU', {
            fontFamily: 'Arial, sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#7dffb2'
        }).setOrigin(0, 0.5).setDepth(1);

        // armies
        const myTeam = st.pets.slice().sort((a, b) => b.level - a.level);
        const botTeam = Battle.botTeam(st, Math.random);
        this.agents = [];
        this._spawnArmy(myTeam, 'A', st.upgrades.tap);
        this._spawnArmy(botTeam, 'B', st.upgrades.tap);
        this.over = false;
        this._koCount = { A: 0, B: 0 };
    }

    _spawnArmy(team, side, tapLevel) {
        const F = CONFIG.FIELD;
        const n = team.length;
        const size = n <= 4 ? 76 : n <= 10 ? 62 : n <= 24 ? 50 : 42;
        team.forEach((pet, i) => {
            const def = PET_SPECIES.find(p => p.id === pet.species);
            const cols = Math.min(n, Math.floor((F.w - 60) / (size + 12)));
            const col = i % cols, row = Math.floor(i / cols);
            const x = F.x + 40 + col * (size + 12) + ((row % 2) * size * 0.4);
            const y = side === 'A'
                ? F.y + F.h - 60 - row * (size + 16)
                : F.y + 60 + row * (size + 16);
            const spr = this.add.image(x, y, 'pet-' + pet.species)
                .setDepth(3).setDisplaySize(size, size).setFlipX(side === 'B');
            const barW = size + 8;
            const hpBg = this.add.image(x, y - size * 0.62, 'white-tex')
                .setDepth(4).setTint(0x0a0714).setAlpha(0.85).setDisplaySize(barW + 4, 8);
            const hpFill = this.add.image(x, y - size * 0.62, 'white-tex')
                .setDepth(5).setDisplaySize(barW, 4)
                .setTint(side === 'A' ? 0x7dffb2 : 0xff6b6b);
            const maxHp = Balance.petHP(pet.level, tapLevel, pet.rarity);
            this.agents.push({
                side, pet,
                element: def ? def.element : 'fire',
                color: def ? def.color : 0xffffff,
                spr, hpBg, hpFill, size, barW,
                hp: maxHp, maxHp,
                atk: Balance.petDamage(pet.level, tapLevel, pet.rarity, pet.necklace),
                cooldown: Math.random() * 1.2,
                alive: true,
                bobT: Math.random() * 6
            });
        });
    }

    _cooldownFor(element) {
        return { fire: 1.6, electric: 1.2, water: 1.4, leaf: 1.0 }[element] || 1.3;
    }

    _drawHp(a) {
        const frac = Math.max(0, a.hp / a.maxHp);
        a.hpBg.setPosition(a.spr.x, a.spr.y - a.size * 0.62);
        a.hpFill.setDisplaySize(Math.max(2, a.barW * frac), 4);
        a.hpFill.setPosition(a.spr.x - a.barW / 2 + (a.barW * frac) / 2, a.spr.y - a.size * 0.62);
        a.hpFill.setTint(frac > 0.5 ? (a.side === 'A' ? 0x7dffb2 : 0xff9a9a)
            : frac > 0.25 ? 0xffe066 : 0xff6b6b);
    }

    _hurt(victim, dmg, attacker) {
        if (!victim.alive) return;
        const mult = Balance.elementMult(attacker.element, victim.element);
        const final = dmg * mult;
        victim.hp -= final;
        if (typeof Effects !== 'undefined') {
            Effects.burst(this, victim.spr.x, victim.spr.y, attacker.color, 5, 0.6);
            Effects.damageText(this, victim.spr.x, victim.spr.y - 44,
                Balance.fmt(final), mult > 1 ? '#fff06a' : '#ff9a9a', { crit: mult > 1 });
        }
        Sfx.pop(4);
        this.tweens.add({ targets: victim.spr, angle: victim.side === 'A' ? -14 : 14, duration: 70, yoyo: true });
        if (victim.hp <= 0) {
            victim.alive = false;
            Sfx.monsterDeath(50); // a little farewell cry
            victim.hpBg.setVisible(false);
            victim.hpFill.setVisible(false);
            victim.spr.setTint(0x555060).setAlpha(0.45);
            this.tweens.add({ targets: victim.spr, angle: 90, y: victim.spr.y + 14, duration: 300 });
            if (typeof Effects !== 'undefined') {
                Effects.ring(this, victim.spr.x, victim.spr.y, victim.color, 70);
            }
        }
    }

    update(time, delta) {
        if (this.over || !this.agents) return;
        const dt = delta / 1000;
        const F = CONFIG.FIELD;

        const living = (side) => this.agents.filter(a => a.alive && a.side === side);
        const mine = living('A'), theirs = living('B');
        if (!mine.length || !theirs.length) {
            this.over = true;
            this.finish(theirs.length === 0);
            return;
        }

        for (const a of this.agents) {
            if (!a.alive) continue;
            a.bobT += dt;
            this._drawHp(a);
            a.cooldown -= dt;

            const foes = a.side === 'A' ? theirs : mine;
            const allies = a.side === 'A' ? mine : theirs;

            // leaf pets: heal the weakest wounded ally when someone needs it
            if (a.element === 'leaf' && a.cooldown <= 0) {
                const hurt = allies.filter(x => x.hp < x.maxHp * 0.9)
                    .sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
                if (hurt) {
                    a.cooldown = this._cooldownFor('leaf');
                    const heal = a.atk * 0.45;
                    hurt.hp = Math.min(hurt.maxHp, hurt.hp + heal);
                    if (typeof Effects !== 'undefined') {
                        Effects.ring(this, hurt.spr.x, hurt.spr.y, 0xa8e05f, 70);
                        Effects.damageText(this, hurt.spr.x, hurt.spr.y - 44,
                            '+' + Balance.fmt(heal), '#a8e05f');
                    }
                    Sfx.coin();
                    continue;
                }
            }

            // nearest foe
            let target = null, best = Infinity;
            for (const f of foes) {
                const d2 = (f.spr.x - a.spr.x) ** 2 + (f.spr.y - a.spr.y) ** 2;
                if (d2 < best) { best = d2; target = f; }
            }
            if (!target) continue;

            const dx = target.spr.x - a.spr.x, dy = target.spr.y - a.spr.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const range = a.size * 0.5 + target.size * 0.5 + 16;

            if (dist > range) {
                const spd = 170;
                a.spr.x = Phaser.Math.Clamp(a.spr.x + (dx / dist) * spd * dt, F.x + 24, F.x + F.w - 24);
                a.spr.y = Phaser.Math.Clamp(a.spr.y + (dy / dist) * spd * dt + Math.sin(a.bobT * 6) * 0.5,
                    F.y + 24, F.y + F.h - 24);
            } else if (a.cooldown <= 0) {
                a.cooldown = this._cooldownFor(a.element);
                Sfx.petYelp(a.element); // battle cry
                // dash punch
                this.tweens.add({
                    targets: a.spr, x: a.spr.x + dx * 0.3, y: a.spr.y + dy * 0.3,
                    duration: 90, yoyo: true, ease: 'Quad.easeOut'
                });
                switch (a.element) {
                    case 'fire':
                        this._hurt(target, a.atk * 2.0, a);
                        break;
                    case 'electric': {
                        this._hurt(target, a.atk, a);
                        const others = foes.filter(f => f !== target && f.alive &&
                            (f.spr.x - target.spr.x) ** 2 + (f.spr.y - target.spr.y) ** 2 < 200 * 200);
                        if (others[0]) {
                            if (typeof Effects !== 'undefined') {
                                Effects.ring(this, others[0].spr.x, others[0].spr.y, a.color, 50);
                            }
                            this._hurt(others[0], a.atk * 0.6, a);
                        }
                        break;
                    }
                    case 'water': {
                        if (typeof Effects !== 'undefined') {
                            Effects.ring(this, target.spr.x, target.spr.y, a.color, 110);
                        }
                        for (const f of foes.filter(f => f.alive &&
                            (f.spr.x - target.spr.x) ** 2 + (f.spr.y - target.spr.y) ** 2 <= 110 * 110)) {
                            this._hurt(f, a.atk * 0.65, a);
                        }
                        break;
                    }
                    default: // leaf with a full team: modest poke
                        this._hurt(target, a.atk * 0.9, a);
                }
            }
        }
    }

    finish(won) {
        const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
        const st = SaveManager.state;

        const gold = Math.round(Balance.goldPerMob(st.bestStage) * (won ? 25 : 6));
        SaveManager.state.gold += gold;
        if (won) {
            st.pvp.wins++;
            st.pvp.rating += CONFIG.PVP.ratingWin;
            st.gems += CONFIG.GEMS.pvpWin;
        } else {
            st.pvp.losses++;
            st.pvp.rating = Math.max(0, st.pvp.rating + CONFIG.PVP.ratingLose);
        }
        SaveManager.persist();

        this.add.rectangle(W / 2, H / 2, W, H, 0x0a0714, 0.7).setDepth(20);
        this.add.text(W / 2, H * 0.34, won ? '🏆 VICTORY!' : '💀 DEFEAT...', {
            fontFamily: 'Arial, sans-serif', fontSize: '72px', fontStyle: 'bold',
            color: won ? '#7dffb2' : '#ff6b6b'
        }).setOrigin(0.5).setDepth(21);

        // rewards line with real currency icons
        const line = this.add.container(0, 0).setDepth(21);
        const ry = H * 0.44;
        const coin = this.add.image(W / 2 - 150, ry, 'coin-tex').setDepth(21).setDisplaySize(30, 30);
        const goldT = this.add.text(W / 2 - 128, ry, '+' + Balance.fmt(gold), {
            fontFamily: 'Arial, sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#ffd54a'
        }).setOrigin(0, 0.5).setDepth(21);
        if (won) {
            this.add.image(W / 2 + 30, ry, 'gem-tex').setDepth(21).setDisplaySize(28, 28);
            this.add.text(W / 2 + 52, ry, '+' + CONFIG.GEMS.pvpWin, {
                fontFamily: 'Arial, sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#7fd2ff'
            }).setOrigin(0, 0.5).setDepth(21);
        }
        this.add.text(W / 2, ry + 46, 'rating ' + st.pvp.rating, {
            fontFamily: 'Arial, sans-serif', fontSize: '24px', color: '#8d86a8'
        }).setOrigin(0.5).setDepth(21);

        if (won && typeof Effects !== 'undefined') {
            Effects.confetti(this, W / 2, H * 0.3);
            Sfx.jackpot();
        }
        makeUiButton(this, W / 2, H * 0.6, 420, 96, 'REMATCH', 0xff5ec4,
            () => this.scene.restart());
        makeUiButton(this, W / 2, H * 0.6 + 124, 420, 96, 'MENU', 0x39424f,
            () => SmooshGame.goto('MenuScene'));
    }
}
