// stages.js — Stage generation, difficulty scaling, row spawning

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function fisherYatesShuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getColorPriority(stageNumber) {
  const allColors = ['red', 'blue', 'yellow'];
  const count = getColorCount(stageNumber);

  if (count === 1) return ['gray'];

  if (stageNumber >= 51) {
    const seed = stageNumber * 7919 + (Date.now ? Date.now() % 1000 : 0);
    const rng = seededRandom(seed);
    return fisherYatesShuffle(allColors, rng);
  }

  return allColors.slice(0, count);
}

function getStageConfig(stageNumber) {
  const rest = isRestStage(stageNumber);
  let speed = getScrollSpeed(stageNumber);
  if (rest) speed = Math.max(speed - 20, 60);

  return {
    scrollSpeed: speed,
    rowCount: getRowCount(stageNumber),
    colorPriority: getColorPriority(stageNumber),
    spawnDelay: getSpawnDelay(stageNumber),
    bonusChance: getBonusChance(stageNumber),
    blinkChance: getBlinkChance(stageNumber),
    isRestStage: rest,
    doubleRow: isDoubleRowSpawn(stageNumber)
  };
}

function generateRow(stageNumber, rowIndex) {
  const config = getStageConfig(stageNumber);
  const priority = config.colorPriority;
  const seed = stageNumber * 7919 + rowIndex * 131 + (Date.now ? Date.now() % 100000 : 0);
  const rng = seededRandom(seed);
  const row = [];

  if (priority.length === 1) {
    // Single color stage
    for (let i = 0; i < BUBBLES_PER_ROW; i++) {
      let isBonus = config.bonusChance > 0 && rng() < config.bonusChance;
      let isBlink = !isBonus && config.blinkChance > 0 && rng() < config.blinkChance;
      row.push({
        color: isBonus ? 'silver' : priority[0],
        isBonus: isBonus,
        isBlink: isBlink,
        col: i,
        popped: false
      });
    }
  } else {
    // Multi-color: distribute 2-3 cells per color
    const colorCells = [];
    const counts = priority.length === 2 ? [4, 3] : [2, 2, 3];
    const shuffledCounts = fisherYatesShuffle(counts, rng);

    for (let c = 0; c < priority.length; c++) {
      for (let n = 0; n < shuffledCounts[c]; n++) {
        colorCells.push(priority[c]);
      }
    }

    const shuffled = fisherYatesShuffle(colorCells, rng);

    // Guarantee at least 1 highest-priority color
    const highPriority = priority[0];
    if (!shuffled.includes(highPriority)) {
      shuffled[0] = highPriority;
    }

    for (let i = 0; i < BUBBLES_PER_ROW; i++) {
      let color = shuffled[i] || priority[0];
      let isBonus = config.bonusChance > 0 && rng() < config.bonusChance;
      let isBlink = !isBonus && config.blinkChance > 0 && rng() < config.blinkChance;

      if (isBonus) color = 'silver';

      row.push({
        color: color,
        isBonus: isBonus,
        isBlink: isBlink,
        col: i,
        popped: false
      });
    }
  }

  return row;
}

// Check if a color can be tapped given priority and remaining unpopped bubbles in row
function canTapColor(color, priority, rowBubbles) {
  if (color === 'silver') return true; // Silver always tappable

  const colorIdx = priority.indexOf(color);
  if (colorIdx === -1) return true; // Not in priority list, allow

  // Check if all higher-priority colors are already popped
  for (let i = 0; i < colorIdx; i++) {
    const higherColor = priority[i];
    const hasUnpopped = rowBubbles.some(b => b.color === higherColor && !b.popped && !b.isBonus);
    if (hasUnpopped) return false;
  }
  return true;
}
