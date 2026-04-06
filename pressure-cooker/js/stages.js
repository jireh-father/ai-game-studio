// Pressure Cooker - Stage Generation
const STAGES = {
  seededRandom: function(seed) {
    let t = (seed + 0x6D2B79F5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  },

  isRestStage: function(stage) {
    return stage > 1 && stage % DIFFICULTY.restStageInterval === 0;
  },

  getDifficulty: function(stage) {
    const chamberCount = Math.min(3 + Math.floor(stage / 4), 7);
    const baseFillRate = DIFFICULTY.baseFillRate + stage * DIFFICULTY.fillRateGrowth;
    const stageDuration = Math.max(
      DIFFICULTY.minStageDuration,
      DIFFICULTY.baseStageDuration - stage * DIFFICULTY.stageDurationDecay
    );
    const fillRateVariance = Math.min(
      DIFFICULTY.maxFillRateVariance,
      DIFFICULTY.fillRateVarianceBase + stage * DIFFICULTY.fillRateVarianceGrowth
    );
    const hotCount = stage >= 6 ? Math.min(2, Math.floor((stage - 4) / 4)) : 0;
    const lockedCount = stage >= 9 ? Math.min(2, Math.floor((stage - 7) / 6)) : 0;
    const multiplierCount = stage >= 12 ? Math.min(2, Math.floor((stage - 10) / 6)) : 0;

    return { chamberCount, baseFillRate, stageDuration, fillRateVariance,
      hotCount, lockedCount, multiplierCount };
  },

  getChamberConfig: function(stage) {
    const diff = this.getDifficulty(stage);
    const isRest = this.isRestStage(stage);
    const seed = stage * 7919 + Date.now() % 100000;
    const chambers = [];

    let effectiveFillRate = isRest ? diff.baseFillRate * DIFFICULTY.restFillRateReduction : diff.baseFillRate;
    const hotCount = isRest ? 0 : diff.hotCount;
    const lockedCount = isRest ? 0 : diff.lockedCount;
    const multiplierCount = isRest ? 0 : diff.multiplierCount;

    // Assign fill rates with variance
    for (let i = 0; i < diff.chamberCount; i++) {
      const r = this.seededRandom(seed + i);
      const variance = 1 - diff.fillRateVariance + 2 * diff.fillRateVariance * r;
      chambers.push({
        index: i,
        pressure: 0,
        fillRate: effectiveFillRate * variance,
        isHot: false,
        isLocked: false,
        isMultiplier: false,
        lockedTimer: 0
      });
    }

    // Assign hot chambers (highest fill rate indices, skip locked)
    const indices = chambers.map((_, i) => i);
    const shuffled = indices.slice().sort((a, b) => this.seededRandom(seed + 100 + a) - this.seededRandom(seed + 100 + b));
    let assigned = 0;
    for (let i = 0; i < shuffled.length && assigned < hotCount; i++) {
      chambers[shuffled[i]].isHot = true;
      chambers[shuffled[i]].fillRate *= 2;
      assigned++;
    }

    // Assign locked chambers (not hot ones)
    const nonHot = shuffled.filter(i => !chambers[i].isHot);
    assigned = 0;
    for (let i = 0; i < nonHot.length && assigned < lockedCount; i++) {
      if (nonHot.length - assigned > 1) { // never lock all non-hot
        chambers[nonHot[i]].isLocked = true;
        chambers[nonHot[i]].lockedTimer = DIFFICULTY.lockedCycleDuration;
        assigned++;
      }
    }

    // Assign multiplier chambers (not hot, not locked)
    const available = nonHot.filter(i => !chambers[i].isLocked);
    assigned = 0;
    for (let i = 0; i < available.length && assigned < multiplierCount; i++) {
      chambers[available[i]].isMultiplier = true;
      assigned++;
    }

    // Layout
    const layoutConf = LAYOUT.chamberConfigs[diff.chamberCount] || LAYOUT.chamberConfigs[7];

    return {
      chambers,
      duration: diff.stageDuration,
      layout: layoutConf,
      chamberCount: diff.chamberCount
    };
  },

  getNeighbors: function(index, total, layout) {
    const neighbors = [];
    const cols = layout.cols;
    const row = Math.floor(index / cols);
    const col = index % cols;
    // left
    if (col > 0 && index - 1 < total) neighbors.push(index - 1);
    // right
    if (col < cols - 1 && index + 1 < total) neighbors.push(index + 1);
    // up
    if (row > 0 && index - cols >= 0) neighbors.push(index - cols);
    // down
    if (row < layout.rows - 1 && index + cols < total) neighbors.push(index + cols);
    return neighbors;
  }
};
