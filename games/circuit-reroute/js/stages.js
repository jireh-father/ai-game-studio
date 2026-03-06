// stages.js - Stage generation algorithm, difficulty scaling

const StageGenerator = {
  generate(stageNumber) {
    const params = getDifficultyParams(stageNumber);
    const { gridSize, scrambleCount, lockedCount } = params;
    const grid = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => ({
        tileType: TILE_TYPES.STRAIGHT, rotation: 0, locked: false,
        isPath: false, isSource: false, isBulb: false, electrified: false
      }))
    );
    const sourceRow = Math.floor(Math.random() * gridSize);
    let bulbRow = Math.floor(Math.random() * gridSize);
    if (stageNumber >= 6 && bulbRow === sourceRow) {
      bulbRow = (sourceRow + 1 + Math.floor(Math.random() * (gridSize - 1))) % gridSize;
    }
    grid[sourceRow][0].isSource = true;
    grid[sourceRow][0].isPath = true;
    grid[bulbRow][gridSize - 1].isBulb = true;
    const path = this._buildSolutionPath(gridSize, sourceRow, bulbRow);
    for (const p of path) { grid[p.row][p.col].isPath = true; }
    this._assignTileTypes(grid, path);
    // Store correct rotation for lock-checking after scramble
    for (const p of path) { grid[p.row][p.col].correctRotation = grid[p.row][p.col].rotation; }
    this._fillDecoys(grid, stageNumber, gridSize);
    this._scrambleTiles(grid, path, scrambleCount);
    this._addLockedTiles(grid, path, lockedCount);
    return { grid, sourceRow, bulbRow, params, path };
  },

  _buildSolutionPath(gridSize, sourceRow, bulbRow) {
    const path = [{ row: sourceRow, col: 0 }];
    let r = sourceRow, c = 0;
    const visited = new Set();
    visited.add(`${r},${c}`);
    while (c < gridSize - 1 || r !== bulbRow) {
      const moves = [];
      if (c < gridSize - 1) moves.push({ row: r, col: c + 1, w: 60 });
      if (r > 0 && !visited.has(`${r - 1},${c}`)) moves.push({ row: r - 1, col: c, w: 20 });
      if (r < gridSize - 1 && !visited.has(`${r + 1},${c}`)) moves.push({ row: r + 1, col: c, w: 20 });
      if (moves.length === 0) { // fallback: move right
        c = Math.min(c + 1, gridSize - 1);
        if (!visited.has(`${r},${c}`)) {
          visited.add(`${r},${c}`);
          path.push({ row: r, col: c });
        }
        continue;
      }
      // If at last column, must move toward bulbRow
      if (c === gridSize - 1) {
        const dir = bulbRow > r ? 1 : -1;
        const nr = r + dir;
        if (!visited.has(`${nr},${c}`)) {
          visited.add(`${nr},${c}`);
          r = nr;
          path.push({ row: r, col: c });
          continue;
        }
      }
      const totalW = moves.reduce((s, m) => s + m.w, 0);
      let rand = Math.random() * totalW;
      let chosen = moves[0];
      for (const m of moves) {
        rand -= m.w;
        if (rand <= 0) { chosen = m; break; }
      }
      r = chosen.row; c = chosen.col;
      visited.add(`${r},${c}`);
      path.push({ row: r, col: c });
      if (path.length > gridSize * gridSize) break; // safety
    }
    // Ensure we end at bulb
    if (r !== bulbRow || c !== gridSize - 1) {
      while (c < gridSize - 1) { c++; if (!visited.has(`${r},${c}`)) path.push({ row: r, col: c }); visited.add(`${r},${c}`); }
      while (r !== bulbRow) { r += bulbRow > r ? 1 : -1; if (!visited.has(`${r},${c}`)) path.push({ row: r, col: c }); visited.add(`${r},${c}`); }
    }
    return path;
  },

  _assignTileTypes(grid, path) {
    for (let i = 0; i < path.length; i++) {
      const { row, col } = path[i];
      const prev = i > 0 ? path[i - 1] : null;
      const next = i < path.length - 1 ? path[i + 1] : null;
      const conns = [false, false, false, false]; // top, right, bottom, left
      if (prev) {
        if (prev.row < row) conns[0] = true;
        if (prev.row > row) conns[2] = true;
        if (prev.col < col) conns[3] = true;
        if (prev.col > col) conns[1] = true;
      }
      if (next) {
        if (next.row < row) conns[0] = true;
        if (next.row > row) conns[2] = true;
        if (next.col > col) conns[1] = true;
        if (next.col < col) conns[3] = true;
      }
      // Source connects to right, bulb connects from left
      if (grid[row][col].isSource && !conns[1] && !next) conns[1] = true;
      if (grid[row][col].isBulb && !conns[3] && !prev) conns[3] = true;
      const { type, rot } = this._findTileForConnections(conns);
      grid[row][col].tileType = type;
      grid[row][col].rotation = rot;
    }
  },

  _findTileForConnections(conns) {
    const count = conns.filter(Boolean).length;
    if (count >= 4) return { type: TILE_TYPES.CROSS, rot: 0 };
    for (const [typeKey, rotations] of Object.entries(TILE_CONNECTIONS)) {
      for (const [rot, c] of Object.entries(rotations)) {
        if (c[0] === conns[0] && c[1] === conns[1] && c[2] === conns[2] && c[3] === conns[3]) {
          return { type: parseInt(typeKey), rot: parseInt(rot) };
        }
      }
    }
    // Fallback: find best match with at least the required connections
    for (const [typeKey, rotations] of Object.entries(TILE_CONNECTIONS)) {
      for (const [rot, c] of Object.entries(rotations)) {
        if (conns.every((v, i) => !v || c[i])) {
          return { type: parseInt(typeKey), rot: parseInt(rot) };
        }
      }
    }
    return { type: TILE_TYPES.STRAIGHT, rot: 0 };
  },

  _fillDecoys(grid, stageNumber, gridSize) {
    const availTypes = [TILE_TYPES.STRAIGHT, TILE_TYPES.ELBOW];
    if (stageNumber >= 6) availTypes.push(TILE_TYPES.T_JUNCTION);
    if (stageNumber >= 11) availTypes.push(TILE_TYPES.CROSS);
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (!grid[r][c].isPath && !grid[r][c].isSource && !grid[r][c].isBulb) {
          const t = availTypes[Math.floor(Math.random() * availTypes.length)];
          const maxRot = t === TILE_TYPES.STRAIGHT ? 2 : (t === TILE_TYPES.CROSS ? 1 : 4);
          grid[r][c].tileType = t;
          grid[r][c].rotation = Math.floor(Math.random() * maxRot);
        }
      }
    }
  },

  _scrambleTiles(grid, path, count) {
    const pathCells = path.filter(p => !grid[p.row][p.col].isSource && !grid[p.row][p.col].isBulb);
    const shuffled = pathCells.sort(() => Math.random() - 0.5);
    const toScramble = shuffled.slice(0, Math.min(count, shuffled.length));
    for (const p of toScramble) {
      const cell = grid[p.row][p.col];
      const origRot = cell.rotation;
      const maxRot = cell.tileType === TILE_TYPES.STRAIGHT ? 2 : (cell.tileType === TILE_TYPES.CROSS ? 1 : 4);
      if (maxRot <= 1) continue;
      let newRot = origRot;
      while (newRot === origRot) { newRot = Math.floor(Math.random() * maxRot); }
      cell.rotation = newRot;
    }
  },

  _addLockedTiles(grid, path, count) {
    if (count <= 0) return;
    const correctCells = path.filter(p => {
      const c = grid[p.row][p.col];
      return !c.isSource && !c.isBulb && c.rotation === c.correctRotation;
    });
    const shuffled = correctCells.sort(() => Math.random() - 0.5);
    let locked = 0;
    for (const p of shuffled) {
      if (locked >= count) break;
      grid[p.row][p.col].locked = true;
      locked++;
    }
  }
};
