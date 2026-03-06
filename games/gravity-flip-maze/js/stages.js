// stages.js - Maze generation, BFS, rendering helpers

function createEmptyGrid(size) {
    const grid = [];
    for (let r = 0; r < size; r++) {
        grid[r] = [];
        for (let c = 0; c < size; c++)
            grid[r][c] = { north: true, south: true, east: true, west: true, visited: false, content: null };
    }
    return grid;
}

function createRNG(seed) {
    let s = seed | 0;
    return () => { s = (s * 1664525 + 1013904223) & 0x7FFFFFFF; return s / 0x7FFFFFFF; };
}

function generateMaze(size, seed) {
    const grid = createEmptyGrid(size), rng = createRNG(seed), stack = [];
    const sr = Math.floor(rng() * size), sc = Math.floor(rng() * size);
    grid[sr][sc].visited = true; stack.push([sr, sc]);
    while (stack.length > 0) {
        const [r, c] = stack[stack.length - 1], nb = [];
        if (r > 0 && !grid[r-1][c].visited) nb.push([r-1,c,'north','south']);
        if (r < size-1 && !grid[r+1][c].visited) nb.push([r+1,c,'south','north']);
        if (c > 0 && !grid[r][c-1].visited) nb.push([r,c-1,'west','east']);
        if (c < size-1 && !grid[r][c+1].visited) nb.push([r,c+1,'east','west']);
        if (!nb.length) { stack.pop(); continue; }
        const [nr,nc,w1,w2] = nb[Math.floor(rng()*nb.length)];
        grid[r][c][w1] = false; grid[nr][nc][w2] = false;
        grid[nr][nc].visited = true; stack.push([nr, nc]);
    }
    return grid;
}

function removeExtraWalls(grid, pct, rng) {
    const size = grid.length, walls = [];
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
        if (r < size-1 && grid[r][c].south) walls.push([r,c,'south',r+1,c,'north']);
        if (c < size-1 && grid[r][c].east) walls.push([r,c,'east',r,c+1,'west']);
    }
    const n = Math.floor(walls.length * pct / 100);
    for (let i = walls.length-1; i > 0; i--) { const j = Math.floor(rng()*(i+1)); [walls[i],walls[j]] = [walls[j],walls[i]]; }
    for (let i = 0; i < n && i < walls.length; i++) { const [r1,c1,w1,r2,c2,w2] = walls[i]; grid[r1][c1][w1] = false; grid[r2][c2][w2] = false; }
}

function bfs(grid, sr, sc, er, ec) {
    const size = grid.length, vis = Array.from({length:size}, () => new Array(size).fill(false));
    const dist = Array.from({length:size}, () => new Array(size).fill(-1));
    const q = [[sr,sc]]; vis[sr][sc] = true; dist[sr][sc] = 0;
    const dirs = [[-1,0,'north'],[1,0,'south'],[0,-1,'west'],[0,1,'east']];
    let h = 0;
    while (h < q.length) {
        const [r,c] = q[h++];
        if (r === er && c === ec) return dist[r][c];
        for (const [dr,dc,w] of dirs) {
            const nr = r+dr, nc = c+dc;
            if (nr>=0 && nr<size && nc>=0 && nc<size && !vis[nr][nc] && !grid[r][c][w]) { vis[nr][nc]=true; dist[nr][nc]=dist[r][c]+1; q.push([nr,nc]); }
        }
    }
    return -1;
}

function bfsReachable(grid, sr, sc) {
    const size = grid.length, vis = Array.from({length:size}, () => new Array(size).fill(false));
    const q = [[sr,sc]]; vis[sr][sc] = true;
    const dirs = [[-1,0,'north'],[1,0,'south'],[0,-1,'west'],[0,1,'east']];
    let h = 0;
    while (h < q.length) {
        const [r,c] = q[h++];
        for (const [dr,dc,w] of dirs) {
            const nr=r+dr, nc=c+dc;
            if (nr>=0 && nr<size && nc>=0 && nc<size && !vis[nr][nc] && !grid[r][c][w]) { vis[nr][nc]=true; q.push([nr,nc]); }
        }
    }
    return vis;
}

