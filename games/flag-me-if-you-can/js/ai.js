// ai.js - AI logic engine for Flag Me If You Can
// AI never reads player mine position directly. Only reads grid displayNumber and revealed state.
window.AIEngine = {
  // Pick next cell to reveal based on tier
  pickNextReveal(grid, tier, aiEdge) {
    const rows = grid.length, cols = grid[0].length;
    // Collect unrevealed non-wall cells
    const unrevealed = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const c = grid[y][x];
        if (!c.revealed && !c.isWall && !c.flagged) unrevealed.push(c);
      }
    }
    if (unrevealed.length === 0) return null;

    if (tier === 'linear') {
      // Advance inward from edge in order
      return this.linearPick(grid, aiEdge, unrevealed);
    } else if (tier === 'chain') {
      // Constraint propagation: reveal a cell adjacent to a number if that number is satisfied
      const safe = this.findSafeCell(grid);
      if (safe) return safe;
      return this.linearPick(grid, aiEdge, unrevealed);
    } else {
      // probability / bayesian: pick lowest probability
      return this.probabilityPick(grid, unrevealed);
    }
  },
  linearPick(grid, edge, unrevealed) {
    const rows = grid.length, cols = grid[0].length;
    // Sort by distance from starting edge
    unrevealed.sort((a, b) => {
      const da = edge === 0 ? a.y : edge === 1 ? (rows - a.y) : edge === 2 ? a.x : (cols - a.x);
      const db = edge === 0 ? b.y : edge === 1 ? (rows - b.y) : edge === 2 ? b.x : (cols - b.x);
      if (da !== db) return da - db;
      return (a.x + a.y) - (b.x + b.y);
    });
    // Prefer cells adjacent to revealed
    for (const c of unrevealed) {
      if (this.hasRevealedNeighbor(grid, c.x, c.y)) return c;
    }
    return unrevealed[0];
  },
  hasRevealedNeighbor(grid, x, y) {
    const rows = grid.length, cols = grid[0].length;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        if (grid[ny][nx].revealed) return true;
      }
    }
    return false;
  },
  // Find a cell that chain deduction says is safe
  findSafeCell(grid) {
    const rows = grid.length, cols = grid[0].length;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const c = grid[y][x];
        if (!c.revealed || c.isWall) continue;
        const neighbors = this.getNeighbors(grid, x, y);
        const unrev = neighbors.filter(n => !n.revealed && !n.isWall && !n.flagged);
        const flagged = neighbors.filter(n => n.flagged);
        if (unrev.length > 0 && c.displayNumber - flagged.length === 0) {
          return unrev[0]; // safe
        }
      }
    }
    return null;
  },
  getNeighbors(grid, x, y) {
    const rows = grid.length, cols = grid[0].length;
    const out = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        out.push(grid[ny][nx]);
      }
    }
    return out;
  },
  probabilityPick(grid, unrevealed) {
    // Assign probability to each unrevealed cell based on adjacent number constraints
    let best = null, bestP = Infinity;
    for (const c of unrevealed) {
      const p = this.calculateCellProb(grid, c);
      if (p < bestP) { bestP = p; best = c; }
    }
    return best || unrevealed[0];
  },
  calculateCellProb(grid, cell) {
    const neighbors = this.getNeighbors(grid, cell.x, cell.y);
    const revealedNums = neighbors.filter(n => n.revealed && n.displayNumber > 0);
    if (revealedNums.length === 0) return 0.15;
    let maxP = 0;
    for (const n of revealedNums) {
      const nns = this.getNeighbors(grid, n.x, n.y);
      const unrev = nns.filter(x => !x.revealed && !x.isWall && !x.flagged);
      const flagged = nns.filter(x => x.flagged);
      if (unrev.length === 0) continue;
      const remaining = n.displayNumber - flagged.length;
      const p = remaining / unrev.length;
      if (p > maxP) maxP = p;
    }
    return maxP;
  },
  // Decide whether to flag a cell. Returns {x, y, correct} or null.
  // AI "believes" mine is at cell with highest probability; flags when threshold passed.
  pickFlag(grid, tier, playerX, playerY) {
    const rows = grid.length, cols = grid[0].length;
    const candidates = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const c = grid[y][x];
        if (c.revealed || c.isWall || c.flagged) continue;
        const p = this.calculateCellProb(grid, c);
        candidates.push({ x, y, p });
      }
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.p - a.p);
    const threshold = tier === 'linear' ? 0.5 : tier === 'chain' ? 0.55 : tier === 'probability' ? 0.6 : 0.7;
    const best = candidates[0];
    if (best.p < threshold) return null;
    const correct = (best.x === playerX && best.y === playerY);
    return { x: best.x, y: best.y, correct };
  }
};
