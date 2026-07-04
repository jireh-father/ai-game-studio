// =============================================================================
// SMOOSH! - ui.js  (v1.1 refined interface)
// Rounded NineSlice buttons with drop shadows, upgrade CARDS with custom
// drawn icons + affordability glow, chips/pills for HUD numbers.
// Banner ads live ONLY on MenuScene.
// =============================================================================

// v5.0 Task 2 review fix: Press Start 2P is a TRUE 1.0em/char monospace font
// (every glyph's advance == the font size), not the ~0.6em/char a proportional
// font like Arial would give you. Fixed-width pills/badges sized under the old
// assumption clip once late-game values grow extra digits (infinite stages ->
// multi-digit stage/level/cost numbers). Call this after every .setText() on
// a label that lives inside a fixed-width pill/badge with no wordWrap.
function fitToWidth(t, w) {
    t.setScale(1);
    if (t.width > w) t.setScale(w / t.width);
}

// v6 Task 4: shared tap-padding helper for the small single-glyph "back"
// nav buttons repeated across every scene's header (game/dex/friends/
// nestscene/pvp/shop/stagemap.js all draw the same isolated '<'/'>' text in
// a screen corner with nothing else nearby) - a lone character is the
// worst-case near-miss target on mobile. Same origin-independent
// top-left-anchored local-space rect as makeUiButton below (Phaser's
// InputPlugin always normalizes hit-test coords into that space via
// displayOriginX/Y before testing the shape, regardless of the object's own
// origin - see the longer comment on makeUiButton's body.setInteractive).
// Loads before some callers' own <script> tag (game.js/dex.js/friends.js/
// nestscene.js all load ahead of ui.js in index.html) but that's fine - this
// is only ever called from inside a scene's create(), long after every
// script has finished loading, same as those files' existing calls into
// this file's makeUiButton.
function padTapArea(obj, pad) {
    if (pad === undefined) pad = 14;
    const w = obj.width, h = obj.height;
    obj.setInteractive(new Phaser.Geom.Rectangle(-pad, -pad, w + pad * 2, h + pad * 2), Phaser.Geom.Rectangle.Contains);
    obj.input.cursor = 'pointer';
    return obj;
}

// Rounded button: shadow + body + gloss + passive label.
// The body is the ONLY interactive object.
// iconKey (optional): a texture (e.g. 'coin-tex'/'gem-tex') rendered before
// the label - use this instead of emoji so currency looks identical on
// every device font.
// opts.pad (optional, default 14): v6 Task 4 review fix - the blanket +14
// hit-pad that made lone/isolated buttons forgiving on mobile creates NEW
// overlaps once buttons sit close together (tight nav rows, stacked pairs,
// paginated grids next to pager arrows) - the wrong neighbor can eat a tap.
// Callers with tight neighbors pass a smaller opts.pad so the padded rects
// clear each other by a few px; every other caller keeps the generous
// default. See tests/pastel.test.js's overlap-free layout assumptions and
// the per-call-site comments below for the exact numbers.
function makeUiButton(scene, x, y, w, h, label, color, cb, iconKey, opts) {
    // v4.0 Phase C Task 2: this drop shadow stays near-black on purpose - a
    // raised button needs a dark contact shadow regardless of theme (same
    // exception class as the settlement/nest-broken dim scrims below).
    const shadow = scene.add.nineslice(x, y + 5, 'btn-tex', 0, w, h, 24, 24, 24, 24)
        .setTint(0x0a0714).setAlpha(0.55).setDepth(21);
    const body = scene.add.nineslice(x, y, 'btn-tex', 0, w, h, 24, 24, 24, 24)
        .setTint(color).setDepth(21);
    // v6 Task 4: pad the tappable area past the visible w x h so near-misses
    // on mobile still register. Phaser hit-tests a shape hitArea in the
    // object's "local" space, which - regardless of this NineSlice's origin
    // (0.5/0.5, the default, left untouched here) - Phaser's InputPlugin
    // always normalizes back to a TOP-LEFT-anchored box before testing (it
    // adds displayOriginX/Y to the origin-relative point first - see
    // InputPlugin.pointWithinHitArea in phaser.min.js). So the padded rect
    // is always (-PAD, -PAD, w+2*PAD, h+2*PAD) here, independent of origin.
    // Passing an explicit shape drops the {useHandCursor} sugar (that path
    // only applies when setInteractive() is called with a bare options
    // object), so the hand cursor is re-applied by hand right after.
    const HIT_PAD = (opts && opts.pad !== undefined) ? opts.pad : 14;
    body.setInteractive(
        new Phaser.Geom.Rectangle(-HIT_PAD, -HIT_PAD, w + HIT_PAD * 2, h + HIT_PAD * 2),
        Phaser.Geom.Rectangle.Contains
    );
    body.input.cursor = 'pointer';
    const gloss = scene.add.nineslice(x, y - h * 0.24, 'btn-tex', 0, w - 16, Math.max(18, h * 0.34), 16, 16, 12, 12)
        .setTint(CONFIG.PASTEL.white).setAlpha(0.16).setDepth(22);
    // v5.0 retro-neon carry-over fix: every fill this helper is ever called
    // with (accent, dangerText, ...) is a BRIGHT neon hue now that v5 flipped
    // the palette, so a dark label reads reliably across all of them - see
    // tests/pastel.test.js for the button-label-vs-fill contrast floors this
    // depends on. If a future fill is ever a genuinely dark surface, that
    // call site needs its own light-label override (none exist today).
    // v5.0 RETRO ARCADE Task 2: Press Start 2P renders far wider than Arial
    // at the same size - base label size dropped 32->24px (still auto-
    // shrunk further below via layout()'s room-based setScale if a specific
    // button's label+icon still don't fit).
    const txt = scene.add.text(x, y, label, {
        fontFamily: CONFIG.FONT, fontSize: '24px', color: Balance.hex(CONFIG.PASTEL.bg)
    }).setOrigin(0.5).setDepth(23);

    const iconSize = Math.min(34, h * 0.48);
    const icon = iconKey
        ? scene.add.image(x, y, iconKey).setDepth(23).setDisplaySize(iconSize, iconSize)
        : null;

    const layout = () => {
        txt.setScale(1);
        const room = w - 30 - (icon ? iconSize + 10 : 0);
        if (txt.width > room) txt.setScale(room / txt.width);
        if (icon) {
            const total = iconSize + 8 + txt.displayWidth;
            icon.setPosition(x - total / 2 + iconSize / 2, y);
            txt.setPosition(x - total / 2 + iconSize + 8 + txt.displayWidth / 2, y);
        }
    };
    layout();

    const parts = [shadow, body, gloss, txt].concat(icon ? [icon] : []);
    let enabled = true;
    body.on('pointerdown', () => {
        if (!enabled) return;
        scene.tweens.add({ targets: parts, scale: 0.95, duration: 60, yoyo: true });
        cb();
    });
    return {
        rect: body, txt,
        setLabel(s) { txt.setText(s); layout(); },
        disable() { enabled = false; parts.forEach(p => p.setAlpha(p === shadow ? 0.25 : 0.4)); },
        enable()  { enabled = true; shadow.setAlpha(0.55); body.setAlpha(1); gloss.setAlpha(0.16); txt.setAlpha(1); if (icon) icon.setAlpha(1); },
        destroyAll() { parts.forEach(p => p.destroy()); }
    };
}

