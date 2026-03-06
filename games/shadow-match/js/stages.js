// Shadow Match - Stage Generation
function seededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function() {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function getDailySeed() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function generateShadow(stageNum, seed) {
    const rng = seededRandom(seed || stageNum * 7919 + 12345);
    const params = getDifficultyParams(stageNum);
    const totalCells = Math.round(params.pieceCount * params.cellsPerPiece);
    const cols = GRID.COLS;
    const rows = GRID.ROWS;

    // Check for rest/boss stage
    if (stageNum > 0 && stageNum % REST_STAGE_INTERVAL === 0 && stageNum % BOSS_STAGE_INTERVAL !== 0) {
        return generateRestStage(stageNum, rng);
    }

    const cells = [];
    const used = {};
    const key = (c, r) => c + ',' + r;
    // Start near center
    const startC = Math.floor(cols / 2) - 1 + Math.floor(rng() * 2);
    const startR = Math.floor(rows / 2) - 1 + Math.floor(rng() * 2);
    cells.push({ col: startC, row: startR });
    used[key(startC, startR)] = true;

    const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
    while (cells.length < totalCells) {
        const idx = Math.floor(rng() * cells.length);
        const base = cells[idx];
        const shuffled = dirs.slice().sort(() => rng() - 0.5);
        let added = false;
        for (const d of shuffled) {
            const nc = base.col + d[0];
            const nr = base.row + d[1];
            if (nc >= 0 && nc < cols && nr >= 0 && nr < rows && !used[key(nc, nr)]) {
                cells.push({ col: nc, row: nr });
                used[key(nc, nr)] = true;
                added = true;
                break;
            }
        }
        if (!added) continue;
    }
    return { cells, params, rng };
}

function generateRestStage(stageNum, rng) {
    // Predefined recognizable shapes
    const shapes = [
        // Heart
        [[2,0],[5,0],[1,1],[3,1],[4,1],[6,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[2,4],[3,4],[4,4],[5,4],[3,5],[4,5]],
        // Star (simple)
        [[3,0],[4,0],[2,1],[3,1],[4,1],[5,1],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[2,3],[3,3],[4,3],[5,3],[3,4],[4,4]],
        // Arrow
        [[3,0],[4,0],[2,1],[3,1],[4,1],[5,1],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[3,3],[4,3],[3,4],[4,4],[3,5],[4,5]],
        // Diamond
        [[3,0],[4,0],[2,1],[3,1],[4,1],[5,1],[1,2],[2,2],[5,2],[6,2],[2,3],[3,3],[4,3],[5,3],[3,4],[4,4]]
    ];
    const idx = stageNum / REST_STAGE_INTERVAL - 1;
    const shape = shapes[idx % shapes.length];
    const cells = shape.map(s => ({ col: s[0], row: s[1] }));
    const params = getDifficultyParams(stageNum);
    params.driftSpeed *= 0.7; // 30% slower for rest stages
    params.pieceCount = Math.min(Math.ceil(cells.length / 4), 7);
    return { cells, params, rng, isRest: true };
}

function decomposeShadow(cells, pieceCount, rng) {
    if (cells.length <= 0 || pieceCount <= 0) return [];
    const pieces = [];
    const remaining = cells.slice();
    const key = (c, r) => c + ',' + r;
    const targetSize = Math.max(3, Math.floor(remaining.length / pieceCount));

    for (let p = 0; p < pieceCount; p++) {
        if (remaining.length === 0) break;
        const isLast = (p === pieceCount - 1);
        const size = isLast ? remaining.length : Math.min(targetSize, remaining.length);

        // BFS from a random starting cell
        const startIdx = Math.floor(rng() * remaining.length);
        const piece = [remaining[startIdx]];
        const usedIdx = new Set([startIdx]);

        while (piece.length < size) {
            let found = false;
            // Try to extend from existing piece cells
            const shuffledPiece = piece.slice().sort(() => rng() - 0.5);
            for (const cell of shuffledPiece) {
                const dirs = [[0,-1],[0,1],[-1,0],[1,0]].sort(() => rng() - 0.5);
                for (const d of dirs) {
                    const nc = cell.col + d[0];
                    const nr = cell.row + d[1];
                    const ri = remaining.findIndex((c, i) => !usedIdx.has(i) && c.col === nc && c.row === nr);
                    if (ri !== -1) {
                        piece.push(remaining[ri]);
                        usedIdx.add(ri);
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            if (!found) break;
        }

        // Normalize piece cells to start from (0,0)
        const minC = Math.min(...piece.map(c => c.col));
        const minR = Math.min(...piece.map(c => c.row));
        const normalized = piece.map(c => [c.col - minC, c.row - minR]);

        pieces.push({ cells: normalized, originalCells: piece.slice() });
        // Remove used cells from remaining
        const sortedIdx = Array.from(usedIdx).sort((a, b) => b - a);
        for (const i of sortedIdx) remaining.splice(i, 1);
    }

    return pieces;
}

function rotateCells(cells) {
    // Rotate 90 degrees CW: (x, y) -> (-y, x), then normalize
    const rotated = cells.map(c => [-c[1], c[0]]);
    const minX = Math.min(...rotated.map(c => c[0]));
    const minY = Math.min(...rotated.map(c => c[1]));
    return rotated.map(c => [c[0] - minX, c[1] - minY]);
}

function generateDistractors(shadowCells, count, rng) {
    const distractors = [];
    const shadowSet = new Set(shadowCells.map(c => c.col + ',' + c.row));

    for (let i = 0; i < count; i++) {
        const size = 3 + Math.floor(rng() * 2);
        // Pick a random piece def and rotate it randomly
        const defIdx = Math.floor(rng() * Math.min(9, PIECE_DEFS.length));
        let cells = PIECE_DEFS[defIdx].map(c => [c[0], c[1]]);
        const rotations = Math.floor(rng() * 4);
        for (let r = 0; r < rotations; r++) cells = rotateCells(cells);
        // Trim to desired size
        cells = cells.slice(0, size);
        distractors.push({ cells, isDistractor: true });
    }
    return distractors;
}

function generateStageData(stageNum) {
    const result = generateShadow(stageNum);
    const { cells, params, rng, isRest } = result;
    const pieces = decomposeShadow(cells, params.pieceCount, rng);

    // Apply random rotation to each piece
    pieces.forEach(p => {
        const rotCount = Math.floor(rng() * 4);
        for (let r = 0; r < rotCount; r++) {
            p.cells = rotateCells(p.cells);
        }
        p.rotation = 0;
    });

    // Generate distractors
    const distractors = generateDistractors(cells, params.distractorCount, rng);

    // Combine and shuffle
    const allPieces = [...pieces, ...distractors];
    // Shuffle
    for (let i = allPieces.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [allPieces[i], allPieces[j]] = [allPieces[j], allPieces[i]];
    }

    // Determine shape_id for collection
    pieces.forEach(p => {
        p.shapeId = findMatchingShapeId(p.cells);
    });

    return {
        shadowCells: cells,
        pieces: allPieces,
        solutionPieces: pieces,
        driftSpeed: params.driftSpeed,
        isRest: isRest || false,
        isBoss: stageNum > 0 && stageNum % BOSS_STAGE_INTERVAL === 0
    };
}

function findMatchingShapeId(cells) {
    const normalized = normalizeCells(cells);
    for (let i = 0; i < PIECE_DEFS.length; i++) {
        let def = PIECE_DEFS[i].map(c => [c[0], c[1]]);
        for (let r = 0; r < 4; r++) {
            if (cellsMatch(normalizeCells(def), normalized)) return i;
            def = rotateCells(def);
        }
    }
    return -1;
}

function normalizeCells(cells) {
    const minX = Math.min(...cells.map(c => c[0]));
    const minY = Math.min(...cells.map(c => c[1]));
    const n = cells.map(c => [c[0] - minX, c[1] - minY]);
    n.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    return n;
}

function cellsMatch(a, b) {
    if (a.length !== b.length) return false;
    return a.every((c, i) => c[0] === b[i][0] && c[1] === b[i][1]);
}
