// stages.js - Stage generation for Flag Me If You Can
window.Stages = {
  getStageParams(stage) {
    const cols = Math.min(6 + Math.floor((stage - 1) / 2), 10);
    const rows = Math.min(6 + Math.floor((stage - 1) / 3), 12);
    const aiInterval = Math.max(2000 - (stage - 1) * 40, 600);
    const corruptionTarget = Math.min(3 + Math.floor((stage - 1) * 0.8), 12);
    const decoyCooldown = Math.min(8000 + (stage - 1) * 200, 20000);
    const wallCount = stage < 11 ? 0 : Math.min(Math.floor(stage / 5), 4);
    const mineCount = Math.floor(cols * rows * 0.13);
    const aiTier = stage < 6 ? 'linear' : stage < 16 ? 'chain' : stage < 26 ? 'probability' : 'bayesian';
    const directions = stage < 10 ? 4 : 8;
    return { cols, rows, aiInterval, corruptionTarget, decoyCooldown, wallCount, mineCount, aiTier, directions };
  },
  generateStage(stage) {
    const p = this.getStageParams(stage);
    const seed = stage * 7919 + (Date.now() % 100000);
    let rng = seed;
    const rand = () => { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; };
    // grid: 2D array of cell objects
    const grid = [];
    for (let y = 0; y < p.rows; y++) {
      const row = [];
      for (let x = 0; x < p.cols; x++) {
        row.push({ x, y, isMine: false, isWall: false, revealed: false, displayNumber: 0, trueNumber: 0, flagged: null, corrupted: false });
      }
      grid.push(row);
    }
    // walls
    let placed = 0;
    while (placed < p.wallCount) {
      const x = Math.floor(rand() * p.cols), y = Math.floor(rand() * p.rows);
      const cx = Math.floor(p.cols / 2), cy = Math.floor(p.rows / 2);
      if (Math.abs(x - cx) <= 1 && Math.abs(y - cy) <= 1) continue;
      if (!grid[y][x].isWall) { grid[y][x].isWall = true; placed++; }
    }
    // place background mines (not player mine)
    const mineStartX = Math.floor(p.cols / 2);
    const mineStartY = Math.floor(p.rows / 2);
    placed = 0;
    let tries = 0;
    while (placed < p.mineCount && tries < 500) {
      tries++;
      const x = Math.floor(rand() * p.cols), y = Math.floor(rand() * p.rows);
      if (Math.abs(x - mineStartX) <= 1 && Math.abs(y - mineStartY) <= 1) continue;
      const c = grid[y][x];
      if (!c.isMine && !c.isWall) { c.isMine = true; placed++; }
    }
    // compute numbers
    for (let y = 0; y < p.rows; y++) {
      for (let x = 0; x < p.cols; x++) {
        const c = grid[y][x];
        if (c.isMine || c.isWall) continue;
        let cnt = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= p.cols || ny >= p.rows) continue;
            if (grid[ny][nx].isMine) cnt++;
          }
        }
        c.trueNumber = cnt;
        c.displayNumber = cnt;
      }
    }
    // pre-reveal a few safe number cells near edges (AI starting point)
    const aiEdge = Math.floor(rand() * 4);
    const preReveal = [];
    for (let i = 0; i < p.cols; i++) {
      let rx, ry;
      if (aiEdge === 0) { rx = i; ry = 0; }
      else if (aiEdge === 1) { rx = i; ry = p.rows - 1; }
      else if (aiEdge === 2) { rx = 0; ry = i % p.rows; }
      else { rx = p.cols - 1; ry = i % p.rows; }
      if (rx < p.cols && ry < p.rows) {
        const c = grid[ry][rx];
        if (!c.isMine && !c.isWall) { c.revealed = true; preReveal.push({ x: rx, y: ry }); }
      }
    }
    return { grid, params: p, mineStart: { x: mineStartX, y: mineStartY }, aiEdge, preReveal };
  }
};
