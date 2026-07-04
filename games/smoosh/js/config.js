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

    // Monster play field (below the top HUD, above the fever/upgrade bar)
    FIELD: { x: 20, y: 210, w: 680, h: 780 },

    // =========================================================================
    // v4.0 - pastel token system. CONFIG.PASTEL is the source of truth (design
    // tokens: soft cream/lavender surfaces, deep-plum ink, 8 per-element 3-step
    // ramps). CONFIG.COLORS keeps its original keys for existing consumers but
    // every value now points at a PASTEL equivalent - see tests/pastel.test.js
    // for the contrast/distinctness invariants this palette must hold.
    // =========================================================================
    PASTEL: {
        bg: 0xf6f1fb,          // page/canvas background - soft lavender-cream
        bgField: 0xefe6f9,     // monster play-field backdrop, one notch deeper
        panel: 0xe3d6f2,       // card/panel surface
        panelLight: 0xf0e6fa,  // lighter nested panel / highlight surface
        ink: 0x453a56,         // primary text - deep plum, NOT black
        inkSoft: 0x6f6485,     // secondary/dim text on panel surfaces
        accent: 0x9b7fd4,      // pastel violet UI accent
        gold: 0xe8b74a,        // currency accent
        danger: 0xf2727e,      // damage/danger accent
        // v4.0 Phase C Task 2: nudged off elements.leaf.base (manhattan was 19,
        // needed >=48 so heal/positive pop-text never blends into leaf-element
        // monsters) - deeper/more teal-leaning green, see tests/pastel.test.js.
        good: 0x62cd90,        // heal/positive accent
        fever: 0xff8fcf,       // fever-mode accent
        // v4.0 Phase C Task 2: nudged off elements.electric.base (manhattan was
        // 15, needed >=48 so crit pop-text never blends into electric-element
        // monsters) - deeper/more muted gold, see tests/pastel.test.js.
        crit: 0xe9cf77,        // critical-hit accent
        white: 0xffffff,
        // v4.0 Phase C Task 2: readable text on panel/panelLight surfaces
        goldText: 0x6d5318,    // deep amber for cost/currency text (WCAG >=4.5:1 on panel)
        goodText: 0x1a5c3f,    // deep forest green for heal/positive text (WCAG >=4.5:1 on panel)
        // v4.0 Phase C Task 3: same on-panel-text problem, two more hue
        // families needed by the shop/friends/pvp sweep (danger warnings +
        // decline actions; gems currency + "rare" rarity tier) that Task 2's
        // goldText/goodText didn't cover. Same >=4.5:1 vs panel/panelLight
        // floor, see tests/pastel.test.js.
        dangerText: 0x8a2430,  // deep brick red for warning/decline text (WCAG >=4.5:1 on panel)
        gemText: 0x0d5a73,     // deep teal for gem-currency/rare-rarity text (WCAG >=4.5:1 on panel)
        elements: {
            fire:     { base: 0xff8a65, soft: 0xffc2ab, deep: 0xc85a38 },  // coral
            water:    { base: 0x82c3ea, soft: 0xc3e6f7, deep: 0x4f88b3 },  // baby blue
            leaf:     { base: 0x74e0a3, soft: 0xbdf3d4, deep: 0x45a86e },  // mint
            wind:     { base: 0x93b3c4, soft: 0xc6dae4, deep: 0x607e92 },  // sage-sky
            electric: { base: 0xffe066, soft: 0xfff0b0, deep: 0xd1a921 },  // butter yellow
            ice:      { base: 0xb2e8f0, soft: 0xdcf6fa, deep: 0x74b9c4 },  // powder cyan
            light:    { base: 0xfff0c4, soft: 0xfff8e2, deep: 0xd9bd7e },  // vanilla
            dark:     { base: 0xb49bc8, soft: 0xd9cbe6, deep: 0x7f6693 }   // dusty lilac
        }
    },

    COLORS: {
        bg: 0xf6f1fb,
        hud: 0x453a56,
        gold: 0xe8b74a,
        fever: 0xff8fcf,
        crit: 0xe9cf77,
        dim: 0x6f6485,
        panel: 0xe3d6f2,
        good: 0x62cd90,
        danger: 0xf2727e
    },

    // UI order matters: this is the upgrade bar layout order.
    UPGRADES: [
        // v3.0: waves are uncapped (Balance.waveSize), so the greedy sim's
        // income grows unboundedly and the optimal player 1-taps too much.
        // tap costGrowth raised 1.352 -> 1.372 (the highest +0.002 step that
        // keeps the 1-6 taps band intact) to restore meaningful difficulty:
        // greedy sim stays in the 1-6 band, ~42% of stages need 2+ taps
        // (see tests/balance.test.js). Any higher pushes tail stages past 6.
        { id: 'tap',    name: 'Tap Power',    baseCost: 10, costGrowth: 1.372, icon: 'up-tap',    color: 0x5aa9ff },
        { id: 'crit',   name: 'Critical',     baseCost: 25, costGrowth: 1.22, icon: 'up-crit',   color: 0xffe066, maxLevel: 22 },
        { id: 'splash', name: 'Splash',       baseCost: 40, costGrowth: 1.30, icon: 'up-splash', color: 0xff9a5a, maxLevel: 10 },
        { id: 'fever',  name: 'Fever Charge', baseCost: 30, costGrowth: 1.25, icon: 'up-fever',  color: 0xff5ec4 },
        { id: 'gold',   name: 'Gold Boost',   baseCost: 30, costGrowth: 1.25, icon: 'up-gold',   color: 0xffd54a }
    ],

    FEVER: {
        gaugeMax: 30,
        durationMs: 6000,
        damageMult: 10,
        splashRadius: 140,     // universal splash radius during fever (px)
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
        // gold egg rates              // gem egg rates (premium, better odds)
        rates:    { common: 0.60, rare: 0.25, epic: 0.12, legendary: 0.03 },
        gemRates: { common: 0.40, rare: 0.30, epic: 0.20, legendary: 0.10 },
        pityAt: 40,          // guaranteed epic+ within this many rolls
        multiPull: 10,       // 10+1: multi pull grants one bonus roll
        shardsForDupe: { common: 5, rare: 15, epic: 40, legendary: 120 },
        shardsPerLevel: 8    // spend shards of a species to level its pet
    },

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
