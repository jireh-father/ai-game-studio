// stages.js - Stage config, element generation, board utilities, void/gravity/cleanse logic

function getStageConfig(stageNum) {
  const s = stageNum;
  return {
    voidSpreadInterval: Math.max(2000, 4000 - s * 200),
    mergeTarget: Math.min(40, 8 + s * 2),
    tierWeights: {
      0: Math.max(40, 100 - s * 6),
      1: Math.min(30, s * 4),
      2: Math.min(20, Math.max(0, (s - 6) * 3)),
      3: Math.min(10, Math.max(0, (s - 10) * 2)),
    },
    bossVoidCount: (s % 5 === 0 && s > 0) ? 3 : 0,
  };
}

const TIER_ELEMENTS = {
  0: ['fire', 'water', 'earth', 'air', 'lightning'],
  1: ['magma', 'ice', 'storm', 'mud', 'steam'],
  2: ['obsidian', 'blizzard', 'tornado'],
  3: ['philosopher'],
};

function generateElement(tierWeights) {
  const total = tierWeights[0] + tierWeights[1] + tierWeights[2] + tierWeights[3];
  let roll = Math.random() * total;
  for (let t = 0; t <= 3; t++) {
    roll -= tierWeights[t];
    if (roll <= 0 && tierWeights[t] > 0) {
      const elems = TIER_ELEMENTS[t];
      return elems[Math.floor(Math.random() * elems.length)];
    }
  }
  return TIER_ELEMENTS[0][Math.floor(Math.random() * 5)];
}

function fillEmptyCells(grid, tierWeights) {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (!grid[r][c]) grid[r][c] = {};
      if (grid[r][c].element === null || grid[r][c].element === undefined) {
        grid[r][c].element = generateElement(tierWeights);
      }
    }
  }
  guaranteeSolvability(grid, tierWeights);
}

function guaranteeSolvability(grid, tierWeights) {
  let attempts = 0;
  while (countValidPairs(grid) < 3 && attempts < 50) {
    const r1 = Math.floor(Math.random() * 5), c1 = Math.floor(Math.random() * 5);
    if (grid[r1][c1].element === 'void' || grid[r1][c1].element === 'pure') continue;
    grid[r1][c1].element = generateElement(tierWeights);
    attempts++;
  }
}

function countValidPairs(grid) {
  let count = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    const el = grid[r][c] ? grid[r][c].element : null;
    if (!el || el === 'void' || el === null) continue;
    if (c < 4) { const e2 = grid[r][c+1] ? grid[r][c+1].element : null; if (e2 && e2 !== 'void' && lookupMerge(el, e2)) count++; }
    if (r < 4) { const e2 = grid[r+1][c] ? grid[r+1][c].element : null; if (e2 && e2 !== 'void' && lookupMerge(el, e2)) count++; }
  }
  return count;
}

function findValidMerges(grid) {
  const pairs = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    const el = grid[r][c] ? grid[r][c].element : null;
    if (!el || el === null) continue;
    if (c < 4) { const e2 = grid[r][c+1] ? grid[r][c+1].element : null; if (e2 && lookupMerge(el, e2)) pairs.push({r1:r,c1:c,r2:r,c2:c+1}); }
    if (r < 4) { const e2 = grid[r+1][c] ? grid[r+1][c].element : null; if (e2 && lookupMerge(el, e2)) pairs.push({r1:r,c1:c,r2:r+1,c2:c}); }
  }
  return pairs;
}

// Gravity: tiles fall down to fill empty spaces
function applyGravity(scene, callback) {
  const tweens = [];
  for (let c = 0; c < 5; c++) {
    let writePos = 4;
    for (let readPos = 4; readPos >= 0; readPos--) {
      if (scene.grid[readPos][c].element !== null) {
        if (readPos !== writePos) {
          scene.grid[writePos][c].element = scene.grid[readPos][c].element;
          scene.grid[readPos][c].element = null;
          const oldSp = scene.grid[readPos][c].sprite, oldSym = scene.grid[readPos][c].symbol;
          const np = scene.cellToPixel(writePos, c);
          scene.grid[writePos][c].sprite = oldSp; scene.grid[writePos][c].symbol = oldSym;
          scene.grid[readPos][c].sprite = null; scene.grid[readPos][c].symbol = null;
          if (oldSp) tweens.push({ targets: oldSp, y: np.y, duration: CONFIG.GRAVITY_DURATION, ease: 'Bounce.easeOut' });
          if (oldSym) tweens.push({ targets: oldSym, y: np.y, duration: CONFIG.GRAVITY_DURATION, ease: 'Bounce.easeOut' });
        }
        writePos--;
      }
    }
  }
  if (tweens.length > 0) {
    tweens.forEach(t => scene.tweens.add(t));
    scene.time.delayedCall(CONFIG.GRAVITY_DURATION + 20, () => { if (callback) callback(); });
  } else { if (callback) callback(); }
}

