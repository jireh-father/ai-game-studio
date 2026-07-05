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
// v5 final-review fix: `epic` was elements.dark.deep, a token picked back
// when panels were LIGHT (v4) - v5's neon-CRT flip made every panel/bg DARK,
// so that same "deep" (darkened) purple now reads at ~2:1 against
// panel/panelLight/bg, all failing WCAG. The two brighter candidates this
// fix wave first tried - CONFIG.PASTEL.fever (5.24/4.44/6.09) and
// elements.dark.base (4.43/3.75/5.15) - each measured under 4.5:1 against
// panelLight with Balance.relLuminance, so neither is safe on every surface
// this text appears on (panel, panelLight, AND the dark bg). elements.dark.
// soft is the brighter step of the same violet ramp (still reads as "epic
// purple", matching RARITY_COLORS.epic's hue family) and clears all three:
// panel 8.49, panelLight 7.18, bg 9.86 - see tests/pastel.test.js.
const RARITY_TEXT_COLORS = {
    common: CONFIG.PASTEL.inkSoft,
    rare: CONFIG.PASTEL.gemText,
    epic: CONFIG.PASTEL.elements.dark.soft,
    legendary: CONFIG.PASTEL.goldText
};
const RARITY_STARS = { common: '★', rare: '★★', epic: '★★★', legendary: '★★★★' };

