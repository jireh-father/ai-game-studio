// =============================================================================
// SMOOSH! - spawner.js
// Pure wave composition: which species show up on a given stage.
// rng: () => [0,1). Injectable for deterministic tests.
//
// Rules (spec §4):
//   - boss stage (stage % CONFIG.BOSS.every === 0): one 'king' +
//     floor(waveSize/3) plain-mob escort
//   - splitter from stage >= 5 at 8% per slot
//   - shieldy  from stage >= 8 at 6% per slot
//   - goldie   2% per slot, max 1 per wave, any stage
//   - remaining slots: plain mobs; stages < 10 exclude the heavy bruisers
//     (tank, grumpy); smaller species weighted up early.
// =============================================================================

const Spawner = {

    SPLITTER_FROM: 5,
    SPLITTER_RATE: 0.08,
    SHIELD_FROM: 8,
    SHIELD_RATE: 0.06,
    JACKPOT_RATE: 0.02,
    HEAVY_FROM: 10,     // bruisers: tank, grumpy, chunky + v6 Task 8's big/
                        // slow elemental bruisers (magmaw, tidalump, brambull,
                        // glacior, voidmaw)
    TRICKY_FROM: 12,    // quirk jellies: ghosty, shysh, cloney, freezy + v6
                        // Task 8's quirk newcomers (ashghast, bogwisp,
                        // hushwind, staticmoth, shiverling, haloghost)

    HEAVY_IDS: ['tank', 'grumpy', 'chunky', 'magmaw', 'tidalump', 'brambull', 'glacior', 'voidmaw'],
    TRICKY_IDS: ['ghosty', 'shysh', 'cloney', 'freezy', 'ashghast', 'bogwisp', 'hushwind', 'staticmoth', 'shiverling', 'haloghost'],

    _mobPool(stage) {
        return SPECIES.filter(s => s.kind === 'mob' &&
            (stage >= this.HEAVY_FROM || this.HEAVY_IDS.indexOf(s.id) === -1) &&
            (stage >= this.TRICKY_FROM || this.TRICKY_IDS.indexOf(s.id) === -1));
    },

    // Boss rotation: every boss stage promotes the NEXT regular mob (catalog
    // order) to a giant boss. Every 10th boss (stage 100, 200, ...) is the
    // crowned King Jelly itself.
    bossSpecies(stage) {
        const bossIndex = Math.floor(stage / CONFIG.BOSS.every);
        if (bossIndex % 10 === 0) return 'king';
        const mobs = SPECIES.filter(s => s.kind === 'mob');
        return mobs[(bossIndex - 1) % mobs.length].id;
    },

    _pickMob(stage, rng) {
        const pool = this._mobPool(stage);
        // Early stages favor small jellies: weight = 1/radius bias before 10.
        if (stage < this.HEAVY_FROM) {
            const weights = pool.map(s => 1 / s.radius);
            const total = weights.reduce((a, b) => a + b, 0);
            let roll = rng() * total;
            for (let i = 0; i < pool.length; i++) {
                roll -= weights[i];
                if (roll <= 0) return pool[i].id;
            }
            return pool[pool.length - 1].id;
        }
        return pool[Math.floor(rng() * pool.length) % pool.length].id;
    },

    composeWave(stage, rng) {
        const size = Balance.waveSize(stage);
        const wave = [];

        // Plain mobs may head for the nest (v2.0): roll AFTER species pick.
        const mobEntry = () => {
            const e = { speciesId: this._pickMob(stage, rng) };
            if (stage >= CONFIG.NEST.nibbleFrom && rng() < CONFIG.NEST.nibbleChance) {
                e.nibbler = true;
            }
            return e;
        };

        if (stage % CONFIG.BOSS.every === 0) {
            wave.push({ speciesId: this.bossSpecies(stage), boss: true });
            const escort = Math.floor(size / 3);
            for (let i = 0; i < escort; i++) wave.push(mobEntry());
            return wave;
        }

        let goldieUsed = false;
        for (let i = 0; i < size; i++) {
            const roll = rng();
            if (!goldieUsed && roll < this.JACKPOT_RATE) {
                wave.push({ speciesId: 'goldie' });
                goldieUsed = true;
            } else if (stage >= this.SPLITTER_FROM &&
                       roll < this.JACKPOT_RATE + this.SPLITTER_RATE) {
                wave.push({ speciesId: 'splitter' });
            } else if (stage >= this.SHIELD_FROM &&
                       roll < this.JACKPOT_RATE + this.SPLITTER_RATE + this.SHIELD_RATE) {
                wave.push({ speciesId: 'shieldy' });
            } else {
                wave.push(mobEntry());
            }
        }
        return wave;
    }
};

if (typeof module !== 'undefined') {
    if (typeof CONFIG === 'undefined') globalThis.CONFIG = require('./config.js').CONFIG;
    if (typeof Balance === 'undefined') globalThis.Balance = require('./balance.js').Balance;
    if (typeof SPECIES === 'undefined') globalThis.SPECIES = require('./catalog.js').SPECIES;
    module.exports = { Spawner };
}