// BFS to find connected void tiles
function bfsVoid(scene, startR, startC) {
  const visited = new Set(), queue = [{ r: startR, c: startC }], result = [];
  while (queue.length > 0) {
    const cur = queue.shift(), key = cur.r + ',' + cur.c;
    if (visited.has(key)) continue;
    visited.add(key);
    if (scene.grid[cur.r][cur.c].element !== 'void') continue;
    result.push(cur);
    for (const a of scene.getAdjacentCells(cur.r, cur.c)) {
      if (!visited.has(a.r + ',' + a.c)) queue.push(a);
    }
  }
  return result;
}

// Attached to GameScene prototype after class definition (in game.js load order)
// These methods are assigned in ui.js which loads after game.js

// Void spread method - attached to GameScene
function gameSpreadVoid() {
  if (this.gameOver || this.paused) return;
  const voidCells = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    if (this.grid[r][c].element === 'void') voidCells.push({ r, c });
  }
  if (voidCells.length === 0) return;
  const src = voidCells[Math.floor(Math.random() * voidCells.length)];
  const adj = this.getAdjacentCells(src.r, src.c);
  const targets = adj.filter(a => { const el = this.grid[a.r][a.c].element; return el && el !== 'void' && el !== null; });
  if (targets.length === 0) return;
  const target = targets[Math.floor(Math.random() * targets.length)];
  this.clearCell(target.r, target.c);
  this.grid[target.r][target.c].element = 'void';
  GameState.voidCount++;
  this.renderTile(target.r, target.c);
  if (this.grid[src.r][src.c].sprite) {
    this.tweens.add({ targets: this.grid[src.r][src.c].sprite, alpha: 0.5, duration: 100, yoyo: true });
  }
  this.hud.updateVoid(GameState.voidCount);
  if (GameState.voidCount >= CONFIG.VOID_DEATH_THRESHOLD) this.triggerGameOver();
}

// Spawn void tile on invalid merge
function gameSpawnVoidTile(r1, c1, r2, c2, elA, elB) {
  this.inputLocked = true;
  const tierA = ELEMENT_DEFS[elA] ? ELEMENT_DEFS[elA].tier : 0;
  const tierB = ELEMENT_DEFS[elB] ? ELEMENT_DEFS[elB].tier : 0;
  let vR, vC;
  if (tierA > tierB) { vR = r1; vC = c1; }
  else if (tierB > tierA) { vR = r2; vC = c2; }
  else { vR = Math.random() < 0.5 ? r1 : r2; vC = (vR === r1) ? c1 : c2; }
  [{r:r1,c:c1},{r:r2,c:c2}].forEach(pos => {
    const sp = this.grid[pos.r][pos.c].sprite;
    if (sp) this.tweens.add({ targets: sp, x: sp.x + 6, duration: 50, yoyo: true, repeat: 3 });
  });
  this.cameras.main.shake(150, 0.004);
  if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
  this.time.delayedCall(200, () => {
    this.clearCell(vR, vC);
    this.grid[vR][vC].element = 'void';
    GameState.voidCount++;
    this.renderTile(vR, vC);
    spawnParticles(this, this.cellToPixel(vR, vC).x, this.cellToPixel(vR, vC).y, COLORS.VOID_PULSE, 10);
    this.hud.updateVoid(GameState.voidCount);
    this.inputLocked = false;
    if (GameState.voidCount >= CONFIG.VOID_DEATH_THRESHOLD) this.triggerGameOver();
  });
}

