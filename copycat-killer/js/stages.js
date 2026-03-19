// Copycat Killer - Stage Generation

function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const StageGenerator = {
  getStageParams(stage) {
    const diff = getDifficultyForStage(stage);
    const arenaWidth = Math.max(GAME_CONFIG.minArenaWidth,
      GAME_CONFIG.width - (stage >= 6 ? (stage - 5) * GAME_CONFIG.arenaShrinkPerStage * 2 : 0));
    const arenaHeight = GAME_CONFIG.height - GAME_CONFIG.hudHeight;

    const fastChance = stage <= 5 ? 0 : Math.min(0.4, (stage - 5) * 0.04);
    const megaChance = stage <= 20 ? 0 : Math.min(0.2, (stage - 20) * 0.02);
    const bounceChance = stage <= 30 ? 0 : Math.min(0.3, (stage - 30) * 0.03);

    return {
      ...diff,
      arenaWidth,
      arenaHeight,
      fastChance,
      megaChance,
      bounceChance,
      isRestWave: (stage % 10 === 1 && stage > 1)
    };
  }
};

const WaveGenerator = {
  generateWave(stage, waveIndex, arenaLeft, arenaWidth) {
    const seed = (stage * 7919 + waveIndex * 1301 + Date.now() % 100000) | 0;
    const rng = mulberry32(seed);
    const params = StageGenerator.getStageParams(stage);

    let count = params.obstaclesPerWave;
    if (count > 12) count = 12;

    // Rest waves at start of every 10th stage
    if (params.isRestWave && waveIndex < 3) {
      count = 2;
    }

    const minGap = 80;
    const obstacles = [];
    const positions = [];

    // Generate positions ensuring 80px gap
    for (let i = 0; i < count; i++) {
      let x, attempts = 0;
      do {
        x = arenaLeft + 20 + rng() * (arenaWidth - 40);
        attempts++;
      } while (attempts < 50 && positions.some(px => Math.abs(px - x) < minGap));

      if (attempts < 50) {
        positions.push(x);
        const type = getObstacleType(params, rng);
        obstacles.push({
          x: x,
          y: -20,
          type: type,
          speed: type === 'fast' ? params.fallSpeed * 2 : params.fallSpeed,
          radius: type === 'mega' ? GAME_CONFIG.obstacleRadiusMega :
                  type === 'fast' ? GAME_CONFIG.obstacleRadiusFast :
                  GAME_CONFIG.obstacleRadiusNormal,
          bounce: type === 'bounce'
        });
      }
    }
    return obstacles;
  }
};

function getObstacleType(params, rng) {
  const r = rng();
  if (r < params.megaChance) return 'mega';
  if (r < params.megaChance + params.bounceChance) return 'bounce';
  if (r < params.megaChance + params.bounceChance + params.fastChance) return 'fast';
  return 'normal';
}
