// Voltage Rush - Stage Generation
function generateStage(stageNum) {
    var rest = isRestStage(stageNum);
    var boss = isBossStage(stageNum);

    var nodeCount, insulatedCount, rapidCount, chargeRate, timer;

    if (rest) {
        nodeCount = 4;
        insulatedCount = 0;
        rapidCount = 0;
        chargeRate = getChargeRate(stageNum) * DIFFICULTY.restStageChargeMult;
        timer = getStageTimer(stageNum) + DIFFICULTY.restStageTimerBonus;
    } else if (boss) {
        nodeCount = 12;
        insulatedCount = 3;
        rapidCount = 2;
        chargeRate = getChargeRate(stageNum) * DIFFICULTY.bossChargeRateMult;
        timer = getStageTimer(stageNum) - DIFFICULTY.bossTimerReduction;
    } else {
        nodeCount = getNodeCount(stageNum);
        insulatedCount = getInsulatedCount(stageNum);
        rapidCount = getRapidCount(stageNum);
        chargeRate = getChargeRate(stageNum);
        timer = getStageTimer(stageNum);
    }

    timer = Math.max(6, timer);
    var seed = stageNum * 7919 + (Date.now() % 100000);
    var nodes = placeNodes(nodeCount, seed);

    assignSpecialNodes(nodes, insulatedCount, rapidCount, seed);
    validateIsolation(nodes);
    computeArcTargets(nodes);

    return {
        nodes: nodes,
        timer: timer,
        chargeRate: chargeRate,
        stageNum: stageNum,
        isRest: rest,
        isBoss: boss
    };
}

function seededRandom(seed) {
    var s = seed;
    return function() {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function placeNodes(count, seed) {
    var rng = seededRandom(seed);
    var nodes = [];
    var gameAreaTop = HUD_HEIGHT + 30;
    var gameAreaBottom = GAME_HEIGHT - 60;
    var gameAreaLeft = 40;
    var gameAreaRight = GAME_WIDTH - 40;
    var areaW = gameAreaRight - gameAreaLeft;
    var areaH = gameAreaBottom - gameAreaTop;

    var cols = Math.ceil(Math.sqrt(count * (areaW / areaH)));
    var rows = Math.ceil(count / cols);
    cols = Math.max(2, cols);
    rows = Math.max(2, rows);

    var cellW = areaW / cols;
    var cellH = areaH / rows;
    var positions = [];

    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            var cx = gameAreaLeft + cellW * (c + 0.5);
            var cy = gameAreaTop + cellH * (r + 0.5);
            var ox = (rng() - 0.5) * cellW * 0.3;
            var oy = (rng() - 0.5) * cellH * 0.3;
            positions.push({ x: Math.round(cx + ox), y: Math.round(cy + oy) });
        }
    }

    positions.sort(function() { return rng() - 0.5; });
    for (var i = 0; i < count && i < positions.length; i++) {
        nodes.push({
            x: positions[i].x,
            y: positions[i].y,
            type: 'normal',
            fill: 0,
            arcTarget: -1,
            tappedAt: 0
        });
    }

    while (nodes.length < count) {
        var nx = gameAreaLeft + rng() * areaW;
        var ny = gameAreaTop + rng() * areaH;
        nodes.push({ x: Math.round(nx), y: Math.round(ny), type: 'normal', fill: 0, arcTarget: -1, tappedAt: 0 });
    }

    return nodes;
}

function assignSpecialNodes(nodes, insulatedCount, rapidCount, seed) {
    var rng = seededRandom(seed + 31337);
    var indices = [];
    for (var i = 0; i < nodes.length; i++) indices.push(i);
    indices.sort(function() { return rng() - 0.5; });

    var assigned = 0;
    for (var i = 0; i < indices.length && assigned < insulatedCount; i++) {
        nodes[indices[i]].type = 'insulated';
        assigned++;
    }

    var remaining = [];
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].type !== 'insulated') remaining.push(i);
    }
    remaining.sort(function() { return rng() - 0.5; });
    for (var i = 0; i < remaining.length && i < rapidCount; i++) {
        nodes[remaining[i]].type = 'rapid';
    }
}

function validateIsolation(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].type === 'insulated') continue;
        var hasNeighbor = false;
        for (var j = 0; j < nodes.length; j++) {
            if (i === j || nodes[j].type === 'insulated') continue;
            var dx = nodes[i].x - nodes[j].x;
            var dy = nodes[i].y - nodes[j].y;
            if (Math.sqrt(dx*dx + dy*dy) <= DIFFICULTY.isolationCheckDist) {
                hasNeighbor = true;
                break;
            }
        }
        if (!hasNeighbor) {
            nodes[i].type = 'normal';
            for (var k = 0; k < nodes.length; k++) {
                if (k !== i && nodes[k].type === 'insulated') {
                    nodes[k].type = 'normal';
                    break;
                }
            }
        }
    }
}

function computeArcTargets(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].type === 'insulated') {
            nodes[i].arcTarget = -1;
            continue;
        }
        var bestDist = Infinity;
        var bestIdx = -1;
        for (var j = 0; j < nodes.length; j++) {
            if (i === j || nodes[j].type === 'insulated') continue;
            var dx = nodes[i].x - nodes[j].x;
            var dy = nodes[i].y - nodes[j].y;
            var d = Math.sqrt(dx*dx + dy*dy);
            if (d < bestDist) {
                bestDist = d;
                bestIdx = j;
            }
        }
        nodes[i].arcTarget = bestIdx;
    }
}
