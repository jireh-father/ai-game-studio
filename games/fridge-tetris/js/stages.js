// Wave generation and difficulty scaling
class WaveGenerator {
  constructor() {
    this.lastThreeItemTypes = [];
  }

  getDifficultyTier(waveNumber) {
    for (const tier of DIFFICULTY_TIERS) {
      if (waveNumber >= tier.waveMin && waveNumber <= tier.waveMax) return tier;
    }
    return DIFFICULTY_TIERS[DIFFICULTY_TIERS.length - 1];
  }

  getWaveTimer(waveNumber) {
    return Math.max(WAVE_TIMER_MIN, WAVE_TIMER_BASE - waveNumber * WAVE_TIMER_DECAY);
  }

  isRestWave(waveNumber) {
    return waveNumber > 1 && waveNumber % 5 === 0;
  }

  isBossWave(waveNumber) {
    return waveNumber > 1 && waveNumber % 10 === 0;
  }

  selectItemTypes(tier, waveNumber, count) {
    const available = Object.values(ITEM_TYPES).filter(t => t.wave <= waveNumber);
    const types = [];
    for (let i = 0; i < count; i++) {
      // Avoid repeating last 3 wave types when possible
      let candidates = available.filter(t => !this.lastThreeItemTypes.slice(-2).includes(t.id));
      if (candidates.length === 0) candidates = available;
      types.push(candidates[Math.floor(Math.random() * candidates.length)]);
    }
    return types;
  }

  generateWave(waveNumber, playerCol, playerRow) {
    if (this.isRestWave(waveNumber)) return this.generateRestWave(waveNumber, playerCol, playerRow);
    if (this.isBossWave(waveNumber)) return this.generateBossWave(waveNumber, playerCol, playerRow);

    const tier = this.getDifficultyTier(waveNumber);
    const [minCount, maxCount] = tier.itemCount;
    let count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
    // Leave player's cell free and at least 3 empty cells total
    count = Math.min(count, GRID_COLS * GRID_ROWS - 4);

    const items = this._generateItems(tier, waveNumber, count, playerCol, playerRow);
    this._updateTypeHistory(items);
    return items;
  }

  generateRestWave(waveNumber, playerCol, playerRow) {
    const tier = this.getDifficultyTier(waveNumber);
    const [minCount] = tier.itemCount;
    const count = Math.max(2, Math.floor(minCount * 0.7));
    return this._generateItems({ ...tier, expiryCount: 0, largeItemPct: 0 }, waveNumber, count, playerCol, playerRow);
  }

  generateBossWave(waveNumber, playerCol, playerRow) {
    const tier = this.getDifficultyTier(waveNumber);
    const [, maxCount] = tier.itemCount;
    const count = Math.min(maxCount + 2, GRID_COLS * GRID_ROWS - 4);
    return this._generateItems(tier, waveNumber, count, playerCol, playerRow);
  }

  _generateItems(tier, waveNumber, count, playerCol, playerRow) {
    const occupied = new Set([`${playerCol},${playerRow}`]);
    const placements = [];
    const types = this.selectItemTypes(tier, waveNumber, count);
    let attempts = 0;
    let i = 0;

    while (i < count && attempts < 200) {
      attempts++;
      const col = Math.floor(Math.random() * GRID_COLS);
      const row = Math.floor(Math.random() * GRID_ROWS);
      const key = `${col},${row}`;
      if (occupied.has(key)) continue;

      const type = types[i % types.length];
      occupied.add(key);
      const isExpiring = tier.expiryCount > 0 && i < tier.expiryCount && Math.random() < 0.5;
      const isHot = type.id === 'hot' && waveNumber >= 11;
      const isFrozen = type.id === 'frozen' && waveNumber >= 11;
      const isHeavy = (type.id === 'watermelon') && waveNumber >= 16;

      placements.push({
        col, row,
        type: type.id,
        typeData: type,
        size: type.size,
        expiryTurns: isExpiring ? (2 + Math.floor(Math.random() * 2)) : 0,
        isHot,
        isFrozen,
        isHeavy,
        isFragile: type.id === 'yogurt',
        isSlippery: false,
      });
      i++;
    }

    // Solvability check: ensure at least col 0 row is reachable
    this._ensureSolvable(placements, playerCol, playerRow);
    return placements;
  }

  _ensureSolvable(placements, playerCol, playerRow) {
    // Simple check: ensure column 0 has at least one empty row
    const col0Items = placements.filter(p => p.col === 0);
    if (col0Items.length < GRID_ROWS) return; // already has space

    // Force clear one spot in column 0
    const toRemove = col0Items[0];
    const idx = placements.indexOf(toRemove);
    if (idx !== -1) placements.splice(idx, 1);
  }

  _updateTypeHistory(placements) {
    const types = [...new Set(placements.map(p => p.type))];
    this.lastThreeItemTypes = [...this.lastThreeItemTypes, ...types].slice(-9);
  }
}
