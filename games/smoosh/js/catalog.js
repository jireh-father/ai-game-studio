// =============================================================================
// SMOOSH! - catalog.js
// The 24 jelly species (20 mobs + splitter/shield/jackpot/boss). Art is built
// by a parametric jelly painter so every species shares the same cute flat
// style while wearing its own signature parts (ears/horns/tail/pattern/hat/
// aura) and a pastel body pulled from its element's 3-step ramp. Two states
// per species: idle and squash.
// v4.0 Phase C Task 4: signature-part system replaces the old single
// `accessory` slot (crown/shell/coin/splitline/zzz/horns/ears/ring/heart/
// bubble/leaf/ice/sparkle/flame) - see paintJelly() doc comment below for the
// migration table. Nothing outside catalog.js ever read `def.accessory`
// (grepped: only svgIdle/svgSquash/def.color cross the file boundary), so
// this migration needed no other-file changes.
// =============================================================================

// --- color helpers: element ramps + per-species tint --------------------
function hex6(n) {
    return '#' + (n & 0xffffff).toString(16).padStart(6, '0');
}
// Blend two hex colors; t=0 -> a, t=1 -> b.
function mixHex(a, b, t) {
    const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
    const ar = (A >> 16) & 255, ag = (A >> 8) & 255, ab = A & 255;
    const br = (B >> 16) & 255, bg = (B >> 8) & 255, bb = B & 255;
    const m = (x, y) => Math.max(0, Math.min(255, Math.round(x + (y - x) * t)));
    const c = v => v.toString(16).padStart(2, '0');
    return '#' + c(m(ar, br)) + c(m(ag, bg)) + c(m(ab, bb));
}
// Lighten (amt>0) or darken (amt<0) a hex color; used only as a fallback
// when no PASTEL ramp is available (opts.deep unset AND CONFIG missing).
function shadeHex(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (amt < 0) { r *= (1 + amt); g *= (1 + amt); b *= (1 + amt); }
    else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return '#' + c(r) + c(g) + c(b);
}
// element -> pastel 3-step ramp (hex strings). Guarded: Node tests must set
// globalThis.CONFIG = require('config.js').CONFIG before requiring this file
// (see tests/catalog.test.js); the browser always has it since config.js
// loads before catalog.js in index.html.
function elemRamp(elem) {
    if (typeof CONFIG !== 'undefined' && CONFIG.PASTEL && CONFIG.PASTEL.elements[elem]) {
        const e = CONFIG.PASTEL.elements[elem];
        return { base: hex6(e.base), soft: hex6(e.soft), deep: hex6(e.deep) };
    }
    return null;
}

// --- signature-part fragments --------------------------------------------
// Each fragment is wrapped in <g data-part="kind-value"> (a cheap structural
// hook tests/catalog.test.js greps for) and is geometry-budgeted to stay
// inside the r*2 viewBox: idle head-room above the body top is only ~0.26r
// and squash body width comes within ~0.02r of the side edges, so every
// part keeps its protrusion modest (checked by hand + the scratch SVG dump
// in tmp/smoosh-art-*.svg - see phase-c-task-4-report.md).
function partTag(kind, value, svg) {
    return (!value || value === 'none' || !svg) ? '' : `<g data-part="${kind}-${value}">${svg}</g>`;
}

function earsFrag(v, x) {
    const { r, cx, topY, bw, stroke, sw, body } = x;
    const ex = bw * 0.42, ey = topY + r * 0.02;
    if (v === 'round') return `<circle cx="${cx - ex}" cy="${ey - r * 0.12}" r="${r * 0.15}" fill="${body}" stroke="${stroke}" stroke-width="${sw * 0.45}"/><circle cx="${cx + ex}" cy="${ey - r * 0.12}" r="${r * 0.15}" fill="${body}" stroke="${stroke}" stroke-width="${sw * 0.45}"/>`;
    if (v === 'pointy') return `<path d="M${cx - ex - r * 0.12} ${ey} L${cx - ex} ${ey - r * 0.20} L${cx - ex + r * 0.14} ${ey - r * 0.02} Z" fill="${body}" stroke="${stroke}" stroke-width="${sw * 0.4}"/><path d="M${cx + ex + r * 0.12} ${ey} L${cx + ex} ${ey - r * 0.20} L${cx + ex - r * 0.14} ${ey - r * 0.02} Z" fill="${body}" stroke="${stroke}" stroke-width="${sw * 0.4}"/>`;
    if (v === 'long') return `<ellipse cx="${cx - ex}" cy="${ey - r * 0.04}" rx="${r * 0.10}" ry="${r * 0.18}" fill="${body}" stroke="${stroke}" stroke-width="${sw * 0.35}" transform="rotate(-10 ${cx - ex} ${ey - r * 0.04})"/><ellipse cx="${cx + ex}" cy="${ey - r * 0.04}" rx="${r * 0.10}" ry="${r * 0.18}" fill="${body}" stroke="${stroke}" stroke-width="${sw * 0.35}" transform="rotate(10 ${cx + ex} ${ey - r * 0.04})"/>`;
    if (v === 'stub') return `<circle cx="${cx - ex * 0.85}" cy="${ey}" r="${r * 0.08}" fill="${body}" stroke="${stroke}" stroke-width="${sw * 0.35}"/><circle cx="${cx + ex * 0.85}" cy="${ey}" r="${r * 0.08}" fill="${body}" stroke="${stroke}" stroke-width="${sw * 0.35}"/>`;
    return '';
}

function hornsFrag(v, x) {
    const { r, cx, topY, bw, stroke, sw } = x;
    const hx = bw * 0.4, hy = topY + r * 0.10;
    const ivory = '#fff7e0';
    if (v === 'nub') return `<circle cx="${cx - hx}" cy="${hy}" r="${r * 0.065}" fill="${ivory}" stroke="${stroke}" stroke-width="${sw * 0.4}"/><circle cx="${cx + hx}" cy="${hy}" r="${r * 0.065}" fill="${ivory}" stroke="${stroke}" stroke-width="${sw * 0.4}"/>`;
    if (v === 'curved') return `<path d="M${cx - hx} ${hy} q${-r * 0.10} ${-r * 0.16} ${r * 0.02} ${-r * 0.20}" stroke="${ivory}" stroke-width="${sw * 0.5}" fill="none" stroke-linecap="round"/><path d="M${cx + hx} ${hy} q${r * 0.10} ${-r * 0.16} ${-r * 0.02} ${-r * 0.20}" stroke="${ivory}" stroke-width="${sw * 0.5}" fill="none" stroke-linecap="round"/>`;
    if (v === 'spike') return `<path d="M${cx - hx} ${hy} l${-r * 0.09} ${-r * 0.18} l${r * 0.18} ${r * 0.05} Z" fill="${ivory}" stroke="${stroke}" stroke-width="${sw * 0.35}"/><path d="M${cx + hx} ${hy} l${r * 0.09} ${-r * 0.18} l${-r * 0.18} ${r * 0.05} Z" fill="${ivory}" stroke="${stroke}" stroke-width="${sw * 0.35}"/>`;
    return '';
}

function tailFrag(v, x) {
    const { r, cx, cy, bw, bh, stroke, sw, body } = x;
    const tx = cx + bw * 0.68, ty = cy + bh * 0.46;
    if (v === 'nub') return `<circle cx="${tx}" cy="${ty}" r="${r * 0.11}" fill="${body}" stroke="${stroke}" stroke-width="${sw * 0.4}"/>`;
    if (v === 'curly') return `<path d="M${tx} ${ty} q${r * 0.20} ${-r * 0.02} ${r * 0.16} ${-r * 0.20} q${-r * 0.12} ${r * 0.08} ${-r * 0.02} ${r * 0.20}" fill="none" stroke="${body}" stroke-width="${sw}" stroke-linecap="round"/>`;
    if (v === 'spike') return `<path d="M${tx} ${ty} l${r * 0.20} ${-r * 0.08} l${-r * 0.04} ${r * 0.16} Z" fill="${body}" stroke="${stroke}" stroke-width="${sw * 0.4}"/>`;
    return '';
}

function patternFrag(v, x) {
    const { r, cx, cy, bw, bh, deep } = x;
    if (v === 'spots') return `<circle cx="${cx - bw * 0.28}" cy="${cy - bh * 0.14}" r="${r * 0.065}" fill="${deep}" opacity=".5"/><circle cx="${cx + bw * 0.30}" cy="${cy - bh * 0.32}" r="${r * 0.05}" fill="${deep}" opacity=".5"/><circle cx="${cx + bw * 0.04}" cy="${cy - bh * 0.5}" r="${r * 0.04}" fill="${deep}" opacity=".5"/>`;
    if (v === 'stripes') return `<path d="M${cx - bw * 0.5} ${cy - bh * 0.26} q${bw * 0.18} ${bh * 0.12} ${bw * 0.36} 0 M${cx - bw * 0.32} ${cy - bh * 0.52} q${bw * 0.14} ${bh * 0.09} ${bw * 0.28} 0" stroke="${deep}" stroke-width="${r * 0.045}" fill="none" opacity=".45" stroke-linecap="round"/>`;
    if (v === 'belly-star') return `<path d="M${cx} ${cy + bh * 0.22} l${r * 0.045} ${r * 0.10} l${r * 0.11} ${r * 0.015} l${-r * 0.08} ${r * 0.075} l${r * 0.025} ${r * 0.11} l${-r * 0.10} ${-r * 0.065} l${-r * 0.10} ${r * 0.065} l${r * 0.025} ${-r * 0.11} l${-r * 0.08} ${-r * 0.075} l${r * 0.11} ${-r * 0.015} Z" fill="#ffffff" opacity=".85"/>`;
    if (v === 'freckles') return `<circle cx="${cx - bw * 0.46}" cy="${cy + bh * 0.02}" r="${r * 0.022}" fill="${deep}" opacity=".55"/><circle cx="${cx - bw * 0.38}" cy="${cy + bh * 0.12}" r="${r * 0.02}" fill="${deep}" opacity=".55"/><circle cx="${cx + bw * 0.46}" cy="${cy + bh * 0.02}" r="${r * 0.022}" fill="${deep}" opacity=".55"/><circle cx="${cx + bw * 0.38}" cy="${cy + bh * 0.12}" r="${r * 0.02}" fill="${deep}" opacity=".55"/>`;
    return '';
}

