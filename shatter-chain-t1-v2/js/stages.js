// Shatter Chain - Stage Generation

function getDifficultyParams(wave) {
  const w = Math.min(wave, 36);
  const isRest = wave % 5 === 0 && wave > 0;
  const isBoss = wave % 10 === 0 && wave > 0;

  let panelCount, balls, timer, reinforcedRatio, armoredRatio, barrierCount, gapMin, moving;

  if (w <= 3) {
    panelCount = 6 + Math.floor(w * 0.7);
    balls = 3; timer = CFG.TIMER_DEFAULT; reinforcedRatio = 0; armoredRatio = 0;
    barrierCount = 0; gapMin = 60; moving = false;
  } else if (w <= 7) {
    panelCount = 10 + Math.floor((w - 4) * 1.2);
    balls = 3; timer = CFG.TIMER_DEFAULT; reinforcedRatio = 0; armoredRatio = 0;
    barrierCount = 0; gapMin = 40; moving = false;
  } else if (w <= 12) {
    panelCount = 12 + Math.floor((w - 8) * 1.5);
    balls = 3; timer = CFG.TIMER_DEFAULT; reinforcedRatio = 0.3; armoredRatio = 0;
    barrierCount = 0; gapMin = 30; moving = false;
  } else if (w <= 20) {
    panelCount = 14 + Math.floor((w - 13) * 0.8);
    balls = 2; timer = CFG.TIMER_DEFAULT; reinforcedRatio = 0.4; armoredRatio = 0;
    barrierCount = 0; gapMin = 20; moving = true;
  } else if (w <= 35) {
    panelCount = 16 + Math.floor((w - 21) * 0.6);
    balls = 2; timer = CFG.TIMER_DEFAULT; reinforcedRatio = 0.5; armoredRatio = 0.2;
    barrierCount = 1 + Math.floor((w - 21) / 5);
    gapMin = 12; moving = true;
  } else {
    panelCount = 20 + Math.floor(Math.random() * 5);
    balls = 2; timer = CFG.TIMER_LATE; reinforcedRatio = 0.6; armoredRatio = 0.3;
    barrierCount = 2 + Math.floor(Math.random() * 3);
    gapMin = 8; moving = true;
  }

  panelCount = Math.min(panelCount, 24);
  barrierCount = Math.min(barrierCount, 4);

  if (isRest) { balls += 2; timer = 20000; panelCount = Math.max(6, panelCount - 4); }
  if (isBoss) { panelCount = Math.min(panelCount + 4, 24); }

  // Wave 12 warning: "LAST WAVE WITH 3 BALLS!"
  if (wave === 12) balls = 3;

  return { panelCount, balls, timer, reinforcedRatio, armoredRatio, barrierCount, gapMin, moving, isRest, isBoss };
}

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateWave(waveNumber, sessionSeed) {
  const seed = waveNumber * 7919 + (sessionSeed || 12345);
  const rng = seededRandom(seed);
  const diff = getDifficultyParams(waveNumber);
  const patternIndex = waveNumber % 6;

  const arenaW = CFG.WIDTH - 40;
  const arenaH = CFG.ARENA_HEIGHT - 40;
  const startX = 20;
  const startY = CFG.ARENA_TOP + 20;

  let panels = [];

  // Generate panel positions based on pattern
  switch (patternIndex) {
    case 0: panels = patternRows(diff, rng, startX, startY, arenaW, arenaH); break;
    case 1: panels = patternGrid(diff, rng, startX, startY, arenaW, arenaH); break;
    case 2: panels = patternDiamond(diff, rng, startX, startY, arenaW, arenaH); break;
    case 3: panels = patternPyramid(diff, rng, startX, startY, arenaW, arenaH); break;
    case 4: panels = patternScattered(diff, rng, startX, startY, arenaW, arenaH); break;
    case 5: panels = patternDense(diff, rng, startX, startY, arenaW, arenaH); break;
  }

  // Assign glass types
  panels.forEach(p => {
    const r = rng();
    if (r < diff.armoredRatio) { p.type = 'armored'; p.hp = 3; p.w = 48; p.h = 38; }
    else if (r < diff.armoredRatio + diff.reinforcedRatio) { p.type = 'reinforced'; p.hp = 2; p.w = 44; p.h = 34; }
    else { p.type = 'normal'; p.hp = 1; p.w = 40; p.h = 30; }
  });

  // Generate barriers
  let barriers = [];
  for (let i = 0; i < diff.barrierCount; i++) {
    barriers.push({
      x: startX + rng() * (arenaW - 120),
      y: startY + 60 + rng() * (arenaH - 120),
      w: 80 + rng() * 40,
      h: 12,
      angle: rng() * Math.PI,
      rotSpeed: (0.5 + rng() * 1.5) * (rng() > 0.5 ? 1 : -1),
    });
  }

  // Moving panel properties
  if (diff.moving) {
    panels.forEach(p => {
      if (rng() > 0.5) {
        p.moving = true;
        p.moveSpeed = 0.3 + rng() * 0.5;
        p.moveAmp = 20 + rng() * 30;
        p.baseX = p.x;
      }
    });
  }

  // Golden Panel Roulette: pick one random panel as golden
  const goldenIndex = Math.floor(rng() * panels.length);

  return { panels, barriers, diff, goldenIndex };
}

