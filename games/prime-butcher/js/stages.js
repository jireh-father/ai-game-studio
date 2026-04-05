// Prime Butcher — stages.js

const StageManager = {
  getDifficultyParams(stage) {
    if (this.isRestStage(stage)) {
      return { speed: 50, spawnInterval: 2500, maxSimult: 1, compositeRatio: 0.3, threePrimeChance: 0 };
    }
    for (let i = DIFFICULTY.length - 1; i >= 0; i--) {
      if (stage >= DIFFICULTY[i].minStage) return { ...DIFFICULTY[i] };
    }
    return { ...DIFFICULTY[0] };
  },

  buildNumberPool(stage) {
    const ceiling = this.isRestStage(stage) ? 10 : getNumberCeiling(stage);
    const params = this.getDifficultyParams(stage);
    const pool = [];

    for (let n = 2; n <= ceiling; n++) {
      const isPrime = PRIME_SET.has(n);
      if (isPrime) {
        pool.push({ value: n, isPrime: true, factors: null, weight: 1 });
      } else if (FACTOR_MAP[n]) {
        // Smaller composites weighted higher
        const w = n <= 20 ? 3 : (n <= 50 ? 2 : 1);
        pool.push({ value: n, isPrime: false, factors: FACTOR_MAP[n], weight: w });
      }
    }
    return pool;
  },

  getNextBlock(stage) {
    const pool = this.buildNumberPool(stage);
    const params = this.getDifficultyParams(stage);
    const composites = pool.filter(b => !b.isPrime);
    const primes = pool.filter(b => b.isPrime);

    const useComposite = Math.random() < params.compositeRatio;
    let source = useComposite && composites.length > 0 ? composites : primes;
    if (source.length === 0) source = pool;

    // Weighted random selection
    const totalWeight = source.reduce((s, b) => s + b.weight, 0);
    let r = Math.random() * totalWeight;
    for (const block of source) {
      r -= block.weight;
      if (r <= 0) {
        return {
          value: block.value,
          isPrime: block.isPrime,
          factors: block.factors,
          isBoss: false
        };
      }
    }
    const last = source[source.length - 1];
    return { value: last.value, isPrime: last.isPrime, factors: last.factors, isBoss: false };
  },

  getBossBlock(stage) {
    // 3-prime composites for boss stages
    const candidates = [30, 42, 66, 70, 78, 102, 105, 110, 130, 154, 165, 170, 182, 190, 210];
    const ceiling = getNumberCeiling(stage);
    const valid = candidates.filter(n => n <= ceiling);
    const val = valid.length > 0 ? valid[Math.floor(Math.random() * valid.length)] : 30;
    return {
      value: val,
      isPrime: false,
      factors: FACTOR_MAP[val],
      isBoss: true
    };
  },

  isRestStage(stage) {
    return stage > 1 && stage % 10 === 0;
  },

  isBossStage(stage) {
    return stage % 15 === 0;
  },

  getStageDuration(stage) {
    return this.isRestStage(stage) ? REST_STAGE_DURATION : STAGE_DURATION;
  }
};
