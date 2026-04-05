// Wrong Map - Stage Generation
// Generates 7x7 maze rooms with exactly ONE lie tile

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateRoom(roomNumber) {
  const seed = roomNumber * 7919 + (Date.now() % 100000);
  const rng = seededRandom(seed);
  const G = CONFIG.GRID_SIZE;
  const entry = { x: 0, y: G - 1 };
  const exit = { x: G - 1, y: 0 };

  for (let attempt = 0; attempt < 20; attempt++) {
    // Start with all walls: 1 = wall, 0 = floor
    const grid = [];
    for (let y = 0; y < G; y++) {
      grid[y] = [];
      for (let x = 0; x < G; x++) grid[y][x] = 1;
    }

    // Carve main path from entry to exit using biased random walk
    carvePath(grid, entry, exit, rng, G);

    // Add branch corridors
    const branches = CONFIG.BRANCHES(roomNumber);
    for (let b = 0; b < branches; b++) {
      carveBranch(grid, rng, G);
    }

    // Validate a path exists
    if (!bfsPathExists(grid, entry, exit, G)) continue;

    // Find critical path tiles
    const critPath = bfsCriticalPath(grid, entry, exit, G);

    // Select lie tile
    const lie = selectLieTile(grid, critPath, roomNumber, rng, G, entry, exit);
    if (!lie) continue;

    // Create display grid with lie applied
    const displayGrid = grid.map(row => [...row]);
    displayGrid[lie.y][lie.x] = displayGrid[lie.y][lie.x] === 1 ? 0 : 1;

    // Verify room is still solvable via true grid without using lie tile
    if (!bfsPathExists(grid, entry, exit, G)) continue;

    return {
      true_grid: grid,
      display_grid: displayGrid,
      lie_position: lie,
      lie_type: grid[lie.y][lie.x] === 0 ? 'floor_shown_as_wall' : 'wall_shown_as_floor',
      entry: entry,
      exit: exit
    };
  }

  // Fallback: simple room
  return generateFallbackRoom();
}

function carvePath(grid, start, end, rng, G) {
  let x = start.x, y = start.y;
  grid[y][x] = 0;

  while (x !== end.x || y !== end.y) {
    const biasX = end.x > x ? 0.6 : (end.x < x ? 0.2 : 0.4);
    const r = rng();

    if (r < biasX && x !== end.x) {
      x += end.x > x ? 1 : -1;
    } else if (y !== end.y) {
      y += end.y > y ? 1 : -1;
    } else if (x !== end.x) {
      x += end.x > x ? 1 : -1;
    }

    if (x >= 0 && x < G && y >= 0 && y < G) {
      grid[y][x] = 0;
    }
  }
}

function carveBranch(grid, rng, G) {
  // Pick a random floor tile as start
  const floors = [];
  for (let y = 0; y < G; y++)
    for (let x = 0; x < G; x++)
      if (grid[y][x] === 0) floors.push({ x, y });

  if (floors.length === 0) return;
  const start = floors[Math.floor(rng() * floors.length)];
  const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
  let cx = start.x, cy = start.y;
  const len = 2 + Math.floor(rng() * 3);

  for (let i = 0; i < len; i++) {
    const d = dirs[Math.floor(rng() * dirs.length)];
    const nx = cx + d.dx, ny = cy + d.dy;
    if (nx >= 0 && nx < G && ny >= 0 && ny < G) {
      grid[ny][nx] = 0;
      cx = nx;
      cy = ny;
    }
  }
}

