// stages.js — Stage generation, buck sequences, difficulty scaling

class StageManager {
  constructor() {
    this.stageNumber = 1;
    this.buckSequence = [];
    this.buckIndex = 0;
    this.survivalTime = 6;
    this.diffParams = null;
    this.stageTransitioning = false;
  }

  initStage(stageNumber) {
    this.stageNumber = stageNumber;
    this.buckIndex = 0;
    this.stageTransitioning = false;
    this.diffParams = getDifficultyForStage(stageNumber);
    this.survivalTime = getSurvivalTime(stageNumber);
    this.buckSequence = this.generateSequence(stageNumber);
  }

  seededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  generateSequence(stage) {
    const seed = stage * 7919 + (Date.now() % 100000);
    const rng = this.seededRandom(seed);
    const diff = getDifficultyForStage(stage);
    const patterns = diff.patterns;
    const seq = [];
    let totalDuration = 0;
    const targetDuration = this.survivalTime * 1000;

    // Gentle opener
    seq.push({ pattern: 'buck', delay: 1200 });
    totalDuration += BUCK_PATTERNS.buck.duration + 1200;

    // Rest stages every 5
    if (stage % 5 === 0 && stage > 1) {
      seq.push({ pattern: 'buck', delay: Math.floor(diff.restGap * 1.5) });
      totalDuration += BUCK_PATTERNS.buck.duration + diff.restGap * 1.5;
    }

    // Milestone: introduce new pattern first
    if (stage === 5 || stage === 10 || stage === 15 || stage === 20 || stage === 30) {
      const newest = patterns[patterns.length - 1];
      seq.push({ pattern: newest, delay: diff.restGap });
      totalDuration += BUCK_PATTERNS[newest].duration + diff.restGap;
    }

    while (totalDuration < targetDuration) {
      const idx = Math.floor(rng() * patterns.length);
      const pattern = patterns[idx];
      const delay = diff.restGap + Math.floor(rng() * 200);
      seq.push({ pattern, delay });
      totalDuration += BUCK_PATTERNS[pattern].duration + delay;
    }

    return seq;
  }

  getNextBuck() {
    if (this.buckIndex >= this.buckSequence.length) {
      this.buckIndex = 0; // Loop sequence if still surviving
    }
    return this.buckSequence[this.buckIndex++];
  }

  getDrainRate() {
    return DIFFICULTY.baseDrainPerSec * (this.diffParams ? this.diffParams.drainMult : 1);
  }

  getRecoveryRate() {
    return DIFFICULTY.baseRecoveryPerSec;
  }

  getRegripWindow() {
    return this.diffParams ? this.diffParams.regripWindow : 600;
  }

  getMaxVelocity() {
    return this.diffParams ? this.diffParams.maxVel : 4;
  }
}
