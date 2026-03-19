const Stages = {
  getGridSize(stage) {
    if (stage <= 4) return 4;
    if (stage <= 8) return 5;
    if (stage <= 12) return 6;
    if (stage <= 16) return 7;
    return 8;
  },

  getPrePoisonCount(stage) {
    if (stage <= 4) return 0;
    // Rest stages (every 4th) use minimum for tier
    const isRest = stage % 4 === 0;
    const seed = stage * 7919 + (Date.now() % 100000);
    const rng = Stages._seededRandom(seed);
    if (stage <= 8) return isRest ? 1 : 1 + Math.floor(rng() * 2);
    if (stage <= 12) return isRest ? 2 : 2 + Math.floor(rng() * 2);
    if (stage <= 16) return isRest ? 3 : 3 + Math.floor(rng() * 2);
    if (stage <= 20) return isRest ? 4 : 4 + Math.floor(rng() * 3);
    return 4 + Math.floor(rng() * 5);
  },

  getGoalInterval(stage) {
    if (stage <= 8) return 3000;
    if (stage <= 16) return 2500;
    return 2000;
  },

  getGoalWarningDuration(stage) {
    if (stage <= 8) return 600;
    if (stage <= 12) return 500;
    if (stage <= 16) return 400;
    return 300;
  },

  generateStage(stageNum) {
    const gridSize = Stages.getGridSize(stageNum);
    const prePoisonCount = Stages.getPrePoisonCount(stageNum);
    const minDist = gridSize <= 5 ? 3 : 4;

    // Player start: center of grid
    const cx = Math.floor(gridSize / 2);
    const cy = Math.floor(gridSize / 2);
    const playerStart = { col: cx, row: cy };

    for (let attempt = 0; attempt < 20; attempt++) {
      const seed = stageNum * 7919 + attempt * 131 + (Date.now() % 100000);
      const rng = Stages._seededRandom(seed);

      // Place goal at minimum distance
      let goalStart = null;
      for (let g = 0; g < 50; g++) {
        const gc = Math.floor(rng() * gridSize);
        const gr = Math.floor(rng() * gridSize);
        const dist = Math.abs(gc - cx) + Math.abs(gr - cy);
        if (dist >= minDist) {
          goalStart = { col: gc, row: gr };
          break;
        }
      }
      if (!goalStart) continue;

      // Place pre-poisoned tiles
      const prePoisoned = [];
      const forbidden = new Set();
      forbidden.add(`${cx},${cy}`);
      forbidden.add(`${goalStart.col},${goalStart.row}`);
      // Adjacent to player
      const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
      for (const [dc, dr] of dirs) {
        const nc = cx + dc, nr = cy + dr;
        if (nc >= 0 && nc < gridSize && nr >= 0 && nr < gridSize) {
          forbidden.add(`${nc},${nr}`);
        }
      }

      const maxPoison = Math.min(prePoisonCount, gridSize * gridSize - 10);
      for (let p = 0; p < maxPoison; p++) {
        for (let t = 0; t < 50; t++) {
          const pc = Math.floor(rng() * gridSize);
          const pr = Math.floor(rng() * gridSize);
          const key = `${pc},${pr}`;
          if (!forbidden.has(key) && !prePoisoned.some(pp => pp.col === pc && pp.row === pr)) {
            prePoisoned.push({ col: pc, row: pr });
            break;
          }
        }
      }

      // BFS solvability check
      const blocked = new Set(prePoisoned.map(p => `${p.col},${p.row}`));
      if (Stages.bfsPathExists(gridSize, blocked, playerStart, goalStart)) {
        return { gridSize, playerStart, goalStart, prePoisonedTiles: prePoisoned };
      }

      // If not solvable after 10 attempts, reduce poison count
      if (attempt === 10 && prePoisoned.length > 0) {
        prePoisoned.pop();
        const blocked2 = new Set(prePoisoned.map(p => `${p.col},${p.row}`));
        if (Stages.bfsPathExists(gridSize, blocked2, playerStart, goalStart)) {
          return { gridSize, playerStart, goalStart, prePoisonedTiles: prePoisoned };
        }
      }
    }

    // Fallback: no pre-poisoned tiles
    return {
      gridSize,
      playerStart,
      goalStart: { col: 0, row: 0 },
      prePoisonedTiles: []
    };
  },

  bfsPathExists(gridSize, blocked, start, goal) {
    const key = (c, r) => `${c},${r}`;
    if (blocked.has(key(start.col, start.row)) || blocked.has(key(goal.col, goal.row))) return false;
    const visited = new Set();
    const queue = [start];
    visited.add(key(start.col, start.row));
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur.col === goal.col && cur.row === goal.row) return true;
      for (const [dc, dr] of dirs) {
        const nc = cur.col + dc, nr = cur.row + dr;
        const k = key(nc, nr);
        if (nc >= 0 && nc < gridSize && nr >= 0 && nr < gridSize && !visited.has(k) && !blocked.has(k)) {
          visited.add(k);
          queue.push({ col: nc, row: nr });
        }
      }
    }
    return false;
  },

  advanceGoalOneStep(goalPos, playerPos, gridSize, blocked) {
    // A* one step toward player, avoiding blocked tiles
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    let bestPos = goalPos;
    let bestDist = Infinity;
    for (const [dc, dr] of dirs) {
      const nc = goalPos.col + dc, nr = goalPos.row + dr;
      if (nc < 0 || nc >= gridSize || nr < 0 || nr >= gridSize) continue;
      if (blocked.has(`${nc},${nr}`)) continue;
      const dist = Math.abs(nc - playerPos.col) + Math.abs(nr - playerPos.row);
      if (dist < bestDist) {
        bestDist = dist;
        bestPos = { col: nc, row: nr };
      }
    }
    return bestPos;
  },

  _seededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
};