function findSlideDestination(grid, row, col, dir) {
    const size = grid.length;
    const dm = { up:[-1,0,'north'], down:[1,0,'south'], left:[0,-1,'west'], right:[0,1,'east'] };
    const [dr,dc,w] = dm[dir]; let r = row, c = col;
    while (!grid[r][c][w]) { const nr=r+dr, nc=c+dc; if (nr<0||nr>=size||nc<0||nc>=size) break; r=nr; c=nc; }
    return { row: r, col: c };
}

function shuffleArray(arr, rng) {
    for (let i = arr.length-1; i > 0; i--) { const j = Math.floor(rng()*(i+1)); [arr[i],arr[j]] = [arr[j],arr[i]]; }
}

function generateLevel(mazeNumber) {
    const params = getDifficultyParams(mazeNumber), size = params.gridSize, seed = mazeNumber * 7919 + 42;
    let grid, optPath, gems, spikes, phasingWalls, movingSpikes, attempts = 0;
    do {
        const rng = createRNG(seed + attempts * 137);
        grid = generateMaze(size, seed + attempts * 137);
        removeExtraWalls(grid, params.extraWallPct, createRNG(seed + attempts * 251));
        grid[0][0].content = 'entry'; grid[size-1][size-1].content = 'exit';
        optPath = bfs(grid, 0, 0, size-1, size-1);
        if (optPath < 0) { attempts++; continue; }
        const reachable = bfsReachable(grid, 0, 0);
        gems = []; spikes = []; phasingWalls = []; movingSpikes = [];
        const cands = [];
        for (let r = 0; r < size; r++) for (let c = 0; c < size; c++)
            if (reachable[r][c] && !(r===0&&c===0) && !(r===size-1&&c===size-1)) cands.push([r,c]);
        shuffleArray(cands, rng);
        let placed = 0;
        for (const [r,c] of cands) { if (placed >= params.gemCount) break; if (!grid[r][c].content) { grid[r][c].content='gem'; gems.push({r,c}); placed++; } }
        placed = 0;
        for (const [r,c] of cands) { if (placed >= params.spikes) break; if (!grid[r][c].content) { grid[r][c].content='spike'; spikes.push({r,c}); placed++; } }
        if (params.phasingWalls > 0) {
            const wl = [];
            for (let r=0;r<size;r++) for (let c=0;c<size;c++) {
                if (r<size-1 && grid[r][c].south) wl.push({r,c,dir:'south',r2:r+1,c2:c,dir2:'north'});
                if (c<size-1 && grid[r][c].east) wl.push({r,c,dir:'east',r2:r,c2:c+1,dir2:'west'});
            }
            shuffleArray(wl, rng);
            for (let i=0; i<Math.min(params.phasingWalls, wl.length); i++) phasingWalls.push({...wl[i], cycle: params.phaseCycle});
        }
        if (params.movingSpikes > 0) {
            const mc = cands.filter(([r,c]) => !grid[r][c].content);
            for (let i=0; i<Math.min(params.movingSpikes, mc.length); i++) { const [r,c]=mc[i]; movingSpikes.push({r,c,horizontal:rng()>0.5,speed:params.mSpikeSpeed}); }
        }
        if (gems.every(g => reachable[g.r][g.c]) && optPath > 0) break;
        attempts++;
    } while (attempts < 10);
    return { grid, size, gems, spikes, phasingWalls, movingSpikes, entry:{r:0,c:0}, exit:{r:size-1,c:size-1}, par: optPath+2, timer: params.timer, params };
}

