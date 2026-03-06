// stages.js - Rule generation, grid shuffling, difficulty scaling

function generateGrid() {
    const grid = [];
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            grid.push({
                color: TILE_COLORS[Math.floor(Math.random() * 4)],
                shape: SHAPES[Math.floor(Math.random() * 4)],
                row: row,
                col: col,
                index: row * 4 + col,
                neighbors: [] // populated after grid built
            });
        }
    }
    // Populate neighbors (orthogonal)
    populateNeighbors(grid);
    return grid;
}

function populateNeighbors(grid) {
    grid.forEach(tile => {
        tile.neighbors = [];
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        dirs.forEach(([dr, dc]) => {
            const nr = tile.row + dr, nc = tile.col + dc;
            if (nr >= 0 && nr < 4 && nc >= 0 && nc < 4) {
                tile.neighbors.push(grid[nr * 4 + nc]);
            }
        });
    });
}

function countValid(grid, checkFn) {
    return grid.filter(t => checkFn(t)).length;
}

function generateColorRule() {
    const c = TILE_COLORS[Math.floor(Math.random() * 4)];
    return { text: `Only ${c.toUpperCase()} tiles`, check: t => t.color === c, hintText: `It's about COLOR`, category: 'color', props: { color: c } };
}

function generateShapeRule() {
    const s = SHAPES[Math.floor(Math.random() * 4)];
    const names = { circle: 'CIRCLES', triangle: 'TRIANGLES', square: 'SQUARES', diamond: 'DIAMONDS' };
    return { text: `Only ${names[s]}`, check: t => t.shape === s, hintText: `It's about SHAPE`, category: 'shape', props: { shape: s } };
}

function generatePositionRule() {
    const posRules = [
        { text: 'Only TOP ROW', check: t => t.row === 0, hint: 'It\'s about POSITION (row)' },
        { text: 'Only BOTTOM ROW', check: t => t.row === 3, hint: 'It\'s about POSITION (row)' },
        { text: 'Only LEFT COLUMN', check: t => t.col === 0, hint: 'It\'s about POSITION (column)' },
        { text: 'Only RIGHT COLUMN', check: t => t.col === 3, hint: 'It\'s about POSITION (column)' },
        { text: 'Only CORNERS', check: t => (t.row === 0 || t.row === 3) && (t.col === 0 || t.col === 3), hint: 'It\'s about POSITION (corners)' },
        { text: 'Only CENTER 4', check: t => (t.row === 1 || t.row === 2) && (t.col === 1 || t.col === 2), hint: 'It\'s about POSITION (center)' },
        { text: 'Only EDGES (not corners)', check: t => (t.row === 0 || t.row === 3 || t.col === 0 || t.col === 3) && !((t.row === 0 || t.row === 3) && (t.col === 0 || t.col === 3)), hint: 'It\'s about POSITION (edges)' },
    ];
    const r = posRules[Math.floor(Math.random() * posRules.length)];
    return { text: r.text, check: r.check, hintText: r.hint, category: 'position', props: {} };
}

function generateNeighborRule(grid) {
    const type = Math.random() < 0.5 ? 'color' : 'shape';
    if (type === 'color') {
        const c = TILE_COLORS[Math.floor(Math.random() * 4)];
        return { text: `Adjacent to ${c.toUpperCase()}`, check: t => t.neighbors.some(n => n.color === c), hintText: `It's about NEIGHBORS (color)`, category: 'neighbor', props: { neighborColor: c } };
    } else {
        const s = SHAPES[Math.floor(Math.random() * 4)];
        const names = { circle: 'CIRCLE', triangle: 'TRIANGLE', square: 'SQUARE', diamond: 'DIAMOND' };
        return { text: `Adjacent to ${names[s]}`, check: t => t.neighbors.some(n => n.shape === s), hintText: `It's about NEIGHBORS (shape)`, category: 'neighbor', props: { neighborShape: s } };
    }
}

function generateCompoundAndRule() {
    const c = TILE_COLORS[Math.floor(Math.random() * 4)];
    const s = SHAPES[Math.floor(Math.random() * 4)];
    const names = { circle: 'CIRCLE', triangle: 'TRIANGLE', square: 'SQUARE', diamond: 'DIAMOND' };
    return { text: `${c.toUpperCase()} and ${names[s]}`, check: t => t.color === c && t.shape === s, hintText: `Two properties combined (AND)`, category: 'compound_and', props: { color: c, shape: s } };
}

