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
        // v5 final-review fix: fall back to the LAST rarity with a positive
        // weight in THIS table, not a hardcoded 'legendary'. A hardcoded
        // fallback silently assumed every table sums to 1 with legendary
        // last and >0 - false for a gold-egg-style table (legendary:0), where
        // float rounding could walk the loop past 1.0 without a `roll < acc`
        // hit and wrongly hand out a legendary the table says is impossible.
        // Also closes a NaN edge (rates summing < 1 for any reason) by
        // degrading gracefully to the highest attainable rarity instead of
        // always defaulting to the rarest.
        for (let i = RARITY_ORDER.length - 1; i >= 0; i--) {
            if (rates[RARITY_ORDER[i]] > 0) return RARITY_ORDER[i];
        }
        return RARITY_ORDER[RARITY_ORDER.length - 1];
    },

    // One egg roll. Returns { kind:'new'|'upgrade'|'shards', species, rarity, shards }
    roll(state, rng, useGems) {
        const G = CONFIG.GACHA;
        let rates = useGems ? G.gemRates : G.rates;

        // pity: guarantee epic+ on the pityAt-th dry roll.
        // v5.0 RETRO ARCADE Task 4: gold-egg pity must guarantee AT MOST
        // epic - legendary can never drop from gold. This already falls out
        // of gold's rates.legendary being 0 (eplusTotal collapses to
        // rates.epic, so the remapped legendary share is 0/epic = 0), but we
        // zero it explicitly here too so the gold-never-legendary invariant
        // holds even if the rate table is retuned later. Gem-egg pity is
        // unchanged - it keeps its legendary share and can still roll it.
        const pityTriggered = state.gachaPity >= G.pityAt - 1;
        if (pityTriggered) {
            const legendaryMass = useGems ? rates.legendary : 0;
            const eplusTotal = rates.epic + legendaryMass;
            rates = {
                common: 0, rare: 0,
                epic: rates.epic / eplusTotal,
                legendary: legendaryMass / eplusTotal
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
            // v3.0 Task 11: track every species ever granted for the Dex
            // (Dex.petUnlocked), independent of whether it's still owned.
            if (!Array.isArray(state.petsSeen)) state.petsSeen = [];
            if (!state.petsSeen.includes(species)) state.petsSeen.push(species);
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
