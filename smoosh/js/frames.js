// =============================================================================
// SMOOSH! - frames.js
// v5.0 RETRO ARCADE Task 5: rarity-tiered card frames for the dex + gacha
// reveal. Frames.RECIPES (+ .rarityOf) is pure data/logic - no Phaser, no
// DOM - so tests/frames.test.js can require() it in plain Node, same
// "pure half always defined" convention dex.js uses for its Dex object.
// Frames.draw() is the Phaser-dependent renderer and is bolted on inside the
// `if (typeof Phaser !== 'undefined')` guard below (dex.js's CROSS-SCRIPT
// SCOPING RULE comment explains why a browser-only class/fn can't just live
// unconditionally at module scope) - it simply won't exist when this file is
// require()'d from Node, which is exactly what the last test below checks.
// =============================================================================

const Frames = {

    // Distinct per tier (see tests/frames.test.js "pairwise distinct" +
    // "richness ... non-decreasing"):
    //   common    - flat inkSoft border, no ornament/glow/gem/shimmer, no animation.
    //   rare      - double accent/cyan border + a soft inner glow + a small corner gem.
    //   epic      - double fever/magenta border + 4 corner pips + glow + gem
    //               + a STATIC holo shimmer sheen.
    //   legendary - double gold border + 6 pips + glow + gem + an ANIMATED
    //               holo shimmer sweep + pulsing flourish + god-ray glint.
    // colorToken is a CONFIG.PASTEL key name (not a raw hex) so the frame
    // always tracks the live neon palette instead of drifting from it.
    // v6 Task 12 (premium refined cards): added glow/gem/shimmer. Kept as
    // plain booleans - same "pure tier data, no rendering constants" split
    // the pre-existing fields already followed - Frames.draw()'s Phaser-only
    // half does all the tier-scaled sizing/alpha/animation math, and reuses
    // the pre-existing `animated` flag as the "upgrade glow/shimmer from
    // static to actually moving" switch instead of adding a 4th animation
    // flag (legendary is the only tier where glow/shimmer/pips/border all
    // animate - see Frames.draw()'s `recipe.animated && animate` guards).
    RECIPES: {
        common: {
            tier: 'common', colorToken: 'inkSoft',
            double: false, ornament: false, animated: false, pips: 0,
            glow: false, gem: false, shimmer: false
        },
        rare: {
            tier: 'rare', colorToken: 'accent',
            double: true, ornament: false, animated: false, pips: 0,
            glow: true, gem: true, shimmer: false
        },
        epic: {
            tier: 'epic', colorToken: 'fever',
            double: true, ornament: true, animated: false, pips: 4,
            glow: true, gem: true, shimmer: true
        },
        legendary: {
            tier: 'legendary', colorToken: 'gold',
            double: true, ornament: true, animated: true, pips: 6,
            glow: true, gem: true, shimmer: true
        }
    },

    // A pet's rarity, defaulted to 'common' for anything unrecognized/absent
    // (locked dex silhouettes, monsters - see dex.js's monster-card call).
    rarityOf(pet) {
        const r = pet && pet.rarity;
        return this.RECIPES[r] ? r : 'common';
    }
};

if (typeof module !== 'undefined') module.exports = { Frames };

