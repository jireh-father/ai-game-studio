// =============================================================================
// SMOOSH! - bonus.js
// v7 T11 - "PAYDAY SMASH": the post-boss-clear bonus stage.
//
// BonusStage.run(scene, opts) replaces the plain gold-recap settlement
// (ui.js showSettlement) after a BOSS-stage clear only (game.js
// afterStageClear branches on this.isBossStage - see that file's own
// comment). Flow:
//   1. A giant golden "piñata jelly" drops into the field. Player taps it
//      for CONFIG.BONUS.durationMs (14s) - every tap is a guaranteed hit
//      (no crit/splash math), just juice + a mash-meter kick.
//   2. FAILURE-PROOF: a repeating timer fills the meter to 100% on its own
//      by the deadline regardless of taps - mashing only gets there FASTER
//      (and banks a bigger mashFraction), it can never end in a "loss".
//   3. At 100% ("SMASHED!"): a staged reveal - gold count-up, then gems,
//      then ONE free gem-egg pull (Gacha.roll on the REAL CONFIG.GACHA.
//      gemRates table - never a boosted one, see config.js CONFIG.BONUS's
//      comment) - each credited to the REAL save (SaveManager/real pet
//      collection), same as any other in-run reward.
//   4. CONTINUE -> scene.startStage(SaveManager.state.stage, {nestMode:
//      'carry'}), exactly the same nest-carry continuation the normal
//      settlement path already uses (v7 T5).
//
// Deliberately self-contained (no Monster/Spawner/wave-engine coupling, no
// refactor of shop.js's playReveal() - that ceremony had a fragile freeze
// bug, fixed in commit 3198146 via killTweensOf()/no held-ref .remove()).
// Every tween/timer this file creates follows that same safe pattern: tap-
// feedback tweens are fire-and-forget on live objects (effects.js
// convention), the mash timer is a plain Phaser TimerEvent (`.remove()` on
// a TimerEvent has none of that Tween-parent race), and the one-time
// reward-reveal overlay is torn down with `scene.tweens.killTweensOf(overlay)`
// + `.destroy()` on each tracked object - never a held-ref Tween `.remove()`.
// =============================================================================