function hatFrag(v, x) {
    const { r, cx, topY, bw, stroke, sw, boss } = x;
    const s = boss ? 1.3 : 1;
    if (v === 'crown') return `<path d="M${cx - r * 0.34 * s} ${topY + r * 0.05} l${r * 0.09 * s} ${-r * 0.20 * s} l${r * 0.14 * s} ${r * 0.11 * s} l${r * 0.09 * s} ${-r * 0.18 * s} l${r * 0.09 * s} ${r * 0.18 * s} l${r * 0.14 * s} ${-r * 0.11 * s} l${r * 0.09 * s} ${r * 0.20 * s} Z" fill="#ffd54a" stroke="${stroke}" stroke-width="${sw * 0.5}"/>`;
    if (v === 'leaf') return `<path d="M${cx} ${topY + r * 0.05} q${r * 0.04} ${-r * 0.18 * s} ${r * 0.22 * s} ${-r * 0.20 * s} q${-r * 0.02} ${r * 0.16 * s} ${-r * 0.20 * s} ${r * 0.22 * s} Z" fill="#6fc46f" stroke="${stroke}" stroke-width="${sw * 0.35}"/>`;
    if (v === 'bow') return `<path d="M${cx} ${topY + r * 0.07} l${-r * 0.20} ${-r * 0.11} q${-r * 0.03} ${r * 0.12} 0 ${r * 0.16} Z M${cx} ${topY + r * 0.07} l${r * 0.20} ${-r * 0.11} q${r * 0.03} ${r * 0.12} 0 ${r * 0.16} Z" fill="#ff8fcf" stroke="${stroke}" stroke-width="${sw * 0.35}"/><circle cx="${cx}" cy="${topY + r * 0.07}" r="${r * 0.045}" fill="#ff5ec4" stroke="${stroke}" stroke-width="${sw * 0.4}"/>`;
    if (v === 'helmet') return `<path d="M${cx - bw * 0.6} ${topY + r * 0.14} a${bw * 0.6} ${r * 0.32} 0 0 1 ${bw * 1.2} 0 Z" fill="#c7cbd6" stroke="${stroke}" stroke-width="${sw * 0.45}"/><rect x="${cx - r * 0.05}" y="${topY - r * 0.02}" width="${r * 0.10}" height="${r * 0.12}" fill="#e8b74a" stroke="${stroke}" stroke-width="${sw * 0.4}"/>`;
    if (v === 'halo') return `<ellipse cx="${cx}" cy="${topY - r * 0.14 * s}" rx="${r * 0.22 * s}" ry="${r * 0.06 * s}" fill="none" stroke="#ffe066" stroke-width="${sw * 0.45}" opacity=".95"/>`;
    return '';
}

function auraFrag(v, x) {
    const { r, cx, cy, bw, bh, boss } = x;
    // Cap absolute radius (not just a body-relative factor) so the ring
    // still fits inside the viewBox in squash state, where bw is already
    // within ~0.02r of the canvas edge.
    const R = Math.min(Math.max(bw, bh) * 1.08, r * 0.92);
    const sw2 = boss ? r * 0.065 : r * 0.045;
    if (v === 'frost') return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#bfe8ff" stroke-width="${sw2}" opacity="${boss ? .65 : .5}" stroke-dasharray="${r * 0.08} ${r * 0.12}"/>`;
    if (v === 'spark') return `<path d="M${cx - R * 0.85} ${cy - bh * 0.1} l${r * 0.12} ${-r * 0.05} l${-r * 0.03} ${r * 0.12} M${cx + R * 0.7} ${cy - bh * 0.35} l${r * 0.12} ${-r * 0.05} l${-r * 0.03} ${r * 0.12}" stroke="#ffe066" stroke-width="${sw2}" fill="none" stroke-linecap="round" opacity="${boss ? .95 : .85}"/>`;
    if (v === 'shadow') return `<ellipse cx="${cx}" cy="${cy + bh * 0.15}" rx="${R}" ry="${bh * (boss ? 0.5 : 0.4)}" fill="#3a2f52" opacity="${boss ? .32 : .25}"/>`;
    if (v === 'gleam') return `<path d="M${cx + bw * 0.6} ${cy - bh * 0.6} l${r * 0.045} ${r * 0.10} l${r * 0.10} ${r * 0.045} l${-r * 0.10} ${r * 0.045} l${-r * 0.045} ${r * 0.10} l${-r * 0.045} ${-r * 0.10} l${-r * 0.10} ${-r * 0.045} l${r * 0.10} ${-r * 0.045} Z" fill="#ffffff" opacity="${boss ? 1 : .95}"/>`;
    return '';
}