// Execute cleanse
function gameExecuteCleanse(r1, c1, r2, c2, elA, elB) {
  this.inputLocked = true;
  const pureR = elA === 'pure' ? r1 : r2, pureC = elA === 'pure' ? c1 : c2;
  const voidR = elA === 'void' ? r1 : r2, voidC = elA === 'void' ? c1 : c2;
  const purePos = this.cellToPixel(pureR, pureC);
  const connected = bfsVoid(this, voidR, voidC);
  this.clearCell(pureR, pureC);
  const ring = this.add.circle(purePos.x, purePos.y, 1, 0x000000, 0).setStrokeStyle(3, COLORS.PURE_CRYSTAL).setDepth(20);
  this.tweens.add({ targets: ring, radius: 150, alpha: 0, duration: 400, onComplete: () => ring.destroy() });
  const totalCleansed = connected.length;
  connected.forEach((v, i) => {
    this.time.delayedCall(i * 80, () => {
      this.clearCell(v.r, v.c); this.grid[v.r][v.c].element = null; GameState.voidCount--;
      const vp = this.cellToPixel(v.r, v.c);
      spawnParticles(this, vp.x, vp.y, COLORS.PURE_CRYSTAL, 8);
    });
  });
  this.time.delayedCall(connected.length * 80 + 100, () => {
    let pts = totalCleansed * SCORE_VALUES.CLEANSE_PER_TILE;
    if (totalCleansed >= SCORE_VALUES.MASS_CLEANSE_THRESHOLD) pts += SCORE_VALUES.MASS_CLEANSE_BONUS;
    GameState.score += pts;
    showFloatingText(this, purePos.x, purePos.y, '+' + pts, '#F0F0FF', 20);
    GameState.mergesThisStage++; GameState.mergesSincePure = 0;
    this.hud.updateScore(); this.hud.updateVoid(GameState.voidCount);
    this.hud.updatePure(); this.hud.updateMergeProgress(GameState.mergesThisStage, this.stageConfig.mergeTarget);
    applyGravity(this, () => { this.inputLocked = false; this.checkStageAdvance(); this.checkBoardState(); });
  });
}

// Check stage advance
function gameCheckStageAdvance() {
  if (this.stageTransitioning) return;
  if (GameState.mergesThisStage >= this.stageConfig.mergeTarget) {
    this.stageTransitioning = true;
    GameState.stage++; GameState.mergesThisStage = 0;
    GameState.score += SCORE_VALUES.STAGE_CLEAR_BONUS;
    this.hud.updateScore();
    const st = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'STAGE ' + GameState.stage + '!', {
      fontSize: '36px', fontFamily: 'Arial', color: '#FFB300', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(25).setScale(2);
    this.tweens.add({ targets: st, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });
    showFloatingText(this, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 40, '+500', '#FFD700', 22);
    this.time.delayedCall(CONFIG.STAGE_CLEAR_PAUSE, () => {
      st.destroy();
      this.stageConfig = getStageConfig(GameState.stage);
      this.hud.updateStage(); this.hud.updateMergeProgress(0, this.stageConfig.mergeTarget);
      fillEmptyCells(this.grid, this.stageConfig.tierWeights);
      if (this.stageConfig.bossVoidCount > 0) {
        let placed = 0;
        for (let r = 0; r < 5 && placed < this.stageConfig.bossVoidCount; r++)
          for (let c = 0; c < 5 && placed < this.stageConfig.bossVoidCount; c++)
            if (this.grid[r][c].element !== 'void' && this.grid[r][c].element !== 'pure') {
              this.grid[r][c].element = 'void'; GameState.voidCount++; placed++;
            }
        this.hud.updateVoid(GameState.voidCount);
      }
      this.renderAllTiles(); this.startVoidTimer(); this.stageTransitioning = false;
    });
  }
}

// Check board state for deadlock or empty board
function gameCheckBoardState() {
  const pairs = findValidMerges(this.grid);
  let hasPureAdjacentVoid = false;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    if (this.grid[r][c].element === 'pure') {
      for (const a of this.getAdjacentCells(r, c))
        if (this.grid[a.r][a.c].element === 'void') hasPureAdjacentVoid = true;
    }
  }
  if (pairs.length === 0 && !hasPureAdjacentVoid) {
    let hasEl = false;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      if (this.grid[r][c].element && this.grid[r][c].element !== 'void') hasEl = true;
    }
    if (hasEl) { this.triggerGameOver(true); return; }
  }
  let allEmpty = true;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    if (this.grid[r][c].element !== null) allEmpty = false;
  }
  if (allEmpty) { fillEmptyCells(this.grid, this.stageConfig.tierWeights); this.renderAllTiles(); }
}
