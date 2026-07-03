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

    ARCHETYPES: {
        stun:     { id: 'stun',     cd: 9000,  mag: 1,   durationMs: 1500, desc: { en: 'Stuns the target briefly.',            ko: '대상을 잠시 기절시킨다.' } },
        slow:     { id: 'slow',     cd: 7000,  mag: 0.5, durationMs: 2500, desc: { en: 'Slows nearby enemies.',                 ko: '주변 적을 느리게 만든다.' } },
        knockback:{ id: 'knockback',cd: 6000,  mag: 90,  radius: 120,      desc: { en: 'Shoves enemies away.',                  ko: '적을 밀쳐낸다.' } },
        taunt:    { id: 'taunt',    cd: 8000,  mag: 1,   durationMs: 2000, radius: 200, desc: { en: 'Forces foes to attack me.', ko: '적들이 나만 공격하게 도발한다.' } },
        shield:   { id: 'shield',   cd: 10000, mag: 2.0,                   desc: { en: 'Gains a damage-absorbing shield.',      ko: '피해를 흡수하는 보호막을 얻는다.' } },
        heal:     { id: 'heal',     cd: 8000,  mag: 0.25,                  desc: { en: 'Heals the most wounded ally.',          ko: '가장 다친 아군을 치유한다.' } },
        lifesteal:{ id: 'lifesteal',cd: 5000,  mag: 0.5,                   desc: { en: 'Bites and drinks health.',              ko: '물어뜯어 체력을 흡수한다.' } },
        poison:   { id: 'poison',   cd: 7000,  mag: 0.4, durationMs: 4000, desc: { en: 'Poisons the target.',                   ko: '대상을 중독시킨다.' } },
        burn:     { id: 'burn',     cd: 7000,  mag: 0.5, durationMs: 3000, desc: { en: 'Sets the target on fire.',              ko: '대상을 불태운다.' } },
        freeze:   { id: 'freeze',   cd: 11000, mag: 1,   durationMs: 1800, desc: { en: 'Freezes the target solid.',             ko: '대상을 꽁꽁 얼린다.' } },
        chain:    { id: 'chain',    cd: 8000,  mag: 3,                     desc: { en: 'Lightning arcs to 3 foes.',             ko: '번개가 적 3명에게 튄다.' } },
        execute:  { id: 'execute',  cd: 6000,  mag: 9999, threshold: 0.15, desc: { en: 'Finishes off weakened prey.',           ko: '빈사의 사냥감을 처형한다.' } },
        critaura: { id: 'critaura', cd: 12000, mag: 0.10, durationMs: 5000, desc: { en: 'Team crit chance up.',                 ko: '팀 치명타 확률 증가.' } },
        goldaura: { id: 'goldaura', cd: 12000, mag: 0.15, durationMs: 5000, desc: { en: 'Team gold gain up.',                   ko: '팀 골드 획득 증가.' } },
        stealth:  { id: 'stealth',  cd: 10000, mag: 1,   durationMs: 2500, desc: { en: 'Vanishes from sight.',                  ko: '시야에서 사라진다.' } },
        clone:    { id: 'clone',    cd: 14000, mag: 1,                     desc: { en: 'Splits off a copy.',                    ko: '분신을 만들어낸다.' } },
        summon:   { id: 'summon',   cd: 13000, mag: 2,                     desc: { en: 'Calls tiny helpers.',                   ko: '꼬마 부하들을 소환한다.' } },
        rage:     { id: 'rage',     cd: 1,     mag: 0.6, passive: true,    desc: { en: 'Attacks faster when hurt.',             ko: '다치면 공격이 빨라진다.' } },
        revive:   { id: 'revive',   cd: 1,     mag: 0.5, passive: true, once: true, desc: { en: 'Rises once from KO.',          ko: '쓰러져도 한 번 다시 일어난다.' } },
        dash:     { id: 'dash',     cd: 5000,  mag: 1.5,                   desc: { en: 'Dashes to strike.',                     ko: '돌진해 공격한다.' } },
        slam:     { id: 'slam',     cd: 9000,  mag: 2.5, radius: 160,      desc: { en: 'Ground-pounds an area.',                ko: '지면을 내리쳐 광역 피해.' } },
        buffaura: { id: 'buffaura', cd: 12000, mag: 0.20, durationMs: 5000, desc: { en: 'Team attack up.',                      ko: '팀 공격력 증가.' } }
    },

    ready(entity, nowMs) {
        return !entity.skillCdUntil || nowMs >= entity.skillCdUntil;
    },

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
            case 'rage': case 'revive':
                return null; // passives — engines check ARCHETYPES directly
            default:
                return null;
        }
    }
};

if (typeof module !== 'undefined') module.exports = { Skills };
