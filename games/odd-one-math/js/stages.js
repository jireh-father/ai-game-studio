const StageGen = {
  recentCategories: [],

  getTier(stageNum) {
    for (const t of DIFFICULTY) {
      if (stageNum >= t.minStage && stageNum <= t.maxStage) return t;
    }
    return DIFFICULTY[DIFFICULTY.length - 1];
  },

  generateQuestion(stageNum) {
    const tier = this.getTier(stageNum);
    const isRest = stageNum > 1 && stageNum % 5 === 0;
    const pool = isRest ? [0,1,2,3] : tier.catIds.slice();
    const filtered = pool.filter(id => {
      const count = this.recentCategories.filter(r => r === id).length;
      return count < 2;
    });
    const available = filtered.length > 0 ? filtered : pool;
    const seed = stageNum * 7919 + Date.now() % 100000;
    const rng = this._seededRandom(seed);
    const catId = available[Math.floor(rng() * available.length)];
    const cat = CATEGORIES[catId];
    this.recentCategories.push(catId);
    if (this.recentCategories.length > 4) this.recentCategories.shift();

    const range = isRest ? 50 : tier.numRange;
    const members = this._findMembers(cat.fn, range, 3, rng);
    if (!members) return this._fallback(stageNum);
    const impostor = this._findImpostor(cat.fn, members, range, rng);
    if (impostor === null) return this._fallback(stageNum);

    const numbers = [...members, impostor];
    const impostorIndex = 3;
    this._shuffle(numbers, rng);
    const finalIdx = numbers.indexOf(impostor);

    return {
      numbers, impostorIndex: finalIdx, catId, catName: cat.name,
      catDesc: cat.desc, timer: tier.timer,
      ruleText: `${cat.name}: ${members.join(', ')} are all ${cat.desc.toLowerCase()}`
    };
  },

  _findMembers(fn, range, count, rng) {
    const all = [];
    for (let n = 1; n <= range; n++) { if (fn(n)) all.push(n); }
    if (all.length < count) return null;
    this._shuffle(all, rng);
    return all.slice(0, count);
  },

  _findImpostor(fn, members, range, rng) {
    const avg = members.reduce((a, b) => a + b, 0) / members.length;
    const candidates = [];
    for (let n = 1; n <= range; n++) {
      if (!fn(n) && !members.includes(n)) {
        candidates.push({ n, dist: Math.abs(n - avg) });
      }
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.dist - b.dist);
    const top = candidates.slice(0, Math.min(5, candidates.length));
    return top[Math.floor(rng() * top.length)].n;
  },

  _fallback(stageNum) {
    const cat = CATEGORIES[0];
    const members = [2, 4, 6];
    const impostor = 3;
    return {
      numbers: [2, 4, 3, 6], impostorIndex: 2, catId: 0,
      catName: cat.name, catDesc: cat.desc, timer: 5.0,
      ruleText: 'Even Numbers: 2, 4, 6 are all divisible by 2'
    };
  },

  _shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  },

  _seededRandom(seed) {
    let s = seed;
    return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
  }
};
