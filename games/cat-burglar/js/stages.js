function seededRandom(seed) {
    let s = seed;
    return function() {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
    };
}

function generateStage(stageNumber, sessionSalt) {
    const seed = stageNumber * 7919 + (sessionSalt || Date.now() % 100000);
    const rng = seededRandom(seed);
    const isRest = isRestStage(stageNumber);

    const totalSlots = isRest ? Math.max(4, Math.floor((5 + Math.min(3, Math.floor(stageNumber / 8))) / 2))
        : 5 + Math.min(3, Math.floor(stageNumber / 8));

    const quota = isRest
        ? Math.max(2, Math.floor((3 + Math.floor(stageNumber * 0.5)) / 2))
        : Math.min(12, 3 + Math.floor(stageNumber * 0.5));

    const fillRateMod = isRest ? (1.0 + stageNumber * 0.015) * 0.5
        : Math.min(1.6, 1.0 + stageNumber * 0.015);

    const weights = getTierWeights(stageNumber, isRest);
    const items = [];
    let cheapCount = 0;

    for (let i = 0; i < totalSlots; i++) {
        const tier = pickTier(weights, rng);
        if (tier === 'cheap') cheapCount++;
        items.push({
            tier: tier,
            points: ITEM_POINTS[tier],
            noise: NOISE_VALUES[tier]
        });
    }

    if (cheapCount < quota) {
        for (let i = 0; i < items.length && cheapCount < quota; i++) {
            if (items[i].tier !== 'cheap') {
                items[i] = { tier: 'cheap', points: ITEM_POINTS.cheap, noise: NOISE_VALUES.cheap };
                cheapCount++;
            }
        }
    }

    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }

    const esc = getEscapeConfig(stageNumber);

    return {
        slots: items,
        quota: quota,
        fillRateModifier: fillRateMod,
        isRest: isRest,
        escapeSwipes: esc.swipes,
        escapeTime: esc.time,
        postEscapeMeter: stageNumber >= 20 ? (stageNumber >= 30 ? 60 : 50) : 40,
        stageNumber: stageNumber
    };
}

function getTierWeights(stage, isRest) {
    if (isRest) return { cheap: 100, mid: 0, valuable: 0, heirloom: 0, precious: 0 };
    const cheap = Math.max(10, 60 - stage * 2);
    const mid = 30;
    const valuable = Math.min(40, 5 + stage * 1.5);
    const heirloom = stage >= 7 ? Math.min(20, (stage - 7) * 2) : 0;
    const precious = stage >= 20 ? Math.min(15, (stage - 20) * 1.5) : 0;
    return { cheap, mid, valuable, heirloom, precious };
}

function pickTier(weights, rng) {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let r = rng() * total;
    for (const [tier, w] of Object.entries(weights)) {
        r -= w;
        if (r <= 0) return tier;
    }
    return 'cheap';
}

function isRestStage(n) { return n > 0 && n % 5 === 0; }

function getEscapeConfig(stage) {
    if (stage >= 30) return { swipes: 4, time: 1200 };
    if (stage >= 20) return { swipes: 4, time: 1500 };
    if (stage >= 10) return { swipes: 3, time: 1500 };
    return { swipes: 3, time: 1500 };
}

const DIRECTIONS = ['left', 'right', 'up', 'down'];

function generateEscapeSequence(count, rng) {
    const seq = [];
    for (let i = 0; i < count; i++) {
        seq.push(DIRECTIONS[Math.floor((rng || Math.random)() * 4)]);
    }
    return seq;
}
