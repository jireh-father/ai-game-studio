// Stage data and generation

function seededRandom(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function randInt(min, max, seed) {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

// Hand-authored stages 1-10 (representative set, rest procedural)
const HAND_AUTHORED_STAGES = [
  // Stage 1: Tutorial - fire and water, draw fire first
  {
    id: 1,
    elements: [
      { id: 'e1', type: 'fire',  x: 120, y: 200, isTarget: true },
      { id: 'e2', type: 'water', x: 240, y: 300, isTarget: true },
      { id: 'e3', type: 'fire',  x: 180, y: 420, isTarget: false },
      { id: 'e4', type: 'water', x: 280, y: 180, isTarget: false },
    ],
    requiredTargetIds: ['e1', 'e2'],
    hint: { startX: 80, startY: 160 },
    isRest: false,
  },
  // Stage 2
  {
    id: 2,
    elements: [
      { id: 'e1', type: 'fire',  x: 100, y: 220, isTarget: true },
      { id: 'e2', type: 'water', x: 260, y: 280, isTarget: true },
      { id: 'e3', type: 'fire',  x: 200, y: 400, isTarget: true },
      { id: 'e4', type: 'water', x: 150, y: 350, isTarget: false },
      { id: 'e5', type: 'fire',  x: 300, y: 200, isTarget: false },
    ],
    requiredTargetIds: ['e1', 'e2', 'e3'],
    isRest: false,
  },
  // Stage 3
  {
    id: 3,
    elements: [
      { id: 'e1', type: 'fire',  x: 90,  y: 180, isTarget: true },
      { id: 'e2', type: 'fire',  x: 270, y: 200, isTarget: true },
      { id: 'e3', type: 'water', x: 180, y: 320, isTarget: true },
      { id: 'e4', type: 'water', x: 300, y: 380, isTarget: false },
      { id: 'e5', type: 'fire',  x: 120, y: 450, isTarget: false },
    ],
    requiredTargetIds: ['e1', 'e2', 'e3'],
    isRest: false,
  },
  // Stage 4
  {
    id: 4,
    elements: [
      { id: 'e1', type: 'fire',  x: 80,  y: 200, isTarget: true },
      { id: 'e2', type: 'water', x: 180, y: 250, isTarget: true },
      { id: 'e3', type: 'fire',  x: 280, y: 180, isTarget: true },
      { id: 'e4', type: 'water', x: 240, y: 380, isTarget: true },
      { id: 'e5', type: 'fire',  x: 130, y: 380, isTarget: false },
      { id: 'e6', type: 'water', x: 310, y: 300, isTarget: false },
    ],
    requiredTargetIds: ['e1', 'e2', 'e3', 'e4'],
    isRest: false,
  },
  // Stage 5: Rest stage - obvious solution
  {
    id: 5,
    elements: [
      { id: 'e1', type: 'fire',  x: 100, y: 220, isTarget: true },
      { id: 'e2', type: 'fire',  x: 200, y: 300, isTarget: true },
      { id: 'e3', type: 'fire',  x: 280, y: 220, isTarget: true },
    ],
    requiredTargetIds: ['e1', 'e2', 'e3'],
    isRest: true,
  },
  // Stage 6: Ice introduced
  {
    id: 6,
    elements: [
      { id: 'e1', type: 'fire',  x: 100, y: 200, isTarget: true },
      { id: 'e2', type: 'water', x: 250, y: 230, isTarget: true },
      { id: 'e3', type: 'ice',   x: 170, y: 380, isTarget: true },
      { id: 'e4', type: 'fire',  x: 300, y: 350, isTarget: false },
      { id: 'e5', type: 'water', x: 80,  y: 420, isTarget: false },
      { id: 'e6', type: 'ice',   x: 220, y: 160, isTarget: false },
    ],
    requiredTargetIds: ['e1', 'e2', 'e3'],
    isRest: false,
  },
  // Stage 7
  {
    id: 7,
    elements: [
      { id: 'e1', type: 'fire',  x: 90,  y: 180, isTarget: true },
      { id: 'e2', type: 'ice',   x: 200, y: 220, isTarget: true },
      { id: 'e3', type: 'water', x: 290, y: 280, isTarget: true },
      { id: 'e4', type: 'fire',  x: 150, y: 380, isTarget: true },
      { id: 'e5', type: 'ice',   x: 270, y: 420, isTarget: false },
      { id: 'e6', type: 'water', x: 100, y: 340, isTarget: false },
      { id: 'e7', type: 'fire',  x: 320, y: 160, isTarget: false },
    ],
    requiredTargetIds: ['e1', 'e2', 'e3', 'e4'],
    isRest: false,
  },
  // Stage 8
  {
    id: 8,
    elements: [
      { id: 'e1', type: 'fire',  x: 80,  y: 200, isTarget: true },
      { id: 'e2', type: 'water', x: 160, y: 260, isTarget: true },
      { id: 'e3', type: 'ice',   x: 250, y: 200, isTarget: true },
      { id: 'e4', type: 'fire',  x: 300, y: 330, isTarget: true },
      { id: 'e5', type: 'water', x: 130, y: 400, isTarget: false },
      { id: 'e6', type: 'ice',   x: 220, y: 380, isTarget: false },
      { id: 'e7', type: 'fire',  x: 320, y: 180, isTarget: false },
      { id: 'e8', type: 'water', x: 70,  y: 340, isTarget: false },
    ],
    requiredTargetIds: ['e1', 'e2', 'e3', 'e4'],
    isRest: false,
  },
  // Stage 9
  {
    id: 9,
    elements: [
      { id: 'e1', type: 'fire',     x: 90,  y: 180, isTarget: true },
      { id: 'e2', type: 'ice',      x: 200, y: 240, isTarget: true },
      { id: 'e3', type: 'water',    x: 290, y: 200, isTarget: true },
      { id: 'e4', type: 'fire',     x: 150, y: 370, isTarget: true },
      { id: 'e5', type: 'water',    x: 260, y: 380, isTarget: true },
      { id: 'e6', type: 'ice',      x: 120, y: 290, isTarget: false },
      { id: 'e7', type: 'fire',     x: 310, y: 310, isTarget: false },
      { id: 'e8', type: 'water',    x: 200, y: 450, isTarget: false },
    ],
    requiredTargetIds: ['e1', 'e2', 'e3', 'e4', 'e5'],
    isRest: false,
  },
  // Stage 10: Rest + Special (Symphony) - all fire, use 3-element combo
  {
    id: 10,
    elements: [
      { id: 'e1', type: 'fire',  x: 120, y: 200, isTarget: true },
      { id: 'e2', type: 'fire',  x: 240, y: 200, isTarget: true },
      { id: 'e3', type: 'fire',  x: 180, y: 320, isTarget: true },
    ],
    requiredTargetIds: ['e1', 'e2', 'e3'],
    isRest: true,
    isSpecial: true,
  },
];

function generateStage(n) {
  const diff = getDifficulty(n);
  let seed = n * 7919;

  const elCount = randInt(diff.elementCount[0], diff.elementCount[1], seed++);
  const targetCount = Math.max(2, Math.floor(elCount * 0.6));

  // Available element types by stage
  const availableTypes = getAvailableTypes(n);

  const elements = [];
  const cols = 6, rows = 8;
  const cellW = 50, cellH = 60;
  const startX = 30, startY = PLAY_AREA_TOP + 30;

  // Place elements on grid with jitter
  const usedCells = new Set();
  for (let i = 0; i < elCount; i++) {
    let col, row, cellKey;
    let attempts = 0;
    do {
      col = randInt(0, cols - 1, seed++);
      row = randInt(0, rows - 1, seed++);
      cellKey = `${col},${row}`;
      attempts++;
    } while (usedCells.has(cellKey) && attempts < 20);
    usedCells.add(cellKey);

    const jx = (seededRandom(seed++) - 0.5) * 30;
    const jy = (seededRandom(seed++) - 0.5) * 30;
    const x = Math.max(40, Math.min(320, startX + col * cellW + jx));
    const y = Math.max(PLAY_AREA_TOP + 20, Math.min(PLAY_AREA_BOTTOM - 20, startY + row * cellH + jy));

    const typeIdx = Math.floor(seededRandom(seed++) * availableTypes.length);
    elements.push({
      id: `e${i + 1}`,
      type: availableTypes[typeIdx],
      x: Math.round(x),
      y: Math.round(y),
      isTarget: i < targetCount,
    });
  }

  const requiredTargetIds = elements.filter(e => e.isTarget).map(e => e.id);
  const isRest = n % REST_STAGE_INTERVAL === 0;
  const isSpecial = n % SPECIAL_STAGE_INTERVAL === 0 && n > 0;

  return { id: n, elements, requiredTargetIds, isRest, isSpecial };
}

function getAvailableTypes(stage) {
  if (stage <= 5)  return ['fire', 'water'];
  if (stage <= 10) return ['fire', 'water', 'ice'];
  if (stage <= 15) return ['fire', 'water', 'ice', 'lightning'];
  if (stage <= 20) return ['fire', 'water', 'ice', 'lightning', 'void'];
  if (stage <= 25) return ['fire', 'water', 'ice', 'lightning', 'void', 'earth'];
  if (stage <= 30) return ['fire', 'water', 'ice', 'lightning', 'void', 'earth', 'wind'];
  return ['fire', 'water', 'ice', 'lightning', 'void', 'earth', 'wind', 'crystal'];
}

function getStage(n) {
  if (n <= HAND_AUTHORED_STAGES.length) {
    return JSON.parse(JSON.stringify(HAND_AUTHORED_STAGES[n - 1]));
  }
  return generateStage(n);
}

function isRestStage(n) {
  return n % REST_STAGE_INTERVAL === 0;
}

function isSpecialStage(n) {
  return n % SPECIAL_STAGE_INTERVAL === 0 && n > 0;
}
