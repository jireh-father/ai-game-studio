// =============================================================================
// SMOOSH! - shop.js
// ShopScene: EGGS (gacha + reveal ceremony), PETS (feed/shards/necklace),
// GEAR (3 equipment slots + chests), NEST (level up), GEMS (premium + IAP).
// All prices are progress-indexed (Balance.*Cost with bestStage).
// =============================================================================

// v4.0 Phase C Task 3: RARITY_COLORS itself is left UNCHANGED (game.js reads
// this same table by reference for FX shown over dark surfaces - screenFlash/
// particle bursts/the gacha reveal's dark-scrim ceremony - where these bright
// values already read fine and Effects.damageText's ink stroke makes floating
// combat numbers safe regardless of fill color). The problem is narrower:
// this file also renders rarity as flat, unstroked TEXT directly on light
// panels (pet/gear list rows), where these same bright values wash out
// (contrast ~1-2.3, all fail WCAG). RARITY_TEXT_COLORS is the on-panel-safe
// counterpart, reusing existing dark tokens where the hue family already
// has one (common->inkSoft, epic->elements.dark.deep, legendary->goldText)
// and CONFIG.PASTEL.gemText (added this task) for "rare" (same blue family
// as the gems currency text) - see tests/pastel.test.js for the contrast floor.
const RARITY_COLORS = { common: 0x9aa5c0, rare: 0x5aa9ff, epic: 0xb06fff, legendary: 0xffd54a };
const RARITY_TEXT_COLORS = {
    common: CONFIG.PASTEL.inkSoft,
    rare: CONFIG.PASTEL.gemText,
    epic: CONFIG.PASTEL.elements.dark.deep,
    legendary: CONFIG.PASTEL.goldText
};
const RARITY_STARS = { common: '★', rare: '★★', epic: '★★★', legendary: '★★★★' };

class ShopScene extends Phaser.Scene {
    constructor() { super({ key: 'ShopScene' }); }

    init(data) {
        // 'game' = opened mid-fight as a pause overlay; back RESUMES the stage
        this.fromGame = !!(data && data.from === 'game');
    }

