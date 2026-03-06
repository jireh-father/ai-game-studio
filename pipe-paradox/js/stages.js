// stages.js - Difficulty scaling, rule pools, source/drain placement

const StageManager = {
  // Calculate difficulty parameters based on cycle number
  calculateDifficulty(cycle) {
    return {
      flowSpeed: Math.min(3.0, CONFIG.DIFFICULTY.BASE_FLOW_SPEED * (1 + cycle * 0.08)),
      ruleTimer: Math.max(3.0, CONFIG.DIFFICULTY.BASE_RULE_TIMER - cycle * 0.15),
      poolSize: Math.min(9, 3 + Math.floor(cycle / 3)),
      sourceCount: Math.min(3, 1 + Math.floor(cycle / 4)),
      drainCount: Math.min(3, 1 + Math.floor(cycle / 5)),
      compound: cycle >= 26,
      relocate: cycle >= 26
    };
  },

  // Get unlocked rules for current cycle
  getUnlockedRules(cycle) {
    return CONFIG.RULES.filter(r => r.id > 0 && r.unlock <= cycle);
  },

  // Select a rule, avoiding the last one used
  selectRule(pool, lastRuleId) {
    if (pool.length === 0) return CONFIG.RULES[0]; // NORMAL
    const filtered = pool.filter(r => r.id !== lastRuleId);
    const choices = filtered.length > 0 ? filtered : pool;
    return choices[Math.floor(Math.random() * choices.length)];
  },

  // Check for contradictory rule pairs
  areContradictory(r1, r2) {
    const pairs = [[2, 3], [1, 9]]; // gravity+antigrav, reverse+mirror
    return pairs.some(p =>
      (p[0] === r1 && p[1] === r2) || (p[0] === r2 && p[1] === r1)
    );
  },

  // Select compound rules (two non-contradictory rules)
  selectCompoundRules(pool, lastRuleId) {
    const r1 = this.selectRule(pool, lastRuleId);
    const remaining = pool.filter(r => r.id !== r1.id && !this.areContradictory(r1.id, r.id));
    const r2 = remaining.length > 0 ? remaining[Math.floor(Math.random() * remaining.length)] : null;
    return r2 ? [r1, r2] : [r1];
  },

  // Get valid edge positions for sources/drains
  getEdgePositions() {
    const positions = [];
    for (let c = 0; c < CONFIG.GRID.cols; c++) {
      positions.push({ r: 0, c }); // top edge
      positions.push({ r: CONFIG.GRID.rows - 1, c }); // bottom edge
    }
    for (let r = 1; r < CONFIG.GRID.rows - 1; r++) {
      positions.push({ r, c: 0 }); // left edge
      positions.push({ r, c: CONFIG.GRID.cols - 1 }); // right edge
    }
    return positions;
  },

  // Manhattan distance
  manhattan(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
  },

  // Place sources on grid edges
  placeSources(count, existing) {
    const edges = this.getEdgePositions();
    const placed = [];
    const occupied = existing.map(e => `${e.r},${e.c}`);
    const available = edges.filter(p => !occupied.includes(`${p.r},${p.c}`));

    for (let i = 0; i < count && available.length > 0; i++) {
      const idx = Math.floor(Math.random() * available.length);
      placed.push(available[idx]);
      occupied.push(`${available[idx].r},${available[idx].c}`);
      available.splice(idx, 1);
    }
    return placed;
  },

  // Place drains ensuring min distance from sources
  placeDrains(count, sources, existing) {
    const edges = this.getEdgePositions();
    const occupied = [...sources, ...existing].map(e => `${e.r},${e.c}`);
    const available = edges.filter(p => {
      if (occupied.includes(`${p.r},${p.c}`)) return false;
      return sources.every(s => this.manhattan(s, p) >= 3);
    });

    const placed = [];
    for (let i = 0; i < count && available.length > 0; i++) {
      const idx = Math.floor(Math.random() * available.length);
      placed.push(available[idx]);
      occupied.push(`${available[idx].r},${available[idx].c}`);
      available.splice(idx, 1);
    }
    // Fallback: if not enough valid positions, relax distance constraint
    if (placed.length < count) {
      const fallback = edges.filter(p => !occupied.includes(`${p.r},${p.c}`));
      while (placed.length < count && fallback.length > 0) {
        const idx = Math.floor(Math.random() * fallback.length);
        placed.push(fallback[idx]);
        fallback.splice(idx, 1);
      }
    }
    return placed;
  },

  // Get the facing direction for an edge cell (which side faces inward)
  getEdgeFacing(r, c) {
    const dirs = [];
    if (r === 0) dirs.push(2);  // top edge faces down
    if (r === CONFIG.GRID.rows - 1) dirs.push(0); // bottom edge faces up
    if (c === 0) dirs.push(1);  // left edge faces right
    if (c === CONFIG.GRID.cols - 1) dirs.push(3); // right edge faces left
    return dirs;
  }
};
