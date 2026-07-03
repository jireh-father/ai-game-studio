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

    COLORS: {
        bg: 0x141020,
        hud: 0xe8e6f5,
        gold: 0xffd54a,
        fever: 0xff5ec4,
        crit: 0xfff06a,
        dim: 0x5a5570,
        panel: 0x201a33,
        good: 0x7dffb2,
        danger: 0xff6b6b
    },

    // UI order matters: this is the upgrade bar layout order.
    UPGRADES: [
        // tap costGrowth 1.352 + dmg growth 1.35 (HP 1.25^n, gold 1.22^n) =
        // the v2.2 equilibrium: greedy sim stays in the 1-6 taps band,
        // ~46% of stages need 2+ taps (see tests/balance.test.js).
        { id: 'tap',    name: 'Tap Power',    baseCost: 10, costGrowth: 1.352, icon: 'up-tap',    color: 0x5aa9ff },
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
            ['gear', 8], ['necklace', 5], ['gem', 2]
        ],
        bombMult: 8,        // bomb damage = tapDmg x this, hits EVERYTHING
        healPct: 0.3,       // nest heal = 30% of max
        feverCharge: 10,    // fever gauge points
        goldMult: 3         // gold pouch = goldPerMob x this
    },

    PVP: {
        teamSize: 3,
        tickMs: 800,          // one attack round per tick in presentation
        ratingWin: 20, ratingLose: -10,
        botPowerJitter: 0.15  // bot team = my power +-15%
    },

    // Deterministic tiny hash (shared utility, same as Peel It!)
    dateHash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
        return h;
    }
};

if (typeof module !== 'undefined') module.exports = { CONFIG };
