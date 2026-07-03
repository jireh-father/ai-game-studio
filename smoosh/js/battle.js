// =============================================================================
// SMOOSH! - battle.js
// Pure PvP auto-battle simulation (pets vs pets). Deterministic with an
// injected rng; PvpScene only REPLAYS the returned log with visuals.
//
// Element counters (Balance.elementMult): v3.0 8-element chart - fire/water/
// leaf/wind/electric/ice/light/dark, 1.5 strong / 0.7 weak / 1.0 neutral
// (see balance.js _STRONG for the exact pairs). Species roles:
//   flare  - heavy single hit (x2.0)
//   zappy  - chain: hits 2 enemies (x1.0 / x0.6), neutral element
//   aqua   - splash: hits ALL enemies (x0.65 each)
//   clover - heals the weakest living ally (45% of atk); attacks if solo/full
// =============================================================================

const Battle = {

    MAX_ROUNDS: 40,

    _element(species) {
        const def = PET_SPECIES.find(p => p.id === species);
        return def ? def.element : 'fire';
    },

    makeFighter(pet, tapLevel) {
        return {
            species: pet.species,
            element: this._element(pet.species),
            rarity: pet.rarity,
            level: pet.level,
            atk: Balance.petDamage(pet.level, tapLevel, pet.rarity, pet.necklace),
            hp: Balance.petHP(pet.level, tapLevel, pet.rarity),
            maxHp: Balance.petHP(pet.level, tapLevel, pet.rarity)
        };
    },

    // Bot opponent scaled to the player's team power +- jitter.
    // v2.1: EVERY owned pet fights - the bot mirrors the full roster size.
    botTeam(state, rng) {
        const mine = state.pets;
        const avgLv = mine.length
            ? mine.reduce((a, p) => a + p.level, 0) / mine.length : 1;
        const rarities = ['common', 'rare', 'epic', 'legendary'];
        const myRank = mine.length
            ? Math.round(mine.reduce((a, p) => a + rarities.indexOf(p.rarity), 0) / mine.length) : 0;
        const team = [];
        const n = Math.max(1, mine.length);
        const ids = Gacha.SPECIES_IDS;
        for (let i = 0; i < n; i++) {
            const j = 1 + (rng() * 2 - 1) * CONFIG.PVP.botPowerJitter;
            const rankJitter = Math.min(3, Math.max(0, myRank + (rng() < 0.25 ? 1 : rng() < 0.5 ? -1 : 0)));
            team.push({
                species: ids[Math.floor(rng() * ids.length) % ids.length],
                rarity: rarities[rankJitter],
                level: Math.max(1, Math.round(avgLv * j)),
                necklace: null
            });
        }
        return team;
    },

    _living(team) { return team.filter(f => f.hp > 0); },

    _pick(arr, rng) { return arr[Math.floor(rng() * arr.length) % arr.length]; },

    _attack(actor, targets, rng, hits) {
        // hits: [{mult, count|all}] resolved into concrete target list
        const out = [];
        for (const h of hits) {
            const pool = this._living(targets);
            if (!pool.length) break;
            const victims = h.all ? pool.slice()
                : Array.from({ length: Math.min(h.count || 1, pool.length) },
                    () => this._pick(this._living(targets), rng));
            for (const v of victims) {
                if (v.hp <= 0) continue;
                const dmg = actor.atk * h.mult * Balance.elementMult(actor.element, v.element);
                v.hp = Math.max(0, v.hp - dmg);
                out.push({ target: v, dmg });
            }
        }
        return out;
    },

    // sim(teamA, teamB) -> { winner:'A'|'B', rounds, log:[event] }
    // event = { round, side, actor, kind:'hit'|'heal', effects:[{side,idx,amount,dead}] }
    sim(rawA, rawB, tapLevelA, tapLevelB, rng) {
        const A = rawA.map(p => this.makeFighter(p, tapLevelA));
        const B = rawB.map(p => this.makeFighter(p, tapLevelB));
        const log = [];
        let round = 0;

        const act = (side, team, foes) => {
            for (let i = 0; i < team.length; i++) {
                const f = team[i];
                if (f.hp <= 0) continue;
                if (!this._living(foes).length) return;

                if (f.element === 'leaf') {
                    const hurt = this._living(team)
                        .filter(a => a.hp < a.maxHp)
                        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
                    if (hurt) {
                        const heal = f.atk * 0.45;
                        hurt.hp = Math.min(hurt.maxHp, hurt.hp + heal);
                        log.push({
                            round, side, actor: i, kind: 'heal',
                            effects: [{ side, idx: team.indexOf(hurt), amount: heal, dead: false }]
                        });
                        continue;
                    }
                }

                const hits = f.element === 'fire' ? [{ mult: 2.0, count: 1 }]
                    : f.element === 'electric' ? [{ mult: 1.0, count: 1 }, { mult: 0.6, count: 1 }]
                        : f.element === 'water' ? [{ mult: 0.65, all: true }]
                            : [{ mult: 0.9, count: 1 }]; // leaf fallback attack
                const results = this._attack(f, foes, rng, hits);
                log.push({
                    round, side, actor: i, kind: 'hit',
                    effects: results.map(r => ({
                        side: side === 'A' ? 'B' : 'A',
                        idx: foes.indexOf(r.target),
                        amount: r.dmg,
                        dead: r.target.hp <= 0
                    }))
                });
            }
        };

        while (round < this.MAX_ROUNDS) {
            round++;
            act('A', A, B);
            if (!this._living(B).length) return { winner: 'A', rounds: round, log, A, B };
            act('B', B, A);
            if (!this._living(A).length) return { winner: 'B', rounds: round, log, A, B };
        }
        // timeout: higher remaining hp% wins
        const pct = (t) => t.reduce((a, f) => a + f.hp / f.maxHp, 0) / t.length;
        return { winner: pct(A) >= pct(B) ? 'A' : 'B', rounds: round, log, A, B };
    }
};

if (typeof module !== 'undefined') {
    if (typeof CONFIG === 'undefined') globalThis.CONFIG = require('./config.js').CONFIG;
    if (typeof Balance === 'undefined') globalThis.Balance = require('./balance.js').Balance;
    if (typeof PET_SPECIES === 'undefined') globalThis.PET_SPECIES = require('./catalog.js').PET_SPECIES;
    if (typeof Gacha === 'undefined') globalThis.Gacha = require('./gacha.js').Gacha;
    module.exports = { Battle };
}
