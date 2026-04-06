// stages.js — Stage generation, difficulty scaling, solvability validation

function isRestStage(stageNumber) {
  return stageNumber > 0 && stageNumber % DIFFICULTY.restStageInterval === 0;
}

function getDifficultyParams(stageNumber) {
  var s = stageNumber;
  var rest = isRestStage(s);

  var speed = Math.min(DIFFICULTY.baseSpeed + s * DIFFICULTY.speedPerStage, DIFFICULTY.maxSpeed);
  if (rest) speed *= 0.8;

  var gateCount = Math.min(DIFFICULTY.baseGates + s, DIFFICULTY.maxGates);
  if (rest) gateCount = 6;

  var arcGap = Math.max(DIFFICULTY.baseArcGap - s * DIFFICULTY.arcGapReduction, DIFFICULTY.minArcGap);
  if (rest) arcGap = 90;

  var colorsInUse;
  if (s < 4) colorsInUse = ['RED', 'BLUE'];
  else if (s < 7) colorsInUse = ['RED', 'BLUE', 'GREEN'];
  else colorsInUse = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

  var rotSpeed = 0;
  if (s >= DIFFICULTY.rotationStart && !rest) {
    rotSpeed = Math.min(DIFFICULTY.baseRotation + s * DIFFICULTY.rotationPerStage, DIFFICULTY.maxRotation);
  }

  var gravityFlipCount = 0;
  if (s >= DIFFICULTY.gravityStart && !rest) {
    gravityFlipCount = Math.min(Math.floor((s - DIFFICULTY.gravityStart) / 3), 2);
  }

  var speedZoneCount = 0;
  if (s >= DIFFICULTY.speedZoneStart && !rest) {
    speedZoneCount = Math.min(Math.floor((s - DIFFICULTY.speedZoneStart) / 4) + 1, 2);
  }

  var chaosChance = 0;
  if (s >= DIFFICULTY.chaosStart && !rest) {
    chaosChance = Math.min(0.15 + (s - DIFFICULTY.chaosStart) * 0.01, 0.40);
  }

  return {
    speed: speed,
    gateCount: gateCount,
    arcGap: arcGap,
    colorsInUse: colorsInUse,
    rotationSpeed: rotSpeed,
    gravityFlipCount: gravityFlipCount,
    speedZoneCount: speedZoneCount,
    chaosChance: chaosChance,
    isRest: rest
  };
}

function generateStage(stageNumber) {
  var params = getDifficultyParams(stageNumber);
  var gates = [];
  var entropy = stageNumber * 7919 + Date.now() % 100000;
  var prevColor = null;

  for (var i = 0; i < params.gateCount; i++) {
    // Pick safe color - never same as previous
    var available = params.colorsInUse.slice();
    if (prevColor && available.length > 1) {
      available = available.filter(function(c) { return c !== prevColor; });
    }
    entropy = (entropy * 48271 + 12345) & 0x7FFFFFFF;
    var safeColor = available[entropy % available.length];
    prevColor = safeColor;

    var isChaos = false;
    if (params.chaosChance > 0) {
      entropy = (entropy * 48271 + 12345) & 0x7FFFFFFF;
      isChaos = (entropy % 100) / 100 < params.chaosChance;
    }

    // Build arc segments for this gate
    var arcs = buildGateArcs(safeColor, params.colorsInUse, params.arcGap, entropy + i);

    gates.push({
      index: i,
      y: 0, // will be positioned by game
      safeColor: safeColor,
      rotation: params.rotationSpeed > 0 ? (entropy % 360) : 0,
      rotationSpeed: params.rotationSpeed,
      isChaos: isChaos,
      arcs: arcs,
      arcGap: params.arcGap,
      passed: false
    });
  }

  // Add gravity flip zones
  if (params.gravityFlipCount > 0) {
    var interval = Math.floor(params.gateCount / (params.gravityFlipCount + 1));
    for (var g = 0; g < params.gravityFlipCount; g++) {
      var gateIdx = interval * (g + 1);
      if (gateIdx < gates.length) gates[gateIdx].gravityFlip = true;
    }
  }

  // Add speed zones
  if (params.speedZoneCount > 0) {
    var szInterval = Math.floor(params.gateCount / (params.speedZoneCount + 1));
    for (var sz = 0; sz < params.speedZoneCount; sz++) {
      var szIdx = szInterval * (sz + 1);
      if (szIdx < gates.length && !gates[szIdx].gravityFlip) {
        gates[szIdx].speedZone = true;
      }
    }
  }

  return { gates: gates, params: params };
}

function buildGateArcs(safeColor, colorsInUse, arcGapDeg, seed) {
  // The gate is a ring divided into arcs. One arc is the safe color (gap the ball passes through).
  // Other arcs are death zones filled with other colors or GATE_BODY_COLOR.
  var arcs = [];
  var rng = seed;

  // Safe arc position — must straddle 90° (the angle where ball crosses the gate ring)
  // Add small random jitter (±15°) so arcs aren't identical every time
  rng = (rng * 48271 + 12345) & 0x7FFFFFFF;
  var jitter = (rng % 31) - 15; // -15 to +15 degrees
  var safeStart = 90 - arcGapDeg / 2 + jitter;
  var safeEnd = safeStart + arcGapDeg;

  arcs.push({
    startAngle: safeStart,
    endAngle: safeEnd,
    color: safeColor,
    isSafe: true
  });

  // Fill remaining ring with danger arcs
  var remaining = 360 - arcGapDeg;
  var dangerColors = colorsInUse.filter(function(c) { return c !== safeColor; });
  if (dangerColors.length === 0) dangerColors = [safeColor === 'RED' ? 'BLUE' : 'RED'];

  var numDanger = Math.min(dangerColors.length, 3);
  var dangerArc = remaining / numDanger;

  for (var d = 0; d < numDanger; d++) {
    arcs.push({
      startAngle: safeEnd + d * dangerArc,
      endAngle: safeEnd + (d + 1) * dangerArc,
      color: dangerColors[d % dangerColors.length],
      isSafe: false
    });
  }

  return arcs;
}
