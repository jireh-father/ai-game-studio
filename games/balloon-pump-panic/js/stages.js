// Balloon Pump Panic - Stage Generation

function getDifficultyParams(stageNum) {
    const s = stageNum;
    const minThreshold = Math.max(35, 60 - s * 1.5);
    const maxThreshold = Math.max(55, 95 - s * 0.8);
    const inflatePerTap = Math.max(2, 6 - s * 0.15);
    const escapeTimer = Math.max(3.0, 5.0 - s * 0.1) * 1000;
    const speedChance = Math.min(40, Math.max(0, (s - 6) * 5));
    const dualChance = Math.min(50, Math.max(0, (s - 10) * 5));
    const deflateRate = 2 + s * 0.3;
    return { minThreshold, maxThreshold, inflatePerTap, escapeTimer, speedChance, dualChance, deflateRate };
}

function isBonusStage(stageNum) {
    return stageNum > 0 && stageNum % 5 === 0 && stageNum % 10 !== 0;
}

function isBossStage(stageNum) {
    return stageNum > 0 && stageNum % 10 === 0;
}

function generateStage(stageNum) {
    const params = getDifficultyParams(stageNum);
    const balloons = [];

    if (isBossStage(stageNum)) {
        balloons.push({
            popThreshold: Phaser.Math.Between(45, 55),
            isSpeedBalloon: false,
            deflateRate: 0,
            isBoss: true,
            inflatePerTap: Math.max(1.5, 3 - stageNum * 0.05),
            escapeTimer: params.escapeTimer,
            scoreMultiplier: 10
        });
        return balloons;
    }

    if (isBonusStage(stageNum)) {
        const count = Math.min(3 + Math.floor(stageNum / 3), 8);
        for (let i = 0; i < count; i++) {
            balloons.push({
                popThreshold: Phaser.Math.Between(70, 95),
                isSpeedBalloon: false,
                deflateRate: 0,
                isBoss: false,
                inflatePerTap: params.inflatePerTap,
                escapeTimer: params.escapeTimer,
                scoreMultiplier: 2,
                isBonus: true
            });
        }
        return balloons;
    }

    const count = Math.min(3 + Math.floor(stageNum / 3), 8);
    let lastThreshold = -100;

    for (let i = 0; i < count; i++) {
        let threshold;
        let attempts = 0;
        do {
            threshold = Phaser.Math.Between(
                Math.round(params.minThreshold),
                Math.round(params.maxThreshold)
            );
            attempts++;
        } while (Math.abs(threshold - lastThreshold) < 10 && attempts < 20);

        lastThreshold = threshold;
        const isSpeed = Phaser.Math.Between(0, 100) < params.speedChance;

        balloons.push({
            popThreshold: threshold,
            isSpeedBalloon: isSpeed,
            deflateRate: isSpeed ? params.deflateRate : 0,
            isBoss: false,
            inflatePerTap: params.inflatePerTap,
            escapeTimer: params.escapeTimer,
            scoreMultiplier: 1,
            isBonus: false
        });
    }
    return balloons;
}
