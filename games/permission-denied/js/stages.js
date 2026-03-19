// Permission Denied - Stage Generation & Challenge Selection

function selectNextChallenge(challengeNum, previousType) {
    const tier = getDifficultyTier(challengeNum);
    const timerMs = getChallengeTimer(tier);

    // Every 10th challenge is a forced Loading Bar rest
    if (challengeNum % 10 === 0 && tier >= 4) {
        return { type: 'LOADING_BAR', tier, timer_ms: timerMs, params: buildLoadingBarParams(tier) };
    }

    const available = (TIER_UNLOCK[tier] || TIER_UNLOCK[8]).filter(t => t !== previousType);
    // 70% chance of newest type, 30% earlier
    const newestTypes = TIER_UNLOCK[tier].filter(t => {
        if (tier === 0) return true;
        const prev = TIER_UNLOCK[tier - 1] || [];
        return !prev.includes(t);
    });

    let chosen;
    const roll = Math.random();
    if (newestTypes.length > 0 && roll < 0.7) {
        const filtered = newestTypes.filter(t => t !== previousType);
        chosen = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : available[Math.floor(Math.random() * available.length)];
    } else {
        chosen = available[Math.floor(Math.random() * available.length)];
    }

    const params = buildChallengeParams(chosen, tier, challengeNum);
    return { type: chosen, tier, timer_ms: timerMs, params };
}

function buildChallengeParams(type, tier, challengeNum) {
    switch (type) {
        case 'MOVING_BUTTON': return buildMovingButtonParams(tier, challengeNum);
        case 'POPUP_CHAIN': return buildPopupChainParams(tier);
        case 'HOLD_CONFIRM': return buildHoldConfirmParams(tier);
        case 'TOS_SCROLL': return buildTosScrollParams(tier);
        case 'CAPTCHA': return buildCaptchaParams(tier);
        case 'LOADING_BAR': return buildLoadingBarParams(tier);
        case 'SLIDER': return buildSliderParams(tier);
        default: return buildMovingButtonParams(tier, challengeNum);
    }
}

function buildMovingButtonParams(tier, challengeNum) {
    const speed = getButtonSpeed(tier);
    const btnSize = getButtonSize(tier);
    const waypoints = generateButtonPath(tier, challengeNum);
    const noun = PERMISSION_NOUNS[Math.floor(Math.random() * PERMISSION_NOUNS.length)];
    return { speed, btnSize, waypoints, noun };
}

function generateButtonPath(tier, challengeNum) {
    const seed = (Date.now() % 9999) + challengeNum * 13;
    let rng = seed;
    const seededRandom = () => {
        rng = (rng * 16807 + 0) % 2147483647;
        return (rng & 0x7FFFFFFF) / 2147483647;
    };

    const numWaypoints = Math.min(2 + tier, 6);
    const points = [];
    const minX = 60, maxX = GAME_WIDTH - 60;
    const minY = 120, maxY = GAME_HEIGHT - 160;

    for (let i = 0; i < numWaypoints; i++) {
        let x, y, valid;
        do {
            x = minX + seededRandom() * (maxX - minX);
            y = minY + seededRandom() * (maxY - minY);
            valid = true;
            if (points.length > 0) {
                const prev = points[points.length - 1];
                const dist = Math.sqrt((x - prev.x) ** 2 + (y - prev.y) ** 2);
                if (dist < 80) valid = false;
            }
        } while (!valid);
        points.push({ x: Math.round(x), y: Math.round(y) });
    }
    return points;
}

function buildPopupChainParams(tier) {
    const depth = getPopupDepth(tier);
    const messages = [];
    const used = new Set();
    for (let i = 0; i <= depth; i++) {
        let idx;
        do { idx = Math.floor(Math.random() * POPUP_MESSAGES.length); } while (used.has(idx));
        used.add(idx);
        messages.push(POPUP_MESSAGES[idx]);
    }
    return { depth, messages };
}

function buildHoldConfirmParams(tier) {
    let holdDuration = 2000;
    if (tier >= 4) holdDuration = 1800;
    if (tier >= 6) holdDuration = 1500;
    const showCancel = tier >= 4;
    return { holdDuration, showCancel };
}

function buildTosScrollParams(tier) {
    const jumpBack = tier >= 4;
    return { lines: TOS_LINES, jumpBack };
}

function buildCaptchaParams(tier) {
    const gridSize = tier >= 6 ? 4 : 3;
    const totalTiles = gridSize * gridSize;
    const numCorrect = Math.min(3 + Math.floor(tier / 3), Math.floor(totalTiles / 2));
    const category = CAPTCHA_CATEGORIES[Math.floor(Math.random() * CAPTCHA_CATEGORIES.length)];

    const correctIndices = new Set();
    while (correctIndices.size < numCorrect) {
        correctIndices.add(Math.floor(Math.random() * totalTiles));
    }
    return { gridSize, correctIndices: Array.from(correctIndices), category };
}

function buildLoadingBarParams(tier) {
    const interrupt = tier >= 4;
    const showCancelBtn = tier >= 5;
    return { interrupt, showCancelBtn };
}

function buildSliderParams(tier) {
    const targetMin = 18;
    const targetMax = 120;
    const shrink = tier >= 6;
    const shrinkMin = 21;
    return { targetMin, targetMax, shrink, shrinkMin, sliderMax: 150 };
}
