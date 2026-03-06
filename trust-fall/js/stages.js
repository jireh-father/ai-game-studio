// stages.js - Stage generation, wave creation, difficulty scaling

function calculateDifficultyParams(stageNumber) {
    var s = stageNumber;
    return {
        speed: Math.min(1.5 + s * 0.1, 3.5),
        wavesPerStage: Math.min(4 + Math.floor(s / 3), 8),
        waveGap: Math.max(2000 - s * 60, 800),
        syncChance: Math.max(1.0 - s * 0.05, 0.15),
        doubleChance: Math.min(Math.max(0, (s - 12) * 0.06), 0.5),
        fastChance: Math.min(Math.max(0, (s - 7) * 0.05), 0.4),
        asymmetric: s >= 21
    };
}

function isBossStage(stageNumber) {
    return stageNumber > 0 && stageNumber % 10 === 0;
}

function isRestStage(stageNumber) {
    return stageNumber > 0 && stageNumber % 5 === 0 && !isBossStage(stageNumber);
}

function generateWave(stageNumber, waveIndex, params) {
    var isSynced = Math.random() < params.syncChance;
    var isRest = isRestStage(stageNumber) && waveIndex < 2;
    if (isRest) isSynced = true;

    var leftDelay = 0, rightDelay = 0;
    var leftSpeed = isRest ? params.speed * 0.8 : params.speed;
    var rightSpeed = leftSpeed;
    var leftType = 'normal', rightType = 'normal';
    var leftDouble = false, rightDouble = false;

    if (!isSynced) {
        var maxOffset = params.waveGap * 0.4;
        for (var a = 0; a < 5; a++) {
            leftDelay = Math.random() * maxOffset;
            rightDelay = Math.random() * maxOffset;
            var tA = 140 / (leftSpeed * 60) * 1000 + leftDelay;
            var tB = 140 / (rightSpeed * 60) * 1000 + rightDelay;
            var jd = JUMP.DURATION;
            var oStart = Math.max(tA - jd / 2, tB - jd / 2);
            var oEnd = Math.min(tA + jd / 2, tB + jd / 2);
            if (oEnd - oStart >= 150) break;
            if (a === 4) { isSynced = true; leftDelay = 0; rightDelay = 0; }
        }
    }

    if (!isRest && Math.random() < params.fastChance) {
        leftType = 'fast'; leftSpeed = params.speed * 2.0;
    }
    if (!isRest && Math.random() < params.fastChance) {
        rightType = 'fast'; rightSpeed = params.speed * 2.0;
    }
    if (!isRest && Math.random() < params.doubleChance) leftDouble = true;
    if (!isRest && Math.random() < params.doubleChance) rightDouble = true;

    return {
        leftObstacle: { delay: leftDelay, speed: leftSpeed, type: leftType, double: leftDouble },
        rightObstacle: { delay: rightDelay, speed: rightSpeed, type: rightType, double: rightDouble },
        synced: isSynced
    };
}

function generateStage(stageNumber) {
    var params = calculateDifficultyParams(stageNumber);
    var boss = isBossStage(stageNumber);
    var wavesCount = boss ? 10 : params.wavesPerStage;
    var waves = [];
    var prev = null;

    for (var i = 0; i < wavesCount; i++) {
        var w = generateWave(stageNumber, i, params);
        if (prev && wavesCount > 2) {
            var same = w.synced === prev.synced && w.leftObstacle.type === prev.leftObstacle.type &&
                w.rightObstacle.type === prev.rightObstacle.type && w.leftObstacle.double === prev.leftObstacle.double;
            if (same) w = generateWave(stageNumber, i, params);
        }
        waves.push(w);
        prev = w;
    }

    var jumpA = JUMP.HEIGHT, jumpB = JUMP.HEIGHT;
    if (params.asymmetric) {
        var opts = [45, 50, 55, 60];
        jumpA = opts[Math.floor(Math.random() * opts.length)];
        jumpB = opts[Math.floor(Math.random() * opts.length)];
    }

    return {
        waves: waves, wavesPerStage: wavesCount, waveGap: params.waveGap,
        obstacleSpeed: params.speed, jumpA: jumpA, jumpB: jumpB, isBoss: boss
    };
}