// Paint one jelly SVG. r = radius; state = 'idle' | 'squash'.
// opts: { body, belly, deep, elem, alpha, boss,
//         face:'happy'|'grin'|'sleepy'|'angry'|'scared'|'greedy'|'king'|'love'|'wink',
//         ears:'none'|'round'|'pointy'|'long'|'stub',
//         horns:'none'|'nub'|'curved'|'spike',
//         tail:'none'|'nub'|'curly'|'spike',
//         pattern:'none'|'spots'|'stripes'|'belly-star'|'freckles',
//         hat:'none'|'crown'|'leaf'|'bow'|'helmet'|'halo',
//         aura:'none'|'frost'|'spark'|'shadow'|'gleam' }
// All six signature-part params default to 'none'; every rendered (non-none)
// fragment is wrapped in <g data-part="kind-value"> as a structural test
// hook. `boss` scales up hat/aura and is wired for the 'king' species only
// (the sole persistent kind:'boss' species with its own baked texture) -
// see phase-c-task-4-report.md "Boss variant" section for why rotation-
// promoted giant mobs don't use this flag.
//
// Migration from the old single `opts.accessory` slot:
//   crown->hat:crown, leaf->hat:leaf, horns->horns:spike, ears->ears:long,
//   shell->hat:helmet, coin->(dropped, goldie now uses hat:halo+aura:gleam),
//   splitline->pattern:stripes, zzz->(dropped, sleepy face already reads),
//   ring->aura:gleam, heart->pattern:belly-star+hat:bow, ice->aura:frost,
//   sparkle->aura:gleam, flame->(dropped), bubble->pattern:spots+aura:gleam.
function paintJelly(r, state, opts) {
    const d = r * 2;
    const squash = state === 'squash';
    const cx = r;
    // Squash: body flattens and widens; face sits lower.
    const bw = squash ? r * 0.98 : r * 0.82;   // body x-radius
    const bh = squash ? r * 0.58 : r * 0.80;   // body y-radius
    const cy = squash ? d - bh - r * 0.06 : r * 1.06;
    const eyeY = cy - bh * 0.12;
    const eyeDx = bw * 0.38;
    const eyeR = Math.max(3, r * 0.125); // v2.5 cuteness: BIG sparkly eyes
    const stroke = '#221a38';
    const sw = Math.max(3, r * 0.10);
    // rosy cheeks make everything tappable
    const blush = `<circle cx="${cx - eyeDx - eyeR * 1.7}" cy="${eyeY + eyeR * 1.7}" r="${eyeR * 1.05}" fill="#ff9ab5" opacity=".55"/><circle cx="${cx + eyeDx + eyeR * 1.7}" cy="${eyeY + eyeR * 1.7}" r="${eyeR * 1.05}" fill="#ff9ab5" opacity=".55"/>`;

    const bodyAlpha = opts.alpha !== undefined ? opts.alpha : 1;

    let face = '';
    if (squash) {
        // x_x eyes + poked-out tongue, universal "smooshed" face
        const x = eyeR * 1.15;
        face = `
  <path d="M${cx - eyeDx - x} ${eyeY - x} l${2 * x} ${2 * x} M${cx - eyeDx + x} ${eyeY - x} l${-2 * x} ${2 * x}" stroke="${stroke}" stroke-width="${sw * 0.7}" stroke-linecap="round"/>
  <path d="M${cx + eyeDx - x} ${eyeY - x} l${2 * x} ${2 * x} M${cx + eyeDx + x} ${eyeY - x} l${-2 * x} ${2 * x}" stroke="${stroke}" stroke-width="${sw * 0.7}" stroke-linecap="round"/>
  <ellipse cx="${cx}" cy="${eyeY + bh * 0.42}" rx="${r * 0.14}" ry="${r * 0.10}" fill="#ff8a9e"/>` + blush;
    } else {
        const mouthY = eyeY + bh * 0.34;
        const heart = (hx) =>
            `<path d="M${hx} ${eyeY + eyeR} C${hx - eyeR * 2} ${eyeY - eyeR * 0.6} ${hx - eyeR * 0.9} ${eyeY - eyeR * 2} ${hx} ${eyeY - eyeR * 0.6} C${hx + eyeR * 0.9} ${eyeY - eyeR * 2} ${hx + eyeR * 2} ${eyeY - eyeR * 0.6} ${hx} ${eyeY + eyeR} Z" fill="#ff5e7d"/>`;
        const eyes = (opts.face === 'sleepy')
            ? `<path d="M${cx - eyeDx - eyeR} ${eyeY} q${eyeR} ${eyeR} ${2 * eyeR} 0 M${cx + eyeDx - eyeR} ${eyeY} q${eyeR} ${eyeR} ${2 * eyeR} 0" stroke="${stroke}" stroke-width="${sw * 0.6}" fill="none" stroke-linecap="round"/>`
            : (opts.face === 'scared')
                ? `<circle cx="${cx - eyeDx}" cy="${eyeY}" r="${eyeR * 1.4}" fill="#fff"/><circle cx="${cx + eyeDx}" cy="${eyeY}" r="${eyeR * 1.4}" fill="#fff"/><circle cx="${cx - eyeDx}" cy="${eyeY}" r="${eyeR * 0.8}" fill="${stroke}"/><circle cx="${cx + eyeDx}" cy="${eyeY}" r="${eyeR * 0.8}" fill="${stroke}"/>`
                : (opts.face === 'love')
                    ? heart(cx - eyeDx) + heart(cx + eyeDx)
                    : (opts.face === 'wink')
                        ? `<circle cx="${cx - eyeDx}" cy="${eyeY}" r="${eyeR}" fill="${stroke}"/><path d="M${cx + eyeDx - eyeR} ${eyeY} q${eyeR} ${eyeR * 0.9} ${2 * eyeR} 0" stroke="${stroke}" stroke-width="${sw * 0.6}" fill="none" stroke-linecap="round"/>`
                        : `<circle cx="${cx - eyeDx}" cy="${eyeY}" r="${eyeR}" fill="${stroke}"/><circle cx="${cx + eyeDx}" cy="${eyeY}" r="${eyeR}" fill="${stroke}"/><circle cx="${cx - eyeDx + eyeR * 0.35}" cy="${eyeY - eyeR * 0.35}" r="${eyeR * 0.38}" fill="#fff"/><circle cx="${cx + eyeDx + eyeR * 0.35}" cy="${eyeY - eyeR * 0.35}" r="${eyeR * 0.38}" fill="#fff"/><circle cx="${cx - eyeDx - eyeR * 0.35}" cy="${eyeY + eyeR * 0.35}" r="${eyeR * 0.15}" fill="#fff" opacity=".85"/><circle cx="${cx + eyeDx - eyeR * 0.35}" cy="${eyeY + eyeR * 0.35}" r="${eyeR * 0.15}" fill="#fff" opacity=".85"/>`;
        const brows = (opts.face === 'angry')
            ? `<path d="M${cx - eyeDx - eyeR * 1.6} ${eyeY - eyeR * 2.4} l${eyeR * 2.6} ${eyeR * 1.1} M${cx + eyeDx + eyeR * 1.6} ${eyeY - eyeR * 2.4} l${-eyeR * 2.6} ${eyeR * 1.1}" stroke="${stroke}" stroke-width="${sw * 0.7}" stroke-linecap="round"/>` : '';
        const mouth = (opts.face === 'grin')
            ? `<path d="M${cx - r * 0.24} ${mouthY} q${r * 0.24} ${r * 0.26} ${r * 0.48} 0" stroke="${stroke}" stroke-width="${sw * 0.6}" fill="none" stroke-linecap="round"/>`
            : (opts.face === 'angry')
                ? `<path d="M${cx - r * 0.2} ${mouthY + r * 0.06} q${r * 0.2} ${-r * 0.16} ${r * 0.4} 0" stroke="${stroke}" stroke-width="${sw * 0.6}" fill="none" stroke-linecap="round"/>`
                : (opts.face === 'greedy')
                    ? `<ellipse cx="${cx}" cy="${mouthY}" rx="${r * 0.16}" ry="${r * 0.12}" fill="${stroke}"/>`
                    : `<path d="M${cx - r * 0.16} ${mouthY} q${r * 0.16} ${r * 0.14} ${r * 0.32} 0" stroke="${stroke}" stroke-width="${sw * 0.6}" fill="none" stroke-linecap="round"/>`;
        face = eyes + brows + mouth + blush;
    }

    const topY = cy - bh;
    const deep = opts.deep || shadeHex(opts.body, -0.35);
    const partCtx = { r, cx, cy, topY, bw, bh, stroke, sw, body: opts.body, deep, boss: !!opts.boss };

    const aura = partTag('aura', opts.aura, auraFrag(opts.aura, partCtx));
    const tail = partTag('tail', opts.tail, tailFrag(opts.tail, partCtx));
    const pattern = partTag('pattern', opts.pattern, patternFrag(opts.pattern, partCtx));
    const ears = partTag('ears', opts.ears, earsFrag(opts.ears, partCtx));
    const horns = partTag('horns', opts.horns, hornsFrag(opts.horns, partCtx));
    const hat = partTag('hat', opts.hat, hatFrag(opts.hat, partCtx));

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${d} ${d}">
  ${aura}
  ${tail}
  <g fill-opacity="${bodyAlpha}">
  <ellipse cx="${cx}" cy="${cy}" rx="${bw}" ry="${bh}" fill="${opts.body}" stroke="${stroke}" stroke-width="${sw}" stroke-opacity="${bodyAlpha}"/>
  <ellipse cx="${cx}" cy="${cy + bh * 0.38}" rx="${bw * 0.78}" ry="${bh * 0.42}" fill="${opts.belly}"/>
  <ellipse cx="${cx - bw * 0.42}" cy="${cy - bh * 0.42}" rx="${bw * 0.26}" ry="${bh * 0.18}" fill="#ffffff" opacity="0.55"/>
  </g>
  ${pattern}
  ${ears}
  ${horns}
  ${face}
  ${hat}
</svg>`;
}

// def carries elem/skill/attack (personality anchors); art carries the paint
// recipe. body/belly default to the def.elem pastel ramp (base/soft) blended
// toward deep by `art.tint` (0..1) so species sharing an element don't look
// identical - explicit art.body/art.belly still win if ever supplied.
// boss:true (currently only 'king') forces a deeper ramp (tint floor 0.75)
// on top of whatever paintJelly does with its own boss scaling.
// The recipe fields (ears/horns/tail/pattern/hat/aura/face/tint/boss/alpha)
// are spread onto the returned species object too - not just baked into the
// SVG strings - so tests (and any future tooling) can introspect the paint
// recipe directly instead of re-parsing markup.
function species(def, art) {
    const ramp = elemRamp(def.elem);
    const tint = art.tint !== undefined ? art.tint : 0.25;
    const effTint = art.boss ? Math.max(tint, 0.75) : tint;
    const body = art.body || (ramp ? mixHex(ramp.base, ramp.deep, effTint) : '#7dffb2');
    const belly = art.belly || (ramp ? mixHex(ramp.soft, ramp.deep, effTint * 0.5) : '#5fdd94');
    const deep = art.deep || (ramp ? ramp.deep : undefined);
    const paintOpts = Object.assign({}, art, { body, belly, deep });
    return Object.assign({}, def, art, {
        body, belly,
        color: parseInt(body.slice(1), 16), // body color for FX tinting
        svgIdle: paintJelly(def.radius, 'idle', paintOpts),
        svgSquash: paintJelly(def.radius, 'squash', paintOpts)
    });
}

// v4.0 Phase C Task 4: every recipe tuple (ears,horns,tail,pattern,hat,aura,
// face) is pairwise distinct from every other species in >=2 fields, and
// every species uses >=2 non-'none' signature parts (see tests/catalog.test.js
// "monster painter signature parts" block + phase-c-task-4-report.md's full
// 24-row table for the verified matrix).
//
// v6 Task 6 signature-skill pass: `skill` reassignments only (art untouched).
// hoppy: slow -> pull (new archetype - no chameleon/anteater species exists
// yet, per the task-6 brief a "hop toward prey + tongue lash" read is close
// enough to a frog/toad for the hopping mover to carry it; freed up `slow`
// down to blob's sole use). scaredy: dash -> critaura (was a dash-dup with
// mini; critaura was completely unused by any monster - "too jittery to
// fight but its nervous energy sharpens the squad's aim" reads fine for a
// coward and gives it its own distinct archetype). Remaining duplicate pairs
// (tank/shieldy=shield, twins/cloney=clone, drop/chunky=knockback,
// lovey/shysh=heal, splitter/king=summon) were left as-is on purpose - each
// pair is already a strong, deliberate personality fit on BOTH sides (e.g.
// "Twins" cloning itself, "Shieldy" wielding shield) and no test enforces
// monster-side uniqueness (only the pet distribution test below does), so
// reassigning either member for uniqueness's sake would trade a good fit for
// a forced one. See v6-task-6-report.md for the full audit.
const SPECIES = [
    // --- 10 regular mobs ---
    species({ id: 'blob',    name: 'Blob',    kind: 'mob', radius: 46, hpMult: 1.0, speed: 70,  move: 'amble',   goldMult: 1.0, attack: 'melee', elem: 'leaf', skill: 'slow' },
        { tint: 0.15, face: 'happy',  tail: 'nub',    pattern: 'spots' }),
    species({ id: 'mini',    name: 'Mini',    kind: 'mob', radius: 26, hpMult: 0.5, speed: 150, move: 'zigzag',  goldMult: 0.8, attack: 'melee', elem: 'wind', skill: 'dash' },
        { tint: 0.10, face: 'grin',   ears: 'pointy', pattern: 'stripes' }),
    species({ id: 'tank',    name: 'Tank',    kind: 'mob', radius: 64, hpMult: 4.0, speed: 36,  move: 'amble',   goldMult: 2.2, attack: 'slam', elem: 'water', skill: 'shield' },
        { tint: 0.80, face: 'angry',  tail: 'nub',    hat: 'helmet' }),
    species({ id: 'zippy',   name: 'Zippy',   kind: 'mob', radius: 34, hpMult: 0.8, speed: 120, move: 'dash',    goldMult: 1.2, attack: 'charge', elem: 'electric', skill: 'chain' },
        { tint: 0.15, face: 'grin',   ears: 'pointy', aura: 'spark' }),
    species({ id: 'scaredy', name: 'Scaredy', kind: 'mob', radius: 38, hpMult: 1.0, speed: 95,  move: 'flee',    goldMult: 1.5, attack: 'none', elem: 'wind', skill: 'critaura' },
        { tint: 0.0,  face: 'scared', ears: 'long',   pattern: 'freckles' }),
    species({ id: 'pudding', name: 'Pudding', kind: 'mob', radius: 54, hpMult: 2.0, speed: 55,  move: 'amble',   goldMult: 1.6, attack: 'slam', elem: 'fire', skill: 'taunt' },
        { tint: 0.25, face: 'happy',  ears: 'stub',   tail: 'curly',  pattern: 'stripes' }),
    species({ id: 'drop',    name: 'Drop',    kind: 'mob', radius: 30, hpMult: 0.7, speed: 110, move: 'zigzag',  goldMult: 1.0, attack: 'spray', elem: 'water', skill: 'knockback' },
        { tint: 0.10, face: 'happy',  ears: 'round',  tail: 'curly' }),
    species({ id: 'blinky',  name: 'Blinky',  kind: 'mob', radius: 40, hpMult: 1.2, speed: 80,  move: 'sleeper', goldMult: 1.3, attack: 'zap', elem: 'electric', skill: 'stun' },
        { tint: 0.50, face: 'sleepy', pattern: 'spots', aura: 'spark' }),
    species({ id: 'twins',   name: 'Twins',   kind: 'mob', radius: 36, hpMult: 0.9, speed: 85,  move: 'amble',   goldMult: 1.1, attack: 'melee', elem: 'wind', skill: 'clone' },
        { tint: 0.35, face: 'grin',   ears: 'round',  pattern: 'freckles' }),
    species({ id: 'grumpy',  name: 'Grumpy',  kind: 'mob', radius: 50, hpMult: 1.6, speed: 60,  move: 'dash',    goldMult: 1.5, attack: 'charge', elem: 'fire', skill: 'burn' },
        { tint: 0.65, face: 'angry',  horns: 'curved', tail: 'spike' }),

    // --- 10 v1.1 newcomers: cuter, weirder, trickier ---
    species({ id: 'ghosty',  name: 'Ghosty',  kind: 'mob', radius: 38, hpMult: 1.0, speed: 60,  move: 'amble',    goldMult: 1.8, attack: 'zap', quirk: 'phase', elem: 'dark', skill: 'stealth' },
        { tint: 0.05, face: 'sleepy', ears: 'none', tail: 'curly', aura: 'shadow', alpha: 0.8 }),
    species({ id: 'hoppy',   name: 'Hoppy',   kind: 'mob', radius: 34, hpMult: 0.9, speed: 115, move: 'hop',      goldMult: 1.2, attack: 'melee', elem: 'wind', skill: 'pull' },
        { tint: 0.50, face: 'grin',   ears: 'long',   tail: 'nub' }),
    species({ id: 'orbity',  name: 'Orbity',  kind: 'mob', radius: 36, hpMult: 1.1, speed: 85,  move: 'orbit',    goldMult: 1.3, attack: 'spit', elem: 'light', skill: 'buffaura' },
        { tint: 0.20, face: 'happy',  ears: 'round',  aura: 'gleam' }),
    species({ id: 'lovey',   name: 'Lovey',   kind: 'mob', radius: 34, hpMult: 0.8, speed: 70,  move: 'chase',    goldMult: 1.4, attack: 'melee', elem: 'light', skill: 'heal' },
        { tint: 0.35, face: 'love',   pattern: 'belly-star', hat: 'bow' }),
    species({ id: 'rocky',   name: 'Rocky',   kind: 'mob', radius: 30, hpMult: 0.7, speed: 220, move: 'ricochet', goldMult: 1.6, attack: 'charge', elem: 'leaf', skill: 'slam' },
        { tint: 0.55, face: 'grin',   horns: 'nub',   pattern: 'spots' }),
    species({ id: 'bubbly',  name: 'Bubbly',  kind: 'mob', radius: 40, hpMult: 0.8, speed: 55,  move: 'float',    goldMult: 1.2, attack: 'spit', elem: 'water', skill: 'poison' },
        { tint: 0.30, face: 'happy',  pattern: 'spots', aura: 'gleam' }),
    species({ id: 'shysh',   name: 'Shysh',   kind: 'mob', radius: 38, hpMult: 1.0, speed: 90,  move: 'amble',    goldMult: 1.7, attack: 'none', quirk: 'shy', elem: 'leaf', skill: 'heal' },
        { tint: 0.05, face: 'scared', ears: 'long',   hat: 'leaf' }),
    species({ id: 'cloney',  name: 'Cloney',  kind: 'mob', radius: 36, hpMult: 1.3, speed: 80,  move: 'amble',    goldMult: 1.8, attack: 'zap', quirk: 'blink', elem: 'dark', skill: 'clone' },
        { tint: 0.40, face: 'wink',   tail: 'spike',  aura: 'gleam' }),
    species({ id: 'freezy',  name: 'Freezy',  kind: 'mob', radius: 42, hpMult: 1.4, speed: 45,  move: 'amble',    goldMult: 1.6, attack: 'spit', quirk: 'ice', elem: 'ice', skill: 'freeze' },
        { tint: 0.30, face: 'sleepy', ears: 'long',   aura: 'frost' }),
    species({ id: 'chunky',  name: 'Chunky',  kind: 'mob', radius: 68, hpMult: 6.0, speed: 28,  move: 'amble',    goldMult: 3.0, attack: 'slam', elem: 'leaf', skill: 'knockback' },
        { tint: 0.75, face: 'happy',  horns: 'spike', tail: 'nub' }),

    // --- 4 specials ---
    species({ id: 'splitter', name: 'Splitter', kind: 'splitter', radius: 44, hpMult: 1.2, speed: 75, move: 'amble', goldMult: 1.2, attack: 'melee', childId: 'mini', elem: 'water', skill: 'summon' },
        { tint: 0.50, face: 'grin',   ears: 'round',  tail: 'curly', pattern: 'stripes' }),
    species({ id: 'shieldy',  name: 'Shieldy',  kind: 'shield',   radius: 48, hpMult: 1.5, speed: 50, move: 'amble', goldMult: 2.0, attack: 'slam', elem: 'light', skill: 'shield' },
        { tint: 0.55, face: 'angry',  horns: 'curved', hat: 'helmet' }),
    species({ id: 'goldie',   name: 'Goldie',   kind: 'jackpot',  radius: 36, hpMult: 1.0, speed: 240, move: 'flee', goldMult: 10, attack: 'none', despawnMs: 6000, elem: 'light', skill: 'goldaura' },
        { tint: 0.85, face: 'greedy', hat: 'halo',    aura: 'gleam' }),
    species({ id: 'king',     name: 'King Jelly', kind: 'boss',   radius: 240, hpMult: 1.0, speed: 25, move: 'amble', goldMult: 1.0, attack: 'slam', elem: 'dark', skill: 'summon' },
        { tint: 0.70, face: 'angry',  hat: 'crown',   aura: 'shadow', boss: true }),

    // --- 40 v6 Task 8 newcomers: an 8-element elemental cast (fire/water/
    // leaf/wind/electric/ice/light/dark), 5 apiece, rotating through a
    // swarmer/bruiser/flier/regal/oddball silhouette per element so parts
    // vary naturally instead of every same-element monster looking alike.
    // Every tuple was checked pairwise (>=2-field diff) against all 63 other
    // species by hand and confirmed by tests/catalog.test.js's exhaustive
    // check - see v6-task-8-report.md for the full 64x64 distinctness note
    // and the handful of near-miss pairs that forced a field swap. `pull`
    // (v6 Task 6's frog-tongue archetype) gets two more thematic carriers -
    // anglerfin's anglerfish lure and duskfang's anteater snout - joining
    // hoppy as the third and fourth users.
    species({ id: 'embit',      name: 'Embit',      kind: 'mob', radius: 26, hpMult: 0.55, speed: 145, move: 'zigzag',  goldMult: 1.0,  attack: 'melee', elem: 'fire', skill: 'burn' },
        { tint: 0.15, face: 'grin',   ears: 'pointy', tail: 'spike' }),
    species({ id: 'magmaw',     name: 'Magmaw',     kind: 'mob', radius: 62, hpMult: 3.6,  speed: 40,  move: 'amble',   goldMult: 2.1,  attack: 'slam',  elem: 'fire', skill: 'rage' },
        { tint: 0.70, face: 'angry',  tail: 'spike', pattern: 'stripes' }),
    species({ id: 'cinderwing', name: 'Cinderwing', kind: 'mob', radius: 32, hpMult: 0.8,  speed: 95,  move: 'float',   goldMult: 1.3,  attack: 'spit',  elem: 'fire', skill: 'execute' },
        { tint: 0.35, face: 'wink',   pattern: 'freckles', aura: 'gleam' }),
    species({ id: 'scorchess',  name: 'Scorchess',  kind: 'mob', radius: 44, hpMult: 1.3,  speed: 78,  move: 'dash',    goldMult: 1.8,  attack: 'charge', elem: 'fire', skill: 'buffaura' },
        { tint: 0.55, face: 'king',   horns: 'spike', hat: 'helmet' }),
    species({ id: 'ashghast',   name: 'Ashghast',   kind: 'mob', radius: 36, hpMult: 1.0,  speed: 65,  move: 'sleeper', goldMult: 1.9,  attack: 'zap', quirk: 'phase', elem: 'fire', skill: 'stealth' },
        { tint: 0.15, face: 'sleepy', pattern: 'freckles', aura: 'shadow', alpha: 0.75 }),

    species({ id: 'dribblet',   name: 'Dribblet',   kind: 'mob', radius: 28, hpMult: 0.6,  speed: 130, move: 'zigzag',  goldMult: 1.0,  attack: 'spray', elem: 'water', skill: 'slow' },
        { tint: 0.15, face: 'happy',  ears: 'round',  pattern: 'spots' }),
    species({ id: 'tidalump',   name: 'Tidalump',   kind: 'mob', radius: 60, hpMult: 3.8,  speed: 38,  move: 'amble',   goldMult: 2.2,  attack: 'slam',  elem: 'water', skill: 'knockback' },
        { tint: 0.75, face: 'angry',  horns: 'nub',   tail: 'curly' }),
    species({ id: 'finling',    name: 'Finling',    kind: 'mob', radius: 34, hpMult: 0.9,  speed: 60,  move: 'float',   goldMult: 1.4,  attack: 'spit',  elem: 'water', skill: 'heal' },
        { tint: 0.30, face: 'happy',  ears: 'long',   tail: 'nub', aura: 'gleam' }),
    species({ id: 'pearlessa',  name: 'Pearlessa',  kind: 'mob', radius: 40, hpMult: 1.2,  speed: 70,  move: 'orbit',   goldMult: 1.7,  attack: 'spray', elem: 'water', skill: 'heal' },
        { tint: 0.45, face: 'happy',  hat: 'halo',    pattern: 'belly-star' }),
    species({ id: 'anglerfin',  name: 'Anglerfin',  kind: 'mob', radius: 34, hpMult: 1.1,  speed: 50,  move: 'sleeper', goldMult: 1.6,  attack: 'melee', elem: 'water', skill: 'pull' },
        { tint: 0.60, face: 'grin',   horns: 'nub',   tail: 'spike', aura: 'shadow' }),

    species({ id: 'sprigby',    name: 'Sprigby',    kind: 'mob', radius: 27, hpMult: 0.55, speed: 135, move: 'zigzag',  goldMult: 1.0,  attack: 'melee', elem: 'leaf', skill: 'dash' },
        { tint: 0.15, face: 'happy',  ears: 'pointy', tail: 'nub' }),
    species({ id: 'brambull',   name: 'Brambull',   kind: 'mob', radius: 64, hpMult: 4.0,  speed: 35,  move: 'amble',   goldMult: 2.3,  attack: 'slam',  elem: 'leaf', skill: 'taunt' },
        { tint: 0.70, face: 'angry',  horns: 'nub',   tail: 'spike', hat: 'helmet' }),
    species({ id: 'thornel',    name: 'Thornel',    kind: 'mob', radius: 32, hpMult: 0.85, speed: 80,  move: 'float',   goldMult: 1.3,  attack: 'spit',  elem: 'leaf', skill: 'lifesteal' },
        { tint: 0.35, face: 'grin',   tail: 'curly',  aura: 'gleam' }),
    species({ id: 'mossking',   name: 'Mossking',   kind: 'mob', radius: 46, hpMult: 1.5,  speed: 60,  move: 'amble',   goldMult: 2.0,  attack: 'melee', elem: 'leaf', skill: 'goldaura' },
        { tint: 0.50, face: 'grin',   hat: 'crown',   pattern: 'freckles' }),
    species({ id: 'bogwisp',    name: 'Bogwisp',    kind: 'mob', radius: 38, hpMult: 1.05, speed: 55,  move: 'sleeper', goldMult: 1.8,  attack: 'spit', quirk: 'shy', elem: 'leaf', skill: 'poison' },
        { tint: 0.10, face: 'scared', ears: 'stub',   aura: 'shadow' }),

    species({ id: 'gustlet',    name: 'Gustlet',    kind: 'mob', radius: 25, hpMult: 0.5,  speed: 150, move: 'zigzag',  goldMult: 1.0,  attack: 'melee', elem: 'wind', skill: 'chain' },
        { tint: 0.15, face: 'happy',  ears: 'stub',   tail: 'curly', aura: 'spark' }),
    species({ id: 'gale',       name: 'Gale',       kind: 'mob', radius: 58, hpMult: 3.2,  speed: 70,  move: 'dash',    goldMult: 2.0,  attack: 'charge', elem: 'wind', skill: 'slam' },
        { tint: 0.60, face: 'angry',  horns: 'spike', pattern: 'stripes' }),
    species({ id: 'skyferry',   name: 'Skyferry',   kind: 'mob', radius: 33, hpMult: 0.8,  speed: 100, move: 'float',   goldMult: 1.4,  attack: 'spit',  elem: 'wind', skill: 'buffaura' },
        { tint: 0.40, face: 'wink',   ears: 'long',   aura: 'spark' }),
    species({ id: 'zephyrex',   name: 'Zephyrex',   kind: 'mob', radius: 37, hpMult: 1.1,  speed: 85,  move: 'orbit',   goldMult: 1.6,  attack: 'spray', elem: 'wind', skill: 'critaura' },
        { tint: 0.50, face: 'grin',   hat: 'halo',    pattern: 'spots' }),
    species({ id: 'hushwind',   name: 'Hushwind',   kind: 'mob', radius: 35, hpMult: 0.95, speed: 60,  move: 'sleeper', goldMult: 1.75, attack: 'zap', quirk: 'blink', elem: 'wind', skill: 'freeze' },
        { tint: 0.20, face: 'scared', ears: 'stub',   tail: 'curly', aura: 'frost' }),

    species({ id: 'sparkitten', name: 'Sparkitten', kind: 'mob', radius: 26, hpMult: 0.55, speed: 140, move: 'zigzag',  goldMult: 1.0,  attack: 'zap',   elem: 'electric', skill: 'stun' },
        { tint: 0.20, face: 'wink',   ears: 'round',  tail: 'nub', aura: 'spark' }),
    species({ id: 'voltox',     name: 'Voltox',     kind: 'mob', radius: 56, hpMult: 3.0,  speed: 80,  move: 'dash',    goldMult: 1.9,  attack: 'charge', elem: 'electric', skill: 'shield' },
        { tint: 0.65, face: 'angry',  horns: 'nub',   aura: 'spark' }),
    species({ id: 'circuitina', name: 'Circuitina', kind: 'mob', radius: 34, hpMult: 0.85, speed: 90,  move: 'orbit',   goldMult: 1.5,  attack: 'spit',  elem: 'electric', skill: 'critaura' },
        { tint: 0.40, face: 'wink',   pattern: 'stripes', aura: 'spark' }),
    species({ id: 'thundrake',  name: 'Thundrake',  kind: 'mob', radius: 50, hpMult: 1.6,  speed: 75,  move: 'dash',    goldMult: 2.1,  attack: 'charge', elem: 'electric', skill: 'execute' },
        { tint: 0.55, face: 'angry',  horns: 'spike', hat: 'crown' }),
    species({ id: 'staticmoth', name: 'Staticmoth', kind: 'mob', radius: 30, hpMult: 0.75, speed: 100, move: 'chase',   goldMult: 1.65, attack: 'zap', quirk: 'blink', elem: 'electric', skill: 'lifesteal' },
        { tint: 0.30, face: 'grin',   ears: 'long',   pattern: 'spots', aura: 'spark' }),

    species({ id: 'chilla',     name: 'Chilla',     kind: 'mob', radius: 27, hpMult: 0.6,  speed: 125, move: 'zigzag',  goldMult: 1.05, attack: 'spit',  elem: 'ice', skill: 'freeze' },
        { tint: 0.25, face: 'happy',  ears: 'pointy', aura: 'frost' }),
    species({ id: 'glacior',    name: 'Glacior',    kind: 'mob', radius: 60, hpMult: 3.5,  speed: 34,  move: 'amble',   goldMult: 2.2,  attack: 'slam',  elem: 'ice', skill: 'taunt' },
        { tint: 0.65, face: 'angry',  horns: 'curved', aura: 'frost' }),
    species({ id: 'frostwing',  name: 'Frostwing',  kind: 'mob', radius: 33, hpMult: 0.85, speed: 70,  move: 'float',   goldMult: 1.35, attack: 'spray', elem: 'ice', skill: 'heal' },
        { tint: 0.35, face: 'happy',  tail: 'curly',  aura: 'frost' }),
    species({ id: 'iceira',     name: 'Iceira',     kind: 'mob', radius: 42, hpMult: 1.25, speed: 65,  move: 'orbit',   goldMult: 1.85, attack: 'zap',   elem: 'ice', skill: 'buffaura' },
        { tint: 0.50, face: 'happy',  hat: 'halo',    tail: 'nub', aura: 'frost' }),
    species({ id: 'shiverling', name: 'Shiverling', kind: 'mob', radius: 32, hpMult: 0.9,  speed: 50,  move: 'sleeper', goldMult: 1.6,  attack: 'none', quirk: 'ice', elem: 'ice', skill: 'slow' },
        { tint: 0.15, face: 'sleepy', ears: 'stub',   tail: 'nub', aura: 'frost' }),

    species({ id: 'glimmite',   name: 'Glimmite',   kind: 'mob', radius: 26, hpMult: 0.55, speed: 135, move: 'zigzag',  goldMult: 1.15, attack: 'melee', elem: 'light', skill: 'goldaura' },
        { tint: 0.20, face: 'wink',   ears: 'round',  pattern: 'belly-star' }),
    species({ id: 'seraphume',  name: 'Seraphume',  kind: 'mob', radius: 52, hpMult: 1.7,  speed: 68,  move: 'dash',    goldMult: 2.0,  attack: 'charge', elem: 'light', skill: 'shield' },
        { tint: 0.45, face: 'love',   horns: 'spike', hat: 'halo' }),
    species({ id: 'sundrop',    name: 'Sundrop',    kind: 'mob', radius: 31, hpMult: 0.8,  speed: 88,  move: 'float',   goldMult: 1.4,  attack: 'spray', elem: 'light', skill: 'critaura' },
        { tint: 0.30, face: 'grin',   tail: 'nub',    pattern: 'spots', aura: 'gleam' }),
    species({ id: 'haloghost',  name: 'Haloghost',  kind: 'mob', radius: 36, hpMult: 1.0,  speed: 58,  move: 'sleeper', goldMult: 1.95, attack: 'zap', quirk: 'phase', elem: 'light', skill: 'stealth' },
        { tint: 0.15, face: 'sleepy', hat: 'halo',    aura: 'shadow' }),
    species({ id: 'beamy',      name: 'Beamy',      kind: 'mob', radius: 35, hpMult: 0.85, speed: 66,  move: 'orbit',   goldMult: 1.5,  attack: 'none', elem: 'light', skill: 'buffaura' },
        { tint: 0.35, face: 'love',   hat: 'bow',     aura: 'gleam' }),

    species({ id: 'shadowlet',  name: 'Shadowlet',  kind: 'mob', radius: 27, hpMult: 0.6,  speed: 130, move: 'zigzag',  goldMult: 1.15, attack: 'melee', elem: 'dark', skill: 'lifesteal' },
        { tint: 0.20, face: 'wink',   ears: 'pointy', aura: 'shadow' }),
    species({ id: 'voidmaw',    name: 'Voidmaw',    kind: 'mob', radius: 59, hpMult: 3.4,  speed: 42,  move: 'amble',   goldMult: 2.15, attack: 'slam',  elem: 'dark', skill: 'execute' },
        { tint: 0.70, face: 'angry',  horns: 'curved', pattern: 'freckles' }),
    species({ id: 'wraithkite', name: 'Wraithkite', kind: 'mob', radius: 32, hpMult: 0.85, speed: 82,  move: 'float',   goldMult: 1.45, attack: 'spit',  elem: 'dark', skill: 'poison' },
        { tint: 0.40, face: 'scared', tail: 'spike',  aura: 'shadow' }),
    species({ id: 'nightqueen', name: 'Nightqueen', kind: 'mob', radius: 45, hpMult: 1.4,  speed: 72,  move: 'dash',    goldMult: 1.9,  attack: 'charge', elem: 'dark', skill: 'critaura' },
        { tint: 0.55, face: 'love',   hat: 'crown',   horns: 'nub' }),
    species({ id: 'duskfang',   name: 'Duskfang',   kind: 'mob', radius: 38, hpMult: 1.15, speed: 55,  move: 'sleeper', goldMult: 1.7,  attack: 'melee', elem: 'dark', skill: 'pull' },
        { tint: 0.35, face: 'angry',  ears: 'long',   tail: 'spike' })
];

// =============================================================================
// v2.1 - PET ANIMALS: 50 adorable round critters, painted parametrically.
// Element counters: v3.0 8-element chart (fire/water/leaf/wind/electric/ice/
// light/dark), 1.5 strong / 0.7 weak - see Balance.elementMult.
// =============================================================================

// v4.0 Phase C Task 5: pet painter surgery - same signature-part pattern as
// paintJelly() (see its doc comment above): `pattern`, `prop` and `tailStyle`
// are new slots, each non-'none' fragment wrapped in <g data-part="kind-
// value"> via the shared partTag() helper. `ear` (pre-existing) gets the
// same data-part treatment for architectural symmetry. Fragment builders
// below take (v, x) where x is a partCtx: { r, br, cx, cy, eyeY, eyeDx,
// eyeR, mouthY, stroke, sw, body, belly, earIn } - `earIn` doubles as the
// pattern accent color (matches the pre-existing nose-color usage below).
// Tails use `body`, not `earIn` - see petTailFrag. No thematic (non-black)
// strokes are used in any new fragment - only fills vary - so no deviation
// to document there.
//
// One cute round animal. r = radius. o = { body, belly, ear, earIn, pattern,
// prop, tailStyle, mouth, extra }
//   ear:      round|pointy|long|floppy|horn|antenna|fin|tuft|wing|none
//   pattern:  none|spots|stripes|patch|mask|star
//   prop:     none|bow|scarf|flower|leaf|goggles|bell
//   tailStyle:none|puff|curly|long|fin|feather
//   mouth:    w|smile|beak|open
//   extra:    none|whiskers|mane|tusk|antler|sparkle
// (`extra`'s old 'tail' value was retired in favor of the dedicated
// `tailStyle` slot - see animal() migration note below.)
function petEarFrag(v, x) {
    const { cx, cy, br, stroke: S, sw, body, earIn } = x;
    const ears = {
        round:  `<circle cx="${cx - br * 0.62}" cy="${cy - br * 0.78}" r="${br * 0.3}" fill="${body}" stroke="${S}" stroke-width="${sw}"/><circle cx="${cx + br * 0.62}" cy="${cy - br * 0.78}" r="${br * 0.3}" fill="${body}" stroke="${S}" stroke-width="${sw}"/><circle cx="${cx - br * 0.62}" cy="${cy - br * 0.78}" r="${br * 0.15}" fill="${earIn}"/><circle cx="${cx + br * 0.62}" cy="${cy - br * 0.78}" r="${br * 0.15}" fill="${earIn}"/>`,
        pointy: `<path d="M${cx - br * 0.85} ${cy - br * 0.45} L${cx - br * 0.65} ${cy - br * 1.15} L${cx - br * 0.25} ${cy - br * 0.75} Z" fill="${body}" stroke="${S}" stroke-width="${sw}"/><path d="M${cx + br * 0.85} ${cy - br * 0.45} L${cx + br * 0.65} ${cy - br * 1.15} L${cx + br * 0.25} ${cy - br * 0.75} Z" fill="${body}" stroke="${S}" stroke-width="${sw}"/><path d="M${cx - br * 0.7} ${cy - br * 0.62} L${cx - br * 0.62} ${cy - br * 0.95} L${cx - br * 0.42} ${cy - br * 0.72} Z" fill="${earIn}"/><path d="M${cx + br * 0.7} ${cy - br * 0.62} L${cx + br * 0.62} ${cy - br * 0.95} L${cx + br * 0.42} ${cy - br * 0.72} Z" fill="${earIn}"/>`,
        long:   `<ellipse cx="${cx - br * 0.42}" cy="${cy - br * 1.0}" rx="${br * 0.2}" ry="${br * 0.55}" fill="${body}" stroke="${S}" stroke-width="${sw}" transform="rotate(-10 ${cx - br * 0.42} ${cy - br * 1.0})"/><ellipse cx="${cx + br * 0.42}" cy="${cy - br * 1.0}" rx="${br * 0.2}" ry="${br * 0.55}" fill="${body}" stroke="${S}" stroke-width="${sw}" transform="rotate(10 ${cx + br * 0.42} ${cy - br * 1.0})"/><ellipse cx="${cx - br * 0.42}" cy="${cy - br * 1.0}" rx="${br * 0.09}" ry="${br * 0.38}" fill="${earIn}" transform="rotate(-10 ${cx - br * 0.42} ${cy - br * 1.0})"/><ellipse cx="${cx + br * 0.42}" cy="${cy - br * 1.0}" rx="${br * 0.09}" ry="${br * 0.38}" fill="${earIn}" transform="rotate(10 ${cx + br * 0.42} ${cy - br * 1.0})"/>`,
        floppy: `<ellipse cx="${cx - br * 0.8}" cy="${cy - br * 0.2}" rx="${br * 0.24}" ry="${br * 0.5}" fill="${earIn}" stroke="${S}" stroke-width="${sw}" transform="rotate(18 ${cx - br * 0.8} ${cy - br * 0.2})"/><ellipse cx="${cx + br * 0.8}" cy="${cy - br * 0.2}" rx="${br * 0.24}" ry="${br * 0.5}" fill="${earIn}" stroke="${S}" stroke-width="${sw}" transform="rotate(-18 ${cx + br * 0.8} ${cy - br * 0.2})"/>`,
        horn:   `<path d="M${cx - br * 0.4} ${cy - br * 0.85} L${cx - br * 0.5} ${cy - br * 1.25} L${cx - br * 0.15} ${cy - br * 0.95} Z" fill="#ffe9a8" stroke="${S}" stroke-width="${sw * 0.8}"/><path d="M${cx + br * 0.4} ${cy - br * 0.85} L${cx + br * 0.5} ${cy - br * 1.25} L${cx + br * 0.15} ${cy - br * 0.95} Z" fill="#ffe9a8" stroke="${S}" stroke-width="${sw * 0.8}"/>`,
        antenna:`<path d="M${cx - br * 0.3} ${cy - br * 0.8} q${-br * 0.15} ${-br * 0.5} ${-br * 0.35} ${-br * 0.55}" stroke="${S}" stroke-width="${sw * 0.7}" fill="none"/><circle cx="${cx - br * 0.68}" cy="${cy - br * 1.36}" r="${br * 0.12}" fill="${earIn}" stroke="${S}" stroke-width="${sw * 0.5}"/><path d="M${cx + br * 0.3} ${cy - br * 0.8} q${br * 0.15} ${-br * 0.5} ${br * 0.35} ${-br * 0.55}" stroke="${S}" stroke-width="${sw * 0.7}" fill="none"/><circle cx="${cx + br * 0.68}" cy="${cy - br * 1.36}" r="${br * 0.12}" fill="${earIn}" stroke="${S}" stroke-width="${sw * 0.5}"/>`,
        fin:    `<path d="M${cx} ${cy - br * 0.8} L${cx - br * 0.22} ${cy - br * 1.25} L${cx + br * 0.22} ${cy - br * 1.25} Z" fill="${earIn}" stroke="${S}" stroke-width="${sw * 0.8}"/>`,
        tuft:   `<path d="M${cx - br * 0.25} ${cy - br * 0.82} q${br * 0.1} ${-br * 0.4} ${br * 0.25} ${-br * 0.42} q${br * 0.15} ${br * 0.02} ${br * 0.25} ${br * 0.42} Z" fill="${earIn}" stroke="${S}" stroke-width="${sw * 0.7}"/>`,
        wing:   `<ellipse cx="${cx - br * 0.95}" cy="${cy}" rx="${br * 0.22}" ry="${br * 0.42}" fill="${earIn}" stroke="${S}" stroke-width="${sw * 0.8}"/><ellipse cx="${cx + br * 0.95}" cy="${cy}" rx="${br * 0.22}" ry="${br * 0.42}" fill="${earIn}" stroke="${S}" stroke-width="${sw * 0.8}"/>`
    };
    return ears[v] || '';
}

function petPatternFrag(v, x) {
    const { cx, cy, br, r, sw, earIn, eyeY, eyeDx, eyeR } = x;
    if (v === 'spots') return `<circle cx="${cx - br * 0.45}" cy="${cy - br * 0.3}" r="${br * 0.12}" fill="${earIn}" opacity=".8"/><circle cx="${cx + br * 0.5}" cy="${cy - br * 0.15}" r="${br * 0.1}" fill="${earIn}" opacity=".8"/><circle cx="${cx + br * 0.2}" cy="${cy - br * 0.55}" r="${br * 0.08}" fill="${earIn}" opacity=".8"/>`;
    if (v === 'stripes') return `<path d="M${cx - br * 0.75} ${cy - br * 0.5} q${br * 0.2} ${br * 0.12} ${br * 0.36} 0 M${cx + br * 0.75} ${cy - br * 0.5} q${-br * 0.2} ${br * 0.12} ${-br * 0.36} 0 M${cx - br * 0.2} ${cy - br * 0.78} q${br * 0.2} ${br * 0.1} ${br * 0.4} 0" stroke="${earIn}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
    if (v === 'patch') return `<ellipse cx="${cx + br * 0.42}" cy="${cy + br * 0.04}" rx="${br * 0.3}" ry="${br * 0.36}" fill="${earIn}" opacity=".85" transform="rotate(-8 ${cx + br * 0.42} ${cy + br * 0.04})"/>`;
    if (v === 'mask') return `<ellipse cx="${cx - eyeDx}" cy="${eyeY}" rx="${eyeR * 2.1}" ry="${eyeR * 1.7}" fill="${earIn}" opacity=".85"/><ellipse cx="${cx + eyeDx}" cy="${eyeY}" rx="${eyeR * 2.1}" ry="${eyeR * 1.7}" fill="${earIn}" opacity=".85"/>`;
    if (v === 'star') return `<path d="M${cx} ${cy + br * 0.32} l${r * 0.05} ${r * 0.11} l${r * 0.12} ${r * 0.02} l${-r * 0.09} ${r * 0.08} l${r * 0.03} ${r * 0.12} l${-r * 0.11} ${-r * 0.07} l${-r * 0.11} ${r * 0.07} l${r * 0.03} ${-r * 0.12} l${-r * 0.09} ${-r * 0.08} l${r * 0.12} ${-r * 0.02} Z" fill="#ffffff" opacity=".9"/>`;
    return '';
}

