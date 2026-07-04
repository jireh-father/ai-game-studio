// =============================================================================
// SMOOSH! - decor.js
// v3.5: nest decor - cosmetic props players buy/earn to place around the
// nest. Parametric pastel-prop painter (same spirit as catalog.js's
// paintJelly/paintAnimal) + a pure catalog/placement/grant API.
// v4.0 Phase C Task 6: paintDecor's own internal literals (the shared ink
// default + the white sparkle/highlight accents used across several shapes)
// now resolve through CONFIG.PASTEL where an exact-value token exists, via
// the same typeof-CONFIG guard + literal-fallback pattern catalog.js's
// elemRamp() uses - so decor.js still loads standalone in Node tests
// (tests/decor.test.js requires it with no CONFIG global set at all).
// The per-item c1/c2/c3 args below (DECOR_ITEMS) are NOT touched: they are
// intentionally representational "baked" prop colors (a rainbow rug must
// look rainbow, a starry backdrop must look night-dark) - see
// phase-c-task-6-report.md for the literal-by-literal justification table.
// v6 Task 9: nest overhaul - Decor.GRID went from 6x4 (24 cells) to 12x8
// (96 cells, see nestscene.js for the render-side halving math) and the
// catalog grew from 24 to 60 everyday-life items so a finer grid has enough
// variety to actually fill it. New: an optional per-item `use` tag
// ('sit'|'sleep'|'watch'|'eat') on a handful of furniture pieces (sofa/
// chair/stool -> sit, bed -> sleep, TV -> watch, fridge -> eat) that
// nestscene.js's NestAI reads to let idle pets seek out and interact with
// furniture, the same way it already does for cat==='toy' items via
// hasToys()/toyCells(). Every other furniture piece (lamp, table, shelf,
// clock, plant, dresser, mirror, cabinet, bookshelf...) is decorative only -
// `use` is null/omitted for those, same as before this task existed.
// =============================================================================
function pastelHex(key, fallback) {
    if (typeof CONFIG !== 'undefined' && CONFIG.PASTEL && CONFIG.PASTEL[key] !== undefined) {
        return '#' + (CONFIG.PASTEL[key] & 0xffffff).toString(16).padStart(6, '0');
    }
    return fallback;
}
// Pure highlight white (sparkle/gloss accents) - exact value match with
// CONFIG.PASTEL.white (0xffffff), so this is a no-visual-change alignment.
const DECOR_WHITE = pastelHex('white', '#ffffff');