// --- Rendering & update helpers ---
function emitParticles(sc, x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const a = (Math.PI*2*i)/count, sp = 100+Math.random()*100;
        const p = sc.add.rectangle(x, y, 4, 4, color).setDepth(10);
        sc.tweens.add({targets:p, x:x+Math.cos(a)*sp*0.4, y:y+Math.sin(a)*sp*0.4, alpha:0, duration:400, onComplete:()=>p.destroy()});
    }
}
function showStars(sc, count) {
    for (let i = 0; i < 3; i++) {
        const s = sc.add.image(155+i*40, 350, i<count?'star':'star_empty').setDisplaySize(36,36).setDepth(12).setAlpha(0).setScale(0);
        sc.tweens.add({targets:s, alpha:1, scaleX:1, scaleY:1, y:320, duration:400, delay:i*200, ease:'Bounce.Out'});
        sc.tweens.add({targets:s, alpha:0, duration:300, delay:GAME_CONFIG.STAR_DISPLAY_MS+i*100, onComplete:()=>s.destroy()});
    }
}
function drawWalls(sc) {
    const {grid,size}=sc.level, cs=sc.cellSize; sc.wallGfx.clear(); sc.wallGfx.lineStyle(3, COLORS.WALL_GLOW, 0.6);
    for (let r=0;r<size;r++) for (let c=0;c<size;c++) {
        const x=sc.offsetX+c*cs, y=sc.offsetY+r*cs, cl=grid[r][c];
        if (cl.north&&r===0) sc.wallGfx.lineBetween(x,y,x+cs,y);
        if (cl.south) sc.wallGfx.lineBetween(x,y+cs,x+cs,y+cs);
        if (cl.west&&c===0) sc.wallGfx.lineBetween(x,y,x,y+cs);
        if (cl.east) sc.wallGfx.lineBetween(x+cs,y,x+cs,y+cs);
    }
}
function renderMaze(sc) {
    const {grid,size}=sc.level, cs=sc.cellSize, gfx=sc.add.graphics(); sc.mazeGroup.add(gfx);
    gfx.fillStyle(COLORS.BG,1); gfx.fillRect(0,0,GAME_CONFIG.GAME_WIDTH,GAME_CONFIG.GAME_HEIGHT);
    gfx.lineStyle(1,COLORS.GRID_LINE,0.3);
    for (let r=0;r<=size;r++) gfx.lineBetween(sc.offsetX,sc.offsetY+r*cs,sc.offsetX+size*cs,sc.offsetY+r*cs);
    for (let c=0;c<=size;c++) gfx.lineBetween(sc.offsetX+c*cs,sc.offsetY,sc.offsetX+c*cs,sc.offsetY+size*cs);
    sc.wallGfx=sc.add.graphics(); sc.mazeGroup.add(sc.wallGfx); drawWalls(sc);
    sc.phasingWallGfx=sc.add.graphics(); sc.mazeGroup.add(sc.phasingWallGfx);
    const ex=sc.offsetX+sc.level.exit.c*cs+cs/2, ey=sc.offsetY+sc.level.exit.r*cs+cs/2;
    sc.exitSprite=sc.add.image(ex,ey,'exit').setDisplaySize(cs*0.7,cs*0.7).setDepth(2); sc.mazeGroup.add(sc.exitSprite);
    sc.tweens.add({targets:sc.exitSprite, angle:360, duration:4000, repeat:-1});
    sc.gemSprites=[]; sc.spikeSprites=[]; sc.movingSpikeObjs=[];
    for (const g of sc.level.gems) {
        const x=sc.offsetX+g.c*cs+cs/2, y=sc.offsetY+g.r*cs+cs/2;
        const spr=sc.add.image(x,y,'gem').setDisplaySize(cs*0.5,cs*0.5).setDepth(3);
        sc.tweens.add({targets:spr,scaleX:spr.scaleX*1.2,scaleY:spr.scaleY*1.2,duration:800,yoyo:true,repeat:-1});
        sc.gemSprites.push({r:g.r,c:g.c,sprite:spr,collected:false}); sc.mazeGroup.add(spr);
    }
    for (const s of sc.level.spikes) {
        const x=sc.offsetX+s.c*cs+cs/2, y=sc.offsetY+s.r*cs+cs/2;
        const spr=sc.add.image(x,y,'spike').setDisplaySize(cs*0.6,cs*0.6).setDepth(3);
        sc.tweens.add({targets:spr,angle:360,duration:3000,repeat:-1});
        sc.spikeSprites.push({r:s.r,c:s.c,sprite:spr}); sc.mazeGroup.add(spr);
    }
    for (const ms of sc.level.movingSpikes) {
        const x=sc.offsetX+ms.c*cs+cs/2, y=sc.offsetY+ms.r*cs+cs/2;
        const spr=sc.add.image(x,y,'spike').setDisplaySize(cs*0.55,cs*0.55).setDepth(3).setTint(0xFF3366);
        sc.mazeGroup.add(spr); sc.movingSpikeObjs.push({...ms,sprite:spr,forward:true,progress:0});
    }
}
function renderGhostTrails(sc) {
    sc.trailGfx.clear(); const now=Date.now(), cs=sc.cellSize;
    sc.ghostTrails=sc.ghostTrails.filter(t=>now-t.time<GAME_CONFIG.GHOST_TRAIL_DURATION);
    for (const t of sc.ghostTrails) {
        const al=0.4*(1-(now-t.time)/GAME_CONFIG.GHOST_TRAIL_DURATION); sc.trailGfx.lineStyle(3,COLORS.GHOST_TRAIL,al);
        sc.trailGfx.lineBetween(sc.offsetX+t.sc*cs+cs/2,sc.offsetY+t.sr*cs+cs/2,sc.offsetX+t.ec*cs+cs/2,sc.offsetY+t.er*cs+cs/2);
    }
}
function updatePhasingWalls(sc, delta) {
    if (!sc.level.phasingWalls.length) return;
    sc.phasingTimer+=delta; const cycle=sc.level.phasingWalls[0].cycle; if (!cycle) return;
    const ns=(sc.phasingTimer%(cycle*2))<cycle;
    if (ns!==sc.phasingState) {
        sc.phasingState=ns;
        for (const pw of sc.level.phasingWalls) { sc.level.grid[pw.r][pw.c][pw.dir]=ns; sc.level.grid[pw.r2][pw.c2][pw.dir2]=ns; }
        drawWalls(sc);
    }
    sc.phasingWallGfx.clear(); const cs=sc.cellSize;
    for (const pw of sc.level.phasingWalls) {
        sc.phasingWallGfx.lineStyle(4,COLORS.PHASE_ACTIVE,sc.phasingState?0.8:0.2);
        if (pw.dir==='south') sc.phasingWallGfx.lineBetween(sc.offsetX+pw.c*cs,sc.offsetY+(pw.r+1)*cs,sc.offsetX+pw.c*cs+cs,sc.offsetY+(pw.r+1)*cs);
        else sc.phasingWallGfx.lineBetween(sc.offsetX+(pw.c+1)*cs,sc.offsetY+pw.r*cs,sc.offsetX+(pw.c+1)*cs,sc.offsetY+pw.r*cs+cs);
    }
}
function updateMovingSpikes(sc, delta) {
    const cs=sc.cellSize, size=sc.level.size;
    for (const ms of sc.movingSpikeObjs) {
        const mv=(ms.speed*delta/1000)/cs; ms.progress+=ms.forward?mv:-mv;
        if (ms.progress>=size-1){ms.progress=size-1;ms.forward=false;} if (ms.progress<=0){ms.progress=0;ms.forward=true;}
        if (ms.horizontal){ms.sprite.x=sc.offsetX+(ms.c+ms.progress)*cs+cs/2;ms.sprite.y=sc.offsetY+ms.r*cs+cs/2;}
        else{ms.sprite.x=sc.offsetX+ms.c*cs+cs/2;ms.sprite.y=sc.offsetY+(ms.r+ms.progress)*cs+cs/2;}
        if (sc.ball&&!sc.gameOver) { const dx=Math.abs(ms.sprite.x-sc.ball.x),dy=Math.abs(ms.sprite.y-sc.ball.y); if(dx<cs*0.35&&dy<cs*0.35) sc.die(); }
    }
}