// v4.0 Phase C Task 6: close-up (r=90 dex-detail) scaling pass - several
// minor-accent strokes here used to be fixed low fractions of `sw` (0.25-
// 0.35), which read fine at the production r=24 but drop under the 3px
// close-up floor once this art gets rendered bigger (see tests/catalog.test.js
// "r=90 close-up scaling"). Normalized every previously-too-thin stroke to
// sw*0.4 (the smallest ratio that clears 3px at r=90) instead of hand-tuning
// each one separately. `scarf`'s neck-band was the one non-sw, r-direct
// stroke (r*0.16, ~14.4px at r=90) - thinned to r*0.11 to fit the r*0.12
// upper-bound cap. `goggles`'s strap also switched from a hardcoded
// '#2a2a34' to the shared `S` (partCtx.stroke) so it recolors with the rest
// of the character ink instead of drifting from it.
function petPropFrag(v, x) {
    const { cx, cy, br, r, sw, stroke: S, eyeY, eyeDx, eyeR } = x;
    const topY = cy - br;
    if (v === 'bow') return `<path d="M${cx} ${topY + r * 0.08} l${-r * 0.16} ${-r * 0.09} q${-r * 0.02} ${r * 0.10} 0 ${r * 0.13} Z M${cx} ${topY + r * 0.08} l${r * 0.16} ${-r * 0.09} q${r * 0.02} ${r * 0.10} 0 ${r * 0.13} Z" fill="#ff8fcf" stroke="${S}" stroke-width="${sw * 0.4}"/><circle cx="${cx}" cy="${topY + r * 0.08}" r="${r * 0.04}" fill="#ff5ec4" stroke="${S}" stroke-width="${sw * 0.4}"/>`;
    if (v === 'flower') {
        const fx = cx - br * 0.55, fy = topY + r * 0.28, pr = r * 0.065;
        const petal = (dx, dy) => `<circle cx="${fx + dx}" cy="${fy + dy}" r="${pr}" fill="#fff0b8" stroke="${S}" stroke-width="${sw * 0.4}"/>`;
        return petal(0, -pr * 1.5) + petal(0, pr * 1.5) + petal(-pr * 1.5, 0) + petal(pr * 1.5, 0) + `<circle cx="${fx}" cy="${fy}" r="${pr * 0.85}" fill="#ffb547"/>`;
    }
    if (v === 'leaf') return `<path d="M${cx} ${topY + r * 0.1} q${r * 0.03} ${-r * 0.14} ${r * 0.16} ${-r * 0.16} q${-r * 0.01} ${r * 0.13} ${-r * 0.16} ${r * 0.16} Z" fill="#6fc46f" stroke="${S}" stroke-width="${sw * 0.4}"/>`;
    if (v === 'goggles') return `<path d="M${cx - eyeDx - eyeR * 1.6} ${eyeY} h${2 * (eyeDx + eyeR * 1.6)}" stroke="${S}" stroke-width="${sw * 0.5}"/><circle cx="${cx - eyeDx}" cy="${eyeY}" r="${eyeR * 1.55}" fill="#bfe8ff" fill-opacity=".55" stroke="${S}" stroke-width="${sw * 0.4}"/><circle cx="${cx + eyeDx}" cy="${eyeY}" r="${eyeR * 1.55}" fill="#bfe8ff" fill-opacity=".55" stroke="${S}" stroke-width="${sw * 0.4}"/>`;
    if (v === 'scarf') return `<path d="M${cx - br * 0.6} ${cy + br * 0.5} q${br * 0.6} ${br * 0.34} ${br * 1.2} 0" stroke="#ff6f61" stroke-width="${r * 0.11}" fill="none" stroke-linecap="round"/><path d="M${cx + br * 0.18} ${cy + br * 0.62} l${r * 0.03} ${r * 0.16} l${r * 0.12} ${-r * 0.02} Z" fill="#e0554a" stroke="${S}" stroke-width="${sw * 0.4}"/>`;
    if (v === 'bell') return `<path d="M${cx - br * 0.15} ${cy + br * 0.56} q${br * 0.15} ${br * 0.12} ${br * 0.3} 0" stroke="${S}" stroke-width="${sw * 0.4}" fill="none"/><circle cx="${cx}" cy="${cy + br * 0.72}" r="${r * 0.09}" fill="#ffd54a" stroke="${S}" stroke-width="${sw * 0.4}"/><path d="M${cx - r * 0.03} ${cy + br * 0.72} h${r * 0.06}" stroke="${S}" stroke-width="${sw * 0.4}"/>`;
    return '';
}

