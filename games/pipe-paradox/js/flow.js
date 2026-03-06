// flow.js - Flow simulation, pressure system, pipe connection logic

const FlowEngine = {
  // Get pipe connections considering rotation, returns [top, right, bottom, left]
  getConnections(grid, r, c) {
    const cell = grid[r][c];
    if (cell.type === 'empty') return [0, 0, 0, 0];
    if (cell.isSource || cell.isDrain) return [1, 1, 1, 1];
    const conns = CONFIG.PIPE_CONNECTIONS[cell.type];
    if (!conns) return [0, 0, 0, 0];
    const rot = cell.rotation % conns.length;
    return conns[rot];
  },

  // Check if two adjacent cells connect
  cellsConnect(grid, r1, c1, r2, c2) {
    const c1Conn = this.getConnections(grid, r1, c1);
    const c2Conn = this.getConnections(grid, r2, c2);
    if (r2 === r1 - 1) return c1Conn[0] && c2Conn[2]; // above
    if (c2 === c1 + 1) return c1Conn[1] && c2Conn[3]; // right
    if (r2 === r1 + 1) return c1Conn[2] && c2Conn[0]; // below
    if (c2 === c1 - 1) return c1Conn[3] && c2Conn[1]; // left
    return false;
  },

  // Check flow direction considering active rules
  shouldFlowTo(grid, activeRules, fromR, fromC, toR, toC) {
    if (!this.cellsConnect(grid, fromR, fromC, toR, toC)) return false;
    for (const rule of activeRules) {
      if (rule.id === 2 && toR < fromR) return false;  // Gravity: no upward
      if (rule.id === 3 && toR > fromR) return false;  // Anti-gravity: no downward
      if (rule.id === 4 && grid[toR][toC].type === 'tjunction') return false; // T-blockade
    }
    return true;
  },

  // BFS flow simulation from sources
  simulate(grid, sources, drains, activeRules, scoreCallback) {
    const G = CONFIG.GRID;
    // Reset flow states
    for (let r = 0; r < G.rows; r++) {
      for (let c = 0; c < G.cols; c++) {
        if (!grid[r][c].isSource && !grid[r][c].isDrain) {
          grid[r][c].flowState = 'EMPTY';
        }
      }
    }

    // Handle reverse flow rule
    let effSources = sources, effDrains = drains;
    if (activeRules.some(r => r.id === 1)) {
      effSources = drains; effDrains = sources;
    }

    // BFS from each source
    const visited = new Set();
    const queue = [];
    effSources.forEach(s => {
      queue.push({ r: s.r, c: s.c, depth: 0 });
      visited.add(`${s.r},${s.c}`);
    });

    while (queue.length > 0) {
      const { r, c, depth } = queue.shift();
      const neighbors = [[-1, 0], [0, 1], [1, 0], [0, -1]];
      for (const [dr, dc] of neighbors) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= G.rows || nc < 0 || nc >= G.cols) continue;
        const key = `${nr},${nc}`;
        if (visited.has(key)) continue;
        if (grid[nr][nc].type === 'empty') continue;

        if (this.shouldFlowTo(grid, activeRules, r, c, nr, nc)) {
          visited.add(key);
          grid[nr][nc].flowState = 'FLOWING';
          queue.push({ r: nr, c: nc, depth: depth + 1 });

          // Check if drain reached
          const isDrain = effDrains.some(d => d.r === nr && d.c === nc);
          if (isDrain && !grid[nr][nc]._scored) {
            grid[nr][nc]._scored = true;
            const pts = depth >= CONFIG.SCORE.LONG_ROUTE_MIN
              ? Math.floor(CONFIG.SCORE.FLOW_REACH_DRAIN * CONFIG.SCORE.LONG_ROUTE_MULT)
              : CONFIG.SCORE.FLOW_REACH_DRAIN;
            if (scoreCallback) scoreCallback(nr, nc, pts);
          }
        }
      }
    }

    // Mark blocked pipes
    for (let r = 0; r < G.rows; r++) {
      for (let c = 0; c < G.cols; c++) {
        const cell = grid[r][c];
        if (cell.type !== 'empty' && !cell.isSource && !cell.isDrain && cell.flowState === 'FLOWING') {
          const conn = this.getConnections(grid, r, c);
          const dirs = [[-1,0],[0,1],[1,0],[0,-1]];
          let hasDeadEnd = false;
          for (let d = 0; d < 4; d++) {
            if (conn[d]) {
              const nr2 = r + dirs[d][0], nc2 = c + dirs[d][1];
              if (nr2 < 0 || nr2 >= G.rows || nc2 < 0 || nc2 >= G.cols) { hasDeadEnd = true; continue; }
              if (grid[nr2][nc2].type === 'empty') hasDeadEnd = true;
              else if (!this.cellsConnect(grid, r, c, nr2, nc2)) hasDeadEnd = true;
            }
          }
          if (hasDeadEnd) cell.flowState = 'BLOCKED';
        }
      }
    }
  },

  // Update pressure on all cells
  updatePressure(grid, dt, mult, sources) {
    const G = CONFIG.GRID, rate = CONFIG.DIFFICULTY.BASE_PRESSURE_RATE;
    for (let r = 0; r < G.rows; r++) {
      for (let c = 0; c < G.cols; c++) {
        const cell = grid[r][c];
        if (cell.isSource && cell.flowState !== 'FLOWING') {
          cell.pressure = Math.min(100, cell.pressure + rate * dt * mult);
        } else if (cell.flowState === 'BLOCKED') {
          cell.pressure = Math.min(100, cell.pressure + rate * dt * mult);
        } else if (cell.flowState === 'FLOWING') {
          cell.pressure = Math.max(0, cell.pressure - CONFIG.DIFFICULTY.PRESSURE_DECAY * dt);
        } else if (cell.type !== 'empty' && !cell.isDrain) {
          cell.pressure = Math.max(0, cell.pressure - CONFIG.DIFFICULTY.PRESSURE_DECAY * dt * 0.5);
        }
      }
    }
  },

  // Find first cell with 100% pressure
  findOverflow(grid) {
    const G = CONFIG.GRID;
    for (let r = 0; r < G.rows; r++) {
      for (let c = 0; c < G.cols; c++) {
        if (grid[r][c].pressure >= 100 && grid[r][c].type !== 'empty') {
          return { r, c };
        }
      }
    }
    return null;
  },

  // Update pipe visuals: tint for pressure, fog alpha, pressure bars
  updateVisuals(scene, grid, activeRules, cellCenterFn) {
    const G = CONFIG.GRID, isFog = activeRules.some(r => r.id === 8);
    for (let r = 0; r < G.rows; r++) {
      for (let c = 0; c < G.cols; c++) {
        const cell = grid[r][c];
        if (cell.sprite && !cell.isSource && !cell.isDrain && cell.type !== 'empty') {
          cell.sprite.setAlpha(isFog ? 0.3 : 1);
          if (cell.pressure > 80) cell.sprite.setTint(0xFF0000);
          else if (cell.pressure > 50) cell.sprite.setTint(0xFF8C00);
          else cell.sprite.clearTint();
        }
        if (cell.pressure > 0 && cell.type !== 'empty') {
          const pos = cellCenterFn(r, c);
          if (!cell.pressBar) cell.pressBar = scene.add.rectangle(pos.x-24, pos.y+26, 0, 4, 0xFF8C00).setOrigin(0, 0.5);
          cell.pressBar.setDisplaySize(48*(cell.pressure/100), 4);
          cell.pressBar.setFillStyle(cell.pressure > 80 ? 0xFF0000 : cell.pressure > 50 ? 0xFF8C00 : 0x4FC3F7);
        } else if (cell.pressBar) { cell.pressBar.destroy(); cell.pressBar = null; }
      }
    }
  }
};