    create() {
        const W = CONFIG.WIDTH;
        this.stageRef = SaveManager.state.bestStage;
        this.items = [];   // current tab display objects

        // opaque backdrop (covers the paused game when opened mid-fight)
        this.add.rectangle(W / 2, CONFIG.HEIGHT / 2, W, CONFIG.HEIGHT, CONFIG.PASTEL.bg,
            this.fromGame ? 0.97 : 1);

        // header
        const back = this.add.text(44, 56, this.fromGame ? '▶' : '‹', {
            fontFamily: 'Arial, sans-serif', fontSize: this.fromGame ? '36px' : '48px',
            fontStyle: 'bold', color: Balance.hex(this.fromGame ? CONFIG.PASTEL.goodText : CONFIG.PASTEL.inkSoft)
        }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
        back.on('pointerdown', () => {
            if (this.fromGame) {
                this.scene.stop();
                this.scene.resume('GameScene');
            } else {
                SmooshGame.goto('MenuScene');
            }
        });
        this.add.text(W / 2, 56, 'SHOP', {
            fontFamily: 'Arial, sans-serif', fontSize: '44px', fontStyle: 'bold', color: Balance.hex(CONFIG.PASTEL.goodText)
        }).setOrigin(0.5);

        // wallet: real texture icons (emoji coins render as globes on some fonts)
        this.goldText = this.add.text(W - 44, 44, '', {
            fontFamily: 'Arial, sans-serif', fontSize: '26px', fontStyle: 'bold', color: Balance.hex(CONFIG.PASTEL.goldText)
        }).setOrigin(1, 0.5).setDepth(10);
        this.gemText = this.add.text(W - 44, 78, '', {
            fontFamily: 'Arial, sans-serif', fontSize: '24px', fontStyle: 'bold', color: Balance.hex(CONFIG.PASTEL.gemText)
        }).setOrigin(1, 0.5).setDepth(10);
        this.goldIcon = this.add.image(0, 44, 'coin-tex').setDepth(10).setDisplaySize(26, 26);
        this.gemIcon = this.add.image(0, 78, 'gem-tex').setDepth(10).setDisplaySize(24, 24);
        this.refreshWallet();

        // tab bar
        this.tabs = ['EGGS', 'PETS', 'GEAR', 'NEST', 'GEMS', 'DECOR', 'DEX'];
        this.tabButtons = [];
        const tw = (W - 40) / this.tabs.length;
        this.tabs.forEach((name, i) => {
            const x = 20 + i * tw + tw / 2;
            const bg = this.add.nineslice(x, 128, 'pill-tex', 0, tw - 8, 52, 16, 16, 14, 14)
                .setTint(CONFIG.PASTEL.panel).setDepth(5).setInteractive({ useHandCursor: true });
            const label = this.add.text(x, 128, name, {
                fontFamily: 'Arial, sans-serif', fontSize: '20px', fontStyle: 'bold', color: Balance.hex(CONFIG.PASTEL.inkSoft)
            }).setOrigin(0.5).setDepth(6);
            bg.on('pointerdown', () => this.showTab(name));
            this.tabButtons.push({ name, bg, label });
        });

        this.showTab('EGGS');
    }

    refreshWallet() {
        this.goldText.setText(Balance.fmt(SaveManager.state.gold));
        this.gemText.setText(Balance.fmt(SaveManager.state.gems));
        this.goldIcon.setX(this.goldText.x - this.goldText.width - 22);
        this.gemIcon.setX(this.gemText.x - this.gemText.width - 21);
    }

    clearTab() {
        this.items.forEach(o => (o.destroyAll ? o.destroyAll() : o.destroy()));
        this.items = [];
    }

    showTab(name) {
        this.clearTab();
        for (const t of this.tabButtons) {
            t.bg.setTint(t.name === name ? CONFIG.PASTEL.panelLight : CONFIG.PASTEL.panel);
            t.label.setColor(Balance.hex(t.name === name ? CONFIG.PASTEL.ink : CONFIG.PASTEL.inkSoft));
        }
        this['tab' + name]();
    }

    _text(x, y, str, size, color, origin) {
        const t = this.add.text(x, y, str, {
            fontFamily: 'Arial, sans-serif', fontSize: size + 'px', fontStyle: 'bold',
            color: color || Balance.hex(CONFIG.PASTEL.ink)
        }).setOrigin(origin !== undefined ? origin : 0.5);
        this.items.push(t);
        return t;
    }

    _card(x, y, w, h) {
        const c = this.add.nineslice(x, y, 'btn-tex', 0, w, h, 24, 24, 24, 24).setTint(CONFIG.PASTEL.panel);
        this.items.push(c);
        return c;
    }

    _btn(x, y, w, h, label, color, cb, iconKey) {
        const b = makeUiButton(this, x, y, w, h, label, color, cb, iconKey);
        this.items.push(b);
        return b;
    }

    // =========================================================================
    // EGGS - the gacha
    // =========================================================================
    tabEGGS() {
        const W = CONFIG.WIDTH, st = SaveManager.state;
        const goldCost = Balance.eggCost(this.stageRef);

        this._card(W / 2, 320, 640, 300);
        const egg1 = this.add.image(W / 2 - 220, 300, 'egg-tex').setDisplaySize(120, 150);
        this.items.push(egg1);
        this._text(W / 2 + 60, 240, 'GOLD EGG', 34, Balance.hex(CONFIG.PASTEL.goldText));
        this._text(W / 2 + 60, 282, 'Hatch a random pet!', 20, Balance.hex(CONFIG.PASTEL.inkSoft));
        this._btn(W / 2 - 60, 380, 240, 76, '1× ' + Balance.fmt(goldCost), CONFIG.PASTEL.accent,
            () => this.doGacha(false, 1), 'coin-tex');
        this._btn(W / 2 + 210, 380, 240, 76, '10+1 ' + Balance.fmt(goldCost * 10), CONFIG.PASTEL.accent,
            () => this.doGacha(false, 11), 'coin-tex');

        this._card(W / 2, 660, 640, 300);
        // v4.0 Phase C Task 3: elements.ice.deep (not the pale raw 0xbfe8ff) so
        // the "premium" egg still reads as a distinct blue silhouette against
        // the light panel instead of washing out near-white-on-near-white.
        const egg2 = this.add.image(W / 2 - 220, 640, 'egg-tex').setDisplaySize(120, 150)
            .setTint(CONFIG.PASTEL.elements.ice.deep);
        this.items.push(egg2);
        this._text(W / 2 + 60, 580, 'GEM EGG', 34, Balance.hex(CONFIG.PASTEL.gemText));
        this._text(W / 2 + 60, 622, 'Premium odds! Epic 20% / Leg 10%', 20, Balance.hex(CONFIG.PASTEL.inkSoft));
        this._btn(W / 2 - 60, 720, 240, 76, '1× ' + CONFIG.GEMS.eggCost, CONFIG.PASTEL.accent,
            () => this.doGacha(true, 1), 'gem-tex');
        this._btn(W / 2 + 210, 720, 240, 76, '10+1 ' + CONFIG.GEMS.eggCost * 10, CONFIG.PASTEL.accent,
            () => this.doGacha(true, 11), 'gem-tex');

        this._text(W / 2, 860, 'PITY: epic+ guaranteed within ' +
            (CONFIG.GACHA.pityAt - st.gachaPity) + ' rolls', 22, Balance.hex(RARITY_TEXT_COLORS.epic));
        this._text(W / 2, 920,
            'Dupes → shards (level pets) · Better rarity dupes UPGRADE your pet!', 19, Balance.hex(CONFIG.PASTEL.inkSoft));
        this._text(W / 2, 1080,
            'rates GOLD: C60 R25 E12 L3 (%)   GEM: C40 R30 E20 L10 (%)', 18, Balance.hex(CONFIG.PASTEL.inkSoft));
    }

    doGacha(useGems, count) {
        const st = SaveManager.state;
        if (useGems) {
            const cost = CONFIG.GEMS.eggCost * (count > 1 ? 10 : 1);
            if (st.gems < cost) return this.toast('젬이 부족해요!');
            st.gems -= cost;
        } else {
            const cost = Balance.eggCost(this.stageRef) * (count > 1 ? 10 : 1);
            if (!SaveManager.spendGold(cost)) return this.toast('골드가 부족해요!');
        }
        const results = count === 1
            ? [Gacha.roll(st, Math.random, useGems)]
            : Gacha.multiRoll(st, Math.random, useGems);
        SaveManager.persist();
        this.refreshWallet();
        this.playReveal(results);
    }

    // The hatch ceremony: shake -> crack -> rarity pillar -> reveal.
    playReveal(results) {
        const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
        const overlay = [];
        // modal dim-scrim - same near-black exception as ui.js's showSettlement.
        // Everything in `overlay` below renders directly on this dark scrim
        // (no light panel on top of it, unlike showSettlement), so its text
        // colors stay BRIGHT (white/good/gold/etc, not the *Text deep
        // variants) - same convention as game.js's "THE NEST BROKE!" panel.
        const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x0a0714, 0.85)
            .setDepth(30).setInteractive();
        overlay.push(dim);

        const best = results.slice().sort((a, b) =>
            Gacha.rarityRank(b.rarity) - Gacha.rarityRank(a.rarity))[0];
        const egg = this.add.image(W / 2, H * 0.42, 'egg-tex')
            .setDepth(31).setDisplaySize(170, 212);
        overlay.push(egg);

        // shake ×3, then crack
        this.tweens.add({
            targets: egg, angle: { from: -9, to: 9 }, duration: 90,
            yoyo: true, repeat: 5, ease: 'Sine.easeInOut',
            onComplete: () => {
                const color = RARITY_COLORS[best.rarity];
                if (typeof Effects !== 'undefined') {
                    Effects.screenFlash(this, color, best.rarity === 'legendary' ? 0.5 : 0.3, 500);
                    Effects.burst(this, W / 2, H * 0.42, color, 24, 1.6);
                    Effects.ring(this, W / 2, H * 0.42, color, 320);
                    if (best.rarity === 'legendary') Effects.confetti(this, W / 2, H * 0.4);
                }
                Sfx.jackpot();
                egg.destroy();

                // pillar
                const pillar = this.add.rectangle(W / 2, H * 0.45, 220, H * 0.6, color, 0.25).setDepth(30);
                overlay.push(pillar);

                if (results.length === 1) {
                    const r = results[0];
                    const spr = this.add.image(W / 2, H * 0.42, 'pet-' + r.species)
                        .setDepth(32).setDisplaySize(160, 160).setScale(0.1);
                    overlay.push(spr);
                    this.tweens.add({ targets: spr, scale: 160 / 48, duration: 320, ease: 'Back.easeOut' });
                    const def = PET_SPECIES.find(p => p.id === r.species);
                    overlay.push(this.add.text(W / 2, H * 0.58, def.name + '  ' + RARITY_STARS[r.rarity], {
                        fontFamily: 'Arial, sans-serif', fontSize: '42px', fontStyle: 'bold',
                        color: '#' + color.toString(16).padStart(6, '0')
                    }).setOrigin(0.5).setDepth(32));
                    overlay.push(this.add.text(W / 2, H * 0.64,
                        r.kind === 'new' ? 'NEW PET!' :
                            r.kind === 'upgrade' ? 'RARITY UPGRADED!' : '+' + r.shards + ' shards', {
                        fontFamily: 'Arial, sans-serif', fontSize: '28px', color: Balance.hex(CONFIG.PASTEL.white)
                    }).setOrigin(0.5).setDepth(32));
                } else {
                    // multi: result grid
                    results.forEach((r, i) => {
                        const gx = W / 2 + ((i % 4) - 1.5) * 150;
                        const gy = H * 0.32 + Math.floor(i / 4) * 150;
                        const c = RARITY_COLORS[r.rarity];
                        const cell = this.add.nineslice(gx, gy, 'btn-tex', 0, 130, 130, 20, 20, 20, 20)
                            .setTint(c).setAlpha(0.28).setDepth(31);
                        const spr = this.add.image(gx, gy - 8, 'pet-' + r.species)
                            .setDepth(32).setDisplaySize(76, 76).setScale(0.05);
                        const tag = this.add.text(gx, gy + 44,
                            r.kind === 'shards' ? '+' + r.shards + '🧩' : r.kind.toUpperCase(), {
                            fontFamily: 'Arial, sans-serif', fontSize: '15px', fontStyle: 'bold',
                            color: Balance.hex(CONFIG.PASTEL.white)
                        }).setOrigin(0.5).setDepth(32);
                        overlay.push(cell, spr, tag);
                        this.tweens.add({
                            targets: spr, scale: 76 / 48, delay: i * 90,
                            duration: 220, ease: 'Back.easeOut',
                            onStart: () => Sfx.coin()
                        });
                    });
                }

                overlay.push(this.add.text(W / 2, H * 0.88, 'TAP TO CLOSE', {
                    fontFamily: 'Arial, sans-serif', fontSize: '26px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
                }).setOrigin(0.5).setDepth(32));
                dim.once('pointerdown', () => {
                    overlay.forEach(o => o.destroy());
                    this.showTab('EGGS');
                });
            }
        });
    }

