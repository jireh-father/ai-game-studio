// stages.js - Stage generation, curve params, target placement

function generateStage(stageNum) {
    const isRest = isRestStage(stageNum);
    const isBoss = isBossStage(stageNum);
    const speed = getSpeed(stageNum);
    const curve = getCurveParams(stageNum, isRest);
    const target = getTargetParams(stageNum, isRest);
    const dir = (stageNum % 2 === 0) ? 1 : -1; // alternate L/R
    const windDrift = stageNum > 35 ? (Math.random() * 30 - 15) : 0;
    const isSCurve = stageNum > 20 && stageNum % 4 === 0 && !isRest;
    const isMoving = stageNum > 20 && stageNum % 5 === 0 && !isRest;

    return {
        stageNum,
        speed,
        curveAngle: curve.angle,
        curveRadius: curve.radius,
        curveDirection: dir,
        targetDistance: target.distance,
        targetRadius: target.radius,
        windDrift,
        isSCurve,
        isMovingTarget: isMoving,
        isBoss,
        isRest,
        // Max hold time for this curve (ms)
        maxDriftTime: Math.max(DRIFT_WINDOW_MIN_MS, (curve.angle / 90) * 1200 / (speed / BASE_SPEED))
    };
}

function getSpeed(stageNum) {
    return Math.min(BASE_SPEED * 2.5, BASE_SPEED * (1 + stageNum * 0.05));
}

function getCurveParams(stageNum, isRest) {
    let angle = Math.min(150, 60 + stageNum * 2);
    let radius = Math.max(80, 200 - stageNum * 3);
    if (isRest) {
        radius += 40;
        angle = Math.max(60, angle - 20);
    }
    if (stageNum > 50) {
        angle = 80 + Math.random() * 70;
        radius = 80;
    }
    return { angle, radius };
}

function getTargetParams(stageNum, isRest) {
    let distance = Math.min(320, 120 + stageNum * 4);
    let radius = Math.max(18, 40 - stageNum * 0.5);
    if (isRest) {
        radius += 10;
        distance = Math.max(120, distance - 40);
    }
    if (stageNum > 50) {
        distance = 150 + Math.random() * 170;
        radius = 18;
    }
    return { distance, radius };
}

function isRestStage(stageNum) {
    return stageNum > 1 && stageNum % 8 === 0;
}

function isBossStage(stageNum) {
    return stageNum > 1 && stageNum % 10 === 0;
}

// Generate curve path points for rendering
function generateCurvePoints(cx, cy, radius, startAngle, sweepAngle, segments) {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const a = Phaser.Math.DegToRad(startAngle + sweepAngle * t);
        pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
    }
    return pts;
}

// Generate road polygon from curve center
function generateRoadGeometry(stage) {
    const roadWidth = 50;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 + 40;
    const r = stage.curveRadius;
    const dir = stage.curveDirection;
    const sweepDeg = stage.curveAngle;

    // Start angle based on direction
    const startAngle = dir > 0 ? 180 : 0;
    const innerR = r - roadWidth / 2;
    const outerR = r + roadWidth / 2;

    const inner = generateCurvePoints(cx + dir * r, cy, innerR, startAngle, -dir * sweepDeg, 20);
    const outer = generateCurvePoints(cx + dir * r, cy, outerR, startAngle, -dir * sweepDeg, 20);

    // Approach straight road (bottom)
    const approachLen = 120;
    const approachStart = { x: cx - roadWidth / 2, y: GAME_HEIGHT + 20 };
    const approachEnd = { x: cx + roadWidth / 2, y: GAME_HEIGHT + 20 };

    return { inner, outer, cx: cx + dir * r, cy, innerR, outerR, startAngle, sweepDeg: -dir * sweepDeg, roadWidth, approachLen };
}