// Small rounded chip with an icon + text (HUD gold, stage pill...).
function makeChip(scene, x, y, w, h, tint, iconKey, text, textColor) {
    const bg = scene.add.nineslice(x, y, 'pill-tex', 0, w, h, 16, 16, 14, 14)
        .setTint(tint).setDepth(10);
    let icon = null;
    let tx = x;
    if (iconKey) {
        icon = scene.add.image(x - w / 2 + h * 0.55, y, iconKey).setDepth(11)
            .setDisplaySize(h * 0.62, h * 0.62);
        tx = x + h * 0.28;
    }
    const label = scene.add.text(tx, y, text, {
        fontFamily: CONFIG.FONT, fontSize: Math.round(h * 0.48) + 'px',
        color: textColor || Balance.hex(CONFIG.PASTEL.ink)
    }).setOrigin(0.5).setDepth(11);
    // v5.0 Task 2 review fix: at 1.0em/char an 8-char label (e.g. "ELECTRIC")
    // grazes the pill edge - clamp to the pill's inner width past the icon.
    const chipRoom = w - (iconKey ? h : 0) - 12;
    fitToWidth(label, chipRoom);
    return {
        setText(s) { label.setText(s); fitToWidth(label, chipRoom); },
        parts: [bg, icon, label].filter(Boolean)
    };
}

// =============================================================================
// Upgrade bar - five refined cards
// =============================================================================
function buildUpgradeBar(scene) {
    const BAR_Y = 1095, BTN_W = 130, BTN_H = 164;
    const gap = (CONFIG.WIDTH - BTN_W * 5) / 6;

    // bar panel
    scene.add.nineslice(CONFIG.WIDTH / 2, BAR_Y + 4, 'btn-tex', 0, CONFIG.WIDTH - 12, 194, 24, 24, 24, 24)
        .setTint(CONFIG.PASTEL.panel).setDepth(9);
    scene.add.rectangle(CONFIG.WIDTH / 2, BAR_Y - 93, CONFIG.WIDTH - 40, 2, CONFIG.PASTEL.inkSoft)
        .setDepth(9);

    const buttons = [];

    CONFIG.UPGRADES.forEach((def, i) => {
        const x = gap + i * (BTN_W + gap) + BTN_W / 2;

        const glow = scene.add.nineslice(x, BAR_Y, 'btn-tex', 0, BTN_W + 10, BTN_H + 10, 24, 24, 24, 24)
            .setTint(def.color).setAlpha(0).setDepth(9);
        const card = scene.add.nineslice(x, BAR_Y, 'btn-tex', 0, BTN_W, BTN_H, 24, 24, 24, 24)
            .setTint(CONFIG.PASTEL.panel).setDepth(10);
        // v6 Task 4: the busiest button in the game (tapped every stage to
        // buy upgrades) - but 5 cards share the 720px bar only ~11.7px
        // apart, so (same reasoning as the shop tab pills) a symmetric pad
        // would let a tap meant for one upgrade buy its neighbor instead -
        // real gold lost to a mis-tap. Vertical-only (+14 top/bottom): the
        // divider line above and the screen edge below are both clear.
        {
            const HIT_PAD = 14;
            card.setInteractive(new Phaser.Geom.Rectangle(0, -HIT_PAD, BTN_W, BTN_H + HIT_PAD * 2), Phaser.Geom.Rectangle.Contains);
            card.input.cursor = 'pointer';
        }
        const icon = scene.add.image(x, BAR_Y - 46, def.icon)
            .setDepth(11).setTint(def.color).setDisplaySize(42, 42);
        // v5.0 Task 2: 13->11 / 21->18 - pixel font headroom in this tight
        // 130px-wide card (name still keeps its explicit clamp below as a
        // second line of defense for long upgrade names).
        const name = scene.add.text(x, BAR_Y - 12, def.name.toUpperCase(), {
            fontFamily: CONFIG.FONT, fontSize: '11px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
        }).setOrigin(0.5).setDepth(11);
        if (name.width > BTN_W - 14) name.setScale((BTN_W - 14) / name.width);

        const lvlBg = scene.add.nineslice(x, BAR_Y + 14, 'pill-tex', 0, 66, 26, 12, 12, 12, 12)
            .setTint(def.color).setAlpha(0.22).setDepth(11);
        const lvl = scene.add.text(x, BAR_Y + 14, '', {
            fontFamily: CONFIG.FONT, fontSize: '14px',
            color: Balance.hex(CONFIG.PASTEL.ink)
        }).setOrigin(0.5).setDepth(12);

        const costIcon = scene.add.image(x - 26, BAR_Y + 50, 'coin-tex')
            .setDepth(11).setDisplaySize(22, 22);
        const cost = scene.add.text(x - 10, BAR_Y + 50, '', {
            fontFamily: CONFIG.FONT, fontSize: '18px',
            color: Balance.hex(CONFIG.PASTEL.goldText)
        }).setOrigin(0, 0.5).setDepth(11);

        const refresh = () => {
            const level = SaveManager.state.upgrades[def.id];
            const maxed = level >= Balance.maxLevel(def.id);
            lvl.setText('Lv.' + level);
            fitToWidth(lvl, 60);
            if (maxed) {
                cost.setText('MAX').setColor(Balance.hex(CONFIG.PASTEL.goodText)).setX(x - 22);
                fitToWidth(cost, 60);
                costIcon.setVisible(false);
                glow.setAlpha(0);
                card.setTint(CONFIG.PASTEL.panel).setAlpha(0.85);
                icon.setAlpha(0.7);
            } else {
                const c = Balance.upgradeCost(def.id, level);
                cost.setText(Balance.fmt(c)).setX(x - 10);
                fitToWidth(cost, 60);
                costIcon.setVisible(true);
                const afford = SaveManager.state.gold >= c;
                cost.setColor(Balance.hex(afford ? CONFIG.PASTEL.goldText : CONFIG.PASTEL.inkSoft));
                glow.setAlpha(afford ? 0.32 : 0);
                card.setTint(afford ? CONFIG.PASTEL.panelLight : CONFIG.PASTEL.panel).setAlpha(1);
                icon.setAlpha(afford ? 1 : 0.55);
            }
        };

        card.on('pointerdown', () => {
            const level = SaveManager.state.upgrades[def.id];
            if (level >= Balance.maxLevel(def.id)) return;
            const c = Balance.upgradeCost(def.id, level);
            if (!SaveManager.spendGold(c)) return;
            SaveManager.state.upgrades[def.id]++;
            SaveManager.persist();
            Feel.coin();
            scene.tweens.add({ targets: [card, icon, lvlBg], scale: 1.1, duration: 90, yoyo: true });
            if (typeof Effects !== 'undefined') Effects.burst(scene, x, BAR_Y - 46, def.color, 6);
            scene.refreshGold(); // emits goldChanged -> all cards refresh
        });

        buttons.push(refresh);
        refresh();
    });

    const refreshAll = () => buttons.forEach(fn => fn());
    scene.events.on('goldChanged', refreshAll);
    scene.events.once('shutdown', () => scene.events.off('goldChanged', refreshAll));
}

