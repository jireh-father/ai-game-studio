// =============================================================================
// SMOOSH! - leaderboard.js
// Leaderboard service: global per-stage clear-time rankings + a generic score
// board (ready for the future Infinite mode, T12). Offline-first, mirrors
// fb.js's Social service EXACTLY - no separate auth/init/_db of its own,
// reuses Social.ready / Social._db / Social._uid / Social._serverTs()
// directly (same anonymous-auth identity, no new PII surface).
//
// Firestore schema (flat top-level collections, same convention as
// users/friendReqs/gifts - see fb.js):
//   stageTimes/{stage}_{uid}       { stage, uid, nickname, timeMs, ts }
//   scoreBoard/{mode}_{uid}        { mode, uid, nickname, score, ts }
//     (scoreBoard's doc id includes `mode` - a deliberate, minimal extension
//     of the flat-collection "{discriminant}_{uid}" idiom already used by
//     stageTimes, so a future second Infinite-style mode never collides with
//     an existing one under the same uid; today only one mode is ever
//     called, so this is forward-compatible plumbing, not new surface.)
//
// Contract - every method below either resolves a normal value/{ok:true,...}
// OR resolves { offline: true }. NONE of them ever throw or reject, exactly
// like every Social method (see fb.js's own header comment). This is
// load-bearing: game.js calls these from the stage-clear flow and must NEVER
// have that flow hang or crash because of a flaky/absent network.
//
// Read-cost note: getStageRanking/getScoreRanking are ONLY ever called by
// reportStageRecord/reportScoreRecord, which callers (game.js) only invoke on
// a NEW LOCAL best - never on every clear, never for all N stage-map nodes.
// Each call is a top-3 query (3 reads) + one rank query. The rank query
// prefers a count() aggregation (1 read, billed regardless of match count)
// when the loaded Firestore compat SDK supports it; the vendored bundle in
// this project currently does NOT expose count() (checked: no "aggregate"
// symbol in www/lib/firebase-firestore-compat.js), so _rankCount() falls
// back to a plain .get() + snapshot size - still correct, just not the cheap
// aggregate-billed read, until that vendored bundle is ever upgraded.
// =============================================================================

