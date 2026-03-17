function getStageConfig(n) {
    if (n < 1) n = 1;
    const isRestStage = n % 5 === 0;
    const restBonus = isRestStage ? 1.0 : 0;

    let snoreFillTime = Math.max(2.0, 8.0 - n * 0.15) + restBonus;
    const promptWindow = Math.max(1.2, 4.0 - n * 0.08);
    const promptInterval = Math.max(0.8, 3.0 - n * 0.05);
    const maxSimultaneous = n < 6 ? 1 : n < 21 ? 2 : 3;
    const fakePromptChance = n < 11 ? 0 : Math.min(0.30, (n - 10) * 0.025);
    const doubleMeterChance = n < 21 ? 0 : n < 41 ? 0.20 : 0.35;
    const tapsToAdvance = Math.min(20, 5 + Math.floor(n / 3));
    const speedSpike = n >= 41;

    return {
        stageNumber: n,
        snoreFillTime: snoreFillTime,
        promptWindow: promptWindow,
        promptInterval: promptInterval,
        maxSimultaneous: maxSimultaneous,
        fakePromptChance: fakePromptChance,
        doubleMeterChance: doubleMeterChance,
        tapsToAdvance: tapsToAdvance,
        speedSpike: speedSpike,
        isRestStage: isRestStage
    };
}

function getOrganPosition(lastIndex) {
    let idx;
    do {
        idx = Math.floor(Math.random() * ORGAN_POSITIONS.length);
    } while (idx === lastIndex);
    return { index: idx, pos: ORGAN_POSITIONS[idx] };
}

function getComboMultiplier(streak) {
    let mult = 1.0;
    for (let i = COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
        if (streak >= COMBO_THRESHOLDS[i].streak) {
            mult = COMBO_THRESHOLDS[i].mult;
            break;
        }
    }
    return mult;
}

function shouldSpawnFake(stageConfig) {
    return Math.random() < stageConfig.fakePromptChance;
}

function shouldDoubleMeter(stageConfig) {
    return Math.random() < stageConfig.doubleMeterChance;
}
