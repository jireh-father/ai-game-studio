// =============================================================================
// SMOOSH! - skills.js
// v3.0 skill archetype library (LoL-inspired). PURE: cast() returns effect
// descriptors; monsters.js / pets.js translate them into Phaser reality.
// =============================================================================

const Skills = {

    // Status semantics (engines implement): see spec §A4.
    STATUS: {
        stun:    { blocksMove: true,  blocksAttack: true },
        freeze:  { blocksMove: true,  blocksAttack: true, tint: 0xbfe8ff },
        slow:    { speedMult: 0.5 },
        taunt:   { forcedTarget: true },
        shield:  { absorbs: true },
        poison:  { dotPerSec: true, tint: 0x9dff70 },
        burn:    { dotPerSec: true, tint: 0xff9a5a },
        stealth: { untargetable: true, alpha: 0.35 },
        rage:    { attackIntervalMult: 0.6 }
    },

    // v6 Task 6: every ACTIVE archetype's cd was cut to ~75% of its v3.0
    // value (see tests/skills.test.js's pinned before/after table) - skills
    // firing every 9-14s read as "basically absent" next to a 2-3s regular
    // attack cadence. Passives (rage/revive) are untouched - they don't gate
    // on skillCdUntil at all (engines never cast() them, see isWhiff below).
    ARCHETYPES: {
        stun:     { id: 'stun',     cd: 6750,  mag: 1,   durationMs: 1500, desc: { en: 'Stuns the target briefly.',            ko: '대상을 잠시 기절시킨다.' } },
        slow:     { id: 'slow',     cd: 5250,  mag: 0.5, durationMs: 2500, desc: { en: 'Slows nearby enemies.',                 ko: '주변 적을 느리게 만든다.' } },
        knockback:{ id: 'knockback',cd: 4500,  mag: 90,  radius: 120,      desc: { en: 'Shoves enemies away.',                  ko: '적을 밀쳐낸다.' } },
        taunt:    { id: 'taunt',    cd: 6000,  mag: 1,   durationMs: 2000, radius: 200, desc: { en: 'Forces foes to attack me.', ko: '적들이 나만 공격하게 도발한다.' } },
        shield:   { id: 'shield',   cd: 7500,  mag: 2.0,                   desc: { en: 'Gains a damage-absorbing shield.',      ko: '피해를 흡수하는 보호막을 얻는다.' } },
        heal:     { id: 'heal',     cd: 6000,  mag: 0.25,                  desc: { en: 'Heals the most wounded ally.',          ko: '가장 다친 아군을 치유한다.' } },
        lifesteal:{ id: 'lifesteal',cd: 3750,  mag: 0.5,                   desc: { en: 'Bites and drinks health.',              ko: '물어뜯어 체력을 흡수한다.' } },
        poison:   { id: 'poison',   cd: 5250,  mag: 0.4, durationMs: 4000, desc: { en: 'Poisons the target.',                   ko: '대상을 중독시킨다.' } },
        burn:     { id: 'burn',     cd: 5250,  mag: 0.5, durationMs: 3000, desc: { en: 'Sets the target on fire.',              ko: '대상을 불태운다.' } },
        freeze:   { id: 'freeze',   cd: 8250,  mag: 1,   durationMs: 1800, desc: { en: 'Freezes the target solid.',             ko: '대상을 꽁꽁 얼린다.' } },
        chain:    { id: 'chain',    cd: 6000,  mag: 3,                     desc: { en: 'Lightning arcs to 3 foes.',             ko: '번개가 적 3명에게 튄다.' } },
        execute:  { id: 'execute',  cd: 4500,  mag: 9999, threshold: 0.15, desc: { en: 'Finishes off weakened prey.',           ko: '빈사의 사냥감을 처형한다.' } },
        critaura: { id: 'critaura', cd: 9000,  mag: 0.10, durationMs: 5000, desc: { en: 'Team crit chance up.',                 ko: '팀 치명타 확률 증가.' } },
        goldaura: { id: 'goldaura', cd: 9000,  mag: 0.15, durationMs: 5000, desc: { en: 'Team gold gain up.',                   ko: '팀 골드 획득 증가.' } },
        stealth:  { id: 'stealth',  cd: 7500,  mag: 1,   durationMs: 2500, desc: { en: 'Vanishes from sight.',                  ko: '시야에서 사라진다.' } },
        clone:    { id: 'clone',    cd: 10500, mag: 1,                     desc: { en: 'Splits off a copy.',                    ko: '분신을 만들어낸다.' } },
        summon:   { id: 'summon',   cd: 9750,  mag: 2,                     desc: { en: 'Calls tiny helpers.',                   ko: '꼬마 부하들을 소환한다.' } },
        rage:     { id: 'rage',     cd: 1,     mag: 0.6, passive: true,    desc: { en: 'Attacks faster when hurt.',             ko: '다치면 공격이 빨라진다.' } },
        revive:   { id: 'revive',   cd: 1,     mag: 0.5, passive: true, once: true, desc: { en: 'Rises once from KO.',          ko: '쓰러져도 한 번 다시 일어난다.' } },
        dash:     { id: 'dash',     cd: 3750,  mag: 1.5,                   desc: { en: 'Dashes to strike.',                     ko: '돌진해 공격한다.' } },
        slam:     { id: 'slam',     cd: 6750,  mag: 2.5, radius: 160,      desc: { en: 'Ground-pounds an area.',                ko: '지면을 내리쳐 광역 피해.' } },
        buffaura: { id: 'buffaura', cd: 9000,  mag: 0.20, durationMs: 5000, desc: { en: 'Team attack up.',                      ko: '팀 공격력 증가.' } },
        // v6 Task 6: NEW - frog-tongue PULL. Drags the single nearest foe
        // within `range` in close (Effects._skillPull tweens the target's
        // sprite toward the caster over ~250ms) then lands a modest damage
        // tick on arrival. Pure single-target CC+chip, sits alongside
        // knockback/execute on the cd tier (see the pinned cd table below).
        pull:     { id: 'pull',     cd: 4500,  mag: 0.6, range: 240,       desc: { en: 'Yanks a foe in with a sticky tongue.', ko: '끈적한 혀로 적을 확 끌어당긴다.' } }
    },

    ready(entity, nowMs) {
        return !entity.skillCdUntil || nowMs >= entity.skillCdUntil;
    },

    // v6 final-review fix: how long a WHIFFED cast (see isWhiff below) waits
    // before retrying, instead of the old "pays no cooldown at all" ruling.
    // A whiff that retries every single frame (e.g. an offensive skill with
    // zero live targets because the whole enemy squad is KO'd) means every
    // monster/pet whose cd "elapsed" mid-whiff fires on the exact same frame
    // the instant a target reappears - an unavoidable alpha-strike. A short,
    // shared retry gate desyncs those casts across entities instead of
    // firing them in lockstep. Deliberately far below every ARCHETYPE's cd
    // (see tests/skills.test.js) so a REAL cast still reads as much rarer
    // than a whiff retry. Pulled out as a named constant (mirrors isWhiff/
    // isCastable above) so monsters.js's _updateSkill and pets.js's
    // _updateAgentSkill share ONE value instead of two hardcoded literals.
    WHIFF_RETRY_MS: 500,

    // v3.0 review fix: "can a manual button press actually DO something with
    // this skill id?" - true for every active archetype (including clone/
    // summon, now that both sides implement them), false for passives
    // (rage/revive: they trigger off state, not a cast) and unknown ids.
    // Pulled out as a pure predicate so the ultimate's fallback-target search
    // (FieldPets.isUltCastable, game.js castUltimate) is unit-testable
    // without a Phaser scene.
    isCastable(id) {
        const a = this.ARCHETYPES[id];
        return !!a && !a.passive;
    },

    // v6 Task 6: "did this cast actually land on someone?" - null (condition
    // unmet: execute above threshold, pull with nobody in range, etc.) is
    // obviously a whiff; a non-null descriptor that still carries an EMPTY
    // targets[] (taunt/knockback/slam's "nobody in radius" case - see cast()
    // below, they return unconditionally rather than null-guarding on
    // near.length like stun/freeze/chain do) is ALSO a whiff. This reverses
    // the old v3.0 Task 7 ruling that paid the cooldown even on an empty-
    // target cast; per v6 intent, skills should feel PRESENT, so a whiff now
    // retries after WHIFF_RETRY_MS (see above) instead of going dark for the
    // whole cooldown.
    // Kinds with no targets[] field at all (buff/spawn - always self/ally-
    // scoped, never miss) are never whiffs. Pulled out as a pure predicate
    // (mirrors isCastable above) so monsters.js's _updateSkill and pets.js's
    // _updateAgentSkill share ONE cd-gating rule instead of forking the
    // "empty array vs missing field" check twice.
    isWhiff(eff) {
        return !eff || (Array.isArray(eff.targets) && eff.targets.length === 0);
    },

    // Returns an effect descriptor or null (no valid target / condition unmet).
    // ctx: { self:{hp,maxHp,dmg,elem,x,y}, targets:[{id,hp,maxHp,x,y,dist}], now, mult? }
    cast(id, ctx) {
        const a = this.ARCHETYPES[id];
        if (!a) return null;
        const mult = ctx.mult || 1;
        const near = (ctx.targets || []).slice().sort((p, q) => p.dist - q.dist);
        const first = near[0];
        switch (id) {
            case 'stun': case 'freeze':
                return first ? { kind: 'status', status: id, durationMs: a.durationMs * mult, targets: [first.id] } : null;
            case 'slow':
                return near.length ? { kind: 'status', status: 'slow', durationMs: a.durationMs * mult, targets: near.slice(0, 4).map(t => t.id) } : null;
            case 'taunt':
                return { kind: 'status', status: 'taunt', durationMs: a.durationMs * mult, targets: near.filter(t => t.dist <= a.radius).map(t => t.id), source: true };
            case 'stealth':
                return { kind: 'status', status: 'stealth', durationMs: a.durationMs * mult, targets: ['self'] };
            case 'poison': case 'burn':
                return first ? { kind: 'status', status: id, durationMs: a.durationMs * mult, dotPerSec: Math.round(ctx.self.dmg * a.mag * mult), targets: [first.id] } : null;
            case 'shield':
                return { kind: 'shield', amount: Math.round(ctx.self.maxHp * a.mag * mult) / 2, targets: ['self'] };
            case 'heal':
                return { kind: 'heal', amount: Math.round(ctx.self.maxHp * a.mag * mult), targets: ['ally-lowest'] };
            case 'lifesteal':
                return first ? { kind: 'damage', amount: Math.round(ctx.self.dmg * mult), heal: a.mag, targets: [first.id] } : null;
            case 'chain':
                return near.length ? { kind: 'damage', amount: Math.round(ctx.self.dmg * mult), targets: near.slice(0, a.mag).map(t => t.id), chain: true } : null;
            case 'execute': {
                const prey = near.find(t => t.hp / t.maxHp <= a.threshold);
                return prey ? { kind: 'damage', amount: Math.round(ctx.self.dmg * a.mag * mult), execute: true, targets: [prey.id] } : null;
            }
            case 'knockback':
                return { kind: 'knockback', distance: a.mag * mult, targets: near.filter(t => t.dist <= a.radius).map(t => t.id) };
            case 'critaura':
                return { kind: 'buff', stat: 'crit', add: a.mag * mult, durationMs: a.durationMs, side: 'ally' };
            case 'goldaura':
                return { kind: 'buff', stat: 'gold', add: a.mag * mult, durationMs: a.durationMs, side: 'ally' };
            case 'buffaura':
                return { kind: 'buff', stat: 'dmg', add: a.mag * mult, durationMs: a.durationMs, side: 'ally' };
            case 'clone':
                return { kind: 'spawn', what: 'clone', count: Math.round(a.mag * mult) };
            case 'summon':
                return { kind: 'spawn', what: 'minion', count: Math.round(a.mag * mult) };
            case 'dash':
                return first ? { kind: 'damage', amount: Math.round(ctx.self.dmg * a.mag * mult), dash: true, targets: [first.id] } : null;
            case 'slam':
                return { kind: 'damage', amount: Math.round(ctx.self.dmg * a.mag * mult), radius: a.radius, targets: near.filter(t => t.dist <= a.radius).map(t => t.id) };
            case 'pull': {
                // nearest foe only, and only if it's actually within tongue
                // range - null-guarded (not an unconditional empty-targets
                // return like taunt/knockback/slam) so isWhiff's null check
                // alone already covers "nobody in range" for this archetype.
                const prey = first && first.dist <= a.range ? first : null;
                return prey ? { kind: 'pull', targets: [prey.id], distance: prey.dist, amount: Math.round(ctx.self.dmg * a.mag * mult) } : null;
            }
            case 'rage': case 'revive':
                return null; // passives — engines check ARCHETYPES directly
            default:
                return null;
        }
    }
};

if (typeof module !== 'undefined') module.exports = { Skills };
