// =============================================================================
// SMOOSH! - background.js
// v7 Task 8: 20 procedural gameplay-field backgrounds x 8 neon-palette tint
// schemes, selected DETERMINISTICALLY from the stage number so the field
// looks different almost every stage, yet is 100% reproducible (same stage
// number -> same background, every time - no Math.random anywhere here).
//
// Selection:
//   styleIndex(stage)   = (stage-1) % 20   -> cycles the 20 STYLES every 20 stages
//   paletteIndex(stage) = floor((stage-1)/20) % 8
//                                           -> palette shifts every 20-stage
//                                              block, so the (style,palette)
//                                              PAIR only repeats every 160
//                                              stages (20*8) - "looks fresh
//                                              nearly every stage" per spec.
//   Per-style internal jitter (dot placement, phase, offsets, etc.) is seeded
//   from the raw stage number via mulberry32 - so even a full 160-stage
//   supercycle repeat (e.g. stage 161 vs stage 1, same style+palette) still
//   paints a different arrangement, not a pixel-identical rerun.
//
// Rendering: Backgrounds.render(scene, stage) draws ONE Phaser Graphics
// object, positioned/sized to CONFIG.FIELD, at Backgrounds.DEPTH (-5) - well
// BEHIND every field entity (monsters/pets/nest sit at depth 2-9, HUD at
// depth >=10 - see game.js/monsters.js/ui.js) and behind the field's own
// border-stroke rectangle (game.js create(), depth 0). Drawn ONCE per stage
// (not per-frame - Graphics stays static after the draw calls), and the
// previous stage's Graphics is destroyed first (see destroy()) so rebuilding
// on every startStage() never leaks display objects.
//
// Readability: every style/palette combo stays SUBTLE - a low, mostly-dark
// base fill (CONFIG.PASTEL.bgField, same as the old flat rect it replaces)
// with low-alpha (~0.12-0.16) pattern strokes/fills on top, so neon monsters/
// pets (which use much higher-saturation fills) and the HUD both stay
// clearly legible over any of the 160 combos.
//
// Dual-mode module (same convention as effects.js/decor.js): the SELECTION
// math (styleIndex/paletteIndex/mulberry32) and the STYLES/PALETTES registry
// are pure and Phaser/CONFIG-free at load time, so tests/background.test.js
// can require() this file bare in Node - only `palettes()` (reads
// CONFIG.PASTEL) and `render()` (calls scene.add.graphics) need those globals,
// and only when actually invoked.
// =============================================================================

// Deterministic tiny PRNG (mulberry32) - NEVER Math.random in this file: the
// whole point of this feature is that a given stage always paints the exact
// same pattern. Seeded per-call from the stage number (see Backgrounds.render).
function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
        t = (t + 0x6D2B79F5) | 0;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

// -----------------------------------------------------------------------------
// 20 STYLES - each draws a subtle pattern into `g` (a Phaser Graphics object,
// already positioned at the field's top-left corner) within local bounds
// [0,w] x [0,h]. `pal` is one of the 8 palettes below; `rng` is a mulberry32
// instance already seeded from the current stage.
// -----------------------------------------------------------------------------

function starfield(g, w, h, pal, rng) {
    for (let i = 0; i < 70; i++) {
        const x = rng() * w, y = rng() * h, r = 1 + rng() * 1.8;
        const a = pal.alpha * (0.4 + rng() * 0.9);
        g.fillStyle(i % 3 === 0 ? pal.accent : pal.line, a).fillCircle(x, y, r);
    }
}

function dotGrid(g, w, h, pal, rng) {
    const step = 48, jitter = 4;
    for (let y = step / 2; y < h; y += step) {
        for (let x = step / 2; x < w; x += step) {
            const jx = (rng() - 0.5) * jitter, jy = (rng() - 0.5) * jitter;
            g.fillStyle(pal.line, pal.alpha).fillCircle(x + jx, y + jy, 2.4);
        }
    }
}

function diagonalStripes(g, w, h, pal, rng) {
    const gap = 46, offset = rng() * gap;
    g.lineStyle(10, pal.line, pal.alpha * 0.7);
    for (let x = -h + offset; x < w + h; x += gap) {
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.strokePath();
    }
}