const Leaderboard = {

    // -------------------------------------------------------------------
    // Pure helpers - no Firebase, no SaveManager/Social globals; plain args
    // only. Unit-testable with plain objects (tests/leaderboard.test.js).
    // -------------------------------------------------------------------

    // A stage-clear time is a new local best iff there is no finite previous
    // best, or the new time is strictly LOWER (faster) than it.
    isNewBestTime(prevMs, timeMs) {
        return !Number.isFinite(prevMs) || timeMs < prevMs;
    },

    // A score is a new local best iff there is no finite previous best, or
    // the new score is strictly HIGHER than it.
    isNewBestScore(prevScore, score) {
        return !Number.isFinite(prevScore) || score > prevScore;
    },

    _stageTimeDocId(stage, uid) { return stage + '_' + uid; },

    _stageTimeDoc(stage, uid, nickname, timeMs) {
        return { stage, uid, nickname: nickname || null, timeMs, ts: Social._serverTs() };
    },

    _scoreDocId(mode, uid) { return mode + '_' + uid; },

    _scoreDoc(mode, uid, nickname, score) {
        return { mode, uid, nickname: nickname || null, score, ts: Social._serverTs() };
    },

    _pickTimeEntry(data) {
        return { uid: data.uid, nickname: data.nickname || null, timeMs: data.timeMs };
    },

    _pickScoreEntry(data) {
        return { uid: data.uid, nickname: data.nickname || null, score: data.score };
    },

    // Medal cache pure update: given the CURRENT medals map + a rank (1, 2,
    // 3, or null/anything else meaning "not top-3"), returns a NEW map with
    // that stage's medal set (rank 1/2/3) or cleared (falsy rank) - never
    // mutates the input, so callers can compare old vs new to detect change.
    applyMedalForRank(medals, stage, rank) {
        const next = Object.assign({}, medals);
        if (rank === 1 || rank === 2 || rank === 3) next[stage] = rank;
        else delete next[stage];
        return next;
    },

    // Bounded, deterministic "which held-medal stages to re-verify this
    // pass" picker - at most maxCount, oldest-checked-first via a persisted
    // rotating cursor (so cost stays flat regardless of how many medals a
    // player holds, and every held medal eventually gets re-checked over a
    // few sessions). Pure: no I/O, just array/index math.
    pickStagesToVerify(medals, cursor, maxCount) {
        maxCount = maxCount || 5;
        const stages = Object.keys(medals || {}).map(Number).sort((a, b) => a - b);
        if (stages.length === 0) return { picked: [], nextCursor: 0 };
        const start = ((cursor % stages.length) + stages.length) % stages.length;
        const n = Math.min(maxCount, stages.length);
        const picked = [];
        for (let i = 0; i < n; i++) picked.push(stages[(start + i) % stages.length]);
        return { picked, nextCursor: (start + n) % stages.length };
    },

    // -------------------------------------------------------------------
    // Rank query helper - count() aggregation when available, else a plain
    // get()+size fallback. See the file header's read-cost note.
    // -------------------------------------------------------------------
    async _rankCount(query) {
        if (typeof query.count === 'function') {
            const snap = await query.count().get();
            return snap.data().count;
        }
        const snap = await query.get();
        return snap.size;
    },

    // -------------------------------------------------------------------
    // Submit (fire-and-forget from the caller's point of view - these
    // resolve quickly either way and never throw/reject).
    // -------------------------------------------------------------------

    // Upserts stageTimes/{stage}_{uid}. Callers MUST only call this on a
    // local new best (see isNewBestTime) - this method itself does not
    // re-check, it just writes what it's given.
    async submitStageTime(stage, timeMs) {
        if (!Social.ready) return { offline: true };
        try {
            const uid = Social._uid;
            const nickname = (SaveManager.state.social && SaveManager.state.social.nickname) || null;
            const id = this._stageTimeDocId(stage, uid);
            await Social._db.collection('stageTimes').doc(id)
                .set(this._stageTimeDoc(stage, uid, nickname, timeMs), { merge: true });
            return { ok: true };
        } catch (e) {
            return { offline: true };
        }
    },

    // Generic score-board upsert (mode is a free-form string, e.g. 'infinite'
    // once that mode exists) - twin of submitStageTime for T12 reuse.
    async submitScore(mode, score) {
        if (!Social.ready) return { offline: true };
        try {
            const uid = Social._uid;
            const nickname = (SaveManager.state.social && SaveManager.state.social.nickname) || null;
            const id = this._scoreDocId(mode, uid);
            await Social._db.collection('scoreBoard').doc(id)
                .set(this._scoreDoc(mode, uid, nickname, score), { merge: true });
            return { ok: true };
        } catch (e) {
            return { offline: true };
        }
    },

    // -------------------------------------------------------------------
    // Rank fetch - ONLY call on a record moment (see file header).
    // -------------------------------------------------------------------

    // myTimeMs comes from the LOCAL save cache (SaveManager.state.stageBestMs)
    // rather than a network read-back of the doc just written - it's already
    // known, so this stays at the advertised ~4-read cost instead of 5.
    async getStageRanking(stage) {
        if (!Social.ready) return { offline: true };
        try {
            const myTimeMs = SaveManager.state.stageBestMs && SaveManager.state.stageBestMs[stage];
            if (!Number.isFinite(myTimeMs)) return { offline: true };
            const col = Social._db.collection('stageTimes').where('stage', '==', stage);
            const [top3Snap, rankCount] = await Promise.all([
                col.orderBy('timeMs', 'asc').limit(3).get(),
                this._rankCount(col.where('timeMs', '<', myTimeMs))
            ]);
            const top3 = top3Snap.docs.map(d => this._pickTimeEntry(d.data()));
            return { top3, myRank: rankCount + 1, globalBest: top3[0] || null };
        } catch (e) {
            return { offline: true };
        }
    },

    async getScoreRanking(mode) {
        if (!Social.ready) return { offline: true };
        try {
            const myScore = SaveManager.state.scoreBest && SaveManager.state.scoreBest[mode];
            if (!Number.isFinite(myScore)) return { offline: true };
            const col = Social._db.collection('scoreBoard').where('mode', '==', mode);
            const [top3Snap, rankCount] = await Promise.all([
                col.orderBy('score', 'desc').limit(3).get(),
                this._rankCount(col.where('score', '>', myScore))
            ]);
            const top3 = top3Snap.docs.map(d => this._pickScoreEntry(d.data()));
            return { top3, myRank: rankCount + 1, globalBest: top3[0] || null };
        } catch (e) {
            return { offline: true };
        }
    },

    // -------------------------------------------------------------------
    // Orchestrated "I just set a new LOCAL record" flow - single call for
    // game.js to fire-and-forget: submit, then (if online) fetch the rank,
    // then update the local medal cache on a top-3 finish. Never throws;
    // degrades to { offline: true } at any step so the caller's UI just
    // shows the local-only line (see ui.js showRecordPopup).
    // -------------------------------------------------------------------

    async reportStageRecord(stage, timeMs) {
        try {
            const submitResult = await this.submitStageTime(stage, timeMs);
            if (submitResult.offline) return { offline: true };
            const ranking = await this.getStageRanking(stage);
            if (ranking.offline) return { offline: true };
            const medalRank = ranking.myRank <= 3 ? ranking.myRank : null;
            SaveManager.state.medals = this.applyMedalForRank(SaveManager.state.medals || {}, stage, medalRank);
            SaveManager.persist();
            return { ok: true, rank: ranking.myRank, top3: ranking.top3, globalBest: ranking.globalBest, medalRank };
        } catch (e) {
            return { offline: true };
        }
    },

    // Score-board twin - no medal concept for a single endless run (see
    // ideation doc), just rank + top3 + globalBest.
    async reportScoreRecord(mode, score) {
        try {
            const submitResult = await this.submitScore(mode, score);
            if (submitResult.offline) return { offline: true };
            const ranking = await this.getScoreRanking(mode);
            if (ranking.offline) return { offline: true };
            return { ok: true, rank: ranking.myRank, top3: ranking.top3, globalBest: ranking.globalBest };
        } catch (e) {
            return { offline: true };
        }
    },

    // -------------------------------------------------------------------
    // Bounded medal re-verification - StageMapScene.create() fire-and-forget
    // call. Re-checks at most `maxCount` (default 5) of the player's
    // currently-held medal stages per call, oldest-checked-first, so a
    // player who's been dethroned eventually sees their medal quietly
    // disappear without ever costing a per-node network call at map-render
    // time (medals are drawn from the LOCAL cache synchronously - see
    // stagemap.js buildNode()).
    // -------------------------------------------------------------------
    async reverifyMedals(maxCount) {
        try {
            if (!Social.ready) return { offline: true };
            const medals = SaveManager.state.medals || {};
            const cursor = SaveManager.state.medalCheckCursor || 0;
            const { picked, nextCursor } = this.pickStagesToVerify(medals, cursor, maxCount);
            if (picked.length === 0) return { ok: true, checked: [] };
            const results = await Promise.all(picked.map(stage => this.getStageRanking(stage)));
            let nextMedals = SaveManager.state.medals;
            results.forEach((r, i) => {
                if (r.offline) return; // leave that stage's cached medal untouched on failure
                const stage = picked[i];
                const medalRank = r.myRank <= 3 ? r.myRank : null;
                nextMedals = this.applyMedalForRank(nextMedals, stage, medalRank);
            });
            SaveManager.state.medals = nextMedals;
            SaveManager.state.medalCheckCursor = nextCursor;
            SaveManager.persist();
            return { ok: true, checked: picked };
        } catch (e) {
            return { offline: true };
        }
    }
};

if (typeof module !== 'undefined') {
    // Node test context: same shim pattern as fb.js - pull in the globals
    // Leaderboard's methods reference as bare identifiers (Social,
    // SaveManager), without ever touching the vendored Firebase compat
    // bundles (browser UMD globals, not CommonJS - and no test path should
    // touch the network).
    if (typeof CONFIG === 'undefined') globalThis.CONFIG = require('./config.js').CONFIG;
    if (typeof SaveManager === 'undefined') globalThis.SaveManager = require('./save.js').SaveManager;
    if (typeof Social === 'undefined') globalThis.Social = require('./fb.js').Social;
    module.exports = { Leaderboard };
}
