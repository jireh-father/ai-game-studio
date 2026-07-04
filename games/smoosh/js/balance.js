// =============================================================================
// SMOOSH! - balance.js
// Pure math: monster/gold curves, upgrade costs & effects, and the greedy
// progression simulation that the 200-stage invariant test runs against.
// No Phaser, no DOM. tests/balance.test.js owns the truth - tune constants
// here until the 1-5 taps-per-mob band holds.
// =============================================================================

const Balance = {

    // v3.0 Task 10 - stage-map REPLAY: gold pays 30%, drops still roll at
    // 100% (stagemap.js / game.js route every kill/clear/drop gold credit
    // through GameScene.stageGoldMult(), which reads this).
    replayGoldMult: 0.3,

    // --- stage curves ---
    // v2.2 pass: HP +25%/stage (user: v2.1's +45% halved back). Economy
    // retuned to match: gold 1.22^n, dmg 1.35^L. v3.0: uncapped waves grew
    // sim income, so tap costGrowth was raised 1.352 -> 1.372 to keep the game
    // meaningfully hard within the 1-6 taps band (the invariant test owns truth).
    // v6 Task 1: crit slowed down (lower slope/ceiling) shrank expectedDamage,
    // so tap costGrowth was retuned 1.372 -> 1.368 (config.js CONFIG.UPGRADES)
    // to keep the sim back in-band - see that constant's comment for the math.
    // v6 Task 2: HP growth steepened 1.25 -> 1.30/stage (A3 - late stages need
    // real threat). At stage 200 this is ~2540x more HP than the old curve, so
    // goldPerMob growth (1.22->1.25) and tapDamage growth (1.35->1.376, see
    // that constant below) were raised together to let the greedy sim's tap
    // level keep pace (finalTap 146 -> 161 by stage 200) - tap costGrowth
    // itself is UNCHANGED at 1.368 (Task 1's retune). Swept ~9k (goldGrowth,
    // tapDmgGrowth) combos at mobHP growth 1.30 with costGrowth pinned to
    // 1.368: only 3 pairs kept the whole 200-stage sim in the 1-6 band; this
    // one (gg=1.25, tdg=1.376) had the widest margin above both floors
    // (48.1% >= 42%, avg 2.04 >= 1.8) while raising BOTH constants upward, as
    // this task's guidance prefers. See tests/balance.test.js for the sim.
    mobHP(stage) {
        return Math.round(3 * Math.pow(1.30, stage));
    },

    waveSize(stage) {
        return 8 + Math.floor(stage * 1.1);   // v3.0: no cap - every stage adds mobs
    },

    // Boss HP multiplier grows with every boss: stage 10 -> x25 mob HP,
    // stage 50 -> x75, stage 100 -> x137.5 ... (the "huge energy" ramp).
    // v6 Task 2: per-boss ramp steepened 0.5 -> 0.7 (paired with the steeper
    // mobHP curve above) so bosses stay a genuine spike rather than shrinking
    // relative to the now much-faster-growing regular mob HP. Stage 10 is
    // unchanged (bossIndex 1 -> no ramp yet); stage 100 goes 137.5 -> 182.5x.
    bossHpMult(stage) {
        const bossIndex = Math.max(1, Math.floor(stage / CONFIG.BOSS.every));
        return CONFIG.BOSS.hpMult * (1 + (bossIndex - 1) * 0.7);
    },

    // v1.2: monsters also get FASTER as stages climb (+0.6%/stage, cap 2.2x).
    speedMult(stage) {
        return Math.min(2.2, 1 + stage * 0.006);
    },

    // v6 Task 2 (A3) - monster ATTACK output also climbs per stage, independent
    // of the tap-economy rail above: +3%/stage, capped at 6x (reached at stage
    // ~167). Every monster->pet and monster->nest damage site (melee/slam/spit/
    // spray/zap strikes, charge, nest-shell chip, poison/burn DoT, monster
    // skill damage) multiplies by this - see monsters.js `_updateAttack`/
    // `skillDmg` and game.js `monsterStrikeArea`. Deliberately OUTSIDE
    // Balance.simulate(): the sim only models the tap-damage economy (spec
    // scope note above the 200-stage test), never monster-on-pet/nest combat,
    // so this constant cannot and does not move that invariant. The steeper
    // late-game bite is offset by the Task 3 "full heal each stage" change
    // (fresh pets every stage), so persistent pet attrition doesn't compound.
    monsterAtkMult(stage) {
        return Math.min(6, 1 + 0.03 * stage);
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

    // v3.0 - 8-element chart. 1.5 strong / 0.7 weak / 1.0 neutral, applied on
    // EVERY hit in both directions (pets->monsters AND monster attacks->pets).
    // 5-cycle fire>ice>wind>leaf>water>fire; electric>water+wind, leaf>electric;
    // light<->dark mutual 1.5 (no 0.7 between them). Everything else 1.0.
    ELEMENTS: ['fire','water','leaf','wind','electric','ice','light','dark'],
    _STRONG: {
        fire: ['ice'], ice: ['wind'], wind: ['leaf'], leaf: ['water','electric'],
        water: ['fire'], electric: ['water','wind'], light: ['dark'], dark: ['light']
    },
    elementMult(attacker, defender) {
        const mutual = (attacker === 'light' && defender === 'dark') ||
                       (attacker === 'dark' && defender === 'light');
        if (mutual) return 1.5;
        if ((this._STRONG[attacker] || []).includes(defender)) return 1.5;
        if ((this._STRONG[defender] || []).includes(attacker)) return 0.7;
        return 1;
    },

    // Applies elementMult to a base hit; rounds and floors at 1 so a "resisted"
    // hit never rounds down to 0. { dmg, mult } - both directions (pets.js and
    // monsters.js) funnel every hit through this before it reaches HP.
    applyElement(base, atkElem, defElem) {
        const mult = this.elementMult(atkElem, defElem);
        return { dmg: Math.max(1, Math.round(base * mult)), mult };
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
            // v6 Task 1: ceiling lowered 0.6 -> 0.5 (see critChance note above).
            crit: Math.min(0.5, this.critChance(up.crit) + b('ring')),
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

    // =========================================================================
    // v4.0 - WCAG relative luminance, for the pastel palette's contrast tests
    // (tests/pastel.test.js). Pure math: linearize sRGB channels then weight
    // per the WCAG 2.x formula. Contrast ratio itself = (L1+0.05)/(L2+0.05)
    // with the lighter color on top - callers compute that directly.
    // =========================================================================
    relLuminance(hex) {
        const channel = (c) => {
            const s = c / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        const r = channel((hex >> 16) & 0xff);
        const g = channel((hex >> 8) & 0xff);
        const b = channel(hex & 0xff);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    },

    // =========================================================================
    // v4.0 Phase C Task 2 - Phaser text styles want '#rrggbb' strings while
    // fills/tints want 0xRRGGBB ints; CONFIG.PASTEL tokens are ints (so the
    // contrast/distinctness math in pastel.test.js stays simple), so every
    // pastel sweep call site that sets a text `color`/`stroke` funnels through
    // this one converter instead of hand-rolling '#' + toString(16) per site.
    // =========================================================================
    hex(int) {
        return '#' + (int & 0xffffff).toString(16).padStart(6, '0');
    },

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

    // v6 Task 2: growth raised 1.22 -> 1.25/stage alongside tapDamage's growth
    // (see that constant) - see the mobHP comment above for the sweep that
    // picked this pair to re-clear the 200-stage invariant under the steeper
    // HP curve.
    goldPerMob(stage) {
        return Math.max(1, Math.round(1.6 * Math.pow(1.25, stage)));
    },

    // =========================================================================
    // v3.0 Task 13 - PvP team picker: player picks up to teamSize pets;
    // AUTO = top damage.
    // =========================================================================
    pvpValidTeam(teamIds, ownedPets) {
        const owned = new Set((ownedPets || []).map(p => p.species));
        const seen = new Set();
        const out = [];
        for (const id of (teamIds || [])) {
            if (owned.has(id) && !seen.has(id)) { seen.add(id); out.push(id); }
            if (out.length >= CONFIG.PVP.teamSize) break;
        }
        return out;
    },
    pvpAutoTeam(ownedPets, tapLevel) {
        return (ownedPets || []).slice()
            .sort((a, b) => this.petDamage(b.level, tapLevel, b.rarity, b.necklace)
                          - this.petDamage(a.level, tapLevel, a.rarity, a.necklace))
            .slice(0, CONFIG.PVP.teamSize)
            .map(p => p.species);
    },

    // =========================================================================
    // v3.0 Task 9 - representative-pet ultimate gauge. +2/kill, caps at 100;
    // the last tick before full is clamped so the gauge never overshoots.
    // =========================================================================
    ULT_MAX: 100, ULT_PER_KILL: 2,
    ultGain(current) {
        return Math.max(0, Math.min(this.ULT_PER_KILL, this.ULT_MAX - current));
    },

    // =========================================================================
    // v3.0 - click-to-collect item drops. Pure lifetime phase: 'idle' while
    // fresh, 'blink' as a "running out" cue, 'gone' once it should despawn
    // (game.js applies this via a scene timer - see spawnItemDrop/tickDrops).
    // =========================================================================
    dropPhase(elapsedMs) {
        if (elapsedMs >= CONFIG.DROPS.lifetimeMs) return 'gone';
        if (elapsedMs >= CONFIG.DROPS.blinkFromMs) return 'blink';
        return 'idle';
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

    // v6 Task 2: growth raised 1.35 -> 1.376/stage (paired with goldPerMob's
    // 1.22 -> 1.25 above) so the greedy sim's damage output keeps pace with
    // the steeper mobHP(stage) curve - see that constant's comment for the
    // sweep. level 0 -> 1 either way.
    tapDamage(level)    { return Math.pow(1.376, level); },
    // v6 Task 1: slower crit growth + lower ceiling (was 0.03 + 0.015*level,
    // capped 0.35) - crit auras were pushing effective tap-time crit toward
    // ~99%; halved the slope, dropped the ceiling to 0.22 (paired with
    // effective()'s 0.6->0.5 clamp and the applyTap 0.6 hard clamp).
    critChance(level)   { return Math.min(0.02 + 0.007 * level, 0.22); },
    // v6 Task 1: slower per-level radius (was 22*level, max level 10 -> 220px)
    // paired with a deeper upgrade (maxLevel 10->32 in CONFIG.UPGRADES) so the
    // new ceiling (14*32=448px) lands at ~2x the old one instead of shrinking it.
    splashRadius(level) { return 14 * level; },                         // px (max level 32 -> 448px)
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
    },

    // =========================================================================
    // v3.5 - Social gifting validation
    // =========================================================================
    /**
     * Validate if a gift is allowed based on caps and daily limit.
     * @param {string} kind - gift type: 'gold', 'gems', or 'decor'
     * @param {number} amount - amount to gift
     * @param {number} sentTodayCount - how many gifts already sent today
     * @returns {{ ok: boolean, reason?: string }} validation result
     *          - ok: true if allowed
     *          - reason: 'cap' (exceeds max), 'daily' (hit daily limit), 'kind' (invalid type)
     */
    giftAllowed(kind, amount, sentTodayCount) {
        const caps = {
            gold: CONFIG.GIFT.maxGoldPerGift,
            gems: CONFIG.GIFT.maxGemsPerGift,
            decor: CONFIG.GIFT.maxDecorPerGift
        };

        // Check if kind is valid
        if (!(kind in caps)) {
            return { ok: false, reason: 'kind' };
        }

        // Check amount cap for this kind
        if (amount > caps[kind]) {
            return { ok: false, reason: 'cap' };
        }

        // Check daily limit
        if (sentTodayCount >= CONFIG.GIFT.dailySendLimit) {
            return { ok: false, reason: 'daily' };
        }

        return { ok: true };
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