    // =========================================================================
    // PETS - manage the squad
    // =========================================================================
    tabPETS() {
        const W = CONFIG.WIDTH, st = SaveManager.state;
        if (!st.pets.length) {
            this._text(W / 2, 460, 'No pets yet!\nHatch an egg first 🥚', 32, Balance.hex(CONFIG.PASTEL.inkSoft));
            return;
        }
        this._text(W / 2, 180, 'ALL ' + st.pets.length + ' pets fight for you!  ·  collection ' +
            st.pets.length + '/50  ·  🧩' + Balance.fmt(st.shards), 20, Balance.hex(CONFIG.PASTEL.inkSoft));

        // pagination: up to 50 pets
        const PER_PAGE = 4;
        const sorted = st.pets.slice().sort((a, b) => b.level - a.level);
        const pages = Math.ceil(sorted.length / PER_PAGE);
        this.petPage = Math.min(this.petPage || 0, pages - 1);
        const pageItems = sorted.slice(this.petPage * PER_PAGE, this.petPage * PER_PAGE + PER_PAGE);

        pageItems.forEach((pet, j) => {
            const globalIdx = this.petPage * PER_PAGE + j;
            const y = 290 + j * 200;
            const def = PET_SPECIES.find(p => p.id === pet.species);
            this._card(W / 2, y, 660, 184);
            const spr = this.add.image(96, y, 'pet-' + pet.species).setDisplaySize(92, 92);
            this.items.push(spr);
            this._text(200, y - 56, (def ? def.name : pet.species) + '  ' + RARITY_STARS[pet.rarity] +
                '  ⚔', 25,
                Balance.hex(RARITY_TEXT_COLORS[pet.rarity]), 0);
            this._text(200, y - 22, 'Lv.' + pet.level + ' · ' + (def ? def.element : '?') +
                (pet.necklace ? ' · 📿' + pet.necklace : ''), 21, Balance.hex(CONFIG.PASTEL.ink), 0);
            this._text(200, y + 8, 'DPS ' + Balance.fmt(
                Balance.petDamage(pet.level, st.upgrades.tap, pet.rarity, pet.necklace)), 19, Balance.hex(CONFIG.PASTEL.inkSoft), 0);

            const feedCost = Balance.petFeedCost(this.stageRef, pet.level);
            this._btn(300, y + 56, 240, 56, 'FEED ' + Balance.fmt(feedCost), CONFIG.PASTEL.accent, () => {
                if (!SaveManager.spendGold(feedCost)) return this.toast('골드가 부족해요!');
                pet.level++;
                SaveManager.persist();
                this.refreshWallet();
                Sfx.coin();
                this.showTab('PETS');
            });
            this._btn(560, y + 56, 220, 56, '🧩8 → LV UP', CONFIG.PASTEL.accent, () => {
                if (!Gacha.levelWithShards(st, pet.species)) return this.toast('조각이 부족해요!');
                SaveManager.persist();
                Sfx.coin();
                this.showTab('PETS');
            });
        });

        if (pages > 1) {
            const py = 290 + PER_PAGE * 200 - 60;
            this._btn(W / 2 - 180, py, 150, 60, '◀', CONFIG.PASTEL.accent, () => {
                this.petPage = (this.petPage - 1 + pages) % pages;
                this.showTab('PETS');
            });
            this._text(W / 2, py, (this.petPage + 1) + ' / ' + pages, 24, Balance.hex(CONFIG.PASTEL.inkSoft));
            this._btn(W / 2 + 180, py, 150, 60, '▶', CONFIG.PASTEL.accent, () => {
                this.petPage = (this.petPage + 1) % pages;
                this.showTab('PETS');
            });
        }
    }

