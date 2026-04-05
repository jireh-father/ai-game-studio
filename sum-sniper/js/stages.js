// Sum Sniper - Stage Generation with BFS Solvability
const Stages = {
    isAdjacent(a, b) {
        return (Math.abs(a.row - b.row) + Math.abs(a.col - b.col)) === 1;
    },

    generateGrid(stageNum) {
        const diff = getDifficulty(stageNum);
        const grid = [];
        const entropy = Date.now() % 100000;
        const seed = stageNum * 7919 + entropy;
        for (let r = 0; r < GRID.ROWS; r++) {
            grid[r] = [];
            for (let c = 0; c < GRID.COLS; c++) {
                const val = diff.numLow + Math.floor(Math.random() * (diff.numHigh - diff.numLow + 1));
                grid[r][c] = { value: val, multiplier: false, locked: false };
            }
        }
        if (diff.multiplierTiles) {
            for (let i = 0; i < diff.multiplierTiles; i++) {
                const r = Math.floor(Math.random() * GRID.ROWS);
                const c = Math.floor(Math.random() * GRID.COLS);
                grid[r][c].multiplier = true;
            }
        }
        if (diff.lockedTiles) {
            for (let i = 0; i < diff.lockedTiles; i++) {
                const r = Math.floor(Math.random() * GRID.ROWS);
                const c = Math.floor(Math.random() * GRID.COLS);
                if (!grid[r][c].multiplier) grid[r][c].locked = true;
            }
        }
        return grid;
    },

    findAllChains(grid, maxLen) {
        const chains = [];
        const rows = GRID.ROWS, cols = GRID.COLS;
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (grid[r][c].locked) continue;
                const stack = [{ path: [{row: r, col: c}], visited: new Set([r * cols + c]) }];
                while (stack.length > 0) {
                    const { path, visited } = stack.pop();
                    let sum = 0;
                    for (const p of path) {
                        let v = grid[p.row][p.col].value;
                        if (grid[p.row][p.col].multiplier) v *= 2;
                        sum += v;
                    }
                    chains.push({ path: [...path], sum, len: path.length });
                    if (path.length >= maxLen) continue;
                    const last = path[path.length - 1];
                    for (const [dr, dc] of dirs) {
                        const nr = last.row + dr, nc = last.col + dc;
                        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                        const key = nr * cols + nc;
                        if (visited.has(key)) continue;
                        if (grid[nr][nc].locked) continue;
                        const newVisited = new Set(visited);
                        newVisited.add(key);
                        stack.push({ path: [...path, {row: nr, col: nc}], visited: newVisited });
                    }
                }
            }
        }
        return chains;
    },

    selectTarget(grid, stageNum, lastTarget) {
        const diff = getDifficulty(stageNum);
        const isRest = stageNum > 1 && stageNum % 10 === 0;

        if (isRest) {
            for (let r = 0; r < GRID.ROWS; r++) {
                for (let c = 0; c < GRID.COLS; c++) {
                    if (!grid[r][c].locked) return { target: grid[r][c].value, solutions: 1 };
                }
            }
        }

        const maxLen = Math.min(diff.maxChain, 6);
        const chains = this.findAllChains(grid, maxLen);
        const sumMap = new Map();
        for (const chain of chains) {
            if (chain.len < diff.minChain) continue;
            if (!sumMap.has(chain.sum)) sumMap.set(chain.sum, []);
            sumMap.get(chain.sum).push(chain);
        }

        // Weight toward 2-4 cell chains, deprioritize single-cell
        const candidates = [];
        for (const [sum, chainList] of sumMap) {
            if (sum === lastTarget) continue;
            let weight = 1;
            const avgLen = chainList.reduce((a, c) => a + c.len, 0) / chainList.length;
            if (avgLen >= 2 && avgLen <= 4) weight = 5;
            else if (avgLen === 1) weight = 0.5;
            for (let i = 0; i < weight; i++) candidates.push(sum);
        }

        if (candidates.length === 0) {
            // Fallback: any single cell value
            for (let r = 0; r < GRID.ROWS; r++) {
                for (let c = 0; c < GRID.COLS; c++) {
                    if (!grid[r][c].locked) {
                        const v = grid[r][c].multiplier ? grid[r][c].value * 2 : grid[r][c].value;
                        return { target: v, solutions: 1 };
                    }
                }
            }
        }

        const target = candidates[Math.floor(Math.random() * candidates.length)];
        const solutions = sumMap.get(target) ? sumMap.get(target).length : 0;
        return { target, solutions };
    },

    validateChain(grid, chain, target) {
        if (chain.length === 0) return false;
        // Check adjacency
        for (let i = 1; i < chain.length; i++) {
            if (!this.isAdjacent(chain[i - 1], chain[i])) return false;
        }
        // Check no duplicates
        const keys = new Set(chain.map(c => c.row * GRID.COLS + c.col));
        if (keys.size !== chain.length) return false;
        // Calculate sum
        let sum = 0;
        for (const c of chain) {
            let v = grid[c.row][c.col].value;
            if (grid[c.row][c.col].multiplier) v *= 2;
            sum += v;
        }
        return sum === target;
    },

    getChainSum(grid, chain) {
        let sum = 0;
        for (const c of chain) {
            let v = grid[c.row][c.col].value;
            if (grid[c.row][c.col].multiplier) v *= 2;
            sum += v;
        }
        return sum;
    },

    hasNegative(grid, chain) {
        return chain.some(c => grid[c.row][c.col].value < 0);
    },

    generateWithGuarantee(stageNum, lastTarget) {
        for (let attempt = 0; attempt < 10; attempt++) {
            const grid = this.generateGrid(stageNum);
            const result = this.selectTarget(grid, stageNum, lastTarget);
            if (result.solutions > 0) return { grid, target: result.target };
        }
        // Ultimate fallback
        const grid = this.generateGrid(stageNum);
        for (let r = 0; r < GRID.ROWS; r++) {
            for (let c = 0; c < GRID.COLS; c++) {
                if (!grid[r][c].locked) {
                    const v = grid[r][c].multiplier ? grid[r][c].value * 2 : grid[r][c].value;
                    return { grid, target: v };
                }
            }
        }
        return { grid, target: 1 };
    }
};
