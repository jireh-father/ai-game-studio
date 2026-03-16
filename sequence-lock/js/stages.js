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
            modifierCount: 0, modifiers: [], isRest: true, isChallenge: false
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

    return {
        stageNumber, gridSize, tileCount, timeBudget,
        drainRate: dp.drainRate, refill: dp.refill,
        wrongPenalty: dp.wrongPenalty, colorCount: dp.colorCount,
        powerCount: dp.powerCount, modifierCount: dp.modifierCount,
        modifiers, isRest, isChallenge
    };
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
    const { gridSize, tileCount, colorCount, powerCount, modifiers } = params;

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
        tiles.push({
            id: i,
            number: shuffled[i],
            colorCategory: colorAssignments[i],
            isPowerTile: false,
            powerType: null,
            isFaceDown: false,
            isDecoy: false,
            gridRow: row,
            gridCol: col,
            x: layout.startX + col * (layout.tileSize + layout.gap),
            y: layout.startY + row * (layout.tileSize + layout.gap),
            tileSize: layout.tileSize,
            isTapped: false
        });
    }

    // Place power tiles (not on first 2 sequential positions)
    if (powerCount > 0) {
        const safePositions = tiles.filter(t => t.number > 2);
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
        const ghostCandidates = shuffleSeeded(tiles.filter(t => !t.isPowerTile).map(t => t.id), seed + 2222);
        for (let i = 0; i < Math.min(ghostCount, ghostCandidates.length); i++) {
            tiles[ghostCandidates[i]].isFaceDown = true;
        }
    }

    // Apply DECOY modifier
    if (modifiers.includes('DECOY')) {
        const decoyCandidates = shuffleSeeded(tiles.filter(t => !t.isPowerTile && !t.isFaceDown).map(t => t.id), seed + 3333);
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

    return { tiles, params, layout };
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
