// =============================================================================
// SMOOSH! - pvp.js  (v3.0 Task 13 - team picker)
// PvP now happens ON THE SAME FIELD as the stage map: both armies roam the
// arena live - seeking, dashing, splashing and healing exactly like field
// pets do in a stage. My pets charge up from the bottom, the rival bot's
// army storms down from the top. Last army standing wins.
// (Battle.sim stays as the pure balance model + future async-PvP validator.)
// Before any match: a team-picker overlay lets the player choose up to
// CONFIG.PVP.teamSize pets (golden ring = selected, AUTO = top damage,
// FIGHT starts the match). The bot team always mirrors the PICKED count,
// not the player's full roster - see _startMatch().
// =============================================================================

const PICK_COLS = 4, PICK_CARD = 148, PICK_GAP = 16, PICK_ROW_H = PICK_CARD + PICK_GAP;

class PvpScene extends Phaser.Scene {
    constructor() { super({ key: 'PvpScene' }); }

    create() {
        const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
        const st = SaveManager.state;

        const back = this.add.text(44, 56, '‹', {
            fontFamily: CONFIG.FONT, fontSize: '48px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
        }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
        back.on('pointerdown', () => SmooshGame.goto('MenuScene'));

        // v4.0 Phase C Task 3: unified with the other scenes' header-title
        // treatment (goodText on-bg) instead of inventing a one-off deep
        // "fever pink" text token for this single title.
        // v5.0 Task 2: 44->38 - header-title trim (pixel-font headroom).
        this.add.text(W / 2, 56, 'PET BATTLE', {
            fontFamily: CONFIG.FONT, fontSize: '38px', color: Balance.hex(CONFIG.PASTEL.goodText)
        }).setOrigin(0.5);
        this.add.text(W / 2, 108, '🏆 ' + st.pvp.rating + '  ·  ' +
            st.pvp.wins + 'W ' + st.pvp.losses + 'L', {
            fontFamily: CONFIG.FONT, fontSize: '24px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
        }).setOrigin(0.5);

        if (!st.pets.length) {
            this.add.text(W / 2, H * 0.42, 'You need pets to battle!\nHatch an egg in the shop 🥚', {
                fontFamily: CONFIG.FONT, fontSize: '32px', color: Balance.hex(CONFIG.PASTEL.inkSoft), align: 'center'
            }).setOrigin(0.5);
            makeUiButton(this, W / 2, H * 0.58, 420, 96, 'GO TO SHOP', CONFIG.PASTEL.accent,
                () => SmooshGame.goto('ShopScene'));
            return;
        }

        this._pickerActive = false;
        this._wirePickerInput();
        this._showPicker();
    }

    // =========================================================================
    // Team picker overlay - shown BEFORE any match. Scrollable 4-wide grid of
    // every owned pet (follows DexScene's grid/scroll pattern); tap toggles
    // selection up to CONFIG.PVP.teamSize; AUTO picks top damage; FIGHT
    // persists state.pvpTeam and starts the match with exactly those pets.
    // =========================================================================
    _showPicker() {
        const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, st = SaveManager.state;

        const valid = Balance.pvpValidTeam(st.pvpTeam, st.pets);
        this.pickSelected = valid.length ? valid : Balance.pvpAutoTeam(st.pets, st.upgrades.tap);

        this.pickerViewTop = 214;
        this.pickerViewBottom = H - 168;
        this.pickerScrollY = this.pickerViewTop;

        const parts = [];
        // depth -1: sits BEHIND the existing header (back/title/rating, all
        // default depth 0) so they stay visible above the picker backdrop.
        parts.push(this.add.rectangle(W / 2, H / 2, W, H, CONFIG.COLORS.bg).setDepth(-1));
        parts.push(this.add.text(W / 2, 158, I18n.t('pvp.pickTeam'), {
            fontFamily: CONFIG.FONT, fontSize: '28px', color: Balance.hex(CONFIG.PASTEL.goldText)
        }).setOrigin(0.5).setDepth(2));
        this.pickCountText = this.add.text(W / 2, 188, '', {
            fontFamily: CONFIG.FONT, fontSize: '20px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
        }).setOrigin(0.5).setDepth(2);
        parts.push(this.pickCountText);

        this.pickGridContainer = this.add.container(0, this.pickerScrollY).setDepth(2);
        parts.push(this.pickGridContainer);
        this._buildPickerGrid();

        const autoBtn = makeUiButton(this, W / 2 - 190, H - 90, 280, 88, I18n.t('pvp.auto'), CONFIG.PASTEL.accent, () => {
            this.pickSelected = Balance.pvpAutoTeam(st.pets, st.upgrades.tap);
            Sfx.coin();
            this._refreshPickerSelection();
        });
        const fightBtn = makeUiButton(this, W / 2 + 190, H - 90, 280, 88, I18n.t('pvp.fight'), CONFIG.PASTEL.accent, () => {
            if (!this.pickSelected.length) return;
            st.pvpTeam = this.pickSelected.slice();
            SaveManager.persist();
            this._pickerActive = false;
            parts.forEach(p => p.destroy());
            autoBtn.destroyAll();
            fightBtn.destroyAll();
            this._startMatch(this.pickSelected);
        });
        this.pickFightBtn = fightBtn;

        this._pickerParts = parts.concat();
        this._pickerAutoBtn = autoBtn;
        this._pickerFightBtn = fightBtn;
        this._pickerActive = true;
        this._refreshPickerSelection();
    }

    _buildPickerGrid() {
        this.pickGridContainer.removeAll(true);
        this.pickCardViews = [];
        const W = CONFIG.WIDTH, st = SaveManager.state;
        const sorted = st.pets.slice().sort((a, b) => b.level - a.level);
        const startX = (W - (PICK_COLS * PICK_CARD + (PICK_COLS - 1) * PICK_GAP)) / 2 + PICK_CARD / 2;

        sorted.forEach((pet, i) => {
            const col = i % PICK_COLS, row = Math.floor(i / PICK_COLS);
            const x = startX + col * (PICK_CARD + PICK_GAP);
            const y = PICK_CARD / 2 + row * PICK_ROW_H;
            const def = PET_SPECIES.find(p => p.id === pet.species);

            const ring = this.add.nineslice(x, y, 'btn-tex', 0, PICK_CARD + 14, PICK_CARD + 14, 22, 22, 22, 22)
                .setTint(CONFIG.PASTEL.gold).setAlpha(0);
            const card = this.add.nineslice(x, y, 'btn-tex', 0, PICK_CARD, PICK_CARD, 20, 20, 20, 20)
                .setTint(CONFIG.PASTEL.panel);
            const spr = this.add.image(x, y - 20, 'pet-' + pet.species).setDisplaySize(76, 76);
            const label = this.add.text(x, y + 38, def ? def.name : pet.species, {
                fontFamily: CONFIG.FONT, fontSize: '16px', color: Balance.hex(CONFIG.PASTEL.ink)
            }).setOrigin(0.5);
            const lvl = this.add.text(x, y + 58, 'Lv.' + pet.level, {
                fontFamily: CONFIG.FONT, fontSize: '14px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
            }).setOrigin(0.5);
            this.pickGridContainer.add([ring, card, spr, label, lvl]);

            this.pickCardViews.push({ x, y, r: PICK_CARD / 2, pet, ring });
        });

        const rows = Math.max(1, Math.ceil(sorted.length / PICK_COLS));
        this.pickContentHeight = rows * PICK_ROW_H;
        this.pickScrollMax = this.pickerViewTop;
        this.pickScrollMin = Math.min(this.pickerViewTop, this.pickerViewBottom - this.pickContentHeight);
        this.pickerScrollY = this.pickScrollMax;
        this.pickGridContainer.y = this.pickerScrollY;
    }

    _refreshPickerSelection() {
        (this.pickCardViews || []).forEach(v => {
            const on = this.pickSelected.includes(v.pet.species);
            v.ring.setAlpha(on ? 1 : 0);
        });
        this.pickCountText.setText(this.pickSelected.length + ' / ' + CONFIG.PVP.teamSize);
        if (this.pickSelected.length) this.pickFightBtn.enable();
        else this.pickFightBtn.disable();
    }

    _wirePickerInput() {
        this._pickDragging = false;
        this._pickDragMoved = false;
        this.input.on('pointerdown', (pointer, currentlyOver) => {
            if (!this._pickerActive) return;
            this._pickDownOverUi = !!(currentlyOver && currentlyOver.length > 0);
            this._pickDragging = true;
            this._pickDragMoved = false;
            this._pickDragStartY = pointer.y;
            this._pickScrollStartY = this.pickerScrollY;
        });
        this.input.on('pointermove', (pointer) => {
            if (!this._pickerActive || !this._pickDragging) return;
            const dy = pointer.y - this._pickDragStartY;
            if (Math.abs(dy) > 6) this._pickDragMoved = true;
            this.pickerScrollY = Phaser.Math.Clamp(this._pickScrollStartY + dy,
                this.pickScrollMin, this.pickScrollMax);
            this.pickGridContainer.y = this.pickerScrollY;
        });
        this.input.on('pointerup', (pointer) => {
            if (!this._pickerActive) { this._pickDragging = false; return; }
            const wasDragging = this._pickDragging;
            this._pickDragging = false;
            if (!wasDragging || this._pickDragMoved || this._pickDownOverUi) return;
            const worldY = pointer.y - this.pickerScrollY;
            for (const v of this.pickCardViews) {
                if (Math.abs(pointer.x - v.x) <= v.r && Math.abs(worldY - v.y) <= v.r) {
                    this._togglePick(v.pet.species);
                    return;
                }
            }
        });
        this.input.on('wheel', (pointer, gameObjects, dx, dy) => {
            if (!this._pickerActive) return;
            this.pickerScrollY = Phaser.Math.Clamp(this.pickerScrollY - dy * 0.6,
                this.pickScrollMin, this.pickScrollMax);
            this.pickGridContainer.y = this.pickerScrollY;
        });
    }

    _togglePick(species) {
        const idx = this.pickSelected.indexOf(species);
        if (idx >= 0) {
            this.pickSelected.splice(idx, 1);
        } else if (this.pickSelected.length < CONFIG.PVP.teamSize) {
            this.pickSelected.push(species);
        } else {
            return; // already at cap - ignore
        }
        Sfx.pop(4);
        this._refreshPickerSelection();
    }

    // Starts the actual battle with EXACTLY the picked pets. Bot team size
    // mirrors the picked count (Battle.botTeam derives n from team.pets.length).
    _startMatch(teamIds) {
        const st = SaveManager.state;
        const F = CONFIG.FIELD;
        // same field-boundary convention as game.js's GameScene/nestscene.js.
        this.add.rectangle(F.x + F.w / 2, F.y + F.h / 2, F.w, F.h, CONFIG.PASTEL.bgField)
            .setStrokeStyle(2, CONFIG.PASTEL.ink).setDepth(0);
        this.add.text(F.x + 20, F.y + 18, 'RIVAL', {
            fontFamily: CONFIG.FONT, fontSize: '22px', color: Balance.hex(CONFIG.PASTEL.dangerText)
        }).setOrigin(0, 0.5).setDepth(1);
        this.add.text(F.x + 20, F.y + F.h - 18, 'YOU', {
            fontFamily: CONFIG.FONT, fontSize: '22px', color: Balance.hex(CONFIG.PASTEL.goodText)
        }).setOrigin(0, 0.5).setDepth(1);

        // armies - the player's team is EXACTLY the picked pets (not the full
        // roster); the bot mirrors that same count via Battle.botTeam's
        // team.pets.length derivation.
        const myTeam = teamIds.map(id => st.pets.find(p => p.species === id)).filter(Boolean)
            .sort((a, b) => b.level - a.level);
        const botTeam = Battle.botTeam({ pets: myTeam }, Math.random);
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
            // dark ink track (same meter-frame convention as the fever gauge
            // in ui.js) + a bright colored fill - a thin HP bar, not text,
            // so WCAG text contrast doesn't apply to the fill hue itself.
            const hpBg = this.add.image(x, y - size * 0.62, 'white-tex')
                .setDepth(4).setTint(CONFIG.PASTEL.ink).setAlpha(0.85).setDisplaySize(barW + 4, 8);
            const hpFill = this.add.image(x, y - size * 0.62, 'white-tex')
                .setDepth(5).setDisplaySize(barW, 4)
                .setTint(side === 'A' ? CONFIG.PASTEL.good : CONFIG.PASTEL.danger);
            const maxHp = Balance.petHP(pet.level, tapLevel, pet.rarity);
            this.agents.push({
                side, pet,
                element: def ? def.element : 'fire',
                color: def ? def.color : CONFIG.PASTEL.white,
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
        a.hpFill.setTint(frac > 0.5 ? (a.side === 'A' ? CONFIG.PASTEL.good : CONFIG.PASTEL.elements.fire.soft)
            : frac > 0.25 ? CONFIG.PASTEL.elements.electric.base : CONFIG.PASTEL.danger);
    }

    _hurt(victim, dmg, attacker) {
        if (!victim.alive) return;
        const mult = Balance.elementMult(attacker.element, victim.element);
        const final = dmg * mult;
        victim.hp -= final;
        if (typeof Effects !== 'undefined') {
            // Effects.damageText always applies an ink stroke outline (see
            // effects.js), so these bright fill colors stay readable
            // regardless of the light field behind them.
            Effects.burst(this, victim.spr.x, victim.spr.y, attacker.color, 5, 0.6);
            Effects.damageText(this, victim.spr.x, victim.spr.y - 44,
                Balance.fmt(final), Balance.hex(mult > 1 ? CONFIG.PASTEL.crit : CONFIG.PASTEL.danger), { crit: mult > 1 });
        }
        Sfx.pop(4);
        this.tweens.add({ targets: victim.spr, angle: victim.side === 'A' ? -14 : 14, duration: 70, yoyo: true });
        if (victim.hp <= 0) {
            victim.alive = false;
            Sfx.monsterDeath(50); // a little farewell cry
            victim.hpBg.setVisible(false);
            victim.hpFill.setVisible(false);
            victim.spr.setTint(CONFIG.PASTEL.inkSoft).setAlpha(0.45);
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
                        Effects.ring(this, hurt.spr.x, hurt.spr.y, CONFIG.PASTEL.good, 70);
                        Effects.damageText(this, hurt.spr.x, hurt.spr.y - 44,
                            '+' + Balance.fmt(heal), Balance.hex(CONFIG.PASTEL.good));
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

        // modal dim-scrim - same near-black exception as ui.js's showSettlement.
        // Everything below renders directly on it (no light panel on top),
        // so text stays BRIGHT (good/danger/gold, not the *Text deep
        // variants) - same convention as game.js's "THE NEST BROKE!" panel.
        this.add.rectangle(W / 2, H / 2, W, H, 0x0a0714, 0.7).setDepth(20);
        this.add.text(W / 2, H * 0.34, won ? '🏆 VICTORY!' : '💀 DEFEAT...', {
            fontFamily: CONFIG.FONT, fontSize: '72px', color: Balance.hex(won ? CONFIG.PASTEL.good : CONFIG.PASTEL.danger)
        }).setOrigin(0.5).setDepth(21);

        // rewards line with real currency icons
        const line = this.add.container(0, 0).setDepth(21);
        const ry = H * 0.44;
        const coin = this.add.image(W / 2 - 150, ry, 'coin-tex').setDepth(21).setDisplaySize(30, 30);
        const goldT = this.add.text(W / 2 - 128, ry, '+' + Balance.fmt(gold), {
            fontFamily: CONFIG.FONT, fontSize: '30px', color: Balance.hex(CONFIG.PASTEL.gold)
        }).setOrigin(0, 0.5).setDepth(21);
        if (won) {
            this.add.image(W / 2 + 30, ry, 'gem-tex').setDepth(21).setDisplaySize(28, 28);
            this.add.text(W / 2 + 52, ry, '+' + CONFIG.GEMS.pvpWin, {
                fontFamily: CONFIG.FONT, fontSize: '30px', color: Balance.hex(CONFIG.PASTEL.elements.water.base)
            }).setOrigin(0, 0.5).setDepth(21);
        }
        // v5 final-review fix: sits directly on the near-black dim scrim (no
        // panel under it). v5's palette flip turned panelLight into a DARK
        // panel token (deep purple), so dark-on-near-black read at ~1.4:1 -
        // switched to `ink` (bright near-white), same fix + same reasoning as
        // game.js's nest-broken subtitle - verified >=4.5:1 in
        // tests/pastel.test.js.
        this.add.text(W / 2, ry + 46, 'rating ' + st.pvp.rating, {
            fontFamily: CONFIG.FONT, fontSize: '24px', color: Balance.hex(CONFIG.PASTEL.ink)
        }).setOrigin(0.5).setDepth(21);

        if (won && typeof Effects !== 'undefined') {
            Effects.confetti(this, W / 2, H * 0.3);
            Sfx.jackpot();
        }
        makeUiButton(this, W / 2, H * 0.6, 420, 96, 'REMATCH', CONFIG.PASTEL.accent,
            () => this.scene.restart());
        makeUiButton(this, W / 2, H * 0.6 + 124, 420, 96, 'MENU', CONFIG.PASTEL.accent,
            () => SmooshGame.goto('MenuScene'));
    }
}