    // =========================================================================
    // GEAR - equipment + chests
    // =========================================================================
    _openChest(useGems) {
        const st = SaveManager.state;
        const rates = useGems ? CONFIG.GACHA.gemRates : CONFIG.GACHA.rates;
        const rarity = Gacha._rollRarity(rates, Math.random);
        const pool = ['glove', 'ring', 'charm', 'necklace'];
        const slot = pool[Math.floor(Math.random() * 4)];

        if (slot === 'necklace') {
            // best necklace-less (or worse-necklaced) pet gets it
            const target = st.pets
                .filter(p => !p.necklace || Gacha.rarityRank(p.necklace) < Gacha.rarityRank(rarity))
                .sort((a, b) => b.level - a.level)[0];
            if (target) {
                target.necklace = rarity;
                return { slot, rarity, msg: target.species + ' equips a ' + rarity + ' necklace!' };
            }
            const refund = Math.round(Balance.chestCost(this.stageRef) * 0.4);
            SaveManager.state.gold += refund;
            return { slot, rarity, msg: 'No pet needs it → refund ' + Balance.fmt(refund) + ' gold' };
        }

        const cur = st.items[slot];
        if (!cur || Gacha.rarityRank(rarity) > Gacha.rarityRank(cur.rarity)) {
            st.items[slot] = { rarity, level: 0 };
            return { slot, rarity, msg: (cur ? 'UPGRADE! ' : 'NEW! ') + rarity + ' ' + slot };
        }
        const refund = Math.round(Balance.chestCost(this.stageRef) * 0.4);
        st.gold += refund;
        return { slot, rarity, msg: 'Dupe ' + slot + ' → refund ' + Balance.fmt(refund) + ' gold' };
    }

