// Echo Thief - Stage Generation
function seededRandom(seed) {
    let s = seed;
    return function() {
        s = (s * 1664525 + 1013904223) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}

function getDifficultyParams(stage) {
    return {
        creatureCount: Math.min(3 + Math.floor(stage / 4), 11),
        loudCreatureCount: Math.max(0, Math.floor((stage - 10) / 5)),
        silenceZoneCount: Math.max(1, 3 - Math.floor(stage / 15)),
        silenceZoneRadius: Math.max(35, 80 - stage * 1.5),
        waveSpeed: Math.min(WAVE_MAX_SPEED, WAVE_MIN_SPEED + stage * 0.1),
        creatureShiftInterval: Math.max(4000, 7000 - stage * 100),
        passiveNoiseDecay: Math.max(0.5, NOISE_DECAY_PER_SECOND - stage * 0.02)
    };
}

function generateStage(stageNumber) {
    const params = getDifficultyParams(stageNumber);
    const isRest = stageNumber > 1 && stageNumber % 10 === 0;
    const isChallenge = stageNumber % 15 === 0;

    if (isRest) {
        params.creatureCount = Math.max(2, params.creatureCount - 1);
        params.silenceZoneRadius = Math.min(80, params.silenceZoneRadius + 20);
    }
    let loudCount = params.loudCreatureCount;
    if (isChallenge) loudCount = Math.min(loudCount + 1, params.creatureCount);

    const baseSeed = stageNumber * 7919 + (Date.now() % 100000);
    let creatures = [];
    let silenceZones = [];
    let attempts = 0;

    while (attempts < 10) {
        const rng = seededRandom(baseSeed + attempts);
        creatures = [];
        silenceZones = [];

        const margin = 30;
        const playW = GAME_WIDTH - margin * 2;
        const playH = PLAY_AREA_HEIGHT - margin * 2;
        const centerX = GAME_WIDTH / 2;
        const centerY = PLAY_AREA_TOP + PLAY_AREA_HEIGHT / 2;

        // Place creatures
        for (let i = 0; i < params.creatureCount; i++) {
            let placed = false;
            for (let t = 0; t < 50; t++) {
                const x = margin + rng() * playW;
                const y = PLAY_AREA_TOP + margin + rng() * playH;
                // No overlap with center spawn area
                if (Math.abs(x - centerX) < 50 && Math.abs(y - centerY) < 50) continue;
                // No overlap with other creatures
                let tooClose = false;
                for (const c of creatures) {
                    if (Phaser.Math.Distance.Between(x, y, c.x, c.y) < 60) { tooClose = true; break; }
                }
                if (tooClose) continue;
                creatures.push({ x, y, isLoud: i < loudCount });
                placed = true;
                break;
            }
            if (!placed) {
                const x = margin + rng() * playW;
                const y = PLAY_AREA_TOP + margin + rng() * playH;
                creatures.push({ x, y, isLoud: i < loudCount });
            }
        }

        // Place silence zones in areas with lowest creature density
        for (let i = 0; i < params.silenceZoneCount; i++) {
            let bestX = margin + rng() * playW;
            let bestY = PLAY_AREA_TOP + margin + rng() * playH;
            let bestDist = 0;
            for (let t = 0; t < 20; t++) {
                const cx = margin + rng() * playW;
                const cy = PLAY_AREA_TOP + margin + rng() * playH;
                let minDist = Infinity;
                for (const c of creatures) {
                    const d = Phaser.Math.Distance.Between(cx, cy, c.x, c.y);
                    if (d < minDist) minDist = d;
                }
                if (minDist > bestDist) {
                    bestDist = minDist;
                    bestX = cx;
                    bestY = cy;
                }
            }
            silenceZones.push({
                x: bestX, y: bestY,
                radius: params.silenceZoneRadius,
                radiusSq: params.silenceZoneRadius * params.silenceZoneRadius,
                visible: true
            });
        }

        // Validate at least one silence zone is reachable from center
        let reachable = false;
        for (const sz of silenceZones) {
            let blocked = false;
            for (const c of creatures) {
                const dist = Phaser.Math.Distance.Between(centerX, centerY, c.x, c.y);
                if (dist < 40) { blocked = true; break; }
            }
            if (!blocked) { reachable = true; break; }
        }
        if (reachable || attempts >= 9) break;
        attempts++;
    }

    return { creatures, silenceZones, params };
}

function getCreatureShiftPositions(stageNumber, shiftIndex, currentCreatures) {
    const rng = seededRandom(stageNumber * 7919 + shiftIndex * 3571 + Date.now() % 10000);
    const margin = 30;
    const playW = GAME_WIDTH - margin * 2;
    const playH = PLAY_AREA_HEIGHT - margin * 2;
    const newPositions = [];

    for (let i = 0; i < currentCreatures.length; i++) {
        let x, y, valid;
        for (let t = 0; t < 30; t++) {
            x = margin + rng() * playW;
            y = PLAY_AREA_TOP + margin + rng() * playH;
            valid = true;
            for (const p of newPositions) {
                if (Phaser.Math.Distance.Between(x, y, p.x, p.y) < 60) { valid = false; break; }
            }
            if (valid) break;
        }
        newPositions.push({ x, y });
    }
    return newPositions;
}