// v6 Task 12: same element->color lookup as dex.js's own dexElementColor
// (CONFIG.PASTEL.elements[e].base, not a parallel hardcoded table) - the
// gacha single-pull reveal gains an element chip this task and shouldn't
// invent its own color source for it.
function shopElementColor(elem, fallback) {
    const ramp = CONFIG.PASTEL.elements[elem];
    return ramp ? ramp.base : fallback;
}

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
            fontFamily: CONFIG.FONT, fontSize: this.fromGame ? '36px' : '48px',
            color: Balance.hex(this.fromGame ? CONFIG.PASTEL.goodText : CONFIG.PASTEL.inkSoft)
        }).setOrigin(0.5).setDepth(10);
        // v6 Task 4: unlike the other scenes' isolated back arrow, THIS one
        // sits only ~22px above the EGGS tab pill (x-ranges overlap - both
        // hug the left edge) - a plain padTapArea() would grow the back
        // glyph's bottom edge (+14) past the tab row's now-padded top edge
        // (also +14), a 6px double-tap sliver between "back" and "EGGS".
        // Padded top/left/right (open header space, safe) but NOT bottom
        // (leaves the existing safe gap to the tab row untouched).
        {
            const bw = back.width, bh = back.height, P = 14;
            back.setInteractive(new Phaser.Geom.Rectangle(-P, -P, bw + P * 2, bh + P), Phaser.Geom.Rectangle.Contains);
            back.input.cursor = 'pointer';
        }
        back.on('pointerdown', () => {
            if (this.fromGame) {
                this.scene.stop();
                this.scene.resume('GameScene');
            } else {
                SmooshGame.goto('MenuScene');
            }
        });
        this.add.text(W / 2, 56, 'SHOP', {
            fontFamily: CONFIG.FONT, fontSize: '44px', color: Balance.hex(CONFIG.PASTEL.goodText)
        }).setOrigin(0.5);

        // wallet: real texture icons (emoji coins render as globes on some fonts)
        this.goldText = this.add.text(W - 44, 44, '', {
            fontFamily: CONFIG.FONT, fontSize: '26px', color: Balance.hex(CONFIG.PASTEL.goldText)
        }).setOrigin(1, 0.5).setDepth(10);
        this.gemText = this.add.text(W - 44, 78, '', {
            fontFamily: CONFIG.FONT, fontSize: '24px', color: Balance.hex(CONFIG.PASTEL.gemText)
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
            const pillW = tw - 8;
            const bg = this.add.nineslice(x, 128, 'pill-tex', 0, pillW, 52, 16, 16, 14, 14)
                .setTint(CONFIG.PASTEL.panel).setDepth(5);
            // v6 Task 4: 7 tabs sit only ~8px apart edge-to-edge (720px bar /
            // 7 tabs) - a symmetric +14 pad on every side would close that
            // gap into an overlap and make it EASIER to fat-finger the wrong
            // neighboring tab, the opposite of what padding should do here.
            // So padding is vertical-only (top/bottom, +14 each): the row
            // above (back arrow/title, ~22px clear) and the tab content
            // below (~16px clear, and non-interactive background panels
            // there besides) have real headroom, while left/right stay at
            // the unpadded pill width.
            const HIT_PAD = 14;
            bg.setInteractive(new Phaser.Geom.Rectangle(0, -HIT_PAD, pillW, 52 + HIT_PAD * 2), Phaser.Geom.Rectangle.Contains);
            bg.input.cursor = 'pointer';
            // v5.0 Task 2: 20->17 - 7 tabs share the 720px bar (~97px/tab,
            // ~89px pill); the wider pixel font needed the headroom so
            // 'DECOR' (the longest label) can't crowd its pill edges.
            const label = this.add.text(x, 128, name, {
                fontFamily: CONFIG.FONT, fontSize: '17px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
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

    // v5 final-review fix: optional trailing `wrapWidth` - long static
    // sentences (PITY/dupe-info/rate-footer/chest-drop-list copy) were a
    // single unbounded line that can run past the 720px design width once
    // the pixel font's true 1.0em/char metric is accounted for. Passing a
    // width wraps the line instead of letting it overflow.
    _text(x, y, str, size, color, origin, wrapWidth) {
        const style = {
            fontFamily: CONFIG.FONT, fontSize: size + 'px', color: color || Balance.hex(CONFIG.PASTEL.ink)
        };
        if (wrapWidth) {
            style.wordWrap = { width: wrapWidth, useAdvancedWrap: true };
            style.align = 'center';
        }
        const t = this.add.text(x, y, str, style).setOrigin(origin !== undefined ? origin : 0.5);
        this.items.push(t);
        return t;
    }

    _card(x, y, w, h) {
        const c = this.add.nineslice(x, y, 'btn-tex', 0, w, h, 24, 24, 24, 24).setTint(CONFIG.PASTEL.panel);
        this.items.push(c);
        return c;
    }

    _btn(x, y, w, h, label, color, cb, iconKey, opts) {
        const b = makeUiButton(this, x, y, w, h, label, color, cb, iconKey, opts);
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
        // v5.0 RETRO ARCADE Task 4: gold egg caps at epic - legendary is gem-egg only.
        this._text(W / 2 + 60, 282, I18n.t('shop.eggGoldTier'), 20, Balance.hex(RARITY_TEXT_COLORS.epic));
        // v6 Task 4 review fix: 270px center-to-center gap at w=240 (half=120
        // each) -> exactly 30px raw edge gap, which the default +14/+14 pad
        // leaves only a 2px margin (below the 3px floor). pad:12 leaves 6px.
        this._btn(W / 2 - 60, 380, 240, 76, '1× ' + Balance.fmt(goldCost), CONFIG.PASTEL.accent,
            () => this.doGacha(false, 1), 'coin-tex', { pad: 12 });
        this._btn(W / 2 + 210, 380, 240, 76, '10+1 ' + Balance.fmt(goldCost * 10), CONFIG.PASTEL.accent,
            () => this.doGacha(false, 11), 'coin-tex', { pad: 12 });

        this._card(W / 2, 660, 640, 300);
        // v4.0 Phase C Task 3: elements.ice.deep (not the pale raw 0xbfe8ff) so
        // the "premium" egg still reads as a distinct blue silhouette against
        // the light panel instead of washing out near-white-on-near-white.
        const egg2 = this.add.image(W / 2 - 220, 640, 'egg-tex').setDisplaySize(120, 150)
            .setTint(CONFIG.PASTEL.elements.ice.deep);
        this.items.push(egg2);
        this._text(W / 2 + 60, 580, 'GEM EGG', 34, Balance.hex(CONFIG.PASTEL.gemText));
        // v5.0 RETRO ARCADE Task 4: only the gem egg can drop a legendary pet.
        this._text(W / 2 + 60, 622, I18n.t('shop.eggGemTier'), 20, Balance.hex(RARITY_TEXT_COLORS.legendary));
        // v6 Task 4 review fix: same 30px-raw-gap/240px-wide layout as the
        // gold egg row above - pad:12 for the same reason (see there).
        this._btn(W / 2 - 60, 720, 240, 76, '1× ' + CONFIG.GEMS.eggCost, CONFIG.PASTEL.accent,
            () => this.doGacha(true, 1), 'gem-tex', { pad: 12 });
        this._btn(W / 2 + 210, 720, 240, 76, '10+1 ' + CONFIG.GEMS.eggCost * 10, CONFIG.PASTEL.accent,
            () => this.doGacha(true, 11), 'gem-tex', { pad: 12 });

        // v5 final-review fix: these 3 static lines are long single-sentence
        // copy at the pixel font's true 1.0em/char metric - wordWrap so a
        // long line breaks instead of overflowing the 720px design width.
        this._text(W / 2, 860, 'PITY: epic+ guaranteed within ' +
            (CONFIG.GACHA.pityAt - st.gachaPity) + ' rolls', 22, Balance.hex(RARITY_TEXT_COLORS.epic),
            undefined, 680);
        this._text(W / 2, 920,
            'Dupes → shards (level pets) · Better rarity dupes UPGRADE your pet!', 19, Balance.hex(CONFIG.PASTEL.inkSoft),
            undefined, 680);
        // v5.0 RETRO ARCADE Task 4: derived from CONFIG.GACHA directly (not
        // hardcoded) so this footer can never drift from the real rates again.
        const gr = CONFIG.GACHA.rates, gm = CONFIG.GACHA.gemRates;
        const pct = n => Math.round(n * 100);
        this._text(W / 2, 1080,
            `rates GOLD: C${pct(gr.common)} R${pct(gr.rare)} E${pct(gr.epic)} L${pct(gr.legendary)} (%)   ` +
            `GEM: C${pct(gm.common)} R${pct(gm.rare)} E${pct(gm.epic)} L${pct(gm.legendary)} (%)`,
            18, Balance.hex(CONFIG.PASTEL.inkSoft), undefined, 680);
    }

    doGacha(useGems, count) {
        const st = SaveManager.state;
        if (useGems) {
            const cost = CONFIG.GEMS.eggCost * (count > 1 ? 10 : 1);
            if (st.gems < cost) return this.toast(I18n.t('shop.needGems'));
            st.gems -= cost;
        } else {
            const cost = Balance.eggCost(this.stageRef) * (count > 1 ? 10 : 1);
            if (!SaveManager.spendGold(cost)) return this.toast(I18n.t('shop.needGold'));
        }
        const results = count === 1
            ? [Gacha.roll(st, Math.random, useGems)]
            : Gacha.multiRoll(st, Math.random, useGems);
        SaveManager.persist();
        this.refreshWallet();
        this.playReveal(results);
    }

    // The hatch ceremony: charge -> intensifying shake -> crack -> light
    // rays + color wash -> rarity pillar -> reveal (legendary gets a brief
    // slow-mo + god-rays + banner on top of all of that).
    // v6 Task 11: dramatically bigger, built ADDITIVELY on the v5.0 RETRO
    // ARCADE Task 5 ceremony below (shake->flash/burst/ring[+legendary
    // confetti/burst/shake]->pillar->framed reveal) - every new FX object
    // this adds is pushed into the SAME `overlay` cleanup array as before,
    // and `this.tweens.killTweensOf(overlay)` (added to the close-tap
    // handler) now force-stops every pending tween touching ANY tracked
    // object - including ones with a Phaser `delay` still counting down
    // (e.g. the per-cell multi-pull pop) - the instant the player closes
    // early, so no onStart/onComplete of a killed tween can create new FX
    // after close. See effects.js's own "v6 Task 11" section banner for
    // gachaCharge/lightRays/rarityWash/sparkleTrail's own doc comments.
    playReveal(results) {
        const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
        const overlay = [];
        // Defensive baseline: guarantee no leftover slow-mo from a
        // pathologically-aborted previous legendary reveal can bleed into
        // THIS one (the real restore paths are below, this is just a floor).
        this.tweens.timeScale = 1;

        // modal dim-scrim - same near-black exception as ui.js's showSettlement.
        // Everything in `overlay` below renders directly on this dark scrim
        // (no light panel on top of it, unlike showSettlement), so its text
        // colors stay BRIGHT (white/good/gold/etc, not the *Text deep
        // variants) - same convention as game.js's "THE NEST BROKE!" panel.
        const DIM_BASE_ALPHA = 0.85;
        const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x0a0714, DIM_BASE_ALPHA)
            .setDepth(30).setInteractive();
        overlay.push(dim);

        const best = results.slice().sort((a, b) =>
            Gacha.rarityRank(b.rarity) - Gacha.rarityRank(a.rarity))[0];

        // v7 Task 9: multi-pull (10 eggs) now hatches as TEN eggs laid out
        // in the same grid the results will land in, instead of one big
        // center egg. `gridPos(i)` is the SAME (gx,gy) formula the result
        // cells below use, so each egg sits exactly where its cell/pet will
        // pop in once it cracks - single-pull keeps the original one big
        // egg untouched.
        const isMulti = results.length > 1;
        const gridPos = (i) => ({
            gx: W / 2 + ((i % 4) - 1.5) * 150,
            gy: H * 0.32 + Math.floor(i / 4) * 150
        });

        let egg = null, eggs = null;
        if (isMulti) {
            eggs = results.map((r, i) => {
                const { gx, gy } = gridPos(i);
                const e = this.add.image(gx, gy, 'egg-tex').setDepth(31.5).setDisplaySize(96, 124);
                overlay.push(e);
                return e;
            });
        } else {
            egg = this.add.image(W / 2, H * 0.42, 'egg-tex')
                .setDepth(31).setDisplaySize(170, 212);
            overlay.push(egg);
        }
        // shared anchor for the charge glow below and the shake chain at the
        // bottom of this function - the single big egg's own position for a
        // single pull, or the grid's vertical center for a multi pull (so
        // the ambient charge glow sits behind the whole 10-egg grid rather
        // than favoring one corner).
        const chargeX = W / 2, chargeY = isMulti ? H * 0.32 + 75 : H * 0.42;

        // v6 Task 11: anticipation build-up - a growing/pulsing glow + rising
        // sparks + a deepening scrim (Effects.gachaCharge), running
        // ALONGSIDE a 3-stage INTENSIFYING shake (bigger amplitude, faster
        // beat each stage - replaces the old flat single-amplitude shake)
        // and a rising-pitch charge sweep. `charge` always finishes before
        // "TAP TO CLOSE" exists (no early-abort path reaches it), so it only
        // needs the one explicit destroy() below, not a killTweensOf entry.
        const charge = typeof Effects !== 'undefined'
            ? Effects.gachaCharge(this, chargeX, chargeY, dim, DIM_BASE_ALPHA) : null;
        Sfx.gachaCharge();

        const reveal = () => {
            // Defense-in-depth: charge cleanup must NEVER abort the reveal. If
            // it throws, reveal() would die before egg.destroy()/the close
            // handler below, freezing the egg mid-shake in a stuck, undismissable
            // modal (the exact bug the effects.js gachaCharge.destroy() note
            // describes). Swallow any teardown error so the ceremony always
            // proceeds to the pet card + TAP TO CLOSE.
            if (charge) { try { charge.destroy(); } catch (e) { /* keep revealing */ } }
            const color = RARITY_COLORS[best.rarity];
            const legendary = best.rarity === 'legendary';

            // v6 Task 11: the reveal-instant beats - a full-screen rarity-
            // colored ADD wash (flashes over everything, then fades to
            // "unveil" what's forming underneath) + a rotating light-ray fan
            // bursting from behind the egg, layered UNDER the existing
            // flash/burst/ring so all of it reads as one bigger moment.
            if (typeof Effects !== 'undefined') {
                overlay.push(Effects.rarityWash(this, color, { peak: legendary ? 0.6 : 0.42 }));
                overlay.push(Effects.lightRays(this, W / 2, H * 0.42, color, {
                    count: legendary ? 14 : 9, length: legendary ? 640 : 480,
                    life: legendary ? 1300 : 850
                }));
                Effects.screenFlash(this, color, legendary ? 0.5 : 0.3, 500);
                // v6 Task 11: denser than before (24->34 particles, wider reach)
                Effects.burst(this, W / 2, H * 0.42, color, 34, 1.9);
                Effects.ring(this, W / 2, H * 0.42, color, 320);
                if (legendary) {
                    // v5.0 RETRO ARCADE Task 5 baseline (confetti/gold burst/
                    // camera shake) + v6 Task 11's bigger treatment: a second
                    // gold ray fan, an extra confetti burst, a stronger shake,
                    // and a real (safely-restored) slow-mo window - see the
                    // restore()/onShutdown pair below for how timeScale never
                    // gets stuck.
                    overlay.push(Effects.lightRays(this, W / 2, H * 0.42, CONFIG.PASTEL.gold, {
                        count: 18, length: 720, life: 1400, spins: 0.4, spinDir: -1, depth: 30.32
                    }));
                    Effects.confetti(this, W / 2, H * 0.4);
                    Effects.confetti(this, W / 2, H * 0.44);
                    Effects.burst(this, W / 2, H * 0.42, CONFIG.PASTEL.gold, 40, 2.4);
                    this.cameras.main.shake(320, 0.01);
                    Sfx.legendaryFanfare();

                    // Brief true slow-mo via the TWEEN MANAGER's own
                    // timeScale (this.tweens.timeScale) - deliberately NOT
                    // this.time.timeScale, which the codebase's own bug
                    // history warns freezes Phaser's TIMERS at 0 (see
                    // MEMORY.md common Matter.js/Phaser bugs). tweens.
                    // timeScale only slows TWEEN playback; delayedCall below
                    // (the restore itself) keeps running at real speed, so
                    // the restore always fires on schedule no matter how
                    // "slow" the visuals look.
                    this.tweens.timeScale = 0.45;
                    const onShutdown = () => { this.tweens.timeScale = 1; };
                    this.events.once('shutdown', onShutdown);
                    const restore = () => {
                        this.tweens.timeScale = 1;
                        this.events.off('shutdown', onShutdown);
                        this._revealRestoreTimeScale = null;
                    };
                    // Real-world 900ms (unaffected by the timeScale change
                    // above) - long enough for the slowed god-rays/banner to
                    // read, short enough the shop doesn't feel stuck.
                    const restoreTimer = this.time.delayedCall(900, restore);
                    // Read by the close-tap handler below so tapping to
                    // close EARLY (mid slow-mo) restores immediately instead
                    // of waiting the full 900ms AND cancels the now-redundant
                    // delayedCall so `restore` can never fire twice.
                    this._revealRestoreTimeScale = () => { restoreTimer.remove(false); restore(); };

                    // Big "LEGENDARY!" banner - same pop-in/hold/fade beat as
                    // game.js's "FEVER!!" banner, clamped with fitToWidth so
                    // the pixel font can never overrun the screen.
                    const banner = this.add.text(W / 2, H * 0.22, '★ LEGENDARY! ★', {
                        fontFamily: CONFIG.FONT, fontSize: '52px', color: Balance.hex(CONFIG.PASTEL.goldText),
                        stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 10
                    }).setOrigin(0.5).setDepth(35);
                    overlay.push(banner);
                    fitToWidth(banner, W - 60);
                    const bScale = banner.scale;
                    banner.setScale(bScale * 0.12);
                    this.tweens.add({ targets: banner, scale: bScale, duration: 340, ease: 'Back.easeOut' });
                    this.tweens.add({
                        targets: banner, y: banner.y - 16, alpha: 0, delay: 1100, duration: 400, ease: 'Quad.easeOut'
                    });
                }
            }
            Sfx.jackpot();
            // v7 Task 9: single-pull's one big egg is spent here as before;
            // multi-pull has no single `egg` (10 grid eggs instead) - those
            // are destroyed one-by-one at each egg's own crack moment below.
            if (egg) egg.destroy();

            // pillar
            const pillar = this.add.rectangle(W / 2, H * 0.45, 220, H * 0.6, color, 0.25).setDepth(30);
            overlay.push(pillar);

            if (results.length === 1) {
                const r = results[0];
                const def = PET_SPECIES.find(p => p.id === r.species);
                // v6 Task 12: pedestal the revealed pet stands on - pops in
                // with the same Back.easeOut beat as the frame/sprite below
                // so all three read as one reveal.
                const pedestal = Frames.drawPedestal(this, W / 2, H * 0.42 + 74, 150, r.rarity)
                    .setDepth(30.5).setScale(0.1);
                overlay.push(pedestal);
                this.tweens.add({ targets: pedestal, scale: 1, duration: 320, ease: 'Back.easeOut' });
                // v5.0 RETRO ARCADE Task 5: the pulled pet reveals inside
                // its own rarity frame - sized a bit past the 160px
                // sprite, and popped in with the same Back.easeOut beat
                // as the sprite itself so the two read as one reveal. This
                // is a single big card on screen at a time, so it keeps
                // Frames.draw()'s default `animate: true` (full sweeping
                // shimmer/glow/gem), unlike the multi-pull cells below.
                const frame = Frames.draw(this, W / 2, H * 0.42, 190, 190, r.rarity)
                    .setDepth(31).setScale(0.1);
                overlay.push(frame);
                this.tweens.add({ targets: frame, scale: 1, duration: 320, ease: 'Back.easeOut' });
                const spr = this.add.image(W / 2, H * 0.42, 'pet-' + r.species)
                    .setDepth(32).setDisplaySize(160, 160).setScale(0.1);
                overlay.push(spr);
                this.tweens.add({ targets: spr, scale: 160 / CONFIG.PIXEL.bake, duration: 320, ease: 'Back.easeOut' });
                const nameText = this.add.text(W / 2, H * 0.58, def.name + '  ' + RARITY_STARS[r.rarity], {
                    fontFamily: CONFIG.FONT, fontSize: '42px', color: '#' + color.toString(16).padStart(6, '0')
                }).setOrigin(0.5).setDepth(32);
                // v6 Task 12: "name plate (pixel font, fitToWidth)" - long
                // species name + 4-star legendary suffix is the widest this
                // line ever gets, clamp it before sizing the plate below.
                fitToWidth(nameText, W - 80);
                // Name-plate pill behind the reveal name/stars line - depth
                // pinned just under the text's 32 (created after measuring
                // it, so insertion order alone can't be relied on here).
                overlay.push(this.add.nineslice(W / 2, H * 0.58, 'pill-tex', 0,
                    nameText.displayWidth + 44, 56, 20, 20, 16, 16)
                    .setTint(CONFIG.PASTEL.panel).setAlpha(0.85).setDepth(31.9));
                overlay.push(nameText);
                overlay.push(this.add.text(W / 2, H * 0.64,
                    r.kind === 'new' ? 'NEW PET!' :
                        r.kind === 'upgrade' ? 'RARITY UPGRADED!' : '+' + r.shards + ' shards', {
                    fontFamily: CONFIG.FONT, fontSize: '28px', color: Balance.hex(CONFIG.PASTEL.white)
                }).setOrigin(0.5).setDepth(32));
                // v6 Task 12: element + skill chips, same conventions as
                // dex.js's detail-view chips (bright element-base fill +
                // dark bg text for the element chip; panelLight fill + ink
                // text for the skill chip).
                const elemChip = makeChip(this, W / 2, H * 0.71, 150, 40,
                    shopElementColor(def.element, CONFIG.PASTEL.inkSoft), null,
                    (def.element || '').toUpperCase(), Balance.hex(CONFIG.PASTEL.bg));
                elemChip.parts.forEach(p => p.setDepth(32));
                overlay.push(...elemChip.parts);
                const skillChip = makeChip(this, W / 2, H * 0.77, 260, 40,
                    CONFIG.PASTEL.panelLight, 'spark-tex',
                    I18n.t('dex.skill') + ': ' + (def.skill ? def.skill.toUpperCase() : '-'),
                    Balance.hex(CONFIG.PASTEL.ink));
                skillChip.parts.forEach(p => p.setDepth(32));
                if (skillChip.parts[1]) skillChip.parts[1].setTint(shopElementColor(def.element, CONFIG.PASTEL.white));
                overlay.push(...skillChip.parts);
                // v6 Task 11: a slow drifting sparkle field around the framed
                // pet - "denser particles" ambience beyond the punchy one-
                // shot burst/ring above (bigger + longer for legendary).
                if (typeof Effects !== 'undefined') {
                    overlay.push(Effects.sparkleTrail(this, W / 2, H * 0.42, 130, color,
                        { count: legendary ? 22 : 12, life: 750 }));
                }
            } else {
                // v7 Task 9: multi - the 10 eggs (already shaking in the
                // grid, see `eggs`/gridPos above) now CRACK open one-by-one
                // into the result cells, instead of the cells just popping
                // in cold. Cell/pedestal/frame/tag creation is now folded
                // INSIDE each egg's own crack moment (was created eagerly
                // for all 10 up front before) - only `spr` (the tween
                // target) has to exist ahead of time, kept invisible until
                // its own crack fires, so before any given egg cracks the
                // player sees nothing but that egg shaking, not a preview
                // of the frame/rarity tint underneath it.
                const bestIdx = results.indexOf(best);
                results.forEach((r, i) => {
                    const { gx, gy } = gridPos(i);
                    const c = RARITY_COLORS[r.rarity];
                    const eggSpr = eggs[i];
                    const spr = this.add.image(gx, gy - 8, 'pet-' + r.species)
                        .setDepth(32).setDisplaySize(76, 76).setScale(0.05).setVisible(false);
                    overlay.push(spr);
                    // v6 Task 11: EVERY cell still gets its own rarity flash
                    // (was legendary-only before) + the highest rarity in
                    // the pull still gets a highlight ring/beam/"BEST!"
                    // callout - all folded into this SAME already-`delay`d
                    // tween's onStart (rather than a fresh delayedCall) so
                    // `tweens.killTweensOf(overlay)` on early-close (spr is
                    // already tracked above) reliably prevents it from
                    // firing at all after the reveal is closed. v7 Task 9:
                    // this onStart is now ALSO the crack moment - it destroys
                    // this cell's egg and fires Effects.eggCrack() (a
                    // self-destroying flash+ring+burst - see effects.js -
                    // needs no overlay/killTweensOf entry of its own) before
                    // creating the cell/pedestal/frame/tag and making `spr`
                    // visible, so the shell visibly bursts open right as the
                    // pet appears in it.
                    this.tweens.add({
                        targets: spr, scale: 76 / CONFIG.PIXEL.bake, delay: i * 90,
                        duration: 220, ease: 'Back.easeOut',
                        onStart: () => {
                            Sfx.coin();
                            if (eggSpr.active) eggSpr.destroy();
                            if (typeof Effects !== 'undefined') Effects.eggCrack(this, gx, gy, c);
                            const cell = this.add.nineslice(gx, gy, 'btn-tex', 0, 130, 130, 20, 20, 20, 20)
                                .setTint(c).setAlpha(0.28).setDepth(31);
                            // v6 Task 12: little pedestal under each cell's
                            // sprite - depth sandwiched the same as the
                            // frame (below the sprite, above the tinted cell).
                            const pedestal = Frames.drawPedestal(this, gx, gy + 22, 56, r.rarity).setDepth(31.2);
                            // v5.0 RETRO ARCADE Task 5: each grid cell gets
                            // its own rarity frame (sized just inside the
                            // 130px cell), depth-sandwiched between the
                            // tinted cell and the pet sprite/tag on top of
                            // it. v6 Task 12: up to 11 of these render at
                            // once (a full multi-pull), so - same perf
                            // reasoning as dex.js's grid - shimmer/glow/pip/
                            // gem tweens stay OFF here regardless of rolled
                            // rarity (static sheen instead); only the
                            // single-pull reveal above keeps the animated
                            // version.
                            const frame = Frames.draw(this, gx, gy, 118, 118, r.rarity, { animate: false }).setDepth(31.5);
                            const tag = this.add.text(gx, gy + 44,
                                r.kind === 'shards' ? '+' + r.shards + '🧩' : r.kind.toUpperCase(), {
                                fontFamily: CONFIG.FONT, fontSize: '15px', color: Balance.hex(CONFIG.PASTEL.white)
                            }).setOrigin(0.5).setDepth(32);
                            overlay.push(cell, pedestal, frame, tag);
                            spr.setVisible(true);
                            if (typeof Effects === 'undefined') return;
                            Effects.flash(this, gx, gy, c, 70);
                            if (r.rarity === 'legendary') {
                                Effects.burst(this, gx, gy, CONFIG.PASTEL.gold, 14, 0.9);
                                Effects.lightRays(this, gx, gy, c, { count: 8, length: 100, life: 500, depth: 30.6 });
                            }
                            if (i === bestIdx && results.length > 1) {
                                Effects.ring(this, gx, gy, c, 130);
                                Effects.lightRays(this, gx, gy, c, { count: 10, length: 150, life: 650, depth: 30.6 });
                                const callout = this.add.text(gx, gy - 86, 'BEST!', {
                                    fontFamily: CONFIG.FONT, fontSize: '16px',
                                    color: Balance.hex(RARITY_TEXT_COLORS[r.rarity]),
                                    stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 4
                                }).setOrigin(0.5).setDepth(33);
                                overlay.push(callout);
                                this.tweens.add({
                                    targets: callout, y: callout.y - 10, alpha: { from: 0, to: 1 },
                                    duration: 180, ease: 'Quad.easeOut'
                                });
                            }
                        }
                    });
                });
            }

            overlay.push(this.add.text(W / 2, H * 0.88, 'TAP TO CLOSE', {
                fontFamily: CONFIG.FONT, fontSize: '26px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
            }).setOrigin(0.5).setDepth(32));
            dim.once('pointerdown', () => {
                // Closing early must be as safe as letting the ceremony play
                // out: restore any active slow-mo NOW (don't wait for the
                // 900ms delayedCall), then kill every tween still touching a
                // tracked overlay object (stops any pending-`delay` onStart/
                // onComplete - multi-pull cells, the legendary banner fade,
                // sparkleTrail/lightRays fade-outs - from firing AFTER close
                // and creating orphan FX), THEN destroy the objects themselves.
                if (this._revealRestoreTimeScale) this._revealRestoreTimeScale();
                this.tweens.killTweensOf(overlay);
                overlay.forEach(o => o.destroy());
                this.showTab('EGGS');
            });
        };

        // v6 Task 11: 3-stage INTENSIFYING shake (bigger amplitude + faster
        // beat each stage) replacing the old flat single-amplitude shake -
        // same ~1.05s total as before (400+320+330ms), just escalating
        // instead of constant, so the build-up itself visibly ramps toward
        // the pop instead of holding one steady wobble the whole time.
        // v7 Task 9: `targets` accepts an array, so for multi this ONE tween
        // definition shakes all 10 grid eggs in lockstep (same amplitude/
        // beat) - onComplete still fires exactly once for the whole group,
        // so the shakeStage chain below needs no change beyond the target.
        const shakeStage = (amp, dur, reps, onDone) => {
            this.tweens.add({
                targets: isMulti ? eggs : egg, angle: { from: -amp, to: amp }, duration: dur,
                yoyo: true, repeat: reps, ease: 'Sine.easeInOut', onComplete: onDone
            });
        };
        shakeStage(5, 100, 1, () =>
            shakeStage(11, 80, 1, () =>
                shakeStage(18, 55, 2, reveal)));
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
        // v5 final-review fix: wordWrap - this line is already long before the
        // dynamic counts are appended, and easily overflows 720px.
        this._text(W / 2, 180, 'ALL ' + st.pets.length + ' pets fight for you!  ·  collection ' +
            st.pets.length + '/' + PET_SPECIES.length + '  ·  🧩' + Balance.fmt(st.shards), 20, Balance.hex(CONFIG.PASTEL.inkSoft),
            undefined, 680);

        // pagination: PER_PAGE at a time (pool grows with PET_SPECIES)
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
            // v5.0 Task 2 review fix: pet level is linear-cost (uncapped) so
            // "Lv.NNN · element · 📿rarity" grows past the 660px card edge.
            fitToWidth(this._text(200, y - 22, 'Lv.' + pet.level + ' · ' + (def ? def.element : '?') +
                (pet.necklace ? ' · 📿' + pet.necklace : ''), 21, Balance.hex(CONFIG.PASTEL.ink), 0), 470);
            this._text(200, y + 8, 'DPS ' + Balance.fmt(
                Balance.petDamage(pet.level, st.upgrades.tap, pet.rarity, pet.necklace)), 19, Balance.hex(CONFIG.PASTEL.inkSoft), 0);

            // v6 Task 4 review fix: FEED (x=300,w=240) / LVUP (x=560,w=220)
            // centers sit 260px apart (halves 120+110) -> exactly 30px raw
            // gap, default pad leaves only 2px margin (below the 3px floor).
            // pad:10 leaves 10px AND (see below) is also what the last row's
            // pair needs to clear the pager underneath it.
            const feedCost = Balance.petFeedCost(this.stageRef, pet.level);
            this._btn(300, y + 56, 240, 56, 'FEED ' + Balance.fmt(feedCost), CONFIG.PASTEL.accent, () => {
                if (!SaveManager.spendGold(feedCost)) return this.toast(I18n.t('shop.needGold'));
                pet.level++;
                SaveManager.persist();
                this.refreshWallet();
                Sfx.coin();
                this.showTab('PETS');
            }, undefined, { pad: 10 });
            this._btn(560, y + 56, 220, 56, '🧩8 → LV UP', CONFIG.PASTEL.accent, () => {
                if (!Gacha.levelWithShards(st, pet.species)) return this.toast(I18n.t('shop.needShards'));
                SaveManager.persist();
                Sfx.coin();
                this.showTab('PETS');
            }, undefined, { pad: 10 });
        });

        if (pages > 1) {
            // v6 Task 4 review fix: this pager sits only 84px below the last
            // pet row's FEED/LVUP buttons (h=56 half=28 vs pager h=60
            // half=30) -> 26px raw gap, which the default pad turns into a
            // 2px overlap. pad:10 (matching FEED/LVUP above) leaves 6px.
            const py = 290 + PER_PAGE * 200 - 60;
            this._btn(W / 2 - 180, py, 150, 60, '◀', CONFIG.PASTEL.accent, () => {
                this.petPage = (this.petPage - 1 + pages) % pages;
                this.showTab('PETS');
            }, undefined, { pad: 10 });
            this._text(W / 2, py, (this.petPage + 1) + ' / ' + pages, 24, Balance.hex(CONFIG.PASTEL.inkSoft));
            this._btn(W / 2 + 180, py, 150, 60, '▶', CONFIG.PASTEL.accent, () => {
                this.petPage = (this.petPage + 1) % pages;
                this.showTab('PETS');
            }, undefined, { pad: 10 });
        }
    }

    // =========================================================================
    // GEAR - equipment + chests
    // =========================================================================
    _openChest(useGems) {
        const st = SaveManager.state;
        // v5 final-review fix: chests drop GEAR (glove/ring/charm) or a pet
        // necklace, never a pet itself - the gold-chest branch must NOT read
        // GACHA.rates (that table's legendary share is intentionally zeroed
        // for gold-egg PETS only, per Task 4). Gold chest -> DROP_RATES (the
        // item economy's own table, legendary preserved). Gem chest keeps
        // GACHA.gemRates unchanged - that table was never touched by Task 4
        // and already carries a positive legendary share.
        const rates = useGems ? CONFIG.GACHA.gemRates : CONFIG.DROP_RATES;
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

        // v6 Task 4 review fix: 350px center-to-center gap at w=320 (half=160
        // each) -> exactly 30px raw edge gap, default pad leaves only 2px
        // margin (below the 3px floor). pad:12 leaves 6px.
        this._btn(W / 2 - 170, 210, 320, 76, 'CHEST ' + Balance.fmt(chestCost), CONFIG.PASTEL.accent, () => {
            if (!SaveManager.spendGold(chestCost)) return this.toast(I18n.t('shop.needGold'));
            const r = this._openChest(false);
            SaveManager.persist(); this.refreshWallet();
            Sfx.jackpot();
            if (typeof Effects !== 'undefined') {
                Effects.screenFlash(this, RARITY_COLORS[r.rarity], 0.25, 350);
            }
            this.toast(r.msg);
            this.time.delayedCall(700, () => this.showTab('GEAR'));
        }, 'coin-tex', { pad: 12 });
        this._btn(W / 2 + 180, 210, 320, 76, 'GEM CHEST ' + CONFIG.GEMS.chestCost, CONFIG.PASTEL.accent, () => {
            if (st.gems < CONFIG.GEMS.chestCost) return this.toast(I18n.t('shop.needGems'));
            st.gems -= CONFIG.GEMS.chestCost;
            const r = this._openChest(true);
            SaveManager.persist(); this.refreshWallet();
            Sfx.jackpot();
            this.toast(r.msg);
            this.time.delayedCall(700, () => this.showTab('GEAR'));
        }, 'gem-tex', { pad: 12 });
        // v5 final-review fix: wordWrap so this doesn't overflow the 720px
        // design width at the pixel font's 1.0em/char metric.
        this._text(W / 2, 270, 'Chests drop: glove / ring / charm / pet necklace', 19, Balance.hex(CONFIG.PASTEL.inkSoft),
            undefined, 680);

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
            // v5.0 Task 2 review fix: enhance line ("+Lv.N · +X% tap damage")
            // already grazes the 660px card at level 0 for the longest desc and
            // grows with level (linear-cost, uncapped) - clamp it.
            fitToWidth(this._text(200, y - 14, '+Lv.' + it.level + ' · +' +
                (slot === 'ring' ? (bonus * 100).toFixed(1) + '%p crit'
                    : Math.round(bonus * 100) + '% ' + info.desc), 22, Balance.hex(CONFIG.PASTEL.ink), 0), 470);
            const cost = Balance.itemEnhanceCost(this.stageRef, it.level);
            this._btn(430, y + 56, 380, 64, 'ENHANCE ' + Balance.fmt(cost), CONFIG.PASTEL.accent, () => {
                if (!SaveManager.spendGold(cost)) return this.toast(I18n.t('shop.needGold'));
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
            // v5.0 Task 2 review fix: nestMaxHp is exponential (1.28^L) - shown
            // RAW it hit 5+ digits by nest level ~20 and overran the row. fmt
            // abbreviates it (k/m/b/...) like every other big number in the UI.
            ['HP', Balance.fmt(Balance.nestMaxHp(L)), Balance.fmt(Balance.nestMaxHp(L + 1))],
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
            if (!SaveManager.spendGold(cost)) return this.toast(I18n.t('shop.needGold'));
            st.nestLevel++;
            SaveManager.persist(); this.refreshWallet();
            Sfx.jackpot();
            if (typeof Effects !== 'undefined') Effects.confetti(this, W / 2, 330);
            this.showTab('NEST');
        });
        // v5 final-review fix: wordWrap - this sentence overflows 720px badly
        // at 20px/char (~56 chars * 20px ~= 1120px unwrapped).
        this._text(W / 2, 940, 'Raiders bite the nest — if it breaks, the stage is lost!', 20, Balance.hex(CONFIG.PASTEL.dangerText),
            undefined, 680);
    }

    // =========================================================================
    // GEMS - premium currency + (dormant) IAP
    // v7 T2: no separate remove-ads product anymore - ANY gem pack purchase
    // sets adsRemoved (see iap.js _grant()). This tab shows an indicator
    // line before the first purchase, and an "ADS REMOVED" badge after.
    // =========================================================================
    tabGEMS() {
        const W = CONFIG.WIDTH, st = SaveManager.state;
        this._text(W / 2, 168, '💎 GET GEMS', 32, Balance.hex(CONFIG.PASTEL.gemText));
        // v5 final-review fix: wordWrap - overflows badly at 20px/char
        // (~63 chars * 20px ~= 1260px unwrapped).
        this._text(W / 2, 206,
            'Free: boss kills +1 · King +3 · every 25 stages +5 · PvP win +2', 17, Balance.hex(CONFIG.PASTEL.inkSoft),
            undefined, 680);

        if (st.adsRemoved) {
            this._text(W / 2, 240, I18n.t('shop.adsRemovedBadge'), 20, Balance.hex(CONFIG.PASTEL.goodText));
        } else {
            this._text(W / 2, 240, I18n.t('shop.anyGemRemovesAds'), 16, Balance.hex(CONFIG.PASTEL.goldText),
                undefined, 680);
        }

        // 6 tiers need tighter vertical spacing than the old 4-row layout;
        // last row bottom (~1122) + footer (~1220) still clear HEIGHT=1280.
        const FIRST_Y = 330, ROW_H = 145, CARD_W = 660, CARD_H = 130;
        IapManager.PRODUCTS.forEach((p, i) => {
            const y = FIRST_Y + i * ROW_H;
            this._card(W / 2, y, CARD_W, CARD_H);
            this._text(150, y - 22, p.label, 30, Balance.hex(CONFIG.PASTEL.gemText));
            if (p.tag) {
                this._text(150, y + 22, p.tag, 15, Balance.hex(CONFIG.PASTEL.crit));
            }

            this._btn(W / 2 + 150, y, 300, 84, p.priceLabel, CONFIG.PASTEL.accent, async () => {
                const alreadyRemoved = st.adsRemoved;
                const r = await IapManager.purchase(p.id);
                if (r.ok) {
                    this.refreshWallet();
                    Sfx.jackpot();
                    if (typeof Effects !== 'undefined') Effects.confetti(this, W / 2, y);
                    // First gem purchase ever also silently removed ads -
                    // call that out instead of the usual "+N gems" toast.
                    if (!alreadyRemoved && SaveManager.state.adsRemoved) {
                        this.toast(I18n.t('shop.adsRemovedBadge'));
                    } else {
                        this.toast('+' + r.gems + ' 💎' + (r.simulated ? ' (dev)' : ''));
                    }
                    this.showTab('GEMS');
                } else if (r.reason === 'store_not_connected') {
                    this.toast(I18n.t('shop.storeSoon'));
                }
            });
        });
        // v5 final-review fix: wordWrap - 44 chars * 18px ~= 792px, slightly
        // past the 720px design width.
        this._text(W / 2, FIRST_Y + IapManager.PRODUCTS.length * ROW_H + 20, IapManager.storeConnected
            ? '' : '(billing goes live with the store release)', 15, Balance.hex(CONFIG.PASTEL.inkSoft),
            undefined, 680);
    }

    // =========================================================================
    // DECOR - v3.5 Task 3: buy nest props with gold/gems. 60-item catalog
    // (v6 Task 9), paginated 3x3 grid (same pagination pattern as tabPETS)
    // since Phaser has no native scroll container in this codebase.
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
            // v5.0 Task 2 review fix: longest decor name ("Bounce Mushroom", 15)
            // at 1.0em/char overruns the 204px cell - clamp to the cell width.
            fitToWidth(this._text(x, y - 8, def.name[I18n.locale] || def.name.en, 17, Balance.hex(CONFIG.PASTEL.ink)), cellW - 24);
            this._text(x, y + 16, I18n.t('decor.cat.' + def.cat), 13, Balance.hex(CONFIG.PASTEL.inkSoft));
            if (owned > 0) {
                this._text(x + cellW / 2 - 44, y - cellH / 2 + 20, I18n.t('decor.owned', { n: owned }), 13, Balance.hex(CONFIG.PASTEL.goodText));
            }

            // v6 Task 4 review fix: the bottom grid row's buy button sits only
            // 64px above the pager below it (h=52 half=26 vs pager h=56
            // half=28) -> 10px raw gap, default pad turns that into an 18px
            // overlap (2D: X-ranges already overlap, Y is the only
            // separating axis). pad:3 on both this button AND the pager
            // leaves a 4px margin - the grid's own column-to-column gap
            // (44px raw) stays comfortably clear at pad:3 too.
            const gems = def.price.kind === 'gems';
            this._btn(x, y + 66, cellW - 44, 52, (gems ? '💎' : '') + Balance.fmt(def.price.amount),
                CONFIG.PASTEL.accent, () => this.buyDecor(def), gems ? 'gem-tex' : 'coin-tex', { pad: 3 });
        });

        if (pages > 1) {
            const py = startY + (ROWS - 1) * cellH + 130;
            this._btn(W / 2 - 180, py, 120, 56, '◀', CONFIG.PASTEL.accent, () => {
                this.decorPage = (this.decorPage - 1 + pages) % pages;
                this.showTab('DECOR');
            }, undefined, { pad: 3 });
            this._text(W / 2, py, (this.decorPage + 1) + ' / ' + pages, 22, Balance.hex(CONFIG.PASTEL.inkSoft));
            this._btn(W / 2 + 180, py, 120, 56, '▶', CONFIG.PASTEL.accent, () => {
                this.decorPage = (this.decorPage + 1) % pages;
                this.showTab('DECOR');
            }, undefined, { pad: 3 });
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
        // v4.0 Phase C Task 3 / v5.0 carry-over fix: toast chip stays a
        // dark pill with white text regardless of theme - same "always-
        // dark floating chip" exception as makeUiButton's drop shadow /
        // modal scrims. v5.0 flipped `ink` to bright near-white, so the
        // pill fill moved to `panel` (still a dark surface) to keep the
        // white text readable - see tests/pastel.test.js.
        this._toast = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 140, msg, {
            fontFamily: CONFIG.FONT, fontSize: '26px', color: Balance.hex(CONFIG.PASTEL.white), backgroundColor: Balance.hex(CONFIG.PASTEL.panel), padding: { x: 18, y: 10 }
        }).setOrigin(0.5).setDepth(40);
        this.tweens.add({
            targets: this._toast, alpha: 0, delay: 1400, duration: 300,
            onComplete: () => { if (this._toast) { this._toast.destroy(); this._toast = null; } }
        });
    }
}
