// =============================================================================
// SMOOSH! - save.js
// SaveManager: localStorage persistence (injectable storage for tests).
// Ported from the proven Peel It! save.js; SMOOSH! state shape.
// =============================================================================

const SaveManager = {

    KEY: 'smoosh_save_v1',

    _storage: null,
    state: null,

    _freshState() {
        return {
            gold: 0,
            stage: 1,          // current stage to (re)start at
            bestStage: 1,
            upgrades: { tap: 0, crit: 0, splash: 0, fever: 0, gold: 0 },
            feverGauge: 0,
            muted: false,
            adStageCounter: 0, // incremented ONLY by AdsManager.onStageClear()
            totalKills: 0,
            // --- v2.0 ---
            xp: 0,
            level: 1,
            gems: 0,           // premium currency (boss kills, milestones, pvp wins; IAP later)
            nestLevel: 1,
            pets: [],          // { species, rarity, level, necklace: rarity|null } - max 1 per animal
            shards: 0,         // GLOBAL pet shards (v2.1: was per-species petShards)
            items: { glove: null, ring: null, charm: null }, // { rarity, level } | null
            gachaPity: 0,      // rolls since the last epic+ (pity at CONFIG.GACHA.pityAt)
            pvp: { rating: 1000, wins: 0, losses: 0 },
            pvpTeam: [],       // v3.0 Task 13: species ids picked for the PvP team picker
            // --- v3.0 ---
            starterGranted: false,
            repPet: null,      // species id of the representative (ultimate) pet; null = first owned
            kills: {},         // v3.0 Task 11: per-species kill counters (Dex.monsterUnlocked)
            petsSeen: [],      // v3.0 Task 11: every pet species ever owned (Dex.petUnlocked)
            adsRemoved: false, // v3.0 Task 12: $0.99 remove-ads IAP (banner + interstitial gate)
            // --- v3.5 ---
            social: { uid: null, nickname: null }, // Social.init() cache: Firebase uid + nickname once online
            decorOwned: {},    // v3.5 Task 3: id -> owned count (drops + shop buys)
            decorPlaced: [],   // v3.5 Task 3: [{ id, gx, gy }] - nest decor layout
            // --- v6 ---
            decorGridV: 2,     // v6 Task 9: decor grid version (1 = old 6x4, 2 = new 12x8)
            // --- v7 ---
            nestHpFrac: 1,     // v7 Task 5: nest.hp/nest.maxHp, kept in sync by Nest.redraw()
                                // so leaving mid-run and returning restores the same damaged
                                // nest instead of a free full heal (game.js create() reads this
                                // via `new Nest(scene)`; old saves default to 1 = full, since
                                // this key simply won't exist in their JSON).
            stageBestMs: {},   // v7 Task 13: LOCAL best clear-time per stage, {stage: ms} -
                                // source of truth for "is this a new record" (game.js
                                // onStageClear) - always correct offline, never depends on
                                // the network (see leaderboard.js).
            scoreBest: {},     // v7 Task 13: LOCAL best score per mode, {mode: score} -
                                // same role as stageBestMs but for the future Infinite mode
                                // (T12) score board (Leaderboard.submitScore/getScoreRanking).
            medals: {},        // v7 Task 13: {stage: 1|2|3} - cached GLOBAL top-3 rank per
                                // stage, set/cleared only by Leaderboard.reportStageRecord /
                                // .reverifyMedals. stagemap.js renders this synchronously
                                // from cache, never a network call at map-render time.
            medalCheckCursor: 0, // v7 Task 13: rotating cursor into the medals map so
                                // StageMapScene's bounded re-verify pass (~5/session) covers
                                // every held medal in turn across sessions instead of always
                                // re-checking the same few.
            // --- v7 T12: INFINITE mode ---
            infiniteBest: { score: 0, wave: 0 }, // LOCAL best (score also mirrors
                                // into scoreBest.infinite below, which is what
                                // Leaderboard.getScoreRanking actually reads -
                                // wave is kept here too, display-only, since
                                // the global leaderboard is score-based only).
            infiniteRunsToday: 0,   // payout-eligible runs used up today - consumed
                                // at RUN START, not run end, so the HUD back
                                // button/an app kill can't dodge the cap (see
                                // InfiniteBalance.consumePayoutSlotAtStart)
            infiniteRunsDate: null  // UTC yyyy-mm-dd (Social._todayKey format)
                                // the counter above was last reset for - a
                                // new day rolls infiniteRunsToday back to 0
                                // (see InfiniteBalance.runsTodayFor).
        };
    },

    init(storage) {
        this._storage = storage ||
            (typeof window !== 'undefined' ? window.localStorage : null);
        this.state = this._freshState();
        let loadedData = null; // track raw data for migration checks
        try {
            const raw = this._storage && this._storage.getItem(this.KEY);
            if (raw) {
                const data = JSON.parse(raw);
                loadedData = data; // save for migration checks
                const fresh = this._freshState();
                // Deep-merge one level so new nested fields get defaults on upgrade.
                this.state = Object.assign(fresh, data, {
                    upgrades: Object.assign(fresh.upgrades, data.upgrades || {}),
                    items: Object.assign(fresh.items, data.items || {}),
                    pvp: Object.assign(fresh.pvp, data.pvp || {}),
                    social: Object.assign(fresh.social, data.social || {}),
                    decorOwned: Object.assign(fresh.decorOwned, data.decorOwned || {}),
                    decorPlaced: Array.isArray(data.decorPlaced) ? data.decorPlaced : [],
                    pets: Array.isArray(data.pets) ? data.pets : [],
                    // v7 Task 13: old saves lack these entirely - deep-merge one
                    // level so a save from before this task defaults every key to
                    // {} / 0 instead of losing the object shape.
                    stageBestMs: Object.assign(fresh.stageBestMs, data.stageBestMs || {}),
                    scoreBest: Object.assign(fresh.scoreBest, data.scoreBest || {}),
                    medals: Object.assign(fresh.medals, data.medals || {}),
                    // v7 T12: old saves lack this entirely - deep-merge one
                    // level so a pre-T12 save defaults to {score:0, wave:0}
                    // instead of losing the object shape.
                    infiniteBest: Object.assign(fresh.infiniteBest, data.infiniteBest || {})
                });
                // v2.1 migrations: per-species petShards -> global shards,
                // old element-pets -> their animal successors.
                if (data.petShards && typeof data.petShards === 'object') {
                    this.state.shards = (this.state.shards || 0) +
                        Object.values(data.petShards).reduce((a, b) => a + (b || 0), 0);
                }
                delete this.state.petShards;
                const RENAME = { flare: 'fox', zappy: 'chick', aqua: 'frog', clover: 'rabbit' };
                for (const p of this.state.pets) {
                    if (RENAME[p.species]) p.species = RENAME[p.species];
                }
            }
        } catch (e) {
            this.state = this._freshState();
        }
        // v3.0: starter pet — everyone owns the first common animal.
        if (!this.state.starterGranted) {
            const starterId = (typeof PET_SPECIES !== 'undefined' && PET_SPECIES[0])
                ? PET_SPECIES[0].id : 'cat';
            if (!this.state.pets.some(p => p.species === starterId)) {
                this.state.pets.push({ species: starterId, rarity: 'common', level: 1, necklace: null });
            }
            this.state.starterGranted = true;
            this.persist();
        }
        // v3.0 Task 11: seed petsSeen from every currently-owned pet, so
        // existing owners (upgrading from a save with no petsSeen field, or
        // pets granted outside Gacha.roll like the starter above) immediately
        // see them unlocked in the Dex.
        if (!Array.isArray(this.state.petsSeen)) this.state.petsSeen = [];
        let petsSeenChanged = false;
        for (const p of this.state.pets) {
            if (!this.state.petsSeen.includes(p.species)) {
                this.state.petsSeen.push(p.species);
                petsSeenChanged = true;
            }
        }
        if (petsSeenChanged) this.persist();
        // v6 migration: decor grid from 6x4 to 12x8 (cell size halved).
        // Old saves have coords (gx 0-5, gy 0-3); double them to (gx 0-10, gy 0-6)
        // to keep relative visual position in the new grid.
        // Check loadedData (raw data) to detect old saves that lack decorGridV or have < 2.
        if (loadedData && (loadedData.decorGridV == null || loadedData.decorGridV < 2) &&
            Array.isArray(this.state.decorPlaced) && this.state.decorPlaced.length > 0) {
            for (const p of this.state.decorPlaced) {
                if (Number.isFinite(p.gx) && Number.isFinite(p.gy)) {
                    p.gx *= 2;
                    p.gy *= 2;
                }
            }
            this.state.decorGridV = 2;
            this.persist();
        }
        return this.state;
    },

    persist() {
        try {
            if (this._storage) this._storage.setItem(this.KEY, JSON.stringify(this.state));
        } catch (e) { /* storage blocked - play on */ }
    },

    addGold(n) {
        this.state.gold += n;
        this.persist();
    },

    spendGold(n) {
        if (this.state.gold < n) return false;
        this.state.gold -= n;
        this.persist();
        return true;
    },

    reset() {
        this.state = this._freshState();
        this.persist();
    }
};

if (typeof module !== 'undefined') module.exports = { SaveManager };
