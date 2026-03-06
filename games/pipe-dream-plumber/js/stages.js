// stages.js - Grid generation, solvability BFS, difficulty scaling, pipe tray

function getDifficultyParams(stage) {
  const cols = Math.min(4 + Math.floor(stage / 3), 6);
  const rows = Math.min(4 + Math.floor(stage / 4), 8);
  const sources = Math.min(1 + Math.floor(stage / 7), 3);
  const obstacles = Math.min(Math.floor(stage / 3), 6);
  const timer = Math.max(5, 11 - Math.floor(stage / 3));
  const waterSpeed = Math.max(300, 600 - stage * 10);
  const colorMatch = stage >= 11;
  return { cols, rows, sources, obstacles, timer, waterSpeed, colorMatch };
}

function isRestStage(s) { return s > 1 && s % 5 === 0 && s % 10 !== 0; }
function isBossStage(s) { return s > 1 && s % 10 === 0; }

function generateStage(stageNum) {
  let p = getDifficultyParams(stageNum);
  if (isRestStage(stageNum)) {
    p = { cols: 4, rows: 4, sources: 1, obstacles: 0, timer: 12, waterSpeed: 600, colorMatch: false };
  }
  if (isBossStage(stageNum)) {
    p.sources = 4; p.timer = 5;
  }
  const drainCount = p.sources;
  const grid = [];
  for (let r = 0; r < p.rows; r++) {
    grid[r] = [];
    for (let c = 0; c < p.cols; c++) {
      grid[r][c] = { type: 'empty', pipeType: null, rotation: 0, hasWater: false, waterColor: null };
    }
  }
  const sources = placeSources(grid, p.sources, p.rows, p.cols, p.colorMatch);
  const drains = placeDrains(grid, drainCount, p.rows, p.cols, sources, p.colorMatch);
  placeObstacles(grid, p.obstacles, p.rows, p.cols, sources, drains);

  // Validate solvability
  for (let attempt = 0; attempt < 10; attempt++) {
    if (validateSolvability(grid, sources, drains, p.rows, p.cols)) break;
    clearObstacles(grid, p.rows, p.cols);
    placeObstacles(grid, Math.max(0, p.obstacles - attempt), p.rows, p.cols, sources, drains);
  }

  const theme = ROOM_THEMES[stageNum % ROOM_THEMES.length];
  const humor = ROOM_HUMOR[stageNum % ROOM_HUMOR.length];
  return { grid, sources, drains, params: p, theme, humor, stageNum };
}

function placeSources(grid, count, rows, cols, colorMatch) {
  const sources = [];
  const usedRows = new Set();
  for (let i = 0; i < count; i++) {
    let r;
    do { r = Math.floor(Math.random() * rows); } while (usedRows.has(r));
    usedRows.add(r);
    grid[r][0] = { type: 'source', entryDir: DIR.LEFT, colorIdx: i, pipeType: null, rotation: 0, hasWater: false, waterColor: null };
    sources.push({ r, c: 0, colorIdx: i, entryDir: DIR.RIGHT });
  }
  return sources;
}

function placeDrains(grid, count, rows, cols, sources, colorMatch) {
  const drains = [];
  const usedRows = new Set();
  for (let i = 0; i < count; i++) {
    let r;
    do { r = Math.floor(Math.random() * rows); } while (usedRows.has(r));
    usedRows.add(r);
    const colorIdx = colorMatch ? i : 0;
    grid[r][cols - 1] = { type: 'drain', entryDir: DIR.RIGHT, colorIdx, pipeType: null, rotation: 0, hasWater: false, waterColor: null };
    drains.push({ r, c: cols - 1, colorIdx, entryDir: DIR.LEFT });
  }
  return drains;
}

function placeObstacles(grid, count, rows, cols, sources, drains) {
  const reserved = new Set();
  for (const s of sources) {
    reserved.add(`${s.r},${s.c}`);
    for (const [dr, dc] of DIR_DR) {
      const nr = s.r + dr, nc = s.c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) reserved.add(`${nr},${nc}`);
    }
  }
  for (const d of drains) {
    reserved.add(`${d.r},${d.c}`);
    for (const [dr, dc] of DIR_DR) {
      const nr = d.r + dr, nc = d.c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) reserved.add(`${nr},${nc}`);
    }
  }
  let placed = 0;
  for (let tries = 0; tries < 100 && placed < count; tries++) {
    const r = Math.floor(Math.random() * rows);
    const c = 1 + Math.floor(Math.random() * (cols - 2));
    if (!reserved.has(`${r},${c}`) && grid[r][c].type === 'empty') {
      grid[r][c] = { type: 'obstacle', pipeType: null, rotation: 0, hasWater: false, waterColor: null };
      placed++;
    }
  }
}

function clearObstacles(grid, rows, cols) {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c].type === 'obstacle')
        grid[r][c] = { type: 'empty', pipeType: null, rotation: 0, hasWater: false, waterColor: null };
}

function validateSolvability(grid, sources, drains, rows, cols) {
  for (let i = 0; i < sources.length; i++) {
    const src = sources[i];
    const tgt = drains[i] || drains[0];
    if (!bfsReachable(grid, src, tgt, rows, cols)) return false;
  }
  return true;
}

function bfsReachable(grid, src, tgt, rows, cols) {
  const visited = new Set();
  const queue = [{ r: src.r, c: src.c + 1 }]; // Start one cell right of source
  if (queue[0].c >= cols) return false;
  visited.add(`${queue[0].r},${queue[0].c}`);
  while (queue.length > 0) {
    const { r, c } = queue.shift();
    if (r === tgt.r && c === tgt.c) return true;
    for (const [dr, dc] of DIR_DR) {
      const nr = r + dr, nc = c + dc;
      const key = `${nr},${nc}`;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(key)) {
        const cell = grid[nr][nc];
        if (cell.type !== 'obstacle' && cell.type !== 'source') {
          visited.add(key);
          queue.push({ r: nr, c: nc });
        }
      }
    }
  }
  return false;
}

function generateTray(stageNum) {
  let weights;
  if (stageNum <= 6) weights = TRAY_WEIGHTS.early;
  else if (stageNum <= 15) weights = TRAY_WEIGHTS.mid;
  else weights = TRAY_WEIGHTS.late;

  const types = Object.keys(weights);
  const totalW = Object.values(weights).reduce((a, b) => a + b, 0);
  const tray = [];
  for (let i = 0; i < 6; i++) {
    let r = Math.random() * totalW, acc = 0;
    for (const t of types) {
      acc += weights[t];
      if (r <= acc) { tray.push(t); break; }
    }
  }
  return tray;
}

function getRefillDelay(stageNum) {
  return Math.max(800, 1500 - stageNum * 30);
}
