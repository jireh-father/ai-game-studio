// =============================================================================
// SMOOSH! - catalog.js
// The 14 jelly species. Art is built by a parametric jelly painter so every
// species shares the same cute flat style while keeping a unique color,
// face and accessory. Two states per species: idle and squash.
// =============================================================================

// Paint one jelly SVG. r = radius; state = 'idle' | 'squash'.
// opts: { body, belly, face:'happy'|'grin'|'sleepy'|'angry'|'scared'|'greedy'|'king',
//         accessory:'none'|'crown'|'shell'|'coin'|'splitline'|'zzz'|'horns' }
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

    let accessory = '';
    const topY = cy - bh;
    if (opts.accessory === 'crown') {
        accessory = `<path d="M${cx - r * 0.36} ${topY + r * 0.06} l${r * 0.10} ${-r * 0.30} l${r * 0.16} ${r * 0.16} l${r * 0.10} ${-r * 0.26} l${r * 0.10} ${r * 0.26} l${r * 0.16} ${-r * 0.16} l${r * 0.10} ${r * 0.30} Z" fill="#ffd54a" stroke="${stroke}" stroke-width="${sw * 0.5}"/>`;
    } else if (opts.accessory === 'shell') {
        accessory = `<path d="M${cx - bw * 0.98} ${cy} a${bw * 0.98} ${bh * 0.98} 0 0 1 ${bw * 1.96} 0" fill="none" stroke="#e8f4ff" stroke-width="${sw * 1.4}" opacity="0.9"/>`;
    } else if (opts.accessory === 'coin') {
        accessory = `<circle cx="${cx + bw * 0.55}" cy="${topY + r * 0.18}" r="${r * 0.18}" fill="#fff06a" stroke="${stroke}" stroke-width="${sw * 0.4}"/>`;
    } else if (opts.accessory === 'splitline') {
        accessory = `<path d="M${cx} ${topY + r * 0.10} q${r * 0.10} ${bh * 0.5} 0 ${bh * 1.1}" stroke="${stroke}" stroke-width="${sw * 0.5}" stroke-dasharray="${r * 0.12} ${r * 0.10}" fill="none"/>`;
    } else if (opts.accessory === 'zzz') {
        accessory = `<text x="${cx + bw * 0.5}" y="${topY + r * 0.1}" font-family="Arial" font-weight="bold" font-size="${r * 0.34}" fill="${stroke}">z</text>`;
    } else if (opts.accessory === 'horns') {
        accessory = `<path d="M${cx - bw * 0.5} ${topY + r * 0.14} l${-r * 0.10} ${-r * 0.22} l${r * 0.20} ${r * 0.06} Z M${cx + bw * 0.5} ${topY + r * 0.14} l${r * 0.10} ${-r * 0.22} l${-r * 0.20} ${r * 0.06} Z" fill="${opts.body}" stroke="${stroke}" stroke-width="${sw * 0.4}"/>`;
    } else if (opts.accessory === 'ears') {
        accessory = `<ellipse cx="${cx - bw * 0.4}" cy="${topY - r * 0.10}" rx="${r * 0.11}" ry="${r * 0.30}" fill="${opts.body}" stroke="${stroke}" stroke-width="${sw * 0.4}" transform="rotate(-12 ${cx - bw * 0.4} ${topY - r * 0.10})"/><ellipse cx="${cx + bw * 0.4}" cy="${topY - r * 0.10}" rx="${r * 0.11}" ry="${r * 0.30}" fill="${opts.body}" stroke="${stroke}" stroke-width="${sw * 0.4}" transform="rotate(12 ${cx + bw * 0.4} ${topY - r * 0.10})"/>`;
    } else if (opts.accessory === 'ring') {
        accessory = `<ellipse cx="${cx}" cy="${cy}" rx="${bw * 1.28}" ry="${bh * 0.34}" fill="none" stroke="#ffd57d" stroke-width="${sw * 0.9}" opacity="0.9"/>`;
    } else if (opts.accessory === 'heart') {
        accessory = `<path d="M${cx + bw * 0.62} ${topY + r * 0.16} c${-r * 0.14} ${-r * 0.18} ${-r * 0.34} ${r * 0.02} ${-r * 0.06} ${r * 0.22} c${r * 0.28} ${-r * 0.20} ${r * 0.10} ${-r * 0.40} ${-r * 0.06} ${-r * 0.22} Z" fill="#ff5e7d" transform="rotate(18 ${cx + bw * 0.6} ${topY + r * 0.14})"/>`;
    } else if (opts.accessory === 'bubble') {
        accessory = `<circle cx="${cx}" cy="${cy}" r="${Math.min(bw, bh) * 1.42}" fill="none" stroke="#cfeaff" stroke-width="${sw * 0.6}" opacity="0.75"/><circle cx="${cx - bw * 0.7}" cy="${cy - bh * 0.9}" r="${r * 0.07}" fill="#ffffff" opacity="0.8"/>`;
    } else if (opts.accessory === 'leaf') {
        accessory = `<path d="M${cx} ${topY + r * 0.06} q${r * 0.05} ${-r * 0.26} ${r * 0.30} ${-r * 0.30} q${-r * 0.02} ${r * 0.24} ${-r * 0.26} ${r * 0.32} Z" fill="#6fc46f" stroke="${stroke}" stroke-width="${sw * 0.35}"/>`;
    } else if (opts.accessory === 'ice') {
        accessory = `<path d="M${cx - r * 0.30} ${topY + r * 0.10} l${r * 0.10} ${-r * 0.26} l${r * 0.12} ${r * 0.20} l${r * 0.10} ${-r * 0.30} l${r * 0.12} ${r * 0.30} l${r * 0.10} ${-r * 0.20} l${r * 0.06} ${r * 0.26} Z" fill="#bfe8ff" stroke="${stroke}" stroke-width="${sw * 0.35}"/>`;
    } else if (opts.accessory === 'sparkle') {
        accessory = `<path d="M${cx + bw * 0.66} ${topY + r * 0.10} l${r * 0.05} ${r * 0.12} l${r * 0.12} ${r * 0.05} l${-r * 0.12} ${r * 0.05} l${-r * 0.05} ${r * 0.12} l${-r * 0.05} ${-r * 0.12} l${-r * 0.12} ${-r * 0.05} l${r * 0.12} ${-r * 0.05} Z" fill="#ffffff" opacity="0.95"/>`;
    } else if (opts.accessory === 'flame') {
        accessory = `<path d="M${cx - bw * 1.05} ${cy - bh * 0.2} h${r * 0.34} M${cx - bw * 1.15} ${cy} h${r * 0.44} M${cx - bw * 1.05} ${cy + bh * 0.2} h${r * 0.34}" stroke="#ffd57d" stroke-width="${sw * 0.5}" stroke-linecap="round"/>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${d} ${d}">
  <g fill-opacity="${bodyAlpha}">
  <ellipse cx="${cx}" cy="${cy}" rx="${bw}" ry="${bh}" fill="${opts.body}" stroke="${stroke}" stroke-width="${sw}" stroke-opacity="${bodyAlpha}"/>
  <ellipse cx="${cx}" cy="${cy + bh * 0.38}" rx="${bw * 0.78}" ry="${bh * 0.42}" fill="${opts.belly}"/>
  <ellipse cx="${cx - bw * 0.42}" cy="${cy - bh * 0.42}" rx="${bw * 0.26}" ry="${bh * 0.18}" fill="#ffffff" opacity="0.55"/>
  </g>
  ${accessory}
  ${face}
</svg>`;
}