// Paint one decor prop SVG (64x64 canvas). shape picks the archetype;
// o = { pattern, c1, c2, c3 } - c3 defaults to the shared ink outline color.
// That default ('#221a38') is kept as a literal on purpose: it's the same
// "character line-art ink" catalog.js's paintJelly/paintAnimal (and
// NEST_SVG below) still hardcode post-Task-4/5 - CONFIG.PASTEL.ink
// (0x453a56) is a much lighter UI-text plum, and swapping it in would
// visibly wash out every decor item's outline relative to the pets/monsters
// it sits next to in the nest.
function paintDecor(shape, o) {
    const c1 = o.c1, c2 = o.c2 || o.c1, c3 = o.c3 || '#221a38';
    let body = '';

    if (shape === 'mat') {
        body = `<rect x="6" y="18" width="52" height="30" rx="10" fill="${c1}" stroke="${c3}" stroke-width="2.5"/>`;
        if (o.pattern === 'rainbow') {
            body += `<path d="M10 33 Q32 20 58 33" stroke="${c2}" stroke-width="4" fill="none"/><path d="M10 40 Q32 28 58 40" stroke="${DECOR_WHITE}" stroke-width="3" fill="none" opacity=".6"/>`;
        } else if (o.pattern === 'stripe') {
            body += `<rect x="14" y="18" width="6" height="30" fill="${c2}"/><rect x="28" y="18" width="6" height="30" fill="${c2}"/><rect x="42" y="18" width="6" height="30" fill="${c2}"/>`;
        } else if (o.pattern === 'checker') {
            body += `<rect x="12" y="22" width="10" height="10" fill="${c2}"/><rect x="32" y="22" width="10" height="10" fill="${c2}"/><rect x="22" y="34" width="10" height="10" fill="${c2}"/><rect x="42" y="34" width="10" height="10" fill="${c2}"/>`;
        } else if (o.pattern === 'wood') {
            body += `<rect x="10" y="20" width="44" height="5" fill="${c2}" opacity=".55"/><rect x="10" y="27" width="44" height="5" fill="${c2}" opacity=".35"/><rect x="10" y="34" width="44" height="5" fill="${c2}" opacity=".55"/><rect x="10" y="41" width="44" height="5" fill="${c2}" opacity=".35"/>`;
        } else if (o.pattern === 'marble') {
            body += `<path d="M12 22 Q24 30 16 40 T30 46" stroke="${c2}" stroke-width="2" fill="none" opacity=".6"/><path d="M34 20 Q44 28 40 38 T50 44" stroke="${c2}" stroke-width="1.6" fill="none" opacity=".5"/>`;
        } else if (o.pattern === 'grass') {
            body += [[14, 26], [22, 22], [30, 28], [38, 22], [46, 26], [52, 30], [18, 36], [42, 36]]
                .map(([x, y]) => `<path d="M${x - 2} ${y + 4} L${x} ${y - 3} L${x + 2} ${y + 4}" stroke="${c2}" stroke-width="1.8" fill="none"/>`).join('');
        } else if (o.pattern === 'brick') {
            body += `<rect x="8" y="20" width="16" height="8" fill="${c2}" opacity=".55"/><rect x="26" y="20" width="16" height="8" fill="${c2}" opacity=".35"/><rect x="44" y="20" width="10" height="8" fill="${c2}" opacity=".55"/><rect x="14" y="30" width="16" height="8" fill="${c2}" opacity=".35"/><rect x="32" y="30" width="16" height="8" fill="${c2}" opacity=".55"/><rect x="8" y="40" width="16" height="6" fill="${c2}" opacity=".55"/><rect x="26" y="40" width="16" height="6" fill="${c2}" opacity=".35"/>`;
        } else if (o.pattern === 'polka') {
            body += [[16, 26], [28, 22], [40, 26], [20, 38], [34, 40], [46, 36]]
                .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${c2}"/>`).join('');
        } else if (o.pattern === 'diamond') {
            body += [[18, 32], [32, 24], [46, 32], [32, 42]]
                .map(([x, y]) => `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="${c2}" transform="rotate(45 ${x} ${y})"/>`).join('');
        } else if (o.pattern === 'confetti') {
            body += [[14, 24, 0], [24, 36, 20], [34, 22, 50], [44, 34, -15], [50, 26, 35], [20, 44, 10]]
                .map(([x, y, r]) => `<rect x="${x - 2.5}" y="${y - 4}" width="5" height="8" rx="1.5" fill="${c2}" transform="rotate(${r} ${x} ${y})"/>`).join('');
        } else { // speckle (sand)
            body += `<circle cx="18" cy="28" r="2" fill="${c2}"/><circle cx="30" cy="36" r="2.2" fill="${c2}"/><circle cx="44" cy="26" r="1.8" fill="${c2}"/><circle cx="24" cy="24" r="1.6" fill="${c2}"/><circle cx="40" cy="40" r="2" fill="${c2}"/>`;
        }
    } else if (shape === 'pond') {
        body = `<ellipse cx="32" cy="36" rx="26" ry="16" fill="${c1}" stroke="${c3}" stroke-width="2.5"/>
  <path d="M14 32 Q32 26 50 32" stroke="${DECOR_WHITE}" stroke-width="2.5" fill="none" opacity=".55"/>
  <path d="M18 40 Q32 35 46 40" stroke="${DECOR_WHITE}" stroke-width="2" fill="none" opacity=".4"/>`;
    } else if (shape === 'panel') {
        if (o.pattern === 'fence') {
            body = `<rect x="4" y="30" width="4" height="26" fill="${c1}"/><rect x="14" y="24" width="4" height="32" fill="${c1}"/><rect x="24" y="30" width="4" height="26" fill="${c1}"/><rect x="34" y="24" width="4" height="32" fill="${c1}"/><rect x="44" y="30" width="4" height="26" fill="${c1}"/><rect x="54" y="24" width="4" height="32" fill="${c1}"/><rect x="2" y="34" width="60" height="5" fill="${c2}"/>`;
        } else if (o.pattern === 'hills') {
            body = `<rect x="2" y="2" width="60" height="60" rx="8" fill="${c1}"/><path d="M2 46 Q18 30 32 46 T62 44 V58 H2 Z" fill="${c2}"/>`;
        } else if (o.pattern === 'stars') {
            body = `<rect x="2" y="2" width="60" height="60" rx="8" fill="${c1}"/>` +
                [[16, 16], [42, 14], [30, 32], [50, 40], [14, 44]]
                    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="${c2}"/>`).join('');
        } else if (o.pattern === 'rainbow') {
            body = `<rect x="2" y="2" width="60" height="60" rx="8" fill="${c1}"/>
  <path d="M8 52 A24 24 0 0 1 56 52" stroke="${c2}" stroke-width="6" fill="none"/>
  <path d="M8 52 A24 24 0 0 1 56 52" stroke="${DECOR_WHITE}" stroke-width="2" fill="none" opacity=".5" transform="translate(0,7)"/>`;
        } else if (o.pattern === 'window') {
            body = `<rect x="2" y="2" width="60" height="60" rx="8" fill="${c1}"/><rect x="14" y="12" width="36" height="40" rx="4" fill="${c2}" stroke="${c3}" stroke-width="2"/><rect x="14" y="30" width="36" height="4" fill="${c3}" opacity=".5"/><rect x="30" y="12" width="4" height="40" fill="${c3}" opacity=".5"/><circle cx="40" cy="20" r="5" fill="${DECOR_WHITE}" opacity=".8"/>`;
        } else if (o.pattern === 'poster') {
            body = `<rect x="2" y="2" width="60" height="60" rx="8" fill="${c1}"/><rect x="16" y="10" width="32" height="42" rx="3" fill="${DECOR_WHITE}" stroke="${c3}" stroke-width="2"/><circle cx="32" cy="26" r="9" fill="${c2}"/><path d="M20 44 L28 34 L36 42 L44 30" stroke="${c2}" stroke-width="2.5" fill="none"/>`;
        } else if (o.pattern === 'wallshelf') {
            body = `<rect x="2" y="2" width="60" height="60" rx="8" fill="${c1}"/><rect x="10" y="34" width="44" height="5" fill="${c2}"/><rect x="16" y="18" width="10" height="16" fill="${c2}" opacity=".8"/><circle cx="38" cy="28" r="6" fill="${DECOR_WHITE}" opacity=".8"/>`;
        } else if (o.pattern === 'wallart') {
            body = `<rect x="2" y="2" width="60" height="60" rx="8" fill="${c1}"/><rect x="14" y="12" width="36" height="36" fill="none" stroke="${c3}" stroke-width="3"/><path d="M18 40 L28 20 L36 34 L46 16" stroke="${c2}" stroke-width="3" fill="none"/>`;
        } else if (o.pattern === 'curtain') {
            body = `<rect x="2" y="2" width="60" height="60" rx="8" fill="${c1}"/>` +
                [10, 22, 34, 46].map(x => `<path d="M${x} 6 Q${x + 6} 32 ${x} 58" stroke="${c2}" stroke-width="5" fill="none" opacity=".8"/>`).join('') +
                `<rect x="4" y="4" width="56" height="6" fill="${c3}" opacity=".4"/>`;
        } else if (o.pattern === 'wallpaperdot') {
            body = `<rect x="2" y="2" width="60" height="60" rx="8" fill="${c1}"/>` +
                [[14, 14], [32, 14], [50, 14], [14, 32], [32, 32], [50, 32], [14, 50], [32, 50], [50, 50]]
                    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${c2}" opacity=".7"/>`).join('');
        } else { // cloud
            body = `<rect x="2" y="2" width="60" height="60" rx="8" fill="${c1}"/>
  <ellipse cx="32" cy="34" rx="18" ry="10" fill="${c2}"/><circle cx="20" cy="30" r="9" fill="${c2}"/><circle cx="44" cy="30" r="9" fill="${c2}"/>`;
        }
    } else if (shape === 'item') {
        const P = {
            bed:      `<rect x="10" y="34" width="44" height="16" rx="4" fill="${c1}" stroke="${c3}" stroke-width="2"/><rect x="10" y="26" width="14" height="12" rx="4" fill="${c2}"/><rect x="10" y="50" width="44" height="6" fill="${c3}" opacity=".3"/>`,
            lamp:     `<rect x="29" y="30" width="6" height="26" fill="${c3}"/><path d="M18 30 L46 30 L38 12 L26 12 Z" fill="${c1}" opacity=".9"/><circle cx="32" cy="12" r="4" fill="${c2}"/>`,
            table:    `<rect x="8" y="24" width="48" height="6" rx="3" fill="${c1}" stroke="${c3}" stroke-width="2"/><rect x="12" y="30" width="5" height="24" fill="${c2}"/><rect x="47" y="30" width="5" height="24" fill="${c2}"/>`,
            shelf:    `<rect x="8" y="16" width="48" height="6" fill="${c1}"/><rect x="8" y="34" width="48" height="6" fill="${c1}"/><circle cx="20" cy="12" r="5" fill="${c2}"/><rect x="34" y="6" width="10" height="12" fill="${c2}"/>`,
            bench:    `<rect x="10" y="28" width="44" height="6" rx="2" fill="${c1}" stroke="${c3}" stroke-width="2"/><rect x="10" y="34" width="6" height="18" fill="${c2}"/><rect x="48" y="34" width="6" height="18" fill="${c2}"/><rect x="10" y="14" width="44" height="6" rx="2" fill="${c1}"/>`,
            ball:     `<circle cx="32" cy="34" r="20" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><path d="M14 30 Q32 40 50 30 M32 14 Q26 34 32 54" stroke="${c2}" stroke-width="2.5" fill="none"/>`,
            swing:    `<path d="M10 10 L10 54 M54 10 L54 54" stroke="${c3}" stroke-width="3"/><path d="M6 10 L58 10" stroke="${c3}" stroke-width="4"/><path d="M18 12 L26 40 M46 12 L38 40" stroke="${c2}" stroke-width="2"/><rect x="22" y="40" width="20" height="6" rx="2" fill="${c1}"/>`,
            mushroom: `<path d="M16 32 Q32 6 48 32 Z" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><circle cx="26" cy="22" r="2.4" fill="${DECOR_WHITE}" opacity=".8"/><circle cx="38" cy="18" r="2" fill="${DECOR_WHITE}" opacity=".8"/><rect x="26" y="32" width="12" height="20" rx="4" fill="${c2}" stroke="${c3}" stroke-width="2"/>`,
            kite:     `<path d="M32 8 L50 26 L32 56 L14 26 Z" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><path d="M32 8 L32 56 M14 26 L50 26" stroke="${c3}" stroke-width="1.5"/><path d="M32 56 q-4 6 0 10 q4 -4 0 4 q-4 -4 0 6" stroke="${c2}" stroke-width="2" fill="none"/>`,
            drum:     `<ellipse cx="32" cy="20" rx="18" ry="8" fill="${c2}" stroke="${c3}" stroke-width="2.5"/><path d="M14 20 L14 44 A18 8 0 0 0 50 44 L50 20" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><ellipse cx="32" cy="44" rx="18" ry="8" fill="none" stroke="${c3}" stroke-width="2"/>`,
            statue:   `<rect x="18" y="46" width="28" height="10" fill="${c3}" opacity=".4"/><rect x="22" y="34" width="20" height="14" fill="${c1}" stroke="${c3}" stroke-width="2"/><circle cx="32" cy="22" r="10" fill="${c2}" stroke="${c3}" stroke-width="2"/>`,
            fountain: `<ellipse cx="32" cy="50" rx="24" ry="8" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><rect x="28" y="20" width="8" height="26" fill="${c2}"/><ellipse cx="32" cy="20" rx="10" ry="4" fill="${c2}"/><path d="M32 14 q-6 4 0 10 q6 -6 0 -10" fill="${DECOR_WHITE}" opacity=".6"/>`,
            crystal:  `<path d="M32 6 L48 24 L38 58 L26 58 L16 24 Z" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><path d="M32 6 L32 58 M16 24 L48 24" stroke="${c2}" stroke-width="1.5" opacity=".7"/>`,
            arch:     `<path d="M8 56 A24 24 0 0 1 56 56" stroke="${c1}" stroke-width="8" fill="none"/><path d="M8 56 A24 24 0 0 1 56 56" stroke="${c2}" stroke-width="3" fill="none" opacity=".7" transform="translate(0,-6)"/><path d="M8 56 A24 24 0 0 1 56 56" stroke="${DECOR_WHITE}" stroke-width="2" fill="none" opacity=".5" transform="translate(0,-11)"/>`,
            // --- v6 Task 9: furniture (some `use`-tagged for the nest idle AI) ---
            sofa:     `<rect x="8" y="30" width="48" height="18" rx="6" fill="${c1}" stroke="${c3}" stroke-width="2"/><rect x="8" y="18" width="12" height="18" rx="5" fill="${c2}"/><rect x="44" y="18" width="12" height="18" rx="5" fill="${c2}"/><rect x="10" y="46" width="6" height="10" fill="${c3}" opacity=".4"/><rect x="48" y="46" width="6" height="10" fill="${c3}" opacity=".4"/>`,
            chair:    `<rect x="18" y="30" width="28" height="8" rx="3" fill="${c1}" stroke="${c3}" stroke-width="2"/><rect x="18" y="10" width="28" height="20" rx="4" fill="${c2}" stroke="${c3}" stroke-width="2"/><rect x="18" y="38" width="5" height="18" fill="${c3}" opacity=".5"/><rect x="41" y="38" width="5" height="18" fill="${c3}" opacity=".5"/>`,
            fridge:   `<rect x="16" y="6" width="32" height="52" rx="6" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><rect x="16" y="24" width="32" height="4" fill="${c3}" opacity=".4"/><rect x="38" y="12" width="4" height="8" rx="2" fill="${c2}"/><rect x="38" y="30" width="4" height="8" rx="2" fill="${c2}"/>`,
            tv:       `<rect x="8" y="12" width="48" height="30" rx="4" fill="${c3}"/><rect x="12" y="16" width="40" height="22" fill="${c1}"/><path d="M18 22 L34 27 L18 32 Z" fill="${c2}"/><rect x="26" y="42" width="12" height="8" fill="${c3}"/><rect x="18" y="50" width="28" height="4" rx="2" fill="${c3}" opacity=".6"/>`,
            clock:    `<circle cx="32" cy="32" r="22" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><circle cx="32" cy="32" r="3" fill="${c3}"/><path d="M32 32 L32 18 M32 32 L42 36" stroke="${c3}" stroke-width="2.5" fill="none"/><circle cx="32" cy="12" r="2" fill="${c2}"/><circle cx="32" cy="52" r="2" fill="${c2}"/><circle cx="12" cy="32" r="2" fill="${c2}"/><circle cx="52" cy="32" r="2" fill="${c2}"/>`,
            plant:    `<path d="M32 34 Q16 30 18 12 Q28 18 32 30 Q36 18 46 12 Q48 30 32 34" fill="${c2}"/><path d="M18 34 L46 34 L42 56 L22 56 Z" fill="${c1}" stroke="${c3}" stroke-width="2"/>`,
            dresser:  `<rect x="10" y="14" width="44" height="42" rx="4" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><rect x="16" y="22" width="32" height="8" rx="2" fill="${c2}"/><rect x="16" y="36" width="32" height="8" rx="2" fill="${c2}"/><circle cx="20" cy="26" r="1.8" fill="${c3}"/><circle cx="44" cy="26" r="1.8" fill="${c3}"/><circle cx="20" cy="40" r="1.8" fill="${c3}"/><circle cx="44" cy="40" r="1.8" fill="${c3}"/>`,
            mirror:   `<ellipse cx="32" cy="28" rx="18" ry="22" fill="${c2}" stroke="${c1}" stroke-width="5"/><path d="M24 18 Q28 14 34 18" stroke="${DECOR_WHITE}" stroke-width="2" fill="none" opacity=".6"/><rect x="28" y="48" width="8" height="10" fill="${c1}"/><rect x="20" y="56" width="24" height="4" rx="2" fill="${c3}" opacity=".4"/>`,
            stool:    `<ellipse cx="32" cy="20" rx="18" ry="8" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><path d="M18 22 L14 52 M46 22 L50 52 M32 24 L32 54" stroke="${c2}" stroke-width="3"/>`,
            cabinet:  `<rect x="10" y="10" width="44" height="46" rx="4" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><rect x="10" y="32" width="44" height="2.5" fill="${c3}" opacity=".5"/><circle cx="28" cy="22" r="2" fill="${c2}"/><circle cx="28" cy="44" r="2" fill="${c2}"/>`,
            bookshelf: `<rect x="8" y="8" width="48" height="48" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><rect x="8" y="24" width="48" height="3" fill="${c3}" opacity=".5"/><rect x="8" y="40" width="48" height="3" fill="${c3}" opacity=".5"/><rect x="12" y="10" width="5" height="13" fill="${c2}"/><rect x="18" y="10" width="5" height="13" fill="${c2}" opacity=".7"/><rect x="24" y="10" width="5" height="13" fill="${c2}"/><rect x="34" y="26" width="5" height="13" fill="${c2}" opacity=".7"/><rect x="40" y="26" width="5" height="13" fill="${c2}"/><rect x="14" y="42" width="5" height="13" fill="${c2}"/><rect x="20" y="42" width="5" height="13" fill="${c2}" opacity=".7"/>`,
            // --- v6 Task 9: toys ---
            yarn:     `<circle cx="32" cy="32" r="20" fill="${c1}" stroke="${c3}" stroke-width="2"/><path d="M14 26 Q32 34 50 26 M14 38 Q32 30 50 38 M20 16 Q30 32 20 48 M44 16 Q34 32 44 48" stroke="${c2}" stroke-width="1.6" fill="none" opacity=".8"/>`,
            ringtoss: `<ellipse cx="32" cy="52" rx="10" ry="4" fill="${c3}" opacity=".4"/><rect x="29" y="14" width="6" height="40" fill="${c3}"/><ellipse cx="32" cy="24" rx="16" ry="6" fill="none" stroke="${c1}" stroke-width="4"/><ellipse cx="32" cy="36" rx="16" ry="6" fill="none" stroke="${c2}" stroke-width="4"/>`,
            plushie:  `<circle cx="32" cy="24" r="14" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><circle cx="22" cy="14" r="6" fill="${c1}" stroke="${c3}" stroke-width="2"/><circle cx="42" cy="14" r="6" fill="${c1}" stroke="${c3}" stroke-width="2"/><circle cx="27" cy="22" r="2" fill="${c3}"/><circle cx="37" cy="22" r="2" fill="${c3}"/><path d="M26 30 Q32 34 38 30" stroke="${c3}" stroke-width="2" fill="none"/><ellipse cx="32" cy="46" rx="16" ry="14" fill="${c2}" stroke="${c3}" stroke-width="2.5"/>`,
            scratchpost: `<rect x="24" y="8" width="16" height="40" rx="6" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><ellipse cx="32" cy="54" rx="22" ry="8" fill="${c2}" stroke="${c3}" stroke-width="2.5"/><path d="M26 16 L38 16 M26 24 L38 24 M26 32 L38 32" stroke="${c3}" stroke-width="1.4" opacity=".5"/>`,
            tunnel:   `<ellipse cx="16" cy="32" rx="10" ry="18" fill="${c2}" stroke="${c3}" stroke-width="2.5"/><path d="M16 14 Q54 8 54 32 Q54 56 16 50" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><ellipse cx="50" cy="32" rx="7" ry="16" fill="${c2}" opacity=".7"/>`,
            featherwand: `<path d="M14 50 L44 20" stroke="${c3}" stroke-width="3"/><path d="M44 20 Q54 10 60 6 Q52 16 50 26 Q46 18 44 20" fill="${c1}"/><path d="M40 24 Q50 16 56 12 Q48 20 46 28 Z" fill="${c2}" opacity=".8"/>`,
            puzzlecube: `<rect x="14" y="14" width="18" height="18" fill="${c1}" stroke="${c3}" stroke-width="2"/><rect x="32" y="14" width="18" height="18" fill="${c2}" stroke="${c3}" stroke-width="2"/><rect x="14" y="32" width="18" height="18" fill="${c2}" stroke="${c3}" stroke-width="2"/><rect x="32" y="32" width="18" height="18" fill="${c1}" stroke="${c3}" stroke-width="2"/>`,
            // --- v6 Task 9: special (premium, gem-priced) ---
            neon:     `<rect x="6" y="20" width="52" height="24" rx="12" fill="none" stroke="${c1}" stroke-width="4"/><path d="M16 32 Q24 22 32 32 T48 32" stroke="${c2}" stroke-width="4" fill="none"/><rect x="6" y="20" width="52" height="24" rx="12" fill="none" stroke="${DECOR_WHITE}" stroke-width="1.5" opacity=".5"/>`,
            aquarium: `<rect x="8" y="14" width="48" height="36" rx="4" fill="${c1}" opacity=".5" stroke="${c3}" stroke-width="2.5"/><path d="M8 46 Q32 40 56 46" stroke="${c2}" stroke-width="3" fill="none" opacity=".6"/><path d="M24 28 L32 32 L24 36 Z" fill="${c2}"/><circle cx="42" cy="24" r="2" fill="${DECOR_WHITE}" opacity=".7"/>`,
            discoball: `<circle cx="32" cy="34" r="20" fill="${c1}" stroke="${c3}" stroke-width="2"/>` +
                [[22, 24], [32, 20], [42, 24], [18, 34], [46, 34], [22, 44], [32, 48], [42, 44]]
                    .map(([x, y]) => `<rect x="${x - 3}" y="${y - 3}" width="6" height="6" fill="${c2}" opacity=".8"/>`).join('') +
                `<path d="M32 14 L32 6" stroke="${c3}" stroke-width="2"/>`,
            trophy:   `<path d="M20 10 L44 10 L42 28 Q32 36 22 28 Z" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><path d="M20 12 Q8 12 10 24 Q12 30 20 28" fill="none" stroke="${c2}" stroke-width="2.5"/><path d="M44 12 Q56 12 54 24 Q52 30 44 28" fill="none" stroke="${c2}" stroke-width="2.5"/><rect x="28" y="36" width="8" height="10" fill="${c2}"/><rect x="20" y="46" width="24" height="8" rx="2" fill="${c1}" stroke="${c3}" stroke-width="2"/>`,
            chandelier: `<path d="M32 4 L32 14" stroke="${c3}" stroke-width="2"/><path d="M14 14 L50 14" stroke="${c3}" stroke-width="2.5"/>` +
                [16, 26, 38, 48].map(x => `<path d="M${x} 14 L${x} 26" stroke="${c3}" stroke-width="1.6"/><circle cx="${x}" cy="30" r="5" fill="${c1}" stroke="${c3}" stroke-width="1.6"/>`).join('') +
                `<circle cx="32" cy="30" r="6" fill="${c2}"/>`
        };
        body = P[o.pattern] || '';
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`;
}

// use: optional 'sit'|'sleep'|'watch'|'eat' tag read by nestscene.js's
// NestAI-driven idle AI (see hasFurniture()/furnitureCells() there) - only
// a few furniture pieces carry one, mirroring how only cat==='toy' items
// matter to the older hasToys()/toyCells() gate.
function item(id, nameEn, nameKo, cat, priceKind, priceAmount, shape, pattern, c1, c2, c3, use) {
    return {
        id,
        name: { en: nameEn, ko: nameKo },
        cat,
        price: { kind: priceKind, amount: priceAmount },
        svg: paintDecor(shape, { pattern, c1, c2, c3 }),
        use: use || null
    };
}

// 60 static-priced props, 5 categories (>=9 each - see tests/decor.test.js).
// Prices are NOT progress-indexed (unlike Balance.*Cost) - decor is a static
// gold/gem sink, cheap floor pieces ~1.5-3k gold up through premium 'special'
// pieces priced in gems (20-55).
const DECOR_ITEMS = [
    // --- floor (12) ---
    item('rug_rainbow', 'Rainbow Rug', '무지개 러그', 'floor', 'gold', 1500, 'mat', 'rainbow', '#fff7e0', '#ff9ad5'),
    item('rug_stripe', 'Cozy Stripe Rug', '아늑한 줄무늬 러그', 'floor', 'gold', 1800, 'mat', 'stripe', '#ffe0b8', '#ff9a5a'),
    item('tile_checker', 'Checker Tile', '체커 타일', 'floor', 'gold', 2200, 'mat', 'checker', '#cfeaff', '#7fd2ff'),
    item('sand_patch', 'Sandy Patch', '모래밭', 'floor', 'gold', 1600, 'mat', 'speckle', '#ffe9b8', '#e8b96a'),
    item('pond_blue', 'Lily Pond', '연꽃 연못', 'floor', 'gold', 3000, 'pond', null, '#a3ecff'),
    item('floor_wood', 'Wood Plank Floor', '나무 마루', 'floor', 'gold', 2000, 'mat', 'wood', '#e8c88a', '#a5732e'),
    item('tile_marble', 'Marble Tile', '대리석 타일', 'floor', 'gold', 2600, 'mat', 'marble', '#f5f0ff', '#c7a4ff'),
    item('patch_grass', 'Grassy Patch', '잔디밭', 'floor', 'gold', 1700, 'mat', 'grass', '#bff0c8', '#4caf6e'),
    item('tile_brick', 'Brick Path', '벽돌길', 'floor', 'gold', 2100, 'mat', 'brick', '#ffc9a0', '#d9793f'),
    item('mat_polka', 'Polka Dot Mat', '물방울 매트', 'floor', 'gold', 1900, 'mat', 'polka', '#fff0f7', '#ff9ad5'),
    item('mat_diamond', 'Diamond Mat', '다이아 매트', 'floor', 'gold', 2300, 'mat', 'diamond', '#eaf6ff', '#7fd2ff'),
    item('mat_confetti', 'Confetti Mat', '색종이 매트', 'floor', 'gold', 2500, 'mat', 'confetti', '#fff7e0', '#ff7d7d'),

    // --- background (11) ---
    item('fence_picket', 'Picket Fence', '나무 울타리', 'background', 'gold', 2000, 'panel', 'fence', '#e8c88a', '#c9a06a'),
    item('backdrop_hills', 'Rolling Hills', '푸른 언덕', 'background', 'gold', 2800, 'panel', 'hills', '#cfe8ff', '#a8e05f'),
    item('backdrop_stars', 'Starry Night', '별밤', 'background', 'gold', 3200, 'panel', 'stars', '#241f3d', '#ffe066'),
    item('backdrop_rainbow', 'Rainbow Sky', '무지개 하늘', 'background', 'gold', 3600, 'panel', 'rainbow', '#dfe6ff', '#ff9ad5'),
    item('cloud_deco', 'Fluffy Clouds', '뭉게구름', 'background', 'gold', 2400, 'panel', 'cloud', '#bfe0ff', '#ffffff'),
    item('window_view', 'Sunny Window', '햇살 창문', 'background', 'gold', 2600, 'panel', 'window', '#cfeaff', '#ffe066'),
    item('poster_art', 'Cute Poster', '귀여운 포스터', 'background', 'gold', 2200, 'panel', 'poster', '#ffe0b8', '#ff9ad5'),
    item('wallshelf_bg', 'Wall Shelf', '벽 선반', 'background', 'gold', 2700, 'panel', 'wallshelf', '#e8c88a', '#7fd2ff'),
    item('wallart_frame', 'Wall Art', '벽 그림', 'background', 'gold', 2900, 'panel', 'wallart', '#fff7e0', '#ff9a5a'),
    item('curtain_drape', 'Cozy Curtain', '아늑한 커튼', 'background', 'gold', 2500, 'panel', 'curtain', '#ffd0e0', '#ff9ad5'),
    item('wallpaperdot_bg', 'Dotted Wallpaper', '물방울 벽지', 'background', 'gold', 2100, 'panel', 'wallpaperdot', '#fff0f7', '#c7a4ff'),

    // --- furniture (16) - sofa/chair/stool->sit, bed->sleep, tv->watch,
    // fridge->eat are `use`-tagged for the nest idle AI (nestscene.js);
    // everything else here is decorative only.
    item('bed_cozy', 'Cozy Bed', '아늑한 침대', 'furniture', 'gold', 3500, 'item', 'bed', '#ffb0c0', '#fff7e0', null, 'sleep'),
    item('lamp_post', 'Garden Lamp', '정원 램프', 'furniture', 'gold', 2600, 'item', 'lamp', '#ffe066', '#fff7e0'),
    item('table_small', 'Little Table', '작은 테이블', 'furniture', 'gold', 3000, 'item', 'table', '#c9a06a', '#a5732e'),
    item('shelf_wood', 'Wooden Shelf', '나무 선반', 'furniture', 'gold', 2800, 'item', 'shelf', '#b98050', '#7dffb2'),
    item('bench_pastel', 'Pastel Bench', '파스텔 벤치', 'furniture', 'gold', 3300, 'item', 'bench', '#a3ecff', '#7fd2ff'),
    item('sofa_comfy', 'Comfy Sofa', '포근한 소파', 'furniture', 'gold', 3800, 'item', 'sofa', '#ff9ad5', '#fff7e0', null, 'sit'),
    item('chair_wood', 'Wooden Chair', '나무 의자', 'furniture', 'gold', 2400, 'item', 'chair', '#c9a06a', '#a5732e', null, 'sit'),
    item('fridge_pastel', 'Pastel Fridge', '파스텔 냉장고', 'furniture', 'gold', 3600, 'item', 'fridge', '#cfeaff', '#7fd2ff', null, 'eat'),
    item('tv_retro', 'Retro TV', '레트로 티비', 'furniture', 'gold', 4200, 'item', 'tv', '#b98050', '#7fd2ff', null, 'watch'),
    item('clock_wall', 'Wall Clock', '벽시계', 'furniture', 'gold', 2000, 'item', 'clock', '#fff7e0', '#ff9a5a'),
    item('plant_pot', 'Potted Plant', '화분', 'furniture', 'gold', 1900, 'item', 'plant', '#7dffb2', '#c9a06a'),
    item('dresser_drawer', 'Dresser', '서랍장', 'furniture', 'gold', 3100, 'item', 'dresser', '#ffe0b8', '#c9a06a'),
    item('mirror_oval', 'Oval Mirror', '타원 거울', 'furniture', 'gold', 2700, 'item', 'mirror', '#cfeaff', '#e8c88a'),
    item('stool_round', 'Round Stool', '둥근 스툴', 'furniture', 'gold', 1800, 'item', 'stool', '#ff9a5a', '#a5732e', null, 'sit'),
    item('cabinet_storage', 'Storage Cabinet', '수납장', 'furniture', 'gold', 3200, 'item', 'cabinet', '#e8c88a', '#a5732e'),
    item('bookshelf_full', 'Full Bookshelf', '가득찬 책장', 'furniture', 'gold', 3400, 'item', 'bookshelf', '#b98050', '#ff9a5a'),

    // --- toy (12) - nest idle AI targets cat==='toy' items (see nestscene.js) ---
    item('ball_bouncy', 'Bouncy Ball', '통통볼', 'toy', 'gold', 2200, 'item', 'ball', '#ff9ad5', '#ffffff'),
    item('swing_set', 'Swing Set', '그네', 'toy', 'gold', 4000, 'item', 'swing', '#ffd54a', '#7dffb2'),
    item('mushroom_bounce', 'Bounce Mushroom', '통통버섯', 'toy', 'gold', 3200, 'item', 'mushroom', '#ff7d7d', '#fff7e0'),
    item('kite_flyer', 'Flying Kite', '연날리기', 'toy', 'gold', 3600, 'item', 'kite', '#7fd2ff', '#ffe066'),
    item('drum_toy', 'Toy Drum', '장난감 드럼', 'toy', 'gold', 2800, 'item', 'drum', '#ff9a5a', '#ffe066'),
    item('yarn_ball', 'Yarn Ball', '실뭉치', 'toy', 'gold', 1600, 'item', 'yarn', '#ff9ad5', '#fff0f7'),
    item('ringtoss_set', 'Ring Toss', '고리 던지기', 'toy', 'gold', 2600, 'item', 'ringtoss', '#ff9a5a', '#7fd2ff'),
    item('plushie_bear', 'Plushie Bear', '곰인형', 'toy', 'gold', 3000, 'item', 'plushie', '#ffe0b8', '#c9a06a'),
    item('scratch_post', 'Scratching Post', '스크래처 기둥', 'toy', 'gold', 2400, 'item', 'scratchpost', '#e8c88a', '#ff9ad5'),
    item('play_tunnel', 'Play Tunnel', '놀이 터널', 'toy', 'gold', 3400, 'item', 'tunnel', '#7fd2ff', '#cfeaff'),
    item('feather_wand', 'Feather Wand', '깃털 낚싯대', 'toy', 'gold', 1800, 'item', 'featherwand', '#ffe066', '#ff9ad5'),
    item('puzzle_cube', 'Puzzle Cube', '퍼즐 큐브', 'toy', 'gold', 2900, 'item', 'puzzlecube', '#7fd2ff', '#ff9ad5'),

    // --- special (9) - premium, gem-priced ---
    item('statue_gold', 'Golden Statue', '황금 조각상', 'special', 'gems', 25, 'item', 'statue', '#e8b82e', '#ffd54a'),
    item('fountain_gem', 'Gem Fountain', '보석 분수', 'special', 'gems', 35, 'item', 'fountain', '#7fd2ff', '#bfe8ff'),
    item('crystal_orb', 'Crystal Orb', '크리스탈 구슬', 'special', 'gems', 20, 'item', 'crystal', '#c7a4ff', '#e0b3ff'),
    item('rainbow_arch', 'Rainbow Arch', '무지개 아치', 'special', 'gems', 50, 'item', 'arch', '#ff9ad5', '#ffe066'),
    item('neon_sign', 'Neon Sign', '네온 사인', 'special', 'gems', 30, 'item', 'neon', '#ff5ad5', '#7fffea'),
    item('aquarium_glow', 'Glowing Aquarium', '빛나는 수족관', 'special', 'gems', 40, 'item', 'aquarium', '#7fd2ff', '#ffd54a'),
    item('disco_ball', 'Disco Ball', '디스코 볼', 'special', 'gems', 45, 'item', 'discoball', '#cfeaff', '#ffe066'),
    item('trophy_cup', 'Champion Trophy', '챔피언 트로피', 'special', 'gems', 28, 'item', 'trophy', '#ffd54a', '#e8b82e'),
    item('chandelier_gem', 'Gem Chandelier', '보석 샹들리에', 'special', 'gems', 55, 'item', 'chandelier', '#c7a4ff', '#ffd54a')
];

const Decor = {

    // v6 Task 9: 6x4 (24 cells) -> 12x8 (96 cells), an exact 2x subdivision
    // on both axes - see NEST_CELL_W/H halving in nestscene.js.
    GRID: { cols: 12, rows: 8 },

    byId(id) {
        return DECOR_ITEMS.find(d => d.id === id) || null;
    },

    // Pure placement check. save = { decorOwned, decorPlaced } (or the full
    // SaveManager.state, which is a superset) - never mutated here.
    // Rules: in-bounds cell, cell not already occupied by ANY item, and the
    // player must own strictly more copies of `id` than are already placed.
    canPlace(save, id, gx, gy) {
        if (!this.byId(id)) return false;
        if (gx < 0 || gx >= this.GRID.cols || gy < 0 || gy >= this.GRID.rows) return false;
        const placed = (save && save.decorPlaced) || [];
        if (placed.some(p => p.gx === gx && p.gy === gy)) return false;
        const owned = (save && save.decorOwned && save.decorOwned[id]) || 0;
        const placedCount = placed.filter(p => p.id === id).length;
        return owned > placedCount;
    },

    // Weighted random grant (monster drop 'decor' case, game.js applyDrop):
    // unowned items are 3x more likely than already-owned ones, nudging
    // the player toward completing the catalog. Mutates save.decorOwned
    // (creating it if missing) and returns the granted item id.
    grantRandom(save, rng) {
        if (save && !save.decorOwned) save.decorOwned = {};
        const owned = (save && save.decorOwned) || {};
        const weights = DECOR_ITEMS.map(d => (owned[d.id] ? 1 : 3));
        const total = weights.reduce((a, w) => a + w, 0);
        let roll = rng() * total;
        let picked = DECOR_ITEMS[DECOR_ITEMS.length - 1].id;
        for (let i = 0; i < DECOR_ITEMS.length; i++) {
            roll -= weights[i];
            if (roll <= 0) { picked = DECOR_ITEMS[i].id; break; }
        }
        if (save) owned[picked] = (owned[picked] || 0) + 1;
        return picked;
    }
};

if (typeof module !== 'undefined') module.exports = { DECOR_ITEMS, Decor };
