// Stage generation and difficulty scaling

function getEnemyTypesForStage(stageNumber) {
  const types = [CONFIG.ENEMY_TYPES.WALKER];
  if (stageNumber >= 4) types.push(CONFIG.ENEMY_TYPES.RUNNER);
  if (stageNumber >= 8) types.push(CONFIG.ENEMY_TYPES.JUMPER);
  if (stageNumber >= 13) types.push(CONFIG.ENEMY_TYPES.SHIELDED);
  if (stageNumber >= 21) types.push(CONFIG.ENEMY_TYPES.SPLITTER);
  return types;
}

function getStageConfig(stageNumber) {
  const isRestStage = stageNumber > 1 && stageNumber % 10 === 0;
  const baseEnemyCount = Math.min(12, 3 + Math.floor(stageNumber * 0.6));
  const baseSpeed = Math.min(140, 40 + stageNumber * 3);

  return {
    stageNumber: stageNumber,
    platformWidth: Math.max(160, 360 - stageNumber * 4),
    platformSegments: stageNumber < 11 ? 1 : stageNumber < 26 ? 2 : 3,
    gapSize: stageNumber < 11 ? 0 : stageNumber < 26 ? 40 : 60,
    enemyCount: isRestStage ? Math.ceil(baseEnemyCount * 0.5) : baseEnemyCount,
    enemySpeed: isRestStage ? Math.floor(baseSpeed * 0.8) : baseSpeed,
    enemyTypes: getEnemyTypesForStage(stageNumber),
    isRestStage: isRestStage,
    ropeForceMultiplier: stageNumber < 11 ? 1.0 : stageNumber < 21 ? 1.1 : stageNumber < 36 ? 1.2 : stageNumber < 51 ? 1.3 : 1.4
  };
}

function pickEnemyType(availableTypes, stageNumber) {
  // Weighted random: newer types less likely at first
  if (availableTypes.length === 1) return availableTypes[0];
  const weights = availableTypes.map((type, i) => {
    if (i === 0) return 3; // walker always common
    return Math.max(1, 3 - (availableTypes.length - 1 - i));
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return availableTypes[i];
  }
  return availableTypes[0];
}

function generateEnemyWave(stageConfig) {
  const enemies = [];
  for (let i = 0; i < stageConfig.enemyCount; i++) {
    const type = pickEnemyType(stageConfig.enemyTypes, stageConfig.stageNumber);
    enemies.push({
      type: type,
      spawnDelay: i * 300 + Math.random() * 200,
      speed: getEnemySpeed(type, stageConfig.enemySpeed)
    });
  }
  return enemies;
}

function getEnemySpeed(type, baseSpeed) {
  switch (type) {
    case CONFIG.ENEMY_TYPES.RUNNER: return baseSpeed * 1.8;
    case CONFIG.ENEMY_TYPES.SHIELDED: return baseSpeed * 0.7;
    default: return baseSpeed;
  }
}

function getEnemyColor(type) {
  switch (type) {
    case CONFIG.ENEMY_TYPES.WALKER: return CONFIG.COLORS.ENEMY_WALKER;
    case CONFIG.ENEMY_TYPES.RUNNER: return CONFIG.COLORS.ENEMY_RUNNER;
    case CONFIG.ENEMY_TYPES.JUMPER: return CONFIG.COLORS.ENEMY_JUMPER;
    case CONFIG.ENEMY_TYPES.SHIELDED: return CONFIG.COLORS.ENEMY_SHIELDED;
    case CONFIG.ENEMY_TYPES.SPLITTER: return CONFIG.COLORS.ENEMY_SPLITTER;
    default: return CONFIG.COLORS.ENEMY_WALKER;
  }
}

function getEnemyTexture(type) {
  switch (type) {
    case CONFIG.ENEMY_TYPES.WALKER: return 'walker';
    case CONFIG.ENEMY_TYPES.RUNNER: return 'runner';
    case CONFIG.ENEMY_TYPES.JUMPER: return 'jumper';
    case CONFIG.ENEMY_TYPES.SHIELDED: return 'shielded';
    case CONFIG.ENEMY_TYPES.SPLITTER: return 'splitter';
    default: return 'walker';
  }
}

function buildPlatformLayout(stageConfig, gameWidth, gameHeight) {
  const segments = [];
  const totalGaps = (stageConfig.platformSegments - 1) * stageConfig.gapSize;
  const segWidth = Math.floor((stageConfig.platformWidth - totalGaps) / stageConfig.platformSegments);
  const startX = (gameWidth - stageConfig.platformWidth) / 2;
  const platformY = gameHeight * 0.55;

  for (let i = 0; i < stageConfig.platformSegments; i++) {
    const x = startX + i * (segWidth + stageConfig.gapSize);
    segments.push({ x: x, y: platformY, width: segWidth, height: 24 });
  }
  return { segments, platformY, totalWidth: stageConfig.platformWidth, startX };
}