function species(def, art) {
    return Object.assign({}, def, {
        color: parseInt(art.body.slice(1), 16), // body color for FX tinting
        svgIdle: paintJelly(def.radius, 'idle', art),
        svgSquash: paintJelly(def.radius, 'squash', art)
    });
}

const SPECIES = [
    // --- 10 regular mobs ---
    species({ id: 'blob',    name: 'Blob',    kind: 'mob', radius: 46, hpMult: 1.0, speed: 70,  move: 'amble',   goldMult: 1.0, attack: 'melee', elem: 'leaf', skill: 'slow' },
        { body: '#7dffb2', belly: '#5fdd94', face: 'happy',  accessory: 'none' }),
    species({ id: 'mini',    name: 'Mini',    kind: 'mob', radius: 26, hpMult: 0.5, speed: 150, move: 'zigzag',  goldMult: 0.8, attack: 'melee', elem: 'wind', skill: 'dash' },
        { body: '#ff9ad5', belly: '#e878b8', face: 'grin',   accessory: 'none' }),
    species({ id: 'tank',    name: 'Tank',    kind: 'mob', radius: 64, hpMult: 4.0, speed: 36,  move: 'amble',   goldMult: 2.2, attack: 'slam', elem: 'water', skill: 'shield' },
        { body: '#6fa8ff', belly: '#5388e0', face: 'angry',  accessory: 'horns' }),
    species({ id: 'zippy',   name: 'Zippy',   kind: 'mob', radius: 34, hpMult: 0.8, speed: 120, move: 'dash',    goldMult: 1.2, attack: 'charge', elem: 'electric', skill: 'chain' },
        { body: '#ffe066', belly: '#e8c44a', face: 'grin',   accessory: 'none' }),
    species({ id: 'scaredy', name: 'Scaredy', kind: 'mob', radius: 38, hpMult: 1.0, speed: 95,  move: 'flee',    goldMult: 1.5, attack: 'none', elem: 'wind', skill: 'dash' },
        { body: '#c7a4ff', belly: '#a984e8', face: 'scared', accessory: 'none' }),
    species({ id: 'pudding', name: 'Pudding', kind: 'mob', radius: 54, hpMult: 2.0, speed: 55,  move: 'amble',   goldMult: 1.6, attack: 'slam', elem: 'fire', skill: 'taunt' },
        { body: '#ffb066', belly: '#e8944a', face: 'happy',  accessory: 'none' }),
    species({ id: 'drop',    name: 'Drop',    kind: 'mob', radius: 30, hpMult: 0.7, speed: 110, move: 'zigzag',  goldMult: 1.0, attack: 'spray', elem: 'water', skill: 'knockback' },
        { body: '#66e0e0', belly: '#4ac4c4', face: 'happy',  accessory: 'none' }),
    species({ id: 'blinky',  name: 'Blinky',  kind: 'mob', radius: 40, hpMult: 1.2, speed: 80,  move: 'sleeper', goldMult: 1.3, attack: 'zap', elem: 'electric', skill: 'stun' },
        { body: '#9aa5c0', belly: '#7e89a4', face: 'sleepy', accessory: 'zzz' }),
    species({ id: 'twins',   name: 'Twins',   kind: 'mob', radius: 36, hpMult: 0.9, speed: 85,  move: 'amble',   goldMult: 1.1, attack: 'melee', elem: 'wind', skill: 'clone' },
        { body: '#a8e05f', belly: '#8cc443', face: 'grin',   accessory: 'none' }),
    species({ id: 'grumpy',  name: 'Grumpy',  kind: 'mob', radius: 50, hpMult: 1.6, speed: 60,  move: 'dash',    goldMult: 1.5, attack: 'charge', elem: 'fire', skill: 'burn' },
        { body: '#ff7d7d', belly: '#e05e5e', face: 'angry',  accessory: 'none' }),

    // --- 10 v1.1 newcomers: cuter, weirder, trickier ---
    species({ id: 'ghosty',  name: 'Ghosty',  kind: 'mob', radius: 38, hpMult: 1.0, speed: 60,  move: 'amble',    goldMult: 1.8, attack: 'zap', quirk: 'phase', elem: 'dark', skill: 'stealth' },
        { body: '#dfe6ff', belly: '#b9c4f0', face: 'sleepy', accessory: 'none', alpha: 0.8 }),
    species({ id: 'hoppy',   name: 'Hoppy',   kind: 'mob', radius: 34, hpMult: 0.9, speed: 115, move: 'hop',      goldMult: 1.2, attack: 'melee', elem: 'wind', skill: 'slow' },
        { body: '#ffc7de', belly: '#eaa5c4', face: 'grin',   accessory: 'ears' }),
    species({ id: 'orbity',  name: 'Orbity',  kind: 'mob', radius: 36, hpMult: 1.1, speed: 85,  move: 'orbit',    goldMult: 1.3, attack: 'spit', elem: 'light', skill: 'buffaura' },
        { body: '#9fd0ff', belly: '#7fb2e8', face: 'happy',  accessory: 'ring' }),
    species({ id: 'lovey',   name: 'Lovey',   kind: 'mob', radius: 34, hpMult: 0.8, speed: 70,  move: 'chase',    goldMult: 1.4, attack: 'melee', elem: 'light', skill: 'heal' },
        { body: '#ffa3b8', belly: '#e88399', face: 'love',   accessory: 'heart' }),
    species({ id: 'rocky',   name: 'Rocky',   kind: 'mob', radius: 30, hpMult: 0.7, speed: 220, move: 'ricochet', goldMult: 1.6, attack: 'charge', elem: 'leaf', skill: 'slam' },
        { body: '#ffb84a', belly: '#e0982e', face: 'grin',   accessory: 'flame' }),
    species({ id: 'bubbly',  name: 'Bubbly',  kind: 'mob', radius: 40, hpMult: 0.8, speed: 55,  move: 'float',    goldMult: 1.2, attack: 'spit', elem: 'water', skill: 'poison' },
        { body: '#a3ecff', belly: '#7fd2ea', face: 'happy',  accessory: 'bubble' }),
    species({ id: 'shysh',   name: 'Shysh',   kind: 'mob', radius: 38, hpMult: 1.0, speed: 90,  move: 'amble',    goldMult: 1.7, attack: 'none', quirk: 'shy', elem: 'leaf', skill: 'heal' },
        { body: '#c9e89a', belly: '#a9cc78', face: 'scared', accessory: 'leaf' }),
    species({ id: 'cloney',  name: 'Cloney',  kind: 'mob', radius: 36, hpMult: 1.3, speed: 80,  move: 'amble',    goldMult: 1.8, attack: 'zap', quirk: 'blink', elem: 'dark', skill: 'clone' },
        { body: '#e0b3ff', belly: '#c391ea', face: 'wink',   accessory: 'sparkle' }),
    species({ id: 'freezy',  name: 'Freezy',  kind: 'mob', radius: 42, hpMult: 1.4, speed: 45,  move: 'amble',    goldMult: 1.6, attack: 'spit', quirk: 'ice', elem: 'ice', skill: 'freeze' },
        { body: '#bfe8ff', belly: '#98cdf0', face: 'sleepy', accessory: 'ice' }),
    species({ id: 'chunky',  name: 'Chunky',  kind: 'mob', radius: 68, hpMult: 6.0, speed: 28,  move: 'amble',    goldMult: 3.0, attack: 'slam', elem: 'leaf', skill: 'knockback' },
        { body: '#ffd08a', belly: '#e8b165', face: 'happy',  accessory: 'none' }),

    // --- 4 specials ---
    species({ id: 'splitter', name: 'Splitter', kind: 'splitter', radius: 44, hpMult: 1.2, speed: 75, move: 'amble', goldMult: 1.2, attack: 'melee', childId: 'mini', elem: 'water', skill: 'summon' },
        { body: '#baff66', belly: '#9ce04a', face: 'grin',   accessory: 'splitline' }),
    species({ id: 'shieldy',  name: 'Shieldy',  kind: 'shield',   radius: 48, hpMult: 1.5, speed: 50, move: 'amble', goldMult: 2.0, attack: 'slam', elem: 'light', skill: 'shield' },
        { body: '#8fb8d0', belly: '#739cb4', face: 'angry',  accessory: 'shell' }),
    species({ id: 'goldie',   name: 'Goldie',   kind: 'jackpot',  radius: 36, hpMult: 1.0, speed: 240, move: 'flee', goldMult: 10, attack: 'none', despawnMs: 6000, elem: 'light', skill: 'goldaura' },
        { body: '#ffd54a', belly: '#e8b82e', face: 'greedy', accessory: 'coin' }),
    species({ id: 'king',     name: 'King Jelly', kind: 'boss',   radius: 240, hpMult: 1.0, speed: 25, move: 'amble', goldMult: 1.0, attack: 'slam', elem: 'dark', skill: 'summon' },
        { body: '#b06fff', belly: '#9350e0', face: 'angry',  accessory: 'crown' })
];