    tabGEAR() {
        const W = CONFIG.WIDTH, st = SaveManager.state;
        const chestCost = Balance.chestCost(this.stageRef);

        this._btn(W / 2 - 170, 210, 320, 76, 'CHEST ' + Balance.fmt(chestCost), CONFIG.PASTEL.accent, () => {
            if (!SaveManager.spendGold(chestCost)) return this.toast('골드가 부족해요!');
            const r = this._openChest(false);
            SaveManager.persist(); this.refreshWallet();
            Sfx.jackpot();
            if (typeof Effects !== 'undefined') {
                Effects.screenFlash(this, RARITY_COLORS[r.rarity], 0.25, 350);
            }
            this.toast(r.msg);
            this.time.delayedCall(700, () => this.showTab('GEAR'));
        }, 'coin-tex');
        this._btn(W / 2 + 180, 210, 320, 76, 'GEM CHEST ' + CONFIG.GEMS.chestCost, CONFIG.PASTEL.accent, () => {
            if (st.gems < CONFIG.GEMS.chestCost) return this.toast('젬이 부족해요!');
            st.gems -= CONFIG.GEMS.chestCost;
            const r = this._openChest(true);
            SaveManager.persist(); this.refreshWallet();
            Sfx.jackpot();
            this.toast(r.msg);
            this.time.delayedCall(700, () => this.showTab('GEAR'));
        }, 'gem-tex');
        this._text(W / 2, 270, 'Chests drop: glove / ring / charm / pet necklace', 19, Balance.hex(CONFIG.PASTEL.inkSoft));

        const slotInfo = {
            glove: { name: 'GLOVE', desc: 'tap damage', icon: 'up-tap' },
            ring:  { name: 'RING',  desc: 'crit chance', icon: 'up-crit' },
            charm: { name: 'CHARM', desc: 'gold gain', icon: 'up-gold' }
        };
        ['glove', 'ring', 'charm'].forEach((slot, i) => {
            const y = 400 + i * 230;
            const it = st.items[slot];
            const info = slotInfo[slot];
            this._card(W / 2, y, 660, 210);
            // v4.0 Phase C Task 3: on-panel icon tint uses the text-safe deep
            // rarity variant (not the bright RARITY_COLORS) so it stays
            // visible against the light card instead of washing out.
            const icon = this.add.image(96, y, info.icon).setDisplaySize(60, 60)
                .setTint(it ? RARITY_TEXT_COLORS[it.rarity] : CONFIG.PASTEL.inkSoft);
            this.items.push(icon);
            if (!it) {
                this._text(200, y - 20, info.name + ' — empty', 28, Balance.hex(CONFIG.PASTEL.inkSoft), 0);
                this._text(200, y + 20, 'Open chests to find one (' + info.desc + ')', 20, Balance.hex(CONFIG.PASTEL.inkSoft), 0);
                return;
            }
            const bonus = Balance.itemBonus(slot, it.rarity, it.level);
            this._text(200, y - 52, info.name + '  ' + RARITY_STARS[it.rarity], 27,
                Balance.hex(RARITY_TEXT_COLORS[it.rarity]), 0);
            this._text(200, y - 14, '+Lv.' + it.level + ' · +' +
                (slot === 'ring' ? (bonus * 100).toFixed(1) + '%p crit'
                    : Math.round(bonus * 100) + '% ' + info.desc), 22, Balance.hex(CONFIG.PASTEL.ink), 0);
            const cost = Balance.itemEnhanceCost(this.stageRef, it.level);
            this._btn(430, y + 56, 380, 64, 'ENHANCE ' + Balance.fmt(cost), CONFIG.PASTEL.accent, () => {
                if (!SaveManager.spendGold(cost)) return this.toast('골드가 부족해요!');
                it.level++;
                SaveManager.persist(); this.refreshWallet();
                Sfx.coin();
                this.showTab('GEAR');
            });
        });
    }

