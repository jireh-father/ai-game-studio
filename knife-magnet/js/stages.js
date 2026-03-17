function generateStage(stageNumber) {
  const diff = getDifficulty(stageNumber);
  const isBossStage = stageNumber % 10 === 0;
  const entropy = stageNumber * 7919 + Date.now() % 100000;
  const waves = [];

  function seededRandom(i) {
    let x = Math.sin(entropy + i * 9973) * 43758.5453;
    return x - Math.floor(x);
  }

  let prevCount = -1, prevSpeed = -1, prevAngle = -1;

  for (let w = 0; w < WAVES_PER_STAGE; w++) {
    const isRestWave = (w === WAVES_PER_STAGE - 1) && !isBossStage;
    let knifeCount = isRestWave ? 1 : diff.knifeCount;
    if (isBossStage) knifeCount = diff.knifeCount;

    const knives = [];
    let hasCursed = false;

    for (let k = 0; k < knifeCount; k++) {
      const r = seededRandom(w * 10 + k);
      const speedMult = diff.speedVariance > 0
        ? 1 + (seededRandom(w * 10 + k + 100) * 2 - 1) * diff.speedVariance
        : 1;
      const speed = diff.baseSpeed * speedMult;

      const angleDeg = diff.angleVariance > 0
        ? (seededRandom(w * 10 + k + 200) * 2 - 1) * diff.angleVariance
        : 0;

      let isCursed = false;
      if (diff.cursedChance > 0 && k === knifeCount - 1 && !hasCursed) {
        isCursed = seededRandom(w * 10 + k + 300) < diff.cursedChance;
      }
      if (isCursed) hasCursed = true;

      knives.push({
        speed: speed,
        angle: angleDeg,
        cursed: isCursed,
        delay: k * (isCursed ? 120 : 60)
      });
    }

    // Variety check
    if (knives.length === prevCount &&
        Math.abs(knives[0].speed - prevSpeed) < 20 &&
        Math.abs(knives[0].angle - prevAngle) < 5) {
      if (knives.length > 0) {
        knives[0].speed += 40;
        knives[0].angle += 10;
      }
    }

    prevCount = knives.length;
    prevSpeed = knives[0] ? knives[0].speed : 0;
    prevAngle = knives[0] ? knives[0].angle : 0;

    waves.push({
      knifeCount: knifeCount,
      knives: knives,
      interval: diff.waveInterval
    });
  }

  return {
    stageNumber: stageNumber,
    waves: waves,
    isBossStage: isBossStage,
    catchWindow: diff.catchWindow
  };
}