// =============================================================================
// Frames.draw(scene, x, y, w, h, rarity, opts) - Phaser-only renderer.
// Returns a Container positioned at (x, y) holding the frame graphics, sized
// w x h around its own local origin (i.e. spans -w/2..w/2, -h/2..h/2) - the
// same "x/y are this display object's position, ready to be handed straight
// to `container.add([...])` or pushed into a parts/items/overlay cleanup
// array" convention every sibling in dex.js/shop.js already follows.
// opts.animate (default true, v6 Task 12) gates every looping tween - pass
// `{ animate: false }` from any context rendering many cards at once (see
// dex.js's grid + shop.js's multi-pull cells) to keep the same tier visuals
// minus the per-card tween cost. Frames.drawPedestal(scene, x, y, w, rarity)
// (also below) is the sibling helper for the pedestal/platform every card's
// subject now stands on - always static, no opts needed.
// =============================================================================
if (typeof Phaser !== 'undefined') {

    // v6 Task 12: elaborateness rank, purely for VISUAL SCALING inside this
    // Phaser-only half (glow size/alpha, gem size) - NOT part of the pure
    // RECIPES data above (tests/frames.test.js only ever asserts the
    // booleans/pips), same "pure half stays pure, rendering constants live
    // in the renderer" split this file already followed pre-Task-12.
    const RANK = { common: 0, rare: 1, epic: 2, legendary: 3 };

    // Evenly-ish spread `n` sparkle pips around the frame's corners, adding
    // top/bottom edge midpoints once a recipe asks for more than 4 (only
    // legendary's pips:6 does today) - keeps epic's 4 literal corners and
    // gives legendary two extra without a full perimeter-distribution algorithm.
    function framePipPositions(w, h, n, inset) {
        const corners = [
            [-w / 2 + inset, -h / 2 + inset], [w / 2 - inset, -h / 2 + inset],
            [w / 2 - inset, h / 2 - inset], [-w / 2 + inset, h / 2 - inset]
        ];
        if (n <= 4) return corners.slice(0, n);
        const edgeMids = [[0, -h / 2 + inset], [0, h / 2 - inset]];
        return corners.concat(edgeMids.slice(0, n - 4));
    }

    // v6 Task 12: a small diamond "rarity gem" badge riveted to the frame's
    // top edge, like a trading-card seal - bigger at higher tiers
    // (RANK-scaled). Only twinkles when `animated` is true (legendary AND
    // the caller opted into animation - see Frames.draw()'s `animate` param).
    function drawRarityGem(scene, container, h, color, rank, animated, tweens) {
        const size = 10 + rank * 2.5;
        const gy = -h / 2 + 2;
        const pts = [
            { x: 0, y: gy - size }, { x: size * 0.8, y: gy },
            { x: 0, y: gy + size }, { x: -size * 0.8, y: gy }
        ];
        const g = scene.add.graphics();
        g.fillStyle(color, 1);
        g.fillPoints(pts, true);
        g.lineStyle(2, 0x05020c, 0.6);
        g.strokePoints(pts, true, true);
        g.fillStyle(0xffffff, 0.65);                    // top facet glint
        g.fillTriangle(0, gy - size, size * 0.32, gy - size * 0.25, -size * 0.32, gy - size * 0.25);
        container.add(g);
        if (animated) {
            tweens.push(scene.tweens.add({
                targets: g, scale: { from: 0.85, to: 1.12 }, duration: 560,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            }));
        }
    }

    // v6 Task 12: a soft diagonal "holo sheen" band across the card. Static
    // (fixed position, drawn once, no tween) unless `animated` is true - see
    // Frames.draw()'s `recipe.animated && animate` callers. This is exactly
    // the perf knob the Task 12 brief calls for: dex.js's grid (up to ~50
    // cards at once) and shop.js's multi-pull cells (up to 11 at once) both
    // pass `{ animate: false }` so this NEVER spins up a tween there
    // regardless of the card's rolled rarity, while dex.js's detail view and
    // shop.js's single-pull reveal (one big card at a time) get the full
    // sweeping sheen.
    function drawShimmerBand(scene, container, w, h, animated, tweens) {
        const bw = w * 0.24;
        const g = scene.add.graphics();
        g.fillStyle(0xffffff, 0.16);
        g.fillPoints([
            { x: -w / 2, y: -h / 2 + bw }, { x: -w / 2 + bw, y: -h / 2 },
            { x: w / 2, y: h / 2 - bw }, { x: w / 2 - bw, y: h / 2 }
        ], true);
        container.add(g);
        if (animated) {
            tweens.push(scene.tweens.add({
                targets: g, x: { from: -w * 0.22, to: w * 0.22 }, duration: 1700,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            }));
        }
    }

    // Frames.draw(scene, x, y, w, h, rarity, opts) - opts.animate (default
    // true) gates every LOOPING tween this function can create (glow pulse,
    // shimmer sweep, gem twinkle, pip twinkle, outer-stroke pulse, god-ray
    // spin) - passing `{ animate: false }` renders the exact same tier
    // (colors/shapes/gem/shimmer band all still drawn) just frozen at its
    // resting frame, for contexts with many simultaneous cards. See the
    // drawShimmerBand comment above for why this exists (v6 Task 12 perf
    // fix for legendary pets previously animating unconditionally in the
    // dex grid).
    Frames.draw = function (scene, x, y, w, h, rarity, opts) {
        const recipe = Frames.RECIPES[rarity] || Frames.RECIPES.common;
        const color = CONFIG.PASTEL[recipe.colorToken];
        const rank = RANK[recipe.tier] || 0;
        const animate = !opts || opts.animate !== false;
        const richAnim = recipe.animated && animate;
        const container = scene.add.container(x, y);
        const tweens = [];

        // v6 Task 12: universal soft drop-shadow, EVERY tier (including
        // common) - a raised trading card needs a dark contact shadow
        // regardless of rarity, same near-black exception class as ui.js's
        // button shadow / the modal dim-scrims (see those files' own
        // comments on this convention). Bottom of the stack, never tweened.
        const shadow = scene.add.graphics();
        shadow.fillStyle(0x05020c, 0.4);
        shadow.fillRoundedRect(-w / 2 + 5, -h / 2 + 7, w, h, 18);
        container.add(shadow);

        // v6 Task 12: legendary's extra "god-ray-ish glint" - thin
        // light-colored spokes fanning from center, sitting behind the ADD
        // glow below so the two blend into one bigger glow. Static unless
        // animate (slow rotation).
        if (recipe.tier === 'legendary') {
            const rays = scene.add.graphics();
            rays.fillStyle(0xffffff, 0.12);
            const rayLen = Math.max(w, h) * 0.62, spread = 0.05;
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                rays.fillTriangle(
                    0, 0,
                    Math.cos(a - spread) * rayLen, Math.sin(a - spread) * rayLen,
                    Math.cos(a + spread) * rayLen, Math.sin(a + spread) * rayLen
                );
            }
            container.add(rays);
            if (animate) {
                tweens.push(scene.tweens.add({
                    targets: rays, angle: 360, duration: 9000, repeat: -1, ease: 'Linear'
                }));
            }
        }

        // v6 Task 12: inner glow (recipe.glow, rare+) - a soft rarity-
        // colored ADD wash behind the border, RANK-scaled size/alpha.
        // Static for rare/epic; legendary's also breathes (richAnim) - same
        // trick the pre-Task-12 legendary-only shimmer used.
        if (recipe.glow) {
            const glow = scene.add.image(0, 0, 'pop-tex')
                .setDisplaySize(w * (1.05 + rank * 0.05), h * (1.05 + rank * 0.05))
                .setTint(color).setAlpha(0.08 + rank * 0.03)
                .setBlendMode(Phaser.BlendModes.ADD);
            container.add(glow);
            if (richAnim) {
                tweens.push(scene.tweens.add({
                    targets: glow, alpha: { from: 0.05, to: 0.22 }, duration: 700,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                }));
            }
        }

        // v6 Task 12: holo shimmer sheen (recipe.shimmer, epic+) - epic gets
        // a static diagonal highlight, legendary's sweeps (richAnim).
        if (recipe.shimmer) drawShimmerBand(scene, container, w, h, richAnim, tweens);

        // v6 Task 12: rounded TRADING-CARD proportions - radius bumped
        // 14->18 (outer) / 10->14 (inner) to match the btn-tex nineslice
        // corner radius (20-24) callers already draw the card body with, so
        // the frame's own corners no longer read flatter than the panel
        // underneath it.
        const outer = scene.add.graphics();
        outer.lineStyle(4, color, 1);
        outer.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
        container.add(outer);

        if (recipe.double) {
            const inner = scene.add.graphics();
            inner.lineStyle(2, color, 0.55);
            inner.strokeRoundedRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 14);
            container.add(inner);
        }

        if (recipe.ornament) {
            for (const [px, py] of framePipPositions(w, h, recipe.pips, 12)) {
                const pip = scene.add.image(px, py, 'spark-tex').setDisplaySize(14, 14).setTint(color);
                container.add(pip);
                if (richAnim) {
                    tweens.push(scene.tweens.add({
                        targets: pip, alpha: { from: 0.35, to: 1 }, scale: { from: 0.7, to: 1.2 },
                        duration: 480, delay: Phaser.Math.Between(0, 220),
                        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                    }));
                }
            }
        }

        // legendary-only: the outer stroke itself breathes brighter/dimmer -
        // the "pulsing" flourish called out in the task brief.
        if (richAnim) {
            tweens.push(scene.tweens.add({
                targets: outer, alpha: { from: 0.55, to: 1 }, duration: 620,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            }));
        }

        // v6 Task 12: rarity gem badge (recipe.gem, rare+) - riveted to the
        // top edge, added LAST so it renders above the border/pips.
        if (recipe.gem) drawRarityGem(scene, container, h, color, rank, richAnim, tweens);

        // Classic tween-leak bug (see MEMORY common-bugs list): callers
        // destroy this frame exactly like every other sibling display object
        // in their parts/items/overlay array - a plain `.destroy()`, never a
        // frame-specific cleanup call. So the looping tweens MUST die with
        // it, wrapped right here instead of trusting every call site to
        // remember a special case. `dex.js`'s buildGrid() re-render
        // (`gridContainer.removeAll(true)`) and its showDetail/hideDetail
        // pair, and `shop.js`'s clearTab()/playReveal() overlay cleanup, all
        // already just call `.destroy()` on their children - this makes that
        // keep working for free. v6 Task 12: the SAME array now also
        // collects the glow/shimmer/gem/god-ray tweens above, so none of
        // those new features reintroduces the leak either.
        if (tweens.length) {
            const baseDestroy = container.destroy.bind(container);
            container.destroy = function (fromScene) {
                tweens.forEach(t => t && t.remove());
                baseDestroy(fromScene);
            };
        }

        return container;
    };

    // v6 Task 12: shared pedestal/platform the pet or monster sprite sits
    // centered on, for the "cute + premium trading card" layout - dex.js's
    // grid/detail and shop.js's single/multi-pull gacha reveal all call this
    // once (before adding their own sprite on top at the same x/y-ish) so
    // every card gets the same rarity-tinted little stage under its subject.
    // Purely static (no tweens, nothing to leak) - callers can `.destroy()`
    // it exactly like any other tracked display object with zero special
    // cleanup, same convention as Frames.draw()'s container.
    Frames.drawPedestal = function (scene, x, y, w, rarity) {
        const recipe = Frames.RECIPES[rarity] || Frames.RECIPES.common;
        const color = CONFIG.PASTEL[recipe.colorToken];
        const container = scene.add.container(x, y);
        const shadow = scene.add.image(0, w * 0.05, 'pop-tex')
            .setDisplaySize(w * 0.92, w * 0.30).setTint(0x05020c).setAlpha(0.4);
        container.add(shadow);
        const plat = scene.add.graphics();
        plat.fillStyle(color, 0.22);
        plat.fillEllipse(0, 0, w * 0.82, w * 0.24);
        plat.lineStyle(3, color, 0.7);
        plat.strokeEllipse(0, 0, w * 0.82, w * 0.24);
        container.add(plat);
        return container;
    };
}