    // =========================================================================
    // NEST
    // =========================================================================
    tabNEST() {
        const W = CONFIG.WIDTH, st = SaveManager.state;
        const L = st.nestLevel;
        const nest = this.add.image(W / 2, 330, 'nest-tex').setDisplaySize(300, 204);
        this.items.push(nest);
        this._text(W / 2, 470, '🥚 NEST  Lv.' + L, 40, Balance.hex(CONFIG.PASTEL.goodText));

        const rows = [
            ['HP', Balance.nestMaxHp(L), Balance.nestMaxHp(L + 1)],
            ['Regen/s', Balance.nestRegen(L).toFixed(1), Balance.nestRegen(L + 1).toFixed(1)],
            ['Thorns', Balance.fmt(Balance.nestThorns(L, st.upgrades.tap)),
                Balance.fmt(Balance.nestThorns(L + 1, st.upgrades.tap))],
            ['Pets', 'ALL fight!', 'ALL fight!']
        ];
        rows.forEach((r, i) => {
            this._text(W / 2 - 240, 560 + i * 52, r[0], 24, Balance.hex(CONFIG.PASTEL.inkSoft), 0);
            this._text(W / 2 + 60, 560 + i * 52, r[1] + '  →  ' + r[2], 24, Balance.hex(CONFIG.PASTEL.ink), 0);
        });

        const cost = Balance.nestUpCost(this.stageRef, L);
        this._btn(W / 2, 850, 480, 96, 'LEVEL UP ' + Balance.fmt(cost), CONFIG.PASTEL.accent, () => {
            if (!SaveManager.spendGold(cost)) return this.toast('골드가 부족해요!');
            st.nestLevel++;
            SaveManager.persist(); this.refreshWallet();
            Sfx.jackpot();
            if (typeof Effects !== 'undefined') Effects.confetti(this, W / 2, 330);
            this.showTab('NEST');
        });
        this._text(W / 2, 940, 'Raiders bite the nest — if it breaks, the stage is lost!', 20, Balance.hex(CONFIG.PASTEL.dangerText));
    }

