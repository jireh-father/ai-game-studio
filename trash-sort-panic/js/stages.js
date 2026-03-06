// stages.js - Difficulty scaling, item pools, stage generation

function calculateDifficulty(stageNumber) {
    const s = stageNumber;
    const fallSpeed = Math.min(280, 80 + s * 12);
    const spawnInterval = Math.max(800, 2000 - s * 80);
    const maxSimultaneous = Math.min(5, 1 + Math.floor(s / 4));
    const binCount = s <= 3 ? 3 : 4;

    let binMovement = 'none';
    if (s >= 16) binMovement = 'swap';
    else if (s >= 11) binMovement = 'slide';

    const binSwapInterval = s >= 16 ? Math.max(3000, 10000 - s * 200) : 0;
    const trickChance = Math.min(0.4, Math.max(0, (s - 10) * 0.04));
    const ambiguousChance = Math.min(0.3, Math.max(0, (s - 6) * 0.03));
    const blackoutChance = s >= 26 ? Math.min(0.15, (s - 25) * 0.015) : 0;

    return {
        fallSpeed, spawnInterval, maxSimultaneous, binCount,
        binMovement, binSwapInterval, trickChance, ambiguousChance,
        blackoutChance, isRest: isRestStage(s), isBoss: isBossStage(s)
    };
}

function isRestStage(stageNumber) {
    return stageNumber > 1 && stageNumber % 5 === 0;
}

function isBossStage(stageNumber) {
    return stageNumber > 1 && stageNumber % 10 === 0;
}

function getItemPool(stageNumber, difficulty) {
    let pool = ITEMS.filter(item => item.unlockStage <= stageNumber);

    // Filter out trick/ambiguous items based on stage difficulty chances
    if (difficulty.trickChance <= 0) {
        pool = pool.filter(item => !item.trick);
    }
    if (difficulty.ambiguousChance <= 0) {
        pool = pool.filter(item => !item.ambiguous);
    }

    // Filter hazardous items before stage 4
    if (stageNumber < 4) {
        pool = pool.filter(item => item.category !== 'hazard');
    }

    return pool;
}

function selectItem(pool, lastItemId, difficulty) {
    // No two consecutive identical items
    let candidates = pool.filter(item => item.id !== lastItemId);
    if (candidates.length === 0) candidates = pool;

    // Weighted selection: trick and ambiguous items appear based on their chance
    const weighted = [];
    for (const item of candidates) {
        let weight = 1;
        if (item.trick) weight = difficulty.trickChance > 0 ? difficulty.trickChance * 3 : 0;
        if (item.ambiguous) weight = difficulty.ambiguousChance > 0 ? difficulty.ambiguousChance * 3 : 0;
        if (weight > 0) {
            weighted.push({ item, weight });
        }
    }

    if (weighted.length === 0) return candidates[0];

    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let r = Math.random() * totalWeight;
    for (const w of weighted) {
        r -= w.weight;
        if (r <= 0) return w.item;
    }
    return weighted[weighted.length - 1].item;
}

function getBinLayout(stageNumber, gameWidth) {
    const binW = 80;
    const binH = 70;
    const gap = 8;
    const binCount = stageNumber <= 3 ? 3 : 4;
    const startY = 440;

    const positions = [];
    if (binCount === 3) {
        // 3 bins in a row
        const totalW = binW * 3 + gap * 2;
        const startX = (gameWidth - totalW) / 2 + binW / 2;
        positions.push({ x: startX, y: startY, cat: 'recycle' });
        positions.push({ x: startX + binW + gap, y: startY, cat: 'compost' });
        positions.push({ x: startX + (binW + gap) * 2, y: startY, cat: 'trash' });
    } else {
        // 2x2 grid
        const colGap = 10;
        const rowGap = 6;
        const leftX = gameWidth / 2 - binW / 2 - colGap / 2 - binW / 2 + binW / 2;
        const rightX = gameWidth / 2 + colGap / 2 + binW / 2;
        const cLeft = gameWidth / 4 + 5;
        const cRight = gameWidth * 3 / 4 - 5;
        positions.push({ x: cLeft, y: startY, cat: 'recycle' });
        positions.push({ x: cRight, y: startY, cat: 'compost' });
        positions.push({ x: cLeft, y: startY + binH + rowGap, cat: 'trash' });
        positions.push({ x: cRight, y: startY + binH + rowGap, cat: 'hazard' });
    }

    return positions;
}

function generateBinSwapSequence(stageNumber, stageDuration) {
    const diff = calculateDifficulty(stageNumber);
    if (diff.binMovement !== 'swap' || diff.binSwapInterval <= 0) return [];

    const swaps = [];
    let t = diff.binSwapInterval;
    while (t < stageDuration - 1000) {
        // Random swap of two bin positions
        const a = Math.floor(Math.random() * 4);
        let b = Math.floor(Math.random() * 3);
        if (b >= a) b++;
        swaps.push({ time: t, indexA: a, indexB: b });
        t += diff.binSwapInterval;
    }
    return swaps;
}

function getSpawnInterval(stageNumber, difficulty) {
    let interval = difficulty.spawnInterval;
    // Rest stages: 30% slower spawns
    if (difficulty.isRest) interval = Math.floor(interval * 1.3);
    return interval;
}

function getFallSpeed(stageNumber, difficulty) {
    let speed = difficulty.fallSpeed;
    // Boss stages: 50% faster
    if (difficulty.isBoss) speed = Math.floor(speed * 1.5);
    // Rest stages: 20% slower
    if (difficulty.isRest) speed = Math.floor(speed * 0.8);
    return Math.min(280, speed);
}