function petTailFrag(v, x) {
    const { cx, cy, br, r, sw, stroke: S, body } = x;
    const tx = cx + br * 0.9, ty = cy + br * 0.35;
    if (v === 'puff') return `<circle cx="${tx}" cy="${ty}" r="${r * 0.2}" fill="${body}" stroke="${S}" stroke-width="${sw * 0.5}"/><circle cx="${tx + r * 0.07}" cy="${ty - r * 0.13}" r="${r * 0.13}" fill="${body}" stroke="${S}" stroke-width="${sw * 0.4}"/>`;
    if (v === 'curly') return `<path d="M${tx} ${ty} q${r * 0.45} ${-r * 0.1} ${r * 0.3} ${-r * 0.5}" stroke="${body}" stroke-width="${sw * 1.3}" fill="none" stroke-linecap="round"/>`;
    if (v === 'long') return `<path d="M${tx} ${ty} q${r * 0.32} ${r * 0.02} ${r * 0.4} ${-r * 0.32} q${r * 0.06} ${-r * 0.24} ${-r * 0.1} ${-r * 0.34}" stroke="${body}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
    if (v === 'fin') return `<path d="M${tx} ${ty - r * 0.08} l${r * 0.22} ${r * 0.02} l${-r * 0.1} ${r * 0.2} Z" fill="${body}" stroke="${S}" stroke-width="${sw * 0.4}"/>`;
    if (v === 'feather') return `<path d="M${tx} ${ty} l${r * 0.26} ${-r * 0.06} M${tx} ${ty} l${r * 0.24} ${r * 0.06} M${tx} ${ty} l${r * 0.2} ${-r * 0.22}" stroke="${body}" stroke-width="${sw * 0.7}" fill="none" stroke-linecap="round"/>`;
    return '';
}

function paintAnimal(r, o) {
    const d = r * 2, cx = r, cy = r * 1.08;
    const br = r * 0.82;                       // body radius
    const S = '#221a38';                       // outline
    const sw = Math.max(2.5, r * 0.09);
    const eyeY = cy - br * 0.14, eyeDx = br * 0.4;
    const eyeR = Math.max(3, r * 0.135); // v2.5: bigger puppy eyes

    const partCtx = { r, br, cx, cy, eyeY, eyeDx, eyeR, stroke: S, sw, body: o.body, belly: o.belly, earIn: o.earIn };
    const ear = partTag('ear', o.ear, petEarFrag(o.ear, partCtx));
    const pattern = partTag('pattern', o.pattern, petPatternFrag(o.pattern, partCtx));
    const prop = partTag('prop', o.prop, petPropFrag(o.prop, partCtx));
    const tailStyle = partTag('tailStyle', o.tailStyle, petTailFrag(o.tailStyle, partCtx));

    const mouthY = cy + br * 0.28;
    const mouths = {
        w:     `<path d="M${cx - r * 0.14} ${mouthY} q${r * 0.07} ${r * 0.1} ${r * 0.14} 0 q${r * 0.07} ${r * 0.1} ${r * 0.14} 0" stroke="${S}" stroke-width="${sw * 0.6}" fill="none" stroke-linecap="round" transform="translate(${-r * 0.07} 0)"/>`,
        smile: `<path d="M${cx - r * 0.13} ${mouthY} q${r * 0.13} ${r * 0.12} ${r * 0.26} 0" stroke="${S}" stroke-width="${sw * 0.6}" fill="none" stroke-linecap="round"/>`,
        beak:  `<path d="M${cx - r * 0.12} ${cy + br * 0.08} L${cx} ${cy + br * 0.3} L${cx + r * 0.12} ${cy + br * 0.08} Z" fill="#ffb547" stroke="${S}" stroke-width="${sw * 0.6}"/>`,
        open:  `<ellipse cx="${cx}" cy="${mouthY}" rx="${r * 0.11}" ry="${r * 0.13}" fill="${S}"/><ellipse cx="${cx}" cy="${mouthY + r * 0.04}" rx="${r * 0.06}" ry="${r * 0.06}" fill="#ff8a9e"/>`
    };

    const nose = o.mouth === 'beak' ? '' :
        `<ellipse cx="${cx}" cy="${cy + br * 0.12}" rx="${r * 0.09}" ry="${r * 0.07}" fill="${o.earIn === o.body ? S : o.earIn}" stroke="${S}" stroke-width="${sw * 0.4}"/>`;

    let extra = '';
    if (o.extra === 'whiskers') {
        extra = `<path d="M${cx - br * 0.9} ${cy + br * 0.05} h${-br * 0.35} M${cx - br * 0.88} ${cy + br * 0.22} h${-br * 0.3} M${cx + br * 0.9} ${cy + br * 0.05} h${br * 0.35} M${cx + br * 0.88} ${cy + br * 0.22} h${br * 0.3}" stroke="${S}" stroke-width="${sw * 0.45}" stroke-linecap="round"/>`;
    } else if (o.extra === 'mane') {
        extra = `<circle cx="${cx}" cy="${cy - br * 0.05}" r="${br * 1.02}" fill="${o.earIn}" stroke="${S}" stroke-width="${sw}"/>`;
    } else if (o.extra === 'tusk') {
        extra = `<path d="M${cx - r * 0.2} ${mouthY} q${-r * 0.02} ${r * 0.14} ${-r * 0.1} ${r * 0.14} M${cx + r * 0.2} ${mouthY} q${r * 0.02} ${r * 0.14} ${r * 0.1} ${r * 0.14}" stroke="#fff7e0" stroke-width="${sw * 0.9}" fill="none" stroke-linecap="round"/>`;
    } else if (o.extra === 'antler') {
        extra = `<path d="M${cx - br * 0.45} ${cy - br * 0.8} v${-br * 0.35} m0 ${br * 0.15} h${-br * 0.2} M${cx + br * 0.45} ${cy - br * 0.8} v${-br * 0.35} m0 ${br * 0.15} h${br * 0.2}" stroke="#a5732e" stroke-width="${sw * 0.8}" fill="none" stroke-linecap="round"/>`;
    } else if (o.extra === 'sparkle') {
        extra = `<path d="M${cx + br * 0.75} ${cy - br * 0.85} l${r * 0.05} ${r * 0.1} l${r * 0.1} ${r * 0.05} l${-r * 0.1} ${r * 0.05} l${-r * 0.05} ${r * 0.1} l${-r * 0.05} ${-r * 0.1} l${-r * 0.1} ${-r * 0.05} l${r * 0.1} ${-r * 0.05} Z" fill="#fff" opacity=".95"/>`;
    } else if (o.extra === 'horn') {
        // cow/goat's stubby horn-pair - was completely missing pre-Task-6
        // (both set extra:'horn' in PET_SPECIES but no branch handled it,
        // so they rendered hornless). Small ivory triangles tucked above
        // the floppy ears both species also wear; sized/stroked like this
        // chain's siblings (r-scaled geometry, sw*0.4 stroke via `S`).
        extra = `<path d="M${cx - br * 0.24} ${cy - br * 0.78} L${cx - br * 0.32} ${cy - br * 1.08} L${cx - br * 0.08} ${cy - br * 0.86} Z" fill="#ffe9a8" stroke="${S}" stroke-width="${sw * 0.4}"/><path d="M${cx + br * 0.24} ${cy - br * 0.78} L${cx + br * 0.32} ${cy - br * 1.08} L${cx + br * 0.08} ${cy - br * 0.86} Z" fill="#ffe9a8" stroke="${S}" stroke-width="${sw * 0.4}"/>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${d} ${d}">
  ${o.extra === 'mane' ? extra : ''}${tailStyle}${ear}
  <circle cx="${cx}" cy="${cy}" r="${br}" fill="${o.body}" stroke="${S}" stroke-width="${sw}"/>
  <ellipse cx="${cx}" cy="${cy + br * 0.45}" rx="${br * 0.55}" ry="${br * 0.4}" fill="${o.belly}"/>
  ${pattern}
  <ellipse cx="${cx - br * 0.34}" cy="${cy - br * 0.4}" rx="${br * 0.18}" ry="${br * 0.12}" fill="#fff" opacity=".5"/>
  <ellipse cx="${cx - br * 0.34}" cy="${cy + br * 0.86}" rx="${br * 0.2}" ry="${br * 0.11}" fill="${o.belly}" stroke="${S}" stroke-width="${sw * 0.5}"/>
  <ellipse cx="${cx + br * 0.34}" cy="${cy + br * 0.86}" rx="${br * 0.2}" ry="${br * 0.11}" fill="${o.belly}" stroke="${S}" stroke-width="${sw * 0.5}"/>
  <circle cx="${cx - eyeDx}" cy="${eyeY}" r="${eyeR}" fill="${S}"/><circle cx="${cx + eyeDx}" cy="${eyeY}" r="${eyeR}" fill="${S}"/>
  <circle cx="${cx - eyeDx + eyeR * 0.35}" cy="${eyeY - eyeR * 0.35}" r="${eyeR * 0.4}" fill="#fff"/><circle cx="${cx + eyeDx + eyeR * 0.35}" cy="${eyeY - eyeR * 0.35}" r="${eyeR * 0.4}" fill="#fff"/>
  <circle cx="${cx - eyeDx - eyeR * 0.35}" cy="${eyeY + eyeR * 0.35}" r="${eyeR * 0.16}" fill="#fff" opacity=".85"/><circle cx="${cx + eyeDx - eyeR * 0.35}" cy="${eyeY + eyeR * 0.35}" r="${eyeR * 0.16}" fill="#fff" opacity=".85"/>
  <circle cx="${cx - eyeDx - eyeR * 1.55}" cy="${eyeY + eyeR * 1.5}" r="${eyeR * 1.0}" fill="#ff9ab5" opacity=".75"/><circle cx="${cx + eyeDx + eyeR * 1.55}" cy="${eyeY + eyeR * 1.5}" r="${eyeR * 1.0}" fill="#ff9ab5" opacity=".75"/>
  ${nose}${mouths[o.mouth] || mouths.smile}
  ${prop}
  ${o.extra !== 'mane' ? extra : ''}
</svg>`;
}

// Migration note (extra's old 'tail' value -> dedicated tailStyle slot): the
// 10 pets that used extra:'tail' (dog/fox/monkey/raccoon/squirrel/dragon/
// skunk/gecko/chameleon/redpanda) were re-authored with a personality-true
// tailStyle value instead (see the recipe table in phase-c-task-5-report.md)
// - extra is now free for whiskers/mane/tusk/antler/sparkle only.
//
// art: { ear, pattern, prop, tailStyle, mouth, extra } - the recipe fields
// are spread onto the returned pet object too (not just baked into svg),
// mirroring species(def, art) so tests can introspect p.ear/p.pattern/etc
// directly instead of re-parsing markup.
function animal(id, name, element, skill, body, belly, earIn, art) {
    const ear = art.ear || 'none', pattern = art.pattern || 'none', prop = art.prop || 'none';
    const tailStyle = art.tailStyle || 'none', mouth = art.mouth || 'smile', extra = art.extra || 'none';
    return {
        id, name, element, skill,
        ear, pattern, prop, tailStyle, mouth, extra,
        color: parseInt(body.slice(1), 16),
        svg: paintAnimal(24, { body, belly, earIn, ear, pattern, prop, tailStyle, mouth, extra })
    };
}

// 50 critters. v3.0: elements spread across all 8 (fire/water/leaf/wind/
// electric/ice/light/dark), >=4 per element (see tests/elements.test.js).
// v3.0 Task 9: every pet also carries a personality-matched skill archetype
// (Skills.ARCHETYPES) - cat=dash, dog=taunt, rabbit=heal, bear=slam,
// panda=shield, fox=stealth, etc. Distribution: every one of the 23
// archetypes used >=1x, none >4x (see tests/catalog.test.js). v6 Task 6:
// frog reassigned poison -> pull (the new frog-tongue archetype - the most
// literal possible fit; skunk remains the sole 'poison' user).
const PET_SPECIES = [
    // --- fire (7) ---
    animal('cat',      'Cat',      'fire',     'dash',      '#ffb066', '#ffd9b0', '#e8894a', { ear: 'pointy', prop: 'bow',    tailStyle: 'curly', mouth: 'w',     extra: 'whiskers' }),
    animal('fox',      'Fox',      'fire',     'stealth',   '#ff8a4a', '#ffe0c0', '#d06020', { ear: 'pointy', pattern: 'patch', tailStyle: 'puff', mouth: 'w',     extra: 'whiskers' }),
    animal('tiger',    'Tiger',    'fire',     'dash',      '#ffab3d', '#ffe0b0', '#c87818', { ear: 'round',  pattern: 'stripes', tailStyle: 'long', mouth: 'w',   extra: 'whiskers' }),
    animal('lion',     'Lion',     'fire',     'taunt',     '#ffc36a', '#ffe6bd', '#d08830', { ear: 'round',  pattern: 'patch', tailStyle: 'puff', mouth: 'w',   extra: 'mane' }),
    animal('dragon',   'Dragon',   'fire',     'burn',      '#ff7d5c', '#ffc5b0', '#d05030', { ear: 'horn',   pattern: 'patch', tailStyle: 'long', mouth: 'open' }),
    animal('gecko',    'Gecko',    'fire',     'dash',      '#a5e05f', '#d5f0b0', '#78b038', { pattern: 'spots', tailStyle: 'long', mouth: 'smile' }),
    animal('redpanda', 'Red Panda','fire',     'burn',      '#e0784a', '#f5c5a5', '#8a4020', { ear: 'round',  pattern: 'mask', tailStyle: 'puff', mouth: 'w' }),

    // --- water (10) ---
    animal('pig',      'Pig',      'water',    'lifesteal', '#ffb0c0', '#ffd0da', '#e88a9e', { ear: 'pointy', prop: 'bell', tailStyle: 'curly', mouth: 'open' }),
    animal('frog',     'Frog',     'water',    'pull',      '#7ec850', '#c5e8a5', '#5aa032', { ear: 'round',  pattern: 'spots', mouth: 'smile' }),
    animal('elephant', 'Elephant', 'water',    'slam',      '#b8c0d5', '#dde2f0', '#98a0b8', { ear: 'floppy', pattern: 'patch', tailStyle: 'long', mouth: 'smile', extra: 'tusk' }),
    animal('otter',    'Otter',    'water',    'execute',   '#a5825f', '#e5d0b0', '#7d5a38', { ear: 'round',  pattern: 'patch', tailStyle: 'long', mouth: 'w',    extra: 'whiskers' }),
    animal('dolphin',  'Dolphin',  'water',    'buffaura',  '#7fb8e8', '#c5e2f8', '#4a90c8', { ear: 'fin',    pattern: 'spots', tailStyle: 'fin', mouth: 'smile' }),
    animal('whale',    'Whale',    'water',    'knockback', '#6a9ad5', '#b8d5f0', '#4a78b0', { pattern: 'spots', tailStyle: 'fin', mouth: 'open' }),
    animal('turtle',   'Turtle',   'water',    'shield',    '#8ac878', '#c8e8b8', '#5a9548', { pattern: 'mask', mouth: 'smile' }),
    animal('crab',     'Crab',     'water',    'execute',   '#ff8a70', '#ffc5b5', '#e05a3a', { ear: 'antenna', pattern: 'patch', mouth: 'w' }),
    animal('octopus',  'Octopus',  'water',    'lifesteal', '#e88ab8', '#f5c5dd', '#c85a90', { pattern: 'spots', prop: 'bow', mouth: 'w' }),
    animal('axolotl',  'Axolotl',  'water',    'clone',     '#ffb5c5', '#ffdde5', '#ff8aa5', { ear: 'tuft',   prop: 'flower', tailStyle: 'fin', mouth: 'smile' }),

    // --- leaf (9) ---
    animal('dog',      'Dog',      'leaf',     'taunt',     '#c9a06a', '#ecd9b8', '#a5732e', { ear: 'floppy', pattern: 'patch', prop: 'scarf', tailStyle: 'curly', mouth: 'open' }),
    animal('panda',    'Panda',    'leaf',     'shield',    '#f5f5f5', '#ffffff', '#2a2a34', { ear: 'round',  pattern: 'mask', tailStyle: 'puff', mouth: 'smile' }),
    animal('koala',    'Koala',    'leaf',     'slow',      '#a8b0bd', '#d8dde5', '#8890a0', { ear: 'round',  prop: 'leaf', mouth: 'smile' }),
    animal('deer',     'Deer',     'leaf',     'heal',      '#d8a878', '#f0ddc0', '#b0824e', { ear: 'floppy', pattern: 'spots', tailStyle: 'puff', mouth: 'smile', extra: 'antler' }),
    animal('cow',      'Cow',      'leaf',     'rage',      '#f5f5f0', '#ffffff', '#3a3a44', { ear: 'floppy', pattern: 'patch', prop: 'bell', tailStyle: 'long', mouth: 'open', extra: 'horn' }),
    animal('monkey',   'Monkey',   'leaf',     'rage',      '#b08055', '#ecd0a8', '#8a5a30', { ear: 'round',  pattern: 'patch', tailStyle: 'long', mouth: 'open' }),
    animal('squirrel', 'Squirrel', 'leaf',     'buffaura',  '#d5854a', '#f5d5ae', '#a5601e', { ear: 'pointy', prop: 'leaf', tailStyle: 'puff', mouth: 'open' }),
    animal('snail',    'Snail',    'leaf',     'slow',      '#e8c880', '#f5e5c0', '#c89850', { ear: 'antenna', pattern: 'stripes', prop: 'leaf', mouth: 'smile' }),
    animal('ladybug',  'Ladybug',  'leaf',     'summon',    '#ff6b6b', '#ffb8b8', '#3a3a44', { ear: 'antenna', pattern: 'spots', mouth: 'smile' }),

    // --- ice (5) ---
    animal('rabbit',   'Rabbit',   'ice',      'heal',      '#f5e6e8', '#ffffff', '#ffb6c8', { ear: 'long',   prop: 'flower', tailStyle: 'puff', mouth: 'w' }),
    animal('bear',     'Bear',     'ice',      'slam',      '#b98050', '#e0c09a', '#8a5a30', { ear: 'round',  pattern: 'patch', mouth: 'smile' }),
    animal('penguin',  'Penguin',  'ice',      'freeze',    '#3a4a63', '#ffffff', '#28344a', { ear: 'wing',   prop: 'scarf', tailStyle: 'fin', mouth: 'beak' }),
    animal('seal',     'Seal',     'ice',      'freeze',    '#c5d5e5', '#eef4fa', '#a0b5c8', { pattern: 'spots', tailStyle: 'fin', mouth: 'w', extra: 'whiskers' }),
    animal('goat',     'Goat',     'ice',      'slam',      '#e5ddd0', '#f8f4ec', '#c0b5a0', { ear: 'floppy', prop: 'bell', mouth: 'smile', extra: 'horn' }),

    // --- electric (4) ---
    animal('mouse',    'Mouse',    'electric', 'chain',     '#c8c8d5', '#e8e8f0', '#ffb6c8', { ear: 'round',  pattern: 'patch', tailStyle: 'long', mouth: 'w', extra: 'whiskers' }),
    animal('hamster',  'Hamster',  'electric', 'chain',     '#ffcf8a', '#fff0d5', '#e8a050', { ear: 'round',  pattern: 'patch', tailStyle: 'puff', mouth: 'open' }),
    animal('bee',      'Bee',      'electric', 'summon',    '#ffd75e', '#fff0b8', '#3a3a44', { ear: 'wing',   pattern: 'stripes', prop: 'goggles', mouth: 'smile' }),
    animal('jellyfish','Jellyfish','electric', 'stun',      '#b8d5ff', '#e0edff', '#8aa8e8', { ear: 'antenna', prop: 'bow', mouth: 'smile' }),

    // --- wind (5) ---
    animal('duck',     'Duck',     'wind',     'goldaura',  '#fff2b8', '#ffffff', '#ffd75e', { ear: 'wing',   pattern: 'spots', tailStyle: 'feather', mouth: 'beak' }),
    animal('owl',      'Owl',      'wind',     'stun',      '#b08860', '#e5d0b0', '#7d5a38', { ear: 'tuft',   pattern: 'mask', tailStyle: 'feather', mouth: 'beak' }),
    animal('butterfly','Butterfly','wind',     'clone',     '#c7a4ff', '#e8dcff', '#9a6fe0', { ear: 'wing',   pattern: 'spots', prop: 'flower', mouth: 'smile' }),
    animal('horse',    'Horse',    'wind',     'knockback', '#c08858', '#ead0ae', '#8a5a30', { ear: 'pointy', pattern: 'patch', tailStyle: 'long', mouth: 'smile', extra: 'mane' }),
    animal('toucan',   'Toucan',   'wind',     'critaura',  '#3a3a48', '#f5f5f0', '#ff9a3d', { ear: 'wing',   pattern: 'patch', tailStyle: 'long', mouth: 'beak' }),

    // --- light (5) ---
    animal('chick',    'Chick',    'light',    'heal',      '#ffe066', '#fff2b8', '#ffb547', { ear: 'tuft',   prop: 'bow', tailStyle: 'puff', mouth: 'beak' }),
    animal('sheep',    'Sheep',    'light',    'goldaura',  '#f8f2ea', '#ffffff', '#e0d5c5', { ear: 'floppy', prop: 'bell', tailStyle: 'puff', mouth: 'smile' }),
    animal('unicorn',  'Unicorn',  'light',    'critaura',  '#f0e5ff', '#ffffff', '#ffb6dd', { ear: 'fin',    pattern: 'star', prop: 'flower', tailStyle: 'long', mouth: 'smile', extra: 'sparkle' }),
    animal('alpaca',   'Alpaca',   'light',    'revive',    '#f5e8d5', '#fdf8ee', '#e0c8a5', { ear: 'long',   prop: 'scarf', mouth: 'w' }),
    animal('chameleon','Chameleon','light',    'revive',    '#78d0a0', '#c0ecd5', '#48a870', { ear: 'fin',    pattern: 'stripes', tailStyle: 'curly', mouth: 'smile' }),

    // --- dark (5) ---
    animal('wolf',     'Wolf',     'dark',     'taunt',     '#9aa5b8', '#d5dce8', '#6d7a90', { ear: 'pointy', pattern: 'patch', tailStyle: 'long', mouth: 'w' }),
    animal('raccoon',  'Raccoon',  'dark',     'stealth',   '#a8a8b8', '#dcdce8', '#454550', { ear: 'round',  pattern: 'mask', tailStyle: 'puff', mouth: 'w' }),
    animal('hedgehog', 'Hedgehog', 'dark',     'shield',    '#c09468', '#ecd9b8', '#7d5a38', { ear: 'tuft',   pattern: 'spots', mouth: 'w' }),
    animal('bat',      'Bat',      'dark',     'stealth',   '#8a7aa8', '#c0b5d5', '#5d4d78', { ear: 'wing',   pattern: 'patch', mouth: 'open' }),
    animal('skunk',    'Skunk',    'dark',     'poison',    '#4a4a58', '#e8e8f0', '#f0f0f5', { ear: 'pointy', pattern: 'stripes', tailStyle: 'puff', mouth: 'w' })
];

// The Nest - the thing we protect. Basket + sleeping babies + an egg.
const NEST_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 150">
  <ellipse cx="110" cy="118" rx="100" ry="28" fill="#7a5a3a"/>
  <path d="M14 96 Q110 66 206 96 L196 128 Q110 152 24 128 Z" fill="#96714a" stroke="#5d4430" stroke-width="6"/>
  <path d="M20 100 Q110 76 200 100" stroke="#b98f60" stroke-width="5" fill="none"/>
  <path d="M26 112 Q110 90 194 112" stroke="#7a5a3a" stroke-width="5" fill="none"/>
  <ellipse cx="70" cy="84" rx="34" ry="26" fill="#7dffb2" stroke="#221a38" stroke-width="5"/>
  <path d="M58 84 q6 6 12 0 M74 84 q6 6 12 0" stroke="#221a38" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="146" cy="82" rx="30" ry="24" fill="#ff9ad5" stroke="#221a38" stroke-width="5"/>
  <path d="M136 82 q5 5 10 0 M152 82 q5 5 10 0" stroke="#221a38" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="110" cy="70" rx="18" ry="23" fill="#fff7e0" stroke="#221a38" stroke-width="4"/>
  <circle cx="105" cy="63" r="3.5" fill="#ffd54a"/><circle cx="116" cy="74" r="3" fill="#7fd2ff"/>
</svg>`;

// paintJelly/paintAnimal are exported alongside the baked catalogs purely for
// test introspection (tests/catalog.test.js's r=90 close-up scaling check
// needs to re-invoke the painters at a size no real species uses) - nothing
// in www/js reaches for these two exports; every consumer still goes through
// SPECIES[i].svgIdle/svgSquash or PET_SPECIES[i].svg as before.
if (typeof module !== 'undefined') module.exports = { SPECIES, PET_SPECIES, NEST_SVG, paintJelly, paintAnimal };
