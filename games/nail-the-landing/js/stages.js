function getStageConfig(stageNumber) {
    const n = stageNumber;
    const isRestStage = n > 1 && n % 10 === 0;

    const fallHeight = Math.min(
        DIFFICULTY.BASE_HEIGHT + n * DIFFICULTY.HEIGHT_INCREMENT,
        DIFFICULTY.MAX_HEIGHT
    );
    const fallSpeed = Math.min(
        DIFFICULTY.BASE_SPEED + n * DIFFICULTY.SPEED_INCREMENT,
        DIFFICULTY.MAX_SPEED
    );

    let platformDrift = 0;
    let platformSpeed = 0;
    if (n >= 11 && !isRestStage) {
        platformDrift = 30;
        platformSpeed = Math.min(40 + (n - 11) * 3, 100);
    }

    let windForce = 0;
    if (n >= 36 && !isRestStage) {
        const seed = n * 7919 + (Date.now() % 100000);
        const dir = (seed % 2 === 0) ? 1 : -1;
        windForce = dir * Math.min((n - 36) * 0.5, 8);
    }

    const hasDecoys = n >= 21 && !isRestStage;

    return {
        stageNumber: n,
        fallHeight,
        fallSpeed,
        platformDrift,
        platformSpeed,
        windForce,
        hasDecoys,
        isRestStage
    };
}

function getPlatformX(config, time, baseX) {
    if (config.platformDrift <= 0) return baseX;
    return baseX + Math.sin(time * 0.001 * (config.platformSpeed / 30)) * config.platformDrift;
}

function getWindOffset(config, delta) {
    if (config.windForce === 0) return 0;
    return config.windForce * (delta / 16.67);
}

function getDecoyPlatformX(config, realPlatformX, gameWidth) {
    if (!config.hasDecoys) return null;
    const seed = config.stageNumber * 13 + (Date.now() % 10000);
    const side = (seed % 2 === 0) ? -1 : 1;
    let decoyX = realPlatformX + side * (PLATFORM_WIDTH * 0.6 + 20);
    decoyX = Math.max(PLATFORM_WIDTH / 2 + 10, Math.min(gameWidth - PLATFORM_WIDTH / 2 - 10, decoyX));
    return decoyX;
}
