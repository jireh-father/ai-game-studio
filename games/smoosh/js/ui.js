// =============================================================================
// SMOOSH! - ui.js  (v1.1 refined interface)
// Rounded NineSlice buttons with drop shadows, upgrade CARDS with custom
// drawn icons + affordability glow, chips/pills for HUD numbers.
// Banner ads live ONLY on MenuScene.
// =============================================================================

// Rounded button: shadow + body + gloss + passive label.
// The body is the ONLY interactive object.
// iconKey (optional): a texture (e.g. 'coin-tex'/'gem-tex') rendered before
// the label - use this instead of emoji so currency looks identical on
// every device font.
function makeUiButton(scene, x, y, w, h, label, color, cb, iconKey) {
    // v4.0 Phase C Task 2: this drop shadow stays near-black on purpose - a
    // raised button needs a dark contact shadow regardless of theme (same
    // exception class as the settlement/nest-broken dim scrims below).
    const shadow = scene.add.nineslice(x, y + 5, 'btn-tex', 0, w, h, 24, 24, 24, 24)
        .setTint(0x0a0714).setAlpha(0.55).setDepth(21);
    const body = scene.add.nineslice(x, y, 'btn-tex', 0, w, h, 24, 24, 24, 24)
        .setTint(color).setDepth(21)
        .setInteractive({ useHandCursor: true });
    const gloss = scene.add.nineslice(x, y - h * 0.24, 'btn-tex', 0, w - 16, Math.max(18, h * 0.34), 16, 16, 12, 12)
        .setTint(CONFIG.PASTEL.white).setAlpha(0.16).setDepth(22);
    const txt = scene.add.text(x, y, label, {
        fontFamily: 'Arial, sans-serif', fontSize: '32px', fontStyle: 'bold',
        color: Balance.hex(CONFIG.PASTEL.white)
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
        fontFamily: 'Arial, sans-serif', fontSize: Math.round(h * 0.48) + 'px',
        fontStyle: 'bold', color: textColor || Balance.hex(CONFIG.PASTEL.ink)
    }).setOrigin(0.5).setDepth(11);
    return {
        setText(s) { label.setText(s); },
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
            .setTint(CONFIG.PASTEL.panel).setDepth(10)
            .setInteractive({ useHandCursor: true });
        const icon = scene.add.image(x, BAR_Y - 46, def.icon)
            .setDepth(11).setTint(def.color).setDisplaySize(42, 42);
        const name = scene.add.text(x, BAR_Y - 12, def.name.toUpperCase(), {
            fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold',
            color: Balance.hex(CONFIG.PASTEL.inkSoft)
        }).setOrigin(0.5).setDepth(11);
        if (name.width > BTN_W - 14) name.setScale((BTN_W - 14) / name.width);

        const lvlBg = scene.add.nineslice(x, BAR_Y + 14, 'pill-tex', 0, 66, 26, 12, 12, 12, 12)
            .setTint(def.color).setAlpha(0.22).setDepth(11);
        const lvl = scene.add.text(x, BAR_Y + 14, '', {
            fontFamily: 'Arial, sans-serif', fontSize: '16px', fontStyle: 'bold',
            color: Balance.hex(CONFIG.PASTEL.ink)
        }).setOrigin(0.5).setDepth(12);

        const costIcon = scene.add.image(x - 26, BAR_Y + 50, 'coin-tex')
            .setDepth(11).setDisplaySize(22, 22);
        const cost = scene.add.text(x - 10, BAR_Y + 50, '', {
            fontFamily: 'Arial, sans-serif', fontSize: '21px', fontStyle: 'bold',
            color: Balance.hex(CONFIG.PASTEL.goldText)
        }).setOrigin(0, 0.5).setDepth(11);

        const refresh = () => {
            const level = SaveManager.state.upgrades[def.id];
            const maxed = level >= Balance.maxLevel(def.id);
            lvl.setText('Lv.' + level);
            if (maxed) {
                cost.setText('MAX').setColor(Balance.hex(CONFIG.PASTEL.goodText)).setX(x - 22);
                costIcon.setVisible(false);
                glow.setAlpha(0);
                card.setTint(CONFIG.PASTEL.panel).setAlpha(0.85);
                icon.setAlpha(0.7);
            } else {
                const c = Balance.upgradeCost(def.id, level);
                cost.setText(Balance.fmt(c)).setX(x - 10);
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
    scene.add.text(X - 8, Y + H / 2, '🔥', { fontSize: '20px' })
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
        .setTint(CONFIG.PASTEL.panel).setAlpha(0.85).setDepth(16).setInteractive({ useHandCursor: true });
    const icon = scene.add.text(x, y - 8, '⚡', { fontSize: '38px' }).setOrigin(0.5).setDepth(17);
    const label = scene.add.text(x, y + 30, 'ULT', {
        fontFamily: 'Arial, sans-serif', fontSize: '15px', fontStyle: 'bold', color: Balance.hex(CONFIG.PASTEL.inkSoft)
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
    const title = opts.replay ? `STAGE ${opts.to} CLEAR!` : `STAGES ${opts.from}–${opts.to} CLEAR!`;
    items.push(scene.add.text(W / 2, H * 0.3, title, {
        fontFamily: 'Arial, sans-serif', fontSize: '48px', fontStyle: 'bold',
        color: Balance.hex(CONFIG.PASTEL.goodText)
    }).setOrigin(0.5).setDepth(21));

    if (opts.replay) {
        items.push(scene.add.nineslice(W / 2, H * 0.35, 'pill-tex', 0, 150, 40, 16, 16, 14, 14)
            .setTint(CONFIG.PASTEL.accent).setDepth(21));
        items.push(scene.add.text(W / 2, H * 0.35, I18n.t('map.replay'), {
            fontFamily: 'Arial, sans-serif', fontSize: '22px', fontStyle: 'bold', color: Balance.hex(CONFIG.PASTEL.ink)
        }).setOrigin(0.5).setDepth(22));
    }

    items.push(scene.add.image(W / 2 - 80, H * 0.42, 'coin-tex').setDepth(21).setScale(1.4));
    const goldTxt = scene.add.text(W / 2 - 40, H * 0.42, '+' + Balance.fmt(opts.gold), {
        fontFamily: 'Arial, sans-serif', fontSize: '56px', fontStyle: 'bold',
        color: Balance.hex(CONFIG.PASTEL.goldText)
    }).setOrigin(0, 0.5).setDepth(21);
    items.push(goldTxt);

    const close = () => {
        items.forEach(o => o.destroy());
        adBtn.destroyAll();
        contBtn.destroyAll();
        opts.onContinue();
    };

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
        });

    const contBtn = makeUiButton(scene, W / 2, H * 0.53 + 120, 480, 92,
        'CONTINUE', CONFIG.PASTEL.accent, close);
}

// =============================================================================
// MenuScene
// =============================================================================
class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
        const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;

        // Banner lives ONLY on the menu - never during play.
        if (typeof AdsManager !== 'undefined') {
            AdsManager.showBanner();
            this.events.once('shutdown', () => AdsManager.hideBanner());
        }

        // soft decorative blobs - one notch deeper than the page bg, like the
        // monster-field backdrop (bgField).
        for (const [bx, by, br] of [[100, 200, 130], [640, 420, 90],
            [140, 900, 110], [600, 1050, 140]]) {
            this.add.circle(bx, by, br, CONFIG.PASTEL.bgField);
        }

        const logo = this.add.text(W / 2, H * 0.2, 'SMOOSH!', {
            fontFamily: 'Arial, sans-serif', fontSize: '110px', fontStyle: 'bold',
            color: Balance.hex(CONFIG.PASTEL.good), stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 12
        }).setOrigin(0.5);
        this.tweens.add({
            targets: logo, scaleX: 1.06, scaleY: 0.94, duration: 700,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // mascot parade: three jellies bobbing under the logo
        for (const [i, id] of [[0, 'lovey'], [1, 'blob'], [2, 'hoppy']].values()) {
            const m = this.add.image(W / 2 + (i - 1) * 150, H * 0.37, 'sp-' + id + '-idle')
                .setDisplaySize(i === 1 ? 150 : 110, i === 1 ? 150 : 110);
            this.tweens.add({
                targets: m, y: H * 0.37 + 14, duration: 700 + i * 130,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }

        const st = SaveManager.state;
        this.add.text(W / 2, H * 0.49,
            'BEST STAGE ' + st.bestStage + '   ·   ' + Balance.fmt(st.totalKills) + ' SMOOSHED', {
            fontFamily: 'Arial, sans-serif', fontSize: '28px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
        }).setOrigin(0.5);

        // v4.0 Phase C Task 2: every generic CTA on this menu (nav buttons +
        // the main PLAY button) is now the single pastel accent - role-based
        // mapping ("buttons/accents -> accent"), not per-button hue variety.
        makeUiButton(this, W / 2, H * 0.58, 520, 116,
            'SMOOSH!  (STAGE ' + st.stage + ')', CONFIG.PASTEL.accent,
            () => SmooshGame.goto('GameScene'));

        makeUiButton(this, W / 2 - 235, H * 0.58 + 140, 220, 96, '🛒 SHOP', CONFIG.PASTEL.accent,
            () => SmooshGame.goto('ShopScene'));
        // v3.0 Task 10: MAP nav button, alongside SHOP/BATTLE (map-pin emoji -
        // no dedicated procedural texture exists, matching this row's existing
        // emoji-prefixed-label convention rather than adding a new icon asset).
        makeUiButton(this, W / 2, H * 0.58 + 140, 220, 96, '📍 ' + I18n.t('map.navButton'), CONFIG.PASTEL.accent,
            () => SmooshGame.goto('StageMapScene'));
        makeUiButton(this, W / 2 + 235, H * 0.58 + 140, 220, 96, '⚔ BATTLE', CONFIG.PASTEL.accent,
            () => SmooshGame.goto('PvpScene'));
        // v3.0 Task 11: DEX nav button, own row below SHOP/MAP/BATTLE (no
        // room left in that row - all 720px of width is already spoken for).
        // v3.5 Task 4: NEST joins DEX on this row (egg emoji - no dedicated
        // procedural texture, matching this row's emoji-prefixed convention).
        makeUiButton(this, W / 2 - 160, H * 0.58 + 252, 280, 84, '📖 ' + I18n.t('dex.title'), CONFIG.PASTEL.accent,
            () => SmooshGame.goto('DexScene'));
        makeUiButton(this, W / 2 + 160, H * 0.58 + 252, 280, 84, '🥚 ' + I18n.t('nest.title'), CONFIG.PASTEL.accent,
            () => SmooshGame.goto('NestScene'));
        // v3.5 Task 5: FRIENDS nav button, own row below DEX/NEST - players
        // list + friend requests + gift inbox (offline-first, degrades to a
        // single "offline" card + retry until Social.ready flips true).
        makeUiButton(this, W / 2, H * 0.58 + 364, 320, 84, '👥 ' + I18n.t('social.title'), CONFIG.PASTEL.accent,
            () => SmooshGame.goto('FriendsScene'));

        // wallet
        this.add.image(W / 2 - 110, H * 0.53, 'coin-tex').setDisplaySize(26, 26);
        this.add.text(W / 2 - 90, H * 0.53, Balance.fmt(st.gold), {
            fontFamily: 'Arial, sans-serif', fontSize: '24px', fontStyle: 'bold', color: Balance.hex(CONFIG.PASTEL.goldText)
        }).setOrigin(0, 0.5);
        this.add.image(W / 2 + 40, H * 0.53, 'gem-tex').setDisplaySize(24, 24);
        // gems are the premium currency - accent (violet) keeps them visually
        // distinct from gold at a glance.
        this.add.text(W / 2 + 60, H * 0.53, Balance.fmt(st.gems), {
            fontFamily: 'Arial, sans-serif', fontSize: '24px', fontStyle: 'bold', color: Balance.hex(CONFIG.PASTEL.accent)
        }).setOrigin(0, 0.5);

        // sound toggle
        const soundLabel = () => st.muted ? 'SOUND OFF' : 'SOUND ON';
        const toggle = this.add.text(W - 36, 52, soundLabel(), {
            fontFamily: 'Arial, sans-serif', fontSize: '26px', fontStyle: 'bold',
            color: Balance.hex(st.muted ? CONFIG.PASTEL.inkSoft : CONFIG.PASTEL.goodText)
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
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
            fontFamily: 'Arial, sans-serif', fontSize: '22px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
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
}
