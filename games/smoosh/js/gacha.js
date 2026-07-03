// =============================================================================
// SMOOSH! - gacha.js
// Pure gacha logic: rarity rates (gold vs gem), pity counter, duplicate ->
// shards, rarity upgrades. Mutates the passed state; caller persists.
// rng: () => [0,1) injectable for tests.
// =============================================================================

const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'];

const Gacha = {

    // v2.1: the pool is the full 50-animal roster.
    get SPECIES_IDS() { return PET_SPECIES.map(p => p.id); },

    rarityRank(r) { return RARITY_ORDER.indexOf(r); },

    _rollRarity(rates, rng) {
        const roll = rng();
        let acc = 0;
        for (const r of RARITY_ORDER) {
            acc += rates[r];
            if (roll < acc) return r;
        }
        return 'legendary';
    },

    // One egg roll. Returns { kind:'new'|'upgrade'|'shards', species, rarity, shards }
    roll(state, rng, useGems) {
        const G = CONFIG.GACHA;
        let rates = useGems ? G.gemRates : G.rates;

        // pity: guarantee epic+ on the pityAt-th dry roll
        const pityTriggered = state.gachaPity >= G.pityAt - 1;
        if (pityTriggered) {
            const eplusTotal = rates.epic + rates.legendary;
            rates = {
                common: 0, rare: 0,
                epic: rates.epic / eplusTotal,
                legendary: rates.legendary / eplusTotal
            };
        }

        const rarity = this._rollRarity(rates, rng);
        const ids = this.SPECIES_IDS;
        const species = ids[Math.floor(rng() * ids.length) % ids.length];

        // pity bookkeeping
        if (this.rarityRank(rarity) >= this.rarityRank('epic')) state.gachaPity = 0;
        else state.gachaPity++;

        // dedupe: one pet per species; better rarity upgrades it, worse -> shards
        const owned = state.pets.find(p => p.species === species);
        if (!owned) {
            state.pets.push({ species, rarity, level: 1, necklace: null });
            return { kind: 'new', species, rarity };
        }
        if (this.rarityRank(rarity) > this.rarityRank(owned.rarity)) {
            owned.rarity = rarity;
            return { kind: 'upgrade', species, rarity };
        }
        const shards = CONFIG.GACHA.shardsForDupe[rarity];
        state.shards += shards; // v2.1: shards are GLOBAL
        return { kind: 'shards', species, rarity, shards };
    },

    // 10+1 multi pull.
    multiRoll(state, rng, useGems) {
        const out = [];
        for (let i = 0; i < CONFIG.GACHA.multiPull + 1; i++) {
            out.push(this.roll(state, rng, useGems));
        }
        return out;
    },

    // Spend GLOBAL shards to level any pet (alternative to gold feeding).
    levelWithShards(state, species) {
        const pet = state.pets.find(p => p.species === species);
        const cost = CONFIG.GACHA.shardsPerLevel;
        if (!pet || state.shards < cost) return false;
        state.shards -= cost;
        pet.level++;
        return true;
    }
};

if (typeof module !== 'undefined') {
    if (typeof CONFIG === 'undefined') globalThis.CONFIG = require('./config.js').CONFIG;
    if (typeof PET_SPECIES === 'undefined') globalThis.PET_SPECIES = require('./catalog.js').PET_SPECIES;
    module.exports = { Gacha };
}