    // =========================================================================
    // GEMS - premium currency + (dormant) IAP
    // =========================================================================
    tabGEMS() {
        const W = CONFIG.WIDTH, st = SaveManager.state;
        this._text(W / 2, 210, '💎 GET GEMS', 36, Balance.hex(CONFIG.PASTEL.gemText));
        this._text(W / 2, 260,
            'Free: boss kills +1 · King +3 · every 25 stages +5 · PvP win +2', 20, Balance.hex(CONFIG.PASTEL.inkSoft));

        IapManager.PRODUCTS.forEach((p, i) => {
            const y = 370 + i * 165;
            this._card(W / 2, y, 660, 160);
            this._text(150, y, p.type === 'noads' ? I18n.t('shop.removeAdsLabel') : p.label, 40, Balance.hex(CONFIG.PASTEL.gemText));

            // v3.0 Task 12: remove-ads is a flag grant, not gems - own row logic.
            if (p.type === 'noads') {
                if (st.adsRemoved) {
                    this._text(W / 2 + 130, y, I18n.t('shop.adsRemoved'), 26, Balance.hex(CONFIG.PASTEL.goodText));
                } else {
                    this._btn(W / 2 + 130, y, 300, 84, I18n.t('shop.removeAds') + ' $0.99', CONFIG.PASTEL.accent,
                        async () => {
                            const r = await IapManager.purchase(p.id);
                            if (r.ok) {
                                Sfx.jackpot();
                                if (typeof Effects !== 'undefined') Effects.confetti(this, W / 2, y);
                                this.toast(I18n.t('shop.adsRemoved'));
                                this.showTab('GEMS');
                            } else if (r.reason === 'store_not_connected') {
                                this.toast(I18n.t('shop.storeSoon'));
                            }
                        });
                }
                return;
            }

            this._btn(W / 2 + 130, y, 300, 84, p.priceLabel, CONFIG.PASTEL.accent, async () => {
                const r = await IapManager.purchase(p.id);
                if (r.ok) {
                    this.refreshWallet();
                    Sfx.jackpot();
                    if (typeof Effects !== 'undefined') Effects.confetti(this, W / 2, y);
                    this.toast('+' + r.gems + ' 💎' + (r.simulated ? ' (dev)' : ''));
                } else if (r.reason === 'store_not_connected') {
                    this.toast('스토어 연결은 출시 후에 열려요!');
                }
            });
        });
        this._text(W / 2, 1055, IapManager.storeConnected
            ? '' : '(billing goes live with the store release)', 18, Balance.hex(CONFIG.PASTEL.inkSoft));
    }