function strokeHex(g, cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + i * Math.PI / 3;
        pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    g.strokePoints(pts, true, true);
}

function hexMesh(g, w, h, pal, rng) {
    const r = 30, hStep = r * 1.5, vStep = r * Math.sqrt(3);
    g.lineStyle(2, pal.line, pal.alpha);
    let row = 0;
    for (let y = -vStep; y < h + vStep; y += vStep / 2) {
        const offset = (row % 2) ? hStep / 2 : 0;
        for (let x = -hStep + offset; x < w + hStep; x += hStep) strokeHex(g, x, y, r * 0.55);
        row++;
    }
}

function concentricRings(g, w, h, pal, rng) {
    const cx = w * (0.3 + rng() * 0.4), cy = h * (0.3 + rng() * 0.4);
    const maxR = Math.max(w, h) * 0.85;
    g.lineStyle(3, pal.line, pal.alpha);
    for (let r = 30; r < maxR; r += 44) g.strokeCircle(cx, cy, r);
}

function bubbles(g, w, h, pal, rng) {
    for (let i = 0; i < 22; i++) {
        const x = rng() * w, y = rng() * h, r = 8 + rng() * 26;
        g.lineStyle(2, (i % 2) ? pal.accent : pal.line, pal.alpha);
        g.strokeCircle(x, y, r);
    }
}

function waveBands(g, w, h, pal, rng) {
    const bands = 5, phase = rng() * Math.PI * 2;
    for (let b = 0; b < bands; b++) {
        const y0 = (b + 0.5) * h / bands;
        g.lineStyle(4, (b % 2) ? pal.accent : pal.line, pal.alpha);
        g.beginPath();
        for (let x = 0; x <= w; x += 12) {
            const y = y0 + Math.sin(x * 0.02 + phase + b) * 14;
            if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.strokePath();
    }
}

function circuitTraces(g, w, h, pal, rng) {
    g.lineStyle(2.5, pal.line, pal.alpha);
    for (let i = 0; i < 10; i++) {
        let x = rng() * w, y = rng() * h;
        g.beginPath(); g.moveTo(x, y);
        const segs = 2 + Math.floor(rng() * 3);
        for (let s = 0; s < segs; s++) {
            if (rng() < 0.5) x = clamp(x + (rng() - 0.5) * 160, 0, w);
            else y = clamp(y + (rng() - 0.5) * 160, 0, h);
            g.lineTo(x, y);
        }
        g.strokePath();
        g.fillStyle(pal.accent, pal.alpha * 1.4).fillCircle(x, y, 3.2);
    }
}

function triangles(g, w, h, pal, rng) {
    for (let i = 0; i < 14; i++) {
        const cx = rng() * w, cy = rng() * h, r = 14 + rng() * 20, rot = rng() * Math.PI * 2;
        const pts = [0, 1, 2].map(k => {
            const a = rot + k * Math.PI * 2 / 3;
            return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
        });
        g.lineStyle(2, (i % 2) ? pal.accent : pal.line, pal.alpha);
        g.strokePoints(pts, true, true);
    }
}

function checker(g, w, h, pal, rng) {
    const cell = 52, offR = Math.floor(rng() * 2);
    let row = 0;
    for (let y = 0; y < h; y += cell) {
        let col = 0;
        for (let x = 0; x < w; x += cell) {
            if ((row + col + offR) % 2 === 0) g.fillStyle(pal.line, pal.alpha * 0.8).fillRect(x, y, cell, cell);
            col++;
        }
        row++;
    }
}

function verticalBars(g, w, h, pal, rng) {
    let x = 0;
    while (x < w) {
        const bw = 20 + rng() * 36;
        if (rng() < 0.55) g.fillStyle(pal.line, pal.alpha * (0.5 + rng() * 0.8)).fillRect(x, 0, bw * 0.4, h);
        x += bw;
    }
}

function confettiSpecks(g, w, h, pal, rng) {
    for (let i = 0; i < 30; i++) {
        const cx = rng() * w, cy = rng() * h, rot = rng() * Math.PI, hw = 3.5, hh = 2;
        const cos = Math.cos(rot), sin = Math.sin(rot);
        const pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([px, py]) => ({
            x: cx + px * cos - py * sin, y: cy + px * sin + py * cos
        }));
        g.fillStyle((i % 2) ? pal.accent : pal.line, pal.alpha * 1.3).fillPoints(pts, true);
    }
}

