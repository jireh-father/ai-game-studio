// Glass Walk - Stage Generation
const StageGen = {
  lastPositions: [],

  getTier(stage) {
    if (stage <= 5) return 1;
    if (stage <= 9) return 2;
    if (stage <= 14) return 3;
    if (stage <= 19) return 4;
    return 5;
  },

  getPanelCount(stage) {
    return stage >= 10 ? 3 : 2;
  },

  getFlashDuration(stage) {
    const isRest = stage % DIFFICULTY.restEvery === 0 && stage > 0;
    let dur = Math.max(DIFFICULTY.flashMin,
      DIFFICULTY.flashBase - stage * DIFFICULTY.flashDecay);
    if (isRest) dur = Math.min(0.8, dur + DIFFICULTY.restFlashBoost);
    return dur;
  },

  getCueStrength(stage) {
    const isRest = stage % DIFFICULTY.restEvery === 0 && stage > 0;
    let str = Math.max(DIFFICULTY.cueMin,
      DIFFICULTY.cueBase - stage * DIFFICULTY.cueDecay);
    if (isRest) str = Math.min(0.8, str + DIFFICULTY.restCueBoost);
    return str;
  },

  getSafeIndex(panelCount) {
    let idx = Phaser.Math.Between(0, panelCount - 1);
    // Prevent more than 2 consecutive same position
    if (this.lastPositions.length >= DIFFICULTY.maxSamePosition) {
      const recent = this.lastPositions.slice(-DIFFICULTY.maxSamePosition);
      if (recent.every(p => p === idx)) {
        const options = [];
        for (let i = 0; i < panelCount; i++) {
          if (i !== idx) options.push(i);
        }
        idx = Phaser.Utils.Array.GetRandom(options);
      }
    }
    this.lastPositions.push(idx);
    if (this.lastPositions.length > 10) this.lastPositions.shift();
    return idx;
  },

  getWeightTimer(stage) {
    if (stage < 15) return null;
    return Math.max(2.5, 3.5 - (stage - 15) * 0.05);
  },

  getShiftConfig(stage) {
    if (stage < 20) return null;
    return {
      interval: Math.max(1.5, 2.5 - (stage - 20) * 0.05)
    };
  },

  getStandingTimer(stage) {
    if (stage >= 15) {
      return Math.max(2.5, DIFFICULTY.standingTimer - (stage - 10) * 0.2);
    }
    return DIFFICULTY.standingTimer;
  },

  generateRow(stage) {
    const panelCount = this.getPanelCount(stage);
    const safeIndex = this.getSafeIndex(panelCount);
    const tier = this.getTier(stage);
    const isRest = stage % DIFFICULTY.restEvery === 0 && stage > 0;
    const isMilestone = stage % DIFFICULTY.milestoneEvery === 0 && stage > 0;

    return {
      stage,
      panelCount,
      safeIndex,
      tier,
      flashDuration: this.getFlashDuration(stage),
      cueStrength: this.getCueStrength(stage),
      standingTimer: this.getStandingTimer(stage),
      weightTimer: this.getWeightTimer(stage),
      shiftConfig: this.getShiftConfig(stage),
      isRest,
      isMilestone
    };
  },

  reset() {
    this.lastPositions = [];
  },

  // Generate crack line data for a panel
  generateCracks(count, panelW, panelH) {
    const lines = [];
    for (let i = 0; i < count; i++) {
      const x1 = Phaser.Math.Between(panelW * 0.1, panelW * 0.9);
      const y1 = Phaser.Math.Between(panelH * 0.1, panelH * 0.4);
      const x2 = x1 + Phaser.Math.Between(-panelW * 0.3, panelW * 0.3);
      const y2 = y1 + Phaser.Math.Between(panelH * 0.2, panelH * 0.5);
      const thickness = Phaser.Math.FloatBetween(0.5, 1.5);
      lines.push({ x1, y1, x2, y2, thickness });
      // Branch from midpoint
      if (count > 2 && Math.random() > 0.5) {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        lines.push({
          x1: mx, y1: my,
          x2: mx + Phaser.Math.Between(-20, 20),
          y2: my + Phaser.Math.Between(5, 20),
          thickness: thickness * 0.7
        });
      }
    }
    return lines;
  }
};
