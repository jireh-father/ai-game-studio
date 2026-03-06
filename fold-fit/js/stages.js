// Fold Fit - Stage Generation

class SeededRandom {
  constructor(seed) { this.seed = seed; }
  next() {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  range(min, max) { return min + Math.floor(this.next() * (max - min + 1)); }
  pick(arr) { return arr[this.range(0, arr.length - 1)]; }
}

// Base shape templates (normalized 0-1 coords, scaled at render)
const SHAPE_TEMPLATES = [
  // Rectangle
  [{x:0,y:0},{x:1,y:0},{x:1,y:0.7},{x:0,y:0.7}],
  // Tall rectangle
  [{x:0.1,y:0},{x:0.9,y:0},{x:0.9,y:1},{x:0.1,y:1}],
  // L-shape
  [{x:0,y:0},{x:0.6,y:0},{x:0.6,y:0.4},{x:1,y:0.4},{x:1,y:1},{x:0,y:1}],
  // T-shape
  [{x:0,y:0},{x:1,y:0},{x:1,y:0.35},{x:0.65,y:0.35},{x:0.65,y:1},{x:0.35,y:1},{x:0.35,y:0.35},{x:0,y:0.35}],
  // Wide rectangle
  [{x:0,y:0.15},{x:1,y:0.15},{x:1,y:0.85},{x:0,y:0.85}],
  // Pentagon-ish
  [{x:0.5,y:0},{x:1,y:0.35},{x:0.85,y:0.9},{x:0.15,y:0.9},{x:0,y:0.35}],
  // Cross
  [{x:0.3,y:0},{x:0.7,y:0},{x:0.7,y:0.3},{x:1,y:0.3},{x:1,y:0.7},{x:0.7,y:0.7},{x:0.7,y:1},{x:0.3,y:1},{x:0.3,y:0.7},{x:0,y:0.7},{x:0,y:0.3},{x:0.3,y:0.3}]
];

function generateShape(rng, stageNum) {
  const complexity = Math.min(stageNum, SHAPE_TEMPLATES.length - 1);
  const idx = rng.range(0, Math.min(complexity, SHAPE_TEMPLATES.length - 1));
  const template = SHAPE_TEMPLATES[idx];
  const size = 220 + rng.range(0, 40);
  const verts = template.map(v => ({
    x: v.x * size + rng.range(-4, 4),
    y: v.y * size + rng.range(-4, 4)
  }));
  return { vertices: verts, width: size, height: size };
}

function placeFoldLine(shape, rng, existingLines, isHorizontal) {
  const verts = shape.vertices;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  verts.forEach(v => { minX = Math.min(minX,v.x); maxX = Math.max(maxX,v.x); minY = Math.min(minY,v.y); maxY = Math.max(maxY,v.y); });
  const margin = 0.2;
  if (isHorizontal) {
    const y = minY + (maxY - minY) * (margin + rng.next() * (1 - 2 * margin));
    return { x1: minX - 10, y1: y, x2: maxX + 10, y2: y, horizontal: true };
  } else {
    const x = minX + (maxX - minX) * (margin + rng.next() * (1 - 2 * margin));
    return { x1: x, y1: minY - 10, x2: x, y2: maxY + 10, horizontal: false };
  }
}

function generateFoldLines(shape, count, rng) {
  const lines = [];
  for (let i = 0; i < count; i++) {
    const isH = i % 2 === 0;
    const line = placeFoldLine(shape, rng, lines, isH);
    line.type = 'valid';
    line.order = i;
    lines.push(line);
  }
  return lines;
}

function generateDistractors(shape, validLines, count, rng) {
  const lines = [];
  for (let i = 0; i < count; i++) {
    const isH = rng.next() > 0.5;
    const line = placeFoldLine(shape, rng, [...validLines, ...lines], isH);
    line.type = 'distractor';
    line.order = -1;
    lines.push(line);
  }
  return lines;
}

function generateTearLines(shape, validLines, count, rng) {
  const lines = [];
  for (let i = 0; i < count; i++) {
    const isH = rng.next() > 0.5;
    const line = placeFoldLine(shape, rng, [...validLines, ...lines], isH);
    line.type = 'tear';
    line.order = -1;
    lines.push(line);
  }
  return lines;
}

function computeTarget(shape, foldLines) {
  // Simplified: fold reduces bounding box along each valid fold axis
  const verts = shape.vertices.map(v => ({...v}));
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  verts.forEach(v => { minX = Math.min(minX,v.x); maxX = Math.max(maxX,v.x); minY = Math.min(minY,v.y); maxY = Math.max(maxY,v.y); });

  const validLines = foldLines.filter(l => l.type === 'valid').sort((a,b) => a.order - b.order);
  let bounds = { minX, maxX, minY, maxY };

  validLines.forEach(line => {
    if (line.horizontal) {
      const mid = line.y1;
      const top = mid - bounds.minY;
      const bot = bounds.maxY - mid;
      if (top < bot) {
        bounds.maxY = mid + Math.min(top, bot);
        bounds.minY = mid;
      } else {
        bounds.minY = mid - Math.min(top, bot);
        bounds.maxY = mid;
      }
    } else {
      const mid = line.x1;
      const left = mid - bounds.minX;
      const right = bounds.maxX - mid;
      if (left < right) {
        bounds.maxX = mid + Math.min(left, right);
        bounds.minX = mid;
      } else {
        bounds.minX = mid - Math.min(left, right);
        bounds.maxX = mid;
      }
    }
  });

  return [
    {x: bounds.minX, y: bounds.minY},
    {x: bounds.maxX, y: bounds.minY},
    {x: bounds.maxX, y: bounds.maxY},
    {x: bounds.minX, y: bounds.maxY}
  ];
}

function generateStage(stageNumber) {
  const seed = stageNumber * 7919 + 31337;
  const rng = new SeededRandom(seed);
  const diff = getDifficulty(stageNumber);
  const rest = isRestStage(stageNumber);
  const foldCount = rest ? Math.max(1, diff.folds - 1) : diff.folds;
  const distractorCount = rest ? 0 : diff.distractors;
  const tearCount = rest ? 0 : diff.tears;
  const timer = rest ? diff.timer + 4 : diff.timer;

  const shape = generateShape(rng, stageNumber);
  const validLines = generateFoldLines(shape, foldCount, rng);
  const distractors = generateDistractors(shape, validLines, distractorCount, rng);
  const tearLines = generateTearLines(shape, validLines, tearCount, rng);
  const allLines = [...validLines, ...distractors, ...tearLines];
  // Shuffle lines so player can't assume order
  for (let i = allLines.length - 1; i > 0; i--) {
    const j = rng.range(0, i);
    [allLines[i], allLines[j]] = [allLines[j], allLines[i]];
  }

  const target = computeTarget(shape, validLines);

  return {
    shape, foldLines: allLines, validLines, target, timer,
    orderMatters: diff.orderMatters, undoAvailable: diff.undo,
    isRest: rest, stageNumber, totalValidFolds: foldCount
  };
}