function auroraGradient(g, w, h, pal, rng) {
    for (let i = 0; i < 3; i++) {
        const cy = h * (0.2 + i * 0.3 + rng() * 0.1);
        g.fillStyle((i % 2) ? pal.accent : pal.line, pal.alpha * 0.9)
            .fillEllipse(w * (0.3 + rng() * 0.4), cy, w * 1.3, h * 0.28);
    }
}

function plusGrid(g, w, h, pal, rng) {
    const step = 60, arm = 8;
    g.fillStyle(pal.line, pal.alpha);
    for (let y = step / 2; y < h; y += step) {
        for (let x = step / 2; x < w; x += step) {
            g.fillRect(x - arm, y - 2, arm * 2, 4);
            g.fillRect(x - 2, y - arm, 4, arm * 2);
        }
    }
}

function diamonds(g, w, h, pal, rng) {
    const step = 56;
    g.lineStyle(2, pal.line, pal.alpha);
    let row = 0;
    for (let y = 0; y < h + step; y += step / 2) {
        const offset = (row % 2) ? step / 2 : 0;
        for (let x = -step + offset; x < w + step; x += step) {
            const s = 18;
            g.strokePoints([{ x, y: y - s }, { x: x + s, y }, { x, y: y + s }, { x: x - s, y }], true, true);
        }
        row++;
    }
}

function noiseDither(g, w, h, pal, rng) {
    for (let i = 0; i < 220; i++) {
        const x = rng() * w, y = rng() * h;
        g.fillStyle(rng() < 0.5 ? pal.line : pal.accent, pal.alpha * 0.7).fillRect(x, y, 1.6, 1.6);
    }
}