// =============================================================================
// Fever gauge strip + AD refill chip
// =============================================================================
function buildFeverGauge(scene) {
    const Y = 996, W = CONFIG.WIDTH - 240, X = 44, H = 16;
    const gfx = scene.add.graphics().setDepth(10);
    scene.add.text(X - 8, Y + H / 2, '🔥', { fontFamily: CONFIG.FONT, fontSize: '20px' })
        .setOrigin(1, 0.5).setDepth(10);

    const chip = makeUiButton(scene, CONFIG.WIDTH - 90, Y + 8, 132, 46, '⚡ AD', CONFIG.PASTEL.accent, () => {
        chip.disable();
        const done = (ok) => {
            if (ok) {
                SaveManager.state.feverGauge = CONFIG.FEVER.gaugeMax;
                scene.events.emit('feverChanged');
                scene.triggerFever();
            }
            redraw();
        };
        if (typeof AdsManager !== 'undefined' && AdsManager.showRewarded) {
            AdsManager.showRewarded('fever_refill').then(done);
        } else {
            done(false);
        }
    });

    const redraw = () => {
        const frac = Phaser.Math.Clamp(SaveManager.state.feverGauge / CONFIG.FEVER.gaugeMax, 0, 1);
        gfx.clear();
        // v4.0 Phase C Task 2: dark ink frame + light panel track, so the
        // fever-colored fill still pops on a gauge - same rail convention as
        // GameScene.drawBossBar().
        gfx.fillStyle(CONFIG.PASTEL.ink, 0.8).fillRoundedRect(X - 2, Y - 2, W + 4, H + 4, 10);
        gfx.fillStyle(CONFIG.PASTEL.panel, 1).fillRoundedRect(X, Y, W, H, 8);
        if (frac > 0.01) {
            const fw = Math.max(10, (W - 4) * frac);
            gfx.fillStyle(CONFIG.COLORS.fever, 1).fillRoundedRect(X + 2, Y + 2, fw, H - 4, 6);
            gfx.fillStyle(CONFIG.PASTEL.white, 0.35).fillRoundedRect(X + 2, Y + 2, fw, (H - 4) * 0.45, 6);
            gfx.fillStyle(CONFIG.PASTEL.white, 0.9).fillCircle(X + 2 + fw, Y + H / 2, 5);
        }
        const showChip = frac < CONFIG.FEVER.adRefillBelow && scene.feverLeft <= 0;
        chip.rect.setVisible(showChip);
        chip.txt.setVisible(showChip);
        chip.rect.input.enabled = showChip;
        if (showChip) chip.enable();
    };

    scene.events.on('feverChanged', redraw);
    scene.events.once('shutdown', () => scene.events.off('feverChanged', redraw));
    redraw();
}

