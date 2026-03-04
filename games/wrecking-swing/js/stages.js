// Wrecking Swing - Stage Generation
class StageGenerator {
  // Mulberry32 seeded PRNG
  static mulberry32(seed) {
    return function() {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  static getDifficultyTier(stageNumber) {
    return Math.min(Math.floor(stageNumber / 5), 10);
  }

  static isRestStage(stageNumber) {
    return stageNumber > 1 && stageNumber % 10 === 0;
  }

  static isBossStage(stageNumber) {
    return stageNumber > 1 && stageNumber % 15 === 0;
  }

  static generateTower(stageNumber) {
    const seed = stageNumber * 7919 + 31337;
    const rng = StageGenerator.mulberry32(seed);
    const tier = StageGenerator.getDifficultyTier(stageNumber);
    const isRest = StageGenerator.isRestStage(stageNumber);
    const isBoss = StageGenerator.isBossStage(stageNumber);

    let rows = CONFIG.TIER.HEIGHT[tier];
    let cols = CONFIG.TIER.WIDTH[tier];
    let arc = CONFIG.TIER.ARC[tier];
    let speed = CONFIG.TIER.SPEED[tier];
    let armorChance = CONFIG.TIER.ARMOR[tier];
    let gapChance = CONFIG.TIER.GAP[tier];
    let swingCount = CONFIG.SWING_COUNT;

    if (isRest) {
      rows = Math.max(3, rows - 3);
      armorChance = 0;
      gapChance = 0;
      arc = Math.min(120, arc + 20);
    }

    if (isBoss) {
      rows = Math.min(18, Math.floor(rows * 1.5));
      arc = Math.floor(arc * 0.7);
      swingCount = 1;
    }

    // Pick tower shape
    const shapes = StageGenerator.getAvailableShapes(tier);
    const shapeIndex = Math.floor(rng() * shapes.length);
    const shape = shapes[shapeIndex];

    // Generate blocks
    const blocks = [];
    const bw = CONFIG.BLOCK_W + CONFIG.BLOCK_GAP;
    const bh = CONFIG.BLOCK_H + CONFIG.BLOCK_GAP;
    const towerW = cols * bw;
    const startX = (CONFIG.GAME_WIDTH - towerW) / 2 + bw / 2;
    const startY = CONFIG.GROUND_Y - CONFIG.PLATFORM_HEIGHT / 2 - bh / 2;

    for (let row = 0; row < rows; row++) {
      const y = startY - row * bh;
      let rowCols = cols;

      // Shape modifiers
      if (shape === 'pyramid') {
        const shrink = Math.floor(row / 2);
        rowCols = Math.max(1, cols - shrink * 2);
      } else if (shape === 'staggered' && row % 2 === 1) {
        rowCols = Math.max(1, cols - 1);
      }

      const rowStartX = (CONFIG.GAME_WIDTH - rowCols * bw) / 2 + bw / 2;

      for (let col = 0; col < rowCols; col++) {
        // Gap chance
        if (gapChance > 0 && rng() < gapChance) continue;

        const x = rowStartX + col * bw;
        let type = 'normal';

        if (armorChance > 0 && rng() < armorChance) {
          type = 'armored';
        }

        blocks.push({ x, y, type });
      }
    }

    return {
      blocks,
      pendulumArc: arc,
      pendulumSpeed: speed,
      swingCount,
      isBoss,
      isRest,
      rows,
      cols
    };
  }

  static getAvailableShapes(tier) {
    if (tier <= 1) return ['flat'];
    if (tier <= 3) return ['flat', 'pyramid'];
    if (tier <= 5) return ['flat', 'pyramid', 'staggered'];
    return ['flat', 'pyramid', 'staggered', 'castle'];
  }
}
