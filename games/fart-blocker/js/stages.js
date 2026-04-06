// stages.js — Stage parameter generation, difficulty formula, startle timing

const StageSystem = {
  getParams(stageNum) {
    const s = stageNum;
    const scenarioId = this.getScenarioId(s);
    const isRestStage = s % 5 === 0;
    const fillRateRaw = Math.min(25, DIFFICULTY_BASE.basePressureFillRate + s * 0.3);
    const fillRate = isRestStage ? fillRateRaw * 0.8 : fillRateRaw;
    const tapReduction = Math.max(5, DIFFICULTY_BASE.baseTapReduction - s * 0.15);
    const timer = Math.max(7, DIFFICULTY_BASE.baseTimer - Math.floor(s / 5));
    const crampThreshold = this.getCrampThreshold(s);
    const crampDuration = Math.min(4000, DIFFICULTY_BASE.baseCrampDuration + s * 20);
    const startleCount = Math.floor(s / 6);
    const startleSpike = Math.min(30, 10 + s * 0.4);
    const timerMs = timer * 1000;
    const startleTimes = this.getStartleTimes(s, timerMs);
    const hasInversion = s >= 31;

    const params = {
      stageNum: s,
      scenarioId,
      scenarioName: SCENARIO_NAMES[scenarioId],
      scenarioBg: SCENARIO_BACKGROUNDS[scenarioId],
      timer,
      timerMs,
      fillRate,
      tapReduction,
      crampThreshold,
      crampDuration,
      startleCount,
      startleSpike,
      startleTimes,
      hasInversion,
      isRestStage,
      seed: s * 7919 + Date.now() % 100000
    };

    return params;
  },

  getCrampThreshold(stageNum) {
    const base = Math.max(3, DIFFICULTY_BASE.baseCrampThreshold - Math.floor(stageNum / 10));
    if (stageNum > 10) {
      return base + (Math.random() < 0.5 ? -1 : 1);
    }
    return base;
  },

  getStartleTimes(stageNum, timerMs) {
    const count = Math.floor(stageNum / 6);
    if (count <= 0) return [];

    const times = [];
    const minTime = 1500;
    const maxTime = timerMs - 1000;
    if (maxTime <= minTime) return [];

    const range = maxTime - minTime;
    for (let i = 0; i < count; i++) {
      const seed = stageNum * 7919 + i * 1301 + Date.now() % 10000;
      const t = minTime + ((seed * 2654435761) % range + range) % range;
      times.push(Math.round(t));
    }

    times.sort((a, b) => a - b);
    // Ensure minimum 800ms between startles
    for (let i = 1; i < times.length; i++) {
      if (times[i] - times[i - 1] < 800) {
        times[i] = Math.min(maxTime, times[i - 1] + 800);
      }
    }
    return times;
  },

  getScenarioId(stageNum) {
    if (stageNum <= 5) return 0;
    if (stageNum <= 10) return 1;
    if (stageNum <= 20) return 2;
    if (stageNum <= 30) return 3;
    if (stageNum <= 50) return 4;
    return Math.floor((stageNum - 1) / 5) % 5;
  },

  validateSolvability(params) {
    const maxTapRate = (params.crampThreshold - 1) * 2;
    const reductionPerSec = maxTapRate * params.tapReduction;
    return (params.timer * reductionPerSec) - (params.timer * params.fillRate) > 0;
  }
};
