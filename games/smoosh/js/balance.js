// =============================================================================
// SMOOSH! - balance.js
// Pure math: monster/gold curves, upgrade costs & effects, and the greedy
// progression simulation that the 200-stage invariant test runs against.
// No Phaser, no DOM. tests/balance.test.js owns the truth - tune constants
// here until the 1-5 taps-per-mob band holds.
// =============================================================================

const Balance = {

    // --- stage curves ---
    // v2.2 pass: HP +25%/stage (user: v2.1's +45% halved back). Economy
    // retuned to match: gold 1.22^n, dmg 1.35^L, tap costGrowth 1.352
    // (the invariant test still owns the truth).
    mobHP(stage) {
        return Math.round(3 * Math.pow(1.25, stage));
    },

    waveSize(stage) {
        return Math.min(8 + Math.floor(stage * 1.1), 32);
    },

    // Boss HP multiplier grows with every boss: stage 10 -> x25 mob HP,
    // stage 50 -> x75, stage 100 -> x137.5 ... (the "huge energy" ramp).
    bossHpMult(stage) {
        const bossIndex = Math.max(1, Math.floor(stage / CONFIG.BOSS.every));
        return CONFIG.BOSS.hpMult * (1 + (bossIndex - 1) * 0.5);
    },

    // v1.2: monsters also get FASTER as stages climb (+0.6%/stage, cap 2.2x).
    speedMult(stage) {
        return Math.min(2.2, 1 + stage * 0.006);
    },

    // =========================================================================
    // v2.0 - player level (XP from kills & clears; +2% damage per level)
    // =========================================================================
    xpNeeded(level)        { return Math.round(25 * Math.pow(1.35, level - 1)); },
    levelDamageMult(level) { return 1 + 0.02 * (level - 1); },

    // =========================================================================
    // v2.0 - the Nest (defend target). One level drives everything.
    // =========================================================================
    nestMaxHp(L)  { return Math.round(40 * Math.pow(1.28, L - 1)); },
    nestRegen(L)  { return 0.5 + 0.4 * (L - 1); },                        // hp/s
    nestThorns(L, tapLevel) { return this.tapDamage(tapLevel) * 0.15 * (L - 1); },
    petSlots(L)   { return Math.min(3, 1 + Math.floor((L - 1) / 5)); },
    NEST_BITE_DPS: 2,   // per attached nibbler, flat by design (upgrade race)

    // =========================================================================
    // v2.0 - pets. Damage rides the player's tap level so pets stay relevant.
    // =========================================================================
    PET_RARITY_MULT: { common: 1, rare: 1.5, epic: 2.2, legendary: 3.2 },

    petDamage(petLevel, tapLevel, rarity, necklace) {
        return this.tapDamage(tapLevel) * (0.25 + 0.06 * petLevel)
            * (this.PET_RARITY_MULT[rarity] || 1)
            * (1 + this.petNecklaceBonus(necklace));
    },
    petHP(petLevel, tapLevel, rarity) {
        return this.petDamage(petLevel, tapLevel, rarity) * 9;
    },
    petNecklaceBonus(rarity) {
        return { common: 0.10, rare: 0.25, epic: 0.50, legendary: 1.0 }[rarity] || 0;
    },

    // Element counters: fire > leaf > water > fire; electric ignores counters.
    // (v2.1: takes ELEMENT names - every animal carries its element.)
    elementMult(attacker, defender) {
        const beats = { fire: 'leaf', leaf: 'water', water: 'fire' };
        if (attacker === 'electric' || defender === 'electric') return 1;
        if (beats[attacker] === defender) return 1.5;
        if (beats[defender] === attacker) return 0.75;
        return 1;
    },

    // =========================================================================
    // v2.0 - equipment (glove: +tap%, ring: +crit abs, charm: +gold%)
    // =========================================================================
    RARITY_MULT: { common: 1, rare: 2, epic: 4, legendary: 8 },
    itemBonus(slot, rarity, level) {
        const base = { glove: 0.05, ring: 0.01, charm: 0.04 }[slot] || 0;
        return base * (this.RARITY_MULT[rarity] || 1) * (1 + 0.2 * (level || 0));
    },

    // Final combat/economy stats: upgrades + player level + equipment.
    effective(st) {
        const up = st.upgrades;
        const items = st.items || {};
        const b = (slot) => items[slot]
            ? this.itemBonus(slot, items[slot].rarity, items[slot].level) : 0;
        return {
            tapDmg: this.tapDamage(up.tap) * this.levelDamageMult(st.level || 1) * (1 + b('glove')),
            crit: Math.min(0.6, this.critChance(up.crit) + b('ring')),
            goldMult: this.goldMult(up.gold) * (1 + b('charm'))
        };
    },

    // =========================================================================
    // v2.0 - shop pricing, indexed to progress (goldPerMob at best stage)
    // so prices stay meaningful forever.
    // =========================================================================
    // v2.2: FIXED egg price (progress-indexed only, no per-pet inflation)
    eggCost(stage)              { return Math.round(this.goldPerMob(stage) * 80); },
    chestCost(stage)            { return Math.round(this.goldPerMob(stage) * 45); },
    nestUpCost(stage, L)        { return Math.round(this.goldPerMob(stage) * 30 * L); },
    petFeedCost(stage, petLv)   { return Math.round(this.goldPerMob(stage) * 10 * petLv); },
    itemEnhanceCost(stage, lv)  { return Math.round(this.goldPerMob(stage) * 12 * (lv + 1)); },

    // Short number formatting so UI values never overflow: 1.2k, 34m, 5.6b...
    fmt(n) {
        n = Math.round(n);
        if (n < 1000) return String(n);
        // extended for the v2.1 steep curves: covers up to 1e36
        const units = ['k', 'm', 'b', 't', 'q', 'Q', 's', 'S', 'o', 'n', 'd'];
        let v = n, u = -1;
        while (v >= 1000 && u < units.length - 1) { v /= 1000; u++; }
        const s = v >= 100 ? String(Math.round(v)) : v.toFixed(1).replace(/\.0$/, '');
        return s + units[u];
    },

    goldPerMob(stage) {
        return Math.max(1, Math.round(1.6 * Math.pow(1.22, stage)));
    },

    // --- upgrades ---
    upgradeCost(id, level) {
        const def = CONFIG.UPGRADES.find(u => u.id === id);
        if (!def) throw new Error('unknown upgrade: ' + id);
        return Math.round(def.baseCost * Math.pow(def.costGrowth, level));
    },

    maxLevel(id) {
        const def = CONFIG.UPGRADES.find(u => u.id === id);
        return (def && def.maxLevel) || Infinity;
    },

    tapDamage(level)    { return Math.pow(1.35, level); },              // level 0 -> 1 (tuned with tap costGrowth 1.338)
    critChance(level)   { return Math.min(0.03 + 0.015 * level, 0.35); },
    splashRadius(level) { return 22 * level; },                          // px (max level 10)
    feverMult(level)    { return 1 + 0.12 * level; },
    goldMult(level)     { return 1 + 0.10 * level; },

    // Expected damage per tap including crit expectation (crit = x5).
    expectedDamage(up) {
        return this.tapDamage(up.tap) * (1 + this.critChance(up.crit) * 4);
    },

    expectedTaps(stage, up) {
        return Math.ceil(this.mobHP(stage) / this.expectedDamage(up));
    },

    // =========================================================================
    // Greedy progression simulation.
    // Plays stages 1..n: earns waveSize * goldPerMob * goldMult per stage
    // (bosses roughly cancel out: fewer mobs but a big gold drop - modeled as
    // a plain stage for simplicity/conservatism), then repeatedly buys the
    // cheapest affordable upgrade. Returns { taps: number[], finalUpgrades }.
    // =========================================================================
    simulate(n) {
        const up = { tap: 0, crit: 0, splash: 0, fever: 0, gold: 0 };
        let gold = 0;
        const taps = [];

        for (let stage = 1; stage <= n; stage++) {
            taps.push(this.expectedTaps(stage, up));

            gold += this.waveSize(stage) * this.goldPerMob(stage) * this.goldMult(up.gold);

            // Buy cheapest affordable upgrade, repeatedly.
            for (;;) {
                let bestId = null;
                let bestCost = Infinity;
                for (const def of CONFIG.UPGRADES) {
                    if (up[def.id] >= this.maxLevel(def.id)) continue;
                    const c = this.upgradeCost(def.id, up[def.id]);
                    if (c < bestCost) { bestCost = c; bestId = def.id; }
                }
                if (bestId === null || bestCost > gold) break;
                gold -= bestCost;
                up[bestId]++;
            }
        }
        return { taps, finalUpgrades: up };
    }
};

if (typeof module !== 'undefined') {
    // Node test context: pull CONFIG in explicitly (browser gets it as a global).
    // eslint-disable-next-line no-global-assign
    if (typeof CONFIG === 'undefined') {
        globalThis.CONFIG = require('./config.js').CONFIG;
    }
    module.exports = { Balance };
}