function generateCompoundOrRule() {
    const c = TILE_COLORS[Math.floor(Math.random() * 4)];
    const s = SHAPES[Math.floor(Math.random() * 4)];
    const names = { circle: 'CIRCLE', triangle: 'TRIANGLE', square: 'SQUARE', diamond: 'DIAMOND' };
    return { text: `${c.toUpperCase()} or ${names[s]}`, check: t => t.color === c || t.shape === s, hintText: `Two properties combined (OR)`, category: 'compound_or', props: { color: c, shape: s } };
}

function generateNegationRule() {
    if (Math.random() < 0.5) {
        const c = TILE_COLORS[Math.floor(Math.random() * 4)];
        return { text: `NOT ${c.toUpperCase()}`, check: t => t.color !== c, hintText: `It's a NEGATION rule (color)`, category: 'negation', props: { notColor: c } };
    } else {
        const s = SHAPES[Math.floor(Math.random() * 4)];
        const names = { circle: 'CIRCLES', triangle: 'TRIANGLES', square: 'SQUARES', diamond: 'DIAMONDS' };
        return { text: `NOT ${names[s]}`, check: t => t.shape !== s, hintText: `It's a NEGATION rule (shape)`, category: 'negation', props: { notShape: s } };
    }
}

function generateComplexRule(grid) {
    const templates = [
        () => { const c = TILE_COLORS[Math.floor(Math.random()*4)]; const s = SHAPES[Math.floor(Math.random()*4)]; const sn = {circle:'CIRCLE',triangle:'TRIANGLE',square:'SQUARE',diamond:'DIAMOND'}; return { text: `${c.toUpperCase()} and NOT ${sn[s]}`, check: t => t.color === c && t.shape !== s, hintText: 'Compound + negation', category: 'complex' }; },
        () => { const c = TILE_COLORS[Math.floor(Math.random()*4)]; return { text: `CORNER and ${c.toUpperCase()}`, check: t => (t.row===0||t.row===3)&&(t.col===0||t.col===3)&&t.color===c, hintText: 'Position + color', category: 'complex' }; },
        () => { const c = TILE_COLORS[Math.floor(Math.random()*4)]; const c2 = TILE_COLORS[Math.floor(Math.random()*4)]; return { text: `NOT ${c.toUpperCase()} and adjacent to ${c2.toUpperCase()}`, check: t => t.color !== c && t.neighbors.some(n => n.color === c2), hintText: 'Negation + neighbor', category: 'complex' }; },
        () => { const s = SHAPES[Math.floor(Math.random()*4)]; const sn = {circle:'CIRCLES',triangle:'TRIANGLES',square:'SQUARES',diamond:'DIAMONDS'}; return { text: `TOP HALF and NOT ${sn[s]}`, check: t => t.row <= 1 && t.shape !== s, hintText: 'Position + negation', category: 'complex' }; },
    ];
    return templates[Math.floor(Math.random() * templates.length)]();
}

let lastRuleCategory = null;

function generateRule(stageNumber, grid) {
    let diff = getDifficultyForStage(stageNumber);
    // Rest stages: one tier easier, +3s timer
    if (isRestStage(stageNumber)) {
        const easier = getDifficultyForStage(Math.max(1, stageNumber - 10));
        diff = { ...easier, timer: diff.timer + 3 };
    }

    let attempts = 0;
    while (attempts < 30) {
        attempts++;
        let rule;
        const cat = diff.category;
        if (cat === 'color') rule = generateColorRule();
        else if (cat === 'shape') rule = generateShapeRule();
        else if (cat === 'position') rule = generatePositionRule();
        else if (cat === 'neighbor') rule = generateNeighborRule(grid);
        else if (cat === 'compound_and') rule = generateCompoundAndRule();
        else if (cat === 'compound_or') rule = generateCompoundOrRule();
        else if (cat === 'negation') rule = generateNegationRule();
        else rule = generateComplexRule(grid);

        // Variety: don't repeat same sub-category text
        if (rule.text === lastRuleCategory && attempts < 20) continue;

        const validCount = countValid(grid, rule.check);
        if (validCount >= 3 && validCount <= 12) {
            lastRuleCategory = rule.text;
            rule.validCount = validCount;
            rule.timerDuration = getTimerDuration(stageNumber);
            if (isRestStage(stageNumber)) rule.timerDuration += 3;
            return rule;
        }
    }
    // Fallback: simple color rule
    const c = TILE_COLORS[Math.floor(Math.random() * 4)];
    const fallback = { text: `Only ${c.toUpperCase()} tiles`, check: t => t.color === c, hintText: 'It\'s about COLOR', category: 'color', timerDuration: getTimerDuration(stageNumber) };
    lastRuleCategory = fallback.text;
    return fallback;
}
