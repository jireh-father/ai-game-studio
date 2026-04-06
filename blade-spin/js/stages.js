// Blade Spin - Stage Generation
function getStageParams(stageN) {
  var isBossStage = (stageN % 10 === 0);
  var isRestStage = (stageN % 8 === 6);

  // Rotation speed
  var rotationSpeed = Math.min(BASE_ROTATION_SPEED + (stageN * ROTATION_SPEED_INCREMENT), ROTATION_SPEED_CAP);
  if (isRestStage) rotationSpeed *= 0.8;

  // Oscillating spin
  var isOscillating = false;
  if (stageN >= 7 && stageN <= 9) isOscillating = true;
  if (stageN >= 10 && !isBossStage) {
    isOscillating = (stageN % 2 === 1); // alternate
  }
  if (isBossStage && stageN >= 20) isOscillating = true;

  // Required blades
  var requiredBlades = Math.min(5 + Math.floor(stageN / 3), 14);
  if (isRestStage) requiredBlades = Math.max(3, requiredBlades - 2);

  // Boss shields
  var shieldCount = 0;
  if (isBossStage) {
    shieldCount = Math.min(Math.floor(stageN / 10), MAX_SHIELDS);
  }

  // Shield angles - evenly distributed
  var shieldAngles = [];
  for (var i = 0; i < shieldCount; i++) {
    shieldAngles.push((360 / shieldCount) * i);
  }

  // Pre-loaded blades (stage 15+)
  var preloadedCount = Math.max(0, Math.floor((stageN - 15) / 3));
  preloadedCount = Math.min(preloadedCount, MAX_PRELOADED);

  // Solvability check
  var totalBlocked = (shieldCount * SHIELD_ARC_DEG) + (preloadedCount * BLADE_COLLISION_ARC);
  while (totalBlocked > (360 - MIN_SAFE_ARC) && preloadedCount > 0) {
    preloadedCount--;
    totalBlocked = (shieldCount * SHIELD_ARC_DEG) + (preloadedCount * BLADE_COLLISION_ARC);
  }

  // Pre-loaded blade angles - evenly distributed
  var preloadedAngles = [];
  if (preloadedCount > 0) {
    var offset = (stageN * 7919 + Date.now() % 100000) % 360;
    for (var j = 0; j < preloadedCount; j++) {
      preloadedAngles.push((offset + (360 / preloadedCount) * j) % 360);
    }
  }

  // Golden apple
  var hasGoldenApple = false;
  var appleAngle = 0;
  if (stageN >= 4 && Math.random() < 0.35) {
    hasGoldenApple = true;
    // Place apple in a safe zone (not on shields or preloaded blades)
    appleAngle = (stageN * 137 + 42) % 360;
  }

  // Two-speed cycle
  var twoSpeedCycle = (stageN >= 11 && !isBossStage);

  return {
    stageN: stageN,
    rotationSpeed: rotationSpeed,
    isOscillating: isOscillating,
    requiredBlades: requiredBlades,
    isBossStage: isBossStage,
    shieldCount: shieldCount,
    shieldAngles: shieldAngles,
    preloadedCount: preloadedCount,
    preloadedAngles: preloadedAngles,
    hasGoldenApple: hasGoldenApple,
    appleAngle: appleAngle,
    isRestStage: isRestStage,
    twoSpeedCycle: twoSpeedCycle
  };
}
