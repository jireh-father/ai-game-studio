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

    // Distinct per tier (see tests/frames.test.js "pairwise distinct"):
    //   common    - flat inkSoft border, no ornament, no animation.
    //   rare      - double accent/cyan border.
    //   epic      - double fever/magenta border + 4 corner pips.
    //   legendary - double gold border + 6 pips + pulsing/animated flourish.
    // colorToken is a CONFIG.PASTEL key name (not a raw hex) so the frame
    // always tracks the live neon palette instead of drifting from it.
    RECIPES: {
        common: {
            tier: 'common', colorToken: 'inkSoft',
            double: false, ornament: false, animated: false, pips: 0
        },
        rare: {
            tier: 'rare', colorToken: 'accent',
            double: true, ornament: false, animated: false, pips: 0
        },
        epic: {
            tier: 'epic', colorToken: 'fever',
            double: true, ornament: true, animated: false, pips: 4
        },
        legendary: {
            tier: 'legendary', colorToken: 'gold',
            double: true, ornament: true, animated: true, pips: 6
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
// Frames.draw(scene, x, y, w, h, rarity) - Phaser-only renderer.
// Returns a Container positioned at (x, y) holding the frame graphics, sized
// w x h around its own local origin (i.e. spans -w/2..w/2, -h/2..h/2) - the
// same "x/y are this display object's position, ready to be handed straight
// to `container.add([...])` or pushed into a parts/items/overlay cleanup
// array" convention every sibling in dex.js/shop.js already follows.
// =============================================================================
if (typeof Phaser !== 'undefined') {

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

    Frames.draw = function (scene, x, y, w, h, rarity) {
        const recipe = Frames.RECIPES[rarity] || Frames.RECIPES.common;
        const color = CONFIG.PASTEL[recipe.colorToken];
        const container = scene.add.container(x, y);
        const tweens = [];

        // legendary-only: soft additive glow behind everything else, drawn
        // first (addAt 0) so borders/pips render on top of it.
        if (recipe.animated) {
            const shimmer = scene.add.image(0, 0, 'pop-tex')
                .setDisplaySize(w * 1.2, h * 1.2).setTint(color)
                .setAlpha(0.1).setBlendMode(Phaser.BlendModes.ADD);
            container.add(shimmer);
            tweens.push(scene.tweens.add({
                targets: shimmer, alpha: { from: 0.05, to: 0.22 }, duration: 700,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            }));
        }

        const outer = scene.add.graphics();
        outer.lineStyle(4, color, 1);
        outer.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
        container.add(outer);

        if (recipe.double) {
            const inner = scene.add.graphics();
            inner.lineStyle(2, color, 0.55);
            inner.strokeRoundedRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 10);
            container.add(inner);
        }

        if (recipe.ornament) {
            for (const [px, py] of framePipPositions(w, h, recipe.pips, 12)) {
                const pip = scene.add.image(px, py, 'spark-tex').setDisplaySize(14, 14).setTint(color);
                container.add(pip);
                if (recipe.animated) {
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
        if (recipe.animated) {
            tweens.push(scene.tweens.add({
                targets: outer, alpha: { from: 0.55, to: 1 }, duration: 620,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            }));
        }

        // Classic tween-leak bug (see MEMORY common-bugs list): callers
        // destroy this frame exactly like every other sibling display object
        // in their parts/items/overlay array - a plain `.destroy()`, never a
        // frame-specific cleanup call. So the looping tweens MUST die with
        // it, wrapped right here instead of trusting every call site to
        // remember a special case. `dex.js`'s buildGrid() re-render
        // (`gridContainer.removeAll(true)`) and its showDetail/hideDetail
        // pair, and `shop.js`'s clearTab()/playReveal() overlay cleanup, all
        // already just call `.destroy()` on their children - this makes that
        // keep working for free.
        if (tweens.length) {
            const baseDestroy = container.destroy.bind(container);
            container.destroy = function (fromScene) {
                tweens.forEach(t => t && t.remove());
                baseDestroy(fromScene);
            };
        }

        return container;
    };
}
