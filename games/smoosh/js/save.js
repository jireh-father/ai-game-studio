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
            decorPlaced: []    // v3.5 Task 3: [{ id, gx, gy }] - nest decor layout
        };
    },

    init(storage) {
        this._storage = storage ||
            (typeof window !== 'undefined' ? window.localStorage : null);
        this.state = this._freshState();
        try {
            const raw = this._storage && this._storage.getItem(this.KEY);
            if (raw) {
                const data = JSON.parse(raw);
                const fresh = this._freshState();
                // Deep-merge one level so new nested fields get defaults on upgrade.
                this.state = Object.assign(fresh, data, {
                    upgrades: Object.assign(fresh.upgrades, data.upgrades || {}),
                    items: Object.assign(fresh.items, data.items || {}),
                    pvp: Object.assign(fresh.pvp, data.pvp || {}),
                    social: Object.assign(fresh.social, data.social || {}),
                    decorOwned: Object.assign(fresh.decorOwned, data.decorOwned || {}),
                    decorPlaced: Array.isArray(data.decorPlaced) ? data.decorPlaced : [],
                    pets: Array.isArray(data.pets) ? data.pets : []
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
