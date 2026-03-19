// stages.js — Stage generation, tile management, removal scheduling

class StageManager {
  constructor() {
    this.grid = [];
    this.tileSprites = [];
    this.gridSize = 7;
    this.removalTimer = null;
    this.warningTimer = null;
    this.cycle = 0;
    this.params = null;
    this.scene = null;
    this.gridOriginX = 0;
    this.gridOriginY = 0;
    this.activeTileCount = 0;
  }

  init(scene, stageNumber) {
    this.scene = scene;
    this.cycle = 0;
    this.params = getDifficultyParams(stageNumber);
    this.gridSize = this.params.gridSize;
    this.clearTimers();
    this.buildGrid();
    return this.params;
  }

  buildGrid() {
    // Destroy old sprites
    this.tileSprites.forEach(row => row.forEach(s => { if (s) s.destroy(); }));
    this.grid = [];
    this.tileSprites = [];
    this.activeTileCount = 0;

    const tileStep = GRID_CONFIG.TILE_SIZE + GRID_CONFIG.GROUT;
    const totalWidth = this.gridSize * tileStep - GRID_CONFIG.GROUT;
    const totalHeight = this.gridSize * tileStep - GRID_CONFIG.GROUT;
    this.gridOriginX = (GAME_WIDTH - totalWidth) / 2;
    this.gridOriginY = (GAME_HEIGHT - totalHeight) / 2 + 24;

    for (let r = 0; r < this.gridSize; r++) {
      this.grid[r] = [];
      this.tileSprites[r] = [];
      for (let c = 0; c < this.gridSize; c++) {
        this.grid[r][c] = true;
        const x = this.gridOriginX + c * tileStep + GRID_CONFIG.TILE_SIZE / 2;
        const y = this.gridOriginY + r * tileStep + GRID_CONFIG.TILE_SIZE / 2;
        const tile = this.scene.add.image(x, y, 'tile-normal')
          .setDisplaySize(GRID_CONFIG.TILE_SIZE, GRID_CONFIG.TILE_SIZE);
        this.tileSprites[r][c] = tile;
        this.activeTileCount++;
      }
    }
  }

  rebuildForContinue() {
    // Rebuild a 4x4 grid for ad-continue
    this.clearTimers();
    this.tileSprites.forEach(row => row.forEach(s => { if (s) s.destroy(); }));
    this.grid = [];
    this.tileSprites = [];
    this.activeTileCount = 0;
    this.gridSize = 4;
    this.cycle = 0;

    const tileStep = GRID_CONFIG.TILE_SIZE + GRID_CONFIG.GROUT;
    const totalWidth = this.gridSize * tileStep - GRID_CONFIG.GROUT;
    const totalHeight = this.gridSize * tileStep - GRID_CONFIG.GROUT;
    this.gridOriginX = (GAME_WIDTH - totalWidth) / 2;
    this.gridOriginY = (GAME_HEIGHT - totalHeight) / 2 + 24;

    for (let r = 0; r < this.gridSize; r++) {
      this.grid[r] = [];
      this.tileSprites[r] = [];
      for (let c = 0; c < this.gridSize; c++) {
        this.grid[r][c] = true;
        const x = this.gridOriginX + c * tileStep + GRID_CONFIG.TILE_SIZE / 2;
        const y = this.gridOriginY + r * tileStep + GRID_CONFIG.TILE_SIZE / 2;
        const tile = this.scene.add.image(x, y, 'tile-normal')
          .setDisplaySize(GRID_CONFIG.TILE_SIZE, GRID_CONFIG.TILE_SIZE);
        tile.setScale(0);
        this.scene.tweens.add({
          targets: tile, scaleX: 1, scaleY: 1, duration: 200,
          delay: (r * this.gridSize + c) * 60, ease: 'Back.easeOut'
        });
        this.tileSprites[r][c] = tile;
        this.activeTileCount++;
      }
    }
  }

  getPerformerSpawnPos() {
    const center = Math.floor(this.gridSize / 2);
    const tileStep = GRID_CONFIG.TILE_SIZE + GRID_CONFIG.GROUT;
    return {
      x: this.gridOriginX + center * tileStep + GRID_CONFIG.TILE_SIZE / 2,
      y: this.gridOriginY + center * tileStep + GRID_CONFIG.TILE_SIZE / 2
    };
  }

  startRemovals() {
    this.scheduleNextCycle();
  }

  scheduleNextCycle() {
    const warnTime = Math.min(500, this.params.removalInterval - 100);
    this.warningTimer = setTimeout(() => {
      const tiles = this.getNextTilesToRemove();
      this.warnTiles(tiles);
      this.removalTimer = setTimeout(() => {
        this.removeTiles(tiles);
        this.cycle++;
        if (this.activeTileCount > GRID_CONFIG.CLEAR_GRID * GRID_CONFIG.CLEAR_GRID) {
          this.scheduleNextCycle();
        }
      }, warnTime);
    }, this.params.removalInterval - warnTime);
  }