function spiral(g, w, h, pal, rng) {
    const cx = w / 2, cy = h / 2, turns = 5, maxR = Math.max(w, h) * 0.62, rot = rng() * Math.PI * 2;
    g.lineStyle(2.5, pal.line, pal.alpha);
    g.beginPath();
    for (let t = 0; t <= 1; t += 0.01) {
        const a = rot + t * Math.PI * 2 * turns, r = t * maxR;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        if (t === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.strokePath();
}

function chevrons(g, w, h, pal, rng) {
    const rowH = 50, chevW = 40, offset = rng() * chevW;
    g.lineStyle(3, pal.line, pal.alpha);
    for (let y = 0; y < h + rowH; y += rowH) {
        for (let x = -chevW + offset; x < w + chevW; x += chevW * 2) {
            g.beginPath();
            g.moveTo(x, y + rowH); g.lineTo(x + chevW, y); g.lineTo(x + chevW * 2, y + rowH);
            g.strokePath();
        }
    }
}

function brick(g, w, h, pal, rng) {
    const bw = 64, bh = 26;
    g.lineStyle(2, pal.line, pal.alpha);
    let row = 0;
    for (let y = 0; y < h; y += bh) {
        const offset = (row % 2) ? bw / 2 : 0;
        for (let x = -bw + offset; x < w; x += bw) g.strokeRect(x, y, bw, bh);
        row++;
    }
}

function scanlineBands(g, w, h, pal, rng) {
    const bandH = 10, offset = Math.floor(rng() * bandH);
    for (let y = offset; y < h; y += bandH * 2) g.fillStyle(pal.line, pal.alpha * 0.6).fillRect(0, y, w, bandH * 0.5);
    for (let i = 0; i < 3; i++) g.fillStyle(pal.accent, pal.alpha * 1.4).fillRect(0, rng() * h, w, 2);
}

// Order fixes STYLE INDEX 0..19 - do not reorder without updating any saved
// expectations (tests/background.test.js pins a few exact stage->style pairs).
const STYLES = [
    starfield, dotGrid, diagonalStripes, hexMesh, concentricRings,
    bubbles, waveBands, circuitTraces, triangles, checker,
    verticalBars, confettiSpecks, auroraGradient, plusGrid, diamonds,
    noiseDither, spiral, chevrons, brick, scanlineBands
];

const STYLE_NAMES = [
    'starfield', 'dotGrid', 'diagonalStripes', 'hexMesh', 'concentricRings',
    'bubbles', 'waveBands', 'circuitTraces', 'triangles', 'checker',
    'verticalBars', 'confettiSpecks', 'auroraGradient', 'plusGrid', 'diamonds',
    'noiseDither', 'spiral', 'chevrons', 'brick', 'scanlineBands'
];

const Backgrounds = {
    STYLE_COUNT: 20,
    PALETTE_COUNT: 8,
    DEPTH: -5,          // well below monsters(3)/pets/nest(2-9) and HUD(>=10)

    STYLES,
    STYLE_NAMES,

    // Pure selection - stage is 1-based (SaveManager.state.stage convention).
    styleIndex(stage) { return (Math.max(1, stage) - 1) % this.STYLE_COUNT; },
    paletteIndex(stage) { return Math.floor((Math.max(1, stage) - 1) / this.STYLE_COUNT) % this.PALETTE_COUNT; },

    // 8 palettes derived from CONFIG.PASTEL's neon tokens - each a dark-
    // friendly {base, line, accent, alpha} tint/alpha scheme. `base` is
    // always the same near-black field backdrop (bgField) the flat rect used
    // to be, so no combo ever brightens the field itself - only the low-
    // alpha pattern drawn over it changes hue.
    palettes() {
        const P = CONFIG.PASTEL;
        return [
            { name: 'cyan',    base: P.bgField, line: P.accent,               accent: P.elements.water.soft,     alpha: 0.14 },
            { name: 'magenta', base: P.bgField, line: P.fever,                accent: P.elements.dark.soft,      alpha: 0.13 },
            { name: 'amber',   base: P.bgField, line: P.gold,                 accent: P.elements.fire.soft,      alpha: 0.13 },
            { name: 'lime',    base: P.bgField, line: P.good,                 accent: P.elements.leaf.soft,      alpha: 0.13 },
            { name: 'crit',    base: P.bgField, line: P.crit,                 accent: P.elements.electric.soft,  alpha: 0.12 },
            { name: 'fire',    base: P.bgField, line: P.elements.fire.base,   accent: P.danger,                  alpha: 0.13 },
            { name: 'violet',  base: P.bgField, line: P.elements.dark.base,   accent: P.fever,                   alpha: 0.14 },
            { name: 'ice',     base: P.bgField, line: P.elements.ice.base,    accent: P.accent,                  alpha: 0.12 }
        ];
    },

    // Destroy the previous stage's background Graphics (leak-safe - safe to
    // call even if none exists yet, e.g. the very first startStage() call).
    destroy(scene) {
        if (scene && scene._bgHandle) {
            scene._bgHandle.destroy();
            scene._bgHandle = null;
        }
    },

    // Build + install this stage's background. Drawn ONCE (no per-frame
    // cost) as a single Graphics object positioned/sized to CONFIG.FIELD.
    // Rebuilding tears down the prior stage's Graphics first, so calling this
    // from every startStage() never accumulates orphaned display objects.
    render(scene, stage) {
        this.destroy(scene);
        const F = CONFIG.FIELD;
        const sIdx = this.styleIndex(stage);
        const pIdx = this.paletteIndex(stage);
        const pal = this.palettes()[pIdx];
        // Seed from the raw stage number (golden-ratio mixed) so within-style
        // jitter still differs across a full style+palette supercycle repeat.
        const rng = mulberry32(Math.imul(Math.max(1, stage), 0x9E3779B1) >>> 0);

        const g = scene.add.graphics().setPosition(F.x, F.y).setDepth(this.DEPTH);
        g.fillStyle(pal.base, 1).fillRect(0, 0, F.w, F.h);
        this.STYLES[sIdx](g, F.w, F.h, pal, rng);

        scene._bgHandle = g;
        return g;
    }
};

if (typeof module !== 'undefined') module.exports = { Backgrounds, mulberry32 };
