// =============================================================================
// SMOOSH! - config.js
// Global constants: layout, colors, upgrade definitions, fever/ads/boss/combo
// policy. Loaded first; everything else reads from CONFIG.
// Numeric balance CURVES live in balance.js - this file is policy only.
// =============================================================================

const CONFIG = {

    // Design resolution (portrait)
    WIDTH: 720,
    HEIGHT: 1280,

    // v5.0 RETRO ARCADE Task 2: vendored OFL pixel font (www/fonts/, see
    // www/css/style.css @font-face). Every Phaser text fontFamily reads this
    // - single point of truth so a future font swap is a one-line change.
    FONT: "'Press Start 2P', monospace",

    // v5.0 RETRO ARCADE Task 3: character art is baked to a SMALL raster at
    // BootScene registration time (main.js _loadSpeciesTextures forces the
    // SVG's width/height attrs to this instead of the species' natural
    // display size), then upscaled with NEAREST filtering wherever it's
    // shown (dex/field/nest/gacha/pvp all setDisplaySize() from these same
    // texture keys, so every consumer inherits automatically). That low
    // sample count is what actually reads as "chunky pixel sprite" - Task
    // 2's global pixelArt:true only stops smoothing on upscale, it can't
    // pixelate an already-smooth full-res raster.
    // bake=40: verified against paintJelly/paintAnimal's geometry (both
    // scale every feature off their own radius r, so this is a resolution
    // cut, not a proportion change) - smallest monster is Mini at r=26/d=52
    // (40 is a mild 0.77x of its native res), and pets are painted at a
    // fixed r=24/d=48 (40 is 0.83x) - signature parts (ears/horns/props,
    // all sized >=0.065r) stay well above 1px at 40x40 for every case
    // except the giant king boss (r=240/d=480, a deliberately extreme
    // 12x-blocky pixel-boss look, not a legibility failure - its parts are
    // the same >=0.065r fraction, just of a much larger silhouette).
    // bakeDecor=48: decor props (paintDecor, decor.js) are hand-drawn scenes
    // on a fixed 64x64 canvas with several small independent details
    // (speckle dots r=1.6-2.4, star dots r=2) that read as *distinct props*
    // rather than a single blob - 48 (0.75x) keeps those legible; the plain
    // 40 used for monsters/pets started blending them in a structural check.
    PIXEL: { bake: 40, bakeDecor: 48, filter: 'NEAREST' },

    // Monster play field (below the top HUD, above the fever/upgrade bar)
    FIELD: { x: 20, y: 210, w: 680, h: 780 },

    // =========================================================================
    // v5.0 RETRO ARCADE - neon-CRT token system. CONFIG.PASTEL is (still) the
    // source of truth - same KEYS as the v4.0 pastel theme, re-pointed to a
    // dark 80s-arcade neon palette (deep indigo-black surfaces, near-white
    // cyan-tint ink, saturated neon accents, 8 per-element 3-step ramps).
    // CONFIG.COLORS keeps its original keys for existing consumers but every
    // value still points at a PASTEL equivalent - see tests/pastel.test.js
    // for the contrast/distinctness invariants this palette must hold (now
    // flipped for light-text-on-dark-surface contrast).
    // =========================================================================
    PASTEL: {
        bg: 0x0d0221,          // page/canvas background - deep indigo-black
        bgField: 0x160934,     // monster play-field backdrop, one notch lighter
        panel: 0x1f0f47,       // card/panel surface
        panelLight: 0x2c1966,  // lighter nested panel / highlight surface
        ink: 0xeafcff,         // primary text - bright near-white cyan-tint
        inkSoft: 0xa79bd6,     // secondary/dim text on panel surfaces - muted lavender
        accent: 0x00e5ff,      // neon cyan UI accent
        gold: 0xffcc00,        // neon amber currency accent
        danger: 0xff2f6e,      // neon red-pink damage/danger accent
        // v4.0 Phase C Task 2: nudged off elements.leaf.base (manhattan was 19,
        // needed >=48 so heal/positive pop-text never blends into leaf-element
        // monsters) - v5.0: neon lime, still >=48 from the new leaf spring-green.
        good: 0x39ff14,        // neon lime heal/positive accent
        fever: 0xff00e5,       // hot magenta fever-mode accent
        // v4.0 Phase C Task 2: nudged off elements.electric.base (manhattan was
        // 15, needed >=48 so crit pop-text never blends into electric-element
        // monsters) - v5.0: electric chartreuse-yellow, still >=48 from electric.
        crit: 0xccff00,        // electric-yellow critical-hit accent
        white: 0xffffff,
        // v4.0 Phase C Task 2/3: readable text on panel/panelLight surfaces -
        // v5.0: re-derived as neon-bright light-on-dark variants (panels are
        // now dark), WCAG >=4.5:1 vs both panel and panelLight.
        goldText: 0xffd94a,    // bright neon amber for cost/currency text
        goodText: 0x5dff8f,    // bright neon mint-green for heal/positive text
        dangerText: 0xff6f91,  // bright neon rose for warning/decline text
        gemText: 0x5be3ff,     // bright neon sky-cyan for gem-currency/rare-rarity text
        elements: {
            fire:     { base: 0xff2d55, soft: 0xff8fa8, deep: 0xa8001f },  // hot neon red
            water:    { base: 0x00d9ff, soft: 0x7deeff, deep: 0x0089a8 },  // neon cyan
            leaf:     { base: 0x00ffab, soft: 0x7cffd4, deep: 0x00a870 },  // spring-green neon
            wind:     { base: 0x8fd9c0, soft: 0xc5f0e0, deep: 0x4f9c86 },  // pale neon teal
            electric: { base: 0xfff200, soft: 0xfff98f, deep: 0xa89e00 },  // electric yellow
            ice:      { base: 0x9fefff, soft: 0xd2f9ff, deep: 0x5aa8b8 },  // ice-blue neon
            light:    { base: 0xfff6d5, soft: 0xfffbec, deep: 0xc9b97a },  // white-gold neon
            dark:     { base: 0xb44bff, soft: 0xd6a0ff, deep: 0x6d1fa8 }   // electric violet
        }
    },

    COLORS: {
        bg: 0x0d0221,
        hud: 0xeafcff,
        gold: 0xffcc00,
        fever: 0xff00e5,
        crit: 0xccff00,
        dim: 0xa79bd6,
        panel: 0x1f0f47,
        good: 0x39ff14,
        danger: 0xff2f6e
    },

    // UI order matters: this is the upgrade bar layout order.
    UPGRADES: [
        // v3.0: waves are uncapped (Balance.waveSize), so the greedy sim's
        // income grows unboundedly and the optimal player 1-taps too much.
        // tap costGrowth raised 1.352 -> 1.372 (the highest +0.002 step that
        // keeps the 1-6 taps band intact) to restore meaningful difficulty:
        // greedy sim stays in the 1-6 band, ~42% of stages need 2+ taps
        // (see tests/balance.test.js). Any higher pushes tail stages past 6.
        // v6 Task 1: lowering Balance.critChance's slope/ceiling (0.6->0.5-ish
        // effective crit) shrinks expectedDamage, so the sim needs MORE taps
        // per mob than before - 1.372 pushed tail stages (~198) to 8-9 taps,
        // out of band. Retuned 1.372 -> 1.368 (smallest 0.001 step that brings
        // the band back to <=6 at every stage 5-200; verified maxTaps=6 at
        // stage 196) - the 2+-taps floor and avg-taps floor both stay well
        // clear (~47.5% >= 42%, avg ~1.93 >= 1.8), so difficulty intent holds.
        // v6 Task 2: mobHP growth steepened 1.25 -> 1.30/stage (balance.js).
        // costGrowth here is UNCHANGED - the ~9k-combo sweep (balance.js
        // mobHP comment) found passing pairs by raising goldPerMob growth
        // (1.22->1.25) and tapDamage growth (1.35->1.376) instead, so this
        // stays 1.368.
        { id: 'tap',    name: 'Tap Power',    baseCost: 10, costGrowth: 1.368, icon: 'up-tap',    color: 0x5aa9ff },
        { id: 'crit',   name: 'Critical',     baseCost: 25, costGrowth: 1.22, icon: 'up-crit',   color: 0xffe066, maxLevel: 22 },
        // v6 Task 1: maxLevel raised 10 -> 32 to pair with balance.js's slower
        // per-level radius (14px, was 22px) - new ceiling 14*32=448px, ~2x the
        // old 22*10=220px ceiling instead of shrinking it.
        { id: 'splash', name: 'Splash',       baseCost: 40, costGrowth: 1.30, icon: 'up-splash', color: 0xff9a5a, maxLevel: 32 },
        { id: 'fever',  name: 'Fever Charge', baseCost: 30, costGrowth: 1.25, icon: 'up-fever',  color: 0xff5ec4 },
        { id: 'gold',   name: 'Gold Boost',   baseCost: 30, costGrowth: 1.25, icon: 'up-gold',   color: 0xffd54a }
    ],

    FEVER: {
        gaugeMax: 30,
        durationMs: 6000,
        damageMult: 10,
        // v6 Task 1: doubled 140 -> 280 to stay proportionally impactful next
        // to the new, higher per-upgrade splash ceiling (see UPGRADES.splash).
        splashRadius: 280,     // universal splash radius during fever (px)
        adRefillBelow: 0.5     // AD refill chip visible when gauge < 50%
    },

    ADS: {
        interstitialEveryStages: 5,
        interstitialCooldownMs: 60000
    },

    COMBO: {
        windowMs: 1200,
        milestones: [10, 25, 50]
    },

    BOSS: {
        every: 10,     // every Nth stage is a boss stage
        hpMult: 25,    // boss HP = hpMult x stage mob HP
        goldMult: 15,  // boss gold = goldMult x stage mob gold
        slowMoMs: 300
    },

    // --- v2.0 ---
    NEST: {
        nibbleChance: 0.25,  // share of a wave that heads for the nest (stage >= nibbleFrom)
        nibbleFrom: 3,
        x: 360, y: 900       // nest position (design coords)
    },

    GACHA: {
        // v5.0 RETRO ARCADE Task 4: legendary pets are gem-egg only. Gold
        // egg's old 0.03 legendary mass was redistributed into common/rare/
        // epic (+0.00/+0.01/+0.02, sum still 1) so gold caps at epic - a
        // legendary pet is only obtainable from the gem egg. gemRates is
        // unchanged (already summed to 1 with a positive legendary share).
        // gold egg rates              // gem egg rates (premium, better odds)
        rates:    { common: 0.60, rare: 0.26, epic: 0.14, legendary: 0 },
        gemRates: { common: 0.40, rare: 0.30, epic: 0.20, legendary: 0.10 },
        pityAt: 40,          // guaranteed epic+ within this many rolls (gold: epic only - see gacha.js)
        multiPull: 10,       // 10+1: multi pull grants one bonus roll
        shardsForDupe: { common: 5, rare: 15, epic: 40, legendary: 120 },
        shardsPerLevel: 8    // spend shards of a species to level its pet
    },

    // v5 final-review fix: GACHA.rates used to be shared by the PET gacha
    // (gacha.js) AND every GEAR/necklace drop-rarity roll (field drops in
    // game.js, the gold chest in shop.js). Task 4 zeroed GACHA.rates.legendary
    // so gold-egg PETS cap at epic - but that same zero silently leaked into
    // gear/necklace drops too, which were never meant to lose their legendary
    // tier. DROP_RATES is the split-off table (the exact pre-Task-4 values)
    // for the non-pet item economy - every GEAR/ITEM/necklace rarity roll
    // reads this, never CONFIG.GACHA.rates. See tests/gacha.test.js.
    DROP_RATES: { common: 0.60, rare: 0.25, epic: 0.12, legendary: 0.03 },

    GEMS: {
        bossKill: 1, kingKill: 3,
        stageMilestoneEvery: 25, stageMilestoneGems: 5,
        pvpWin: 2,
        eggCost: 20, chestCost: 15   // gem prices in the shop
    },

    // v2.3: random item drops from kills - picked up = instantly used.
    DROPS: {
        chance: 0.06,   // per non-boss kill
        weights: [      // [type, weight]
            ['gold', 35], ['bomb', 20], ['heal', 15], ['fever', 15],
            ['gear', 8], ['decor', 4], ['necklace', 5], ['gem', 2]
        ],
        bombMult: 8,        // bomb damage = tapDmg x this, hits EVERYTHING
        healPct: 0.3,       // nest heal = 30% of max
        feverCharge: 10,    // fever gauge points
        goldMult: 3,        // gold pouch = goldPerMob x this
        // v3.0: click-to-collect - drops sit on the field and must be tapped.
        lifetimeMs: 8000,   // despawns (uncollected) at this age
        blinkFromMs: 6000   // starts blinking as a "running out of time" cue
    },

    // v3.0: waves grow forever, so mobs stream in in batches instead of all at
    // once - keep at most concurrentMax on the field, trickle reinforcements in.
    SPAWN: { concurrentMax: 28, trickleDelayMs: 350 },

    PVP: {
        teamSize: 5,
        tickMs: 800,          // one attack round per tick in presentation
        ratingWin: 20, ratingLose: -10,
        botPowerJitter: 0.15  // bot team = my power +-15%
    },

    // v3.5: Social gifting caps and daily limits
    GIFT: {
        maxGoldPerGift: 50000,
        maxGemsPerGift: 30,
        maxDecorPerGift: 1,
        dailySendLimit: 5
    },

    // Deterministic tiny hash (shared utility, same as Peel It!)
    dateHash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
        return h;
    }
};

if (typeof module !== 'undefined') module.exports = { CONFIG };
