// stages.js — Level config calculator, bubble generator, floor position
window.Stages = {
  getLevelIndex(elapsedSeconds) {
    let total = 0;
    for (let i = 0; i < CONFIG.LEVELS.length; i++) {
      total += CONFIG.LEVELS[i].duration;
      if (elapsedSeconds < total) return i;
    }
    return CONFIG.LEVELS.length - 1;
  },

  getLevelConfig(elapsedSeconds) {
    const idx = this.getLevelIndex(elapsedSeconds);
    return { ...CONFIG.LEVELS[idx], level: idx + 1 };
  },

  generateNextBubble(levelConfig, lastWasBomb, bombCooldown) {
    const colors = CONFIG.COLOR_KEYS.slice(0, levelConfig.colors);
    let type = 'plain';
    if (bombCooldown <= 0 && !lastWasBomb && Math.random() < levelConfig.bombChance) {
      type = 'bomb';
    } else if (Math.random() < levelConfig.rainbowChance) {
      type = 'rainbow';
    }
    const color = colors[Math.floor(Math.random() * colors.length)];
    const radius = CONFIG.BASE_RADIUS * levelConfig.radiusMult;
    const drift = levelConfig.driftRange > 0
      ? (Math.random() * 2 - 1) * levelConfig.driftRange : 0;
    return { color, type, radius, drift, tier: 0 };
  },

  calculateFloorY(startY, elapsedSeconds, levelConfig) {
    const riseRate = 1.0 / levelConfig.floorRiseInterval;
    return startY - (elapsedSeconds * riseRate);
  },

  getFloorRiseRate(levelConfig) {
    return 1.0 / levelConfig.floorRiseInterval;
  },

  getForcedDropTimer(levelConfig) {
    return levelConfig.forcedDropTimer;
  },

  getScoreForTier(tier) {
    const vals = CONFIG.SCORE_VALUES;
    return [vals.MERGE_S, vals.MERGE_M, vals.MERGE_L, vals.MERGE_G, vals.MERGE_SUPER][tier] || vals.MERGE_S;
  },

  getComboMultiplier(chainLen) {
    const m = CONFIG.COMBO_MULTIPLIERS;
    return m[Math.min(chainLen, m.length - 1)];
  }
};
