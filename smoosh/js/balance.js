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
    // v7 T6: late-game-only difficulty ramp on top of the v6 curve above.
    // Stages <= DIFF_EARLY_FLOOR are untouched (lateMult=1, current feel
    // preserved exactly); stages >= DIFF_FULL_STAGE reach the full
    // DIFF_LATE_SCALE (3x) multiplier, linearly interpolated in between.
    // Applied to mobHP only (not monsterAtkMult): monsterAtkMult is already
    // explicitly OUTSIDE Balance.simulate()'s scope (see that constant's own
    // comment) and tunes a separate pet/nest-survivability balance untouched
    // by this task's sim/test scope, so leaving it alone keeps this a
    // surgical, easily-isolated change. Tripling HP alone already satisfies
    // "total difficulty (HP x atk pressure) ~3x by late game" since atk
    // pressure is an independent, unchanged multiplicand.
    DIFF_EARLY_FLOOR: 20,
    DIFF_FULL_STAGE: 150,
    DIFF_LATE_SCALE: 3,
    lateMult(stage) {
        const span = this.DIFF_FULL_STAGE - this.DIFF_EARLY_FLOOR;
        const t = Math.max(0, Math.min(1, (stage - this.DIFF_EARLY_FLOOR) / span));
        return 1 + (this.DIFF_LATE_SCALE - 1) * t;
    },
    mobHP(stage) {
        return Math.round(3 * Math.pow(1.30, stage) * this.lateMult(stage));
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
    // v7 Task 5: normal stage-clear progression carries nest damage forward
    // (no free full heal) but tops it up a LITTLE - see CONFIG.NEST.
    // stageClearHealPct. Pure function so it's unit-testable without a live
    // Nest/Phaser scene; Nest.carryHeal() (nest.js) is the only caller.
    nestCarryHeal(hp, maxHp, frac) { return Math.min(maxHp, hp + maxHp * frac); },

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
            // v7 T1: ceiling raised 0.5 -> CRIT_MAX (0.99) alongside the deeper
            // crit curve below - still clamps the SUM of curve + ring bonus so
            // a tap is never mathematically guaranteed to crit.
            crit: Math.min(this.CRIT_MAX, this.critChance(up.crit) + b('ring')),
            goldMult: this.goldMult(up.gold) * (1 + b('charm'))
        };
    },

    // =========================================================================
    // v2.0 - shop pricing, indexed to progress (goldPerMob at best stage)
    // so prices stay meaningful forever.
    // =========================================================================
    // v2.2: FIXED egg price (progress-indexed only, no per-pet inflation)
    // v7 T2: gold egg price is now a FIXED FLAT constant, no longer even
    // progress-indexed - the old round(goldPerMob(stage)*80) formula grew
    // unboundedly with goldPerMob's exponential curve (round(goldPerMob(200)
    // *80) ~= 7.7e23 gold), which reads as a runaway "the egg outpaces your
    // wallet forever" feel even though income grows at the same rate. The
    // `stage` parameter is now IGNORED and kept only so every existing call
    // site (shop.js) keeps working unchanged. CONFIG.GACHA.goldEggCost is
    // the single tunable knob - see its own comment in config.js for how
    // its value (960) was picked to preserve early-game affordability. Gem
    // egg price (CONFIG.GEMS.eggCost) is untouched by this change.
    eggCost(stage)              { return CONFIG.GACHA.goldEggCost; },
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

    // v7 T1/T6 retune: growth raised 1.25 -> 1.285/stage alongside tapDamage's
    // LOWERED growth (see that constant) - see the "v7 economy retune" note
    // above Balance.simulate() for the sweep that picked this pair to
    // re-clear the 200-stage invariant under the new ~99% crit ceiling and
    // the T6 late-game 3x mobHP multiplier.
    goldPerMob(stage) {
        return Math.max(1, Math.round(1.6 * Math.pow(1.285, stage)));
    },

    // =========================================================================
    // v7 T11 - PAYDAY SMASH bonus stage (bonus.js runs it after every boss
    // clear). Pure math only - the mash mini-game itself is Phaser-coupled
    // and lives entirely in bonus.js; this is just the payout formula so it's
    // unit-testable without a scene. Stage-proportional by design (rides
    // goldPerMob/waveSize, same convention as every other economy fn on this
    // file) so it never needs a manual retune as stages climb.
    // =========================================================================

    // isKingBossStage: every 10th boss (stage 100, 200, ...) is the crowned
    // King Jelly - mirrors spawner.js's own bossSpecies() king rule
    // (bossIndex % 10 === 0) so the two never drift apart.
    isKingBossStage(stage) {
        return Math.floor(stage / CONFIG.BOSS.every) % 10 === 0;
    },

    // Flat gem bonus, additive to the existing bossKill/kingKill gem credit
    // (game.js onSpecialDeath) - see CONFIG.BONUS's own comment for why this
    // stays small relative to CONFIG.GEMS.eggCost.
    bonusGems(stage) {
        return this.isKingBossStage(stage) ? CONFIG.BONUS.gemKing : CONFIG.BONUS.gemBoss;
    },

    // Guaranteed-in-full base, scaled up to +CONFIG.BONUS.mashBonusMax (50%)
    // by how hard the player mashed the piñata (mashFraction 0..1, supplied
    // by bonus.js's tap-vs-timer race - never required to be > 0, so the
    // reward can never fail to pay out even at zero taps).
    bonusGold(stage, mashFraction) {
        const base = Math.round(this.goldPerMob(stage) * this.waveSize(stage) * CONFIG.BONUS.goldMult);
        const frac = Math.max(0, Math.min(1, mashFraction || 0));
        return Math.round(base * (1 + CONFIG.BONUS.mashBonusMax * frac));
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

    // v7 T1/T6 retune: growth LOWERED 1.376 -> 1.345/stage (paired with
    // goldPerMob's 1.25 -> 1.285 below; tap costGrowth in config.js stays
    // UNCHANGED at 1.368, same pattern the v6 Task 2 retune used). Needed
    // because BOTH v7 changes inflate the OTHER side of the tap-economy
    // equation - crit reaching ~99% inflates expectedDamage's crit-expectation
    // term (1+crit*4) up to ~4.96x (was capped ~1.88x), while the T6 late-game
    // HP multiplier (up to 3x by stage 150+) inflates mobHP - see the "v7
    // economy retune" note above Balance.simulate() for the full sweep.
    tapDamage(level)    { return Math.pow(1.345, level); },
    // v7 T1: crit upgrade goes all the way to a genuine "near-guaranteed
    // crit" feel at maxLevel (config.js CONFIG.UPGRADES 'crit' maxLevel
    // 22 -> 1000). CRIT_MAX/CRIT_REACH_LEVEL are the two tunable knobs.
    // Never reaches a full 1.0 so a tap can never be mathematically
    // guaranteed to crit - see effective() and game.js applyTap for where
    // the SUM of this + item/pet-aura bonuses is clamped to the same
    // CRIT_MAX ceiling.
    //
    // v7 T1 crit-feel FIX: the original T1 shape was a straight line from 0
    // at level 0 to CRIT_MAX at CRIT_REACH_LEVEL, which made every EARLY
    // crit level far weaker than the pre-v7 (v6) curve (e.g. level 22
    // dropped 17.4% -> 2.2%). That alone pushed early-stage (5-20)
    // optimal-play tap counts ~2 taps above the v6 baseline (commit
    // 3198146) - "초반 난이도 그대로" (early difficulty unchanged) is an
    // explicit requirement, so the curve below is now piecewise instead:
    // levels up to the knee where v6's own formula would have hit its old
    // 22% cap (CRIT_V6_BASE + CRIT_V6_SLOPE*level = CRIT_V6_CAP, knee
    // ~28.571) reproduce v6's min(0.22, 0.02 + 0.007*level) formula EXACTLY
    // - so early crit power, and therefore early expectedDamage/tap-count
    // feel, is byte-for-byte v6 (critChance(22)=0.174, critChance(28)=0.216,
    // matching v6 exactly). Above the knee it keeps climbing in a second,
    // shallower linear leg to CRIT_MAX at CRIT_REACH_LEVEL (instead of v6's
    // hard 22% cap), so the T1 "near-guaranteed crit" late-game feel is
    // preserved: continuous at the knee (both legs equal CRIT_V6_CAP there)
    // and strictly monotonic end to end, reaching CRIT_MAX exactly at
    // CRIT_REACH_LEVEL. Re-verified with this curve alone (economy
    // UNCHANGED - the "v7 economy retune" note below still holds as-is,
    // no sweep needed): stages 5-20's greedy-sim tap counts land within +-1
    // of the v6 baseline (tests/balance.test.js "early-game tap feel"
    // test), and the 200-stage invariant clears with even wider margin than
    // before (61.3% of stages 20-200 need 2+ taps, avg 2.04 - up from the
    // pre-fix 99.4%/2.83, which was itself over-hard early on).
    CRIT_MAX: 0.99,
    CRIT_REACH_LEVEL: 1000,
    CRIT_V6_BASE: 0.02,
    CRIT_V6_SLOPE: 0.007,
    CRIT_V6_CAP: 0.22,
    critChance(level) {
        const knee = (this.CRIT_V6_CAP - this.CRIT_V6_BASE) / this.CRIT_V6_SLOPE; // ~28.571
        if (level <= knee) return this.CRIT_V6_BASE + this.CRIT_V6_SLOPE * level;
        const t = (level - knee) / (this.CRIT_REACH_LEVEL - knee);
        return Math.min(this.CRIT_MAX, this.CRIT_V6_CAP + (this.CRIT_MAX - this.CRIT_V6_CAP) * t);
    },
    // v7 T2: splash upgrade goes all the way to "hits the ENTIRE field" at
    // maxLevel (config.js maxLevel 32 -> 1000). SPLASH_REACH_LEVEL is the one
    // tunable knob; the ceiling itself is derived from CONFIG.FIELD.w/h (the
    // field's diagonal is the longest distance between any two points in the
    // play area, so a splash radius >= diagonal always covers the whole
    // field regardless of tap position). Looked up LAZILY inside the
    // function - not as a top-level object property - because in the Node
    // test harness CONFIG isn't global yet until the bottom-of-file
    // require() runs (this file's object literal is built first).
    SPLASH_REACH_LEVEL: 1000,
    splashFullFieldRadius() {
        const f = CONFIG.FIELD;
        return Math.sqrt(f.w * f.w + f.h * f.h);
    },
    splashRadius(level) {
        const max = this.splashFullFieldRadius();
        return Math.min(max, max * level / this.SPLASH_REACH_LEVEL);
    },
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
    // v7 economy retune (T1 crit maxLevel 1000/~99% + T2 splash maxLevel
    // 1000/full-field + T6 late-game 3x mobHP) - see tests/balance.test.js
    // for the invariant this sweep re-clears. Two independent inflations hit
    // the tap economy at once:
    //   1. crit ceiling 0.22 -> 0.99: expectedDamage's crit term (1+crit*4)
    //      goes from a max ~1.88x to up to ~4.96x once the greedy sim levels
    //      crit up (it settles around level ~270 by stage 200, ~27% crit -
    //      cost growth 1.22/level is still the natural brake, same as v6).
    //   2. T6 lateMult: mobHP is up to 3x higher by stage ~150+.
    // A ~10k-combo grid sweep of (tapDamage growth, goldPerMob growth) with
    // tap costGrowth (config.js) held at multiple values found 232 passing
    // triples; tap costGrowth was kept UNCHANGED at 1.368 (same choice the
    // v6 Task 2 retune made) and only the two growth rates below were
    // re-picked: tapDamage growth LOWERED 1.376 -> 1.345 (crit's much bigger
    // expected-damage contribution needed base tap damage to grow slower to
    // compensate) and goldPerMob growth RAISED 1.25 -> 1.285 (to let the
    // sim's upgrade levels - and therefore crit's contribution - keep pace
    // with the steeper mobHP curve). CORRECTION (see the critChance() fix
    // comment above): reproducing the OLD tapDamage/goldPerMob/costGrowth
    // triple against the NEW crit/splash/T6 curves does NOT go "trivially
    // easy" - it is verifiably much HARDER (tail stages need 20-31 taps,
    // avg ~7.5 for stages 20-200, band badly broken past the 6 cap) because
    // the original T1 crit curve made every early/mid crit level far weaker
    // than v6's, while T6 still triples late mobHP. tapDamage/goldPerMob
    // growth were retuned (not left alone) specifically to compensate for
    // that harder-not-easier combination.
    //
    // These two growth rates (1.345/1.285) are UNCHANGED by the later
    // critChance() piecewise fix above - re-verification after that fix
    // showed the existing pair still clears the invariant comfortably, so
    // no re-sweep was needed. Result as of the crit-curve fix: 200-stage
    // sim stays in the 1-6 taps band for every stage 5-200 (max 5, at stage
    // ~8), with 61.3% of stages 20-200 needing 2+ taps (avg 2.04) - down
    // from a pre-fix 99.4%/2.83 (which had gone over-hard early on, see the
    // critChance() comment above), but still comfortably clear of the
    // 42%/1.8 floors.
    // =========================================================================

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
