// Set Surgeon - Stage Generation
const StageManager = {
  getTier(round) {
    for (const d of CONFIG.DIFFICULTY) {
      if (round >= d.minRound && round <= d.maxRound) return d.tier;
    }
    return 5;
  },

  getDifficulty(round) {
    for (const d of CONFIG.DIFFICULTY) {
      if (round >= d.minRound && round <= d.maxRound) return d;
    }
    return CONFIG.DIFFICULTY[CONFIG.DIFFICULTY.length - 1];
  },

  isRestRound(round) {
    if (round <= 5) return false;
    const tier = this.getTier(round);
    if (tier <= 2) return round % 5 === 0;
    if (tier <= 4) return round % 7 === 0;
    return round % 10 === 0;
  },

  getRulesForTier(tier) {
    if (tier === 5) {
      // Mixed - weight toward higher tiers
      return RULE_LIBRARY.filter(r => r.tier >= 2);
    }
    return RULE_LIBRARY.filter(r => r.tier <= tier);
  },

  pickCompatibleRules(tier) {
    const pool = this.getRulesForTier(tier);
    const seed = Date.now() % 100000;
    for (let attempt = 0; attempt < 30; attempt++) {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length - 2; i++) {
        for (let j = i + 1; j < shuffled.length - 1; j++) {
          for (let k = j + 1; k < shuffled.length; k++) {
            if (areRulesCompatible(shuffled[i], shuffled[j], shuffled[k])) {
              return [shuffled[i], shuffled[j], shuffled[k]];
            }
          }
        }
      }
    }
    // Fallback: tier 1 guaranteed compatible
    const t1 = RULE_LIBRARY.filter(r => r.tier === 1);
    return [t1[0], t1[3], t1[6]]; // even, >50, red - always compatible
  },

  generateElement(id) {
    // Randomly create number or shape element
    if (Math.random() < 0.6) {
      const value = Math.floor(Math.random() * 98) + 1;
      const shape = SHAPE_LIST[Math.floor(Math.random() * SHAPE_LIST.length)];
      return {
        id, type: 'number', value,
        shape, colorName: COLOR_NAMES[shape.color],
        display: String(value)
      };
    } else {
      const shape = SHAPE_LIST[Math.floor(Math.random() * SHAPE_LIST.length)];
      return {
        id, type: 'shape', value: 0,
        shape, colorName: COLOR_NAMES[shape.color],
        display: shape.name
      };
    }
  },

  getCorrectRegion(element, ruleA, ruleB, ruleC) {
    const inA = ruleA.test(element);
    const inB = ruleB.test(element);
    const inC = ruleC.test(element);
    if (inA && inB && inC) return 'ABC';
    if (inA && inB) return 'AB';
    if (inA && inC) return 'AC';
    if (inB && inC) return 'BC';
    if (inA) return 'A_ONLY';
    if (inB) return 'B_ONLY';
    if (inC) return 'C_ONLY';
    return 'NONE';
  },

  generateElements(ruleA, ruleB, ruleC, count) {
    const elements = [];
    const regionCounts = { A_ONLY: 0, B_ONLY: 0, C_ONLY: 0, AB: 0, AC: 0, BC: 0, ABC: 0 };
    let attempts = 0;
    const maxAttempts = count * 80;

    while (elements.length < count && attempts < maxAttempts) {
      attempts++;
      const el = this.generateElement(elements.length);
      const region = this.getCorrectRegion(el, ruleA, ruleB, ruleC);
      if (region === 'NONE') continue;
      // Prefer diversity - don't stack same region too much
      if (regionCounts[region] >= 2 && elements.length < count - 1) continue;
      el.correctRegion = region;
      elements.push(el);
      regionCounts[region]++;
    }

    // Fill remaining with guaranteed placements if needed
    while (elements.length < count) {
      const el = this.generateElement(elements.length);
      const region = this.getCorrectRegion(el, ruleA, ruleB, ruleC);
      if (region !== 'NONE') {
        el.correctRegion = region;
        elements.push(el);
      }
    }

    return elements;
  },

  generateRound(roundNumber) {
    const diff = this.getDifficulty(roundNumber);
    let tier = diff.tier;
    let elemCount = diff.elements;
    let timer = diff.timer;

    if (this.isRestRound(roundNumber)) {
      tier = Math.max(1, tier - 1);
      elemCount = 4;
    }

    const [ruleA, ruleB, ruleC] = this.pickCompatibleRules(tier);
    const elements = this.generateElements(ruleA, ruleB, ruleC, elemCount);

    return {
      roundNumber,
      ruleA, ruleB, ruleC,
      elements,
      timerMs: timer,
      hintTime: diff.hintTime,
      isRest: this.isRestRound(roundNumber),
      tier
    };
  },

  checkPlacement(element, regionId, ruleA, ruleB, ruleC) {
    const correct = this.getCorrectRegion(element, ruleA, ruleB, ruleC);
    return correct === regionId;
  },

  getRegionFromPoint(x, y) {
    const cA = CONFIG.CIRCLES.A;
    const cB = CONFIG.CIRCLES.B;
    const cC = CONFIG.CIRCLES.C;
    const inA = Math.hypot(x - cA.x, y - cA.y) < cA.r;
    const inB = Math.hypot(x - cB.x, y - cB.y) < cB.r;
    const inC = Math.hypot(x - cC.x, y - cC.y) < cC.r;
    if (inA && inB && inC) return 'ABC';
    if (inA && inB) return 'AB';
    if (inA && inC) return 'AC';
    if (inB && inC) return 'BC';
    if (inA) return 'A_ONLY';
    if (inB) return 'B_ONLY';
    if (inC) return 'C_ONLY';
    return null;
  }
};