const BonusStage = {

    // Presentation-only tuning (not part of the reward-formula contract that
    // tests/bonus.test.js owns) - how fast a tap visibly kicks the meter, and
    // how many taps within the window earn the full mashFraction=1 bonus.
    TAP_METER_KICK: 0.028,
    MAX_BONUS_TAPS: 40,

    run(scene, opts) {
        opts = opts || {};
        const stage = opts.stage != null ? opts.stage : scene.stageNum;

        // Safety valve: CONFIG.BONUS.enabled=false skips straight to the next
        // stage, exactly like a pre-T11 boss clear (no bonus, no crash).
        if (!CONFIG.BONUS || !CONFIG.BONUS.enabled) {
            scene.startStage(SaveManager.state.stage, { nestMode: 'carry' });
            return;
        }

        const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
        const cx = CONFIG.FIELD.x + CONFIG.FIELD.w / 2;
        const cy = CONFIG.FIELD.y + CONFIG.FIELD.h * 0.38;
        const R = 118;

        let tapCount = 0;
        let meter = 0;
        let finished = false;
        const startTime = scene.time.now;
        const baseZoom = scene.cameras.main.zoom;

        // v7 T11: a subtle zoom-in reads as "look here" without the violence
        // of a full combat camera shake (persona 3's "festive, not combat-y"
        // tone note from the ideation doc).
        scene.tweens.add({ targets: scene.cameras.main, zoom: baseZoom * 1.08, duration: 420, ease: 'Quad.easeOut' });

        const banner = scene.add.text(W / 2, H * 0.14, 'PAYDAY!', {
            fontFamily: CONFIG.FONT, fontSize: '48px', color: Balance.hex(CONFIG.PASTEL.gold),
            stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 9
        }).setOrigin(0.5).setDepth(20).setScale(0.2);
        scene.tweens.add({ targets: banner, scale: 1, duration: 260, ease: 'Back.easeOut' });

        // --- the piñata jelly itself: plain Phaser shapes, no new textures/species ---
        const shadow = scene.add.ellipse(cx, cy + R * 0.92, R * 1.5, R * 0.45, 0x000000, 0.25).setDepth(9);
        const body = scene.add.circle(cx, cy, R, CONFIG.PASTEL.gold).setStrokeStyle(8, CONFIG.PASTEL.ink).setDepth(10).setScale(0.15);
        const shine = scene.add.ellipse(cx - R * 0.35, cy - R * 0.4, R * 0.55, R * 0.32, 0xffffff, 0.35).setDepth(10.1).setScale(0.15);
        const eyeL = scene.add.circle(cx - R * 0.32, cy - R * 0.05, R * 0.09, CONFIG.PASTEL.ink).setDepth(10.2).setScale(0.15);
        const eyeR = scene.add.circle(cx + R * 0.32, cy - R * 0.05, R * 0.09, CONFIG.PASTEL.ink).setDepth(10.2).setScale(0.15);
        const coin = scene.add.image(cx, cy + R * 0.22, 'coin-tex').setDepth(10.2).setDisplaySize(R * 0.5, R * 0.5).setScale(0.15);
        const label = scene.add.text(cx, cy - R - 34, 'TAP ME!', {
            fontFamily: CONFIG.FONT, fontSize: '20px', color: Balance.hex(CONFIG.PASTEL.white),
            stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 5
        }).setOrigin(0.5).setDepth(10.3).setAlpha(0);
        const pinata = [shadow, body, shine, eyeL, eyeR, coin, label];
        scene.tweens.add({
            targets: [body, shine, eyeL, eyeR, coin], scale: 1, duration: 340, ease: 'Back.easeOut',
            onComplete: () => scene.tweens.add({ targets: label, alpha: 1, duration: 200 })
        });
        // idle "breathing" squish so it reads as jelly, not a static prop.
        // Not held for later removal - it targets `body`, which is in
        // `pinata` below, so finishSmash()'s killTweensOf(pinata) sweep stops
        // it along with everything else (same safe pattern as effects.js -
        // no held-ref .remove(), see this file's header comment).
        scene.tweens.add({
            targets: body, scaleX: 1.06, scaleY: 0.94, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // --- mash meter bar under the piñata ---
        const barW = 260, barH = 24, barY = cy + R + 46;
        const barGfx = scene.add.graphics().setDepth(10.4);
        const drawMeter = () => {
            barGfx.clear();
            barGfx.fillStyle(CONFIG.PASTEL.ink, 0.8).fillRoundedRect(cx - barW / 2 - 3, barY - 3, barW + 6, barH + 6, 13);
            barGfx.fillStyle(CONFIG.PASTEL.panel, 1).fillRoundedRect(cx - barW / 2, barY, barW, barH, 10);
            const fw = Math.max(0, (barW - 6) * meter);
            if (fw > 0) barGfx.fillStyle(CONFIG.PASTEL.good, 1).fillRoundedRect(cx - barW / 2 + 3, barY + 3, fw, barH - 6, 8);
        };
        drawMeter();

        const onTap = (pointer) => {
            if (finished) return;
            tapCount++;
            meter = Math.min(1, meter + BonusStage.TAP_METER_KICK);
            drawMeter();
            Feel.coin();
            if (typeof Effects !== 'undefined') {
                Effects.burst(scene, pointer.x, pointer.y, CONFIG.PASTEL.gold, 8, 0.8);
                Effects.flash(scene, pointer.x, pointer.y, CONFIG.PASTEL.gold, 46);
                Effects.coinPop(scene, cx, cy, 1);
            }
            scene.tweens.add({ targets: body, scale: 1.1, duration: 60, yoyo: true, ease: 'Quad.easeOut' });
            if (meter >= 1) finishSmash();
        };
        body.setInteractive(new Phaser.Geom.Circle(R, R, R), Phaser.Geom.Circle.Contains);
        body.on('pointerdown', onTap);

        // Failure-proof auto-fill: reaches 100% by durationMs even at zero taps.
        const tickEvent = scene.time.addEvent({
            delay: 90, loop: true,
            callback: () => {
                if (finished) return;
                const elapsed = scene.time.now - startTime;
                const base = Math.min(1, elapsed / CONFIG.BONUS.durationMs);
                if (base > meter) { meter = base; drawMeter(); }
                if (elapsed >= CONFIG.BONUS.durationMs) finishSmash();
            }
        });

        function finishSmash() {
            if (finished) return;
            finished = true;
            body.off('pointerdown', onTap);
            // TimerEvent.remove() - unlike a held-ref Tween.remove(), this
            // has no parent-nulled race (it's a repeating/loop timer that
            // never auto-completes on its own, so it's always still live
            // when this fires - see this file's header comment for the
            // Tween case this deliberately avoids).
            tickEvent.remove(false);

            if (typeof Effects !== 'undefined') {
                Effects.confetti(scene, cx, cy);
                Effects.screenFlash(scene, CONFIG.PASTEL.gold, 0.4, 380);
                Effects.burst(scene, cx, cy, CONFIG.PASTEL.gold, 36, 2.1);
                Effects.ring(scene, cx, cy, CONFIG.PASTEL.gold, 280);
            }
            scene.cameras.main.shake(280, 0.009);
            const smashed = scene.add.text(W / 2, H * 0.22, 'SMASHED!!', {
                fontFamily: CONFIG.FONT, fontSize: '40px', color: Balance.hex(CONFIG.PASTEL.goodText),
                stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 8
            }).setOrigin(0.5).setDepth(20).setScale(0.2);
            scene.tweens.add({ targets: smashed, scale: 1, duration: 220, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: smashed, alpha: 0, delay: 700, duration: 250, onComplete: () => smashed.destroy() });

            scene.tweens.killTweensOf(pinata);
            pinata.forEach(o => o.destroy());
            barGfx.destroy();
            scene.tweens.add({ targets: scene.cameras.main, zoom: baseZoom, duration: 380, ease: 'Quad.easeOut' });

            const mashFraction = Math.min(1, tapCount / BonusStage.MAX_BONUS_TAPS);
            scene.time.delayedCall(500, () => {
                banner.destroy();
                showRewards(scene, stage, mashFraction);
            });
        }
    }
};

// -----------------------------------------------------------------------------
// The staged reward reveal: gold -> gems -> one free gem-egg pull -> CONTINUE.
// No early-skip control exists until CONTINUE itself appears (right after the
// last count-up/reveal tween has already finished on its own), so there is no
// "cancel a still-running counter" case to guard against - the only cleanup
// this needs is the standard killTweensOf(overlay)+destroy() sweep on tap.
// -----------------------------------------------------------------------------
function showRewards(scene, stage, mashFraction) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const overlay = [];
    const st = SaveManager.state;

    const gold = Balance.bonusGold(stage, mashFraction);
    const gems = Balance.bonusGems(stage);

    const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x0a0714, 0.85).setDepth(30).setInteractive();
    overlay.push(dim);

    const title = scene.add.text(W / 2, H * 0.09, 'PAYDAY REWARDS', {
        fontFamily: CONFIG.FONT, fontSize: '30px', color: Balance.hex(CONFIG.PASTEL.goldText),
        stroke: Balance.hex(CONFIG.PASTEL.ink), strokeThickness: 7
    }).setOrigin(0.5).setDepth(31).setScale(0.2);
    overlay.push(title);
    scene.tweens.add({ targets: title, scale: 1, duration: 260, ease: 'Back.easeOut' });

    // --- row 1: gold (real progression - credited immediately, then shown counting up) ---
    const goldIcon = scene.add.image(W / 2 - 96, H * 0.19, 'coin-tex').setDepth(31).setScale(1.3).setAlpha(0);
    const goldText = scene.add.text(W / 2 - 50, H * 0.19, '+0', {
        fontFamily: CONFIG.FONT, fontSize: '38px', color: Balance.hex(CONFIG.PASTEL.goldText)
    }).setOrigin(0, 0.5).setDepth(31).setAlpha(0);
    overlay.push(goldIcon, goldText);

    SaveManager.addGold(gold);
    scene.refreshGold();

    scene.time.delayedCall(200, () => {
        goldIcon.setAlpha(1); goldText.setAlpha(1);
        Feel.coin();
        scene.tweens.addCounter({
            from: 0, to: gold, duration: 650, ease: 'Quad.easeOut',
            onUpdate: (tw) => { goldText.setText('+' + Balance.fmt(Math.round(tw.getValue()))); fitToWidth(goldText, 360); },
            onComplete: () => {
                if (typeof Effects !== 'undefined') Effects.coinPop(scene, W / 2 - 50, H * 0.19, 6);
                if (mashFraction > 0) {
                    const pct = Math.round(CONFIG.BONUS.mashBonusMax * mashFraction * 100);
                    const mashTxt = scene.add.text(W / 2, H * 0.19 + 34, 'MASH BONUS +' + pct + '%', {
                        fontFamily: CONFIG.FONT, fontSize: '16px', color: Balance.hex(CONFIG.PASTEL.good)
                    }).setOrigin(0.5).setDepth(31).setAlpha(0);
                    overlay.push(mashTxt);
                    scene.tweens.add({ targets: mashTxt, alpha: 1, duration: 200 });
                }
                scene.time.delayedCall(450, showGemsStep);
            }
        });
    });

    function showGemsStep() {
        const gemIcon = scene.add.image(W / 2 - 96, H * 0.30, 'gem-tex').setDepth(31).setScale(1.1).setAlpha(0);
        const gemText = scene.add.text(W / 2 - 50, H * 0.30, '+0', {
            fontFamily: CONFIG.FONT, fontSize: '34px', color: Balance.hex(CONFIG.PASTEL.accent)
        }).setOrigin(0, 0.5).setDepth(31).setAlpha(0);
        overlay.push(gemIcon, gemText);
        gemIcon.setAlpha(1); gemText.setAlpha(1);
        Feel.jackpot();
        if (typeof Effects !== 'undefined') Effects.burst(scene, W / 2 - 50, H * 0.30, CONFIG.PASTEL.accent, 14, 1);

        st.gems += gems;
        SaveManager.persist();
        scene.refreshGold(); // emits goldChanged -> gem stat readout refreshes too

        scene.tweens.addCounter({
            from: 0, to: gems, duration: 400, ease: 'Quad.easeOut',
            onUpdate: (tw) => { gemText.setText('+' + Balance.fmt(Math.round(tw.getValue()))); fitToWidth(gemText, 360); },
            onComplete: () => scene.time.delayedCall(450, showEggStep)
        });
    }

    function showEggStep() {
        const eggY = H * 0.48;
        const label = scene.add.text(W / 2, eggY - 130, 'FREE GEM-EGG PULL!', {
            fontFamily: CONFIG.FONT, fontSize: '20px', color: Balance.hex(CONFIG.PASTEL.white)
        }).setOrigin(0.5).setDepth(31).setAlpha(0);
        overlay.push(label);
        scene.tweens.add({ targets: label, alpha: 1, duration: 200 });

        const egg = scene.add.image(W / 2, eggY, 'egg-tex').setDepth(31).setDisplaySize(140, 174).setScale(0.1);
        overlay.push(egg);
        scene.tweens.add({ targets: egg, scale: 1, duration: 260, ease: 'Back.easeOut' });
        Sfx.gachaCharge();

        // brief shake, then crack -> reveal (same rate table as a real gem
        // egg - CONFIG.GACHA.gemRates, unmodified - never a boosted table).
        scene.tweens.add({
            targets: egg, angle: { from: -6, to: 6 }, duration: 90, yoyo: true, repeat: 5,
            onComplete: () => {
                const result = Gacha.roll(st, Math.random, true);
                SaveManager.persist();
                if (scene.fieldPets) scene.fieldPets.rebuild();

                const def = (typeof PET_SPECIES !== 'undefined') ? PET_SPECIES.find(p => p.id === result.species) : null;
                // Duplicated (not imported) from shop.js's own RARITY_COLORS/
                // RARITY_STARS - deliberate, per this file's "self-contained,
                // don't refactor shop.js's reveal ceremony" design note above.
                // Values must stay byte-identical to shop.js's copy.
                const rarityColors = { common: 0x9aa5c0, rare: 0x5aa9ff, epic: 0xb06fff, legendary: 0xffd54a };
                const rarityStars = { common: '★', rare: '★★', epic: '★★★', legendary: '★★★★' };
                const color = rarityColors[result.rarity] || CONFIG.PASTEL.accent;

                egg.destroy();
                if (typeof Effects !== 'undefined') {
                    // eggCrack() = flash+ring+shard-burst, entirely self-
                    // destroying (no overlay/killTweensOf entry needed - see
                    // its own doc comment in effects.js), same primitive
                    // shop.js's multi-pull reveal uses per-egg.
                    Effects.eggCrack(scene, W / 2, eggY, color);
                    Effects.rarityWash(scene, color, { peak: result.rarity === 'legendary' ? 0.55 : 0.35 });
                    Effects.lightRays(scene, W / 2, eggY, color, { count: result.rarity === 'legendary' ? 14 : 8, length: 320, life: 700 });
                    Effects.sparkleTrail(scene, W / 2, eggY, 90, color, { count: result.rarity === 'legendary' ? 18 : 10, life: 600 });
                }
                Feel.jackpot();
                if (result.rarity === 'legendary') Sfx.legendaryFanfare();

                const pedestal = (typeof Frames !== 'undefined')
                    ? Frames.drawPedestal(scene, W / 2, eggY + 58, 120, result.rarity).setDepth(30.5).setScale(0.1) : null;
                if (pedestal) { overlay.push(pedestal); scene.tweens.add({ targets: pedestal, scale: 1, duration: 260, ease: 'Back.easeOut' }); }

                const frame = (typeof Frames !== 'undefined')
                    ? Frames.draw(scene, W / 2, eggY, 156, 156, result.rarity).setDepth(31).setScale(0.1) : null;
                if (frame) { overlay.push(frame); scene.tweens.add({ targets: frame, scale: 1, duration: 260, ease: 'Back.easeOut' }); }

                const petSpr = (typeof PET_SPECIES !== 'undefined')
                    ? scene.add.image(W / 2, eggY, 'pet-' + result.species).setDepth(31.5).setDisplaySize(126, 126).setScale(0.1)
                    : null;
                if (petSpr) { overlay.push(petSpr); scene.tweens.add({ targets: petSpr, scale: 126 / CONFIG.PIXEL.bake, duration: 260, ease: 'Back.easeOut' }); }

                const nameStr = (def ? def.name : result.species) + '  ' + (rarityStars[result.rarity] || '');
                const nameText = scene.add.text(W / 2, eggY + 110, nameStr, {
                    fontFamily: CONFIG.FONT, fontSize: '26px', color: '#' + color.toString(16).padStart(6, '0')
                }).setOrigin(0.5).setDepth(32).setAlpha(0);
                overlay.push(nameText);
                fitToWidth(nameText, W - 100);
                scene.tweens.add({ targets: nameText, alpha: 1, duration: 200 });

                const tagStr = result.kind === 'new' ? 'NEW PET!'
                    : result.kind === 'upgrade' ? 'RARITY UPGRADED!' : '+' + result.shards + ' shards';
                const tagText = scene.add.text(W / 2, eggY + 144, tagStr, {
                    fontFamily: CONFIG.FONT, fontSize: '20px', color: Balance.hex(CONFIG.PASTEL.white)
                }).setOrigin(0.5).setDepth(32).setAlpha(0);
                overlay.push(tagText);
                scene.tweens.add({ targets: tagText, alpha: 1, duration: 200 });

                scene.time.delayedCall(400, showContinueButton);
            }
        });
    }

    function showContinueButton() {
        const contBtn = makeUiButton(scene, W / 2, H * 0.90, 460, 92, 'CONTINUE', CONFIG.PASTEL.accent, () => {
            scene.tweens.killTweensOf(overlay);
            overlay.forEach(o => { if (o && o.destroy) o.destroy(); });
            contBtn.destroyAll();
            scene.startStage(SaveManager.state.stage, { nestMode: 'carry' });
        }, undefined, { pad: 10 });
    }
}

if (typeof module !== 'undefined') {
    if (typeof CONFIG === 'undefined') globalThis.CONFIG = require('./config.js').CONFIG;
    if (typeof Balance === 'undefined') globalThis.Balance = require('./balance.js').Balance;
    module.exports = { BonusStage };
}
