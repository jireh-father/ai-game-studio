// =============================================================================
// SMOOSH! - infiniteBalance.js  (v7 T12 - INFINITE mode)
// Pure math for the endless survival mode: no Phaser, no DOM, no SaveManager -
// every function here takes plain args and returns plain values, exactly like
// balance.js's own convention (that file's header: "Pure math... No Phaser,
// no DOM"). tests/infinite.test.js owns the truth for every formula below.
//
// Design source: docs/superpowers/ideation/2026-07-05-smoosh-v7-t12-infinite-mode.md
// section 3 ("Recommended synthesized design"). Tunable knobs live in
// config.js CONFIG.INFINITE - this file is formulas only, mirroring the
// balance.js/config.js split ("numeric CURVES live in balance.js - config.js
// is policy only").
//
// Reuse note: virtualStage() feeds Balance.mobHP/monsterAtkMult/speedMult/
// bossHpMult VERBATIM (see infinitegame.js) - those curves are entirely
// untouched by this file. Score is DELIBERATELY independent of monster HP/
// gold (see scoreForKill doc) so a whale's power advantage shows up only as
// longer survival time, not an exploding per-kill score term.
// =============================================================================

const InfiniteBalance = {

    // -------------------------------------------------------------------
    // Ramp: continuous, wave-indexed (waveIndex = 1, 2, 3... every
    // CONFIG.INFINITE.waveIntervalMs of real time, regardless of field state -
    // no turtling/stalling allowed, per the ideation's Persona B).
    // -------------------------------------------------------------------

    // Compressed virtual stage number fed to the EXISTING Balance curves -
    // same exponential family the player already knows from campaign, just
    // reached in a fraction of the real time.
    virtualStage(waveIndex) {
        return waveIndex * CONFIG.INFINITE.stageCompression;
    },

    // Trickle (reinforcement) delay shrinks per wave - reads as "faster",
    // not "more of the same" (CONFIG.SPAWN.concurrentMax already caps
    // on-field population). Floored at trickleMinMs.
    trickleDelayMs(waveIndex) {
        return Math.max(CONFIG.INFINITE.trickleMinMs,
            CONFIG.INFINITE.trickleBaseMs - waveIndex * CONFIG.INFINITE.trickleStepMs);
    },

    // Every miniBossEvery-th wave (4th, 8th, 12th...) spawns a mini-boss.
    // waveIndex 0 (pre-run) never qualifies.
    isMiniBossWave(waveIndex) {
        return waveIndex > 0 && waveIndex % CONFIG.INFINITE.miniBossEvery === 0;
    },

    // Mini-boss HP = a dialed-down fraction of the normal boss ramp at the
    // SAME virtual stage - reads as "a tough one", not a full campaign king.
    // `bossHpMultFn` is injected (Balance.bossHpMult) so this file never
    // needs to require balance.js itself - keeps the dependency direction
    // one-way (balance.js has zero knowledge of Infinite mode).
    miniBossHpMult(virtualStage, bossHpMultFn) {
        return bossHpMultFn(virtualStage) * CONFIG.INFINITE.miniBossHpFrac;
    },

    // -------------------------------------------------------------------
    // Wave modifiers - rolled once per wave, uniform weight across the 4
    // named pressures (see CONFIG.INFINITE.MODIFIERS for the multiplier
    // table itself). rng: () => [0,1), injectable for deterministic tests.
    // -------------------------------------------------------------------
    MODIFIER_IDS: ['swarm', 'tanky', 'glassRush', 'elite'],

    rollModifier(rng) {
        const roll = (rng || Math.random)();
        const idx = Math.min(this.MODIFIER_IDS.length - 1,
            Math.floor(roll * this.MODIFIER_IDS.length));
        return this.MODIFIER_IDS[idx];
    },

    modifierMult(id) {
        return CONFIG.INFINITE.MODIFIERS[id] || { hp: 1, speed: 1, trickleMult: 1 };
    },

    // -------------------------------------------------------------------
    // Score - Persona A/D synthesis. Deliberately does NOT multiply by
    // monster HP or the player's gold-mult: raw power inflates SURVIVAL TIME
    // (already rewarded via endBonus's per-second term), not the per-kill
    // term exponentially - this is the leaderboard-fairness compromise the
    // ideation doc calls out explicitly (§2 "Leaderboard fairness").
    // -------------------------------------------------------------------

    // Per-kill base value, grows mildly with wave depth only.
    killValue(waveIndex) {
        return CONFIG.INFINITE.killValueBase * (1 + waveIndex * CONFIG.INFINITE.killValueWaveMult);
    },

    // Live-combo multiplier, capped at comboMultCap (3x) regardless of how
    // high the combo counter climbs.
    comboMult(combo) {
        const raw = 1 + combo * CONFIG.INFINITE.comboMultPerCombo;
        return Math.min(CONFIG.INFINITE.comboMultCap, raw);
    },

    // The full per-kill score credit.
    scoreForKill(waveIndex, combo, runMult) {
        return this.killValue(waveIndex) * this.comboMult(combo) * runMult;
    },

    // runMult ratchet - PERSISTENT and NEVER DECREASING within a run. Each
    // helper returns the NEW value given the current one; callers (
    // infinitegame.js) call these on the exact events that should ratchet it
    // (a combo-milestone hit, a mini-boss kill) and otherwise just carry the
    // current value forward untouched - there is no "decay" path anywhere.
    runMultAfterComboMilestone(current) {
        return current + CONFIG.INFINITE.runMultMilestoneStep;
    },
    runMultAfterMiniBossKill(current) {
        return current + CONFIG.INFINITE.runMultMiniBossStep;
    },

    // One-time end-of-run bonus, added to the accumulated per-kill score.
    endBonus(waveIndexReached, survivalSec) {
        return waveIndexReached * CONFIG.INFINITE.endBonusPerWave +
            Math.floor(survivalSec) * CONFIG.INFINITE.endBonusPerSecond;
    },

    // -------------------------------------------------------------------
    // Rewards / economy guardrails (Persona C). Infinite must stay a
    // strictly-worse farm than campaign while still offering a scarce,
    // genuine reward hook (prestige gems on a personal best).
    // -------------------------------------------------------------------

    // Gold funnel - SAME shape as GameScene.stageGoldMult()'s replay nerf:
    // every gold credit (kills + gold-pouch drops) multiplies by this. A
    // non-payout run (daily cap reached) gets 0, not a smaller fraction -
    // see isPayoutRun below.
    goldMultFor(isPayoutRun) {
        return isPayoutRun ? CONFIG.INFINITE.goldMult : 0;
    },

    // Whether TODAY's run count has already used up the daily payout cap.
    dailyCapReached(runsToday) {
        return (runsToday || 0) >= CONFIG.INFINITE.dailyPayoutCap;
    },

    // Whether a run should pay out gold/gems at all - the single gate every
    // reward site (gold credit, end-of-run gem grant) reads.
    isPayoutRun(runsToday) {
        return !this.dailyCapReached(runsToday);
    },

    // Decide AND immediately CONSUME a payout slot for a run about to START.
    // Economy-safety fix: this must be called at RUN START, never at run end
    // (endRun()) - a player can always exit a run early via the HUD back
    // button (or an app kill) WITHOUT ever reaching endRun()/onNestBroken(),
    // so gating the counter increment on "how the run ended" is bypassable
    // and lets a player farm unlimited payout runs. Spending the slot the
    // moment a rewarded run begins closes that hole: at most
    // CONFIG.INFINITE.dailyPayoutCap runs/day ever pay out, regardless of
    // whether the run ends via nest death, the back button, or a crash.
    // Returns { payoutRun, runsToday } - callers must persist the returned
    // runsToday to SaveManager.state.infiniteRunsToday right away (after
    // first rolling it through runsTodayFor() for the date-rollover check).
    consumePayoutSlotAtStart(runsToday) {
        const payoutRun = this.isPayoutRun(runsToday);
        return { payoutRun, runsToday: payoutRun ? (runsToday || 0) + 1 : (runsToday || 0) };
    },

    // Pure date-rollover: given the LAST persisted date key and today's date
    // key (both plain strings, e.g. 'YYYY-MM-DD' - see fb.js Social._todayKey
    // for the exact format this project already uses elsewhere), returns the
    // runsToday count that should be used THIS session - 0 on a new day,
    // otherwise the stored count carried forward unchanged.
    runsTodayFor(storedDate, storedCount, todayDate) {
        if (storedDate !== todayDate) return 0;
        return storedCount || 0;
    },

    // A personal best iff the new score is strictly higher than the previous
    // one (no previous best = always a new best). Deliberately score-only
    // (not wave-only) - reuses the same schema Leaderboard.getScoreRanking
    // already reads (SaveManager.state.scoreBest[mode]), so a "new best" here
    // is exactly the condition that should also gate the leaderboard submit.
    isNewPersonalBest(prevBestScore, score) {
        return !Number.isFinite(prevBestScore) || score > prevBestScore;
    }
};

if (typeof module !== 'undefined') {
    // Node test context: pull CONFIG in explicitly (browser gets it as a
    // global) - same shim pattern as balance.js/spawner.js.
    if (typeof CONFIG === 'undefined') {
        globalThis.CONFIG = require('./config.js').CONFIG;
    }
    module.exports = { InfiniteBalance };
}