function bfsPathExists(grid, start, end, G) {
  const visited = Array.from({ length: G }, () => Array(G).fill(false));
  const queue = [start];
  visited[start.y][start.x] = true;
  const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

  while (queue.length > 0) {
    const c = queue.shift();
    if (c.x === end.x && c.y === end.y) return true;
    for (const d of dirs) {
      const nx = c.x + d.dx, ny = c.y + d.dy;
      if (nx >= 0 && nx < G && ny >= 0 && ny < G && !visited[ny][nx] && grid[ny][nx] === 0) {
        visited[ny][nx] = true;
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return false;
}

function bfsCriticalPath(grid, start, end, G) {
  const visited = Array.from({ length: G }, () => Array(G).fill(false));
  const parent = Array.from({ length: G }, () => Array(G).fill(null));
  const queue = [start];
  visited[start.y][start.x] = true;
  const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

  while (queue.length > 0) {
    const c = queue.shift();
    if (c.x === end.x && c.y === end.y) {
      // Trace path
      const path = [];
      let cur = end;
      while (cur) {
        path.push({ x: cur.x, y: cur.y });
        cur = parent[cur.y][cur.x];
      }
      return path;
    }
    for (const d of dirs) {
      const nx = c.x + d.dx, ny = c.y + d.dy;
      if (nx >= 0 && nx < G && ny >= 0 && ny < G && !visited[ny][nx] && grid[ny][nx] === 0) {
        visited[ny][nx] = true;
        parent[ny][nx] = { x: c.x, y: c.y };
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return [];
}

function selectLieTile(grid, critPath, roomNumber, rng, G, entry, exit) {
  const critSet = new Set(critPath.map(p => p.x + ',' + p.y));
  const candidates = [];

  for (let y = 0; y < G; y++) {
    for (let x = 0; x < G; x++) {
      if (x === entry.x && y === entry.y) continue;
      if (x === exit.x && y === exit.y) continue;

      if (roomNumber <= 3) {
        // Lie = wall adjacent to true path shown as open
        if (grid[y][x] === 1 && isAdjacentToFloor(grid, x, y, G)) {
          candidates.push({ x, y, score: 1 });
        }
      } else if (roomNumber <= 14) {
        // Lie = any open tile NOT on critical path shown as wall
        if (grid[y][x] === 0 && !critSet.has(x + ',' + y)) {
          candidates.push({ x, y, score: lieDifficultyScore(x, y, exit, grid, G) });
        }
        // Also wall tiles for variety
        if (grid[y][x] === 1 && isAdjacentToFloor(grid, x, y, G)) {
          candidates.push({ x, y, score: lieDifficultyScore(x, y, exit, grid, G) });
        }
      } else {
        // Advanced: maximize deception
        if (grid[y][x] === 0 && !critSet.has(x + ',' + y)) {
          candidates.push({ x, y, score: lieDifficultyScore(x, y, exit, grid, G) });
        }
        if (grid[y][x] === 1 && isAdjacentToFloor(grid, x, y, G)) {
          candidates.push({ x, y, score: lieDifficultyScore(x, y, exit, grid, G) });
        }
      }
    }
  }

  if (candidates.length === 0) return null;

  if (roomNumber <= 3) {
    return candidates[Math.floor(rng() * candidates.length)];
  }

  // Pick from top scoring candidates
  candidates.sort((a, b) => b.score - a.score);
  const topN = Math.min(3, candidates.length);
  return candidates[Math.floor(rng() * topN)];
}

function lieDifficultyScore(x, y, exit, grid, G) {
  let score = 0;
  if (Math.abs(x - exit.x) + Math.abs(y - exit.y) <= 2) score += 3;
  const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
  let wallCount = 0;
  for (const d of dirs) {
    const nx = x + d.dx, ny = y + d.dy;
    if (nx < 0 || nx >= G || ny < 0 || ny >= G || grid[ny][nx] === 1) wallCount++;
  }
  if (wallCount >= 3) score += 2;
  return score;
}

function isAdjacentToFloor(grid, x, y, G) {
  const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
  for (const d of dirs) {
    const nx = x + d.dx, ny = y + d.dy;
    if (nx >= 0 && nx < G && ny >= 0 && ny < G && grid[ny][nx] === 0) return true;
  }
  return false;
}

function generateFallbackRoom() {
  const G = CONFIG.GRID_SIZE;
  const grid = [];
  for (let y = 0; y < G; y++) {
    grid[y] = [];
    for (let x = 0; x < G; x++) grid[y][x] = 1;
  }
  // Simple L-path
  for (let x = 0; x < G; x++) grid[G - 1][x] = 0;
  for (let y = 0; y < G; y++) grid[y][G - 1] = 0;
  // Lie: wall at (3,3) shown as floor
  const displayGrid = grid.map(r => [...r]);
  displayGrid[3][3] = 0;
  return {
    true_grid: grid, display_grid: displayGrid,
    lie_position: { x: 3, y: 3 }, lie_type: 'wall_shown_as_floor',
    entry: { x: 0, y: G - 1 }, exit: { x: G - 1, y: 0 }
  };
}

// BFS next step for ghost AI - returns next tile toward target
function bfsNextStep(fromTile, toTile, trueGrid) {
  const G = CONFIG.GRID_SIZE;
  const visited = Array.from({ length: G }, () => Array(G).fill(false));
  const parent = Array.from({ length: G }, () => Array(G).fill(null));
  const queue = [fromTile];
  visited[fromTile.y][fromTile.x] = true;
  const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

  while (queue.length > 0) {
    const c = queue.shift();
    if (c.x === toTile.x && c.y === toTile.y) {
      // Trace back to find first step
      let cur = toTile;
      while (parent[cur.y][cur.x] &&
             !(parent[cur.y][cur.x].x === fromTile.x && parent[cur.y][cur.x].y === fromTile.y)) {
        cur = parent[cur.y][cur.x];
      }
      return { x: cur.x, y: cur.y };
    }
    for (const d of dirs) {
      const nx = c.x + d.dx, ny = c.y + d.dy;
      if (nx >= 0 && nx < G && ny >= 0 && ny < G && !visited[ny][nx] && trueGrid[ny][nx] === 0) {
        visited[ny][nx] = true;
        parent[ny][nx] = { x: c.x, y: c.y };
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return null; // No path
}

// Ghost distance to player in tiles (Manhattan via BFS path length)
function bfsDistance(fromTile, toTile, trueGrid) {
  const G = CONFIG.GRID_SIZE;
  const visited = Array.from({ length: G }, () => Array(G).fill(false));
  const dist = Array.from({ length: G }, () => Array(G).fill(Infinity));
  const queue = [fromTile];
  visited[fromTile.y][fromTile.x] = true;
  dist[fromTile.y][fromTile.x] = 0;
  const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

  while (queue.length > 0) {
    const c = queue.shift();
    if (c.x === toTile.x && c.y === toTile.y) return dist[c.y][c.x];
    for (const d of dirs) {
      const nx = c.x + d.dx, ny = c.y + d.dy;
      if (nx >= 0 && nx < G && ny >= 0 && ny < G && !visited[ny][nx] && trueGrid[ny][nx] === 0) {
        visited[ny][nx] = true;
        dist[ny][nx] = dist[c.y][c.x] + 1;
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return Infinity;
}