// =============================================================================
// v3.0 Task 9 - the representative-pet ULTIMATE button. Floats bottom-right,
// above the fever bar (it sits over the tail end of the play field, like most
// mobile games' ability buttons do) - grayscale + gauge-dimmed while charging,
// pulsing gold once full, with a one-shot "ULT READY!" toast at 100.
// =============================================================================
function buildUltButton(scene) {
    const x = CONFIG.WIDTH - 76, y = 918, R = 52;

    const glow = scene.add.image(x, y, 'ring-tex').setDepth(15)
        .setTint(CONFIG.PASTEL.gold).setAlpha(0).setDisplaySize(R * 2.3, R * 2.3);
    const body = scene.add.nineslice(x, y, 'btn-tex', 0, R * 2, R * 2, 28, 28, 28, 28)
        .setTint(CONFIG.PASTEL.panel).setAlpha(0.85).setDepth(16);
    // v6 Task 4: this button reads as a circle (heavily-rounded nineslice),
    // so its padded hit area is a Circle, not a Rectangle. Local space here
    // is the same top-left-anchored (0,0)-(2R,2R) box as makeUiButton above,
    // so the button's visual center is local (R,R). A plain radius-(R+PAD)
    // circle centered there would reach PAD=14px past the visual edge on
    // EVERY side - but this button floats only ~11px above the fever-gauge
    // "AD" refill chip below it (buildFeverGauge, y=996..1041 once that chip
    // gets makeUiButton's own +14 pad), and both can be active at once
    // (fever gauge low AND ult ready are independent states). A downward
    // +14 would push the hit circle's bottom edge to 918+66=984, three
    // pixels INTO that chip's padded top edge (967) - a double-tap trap.
    // Fix: shift the circle's center up by PAD instead of growing the
    // radius past R+PAD symmetrically. That keeps the bottom edge exactly
    // at the ORIGINAL unpadded bound (918-14+66 = 918+52 = the old edge),
    // preserving the existing safe gap to the chip, while top/left/right
    // still gain the full +14 of forgiveness (into open play-field space
    // that wireInput() already shadows out of monster-tap resolution below).
    //
    // v6 Task 4 review fix: "the old edge" (970) is NOT actually clear of the
    // chip below - the chip (buildFeverGauge) ALSO got the blanket +14, so
    // its own padded top sits at (Y+8-23)-14 = 967, three px INSIDE this
    // circle's 970 bottom reach. BOTTOM_TRIM pulls the bottom in a further
    // 8px past the old edge (962), clearing the chip's 967 by 5px. This only
    // trims the bottommost sliver of the circle (the part nearest the chip,
    // where a stray tap should arguably go to the chip anyway) - radius
    // stays R+HIT_PAD, so top/left/right keep their full existing reach into
    // open play-field space.
    const HIT_PAD = 14;
    const BOTTOM_TRIM = 8;
    body.setInteractive(new Phaser.Geom.Circle(R, R - HIT_PAD - BOTTOM_TRIM, R + HIT_PAD), Phaser.Geom.Circle.Contains);
    body.input.cursor = 'pointer';
    const icon = scene.add.text(x, y - 8, '⚡', { fontFamily: CONFIG.FONT, fontSize: '38px' }).setOrigin(0.5).setDepth(17);
    const label = scene.add.text(x, y + 30, 'ULT', {
        fontFamily: CONFIG.FONT, fontSize: '15px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
    }).setOrigin(0.5).setDepth(17);

    // wireInput() (game.js) shadows this button out of field-tap resolution -
    // a tap here must never ALSO smoosh whatever monster happens to sit under it.
    scene._ultButtonBody = body;

    let pulsing = false;
    const setPulse = (on) => {
        if (on === pulsing) return;
        pulsing = on;
        scene.tweens.killTweensOf([body, icon, glow]);
        if (on) {
            scene.tweens.add({ targets: [body, icon], scale: 1.1, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            scene.tweens.add({ targets: glow, alpha: 0.6, scale: 1.18, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        } else {
            body.setScale(1); icon.setScale(1); glow.setScale(1).setAlpha(0);
        }
    };

    const redraw = () => {
        const gauge = scene.ultGauge || 0;
        const ready = gauge >= Balance.ULT_MAX;
        const frac = Phaser.Math.Clamp(gauge / Balance.ULT_MAX, 0, 1);
        body.setTint(ready ? CONFIG.PASTEL.gold : CONFIG.PASTEL.panel);
        icon.setAlpha(ready ? 1 : 0.3 + frac * 0.5);
        label.setColor(Balance.hex(ready ? CONFIG.PASTEL.ink : CONFIG.PASTEL.inkSoft));
        setPulse(ready);
        if (ready && !scene._ultReadyToasted) {
            scene._ultReadyToasted = true;
            if (typeof Effects !== 'undefined') {
                Effects.damageText(scene, x, y - R - 16, I18n.t('ult.ready'), Balance.hex(CONFIG.PASTEL.gold), { big: true });
            }
        }
    };

    body.on('pointerdown', () => {
        if ((scene.ultGauge || 0) < Balance.ULT_MAX) return;
        scene.tweens.add({ targets: [body, icon, label], scale: 0.88, duration: 70, yoyo: true });
        scene.castUltimate();
    });

    scene.events.on('ultChanged', redraw);
    scene.events.once('shutdown', () => scene.events.off('ultChanged', redraw));
    redraw();
}

// =============================================================================
// Settlement panel (every 5th stage - or a single REPLAY clear, Task 10)
// =============================================================================
function showSettlement(scene, opts) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const items = [];

    // v4.0 Phase C Task 2: modal dim-scrim - stays near-black regardless of
    // theme (same exception class as the button drop-shadow above).
    items.push(scene.add.rectangle(W / 2, H / 2, W, H, 0x0a0714, 0.78)
        .setDepth(20).setInteractive());
    items.push(scene.add.nineslice(W / 2, H * 0.44, 'btn-tex', 0, 560, 460, 24, 24, 24, 24)
        .setTint(CONFIG.PASTEL.panel).setDepth(20));

    // v3.0 Task 10: a replay settles a SINGLE stage - "STAGES N-N CLEAR!"
    // would read oddly, so it gets its own singular title + a REPLAY badge.
    // v5.0 Task 2: 48->32 - at 48px this title (up to "STAGES 121-125
    // CLEAR!") overran both the 560px panel and the 720px screen in the
    // pixel font; wordWrap added as a second line of defense.
    const title = opts.replay ? `STAGE ${opts.to} CLEAR!` : `STAGES ${opts.from}–${opts.to} CLEAR!`;
    items.push(scene.add.text(W / 2, H * 0.3, title, {
        fontFamily: CONFIG.FONT, fontSize: '32px', color: Balance.hex(CONFIG.PASTEL.goodText), align: 'center', wordWrap: { width: 520 }
    }).setOrigin(0.5).setDepth(21));

    if (opts.replay) {
        items.push(scene.add.nineslice(W / 2, H * 0.35, 'pill-tex', 0, 150, 40, 16, 16, 14, 14)
            .setTint(CONFIG.PASTEL.accent).setDepth(21));
        items.push(scene.add.text(W / 2, H * 0.35, I18n.t('map.replay'), {
            fontFamily: CONFIG.FONT, fontSize: '18px', color: Balance.hex(CONFIG.PASTEL.ink)
        }).setOrigin(0.5).setDepth(22));
    }

    items.push(scene.add.image(W / 2 - 80, H * 0.42, 'coin-tex').setDepth(21).setScale(1.4));
    // v5.0 Task 2: 56->44 - a large formatted gold amount ("+1,234,567") at
    // 56px pushed past the panel's right edge; 44px keeps it clear.
    const goldTxt = scene.add.text(W / 2 - 40, H * 0.42, '+' + Balance.fmt(opts.gold), {
        fontFamily: CONFIG.FONT, fontSize: '44px', color: Balance.hex(CONFIG.PASTEL.goldText)
    }).setOrigin(0, 0.5).setDepth(21);
    items.push(goldTxt);

    const close = () => {
        items.forEach(o => o.destroy());
        adBtn.destroyAll();
        contBtn.destroyAll();
        opts.onContinue();
    };

    // v6 Task 4 review fix: adBtn/contBtn stack with a 120px center-to-center
    // gap at h=92 (half=46 each) -> 28px raw edge gap, exactly canceled by
    // the default +14/+14 pad (0px margin, touching). pad:10 leaves 8px.
    const adBtn = makeUiButton(scene, W / 2, H * 0.53, 480, 92,
        '▶ 2× GOLD (+' + Balance.fmt(opts.gold) + ')', CONFIG.PASTEL.accent, () => {
            adBtn.disable();
            const grant = (ok) => {
                if (ok) {
                    SaveManager.addGold(opts.gold);
                    scene.refreshGold();
                    goldTxt.setText('+' + Balance.fmt(opts.gold * 2));
                    Feel.coin();
                    if (typeof Effects !== 'undefined') {
                        Effects.coinPop(scene, W / 2, H * 0.53, 8, { x: W - 80, y: 64 });
                    }
                } else {
                    adBtn.enable();
                }
            };
            if (typeof AdsManager !== 'undefined' && AdsManager.showRewarded) {
                AdsManager.showRewarded('double_gold').then(grant);
            } else {
                grant(false);
            }
        }, undefined, { pad: 10 });

    const contBtn = makeUiButton(scene, W / 2, H * 0.53 + 120, 480, 92,
        'CONTINUE', CONFIG.PASTEL.accent, close, undefined, { pad: 10 });
}

// =============================================================================
// MenuScene
// =============================================================================

// v6 Task 10: the "yard" band pets roam in on the menu - the open strip of
// background between the SMOOSH! logo and the button stack below. The nav
// buttons tile almost edge-to-edge across the rest of the screen (see the
// coordinate table in the Task 10 report), so this band is the one place a
// wandering pet is reliably ON SCREEN; if it strays elsewhere it just
// renders behind whatever button/HUD text is there (depth 4 vs. buttons'
// depth 21-23 and HUD text's depth 10 - see buildMenuYard/buildMenuPets).
const MENU_YARD = { x: 50, y: 175, w: 620, h: 420 };
const MENU_PET_CAP = 6;
const MENU_PET_SIZE = 58;

class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
        const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;

        // Banner lives ONLY on the menu - never during play.
        if (typeof AdsManager !== 'undefined') {
            AdsManager.showBanner();
            this.events.once('shutdown', () => AdsManager.hideBanner());
        }

        // v6 Task 10: cozy nest-yard backdrop (ground + ambient blobs + a
        // couple of props + floating sparkles), all depth 0-2 - strictly
        // behind the logo/HUD text (depth 10, below) and the nav buttons
        // (depth 21-23, makeUiButton) so it never competes for legibility
        // or steals a tap. See buildMenuYard()/task-10-report.md.
        this.buildMenuYard();

        // v5.0 Task 2: 110->92 - headroom for the wider pixel-font glyphs
        // (still comfortably clears the 720px screen width; also reads
        // cleaner as a chunky arcade marquee at this size than blown up).
        const logo = this.add.text(W / 2, H * 0.2, 'SMOOSH!', {
            fontFamily: CONFIG.FONT, fontSize: '92px', color: Balance.hex(CONFIG.PASTEL.good), stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 12
        }).setOrigin(0.5).setDepth(10);
        this.tweens.add({
            targets: logo, scaleX: 1.06, scaleY: 0.94, duration: 700,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // v6 Task 10: the player's OWN pets frolicking in the yard - replaces
        // the old 3 static "lovey/blob/hoppy" jellies. See buildMenuPets()/
        // update() below for the idle AI (a light reuse of NestAI).
        this.buildMenuPets();

        const st = SaveManager.state;
        // v5.0 Task 2: 28->20 - this line has no panel/wordWrap and can get
        // long (large bestStage + abbreviated kill count); 20px keeps the
        // worst case clear of the 720px screen edges in the wider pixel font.
        // v5.0 Task 2 review fix: wordWrap so a large bestStage + kill count
        // (both unbounded - infinite stages, lifetime kills) can never run
        // off the 720px screen edges instead of relying on font-size alone.
        this.add.text(W / 2, H * 0.49,
            'BEST STAGE ' + st.bestStage + '   ·   ' + Balance.fmt(st.totalKills) + ' SMOOSHED', {
            fontFamily: CONFIG.FONT, fontSize: '20px', color: Balance.hex(CONFIG.PASTEL.inkSoft),
            align: 'center', wordWrap: { width: 680 }
        }).setOrigin(0.5).setDepth(10);

        // v4.0 Phase C Task 2: every generic CTA on this menu (nav buttons +
        // the main PLAY button) is now the single pastel accent - role-based
        // mapping ("buttons/accents -> accent"), not per-button hue variety.
        makeUiButton(this, W / 2, H * 0.58, 520, 116,
            'SMOOSH!  (STAGE ' + st.stage + ')', CONFIG.PASTEL.accent,
            () => SmooshGame.goto('GameScene'));

        // v6 Task 4 review fix: SHOP/MAP/BATTLE centers sit 235px apart at
        // w=220 (half=110) -> 15px raw horizontal gap, which the default
        // +14/+14 pad turns into a 13px OVERLAP (wrong nav button eats the
        // tap near the boundary). pad:6 leaves 3px. This row's 140px vertical
        // offset from PLAY (h=116/96 halves) keeps a comfortable margin
        // against the default-padded PLAY button above, so PLAY is untouched.
        makeUiButton(this, W / 2 - 235, H * 0.58 + 140, 220, 96, '🛒 SHOP', CONFIG.PASTEL.accent,
            () => SmooshGame.goto('ShopScene'), undefined, { pad: 6 });
        // v3.0 Task 10: MAP nav button, alongside SHOP/BATTLE (map-pin emoji -
        // no dedicated procedural texture exists, matching this row's existing
        // emoji-prefixed-label convention rather than adding a new icon asset).
        makeUiButton(this, W / 2, H * 0.58 + 140, 220, 96, '📍 ' + I18n.t('map.navButton'), CONFIG.PASTEL.accent,
            () => SmooshGame.goto('StageMapScene'), undefined, { pad: 6 });
        makeUiButton(this, W / 2 + 235, H * 0.58 + 140, 220, 96, '⚔ BATTLE', CONFIG.PASTEL.accent,
            () => SmooshGame.goto('PvpScene'), undefined, { pad: 6 });
        // v3.0 Task 11: DEX nav button, own row below SHOP/MAP/BATTLE (no
        // room left in that row - all 720px of width is already spoken for).
        // v3.5 Task 4: NEST joins DEX on this row (egg emoji - no dedicated
        // procedural texture, matching this row's emoji-prefixed convention).
        // v6 Task 4 review fix: this row sits only 22px (raw) below the
        // SHOP/MAP/BATTLE row (h=96 vs h=84 halves) -> default pad turns that
        // into a 6px overlap band. Matching pad:6 here (same as the row
        // above) restores a 10px vertical margin; this row's own DEX-NEST
        // horizontal gap (40px raw) stays comfortably clear at pad:6 too.
        makeUiButton(this, W / 2 - 160, H * 0.58 + 252, 280, 84, '📖 ' + I18n.t('dex.title'), CONFIG.PASTEL.accent,
            () => SmooshGame.goto('DexScene'), undefined, { pad: 6 });
        makeUiButton(this, W / 2 + 160, H * 0.58 + 252, 280, 84, '🥚 ' + I18n.t('nest.title'), CONFIG.PASTEL.accent,
            () => SmooshGame.goto('NestScene'), undefined, { pad: 6 });
        // v3.5 Task 5: FRIENDS nav button, own row below DEX/NEST - players
        // list + friend requests + gift inbox (offline-first, degrades to a
        // single "offline" card + retry until Social.ready flips true).
        makeUiButton(this, W / 2, H * 0.58 + 364, 320, 84, '👥 ' + I18n.t('social.title'), CONFIG.PASTEL.accent,
            () => SmooshGame.goto('FriendsScene'));

        // wallet
        this.add.image(W / 2 - 110, H * 0.53, 'coin-tex').setDisplaySize(26, 26).setDepth(10);
        this.add.text(W / 2 - 90, H * 0.53, Balance.fmt(st.gold), {
            fontFamily: CONFIG.FONT, fontSize: '24px', color: Balance.hex(CONFIG.PASTEL.goldText)
        }).setOrigin(0, 0.5).setDepth(10);
        this.add.image(W / 2 + 40, H * 0.53, 'gem-tex').setDisplaySize(24, 24).setDepth(10);
        // gems are the premium currency - accent (violet) keeps them visually
        // distinct from gold at a glance.
        this.add.text(W / 2 + 60, H * 0.53, Balance.fmt(st.gems), {
            fontFamily: CONFIG.FONT, fontSize: '24px', color: Balance.hex(CONFIG.PASTEL.accent)
        }).setOrigin(0, 0.5).setDepth(10);

        // sound toggle
        const soundLabel = () => st.muted ? 'SOUND OFF' : 'SOUND ON';
        const toggle = this.add.text(W - 36, 52, soundLabel(), {
            fontFamily: CONFIG.FONT, fontSize: '26px', color: Balance.hex(st.muted ? CONFIG.PASTEL.inkSoft : CONFIG.PASTEL.goodText)
        }).setOrigin(1, 0.5).setDepth(10).setInteractive({ useHandCursor: true });
        toggle.on('pointerdown', () => {
            st.muted = !st.muted;
            SaveManager.persist();
            Sfx.setMuted(st.muted);
            toggle.setText(soundLabel());
            toggle.setColor(Balance.hex(st.muted ? CONFIG.PASTEL.inkSoft : CONFIG.PASTEL.goodText));
        });

        // reset progress (tap twice to confirm)
        let armed = false;
        const reset = this.add.text(W / 2, H - 100, 'RESET PROGRESS', {
            fontFamily: CONFIG.FONT, fontSize: '22px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
        }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
        reset.on('pointerdown', () => {
            if (!armed) {
                armed = true;
                reset.setText('TAP AGAIN TO CONFIRM RESET').setColor(Balance.hex(CONFIG.PASTEL.danger));
                this.time.delayedCall(2500, () => {
                    armed = false;
                    if (reset.active) reset.setText('RESET PROGRESS').setColor(Balance.hex(CONFIG.PASTEL.inkSoft));
                });
            } else {
                SaveManager.reset();
                this.scene.restart();
            }
        });
    }

    // -------------------------------------------------------------------
    // v6 Task 10: cozy nest-yard backdrop - ground + ambient blobs + a
    // couple of props + gentle floating sparkles. Everything here is depth
    // 0-2, strictly below the pets (depth 3-5), the HUD text (depth 10,
    // create() above) and the nav buttons (depth 21-23, makeUiButton).
    // -------------------------------------------------------------------
    buildMenuYard() {
        const W = CONFIG.WIDTH;

        // ambient blobs - same "one notch deeper than page bg" convention
        // every other scene's backdrop uses (nestscene.js, game.js field).
        for (const [bx, by, br] of [[100, 200, 130], [640, 420, 90],
            [140, 900, 110], [600, 1050, 140]]) {
            this.add.circle(bx, by, br, CONFIG.PASTEL.bgField).setDepth(0);
        }

        // yard ground tile - same bordered-panel look nestscene.js uses for
        // its own pet roam box, so the pet band reads as an intentional
        // "cozy corner" rather than empty space between the logo and the
        // button stack (see the MENU_YARD comment above for why this exact
        // band is the one place a wandering pet is reliably visible).
        this.add.rectangle(MENU_YARD.x + MENU_YARD.w / 2, MENU_YARD.y + MENU_YARD.h / 2,
            MENU_YARD.w, MENU_YARD.h, CONFIG.PASTEL.bgField)
            .setStrokeStyle(2, CONFIG.PASTEL.ink).setAlpha(0.55).setDepth(0);

        // a couple of cozy props: the player's OWN placed nest decor if they
        // have any (Task 3 my-nest edit mode, nestscene.js) so the menu
        // reflects THEIR home, else two generic primitives (a rug + a
        // plant, colored to match the actual rug_stripe/plant_pot decor
        // items in decor.js) that don't imply ownership of anything.
        const spots = [
            { x: MENU_YARD.x + 90, y: MENU_YARD.y + MENU_YARD.h - 44 },
            { x: W / 2, y: MENU_YARD.y + 40 },
            { x: MENU_YARD.x + MENU_YARD.w - 90, y: MENU_YARD.y + MENU_YARD.h - 44 }
        ];
        const placed = SaveManager.state.decorPlaced || [];
        if (placed.length && typeof Decor !== 'undefined') {
            const sample = Phaser.Utils.Array.Shuffle(placed.slice()).slice(0, 3);
            sample.forEach((p, i) => {
                if (!Decor.byId(p.id)) return;
                this.add.image(spots[i].x, spots[i].y, 'decor-' + p.id)
                    .setDisplaySize(52, 52).setAlpha(0.92).setDepth(1);
            });
        } else {
            // default rug (rug_stripe's cream tone, decor.js)
            this.add.nineslice(spots[0].x, spots[0].y, 'btn-tex', 0, 130, 44, 20, 20, 20, 20)
                .setTint(0xffe0b8).setAlpha(0.35).setDepth(1);
            // default plant (plant_pot's trunk/canopy tones, decor.js)
            this.add.rectangle(spots[2].x, spots[2].y + 14, 10, 26, 0xc9a06a).setDepth(1);
            this.add.circle(spots[2].x, spots[2].y - 6, 22, 0x7dffb2).setAlpha(0.85).setDepth(1);
            this.add.circle(spots[2].x - 14, spots[2].y + 4, 14, 0x7dffb2).setAlpha(0.7).setDepth(1);
        }

        // gentle floating sparkles - purely tween-driven ambient motion, no
        // per-frame update() cost.
        for (let i = 0; i < 8; i++) {
            const tint = i % 2 === 0 ? CONFIG.PASTEL.gold : CONFIG.PASTEL.accent;
            const s = this.add.image(Phaser.Math.Between(40, W - 40), Phaser.Math.Between(600, 1180), 'spark-tex')
                .setDepth(2).setTint(tint).setScale(Phaser.Math.FloatBetween(0.4, 0.9)).setAlpha(0);
            this.tweens.add({
                targets: s, y: '-=140', alpha: { from: 0, to: 0.75 },
                duration: Phaser.Math.Between(2600, 4200), delay: Phaser.Math.Between(0, 3000),
                ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
                onRepeat: () => s.setPosition(Phaser.Math.Between(40, W - 40), Phaser.Math.Between(600, 1180))
            });
        }
    }

    // -------------------------------------------------------------------
    // v6 Task 10: the player's own pets, frolicking. Idle AI is a light
    // reuse of NestAI's pure transition table (nestscene.js) - calling it
    // with hasToys=false/hasFurniture=undefined (the menu has no placed
    // toys/furniture) naturally collapses its state machine down to just
    // wander/chase/nap, which IS the "wander + bob + occasional hop" idle
    // this task calls for, without needing a second idle implementation.
    // -------------------------------------------------------------------
    buildMenuPets() {
        // 0-pet guard: every save gets the starter pet (save.js init()), so
        // this fallback should never actually fire - but a menu with zero
        // pets would look broken, so show one default anyway.
        const owned = (SaveManager.state.pets && SaveManager.state.pets.length)
            ? SaveManager.state.pets
            : [{ species: (typeof PET_SPECIES !== 'undefined' && PET_SPECIES[0]) ? PET_SPECIES[0].id : 'cat' }];
        // v6 Task 10: cap shown pets (perf + a legible, uncluttered yard) and
        // shuffle so which ones show up varies menu-visit to menu-visit.
        const sample = Phaser.Utils.Array.Shuffle(owned.slice()).slice(0, Math.min(MENU_PET_CAP, owned.length));
        this.menuPets = sample.map(p => this.spawnMenuPet(p.species));
    }

    spawnMenuPet(speciesId) {
        const def = (typeof PET_SPECIES !== 'undefined') ? PET_SPECIES.find(p => p.id === speciesId) : null;
        const key = 'pet-' + (def ? def.id : speciesId);
        const x = Phaser.Math.Between(MENU_YARD.x + 40, MENU_YARD.x + MENU_YARD.w - 40);
        const y = Phaser.Math.Between(MENU_YARD.y + 40, MENU_YARD.y + MENU_YARD.h - 40);
        // non-interactive by design (v6 Task 10 review: an interactive pet
        // sitting UNDER a nav button is harmless under Phaser's default
        // topOnly input routing, since only the topmost - the button body,
        // depth 21 - actually receives the event, but skipping interactivity
        // entirely removes even the possibility of a regression here).
        const shadow = this.add.ellipse(x, y + MENU_PET_SIZE * 0.42, MENU_PET_SIZE * 0.8, MENU_PET_SIZE * 0.26, 0x000000, 0.22).setDepth(3);
        const sprite = this.add.image(x, y, key).setDisplaySize(MENU_PET_SIZE, MENU_PET_SIZE).setDepth(4);
        const badge = this.add.text(x, y - MENU_PET_SIZE * 0.72, '', {
            fontFamily: CONFIG.FONT, fontSize: '16px'
        }).setOrigin(0.5).setDepth(5);
        const agent = {
            sprite, shadow, badge, x, y, tx: x, ty: y,
            baseScale: sprite.scaleX,
            state: 'wander', stateT: NestAI.dwell(Math.random),
            chaseTarget: null, bobPhase: Math.random() * Math.PI * 2,
            hopT: Phaser.Math.FloatBetween(2.5, 5)
        };
        this.pickMenuWanderTarget(agent);
        return agent;
    }

    pickMenuWanderTarget(a) {
        a.tx = Phaser.Math.Between(MENU_YARD.x + 40, MENU_YARD.x + MENU_YARD.w - 40);
        a.ty = Phaser.Math.Between(MENU_YARD.y + 40, MENU_YARD.y + MENU_YARD.h - 40);
    }

    // Returns true once within arrival radius of (tx,ty). Moves the agent's
    // LOGICAL x/y (a.x/a.y) only - update() layers a bob offset on top of
    // this for the displayed sprite position, so movement and bob never
    // fight over the same field (same split nestscene.js doesn't need
    // because it has no bob - this menu's lighter idle adds one).
    moveMenuPet(a, tx, ty, speed, dt) {
        const dx = tx - a.x, dy = ty - a.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) return true;
        const step = Math.min(dist, speed * dt);
        a.x += (dx / dist) * step;
        a.y += (dy / dist) * step;
        if (Math.abs(dx) > 2) a.sprite.flipX = dx < 0;
        return false;
    }

    update(time, delta) {
        if (!this.menuPets || !this.menuPets.length) return;
        const dt = Math.min(0.05, delta / 1000);
        for (const a of this.menuPets) {
            a.stateT -= dt;
            if (a.stateT <= 0) {
                a.state = NestAI.nextState(a.state, Math.random, false, undefined);
                a.stateT = NestAI.dwell(Math.random);
                a.sprite.setScale(a.baseScale); // undo any in-flight hop tween drift
                if (a.state === 'wander') {
                    this.pickMenuWanderTarget(a);
                } else if (a.state === 'chase') {
                    const others = this.menuPets.filter(o => o !== a);
                    a.chaseTarget = others.length ? Phaser.Utils.Array.GetRandom(others) : null;
                    if (!a.chaseTarget) { a.state = 'wander'; this.pickMenuWanderTarget(a); }
                }
            }

            if (a.state === 'wander') {
                this.moveMenuPet(a, a.tx, a.ty, 46, dt);
            } else if (a.state === 'chase' && a.chaseTarget) {
                this.moveMenuPet(a, a.chaseTarget.x, a.chaseTarget.y, 70, dt);
            }

            if (a.state !== 'nap') {
                // occasional hop/react flourish - a quick squash-stretch
                // punch, independent of movement/bob.
                a.hopT -= dt;
                if (a.hopT <= 0) {
                    a.hopT = Phaser.Math.FloatBetween(3, 6);
                    this.tweens.add({
                        targets: a.sprite, scaleX: a.baseScale * 0.82, scaleY: a.baseScale * 1.18,
                        duration: 110, yoyo: true, ease: 'Quad.easeOut'
                    });
                }
                a.sprite.setAlpha(1);
                a.sprite.y = a.y + Math.sin(time / 260 + a.bobPhase) * 4; // gentle bob while active
                a.badge.setText('');
            } else {
                a.sprite.setAlpha(0.6);
                a.sprite.y = a.y;
                a.sprite.setScale(a.baseScale * (1 + Math.sin(time / 500 + a.bobPhase) * 0.03)); // slow "breathing"
                a.badge.setText('💤').setAlpha(0.6 + 0.4 * Math.sin(time / 400 + a.bobPhase));
            }
            a.sprite.x = a.x;
            a.shadow.setPosition(a.x, a.y + MENU_PET_SIZE * 0.42);
            a.badge.setPosition(a.x, a.sprite.y - MENU_PET_SIZE * 0.72);
        }
    }
}