// =============================================================================
// v2.1 - PET ANIMALS: 50 adorable round critters, painted parametrically.
// Element counters: v3.0 8-element chart (fire/water/leaf/wind/electric/ice/
// light/dark), 1.5 strong / 0.7 weak - see Balance.elementMult.
// =============================================================================

// One cute round animal. r = radius. o = { body, belly, ear, earIn, pattern,
// mouth, extra } - ear: round|pointy|long|floppy|horn|antenna|fin|tuft|wing|none
// pattern: none|spots|stripes|mask|shell|patch  mouth: w|smile|beak|open
// extra: none|whiskers|mane|tusk|antler|tail|sparkle
function paintAnimal(r, o) {
    const d = r * 2, cx = r, cy = r * 1.08;
    const br = r * 0.82;                       // body radius
    const S = '#221a38';                       // outline
    const sw = Math.max(2.5, r * 0.09);
    const eyeY = cy - br * 0.14, eyeDx = br * 0.4;
    const eyeR = Math.max(3, r * 0.135); // v2.5: bigger puppy eyes

    const ears = {
        round:  `<circle cx="${cx - br * 0.62}" cy="${cy - br * 0.78}" r="${br * 0.3}" fill="${o.body}" stroke="${S}" stroke-width="${sw}"/><circle cx="${cx + br * 0.62}" cy="${cy - br * 0.78}" r="${br * 0.3}" fill="${o.body}" stroke="${S}" stroke-width="${sw}"/><circle cx="${cx - br * 0.62}" cy="${cy - br * 0.78}" r="${br * 0.15}" fill="${o.earIn}"/><circle cx="${cx + br * 0.62}" cy="${cy - br * 0.78}" r="${br * 0.15}" fill="${o.earIn}"/>`,
        pointy: `<path d="M${cx - br * 0.85} ${cy - br * 0.45} L${cx - br * 0.65} ${cy - br * 1.15} L${cx - br * 0.25} ${cy - br * 0.75} Z" fill="${o.body}" stroke="${S}" stroke-width="${sw}"/><path d="M${cx + br * 0.85} ${cy - br * 0.45} L${cx + br * 0.65} ${cy - br * 1.15} L${cx + br * 0.25} ${cy - br * 0.75} Z" fill="${o.body}" stroke="${S}" stroke-width="${sw}"/><path d="M${cx - br * 0.7} ${cy - br * 0.62} L${cx - br * 0.62} ${cy - br * 0.95} L${cx - br * 0.42} ${cy - br * 0.72} Z" fill="${o.earIn}"/><path d="M${cx + br * 0.7} ${cy - br * 0.62} L${cx + br * 0.62} ${cy - br * 0.95} L${cx + br * 0.42} ${cy - br * 0.72} Z" fill="${o.earIn}"/>`,
        long:   `<ellipse cx="${cx - br * 0.42}" cy="${cy - br * 1.0}" rx="${br * 0.2}" ry="${br * 0.55}" fill="${o.body}" stroke="${S}" stroke-width="${sw}" transform="rotate(-10 ${cx - br * 0.42} ${cy - br * 1.0})"/><ellipse cx="${cx + br * 0.42}" cy="${cy - br * 1.0}" rx="${br * 0.2}" ry="${br * 0.55}" fill="${o.body}" stroke="${S}" stroke-width="${sw}" transform="rotate(10 ${cx + br * 0.42} ${cy - br * 1.0})"/><ellipse cx="${cx - br * 0.42}" cy="${cy - br * 1.0}" rx="${br * 0.09}" ry="${br * 0.38}" fill="${o.earIn}" transform="rotate(-10 ${cx - br * 0.42} ${cy - br * 1.0})"/><ellipse cx="${cx + br * 0.42}" cy="${cy - br * 1.0}" rx="${br * 0.09}" ry="${br * 0.38}" fill="${o.earIn}" transform="rotate(10 ${cx + br * 0.42} ${cy - br * 1.0})"/>`,
        floppy: `<ellipse cx="${cx - br * 0.8}" cy="${cy - br * 0.2}" rx="${br * 0.24}" ry="${br * 0.5}" fill="${o.earIn}" stroke="${S}" stroke-width="${sw}" transform="rotate(18 ${cx - br * 0.8} ${cy - br * 0.2})"/><ellipse cx="${cx + br * 0.8}" cy="${cy - br * 0.2}" rx="${br * 0.24}" ry="${br * 0.5}" fill="${o.earIn}" stroke="${S}" stroke-width="${sw}" transform="rotate(-18 ${cx + br * 0.8} ${cy - br * 0.2})"/>`,
        horn:   `<path d="M${cx - br * 0.4} ${cy - br * 0.85} L${cx - br * 0.5} ${cy - br * 1.25} L${cx - br * 0.15} ${cy - br * 0.95} Z" fill="#ffe9a8" stroke="${S}" stroke-width="${sw * 0.8}"/><path d="M${cx + br * 0.4} ${cy - br * 0.85} L${cx + br * 0.5} ${cy - br * 1.25} L${cx + br * 0.15} ${cy - br * 0.95} Z" fill="#ffe9a8" stroke="${S}" stroke-width="${sw * 0.8}"/>`,
        antenna:`<path d="M${cx - br * 0.3} ${cy - br * 0.8} q${-br * 0.15} ${-br * 0.5} ${-br * 0.35} ${-br * 0.55}" stroke="${S}" stroke-width="${sw * 0.7}" fill="none"/><circle cx="${cx - br * 0.68}" cy="${cy - br * 1.36}" r="${br * 0.12}" fill="${o.earIn}" stroke="${S}" stroke-width="${sw * 0.5}"/><path d="M${cx + br * 0.3} ${cy - br * 0.8} q${br * 0.15} ${-br * 0.5} ${br * 0.35} ${-br * 0.55}" stroke="${S}" stroke-width="${sw * 0.7}" fill="none"/><circle cx="${cx + br * 0.68}" cy="${cy - br * 1.36}" r="${br * 0.12}" fill="${o.earIn}" stroke="${S}" stroke-width="${sw * 0.5}"/>`,
        fin:    `<path d="M${cx} ${cy - br * 0.8} L${cx - br * 0.22} ${cy - br * 1.25} L${cx + br * 0.22} ${cy - br * 1.25} Z" fill="${o.earIn}" stroke="${S}" stroke-width="${sw * 0.8}"/>`,
        tuft:   `<path d="M${cx - br * 0.25} ${cy - br * 0.82} q${br * 0.1} ${-br * 0.4} ${br * 0.25} ${-br * 0.42} q${br * 0.15} ${br * 0.02} ${br * 0.25} ${br * 0.42} Z" fill="${o.earIn}" stroke="${S}" stroke-width="${sw * 0.7}"/>`,
        wing:   `<ellipse cx="${cx - br * 0.95}" cy="${cy}" rx="${br * 0.22}" ry="${br * 0.42}" fill="${o.earIn}" stroke="${S}" stroke-width="${sw * 0.8}"/><ellipse cx="${cx + br * 0.95}" cy="${cy}" rx="${br * 0.22}" ry="${br * 0.42}" fill="${o.earIn}" stroke="${S}" stroke-width="${sw * 0.8}"/>`,
        none:   ''
    };

    let pattern = '';
    if (o.pattern === 'spots') {
        pattern = `<circle cx="${cx - br * 0.45}" cy="${cy - br * 0.3}" r="${br * 0.12}" fill="${o.earIn}" opacity=".8"/><circle cx="${cx + br * 0.5}" cy="${cy - br * 0.15}" r="${br * 0.1}" fill="${o.earIn}" opacity=".8"/><circle cx="${cx + br * 0.2}" cy="${cy - br * 0.55}" r="${br * 0.08}" fill="${o.earIn}" opacity=".8"/>`;
    } else if (o.pattern === 'stripes') {
        pattern = `<path d="M${cx - br * 0.75} ${cy - br * 0.5} q${br * 0.2} ${br * 0.12} ${br * 0.36} 0 M${cx + br * 0.75} ${cy - br * 0.5} q${-br * 0.2} ${br * 0.12} ${-br * 0.36} 0 M${cx - br * 0.2} ${cy - br * 0.78} q${br * 0.2} ${br * 0.1} ${br * 0.4} 0" stroke="${o.earIn}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
    } else if (o.pattern === 'mask') {
        pattern = `<ellipse cx="${cx - eyeDx}" cy="${eyeY}" rx="${eyeR * 2.1}" ry="${eyeR * 1.7}" fill="${o.earIn}" opacity=".85"/><ellipse cx="${cx + eyeDx}" cy="${eyeY}" rx="${eyeR * 2.1}" ry="${eyeR * 1.7}" fill="${o.earIn}" opacity=".85"/>`;
    } else if (o.pattern === 'shell') {
        pattern = `<path d="M${cx - br * 0.85} ${cy + br * 0.1} a${br * 0.85} ${br * 0.85} 0 0 1 ${br * 1.7} 0" fill="${o.earIn}" stroke="${S}" stroke-width="${sw * 0.7}" opacity=".9"/>`;
    } else if (o.pattern === 'patch') {
        pattern = `<circle cx="${cx + eyeDx}" cy="${eyeY}" r="${eyeR * 2}" fill="${o.earIn}" opacity=".7"/>`;
    }

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
    } else if (o.extra === 'tail') {
        extra = `<path d="M${cx + br * 0.9} ${cy + br * 0.35} q${br * 0.45} ${-br * 0.1} ${br * 0.3} ${-br * 0.5}" stroke="${o.body}" stroke-width="${sw * 1.6}" fill="none" stroke-linecap="round"/>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${d} ${d}">
  ${o.extra === 'mane' ? extra : ''}${ears[o.ear] || ''}
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
  ${o.extra !== 'mane' ? extra : ''}
</svg>`;
}

function animal(id, name, element, skill, body, belly, earIn, ear, pattern, mouth, extra) {
    return {
        id, name, element, skill,
        color: parseInt(body.slice(1), 16),
        svg: paintAnimal(24, { body, belly, earIn, ear, pattern, mouth, extra })
    };
}

// 50 critters. v3.0: elements spread across all 8 (fire/water/leaf/wind/
// electric/ice/light/dark), >=4 per element (see tests/elements.test.js).
// v3.0 Task 9: every pet also carries a personality-matched skill archetype
// (Skills.ARCHETYPES) - cat=dash, dog=taunt, rabbit=heal, bear=slam,
// panda=shield, fox=stealth, etc. Distribution: every one of the 22
// archetypes used >=1x, none >4x (see tests/catalog.test.js).
const PET_SPECIES = [
    animal('cat',      'Cat',      'fire',     'dash',      '#ffb066', '#ffd9b0', '#e8894a', 'pointy', 'none',    'w',     'whiskers'),
    animal('dog',      'Dog',      'leaf',     'taunt',     '#c9a06a', '#ecd9b8', '#a5732e', 'floppy', 'patch',   'open',  'tail'),
    animal('rabbit',   'Rabbit',   'ice',      'heal',      '#f5e6e8', '#ffffff', '#ffb6c8', 'long',   'none',    'w',     'none'),
    animal('bear',     'Bear',     'ice',      'slam',      '#b98050', '#e0c09a', '#8a5a30', 'round',  'none',    'smile', 'none'),
    animal('panda',    'Panda',    'leaf',     'shield',    '#f5f5f5', '#ffffff', '#2a2a34', 'round',  'mask',    'smile', 'none'),
    animal('fox',      'Fox',      'fire',     'stealth',   '#ff8a4a', '#ffe0c0', '#d06020', 'pointy', 'none',    'w',     'tail'),
    animal('pig',      'Pig',      'water',    'lifesteal', '#ffb0c0', '#ffd0da', '#e88a9e', 'pointy', 'none',    'open',  'none'),
    animal('frog',     'Frog',     'water',    'poison',    '#7ec850', '#c5e8a5', '#5aa032', 'round',  'none',    'smile', 'none'),
    animal('chick',    'Chick',    'light',    'heal',      '#ffe066', '#fff2b8', '#ffb547', 'tuft',   'none',    'beak',  'none'),
    animal('penguin',  'Penguin',  'ice',      'freeze',    '#3a4a63', '#ffffff', '#28344a', 'none',   'belly',   'beak',  'wing'),
    animal('koala',    'Koala',    'leaf',     'slow',      '#a8b0bd', '#d8dde5', '#8890a0', 'round',  'none',    'smile', 'none'),
    animal('tiger',    'Tiger',    'fire',     'dash',      '#ffab3d', '#ffe0b0', '#c87818', 'round',  'stripes', 'w',     'whiskers'),
    animal('lion',     'Lion',     'fire',     'taunt',     '#ffc36a', '#ffe6bd', '#d08830', 'round',  'none',    'w',     'mane'),
    animal('mouse',    'Mouse',    'electric', 'chain',     '#c8c8d5', '#e8e8f0', '#ffb6c8', 'round',  'none',    'w',     'whiskers'),
    animal('hamster',  'Hamster',  'electric', 'chain',     '#ffcf8a', '#fff0d5', '#e8a050', 'round',  'patch',   'open',  'none'),
    animal('duck',     'Duck',     'wind',     'goldaura',  '#fff2b8', '#ffffff', '#ffd75e', 'none',   'none',    'beak',  'wing'),
    animal('owl',      'Owl',      'wind',     'stun',      '#b08860', '#e5d0b0', '#7d5a38', 'tuft',   'mask',    'beak',  'none'),
    animal('wolf',     'Wolf',     'dark',     'taunt',     '#9aa5b8', '#d5dce8', '#6d7a90', 'pointy', 'none',    'w',     'none'),
    animal('deer',     'Deer',     'leaf',     'heal',      '#d8a878', '#f0ddc0', '#b0824e', 'floppy', 'spots',   'smile', 'antler'),
    animal('sheep',    'Sheep',    'light',    'goldaura',  '#f8f2ea', '#ffffff', '#e0d5c5', 'floppy', 'none',    'smile', 'none'),
    animal('cow',      'Cow',      'leaf',     'rage',      '#f5f5f0', '#ffffff', '#3a3a44', 'floppy', 'spots',   'open',  'horn'),
    animal('monkey',   'Monkey',   'leaf',     'rage',      '#b08055', '#ecd0a8', '#8a5a30', 'round',  'none',    'open',  'tail'),
    animal('elephant', 'Elephant', 'water',    'slam',      '#b8c0d5', '#dde2f0', '#98a0b8', 'floppy', 'none',    'smile', 'tusk'),
    animal('raccoon',  'Raccoon',  'dark',     'stealth',   '#a8a8b8', '#dcdce8', '#454550', 'pointy', 'mask',    'w',     'tail'),
    animal('hedgehog', 'Hedgehog', 'dark',     'shield',    '#c09468', '#ecd9b8', '#7d5a38', 'tuft',   'spots',   'w',     'none'),
    animal('squirrel', 'Squirrel', 'leaf',     'buffaura',  '#d5854a', '#f5d5ae', '#a5601e', 'pointy', 'none',    'open',  'tail'),
    animal('otter',    'Otter',    'water',    'execute',   '#a5825f', '#e5d0b0', '#7d5a38', 'round',  'none',    'w',     'whiskers'),
    animal('seal',     'Seal',     'ice',      'freeze',    '#c5d5e5', '#eef4fa', '#a0b5c8', 'none',   'spots',   'w',     'whiskers'),
    animal('dolphin',  'Dolphin',  'water',    'buffaura',  '#7fb8e8', '#c5e2f8', '#4a90c8', 'fin',    'belly',   'smile', 'none'),
    animal('whale',    'Whale',    'water',    'knockback', '#6a9ad5', '#b8d5f0', '#4a78b0', 'fin',    'belly',   'smile', 'none'),
    animal('turtle',   'Turtle',   'water',    'shield',    '#8ac878', '#c8e8b8', '#5a9548', 'none',   'shell',   'smile', 'none'),
    animal('snail',    'Snail',    'leaf',     'slow',      '#e8c880', '#f5e5c0', '#c89850', 'antenna','shell',   'smile', 'none'),
    animal('bee',      'Bee',      'electric', 'summon',    '#ffd75e', '#fff0b8', '#3a3a44', 'antenna','stripes', 'smile', 'wing'),
    animal('ladybug',  'Ladybug',  'leaf',     'summon',    '#ff6b6b', '#ffb8b8', '#3a3a44', 'antenna','spots',   'smile', 'none'),
    animal('butterfly','Butterfly','wind',     'clone',     '#c7a4ff', '#e8dcff', '#9a6fe0', 'antenna','none',    'smile', 'wing'),
    animal('bat',      'Bat',      'dark',     'stealth',   '#8a7aa8', '#c0b5d5', '#5d4d78', 'pointy', 'none',    'open',  'wing'),
    animal('crab',     'Crab',     'water',    'execute',   '#ff8a70', '#ffc5b5', '#e05a3a', 'antenna','none',    'w',     'none'),
    animal('octopus',  'Octopus',  'water',    'lifesteal', '#e88ab8', '#f5c5dd', '#c85a90', 'none',   'spots',   'w',     'none'),
    animal('axolotl',  'Axolotl',  'water',    'clone',     '#ffb5c5', '#ffdde5', '#ff8aa5', 'tuft',   'none',    'smile', 'none'),
    animal('dragon',   'Dragon',   'fire',     'burn',      '#ff7d5c', '#ffc5b0', '#d05030', 'horn',   'belly',   'open',  'tail'),
    animal('unicorn',  'Unicorn',  'light',    'critaura',  '#f0e5ff', '#ffffff', '#ffb6dd', 'fin',    'none',    'smile', 'sparkle'),
    animal('gecko',    'Gecko',    'fire',     'dash',      '#a5e05f', '#d5f0b0', '#78b038', 'none',   'spots',   'smile', 'tail'),
    animal('skunk',    'Skunk',    'dark',     'poison',    '#4a4a58', '#e8e8f0', '#f0f0f5', 'pointy', 'stripes', 'w',     'tail'),
    animal('goat',     'Goat',     'ice',      'slam',      '#e5ddd0', '#f8f4ec', '#c0b5a0', 'floppy', 'none',    'smile', 'horn'),
    animal('horse',    'Horse',    'wind',     'knockback', '#c08858', '#ead0ae', '#8a5a30', 'pointy', 'none',    'smile', 'mane'),
    animal('alpaca',   'Alpaca',   'light',    'revive',    '#f5e8d5', '#fdf8ee', '#e0c8a5', 'long',   'none',    'w',     'none'),
    animal('toucan',   'Toucan',   'wind',     'critaura',  '#3a3a48', '#f5f5f0', '#ff9a3d', 'none',   'belly',   'beak',  'wing'),
    animal('jellyfish','Jellyfish','electric', 'stun',      '#b8d5ff', '#e0edff', '#8aa8e8', 'antenna','none',    'smile', 'none'),
    animal('chameleon','Chameleon','light',    'revive',    '#78d0a0', '#c0ecd5', '#48a870', 'fin',    'stripes', 'smile', 'tail'),
    animal('redpanda', 'Red Panda','fire',     'burn',      '#e0784a', '#f5c5a5', '#8a4020', 'round',  'mask',    'w',     'tail')
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

if (typeof module !== 'undefined') module.exports = { SPECIES, PET_SPECIES, NEST_SVG };
