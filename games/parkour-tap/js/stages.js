// stages.js - Stage generation, obstacle sequencing, difficulty calculation

function getDifficultyParams(stageNumber) {
  const s = stageNumber;
  const timingWindow = Math.max(180, 500 - s * 8);
  const obstacleSpacing = Math.max(0.5, 1.5 - s * 0.025);
  const speedMultiplier = Math.min(2.5, 1.0 + s * 0.04);
  const fakeOutChance = Math.min(0.3, Math.max(0, (s - 15) * 0.015));
  const doubleChance = Math.min(0.4, Math.max(0, (s - 18) * 0.02));
  const obstaclesPerStage = Math.min(15, 5 + Math.min(s, 10));
  return {
    timingWindow,
    obstacleSpacing,
    speedMultiplier,
    speed: RUNNER_SPEED_BASE * speedMultiplier,
    fakeOutChance,
    doubleChance,
    obstaclesPerStage
  };
}

function getAvailableTypes(stageNumber) {
  const types = [];
  if (stageNumber >= STAGE_UNLOCK.wall) types.push('wall');
  if (stageNumber >= STAGE_UNLOCK.bar) types.push('bar');
  if (stageNumber >= STAGE_UNLOCK.gap) types.push('gap');
  return types;
}

function generateStage(stageNumber) {
  const params = getDifficultyParams(stageNumber);
  const available = getAvailableTypes(stageNumber);
  const count = params.obstaclesPerStage;
  const obstacles = [];
  let lastType = null;
  let sameCount = 0;
  const restBeatIndex = 2 + Math.floor(Math.random() * 2); // rest after 3rd-4th

  for (let i = 0; i < count; i++) {
    // Pick type with variety enforcement
    let type;
    if (sameCount >= 2 && available.length > 1) {
      const filtered = available.filter(t => t !== lastType);
      type = filtered[Math.floor(Math.random() * filtered.length)];
    } else {
      type = available[Math.floor(Math.random() * available.length)];
    }

    if (type === lastType) {
      sameCount++;
    } else {
      sameCount = 0;
    }
    lastType = type;

    // Calculate spacing - rest beat at designated index
    let spacing = params.obstacleSpacing;
    if (i === restBeatIndex) {
      spacing *= 2;
    }

    // Double obstacle chance
    const isDouble = Math.random() < params.doubleChance && i < count - 1;

    obstacles.push({
      type,
      spacing,
      timingWindow: params.timingWindow,
      isFakeOut: Math.random() < params.fakeOutChance,
      isDouble
    });

    // Insert second obstacle for doubles with tight spacing
    if (isDouble) {
      const otherTypes = available.filter(t => t !== type);
      const secondType = otherTypes.length > 0
        ? otherTypes[Math.floor(Math.random() * otherTypes.length)]
        : type;
      obstacles.push({
        type: secondType,
        spacing: 0.4,
        timingWindow: params.timingWindow,
        isFakeOut: false,
        isDouble: false
      });
      i++; // skip one iteration since we added extra
    }
  }

  return obstacles;
}

function isBossStage(stageNumber) {
  return stageNumber > 0 && stageNumber % 10 === 0;
}
