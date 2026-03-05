// stages.js - Stage generation, obstacle spawning, difficulty scaling
function getDifficultyParams(stageNum) {
    let params = DIFFICULTY[0];
    for (let i = DIFFICULTY.length - 1; i >= 0; i--) {
        if (stageNum >= DIFFICULTY[i].minStage) { params = DIFFICULTY[i]; break; }
    }
    // Interpolate within range for smoother curve
    const progress = Math.min(1, (stageNum - params.minStage) / 3);
    const nextIdx = DIFFICULTY.indexOf(params) + 1;
    if (nextIdx < DIFFICULTY.length) {
        const next = DIFFICULTY[nextIdx];
        return {
            speed: Phaser.Math.Linear(params.speed, next.speed, progress),
            spawnInterval: Phaser.Math.Linear(params.spawnInterval, next.spawnInterval, progress),
            stealWindow: Phaser.Math.Linear(params.stealWindow, next.stealWindow, progress),
            bombChance: Phaser.Math.Linear(params.bombChance, next.bombChance, progress),
            timeValues: params.timeValues,
            wallGrowth: params.wallGrowth,
            hasBoss: stageNum >= 11
        };
    }
    return { ...params, hasBoss: stageNum >= 11 };
}

function generateObstacleQueue(stageNum, count) {
    const params = getDifficultyParams(stageNum);
    const queue = [];
    let lastType = null;
    let lastValue = null;
    let consecutiveSame = 0;

    for (let i = 0; i < count; i++) {
        // Boss at steal #10 for stages 11+
        if (i === count - 1 && params.hasBoss) {
            queue.push({ type: 'boss', timeValue: 8, hp: 3 });
            continue;
        }

        let type = 'normal';
        // Solvability: ensure >= 60% stealable, no consecutive bombs early
        const bombsCount = queue.filter(o => o.type === 'bomb').length;
        const maxBombs = Math.floor(count * 0.4);
        if (bombsCount < maxBombs && Math.random() < params.bombChance) {
            // No consecutive bombs in stages 4-6
            if (stageNum <= 6 && lastType === 'bomb') {
                type = 'normal';
            } else {
                type = 'bomb';
            }
        }

        let timeValue;
        if (type === 'bomb') {
            timeValue = -2;
        } else {
            // Variety: avoid 3 identical in a row
            do {
                timeValue = Phaser.Math.RND.pick(params.timeValues);
            } while (timeValue === lastValue && consecutiveSame >= 2 && params.timeValues.length > 1);
        }

        if (type === lastType && timeValue === lastValue) {
            consecutiveSame++;
        } else {
            consecutiveSame = 1;
        }
        lastType = type;
        lastValue = timeValue;
        queue.push({ type, timeValue });
    }
    return queue;
}

// Rest beat: after boss, next 3 are guaranteed safe +3s+
function generateRestBeat() {
    return [
        { type: 'normal', timeValue: 3 },
        { type: 'normal', timeValue: 3 },
        { type: 'normal', timeValue: 5 }
    ];
}

function createObstacleSprite(scene, data, x, y) {
    let key, scale;
    if (data.type === 'boss') {
        key = 'boss'; scale = 1.2;
    } else if (data.type === 'bomb') {
        key = 'bomb'; scale = 0.8;
    } else {
        key = 'obstacle'; scale = 0.8;
    }
    const sprite = scene.add.image(x, y, key).setScale(scale);
    sprite.obstacleData = { ...data, stolen: false, passed: false };

    // Add time value text label
    const label = data.type === 'bomb'
        ? `-${Math.abs(data.timeValue)}s`
        : `+${data.timeValue}s`;
    const color = data.type === 'bomb' ? '#FF1744' : (data.type === 'boss' ? '#FFD700' : '#FFFFFF');
    const txt = scene.add.text(x, y, label, {
        fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold',
        color: color, stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5);
    sprite.label = txt;

    // Boss health pips
    if (data.type === 'boss') {
        sprite.obstacleData.hp = 3;
        const pips = [];
        for (let i = 0; i < 3; i++) {
            const pip = scene.add.circle(x - 12 + i * 12, y + 28, 4, 0xFFD700);
            pips.push(pip);
        }
        sprite.pips = pips;
    }

    // Pulsing tween for bombs
    if (data.type === 'bomb') {
        scene.tweens.add({
            targets: sprite, alpha: 0.5, duration: 300,
            yoyo: true, repeat: -1
        });
    }

    return sprite;
}
