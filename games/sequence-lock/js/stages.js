// stages.js - Stage generation, difficulty scaling, grid layout

function seededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function() {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function shuffleSeeded(array, seed) {
    const rng = seededRandom(seed);
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getStageParams(stageNumber) {
    const isRest = stageNumber > 0 && stageNumber % 5 === 0 && stageNumber % 10 !== 0;
    const isChallenge = stageNumber > 0 && stageNumber % 10 === 0;

    if (isRest) {
        return {
            stageNumber, gridSize: 3, tileCount: 9,
            timeBudget: 12000, drainRate: 1000, refill: 600,
            wrongPenalty: 1500, colorCount: 1, powerCount: 0,
            modifierCount: 0, modifiers: [], isRest: true, isChallenge: false,
            rule: 'NORMAL', gapCount: 0
        };
    }

    const dp = getDifficultyParams(stageNumber);
    let gridSize = dp.gridSize;
    let timeBudget = dp.timeBudget;

    if (isChallenge) {
        gridSize = 5;
        timeBudget = dp.timeBudget + 2000;
    }

    const tileCount = gridSize * gridSize;
    const modifiers = selectModifiers(stageNumber, dp.modifierCount);

    const rule = getStageRule(stageNumber);
    const gapCount = rule.includes('GAPS') ? Math.min(Math.floor(stageNumber / 8), Math.floor(tileCount * 0.3)) : 0;

    return {
        stageNumber, gridSize, tileCount, timeBudget,
        drainRate: dp.drainRate, refill: dp.refill,
        wrongPenalty: dp.wrongPenalty, colorCount: dp.colorCount,
        powerCount: dp.powerCount, modifierCount: dp.modifierCount,
        modifiers, isRest, isChallenge, rule, gapCount
    };
}

function getStageRule(stageNumber) {
    // Rest stages are always NORMAL
    if (stageNumber % 5 === 0 && stageNumber % 10 !== 0) return 'NORMAL';

    // Challenge stages rotate through rules
    if (stageNumber % 10 === 0) {
        const challengeRules = ['NORMAL', 'REVERSE', 'ODD_ONLY', 'GAPS', 'REVERSE_GAPS'];
        return challengeRules[(Math.floor(stageNumber / 10) - 1) % challengeRules.length];
    }

    // Fixed introduction stages
    if (stageNumber < 8) return 'NORMAL';
    if (stageNumber <= 9) return 'REVERSE';
    if (stageNumber === 11) return 'NORMAL';
    if (stageNumber <= 13) return 'GAPS';
    if (stageNumber === 14) return 'NORMAL';
    if (stageNumber <= 17) return stageNumber <= 16 ? 'ODD_ONLY' : 'NORMAL';
    if (stageNumber <= 19) return 'EVEN_ONLY';

    // After stage 20: weighted random based on unlocked rules
    const rng = seededRandom(stageNumber * 5381 + Date.now() % 100000);
    const available = STAGE_RULES.filter(r => stageNumber >= RULE_INTRO_STAGES[r]);
    const weights = available.map(r => r === 'NORMAL' ? 0.5 : 1.0);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let roll = rng() * totalWeight;
    for (let i = 0; i < available.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return available[i];
    }
    return available[available.length - 1];
}

function buildExpectedSequence(rule, tileCount, gapCount, rng) {
    const allNumbers = [];
    for (let i = 1; i <= tileCount; i++) allNumbers.push(i);

    // Filter by odd/even
    let activeNumbers = allNumbers;
    if (rule === 'ODD_ONLY' || rule === 'ODD_REVERSE') {
        activeNumbers = allNumbers.filter(n => n % 2 === 1);
    } else if (rule === 'EVEN_ONLY' || rule === 'EVEN_GAPS') {
        activeNumbers = allNumbers.filter(n => n % 2 === 0);
    }

    // Remove gaps
    let displayNumbers = activeNumbers.slice();
    if (rule.includes('GAPS') && gapCount > 0) {
        const removable = displayNumbers.slice(1, -1);
        const shuffledRemovable = shuffleSeeded(removable, Math.floor(rng() * 99999));
        const toRemove = new Set(shuffledRemovable.slice(0, Math.min(gapCount, removable.length)));
        displayNumbers = displayNumbers.filter(n => !toRemove.has(n));
    }

    // Build expected tap sequence
    let expectedSequence;
    if (rule.includes('REVERSE')) {
        expectedSequence = displayNumbers.slice().reverse();
    } else {
        expectedSequence = displayNumbers.slice();
    }

    // Inactive numbers: all numbers in the grid that are NOT in display set
    const inactiveNumbers = allNumbers.filter(n => !activeNumbers.includes(n));
    // Gap numbers: active numbers that were removed by gaps
    const gapNumbers = activeNumbers.filter(n => !displayNumbers.includes(n));

    return { displayNumbers, expectedSequence, inactiveNumbers, gapNumbers };
}

function selectModifiers(stageNumber, count) {
    if (count <= 0 || stageNumber < 13) return [];
    const rng = seededRandom(stageNumber * 3571);
    const available = [];
    if (stageNumber >= 13) available.push('MIRROR');
    if (stageNumber >= 19) available.push('ROTATION');
    if (stageNumber >= 22) available.push('DECOY');
    if (stageNumber >= 25) available.push('GHOST');
    if (stageNumber >= 26) available.push('DRIFT');

    const shuffled = shuffleSeeded(available, stageNumber * 4391);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

function assignColors(tiles, colorCount, rng) {
    const perColor = Math.max(2, Math.floor(tiles.length / colorCount));
    let colorAssignments = [];
    for (let c = 0; c < colorCount; c++) {
        const count = (c === colorCount - 1) ? tiles.length - colorAssignments.length : perColor;
        for (let i = 0; i < count; i++) {
            colorAssignments.push(c);
        }
    }
    // Shuffle color assignments
    for (let i = colorAssignments.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [colorAssignments[i], colorAssignments[j]] = [colorAssignments[j], colorAssignments[i]];
    }
    return colorAssignments;
}

function selectPowerType(rng) {
    const r = rng();
    if (r < POWER_WEIGHTS[0]) return 'bomb';
    if (r < POWER_WEIGHTS[0] + POWER_WEIGHTS[1]) return 'freeze';
    return 'reveal';
}

function generateGrid(stageNumber) {
    const params = getStageParams(stageNumber);
    const seed = stageNumber * 7919;
    const rng = seededRandom(seed);
    const { gridSize, tileCount, colorCount, powerCount, modifiers, rule, gapCount } = params;

    // Build expected sequence based on rule
    const seqData = buildExpectedSequence(rule, tileCount, gapCount, rng);

    // Create number sequence and shuffle
    const numbers = [];
    for (let i = 1; i <= tileCount; i++) numbers.push(i);
    const shuffled = shuffleSeeded(numbers, seed);

    // Assign colors
    const colorAssignments = assignColors(shuffled, colorCount, rng);

    // Grid layout
    const layout = getGridLayout(gridSize);

    // Build tiles
    const tiles = [];
    for (let i = 0; i < tileCount; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const num = shuffled[i];
        tiles.push({
            id: i,
            number: num,
            colorCategory: colorAssignments[i],
            isPowerTile: false,
            powerType: null,
            isFaceDown: false,
            isDecoy: false,
            isInactive: seqData.inactiveNumbers.includes(num),
            isGap: seqData.gapNumbers.includes(num),
            gridRow: row,
            gridCol: col,
            x: layout.startX + col * (layout.tileSize + layout.gap),
            y: layout.startY + row * (layout.tileSize + layout.gap),
            tileSize: layout.tileSize,
            isTapped: false
        });
    }

    // Place power tiles (not on first 2 sequential positions, not on inactive/gap tiles)
    if (powerCount > 0) {
        const safePositions = tiles.filter(t => t.number > 2 && !t.isInactive && !t.isGap);
        const powerPositions = shuffleSeeded(safePositions.map(t => t.id), seed + 1337).slice(0, powerCount);
        powerPositions.forEach(id => {
            const tile = tiles[id];
            tile.isPowerTile = true;
            tile.powerType = selectPowerType(rng);
            // Power tiles keep their number for sequence but show icon
        });
    }

    // Apply GHOST modifier
    if (modifiers.includes('GHOST')) {
        const ghostCount = Math.max(1, Math.floor(tileCount * 0.2));
        const ghostCandidates = shuffleSeeded(tiles.filter(t => !t.isPowerTile && !t.isInactive && !t.isGap).map(t => t.id), seed + 2222);
        for (let i = 0; i < Math.min(ghostCount, ghostCandidates.length); i++) {
            tiles[ghostCandidates[i]].isFaceDown = true;
        }
    }

    // Apply DECOY modifier
    if (modifiers.includes('DECOY')) {
        const decoyCandidates = shuffleSeeded(tiles.filter(t => !t.isPowerTile && !t.isFaceDown && !t.isInactive && !t.isGap).map(t => t.id), seed + 3333);
        const decoyCount = Math.min(2, decoyCandidates.length);
        for (let i = 0; i < decoyCount; i++) {
            const tile = tiles[decoyCandidates[i]];
            tile.isDecoy = true;
            // Show a plausible wrong number
            tile.decoyNumber = tile.number + (rng() > 0.5 ? 1 : -1);
            if (tile.decoyNumber < 1) tile.decoyNumber = tile.number + 1;
            if (tile.decoyNumber > tileCount) tile.decoyNumber = tile.number - 1;
        }
    }

    return { tiles, params, layout, expectedSequence: seqData.expectedSequence, inactiveNumbers: seqData.inactiveNumbers, gapNumbers: seqData.gapNumbers };
}

function getGridLayout(gridSize) {
    const tileSize = TILE_SIZES[gridSize] || 60;
    const gap = TILE_GAP;
    const gridWidth = gridSize * tileSize + (gridSize - 1) * gap;
    const gridHeight = gridWidth;
    const startX = (CANVAS_WIDTH - gridWidth) / 2;
    const startY = 140 + (300 - gridHeight) / 2; // center in play area below HUD
    return { startX, startY, tileSize, gap, gridWidth, gridHeight };
}