    // =========================================================================
    // DECOR - v3.5 Task 3: buy nest props with gold/gems. 24-item catalog,
    // paginated 3x3 grid (same pagination pattern as tabPETS) since Phaser
    // has no native scroll container in this codebase.
    // =========================================================================
    tabDECOR() {
        const W = CONFIG.WIDTH, st = SaveManager.state;
        if (!st.decorOwned) st.decorOwned = {};
        this._text(W / 2, 178, I18n.t('decor.title'), 30, Balance.hex(CONFIG.PASTEL.goodText));

        const COLS = 3, ROWS = 3, PER_PAGE = COLS * ROWS;
        const pages = Math.ceil(DECOR_ITEMS.length / PER_PAGE);
        this.decorPage = Math.min(this.decorPage || 0, pages - 1);
        const pageItems = DECOR_ITEMS.slice(this.decorPage * PER_PAGE, this.decorPage * PER_PAGE + PER_PAGE);

        const cellW = 220, cellH = 250;
        const startX = W / 2 - cellW, startY = 320;

        pageItems.forEach((def, i) => {
            const col = i % COLS, row = Math.floor(i / COLS);
            const x = startX + col * cellW, y = startY + row * cellH;
            const owned = st.decorOwned[def.id] || 0;

            this._card(x, y, cellW - 16, cellH - 20);
            const icon = this.add.image(x, y - 68, 'decor-' + def.id).setDisplaySize(84, 84);
            this.items.push(icon);
            this._text(x, y - 8, def.name[I18n.locale] || def.name.en, 17, Balance.hex(CONFIG.PASTEL.ink));
            this._text(x, y + 16, I18n.t('decor.cat.' + def.cat), 13, Balance.hex(CONFIG.PASTEL.inkSoft));
            if (owned > 0) {
                this._text(x + cellW / 2 - 44, y - cellH / 2 + 20, I18n.t('decor.owned', { n: owned }), 13, Balance.hex(CONFIG.PASTEL.goodText));
            }

            const gems = def.price.kind === 'gems';
            this._btn(x, y + 66, cellW - 44, 52, (gems ? '💎' : '') + Balance.fmt(def.price.amount),
                CONFIG.PASTEL.accent, () => this.buyDecor(def), gems ? 'gem-tex' : 'coin-tex');
        });

        if (pages > 1) {
            const py = startY + (ROWS - 1) * cellH + 130;
            this._btn(W / 2 - 180, py, 120, 56, '◀', CONFIG.PASTEL.accent, () => {
                this.decorPage = (this.decorPage - 1 + pages) % pages;
                this.showTab('DECOR');
            });
            this._text(W / 2, py, (this.decorPage + 1) + ' / ' + pages, 22, Balance.hex(CONFIG.PASTEL.inkSoft));
            this._btn(W / 2 + 180, py, 120, 56, '▶', CONFIG.PASTEL.accent, () => {
                this.decorPage = (this.decorPage + 1) % pages;
                this.showTab('DECOR');
            });
        }
    }

    buyDecor(def) {
        const st = SaveManager.state;
        if (def.price.kind === 'gems') {
            if (st.gems < def.price.amount) return this.toast(I18n.t('decor.needGems'));
            st.gems -= def.price.amount;
        } else if (!SaveManager.spendGold(def.price.amount)) {
            return this.toast(I18n.t('decor.needGold'));
        }
        st.decorOwned[def.id] = (st.decorOwned[def.id] || 0) + 1;
        SaveManager.persist();
        this.refreshWallet();
        Sfx.coin();
        this.toast('+' + (def.name[I18n.locale] || def.name.en));
        this.showTab('DECOR');
    }

    // =========================================================================
    // DEX - v3.0 Task 11: a full scene, not an inline panel, so this tab just
    // navigates there instead of rendering into this.items like the others.
    // =========================================================================
    tabDEX() {
        if (this.fromGame) {
            // Same dance as the back button: close this overlay and launch the
            // Dex on top of the still-paused GameScene (SmooshGame.goto would
            // stop the paused GameScene too, since paused scenes aren't
            // "active" and so are invisible to its stop-everything sweep).
            this.scene.stop();
            this.scene.launch('DexScene', { from: 'game' });
        } else {
            SmooshGame.goto('DexScene');
        }
    }

    toast(msg) {
        if (this._toast) this._toast.destroy();
        // v4.0 Phase C Task 3: toast chip stays a dark ink pill with white
        // text regardless of theme - same "always-dark floating chip"
        // exception as makeUiButton's drop shadow / modal scrims.
        this._toast = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 140, msg, {
            fontFamily: 'Arial, sans-serif', fontSize: '26px', fontStyle: 'bold',
            color: Balance.hex(CONFIG.PASTEL.white), backgroundColor: Balance.hex(CONFIG.PASTEL.ink), padding: { x: 18, y: 10 }
        }).setOrigin(0.5).setDepth(40);
        this.tweens.add({
            targets: this._toast, alpha: 0, delay: 1400, duration: 300,
            onComplete: () => { if (this._toast) { this._toast.destroy(); this._toast = null; } }
        });
    }
}