function patternRows(diff, rng, sx, sy, aw, ah) {
  const panels = [];
  const count = diff.panelCount;
  const cols = Math.min(count, 5);
  const rows = Math.ceil(count / cols);
  const gapX = aw / (cols + 1);
  const gapY = Math.min(ah / (rows + 1), 60);

  for (let r = 0; r < rows && panels.length < count; r++) {
    const rowCols = Math.min(cols, count - panels.length);
    const rowStartX = sx + (aw - (rowCols - 1) * gapX) / 2;
    for (let c = 0; c < rowCols; c++) {
      panels.push({ x: rowStartX + c * gapX, y: sy + (r + 1) * gapY });
    }
  }
  return panels;
}

function patternGrid(diff, rng, sx, sy, aw, ah) {
  const panels = [];
  const count = diff.panelCount;
  const cols = Math.ceil(Math.sqrt(count * 1.5));
  const rows = Math.ceil(count / cols);
  const gapX = aw / (cols + 1);
  const gapY = Math.min(ah / (rows + 1), 55);

  for (let r = 0; r < rows && panels.length < count; r++) {
    for (let c = 0; c < cols && panels.length < count; c++) {
      panels.push({ x: sx + (c + 1) * gapX, y: sy + (r + 1) * gapY });
    }
  }
  return panels;
}

function patternDiamond(diff, rng, sx, sy, aw, ah) {
  const panels = [];
  const count = diff.panelCount;
  const centerX = sx + aw / 2;
  const centerY = sy + ah * 0.4;
  const layers = Math.ceil(Math.sqrt(count));

  for (let layer = 0; layer < layers && panels.length < count; layer++) {
    const n = layer === 0 ? 1 : layer * 4;
    for (let i = 0; i < n && panels.length < count; i++) {
      const angle = (i / n) * Math.PI * 2;
      const r = 30 + layer * 45;
      panels.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r * 0.7 });
    }
  }
  return panels;
}

function patternPyramid(diff, rng, sx, sy, aw, ah) {
  const panels = [];
  const count = diff.panelCount;
  let row = 0;
  let perRow = 1;

  while (panels.length < count) {
    const gapX = aw / (perRow + 1);
    const rowY = sy + 30 + row * 50;
    if (rowY > sy + ah - 20) break;
    const rowStart = sx + (aw - (perRow - 1) * gapX) / 2;
    for (let c = 0; c < perRow && panels.length < count; c++) {
      panels.push({ x: rowStart + c * gapX, y: rowY });
    }
    row++;
    perRow++;
  }
  return panels;
}

function patternScattered(diff, rng, sx, sy, aw, ah) {
  const panels = [];
  const count = diff.panelCount;
  for (let i = 0; i < count * 3 && panels.length < count; i++) {
    const x = sx + 30 + rng() * (aw - 60);
    const y = sy + 20 + rng() * (ah - 60);
    let tooClose = false;
    for (const p of panels) {
      if (Math.abs(p.x - x) < diff.gapMin && Math.abs(p.y - y) < diff.gapMin) { tooClose = true; break; }
    }
    if (!tooClose) panels.push({ x, y });
  }
  return panels;
}

function patternDense(diff, rng, sx, sy, aw, ah) {
  const panels = [];
  const count = diff.panelCount;
  const cols = Math.ceil(Math.sqrt(count * 1.2));
  const rows = Math.ceil(count / cols);
  const gapX = aw / (cols + 1);
  const gapY = Math.min(ah / (rows + 1), 45);

  for (let r = 0; r < rows && panels.length < count; r++) {
    const offset = r % 2 === 0 ? 0 : gapX * 0.5;
    for (let c = 0; c < cols && panels.length < count; c++) {
      panels.push({
        x: sx + (c + 1) * gapX + offset,
        y: sy + (r + 1) * gapY + (rng() - 0.5) * 10
      });
    }
  }
  return panels;
}