  getEdgeTiles() {
    const edges = [];
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (!this.grid[r] || !this.grid[r][c]) continue;
        const isEdge = r === 0 || c === 0 || r === this.gridSize - 1 || c === this.gridSize - 1 ||
          !this.grid[r - 1]?.[c] || !this.grid[r + 1]?.[c] ||
          !this.grid[r]?.[c - 1] || !this.grid[r]?.[c + 1];
        if (isEdge) edges.push({ r, c });
      }
    }
    return edges;
  }

  seededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  getNextTilesToRemove() {
    const edges = this.getEdgeTiles();
    const seed = (this.scene.currentStage || 1) * 7919 + this.cycle * 131 + (Date.now() % 100000);
    const rng = this.seededRandom(seed);

    // Shuffle edges
    for (let i = edges.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [edges[i], edges[j]] = [edges[j], edges[i]];
    }

    const count = Math.min(this.params.tilesPerCycle, edges.length);
    const toRemove = edges.slice(0, count);

    // Center removal chance
    if (this.params.centerRemoveChance > 0 && rng() < this.params.centerRemoveChance) {
      const nonEdges = [];
      for (let r = 0; r < this.gridSize; r++) {
        for (let c = 0; c < this.gridSize; c++) {
          if (this.grid[r]?.[c] && !toRemove.find(t => t.r === r && t.c === c)) {
            const isEdge = edges.find(e => e.r === r && e.c === c);
            if (!isEdge) nonEdges.push({ r, c });
          }
        }
      }
      if (nonEdges.length > 0) {
        toRemove.push(nonEdges[Math.floor(rng() * nonEdges.length)]);
      }
    }

    // Guard: don't remove if it would leave less than 3x3
    const remaining = this.activeTileCount - toRemove.length;
    if (remaining < GRID_CONFIG.CLEAR_GRID * GRID_CONFIG.CLEAR_GRID) {
      return toRemove.slice(0, Math.max(0, this.activeTileCount - GRID_CONFIG.CLEAR_GRID * GRID_CONFIG.CLEAR_GRID));
    }

    return toRemove;
  }

  warnTiles(tiles) {
    tiles.forEach(({ r, c }) => {
      const sprite = this.tileSprites[r]?.[c];
      if (sprite && sprite.active) {
        sprite.setTexture('tile-warning');
        sprite.setDisplaySize(GRID_CONFIG.TILE_SIZE, GRID_CONFIG.TILE_SIZE);
        this.scene.tweens.add({
          targets: sprite, alpha: 0.5, duration: 125, yoyo: true, repeat: 1
        });
      }
    });
  }

  removeTiles(tiles) {
    tiles.forEach(({ r, c }) => {
      if (!this.grid[r]?.[c]) return;
      this.grid[r][c] = false;
      this.activeTileCount--;
      const sprite = this.tileSprites[r]?.[c];
      if (sprite && sprite.active) {
        this.scene.tweens.add({
          targets: sprite, y: sprite.y + 120, alpha: 0, duration: 300,
          ease: 'Power2',
          onComplete: () => { sprite.destroy(); this.tileSprites[r][c] = null; }
        });
      }
    });

    // Check stage clear
    if (this.activeTileCount <= GRID_CONFIG.CLEAR_GRID * GRID_CONFIG.CLEAR_GRID) {
      this.clearTimers();
      if (this.scene.onStageComplete) this.scene.onStageComplete();
    }
  }

  isTileAt(worldX, worldY) {
    const tileStep = GRID_CONFIG.TILE_SIZE + GRID_CONFIG.GROUT;
    const col = Math.floor((worldX - this.gridOriginX) / tileStep);
    const row = Math.floor((worldY - this.gridOriginY) / tileStep);
    if (row < 0 || col < 0 || row >= this.gridSize || col >= this.gridSize) return false;
    return this.grid[row]?.[col] === true;
  }

  getNearestGapDist(worldX, worldY) {
    const tileStep = GRID_CONFIG.TILE_SIZE + GRID_CONFIG.GROUT;
    const col = Math.floor((worldX - this.gridOriginX) / tileStep);
    const row = Math.floor((worldY - this.gridOriginY) / tileStep);
    let minDist = 9999;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        const isGap = nr < 0 || nc < 0 || nr >= this.gridSize || nc >= this.gridSize || !this.grid[nr]?.[nc];
        if (isGap) {
          const gapCenterX = this.gridOriginX + (col + dc) * tileStep + GRID_CONFIG.TILE_SIZE / 2;
          const gapCenterY = this.gridOriginY + (row + dr) * tileStep + GRID_CONFIG.TILE_SIZE / 2;
          const dist = Math.sqrt((worldX - gapCenterX) ** 2 + (worldY - gapCenterY) ** 2);
          if (dist < minDist) minDist = dist;
        }
      }
    }

    // Also check distance to grid edges
    const leftEdge = this.gridOriginX;
    const rightEdge = this.gridOriginX + this.gridSize * tileStep - GRID_CONFIG.GROUT;
    const topEdge = this.gridOriginY;
    const bottomEdge = this.gridOriginY + this.gridSize * tileStep - GRID_CONFIG.GROUT;
    minDist = Math.min(minDist, worldX - leftEdge, rightEdge - worldX, worldY - topEdge, bottomEdge - worldY);

    return minDist;
  }

  clearTimers() {
    if (this.removalTimer) { clearTimeout(this.removalTimer); this.removalTimer = null; }
    if (this.warningTimer) { clearTimeout(this.warningTimer); this.warningTimer = null; }
  }

  destroy() {
    this.clearTimers();
    this.tileSprites.forEach(row => row.forEach(s => { if (s) s.destroy(); }));
    this.grid = [];
    this.tileSprites = [];
  }
}
