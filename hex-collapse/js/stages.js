// stages.js — Stage progression, difficulty scaling, tile generation

const StageManager = {
  getConfig(stage) {
    return getDifficultyForStage(stage);
  },

  generateTile(stageConfig) {
    // Check for special hex
    if (stageConfig.special > 0 && Math.random() < stageConfig.special) {
      const specials = ['bomb'];
      if (stageConfig.target >= 30) specials.push('mirror');
      if (stageConfig.target >= 35) specials.push('void');
      return { number: 0, type: specials[Math.floor(Math.random() * specials.length)] };
    }
    // Weighted number generation
    const pool = stageConfig.pool;
    const bias = stageConfig.bias;
    const midpoint = pool.length / 2;
    let weights = pool.map((n, i) => i < midpoint ? bias / midpoint : (1 - bias) / (pool.length - midpoint));
    const total = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / total);
    let r = Math.random(), cumulative = 0;
    for (let i = 0; i < pool.length; i++) {
      cumulative += weights[i];
      if (r <= cumulative) return { number: pool[i], type: 'normal' };
    }
    return { number: pool[pool.length - 1], type: 'normal' };
  },

  shouldAdvance(collapses, stage) {
    const cfg = this.getConfig(stage);
    return collapses >= cfg.target;
  },

  getBoardCells(radius) {
    const cells = [];
    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);
      for (let r = r1; r <= r2; r++) {
        cells.push({ q, r });
      }
    }
    return cells;
  },

  axialToPixel(q, r, R, cx, cy) {
    const x = R * HEX_MATH.SQRT3 * (q + r / 2) + cx;
    const y = R * 1.5 * r + cy;
    return { x, y };
  },

  pixelToAxial(px, py, R, cx, cy) {
    const x = px - cx, y = py - cy;
    const q = (x * HEX_MATH.SQRT3 / 3 - y / 3) / R;
    const r = (y * 2 / 3) / R;
    return this.cubeRound(q, r);
  },

  cubeRound(q, r) {
    const s = -q - r;
    let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
    const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
    if (dq > dr && dq > ds) rq = -rr - rs;
    else if (dr > ds) rr = -rq - rs;
    return { q: rq, r: rr };
  },

  isValidCell(q, r, radius) {
    return Math.abs(q) <= radius && Math.abs(r) <= radius && Math.abs(q + r) <= radius;
  },

  getNeighbors(q, r) {
    return HEX_MATH.DIRS.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
  },

  distToCenter(q, r) {
    return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
  }
};
