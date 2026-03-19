// Grocery Gamble - Stage Generation
function getDifficultyParams(stageNumber) {
    const s = stageNumber;
    let beltSpeed, itemCount, windowPercent, deceptionRate, fragileRate, rushRate, needleDrift;

    if (s <= 3) {
        beltSpeed = 40 + s * 8;
        itemCount = 4;
        windowPercent = 10;
        deceptionRate = 0.2;
        fragileRate = 0; rushRate = 0; needleDrift = 0;
    } else if (s <= 8) {
        beltSpeed = 40 + s * 8;
        itemCount = 4 + Math.floor(s / 3);
        windowPercent = Math.max(7, 10 - (s - 3) * 0.6);
        deceptionRate = 0.3;
        fragileRate = s >= 6 ? 0.3 : 0;
        rushRate = 0; needleDrift = 0;
    } else if (s <= 15) {
        beltSpeed = Math.min(160, 40 + s * 8);
        itemCount = Math.min(12, 4 + Math.floor(s / 3));
        windowPercent = Math.max(5.5, 10 - s * 0.25);
        deceptionRate = 0.35;
        fragileRate = 0.4; rushRate = 0.15; needleDrift = 0;
    } else if (s <= 30) {
        beltSpeed = Math.min(160, 40 + s * 8);
        itemCount = Math.min(12, 4 + Math.floor(s / 3));
        windowPercent = Math.max(5, 10 - s * 0.25);
        deceptionRate = 0.4;
        fragileRate = 0.45; rushRate = 0.25; needleDrift = 1;
    } else {
        beltSpeed = 160;
        itemCount = 12;
        windowPercent = 5;
        deceptionRate = 0.45;
        fragileRate = 0.5; rushRate = 0.3; needleDrift = 2;
    }

    // Rest stages: every 5th stage
    if (s > 1 && s % 5 === 0) {
        itemCount = Math.max(3, itemCount - 2);
        windowPercent += 1;
    }

    return { beltSpeed, itemCount, windowPercent, deceptionRate, fragileRate, rushRate, needleDrift };
}

function pickItemsForStage(stageNumber, count, params) {
    const seed = stageNumber * 7919 + Date.now() % 100000;
    let rng = seed;
    function random() {
        rng = (rng * 16807 + 1) % 2147483647;
        return (rng & 0x7fffffff) / 2147483647;
    }

    const available = ITEM_TYPES.filter(it => it.stageUnlock <= stageNumber);
    const items = [];

    for (let i = 0; i < count; i++) {
        let type;
        const roll = random();

        // Check for rush item
        const isRush = stageNumber >= 9 && random() < params.rushRate;

        // Check for fragile item
        if (random() < params.fragileRate) {
            const fragiles = available.filter(it => it.isFragile);
            if (fragiles.length > 0) {
                type = fragiles[Math.floor(random() * fragiles.length)];
            }
        }

        if (!type) {
            type = available[Math.floor(random() * available.length)];
        }

        // Determine weight with possible deception
        let trueWeight;
        const isDeceptive = random() < params.deceptionRate;
        if (isDeceptive && type.deceptive) {
            // Reverse the expected weight range
            if (type.sizeCategory === 'large') {
                trueWeight = type.minWeight + random() * (type.maxWeight - type.minWeight) * 0.3;
            } else {
                trueWeight = type.maxWeight - random() * (type.maxWeight - type.minWeight) * 0.3;
            }
        } else {
            trueWeight = type.minWeight + random() * (type.maxWeight - type.minWeight);
        }
        trueWeight = Math.round(trueWeight);

        // Target weight (what the label says) — close to true weight but not exact
        const labelOffset = (random() - 0.5) * (type.maxWeight - type.minWeight) * 0.15;
        const targetWeight = Math.round(trueWeight + labelOffset);

        items.push({
            key: type.key,
            label: type.label,
            isFragile: type.isFragile,
            trueWeight,
            targetWeight,
            isRush,
            rushTimer: isRush ? 4000 : 0
        });
    }

    return items;
}

function generateStage(stageNumber) {
    const params = getDifficultyParams(stageNumber);
    const items = pickItemsForStage(stageNumber, params.itemCount, params);

    return {
        stageNumber,
        items,
        beltSpeed: params.beltSpeed,
        windowPercent: params.windowPercent,
        overflowTimer: OVERFLOW_THRESHOLD,
        needleDrift: params.needleDrift,
        itemCount: params.itemCount
    };
}
