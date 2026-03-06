// ============================================================
// stages.js - Stage generation, difficulty, mutation scheduling
// ============================================================

function seededRandom(seed) {
    let s = seed | 0;
    return function() {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffleMutations(runSeed) {
    const pool = [
        MUTATION_TYPES.DIAGONAL,
        MUTATION_TYPES.JUMPER,
        MUTATION_TYPES.SPLITTER,
        MUTATION_TYPES.ACCELERATOR,
        MUTATION_TYPES.DORMANT,
    ];
    const rng = seededRandom(runSeed + 777);
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
}

function getStageParams(stageNumber) {
    for (let i = 0; i < DIFFICULTY.length; i++) {
        const d = DIFFICULTY[i];
        if (stageNumber >= d.min && stageNumber <= d.max) {
            return { ...d, surplusIdx: i };
        }
    }
    return { ...DIFFICULTY[DIFFICULTY.length - 1], surplusIdx: DIFFICULTY.length - 1 };
}

function getMutationsForStage(stageNumber, mutationOrder) {
    const params = getStageParams(stageNumber);
    const count = Math.min(params.mutations, mutationOrder.length);
    return mutationOrder.slice(0, count);
}

function placeInfections(gridSize, count, seed) {
    const rng = seededRandom(seed);
    const minEdgeDist = 2;
    const sources = [];
    let attempts = 0;
    while (sources.length < count && attempts < 200) {
        attempts++;
        const row = minEdgeDist + Math.floor(rng() * (gridSize - 2 * minEdgeDist));
        const col = minEdgeDist + Math.floor(rng() * (gridSize - 2 * minEdgeDist));
        let tooClose = false;
        for (const s of sources) {
            if (Math.abs(s.row - row) + Math.abs(s.col - col) < 3) {
                tooClose = true;
                break;
            }
        }
        if (!tooClose) {
            sources.push({ row, col });
        }
    }
    // Fallback: if couldn't place enough, relax constraints
    if (sources.length < count) {
        const rng2 = seededRandom(seed + 999);
        while (sources.length < count) {
            const row = 1 + Math.floor(rng2() * (gridSize - 2));
            const col = 1 + Math.floor(rng2() * (gridSize - 2));
            let exists = sources.some(s => s.row === row && s.col === col);
            if (!exists) sources.push({ row, col });
        }
    }
    return sources;
}

function calculateMinWalls(gridSize, infections) {
    // Simple heuristic: each infection needs ~4 walls to surround if isolated
    // BFS-based approximation: flood fill from infections, count edge-facing cells
    let minWalls = 0;
    for (const inf of infections) {
        // Estimate: distance to nearest edge * 2 gives rough wall count
        const distTop = inf.row;
        const distBot = gridSize - 1 - inf.row;
        const distLeft = inf.col;
        const distRight = gridSize - 1 - inf.col;
        const minDist = Math.min(distTop, distBot, distLeft, distRight);
        // Need walls around the infection; more walls for center infections
        minWalls += Math.max(4, minDist * 2);
    }
    // Clamp to reasonable range
    return Math.max(infections.length * 4, Math.min(minWalls, gridSize * gridSize - infections.length));
}

function generateStage(stageNumber, runSeed) {
    const params = getStageParams(stageNumber);
    const isRest = stageNumber % 5 === 0 && stageNumber > 0;
    const stageSeed = runSeed + stageNumber * 7919;
    const rng = seededRandom(stageSeed);

    let gridSize = params.grid;
    let spreadInterval = params.spread;
    let infectCount;

    if (isRest) {
        infectCount = 1;
        spreadInterval = params.spread + 300;
    } else {
        infectCount = params.infectMin + Math.floor(rng() * (params.infectMax - params.infectMin + 1));
    }

    const infectionSources = placeInfections(gridSize, infectCount, stageSeed);
    const mutationOrder = shuffleMutations(runSeed);
    const activeMutations = getMutationsForStage(stageNumber, mutationOrder);

    // Assign mutations to infection sources
    const sourceData = infectionSources.map((src, i) => {
        let mutation = MUTATION_TYPES.BASIC;
        if (activeMutations.length > 0 && i > 0) {
            mutation = activeMutations[(i - 1) % activeMutations.length];
        }
        return { ...src, mutation };
    });

    const minWalls = calculateMinWalls(gridSize, infectionSources);
    const surplus = isRest ? WALL_SURPLUS[params.surplusIdx] + 4 : WALL_SURPLUS[params.surplusIdx];
    const wallSupply = Math.max(minWalls + surplus, params.walls + (isRest ? 4 : 0));

    return {
        gridSize,
        infectionSources: sourceData,
        wallSupply,
        spreadInterval,
        mutations: activeMutations,
        isRest,
        minWalls,
        stageNumber,
    };
}
