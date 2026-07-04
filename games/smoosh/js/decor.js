// =============================================================================
// SMOOSH! - decor.js
// v3.5: nest decor - cosmetic props players buy/earn to place around the
// nest. Parametric pastel-prop painter (same spirit as catalog.js's
// paintJelly/paintAnimal) + a pure catalog/placement/grant API.
// =============================================================================

// Paint one decor prop SVG (64x64 canvas). shape picks the archetype;
// o = { pattern, c1, c2, c3 } - c3 defaults to the shared ink outline color.
function paintDecor(shape, o) {
    const c1 = o.c1, c2 = o.c2 || o.c1, c3 = o.c3 || '#221a38';
    let body = '';

    if (shape === 'mat') {
        body = `<rect x="6" y="18" width="52" height="30" rx="10" fill="${c1}" stroke="${c3}" stroke-width="2.5"/>`;
        if (o.pattern === 'rainbow') {
            body += `<path d="M10 33 Q32 20 58 33" stroke="${c2}" stroke-width="4" fill="none"/><path d="M10 40 Q32 28 58 40" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>`;
        } else if (o.pattern === 'stripe') {
            body += `<rect x="14" y="18" width="6" height="30" fill="${c2}"/><rect x="28" y="18" width="6" height="30" fill="${c2}"/><rect x="42" y="18" width="6" height="30" fill="${c2}"/>`;
        } else if (o.pattern === 'checker') {
            body += `<rect x="12" y="22" width="10" height="10" fill="${c2}"/><rect x="32" y="22" width="10" height="10" fill="${c2}"/><rect x="22" y="34" width="10" height="10" fill="${c2}"/><rect x="42" y="34" width="10" height="10" fill="${c2}"/>`;
        } else { // speckle (sand)
            body += `<circle cx="18" cy="28" r="2" fill="${c2}"/><circle cx="30" cy="36" r="2.2" fill="${c2}"/><circle cx="44" cy="26" r="1.8" fill="${c2}"/><circle cx="24" cy="24" r="1.6" fill="${c2}"/><circle cx="40" cy="40" r="2" fill="${c2}"/>`;
        }
    } else if (shape === 'pond') {
        body = `<ellipse cx="32" cy="36" rx="26" ry="16" fill="${c1}" stroke="${c3}" stroke-width="2.5"/>
  <path d="M14 32 Q32 26 50 32" stroke="#fff" stroke-width="2.5" fill="none" opacity=".55"/>
  <path d="M18 40 Q32 35 46 40" stroke="#fff" stroke-width="2" fill="none" opacity=".4"/>`;
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
  <path d="M8 52 A24 24 0 0 1 56 52" stroke="#fff" stroke-width="2" fill="none" opacity=".5" transform="translate(0,7)"/>`;
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
            mushroom: `<path d="M16 32 Q32 6 48 32 Z" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><circle cx="26" cy="22" r="2.4" fill="#fff" opacity=".8"/><circle cx="38" cy="18" r="2" fill="#fff" opacity=".8"/><rect x="26" y="32" width="12" height="20" rx="4" fill="${c2}" stroke="${c3}" stroke-width="2"/>`,
            kite:     `<path d="M32 8 L50 26 L32 56 L14 26 Z" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><path d="M32 8 L32 56 M14 26 L50 26" stroke="${c3}" stroke-width="1.5"/><path d="M32 56 q-4 6 0 10 q4 -4 0 4 q-4 -4 0 6" stroke="${c2}" stroke-width="2" fill="none"/>`,
            drum:     `<ellipse cx="32" cy="20" rx="18" ry="8" fill="${c2}" stroke="${c3}" stroke-width="2.5"/><path d="M14 20 L14 44 A18 8 0 0 0 50 44 L50 20" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><ellipse cx="32" cy="44" rx="18" ry="8" fill="none" stroke="${c3}" stroke-width="2"/>`,
            statue:   `<rect x="18" y="46" width="28" height="10" fill="${c3}" opacity=".4"/><rect x="22" y="34" width="20" height="14" fill="${c1}" stroke="${c3}" stroke-width="2"/><circle cx="32" cy="22" r="10" fill="${c2}" stroke="${c3}" stroke-width="2"/>`,
            fountain: `<ellipse cx="32" cy="50" rx="24" ry="8" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><rect x="28" y="20" width="8" height="26" fill="${c2}"/><ellipse cx="32" cy="20" rx="10" ry="4" fill="${c2}"/><path d="M32 14 q-6 4 0 10 q6 -6 0 -10" fill="#fff" opacity=".6"/>`,
            crystal:  `<path d="M32 6 L48 24 L38 58 L26 58 L16 24 Z" fill="${c1}" stroke="${c3}" stroke-width="2.5"/><path d="M32 6 L32 58 M16 24 L48 24" stroke="${c2}" stroke-width="1.5" opacity=".7"/>`,
            arch:     `<path d="M8 56 A24 24 0 0 1 56 56" stroke="${c1}" stroke-width="8" fill="none"/><path d="M8 56 A24 24 0 0 1 56 56" stroke="${c2}" stroke-width="3" fill="none" opacity=".7" transform="translate(0,-6)"/><path d="M8 56 A24 24 0 0 1 56 56" stroke="#fff" stroke-width="2" fill="none" opacity=".5" transform="translate(0,-11)"/>`
        };
        body = P[o.pattern] || '';
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`;
}

function item(id, nameEn, nameKo, cat, priceKind, priceAmount, shape, pattern, c1, c2, c3) {
    return {
        id,
        name: { en: nameEn, ko: nameKo },
        cat,
        price: { kind: priceKind, amount: priceAmount },
        svg: paintDecor(shape, { pattern, c1, c2, c3 })
    };
}

// 24 static-priced props, 5 categories (>=3 each - see tests/decor.test.js).
// Prices are NOT progress-indexed (unlike Balance.*Cost) - decor is a static
// gold/gem sink, cheap floor pieces ~1.5-3k gold up through premium 'special'
// pieces priced in gems (20-50).
const DECOR_ITEMS = [
    // --- floor (5) ---
    item('rug_rainbow', 'Rainbow Rug', '무지개 러그', 'floor', 'gold', 1500, 'mat', 'rainbow', '#fff7e0', '#ff9ad5'),
    item('rug_stripe', 'Cozy Stripe Rug', '아늑한 줄무늬 러그', 'floor', 'gold', 1800, 'mat', 'stripe', '#ffe0b8', '#ff9a5a'),
    item('tile_checker', 'Checker Tile', '체커 타일', 'floor', 'gold', 2200, 'mat', 'checker', '#cfeaff', '#7fd2ff'),
    item('sand_patch', 'Sandy Patch', '모래밭', 'floor', 'gold', 1600, 'mat', 'speckle', '#ffe9b8', '#e8b96a'),
    item('pond_blue', 'Lily Pond', '연꽃 연못', 'floor', 'gold', 3000, 'pond', null, '#a3ecff'),

    // --- background (5) ---
    item('fence_picket', 'Picket Fence', '나무 울타리', 'background', 'gold', 2000, 'panel', 'fence', '#e8c88a', '#c9a06a'),
    item('backdrop_hills', 'Rolling Hills', '푸른 언덕', 'background', 'gold', 2800, 'panel', 'hills', '#cfe8ff', '#a8e05f'),
    item('backdrop_stars', 'Starry Night', '별밤', 'background', 'gold', 3200, 'panel', 'stars', '#241f3d', '#ffe066'),
    item('backdrop_rainbow', 'Rainbow Sky', '무지개 하늘', 'background', 'gold', 3600, 'panel', 'rainbow', '#dfe6ff', '#ff9ad5'),
    item('cloud_deco', 'Fluffy Clouds', '뭉게구름', 'background', 'gold', 2400, 'panel', 'cloud', '#bfe0ff', '#ffffff'),

    // --- furniture (5) ---
    item('bed_cozy', 'Cozy Bed', '아늑한 침대', 'furniture', 'gold', 3500, 'item', 'bed', '#ffb0c0', '#fff7e0'),
    item('lamp_post', 'Garden Lamp', '정원 램프', 'furniture', 'gold', 2600, 'item', 'lamp', '#ffe066', '#fff7e0'),
    item('table_small', 'Little Table', '작은 테이블', 'furniture', 'gold', 3000, 'item', 'table', '#c9a06a', '#a5732e'),
    item('shelf_wood', 'Wooden Shelf', '나무 선반', 'furniture', 'gold', 2800, 'item', 'shelf', '#b98050', '#7dffb2'),
    item('bench_pastel', 'Pastel Bench', '파스텔 벤치', 'furniture', 'gold', 3300, 'item', 'bench', '#a3ecff', '#7fd2ff'),

    // --- toy (5) - nest idle AI targets cat==='toy' items (see nest.js) ---
    item('ball_bouncy', 'Bouncy Ball', '통통볼', 'toy', 'gold', 2200, 'item', 'ball', '#ff9ad5', '#ffffff'),
    item('swing_set', 'Swing Set', '그네', 'toy', 'gold', 4000, 'item', 'swing', '#ffd54a', '#7dffb2'),
    item('mushroom_bounce', 'Bounce Mushroom', '통통버섯', 'toy', 'gold', 3200, 'item', 'mushroom', '#ff7d7d', '#fff7e0'),
    item('kite_flyer', 'Flying Kite', '연날리기', 'toy', 'gold', 3600, 'item', 'kite', '#7fd2ff', '#ffe066'),
    item('drum_toy', 'Toy Drum', '장난감 드럼', 'toy', 'gold', 2800, 'item', 'drum', '#ff9a5a', '#ffe066'),

    // --- special (4) - premium, gem-priced ---
    item('statue_gold', 'Golden Statue', '황금 조각상', 'special', 'gems', 25, 'item', 'statue', '#e8b82e', '#ffd54a'),
    item('fountain_gem', 'Gem Fountain', '보석 분수', 'special', 'gems', 35, 'item', 'fountain', '#7fd2ff', '#bfe8ff'),
    item('crystal_orb', 'Crystal Orb', '크리스탈 구슬', 'special', 'gems', 20, 'item', 'crystal', '#c7a4ff', '#e0b3ff'),
    item('rainbow_arch', 'Rainbow Arch', '무지개 아치', 'special', 'gems', 50, 'item', 'arch', '#ff9ad5', '#ffe066')
];

const Decor = {

    GRID: { cols: 6, rows: 4 },

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
